/**
 * Mesas virtuales 98 (para llevar) y 99 (mostrador). Ejecutar tras migrate deploy en Render.
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  await prisma.mesa.upsert({
    where: { numero: 98 },
    create: { numero: 98, capacidad: 1, estado: 'libre' },
    update: {},
  });
  await prisma.mesa.upsert({
    where: { numero: 99 },
    create: { numero: 99, capacidad: 1, estado: 'libre' },
    update: {},
  });
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
