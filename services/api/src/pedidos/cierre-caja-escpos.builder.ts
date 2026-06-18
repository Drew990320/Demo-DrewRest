import type { BaseCajaTicket, CierreCajaTicket } from './cierre-caja-ticket';

import {

  bufferFromPrinter,

  createEscPosPrinter,

  DEFAULT_ESC_POS_WIDTH,

  formatCopEscPos,

  lineaConPrecio,

} from './escpos-utils';



/** Ticket de cierre: base del día, ventas en efectivo/transferencia y total en caja. */

export async function buildCierreCajaEscPos(

  ticket: CierreCajaTicket,

  charWidth = DEFAULT_ESC_POS_WIDTH,

): Promise<Buffer> {

  const printer = createEscPosPrinter(charWidth);

  const w = charWidth;

  const sep = '-'.repeat(w);



  await printer.alignCenter();

  await printer.bold(true);

  await printer.println('LA RESERVA');

  await printer.bold(false);

  await printer.println('CIERRE DE CAJA');

  await printer.println(ticket.fecha);

  await printer.drawLine();



  await printer.alignLeft();

  await printer.println(

    `Impreso: ${new Date(ticket.emitida_en).toLocaleString('es-CO', {

      timeZone: 'America/Bogota',

    })}`,

  );

  await printer.println(sep);



  await printer.bold(true);

  await printer.println(

    lineaConPrecio(

      'Total consumido',

      formatCopEscPos(ticket.total_facturado),

      w,

    ),

  );

  await printer.bold(false);

  await printer.println(`Facturas del dia: ${ticket.total_facturas}`);

  await printer.println(sep);



  await printer.println(

    lineaConPrecio(

      'Base del dia',

      formatCopEscPos(ticket.monto_base_efectivo),

      w,

    ),

  );

  await printer.println(

    lineaConPrecio(

      'Efectivo (ventas)',

      formatCopEscPos(ticket.totales_por_metodo.efectivo),

      w,

    ),

  );

  await printer.println(

    lineaConPrecio(

      'Transferencias',

      formatCopEscPos(ticket.totales_por_metodo.transferencia),

      w,

    ),

  );

  await printer.println(sep);

  await printer.bold(true);

  await printer.println(

    lineaConPrecio(

      'Efectivo en caja',

      formatCopEscPos(ticket.efectivo_esperado_en_caja),

      w,

    ),

  );

  await printer.bold(false);



  await printer.println(sep);

  await printer.alignCenter();

  await printer.println('Fin del cierre');

  await printer.cut();



  return bufferFromPrinter(printer);

}



/** Comprobante al registrar la base de caja del día. */

export async function buildBaseCajaEscPos(

  ticket: BaseCajaTicket,

  charWidth = DEFAULT_ESC_POS_WIDTH,

): Promise<Buffer> {

  const printer = createEscPosPrinter(charWidth);

  const w = charWidth;

  const sep = '-'.repeat(w);



  await printer.alignCenter();

  await printer.bold(true);

  await printer.println('LA RESERVA');

  await printer.bold(false);

  await printer.println('CAJA INICIAL');

  await printer.println(ticket.fecha);

  await printer.drawLine();



  await printer.alignLeft();

  await printer.println(

    `Registrado: ${new Date(ticket.emitida_en).toLocaleString('es-CO', {

      timeZone: 'America/Bogota',

    })}`,

  );

  await printer.println(sep);

  await printer.bold(true);

  await printer.println(

    lineaConPrecio(

      'Base del dia',

      formatCopEscPos(ticket.monto_base_efectivo),

      w,

    ),

  );

  await printer.bold(false);

  await printer.println(sep);

  await printer.alignCenter();

  await printer.println('Listo');

  await printer.cut();



  return bufferFromPrinter(printer);

}


