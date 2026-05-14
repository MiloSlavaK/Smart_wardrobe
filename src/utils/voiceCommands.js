/**
 * Скрипт для обработки голосовых команд SmartApp Сбера
 * Содержит дополнительные утилиты и примеры использования
 */

import { CLOTHING_CATEGORIES } from '../constants/clothingData';

/**
 * Список всех поддерживаемых голосовых команд
 */
export const VOICE_COMMANDS = {
  // Добавление вещи
  ADD_CLOTHING: {
    actionId: 'add_clothing',
    examples: [
      'добавить вещь',
      'новая одежда',
      'положить в гардероб',
      'складывай футболку',
      'добавь рубашку',
      'хочу добавить свитер',
      'запиши новую вещь - джинсы',
    ],
    description: 'Добавляет новую вещь в гардероб',
  },

  // Отметка о выполнении
  DONE_CLOTHING: {
    actionId: 'done_clothing',
    examples: [
      'готово',
      'сложил',
      'выполнил',
      'вещь готова',
      'отметить выполненным',
      'я сложил эту вещь',
    ],
    description: 'Отмечает вещь как сложенную',
  },

  // Удаление вещи
  DELETE_CLOTHING: {
    actionId: 'delete_clothing',
    examples: [
      'удалить вещь',
      'убрать одежду',
      'удали футболку',
      'выбросить вещь',
      'убери это из гардероба',
    ],
    description: 'Удаляет вещь из гардероба',
  },

  // Установка напоминания
  SET_REMINDER: {
    actionId: 'set_reminder',
    examples: [
      'напомнить об уходе',
      'установить напоминание',
      'постирать рубашку завтра',
      'напомни про уход',
      'напомни постирать через неделю',
    ],
    description: 'Устанавливает напоминание об уходе за вещью',
  },

  // Озвучивание инструкции по складыванию
  SPEAK_INSTRUCTION: {
    actionId: 'speak_instruction',
    examples: [
      'как сложить',
      'расскажи как складывать',
      'инструкция по складыванию',
      'озвучь инструкцию',
      'как правильно сложить свитер',
    ],
    description: 'Озвучивает инструкцию по складыванию вещи',
  },

  // Озвучивание совета по стирке
  SPEAK_WASHING: {
    actionId: 'speak_washing',
    examples: [
      'как стирать',
      'совет по стирке',
      'режим стирки',
      'озвучь совет по стирке',
      'при какой температуре стирать',
    ],
    description: 'Озвучивает совет по стирке вещи',
  },

  // Список всех вещей
  LIST_ITEMS: {
    actionId: 'list_items',
    examples: [
      'покажи все вещи',
      'что в гардеробе',
      'список вещей',
      'какие у меня есть вещи',
      'покажи мой гардероб',
    ],
    description: 'Показывает список всех вещей в гардеробе',
  },

  // Поиск вещи
  FIND_ITEM: {
    actionId: 'find_item',
    examples: [
      'найди футболку',
      'где моя рубашка',
      'покажи свитер',
      'есть ли у меня джинсы',
      'найди все шерстяные вещи',
    ],
    description: 'Ищет вещь по названию или категории',
  },
};

/**
 * Генерация подсказок для пользователя
 */
export const getVoiceHints = () => {
  return Object.values(VOICE_COMMANDS).map(cmd => ({
    actionId: cmd.actionId,
    hint: cmd.examples[0],
    description: cmd.description,
  }));
};

/**
 * Форматирование даты для напоминаний
 */
export const formatDateForReminder = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (d.toDateString() === today.toDateString()) {
    return 'сегодня';
  } else if (d.toDateString() === tomorrow.toDateString()) {
    return 'завтра';
  } else {
    return d.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'long' 
    });
  }
};

/**
 * Распознавание относительных дат из голосовых команд
 */
