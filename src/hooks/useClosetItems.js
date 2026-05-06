import { useState, useCallback, useEffect } from 'react';
import { generateId, getDefaultInstruction, getDefaultWashing } from '../utils/helpers';

const STORAGE_KEY = 'closet_items_db';

// Загрузка данных из localStorage
const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Ошибка при загрузке данных из localStorage:', error);
  }
  return [];
};

// Сохранение данных в localStorage
const saveToStorage = (items) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Ошибка при сохранении данных в localStorage:', error);
  }
};

export const useClosetItems = (initialItems = []) => {
  // Инициализируем состояние с данными из localStorage или initialItems
  const [items, setItems] = useState(() => {
    const stored = loadFromStorage();
    return stored.length > 0 ? stored : initialItems;
  });
  
  // Сохраняем данные в localStorage при каждом изменении items
  useEffect(() => {
    saveToStorage(items);
  }, [items]);
  
  const addItem = useCallback((item) => {
    const { name, category, instruction, washing, nextReminder } = item;
    const newItem = {
      id: generateId(),
      name,
      category: category || 'другое',
      instruction: instruction || getDefaultInstruction(category),
      washing: washing || getDefaultWashing(category),
      nextReminder: nextReminder || '',
      completed: false,
    };
    setItems((prev) => [...prev, newItem]);
  }, []);
  
  const toggleItemCompleted = useCallback((id) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  }, []);
  
  const deleteItem = useCallback((id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);
  
  const updateReminder = useCallback((id, date) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, nextReminder: date } : item
      )
    );
  }, []);
  
  // Функция для очистки всей базы данных
  const clearDatabase = useCallback(() => {
    setItems([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);
  
  return {
    items,
    addItem,
    toggleItemCompleted,
    deleteItem,
    updateReminder,
    clearDatabase,
  };
};
