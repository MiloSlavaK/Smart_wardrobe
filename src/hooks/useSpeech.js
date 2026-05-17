// src/hooks/useSpeech.js
import { useCallback } from 'react';
import { SUCCESS_MESSAGES, ASSISTANT_VOICE_CONFIG } from '../constants/clothingData';

/**
 * 🔊 Отправка текста на озвучивание через ассистента Сбера
 * @param {string} text - Текст для озвучивания
 * @param {Function} sendSmartAppResponse - Функция отправки ответа ассистенту
 * @param {Object} options - Дополнительные настройки (pronomounce, emotion)
 */
const sendToAssistantVoice = (text, sendSmartAppResponse, options = {}) => {
  if (!text?.trim()) return;

  // 🔹 Формируем команду для бэкенда/ассистента
  const voiceCommand = {
    action: {
      action_id: 'pronounce_text',
      parameters: {
        text: text.trim(),
        // 🔹 Опциональные параметры для ассистента (если поддерживаются бэкендом)
        ...(options.emotion && { emotion: options.emotion }),
        ...(options.tts_markup && { tts_markup: options.tts_markup }),
      },
    },
  };

  // 🔹 Отправляем через assistant.sendData или sendSmartAppResponse
  if (sendSmartAppResponse) {
    sendSmartAppResponse({
      type: 'voice_response',
      text: text.trim(),
      ...options,
    });
  }

  // 🔹 Для отладки в dev-режиме (ОПЦИОНАЛЬНО, отключить в production!)
  if (process.env.NODE_ENV === 'development' && ASSISTANT_VOICE_CONFIG?.enableDevTts) {
    console.log('🗣️ [DEV TTS] Assistant would say:', text);
    // 🔸 НЕ использовать window.speechSynthesis в production!
    // Только лог для разработчика
  }
};

/**
 * Хук для управления голосовыми ответами через ассистента Сбера
 */
export const useSpeech = (sendSmartAppResponse) => {

  /**
   * 🧵 Озвучивание инструкции по складыванию вещи
   */
  const handleSpeakInstruction = useCallback((item) => {
    if (!item?.name || !item?.instruction) return;

    const text = `Как сложить ${item.name}: ${item.instruction}`;
    sendToAssistantVoice(text, sendSmartAppResponse, {
      emotion: 'friendly', // 🔹 Эмоция для ассистента (если поддерживается)
      context: 'folding_instruction',
    });
  }, [sendSmartAppResponse]);

  /**
   * 🧼 Озвучивание совета по стирке
   */
  const handleSpeakWashing = useCallback((item) => {
    if (!item?.name || !item?.washing) return;

    const text = `Совет по стирке для ${item.name}: ${item.washing}`;
    sendToAssistantVoice(text, sendSmartAppResponse, {
      emotion: 'helpful',
      context: 'washing_advice',
    });
  }, [sendSmartAppResponse]);

  /**
   * ✅ Озвучивание подтверждения действия (успешное выполнение)
   */
  const handleSpeakSuccess = useCallback((message) => {
    if (!message) return;
    sendToAssistantVoice(message, sendSmartAppResponse, {
      emotion: 'positive',
      context: 'action_confirmation',
    });
  }, [sendSmartAppResponse]);

  /**
   * ❌ Озвучивание ошибки или предупреждения
   */
  const handleSpeakError = useCallback((message) => {
    if (!message) return;
    sendToAssistantVoice(message, sendSmartAppResponse, {
      emotion: 'concerned',
      context: 'error_notification',
    });
  }, [sendSmartAppResponse]);

  /**
   * 🔄 Универсальная отправка любого текста на озвучивание
   */
  const speak = useCallback((text, options = {}) => {
    sendToAssistantVoice(text, sendSmartAppResponse, options);
  }, [sendSmartAppResponse]);

  return {
    handleSpeakInstruction,
    handleSpeakWashing,
    handleSpeakSuccess,
    handleSpeakError,
    speak, // 🔹 Универсальный метод
  };
};

/**
 * Хук для воспроизведения случайного сообщения об успехе
 * @param {Function} sendActionValue - Функция отправки action на бэкенд
 */
export const useSuccessMessage = (sendActionValue) => {
  const playSuccessMessage = useCallback(
    (id, items) => {
      // 🔹 Проверяем, что вещь ещё не была отмечена как выполненная
      const item = items.find(({ id: itemId }) => itemId === id);
      if (!item || item.completed) return;

      // 🔹 Выбираем случайное сообщение из списка
      const idx = Math.floor(Math.random() * SUCCESS_MESSAGES.length);
      const message = SUCCESS_MESSAGES[idx];

      // 🔹 Отправляем действие на бэкенд, который передаст текст ассистенту для озвучки
      if (sendActionValue) {
        sendActionValue('pronounce_text', {
          text: message,
          context: 'success_feedback',
          item_id: id,
        });
      }
    },
    [sendActionValue]
  );

  return { playSuccessMessage };
};

export default useSpeech;
