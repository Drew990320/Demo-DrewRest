/**
 * Mesas virtuales 98 (para llevar) y 99 (mostrador). Ejecutar tras migrate deploy en Render.
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const DEFAULT_RESTAURANTE_ID = 1;

async function ensureMesaVirtual(numero) {
  await prisma.mesa.upsert({
    where: {
      idRestaurante_numero: {
        idRestaurante: DEFAULT_RESTAURANTE_ID,
        numero,
      },
    },
    create: {
      idRestaurante: DEFAULT_RESTAURANTE_ID,
      numero,
      capacidad: 1,
      estado: 'libre',
    },
    update: {},
  });
}

async function main() {
  await ensureMesaVirtual(98);
  await ensureMesaVirtual(99);
  console.log('Mesas virtuales listas: 98 (para llevar), 99 (mostrador).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
