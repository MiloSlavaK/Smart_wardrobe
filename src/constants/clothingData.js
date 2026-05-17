// src/constants/clothingData.js

// 🔹 Сообщения об успехе (озвучиваются ассистентом)
export const SUCCESS_MESSAGES = [
  'Отлично! Вещь убрана.',
  'Готово! Теперь ваш шкаф ещё аккуратнее.',
  'Принято! Я запомнила, что вы сложили эту вещь.',
  'Замечательно! Так держать.',
  'Супер! Вещь на своём месте.',
];

// 🔹 Игнорируемые слова для распознавания
export const ASSISTANT_IGNORED_WORDS = [
  'добавь', 'удали', 'убери', 'сложи', 'готово',
  'вещь', 'одежду', 'шкаф', 'категория', 'напомни',
  'покажи', 'список', 'мой', 'гардероб',
];

// 🔹 Конфигурация голосовых ответов
export const ASSISTANT_VOICE_CONFIG = {
  // 🔸 В production всегда false — озвучка только через ассистента
  enableDevTts: process.env.NODE_ENV === 'development',

  // 🔸 Поддерживаемые эмоции ассистента (зависит от бэкенда)
  supportedEmotions: ['friendly', 'helpful', 'positive', 'concerned', 'neutral'],

  // 🔸 Язык озвучки
  language: 'ru-RU',
};
// src/constants/clothingData.js

// ... ваши существующие экспорты (SUCCESS_MESSAGES, ASSISTANT_IGNORED_WORDS, ASSISTANT_VOICE_CONFIG)

/**
 * Массив категорий одежды для валидации и логики
 */
export const CLOTHING_CATEGORIES = [
  'верх',
  'низ',
  'платье',
  'бельё',
  'обувь',
  'аксессуары',
  'другое'
];

/**
 * Варианты для UI-выпадающих списков (value + label)
 */
export const CATEGORY_OPTIONS = CLOTHING_CATEGORIES.map(cat => ({
  value: cat,
  label: cat.charAt(0).toUpperCase() + cat.slice(1)
}));