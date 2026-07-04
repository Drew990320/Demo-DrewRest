import type { CuentasDivididasTicket } from './cuentas-divididas-ticket';
import {
  bufferFromPrinter,
  createEscPosPrinter,
  DEFAULT_ESC_POS_WIDTH,
  formatCopEscPos,
  lineaConPrecio,
  printEncabezadoLaReserva,
} from './escpos-utils';
import { etiquetaMesaComanda } from './comanda-ticket';

function metodoLabel(m: string): string {
  if (m === 'efectivo') return 'Efectivo';
  if (m === 'transferencia') return 'Transferencia';
  return m;
}

export async function buildCuentasDivididasEscPos(
  ticket: CuentasDivididasTicket,
  charWidth = DEFAULT_ESC_POS_WIDTH,
): Promise<Buffer> {
  const printer = createEscPosPrinter(charWidth);
  const w = charWidth;
  const sep = '-'.repeat(w);

  await printEncabezadoLaReserva(printer);
  await printer.println('CUENTAS DIVIDIDAS');
  await printer.println(ticket.fecha);
  await printer.drawLine();

  await printer.alignLeft();
  await printer.println(
    `Impreso: ${new Date(ticket.emitida_en).toLocaleString('es-CO', {
      timeZone: 'America/Bogota',
    })}`,
  );
  await printer.println(sep);

  for (const ped of ticket.pedidos) {
    await printer.bold(true);
    await printer.println(
      `${ped.mesa_etiqueta || etiquetaMesaComanda(ped.mesa_numero)} · Pedido #${ped.id_pedido}`,
    );
    await printer.bold(false);
    await printer.println(
      lineaConPrecio('Total pedido', formatCopEscPos(ped.total_pedido), w),
    );
    for (const f of ped.facturas) {
      const hora = new Date(f.emitida_en).toLocaleTimeString('es-CO', {
        timeZone: 'America/Bogota',
        hour: '2-digit',
        minute: '2-digit',
      });
      const parcial = f.es_parcial ? ' (parcial)' : '';
      await printer.println(
        lineaConPrecio(
          `  Tanda ${f.tanda} · #${f.id_factura}${parcial}`,
          formatCopEscPos(f.total),
          w,
        ),
      );
      await printer.println(`    ${metodoLabel(f.metodo_pago)} · ${hora}`);
    }
    await printer.println(sep);
  }

  await printer.alignCenter();
  await printer.println('Fin del detalle');
  await printer.cut();

  return bufferFromPrinter(printer);
}
