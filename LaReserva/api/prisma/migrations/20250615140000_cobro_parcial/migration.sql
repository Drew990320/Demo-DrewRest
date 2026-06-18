-- Cobro parcial / dividir cuenta: varias facturas por pedido e ítems marcados al cobrar.
ALTER TABLE "factura" DROP CONSTRAINT IF EXISTS "factura_id_pedido_key";

ALTER TABLE "detalle_pedido" ADD COLUMN IF NOT EXISTS "id_factura" INTEGER;

ALTER TABLE "detalle_pedido"
  ADD CONSTRAINT "detalle_pedido_id_factura_fkey"
  FOREIGN KEY ("id_factura") REFERENCES "factura"("id_factura")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "detalle_pedido_id_factura_idx" ON "detalle_pedido"("id_factura");
CREATE INDEX IF NOT EXISTS "factura_id_pedido_idx" ON "factura"("id_pedido");

ALTER TABLE "factura" ADD COLUMN IF NOT EXISTS "es_parcial" BOOLEAN NOT NULL DEFAULT false;
