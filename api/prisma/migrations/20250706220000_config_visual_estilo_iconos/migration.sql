-- AlterTable
ALTER TABLE "config_visual" ADD COLUMN "iconos_accion" JSONB;
ALTER TABLE "config_visual" ADD COLUMN "estilo_visual" VARCHAR(20) DEFAULT 'minimalista';
