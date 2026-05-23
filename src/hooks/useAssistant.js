// src/hooks/useAssistant.js
import { useRef, useCallback, useEffect } from 'react';
import { createAssistant, createSmartappDebugger } from '@salutejs/client';

/**
 * Создаёт мок-ассистента для тестирования
 */
const createMockAssistant = () => ({
  on: (event, cb) => {
    if (event === 'start') setTimeout(cb, 100);
    return () => {};
  },
  sendData: (data, onData) => {
    console.log('📤 [MOCK]', data);
    onData?.({ type: 'mock' });
    return () => {};
  },
  sendAction: (action, onSuccess) => {
    onSuccess?.({ payload: {} });
    return () => {};
  },
  getInitialData: () => [],
  getRecoveryState: () => null,
  setGetState: () => {},
  setGetRecoveryState: () => {},
  cancelTts: () => {},
  close: () => {},
  applicationId: 'mock-application-id',
});

/**
 * Инициализирует ассистента в зависимости от окружения
 */
const initializeAssistant = (getState, getRecoveryState) => {
  const isDev = process.env.NODE_ENV === 'development';
  const token = process.env.REACT_APP_TOKEN?.trim();
  const smartapp = process.env.REACT_APP_SMARTAPP?.trim();

  if (isDev && (!token || !smartapp)) {
    return createMockAssistant();
  }

  if (isDev && token && smartapp) {
    try {
      const debuggerAssistant = createSmartappDebugger({
        token,
        initPhrase: `Запусти ${smartapp}`,
        getState,
        getRecoveryState,
        nativePanel: {
          defaultText: 'Говорите...',
          screenshotMode: false,
          tabIndex: -1,
        },
        surface: process.env.REACT_APP_SURFACE || 'COMPANION',
      });
      
      // Гарантируем наличие applicationId до любых операций с TTS
      if (!debuggerAssistant.applicationId) {
        Object.defineProperty(debuggerAssistant, 'applicationId', {
          value: 'debugger-application-id',
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }
      
      return debuggerAssistant;
    } catch (e) {
      console.error('❌ Debugger init failed:', e);
      return createMockAssistant();
    }
  }

  return createAssistant({ getState, getRecoveryState });
};

/**
 * Хук для работы с голосовым ассистентом SmartApp
 * @param {Function} getState - функция получения текущего состояния
 * @param {Function} getRecoveryState - функция получения состояния восстановления
 * @param {Function} onAction - обработчик входящих действий от ассистента
 * @returns {Object} методы и состояние ассистента
 */
export const useAssistant = (getState, getRecoveryState, onAction) => {
  const assistantRef = useRef(null);
  const getStateRef = useRef(getState);
  const onActionRef = useRef(onAction);
  const recoveryRef = useRef(getRecoveryState);
  const isInitializedRef = useRef(false);

  // Обновление ссылок на актуальные функции
  useEffect(() => {
    getStateRef.current = getState;
  }, [getState]);

  useEffect(() => {
    onActionRef.current = onAction;
  }, [onAction]);

  useEffect(() => {
    recoveryRef.current = getRecoveryState;
  }, [getRecoveryState]);

  // Инициализация ассистента
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    assistantRef.current = initializeAssistant(
      () => getStateRef.current(),
      () => recoveryRef.current?.() || null
    );

    if (!assistantRef.current) return;

    // Обработка начальных данных
    const initial = assistantRef.current.getInitialData?.() || [];
    initial.forEach((cmd) => {
      if (cmd.type === 'smart_app_data' && cmd.smart_app_data?.type) {
        console.log('📥 Initial command:', cmd.smart_app_data);
        onActionRef.current?.(cmd.smart_app_data);
      }
    });

    // Подписка на события
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
          onActionRef.current?.(action);
          return;
        }

        if (event.type === 'smart_app_error') {
          console.error('❌ SmartApp error:', event.smart_app_error);
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

  /**
   * Отправка действия ассистенту
   */
  const sendActionValue = useCallback((actionId, parameters = {}) => {
    if (!assistantRef.current?.sendData) return;
    
    assistantRef.current.sendData({
      action: {
        action_id: actionId,
        parameters: { timestamp: Date.now(), ...parameters },
      },
    });
  }, []);

  /**
   * Отправка ответа ассистенту (включая озвучку)
   */
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

    const formatted = {
      success: response.success ?? true,
      message: response.message || 'Произошла ошибка при выполнении команды',
    };

    if (response.speak) {
      formatted.speech = response.speak;
    }

    if (response.data) {
      formatted.data = response.data;
    }

    if (!response.success && response.error) {
      formatted.error = response.error;
    }

    assistantRef.current.sendData({
      action: { action_id: 'response', parameters: formatted },
    });
  }, []);

  /**
   * Отмена текущей озвучки
   */
  const cancelTts = useCallback(() => {
    assistantRef.current?.cancelTts?.();
  }, []);

  /**
   * Обновление функции получения состояния
   */
  const updateState = useCallback((getter) => {
    getStateRef.current = getter;
    assistantRef.current?.setGetState?.(getter);
  }, []);

  /**
   * Обновление функции получения состояния восстановления
   */
  const updateRecoveryState = useCallback((getter) => {
    recoveryRef.current = getter;
    assistantRef.current?.setGetRecoveryState?.(getter);
  }, []);

  return {
    assistant: assistantRef.current,
    sendActionValue,
    sendSmartAppResponse,
    cancelTts,
    updateState,
    updateRecoveryState,
    isReady: !!assistantRef.current,
  };
};

export default useAssistant;
