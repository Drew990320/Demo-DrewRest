-- Fase 4: reglas de promoción configurables (JSON) + descuento en factura

ALTER TABLE "config_descuento" ADD COLUMN "reglas_promocion" JSONB NOT NULL DEFAULT '[]';

ALTER TABLE "factura" ADD COLUMN "descuento_promociones" DECIMAL(10,2) NOT NULL DEFAULT 0;
