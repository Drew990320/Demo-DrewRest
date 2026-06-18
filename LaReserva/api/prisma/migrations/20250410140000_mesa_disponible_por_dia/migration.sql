-- Antes solo existía `disponible_domingo` con semántica legacy: true = mesa extra solo domingos.
-- Pasamos a 7 flags: el día actual debe estar en true para que la mesa aparezca en la grilla.

ALTER TABLE "mesa" ADD COLUMN IF NOT EXISTS "disponible_lunes" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "mesa" ADD COLUMN IF NOT EXISTS "disponible_martes" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "mesa" ADD COLUMN IF NOT EXISTS "disponible_miercoles" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "mesa" ADD COLUMN IF NOT EXISTS "disponible_jueves" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "mesa" ADD COLUMN IF NOT EXISTS "disponible_viernes" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "mesa" ADD COLUMN IF NOT EXISTS "disponible_sabado" BOOLEAN NOT NULL DEFAULT true;

-- Copia desde la columna legacy (solo si aún refleja el significado antiguo).
UPDATE "mesa" SET
  "disponible_lunes" = NOT COALESCE("disponible_domingo", false),
  "disponible_martes" = NOT COALESCE("disponible_domingo", false),
  "disponible_miercoles" = NOT COALESCE("disponible_domingo", false),
  "disponible_jueves" = NOT COALESCE("disponible_domingo", false),
  "disponible_viernes" = NOT COALESCE("disponible_domingo", false),
  "disponible_sabado" = NOT COALESCE("disponible_domingo", false);

UPDATE "mesa" SET "disponible_domingo" = true;
