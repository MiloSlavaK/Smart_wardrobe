// src/hooks/useStorage.js
import { useCallback, useRef } from 'react';

const STORAGE_KEY = 'closet_items_db';
const STORAGE_VERSION = '1.0';

/**
 * Хук для работы с localStorage
 * @param {Function} validateFn - функция валидации элементов
 * @returns {Object} методы для загрузки и сохранения данных
 */
export const useStorage = (validateFn) => {
  const lastSavedRef = useRef(null);

  /**
   * Загрузка данных из localStorage
   * @returns {Array} массив сохранённых элементов
   */
  const loadFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const version = localStorage.getItem(`${STORAGE_KEY}_version`);
      
      if (stored) {
        let items = JSON.parse(stored);
        
        // Миграция данных при изменении версии
        if (version !== STORAGE_VERSION) {
          items = items.map(item => ({
            ...item,
            createdAt: item.createdAt || Date.now(),
            updatedAt: item.updatedAt || Date.now(),
            tags: item.tags || [],
          }));
          localStorage.setItem(`${STORAGE_KEY}_version`, STORAGE_VERSION);
        }
        
        // Фильтрация невалидных элементов
        return items.filter(item => validateFn(item));
      }
    } catch (e) {
      console.error('❌ Load error:', e);
    }
    return [];
  }, [validateFn]);

  /**
   * Сохранение данных в localStorage с резервным копированием
   * @param {Array} items - массив элементов для сохранения
   */
  const saveToStorage = useCallback((items) => {
    try {
      const backup = localStorage.getItem(STORAGE_KEY);
      if (backup) {
        localStorage.setItem(`${STORAGE_KEY}_backup`, backup);
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      localStorage.setItem(`${STORAGE_KEY}_version`, STORAGE_VERSION);
      lastSavedRef.current = items;
    } catch (e) {
      console.error('❌ Save error:', e);
      
      // Попытка восстановления из резервной копии
      try {
        const backup = localStorage.getItem(`${STORAGE_KEY}_backup`);
        if (backup) {
          localStorage.setItem(STORAGE_KEY, backup);
        }
      } catch (err) {
        console.error('❌ Backup restore failed:', err);
      }
    }
  }, []);

  return { loadFromStorage, saveToStorage, lastSavedRef, STORAGE_KEY, STORAGE_VERSION };
};

export default useStorage;
