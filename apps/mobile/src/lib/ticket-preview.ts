import { Platform } from 'react-native';
import { showNotice } from './app-dialog';

/** Abre la vista previa HTML del ticket POS (guardar como PDF en el navegador). */
export function abrirVistaPreviaTicket(
  previewHtml: string,
  titulo = 'Vista previa POS',
): boolean {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const ventana = window.open('', '_blank');
    if (ventana) {
      ventana.document.open();
      ventana.document.write(previewHtml);
      ventana.document.close();
      ventana.document.title = titulo;
      ventana.focus();
      return true;
    }
  }
  return false;
}

export async function notificarVistaPreviaDemo(
  previewHtml: string | null | undefined,
  titulo = 'Vista previa del ticket',
): Promise<void> {
  if (!previewHtml?.trim()) {
    await showNotice(
      'Impresión no disponible',
      'La impresora POS no está activa en esta demo. Contacta a DrewTech para activarla.',
      'warning',
    );
    return;
  }
  const abierta = abrirVistaPreviaTicket(previewHtml, titulo);
  if (abierta) {
    await showNotice(
      titulo,
      'Se abrió una pestaña con el ticket como se vería en la impresora POS. Usa «Guardar como PDF / Imprimir» para descargarlo.',
      'info',
    );
  } else {
    await showNotice(
      titulo,
      'La vista previa del ticket solo está disponible en la versión web de la demo.',
      'warning',
    );
  }
}
