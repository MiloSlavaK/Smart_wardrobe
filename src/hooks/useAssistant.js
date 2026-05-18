// src/hooks/useAssistant.js
import { useEffect, useRef, useCallback } from 'react';
import { createAssistant, createSmartappDebugger } from '@salutejs/client';
import { ASSISTANT_IGNORED_WORDS } from '../constants/clothingData';
import { handleSmartAppAction, createSmartAppResponse } from '../utils/smartAppHandler';

// 🔹 Mock для dev без токена
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
});

const initializeAssistant = (getState, getRecoveryState) => {
  const isDev = process.env.NODE_ENV === 'development';
  const token = process.env.REACT_APP_TOKEN?.trim();
  const smartapp = process.env.REACT_APP_SMARTAPP?.trim();

  if (isDev && (!token || !smartapp)) return createMockAssistant();

  if (isDev && token && smartapp) {
    try {
      return createSmartappDebugger({
        token,
        initPhrase: `Запусти ${smartapp}`,
        getState,
        getRecoveryState,
        nativePanel: { defaultText: 'Говорите...', screenshotMode: false, tabIndex: -1 },
        surface: process.env.REACT_APP_SURFACE || 'COMPANION',
      });
    } catch (e) {
      console.error('❌ Debugger init failed:', e);
      return createMockAssistant();
    }
  }
  return createAssistant({ getState, getRecoveryState });
};

export const useAssistant = (onAction, context, getRecoveryState) => {
  const assistantRef = useRef(null);
  const getStateRef = useRef(() => ({}));
  const onActionRef = useRef(onAction);
  const contextRef = useRef(context);
  const recoveryRef = useRef(getRecoveryState);
  const isInitializedRef = useRef(false);

  useEffect(() => { onActionRef.current = onAction; }, [onAction]);
  useEffect(() => { contextRef.current = context; }, [context]);
  useEffect(() => { recoveryRef.current = getRecoveryState; }, [getRecoveryState]);

  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    assistantRef.current = initializeAssistant(
      () => getStateRef.current(),
      () => recoveryRef.current?.() || null
    );

    if (!assistantRef.current) return;

    // 🔥 КРИТИЧЕСКИ: getInitialData() ДО подписки on('data')
    // Согласно документации: иначе команды из appInitialData придут дважды
    const initial = assistantRef.current.getInitialData?.() || [];
    initial.forEach((cmd) => {
      // 🔹 AssistantSmartAppCommand: { type: 'smart_app_data', smart_app_data: { type, payload } }
      if (cmd.type === 'smart_app_data' && cmd.smart_app_data?.type) {
        console.log('📥 Initial command:', cmd.smart_app_data);
        onActionRef.current?.(cmd.smart_app_data);
      }
    });

    // 🔹 Подписка на события
    const unsubscribe = assistantRef.current.on('data', (event) => {
      try {
        // 🔸 AssistantCharacterCommand
        if (event.type === 'character') {
          console.log('🎭 Character:', event.character?.id);
          return;
        }

        // 🔸 AssistantThemeCommand
        if (event.type === 'theme') {
          document.documentElement.setAttribute('data-theme', event.theme?.name || 'dark');
          return;
        }

        // 🔸 AssistantVisibilityCommand — 🔥 ВАЖНО для озвучки!
        if (event.type === 'visibility') {
          if (event.visibility === 'hidden') {
            // 🔥 Останавливаем озвучку при сворачивании (требование документации)
            assistantRef.current?.cancelTts?.();
          }
          console.log('👁️ Visibility:', event.visibility);
          return;
        }

        // 🔸 AssistantNavigationCommand
        if (event.type === 'navigation') {
          const cmd = event.navigation?.command;
          if (cmd === 'UP') window.scrollTo({ top: 0, behavior: 'smooth' });
          if (cmd === 'DOWN') window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          return;
        }

        // 🔸 AssistantSmartAppCommand — КОМАНДЫ ОТ БЭКЕНДА
        if (event.type === 'smart_app_data') {
          // 🔥 Согласно документации: данные в event.smart_app_data, а не event.action!
          const smartAppData = event.smart_app_data;

          if (!smartAppData?.type) {
            console.warn('⚠️ smart_app_data without type:', smartAppData);
            return;
          }

          console.log('📥 Backend command:', smartAppData);

          // 🔹 Обрабатываем через handler
          handleSmartAppAction(smartAppData, contextRef.current);
          // 🔹 Обновляем UI
          onActionRef.current?.(smartAppData);

          return;
        }

        // 🔸 AssistantSmartAppError
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
      assistantRef.current?.cancelTts?.(); // 🔥 Остановка озвучки при размонтировании
      assistantRef.current = null;
      isInitializedRef.current = false;
    };
  }, []);

  const updateState = useCallback((getState) => {
    getStateRef.current = getState;
    // 🔥 Согласно документации: setGetState подменяет callback состояния
    assistantRef.current?.setGetState?.(getState);
  }, []);

  const updateRecoveryState = useCallback((getter) => {
    recoveryRef.current = getter;
    assistantRef.current?.setGetRecoveryState?.(getter);
  }, []);

  // 🔹 Отправка действия на бэкенд (AssistantServerAction)
  const sendActionValue = useCallback((actionId, parameters = {}) => {
    if (!assistantRef.current?.sendData) return;

    // 🔥 Формат строго по документации: { action: { action_id, parameters } }
    assistantRef.current.sendData({
      action: {
        action_id: actionId,
        parameters: { timestamp: Date.now(), ...parameters },
      },
    });
  }, []);

  // 🔹 ОЗВУЧКА ЧЕРЕЗ АССИСТЕНТА (НЕ браузерный TTS!)
  const sendSmartAppResponse = useCallback((response) => {
    if (!assistantRef.current?.sendData) return;

    // 🔥 Голосовой ответ: отправляем команду pronounce_text
    // Согласно документации: все пользовательские ответы — через платформу
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

    // Обычный ответ с данными
    const formatted = createSmartAppResponse(response);
    assistantRef.current.sendData({
      action: { action_id: 'response', parameters: formatted },
    });
  }, []);

  const cancelTts = useCallback(() => {
    assistantRef.current?.cancelTts?.();
  }, []);

  return {
    get assistant() { return assistantRef.current; },
    updateState,
    updateRecoveryState,
    sendActionValue,
    sendSmartAppResponse,
    cancelTts,
  };
};

export { ASSISTANT_IGNORED_WORDS };