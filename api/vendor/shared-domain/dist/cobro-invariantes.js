"use strict";
/**
 * Invariantes y máquina de estados del cobro de un pedido.
 *
 * ## Máquina de estados (respecto al cobro)
 *
 * ```
 *   [abierto|en_cocina] ──cobro parcial──► parcialmente_pagado
 *         │                                        │
 *         │                                        │ cobro(s) que cierran
 *         │                                        ▼
 *         └──────── cobro total ────────────► facturado (pagado)
 *
 *   facturado ──reabrir todo (admin)──► abierto|en_cocina (todos los ítems pendientes)
 *   facturado|parcialmente_pagado ──revertir tanda (admin)──►
 *     parcialmente_pagado | pendiente (solo esa factura/grupo mixto)
 *     historial: cobro_reabierto + detalle.alcance = 'tanda'
 *   parcialmente_pagado ──cerrar anulando pendiente──► facturado
 *     (ítems no cobrados se anulan; no se revierten cobros previos)
 * ```
 *
 * El estado de cobro NO es un campo en Pedido: se deriva de
 * `Pedido.estado` + `DetallePedido.idFactura` + filas `Factura`.
 *
 * - pendiente: ninguna factura, todos los ítems con idFactura = null
 * - parcialmente_pagado: ≥1 factura y ≥1 ítem pendiente
 * - pagado: Pedido.estado = facturado (todos los ítems billables cobrados o anulados)
 *
 * ## Modalidades × formas de pago (soporte)
 *
 * | Modalidad   | efectivo | transferencia | mixto (efectivo+transferencia) |
 * |-------------|----------|---------------|--------------------------------|
 * | Normal      | sí       | sí            | sí (2 Factura + cobroMixtoGrupo) |
 * | Tandas      | sí       | sí            | sí por tanda                   |
 * | Por personas| sí       | sí            | sí por persona                 |
 * | Combinado   | sí       | sí            | sí por persona del grupo       |
 *
 * Mixto NUNCA es un MetodoPago en BD: son dos facturas enlazadas por cobroMixtoGrupo.
 *
 * ## Invariantes obligatorios
 *
 * 1. Ningún DetallePedido con idFactura puede volver a cobrarse.
 * 2. Suma de Factura.total del pedido ≤ total neto de ítems del pedido
 *    (igualdad al cerrar sin anulación).
 * 3. En un grupo mixto: total(efectivo) + total(transferencia) = total de la operación,
 *    y cada pata guarda su monto exacto (auditable).
 * 4. Montos en enteros COP (Math.round); sin float intermedio en totales.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.estadoCobroPedido = estadoCobroPedido;
exports.totalFacturadoPedido = totalFacturadoPedido;
exports.totalNetoDetalles = totalNetoDetalles;
exports.totalNetoDetallesCobrados = totalNetoDetallesCobrados;
exports.mixtoMontosCoincidenConReparto = mixtoMontosCoincidenConReparto;
exports.necesitaSplitPrecioMixto = necesitaSplitPrecioMixto;
exports.validarInvariantesCobroPedido = validarInvariantesCobroPedido;
exports.importesProporcionalesMixto = importesProporcionalesMixto;
/** Deriva el estado de cobro del pedido. */
function estadoCobroPedido(opts) {
    if (opts.estadoPedido === 'facturado')
        return 'pagado';
    const hayFacturas = opts.facturas.length > 0;
    const hayPendientes = opts.detalles.some((d) => !d.cobrado);
    if (hayFacturas && hayPendientes)
        return 'parcialmente_pagado';
    if (hayFacturas && !hayPendientes)
        return 'pagado';
    return 'pendiente';
}
function totalFacturadoPedido(facturas) {
    return facturas.reduce((s, f) => s + Math.round(Number(f.total)), 0);
}
function totalNetoDetalles(detalles) {
    return detalles.reduce((s, d) => s + Math.round(Number(d.precio_unitario)) * d.cantidad, 0);
}
function totalNetoDetallesCobrados(detalles) {
    return detalles
        .filter((d) => d.cobrado)
        .reduce((s, d) => s + Math.round(Number(d.precio_unitario)) * d.cantidad, 0);
}
/**
 * ¿El reparto por cantidad de un mixto ya produce los montos exactos
 * de efectivo y transferencia? Si no, hay que partir precios.
 */
function mixtoMontosCoincidenConReparto(totalLegEfectivo, totalLegTransferencia, efectivoFactura, transferenciaFactura) {
    return (Math.round(totalLegEfectivo) === Math.round(efectivoFactura) &&
        Math.round(totalLegTransferencia) === Math.round(transferenciaFactura));
}
/**
 * True cuando ambas patas del mixto tienen monto > 0 y el reparto por
 * cantidad no refleja esos montos (o alguna pata quedó vacía).
 */
