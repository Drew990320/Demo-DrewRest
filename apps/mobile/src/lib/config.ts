import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';

function firstApiUrlFromEnvOrExtra(): string {
  // Preferir `extra.apiUrl` del manifest (app.config.js + EAS): siempre viaja con la app.
  // `process.env.EXPO_PUBLIC_*` a veces no se inlinea y caía en localhost (= el propio móvil).
  const fromExtra = Constants.expoConfig?.extra?.apiUrl;
  if (typeof fromExtra === 'string' && fromExtra.trim()) {
    return fromExtra.trim().replace(/\/$/, '');
  }
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.trim().replace(/\/$/, '');
  }
  return 'http://localhost:3000';
}

/** Hostname es red privada típica (LAN / VPN), no localhost. */
function hostnameIsPrivateLan(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '127.0.0.1') return false;
  if (/^192\.168\./.test(hostname)) return true;
  if (/^10\./.test(hostname)) return true;
  const m = /^172\.(\d+)\./.exec(hostname);
  if (m) {
    const n = Number(m[1]);
    if (n >= 16 && n <= 31) return true;
  }
  return false;
}

/**
 * URL con aspecto de IP privada (LAN / VPN), p. ej. http://192.168.1.40:3000
 * En Expo Web en el mismo PC, el navegador suele necesitar 127.0.0.1 en vez de la IP LAN (ver resolveApiUrl).
 */
function looksLikePrivateLanUrl(url: string): boolean {
  try {
    return hostnameIsPrivateLan(new URL(url).hostname);
  } catch {
    return false;
  }
}

function apiPortFromBaseUrl(base: string): string {
  try {
    return new URL(base).port || '3000';
  } catch {
    return '3000';
  }
}

function urlTargetsLocalhost(url: string): boolean {
  return /127\.0\.0\.1/.test(url) || /\blocalhost\b/i.test(url);
}

/**
 * En dev, Metro sirve el bundle como http://IP_LAN:8081/... — misma IP que el API en el PC.
 * Así la app nativa puede usar el API sin poner la IP en .env (si .env sigue en localhost).
 */
