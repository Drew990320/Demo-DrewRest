-- CreateEnum
CREATE TYPE "TipoMovimientoCaja" AS ENUM ('devolucion_exceso_transferencia', 'entrada_manual', 'salida_manual');

-- AlterTable
ALTER TABLE "movimiento_caja" ADD COLUMN "tipo" "TipoMovimientoCaja";
ALTER TABLE "movimiento_caja" ADD COLUMN "motivo" TEXT;
ALTER TABLE "movimiento_caja" ALTER COLUMN "metodo_devolucion" DROP NOT NULL;
ALTER TABLE "movimiento_caja" ALTER COLUMN "id_pedido" DROP NOT NULL;

UPDATE "movimiento_caja"
SET "tipo" = 'devolucion_exceso_transferencia'
WHERE "tipo" IS NULL;

ALTER TABLE "movimiento_caja" ALTER COLUMN "tipo" SET NOT NULL;
