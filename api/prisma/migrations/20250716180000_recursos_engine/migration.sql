-- CreateEnum
CREATE TYPE "EstadoRecurso" AS ENUM ('activo', 'agotado', 'mantenimiento', 'baja', 'prestado');

-- CreateEnum
CREATE TYPE "TipoMovimientoRecurso" AS ENUM (
  'compra',
  'consumo',
  'venta',
  'produccion',
  'transferencia',
  'ajuste',
  'devolucion',
  'perdida',
  'dano',
  'robo',
  'mantenimiento',
  'baja',
  'consumo_receta'
);

-- CreateTable
CREATE TABLE "categoria_recurso" (
    "id_categoria" SERIAL NOT NULL,
    "id_restaurante" INTEGER NOT NULL DEFAULT 1,
    "codigo" VARCHAR(40) NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "descripcion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "controla_stock" BOOLEAN NOT NULL DEFAULT true,
    "se_consume_auto" BOOLEAN NOT NULL DEFAULT false,
    "puede_venderse" BOOLEAN NOT NULL DEFAULT false,
    "requiere_receta" BOOLEAN NOT NULL DEFAULT false,
    "controla_vencimiento" BOOLEAN NOT NULL DEFAULT false,
    "controla_lote" BOOLEAN NOT NULL DEFAULT false,
    "maneja_serie" BOOLEAN NOT NULL DEFAULT false,
    "requiere_mantenimiento" BOOLEAN NOT NULL DEFAULT false,
    "es_activo_fijo" BOOLEAN NOT NULL DEFAULT false,
    "permite_depreciacion" BOOLEAN NOT NULL DEFAULT false,
    "tiene_responsable" BOOLEAN NOT NULL DEFAULT false,
    "tiene_ubicacion" BOOLEAN NOT NULL DEFAULT false,
    "permite_prestamo" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categoria_recurso_pkey" PRIMARY KEY ("id_categoria")
);

-- CreateTable
CREATE TABLE "ubicacion_recurso" (
    "id_ubicacion" SERIAL NOT NULL,
    "id_restaurante" INTEGER NOT NULL DEFAULT 1,
    "nombre" VARCHAR(120) NOT NULL,
    "codigo" VARCHAR(40),
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ubicacion_recurso_pkey" PRIMARY KEY ("id_ubicacion")
);

-- CreateTable
CREATE TABLE "recurso" (
    "id_recurso" SERIAL NOT NULL,
    "id_restaurante" INTEGER NOT NULL DEFAULT 1,
    "codigo" VARCHAR(60) NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "descripcion" TEXT,
    "id_categoria" INTEGER NOT NULL,
    "unidad" VARCHAR(20) NOT NULL,
    "costo" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "precio" DECIMAL(12,2),
    "stock" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "stock_min" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "stock_max" DECIMAL(12,3),
    "estado" "EstadoRecurso" NOT NULL DEFAULT 'activo',
    "id_proveedor" INTEGER,
    "id_ubicacion" INTEGER,
    "id_responsable" INTEGER,
    "codigo_barras" VARCHAR(80),
    "codigo_qr" VARCHAR(120),
    "numero_serie" VARCHAR(80),
    "fecha_compra" DATE,
    "fecha_vencimiento" DATE,
    "observaciones" TEXT,
    "id_producto" INTEGER,
    "id_inventario_legacy" INTEGER,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurso_pkey" PRIMARY KEY ("id_recurso")
);

-- CreateTable
CREATE TABLE "movimiento_recurso" (
    "id_movimiento" SERIAL NOT NULL,
    "id_recurso" INTEGER NOT NULL,
    "tipo" "TipoMovimientoRecurso" NOT NULL,
    "cantidad" DECIMAL(12,3) NOT NULL,
    "costo_unitario" DECIMAL(12,4),
    "costo_total" DECIMAL(12,2),
    "observacion" TEXT,
    "modulo_origen" VARCHAR(40),
    "id_documento" VARCHAR(64),
    "id_pedido" INTEGER,
    "id_detalle_pedido" INTEGER,
    "id_usuario" INTEGER,
    "id_ubicacion_origen" INTEGER,
    "id_ubicacion_destino" INTEGER,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimiento_recurso_pkey" PRIMARY KEY ("id_movimiento")
);

-- CreateTable
CREATE TABLE "mantenimiento_recurso" (
    "id_mantenimiento" SERIAL NOT NULL,
    "id_recurso" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descripcion" TEXT NOT NULL,
    "costo" DECIMAL(12,2),
    "id_usuario" INTEGER,

    CONSTRAINT "mantenimiento_recurso_pkey" PRIMARY KEY ("id_mantenimiento")
);

-- AlterTable
ALTER TABLE "receta_linea" ADD COLUMN "id_recurso" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "categoria_recurso_id_restaurante_codigo_key" ON "categoria_recurso"("id_restaurante", "codigo");

