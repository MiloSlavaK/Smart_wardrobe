// src/constants/clothingData.js

// ✅ Сообщения об успехе (озвучиваются ассистентом)
export const SUCCESS_MESSAGES = [
  'Отлично! Вещь убрана.',
  'Готово! Теперь ваш шкаф ещё аккуратнее.',
  'Принято! Я запомнила, что вы сложили эту вещь.',
  'Замечательно! Так держать.',
  'Супер! Вещь на своём месте.',
];

// ✅ Игнорируемые слова для распознавания (помогают бэкенду фильтровать шум)
export const ASSISTANT_IGNORED_WORDS = [
  'добавь', 'удали', 'убери', 'сложи', 'готово',
  'вещь', 'одежду', 'шкаф', 'категория', 'напомни',
  'покажи', 'список', 'мой', 'гардероб', 'задача',
];

// ✅ Категории одежды для валидации
export const CLOTHING_CATEGORIES = [
  'верх', 'низ', 'платье', 'бельё', 'обувь', 'аксессуары', 'другое'
];

// ✅ Варианты для UI-выпадающих списков
export const CATEGORY_OPTIONS = CLOTHING_CATEGORIES.map(cat => ({
  value: cat,
  label: cat.charAt(0).toUpperCase() + cat.slice(1)
}));

// ✅ Конфигурация голосовых ответов
export const ASSISTANT_VOICE_CONFIG = {
  enableDevTts: process.env.NODE_ENV === 'development', // ТОЛЬКО для логов
  supportedEmotions: ['friendly', 'helpful', 'positive', 'concerned', 'neutral'],
  language: 'ru-RU',
};