export const CLOTHING_CATEGORIES = {
  TOP: 'верх',
  BOTTOM: 'низ',
  UNDERWEAR: 'нижнее',
  SOCKS: 'носки',
  WOOL: 'шерсть',
  OTHER: 'другое',
};

export const CATEGORY_OPTIONS = [
  { value: CLOTHING_CATEGORIES.TOP, label: '👕 Верх (Футболки/Рубашки)' },
  { value: CLOTHING_CATEGORIES.BOTTOM, label: '👖 Низ (Брюки/Джинсы)' },
  { value: CLOTHING_CATEGORIES.UNDERWEAR, label: '🩲 Нижнее бельё' },
  { value: CLOTHING_CATEGORIES.SOCKS, label: '🧦 Носки' },
  { value: CLOTHING_CATEGORIES.WOOL, label: '🧶 Шерсть (Свитера/Пальто)' },
  { value: CLOTHING_CATEGORIES.OTHER, label: '📦 Другое' },
];

export const FOLDING_INSTRUCTIONS = {
  [CLOTHING_CATEGORIES.TOP]: 'Сложите пополам вдоль, затем ещё раз пополам',
  [CLOTHING_CATEGORIES.BOTTOM]: 'Сложите пополам по длине, затем втрое',
  [CLOTHING_CATEGORIES.UNDERWEAR]: 'Аккуратно сложите пополам',
  [CLOTHING_CATEGORIES.SOCKS]: 'Сложите вместе и заверните один в другой',
  [CLOTHING_CATEGORIES.WOOL]: 'Сложите пополам, рукава к центру, не вешать!',
  [CLOTHING_CATEGORIES.OTHER]: 'Аккуратно сложите и уберите в шкаф',
};

export const WASHING_INSTRUCTIONS = {
  [CLOTHING_CATEGORIES.TOP]: '30°C, деликатный режим. Сушить в расправленном виде.',
  [CLOTHING_CATEGORIES.BOTTOM]: 'Вывернуть наизнанку. 30-40°C.',
  [CLOTHING_CATEGORIES.UNDERWEAR]: 'Ручная стирка или деликатный режим.',
  [CLOTHING_CATEGORIES.SOCKS]: 'Стирать в мешочке при 40°C.',
  [CLOTHING_CATEGORIES.WOOL]: 'Только ручная стирка. Сушить горизонтально!',
  [CLOTHING_CATEGORIES.OTHER]: 'Стирать согласно ярлыку.',
};

export const SUCCESS_MESSAGES = [
  'Отлично сложено!',
  'Прекрасная работа!',
  'Теперь в шкафу порядок!',
];

export const ASSISTANT_IGNORED_WORDS = [
  'добавить', 'положить', 'складывай', 'новая', 'вещь', 'одежда',
  'удалить', 'убрать', 'выполнил', 'готово', 'сделал', 'сложил',
  'напомнить', 'постирать', 'уход',
];
