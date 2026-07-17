-- Inventario modular: clases, comportamiento, recetas, conversiones y ledger ampliado.

CREATE TYPE "ClaseInventario" AS ENUM (
  'comercial',
  'produccion',
  'activo_interno',
  'consumible_interno'
);

CREATE TYPE "EventoDeduccionInventario" AS ENUM (
  'al_crear_pedido',
  'al_confirmar_pedido',
  'cocina_acepta',
  'cocina_en_preparacion',
  'cocina_listo',
  'al_facturar',
  'al_entregar'
);

ALTER TYPE "TipoMovInventario" ADD VALUE IF NOT EXISTS 'compra';
ALTER TYPE "TipoMovInventario" ADD VALUE IF NOT EXISTS 'venta';
ALTER TYPE "TipoMovInventario" ADD VALUE IF NOT EXISTS 'produccion';
ALTER TYPE "TipoMovInventario" ADD VALUE IF NOT EXISTS 'consumo_receta';
ALTER TYPE "TipoMovInventario" ADD VALUE IF NOT EXISTS 'consumo_manual';
ALTER TYPE "TipoMovInventario" ADD VALUE IF NOT EXISTS 'ajuste_manual';
ALTER TYPE "TipoMovInventario" ADD VALUE IF NOT EXISTS 'perdida';
ALTER TYPE "TipoMovInventario" ADD VALUE IF NOT EXISTS 'dano';
ALTER TYPE "TipoMovInventario" ADD VALUE IF NOT EXISTS 'vencimiento';
ALTER TYPE "TipoMovInventario" ADD VALUE IF NOT EXISTS 'transferencia';
ALTER TYPE "TipoMovInventario" ADD VALUE IF NOT EXISTS 'devolucion';
ALTER TYPE "TipoMovInventario" ADD VALUE IF NOT EXISTS 'inventario_fisico';
ALTER TYPE "TipoMovInventario" ADD VALUE IF NOT EXISTS 'prestamo';
ALTER TYPE "TipoMovInventario" ADD VALUE IF NOT EXISTS 'reposicion';
ALTER TYPE "TipoMovInventario" ADD VALUE IF NOT EXISTS 'mantenimiento';

ALTER TABLE "inventario"
  ADD COLUMN IF NOT EXISTS "clase_inventario" "ClaseInventario" NOT NULL DEFAULT 'produccion',
  ADD COLUMN IF NOT EXISTS "comportamiento" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "id_producto" INTEGER,
  ADD COLUMN IF NOT EXISTS "ubicacion" VARCHAR(120),
  ADD COLUMN IF NOT EXISTS "estado_activo" VARCHAR(40),
  ADD COLUMN IF NOT EXISTS "costo_unitario" DECIMAL(12,4),
  ADD COLUMN IF NOT EXISTS "unidad_compra" VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "factor_compra" DECIMAL(14,6);

DO $$ BEGIN
  ALTER TABLE "inventario"
    ADD CONSTRAINT "inventario_id_producto_fkey"
    FOREIGN KEY ("id_producto") REFERENCES "producto"("id_producto")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "inventario_id_restaurante_clase_inventario_idx"
  ON "inventario"("id_restaurante", "clase_inventario");
CREATE INDEX IF NOT EXISTS "inventario_id_producto_idx" ON "inventario"("id_producto");

ALTER TABLE "mov_inventario"
  ADD COLUMN IF NOT EXISTS "id_detalle_pedido" INTEGER,
  ADD COLUMN IF NOT EXISTS "id_usuario" INTEGER,
  ADD COLUMN IF NOT EXISTS "modulo_origen" VARCHAR(40),
  ADD COLUMN IF NOT EXISTS "id_documento" VARCHAR(64),
  ADD COLUMN IF NOT EXISTS "costo_unitario" DECIMAL(12,4),
  ADD COLUMN IF NOT EXISTS "costo_total" DECIMAL(12,2);

DO $$ BEGIN
  ALTER TABLE "mov_inventario"
    ADD CONSTRAINT "mov_inventario_id_usuario_fkey"
    FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "mov_inventario_id_inventario_fecha_idx"
  ON "mov_inventario"("id_inventario", "fecha");
CREATE INDEX IF NOT EXISTS "mov_inventario_id_pedido_idx" ON "mov_inventario"("id_pedido");

