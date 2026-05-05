import { useEffect, useRef, useCallback } from 'react';
import { createAssistant, createSmartappDebugger } from '@salutejs/client';
import { ASSISTANT_IGNORED_WORDS } from '../constants/clothingData';

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

export const useAssistant = (onAction) => {
  const assistantRef = useRef(null);
  const getStateCallback = useRef(() => ({}));

  useEffect(() => {
    try {
      assistantRef.current = initializeAssistant(() => getStateCallback.current());

      assistantRef.current.on('data', (event) => {
        if (event.type === 'character') {
          console.log(`character: "${event?.character?.id}"`);
        } else {
          const { action } = event;
          if (action && onAction) {
            onAction(action);
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
  }, [onAction]);

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

  return {
    assistant: assistantRef.current,
    updateState,
    sendActionValue,
  };
};

export { ASSISTANT_IGNORED_WORDS };
