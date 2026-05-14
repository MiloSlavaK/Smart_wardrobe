/**
 * Скрипт обработки голосовых команд от SmartApp Сбера
 * Обрабатывает все интенты, определённые в sberbot.json
 */

import { CLOTHING_CATEGORIES, FOLDING_INSTRUCTIONS, WASHING_INSTRUCTIONS } from '../constants/clothingData';
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
          message: 'Пожалуйста, назовите вещь, которую хотите добавить'
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
        data: newItem
      };
    }

    case 'done_clothing': {
      const itemId = parameters?.id || parameters?.item_id;

      if (!itemId) {
        return {
          success: false,
          error: 'Не указан ID вещи',
          message: 'Пожалуйста, уточните, какую вещь вы сложили'
        };
      }

      const item = items.find(i => i.id === itemId);
      if (!item) {
        return {
          success: false,
          error: 'Вещь не найдена',
          message: 'Вещь с таким идентификатором не найдена'
        };
      }

      toggleItemCompleted(itemId);

      return {
        success: true,
        message: `Отлично! Вещь "${item.name}" отмечена как сложенная.`,
        data: { id: itemId, completed: true }
      };
    }

    case 'delete_clothing': {
      const itemId = parameters?.id || parameters?.item_id;

      if (!itemId) {
        return {
          success: false,
          error: 'Не указан ID вещи',
          message: 'Пожалуйста, уточните, какую вещь удалить'
        };
      }

      const item = items.find(i => i.id === itemId);
      if (!item) {
        return {
          success: false,
          error: 'Вещь не найдена',
          message: 'Вещь с таким идентификатором не найдена'
        };
      }

      deleteItem(itemId);

      return {
        success: true,
        message: `Вещь "${item.name}" удалена из гардероба.`,
        data: { id: itemId, deleted: true }
      };
    }

    case 'set_reminder': {
      const itemId = parameters?.id || parameters?.item_id;
      const date = parameters?.date;

      if (!itemId) {
        return {
          success: false,
          error: 'Не указан ID вещи',
          message: 'Пожалуйста, уточните, для какой вещи установить напоминание'
        };
      }

      if (!date) {
        return {
          success: false,
          error: 'Не указана дата',
          message: 'Пожалуйста, укажите дату напоминания'
        };
      }

      const item = items.find(i => i.id === itemId);
      if (!item) {
        return {
          success: false,
          error: 'Вещь не найдена',
          message: 'Вещь с таким идентификатором не найдена'
        };
      }

      updateReminder(itemId, date);

      return {
        success: true,
        message: `Напоминание для "${item.name}" установлено на ${date}.`,
        data: { id: itemId, reminder: date }
      };
    }

    case 'speak_instruction': {
      const itemId = parameters?.id || parameters?.item_id;

      if (!itemId) {
        return {
          success: false,
          error: 'Не указан ID вещи',
          message: 'Пожалуйста, уточните, для какой вещи нужна инструкция'
        };
      }

      const item = items.find(i => i.id === itemId);
      if (!item) {
        return {
          success: false,
          error: 'Вещь не найдена',
          message: 'Вещь с таким идентификатором не найдена'
        };
      }

      const instructionText = `Как сложить ${item.name}: ${item.instruction}`;

      return {
        success: true,
        message: instructionText,
        speak: instructionText,
        data: { id: itemId, instruction: item.instruction }
      };
    }

    case 'speak_washing': {
      const itemId = parameters?.id || parameters?.item_id;

      if (!itemId) {
        return {
          success: false,
          error: 'Не указан ID вещи',
          message: 'Пожалуйста, уточните, для какой вещи нужен совет по стирке'
        };
      }

      const item = items.find(i => i.id === itemId);
      if (!item) {
        return {
          success: false,
          error: 'Вещь не найдена',
          message: 'Вещь с таким идентификатором не найдена'
        };
      }

      const washingText = `Совет по стирке для ${item.name}: ${item.washing}`;

      return {
        success: true,
        message: washingText,
        speak: washingText,
        data: { id: itemId, washing: item.washing }
      };
    }

    case 'list_items': {
      // Команда для получения списка всех вещей
      if (items.length === 0) {
        return {
          success: true,
          message: 'В вашем гардеробе пока нет вещей. Добавьте первую!',
          data: { items: [] }
        };
      }

      const itemsList = items.map((item, index) => `${index + 1}. ${item.name} (${item.category})`).join(', ');

      return {
        success: true,
        message: `В вашем гардеробе ${items.length} вещей: ${itemsList}`,
        data: { items }
      };
    }

    case 'find_item': {
      // Поиск вещи по названию
      const searchQuery = parameters?.query || parameters?.name;

      if (!searchQuery) {
        return {
          success: false,
          error: 'Не указан поисковый запрос',
          message: 'Пожалуйста, назовите вещь, которую хотите найти'
        };
      }

      const foundItems = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (foundItems.length === 0) {
        return {
          success: true,
          message: `Вещи с названием "${searchQuery}" не найдено`,
          data: { items: [] }
        };
      }

      const itemsList = foundItems.map((item, index) => `${index + 1}. ${item.name} (${item.category})`).join(', ');

      return {
        success: true,
        message: `Найдено ${foundItems.length} вещей: ${itemsList}`,
        data: { items: foundItems }
      };
    }

    default:
      console.warn('Неизвестный тип действия:', action_id);
      return {
        success: false,
        error: 'Неизвестное действие',
        message: 'Команда не распознана. Попробуйте сказать иначе.'
      };
  }
};

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

