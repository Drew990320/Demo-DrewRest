"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFacturaEscPos = buildFacturaEscPos;
const factura_ticket_1 = require("./factura-ticket");
const factura_vuelto_1 = require("@drewrest/shared-domain/factura-vuelto");
const escpos_utils_1 = require("./escpos-utils");
const restaurant_branding_1 = require("../common/restaurant-branding");
function esTicketParaCliente(ticket) {
    return ticket.copia_destinatario !== 'negocio';
}
function lineasMensajePropina(charWidth) {
    return (0, escpos_utils_1.wrapEscPos)((0, restaurant_branding_1.restaurantTextoPropinaTicket)(), charWidth);
}
function ticketLlevaLogoCliente(ticket) {
    if (ticket.es_total_pedido)
        return false;
    return ticket.es_precuenta === true || esTicketParaCliente(ticket);
}
async function buildFacturaEscPos(ticket, charWidth = escpos_utils_1.DEFAULT_ESC_POS_WIDTH) {
    const printer = (0, escpos_utils_1.createEscPosPrinter)(charWidth);
    const w = charWidth;
    const sep = '-'.repeat(w);
    if (ticketLlevaLogoCliente(ticket)) {
        await (0, escpos_utils_1.printEncabezadoRestaurante)(printer, w);
    }
    else {
        await printer.alignCenter();
    }
    await printer.println('CUENTA / FACTURA');
    if (ticket.copia_destinatario === 'negocio') {
        await printer.bold(true);
        await printer.println('*** COPIA NEGOCIO ***');
        await printer.bold(false);
    }
    else if (ticket.copia_destinatario === 'cliente') {
        await printer.bold(true);
        await printer.println('*** COPIA CLIENTE ***');
        await printer.bold(false);
    }
    if (ticket.es_reimpresion) {
        await printer.bold(true);
        await printer.println('*** REIMPRESION ***');
        await printer.bold(false);
    }
    if (ticket.es_precuenta) {
        await printer.bold(true);
        await printer.println('*** PRE-CUENTA ***');
        await printer.println('NO COBRADA');
        await printer.bold(false);
    }
    if (ticket.es_cobro_parcial) {
        await printer.bold(true);
        await printer.println('COBRO PARCIAL');
        await printer.bold(false);
    }
    if (ticket.es_cobro_combinado && !ticket.es_cobro_parcial) {
        await printer.println('Cobro combinado (esta tanda)');
    }
    if (ticket.es_cuota_combinado) {
        await printer.println('Ítems seleccionados (referencia)');
    }
    if (ticket.es_cuota_personas) {
        await printer.println('Pedido completo (referencia)');
    }
    if (ticket.es_total_pedido) {
        await printer.bold(true);
        await printer.println('TOTAL DEL PEDIDO');
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
    if (ticket.id_factura != null) {
        await printer.println(`Factura #${ticket.id_factura}`);
    }
    await printer.println(`Comensales: ${ticket.num_comensales}`);
    if (ticket.mesero?.trim()) {
        await printer.println(`Mesero: ${ticket.mesero}`);
    }
    if (ticket.modo_servicio === 'para_llevar') {
        await printer.println('Para llevar');
    }
    await printer.println(new Date(ticket.emitida_en).toLocaleString('es-CO', {
        timeZone: 'America/Bogota',
    }));
    await printer.println(sep);
    for (const linea of ticket.lineas) {
        const titulo = `${linea.cantidad}x ${linea.nombre_producto}`;
        const tituloLines = (0, escpos_utils_1.wrapEscPos)(titulo, w);
        const sinPrecioLinea = ticket.es_cuota_personas || ticket.es_cuota_combinado;
        if (sinPrecioLinea) {
            for (const tl of tituloLines) {
                await printer.println(tl);
            }
        }
        else {
            const precio = (0, escpos_utils_1.formatCopEscPos)(linea.subtotal_linea);
            if (tituloLines.length === 1) {
                await printer.println((0, escpos_utils_1.lineaConPrecio)(tituloLines[0], precio, w));
            }
            else {
                for (const tl of tituloLines) {
                    await printer.println(tl);
                }
                await printer.println((0, escpos_utils_1.lineaConPrecio)('', precio, w));
            }
        }
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
    }
    await printer.println(sep);
    await printer.println((0, escpos_utils_1.lineaConPrecio)('Subtotal', (0, escpos_utils_1.formatCopEscPos)(ticket.subtotal), w));
    if (ticket.descuento_sopas > 0) {
        await printer.println((0, escpos_utils_1.lineaConPrecio)('Desc. sopas', `-${(0, escpos_utils_1.formatCopEscPos)(ticket.descuento_sopas)}`, w));
    }
    if (ticket.descuento_muleros > 0) {
        await printer.println((0, escpos_utils_1.lineaConPrecio)('Desc. camionero', `-${(0, escpos_utils_1.formatCopEscPos)(ticket.descuento_muleros)}`, w));
    }
    if (ticket.promociones_desglose && ticket.promociones_desglose.length > 0) {
        for (const p of ticket.promociones_desglose) {
            if (p.monto <= 0)
                continue;
            await printer.println((0, escpos_utils_1.lineaConPrecio)(`Desc. ${p.etiqueta}`, `-${(0, escpos_utils_1.formatCopEscPos)(p.monto)}`, w));
        }
    }
    else if (ticket.descuento_promociones > 0) {
        await printer.println((0, escpos_utils_1.lineaConPrecio)('Desc. promociones', `-${(0, escpos_utils_1.formatCopEscPos)(ticket.descuento_promociones)}`, w));
    }
    await printer.bold(true);
    await printer.println((0, escpos_utils_1.lineaConPrecio)('TOTAL', (0, escpos_utils_1.formatCopEscPos)(ticket.total), w));
    await printer.bold(false);
    if (ticket.es_precuenta) {
        await printer.println('Estado: pendiente de cobro');
    }
    else if (ticket.metodo_pago === 'mixto' && ticket.cobros_resumen?.length) {
        await printer.println('Cobros:');
        for (const c of ticket.cobros_resumen) {
            await printer.println((0, escpos_utils_1.lineaConPrecio)(`  ${(0, factura_ticket_1.labelMetodoPago)(c.metodo_pago)}`, (0, escpos_utils_1.formatCopEscPos)(c.total), w));
        }
        await printer.println(`Pago: ${(0, factura_ticket_1.labelMetodoPago)('mixto')}`);
    }
    else if (ticket.cobros_resumen && ticket.cobros_resumen.length > 1) {
        await printer.println('Cobros:');
        for (const c of ticket.cobros_resumen) {
            await printer.println((0, escpos_utils_1.lineaConPrecio)(`  ${(0, factura_ticket_1.labelMetodoPago)(c.metodo_pago)}`, (0, escpos_utils_1.formatCopEscPos)(c.total), w));
        }
    }
    else {
        await printer.println(`Pago: ${(0, factura_ticket_1.labelMetodoPago)(ticket.metodo_pago)}`);
    }
    if (ticket.fiado_cliente) {
        await printer.println(`Cliente fiado: ${ticket.fiado_cliente}`);
        if (ticket.fiado_telefono) {
            await printer.println(`Tel: ${ticket.fiado_telefono}`);
        }
    }
    if (!ticket.es_precuenta &&
        !ticket.es_total_pedido &&
        ticket.detalle_exceso_cobro) {
        const lineas = (0, factura_vuelto_1.lineasTicketExcesoCobro)(ticket.detalle_exceso_cobro);
        if (lineas.length > 0) {
            await printer.println(sep);
            for (const l of lineas) {
                if (l.destacado)
                    await printer.bold(true);
                await printer.println((0, escpos_utils_1.lineaConPrecio)(l.etiqueta, (0, escpos_utils_1.formatCopEscPos)(l.monto), w));
                if (l.destacado)
                    await printer.bold(false);
            }
        }
    }
    else if (!ticket.es_precuenta &&
        !ticket.es_total_pedido &&
        ticket.vuelto_cliente &&
        ticket.vuelto_cliente.vuelto_total > 0) {
        const v = ticket.vuelto_cliente;
        await printer.println(sep);
        if (v.monto_recibido_efectivo != null && v.monto_recibido_efectivo > 0) {
            await printer.println((0, escpos_utils_1.lineaConPrecio)('Recibido efectivo', (0, escpos_utils_1.formatCopEscPos)(v.monto_recibido_efectivo), w));
        }
        if (v.monto_transferencia_recibido != null &&
            v.monto_transferencia_recibido > 0) {
            await printer.println((0, escpos_utils_1.lineaConPrecio)('Recibido transfer.', (0, escpos_utils_1.formatCopEscPos)(v.monto_transferencia_recibido), w));
        }
        await printer.bold(true);
        if (v.vuelto_efectivo > 0 && v.vuelto_transferencia > 0) {
            await printer.println((0, escpos_utils_1.lineaConPrecio)('Vuelto efectivo', (0, escpos_utils_1.formatCopEscPos)(v.vuelto_efectivo), w));
            await printer.println((0, escpos_utils_1.lineaConPrecio)('Vuelto transfer.', (0, escpos_utils_1.formatCopEscPos)(v.vuelto_transferencia), w));
        }
        await printer.println((0, escpos_utils_1.lineaConPrecio)('VUELTO', (0, escpos_utils_1.formatCopEscPos)(v.vuelto_total), w));
        await printer.bold(false);
    }
    if (esTicketParaCliente(ticket)) {
        await printer.println(sep);
        await printer.alignCenter();
        await printer.bold(true);
        for (const line of lineasMensajePropina(w)) {
            await printer.println(line);
        }
        await printer.bold(false);
    }
    await printer.println(sep);
    await printer.alignCenter();
    await printer.println((0, restaurant_branding_1.restaurantTextoGraciasTicket)());
    if (ticketLlevaLogoCliente(ticket)) {
        await (0, escpos_utils_1.printPieDrewTechFactura)(printer, w);
    }
    await printer.cut();
    return (0, escpos_utils_1.bufferFromPrinter)(printer);
}
//# sourceMappingURL=factura-escpos.builder.js.map