-- AlterTable
ALTER TABLE "producto" ADD COLUMN IF NOT EXISTS "precio_costo" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "config_restaurante" ADD COLUMN IF NOT EXISTS "modulo_ganancias_activo" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE IF NOT EXISTS "gasto_fijo_ganancia" (
    "id_gasto_fijo" SERIAL NOT NULL,
    "id_restaurante" INTEGER NOT NULL DEFAULT 1,
    "nombre" VARCHAR(120) NOT NULL,
    "monto_mensual" DECIMAL(12,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "notas" VARCHAR(500),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gasto_fijo_ganancia_pkey" PRIMARY KEY ("id_gasto_fijo")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "gasto_extra_ganancia" (
    "id_gasto_extra" SERIAL NOT NULL,
    "id_restaurante" INTEGER NOT NULL DEFAULT 1,
    "nombre" VARCHAR(120) NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "fecha" DATE NOT NULL,
    "notas" VARCHAR(500),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gasto_extra_ganancia_pkey" PRIMARY KEY ("id_gasto_extra")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "gasto_fijo_ganancia_id_restaurante_activo_idx" ON "gasto_fijo_ganancia"("id_restaurante", "activo");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "gasto_extra_ganancia_id_restaurante_fecha_idx" ON "gasto_extra_ganancia"("id_restaurante", "fecha");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "gasto_fijo_ganancia" ADD CONSTRAINT "gasto_fijo_ganancia_id_restaurante_fkey"
    FOREIGN KEY ("id_restaurante") REFERENCES "restaurante"("id_restaurante") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "gasto_extra_ganancia" ADD CONSTRAINT "gasto_extra_ganancia_id_restaurante_fkey"
    FOREIGN KEY ("id_restaurante") REFERENCES "restaurante"("id_restaurante") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
