import { mensajeImpresionRequiereDrewTech } from '@la-reserva/shared-domain/impresion-soporte';
import { showTicketPreview } from './ticket-preview-registry';

function htmlSoloAvisoDrewTech(titulo: string): string {
  const lineas = mensajeImpresionRequiereDrewTech()
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const cuerpo = lineas.map((l) => `<div class="center">${l}</div>`).join('');
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"/><title>${titulo}</title>
<style>
body{margin:0;padding:16px;background:#e8e4df;font-family:"Courier New",monospace;font-size:11px}
.ticket{width:58mm;max-width:100%;margin:0 auto;background:#fff;padding:12px 8px;box-shadow:0 2px 8px rgba(0,0,0,.12)}
.center{text-align:center}.bold{font-weight:bold}.sep{border-top:1px dashed #333;margin:8px 0}
</style></head><body><div class="ticket">
<div class="center bold">DEMO DREWREST</div>
<div class="sep"></div>
${cuerpo}
</div></body></html>`;
}

/** Muestra la vista previa del ticket (modal en app; sin avisos que bloqueen). */
export async function mostrarVistaPreviaTicket(
  previewHtml: string | null | undefined,
  titulo = 'Vista previa del ticket POS',
): Promise<boolean> {
  const html = previewHtml?.trim() ? previewHtml : htmlSoloAvisoDrewTech(titulo);
  await showTicketPreview(html, { titulo });
  return true;
}

/** @deprecated Usar mostrarVistaPreviaTicket */
export const notificarVistaPreviaDemo = mostrarVistaPreviaTicket;
