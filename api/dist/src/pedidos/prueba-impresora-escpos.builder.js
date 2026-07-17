"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPruebaImpresoraEscPos = buildPruebaImpresoraEscPos;
const instalacion_on_prem_1 = require("../sistema/instalacion-on-prem");
const escpos_utils_1 = require("./escpos-utils");
async function buildPruebaImpresoraEscPos(destino, charWidth = escpos_utils_1.DEFAULT_ESC_POS_WIDTH) {
    const printer = (0, escpos_utils_1.createEscPosPrinter)(charWidth);
    const w = charWidth;
    const sep = '-'.repeat(w);
    const instalacion = (0, instalacion_on_prem_1.leerInstalacionOnPrem)();
    const version = instalacion.version?.trim() || '1.0.0';
    const buildId = instalacion.build_id?.trim();
    const canal = instalacion.canal_label?.trim() || instalacion.canal?.trim();
    const local = (0, escpos_utils_1.ticketNombreLocal)();
    const ahora = new Date().toLocaleString('es-CO', {
        timeZone: 'America/Bogota',
    });
    await printer.alignCenter();
    await printer.bold(true);
    await printer.println('DREWREST');
    await printer.bold(false);
    await printer.println('Prueba de impresora POS');
    await printer.drawLine();
    await printer.alignLeft();
    await printer.println(`Local: ${local}`);
    await printer.println(`Fecha: ${ahora}`);
    await printer.println(sep);
    await printer.bold(true);
    await printer.println('Producto');
    await printer.bold(false);
    await printer.println('DrewRest — POS restaurante');
    await printer.println(`Version: ${version}`);
    if (buildId)
        await printer.println(`Build: ${buildId}`);
    if (canal) {
        for (const line of (0, escpos_utils_1.wrapEscPos)(`Canal: ${canal}`, w)) {
            await printer.println(line);
        }
    }
    if (instalacion.build_date) {
        await printer.println(`Empaquetado: ${instalacion.build_date}`);
    }
    await printer.println(sep);
    await printer.bold(true);
    await printer.println('Desarrollado por');
    await printer.bold(false);
    await printer.println('DrewTech');
    await printer.println('Software para restaurantes');
    await printer.println('Colombia');
    await printer.println(sep);
    await printer.bold(true);
    await printer.println('Destino de esta prueba');
    await printer.bold(false);
    for (const line of (0, escpos_utils_1.wrapEscPos)(destino, w)) {
        await printer.println(line);
    }
    await printer.println(sep);
    await printer.bold(true);
    await printer.println('Checklist visual');
    await printer.bold(false);
    await printer.println('[OK] Texto legible');
    await printer.println('[OK] Alineacion izquierda');
    await printer.println('[OK] Negrita / titulos');
    await printer.println('[OK] Lineas separadoras');
    await printer.println('[  ] Corte de papel');
    await printer.println(sep);
    await printer.println('Lineas de relleno (58 mm):');
    for (let i = 1; i <= 6; i++) {
        await printer.println(`${i}. Item demo prueba #${i}`);
    }
    await printer.println(sep);
    await printer.alignCenter();
    await printer.println('Si lee este ticket,');
    await printer.println('la impresora esta OK.');
    await printer.newLine();
    await printer.println('Gracias por usar');
    await printer.bold(true);
    await printer.println('DrewRest by DrewTech');
    await printer.bold(false);
    await printer.newLine();
    await printer.cut();
    return (0, escpos_utils_1.bufferFromPrinter)(printer);
}
//# sourceMappingURL=prueba-impresora-escpos.builder.js.map