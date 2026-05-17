// src/hooks/useAssistant.js
import { useEffect, useRef, useCallback } from 'react';
import { createAssistant, createSmartappDebugger } from '@salutejs/client';
import { ASSISTANT_IGNORED_WORDS } from '../constants/clothingData';
import { handleSmartAppAction, createSmartAppResponse } from '../utils/smartAppHandler';

// 🔹 Mock-ассистент для безопасной работы без AssistantHost
const createMockAssistant = () => ({
  on: (event, cb) => { if (event === 'start') setTimeout(cb, 100); return () => {}; },
  sendData: (data, onResponse) => { console.log('📤 [MOCK] sendData:', data); onResponse?.({ type: 'mock' }); return () => {}; },
  sendAction: (action, onSuccess) => { console.log('📤 [MOCK] sendAction:', action); onSuccess?.({ payload: {} }); return () => {}; },
  getInitialData: () => [],
  getRecoveryState: () => null,
  setGetState: () => {},
  setGetRecoveryState: () => {},
  cancelTts: () => { console.log('🔇 [MOCK] cancelTts'); },
  close: () => {},
  subscribeToCommand: () => () => {},
});

// 🔹 Инициализация ассистента
const initializeAssistant = (getState, getRecoveryState) => {
  const isDev = process.env.NODE_ENV === 'development';
  const token = process.env.REACT_APP_TOKEN?.trim();
  const smartapp = process.env.REACT_APP_SMARTAPP?.trim();

  if (isDev && (!token || !smartapp)) {
    console.warn('⚠️ Missing REACT_APP_TOKEN or REACT_APP_SMARTAPP');
    return createMockAssistant();
  }

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
    const initial = assistantRef.current.getInitialData?.() || [];
    initial.forEach(cmd => {
      if (cmd.type === 'smart_app_data' && cmd.smart_app_data?.type) {
        onActionRef.current?.(cmd.smart_app_data);
      }
    });

    const unsubscribe = assistantRef.current.on('data', (event) => {
      try {
        if (event.type === 'character') { console.log('🎭 Character:', event.character?.id); return; }
        if (event.type === 'theme') {
          document.documentElement.setAttribute('data-theme', event.theme?.name || 'dark');
          return;
        }
        if (event.type === 'visibility') {
          if (event.visibility === 'hidden') assistantRef.current?.cancelTts?.();
          return;
        }
        if (event.type === 'navigation') {
          const cmd = event.navigation?.command;
          if (cmd === 'UP') window.scrollTo({ top: 0, behavior: 'smooth' });
          if (cmd === 'DOWN') window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          return;
        }
        if (event.type === 'smart_app_data' && event.smart_app_data?.type) {
          const action = event.smart_app_data;
          console.log('📥 SmartApp action:', action);
          handleSmartAppAction(action, contextRef.current);
          onActionRef.current?.(action);
        }
        if (event.type === 'smart_app_error') {
          console.error('❌ SmartApp error:', event.smart_app_error);
        }
      } catch (err) { console.error('❌ Error handling event:', err); }
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
      action: { action_id: actionId, parameters: { timestamp: Date.now(), ...parameters } }
    });
  }, []);

  const sendSmartAppResponse = useCallback((response) => {
    if (!assistantRef.current?.sendData) return;
    if (response?.type === 'voice_response' && response?.text) {
      assistantRef.current.sendData({
        action: {
          action_id: 'pronounce_text',
          parameters: { text: response.text.trim(), emotion: response.emotion, context: response.context }
        }
      });
      console.log('🗣️ Sent to Assistant TTS:', response.text);
      return;
    }
    const formatted = createSmartAppResponse(response);
    assistantRef.current.sendData({ action: { action_id: 'response', parameters: formatted } });
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