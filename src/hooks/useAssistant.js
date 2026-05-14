import { useEffect, useRef, useCallback } from 'react';
import { createAssistant, createSmartappDebugger } from '@salutejs/client';
import { ASSISTANT_IGNORED_WORDS } from '../constants/clothingData';
import { handleSmartAppAction, createSmartAppResponse } from '../utils/smartAppHandler';

const initializeAssistant = (getState) => {
  const isDev = process.env.NODE_ENV === 'development';
  const hasToken = process.env.REACT_APP_TOKEN;
  const hasSmartApp = process.env.REACT_APP_SMARTAPP;

  if (isDev && hasToken && hasSmartApp) {
    try {
      return createSmartappDebugger({
        token: process.env.REACT_APP_TOKEN,
        initPhrase: `Запусти ${process.env.REACT_APP_SMARTAPP}`,
        getState,
        nativePanel: {
          defaultText: 'Добавьте вещь...',
          screenshotMode: false,
          tabIndex: -1,
        },
      });
    } catch (e) {
      console.warn('SmartApp Debugger init failed:', e);
      return createAssistant({ getState });
    }
  }

  return createAssistant({ getState });
};

export const useAssistant = (onAction, context) => {
  const assistantRef = useRef(null);
  const getStateCallback = useRef(() => ({}));
  const contextRef = useRef(context);
  const onActionRef = useRef(onAction);

  // Обновляем контекст и обработчик действий при изменении
  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  useEffect(() => {
    onActionRef.current = onAction;
  }, [onAction]);

  useEffect(() => {
    try {
      assistantRef.current = initializeAssistant(() => getStateCallback.current());

      assistantRef.current.on('data', (event) => {
        if (event.type === 'character') {
          console.log(`character: "${event?.character?.id}"`);
        } else {
          const { action } = event;
          if (action && onActionRef.current) {
            // Обрабатываем действие через smartAppHandler с актуальным контекстом
            const result = handleSmartAppAction(action, contextRef.current);
            
            // Логгируем результат
            console.log('SmartApp action result:', result);
            
            // Вызываем оригинальный обработчик для обновления UI
            onActionRef.current(action);
            
            // Если есть голосовой ответ, озвучиваем его
            if (result?.speak && 'speechSynthesis' in window) {
              const utterance = new SpeechSynthesisUtterance(result.speak);
              utterance.lang = 'ru-RU';
              utterance.rate = 0.9;
              window.speechSynthesis.speak(utterance);
            }
          }
        }
      });
    } catch (error) {
      console.error('Failed to initialize assistant:', error);
      assistantRef.current = {
        on: () => {},
        sendData: () => () => {},
        getInitialData: () => ({}),
      };
    }

    return () => {
      if (assistantRef.current) {
        assistantRef.current = null;
      }
    };
  }, []); // Пустой массив - инициализируем только один раз

  const updateState = useCallback((stateGetter) => {
    getStateCallback.current = stateGetter;
  }, []);

  const sendActionValue = useCallback((actionId, value) => {
    if (!assistantRef.current?.sendData) return;

    const data = {
      action: { action_id: actionId, parameters: { value } },
    };
    const unsubscribe = assistantRef.current.sendData(data, (data) => {
      console.log('sendData onData:', data);
      unsubscribe?.();
    });
  }, []);

  const sendSmartAppResponse = useCallback((response) => {
    if (!assistantRef.current?.sendData) return;

    const formattedResponse = createSmartAppResponse(response);
    
    const data = {
      action: { 
        action_id: 'response', 
        parameters: formattedResponse 
      },
    };
    
    const unsubscribe = assistantRef.current.sendData(data, (data) => {
      console.log('SmartApp response sent:', data);
      unsubscribe?.();
    });
  }, []);

  return {
    assistant: assistantRef.current,
    updateState,
    sendActionValue,
    sendSmartAppResponse,
  };
};

export { ASSISTANT_IGNORED_WORDS };
