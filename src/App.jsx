// src/App.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { TaskList } from './pages/TaskList';
import { useClosetItems } from './hooks/useClosetItems';
import { useAssistant, ASSISTANT_IGNORED_WORDS } from './hooks/useAssistant';
import { useSpeech, useSuccessMessage } from './hooks/useSpeech';
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

// 🔥 ГЛАВНЫЙ КОМПОНЕНТ — все хуки ВНУТРИ этой функции
export const App = () => {
  // === ХУКИ СОСТОЯНИЯ ===
  const {
    items,
    stats,
    addItem,
    toggleItemCompleted,
    deleteItem,
    updateReminder,
    getRecoveryState: getClosetRecovery,
  } = useClosetItems([DEMO_ITEM]);

  const assistantRef = useRef(null);

  // === КОНТЕКСТ ДЛЯ ОБРАБОТЧИКА ===
  const smartAppContext = useRef({
    items,
    addItem,
    toggleItemCompleted,
    deleteItem,
    updateReminder,
  });

  useEffect(() => {
    smartAppContext.current = {
      items,
      addItem,
      toggleItemCompleted,
      deleteItem,
      updateReminder,
    };
  }, [items, addItem, toggleItemCompleted, deleteItem, updateReminder]);

  // === ОБРАБОТЧИК КОМАНД ОТ АССИСТЕНТА ===
  const handleAssistantAction = useCallback((action) => {
    const type = action?.type;
    const params = action.parameters || action;
    const ctx = smartAppContext.current;

    console.log('📥 Action received:', type, params);

    switch (type) {
      case 'add_clothing':
      case 'add_item': {
        ctx.addItem({
          id: params.id || generateId(),
          name: params.name || params.note || 'Новая вещь',
          category: params.category || 'другое',
          instruction: params.instruction || getDefaultInstruction(params.category),
          washing: params.washing || getDefaultWashing(params.category),
          nextReminder: params.nextReminder || '',
          completed: false,
        });
        break;
      }

      case 'done_clothing':
      case 'mark_done':
      case 'folded': {
        if (params.id) ctx.toggleItemCompleted(params.id);
        break;
      }

      case 'delete_clothing':
      case 'remove_item': {
        if (params.id) ctx.deleteItem(params.id);
        break;
      }

      case 'set_reminder':
      case 'remind_me': {
        if (params.id && params.date) ctx.updateReminder(params.id, params.date);
        break;
      }

      case 'speak_instruction':
      case 'ask_folding': {
        const item = params.id ? ctx.items.find(i => i.id === params.id) : null;
        if (item && window.sendSmartAppResponse) {
          window.sendSmartAppResponse({
            type: 'voice_response',
            text: `Как сложить ${item.name}: ${item.instruction}`,
            emotion: 'helpful'
          });
        }
        break;
      }

      case 'speak_washing':
      case 'ask_washing': {
        const item = params.id ? ctx.items.find(i => i.id === params.id) : null;
        if (item && window.sendSmartAppResponse) {
          window.sendSmartAppResponse({
            type: 'voice_response',
            text: `Совет по стирке для ${item.name}: ${item.washing}`,
            emotion: 'helpful'
          });
        }
        break;
      }

      default:
        console.warn('⚠️ Unknown action type:', type, action);
    }
  }, []);

  // 🔥 СТРОГО по документации: только разрешённые поля в item_selector.items
  const getStateForAssistant = useCallback(() => ({
    item_selector: {
      ignored_words: ASSISTANT_IGNORED_WORDS,
      items: items.map(({ id, name }, index) => ({
        number: index + 1,  // 🔥 Обязательно: для команд "первая", "вторая"
        id,                 // 🔥 Обязательно: уникальная идентификация
        title: name,        // 🔥 Обязательно: фраза для распознавания речи
        // ❌ НЕ добавляйте: completed, category, instruction, washing — это ломает NLU!
      })),
    },
    // 🔹 Доп. контекст — ОТДЕЛЬНЫМ полем, не в item_selector:
    closet_meta: {
      total: items.length,
      completed: items.filter(i => i.completed).length,
    },
  }), [items]);

  // === getRecoveryState ДЛЯ ВОССТАНОВЛЕНИЯ СЕССИИ ===
  const getRecoveryState = useCallback(() => {
    const closet = getClosetRecovery?.() || {};
    return { ...closet, app_version: '1.0.0', last_session: Date.now() };
  }, [getClosetRecovery]);

  // === ИНИЦИАЛИЗАЦИЯ АССИСТЕНТА ===
  const {
    assistant,
    updateState,
    updateRecoveryState,
    sendActionValue,
    sendSmartAppResponse,
    cancelTts,
  } = useAssistant(handleAssistantAction, smartAppContext.current, getRecoveryState);

  // === ЭФФЕКТЫ ===

  // Сохраняем ссылку на assistant для отладки
  useEffect(() => {
    if (assistant) {
      assistantRef.current = assistant;
      if (process.env.NODE_ENV === 'development') {
        window.assistant = assistant;
        window.sendSmartAppResponse = sendSmartAppResponse;
      }
    }
    return () => {
      if (window.assistant === assistant) delete window.assistant;
      delete window.sendSmartAppResponse;
      cancelTts?.();
    };
  }, [assistant, sendSmartAppResponse, cancelTts]);

  // Обновляем getState в ассистенте при изменении списка
  useEffect(() => {
    if (updateState && typeof updateState === 'function') {
      updateState(getStateForAssistant);
    }
  }, [items, updateState, getStateForAssistant]);

  // Обновляем recovery state при изменении
  useEffect(() => {
    if (updateRecoveryState && typeof updateRecoveryState === 'function') {
      updateRecoveryState(getRecoveryState);
    }
  }, [getRecoveryState, updateRecoveryState]);

  // === ХУКИ ОЗВУЧКИ ===
  const { handleSpeakInstruction, handleSpeakWashing, speak } = useSpeech(sendSmartAppResponse);
  const { playSuccessMessage } = useSuccessMessage(sendSmartAppResponse);

  // === ОБРАБОТЧИКИ ДЛЯ UI ===

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
    if (added) speak?.(`Добавила ${added.name}`, { emotion: 'positive' });
    sendActionValue?.('add_clothing', { id: added?.id, name: added?.name, category: added?.category });
    return added;
  }, [addItem, sendActionValue, speak]);

  const handleDone = useCallback((item) => {
    toggleItemCompleted(item.id);
    playSuccessMessage(item.id, items);
    sendActionValue?.('done_clothing', { id: item.id });
  }, [items, toggleItemCompleted, playSuccessMessage, sendActionValue]);

  const handleDelete = useCallback((item) => {
    deleteItem(item.id);
    sendActionValue?.('delete_clothing', { id: item.id });
  }, [deleteItem, sendActionValue]);

  const handleUpdateReminder = useCallback((id, date) => {
    updateReminder(id, date);
    sendActionValue?.('set_reminder', { id, date });
  }, [updateReminder, sendActionValue]);

  const handleItemClick = useCallback((item) => {
    if (sendActionValue) {
      sendActionValue('item_selected', { id: item.id, name: item.name });
    }
  }, [sendActionValue]);

  // === РЕНДЕР ===
  return (
    <TaskList
      items={items}
      stats={stats}
      onAdd={handleAdd}
      onDone={handleDone}
      onDelete={handleDelete}
      onUpdateReminder={handleUpdateReminder}
      onItemClick={handleItemClick}
      onAskFolding={handleSpeakInstruction}
      onAskWashing={handleSpeakWashing}
      assistantReady={!!assistant}
      assistantStatus={assistant ? 'connected' : 'initializing'}
    />
  );
};

export default App;