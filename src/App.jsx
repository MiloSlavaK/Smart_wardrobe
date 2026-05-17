// src/App.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { TaskList } from './pages/TaskList';
import { useClosetItems } from './hooks/useClosetItems';
import { useAssistant, ASSISTANT_IGNORED_WORDS } from './hooks/useAssistant';
import { useSpeech } from './hooks/useSpeech';
import { useSuccessMessage } from './hooks/useSpeech';
import './App.css';

// Демо-элемент для первого запуска
const DEMO_ITEM = {
  id: 'demo-1',
  name: 'Футболка',
  category: 'верх',
  instruction: 'Сложите пополам вдоль, затем ещё раз пополам',
  washing: '30°C, деликатный режим. Сушить в расправленном виде.',
  nextReminder: '',
  completed: false,
};

// Генератор уникальных ID
const generateId = () => `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// Дефолтные инструкции по категориям
const getDefaultInstruction = (category) => {
  const instructions = {
    верх: 'Сложите пополам вдоль, затем ещё раз пополам',
    низ: 'Сложите по швам, избегая заломов',
    платье: 'Повесьте на плечики или сложите втрое',
    бельё: 'Аккуратно сверните в рулон',
    другое: 'Сложите аккуратно по швам',
  };
  return instructions[category] || instructions['другое'];
};

// Дефолтные советы по стирке
const getDefaultWashing = (category) => {
  const washing = {
    верх: '30°C, деликатный режим. Сушить в расправленном виде.',
    низ: '40°C, можно отжим. Сушить на верёвке.',
    платье: 'Химчистка или 30°C без отжима.',
    бельё: '30°C, без кондиционера. Сушить горизонтально.',
    другое: 'Следуйте инструкции на ярлычке.',
  };
  return washing[category] || washing['другое'];
};

export const App = () => {
  // 🔹 Инициализация хука вещей с демо-данными
  const {
    items,
    stats,
    addItem,
    toggleItemCompleted,
    deleteItem,
    updateReminder,
    updateItem,
    findItems,
    getRecoveryState: getClosetRecoveryState,
  } = useClosetItems([DEMO_ITEM]);

  const assistantRef = useRef(null);

  // 🔹 Контекст для обработчика (стабильная ссылка через ref)
  const smartAppContext = useRef({
    items,
    addItem,
    toggleItemCompleted,
    deleteItem,
    updateReminder,
    updateItem,
    findItems,
    stats,
  });

  // Обновляем контекст при изменении зависимостей
  useEffect(() => {
    smartAppContext.current = {
      items,
      addItem,
      toggleItemCompleted,
      deleteItem,
      updateReminder,
      updateItem,
      findItems,
      stats,
    };
  }, [items, stats, addItem, toggleItemCompleted, deleteItem, updateReminder, updateItem, findItems]);

  // 🔹 Обработчик действий от ассистента
  const handleAssistantAction = useCallback((action) => {
    const type = action.type || action.action_id;
    const params = action.parameters || action;
    const ctx = smartAppContext.current;

    console.log('📥 Action received:', type, params);

    switch (type) {
      case 'add_clothing':
      case 'add_item': {
        const newItem = ctx.addItem({
          id: params.id || generateId(),
          name: params.name || params.text || params.value || 'Новая вещь',
          category: params.category || 'другое',
          instruction: params.instruction || getDefaultInstruction(params.category),
          washing: params.washing || getDefaultWashing(params.category),
          nextReminder: params.nextReminder || params.reminder || '',
          completed: false,
        });
        // 🔊 Озвучиваем подтверждение через ассистента
        if (newItem && speak) {
          speak(`Добавила ${newItem.name} в категорию ${newItem.category}`, { emotion: 'positive' });
        }
        break;
      }

      case 'done_clothing':
      case 'mark_done':
      case 'folded': {
        const id = params.id || params.item_id;
        if (id) {
          ctx.toggleItemCompleted(id);
          const item = ctx.items.find(i => i.id === id);
          if (item && speak) {
            speak(`Отлично! ${item.name} убрана.`, { emotion: 'positive' });
          }
        }
        break;
      }

      case 'done_by_number': {
        const num = params.number;
        if (num && ctx.items[num - 1]) {
          ctx.toggleItemCompleted(ctx.items[num - 1].id);
          if (speak) {
            speak(`Готово! Вещь номер ${num} убрана.`, { emotion: 'positive' });
          }
        }
        break;
      }

      case 'delete_clothing':
      case 'remove_item': {
        const id = params.id || params.item_id;
        if (id) {
          const item = ctx.items.find(i => i.id === id);
          ctx.deleteItem(id);
          if (item && speak) {
            speak(`Удалила ${item.name}.`, { emotion: 'neutral' });
          }
        }
        break;
      }

      case 'delete_by_number': {
        const num = params.number;
        if (num && ctx.items[num - 1]) {
          const item = ctx.items[num - 1];
          ctx.deleteItem(item.id);
          if (speak) {
            speak(`Удалила вещь номер ${num}.`, { emotion: 'neutral' });
          }
        }
        break;
      }

      case 'set_reminder':
      case 'remind_me': {
        const id = params.id || params.item_id;
        const date = params.date || params.reminder_date;
        if (id && date) {
          ctx.updateReminder(id, date);
          const item = ctx.items.find(i => i.id === id);
          if (item && speak) {
            speak(`Напомню про ${item.name}: ${date}.`, { emotion: 'helpful' });
          }
        }
        break;
      }

      // 🔥 Озвучивание инструкций — теперь через useSpeech
      case 'speak_instruction':
      case 'ask_folding':
      case 'how_to_fold': {
        const id = params.id || params.item_id;
        const name = params.name;
        let item = null;
        if (id) item = ctx.items.find(i => i.id === id);
        else if (name) item = ctx.items.find(i => i.name.toLowerCase().includes(name.toLowerCase()));
        else if (params.number) item = ctx.items[params.number - 1];

        if (item) {
          handleSpeakInstruction(item); // 🔊 Только через ассистента!
        }
        break;
      }

      case 'speak_washing':
      case 'ask_washing':
      case 'how_to_wash': {
        const id = params.id || params.item_id;
        const name = params.name;
        let item = null;
        if (id) item = ctx.items.find(i => i.id === id);
        else if (name) item = ctx.items.find(i => i.name.toLowerCase().includes(name.toLowerCase()));
        else if (params.number) item = ctx.items[params.number - 1];

        if (item) {
          handleSpeakWashing(item); // 🔊 Только через ассистента!
        }
        break;
      }

      case 'list_closet':
      case 'show_items': {
        if (!ctx.items || ctx.items.length === 0) {
          if (speak) speak('Ваш шкаф пока пуст. Добавьте первую вещь!', { emotion: 'helpful' });
        } else {
          const list = ctx.items.map((item, i) =>
            `${i + 1}. ${item.name} (${item.category})${item.completed ? ' ✓' : ''}`
          ).join('; ');
          if (speak) speak(`В шкафу: ${list}`, { emotion: 'neutral' });
        }
        break;
      }

      case 'find_item': {
        const name = params.name || params.query;
        if (name) {
          const found = ctx.items.find(i =>
            i.name.toLowerCase().includes(name.toLowerCase())
          );
          if (found) {
            if (speak) speak(`Нашла: ${found.name} — ${found.category}`, { emotion: 'friendly' });
          } else {
            if (speak) speak(`Не нашла "${name}" в вашем шкафу.`, { emotion: 'concerned' });
          }
        }
        break;
      }

      case 'clear_completed': {
        ctx.items.filter(i => i.completed).forEach(i => ctx.deleteItem(i.id));
        if (speak) speak('Выполненные вещи удалены.', { emotion: 'positive' });
        break;
      }

      default:
        console.warn('⚠️ Unknown action type:', type, action);
    }
  }, []);

  // 🔹 Функция getState для ассистента (item_selector + контекст)
  const getStateForAssistant = useCallback(() => ({
    item_selector: {
      items: items.map(({ id, name, category, completed }, index) => ({
        number: index + 1,
        id,
        title: name,
        subtitle: category,
        completed,
      })),
      ignored_words: ASSISTANT_IGNORED_WORDS,
    },
    closet_context: {
      total_items: items.length,
      completed_count: items.filter(i => i.completed).length,
      pending_count: items.filter(i => !i.completed).length,
      categories: [...new Set(items.map(i => i.category))],
      last_updated: Date.now(),
    },
  }), [items]);

  // 🔹 Функция getRecoveryState для восстановления сессии
  const getRecoveryState = useCallback(() => {
    const closetState = getClosetRecoveryState?.() || {};
    return {
      ...closetState,
      app_version: '1.0.0',
      last_session: Date.now(),
    };
  }, [getClosetRecoveryState]);

  // 🔹 Инициализация ассистента с recovery state
  const {
    assistant,
    updateState,
    updateRecoveryState,
    sendActionValue,
    sendSmartAppResponse,
    cancelTts,
  } = useAssistant(handleAssistantAction, smartAppContext.current, getRecoveryState);

  // Сохраняем ссылку на assistant для прямого доступа и отладки
  useEffect(() => {
    if (assistant) {
      assistantRef.current = assistant;
      if (process.env.NODE_ENV === 'development') {
        window.assistant = assistant;
      }
    }
    return () => {
      if (window.assistant === assistant) {
        delete window.assistant;
      }
      // 🔹 Останавливаем озвучку при размонтировании
      cancelTts?.();
    };
  }, [assistant, cancelTts]);

  // 🔹 Обновляем getState в ассистенте при изменении списка
  useEffect(() => {
    if (updateState && typeof updateState === 'function') {
      updateState(getStateForAssistant);
    }
  }, [items, updateState, getStateForAssistant]);

  // 🔹 Обновляем recovery state при изменении
  useEffect(() => {
    if (updateRecoveryState && typeof updateRecoveryState === 'function') {
      updateRecoveryState(getRecoveryState);
    }
  }, [getRecoveryState, updateRecoveryState]);

  // 🔹 Инициализация хука озвучки — ВАЖНО: передаём sendSmartAppResponse
  const {
    handleSpeakInstruction,
    handleSpeakWashing,
    handleSpeakSuccess,
    handleSpeakError,
    speak,
  } = useSpeech(sendSmartAppResponse);

  // 🔹 Хук для сообщений об успехе
  const { playSuccessMessage } = useSuccessMessage(sendActionValue);

  // 🔹 Обработчики для UI-компонентов
  const handleAdd = useCallback((itemData) => {
    const newItem = {
      id: generateId(),
      name: itemData.name || 'Новая вещь',
      category: itemData.category || 'другое',
      instruction: itemData.instruction || getDefaultInstruction(itemData.category),
      washing: itemData.washing || getDefaultWashing(itemData.category),
      nextReminder: itemData.nextReminder || '',
      completed: false,
    };
    const added = addItem(newItem);

    // 🔊 Озвучиваем через ассистента
    if (added && speak) {
      speak(`Добавила ${added.name}`, { emotion: 'positive' });
    }

    // 📤 Синхронизируем с бэкендом
    if (sendActionValue && added) {
      sendActionValue('add_clothing', {
        id: added.id,
        name: added.name,
        category: added.category,
      });
    }
    return added;
  }, [addItem, sendActionValue, speak]);

  const handleDone = useCallback((item) => {
    toggleItemCompleted(item.id);

    // 🔊 Озвучиваем успех через ассистента (не браузерный TTS!)
    playSuccessMessage(item.id, items);

    // 📤 Синхронизируем с бэкендом
    if (sendActionValue) {
      sendActionValue('done_clothing', { id: item.id });
    }
  }, [items, toggleItemCompleted, playSuccessMessage, sendActionValue]);

  const handleDelete = useCallback((item) => {
    deleteItem(item.id);

    if (sendActionValue) {
      sendActionValue('delete_clothing', { id: item.id });
    }
  }, [deleteItem, sendActionValue]);

  const handleUpdateReminder = useCallback((id, date) => {
    updateReminder(id, date);

    if (sendActionValue) {
      sendActionValue('set_reminder', { id, date });
    }
  }, [updateReminder, sendActionValue]);

  const handleItemClick = useCallback((item) => {
    // Отправляем событие выбора для контекста диалога
    if (sendActionValue) {
      sendActionValue('item_selected', { id: item.id, name: item.name });
    }
  }, [sendActionValue]);

  // 🔹 Обработчик изменения темы (светлая/тёмная)
  useEffect(() => {
    if (!assistant) return;

    const handleThemeChange = (event) => {
      if (event.type === 'theme' && event.theme?.name) {
        document.documentElement.setAttribute('data-theme', event.theme.name);
      }
    };

    assistant.on('data', handleThemeChange);
    return () => {
      // Отписка не требуется, т.к. assistant пересоздаётся редко
    };
  }, [assistant]);

  // 🔹 Обработчик видимости — останавливаем озвучку при сворачивании
  useEffect(() => {
    if (!assistant) return;

    const handleVisibility = (event) => {
      if (event.type === 'visibility' && event.visibility === 'hidden') {
        cancelTts?.(); // 🔥 Критически важно: остановить озвучку ассистента
      }
    };

    assistant.on('data', handleVisibility);
    return () => {};
  }, [assistant, cancelTts]);

  return (
    <TaskList
      items={items}
      stats={stats}
      onAdd={handleAdd}
      onDone={handleDone}
      onDelete={handleDelete}
      onUpdateReminder={handleUpdateReminder}
      onItemClick={handleItemClick}
      onAskFolding={handleSpeakInstruction}  // 🔹 Кнопка "Как сложить?"
      onAskWashing={handleSpeakWashing}      // 🔹 Кнопка "Совет по стирке"
      assistantReady={!!assistant}
      assistantStatus={assistant ? 'connected' : 'initializing'}
    />
  );
};

export default App;