function necesitaSplitPrecioMixto(opts) {
    const ef = Math.round(opts.efectivoFactura);
    const tr = Math.round(opts.transferenciaFactura);
    if (ef <= 0 || tr <= 0)
        return false;
    if (opts.solicitudesEfectivoLen === 0 ||
        opts.solicitudesTransferenciaLen === 0) {
        return true;
    }
    return !mixtoMontosCoincidenConReparto(opts.totalLegEfectivo, opts.totalLegTransferencia, ef, tr);
}
/**
 * Valida invariantes auditables de un pedido tras uno o más cobros.
 * `totalPedidoNeto` es el total de todos los ítems (cobrados + pendientes),
 * sin descuentos de factura (bruto de líneas). Para validar vs facturas con
 * descuento, pasar `totalFacturadoMaximo` explícito.
 */
function validarInvariantesCobroPedido(opts) {
    const errores = [];
    const facturado = totalFacturadoPedido(opts.facturas);
    if (opts.totalFacturadoMaximo != null) {
        const max = Math.round(opts.totalFacturadoMaximo);
        if (facturado > max) {
            errores.push(`Sobre-pago: facturado ${facturado} supera el máximo ${max}`);
        }
    }
    const cobrados = opts.detalles.filter((d) => d.cobrado);
    const brutoCobrado = totalNetoDetalles(cobrados);
    // Con descuentos, facturado puede ser < brutoCobrado; nunca debería ser mucho mayor.
    if (facturado > brutoCobrado + 1) {
        errores.push(`Facturado (${facturado}) supera el bruto de ítems cobrados (${brutoCobrado})`);
    }
    // Grupos mixtos: cada grupo debe tener efectivo + transferencia que sumen
    const porGrupo = new Map();
    for (const f of opts.facturas) {
        if (f.cobro_mixto_grupo == null)
            continue;
        const g = f.cobro_mixto_grupo;
        const arr = porGrupo.get(g) ?? [];
        arr.push(f);
        porGrupo.set(g, arr);
    }
    for (const [grupo, legs] of porGrupo) {
        const metodos = new Set(legs.map((l) => l.metodo_pago));
        if (!metodos.has('efectivo') || !metodos.has('transferencia')) {
            errores.push(`Grupo mixto ${grupo} incompleto (falta efectivo o transferencia)`);
            continue;
        }
        const ef = legs
            .filter((l) => l.metodo_pago === 'efectivo')
            .reduce((s, l) => s + Math.round(l.total), 0);
        const tr = legs
            .filter((l) => l.metodo_pago === 'transferencia')
            .reduce((s, l) => s + Math.round(l.total), 0);
        if (ef <= 0 || tr <= 0) {
            errores.push(`Grupo mixto ${grupo} con pata en cero (efectivo=${ef}, transferencia=${tr})`);
        }
    }
    return { ok: errores.length === 0, errores };
}
/**
 * Reparte subtotal/descuentos de una operación entre patas mixto de forma
 * que la suma de totales coincida exactamente con el total de la operación.
 * La primera pata usa montos redondeados; la segunda recibe el residuo.
 */
function importesProporcionalesMixto(full, montoPrimeraPata) {
    const totalFull = Math.round(full.total);
    const subFull = Math.round(full.subtotal);
    const dS = Math.round(full.descuento_sopas);
    const dM = Math.round(full.descuento_muleros);
    const dP = Math.round(full.descuento_promociones);
    const monto1 = Math.round(montoPrimeraPata);
    const monto2 = totalFull - monto1;
    if (totalFull <= 0 || monto1 <= 0) {
        return {
            primera: {
                subtotal: 0,
                descuento_sopas: 0,
                descuento_muleros: 0,
                descuento_promociones: 0,
                total: 0,
            },
            segunda: {
                subtotal: subFull,
                descuento_sopas: dS,
                descuento_muleros: dM,
                descuento_promociones: dP,
                total: totalFull,
            },
        };
    }
    if (monto2 <= 0) {
        return {
            primera: {
                subtotal: subFull,
                descuento_sopas: dS,
                descuento_muleros: dM,
                descuento_promociones: dP,
                total: totalFull,
            },
            segunda: {
                subtotal: 0,
                descuento_sopas: 0,
                descuento_muleros: 0,
                descuento_promociones: 0,
                total: 0,
            },
        };
    }
    const scale = monto1 / totalFull;
    const dS1 = Math.round(dS * scale);
    const dM1 = Math.round(dM * scale);
    const dP1 = Math.round(dP * scale);
    const desc1 = dS1 + dM1 + dP1;
    const sub1 = monto1 + desc1;
    return {
        primera: {
            subtotal: sub1,
            descuento_sopas: dS1,
            descuento_muleros: dM1,
            descuento_promociones: dP1,
            total: monto1,
        },
        segunda: {
            subtotal: subFull - sub1,
            descuento_sopas: dS - dS1,
            descuento_muleros: dM - dM1,
            descuento_promociones: dP - dP1,
            total: monto2,
        },
    };
}
