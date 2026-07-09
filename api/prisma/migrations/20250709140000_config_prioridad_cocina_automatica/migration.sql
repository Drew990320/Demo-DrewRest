-- Prioridad cocina: false = FIFO por hora de pedido; true = reglas automáticas (proteína/plato fuerte).
ALTER TABLE "config_operativa"
ADD COLUMN "prioridad_cocina_automatica" BOOLEAN NOT NULL DEFAULT false;

-- Conservar comportamiento en instalaciones existentes.
UPDATE "config_operativa" SET "prioridad_cocina_automatica" = true WHERE "id" = 1;
