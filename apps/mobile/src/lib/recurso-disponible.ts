import { showNotice } from './app-dialog';
import {
  clasificarErrorApi,
  esErrorRed,
  httpStatus,
  isApiHttpError,
  mensajeErrorApi,
  mensajeErrorUsuario,
  tituloErrorApi,
} from './api-error';

export type RecursoNoDisponibleKind =
  | 'mesa'
  | 'mostrador'
  | 'para_llevar'
  | 'producto'
  | 'menu';

export type RecursoNoDisponibleInfo = {
  kind: RecursoNoDisponibleKind;
  title: string;
  message: string;
};

const REGLAS: {
  match: (msg: string) => boolean;
  kind: RecursoNoDisponibleKind;
  title: string;
  message: string;
}[] = [
  {
    match: (m) => /mostrador no disponible/i.test(m),
    kind: 'mostrador',
    title: 'Mostrador no disponible',
    message:
      'El administrador desactivó el mostrador para hoy. Vuelve al inicio.',
  },
  {
    match: (m) => /para llevar no disponible/i.test(m),
    kind: 'para_llevar',
    title: 'Para llevar no disponible',
    message:
      'El administrador desactivó «Para llevar» para hoy. Vuelve al inicio.',
  },
  {
    match: (m) =>
      /mesa no disponible|mesa destino no está disponible|esta mesa no está disponible/i.test(
        m,
      ),
    kind: 'mesa',
    title: 'Mesa no disponible',
    message:
      'Esta mesa ya no está visible hoy. Un administrador pudo haberla ocultado mientras la abrías. Vuelve a Mesas.',
  },
  {
    match: (m) => /mesa no encontrada/i.test(m),
    kind: 'mesa',
    title: 'Mesa no encontrada',
    message: 'La mesa ya no existe o fue eliminada. Vuelve a Mesas.',
  },
  {
    match: (m) =>
      /producto no disponible|producto no está disponible en el menú/i.test(m),
    kind: 'producto',
    title: 'Plato no disponible',
    message:
      'Este plato ya no está en el menú. El administrador pudo haberlo ocultado. Actualiza el menú o elige otro ítem.',
  },
  {
    match: (m) => /categoría no encontrada/i.test(m),
    kind: 'menu',
    title: 'Menú actualizado',
    message:
      'Una categoría del menú cambió o ya no está disponible hoy. Vuelve atrás y abre el menú de nuevo.',
  },
  {
    match: (m) =>
      /no se puede cancelar un pedido con cobros|no se puede transferir un pedido con cobros/i.test(
        m,
      ),
    kind: 'mesa',
    title: 'Hay cobros registrados',
    message:
      'Este pedido ya tiene pagos parciales. Termina de cobrar el resto desde Factura; no se puede cancelar ni eliminar.',
  },
  {
    match: (m) => /pedido no encontrado|pedido ya facturado|pedido cerrado/i.test(m),
    kind: 'mesa',
    title: 'Pedido no disponible',
    message:
      'Este pedido ya no está activo. Pudo haberse cobrado o cerrado en otro dispositivo.',
  },
  {
    match: (m) => /no tienes permiso|solo admin|solo mesero|solo chef|acceso denegado/i.test(m),
    kind: 'menu',
    title: 'Sin permiso',
    message: 'Tu rol ya no puede realizar esta acción. Vuelve al inicio.',
  },
];

export { mensajeErrorApi } from './api-error';

export function parseRecursoNoDisponible(
  error: unknown,
): RecursoNoDisponibleInfo | null {
  const msg = mensajeErrorApi(error);
  for (const rule of REGLAS) {
    if (rule.match(msg)) {
      return { kind: rule.kind, title: rule.title, message: rule.message };
    }
  }
  return null;
}

/** Muestra aviso amigable si el error es por recurso oculto o no disponible. */
export async function avisarRecursoNoDisponible(
  error: unknown,
  fallback?: { title: string; message?: string },
): Promise<boolean> {
  const info = parseRecursoNoDisponible(error);
  if (info) {
    await showNotice(info.title, info.message, 'warning');
    return true;
  }
  if (fallback) {
    await showNotice(fallback.title, fallback.message, 'error');
    return true;
  }
  return false;
}

/** Manejo unificado: recurso oculto, sesión (401), red, HTTP o error genérico. */
export async function manejarErrorOperacion(
  error: unknown,
  fallback?: { title: string; message?: string },
): Promise<boolean> {
  if (isApiHttpError(error) && error.status === 401) {
    return true;
  }
  if (await avisarRecursoNoDisponible(error, fallback)) {
    return true;
  }
  if (isApiHttpError(error) && error.status === 403) {
    await showNotice(
      'Sin permiso',
      mensajeErrorUsuario(
        error,
        'No tienes permiso para esta acción.',
      ),
      'warning',
    );
    return true;
  }
  if (isApiHttpError(error) && error.status === 404) {
    await showNotice(
      fallback?.title ?? 'No se encontró',
      mensajeErrorUsuario(
        error,
        fallback?.message ?? 'Eso ya no está disponible. Actualiza e intenta de nuevo.',
      ),
      'warning',
    );
    return true;
  }
  if (isApiHttpError(error) && error.status === 409) {
    await showNotice(
      fallback?.title ?? 'No se puede completar',
      mensajeErrorUsuario(
        error,
        fallback?.message ??
          'El pedido cambió mientras trabajabas. Actualiza e intenta de nuevo.',
      ),
      'warning',
    );
    return true;
  }
  if (isApiHttpError(error) && error.status === 400) {
    await showNotice(
      fallback?.title ?? 'Revisa los datos',
      mensajeErrorUsuario(
        error,
        fallback?.message ?? 'Revisa la información e intenta de nuevo.',
      ),
      'warning',
    );
    return true;
  }
  const status = httpStatus(error);
  if (status != null && status >= 500) {
    await showNotice(
      'Algo salió mal',
      mensajeErrorUsuario(
        error,
        'Hubo un problema al procesar la solicitud. Intenta de nuevo en unos segundos.',
      ),
      'error',
    );
    return true;
  }
  if (esErrorRed(error)) {
    await showNotice(
      fallback?.title ?? tituloErrorApi(error),
      fallback?.message ?? mensajeErrorUsuario(error),
      'error',
    );
    return true;
  }
  if (fallback) {
    await showNotice(
      fallback.title,
      fallback.message ?? mensajeErrorUsuario(error),
      'error',
    );
    return true;
  }
  if (clasificarErrorApi(error) === 'desconocido') {
    await showNotice(
      tituloErrorApi(error),
      mensajeErrorUsuario(error),
      'error',
    );
    return true;
  }
  return false;
}

export async function manejarErrorAccion(
  error: unknown,
  accion: string,
  hint = 'Intenta de nuevo en unos segundos.',
): Promise<boolean> {
  return manejarErrorOperacion(error, {
    title: `No se pudo ${accion}`,
    message: hint,
  });
}
