import type { ComandaTicket } from './comanda-ticket';
import {
  bufferFromPrinter,
  createEscPosPrinter,
  DEFAULT_ESC_POS_WIDTH,
  printEncabezadoLaReserva,
  wrapEscPos,
} from './escpos-utils';

/** Genera bytes ESC/POS para comanda 58 mm (sin precios). */
export async function buildComandaEscPos(
  ticket: ComandaTicket,
  charWidth = DEFAULT_ESC_POS_WIDTH,
): Promise<Buffer> {
  const printer = createEscPosPrinter(charWidth);
  const w = charWidth;
  const sep = '-'.repeat(w);

  await printEncabezadoLaReserva(printer);
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
  for (const line of wrapEscPos(ticket.mesa_etiqueta, w)) {
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
  await printer.println(
    new Date(ticket.emitida_en).toLocaleString('es-CO', {
      timeZone: 'America/Bogota',
    }),
  );
  await printer.println(sep);

  for (const linea of ticket.lineas) {
    await printer.bold(true);
    for (const line of wrapEscPos(`${linea.cantidad}x ${linea.nombre_producto}`, w)) {
      await printer.println(line);
    }
    await printer.bold(false);
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
    await printer.newLine();
  }

  await printer.println(sep);
  await printer.cut();

  return bufferFromPrinter(printer);
}
