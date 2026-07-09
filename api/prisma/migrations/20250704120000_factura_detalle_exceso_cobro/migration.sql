-- Persistir instrucciones de vuelto/exceso al cobrar (reimpresiones).
ALTER TABLE "factura" ADD COLUMN "detalle_exceso_cobro" JSONB;
