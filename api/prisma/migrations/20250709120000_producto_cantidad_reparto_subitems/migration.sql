-- Unidades fijas a repartir entre subítems cuando el producto usa reparto (config menú admin).
ALTER TABLE "producto"
ADD COLUMN "cantidad_reparto_subitems" INTEGER NOT NULL DEFAULT 1;
