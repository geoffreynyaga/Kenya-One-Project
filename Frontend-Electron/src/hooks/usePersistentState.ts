import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

function read<T>(key: string, fallback: T, merge: boolean): T {
  try {
    const stored = window.localStorage.getItem(key);
    if (stored === null) return fallback;
    const parsed = JSON.parse(stored) as T;
    return merge && parsed && typeof parsed === "object"
      ? { ...(fallback as object), ...(parsed as object) } as T
      : parsed;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked (private browsing). The sheet still works.
  }
}

/**
 * `useState` that survives a page reload.
 *
 * Sheets hold their inputs in component state, so a refresh used to drop
 * everything back to the hardcoded defaults. This keeps the last value under
 * `key` in localStorage and rehydrates from it on mount.
 *
 * A stored object is merged over the defaults rather than replacing them, so
 * adding a field to a sheet does not invalidate an already-saved sheet.
 */
export function usePersistentState<T extends object>(
  key: string,
  defaults: T
): [T, Dispatch<SetStateAction<T>>, () => void] {
  const [state, setState] = useState<T>(() => read(key, defaults, true));
  const defaultsRef = useRef(defaults);

  useEffect(() => {
    write(key, state);
  }, [key, state]);

  // The effect above persists the defaults, so there is nothing to remove.
  const reset = useCallback(() => setState(defaultsRef.current), []);

  return [state, setState, reset];
}

/**
 * Single-value form of {@link usePersistentState}, for sheets that keep one
 * `useState` per field. Drop-in: same tuple as `useState`.
 */
export function usePersistentValue<T>(
  key: string,
  initial: T
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => read(key, initial, false));

  useEffect(() => {
    write(key, state);
  }, [key, state]);

  return [state, setState];
}
