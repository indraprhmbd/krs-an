import { useCallback, useRef, useSyncExternalStore } from "react";

/**
 * State synced to localStorage, shared across every hook instance.
 *
 * The obvious implementation (useState seeded from localStorage) is subtly
 * broken once two components read the same key: each holds its own useState,
 * seeded once at mount, and writes from one never reach the other. That bit
 * here in a way nothing would have caught at build time. ScheduleMaker writes
 * "krs-local-archive" when an anonymous user saves a plan, while App reads the
 * same key to decide whether to offer migration on sign-in. App's copy stayed
 * empty, so the prompt never fired and the plans were silently orphaned.
 *
 * useSyncExternalStore with a module-level registry gives one source of truth:
 * every instance of a key re-renders on write, and the `storage` event keeps
 * other tabs in step too.
 */

type Listener = () => void;

const listeners = new Map<string, Set<Listener>>();

/**
 * getSnapshot must return a referentially stable value or React re-renders
 * forever, so the parsed result is cached and only re-parsed when the raw
 * string actually changes.
 */
const cache = new Map<string, { raw: string | null; parsed: unknown }>();

function emit(key: string) {
  listeners.get(key)?.forEach((listener) => listener());
}

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error);
    return null;
  }
}

function readValue<T>(key: string, initialValue: T): T {
  const raw = readRaw(key);
  const cached = cache.get(key);
  if (cached && cached.raw === raw) return cached.parsed as T;

  let parsed: unknown = initialValue;
  if (raw !== null) {
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      console.warn(`Error parsing localStorage key "${key}":`, error);
      parsed = initialValue;
    }
  }

  cache.set(key, { raw, parsed });
  return parsed as T;
}

// Other tabs writing the same key should be reflected here too.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key) {
      cache.delete(event.key);
      emit(event.key);
    }
  });
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Held in a ref so a fresh object/array literal for initialValue does not
  // change the identity of subscribe/setValue on every render.
  const initialRef = useRef(initialValue);

  const subscribe = useCallback((listener: Listener) => {
    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key)!.add(listener);
    return () => {
      const set = listeners.get(key);
      set?.delete(listener);
      if (set && set.size === 0) listeners.delete(key);
    };
  }, [key]);

  const getSnapshot = useCallback(
    () => readValue(key, initialRef.current),
    [key],
  );

  // No localStorage during SSR; fall back to the initial value.
  const getServerSnapshot = useCallback(() => initialRef.current, []);

  const storedValue = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      const current = readValue(key, initialRef.current);
      const next =
        typeof value === "function" ? (value as (prev: T) => T)(current) : value;

      try {
        const raw = JSON.stringify(next);
        window.localStorage.setItem(key, raw);
        cache.set(key, { raw, parsed: next });
      } catch (error) {
        // Quota exceeded, or storage disabled (Safari private mode). Keep the
        // value in cache so the session still works, it just will not persist.
        console.warn(`Error saving to localStorage key "${key}":`, error);
        cache.set(key, { raw: cache.get(key)?.raw ?? null, parsed: next });
      }

      emit(key);
    },
    [key],
  );

  return [storedValue, setValue] as const;
}

/**
 * Clear the working session (config, selections, locks) for "Start Fresh".
 * Deliberately does not touch the saved plan archive.
 */
export function clearKRSSession() {
  const krsKeys = [
    "krs-session-profile",
    "krs-selected-codes",
    "krs-locked-courses",
    "krs-courses",
  ];

  krsKeys.forEach((key) => {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Error clearing localStorage key "${key}":`, error);
    }
    cache.delete(key);
    emit(key);
  });
}
