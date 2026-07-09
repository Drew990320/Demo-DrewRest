"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCierreCajaEscPos = buildCierreCajaEscPos;
exports.buildBaseCajaEscPos = buildBaseCajaEscPos;
exports.buildBaseCajaCierreEscPos = buildBaseCajaCierreEscPos;
exports.buildMovimientoCajaEscPos = buildMovimientoCajaEscPos;
const escpos_utils_1 = require("./escpos-utils");
async function buildCierreCajaEscPos(ticket, charWidth = escpos_utils_1.DEFAULT_ESC_POS_WIDTH) {
    const printer = (0, escpos_utils_1.createEscPosPrinter)(charWidth);
    const w = charWidth;
    const sep = '-'.repeat(w);
    await printer.alignCenter();
    await printer.println('CIERRE DE CAJA');
    await printer.println(ticket.fecha);
    await printer.drawLine();
    await printer.alignLeft();
    await printer.println(`Impreso: ${new Date(ticket.emitida_en).toLocaleString('es-CO', {
        timeZone: 'America/Bogota',
    })}`);
    await printer.println(sep);
    await printer.bold(true);
    await printer.println((0, escpos_utils_1.lineaConPrecio)('Total consumido', (0, escpos_utils_1.formatCopEscPos)(ticket.total_facturado), w));
    await printer.bold(false);
    await printer.println(`Facturas del dia: ${ticket.total_facturas}`);
    await printer.println(sep);
    await printer.println((0, escpos_utils_1.lineaConPrecio)('Base del dia', (0, escpos_utils_1.formatCopEscPos)(ticket.monto_base_efectivo), w));
    await printer.println((0, escpos_utils_1.lineaConPrecio)('Efectivo (ventas)', (0, escpos_utils_1.formatCopEscPos)(ticket.totales_por_metodo.efectivo), w));
    if ((ticket.total_entradas_manual ?? 0) > 0) {
        await printer.println((0, escpos_utils_1.lineaConPrecio)('Entradas caja', (0, escpos_utils_1.formatCopEscPos)(ticket.total_entradas_manual ?? 0), w));
    }
    if ((ticket.subtotal_entradas_caja ?? 0) > 0) {
        await printer.bold(true);
        await printer.println((0, escpos_utils_1.lineaConPrecio)('Total entradas', (0, escpos_utils_1.formatCopEscPos)(ticket.subtotal_entradas_caja ?? 0), w));
        await printer.bold(false);
    }
    await printer.println((0, escpos_utils_1.lineaConPrecio)('Transferencias', (0, escpos_utils_1.formatCopEscPos)(ticket.totales_por_metodo.transferencia), w));
    if ((ticket.totales_por_metodo.fiado ?? 0) > 0) {
        await printer.println((0, escpos_utils_1.lineaConPrecio)('Fiado (por cobrar)', (0, escpos_utils_1.formatCopEscPos)(ticket.totales_por_metodo.fiado ?? 0), w));
        for (const f of ticket.fiados_dia ?? []) {
            const mesa = f.mesa_numero != null ? ` · mesa ${f.mesa_numero}` : '';
            const saldo = f.saldo_pendiente > 0 ? f.saldo_pendiente : f.monto_total;
            await printer.println((0, escpos_utils_1.lineaConPrecio)(`  ${f.nombre_cliente}${mesa}`, (0, escpos_utils_1.formatCopEscPos)(saldo), w));
        }
    }
    if ((ticket.total_pagos_meseros ?? 0) > 0) {
        await printer.println((0, escpos_utils_1.lineaConPrecio)('Pagos meseros', (0, escpos_utils_1.formatCopEscPos)(-(ticket.total_pagos_meseros ?? 0)), w));
    }
    if ((ticket.total_salidas_manual ?? 0) > 0) {
        await printer.println((0, escpos_utils_1.lineaConPrecio)('Salidas caja', (0, escpos_utils_1.formatCopEscPos)(-(ticket.total_salidas_manual ?? 0)), w));
    }
    if ((ticket.total_devoluciones_efectivo ?? 0) > 0) {
        await printer.println((0, escpos_utils_1.lineaConPrecio)('Devol. efectivo', (0, escpos_utils_1.formatCopEscPos)(-(ticket.total_devoluciones_efectivo ?? 0)), w));
    }
    if ((ticket.total_pagos_domicilio ?? 0) > 0) {
        await printer.println((0, escpos_utils_1.lineaConPrecio)('Domicilios', (0, escpos_utils_1.formatCopEscPos)(-(ticket.total_pagos_domicilio ?? 0)), w));
    }
    if ((ticket.total_pagos_mesero_exceso ?? 0) > 0) {
        await printer.println((0, escpos_utils_1.lineaConPrecio)('Mesero (exceso)', (0, escpos_utils_1.formatCopEscPos)(-(ticket.total_pagos_mesero_exceso ?? 0)), w));
    }
    if ((ticket.subtotal_salidas_caja ?? 0) > 0) {
        await printer.bold(true);
        await printer.println((0, escpos_utils_1.lineaConPrecio)('Total salidas', (0, escpos_utils_1.formatCopEscPos)(-(ticket.subtotal_salidas_caja ?? 0)), w));
        await printer.bold(false);
    }
    await printer.println(sep);
    await printer.bold(true);
    await printer.println((0, escpos_utils_1.lineaConPrecio)('Efectivo en caja', (0, escpos_utils_1.formatCopEscPos)(ticket.efectivo_esperado_en_caja), w));
    await printer.bold(false);
    await printer.println(sep);
    await printer.alignCenter();
    await printer.println('Fin del cierre');
    await printer.cut();
    return (0, escpos_utils_1.bufferFromPrinter)(printer);
}
async function buildBaseCajaEscPos(ticket, charWidth = escpos_utils_1.DEFAULT_ESC_POS_WIDTH) {
    const printer = (0, escpos_utils_1.createEscPosPrinter)(charWidth);
    const w = charWidth;
    const sep = '-'.repeat(w);
    await printer.alignCenter();
    await printer.println('CAJA INICIAL');
    await printer.println(ticket.fecha);
    await printer.drawLine();
    await printer.alignLeft();
    await printer.println(`Registrado: ${new Date(ticket.emitida_en).toLocaleString('es-CO', {
        timeZone: 'America/Bogota',
    })}`);
    await printer.println(sep);
    await printer.bold(true);
    await printer.println((0, escpos_utils_1.lineaConPrecio)('Base del dia', (0, escpos_utils_1.formatCopEscPos)(ticket.monto_base_efectivo), w));
    await printer.bold(false);
    await printer.println(sep);
    await printer.alignCenter();
    await printer.println('Listo');
    await printer.cut();
    return (0, escpos_utils_1.bufferFromPrinter)(printer);
}
async function buildBaseCajaCierreEscPos(ticket, charWidth = escpos_utils_1.DEFAULT_ESC_POS_WIDTH) {
    const printer = (0, escpos_utils_1.createEscPosPrinter)(charWidth);
    const w = charWidth;
    const sep = '-'.repeat(w);
    await printer.alignCenter();
    await printer.println('CAJA CIERRE');
    await printer.println(ticket.fecha);
    await printer.drawLine();
    await printer.alignLeft();
    await printer.println(`Registrado: ${new Date(ticket.emitida_en).toLocaleString('es-CO', {
        timeZone: 'America/Bogota',
    })}`);
    await printer.println(sep);
    await printer.bold(true);
    await printer.println((0, escpos_utils_1.lineaConPrecio)('Base de cierre', (0, escpos_utils_1.formatCopEscPos)(ticket.monto_base_cierre_efectivo), w));
    await printer.bold(false);
    const esperado = ticket.efectivo_esperado_en_caja;
    if (esperado != null && Number.isFinite(esperado)) {
        await printer.println((0, escpos_utils_1.lineaConPrecio)('Efectivo esperado', (0, escpos_utils_1.formatCopEscPos)(esperado), w));
        const diff = ticket.monto_base_cierre_efectivo - esperado;
        await printer.println((0, escpos_utils_1.lineaConPrecio)('Diferencia', (0, escpos_utils_1.formatCopEscPos)(diff), w));
    }
    await printer.println(sep);
    await printer.alignCenter();
    await printer.println('Listo');
    await printer.cut();
    return (0, escpos_utils_1.bufferFromPrinter)(printer);
}
async function buildMovimientoCajaEscPos(ticket, charWidth = escpos_utils_1.DEFAULT_ESC_POS_WIDTH) {
    const printer = (0, escpos_utils_1.createEscPosPrinter)(charWidth);
    const w = charWidth;
    const sep = '-'.repeat(w);
    const titulo = ticket.tipo === 'entrada_manual' ? 'ENTRADA DE CAJA' : 'SALIDA DE CAJA';
    const prefijoMonto = ticket.tipo === 'entrada_manual' ? '+' : '-';
    await printer.alignCenter();
    await printer.println(titulo);
    await printer.println(ticket.fecha);
    await printer.println(`Mov. #${ticket.id_movimiento}`);
    await printer.drawLine();
    await printer.alignLeft();
    await printer.println(`Registrado: ${new Date(ticket.creado_en).toLocaleString('es-CO', {
        timeZone: 'America/Bogota',
    })}`);
    if (ticket.registrado_por.trim()) {
        await printer.println(`Por: ${ticket.registrado_por.trim()}`);
    }
    await printer.println(sep);
    await printer.println('Motivo:');
    for (const line of (0, escpos_utils_1.wrapEscPos)(ticket.motivo.trim() || '-', w)) {
        await printer.println(line);
    }
    await printer.println(sep);
    await printer.bold(true);
    await printer.println((0, escpos_utils_1.lineaConPrecio)(ticket.tipo === 'entrada_manual' ? 'Entrada' : 'Salida', `${prefijoMonto}${(0, escpos_utils_1.formatCopEscPos)(ticket.monto)}`, w));
    await printer.bold(false);
    await printer.println(sep);
    await printer.alignCenter();
    await printer.println(`Impreso: ${new Date(ticket.emitida_en).toLocaleString('es-CO', {
        timeZone: 'America/Bogota',
    })}`);
    await printer.cut();
    return (0, escpos_utils_1.bufferFromPrinter)(printer);
}
//# sourceMappingURL=cierre-caja-escpos.builder.js.map