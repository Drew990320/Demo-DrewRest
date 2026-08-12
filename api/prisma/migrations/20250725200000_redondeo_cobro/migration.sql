-- Redondeo en cobro: módulo, paso/umbral operativa y monto en factura.

ALTER TABLE "config_restaurante"
  ADD COLUMN IF NOT EXISTS "modulo_redondeo_cobro_activo" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "config_operativa"
  ADD COLUMN IF NOT EXISTS "redondeo_paso" INTEGER NOT NULL DEFAULT 100;

ALTER TABLE "config_operativa"
  ADD COLUMN IF NOT EXISTS "redondeo_umbral" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "factura"
  ADD COLUMN IF NOT EXISTS "monto_redondeo" DECIMAL(10, 2) NOT NULL DEFAULT 0;
