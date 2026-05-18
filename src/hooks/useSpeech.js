// src/hooks/useSpeech.js
import { useCallback } from 'react';
import { SUCCESS_MESSAGES } from '../constants/clothingData';

// 🔥 Все голосовые ответы — ТОЛЬКО через sendSmartAppResponse (платформа Сбера)
// Браузерный speechSynthesis ЗАПРЕЩЁН для пользовательских ответов
const sendToAssistantVoice = (text, sendSmartAppResponse, options = {}) => {
  if (!text?.trim() || !sendSmartAppResponse) return;

  // 🔥 Отправляем команду на озвучивание через платформу
  sendSmartAppResponse({
    type: 'voice_response',
    text: text.trim(),
    emotion: options.emotion,
    context: options.context,
  });

  // 🔹 Только лог для отладки (НЕ реальная озвучка!)
  console.log('🗣️ [Assistant TTS]:', text);
};

export const useSpeech = (sendSmartAppResponse) => {
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

  const handleSpeakSuccess = useCallback((message) => {
    if (!message) return;
    sendToAssistantVoice(message, sendSmartAppResponse, { emotion: 'positive', context: 'success' });
  }, [sendSmartAppResponse]);

  const handleSpeakError = useCallback((message) => {
    if (!message) return;
    sendToAssistantVoice(message, sendSmartAppResponse, { emotion: 'concerned', context: 'error' });
  }, [sendSmartAppResponse]);

  const speak = useCallback((text, options = {}) => {
    sendToAssistantVoice(text, sendSmartAppResponse, options);
  }, [sendSmartAppResponse]);

  return { handleSpeakInstruction, handleSpeakWashing, handleSpeakSuccess, handleSpeakError, speak };
};

export const useSuccessMessage = (sendSmartAppResponse) => {
  const playSuccessMessage = useCallback((id, items) => {
    const item = items.find(i => i.id === id);
    if (!item || item.completed) return;

    const msg = SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)];

    // 🔥 Отправляем на озвучку через платформу, не через браузер!
    if (sendSmartAppResponse) {
      sendSmartAppResponse({
        type: 'voice_response',
        text: msg,
        emotion: 'positive',
        context: 'success_feedback'
      });
    }
  }, [sendSmartAppResponse]);

  return { playSuccessMessage };
};

export default useSpeech;