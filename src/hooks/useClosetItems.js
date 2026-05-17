// src/hooks/useClosetItems.js
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { generateId, getDefaultInstruction, getDefaultWashing, validateClosetItem } from '../utils/helpers';

const STORAGE_KEY = 'closet_items_db';
const STORAGE_VERSION = '1.0';

// 🔥 Загрузка данных из localStorage с миграцией и валидацией
const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const version = localStorage.getItem(`${STORAGE_KEY}_version`);
    
    if (stored) {
      let items = JSON.parse(stored);
      
      // 🔹 Миграция данных при изменении версии
      if (version !== STORAGE_VERSION) {
        console.log('🔄 Migrating storage from', version, 'to', STORAGE_VERSION);
        items = migrateItems(items, version);
        localStorage.setItem(`${STORAGE_KEY}_version`, STORAGE_VERSION);
      }
      
      // 🔹 Валидация и фильтрация некорректных элементов
      return items.filter(item => validateClosetItem(item));
    }
  } catch (error) {
    console.error('❌ Error loading from localStorage:', error);
    // 🔹 Попытка восстановить данные из бэкапа
    try {
      const backup = localStorage.getItem(`${STORAGE_KEY}_backup`);
      if (backup) return JSON.parse(backup);
    } catch (e) {
      console.error('❌ Backup recovery failed:', e);
    }
  }
  return [];
};

// 🔥 Миграция данных между версиями
const migrateItems = (items, fromVersion) => {
  if (!fromVersion || fromVersion === '1.0') {
    // Пример миграции: добавление новых полей
    return items.map(item => ({
      ...item,
      createdAt: item.createdAt || Date.now(),
      updatedAt: item.updatedAt || Date.now(),
      tags: item.tags || [],
    }));
  }
  return items;
};

// 🔥 Сохранение данных в localStorage с бэкапом
const saveToStorage = (items) => {
  try {
    // Создаём бэкап перед записью
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) {
      localStorage.setItem(`${STORAGE_KEY}_backup`, current);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    localStorage.setItem(`${STORAGE_KEY}_version`, STORAGE_VERSION);
  } catch (error) {
    console.error('❌ Error saving to localStorage:', error);
    // 🔹 При ошибке пробуем восстановить из бэкапа
    try {
      const backup = localStorage.getItem(`${STORAGE_KEY}_backup`);
      if (backup) {
        localStorage.setItem(STORAGE_KEY, backup);
        console.log('✅ Restored from backup');
      }
    } catch (e) {
      console.error('❌ Backup restore failed:', e);
    }
  }
};

// 🔥 Debounce-утилита для оптимизации частых сохранений
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

