-- CreateEnum
CREATE TYPE "TipoProteina" AS ENUM ('ninguno', 'pollo', 'res', 'cerdo', 'otro');

-- CreateEnum
CREATE TYPE "PrioridadCocina" AS ENUM ('alta', 'baja');

-- AlterTable
ALTER TABLE "producto" ADD COLUMN "tipo_proteina" "TipoProteina" NOT NULL DEFAULT 'ninguno';

-- AlterTable
ALTER TABLE "pedido" ADD COLUMN "prioridad_cocina_override" "PrioridadCocina";
