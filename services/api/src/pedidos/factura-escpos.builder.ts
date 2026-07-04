import type { FacturaTicket } from './factura-ticket';
import { labelMetodoPago } from './factura-ticket';
import {
  bufferFromPrinter,
  createEscPosPrinter,
  DEFAULT_ESC_POS_WIDTH,
  formatCopEscPos,
  lineaConPrecio,
  printEncabezadoLaReserva,
  printPieDrewTechFactura,
  wrapEscPos,
} from './escpos-utils';

function esTicketParaCliente(ticket: FacturaTicket): boolean {
  return ticket.copia_destinatario !== 'negocio';
}

/** Propina opcional (pre-cuenta, factura y copia cliente; no copia negocio). */
const TICKET_PROPINA_LINEA = '*** PROPINA VOLUNTARIA ***';

function lineasMensajePropina(charWidth: number): string[] {
  return wrapEscPos(TICKET_PROPINA_LINEA, charWidth);
}

/** Ticket de cobro 58 mm: todos los ítems con precios y total. */
export async function buildFacturaEscPos(
  ticket: FacturaTicket,
  charWidth = DEFAULT_ESC_POS_WIDTH,
): Promise<Buffer> {
  const printer = createEscPosPrinter(charWidth);
  const w = charWidth;
  const sep = '-'.repeat(w);

  await printEncabezadoLaReserva(printer);
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
  for (const line of wrapEscPos(ticket.mesa_etiqueta, w)) {
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
  await printer.println(
    new Date(ticket.emitida_en).toLocaleString('es-CO', {
      timeZone: 'America/Bogota',
    }),
  );
  await printer.println(sep);

  for (const linea of ticket.lineas) {
    const titulo = `${linea.cantidad}x ${linea.nombre_producto}`;
    const tituloLines = wrapEscPos(titulo, w);
    const sinPrecioLinea = ticket.es_cuota_personas || ticket.es_cuota_combinado;
    if (sinPrecioLinea) {
      for (const tl of tituloLines) {
        await printer.println(tl);
      }
    } else {
      const precio = formatCopEscPos(linea.subtotal_linea);
      if (tituloLines.length === 1) {
        await printer.println(lineaConPrecio(tituloLines[0], precio, w));
      } else {
        for (const tl of tituloLines) {
          await printer.println(tl);
        }
        await printer.println(lineaConPrecio('', precio, w));
      }
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
  if (ticket.promociones_desglose && ticket.promociones_desglose.length > 0) {
    for (const p of ticket.promociones_desglose) {
      if (p.monto <= 0) continue;
      await printer.println(
        lineaConPrecio(
          `Desc. ${p.etiqueta}`,
          `-${formatCopEscPos(p.monto)}`,
          w,
        ),
      );
    }
  } else if (ticket.descuento_promociones > 0) {
    await printer.println(
      lineaConPrecio(
        'Desc. promociones',
        `-${formatCopEscPos(ticket.descuento_promociones)}`,
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
  } else if (ticket.metodo_pago === 'mixto' && ticket.cobros_resumen?.length) {
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
    await printer.println(`Pago: ${labelMetodoPago('mixto')}`);
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
    await printer.bold(true);
    for (const line of lineasMensajePropina(w)) {
      await printer.println(line);
    }
    await printer.bold(false);
  }

  await printer.println(sep);
  await printer.alignCenter();
  await printer.println('Gracias por su visita');
  // Contacto del creador del sistema: solo en la factura que se lleva el cliente.
  if (ticket.copia_destinatario === 'cliente' && !ticket.es_precuenta) {
    await printPieDrewTechFactura(printer, w);
  }
  await printer.cut();

  return bufferFromPrinter(printer);
}
