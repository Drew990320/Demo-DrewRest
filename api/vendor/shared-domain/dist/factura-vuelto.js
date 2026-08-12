"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detalleExcesoCobroActivo = detalleExcesoCobroActivo;
exports.parseDetalleExcesoCobro = parseDetalleExcesoCobro;
exports.resumenesSimplesExcesoCobro = resumenesSimplesExcesoCobro;
exports.lineasTicketExcesoCobro = lineasTicketExcesoCobro;
exports.calcularDetalleExcesoCobro = calcularDetalleExcesoCobro;
exports.calcularVueltoCliente = calcularVueltoCliente;
exports.transferenciaRecibidaDeFactura = transferenciaRecibidaDeFactura;
exports.totalTransferidoRecibido = totalTransferidoRecibido;
const factura_mixto_1 = require("./factura-mixto");
function detalleExcesoCobroActivo(d) {
    return (d.vuelto_cliente_efectivo > 0 ||
        d.vuelto_cliente_transferencia > 0 ||
        d.pago_domiciliario > 0 ||
        d.pago_mesero > 0);
}
function parseDetalleExcesoCobro(raw) {
    if (!raw || typeof raw !== 'object')
        return null;
    const o = raw;
    const num = (k) => {
        const v = o[k];
        return typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : 0;
    };
    const opt = (k) => {
        const v = o[k];
        return typeof v === 'number' && Number.isFinite(v) && v > 0
            ? Math.round(v)
            : undefined;
    };
    const d = {
        monto_recibido_efectivo: opt('monto_recibido_efectivo'),
        monto_transferencia_recibido: opt('monto_transferencia_recibido'),
        vuelto_cliente_efectivo: num('vuelto_cliente_efectivo'),
        vuelto_cliente_transferencia: num('vuelto_cliente_transferencia'),
        pago_domiciliario: num('pago_domiciliario'),
        pago_mesero: num('pago_mesero'),
    };
    return detalleExcesoCobroActivo(d) ||
        d.monto_recibido_efectivo != null ||
        d.monto_transferencia_recibido != null
        ? d
        : null;
}
/** Totales simples para el ticket: una línea clara por acción. */
function resumenesSimplesExcesoCobro(d) {
    const out = [];
    const vueltoCliente = d.vuelto_cliente_efectivo + d.vuelto_cliente_transferencia;
    if (vueltoCliente > 0) {
        out.push({ etiqueta: 'VUELTO', monto: vueltoCliente });
    }
    if (d.pago_domiciliario > 0) {
        out.push({ etiqueta: 'PAGO DOMICILIARIO', monto: d.pago_domiciliario });
    }
    if (d.pago_mesero > 0) {
        out.push({ etiqueta: 'PAGO MESERO', monto: d.pago_mesero });
    }
    return out;
}
/** Líneas ordenadas para ticket impreso / correo. */
function lineasTicketExcesoCobro(d) {
    const out = [];
    if (d.monto_recibido_efectivo != null && d.monto_recibido_efectivo > 0) {
        out.push({
            etiqueta: 'Recibido efectivo',
            monto: d.monto_recibido_efectivo,
        });
    }
    if (d.monto_transferencia_recibido != null &&
        d.monto_transferencia_recibido > 0) {
        out.push({
            etiqueta: 'Recibido transfer.',
            monto: d.monto_transferencia_recibido,
        });
    }
    for (const r of resumenesSimplesExcesoCobro(d)) {
        out.push({ ...r, destacado: true });
    }
    return out;
}
function calcularDetalleExcesoCobro(params) {
    const t = Math.max(0, Math.round(params.total));
    if (t <= 0)
        return null;
    const ef = Math.max(0, Math.round(params.monto_recibido_efectivo ?? 0));
    const tr = Math.max(0, Math.round(params.monto_transferencia ?? 0));
    const dev = params.devolucion_exceso_metodo ?? null;
    const withMontos = () => ({
        ...(ef > 0 ? { monto_recibido_efectivo: ef } : {}),
        ...(tr > 0 ? { monto_transferencia_recibido: tr } : {}),
        vuelto_cliente_efectivo: 0,
        vuelto_cliente_transferencia: 0,
        pago_domiciliario: 0,
        pago_mesero: 0,
    });
    const asignarExceso = (d, monto) => {
        if (monto <= 0 || !dev)
            return;
        switch (dev) {
            case 'efectivo':
                d.vuelto_cliente_efectivo += monto;
                break;
            case 'transferencia':
                d.vuelto_cliente_transferencia += monto;
                break;
            case 'domicilio':
                d.pago_domiciliario += monto;
                break;
            case 'mesero':
                d.pago_mesero += monto;
                break;
        }
    };
    if (params.metodo === 'efectivo') {
        if (ef <= t)
            return null;
        const d = withMontos();
        d.vuelto_cliente_efectivo = ef - t;
        return d;
    }
    if (params.metodo === 'transferencia') {
        if (tr <= t)
            return null;
        const d = withMontos();
        asignarExceso(d, tr - t);
        return detalleExcesoCobroActivo(d) ? d : null;
    }
    const vueltoTotal = tr + ef - t;
    if (vueltoTotal <= 0)
        return null;
    const reparto = (0, factura_mixto_1.repartoMixtoConDevolucion)(t, tr, ef, dev);
    const d = withMontos();
    if (dev === 'transferencia') {
        d.vuelto_cliente_transferencia = vueltoTotal;
        return d;
    }
    if (reparto.excesoDevolverEfectivo > 0 && tr >= t) {
        d.vuelto_cliente_efectivo = ef;
        asignarExceso(d, tr - t);
        return detalleExcesoCobroActivo(d) ? d : null;
    }
    const vueltoEf = Math.max(0, ef - reparto.efectivoFactura);
    if (vueltoEf <= 0)
        return null;
    d.vuelto_cliente_efectivo = vueltoEf;
    return d;
}
/** Solo vuelto al cliente (compatibilidad). */
function calcularVueltoCliente(params) {
    const d = calcularDetalleExcesoCobro(params);
    if (!d)
        return null;
    const vuelto_efectivo = d.vuelto_cliente_efectivo;
    const vuelto_transferencia = d.vuelto_cliente_transferencia;
    const vuelto_total = vuelto_efectivo + vuelto_transferencia;
    if (vuelto_total <= 0)
        return null;
    return {
        monto_recibido_efectivo: d.monto_recibido_efectivo,
        monto_transferencia_recibido: d.monto_transferencia_recibido,
        vuelto_total,
        vuelto_efectivo,
        vuelto_transferencia,
    };
}
/**
 * Monto transferido en esta factura: si hay exceso, el recibido completo;
 * si no, el total de la pata transferencia.
 */
