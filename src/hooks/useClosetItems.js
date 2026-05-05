import { useState, useCallback } from 'react';
import { generateId, getDefaultInstruction, getDefaultWashing } from '../utils/helpers';

export const useClosetItems = (initialItems = []) => {
  const [items, setItems] = useState(initialItems);

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

  return {
    items,
    addItem,
    toggleItemCompleted,
    deleteItem,
    updateReminder,
  };
};
