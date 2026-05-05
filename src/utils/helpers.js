import { CLOTHING_CATEGORIES, FOLDING_INSTRUCTIONS, WASHING_INSTRUCTIONS } from '../constants/clothingData';

export const getDefaultInstruction = (category) => {
  return FOLDING_INSTRUCTIONS[category] || FOLDING_INSTRUCTIONS[CLOTHING_CATEGORIES.OTHER];
};

export const getDefaultWashing = (category) => {
  return WASHING_INSTRUCTIONS[category] || WASHING_INSTRUCTIONS[CLOTHING_CATEGORIES.OTHER];
};

export const isDue = (dateStr) => {
  if (!dateStr) return false;
  return new Date(dateStr) <= new Date();
};

export const speakText = (text, lang = 'ru-RU', rate = 0.9) => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    window.speechSynthesis.speak(utterance);
  }
};

export const generateId = () => {
  return Math.random().toString(36).substring(7);
};
