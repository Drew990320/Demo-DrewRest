-- Menús por franja (desayuno/almuerzo/cena) con precio por menú y override operativo.

CREATE TABLE IF NOT EXISTS "menu" (
    "id_menu" SERIAL NOT NULL,
    "id_restaurante" INTEGER NOT NULL DEFAULT 1,
    "nombre" VARCHAR(100) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "prioridad" INTEGER NOT NULL DEFAULT 0,
    "es_default" BOOLEAN NOT NULL DEFAULT false,
    "hora_inicio" VARCHAR(5) NOT NULL DEFAULT '00:00',
    "hora_fin" VARCHAR(5) NOT NULL DEFAULT '23:59',
    "disponible_lunes" BOOLEAN NOT NULL DEFAULT true,
    "disponible_martes" BOOLEAN NOT NULL DEFAULT true,
    "disponible_miercoles" BOOLEAN NOT NULL DEFAULT true,
    "disponible_jueves" BOOLEAN NOT NULL DEFAULT true,
    "disponible_viernes" BOOLEAN NOT NULL DEFAULT true,
    "disponible_sabado" BOOLEAN NOT NULL DEFAULT true,
    "disponible_domingo" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "menu_pkey" PRIMARY KEY ("id_menu")
);

CREATE UNIQUE INDEX IF NOT EXISTS "menu_id_restaurante_nombre_key"
  ON "menu"("id_restaurante", "nombre");

CREATE INDEX IF NOT EXISTS "menu_id_restaurante_activo_prioridad_idx"
  ON "menu"("id_restaurante", "activo", "prioridad");

CREATE UNIQUE INDEX IF NOT EXISTS "menu_id_restaurante_es_default_key"
  ON "menu"("id_restaurante")
  WHERE "es_default" = true;

DO $$ BEGIN
  ALTER TABLE "menu"
    ADD CONSTRAINT "menu_id_restaurante_fkey"
    FOREIGN KEY ("id_restaurante") REFERENCES "restaurante"("id_restaurante")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "menu_producto" (
    "id_menu_producto" SERIAL NOT NULL,
    "id_menu" INTEGER NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "precio" DECIMAL(10, 2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "menu_producto_pkey" PRIMARY KEY ("id_menu_producto")
);

CREATE UNIQUE INDEX IF NOT EXISTS "menu_producto_id_menu_id_producto_key"
  ON "menu_producto"("id_menu", "id_producto");

CREATE INDEX IF NOT EXISTS "menu_producto_id_menu_activo_idx"
  ON "menu_producto"("id_menu", "activo");

CREATE INDEX IF NOT EXISTS "menu_producto_id_producto_idx"
  ON "menu_producto"("id_producto");

DO $$ BEGIN
  ALTER TABLE "menu_producto"
    ADD CONSTRAINT "menu_producto_id_menu_fkey"
    FOREIGN KEY ("id_menu") REFERENCES "menu"("id_menu")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "menu_producto"
    ADD CONSTRAINT "menu_producto_id_producto_fkey"
    FOREIGN KEY ("id_producto") REFERENCES "producto"("id_producto")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "config_operativa" ADD COLUMN IF NOT EXISTS "id_menu_override" INTEGER;
ALTER TABLE "config_operativa" ADD COLUMN IF NOT EXISTS "menu_override_hasta" TIMESTAMP(3);

DO $$ BEGIN
  ALTER TABLE "config_operativa"
    ADD CONSTRAINT "config_operativa_id_menu_override_fkey"
    FOREIGN KEY ("id_menu_override") REFERENCES "menu"("id_menu")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Menú General por restaurante + backfill de productos activos.
INSERT INTO "menu" (
  "id_restaurante",
  "nombre",
  "activo",
  "prioridad",
  "es_default",
  "hora_inicio",
  "hora_fin",
  "disponible_lunes",
  "disponible_martes",
  "disponible_miercoles",
  "disponible_jueves",
  "disponible_viernes",
  "disponible_sabado",
  "disponible_domingo"
)
SELECT
  r."id_restaurante",
  'General',
  true,
  0,
  true,
  '00:00',
  '23:59',
  true, true, true, true, true, true, true
FROM "restaurante" r
WHERE NOT EXISTS (
  SELECT 1 FROM "menu" m
  WHERE m."id_restaurante" = r."id_restaurante" AND m."nombre" = 'General'
);

INSERT INTO "menu_producto" ("id_menu", "id_producto", "precio", "activo")
SELECT
  m."id_menu",
  p."id_producto",
  p."precio",
  true
FROM "producto" p
INNER JOIN "categoria" c ON c."id_categoria" = p."id_categoria"
INNER JOIN "menu" m ON m."id_restaurante" = c."id_restaurante" AND m."es_default" = true
WHERE p."activo" = true
  AND NOT EXISTS (
    SELECT 1 FROM "menu_producto" mp
    WHERE mp."id_menu" = m."id_menu" AND mp."id_producto" = p."id_producto"
  );
