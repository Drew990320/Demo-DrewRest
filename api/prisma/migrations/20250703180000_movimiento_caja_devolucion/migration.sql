-- CreateEnum
CREATE TYPE "MetodoDevolucionExceso" AS ENUM ('efectivo', 'transferencia');

-- CreateTable
CREATE TABLE "movimiento_caja" (
    "id_movimiento_caja" SERIAL NOT NULL,
    "fecha" DATE NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "metodo_devolucion" "MetodoDevolucionExceso" NOT NULL,
    "id_factura" INTEGER,
    "id_pedido" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimiento_caja_pkey" PRIMARY KEY ("id_movimiento_caja")
);

-- CreateIndex
CREATE INDEX "movimiento_caja_fecha_idx" ON "movimiento_caja"("fecha");

-- CreateIndex
CREATE INDEX "movimiento_caja_id_pedido_idx" ON "movimiento_caja"("id_pedido");

-- AddForeignKey
ALTER TABLE "movimiento_caja" ADD CONSTRAINT "movimiento_caja_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "pedido"("id_pedido") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento_caja" ADD CONSTRAINT "movimiento_caja_id_factura_fkey" FOREIGN KEY ("id_factura") REFERENCES "factura"("id_factura") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento_caja" ADD CONSTRAINT "movimiento_caja_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
