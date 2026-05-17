// src/hooks/useAssistant.js
import { useEffect, useRef, useCallback } from 'react';
import { createAssistant, createSmartappDebugger } from '@salutejs/client';
import { ASSISTANT_IGNORED_WORDS } from '../constants/clothingData';
import { handleSmartAppAction, createSmartAppResponse } from '../utils/smartAppHandler';

/**
 * 🔹 Mock-ассистент для безопасной работы без AssistantHost
 * Возвращает заглушку с теми же методами, что и реальный клиент
 */
const createMockAssistant = () => {
  const mock = {
    on: (event, cb) => {
      if (event === 'start') {
        // Эмулируем готовность с небольшой задержкой
        setTimeout(() => cb?.(), 100);
      }
      return () => {}; // unsubscribe
    },
    sendData: (data, onResponse) => {
      console.log('📤 [MOCK] sendData:', data);
      // Эмулируем успешный ответ
      onResponse?.({ type: 'mock_response', payload: { status: 'ok' } });
      return () => {};
    },
    sendAction: (action, onSuccess, onError) => {
      console.log('📤 [MOCK] sendAction:', action);
      onSuccess?.({ payload: { status: 'ok' } });
      return () => {};
    },
    getInitialData: () => [],
    getRecoveryState: () => null,
    setGetState: () => {},
    setGetRecoveryState: () => {},
    cancelTts: () => {
      console.log('🔇 [MOCK] cancelTts called');
    },
    close: () => {},
    subscribeToCommand: () => () => {},
  };
  return mock;
};

/**
 * Инициализация ассистента: дебаггер для dev, обычный клиент для prod
 */
const initializeAssistant = (getState, getRecoveryState) => {
  const isDev = process.env.NODE_ENV === 'development';
  const hasToken = process.env.REACT_APP_TOKEN?.trim();
  const hasSmartApp = process.env.REACT_APP_SMARTAPP?.trim();

  // 🔥 В dev-режиме без токена — возвращаем mock, а не крашим приложение
  if (isDev && (!hasToken || !hasSmartApp)) {
    console.warn('⚠️ Assistant Client: missing REACT_APP_TOKEN or REACT_APP_SMARTAPP');
    console.warn('📋 Получите токен: SmartApp Studio → Настройки профиля → SmartApp → Эмулятор');
    return createMockAssistant();
  }

  if (isDev && hasToken && hasSmartApp) {
    try {
      return createSmartappDebugger({
        token: process.env.REACT_APP_TOKEN,
        initPhrase: `Запусти ${process.env.REACT_APP_SMARTAPP}`,
        getState,
        getRecoveryState,
        nativePanel: {
          defaultText: 'Добавьте вещь...',
          screenshotMode: false,
          tabIndex: -1,
        },
        surface: process.env.REACT_APP_SURFACE || 'COMPANION',
      });
    } catch (e) {
      console.error('❌ SmartApp Debugger init failed:', e.message);
      // 🔹 Fallback на mock при любой ошибке инициализации
      return createMockAssistant();
    }
  }

  // Production: используем createAssistant (работает только в среде Сбера)
  return createAssistant({ getState, getRecoveryState });
};

