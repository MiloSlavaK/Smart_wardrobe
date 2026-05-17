// src/hooks/useAssistant.js
import { useEffect, useRef, useCallback } from 'react';
import { createAssistant, createSmartappDebugger } from '@salutejs/client';
import { ASSISTANT_IGNORED_WORDS } from '../constants/clothingData';
import { handleSmartAppAction, createSmartAppResponse } from '../utils/smartAppHandler';

/**
 * Инициализация ассистента: дебаггер для dev, обычный клиент для prod
 */
const initializeAssistant = (getState, getRecoveryState) => {
  const isDev = process.env.NODE_ENV === 'development';
  const hasToken = process.env.REACT_APP_TOKEN;
  const hasSmartApp = process.env.REACT_APP_SMARTAPP;

  if (isDev && hasToken && hasSmartApp) {
    try {
      return createSmartappDebugger({
        token: process.env.REACT_APP_TOKEN,
        initPhrase: `Запусти ${process.env.REACT_APP_SMARTAPP}`,
        getState,
        getRecoveryState, // 🔥 Добавлено: восстановление состояния
        nativePanel: {
          defaultText: 'Добавьте вещь...',
          screenshotMode: false,
          tabIndex: -1,
        },
        // 🔥 Название поверхности для корректного отображения
        surface: process.env.REACT_APP_SURFACE || 'COMPANION',
      });
    } catch (e) {
      console.warn('⚠️ SmartApp Debugger init failed, falling back to createAssistant:', e);
    }
  }

  return createAssistant({ getState, getRecoveryState });
};

export const useAssistant = (onAction, context, recoveryStateGetter) => {
  const assistantRef = useRef(null);
  const getStateCallback = useRef(() => ({}));
  const contextRef = useRef(context);
  const onActionRef = useRef(onAction);
  const recoveryStateRef = useRef(recoveryStateGetter);

  // Синхронизируем рефы с актуальными значениями
  useEffect(() => { contextRef.current = context; }, [context]);
  useEffect(() => { onActionRef.current = onAction; }, [onAction]);
  useEffect(() => { recoveryStateRef.current = recoveryStateGetter; }, [recoveryStateGetter]);

  useEffect(() => {
    // 🔥 Инициализируем ассистент с актуальными функциями getState/getRecoveryState
    assistantRef.current = initializeAssistant(
      () => getStateCallback.current(),
      () => recoveryStateRef.current?.() || null
    );

    if (!assistantRef.current) {
      console.error('❌ Failed to initialize assistant');
      return;
    }

    // 🔥 Получаем и обрабатываем начальные данные (чтобы избежать дублирования)
    try {
      const initialData = assistantRef.current.getInitialData?.();
      if (initialData?.length) {
        initialData.forEach((cmd) => {
          if (cmd.type === 'smart_app_data' && cmd.smart_app_data?.action) {
            console.log('📥 Processing initial command:', cmd.smart_app_data.action);
            handleInitialCommand(cmd.smart_app_data.action, contextRef.current);
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

        // 🔹 Тема (светлая/тёмная) — можно применить к UI
        if (event.type === 'theme') {
          console.log(`🎨 Theme: "${event?.theme?.name}"`);
          document.documentElement.setAttribute('data-theme', event?.theme?.name || 'dark');
          return;
        }

        // 🔹 Видимость приложения — останавливаем озвучку при сворачивании
        if (event.type === 'visibility') {
          if (event.visibility === 'hidden' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
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

          // 🔊 Озвучиваем ответ, если есть
          if (result?.speak && 'speechSynthesis' in window) {
            // Отменяем предыдущую озвучку
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(result.speak);
            utterance.lang = 'ru-RU';
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            window.speechSynthesis.speak(utterance);
          }
        }

        // 🔹 Обработка ошибок от бэкенда
        if (event.type === 'smart_app_error') {
          console.error('❌ SmartApp error:', event.smart_app_error);
          // Можно показать тост пользователю
        }

      } catch (err) {
        console.error('❌ Error handling assistant event:', err);
      }
    });

    // 🔹 Подписка на события TTS (начало/конец озвучки)
    const unsubscribeTts = assistantRef.current.on?.('tts', ({ state, owner }) => {
      if (owner) {
        console.log(`🔊 TTS ${state}`);
        // Можно показать индикатор озвучки в UI
      }
    });

    // ✅ Cleanup: отписываемся от всех событий
    return () => {
      unsubscribe?.();
      unsubscribeTts?.();
      // Останавливаем озвучку при размонтировании
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      assistantRef.current = null;
    };
  }, []); // Инициализация один раз при монтировании

  /**
   * Обработка начальных команд (отдельно от on('data'))
   */
  const handleInitialCommand = useCallback((action, ctx) => {
    // Аналогично handleSmartAppAction, но без дублирования в UI
    console.log('🔄 Initial command processed:', action);
  }, []);

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
    assistantRef.current?.setGetState?.(() => stateGetter());
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
          // Можно показать уведомление пользователю
        }
      );
    } catch (e) {
      console.error('❌ sendData exception:', e);
    }
  }, []);

  /**
   * Отправляет структурированный ответ от smartAppHandler
   */
// В useAssistant.js - функция sendSmartAppResponse

const sendSmartAppResponse = useCallback((response) => {
  if (!assistantRef.current?.sendData) return;

  // 🔹 Если это голосовой ответ — формируем команду pronounce_text
  if (response?.type === 'voice_response' && response?.text) {
    assistantRef.current.sendData({
      action: {
        action_id: 'pronounce_text',
        parameters: {
          text: response.text,
          // 🔹 Дополнительные параметры для TTS (если бэкенд поддерживает)
          emotion: response.emotion,
          context: response.context,
          surface: process.env.REACT_APP_SURFACE,
        },
      },
    });
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
   * 🔥 Новая функция: отправка server-action с типизированным ответом
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
   * 🔥 Остановка озвучки (полезно при скрытии приложения)
   */
  const cancelTts = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
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
    sendServerAction, // 🔥 Новая функция
    cancelTts,        // 🔥 Новая функция
  };
};

export { ASSISTANT_IGNORED_WORDS };