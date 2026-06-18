-- Mazorcas como línea de detalle de cocina (no campos sueltos en pedido).
ALTER TABLE "producto" ADD COLUMN "es_acompanamiento_mazorca" BOOLEAN NOT NULL DEFAULT false;

INSERT INTO "producto" (
  "id_categoria",
  "nombre",
  "descripcion",
  "precio",
  "activo",
  "es_plato_principal",
  "es_empacable",
  "tipo_proteina",
  "es_acompanamiento_mazorca"
)
SELECT
  c."id_categoria",
  'Mazorca (acompañamiento)',
  'Incluida con el servicio · 1 por comensal',
  0,
  true,
  false,
  false,
  'ninguno',
  true
FROM "categoria" c
WHERE c."nombre" ILIKE '%Entradas%'
  AND NOT EXISTS (
    SELECT 1 FROM "producto" p WHERE p."es_acompanamiento_mazorca" = true
  )
LIMIT 1;

-- Migrar pedidos abiertos: repartir cantidad según campos legacy.
DO $$
DECLARE
  prod_id INTEGER;
  r RECORD;
  ent INTEGER;
  listas INTEGER;
  pend INTEGER;
  enviado BOOLEAN;
BEGIN
  SELECT "id_producto" INTO prod_id
  FROM "producto"
  WHERE "es_acompanamiento_mazorca" = true
  ORDER BY "id_producto"
  LIMIT 1;

  IF prod_id IS NULL THEN
    RETURN;
  END IF;

  FOR r IN
    SELECT
      p."id_pedido",
      p."num_comensales",
      p."mazorcas_entregadas",
      p."mazorcas_listas_recoger",
      p."estado",
      m."numero" AS mesa_numero
    FROM "pedido" p
    JOIN "mesa" m ON m."id_mesa" = p."id_mesa"
    WHERE p."estado" IN ('abierto', 'en_cocina')
      AND m."numero" <> 98
  LOOP
    IF EXISTS (
      SELECT 1 FROM "detalle_pedido" d
      WHERE d."id_pedido" = r."id_pedido" AND d."id_producto" = prod_id
    ) THEN
      CONTINUE;
    END IF;

    ent := LEAST(GREATEST(r."mazorcas_entregadas", 0), r."num_comensales");
    listas := LEAST(
      GREATEST(r."mazorcas_listas_recoger", 0),
      r."num_comensales" - ent
    );
    pend := r."num_comensales" - ent - listas;
    enviado := r."estado" = 'en_cocina';

    IF ent > 0 THEN
      INSERT INTO "detalle_pedido" (
        "id_pedido", "id_producto", "cantidad", "precio_unitario",
        "enviado_cocina", "listo_para_recoger", "listo_cocina"
      ) VALUES (
        r."id_pedido", prod_id, ent, 0,
        true, true, true
      );
    END IF;

    IF listas > 0 THEN
      INSERT INTO "detalle_pedido" (
        "id_pedido", "id_producto", "cantidad", "precio_unitario",
        "enviado_cocina", "listo_para_recoger", "listo_cocina"
      ) VALUES (
        r."id_pedido", prod_id, listas, 0,
        true, true, false
      );
    END IF;

    IF pend > 0 THEN
      INSERT INTO "detalle_pedido" (
        "id_pedido", "id_producto", "cantidad", "precio_unitario",
        "enviado_cocina", "listo_para_recoger", "listo_cocina"
      ) VALUES (
        r."id_pedido", prod_id, pend, 0,
        enviado, false, false
      );
    END IF;
  END LOOP;
END $$;

ALTER TABLE "pedido" DROP COLUMN "mazorcas_entregadas";
ALTER TABLE "pedido" DROP COLUMN "mazorcas_listas_recoger";
