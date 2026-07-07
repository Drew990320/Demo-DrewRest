import type { ComandaTicket } from './comanda-ticket';
import type { FacturaTicket } from './factura-ticket';
import { labelMetodoPago } from './factura-ticket';
import {
  DREWTECH_CREDITO_LINEA,
  DREWTECH_TELEFONO_LABEL,
  ticketDireccion,
  ticketNombreLocal,
  ticketTelefono,
} from './escpos-utils';
import {
  restaurantMostrarCreditoDrewTech,
  restaurantTextoAvisoNoDian,
  restaurantTextoGraciasTicket,
  restaurantTextoPropinaTicket,
} from '../common/restaurant-branding';
import { lineasTicketExcesoCobro } from '@la-reserva/shared-domain/factura-vuelto';

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
    timeZone: 'America/Bogota',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function wrapThermalPreviewHtml(titulo: string, cuerpo: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(titulo)}</title>
  <style>
    @page { size: 58mm auto; margin: 3mm; }
    @media print {
      body { background: #fff; margin: 0; }
      .no-print { display: none !important; }
      .ticket { box-shadow: none; margin: 0; }
    }
    body {
      margin: 0;
      padding: 16px 8px 32px;
      background: #e8e4df;
      font-family: "Courier New", Courier, monospace;
      color: #111;
    }
    .no-print {
      max-width: 58mm;
      margin: 0 auto 12px;
      text-align: center;
    }
    .no-print button {
      font-family: inherit;
      font-size: 13px;
      padding: 10px 16px;
      border: 1px solid #8b3a2b;
      background: #8b3a2b;
      color: #fff;
      border-radius: 6px;
      cursor: pointer;
    }
    .no-print p {
      margin: 8px 0 0;
      font-size: 11px;
      color: #666;
      font-family: Segoe UI, Arial, sans-serif;
    }
    .ticket {
      width: 58mm;
      max-width: 100%;
      margin: 0 auto;
      background: #fff;
      padding: 10px 8px;
      font-size: 11px;
      line-height: 1.35;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
      white-space: pre-wrap;
      word-break: break-word;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .sep {
      border-top: 1px dashed #333;
      margin: 6px 0;
      height: 0;
    }
    .row {
      display: flex;
      justify-content: space-between;
      gap: 6px;
    }
    .muted { color: #444; }
    .banner {
      text-align: center;
      font-weight: bold;
      margin: 4px 0;
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button type="button" onclick="window.print()">Guardar como PDF / Imprimir</button>
    <p>Vista previa demo — ticket POS 58 mm (sin impresora térmica)</p>
  </div>
  <div class="ticket">${cuerpo}</div>
</body>
</html>`;
}

/** HTML estilo ticket térmico para comanda de cocina. */
export function buildComandaPreviewHtml(ticket: ComandaTicket): string {
  const lineas = ticket.lineas
    .map((l) => {
      const extras = [
        ...l.personalizaciones.map((p) => `  · ${escapeHtml(p)}`),
        l.nota_cocina?.trim()
          ? `  Nota: ${escapeHtml(l.nota_cocina.trim())}`
          : '',
      ]
        .filter(Boolean)
        .join('<br/>');
      return `<div class="bold">${l.cantidad}× ${escapeHtml(l.nombre_producto)}</div>${extras ? `<div class="muted">${extras}</div>` : ''}<br/>`;
    })
    .join('');

  const banners: string[] = [];
  if (ticket.es_adicional) banners.push('<div class="banner">*** ADICIONAL ***</div>');
  if (ticket.es_reimpresion) banners.push('<div class="banner">*** REIMPRESIÓN ***</div>');
  if (ticket.modo_servicio === 'para_llevar') {
    banners.push('<div class="banner">*** PARA LLEVAR ***</div>');
  }

  const cuerpo = `
<div class="center bold">COMANDA COCINA</div>
${banners.join('')}
<div class="sep"></div>
<div class="bold">${escapeHtml(ticket.mesa_etiqueta)}</div>
<div>Pedido #${ticket.id_pedido}</div>
<div>Comensales: ${ticket.num_comensales}</div>
${ticket.mesero?.trim() ? `<div>Mesero: ${escapeHtml(ticket.mesero)}</div>` : ''}
<div>${escapeHtml(fechaTicket(ticket.emitida_en))}</div>
<div class="sep"></div>
${lineas}
<div class="sep"></div>`;

  return wrapThermalPreviewHtml(`Comanda #${ticket.id_pedido}`, cuerpo);
}

/** HTML estilo ticket térmico para factura / pre-cuenta. */
export function buildFacturaPreviewHtml(ticket: FacturaTicket): string {
  const banners: string[] = [];
  if (ticket.copia_destinatario === 'negocio') {
    banners.push('<div class="banner">*** COPIA NEGOCIO ***</div>');
  } else if (ticket.copia_destinatario === 'cliente') {
    banners.push('<div class="banner">*** COPIA CLIENTE ***</div>');
  }
  if (ticket.es_reimpresion) banners.push('<div class="banner">*** REIMPRESIÓN ***</div>');
  if (ticket.es_precuenta) {
    banners.push('<div class="banner">*** PRE-CUENTA ***</div>');
    banners.push('<div class="banner">NO COBRADA</div>');
    banners.push('<div class="muted center">Estado: pendiente de cobro</div>');
  }

  const filas = ticket.lineas
    .map((l) => {
      const extras = [
        ...(l.personalizaciones ?? []).map((p) => `  · ${escapeHtml(p)}`),
        l.nota_cocina?.trim()
          ? `  Nota: ${escapeHtml(l.nota_cocina.trim())}`
          : '',
      ]
        .filter(Boolean)
        .join('<br/>');
      return `<div class="row"><span>${l.cantidad}× ${escapeHtml(l.nombre_producto)}</span><span>${formatCop(l.subtotal_linea)}</span></div>${extras ? `<div class="muted">${extras}</div>` : ''}`;
    })
    .join('<br/>');

  const descuentos: string[] = [];
  if (ticket.descuento_sopas > 0) {
    descuentos.push(
      `<div class="row"><span>Desc. sopas</span><span>-${formatCop(ticket.descuento_sopas)}</span></div>`,
    );
  }
  if (ticket.descuento_muleros > 0) {
    descuentos.push(
      `<div class="row"><span>Desc. muleros</span><span>-${formatCop(ticket.descuento_muleros)}</span></div>`,
    );
  }
  if (ticket.descuento_promociones > 0) {
    descuentos.push(
      `<div class="row"><span>Desc. promos</span><span>-${formatCop(ticket.descuento_promociones)}</span></div>`,
    );
  }

  let vuelto = '';
  if (
    !ticket.es_precuenta &&
    !ticket.es_total_pedido &&
    ticket.detalle_exceso_cobro
  ) {
    const instrucciones = lineasTicketExcesoCobro(ticket.detalle_exceso_cobro);
    vuelto = instrucciones
      .map(
        (l) =>
          `<div class="row${l.destacado ? ' bold' : ''}"><span>${escapeHtml(l.etiqueta)}</span><span>${formatCop(l.monto)}</span></div>`,
      )
      .join('');
  } else if (
    !ticket.es_precuenta &&
    !ticket.es_total_pedido &&
    ticket.vuelto_cliente &&
    ticket.vuelto_cliente.vuelto_total > 0
  ) {
    const v = ticket.vuelto_cliente;
    const partes: string[] = [];
    if (v.monto_recibido_efectivo != null && v.monto_recibido_efectivo > 0) {
      partes.push(
        `<div class="row"><span>Recibido efectivo</span><span>${formatCop(v.monto_recibido_efectivo)}</span></div>`,
      );
    }
    if (
      v.monto_transferencia_recibido != null &&
      v.monto_transferencia_recibido > 0
    ) {
      partes.push(
        `<div class="row"><span>Recibido transfer.</span><span>${formatCop(v.monto_transferencia_recibido)}</span></div>`,
      );
    }
    partes.push(
      `<div class="row bold"><span>VUELTO</span><span>${formatCop(v.vuelto_total)}</span></div>`,
    );
    vuelto = partes.join('');
  }

  const encabezado = [
    `<div class="center bold">${escapeHtml(ticketNombreLocal())}</div>`,
    ticketTelefono() ? `<div class="center">Tel: ${escapeHtml(ticketTelefono())}</div>` : '',
    ticketDireccion() ? `<div class="center">${escapeHtml(ticketDireccion())}</div>` : '',
  ]
    .filter(Boolean)
    .join('');

  const cuerpo = `
${encabezado}
<div class="center bold">CUENTA / FACTURA</div>
${banners.join('')}
<div class="sep"></div>
<div class="bold">${escapeHtml(ticket.mesa_etiqueta)}</div>
<div>Pedido #${ticket.id_pedido}${ticket.id_factura != null ? ` · Factura #${ticket.id_factura}` : ''}</div>
<div>Mesero: ${escapeHtml(ticket.mesero || '—')}</div>
<div>Comensales: ${ticket.num_comensales}</div>
<div>${escapeHtml(fechaTicket(ticket.emitida_en))}</div>
${ticket.metodo_pago && !ticket.es_precuenta ? `<div>Pago: ${escapeHtml(labelMetodoPago(ticket.metodo_pago))}</div>` : ''}
<div class="sep"></div>
${filas}
<div class="sep"></div>
<div class="row"><span>Subtotal</span><span>${formatCop(ticket.subtotal)}</span></div>
${descuentos.join('')}
<div class="row bold"><span>TOTAL</span><span>${formatCop(ticket.total)}</span></div>
${vuelto}
<div class="sep"></div>
<div class="center">${escapeHtml(restaurantTextoGraciasTicket())}</div>
${ticket.es_precuenta ? `<div class="center muted">${escapeHtml(restaurantTextoPropinaTicket())}</div>` : ''}
${
  restaurantMostrarCreditoDrewTech()
    ? `<div class="center muted">${escapeHtml(DREWTECH_CREDITO_LINEA)}<br/>${escapeHtml(DREWTECH_TELEFONO_LABEL)}</div>`
    : ''
}
<div class="center muted">${escapeHtml(restaurantTextoAvisoNoDian())}</div>`;

  const titulo = ticket.es_precuenta
    ? `Pre-cuenta #${ticket.id_pedido}`
    : `Factura #${ticket.id_pedido}`;

  return wrapThermalPreviewHtml(titulo, cuerpo);
}
