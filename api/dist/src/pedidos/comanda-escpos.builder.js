"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildComandaEscPos = buildComandaEscPos;
const escpos_utils_1 = require("./escpos-utils");
async function buildComandaEscPos(ticket, charWidth = escpos_utils_1.DEFAULT_ESC_POS_WIDTH) {
    const printer = (0, escpos_utils_1.createEscPosPrinter)(charWidth);
    const w = charWidth;
    const sep = '-'.repeat(w);
    await printer.alignCenter();
    await printer.println('COMANDA COCINA');
    if (ticket.es_adicional) {
        await printer.bold(true);
        await printer.println('*** ADICIONAL ***');
        await printer.bold(false);
    }
    if (ticket.es_reimpresion) {
        await printer.bold(true);
        await printer.println('*** REIMPRESION ***');
        await printer.bold(false);
    }
    await printer.drawLine();
    await printer.alignLeft();
    await printer.bold(true);
    for (const line of (0, escpos_utils_1.wrapEscPos)(ticket.mesa_etiqueta, w)) {
        await printer.println(line);
    }
    await printer.bold(false);
    await printer.println(`Pedido #${ticket.id_pedido}`);
    await printer.println(`Comensales: ${ticket.num_comensales}`);
    if (ticket.mesero?.trim()) {
        await printer.println(`Mesero: ${ticket.mesero}`);
    }
    if (ticket.modo_servicio === 'para_llevar') {
        await printer.bold(true);
        await printer.println('*** PARA LLEVAR ***');
        await printer.bold(false);
    }
    await printer.println(new Date(ticket.emitida_en).toLocaleString('es-CO', {
        timeZone: 'America/Bogota',
    }));
    await printer.println(sep);
    for (const linea of ticket.lineas) {
        await printer.bold(true);
        for (const line of (0, escpos_utils_1.wrapEscPos)(`${linea.cantidad}x ${linea.nombre_producto}`, w)) {
            await printer.println(line);
        }
        await printer.bold(false);
        for (const p of linea.personalizaciones) {
            for (const line of (0, escpos_utils_1.wrapEscPos)(`  · ${p}`, w)) {
                await printer.println(line);
            }
        }
        if (linea.nota_cocina?.trim()) {
            for (const line of (0, escpos_utils_1.wrapEscPos)(`  Nota: ${linea.nota_cocina.trim()}`, w)) {
                await printer.println(line);
            }
        }
        await printer.newLine();
    }
    await printer.println(sep);
    await printer.cut();
    return (0, escpos_utils_1.bufferFromPrinter)(printer);
}
//# sourceMappingURL=comanda-escpos.builder.js.map