// src/utils/helpers.js

// 🔥 Генерация уникального ID
export const generateId = (prefix = 'item') =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// 🔥 Дефолтные инструкции по категориям
export const getDefaultInstruction = (category) => {
  const map = {
    верх: 'Сложите пополам вдоль, затем ещё раз пополам',
    низ: 'Сложите по швам, избегая заломов',
    платье: 'Повесьте на плечики или сложите втрое',
    бельё: 'Аккуратно сверните в рулон',
    обувь: 'Используйте формодержатели, храните в коробках',
    аксессуары: 'Разложите по органайзерам по типу',
    другое: 'Сложите аккуратно по швам',
  };
  return map[category?.toLowerCase()] || map['другое'];
};

// 🔥 Дефолтные советы по стирке
export const getDefaultWashing = (category) => {
  const map = {
    верх: '30°C, деликатный режим. Сушить в расправленном виде.',
    низ: '40°C, можно отжим. Сушить на верёвке.',
    платье: 'Химчистка или 30°C без отжима.',
    бельё: '30°C, без кондиционера. Сушить горизонтально.',
    обувь: 'Чистить влажной тканью. Не стирать в машине.',
    аксессуары: 'Протирать сухой тканью. Избегать влаги.',
    другое: 'Следуйте инструкции на ярлычке.',
  };
  return map[category?.toLowerCase()] || map['другое'];
};

// 🔥 Валидация элемента гардероба
export const validateClosetItem = (item, options = {}) => {
  const { partial = false } = options;

  if (!item || typeof item !== 'object') return false;

  // 🔹 Обязательные поля для полного объекта
  if (!partial && !item.id) return false;
  if (!partial && !item.name?.trim()) return false;

  // 🔹 Проверка типов
  if (item.name && typeof item.name !== 'string') return false;
  if (item.category && typeof item.category !== 'string') return false;
  if (item.completed !== undefined && typeof item.completed !== 'boolean') return false;
  if (item.tags && !Array.isArray(item.tags)) return false;

  // 🔹 Проверка дат (если есть)
  if (item.createdAt && isNaN(new Date(item.createdAt).getTime())) return false;
  if (item.updatedAt && isNaN(new Date(item.updatedAt).getTime())) return false;

  return true;
};

// 🔥 Форматирование даты для напоминаний
export const formatDate = (date, locale = 'ru-RU') => {
  if (!date) return '';
  try {
    return new Date(date).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return String(date);
  }
};

// 🔥 Парсинг относительных дат ("через 3 дня", "на следующей неделе")
export const parseRelativeDate = (text) => {
  const now = new Date();
  const lower = text.toLowerCase();

  if (lower.includes('сегодня')) return now;
  if (lower.includes('завтра')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }

  const daysMatch = lower.match(/через\s+(\d+)\s*дн/);
  if (daysMatch) {
    const date = new Date(now);
    date.setDate(date.getDate() + parseInt(daysMatch[1]));
    return date;
  }

  const weeksMatch = lower.match(/на\s+следующей\s+неделе/);
  if (weeksMatch) {
    const date = new Date(now);
    date.setDate(date.getDate() + 7);
    return date;
  }

  // 🔹 Попытка распарсить как обычную дату
  const parsed = new Date(text);
  if (!isNaN(parsed.getTime())) return parsed;

  return null;
};
// src/utils/helpers.js

// ... ваши существующие экспорты

/**
 * Проверяет, наступила ли дата напоминания
 * (сравнение по дням, время игнорируется)
 */
export const isDue = (reminderDate) => {
  if (!reminderDate) return false;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const dueDate = new Date(reminderDate);
  dueDate.setHours(0, 0, 0, 0);

  return dueDate <= now;
};