export const useAssistant = (onAction, context, recoveryStateGetter) => {
  const assistantRef = useRef(null);
  const getStateCallback = useRef(() => ({}));
  const contextRef = useRef(context);
  const onActionRef = useRef(onAction);
  const recoveryStateRef = useRef(recoveryStateGetter);
  const isInitializedRef = useRef(false);

  // Синхронизируем рефы с актуальными значениями
  useEffect(() => { contextRef.current = context; }, [context]);
  useEffect(() => { onActionRef.current = onAction; }, [onAction]);
  useEffect(() => { recoveryStateRef.current = recoveryStateGetter; }, [recoveryStateGetter]);

  useEffect(() => {
    // 🔥 Защита от повторной инициализации
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    // Инициализируем ассистент
    assistantRef.current = initializeAssistant(
      () => getStateCallback.current(),
      () => recoveryStateRef.current?.() || null
    );

    if (!assistantRef.current) {
      console.error('❌ Failed to initialize assistant');
      return;
    }

    // 🔥 Подписка на событие готовности
    assistantRef.current.on?.('start', () => {
      console.log('✅ Assistant ready');
    });

    // 🔥 Получаем и обрабатываем начальные данные (чтобы избежать дублирования в on('data'))
    try {
      const initialData = assistantRef.current.getInitialData?.();
      if (initialData?.length) {
        initialData.forEach((cmd) => {
          if (cmd.type === 'smart_app_data' && cmd.smart_app_data?.action) {
            console.log('📥 Processing initial command:', cmd.smart_app_data.action);
            onActionRef.current?.(cmd.smart_app_data.action);
          }
        });
      }
    } catch (e) {
      console.warn('⚠️ getInitialData error:', e);
    }

    // ✅ Подписываемся на события и сохраняем функцию отписки
    const unsubscribe = assistantRef.current.on('data', (event) => {
      try {
        // 🔹 Служебные события — логируем
        if (event.type === 'character') {
          console.log(`🎭 Character changed: "${event?.character?.id}"`);
          return;
        }

        // 🔹 Тема (светлая/тёмная) — применяем к UI
        if (event.type === 'theme') {
          const themeName = event?.theme?.name || 'dark';
          console.log(`🎨 Theme: "${themeName}"`);
          document.documentElement.setAttribute('data-theme', themeName);
          return;
        }

        // 🔹 Видимость приложения — останавливаем озвучку при сворачивании
        if (event.type === 'visibility') {
          if (event.visibility === 'hidden') {
            // 🔥 Критически важно: останавливаем озвучку через ассистента, НЕ через браузер
            assistantRef.current?.cancelTts?.();
          }
          console.log(`👁️ Visibility: "${event.visibility}"`);
          return;
        }

        // 🔹 Навигация (стрелки пульта)
        if (event.type === 'navigation') {
          handleNavigation(event.navigation?.command);
          return;
        }

        // ✅ Обрабатываем команды от бэкенда (SmartCode)
        if (event.type === 'smart_app_data' && event.smart_app_data?.action) {
          const action = event.smart_app_data.action;
          console.log('📥 SmartApp action:', action);

          // Обрабатываем через smartAppHandler с актуальным контекстом
          const result = handleSmartAppAction(action, contextRef.current);

          // Обновляем UI через основной обработчик
          onActionRef.current?.(action);

          // 🔊 🔥 ВАЖНО: Озвучка ТОЛЬКО через ассистента Сбера, НЕ через браузер!
          // Браузерный speechSynthesis используется ТОЛЬКО для отладки в console.log
          if (result?.speak) {
            console.log('🗣️ [Assistant TTS]:', result.speak);
            // Отправляем текст на озвучивание через платформу Сбера
            assistantRef.current?.sendData?.({
              action: {
                action_id: 'pronounce_text',
                parameters: {
                  text: result.speak,
                  emotion: result.emotion,
                  context: result.context,
                },
              },
            });
            // ❌ НЕ использовать window.speechSynthesis.speak() в production!
          }
        }

        // 🔹 Обработка ошибок от бэкенда
        if (event.type === 'smart_app_error') {
          console.error('❌ SmartApp error:', event.smart_app_error);
        }

      } catch (err) {
        console.error('❌ Error handling assistant event:', err);
      }
    });

    // 🔹 Подписка на события TTS (начало/конец озвучки)
    const unsubscribeTts = assistantRef.current.on?.('tts', ({ state, owner }) => {
      if (owner) {
        console.log(`🔊 TTS ${state}`);
      }
    });

    // ✅ Cleanup: отписываемся от всех событий
    return () => {
      unsubscribe?.();
      unsubscribeTts?.();
      // 🔥 Останавливаем озвучку через ассистента при размонтировании
      assistantRef.current?.cancelTts?.();
      assistantRef.current = null;
      isInitializedRef.current = false;
    };
  }, []); // Инициализация один раз при монтировании

  /**
   * Обработка навигационных команд (стрелки пульта)
   */
  const handleNavigation = useCallback((command) => {
    switch (command) {
      case 'UP':
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;
      case 'DOWN':
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        break;
      case 'LEFT':
      case 'RIGHT':
        // Можно реализовать горизонтальную навигацию по категориям
        break;
      case 'FORWARD':
        // Переход вперёд по истории (если есть)
        break;
      default:
        console.log('🧭 Navigation command:', command);
    }
  }, []);

  /**
   * Обновляет функцию getState и уведомляет ассистента
   */
  const updateState = useCallback((stateGetter) => {
    getStateCallback.current = stateGetter;
    // 🔥 Критически важно: уведомляем ассистента об изменении getState
    assistantRef.current?.setGetState?.(stateGetter);
  }, []);

  /**
   * Обновляет функцию getRecoveryState
   */
  const updateRecoveryState = useCallback((recoveryGetter) => {
    recoveryStateRef.current = recoveryGetter;
    assistantRef.current?.setGetRecoveryState?.(recoveryGetter);
  }, []);

  /**
   * Отправляет действие на бэкенд с обработкой ошибок
   */
  const sendActionValue = useCallback((actionId, parameters = {}) => {
    if (!assistantRef.current?.sendData) {
      console.warn('⚠️ Assistant not ready, cannot send action');
      return;
    }

    const payload = {
      action: {
        action_id: actionId,
        parameters: {
          timestamp: Date.now(),
          ...parameters,
        },
      },
    };

    try {
      assistantRef.current.sendData(payload,
        (response) => {
          console.log('✅ Action response:', response);
        },
        (error) => {
          console.error('❌ Action error:', error);
        }
      );
    } catch (e) {
      console.error('❌ sendData exception:', e);
    }
  }, []);

  /**
   * 🔥 Отправляет ответ ассистенту — ВСЕ голосовые ответы идут через sendData
   */
  const sendSmartAppResponse = useCallback((response) => {
    if (!assistantRef.current?.sendData) return;

    // 🔹 Если это голосовой ответ — отправляем команду pronounce_text
    if (response?.type === 'voice_response' && response?.text) {
      assistantRef.current.sendData({
        action: {
          action_id: 'pronounce_text',
          parameters: {
            text: response.text.trim(),
            emotion: response.emotion,
            context: response.context,
            surface: process.env.REACT_APP_SURFACE,
          },
        },
      });
      console.log('🗣️ Sent to Assistant TTS:', response.text);
      return;
    }

    // 🔹 Обычный ответ с данными для UI
    const formattedResponse = createSmartAppResponse(response);
    assistantRef.current.sendData({
      action: {
        action_id: 'response',
        parameters: formattedResponse,
      },
    });
  }, []);

  /**
   * 🔥 Отправка server-action с типизированным ответом
   */
  const sendServerAction = useCallback((actionId, parameters, onSuccess, onError) => {
    if (!assistantRef.current?.sendAction) {
      console.warn('⚠️ sendAction not supported');
      return null;
    }

    return assistantRef.current.sendAction(
      { action_id: actionId, parameters },
      (data) => {
        console.log('✅ Server action success:', data);
        onSuccess?.(data);
      },
      (error) => {
        console.error('❌ Server action error:', error);
        onError?.(error);
      }
    );
  }, []);

  /**
   * 🔥 Остановка озвучки — ТОЛЬКО через ассистента
   */
  const cancelTts = useCallback(() => {
    // ❌ НЕ использовать window.speechSynthesis.cancel() для пользовательской озвучки!
    assistantRef.current?.cancelTts?.();
  }, []);

  return {
    // ✅ Getter гарантирует актуальную ссылку на ассистента
    get assistant() {
      return assistantRef.current;
    },
    updateState,
    updateRecoveryState,
    sendActionValue,
    sendSmartAppResponse,
    sendServerAction,
    cancelTts,
  };
};

export { ASSISTANT_IGNORED_WORDS };