-- Agrupa varias facturas del mismo turno en cobro por personas (p. ej. pago mixto).
ALTER TABLE "factura" ADD COLUMN "persona_plan_indice" INTEGER;
