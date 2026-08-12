-- Impresión opcional de comprobantes al registrar entrada/salida manual de caja.
ALTER TABLE "config_operativa"
  ADD COLUMN "imprimir_entrada_caja" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "imprimir_salida_caja" BOOLEAN NOT NULL DEFAULT true;
