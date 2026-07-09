-- Fase B: prioridad cocina configurable por flags (no por nombre de proteína).

CREATE TYPE "prioridad_cocina_modo" AS ENUM ('fifo', 'por_reglas', 'solo_manual');

ALTER TYPE "TipoProteina" ADD VALUE IF NOT EXISTS 'pescado';
ALTER TYPE "TipoProteina" ADD VALUE IF NOT EXISTS 'vegetariano';

ALTER TABLE "categoria"
ADD COLUMN "prioridad_cocina_baja" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "producto"
ADD COLUMN "prioridad_cocina_baja" BOOLEAN;

ALTER TABLE "config_operativa"
ADD COLUMN "prioridad_cocina_modo" "prioridad_cocina_modo" NOT NULL DEFAULT 'fifo';

-- Migrar boolean legacy → modo.
UPDATE "config_operativa"
SET "prioridad_cocina_modo" = 'por_reglas'
WHERE "prioridad_cocina_automatica" = true;

-- Backfill La Reserva / demo: categorías que antes inferían prioridad baja.
UPDATE "categoria"
SET "prioridad_cocina_baja" = true
WHERE nombre ILIKE '%cerdo%'
   OR nombre ILIKE '%para compartir%';

-- Productos con parrillada/picada en el nombre (demo).
UPDATE "producto" p
SET "prioridad_cocina_baja" = true
FROM "categoria" c
WHERE p."id_categoria" = c."id_categoria"
  AND (
    p.nombre ILIKE '%parrillada%'
    OR p.nombre ILIKE '%picada%'
  );
