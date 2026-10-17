// localStorage / sessionStorage can throw (private windows, blocked site data); the app must still work without them.
export function readJson<T>(key: string, storage: Storage = localStorage): T | null {
  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown, storage: Storage = localStorage): void {
  try {
    if (value === null || value === undefined) storage.removeItem(key);
    else storage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: the value lasts until reload */
  }
}
