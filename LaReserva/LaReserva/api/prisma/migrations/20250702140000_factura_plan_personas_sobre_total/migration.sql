-- Modo por personas (cuota sobre total) vs combinar (ítems por tanda).
ALTER TABLE "factura" ADD COLUMN "plan_personas_sobre_total" BOOLEAN NOT NULL DEFAULT false;