CREATE TABLE IF NOT EXISTS "config_inventario" (
  "id_restaurante" INTEGER NOT NULL,
  "evento_deduccion_receta" "EventoDeduccionInventario" NOT NULL DEFAULT 'cocina_en_preparacion',
  "evento_deduccion_comercial" "EventoDeduccionInventario" NOT NULL DEFAULT 'al_crear_pedido',
  "evento_deduccion_consumible" "EventoDeduccionInventario",
  "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "config_inventario_pkey" PRIMARY KEY ("id_restaurante")
);

DO $$ BEGIN
  ALTER TABLE "config_inventario"
    ADD CONSTRAINT "config_inventario_id_restaurante_fkey"
    FOREIGN KEY ("id_restaurante") REFERENCES "restaurante"("id_restaurante")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "receta_producto" (
  "id_receta" SERIAL NOT NULL,
  "id_restaurante" INTEGER NOT NULL DEFAULT 1,
  "id_producto" INTEGER NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "activa" BOOLEAN NOT NULL DEFAULT true,
  "costo_calculado" DECIMAL(12,2),
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "receta_producto_pkey" PRIMARY KEY ("id_receta")
);

CREATE UNIQUE INDEX IF NOT EXISTS "receta_producto_id_producto_key" ON "receta_producto"("id_producto");
CREATE INDEX IF NOT EXISTS "receta_producto_id_restaurante_activa_idx"
  ON "receta_producto"("id_restaurante", "activa");

DO $$ BEGIN
  ALTER TABLE "receta_producto"
    ADD CONSTRAINT "receta_producto_id_restaurante_fkey"
    FOREIGN KEY ("id_restaurante") REFERENCES "restaurante"("id_restaurante")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "receta_producto"
    ADD CONSTRAINT "receta_producto_id_producto_fkey"
    FOREIGN KEY ("id_producto") REFERENCES "producto"("id_producto")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "receta_linea" (
  "id_linea" SERIAL NOT NULL,
  "id_receta" INTEGER NOT NULL,
  "id_inventario" INTEGER,
  "id_subreceta" INTEGER,
  "cantidad" DECIMAL(12,6) NOT NULL,
  "unidad" VARCHAR(20) NOT NULL,
  "opcional" BOOLEAN NOT NULL DEFAULT false,
  "orden" INTEGER NOT NULL DEFAULT 0,
  "sustituciones" JSONB,

  CONSTRAINT "receta_linea_pkey" PRIMARY KEY ("id_linea")
);

CREATE INDEX IF NOT EXISTS "receta_linea_id_receta_orden_idx" ON "receta_linea"("id_receta", "orden");

DO $$ BEGIN
  ALTER TABLE "receta_linea"
    ADD CONSTRAINT "receta_linea_id_receta_fkey"
    FOREIGN KEY ("id_receta") REFERENCES "receta_producto"("id_receta")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "receta_linea"
    ADD CONSTRAINT "receta_linea_id_inventario_fkey"
    FOREIGN KEY ("id_inventario") REFERENCES "inventario"("id_inventario")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "receta_linea"
    ADD CONSTRAINT "receta_linea_id_subreceta_fkey"
    FOREIGN KEY ("id_subreceta") REFERENCES "receta_producto"("id_receta")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "conversion_unidad" (
  "id_conversion" SERIAL NOT NULL,
  "id_restaurante" INTEGER NOT NULL DEFAULT 1,
  "unidad_origen" VARCHAR(20) NOT NULL,
  "unidad_destino" VARCHAR(20) NOT NULL,
  "factor" DECIMAL(14,6) NOT NULL,

  CONSTRAINT "conversion_unidad_pkey" PRIMARY KEY ("id_conversion")
);

CREATE UNIQUE INDEX IF NOT EXISTS "conversion_unidad_id_restaurante_unidad_origen_unidad_destino_key"
  ON "conversion_unidad"("id_restaurante", "unidad_origen", "unidad_destino");

DO $$ BEGIN
  ALTER TABLE "conversion_unidad"
    ADD CONSTRAINT "conversion_unidad_id_restaurante_fkey"
    FOREIGN KEY ("id_restaurante") REFERENCES "restaurante"("id_restaurante")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- FK inventario → restaurante (tenant); puede faltar en instalaciones antiguas.
DO $$ BEGIN
  ALTER TABLE "inventario"
    ADD CONSTRAINT "inventario_id_restaurante_fkey"
    FOREIGN KEY ("id_restaurante") REFERENCES "restaurante"("id_restaurante")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
