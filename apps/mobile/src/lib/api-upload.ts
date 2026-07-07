import { API_URL } from './config';
import { ApiHttpError } from './api-error';
import { parseUnauthorizedMessage, notifyUnauthorized } from './auth-session';
import type { VisualAssetTipo } from './visual-theme';

export type LogoUploadResult = {
  logo_archivo: string;
  tiene_logo: boolean;
};

export async function uploadRestaurantLogo(
  token: string | null | undefined,
  file: Blob,
  filename = 'logo.png',
): Promise<LogoUploadResult> {
  const form = new FormData();
  form.append('logo', file, filename);

  const url = `${API_URL.replace(/\/$/, '')}/restaurante/logo`;
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, { method: 'POST', headers, body: form });
  const body = (await res.json().catch(() => null)) as unknown;

  if (!res.ok) {
    const err =
      body && typeof body === 'object' && body !== null
        ? (body as Record<string, unknown>)
        : {};
    const msg = Array.isArray(err.message)
      ? (err.message as string[]).join(', ')
      : (err.message as string) || res.statusText;
    const message = msg || `HTTP ${res.status}`;
    if (res.status === 401 && token) {
      await notifyUnauthorized(parseUnauthorizedMessage(message), message);
    }
    throw new ApiHttpError(message, res.status);
  }

  return body as LogoUploadResult;
}

export async function uploadVisualAsset(
  token: string | null | undefined,
  tipo: VisualAssetTipo,
  file: Blob,
  filename?: string,
): Promise<{
  archivo: string;
  tipo: VisualAssetTipo;
  config?: import('./visual-theme').VisualConfigAdmin;
}> {
  const form = new FormData();
  form.append('file', file, filename ?? (file as File).name ?? 'asset.png');

  const url = `${API_URL.replace(/\/$/, '')}/visual/asset/${tipo}`;
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, { method: 'POST', headers, body: form });
  const body = (await res.json().catch(() => null)) as unknown;

  if (!res.ok) {
    const err =
      body && typeof body === 'object' && body !== null
        ? (body as Record<string, unknown>)
        : {};
    const msg = Array.isArray(err.message)
      ? (err.message as string[]).join(', ')
      : (err.message as string) || res.statusText;
    const message = msg || `HTTP ${res.status}`;
    if (res.status === 401 && token) {
      await notifyUnauthorized(parseUnauthorizedMessage(message), message);
    }
    throw new ApiHttpError(message, res.status);
  }

  return body as {
    archivo: string;
    tipo: VisualAssetTipo;
    config?: import('./visual-theme').VisualConfigAdmin;
  };
}
