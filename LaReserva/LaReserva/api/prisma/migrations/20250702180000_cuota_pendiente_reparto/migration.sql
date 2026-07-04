-- Producto interno para cuotas omitidas en reparto por personas/combinado.
ALTER TABLE "producto" ADD COLUMN "es_cuota_pendiente_reparto" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "config_operativa" ADD COLUMN "id_producto_cuota_pendiente" INTEGER;

ALTER TABLE "config_operativa"
  ADD CONSTRAINT "config_operativa_id_producto_cuota_pendiente_fkey"
  FOREIGN KEY ("id_producto_cuota_pendiente") REFERENCES "producto"("id_producto")
  ON DELETE SET NULL ON UPDATE CASCADE;
