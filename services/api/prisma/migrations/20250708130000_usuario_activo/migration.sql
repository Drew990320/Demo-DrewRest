-- Columna requerida por schema.prisma; faltaba en migraciones previas.
ALTER TABLE "usuario" ADD COLUMN IF NOT EXISTS "activo" BOOLEAN NOT NULL DEFAULT true;
