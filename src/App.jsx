// src/App.jsx
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import TaskList from './pages/TaskList';
import { ASSISTANT_IGNORED_WORDS, SUCCESS_MESSAGES, CLOTHING_CATEGORIES } from './constants/clothingData';
import { validateClosetItem, getDefaultInstruction, getDefaultWashing } from './utils/helpers';
import { parseCategory } from './utils/smartAppHandler';
import {
  useAssistant,
  useClosetItem,
  useStorage,
  useDebounce,
  useSpeech,
} from './hooks';
import './App.css';
import { FOLDING_INSTRUCTIONS, WASHING_INSTRUCTIONS } from './constants/clothingData';
// Демо-элемент для первого запуска
const DEMO_ITEM = {
  id: 'demo-1',
  name: 'Футболка',
  category: CLOTHING_CATEGORIES.TOP,
  instruction: 'Сложите пополам вдоль, затем ещё раз пополам',
  washing: '30°C, деликатный режим. Сушить в расправленном виде.',
  nextReminder: '',
  completed: false,
};

// Генератор уникальных ID
const generateId = () => `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// 🔥 ГЛАВНЫЙ КОМПОНЕНТ
export const App = () => {
  // === ХУКИ ===
  const { loadFromStorage, saveToStorage, lastSavedRef } = useStorage(validateClosetItem);
  const [items, setItems] = useState(() => loadFromStorage());
  
  const { addItem, toggleItemCompleted, deleteItem, updateReminder, stats, getRecoveryState } =
    useClosetItem(items, setItems);

  const debouncedSave = useDebounce((newItems) => {
    if (JSON.stringify(newItems) !== JSON.stringify(lastSavedRef.current)) {
      saveToStorage(newItems);
      lastSavedRef.current = newItems;
    }
  }, 500);

  useEffect(() => {
    debouncedSave(items);
    return () => {
      debouncedSave.flush?.();
      saveToStorage(items);
    };
  }, [items, debouncedSave, saveToStorage]);

  useEffect(() => {
    if (items.length === 0) {
      setItems([DEMO_ITEM]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // === СОСТОЯНИЕ ДЛЯ АССИСТЕНТА ===
  const getStateForAssistant = useCallback(() => ({
    item_selector: {
      ignored_words: ASSISTANT_IGNORED_WORDS,
      items: items.map(({ id, name, instruction, washing, category }, index) => ({
        number: index + 1,
        id,
        title: name,
        instruction,
        washing,
        category,
      })),
    },
    closet_meta: {
      total: items.length,
      completed: items.filter(i => i.completed).length,
    },
  }), [items]);

  // === ОБРАБОТКА ДЕЙСТВИЙ ОТ АССИСТЕНТА ===
  const sendSmartAppResponseRef = useRef(null);
  const itemsRef = useRef(items);
  useEffect(() => { itemsRef.current = items; }, [items]);

  const handleAssistantAction = useCallback((action) => {
    const type = action?.type;
    const params = action.parameters || action;

    console.log('📥 Action received:', type, params);

    switch (type) {
      case 'add_clothing':
      case 'add_item': {
        const _name = params.name || params.note || 'Новая вещь';
        const _cat = (params.category && params.category !== CLOTHING_CATEGORIES.OTHER)
          ? params.category
          : (parseCategory(_name) || CLOTHING_CATEGORIES.OTHER);
        addItem({
          id: params.id || generateId(),
          name: _name,
          category: _cat,
          instruction: params.instruction || getDefaultInstruction(_cat),
          washing: params.washing || getDefaultWashing(_cat),
          nextReminder: params.nextReminder || '',
          completed: false,
        });
        break;
      }

      case 'done_clothing':
      case 'mark_done':
      case 'folded': {
        if (params.id) {
          toggleItemCompleted(params.id);
        } else if (params.name) {
          const found = itemsRef.current.find(i =>
            i.name.toLowerCase() === params.name.toLowerCase()
          );
          if (found) toggleItemCompleted(found.id);
        }
        break;
      }

      case 'delete_clothing':
      case 'remove_item': {
        if (params.id) {
          deleteItem(params.id);
        } else if (params.number) {
          const target = itemsRef.current[Number(params.number) - 1];
          if (target) deleteItem(target.id);
        } else if (params.name) {
          const found = itemsRef.current.find(i =>
            i.name.toLowerCase() === params.name.toLowerCase()
          );
          if (found) deleteItem(found.id);
        }
        break;
      }

      case 'set_reminder':
      case 'remind_me': {
        if (params.date) {
          const targetId = params.id || (params.name
            ? itemsRef.current.find(i => i.name.toLowerCase() === params.name.toLowerCase())?.id
            : null);
          if (targetId) updateReminder(targetId, params.date);
        }
        break;
      }

      case 'speak_instruction': {
        const _siQuery = (params.name || '').toLowerCase();
        const id = params.id || params.item_id
          || itemsRef.current.find(i => _siQuery && i.name.toLowerCase().includes(_siQuery))?.id;
        const item = itemsRef.current.find(i => i.id === id);

        if (item && sendSmartAppResponseRef.current) {
          // Берем инструкцию строго из констант по категории вещи
          const instruction = FOLDING_INSTRUCTIONS[item.category] || FOLDING_INSTRUCTIONS['другое'];
          const textToSpeak = `Как сложить ${item.name}. ${instruction}`;

          // Отправляем действие на сервер, чтобы он вызвал replyToUser (как в "ДобавитьВещь")
          sendSmartAppResponseRef.current({
            type: 'action',
            action: {
              action_id: 'pronounce_ready_text',
              parameters: { text: textToSpeak }
            }
          });
        } else {
          sendSmartAppResponseRef.current({
            type: 'action',
            action: {
              action_id: 'pronounce_ready_text',
              parameters: { text: 'Я не нашла эту вещь в списке. Уточните название или добавьте её.' }
            }
          });
        }
        break;
      }

      case 'speak_washing': {
        const _swQuery = (params.name || '').toLowerCase();
        const id = params.id || params.item_id
          || itemsRef.current.find(i => _swQuery && i.name.toLowerCase().includes(_swQuery))?.id;
        const item = itemsRef.current.find(i => i.id === id);

        if (item && sendSmartAppResponseRef.current) {
          // Берем совет по стирке строго из констант по категории вещи
          const instruction = WASHING_INSTRUCTIONS[item.category] || WASHING_INSTRUCTIONS['другое'];
          const textToSpeak = `Совет по стирке для ${item.name}. ${instruction}`;

          // Отправляем действие на сервер, чтобы он вызвал replyToUser
          sendSmartAppResponseRef.current({
            type: 'action',
            action: {
              action_id: 'pronounce_ready_text',
              parameters: { text: textToSpeak }
            }
          });
        } else {
          sendSmartAppResponseRef.current({
            type: 'action',
            action: {
              action_id: 'pronounce_ready_text',
              parameters: { text: 'Я не нашла эту вещь в списке. Уточните название или добавьте её.' }
            }
          });
        }
        break;
      }

      case 'list_items': {
        if (sendSmartAppResponseRef.current) {
          const list = itemsRef.current;
          const text = list.length === 0
            ? 'В вашем гардеробе пока нет вещей. Добавьте первую!'
            : `В вашем гардеробе ${list.length} вещей: ${list.map((i, idx) => `${idx + 1}. ${i.name}`).join(', ')}`;
          sendSmartAppResponseRef.current({ type: 'voice_response', text });
        }
        break;
      }

      case 'find_item': {
        const query = params.query || params.name;
        if (query && sendSmartAppResponseRef.current) {
          const found = itemsRef.current.filter(i =>
            i.name.toLowerCase().includes(query.toLowerCase())
          );
          const text = found.length
            ? `Нашла: ${found.map(i => i.name).join(', ')}`
            : `Вещи "${query}" не найдено`;
          sendSmartAppResponseRef.current({ type: 'voice_response', text });
        }
        break;
      }

      default:
        console.warn('⚠️ Unknown action type:', type, action);
    }
  }, [addItem, toggleItemCompleted, deleteItem, updateReminder]);

  // === АССИСТЕНТ ===
  const {
    assistant,
    sendActionValue,
    sendSmartAppResponse,
    cancelTts,
    updateState,
    updateRecoveryState,
    isReady,
  } = useAssistant(getStateForAssistant, getRecoveryState, handleAssistantAction);

  useEffect(() => {
    sendSmartAppResponseRef.current = sendSmartAppResponse;
  }, [sendSmartAppResponse]);

  // === ОЗВУЧКА ===
  const { handleSpeakInstruction, handleSpeakWashing } = useSpeech(sendSmartAppResponse);

  const speak = useCallback((text, options = {}) => {
    if (!sendSmartAppResponse) return;
    sendSmartAppResponse({
      type: 'voice_response',
      text,
      ...options,
    });
  }, [sendSmartAppResponse]);

  const playSuccessMessage = useCallback((id, allItems) => {
    const item = allItems.find(i => i.id === id);
    if (!item || item.completed || !sendSmartAppResponse) return;
    
    const msg = SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)];
    sendSmartAppResponse({
      type: 'voice_response',
      text: msg,
      emotion: 'positive',
      context: 'success_feedback',
    });
  }, [sendSmartAppResponse]);

  // === ЭФФЕКТЫ ===
  useEffect(() => {
    if (assistant && process.env.NODE_ENV === 'development') {
      window.assistant = assistant;
      window.sendSmartAppResponse = sendSmartAppResponse;
    }
    return () => {
      if (window.assistant === assistant) delete window.assistant;
      delete window.sendSmartAppResponse;
      cancelTts?.();
    };
  }, [assistant, sendSmartAppResponse, cancelTts]);

  useEffect(() => {
    if (updateState) {
      updateState(getStateForAssistant);
    }
  }, [items, updateState, getStateForAssistant]);

  useEffect(() => {
    if (updateRecoveryState) {
      updateRecoveryState(getRecoveryState);
    }
  }, [getRecoveryState, updateRecoveryState]);

  // === ОБРАБОТЧИКИ ДЛЯ UI ===
  const handleAdd = useCallback((itemData) => {
    const newItem = {
      id: generateId(),
      name: itemData.name || 'Новая вещь',
      category: itemData.category || CLOTHING_CATEGORIES.OTHER,
      instruction: itemData.instruction || getDefaultInstruction(itemData.category),
      washing: itemData.washing || getDefaultWashing(itemData.category),
      nextReminder: itemData.nextReminder || '',
      completed: false,
    };
    const added = addItem(newItem);
    if (added) {
      speak?.(`Добавила ${added.name}`, { emotion: 'positive' });
    }
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
      assistantReady={isReady}
      assistantStatus={isReady ? 'connected' : 'initializing'}
    />
  );
};

export default App;