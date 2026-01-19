import { useState, useEffect } from "react";

/**
 * Custom hook for syncing state with localStorage
 * Automatically saves to localStorage on every state change
 * Restores from localStorage on component mount
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // Initialize state from localStorage or use initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Save to localStorage whenever value changes
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(`Error saving to localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue] as const;
}

/**
 * Clear all KRS-related localStorage data
 * Useful for "Start Fresh" functionality
 */
export function clearKRSSession() {
  const krsKeys = [
    "krs-session-profile",
    "krs-selected-codes",
    "krs-locked-courses",
    "krs-current-step",
  ];

  krsKeys.forEach((key) => {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Error clearing localStorage key "${key}":`, error);
    }
  });
}
