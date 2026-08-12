-- Pedido armado por flujo «Pedido de cliente» (autoservicio en app mesero).
ALTER TABLE "pedido" ADD COLUMN IF NOT EXISTS "origen_autoservicio" BOOLEAN NOT NULL DEFAULT false;