function transferenciaRecibidaDeFactura(f) {
    const recibido = parseDetalleExcesoCobro(f.detalle_exceso_cobro)
        ?.monto_transferencia_recibido ?? 0;
    if (recibido > 0)
        return recibido;
    if (f.metodo_pago === 'transferencia') {
        return Math.max(0, Math.round(Number(f.total) || 0));
    }
    return 0;
}
/**
 * Suma lo transferido (incluye exceso a domicilio/mesero/vuelto).
 * En cobro mixto el snapshot se duplica en ambas patas: se cuenta una sola vez.
 */
function totalTransferidoRecibido(facturas) {
    let total = 0;
    const mixtoVisto = new Set();
    const mixtoPendiente = new Map();
    for (const f of facturas) {
        const grupo = f.cobro_mixto_grupo != null ? Number(f.cobro_mixto_grupo) : NaN;
        if (Number.isFinite(grupo) && grupo > 0) {
            const arr = mixtoPendiente.get(grupo) ?? [];
            arr.push(f);
            mixtoPendiente.set(grupo, arr);
            continue;
        }
        total += transferenciaRecibidaDeFactura(f);
    }
    for (const [grupo, cobros] of mixtoPendiente) {
        if (mixtoVisto.has(grupo))
            continue;
        mixtoVisto.add(grupo);
        const recibido = cobros
            .map((c) => parseDetalleExcesoCobro(c.detalle_exceso_cobro)
            ?.monto_transferencia_recibido ?? 0)
            .find((n) => n > 0);
        if (recibido && recibido > 0) {
            total += recibido;
            continue;
        }
        total += cobros.reduce((s, c) => s + transferenciaRecibidaDeFactura(c), 0);
    }
    return total;
}
