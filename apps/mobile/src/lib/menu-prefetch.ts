import { api } from './api';
import {
  readMenuTodayCache,
  writeMenuTodayCache,
} from './menu-cache';
import { readOfflineCache } from './offline-cache';
import { preloadCategoriaMenuIcons } from './categoria-menu-icon-font';

type MenuToday = { categorias: unknown[] };

/** Hidrata caché en memoria desde disco o red sin bloquear la UI. */
export async function warmMenuTodayCache(
  token: string | null | undefined,
  opts?: { forceNetwork?: boolean },
): Promise<void> {
  if (!opts?.forceNetwork && readMenuTodayCache<MenuToday>()) {
    return;
  }

  if (!opts?.forceNetwork) {
    const offline = await readOfflineCache<MenuToday>('menu_today');
    if (offline?.categorias?.length) {
      writeMenuTodayCache(offline);
      return;
    }
  }

  if (!token) return;

  try {
    const res = await api<MenuToday>('/menu/today', {
      token,
      cacheKey: 'menu_today',
    });
    writeMenuTodayCache(res);
  } catch {
    /* sin red: la pantalla usará caché vieja si existe */
  }
}

/** Refresca el menú en segundo plano (p. ej. al abrir mesas). */
export function prefetchMenuToday(token: string | null | undefined): void {
  void preloadCategoriaMenuIcons();
  void warmMenuTodayCache(token, { forceNetwork: true });
}