export const useClosetItems = (initialItems = []) => {
  // 🔥 Ленивая инициализация с загрузкой из storage
  const [items, setItems] = useState(() => loadFromStorage());
  
  // 🔥 Реф для отслеживания последнего сохранённого состояния (для оптимизации)
  const lastSavedRef = useRef(items);
  
  // 🔥 Debounced-сохранение: не чаще чем раз в 500мс
  const debouncedSave = useMemo(
    () => debounce((newItems) => {
      if (JSON.stringify(newItems) !== JSON.stringify(lastSavedRef.current)) {
        saveToStorage(newItems);
        lastSavedRef.current = newItems;
      }
    }, 500),
    []
  );
  
  // 🔥 Сохранение при изменении с дебаунсом
  useEffect(() => {
    debouncedSave(items);
    
    // 🔹 Cleanup при размонтировании: немедленное сохранение
    return () => {
      debouncedSave.flush?.();
      saveToStorage(items);
    };
  }, [items, debouncedSave]);
  
  // 🔥 Синхронизация с initialItems при первом рендере (если storage пуст)
  useEffect(() => {
    if (items.length === 0 && initialItems.length > 0) {
      setItems(initialItems);
    }
  }, [initialItems, items.length]);
  
  // ➕ Добавление вещи с валидацией и авто-заполнением
  const addItem = useCallback((itemData) => {
    // 🔹 Валидация входных данных
    if (!validateClosetItem(itemData, { partial: true })) {
      console.warn('⚠️ Invalid item data:', itemData);
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
      imageUrl,
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
      imageUrl: imageUrl || null,
      // 🔹 Метаданные для ассистента
      voiceAliases: [
        name?.toLowerCase(),
        category?.toLowerCase(),
        `${category} ${name}`.toLowerCase(),
      ].filter(Boolean),
    };
    
    setItems((prev) => {
      const updated = [...prev, newItem];
      return updated;
    });
    
    return newItem;
  }, []);
  
  // ✅ Переключение статуса "убрано"
  const toggleItemCompleted = useCallback((id) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id 
          ? { ...item, completed: !item.completed, updatedAt: Date.now() } 
          : item
      )
    );
  }, []);
  
  // ❌ Удаление вещи
  const deleteItem = useCallback((id) => {
    setItems((prev) => {
      const item = prev.find(i => i.id === id);
      if (item) {
        console.log('🗑️ Deleted item:', item.name);
      }
      return prev.filter((item) => item.id !== id);
    });
  }, []);
  
  // 🔔 Обновление напоминания
  const updateReminder = useCallback((id, date) => {
    if (!date) {
      console.warn('⚠️ updateReminder called without date');
      return;
    }
    
    setItems((prev) =>
      prev.map((item) =>
        item.id === id 
          ? { ...item, nextReminder: date, updatedAt: Date.now() } 
          : item
      )
    );
  }, []);
  
  // ✏️ Полное обновление вещи (для синхронизации с бэкендом)
  const updateItem = useCallback((id, updates) => {
    if (!validateClosetItem({ ...updates }, { partial: true })) {
      console.warn('⚠️ Invalid update data:', updates);
      return false;
    }
    
    setItems((prev) =>
      prev.map((item) =>
        item.id === id 
          ? { ...item, ...updates, updatedAt: Date.now() } 
          : item
      )
    );
    return true;
  }, []);
  
  // 🔄 Массовое обновление (для синхронизации после голосовых команд)
  const bulkUpdate = useCallback((updates) => {
    setItems((prev) => {
      const updated = [...prev];
      updates.forEach(({ id, ...changes }) => {
        const idx = updated.findIndex(i => i.id === id);
        if (idx !== -1) {
          updated[idx] = { ...updated[idx], ...changes, updatedAt: Date.now() };
        }
      });
      return updated;
    });
  }, []);
  
  // 🔍 Поиск вещей по названию/категории
  const findItems = useCallback((query) => {
    if (!query) return items;
    
    const lowerQuery = query.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(lowerQuery) ||
      item.category.toLowerCase().includes(lowerQuery) ||
      item.voiceAliases?.some(alias => alias.includes(lowerQuery))
    );
  }, [items]);
  
  // 📊 Статистика для ассистента
  const stats = useMemo(() => ({
    total: items.length,
    completed: items.filter(i => i.completed).length,
    pending: items.filter(i => !i.completed).length,
    categories: [...new Set(items.map(i => i.category))],
    withReminders: items.filter(i => i.nextReminder).length,
    lastUpdated: Math.max(...items.map(i => i.updatedAt || 0), 0),
  }), [items]);
  
  // 🧹 Очистка всей базы данных
  const clearDatabase = useCallback(() => {
    setItems([]);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(`${STORAGE_KEY}_backup`);
    console.log('🧹 Database cleared');
  }, []);
  
  // 🔁 Восстановление из бэкапа
  const restoreFromBackup = useCallback(() => {
    try {
      const backup = localStorage.getItem(`${STORAGE_KEY}_backup`);
      if (backup) {
        const restored = JSON.parse(backup);
        setItems(restored.filter(item => validateClosetItem(item)));
        console.log('✅ Restored from backup');
        return true;
      }
    } catch (error) {
      console.error('❌ Restore failed:', error);
    }
    return false;
  }, []);
  
  // 🔥 Функция для получения recovery state (для ассистента)
  const getRecoveryState = useCallback(() => ({
    itemCount: items.length,
    lastItemIds: items.slice(-5).map(i => i.id),
    lastUpdate: stats.lastUpdated,
    version: STORAGE_VERSION,
  }), [items, stats.lastUpdated]);
  
  return {
    items,
    stats,
    addItem,
    toggleItemCompleted,
    deleteItem,
    updateReminder,
    updateItem,
    bulkUpdate,
    findItems,
    clearDatabase,
    restoreFromBackup,
    getRecoveryState, // 🔥 Для интеграции с assistant.getRecoveryState()
  };
};

export default useClosetItems;