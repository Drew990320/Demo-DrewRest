-- Beneficios por turno: varios productos con descuento en COP (reemplaza soda única).

CREATE TABLE IF NOT EXISTS "beneficio_turno_producto" (
    "id_beneficio_turno" SERIAL NOT NULL,
    "id_restaurante" INTEGER NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "monto_descuento" DECIMAL(12,2) NOT NULL,
    "descontar_stock" BOOLEAN NOT NULL DEFAULT true,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beneficio_turno_producto_pkey" PRIMARY KEY ("id_beneficio_turno")
);

CREATE UNIQUE INDEX IF NOT EXISTS "beneficio_turno_producto_id_restaurante_id_producto_key"
  ON "beneficio_turno_producto"("id_restaurante", "id_producto");

CREATE INDEX IF NOT EXISTS "beneficio_turno_producto_id_restaurante_activo_idx"
  ON "beneficio_turno_producto"("id_restaurante", "activo");

DO $$ BEGIN
  ALTER TABLE "beneficio_turno_producto"
    ADD CONSTRAINT "beneficio_turno_producto_id_restaurante_fkey"
    FOREIGN KEY ("id_restaurante") REFERENCES "restaurante"("id_restaurante")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "beneficio_turno_producto"
    ADD CONSTRAINT "beneficio_turno_producto_id_producto_fkey"
    FOREIGN KEY ("id_producto") REFERENCES "producto"("id_producto")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO "beneficio_turno_producto" (
  "id_restaurante",
  "id_producto",
  "monto_descuento",
  "descontar_stock",
  "activo",
  "orden",
  "actualizado_en"
)
SELECT
  co."id_restaurante",
  co."id_producto_soda_almuerzo",
  COALESCE(p."precio", 0),
  COALESCE(co."soda_almuerzo_descontar_stock", true),
  COALESCE(co."beneficio_soda_almuerzo_activo", false),
  0,
  CURRENT_TIMESTAMP
FROM "config_operativa" co
JOIN "producto" p ON p."id_producto" = co."id_producto_soda_almuerzo"
WHERE co."id_producto_soda_almuerzo" IS NOT NULL
ON CONFLICT ("id_restaurante", "id_producto") DO NOTHING;

ALTER TABLE "registro_beneficio_mesero"
  ADD COLUMN IF NOT EXISTS "clave_unica" VARCHAR(40),
  ADD COLUMN IF NOT EXISTS "id_beneficio_turno" INTEGER;

UPDATE "registro_beneficio_mesero"
SET "clave_unica" = 'pago'
WHERE "tipo" = 'pago_turno' AND ("clave_unica" IS NULL OR "clave_unica" = '');

UPDATE "registro_beneficio_mesero" AS r
SET
  "tipo" = 'descuento_turno',
  "id_beneficio_turno" = b."id_beneficio_turno",
  "clave_unica" = 'd:' || b."id_beneficio_turno"::text,
  "monto" = COALESCE(r."monto", b."monto_descuento"),
  "id_producto" = COALESCE(r."id_producto", b."id_producto")
FROM "beneficio_turno_producto" AS b,
     "usuario" AS u
WHERE u."id_usuario" = r."id_usuario"
  AND r."tipo" = 'soda_almuerzo'
  AND b."id_restaurante" = u."id_restaurante"
  AND (r."id_producto" IS NULL OR r."id_producto" = b."id_producto");

UPDATE "registro_beneficio_mesero"
SET
  "tipo" = 'descuento_turno',
  "clave_unica" = CASE
    WHEN "id_producto" IS NOT NULL THEN 'soda:' || "id_producto"::text
    ELSE 'soda:legacy:' || "id_registro"::text
  END,
  "monto" = COALESCE("monto", 0)
WHERE "tipo" = 'soda_almuerzo';

UPDATE "registro_beneficio_mesero"
SET "clave_unica" = 'legacy:' || "id_registro"::text
WHERE "clave_unica" IS NULL OR "clave_unica" = '';

ALTER TABLE "registro_beneficio_mesero"
  ALTER COLUMN "clave_unica" SET NOT NULL;

DO $$ BEGIN
  ALTER TABLE "registro_beneficio_mesero"
    ADD CONSTRAINT "registro_beneficio_mesero_id_beneficio_turno_fkey"
    FOREIGN KEY ("id_beneficio_turno") REFERENCES "beneficio_turno_producto"("id_beneficio_turno")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "registro_beneficio_mesero"
  DROP CONSTRAINT IF EXISTS "registro_beneficio_mesero_fecha_id_usuario_tipo_key";

DROP INDEX IF EXISTS "registro_beneficio_mesero_fecha_id_usuario_tipo_key";

CREATE UNIQUE INDEX IF NOT EXISTS "registro_beneficio_mesero_fecha_id_usuario_clave_unica_key"
  ON "registro_beneficio_mesero"("fecha", "id_usuario", "clave_unica");

CREATE INDEX IF NOT EXISTS "registro_beneficio_mesero_fecha_tipo_idx"
  ON "registro_beneficio_mesero"("fecha", "tipo");
