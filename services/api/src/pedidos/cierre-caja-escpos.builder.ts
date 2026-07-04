import type { BaseCajaTicket, CierreCajaTicket } from './cierre-caja-ticket';

import {

  bufferFromPrinter,

  createEscPosPrinter,

  DEFAULT_ESC_POS_WIDTH,

  formatCopEscPos,

  lineaConPrecio,
  printEncabezadoLaReserva,

} from './escpos-utils';



/** Ticket de cierre: base del día, ventas en efectivo/transferencia y total en caja. */

export async function buildCierreCajaEscPos(

  ticket: CierreCajaTicket,

  charWidth = DEFAULT_ESC_POS_WIDTH,

): Promise<Buffer> {

  const printer = createEscPosPrinter(charWidth);

  const w = charWidth;

  const sep = '-'.repeat(w);



  await printEncabezadoLaReserva(printer);

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

  if ((ticket.total_entradas_manual ?? 0) > 0) {
    await printer.println(
      lineaConPrecio(
        'Entradas caja',
        formatCopEscPos(ticket.total_entradas_manual ?? 0),
        w,
      ),
    );
  }

  if ((ticket.subtotal_entradas_caja ?? 0) > 0) {
    await printer.bold(true);
    await printer.println(
      lineaConPrecio(
        'Total entradas',
        formatCopEscPos(ticket.subtotal_entradas_caja ?? 0),
        w,
      ),
    );
    await printer.bold(false);
  }

  await printer.println(

    lineaConPrecio(

      'Transferencias',

      formatCopEscPos(ticket.totales_por_metodo.transferencia),

      w,

    ),

  );

  if ((ticket.total_pagos_meseros ?? 0) > 0) {
    await printer.println(
      lineaConPrecio(
        'Pagos meseros',
        formatCopEscPos(-(ticket.total_pagos_meseros ?? 0)),
        w,
      ),
    );
  }

  if ((ticket.total_salidas_manual ?? 0) > 0) {
    await printer.println(
      lineaConPrecio(
        'Salidas caja',
        formatCopEscPos(-(ticket.total_salidas_manual ?? 0)),
        w,
      ),
    );
  }
  if ((ticket.total_devoluciones_efectivo ?? 0) > 0) {
    await printer.println(
      lineaConPrecio(
        'Devol. efectivo',
        formatCopEscPos(-(ticket.total_devoluciones_efectivo ?? 0)),
        w,
      ),
    );
  }
  if ((ticket.total_pagos_domicilio ?? 0) > 0) {
    await printer.println(
      lineaConPrecio(
        'Domicilios',
        formatCopEscPos(-(ticket.total_pagos_domicilio ?? 0)),
        w,
      ),
    );
  }
  if ((ticket.total_pagos_mesero_exceso ?? 0) > 0) {
    await printer.println(
      lineaConPrecio(
        'Mesero (exceso)',
        formatCopEscPos(-(ticket.total_pagos_mesero_exceso ?? 0)),
        w,
      ),
    );
  }

  if ((ticket.subtotal_salidas_caja ?? 0) > 0) {
    await printer.bold(true);
    await printer.println(
      lineaConPrecio(
        'Total salidas',
        formatCopEscPos(-(ticket.subtotal_salidas_caja ?? 0)),
        w,
      ),
    );
    await printer.bold(false);
  }

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



  await printEncabezadoLaReserva(printer);

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


