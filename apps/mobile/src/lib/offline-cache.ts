import { storage } from './storage';

const PREFIX = 'lr_cache_v1_';

/** Ventana en la que se aceptan datos guardados al fallar la red (10 min). */
export const OFFLINE_CACHE_TTL_MS = 10 * 60 * 1000;

type Cached<T> = { savedAt: number; data: T };

export async function readOfflineCache<T>(key: string): Promise<T | null> {
  const raw = await storage.getItem(PREFIX + key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Cached<T>;
    if (Date.now() - parsed.savedAt > OFFLINE_CACHE_TTL_MS) {
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

export async function writeOfflineCache<T>(key: string, data: T): Promise<void> {
  const payload: Cached<T> = { savedAt: Date.now(), data };
  await storage.setItem(PREFIX + key, JSON.stringify(payload));
}

/** Borra una entrada (p. ej. tras mutar el menú para no seguir mostrando GET en caché). */
export async function deleteOfflineCache(key: string): Promise<void> {
  await storage.deleteItem(PREFIX + key);
}
