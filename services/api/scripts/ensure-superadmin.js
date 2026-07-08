const SUPERADMIN_EMAIL = 'drewtechpos@gmail.com';
const SUPERADMIN_PASSWORD_HASH =
  '$2b$12$sfzLRAl5G7nFgTPlLN6BCuFY8libdtB60Uyt19U6sfhVVZCI1/ZQO';

async function ensureSuperadminUsuario(prisma) {
  await prisma.rol.upsert({
    where: { nombre: 'superadmin' },
    update: { descripcion: 'Superadministración DrewTech' },
    create: {
      nombre: 'superadmin',
      descripcion: 'Superadministración DrewTech',
    },
  });
  const rolSuper = await prisma.rol.findUniqueOrThrow({
    where: { nombre: 'superadmin' },
  });
  const rolAdmin = await prisma.rol.findUnique({ where: { nombre: 'admin' } });

  const otrosSuper = await prisma.usuario.findMany({
    where: {
      idRol: rolSuper.idRol,
      email: { not: SUPERADMIN_EMAIL },
    },
    select: { idUsuario: true },
  });
  if (otrosSuper.length > 0 && rolAdmin) {
    await prisma.usuario.updateMany({
      where: { idUsuario: { in: otrosSuper.map((u) => u.idUsuario) } },
      data: { idRol: rolAdmin.idRol },
    });
  }

  const existing = await prisma.usuario.findUnique({
    where: { email: SUPERADMIN_EMAIL },
  });
  if (existing) {
    const passwordDesactualizada =
      existing.passwordHash !== SUPERADMIN_PASSWORD_HASH;
    await prisma.usuario.update({
      where: { email: SUPERADMIN_EMAIL },
      data: {
        idRol: rolSuper.idRol,
        nombre: 'DrewTech',
        apellido: 'POS',
        activo: true,
        ...(passwordDesactualizada
          ? {
              passwordHash: SUPERADMIN_PASSWORD_HASH,
              passwordCambiadoEn: new Date(),
            }
          : {}),
      },
    });
    return;
  }

  await prisma.usuario.create({
    data: {
      idRol: rolSuper.idRol,
      nombre: 'DrewTech',
      apellido: 'POS',
      email: SUPERADMIN_EMAIL,
      passwordHash: SUPERADMIN_PASSWORD_HASH,
      passwordCambiadoEn: new Date(),
      activo: true,
    },
  });
}

module.exports = { ensureSuperadminUsuario, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD_HASH };
