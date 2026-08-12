-- Autoservicio: marca «listo para cobro» al enviar a caja (sin cocina aún).
ALTER TABLE "pedido" ADD COLUMN IF NOT EXISTS "listo_para_cobro_autoservicio" BOOLEAN NOT NULL DEFAULT false;
