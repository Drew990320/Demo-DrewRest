-- CreateEnum
CREATE TYPE "ModoServicio" AS ENUM ('en_mesa', 'para_llevar');

-- AlterTable
ALTER TABLE "pedido" ADD COLUMN "modo_servicio" "ModoServicio" NOT NULL DEFAULT 'en_mesa';

-- AlterTable
ALTER TABLE "producto" ADD COLUMN "es_plato_principal" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "producto" ADD COLUMN "es_empacable" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "detalle_pedido" ADD COLUMN "id_detalle_padre" INTEGER;

-- AddForeignKey
ALTER TABLE "detalle_pedido" ADD CONSTRAINT "detalle_pedido_id_detalle_padre_fkey" FOREIGN KEY ("id_detalle_padre") REFERENCES "detalle_pedido"("id_detalle") ON DELETE CASCADE ON UPDATE CASCADE;
