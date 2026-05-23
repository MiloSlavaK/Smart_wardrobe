// src/App.jsx
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { TaskList } from './pages/TaskList';
import { createAssistant, createSmartappDebugger } from '@salutejs/client';
import { ASSISTANT_IGNORED_WORDS, SUCCESS_MESSAGES } from './constants/clothingData';
import { handleSmartAppAction, createSmartAppResponse } from './utils/smartAppHandler';
import { validateClosetItem, getDefaultInstruction, getDefaultWashing } from './utils/helpers';
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

// ========== УТИЛИТЫ ==========

const debounce = (func, wait) => {
  let timeout;
  return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), wait); };
};

// ========== ХРАНИЛИЩЕ ДАННЫХ ==========

const STORAGE_KEY = 'closet_items_db';
const STORAGE_VERSION = '1.0';

const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const version = localStorage.getItem(`${STORAGE_KEY}_version`);
    if (stored) {
      let items = JSON.parse(stored);
      if (version !== STORAGE_VERSION) {
        items = items.map(item => ({ ...item, createdAt: item.createdAt || Date.now(), updatedAt: item.updatedAt || Date.now(), tags: item.tags || [] }));
        localStorage.setItem(`${STORAGE_KEY}_version`, STORAGE_VERSION);
      }
      return items.filter(item => validateClosetItem(item));
    }
  } catch (e) { console.error('❌ Load error:', e); }
  return [];
};

const saveToStorage = (items) => {
  try {
    const backup = localStorage.getItem(STORAGE_KEY);
    if (backup) localStorage.setItem(`${STORAGE_KEY}_backup`, backup);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    localStorage.setItem(`${STORAGE_KEY}_version`, STORAGE_VERSION);
  } catch (e) {
    console.error('❌ Save error:', e);
    try {
      const backup = localStorage.getItem(`${STORAGE_KEY}_backup`);
      if (backup) localStorage.setItem(STORAGE_KEY, backup);
    } catch (err) { console.error('❌ Backup restore failed:', err); }
  }
};

// ========== АССИСТЕНТ ==========

const createMockAssistant = () => ({
  on: (event, cb) => { if (event === 'start') setTimeout(cb, 100); return () => {}; },
  sendData: (data, onData) => { console.log('📤 [MOCK]', data); onData?.({ type: 'mock' }); return () => {}; },
  sendAction: (action, onSuccess) => { onSuccess?.({ payload: {} }); return () => {}; },
  getInitialData: () => [],
  getRecoveryState: () => null,
  setGetState: () => {},
  setGetRecoveryState: () => {},
  cancelTts: () => {},
  close: () => {},
  applicationId: 'mock-application-id',
});

const initializeAssistant = (getState, getRecoveryState) => {
  const isDev = process.env.NODE_ENV === 'development';
  const token = process.env.REACT_APP_TOKEN?.trim();
  const smartapp = process.env.REACT_APP_SMARTAPP?.trim();

  if (isDev && (!token || !smartapp)) return createMockAssistant();

  if (isDev && token && smartapp) {
    try {
      const debuggerAssistant = createSmartappDebugger({
        token,
        initPhrase: `Запусти ${smartapp}`,
        getState,
        getRecoveryState,
        nativePanel: { defaultText: 'Говорите...', screenshotMode: false, tabIndex: -1 },
        surface: process.env.REACT_APP_SURFACE || 'COMPANION',
      });
      if (!debuggerAssistant.applicationId) {
        debuggerAssistant.applicationId = 'debugger-application-id';
      }
      return debuggerAssistant;
    } catch (e) {
      console.error('❌ Debugger init failed:', e);
      return createMockAssistant();
    }
  }
  return createAssistant({ getState, getRecoveryState });
};

// ========== ОЗВУЧКА ==========

const sendToAssistantVoice = (text, sendSmartAppResponse, options = {}) => {
  if (!text?.trim() || !sendSmartAppResponse) return;
  sendSmartAppResponse({
    type: 'voice_response',
    text: text.trim(),
    emotion: options.emotion,
    context: options.context,
  });
  console.log('🗣️ [Assistant TTS]:', text);
};

