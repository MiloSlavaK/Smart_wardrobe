// src/hooks/useClosetItem.js
import { useCallback, useMemo } from 'react';
import { generateId, getDefaultInstruction, getDefaultWashing, validateClosetItem } from '../utils/helpers';

/**
 * Хук для управления операциями с элементами гардероба
 * @param {Array} items - текущий список вещей
 * @param {Function} setItems - функция обновления списка
 * @returns {Object} методы для CRUD операций и статистики
 */
export const useClosetItem = (items, setItems) => {
  /**
   * Добавление новой вещи
   * @param {Object} itemData - данные вещи
   * @returns {Object|null} добавленную вещь или null при ошибке
   */
  const addItem = useCallback((itemData) => {
    if (!validateClosetItem(itemData, { partial: true })) {
      return null;
    }

    const {
      id,
      name,
      category,
      instruction,
      washing,
      nextReminder,
      tags = [],
    } = itemData;

    const newItem = {
      id: id || generateId(),
      name: name?.trim() || 'Новая вещь',
      category: category?.trim() || 'другое',
      instruction: instruction?.trim() || getDefaultInstruction(category),
      washing: washing?.trim() || getDefaultWashing(category),
      nextReminder: nextReminder || '',
      completed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: Array.isArray(tags) ? tags : [],
      voiceAliases: [name?.toLowerCase(), category?.toLowerCase()].filter(Boolean),
    };

    setItems(prev => [...prev, newItem]);
    return newItem;
  }, [setItems]);

  /**
   * Переключение статуса выполнения (сложено/не сложено)
   * @param {string} id - ID вещи
   */
  const toggleItemCompleted = useCallback((id) => {
    setItems(prev => prev.map(item =>
      item.id === id
        ? { ...item, completed: !item.completed, updatedAt: Date.now() }
        : item
    ));
  }, [setItems]);

  /**
   * Удаление вещи
   * @param {string} id - ID вещи
   */
  const deleteItem = useCallback((id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, [setItems]);

  /**
   * Обновление напоминания
   * @param {string} id - ID вещи
   * @param {string} date - дата напоминания
   */
  const updateReminder = useCallback((id, date) => {
    if (!date) return;
    setItems(prev => prev.map(item =>
      item.id === id
        ? { ...item, nextReminder: date, updatedAt: Date.now() }
        : item
    ));
  }, [setItems]);

  /**
   * Статистика по гардеробу
   */
  const stats = useMemo(() => ({
    total: items.length,
    completed: items.filter(i => i.completed).length,
    pending: items.filter(i => !i.completed).length,
    categories: [...new Set(items.map(i => i.category))],
    withReminders: items.filter(i => i.nextReminder).length,
    lastUpdated: Math.max(...items.map(i => i.updatedAt || 0), 0),
  }), [items]);

  /**
   * Состояние для восстановления
   */
  const getRecoveryState = useCallback(() => ({
    itemCount: items.length,
    lastItemIds: items.slice(-5).map(i => i.id),
    lastUpdate: stats.lastUpdated,
    version: '1.0',
  }), [items, stats.lastUpdated]);

  return {
    addItem,
    toggleItemCompleted,
    deleteItem,
    updateReminder,
    stats,
    getRecoveryState,
  };
};

export default useClosetItem;