export const parseRelativeDate = (text) => {
  const normalized = text.toLowerCase();
  const today = new Date();

  if (normalized.includes('сегодня') || normalized.includes('сейчас')) {
    return today.toISOString().split('T')[0];
  }

  if (normalized.includes('завтра')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  if (normalized.includes('послезавтра')) {
    const afterTomorrow = new Date(today);
    afterTomorrow.setDate(afterTomorrow.getDate() + 2);
    return afterTomorrow.toISOString().split('T')[0];
  }

  if (normalized.includes('через неделю') || normalized.includes('неделю')) {
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  }

  if (normalized.includes('через месяц') || normalized.includes('месяц')) {
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth.toISOString().split('T')[0];
  }

  return null;
};

/**
 * Извлечение названия вещи из голосовой команды
 */
export const extractItemNameFromCommand = (text) => {
  const normalized = text.toLowerCase();
  
  // Ключевые слова для удаления
  const ignoreWords = [
    'добавить', 'положить', 'складывай', 'новая', 'вещь', 'одежда',
    'удалить', 'убрать', 'выполнил', 'готово', 'сделал', 'сложил',
    'напомнить', 'постирать', 'уход', 'как', 'расскажи', 'озвучь',
    'инструкцию', 'совет', 'режим', 'стирку', 'покажи', 'найди', 'где',
  ];

  const words = normalized.split(' ').filter(word => 
    !ignoreWords.includes(word) && word.length > 2
  );

  return words.join(' ') || null;
};

/**
 * Определение категории вещи из текста
 */
export const detectCategoryFromText = (text) => {
  const normalized = text.toLowerCase();

  const categoryKeywords = {
    [CLOTHING_CATEGORIES.TOP]: ['футболка', 'рубашка', 'поло', 'майк', 'толстовк', 'верх'],
    [CLOTHING_CATEGORIES.BOTTOM]: ['брюки', 'джинсы', 'штаны', 'шорты', 'юбк', 'низ'],
    [CLOTHING_CATEGORIES.UNDERWEAR]: ['нижнее', 'бельё', 'трусы', 'лифчик', 'бра'],
    [CLOTHING_CATEGORIES.SOCKS]: ['носки', 'гольфы', 'колготки'],
    [CLOTHING_CATEGORIES.WOOL]: ['шерсть', 'свитер', 'джемпер', 'кардиган', 'пальто', 'пуловер'],
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => normalized.includes(keyword))) {
      return category;
    }
  }

  return CLOTHING_CATEGORIES.OTHER;
};

/**
 * Генерация ответа ассистента
 */
export const generateAssistantResponse = (action, result) => {
  const responses = {
    add_clothing: {
      success: [
        'Добавлено в ваш гардероб!',
        'Вещь успешно добавлена!',
        'Теперь эта вещь в вашем списке!',
      ],
      error: [
        'Не удалось добавить вещь. Попробуйте ещё раз.',
        'Произошла ошибка при добавлении.',
      ],
    },
    done_clothing: {
      success: [
        'Отлично! Вещь сложена!',
        'Прекрасная работа!',
        'Теперь в шкафу порядок!',
      ],
      error: [
        'Не удалось отметить вещь.',
        'Вещь не найдена.',
      ],
    },
    delete_clothing: {
      success: [
        'Вещь удалена из гардероба.',
        'Удалено!',
      ],
      error: [
        'Не удалось удалить вещь.',
        'Вещь не найдена.',
      ],
    },
    set_reminder: {
      success: [
        'Напоминание установлено!',
        'Я напомню вам в нужное время.',
      ],
      error: [
        'Не удалось установить напоминание.',
      ],
    },
    speak_instruction: {
      success: [],
      error: [
        'Инструкция не найдена.',
      ],
    },
    speak_washing: {
      success: [],
      error: [
        'Совет по стирке не найден.',
      ],
    },
  };

  const actionResponses = responses[action];
  if (!actionResponses) return 'Команда выполнена.';

  const responseList = result.success 
    ? actionResponses.success 
    : actionResponses.error;

  if (responseList.length === 0) {
    return result.message || 'Готово!';
  }

  return responseList[Math.floor(Math.random() * responseList.length)];
};

export default {
  VOICE_COMMANDS,
  getVoiceHints,
  formatDateForReminder,
  parseRelativeDate,
  extractItemNameFromCommand,
  detectCategoryFromText,
  generateAssistantResponse,
};
