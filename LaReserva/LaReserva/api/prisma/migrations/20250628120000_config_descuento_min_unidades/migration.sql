-- Cantidad mínima configurable para reglas globales de descuento (sopas / camioneros).
ALTER TABLE "config_descuento" ADD COLUMN "sopas_min_unidades" INTEGER NOT NULL DEFAULT 2;
ALTER TABLE "config_descuento" ADD COLUMN "muleros_min_platos_principales" INTEGER NOT NULL DEFAULT 1;
