/**
 * Скрипт обработки голосовых команд от SmartApp Сбера
 * Обрабатывает все интенты, определённые в sberbot.json
 */

import { CLOTHING_CATEGORIES } from '../constants/clothingData';
import { generateId, getDefaultInstruction, getDefaultWashing } from '../utils/helpers';

/**
 * Обработчик действий от SmartApp
 * @param {Object} action - объект действия от ассистента
 * @param {Object} context - контекст с методами управления данными
 * @returns {Object} результат выполнения действия
 */
export const handleSmartAppAction = (action, context) => {
  const { addItem, toggleItemCompleted, deleteItem, updateReminder, items } = context;

  if (!action || !action.action_id) {
    console.warn('Получено некорректное действие:', action);
    return { success: false, error: 'Некорректное действие' };
  }

  const { action_id, parameters } = action;

  switch (action_id) {
    case 'add_clothing': {
      const name = parameters?.name || parameters?.value;
      const category = parameters?.category || CLOTHING_CATEGORIES.OTHER;

      if (!name) {
        return {
          success: false,
          error: 'Не указано название вещи',
          message: 'Пожалуйста, назовите вещь, которую хотите добавить',
        };
      }

      const newItem = {
        id: generateId(),
        name,
        category: category || CLOTHING_CATEGORIES.OTHER,
        instruction: getDefaultInstruction(category),
        washing: getDefaultWashing(category),
        nextReminder: '',
        completed: false,
      };

      addItem(newItem);

      return {
        success: true,
        message: `Добавлена вещь: ${name}. Категория: ${category}.`,
        data: newItem,
      };
    }

    case 'done_clothing': {
      const itemId = parameters?.id || parameters?.item_id;

      if (!itemId) {
        return {
          success: false,
          error: 'Не указан ID вещи',
          message: 'Пожалуйста, уточните, какую вещь вы сложили',
        };
      }

      const item = items.find(i => i.id === itemId);
      if (!item) {
        return {
          success: false,
          error: 'Вещь не найдена',
          message: 'Вещь с таким идентификатором не найдена',
        };
      }

      toggleItemCompleted(itemId);

      return {
        success: true,
        message: `Отлично! Вещь "${item.name}" отмечена как сложенная.`,
        data: { id: itemId, completed: true },
      };
    }

    case 'delete_clothing': {
      const itemId = parameters?.id || parameters?.item_id;

      if (!itemId) {
        return {
          success: false,
          error: 'Не указан ID вещи',
          message: 'Пожалуйста, уточните, какую вещь удалить',
        };
      }

      const item = items.find(i => i.id === itemId);
      if (!item) {
        return {
          success: false,
          error: 'Вещь не найдена',
          message: 'Вещь с таким идентификатором не найдена',
        };
      }

      deleteItem(itemId);

      return {
        success: true,
        message: `Вещь "${item.name}" удалена из гардероба.`,
        data: { id: itemId, deleted: true },
      };
    }

    case 'set_reminder': {
      const itemId = parameters?.id || parameters?.item_id;
      const date = parameters?.date;

      if (!itemId) {
        return {
          success: false,
          error: 'Не указан ID вещи',
          message: 'Пожалуйста, уточните, для какой вещи установить напоминание',
        };
      }

      if (!date) {
        return {
          success: false,
          error: 'Не указана дата',
          message: 'Пожалуйста, укажите дату напоминания',
        };
      }

      const item = items.find(i => i.id === itemId);
      if (!item) {
        return {
          success: false,
          error: 'Вещь не найдена',
          message: 'Вещь с таким идентификатором не найдена',
        };
      }

      updateReminder(itemId, date);

      return {
        success: true,
        message: `Напоминание для "${item.name}" установлено на ${date}.`,
        data: { id: itemId, reminder: date },
      };
    }

    case 'speak_instruction': {
      const itemId = parameters?.id || parameters?.item_id;

      if (!itemId) {
        return {
          success: false,
          error: 'Не указан ID вещи',
          message: 'Пожалуйста, уточните, для какой вещи нужна инструкция',
        };
      }

      const item = items.find(i => i.id === itemId);
      if (!item) {
        return {
          success: false,
          error: 'Вещь не найдена',
          message: 'Вещь с таким идентификатором не найдена',
        };
      }

      const instructionText = `Как сложить ${item.name}: ${item.instruction}`;

      return {
        success: true,
        message: instructionText,
        speak: instructionText,
        data: { id: itemId, instruction: item.instruction },
      };
    }

    case 'speak_washing': {
      const itemId = parameters?.id || parameters?.item_id;

      if (!itemId) {
        return {
          success: false,
          error: 'Не указан ID вещи',
          message: 'Пожалуйста, уточните, для какой вещи нужен совет по стирке',
        };
      }

      const item = items.find(i => i.id === itemId);
      if (!item) {
        return {
          success: false,
          error: 'Вещь не найдена',
          message: 'Вещь с таким идентификатором не найдена',
        };
      }

      const washingText = `Совет по стирке для ${item.name}: ${item.washing}`;

      return {
        success: true,
        message: washingText,
        speak: washingText,
        data: { id: itemId, washing: item.washing },
      };
    }

    case 'list_items': {
      if (items.length === 0) {
        return {
          success: true,
          message: 'В вашем гардеробе пока нет вещей. Добавьте первую!',
          data: { items: [] },
        };
      }

      const itemsList = items.map((item, index) => `${index + 1}. ${item.name} (${item.category})`).join(', ');

      return {
        success: true,
        message: `В вашем гардеробе ${items.length} вещей: ${itemsList}`,
        data: { items },
      };
    }

    case 'find_item': {
      const searchQuery = parameters?.query || parameters?.name;

      if (!searchQuery) {
        return {
          success: false,
          error: 'Не указан поисковый запрос',
          message: 'Пожалуйста, назовите вещь, которую хотите найти',
        };
      }

      const foundItems = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (foundItems.length === 0) {
        return {
          success: true,
          message: `Вещи с названием "${searchQuery}" не найдено`,
          data: { items: [] },
        };
      }

      const itemsList = foundItems.map((item, index) => `${index + 1}. ${item.name} (${item.category})`).join(', ');

      return {
        success: true,
        message: `Найдено ${foundItems.length} вещей: ${itemsList}`,
        data: { items: foundItems },
      };
    }

    default:
      console.warn('Неизвестный тип действия:', action_id);
      return {
        success: false,
        error: 'Неизвестное действие',
        message: 'Команда не распознана. Попробуйте сказать иначе.',
      };
  }
};

