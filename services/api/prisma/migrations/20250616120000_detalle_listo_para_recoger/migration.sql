-- Cocina avisa que el plato está listo; el mesero confirma al recogerlo.
ALTER TABLE "detalle_pedido" ADD COLUMN "listo_para_recoger" BOOLEAN NOT NULL DEFAULT false;
