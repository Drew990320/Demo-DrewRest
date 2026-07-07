/**
 * Ejecutar manualmente: poblar categorías y productos demo sin borrar usuarios ni pedidos.
 * Uso: npm run demo:seed-menu --prefix services/api
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { PrismaClient } = require('@prisma/client');
const { ensureDemoMenu, ensureDemoMesas } = require('./ensure-demo-menu');

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error('DATABASE_URL no está definida.');
  }
  const prisma = new PrismaClient();
  try {
    await ensureDemoMesas(prisma);
    const { categoriasCreadas, productosCreados } = await ensureDemoMenu(prisma);
    console.log(
      `Menú demo listo: +${categoriasCreadas} categorías, +${productosCreados} productos nuevos.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
