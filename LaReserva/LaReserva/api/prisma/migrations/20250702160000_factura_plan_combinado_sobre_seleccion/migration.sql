-- Cuota por persona sobre ítems seleccionados (modo combinado).
ALTER TABLE "factura" ADD COLUMN "plan_combinado_sobre_seleccion" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "factura" ADD COLUMN "plan_seleccion_referencia" JSONB;
