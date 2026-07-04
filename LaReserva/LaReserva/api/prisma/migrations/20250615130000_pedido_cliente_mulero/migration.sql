-- Descuento para clientes camioneros (muleros): se marca por pedido al cobrar.
ALTER TABLE "pedido" ADD COLUMN "cliente_mulero" BOOLEAN NOT NULL DEFAULT false;
