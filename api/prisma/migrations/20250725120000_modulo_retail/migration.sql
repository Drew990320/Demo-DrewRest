-- Módulo tienda/retail: canal de catálogo, variantes y mesa boutique.

DO $$ BEGIN
  CREATE TYPE "canal_catalogo" AS ENUM ('restaurante', 'retail');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "categoria" ADD COLUMN IF NOT EXISTS "canal" "canal_catalogo" NOT NULL DEFAULT 'restaurante';

ALTER TABLE "categoria" DROP CONSTRAINT IF EXISTS "categoria_id_restaurante_nombre_key";

CREATE UNIQUE INDEX IF NOT EXISTS "categoria_id_restaurante_canal_nombre_key"
  ON "categoria"("id_restaurante", "canal", "nombre");

CREATE INDEX IF NOT EXISTS "categoria_id_restaurante_canal_idx"
  ON "categoria"("id_restaurante", "canal");

CREATE TABLE IF NOT EXISTS "producto_variante" (
    "id_variante" SERIAL NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "etiqueta_grupo" VARCHAR(40),
    "precio" DECIMAL(10, 2) NOT NULL,
    "stock_disponible" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "producto_variante_pkey" PRIMARY KEY ("id_variante")
);

CREATE UNIQUE INDEX IF NOT EXISTS "producto_variante_id_producto_nombre_key"
  ON "producto_variante"("id_producto", "nombre");

CREATE INDEX IF NOT EXISTS "producto_variante_id_producto_activo_orden_idx"
  ON "producto_variante"("id_producto", "activo", "orden");

DO $$ BEGIN
  ALTER TABLE "producto_variante"
    ADD CONSTRAINT "producto_variante_id_producto_fkey"
    FOREIGN KEY ("id_producto") REFERENCES "producto"("id_producto")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "detalle_pedido" ADD COLUMN IF NOT EXISTS "id_producto_variante" INTEGER;

CREATE INDEX IF NOT EXISTS "detalle_pedido_id_producto_variante_idx"
  ON "detalle_pedido"("id_producto_variante");

DO $$ BEGIN
  ALTER TABLE "detalle_pedido"
    ADD CONSTRAINT "detalle_pedido_id_producto_variante_fkey"
    FOREIGN KEY ("id_producto_variante") REFERENCES "producto_variante"("id_variante")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "config_restaurante" ADD COLUMN IF NOT EXISTS "modulo_retail_activo" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "config_operativa" ADD COLUMN IF NOT EXISTS "numero_mesa_boutique" INTEGER NOT NULL DEFAULT 97;
ALTER TABLE "config_operativa" ADD COLUMN IF NOT EXISTS "etiqueta_boutique" VARCHAR(80) NOT NULL DEFAULT 'Tienda';
ALTER TABLE "config_operativa" ADD COLUMN IF NOT EXISTS "boutique_activa" BOOLEAN NOT NULL DEFAULT true;
