export type AuthInvalidReason = 'desactivado' | 'credenciales' | 'expirado';

type UnauthorizedHandler = (
  reason: AuthInvalidReason,
  message?: string,
) => void | Promise<void>;

let handler: UnauthorizedHandler | null = null;
let handling = false;
let currentUserId: number | null = null;

export function setAuthSessionUserId(id: number | null): void {
  currentUserId = id;
}

export function registerUnauthorizedHandler(h: UnauthorizedHandler | null): void {
  handler = h;
}

export function parseUnauthorizedMessage(message: string): AuthInvalidReason {
  if (/inactivo/i.test(message)) return 'desactivado';
  if (/credenciales|token inválido/i.test(message)) return 'credenciales';
  return 'expirado';
}

export function tituloSesionCerrada(reason: AuthInvalidReason): string {
  if (reason === 'desactivado') return 'Cuenta desactivada';
  return 'Sesión cerrada';
}

export function mensajeSesionCerrada(
  reason: AuthInvalidReason,
  detail?: string,
): string {
  if (reason === 'desactivado') {
    return (
      detail ??
      'Un administrador desactivó tu acceso. Inicia sesión con otra cuenta o contacta al encargado.'
    );
  }
  if (reason === 'credenciales') {
    return detail ?? 'Tu contraseña cambió o el acceso ya no es válido. Inicia sesión de nuevo.';
  }
  return detail ?? 'Tu sesión expiró o ya no es válida. Inicia sesión de nuevo.';
}

/** Cierra sesión en la app (401, socket o admin desactivó al usuario actual). */
export async function notifyUnauthorized(
  reason: AuthInvalidReason,
  message?: string,
): Promise<void> {
  if (handling || !handler) return;
  handling = true;
  try {
    await handler(reason, message);
  } finally {
    handling = false;
  }
}

/** Modo local o push del servidor: invalida solo si el usuario afectado es el actual. */
export function notifyAuthSesionInvalidada(
  targetUserId: number,
  reason: AuthInvalidReason,
  message?: string,
): void {
  if (currentUserId == null || currentUserId !== targetUserId) return;
  void notifyUnauthorized(reason, message);
}
