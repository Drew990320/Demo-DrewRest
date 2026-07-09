-- Fase 3: mesas virtuales parametrizables en config operativa

ALTER TABLE "config_operativa" ADD COLUMN "numero_mesa_para_llevar" INTEGER NOT NULL DEFAULT 98;
ALTER TABLE "config_operativa" ADD COLUMN "numero_mesa_mostrador" INTEGER NOT NULL DEFAULT 99;
ALTER TABLE "config_operativa" ADD COLUMN "etiqueta_para_llevar" VARCHAR(80) NOT NULL DEFAULT 'Pedidos para llevar';
ALTER TABLE "config_operativa" ADD COLUMN "etiqueta_mostrador" VARCHAR(80) NOT NULL DEFAULT 'Mostrador';
ALTER TABLE "config_operativa" ADD COLUMN "mostrador_activo" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "config_operativa" ADD COLUMN "para_llevar_activo" BOOLEAN NOT NULL DEFAULT true;
