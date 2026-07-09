-- AlterTable
ALTER TABLE "config_descuento" ADD COLUMN "umbral_subtotal_otros" DECIMAL(12,2) NOT NULL DEFAULT 50000;

-- CreateTable
CREATE TABLE "config_operativa" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "precio_empaque_para_llevar" DECIMAL(10,2) NOT NULL DEFAULT 1000,
    "mazorca_activa" BOOLEAN NOT NULL DEFAULT true,
    "id_producto_mazorca" INTEGER,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "config_operativa_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "config_operativa" ADD CONSTRAINT "config_operativa_id_producto_mazorca_fkey" FOREIGN KEY ("id_producto_mazorca") REFERENCES "producto"("id_producto") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed singleton row
INSERT INTO "config_operativa" ("id", "precio_empaque_para_llevar", "mazorca_activa", "actualizado_en")
VALUES (1, 1000, true, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
