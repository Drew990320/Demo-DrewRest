import {
  esErrorImpresionNoDisponible,
  mensajeImpresionRequiereDrewTech,
} from '@la-reserva/shared-domain/impresion-soporte';
import { showNotice } from './app-dialog';
import { alertarSiSinPapel } from './alarma-impresora';

export type ResultadoImpresionUi = {
  impreso?: boolean;
  omitido?: boolean;
  error?: string | null;
  codigo_error?: string | null;
  destino?: string | null;
};

export async function notificarResultadoImpresion(
  imp: ResultadoImpresionUi | null | undefined,
  exito: { titulo: string; mensaje: string },
  fallo?: { titulo?: string; mensaje?: string },
): Promise<void> {
  if (!imp || imp.omitido) return;
  if (alertarSiSinPapel(imp)) return;

  if (imp.impreso) {
    await showNotice(exito.titulo, exito.mensaje, 'success');
    return;
  }

  if (esErrorImpresionNoDisponible(imp)) {
    await showNotice(
      'Impresión no disponible',
      mensajeImpresionRequiereDrewTech(),
      'warning',
    );
    return;
  }

  await showNotice(
    fallo?.titulo ?? 'Sin imprimir',
    fallo?.mensaje ?? imp.error ?? 'No se pudo imprimir.',
    'error',
  );
}

export function mensajeImpresionFallidaTrasAccion(
  imp: ResultadoImpresionUi | null | undefined,
  prefijo: string,
): string {
  if (esErrorImpresionNoDisponible(imp)) {
    return `${prefijo}\n\n${mensajeImpresionRequiereDrewTech()}`;
  }
  return `${prefijo}\n\nImpresora: ${imp?.error ?? 'No se pudo imprimir.'}`;
}
