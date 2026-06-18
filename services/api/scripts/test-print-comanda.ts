/**
 * Prueba rápida de impresión (desde services/api):
 *   npx tsx scripts/test-print-comanda.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  const { buildComandaEscPos } = await import('../src/pedidos/comanda-escpos.builder');
  const { printRawWindows } = await import('../src/pedidos/windows-raw-print');

  const iface = process.env.PRINTER_INTERFACE ?? 'printer:POS-58';
  const first = iface.split(',')[0]?.trim() ?? '';
  const name = first.startsWith('printer:') ? first.slice(8) : 'POS-58';

  const buf = await buildComandaEscPos(
    {
      id_pedido: 0,
      mesa_numero: 1,
      mesa_etiqueta: 'Mesa 1',
      num_comensales: 2,
      mesero: 'Prueba script',
      modo_servicio: 'en_mesa',
      lineas: [
        {
          id_detalle: 1,
          cantidad: 1,
          nombre_producto: 'Prueba impresion POS',
          nota_cocina: null,
          personalizaciones: [],
        },
      ],
      emitida_en: new Date().toISOString(),
    },
    Number(process.env.PRINTER_WIDTH ?? 32),
  );

  console.log(`Enviando ${buf.length} bytes a impresora "${name}"...`);
  await printRawWindows(name, buf);
  console.log('OK — revise la impresora.');
}

main().catch((e) => {
  console.error('FALLÓ:', e instanceof Error ? e.message : e);
  process.exit(1);
});