/**
 * Карта «название вещи → категория» (именительный падеж, нижний регистр).
 * Дублирует логику inferCategory в сценарии (scenario/src/js/api.js),
 * используется как резерв на стороне фронта.
 */
const CATEGORY_BY_NAME = {
  платье: CLOTHING_CATEGORIES.DRESS,
  юбка: CLOTHING_CATEGORIES.DRESS,
  блузка: CLOTHING_CATEGORIES.TOP,
  блуза: CLOTHING_CATEGORIES.TOP,
  футболка: CLOTHING_CATEGORIES.TOP,
  рубашка: CLOTHING_CATEGORIES.TOP,
  майка: CLOTHING_CATEGORIES.TOP,
  топ: CLOTHING_CATEGORIES.TOP,
  водолазка: CLOTHING_CATEGORIES.TOP,
  поло: CLOTHING_CATEGORIES.TOP,
  толстовка: CLOTHING_CATEGORIES.TOP,
  худи: CLOTHING_CATEGORIES.TOP,
  свитшот: CLOTHING_CATEGORIES.TOP,
  пиджак: CLOTHING_CATEGORIES.TOP,
  жакет: CLOTHING_CATEGORIES.TOP,
  жилет: CLOTHING_CATEGORIES.TOP,
  куртка: CLOTHING_CATEGORIES.TOP,
  пуховик: CLOTHING_CATEGORIES.TOP,
  ветровка: CLOTHING_CATEGORIES.TOP,
  плащ: CLOTHING_CATEGORIES.TOP,
  свитер: CLOTHING_CATEGORIES.WOOL,
  кардиган: CLOTHING_CATEGORIES.WOOL,
  пальто: CLOTHING_CATEGORIES.WOOL,
  дублёнка: CLOTHING_CATEGORIES.WOOL,
  дубленка: CLOTHING_CATEGORIES.WOOL,
  джинсы: CLOTHING_CATEGORIES.BOTTOM,
  брюки: CLOTHING_CATEGORIES.BOTTOM,
  штаны: CLOTHING_CATEGORIES.BOTTOM,
  шорты: CLOTHING_CATEGORIES.BOTTOM,
  леггинсы: CLOTHING_CATEGORIES.BOTTOM,
  лосины: CLOTHING_CATEGORIES.BOTTOM,
  бельё: CLOTHING_CATEGORIES.UNDERWEAR,
  белье: CLOTHING_CATEGORIES.UNDERWEAR,
  трусы: CLOTHING_CATEGORIES.UNDERWEAR,
  носки: CLOTHING_CATEGORIES.SOCKS,
  носок: CLOTHING_CATEGORIES.SOCKS,
  колготки: CLOTHING_CATEGORIES.SOCKS,
  чулки: CLOTHING_CATEGORIES.SOCKS,
  шарф: CLOTHING_CATEGORIES.ACCESSORIES,
  шапка: CLOTHING_CATEGORIES.ACCESSORIES,
  кепка: CLOTHING_CATEGORIES.ACCESSORIES,
  бейсболка: CLOTHING_CATEGORIES.ACCESSORIES,
  шляпа: CLOTHING_CATEGORIES.ACCESSORIES,
  панама: CLOTHING_CATEGORIES.ACCESSORIES,
  перчатки: CLOTHING_CATEGORIES.ACCESSORIES,
  варежки: CLOTHING_CATEGORIES.ACCESSORIES,
  ремень: CLOTHING_CATEGORIES.ACCESSORIES,
  галстук: CLOTHING_CATEGORIES.ACCESSORIES,
  туфли: CLOTHING_CATEGORIES.SHOES,
  ботинки: CLOTHING_CATEGORIES.SHOES,
  кроссовки: CLOTHING_CATEGORIES.SHOES,
  кеды: CLOTHING_CATEGORIES.SHOES,
  сапоги: CLOTHING_CATEGORIES.SHOES,
  сандали: CLOTHING_CATEGORIES.SHOES,
  тапки: CLOTHING_CATEGORIES.SHOES,
  тапочки: CLOTHING_CATEGORIES.SHOES,
  мокасины: CLOTHING_CATEGORIES.SHOES,
  угги: CLOTHING_CATEGORIES.SHOES,
  балетки: CLOTHING_CATEGORIES.SHOES,
};

