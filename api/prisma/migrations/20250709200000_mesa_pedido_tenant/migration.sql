-- Fase C slice 2: mesas y pedidos por tenant

ALTER TABLE "mesa" ADD COLUMN "id_restaurante" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "mesa" ADD CONSTRAINT "mesa_id_restaurante_fkey"
    FOREIGN KEY ("id_restaurante") REFERENCES "restaurante"("id_restaurante") ON DELETE RESTRICT ON UPDATE CASCADE;

DROP INDEX IF EXISTS "mesa_numero_key";
CREATE UNIQUE INDEX "mesa_id_restaurante_numero_key" ON "mesa"("id_restaurante", "numero");
CREATE INDEX "mesa_id_restaurante_idx" ON "mesa"("id_restaurante");

ALTER TABLE "pedido" ADD COLUMN "id_restaurante" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "pedido" ADD CONSTRAINT "pedido_id_restaurante_fkey"
    FOREIGN KEY ("id_restaurante") REFERENCES "restaurante"("id_restaurante") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "pedido_id_restaurante_estado_creado_en_idx" ON "pedido"("id_restaurante", "estado", "creado_en");
CREATE INDEX "pedido_id_restaurante_idx" ON "pedido"("id_restaurante");

-- Alinear pedidos con la mesa (por si hubiera inconsistencia futura)
UPDATE "pedido" p
SET "id_restaurante" = m."id_restaurante"
FROM "mesa" m
WHERE p."id_mesa" = m."id_mesa" AND p."id_restaurante" IS DISTINCT FROM m."id_restaurante";
