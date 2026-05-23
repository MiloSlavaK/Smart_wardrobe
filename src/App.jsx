// src/App.jsx
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import TaskList from './pages/TaskList';
import { ASSISTANT_IGNORED_WORDS, SUCCESS_MESSAGES, CLOTHING_CATEGORIES } from './constants/clothingData';
import { handleSmartAppAction, createSmartAppResponse } from './utils/smartAppHandler';
import { validateClosetItem, getDefaultInstruction, getDefaultWashing } from './utils/helpers';
import {
  useAssistant,
  useClosetItem,
  useStorage,
  useDebounce,
  useSpeech,
} from './hooks';
import './App.css';

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
    if (items.length === 0 && DEMO_ITEM) {
      setItems([DEMO_ITEM]);
    }
  }, [items.length]);

  // === СОСТОЯНИЕ ДЛЯ АССИСТЕНТА ===
  const getStateForAssistant = useCallback(() => ({
    item_selector: {
      ignored_words: ASSISTANT_IGNORED_WORDS,
      items: items.map(({ id, name }, index) => ({
        number: index + 1,
        id,
        title: name,
      })),
    },
    closet_meta: {
      total: items.length,
      completed: items.filter(i => i.completed).length,
    },
  }), [items]);

  // === ОБРАБОТКА ДЕЙСТВИЙ ОТ АССИСТЕНТА ===
  const handleAssistantAction = useCallback((action) => {
    const type = action?.type;
    const params = action.parameters || action;

    console.log('📥 Action received:', type, params);

    switch (type) {
      case 'add_clothing':
      case 'add_item': {
        addItem({
          id: params.id || generateId(),
          name: params.name || params.note || 'Новая вещь',
          category: params.category || CLOTHING_CATEGORIES.OTHER,
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
        if (params.id) toggleItemCompleted(params.id);
        break;
      }

      case 'delete_clothing':
      case 'remove_item': {
        if (params.id) deleteItem(params.id);
        break;
      }

      case 'set_reminder':
      case 'remind_me': {
        if (params.id && params.date) updateReminder(params.id, params.date);
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