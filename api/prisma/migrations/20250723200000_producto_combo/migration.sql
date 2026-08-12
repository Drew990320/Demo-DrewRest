-- Combos de menú: flags en producto, elegibles y detalle hijo.
ALTER TABLE "producto" ADD COLUMN IF NOT EXISTS "es_combo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "producto" ADD COLUMN IF NOT EXISTS "combo_min" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "producto" ADD COLUMN IF NOT EXISTS "combo_max" INTEGER NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS "producto_combo_elegible" (
    "id_combo_elegible" SERIAL NOT NULL,
    "id_producto_combo" INTEGER NOT NULL,
    "id_producto_componente" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "producto_combo_elegible_pkey" PRIMARY KEY ("id_combo_elegible")
);

CREATE UNIQUE INDEX IF NOT EXISTS "producto_combo_elegible_id_producto_combo_id_producto_componente_key"
  ON "producto_combo_elegible"("id_producto_combo", "id_producto_componente");

CREATE INDEX IF NOT EXISTS "producto_combo_elegible_id_producto_combo_orden_idx"
  ON "producto_combo_elegible"("id_producto_combo", "orden");

DO $$ BEGIN
  ALTER TABLE "producto_combo_elegible"
    ADD CONSTRAINT "producto_combo_elegible_id_producto_combo_fkey"
    FOREIGN KEY ("id_producto_combo") REFERENCES "producto"("id_producto")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "producto_combo_elegible"
    ADD CONSTRAINT "producto_combo_elegible_id_producto_componente_fkey"
    FOREIGN KEY ("id_producto_componente") REFERENCES "producto"("id_producto")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "detalle_pedido" ADD COLUMN IF NOT EXISTS "id_detalle_combo_padre" INTEGER;

CREATE INDEX IF NOT EXISTS "detalle_pedido_id_detalle_combo_padre_idx"
  ON "detalle_pedido"("id_detalle_combo_padre");

DO $$ BEGIN
  ALTER TABLE "detalle_pedido"
    ADD CONSTRAINT "detalle_pedido_id_detalle_combo_padre_fkey"
    FOREIGN KEY ("id_detalle_combo_padre") REFERENCES "detalle_pedido"("id_detalle")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
