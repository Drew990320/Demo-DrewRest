import type { FacturaTicket } from './factura-ticket';
import { labelMetodoPago } from './factura-ticket';
import {
  bufferFromPrinter,
  createEscPosPrinter,
  DEFAULT_ESC_POS_WIDTH,
  formatCopEscPos,
  lineaConPrecio,
  wrapEscPos,
} from './escpos-utils';

const TICKET_LOCAL_TELEFONO = '3112249835';
const TICKET_LOCAL_DIRECCION = 'Vía al Batallón';
const TICKET_SISTEMA_CREADOR = 'Telefono: 3142998194';

function esTicketParaCliente(ticket: FacturaTicket): boolean {
  return ticket.copia_destinatario !== 'negocio';
}

/** Propina opcional (pre-cuenta, factura y copia cliente; no copia negocio). */
function lineasMensajePropina(charWidth: number): string[] {
  return wrapEscPos(
    'La propina es voluntaria.',
    charWidth,
  );
}

/** Ticket de cobro 58 mm: todos los ítems con precios y total. */
export async function buildFacturaEscPos(
  ticket: FacturaTicket,
  charWidth = DEFAULT_ESC_POS_WIDTH,
): Promise<Buffer> {
  const printer = createEscPosPrinter(charWidth);
  const w = charWidth;
  const sep = '-'.repeat(w);

  await printer.alignCenter();
  await printer.bold(true);
  await printer.println('LA RESERVA');
  await printer.bold(false);
  if (esTicketParaCliente(ticket)) {
    await printer.println(`Tel: ${TICKET_LOCAL_TELEFONO}`);
    for (const line of wrapEscPos(TICKET_LOCAL_DIRECCION, w)) {
      await printer.println(line);
    }
  }
  await printer.println('CUENTA / FACTURA');
  if (ticket.copia_destinatario === 'negocio') {
    await printer.bold(true);
    await printer.println('*** COPIA NEGOCIO ***');
    await printer.bold(false);
  } else if (ticket.copia_destinatario === 'cliente') {
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
  if (ticket.es_total_pedido) {
    await printer.bold(true);
    await printer.println('TOTAL DEL PEDIDO');
    await printer.bold(false);
  }
  await printer.drawLine();

  await printer.alignLeft();
  await printer.bold(true);
  for (const line of wrapEscPos(ticket.mesa_etiqueta, w)) {
    await printer.println(line);
  }
  await printer.bold(false);
  await printer.println(`Pedido #${ticket.id_pedido}`);
  if (ticket.id_factura != null) {
    await printer.println(`Factura #${ticket.id_factura}`);
  }
  await printer.println(`Comensales: ${ticket.num_comensales}`);
  await printer.println(`Mesero: ${ticket.mesero}`);
  if (ticket.modo_servicio === 'para_llevar') {
    await printer.println('Para llevar');
  }
  await printer.println(
    new Date(ticket.emitida_en).toLocaleString('es-CO', {
      timeZone: 'America/Bogota',
    }),
  );
  await printer.println(sep);

  for (const linea of ticket.lineas) {
    const titulo = `${linea.cantidad}x ${linea.nombre_producto}`;
    const precio = formatCopEscPos(linea.subtotal_linea);
    const tituloLines = wrapEscPos(titulo, w);
    if (tituloLines.length === 1) {
      await printer.println(lineaConPrecio(tituloLines[0], precio, w));
    } else {
      for (const tl of tituloLines) {
        await printer.println(tl);
      }
      await printer.println(lineaConPrecio('', precio, w));
    }
    for (const p of linea.personalizaciones) {
      for (const line of wrapEscPos(`  · ${p}`, w)) {
        await printer.println(line);
      }
    }
    if (linea.nota_cocina?.trim()) {
      for (const line of wrapEscPos(`  Nota: ${linea.nota_cocina.trim()}`, w)) {
        await printer.println(line);
      }
    }
  }

  await printer.println(sep);
  await printer.println(
    lineaConPrecio('Subtotal', formatCopEscPos(ticket.subtotal), w),
  );
  if (ticket.descuento_sopas > 0) {
    await printer.println(
      lineaConPrecio(
        'Desc. sopas',
        `-${formatCopEscPos(ticket.descuento_sopas)}`,
        w,
      ),
    );
  }
  if (ticket.descuento_muleros > 0) {
    await printer.println(
      lineaConPrecio(
        'Desc. camionero',
        `-${formatCopEscPos(ticket.descuento_muleros)}`,
        w,
      ),
    );
  }
  await printer.bold(true);
  await printer.println(
    lineaConPrecio('TOTAL', formatCopEscPos(ticket.total), w),
  );
  await printer.bold(false);
  if (ticket.es_precuenta) {
    await printer.println('Estado: pendiente de cobro');
  } else if (ticket.cobros_resumen && ticket.cobros_resumen.length > 1) {
    await printer.println('Cobros:');
    for (const c of ticket.cobros_resumen) {
      await printer.println(
        lineaConPrecio(
          `  ${labelMetodoPago(c.metodo_pago)}`,
          formatCopEscPos(c.total),
          w,
        ),
      );
    }
  } else {
    await printer.println(`Pago: ${labelMetodoPago(ticket.metodo_pago)}`);
  }

  if (esTicketParaCliente(ticket)) {
    await printer.println(sep);
    await printer.alignCenter();
    for (const line of lineasMensajePropina(w)) {
      await printer.println(line);
    }
  }

  await printer.println(sep);
  await printer.alignCenter();
  await printer.println('Gracias por su visita');
  await printer.newLine();
  await printer.println('Sistema de Restaurante La Reserva elaborado por: ');
  await printer.println(TICKET_SISTEMA_CREADOR);
  await printer.cut();

  return bufferFromPrinter(printer);
}
