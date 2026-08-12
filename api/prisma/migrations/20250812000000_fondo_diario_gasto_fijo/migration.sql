-- Fondo diario opcional por gasto fijo (cuota de caja hacia la meta mensual).

ALTER TYPE "TipoMovimientoCaja" ADD VALUE IF NOT EXISTS 'cuota_gasto_fijo';

DO $$ BEGIN
  CREATE TYPE "ModoRegistroFondoGanancia" AS ENUM ('automatico', 'confirmar');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EstadoCuotaFondoGanancia" AS ENUM ('aplicada', 'omitida');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "gasto_fijo_ganancia"
  ADD COLUMN IF NOT EXISTS "usa_fondo_diario" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "cuota_diaria" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "modo_registro_fondo" "ModoRegistroFondoGanancia" NOT NULL DEFAULT 'automatico';

CREATE TABLE IF NOT EXISTS "cuota_fondo_gasto_fijo" (
    "id_cuota_fondo" SERIAL NOT NULL,
    "id_gasto_fijo" INTEGER NOT NULL,
    "id_restaurante" INTEGER NOT NULL DEFAULT 1,
    "fecha" DATE NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "estado" "EstadoCuotaFondoGanancia" NOT NULL,
    "id_movimiento_caja" INTEGER,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cuota_fondo_gasto_fijo_pkey" PRIMARY KEY ("id_cuota_fondo")
);

CREATE UNIQUE INDEX IF NOT EXISTS "cuota_fondo_gasto_fijo_id_gasto_fijo_fecha_key"
  ON "cuota_fondo_gasto_fijo"("id_gasto_fijo", "fecha");

CREATE UNIQUE INDEX IF NOT EXISTS "cuota_fondo_gasto_fijo_id_movimiento_caja_key"
  ON "cuota_fondo_gasto_fijo"("id_movimiento_caja");

CREATE INDEX IF NOT EXISTS "cuota_fondo_gasto_fijo_id_restaurante_fecha_idx"
  ON "cuota_fondo_gasto_fijo"("id_restaurante", "fecha");

DO $$ BEGIN
  ALTER TABLE "cuota_fondo_gasto_fijo" ADD CONSTRAINT "cuota_fondo_gasto_fijo_id_gasto_fijo_fkey"
    FOREIGN KEY ("id_gasto_fijo") REFERENCES "gasto_fijo_ganancia"("id_gasto_fijo") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "cuota_fondo_gasto_fijo" ADD CONSTRAINT "cuota_fondo_gasto_fijo_id_restaurante_fkey"
    FOREIGN KEY ("id_restaurante") REFERENCES "restaurante"("id_restaurante") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "cuota_fondo_gasto_fijo" ADD CONSTRAINT "cuota_fondo_gasto_fijo_id_movimiento_caja_fkey"
    FOREIGN KEY ("id_movimiento_caja") REFERENCES "movimiento_caja"("id_movimiento_caja") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
