-- Bodega visible por defecto en Más (módulo inventario / recursos).
ALTER TABLE "config_restaurante"
  ALTER COLUMN "modulo_inventario_activo" SET DEFAULT true;

UPDATE "config_restaurante"
SET "modulo_inventario_activo" = true
WHERE "modulo_inventario_activo" = false;
