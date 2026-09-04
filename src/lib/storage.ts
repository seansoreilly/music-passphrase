/**
 * Reads a JSON value from localStorage, falling back to `defaultValue` when
 * the key is missing or the stored value fails to parse.
 */
export function readStoredJSON<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

/** Reads a plain string value from localStorage. */
export function readStoredString(key: string, defaultValue: string): string {
  try {
    return localStorage.getItem(key) ?? defaultValue;
  } catch {
    return defaultValue;
  }
}
