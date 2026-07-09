-- Mazorcas listas en el pase de cocina (pendientes de que el mesero las recoja).
ALTER TABLE "pedido" ADD COLUMN "mazorcas_listas_recoger" INTEGER NOT NULL DEFAULT 0;
