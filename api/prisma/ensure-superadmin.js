/**
 * Crea rol y usuario superadmin si no existen (sin borrar datos).
 * Ejecutar tras migrate deploy en Render.
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function main() {
  const prisma = new PrismaClient();
  try {
    const rol = await prisma.rol.upsert({
      where: { nombre: 'superadmin' },
      create: {
        nombre: 'superadmin',
        descripcion: 'Operación oculta del sistema',
      },
      update: {},
    });

    const email =
      process.env.SUPERADMIN_EMAIL?.trim().toLowerCase() ||
      'superadmin@drewrest.local';
    const password = process.env.SUPERADMIN_PASSWORD?.trim() || 'superadmin123';
    const tenantId = 1;

    const existing = await prisma.usuario.findUnique({
      where: { idRestaurante_email: { idRestaurante: tenantId, email } },
    });
    if (existing) {
      console.log(`Superadmin ya existe: ${email}`);
      return;
    }

    await prisma.usuario.create({
      data: {
        idRestaurante: tenantId,
        idRol: rol.idRol,
        nombre: 'Superadmin',
        apellido: '',
        email,
        passwordHash: bcrypt.hashSync(password, 10),
        passwordCambiadoEn: new Date(),
        activo: true,
      },
    });
    console.log(`Superadmin creado: ${email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
