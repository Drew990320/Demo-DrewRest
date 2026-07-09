-- Reparación: permitir varias facturas (subfacturas) por el mismo pedido.
-- Necesario si quedó el UNIQUE en id_pedido (cobro parcial / dividir cuenta).

ALTER TABLE "factura" DROP CONSTRAINT IF EXISTS "factura_id_pedido_key";

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname AS name
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'factura'
      AND c.contype = 'u'
      AND pg_get_constraintdef(c.oid) ILIKE '%id_pedido%'
  LOOP
    EXECUTE format('ALTER TABLE public.factura DROP CONSTRAINT IF EXISTS %I', r.name);
  END LOOP;
END $$;

DROP INDEX IF EXISTS "factura_id_pedido_key";

ALTER TABLE "detalle_pedido" ADD COLUMN IF NOT EXISTS "id_factura" INTEGER;
ALTER TABLE "factura" ADD COLUMN IF NOT EXISTS "es_parcial" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "factura_id_pedido_idx" ON "factura"("id_pedido");
CREATE INDEX IF NOT EXISTS "detalle_pedido_id_factura_idx" ON "detalle_pedido"("id_factura");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'detalle_pedido_id_factura_fkey'
  ) THEN
    ALTER TABLE "detalle_pedido"
      ADD CONSTRAINT "detalle_pedido_id_factura_fkey"
      FOREIGN KEY ("id_factura") REFERENCES "factura"("id_factura")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
