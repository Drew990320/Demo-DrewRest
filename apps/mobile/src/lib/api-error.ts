export class ApiHttpError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiHttpError';
    this.status = status;
  }
}

/** El fetch no llegó al servidor (API apagado, red, CORS, URL incorrecta). */
export class ApiNetworkError extends Error {
  readonly apiUrl: string;

  constructor(message: string, apiUrl: string) {
    super(message);
    this.name = 'ApiNetworkError';
    this.apiUrl = apiUrl;
  }
}

export type ErrorApiKind =
  | 'red'
  | 'no_autorizado'
  | 'sin_permiso'
  | 'conflicto'
  | 'validacion'
  | 'no_encontrado'
  | 'servidor'
  | 'recurso_no_disponible'
  | 'desconocido';

export function isApiHttpError(error: unknown): error is ApiHttpError {
  return error instanceof ApiHttpError;
}

export function isApiNetworkError(error: unknown): error is ApiNetworkError {
  return error instanceof ApiNetworkError;
}

export function httpStatus(error: unknown): number | null {
  return isApiHttpError(error) ? error.status : null;
}

export function mensajeErrorApi(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error ?? 'Error desconocido');
}

/** Mensaje corto para el personal cuando no hay conexión con el servidor. */
export const MENSAJE_SIN_CONEXION =
  'No hay conexión con el programa del restaurante. Comprueba que esté abierto en el PC y que uses la misma red Wi‑Fi.';

const REEMPLAZOS_MENSAJE: { match: RegExp; mensaje: string }[] = [
  {
    match: /credenciales inválidas|invalid credentials/i,
    mensaje: 'Correo o contraseña incorrectos.',
  },
  {
    match: /no se pudo conectar|failed to fetch|network request failed|network error/i,
    mensaje: MENSAJE_SIN_CONEXION,
  },
  {
    match: /^HTTP \d{3}$/i,
    mensaje: 'El servidor respondió con un error. Intenta de nuevo en unos segundos.',
  },
  {
    match: /prisma|npx prisma|migrate deploy|db push/i,
    mensaje:
      'Hay un problema con la base de datos del restaurante. Avísale al administrador.',
  },
  {
    match: /EXPO_PUBLIC|nest|puerto 3000|127\.0\.0\.1/i,
    mensaje: MENSAJE_SIN_CONEXION,
  },
  {
    match: /inicio\.bat/i,
    mensaje:
      'Comprueba que el programa del restaurante siga abierto en el PC servidor.',
  },
  {
    match: /yyyy-mm-dd|fecha inválida/i,
    mensaje: 'La fecha no es válida. Elige otra e intenta de nuevo.',
  },
  {
    match: /solo admin/i,
    mensaje: 'Solo un administrador puede hacer esto.',
  },
  {
    match: /rol mesero no configurado/i,
    mensaje: 'Tu cuenta no tiene rol de mesero configurado. Pide ayuda al administrador.',
  },
  {
    match: /producto de mazorca no encontrado/i,
    mensaje: 'No se encontró el producto de mazorca en el menú. Avísale al administrador.',
  },
  {
    match: /undefined|null is not|typeerror|referenceerror|syntaxerror/i,
    mensaje: 'Ocurrió un problema inesperado. Intenta de nuevo.',
  },
];

function esMensajeTecnico(msg: string): boolean {
  return (
    /^HTTP \d+/.test(msg) ||
    /prisma/i.test(msg) ||
    /EXPO_PUBLIC/i.test(msg) ||
    /\bat \w+ \(/i.test(msg) ||
    /TypeError|ReferenceError|SyntaxError/i.test(msg) ||
    /invocation|stack trace/i.test(msg) ||
    msg.length > 220
  );
}

/** Mensaje listo para mostrar al personal (sin jerga técnica). */
export function mensajeErrorUsuario(
  error: unknown,
  fallback = 'No se pudo completar. Intenta de nuevo en unos segundos.',
): string {
  const raw = mensajeErrorApi(error).trim();
  if (!raw || raw === 'Error desconocido') return fallback;

  for (const { match, mensaje } of REEMPLAZOS_MENSAJE) {
    if (match.test(raw)) return mensaje;
  }

  if (!esMensajeTecnico(raw)) return raw;
  return fallback;
}

export function esErrorRed(error: unknown): boolean {
  if (isApiNetworkError(error)) return true;
  if (error instanceof TypeError) return true;
  const msg = mensajeErrorApi(error).toLowerCase();
  return (
    msg.includes('no se pudo conectar') ||
    msg.includes('failed to fetch') ||
    msg.includes('network request failed') ||
    msg.includes('network error')
  );
}

export function clasificarErrorApi(error: unknown): ErrorApiKind {
  if (esErrorRed(error)) return 'red';
  if (isApiHttpError(error)) {
    if (error.status === 401) return 'no_autorizado';
    if (error.status === 403) return 'sin_permiso';
    if (error.status === 404) return 'no_encontrado';
    if (error.status === 409) return 'conflicto';
    if (error.status === 400) return 'validacion';
    if (error.status >= 500) return 'servidor';
  }
  const msg = mensajeErrorApi(error);
  if (
    /no disponible|no encontrad|ya no está|ya fue facturado|pedido cerrado/i.test(
      msg,
    )
  ) {
    return 'recurso_no_disponible';
  }
  return 'desconocido';
}

export function tituloErrorApi(
  error: unknown,
  fallback = 'No se pudo completar',
): string {
  switch (clasificarErrorApi(error)) {
    case 'red':
      return 'Sin conexión';
    case 'no_autorizado':
      return 'Sesión cerrada';
    case 'sin_permiso':
      return 'No tienes permiso';
    case 'conflicto':
      return 'No se puede completar';
    case 'validacion':
      return 'Revisa los datos';
    case 'no_encontrado':
      return 'No se encontró';
    case 'servidor':
      return 'Algo salió mal';
    case 'recurso_no_disponible':
      return 'Ya no está disponible';
    default:
      return fallback;
  }
}
