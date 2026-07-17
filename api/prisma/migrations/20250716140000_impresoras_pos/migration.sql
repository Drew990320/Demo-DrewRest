-- CreateEnum
CREATE TYPE "RolImpresoraPos" AS ENUM ('cocina', 'factura', 'caja');

-- CreateEnum
CREATE TYPE "AlcanceReglaImpresion" AS ENUM ('categoria', 'producto');

-- CreateTable
CREATE TABLE "impresora_pos" (
    "id_impresora" SERIAL NOT NULL,
    "id_restaurante" INTEGER NOT NULL DEFAULT 1,
    "nombre" VARCHAR(120) NOT NULL,
    "destino" VARCHAR(200) NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "baud_rate" INTEGER,
    "roles" "RolImpresoraPos"[],
    "es_cocina_maestra" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "impresora_pos_pkey" PRIMARY KEY ("id_impresora")
);

-- CreateTable
CREATE TABLE "regla_impresion_cocina" (
    "id_regla" SERIAL NOT NULL,
    "id_impresora" INTEGER NOT NULL,
    "alcance" "AlcanceReglaImpresion" NOT NULL,
    "id_categoria" INTEGER,
    "id_producto" INTEGER,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "regla_impresion_cocina_pkey" PRIMARY KEY ("id_regla")
);

-- CreateIndex
CREATE INDEX "impresora_pos_id_restaurante_activa_orden_idx" ON "impresora_pos"("id_restaurante", "activa", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "impresora_pos_id_restaurante_destino_key" ON "impresora_pos"("id_restaurante", "destino");

-- CreateIndex
CREATE INDEX "regla_impresion_cocina_id_impresora_orden_idx" ON "regla_impresion_cocina"("id_impresora", "orden");

-- CreateIndex
CREATE INDEX "regla_impresion_cocina_id_categoria_idx" ON "regla_impresion_cocina"("id_categoria");

-- CreateIndex
CREATE INDEX "regla_impresion_cocina_id_producto_idx" ON "regla_impresion_cocina"("id_producto");

-- AddForeignKey
ALTER TABLE "impresora_pos" ADD CONSTRAINT "impresora_pos_id_restaurante_fkey" FOREIGN KEY ("id_restaurante") REFERENCES "restaurante"("id_restaurante") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regla_impresion_cocina" ADD CONSTRAINT "regla_impresion_cocina_id_impresora_fkey" FOREIGN KEY ("id_impresora") REFERENCES "impresora_pos"("id_impresora") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regla_impresion_cocina" ADD CONSTRAINT "regla_impresion_cocina_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "categoria"("id_categoria") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regla_impresion_cocina" ADD CONSTRAINT "regla_impresion_cocina_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "producto"("id_producto") ON DELETE CASCADE ON UPDATE CASCADE;
