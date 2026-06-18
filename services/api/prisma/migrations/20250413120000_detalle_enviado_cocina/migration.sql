-- Líneas enviadas explícitamente a cocina (comanda impresa).
ALTER TABLE "detalle_pedido" ADD COLUMN "enviado_cocina" BOOLEAN NOT NULL DEFAULT false;

-- Pedidos ya en cocina: marcar líneas de comida como enviadas (compatibilidad).
UPDATE "detalle_pedido" AS dp
SET "enviado_cocina" = true
FROM "pedido" AS p,
     "producto" AS pr,
     "categoria" AS c
WHERE dp."id_pedido" = p."id_pedido"
  AND pr."id_producto" = dp."id_producto"
  AND c."id_categoria" = pr."id_categoria"
  AND p."estado" = 'en_cocina'
  AND pr."es_empacable" = false
  AND LOWER(c."nombre") NOT LIKE '%bebida%';
