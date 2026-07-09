"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFacturaEmailText = buildFacturaEmailText;
exports.buildFacturaEmailHtml = buildFacturaEmailHtml;
const escpos_utils_1 = require("./escpos-utils");
const restaurant_branding_1 = require("../common/restaurant-branding");
const factura_ticket_1 = require("./factura-ticket");
const factura_vuelto_1 = require("@drewrest/shared-domain/factura-vuelto");
function formatCop(n) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
    }).format(n);
}
function escapeHtml(s) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function fechaTicket(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime()))
        return iso;
    return d.toLocaleString('es-CO', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}
function buildFacturaEmailText(ticket) {
    const lines = [(0, escpos_utils_1.ticketNombreLocal)()];
    if ((0, escpos_utils_1.ticketTelefono)())
        lines.push(`Tel: ${(0, escpos_utils_1.ticketTelefono)()}`);
    if ((0, escpos_utils_1.ticketDireccion)())
        lines.push((0, escpos_utils_1.ticketDireccion)());
    lines.push('Cuenta / Factura', '', `${ticket.mesa_etiqueta}`, `Pedido #${ticket.id_pedido}`, ticket.id_factura != null ? `Factura #${ticket.id_factura}` : '', `Mesero: ${ticket.mesero || '—'}`, `Comensales: ${ticket.num_comensales}`, `Fecha: ${fechaTicket(ticket.emitida_en)}`, `Pago: ${(0, factura_ticket_1.labelMetodoPago)(ticket.metodo_pago)}`, '', 'Detalle', '--------');
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
    if (!ticket.es_precuenta &&
        !ticket.es_total_pedido &&
        ticket.detalle_exceso_cobro) {
        const instrucciones = (0, factura_vuelto_1.lineasTicketExcesoCobro)(ticket.detalle_exceso_cobro);
        if (instrucciones.length > 0) {
            lines.push('');
            for (const l of instrucciones) {
                lines.push(`${l.etiqueta}: ${formatCop(l.monto)}`);
            }
        }
    }
    else if (!ticket.es_precuenta &&
        !ticket.es_total_pedido &&
        ticket.vuelto_cliente &&
        ticket.vuelto_cliente.vuelto_total > 0) {
        const v = ticket.vuelto_cliente;
        if (v.monto_recibido_efectivo != null && v.monto_recibido_efectivo > 0) {
            lines.push(`Recibido efectivo: ${formatCop(v.monto_recibido_efectivo)}`);
        }
        if (v.monto_transferencia_recibido != null &&
            v.monto_transferencia_recibido > 0) {
            lines.push(`Recibido transferencia: ${formatCop(v.monto_transferencia_recibido)}`);
        }
        if (v.vuelto_efectivo > 0 && v.vuelto_transferencia > 0) {
            lines.push(`Vuelto efectivo: ${formatCop(v.vuelto_efectivo)}`);
            lines.push(`Vuelto transferencia: ${formatCop(v.vuelto_transferencia)}`);
        }
        lines.push(`VUELTO: ${formatCop(v.vuelto_total)}`);
    }
    lines.push('');
    lines.push((0, restaurant_branding_1.restaurantTextoGraciasTicket)());
    const pieCorreo = (0, restaurant_branding_1.restaurantTextoPieCorreo)();
    if (pieCorreo)
        lines.push(pieCorreo);
    if ((0, restaurant_branding_1.restaurantMostrarCreditoDrewTech)()) {
        lines.push(escpos_utils_1.DREWTECH_CREDITO_LINEA);
        lines.push(escpos_utils_1.DREWTECH_TELEFONO_LABEL);
    }
    lines.push((0, restaurant_branding_1.restaurantTextoAvisoNoDian)());
    return lines.filter((x) => x !== '').join('\n');
}
function buildFacturaEmailHtml(ticket) {
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
    const descuentos = [];
    if (ticket.descuento_sopas > 0) {
        descuentos.push(`<tr><td>Desc. sopas</td><td style="text-align:right">-${formatCop(ticket.descuento_sopas)}</td></tr>`);
    }
    if (ticket.descuento_muleros > 0) {
        descuentos.push(`<tr><td>Desc. muleros</td><td style="text-align:right">-${formatCop(ticket.descuento_muleros)}</td></tr>`);
    }
    if (ticket.descuento_promociones > 0) {
        descuentos.push(`<tr><td>Desc. promociones</td><td style="text-align:right">-${formatCop(ticket.descuento_promociones)}</td></tr>`);
    }
    const vueltoHtml = !ticket.es_precuenta &&
        !ticket.es_total_pedido &&
        ticket.detalle_exceso_cobro
        ? (() => {
            const instrucciones = (0, factura_vuelto_1.lineasTicketExcesoCobro)(ticket.detalle_exceso_cobro);
            if (instrucciones.length === 0)
                return '';
            const filas = instrucciones.map((l) => {
                const bold = l.destacado
                    ? 'font-weight:bold;color:#8b3a2b'
                    : '';
                return `<tr><td style="${bold}">${escapeHtml(l.etiqueta)}</td><td style="text-align:right;${bold}">${formatCop(l.monto)}</td></tr>`;
            });
            return `<table style="width:100%;margin-top:12px;font-size:14px;border-top:1px solid #eee;padding-top:8px">${filas.join('')}</table>`;
        })()
        : !ticket.es_precuenta &&
            !ticket.es_total_pedido &&
            ticket.vuelto_cliente &&
            ticket.vuelto_cliente.vuelto_total > 0
            ? (() => {
                const v = ticket.vuelto_cliente;
                const filasVuelto = [];
                if (v.monto_recibido_efectivo != null && v.monto_recibido_efectivo > 0) {
                    filasVuelto.push(`<tr><td>Recibido efectivo</td><td style="text-align:right">${formatCop(v.monto_recibido_efectivo)}</td></tr>`);
                }
                if (v.monto_transferencia_recibido != null &&
                    v.monto_transferencia_recibido > 0) {
                    filasVuelto.push(`<tr><td>Recibido transferencia</td><td style="text-align:right">${formatCop(v.monto_transferencia_recibido)}</td></tr>`);
                }
                if (v.vuelto_efectivo > 0 && v.vuelto_transferencia > 0) {
                    filasVuelto.push(`<tr><td>Vuelto efectivo</td><td style="text-align:right">${formatCop(v.vuelto_efectivo)}</td></tr>`, `<tr><td>Vuelto transferencia</td><td style="text-align:right">${formatCop(v.vuelto_transferencia)}</td></tr>`);
                }
                filasVuelto.push(`<tr><td style="padding-top:8px"><strong>VUELTO</strong></td><td style="padding-top:8px;text-align:right;color:#8b3a2b"><strong>${formatCop(v.vuelto_total)}</strong></td></tr>`);
                return `<table style="width:100%;margin-top:12px;font-size:14px;border-top:1px solid #eee;padding-top:8px">${filasVuelto.join('')}</table>`;
            })()
            : '';
    return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /><title>Factura ${escapeHtml((0, restaurant_branding_1.restaurantName)())}</title></head>
<body style="margin:0;padding:0;background:#f6f4f1;font-family:Segoe UI,Arial,sans-serif;color:#2c241c">
  <div style="max-width:520px;margin:24px auto;background:#fff;border-radius:12px;padding:24px;border:1px solid #e8e0d8">
    <h1 style="margin:0 0 4px;font-size:22px;color:#8b3a2b">${escapeHtml((0, escpos_utils_1.ticketNombreLocal)())}</h1>
    ${(0, escpos_utils_1.ticketTelefono)()
        ? `<p style="margin:0 0 2px;color:#555;font-size:14px">Tel: ${escapeHtml((0, escpos_utils_1.ticketTelefono)())}</p>`
        : ''}
    ${(0, escpos_utils_1.ticketDireccion)()
        ? `<p style="margin:0 0 12px;color:#555;font-size:14px">${escapeHtml((0, escpos_utils_1.ticketDireccion)())}</p>`
        : '<p style="margin:0 0 12px"></p>'}
    <p style="margin:0 0 16px;color:#666;font-size:14px">Cuenta / Factura</p>
    <p style="margin:0 0 4px"><strong>${escapeHtml(ticket.mesa_etiqueta)}</strong></p>
    <p style="margin:0 0 4px;font-size:14px;color:#555">Pedido #${ticket.id_pedido}${ticket.id_factura != null ? ` · Factura #${ticket.id_factura}` : ''}</p>
    <p style="margin:0 0 4px;font-size:14px;color:#555">Mesero: ${escapeHtml(ticket.mesero || '—')}</p>
    <p style="margin:0 0 4px;font-size:14px;color:#555">Fecha: ${escapeHtml(fechaTicket(ticket.emitida_en))}</p>
    <p style="margin:0 0 16px;font-size:14px;color:#555">Pago: ${escapeHtml((0, factura_ticket_1.labelMetodoPago)(ticket.metodo_pago))}</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">${filas}</table>
    <table style="width:100%;margin-top:12px;font-size:14px">
      <tr><td>Subtotal</td><td style="text-align:right">${formatCop(ticket.subtotal)}</td></tr>
      ${descuentos.join('')}
      <tr><td style="padding-top:8px;font-size:18px"><strong>Total</strong></td>
          <td style="padding-top:8px;text-align:right;font-size:18px;color:#8b3a2b"><strong>${formatCop(ticket.total)}</strong></td></tr>
    </table>
    ${vueltoHtml}
    <p style="margin:20px 0 0;font-size:13px;color:#666">${escapeHtml((0, restaurant_branding_1.restaurantTextoGraciasTicket)())}</p>
    ${(0, restaurant_branding_1.restaurantTextoPieCorreo)()
        ? `<p style="margin:8px 0 0;font-size:12px;color:#888">${escapeHtml((0, restaurant_branding_1.restaurantTextoPieCorreo)())}</p>`
        : ''}
    ${(0, restaurant_branding_1.restaurantMostrarCreditoDrewTech)()
        ? `<p style="margin:12px 0 0;font-size:11px;color:#999">${escapeHtml(escpos_utils_1.DREWTECH_CREDITO_LINEA)}</p>
    <p style="margin:2px 0 0;font-size:11px;color:#999">${escapeHtml(escpos_utils_1.DREWTECH_TELEFONO_LABEL)}</p>`
        : ''}
    <p style="margin:8px 0 0;font-size:11px;color:#999">${escapeHtml((0, restaurant_branding_1.restaurantTextoAvisoNoDian)())}</p>
  </div>
</body>
</html>`;
}
//# sourceMappingURL=factura-email.builder.js.map