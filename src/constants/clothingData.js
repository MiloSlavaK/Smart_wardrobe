// src/constants/clothingData.js

/**
 * Категории одежды для классификации вещей
 */
export const CLOTHING_CATEGORIES = {
  TOP: 'верх',
  BOTTOM: 'низ',
  DRESS: 'платье',
  UNDERWEAR: 'бельё',
  SHOES: 'обувь',
  ACCESSORIES: 'аксессуары',
  OTHER: 'другое',
};

/**
 * Список всех категорий для валидации
 */
export const CATEGORY_LIST = Object.values(CLOTHING_CATEGORIES);

/**
 * Варианты для UI-выпадающих списков
 */
export const CATEGORY_OPTIONS = CATEGORY_LIST.map(cat => ({
  value: cat,
  label: cat.charAt(0).toUpperCase() + cat.slice(1),
}));

/**
 * Инструкции по складыванию по категориям
 */
export const FOLDING_INSTRUCTIONS = {
  [CLOTHING_CATEGORIES.TOP]: 'Сложите пополам вдоль, затем ещё раз пополам',
  [CLOTHING_CATEGORIES.BOTTOM]: 'Сложите по швам, избегая заломов',
  [CLOTHING_CATEGORIES.DRESS]: 'Повесьте на плечики или сложите втрое',
  [CLOTHING_CATEGORIES.UNDERWEAR]: 'Аккуратно сверните в рулон',
  [CLOTHING_CATEGORIES.SHOES]: 'Используйте формодержатели, храните в коробках',
  [CLOTHING_CATEGORIES.ACCESSORIES]: 'Разложите по органайзерам по типу',
  [CLOTHING_CATEGORIES.OTHER]: 'Сложите аккуратно по швам',
};

/**
 * Советы по стирке по категориям
 */
export const WASHING_INSTRUCTIONS = {
  [CLOTHING_CATEGORIES.TOP]: '30°C, деликатный режим. Сушить в расправленном виде.',
  [CLOTHING_CATEGORIES.BOTTOM]: '40°C, можно отжим. Сушить на верёвке.',
  [CLOTHING_CATEGORIES.DRESS]: 'Химчистка или 30°C без отжима.',
  [CLOTHING_CATEGORIES.UNDERWEAR]: '30°C, без кондиционера. Сушить горизонтально.',
  [CLOTHING_CATEGORIES.SHOES]: 'Чистить влажной тканью. Не стирать в машине.',
  [CLOTHING_CATEGORIES.ACCESSORIES]: 'Протирать сухой тканью. Избегать влаги.',
  [CLOTHING_CATEGORIES.OTHER]: 'Следуйте инструкции на ярлычке.',
};

/**
 * Сообщения об успехе (озвучиваются ассистентом)
 */
export const SUCCESS_MESSAGES = [
  'Отлично! Вещь убрана.',
  'Готово! Теперь ваш шкаф ещё аккуратнее.',
  'Принято! Я запомнила, что вы сложили эту вещь.',
  'Замечательно! Так держать.',
  'Супер! Вещь на своём месте.',
];

/**
 * Игнорируемые слова для распознавания (помогают бэкенду фильтровать шум)
 */
export const ASSISTANT_IGNORED_WORDS = [
  'добавь', 'удали', 'убери', 'сложи', 'готово',
  'вещь', 'одежду', 'шкаф', 'категория', 'напомни',
  'покажи', 'список', 'мой', 'гардероб', 'задача',
];

/**
 * Конфигурация голосовых ответов
 */
export const ASSISTANT_VOICE_CONFIG = {
  enableDevTts: process.env.NODE_ENV === 'development',
  supportedEmotions: ['friendly', 'helpful', 'positive', 'concerned', 'neutral'],
  language: 'ru-RU',
};