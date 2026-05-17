// src/hooks/useClosetItems.js
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { generateId, getDefaultInstruction, getDefaultWashing, validateClosetItem } from '../utils/helpers';

const STORAGE_KEY = 'closet_items_db';
const STORAGE_VERSION = '1.0';

const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const version = localStorage.getItem(`${STORAGE_KEY}_version`);
    if (stored) {
      let items = JSON.parse(stored);
      if (version !== STORAGE_VERSION) {
        items = items.map(item => ({ ...item, createdAt: item.createdAt || Date.now(), updatedAt: item.updatedAt || Date.now(), tags: item.tags || [] }));
        localStorage.setItem(`${STORAGE_KEY}_version`, STORAGE_VERSION);
      }
      return items.filter(item => validateClosetItem(item));
    }
  } catch (e) { console.error('❌ Load error:', e); }
  return [];
};

const saveToStorage = (items) => {
  try {
    const backup = localStorage.getItem(STORAGE_KEY);
    if (backup) localStorage.setItem(`${STORAGE_KEY}_backup`, backup);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    localStorage.setItem(`${STORAGE_KEY}_version`, STORAGE_VERSION);
  } catch (e) {
    console.error('❌ Save error:', e);
    try {
      const backup = localStorage.getItem(`${STORAGE_KEY}_backup`);
      if (backup) localStorage.setItem(STORAGE_KEY, backup);
    } catch (err) { console.error('❌ Backup restore failed:', err); }
  }
};

const debounce = (func, wait) => {
  let timeout;
  return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), wait); };
};

export const useClosetItems = (initialItems = []) => {
  const [items, setItems] = useState(() => loadFromStorage());
  const lastSavedRef = useRef(items);

  const debouncedSave = useMemo(() => debounce((newItems) => {
    if (JSON.stringify(newItems) !== JSON.stringify(lastSavedRef.current)) {
      saveToStorage(newItems);
      lastSavedRef.current = newItems;
    }
  }, 500), []);

  useEffect(() => {
    debouncedSave(items);
    return () => { debouncedSave.flush?.(); saveToStorage(items); };
  }, [items, debouncedSave]);

  useEffect(() => {
    if (items.length === 0 && initialItems.length > 0) setItems(initialItems);
  }, [initialItems, items.length]);

  const addItem = useCallback((itemData) => {
    if (!validateClosetItem(itemData, { partial: true })) return null;
    const { id, name, category, instruction, washing, nextReminder, tags = [] } = itemData;
    const newItem = {
      id: id || generateId(),
      name: name?.trim() || 'Новая вещь',
      category: category?.trim() || 'другое',
      instruction: instruction?.trim() || getDefaultInstruction(category),
      washing: washing?.trim() || getDefaultWashing(category),
      nextReminder: nextReminder || '',
      completed: false,
      createdAt: Date.now(), updatedAt: Date.now(),
      tags: Array.isArray(tags) ? tags : [],
      voiceAliases: [name?.toLowerCase(), category?.toLowerCase()].filter(Boolean),
    };
    setItems(prev => [...prev, newItem]);
    return newItem;
  }, []);

  const toggleItemCompleted = useCallback((id) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, completed: !item.completed, updatedAt: Date.now() } : item));
  }, []);

  const deleteItem = useCallback((id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateReminder = useCallback((id, date) => {
    if (!date) return;
    setItems(prev => prev.map(item => item.id === id ? { ...item, nextReminder: date, updatedAt: Date.now() } : item));
  }, []);

  const updateItem = useCallback((id, updates) => {
    if (!validateClosetItem({ ...updates }, { partial: true })) return false;
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates, updatedAt: Date.now() } : item));
    return true;
  }, []);

  const findItems = useCallback((query) => {
    if (!query) return items;
    const q = query.toLowerCase();
    return items.filter(item => item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q));
  }, [items]);

  const stats = useMemo(() => ({
    total: items.length,
    completed: items.filter(i => i.completed).length,
    pending: items.filter(i => !i.completed).length,
    categories: [...new Set(items.map(i => i.category))],
    withReminders: items.filter(i => i.nextReminder).length,
    lastUpdated: Math.max(...items.map(i => i.updatedAt || 0), 0),
  }), [items]);

  const clearDatabase = useCallback(() => { setItems([]); localStorage.removeItem(STORAGE_KEY); }, []);
  const restoreFromBackup = useCallback(() => {
    try {
      const backup = localStorage.getItem(`${STORAGE_KEY}_backup`);
      if (backup) { setItems(JSON.parse(backup).filter(item => validateClosetItem(item))); return true; }
    } catch (e) { console.error('❌ Restore failed:', e); }
    return false;
  }, []);

  const getRecoveryState = useCallback(() => ({
    itemCount: items.length,
    lastItemIds: items.slice(-5).map(i => i.id),
    lastUpdate: stats.lastUpdated,
    version: STORAGE_VERSION,
  }), [items, stats.lastUpdated]);

  return { items, stats, addItem, toggleItemCompleted, deleteItem, updateReminder, updateItem, findItems, clearDatabase, restoreFromBackup, getRecoveryState };
};

export default useClosetItems;