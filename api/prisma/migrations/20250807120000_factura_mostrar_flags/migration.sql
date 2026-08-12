-- Toggles de contenido de factura impresa (cliente / precuenta). Default = visible.
ALTER TABLE "config_restaurante"
  ADD COLUMN IF NOT EXISTS "factura_mostrar_logo" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "config_restaurante"
  ADD COLUMN IF NOT EXISTS "factura_mostrar_mesero" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "config_restaurante"
  ADD COLUMN IF NOT EXISTS "factura_mostrar_comensales" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "config_restaurante"
  ADD COLUMN IF NOT EXISTS "factura_mostrar_detalle_items" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "config_restaurante"
  ADD COLUMN IF NOT EXISTS "factura_mostrar_descuentos" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "config_restaurante"
  ADD COLUMN IF NOT EXISTS "factura_mostrar_metodo_pago" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "config_restaurante"
  ADD COLUMN IF NOT EXISTS "factura_mostrar_vuelto" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "config_restaurante"
  ADD COLUMN IF NOT EXISTS "factura_mostrar_propina" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "config_restaurante"
  ADD COLUMN IF NOT EXISTS "factura_mostrar_gracias" BOOLEAN NOT NULL DEFAULT true;