// 🔥 ГЛАВНЫЙ КОМПОНЕНТ — все хуки ВНУТРИ этой функции
export const App = () => {
  // === СОСТОЯНИЕ ===
  const [items, setItems] = useState(() => loadFromStorage());
  const lastSavedRef = useRef(items);

  // Сохранение в localStorage
  const debouncedSave = useMemo(() => debounce((newItems) => {
    if (JSON.stringify(newItems) !== JSON.stringify(lastSavedRef.current)) {
      saveToStorage(newItems);
      lastSavedRef.current = newItems;
    }
  }, 500), []);

  useEffect(() => {
    debouncedSave(items);
    return () => { debouncedSave.flush?.(); saveToStorage(items); };
  }, [items, debouncedSave]);

  useEffect(() => {
    if (items.length === 0 && DEMO_ITEM) setItems([DEMO_ITEM]);
  }, [items.length]);

  // === ДЕЙСТВИЯ С ЭЛЕМЕНТАМИ ===
  const addItem = useCallback((itemData) => {
    if (!validateClosetItem(itemData, { partial: true })) return null;
    const { id, name, category, instruction, washing, nextReminder, tags = [] } = itemData;
    const newItem = {
      id: id || generateId(),
      name: name?.trim() || 'Новая вещь',
      category: category?.trim() || 'другое',
      instruction: instruction?.trim() || getDefaultInstruction(category),
      washing: washing?.trim() || getDefaultWashing(category),
      nextReminder: nextReminder || '',
      completed: false,
      createdAt: Date.now(), updatedAt: Date.now(),
      tags: Array.isArray(tags) ? tags : [],
      voiceAliases: [name?.toLowerCase(), category?.toLowerCase()].filter(Boolean),
    };
    setItems(prev => [...prev, newItem]);
    return newItem;
  }, []);

  const toggleItemCompleted = useCallback((id) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, completed: !item.completed, updatedAt: Date.now() } : item));
  }, []);

  const deleteItem = useCallback((id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateReminder = useCallback((id, date) => {
    if (!date) return;
    setItems(prev => prev.map(item => item.id === id ? { ...item, nextReminder: date, updatedAt: Date.now() } : item));
  }, []);

  // Статистика
  const stats = useMemo(() => ({
    total: items.length,
    completed: items.filter(i => i.completed).length,
    pending: items.filter(i => !i.completed).length,
    categories: [...new Set(items.map(i => i.category))],
    withReminders: items.filter(i => i.nextReminder).length,
    lastUpdated: Math.max(...items.map(i => i.updatedAt || 0), 0),
  }), [items]);

  // Восстановление состояния
  const getRecoveryState = useCallback(() => ({
    itemCount: items.length,
    lastItemIds: items.slice(-5).map(i => i.id),
    lastUpdate: stats.lastUpdated,
    version: STORAGE_VERSION,
  }), [items, stats.lastUpdated]);

  // === КОНТЕКСТ ДЛЯ ОБРАБОТЧИКА ===
  const smartAppContext = useRef({ items, addItem, toggleItemCompleted, deleteItem, updateReminder });

  useEffect(() => {
    smartAppContext.current = { items, addItem, toggleItemCompleted, deleteItem, updateReminder };
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

  // === ИНИЦИАЛИЗАЦИЯ АССИСТЕНТА ===
  const assistantRef = useRef(null);
  const getStateRef = useRef(() => ({}));
  const onActionRef = useRef(handleAssistantAction);
  const recoveryRef = useRef(getRecoveryState);
  const isInitializedRef = useRef(false);

  useEffect(() => { onActionRef.current = handleAssistantAction; }, [handleAssistantAction]);
  useEffect(() => { recoveryRef.current = getRecoveryState; }, [getRecoveryState]);

  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    assistantRef.current = initializeAssistant(
      () => getStateRef.current(),
      () => recoveryRef.current?.() || null
    );

    if (!assistantRef.current) return;

    const initial = assistantRef.current.getInitialData?.() || [];
    initial.forEach((cmd) => {
      if (cmd.type === 'smart_app_data' && cmd.smart_app_data?.type) {
        console.log('📥 Initial command:', cmd.smart_app_data);
        onActionRef.current?.(cmd.smart_app_data);
      }
    });

    const unsubscribe = assistantRef.current.on('data', (event) => {
      try {
        if (event.type === 'character') {
          console.log('🎭 Character:', event.character?.id);
          return;
        }

        if (event.type === 'theme') {
          document.documentElement.setAttribute('data-theme', event.theme?.name || 'dark');
          return;
        }

        if (event.type === 'visibility') {
          if (event.visibility === 'hidden') {
            assistantRef.current?.cancelTts?.();
          }
          console.log('👁️ Visibility:', event.visibility);
          return;
        }

        if (event.type === 'navigation') {
          const cmd = event.navigation?.command;
          if (cmd === 'UP') window.scrollTo({ top: 0, behavior: 'smooth' });
          if (cmd === 'DOWN') window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          return;
        }

        if (event.type === 'smart_app_data') {
          const action = event.action || event.smart_app_data;
          if (!action?.type) {
            console.warn('⚠️ No action type:', event);
            return;
          }
          console.log('📥 Parsed action:', action);
          handleSmartAppAction(action, smartAppContext.current);
          onActionRef.current?.(action);
          return;
        }

        if (event.type === 'smart_app_error') {
          console.error('❌ SmartApp error:', event.smart_app_error);
          return;
        }
      } catch (err) {
        console.error('❌ Error in on("data"):', err);
      }
    });

    return () => {
      unsubscribe?.();
      assistantRef.current?.cancelTts?.();
      assistantRef.current = null;
      isInitializedRef.current = false;
    };
  }, []);

  const updateState = useCallback((getState) => {
    getStateRef.current = getState;
    assistantRef.current?.setGetState?.(getState);
  }, []);

  const updateRecoveryState = useCallback((getter) => {
    recoveryRef.current = getter;
    assistantRef.current?.setGetRecoveryState?.(getter);
  }, []);

  const sendActionValue = useCallback((actionId, parameters = {}) => {
    if (!assistantRef.current?.sendData) return;
    assistantRef.current.sendData({
      action: {
        action_id: actionId,
        parameters: { timestamp: Date.now(), ...parameters },
      },
    });
  }, []);

  const sendSmartAppResponse = useCallback((response) => {
    if (!assistantRef.current?.sendData) return;
    if (response?.type === 'voice_response' && response?.text) {
      assistantRef.current.sendData({
        action: {
          action_id: 'pronounce_text',
          parameters: {
            text: response.text.trim(),
            emotion: response.emotion,
            context: response.context,
          },
        },
      });
      console.log('🗣️ Sent to Assistant TTS:', response.text);
      return;
    }
    const formatted = createSmartAppResponse(response);
    assistantRef.current.sendData({
      action: { action_id: 'response', parameters: formatted },
    });
  }, []);

  const cancelTts = useCallback(() => {
    assistantRef.current?.cancelTts?.();
  }, []);

  // === ОЗВУЧКА ===
  const handleSpeakInstruction = useCallback((item) => {
    if (!item?.name || !item?.instruction) return;
    sendToAssistantVoice(
      `Как сложить ${item.name}: ${item.instruction}`,
      sendSmartAppResponse,
      { emotion: 'helpful', context: 'folding' }
    );
  }, [sendSmartAppResponse]);

  const handleSpeakWashing = useCallback((item) => {
    if (!item?.name || !item?.washing) return;
    sendToAssistantVoice(
      `Совет по стирке для ${item.name}: ${item.washing}`,
      sendSmartAppResponse,
      { emotion: 'helpful', context: 'washing' }
    );
  }, [sendSmartAppResponse]);

  const speak = useCallback((text, options = {}) => {
    sendToAssistantVoice(text, sendSmartAppResponse, options);
  }, [sendSmartAppResponse]);

  const playSuccessMessage = useCallback((id, allItems) => {
    const item = allItems.find(i => i.id === id);
    if (!item || item.completed) return;
    const msg = SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)];
    if (sendSmartAppResponse) {
      sendSmartAppResponse({
        type: 'voice_response',
        text: msg,
        emotion: 'positive',
        context: 'success_feedback'
      });
    }
  }, [sendSmartAppResponse]);

  // === ЭФФЕКТЫ ===
  useEffect(() => {
    if (assistantRef.current) {
      if (process.env.NODE_ENV === 'development') {
        window.assistant = assistantRef.current;
        window.sendSmartAppResponse = sendSmartAppResponse;
      }
    }
    return () => {
      if (window.assistant === assistantRef.current) delete window.assistant;
      delete window.sendSmartAppResponse;
      cancelTts?.();
    };
  }, [sendSmartAppResponse, cancelTts]);

  useEffect(() => {
    if (updateState && typeof updateState === 'function') {
      updateState(getStateForAssistant);
    }
  }, [items, updateState, getStateForAssistant]);

  useEffect(() => {
    if (updateRecoveryState && typeof updateRecoveryState === 'function') {
      updateRecoveryState(getRecoveryState);
    }
  }, [getRecoveryState, updateRecoveryState]);

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
      assistantReady={!!assistantRef.current}
      assistantStatus={assistantRef.current ? 'connected' : 'initializing'}
    />
  );
};

export default App;