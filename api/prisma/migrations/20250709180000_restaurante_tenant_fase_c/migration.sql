-- Fase C: tenant por restaurante (slice 1 — on-prem backfill id = 1)

CREATE TABLE "restaurante" (
    "id_restaurante" SERIAL NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "plan" VARCHAR(40) NOT NULL DEFAULT 'core',
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restaurante_pkey" PRIMARY KEY ("id_restaurante")
);

CREATE UNIQUE INDEX "restaurante_slug_key" ON "restaurante"("slug");

INSERT INTO "restaurante" ("id_restaurante", "slug", "nombre", "activo", "plan")
VALUES (1, 'principal', 'Restaurante', true, 'core');

SELECT setval(pg_get_serial_sequence('restaurante', 'id_restaurante'), GREATEST((SELECT MAX("id_restaurante") FROM "restaurante"), 1));

-- Usuario: email único por tenant
ALTER TABLE "usuario" ADD COLUMN "id_restaurante" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_id_restaurante_fkey"
    FOREIGN KEY ("id_restaurante") REFERENCES "restaurante"("id_restaurante") ON DELETE RESTRICT ON UPDATE CASCADE;

DROP INDEX IF EXISTS "usuario_email_key";
CREATE UNIQUE INDEX "usuario_id_restaurante_email_key" ON "usuario"("id_restaurante", "email");
CREATE INDEX "usuario_id_restaurante_idx" ON "usuario"("id_restaurante");

-- Categoría: nombre único por tenant
ALTER TABLE "categoria" ADD COLUMN "id_restaurante" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "categoria" ADD CONSTRAINT "categoria_id_restaurante_fkey"
    FOREIGN KEY ("id_restaurante") REFERENCES "restaurante"("id_restaurante") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "categoria_id_restaurante_nombre_key" ON "categoria"("id_restaurante", "nombre");
CREATE INDEX "categoria_id_restaurante_idx" ON "categoria"("id_restaurante");

-- Config restaurante: una fila por tenant
ALTER TABLE "config_restaurante" ADD COLUMN "id_restaurante" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "config_restaurante" ADD CONSTRAINT "config_restaurante_id_restaurante_fkey"
    FOREIGN KEY ("id_restaurante") REFERENCES "restaurante"("id_restaurante") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "config_restaurante_id_restaurante_key" ON "config_restaurante"("id_restaurante");
