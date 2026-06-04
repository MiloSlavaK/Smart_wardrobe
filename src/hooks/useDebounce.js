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
  const argsRef = useRef([]);

  const debouncedFn = useCallback((...args) => {
    argsRef.current = args;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      func(...argsRef.current);
    }, wait);
  }, [func, wait]);

  debouncedFn.flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      func(...argsRef.current);
    }
  }, [func]);

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
