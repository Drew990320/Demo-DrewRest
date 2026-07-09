-- Fase 5: stock por unidad en productos de categorías bebida

ALTER TABLE "producto" ADD COLUMN "control_stock" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "producto" ADD COLUMN "stock_disponible" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "producto" ADD COLUMN "ocultar_sin_stock" BOOLEAN NOT NULL DEFAULT true;
