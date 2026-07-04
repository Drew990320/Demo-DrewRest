-- Agrupa facturas del mismo pago mixto (efectivo + transferencia en un solo cobro).
ALTER TABLE "factura" ADD COLUMN "cobro_mixto_grupo" INTEGER;
