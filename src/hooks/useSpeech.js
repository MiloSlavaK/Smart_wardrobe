// src/hooks/useSpeech.js
import { useCallback } from 'react';

/**
 * Хук для управления озвучиванием инструкций и советов по стирке
 * @param {Function} sendSmartAppResponse - функция отправки ответа ассистенту
 * @returns {Object} методы для озвучивания
 */
export const useSpeech = (sendSmartAppResponse) => {
  /**
   * Озвучить инструкцию по складыванию вещи
   * @param {Object} item - объект вещи с полями name и instruction
   */
  const handleSpeakInstruction = useCallback((item) => {
    if (!item?.name || !item?.instruction || !sendSmartAppResponse) return;
    
    const text = `Как сложить ${item.name}: ${item.instruction}`;
    sendSmartAppResponse({
      type: 'voice_response',
      text,
      emotion: 'helpful',
      context: 'folding',
    });
  }, [sendSmartAppResponse]);

  /**
   * Озвучить совет по стирке вещи
   * @param {Object} item - объект вещи с полями name и washing
   */
  const handleSpeakWashing = useCallback((item) => {
    if (!item?.name || !item?.washing || !sendSmartAppResponse) return;
    
    const text = `Совет по стирке для ${item.name}: ${item.washing}`;
    sendSmartAppResponse({
      type: 'voice_response',
      text,
      emotion: 'helpful',
      context: 'washing',
    });
  }, [sendSmartAppResponse]);

  return { handleSpeakInstruction, handleSpeakWashing };
};

export default useSpeech;