/**
 * Парсинг названия категории из голосовой команды
 * @param {string} categoryName - название категории от пользователя
 * @returns {string} нормализованное значение категории
 */
export const parseCategory = (categoryName) => {
  if (!categoryName) return CLOTHING_CATEGORIES.OTHER;

  const normalized = categoryName.toLowerCase().trim();

  const categoryMap = {
    'верх': CLOTHING_CATEGORIES.TOP,
    'футболка': CLOTHING_CATEGORIES.TOP,
    'рубашка': CLOTHING_CATEGORIES.TOP,
    'низ': CLOTHING_CATEGORIES.BOTTOM,
    'брюки': CLOTHING_CATEGORIES.BOTTOM,
    'джинсы': CLOTHING_CATEGORIES.BOTTOM,
    'штаны': CLOTHING_CATEGORIES.BOTTOM,
    'нижнее': CLOTHING_CATEGORIES.UNDERWEAR,
    'бельё': CLOTHING_CATEGORIES.UNDERWEAR,
    'носки': CLOTHING_CATEGORIES.SOCKS,
    'шерсть': CLOTHING_CATEGORIES.WOOL,
    'свитер': CLOTHING_CATEGORIES.WOOL,
    'пальто': CLOTHING_CATEGORIES.WOOL,
    'другое': CLOTHING_CATEGORIES.OTHER,
  };

  for (const [key, value] of Object.entries(categoryMap)) {
    if (normalized.includes(key)) {
      return value;
    }
  }

  return CLOTHING_CATEGORIES.OTHER;
};

/**
 * Извлечение ID вещи из параметров
 * Поддерживает различные форматы ID
 * @param {Object} parameters - параметры от SmartApp
 * @returns {string|null} ID вещи или null
 */
export const extractItemId = (parameters) => {
  if (!parameters) return null;

  // Прямой ID
  if (parameters.id) return parameters.id;
  if (parameters.item_id) return parameters.item_id;

  // Номер позиции в списке (для голосового выбора "первая", "вторая" и т.д.)
  if (parameters.number) {
    const num = parseInt(parameters.number, 10);
    if (!isNaN(num) && num > 0) {
      return `item-${num}`;
    }
  }

  // Название вещи (для поиска)
  if (parameters.name) {
    return parameters.name;
  }

  return null;
};

export default {
  handleSmartAppAction,
  createSmartAppResponse,
  parseCategory,
  extractItemId
};
