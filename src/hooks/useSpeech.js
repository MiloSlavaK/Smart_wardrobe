import { useCallback } from 'react';
import { speakText } from '../utils/helpers';
import { SUCCESS_MESSAGES } from '../constants/clothingData';

export const useSpeech = () => {
  const handleSpeakInstruction = useCallback((item) => {
    const text = `Как сложить ${item.name}: ${item.instruction}`;
    speakText(text);
  }, []);

  const handleSpeakWashing = useCallback((item) => {
    const text = `Совет по стирке для ${item.name}: ${item.washing}`;
    speakText(text);
  }, []);

  return {
    handleSpeakInstruction,
    handleSpeakWashing,
  };
};

export const useSuccessMessage = (sendActionValue) => {
  const playSuccessMessage = useCallback(
    (id, items) => {
      const completed = items.find(({ id: itemId }) => itemId === id)?.completed;
      if (!completed) {
        const idx = Math.floor(Math.random() * SUCCESS_MESSAGES.length);
        sendActionValue('done', SUCCESS_MESSAGES[idx]);
      }
    },
    [sendActionValue]
  );

  return { playSuccessMessage };
};
