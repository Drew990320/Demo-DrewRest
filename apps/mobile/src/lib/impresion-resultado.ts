import { esErrorImpresionNoDisponible } from '@la-reserva/shared-domain/impresion-soporte';
import { showNotice } from './app-dialog';
import { alertarSiSinPapel } from './alarma-impresora';
import { mostrarVistaPreviaTicket } from './ticket-preview';

export type ResultadoImpresionUi = {
  impreso?: boolean;
  omitido?: boolean;
  en_cola?: boolean;
  error?: string | null;
  codigo_error?: string | null;
  destino?: string | null;
  preview_html?: string | null;
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
    await mostrarVistaPreviaTicket(
      imp.preview_html,
      exito.titulo || 'Vista previa del ticket POS',
    );
    return;
  }

  if (imp.en_cola) {
    await showNotice(
      exito.titulo,
      'El ticket se imprime en cola (puede tardar unos segundos).',
      'success',
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
    return prefijo;
  }
  return `${prefijo}\n\nImpresora: ${imp?.error ?? 'No se pudo imprimir.'}`;
}
