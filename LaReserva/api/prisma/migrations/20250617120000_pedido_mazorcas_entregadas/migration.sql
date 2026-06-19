-- Mazorcas servidas en mesa (1 por comensal; independiente de platos).
ALTER TABLE "pedido" ADD COLUMN "mazorcas_entregadas" INTEGER NOT NULL DEFAULT 0;
