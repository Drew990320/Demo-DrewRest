-- CreateEnum
CREATE TYPE "TipoEventoPedido" AS ENUM ('detalle_agregado', 'detalle_eliminado', 'cantidad_actualizada');

-- CreateTable
CREATE TABLE "pedido_historial" (
    "id_historial" SERIAL NOT NULL,
    "id_pedido" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "tipo" "TipoEventoPedido" NOT NULL,
    "detalle_json" JSONB,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pedido_historial_pkey" PRIMARY KEY ("id_historial")
);

-- CreateIndex
CREATE INDEX "pedido_historial_id_pedido_idx" ON "pedido_historial"("id_pedido");

-- AddForeignKey
ALTER TABLE "pedido_historial" ADD CONSTRAINT "pedido_historial_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "pedido"("id_pedido") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_historial" ADD CONSTRAINT "pedido_historial_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
