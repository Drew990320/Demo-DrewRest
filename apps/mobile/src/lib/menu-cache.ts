const MENU_TTL_MS = 10 * 60 * 1000;

let cachedAt = 0;
let cachedData: unknown = null;

export function readMenuTodayCache<T>(): T | null {
  if (!cachedData || Date.now() - cachedAt >= MENU_TTL_MS) return null;
  return cachedData as T;
}

export function writeMenuTodayCache<T>(data: T): void {
  cachedData = data;
  cachedAt = Date.now();
}

export function invalidateMenuTodayCache(): void {
  cachedData = null;
  cachedAt = 0;
}
