/**
 * Prepara la BD al arrancar en Render (plan free).
 * Migraciones con reintentos, mesas virtuales y seed inicial si está vacía.
 */
const { execSync } = require('child_process');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const apiRoot = path.join(__dirname, '..');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function run(cmd) {
  execSync(cmd, {
    cwd: apiRoot,
    stdio: 'inherit',
    env: process.env,
    shell: true,
  });
}

async function migrateWithRetry(maxAttempts = 8) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      run('npx prisma migrate deploy');
      return;
    } catch (error) {
      if (attempt >= maxAttempts) throw error;
      console.warn(
        `[cloud-db] Migración falló (intento ${attempt}/${maxAttempts}). Reintentando en 5s...`,
      );
      await sleep(5000);
    }
  }
}

async function ensureMesasVirtuales(prisma) {
  for (const numero of [98, 99]) {
    await prisma.mesa.upsert({
      where: { numero },
      create: { numero, capacidad: 1, estado: 'libre' },
      update: {},
    });
  }
}

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error('DATABASE_URL no está definida.');
  }

  console.log('[cloud-db] Aplicando migraciones...');
  await migrateWithRetry();

  const prisma = new PrismaClient();
  try {
    await ensureMesasVirtuales(prisma);
    const userCount = await prisma.usuario.count();
    const forceSeed =
      process.env.DEMO_FORCE_SEED === 'true' ||
      process.env.DEMO_FORCE_SEED === '1';

    if (userCount === 0 || forceSeed) {
      console.log('[cloud-db] Cargando datos de demostración...');
      run('npx prisma db seed');
    } else {
      console.log('[cloud-db] La base ya tiene datos — seed omitido.');
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log('[cloud-db] Base lista.');
}

main().catch((err) => {
  console.error('[cloud-db] Error:', err);
  process.exit(1);
});
