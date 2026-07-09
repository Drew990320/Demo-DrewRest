-- Fase 2: reglas operativas por categoría (reemplazan heurísticas por nombre)

CREATE TYPE "tipo_linea_cocina_cat" AS ENUM ('plato', 'entrada', 'adicional');

ALTER TABLE "categoria" ADD COLUMN "es_bebida" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "categoria" ADD COLUMN "cobra_empaque_para_llevar" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "categoria" ADD COLUMN "participa_descuento_sopas" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "categoria" ADD COLUMN "es_linea_empaque" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "categoria" ADD COLUMN "visible_en_mostrador" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "categoria" ADD COLUMN "tipo_linea_cocina_default" "tipo_linea_cocina_cat" NOT NULL DEFAULT 'plato';
ALTER TABLE "categoria" ADD COLUMN "es_plato_principal_default" BOOLEAN NOT NULL DEFAULT false;

UPDATE "categoria" SET
  "es_bebida" = (LOWER("nombre") LIKE '%bebida%'),
  "cobra_empaque_para_llevar" = ("nombre" LIKE 'Platos fuertes%' OR "nombre" = 'Menú infantil'),
  "participa_descuento_sopas" = (LOWER("nombre") LIKE '%sopa%'),
  "es_linea_empaque" = (LOWER("nombre") LIKE '%empaque%'),
  "visible_en_mostrador" = (LOWER("nombre") LIKE '%bebida%'),
  "es_plato_principal_default" = ("nombre" LIKE 'Platos fuertes%' OR "nombre" = 'Menú infantil'),
  "tipo_linea_cocina_default" = CASE
    WHEN LOWER("nombre") LIKE '%entrada%' OR LOWER("nombre") LIKE '%adicional%' THEN 'entrada'::"tipo_linea_cocina_cat"
    ELSE 'plato'::"tipo_linea_cocina_cat"
  END;