-- CreateIndex
CREATE INDEX "categoria_recurso_id_restaurante_activa_orden_idx" ON "categoria_recurso"("id_restaurante", "activa", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "ubicacion_recurso_id_restaurante_nombre_key" ON "ubicacion_recurso"("id_restaurante", "nombre");

-- CreateIndex
CREATE INDEX "ubicacion_recurso_id_restaurante_activa_idx" ON "ubicacion_recurso"("id_restaurante", "activa");

-- CreateIndex
CREATE UNIQUE INDEX "recurso_id_inventario_legacy_key" ON "recurso"("id_inventario_legacy");

-- CreateIndex
CREATE UNIQUE INDEX "recurso_id_restaurante_codigo_key" ON "recurso"("id_restaurante", "codigo");

-- CreateIndex
CREATE INDEX "recurso_id_restaurante_id_categoria_idx" ON "recurso"("id_restaurante", "id_categoria");

-- CreateIndex
CREATE INDEX "recurso_id_restaurante_estado_idx" ON "recurso"("id_restaurante", "estado");

-- CreateIndex
CREATE INDEX "recurso_id_restaurante_id_ubicacion_idx" ON "recurso"("id_restaurante", "id_ubicacion");

-- CreateIndex
CREATE INDEX "recurso_id_producto_idx" ON "recurso"("id_producto");

-- CreateIndex
CREATE INDEX "recurso_id_restaurante_stock_min_idx" ON "recurso"("id_restaurante", "stock_min");

-- CreateIndex
CREATE INDEX "recurso_fecha_vencimiento_idx" ON "recurso"("fecha_vencimiento");

-- CreateIndex
CREATE INDEX "movimiento_recurso_id_recurso_fecha_idx" ON "movimiento_recurso"("id_recurso", "fecha");

-- CreateIndex
CREATE INDEX "movimiento_recurso_id_documento_idx" ON "movimiento_recurso"("id_documento");

-- CreateIndex
CREATE INDEX "movimiento_recurso_id_pedido_idx" ON "movimiento_recurso"("id_pedido");

-- CreateIndex
CREATE INDEX "movimiento_recurso_fecha_idx" ON "movimiento_recurso"("fecha");

-- CreateIndex
CREATE INDEX "mantenimiento_recurso_id_recurso_fecha_idx" ON "mantenimiento_recurso"("id_recurso", "fecha");

-- CreateIndex
CREATE INDEX "receta_linea_id_recurso_idx" ON "receta_linea"("id_recurso");

-- AddForeignKey
ALTER TABLE "categoria_recurso" ADD CONSTRAINT "categoria_recurso_id_restaurante_fkey" FOREIGN KEY ("id_restaurante") REFERENCES "restaurante"("id_restaurante") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ubicacion_recurso" ADD CONSTRAINT "ubicacion_recurso_id_restaurante_fkey" FOREIGN KEY ("id_restaurante") REFERENCES "restaurante"("id_restaurante") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurso" ADD CONSTRAINT "recurso_id_restaurante_fkey" FOREIGN KEY ("id_restaurante") REFERENCES "restaurante"("id_restaurante") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurso" ADD CONSTRAINT "recurso_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "categoria_recurso"("id_categoria") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurso" ADD CONSTRAINT "recurso_id_proveedor_fkey" FOREIGN KEY ("id_proveedor") REFERENCES "proveedor"("id_proveedor") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurso" ADD CONSTRAINT "recurso_id_ubicacion_fkey" FOREIGN KEY ("id_ubicacion") REFERENCES "ubicacion_recurso"("id_ubicacion") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurso" ADD CONSTRAINT "recurso_id_responsable_fkey" FOREIGN KEY ("id_responsable") REFERENCES "usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurso" ADD CONSTRAINT "recurso_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "producto"("id_producto") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento_recurso" ADD CONSTRAINT "movimiento_recurso_id_recurso_fkey" FOREIGN KEY ("id_recurso") REFERENCES "recurso"("id_recurso") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento_recurso" ADD CONSTRAINT "movimiento_recurso_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "pedido"("id_pedido") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento_recurso" ADD CONSTRAINT "movimiento_recurso_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento_recurso" ADD CONSTRAINT "movimiento_recurso_id_ubicacion_origen_fkey" FOREIGN KEY ("id_ubicacion_origen") REFERENCES "ubicacion_recurso"("id_ubicacion") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento_recurso" ADD CONSTRAINT "movimiento_recurso_id_ubicacion_destino_fkey" FOREIGN KEY ("id_ubicacion_destino") REFERENCES "ubicacion_recurso"("id_ubicacion") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mantenimiento_recurso" ADD CONSTRAINT "mantenimiento_recurso_id_recurso_fkey" FOREIGN KEY ("id_recurso") REFERENCES "recurso"("id_recurso") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mantenimiento_recurso" ADD CONSTRAINT "mantenimiento_recurso_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receta_linea" ADD CONSTRAINT "receta_linea_id_recurso_fkey" FOREIGN KEY ("id_recurso") REFERENCES "recurso"("id_recurso") ON DELETE SET NULL ON UPDATE CASCADE;
