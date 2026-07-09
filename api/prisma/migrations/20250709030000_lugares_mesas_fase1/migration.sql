-- Fase 1: lugares para mesas

CREATE TABLE "lugar_mesa" (
  "id_lugar" SERIAL NOT NULL,
  "nombre" VARCHAR(100) NOT NULL,
  "orden" INTEGER NOT NULL DEFAULT 1,
  "activo" BOOLEAN NOT NULL DEFAULT true,
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "lugar_mesa_pkey" PRIMARY KEY ("id_lugar")
);

ALTER TABLE "mesa"
ADD COLUMN "id_lugar" INTEGER;

CREATE INDEX "lugar_mesa_activo_orden_idx" ON "lugar_mesa"("activo", "orden");
CREATE INDEX "mesa_id_lugar_numero_idx" ON "mesa"("id_lugar", "numero");

ALTER TABLE "mesa"
ADD CONSTRAINT "mesa_id_lugar_fkey"
FOREIGN KEY ("id_lugar") REFERENCES "lugar_mesa"("id_lugar")
ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "lugar_mesa" ("nombre", "orden", "activo")
SELECT 'Salón principal', 1, true
WHERE NOT EXISTS (
  SELECT 1 FROM "lugar_mesa" WHERE LOWER("nombre") = LOWER('Salón principal')
);

UPDATE "mesa"
SET "id_lugar" = (
  SELECT "id_lugar"
  FROM "lugar_mesa"
  WHERE LOWER("nombre") = LOWER('Salón principal')
  ORDER BY "id_lugar"
  LIMIT 1
)
WHERE "id_lugar" IS NULL
  AND "numero" NOT IN (
    SELECT "numero_mesa_para_llevar" FROM "config_operativa" WHERE "id" = 1
    UNION
    SELECT "numero_mesa_mostrador" FROM "config_operativa" WHERE "id" = 1
  );
