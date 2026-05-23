// src/hooks/useDebounce.js
import { useCallback, useRef } from 'react';

/**
 * Хук для debouncing функций
 * @param {Function} func - функция для debounce
 * @param {number} wait - задержка в мс
 * @returns {Function} debounced версия функции
 */
export const useDebounce = (func, wait) => {
  const timeoutRef = useRef(null);

  const debouncedFn = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  }, [func, wait]);

  // Метод для немедленного выполнения
  debouncedFn.flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return debouncedFn;
};

/**
 * Утилита debounce для использования вне хуков
 * @param {Function} func - функция
 * @param {number} wait - задержка
 * @returns {Function} debounced функция
 */
export const debounce = (func, wait) => {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

export default useDebounce;
