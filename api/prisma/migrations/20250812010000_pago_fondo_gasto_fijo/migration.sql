-- Pago con el fondo ya reservado (no genera movimiento de caja).

CREATE TABLE IF NOT EXISTS "pago_fondo_gasto_fijo" (
    "id_pago_fondo" SERIAL NOT NULL,
    "id_gasto_fijo" INTEGER NOT NULL,
    "id_restaurante" INTEGER NOT NULL DEFAULT 1,
    "fecha" DATE NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "notas" VARCHAR(500),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pago_fondo_gasto_fijo_pkey" PRIMARY KEY ("id_pago_fondo")
);

CREATE INDEX IF NOT EXISTS "pago_fondo_gasto_fijo_id_restaurante_fecha_idx"
  ON "pago_fondo_gasto_fijo"("id_restaurante", "fecha");

CREATE INDEX IF NOT EXISTS "pago_fondo_gasto_fijo_id_gasto_fijo_fecha_idx"
  ON "pago_fondo_gasto_fijo"("id_gasto_fijo", "fecha");

DO $$ BEGIN
  ALTER TABLE "pago_fondo_gasto_fijo" ADD CONSTRAINT "pago_fondo_gasto_fijo_id_gasto_fijo_fkey"
    FOREIGN KEY ("id_gasto_fijo") REFERENCES "gasto_fijo_ganancia"("id_gasto_fijo") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "pago_fondo_gasto_fijo" ADD CONSTRAINT "pago_fondo_gasto_fijo_id_restaurante_fkey"
    FOREIGN KEY ("id_restaurante") REFERENCES "restaurante"("id_restaurante") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