/**
 * Определяет категорию по названию вещи.
 * @param {string} name - название вещи
 * @returns {string} категория из CLOTHING_CATEGORIES (по умолчанию OTHER)
 */
export const parseCategory = (name) => {
  if (!name || typeof name !== 'string') return CLOTHING_CATEGORIES.OTHER;
  const lower = name.toLowerCase().trim();
  if (CATEGORY_BY_NAME[lower]) return CATEGORY_BY_NAME[lower];
  for (const key of Object.keys(CATEGORY_BY_NAME)) {
    if (lower.includes(key)) return CATEGORY_BY_NAME[key];
  }
  return CLOTHING_CATEGORIES.OTHER;
};

/**
 * Извлекает идентификатор вещи из параметров действия.
 * @param {Object} parameters - параметры действия
 * @returns {string|null} id вещи или null
 */
export const extractItemId = (parameters) =>
  parameters?.id || parameters?.item_id || null;

/**
 * Генерация ответа для SmartApp
 * @param {Object} result - результат обработки действия
 * @returns {Object} форматированный ответ для ассистента
 */
export const createSmartAppResponse = (result) => {
  const response = {
    success: result.success,
    message: result.message || 'Произошла ошибка при выполнении команды',
  };

  if (result.speak) {
    response.speech = result.speak;
  }

  if (result.data) {
    response.data = result.data;
  }

  if (!result.success && result.error) {
    response.error = result.error;
  }

  return response;
};

