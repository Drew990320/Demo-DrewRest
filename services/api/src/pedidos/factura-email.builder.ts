import {
  DREWTECH_CREDITO_LINEA,
  DREWTECH_TELEFONO_LABEL,
} from './escpos-utils';
import { labelMetodoPago, type FacturaTicket } from './factura-ticket';

function formatCop(n: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fechaTicket(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/** Cuerpo texto plano del recibo para correo. */
export function buildFacturaEmailText(ticket: FacturaTicket): string {
  const lines: string[] = [
    'LA RESERVA',
    'Cuenta / Factura',
    '',
    `${ticket.mesa_etiqueta}`,
    `Pedido #${ticket.id_pedido}`,
    ticket.id_factura != null ? `Factura #${ticket.id_factura}` : '',
    `Mesero: ${ticket.mesero || '—'}`,
    `Comensales: ${ticket.num_comensales}`,
    `Fecha: ${fechaTicket(ticket.emitida_en)}`,
    `Pago: ${labelMetodoPago(ticket.metodo_pago)}`,
    '',
    'Detalle',
    '--------',
  ];

  for (const l of ticket.lineas) {
    lines.push(`${l.cantidad}× ${l.nombre_producto}  ${formatCop(l.subtotal_linea)}`);
    for (const p of l.personalizaciones ?? []) {
      lines.push(`   · ${p}`);
    }
    if (l.nota_cocina?.trim()) {
      lines.push(`   Nota: ${l.nota_cocina.trim()}`);
    }
  }

  lines.push('');
  lines.push(`Subtotal: ${formatCop(ticket.subtotal)}`);
  if (ticket.descuento_sopas > 0) {
    lines.push(`Desc. sopas: -${formatCop(ticket.descuento_sopas)}`);
  }
  if (ticket.descuento_muleros > 0) {
    lines.push(`Desc. muleros: -${formatCop(ticket.descuento_muleros)}`);
  }
  if (ticket.descuento_promociones > 0) {
    lines.push(`Desc. promociones: -${formatCop(ticket.descuento_promociones)}`);
  }
  lines.push(`TOTAL: ${formatCop(ticket.total)}`);
  lines.push('');
  lines.push('Gracias por su visita.');
  lines.push(DREWTECH_CREDITO_LINEA);
  lines.push(DREWTECH_TELEFONO_LABEL);
  lines.push('Este es un recibo electrónico del restaurante (no es factura DIAN).');

  return lines.filter((x) => x !== '').join('\n');
}

/** Cuerpo HTML del recibo para correo. */
export function buildFacturaEmailHtml(ticket: FacturaTicket): string {
  const filas = ticket.lineas
    .map((l) => {
      const extras = [
        ...(l.personalizaciones ?? []).map((p) => escapeHtml(p)),
        l.nota_cocina?.trim() ? `Nota: ${escapeHtml(l.nota_cocina.trim())}` : '',
      ]
        .filter(Boolean)
        .map((t) => `<div style="color:#666;font-size:12px;margin-top:2px">${t}</div>`)
        .join('');
      return `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;vertical-align:top">${l.cantidad}× ${escapeHtml(l.nombre_producto)}${extras}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;vertical-align:top">${formatCop(l.subtotal_linea)}</td>
      </tr>`;
    })
    .join('');

  const descuentos: string[] = [];
  if (ticket.descuento_sopas > 0) {
    descuentos.push(
      `<tr><td>Desc. sopas</td><td style="text-align:right">-${formatCop(ticket.descuento_sopas)}</td></tr>`,
    );
  }
  if (ticket.descuento_muleros > 0) {
    descuentos.push(
      `<tr><td>Desc. muleros</td><td style="text-align:right">-${formatCop(ticket.descuento_muleros)}</td></tr>`,
    );
  }
  if (ticket.descuento_promociones > 0) {
    descuentos.push(
      `<tr><td>Desc. promociones</td><td style="text-align:right">-${formatCop(ticket.descuento_promociones)}</td></tr>`,
    );
  }

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /><title>Factura La Reserva</title></head>
<body style="margin:0;padding:0;background:#f6f4f1;font-family:Segoe UI,Arial,sans-serif;color:#2c241c">
  <div style="max-width:520px;margin:24px auto;background:#fff;border-radius:12px;padding:24px;border:1px solid #e8e0d8">
    <h1 style="margin:0 0 4px;font-size:22px;color:#8b3a2b">La Reserva</h1>
    <p style="margin:0 0 16px;color:#666;font-size:14px">Cuenta / Factura</p>
    <p style="margin:0 0 4px"><strong>${escapeHtml(ticket.mesa_etiqueta)}</strong></p>
    <p style="margin:0 0 4px;font-size:14px;color:#555">Pedido #${ticket.id_pedido}${
      ticket.id_factura != null ? ` · Factura #${ticket.id_factura}` : ''
    }</p>
    <p style="margin:0 0 4px;font-size:14px;color:#555">Mesero: ${escapeHtml(ticket.mesero || '—')}</p>
    <p style="margin:0 0 4px;font-size:14px;color:#555">Fecha: ${escapeHtml(fechaTicket(ticket.emitida_en))}</p>
    <p style="margin:0 0 16px;font-size:14px;color:#555">Pago: ${escapeHtml(labelMetodoPago(ticket.metodo_pago))}</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">${filas}</table>
    <table style="width:100%;margin-top:12px;font-size:14px">
      <tr><td>Subtotal</td><td style="text-align:right">${formatCop(ticket.subtotal)}</td></tr>
      ${descuentos.join('')}
      <tr><td style="padding-top:8px;font-size:18px"><strong>Total</strong></td>
          <td style="padding-top:8px;text-align:right;font-size:18px;color:#8b3a2b"><strong>${formatCop(ticket.total)}</strong></td></tr>
    </table>
    <p style="margin:20px 0 0;font-size:13px;color:#666">Gracias por su visita.</p>
    <p style="margin:12px 0 0;font-size:11px;color:#999">${escapeHtml(DREWTECH_CREDITO_LINEA)}</p>
    <p style="margin:2px 0 0;font-size:11px;color:#999">${escapeHtml(DREWTECH_TELEFONO_LABEL)}</p>
    <p style="margin:8px 0 0;font-size:11px;color:#999">Recibo electrónico del restaurante. No constituye factura electrónica DIAN.</p>
  </div>
</body>
</html>`;
}
