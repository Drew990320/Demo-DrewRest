/**
 * Mesas virtuales 98 (para llevar) y 99 (mostrador). Ejecutar tras migrate deploy en Render.
 */
const { PrismaClient } = require('@prisma/client');
const { ensureTenantBaseData } = require('./render-bootstrap-data');

const prisma = new PrismaClient();

ensureTenantBaseData(prisma)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