function inferDevWebOriginFromMetro(): string | null {
  if (!__DEV__ || Platform.OS === 'web') return null;
  try {
    const scriptURL = (NativeModules.SourceCode as { scriptURL?: string })
      ?.scriptURL;
    if (!scriptURL) return null;
    const normalized =
      scriptURL.startsWith('http://') || scriptURL.startsWith('https://')
        ? scriptURL
        : `http://${scriptURL}`;
    const u = new URL(normalized);
    if (hostnameIsPrivateLan(u.hostname)) {
      return u.origin;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** URL que deben abrir los celulares (QR / enlace). */
export function resolveUrlWebCelular(data: {
  ip: string | null;
  url_web_celular: string | null;
  puerto_web: number;
  modo_conexion?: 'lan' | 'demo_nube';
} | null): string | null {
  const urlApi = data?.url_web_celular?.trim().replace(/\/$/, '') ?? null;
  if (data?.modo_conexion === 'demo_nube' && urlApi) {
    return urlApi;
  }
  if (urlApi && !looksLikePrivateLanUrl(urlApi) && !urlTargetsLocalhost(urlApi)) {
    return urlApi;
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined' && !apiIsOnLocalLan()) {
    return window.location.origin;
  }

  if (!data?.ip) return urlApi;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const { hostname, port, protocol } = window.location;
    if (hostnameIsPrivateLan(hostname)) {
      const p = port || (protocol === 'https:' ? '443' : '80');
      return `${protocol}//${hostname}${p ? `:${p}` : ''}`;
    }
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const p = port || process.env.EXPO_PUBLIC_WEB_PORT?.trim() || '8081';
      return `http://${data.ip}:${p}`;
    }
  }

  if (__DEV__) {
    const fromMetro = inferDevWebOriginFromMetro();
    if (fromMetro) return fromMetro;
    const envPort = process.env.EXPO_PUBLIC_WEB_PORT?.trim();
    if (envPort) {
      return `http://${data.ip}:${envPort}`;
    }
  }

  return data.url_web_celular;
}

export function puertoDesdeUrlWeb(url: string | null): number | null {
  if (!url) return null;
  try {
    const p = new URL(url).port;
    return p ? Number(p) : null;
  } catch {
    return null;
  }
}

function inferLanHostFromDevBundle(): string | null {
  if (!__DEV__ || Platform.OS === 'web') return null;
  try {
    const scriptURL = (NativeModules.SourceCode as { scriptURL?: string })
      ?.scriptURL;
    if (!scriptURL) return null;
    const normalized =
      scriptURL.startsWith('http://') || scriptURL.startsWith('https://')
        ? scriptURL
        : `http://${scriptURL}`;
    const hostname = new URL(normalized).hostname;
    if (hostnameIsPrivateLan(hostname)) {
      return hostname;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function resolveApiUrl(): string {
  const trimmed = firstApiUrlFromEnvOrExtra();

  // No reescribir automáticamente la IP LAN a 10.0.2.2: en varios móviles físicos
  // `Constants.isDevice` puede ser false y la app terminaba usando 10.0.2.2 (solo válido en el AVD).
  // Para API en el PC: en teléfono real usa la IP Wi‑Fi del PC (p. ej. 192.168.1.7:3000).
  // Emulador Android: pon en .env EXPO_PUBLIC_API_URL=http://10.0.2.2:3000 (alias del host del AVD).

  if (Platform.OS === 'web') {
    const pageHost =
      typeof window !== 'undefined' ? window.location.hostname : null;

    const rawWeb = process.env.EXPO_PUBLIC_API_URL_WEB?.trim();
    if (rawWeb) {
      const webUrl = rawWeb.replace(/\/$/, '');
      // Si abres el front desde el móvil (http://IP_PC:8081) pero WEB apunta a 127.0.0.1,
      // en el teléfono "localhost" es el propio móvil — ignorar y usar el host de la página.
      const ignoreWebOverride =
        Boolean(pageHost && hostnameIsPrivateLan(pageHost)) &&
        urlTargetsLocalhost(webUrl);
      if (!ignoreWebOverride) {
        return webUrl;
      }
    }

    // Front servido por la misma máquina que el API: http://IP_LAN:8081 (móvil o tablet en la Wi‑Fi).
    // Siempre usar ese MISMO host para el API (puerto desde .env, p. ej. 3000). No usar una IP vieja
    // guardada en .env: suele desincronizarse del DHCP y el login falla aunque el front cargue.
    if (pageHost && hostnameIsPrivateLan(pageHost)) {
      const port = apiPortFromBaseUrl(trimmed);
      return `http://${pageHost}:${port}`;
    }

    // Mismo PC en el navegador: localhost y 127.0.0.1 no son intercambiables
    // (Cross-Origin-Resource-Policy bloquea imágenes si el host no coincide).
    if (pageHost === 'localhost' || pageHost === '127.0.0.1') {
      const port = apiPortFromBaseUrl(trimmed);
      return `http://${pageHost}:${port}`;
    }

    // .env con IP LAN en un contexto sin hostname de página (SSR / build).
    if (looksLikePrivateLanUrl(trimmed)) {
      const port = apiPortFromBaseUrl(trimmed);
      return `http://127.0.0.1:${port}`;
    }
    return trimmed;
  }

  // App nativa: localhost en .env/manifest apunta al móvil, no al PC.
  if ((Platform.OS as string) !== 'web' && urlTargetsLocalhost(trimmed)) {
    const inferred = inferLanHostFromDevBundle();
    if (inferred) {
      return `http://${inferred}:${apiPortFromBaseUrl(trimmed)}`;
    }
  }

  return trimmed;
}

/**
 * Base URL del API y de Socket.IO (mismo origen).
 * - Web en el mismo PC: IP LAN en .env → 127.0.0.1.
 * - Web desde el móvil (http://IP_PC:8081): API en http://IP_PC:puerto (puerto = el de EXPO_PUBLIC_API_URL, típ. 3000).
 * - Android: misma URL que .env/extra; emulador → configurar 10.0.2.2:3000 si aplica.
 * - App nativa en dev con .env en localhost: se intenta leer la IP del bundle de Metro (misma LAN que la web).
 * - APK release / EAS: tal cual extra / EXPO_PUBLIC_API_URL (sin inferencia útil si el bundle va embebido).
 */
export const API_URL = resolveApiUrl();

/** El API apunta al PC en la red local (no a un servicio en internet). */
export function apiIsOnLocalLan(): boolean {
  return looksLikePrivateLanUrl(API_URL) || urlTargetsLocalhost(API_URL);
}
