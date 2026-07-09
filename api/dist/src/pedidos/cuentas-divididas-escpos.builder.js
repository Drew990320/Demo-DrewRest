"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCuentasDivididasEscPos = buildCuentasDivididasEscPos;
const escpos_utils_1 = require("./escpos-utils");
const comanda_ticket_1 = require("./comanda-ticket");
function metodoLabel(m) {
    if (m === 'efectivo')
        return 'Efectivo';
    if (m === 'transferencia')
        return 'Transferencia';
    return m;
}
async function buildCuentasDivididasEscPos(ticket, charWidth = escpos_utils_1.DEFAULT_ESC_POS_WIDTH) {
    const printer = (0, escpos_utils_1.createEscPosPrinter)(charWidth);
    const w = charWidth;
    const sep = '-'.repeat(w);
    await printer.alignCenter();
    await printer.println('CUENTAS DIVIDIDAS');
    await printer.println(ticket.fecha);
    await printer.drawLine();
    await printer.alignLeft();
    await printer.println(`Impreso: ${new Date(ticket.emitida_en).toLocaleString('es-CO', {
        timeZone: 'America/Bogota',
    })}`);
    await printer.println(sep);
    for (const ped of ticket.pedidos) {
        await printer.bold(true);
        await printer.println(`${ped.mesa_etiqueta || (0, comanda_ticket_1.etiquetaMesaComanda)(ped.mesa_numero)} · Pedido #${ped.id_pedido}`);
        await printer.bold(false);
        await printer.println((0, escpos_utils_1.lineaConPrecio)('Total pedido', (0, escpos_utils_1.formatCopEscPos)(ped.total_pedido), w));
        for (const f of ped.facturas) {
            const hora = new Date(f.emitida_en).toLocaleTimeString('es-CO', {
                timeZone: 'America/Bogota',
                hour: '2-digit',
                minute: '2-digit',
            });
            const parcial = f.es_parcial ? ' (parcial)' : '';
            await printer.println((0, escpos_utils_1.lineaConPrecio)(`  Tanda ${f.tanda} · #${f.id_factura}${parcial}`, (0, escpos_utils_1.formatCopEscPos)(f.total), w));
            await printer.println(`    ${metodoLabel(f.metodo_pago)} · ${hora}`);
        }
        await printer.println(sep);
    }
    await printer.alignCenter();
    await printer.println('Fin del detalle');
    await printer.cut();
    return (0, escpos_utils_1.bufferFromPrinter)(printer);
}
//# sourceMappingURL=cuentas-divididas-escpos.builder.js.map