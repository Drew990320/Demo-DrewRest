-- Acceso temporal del tenant y rol superadmin (operador oculto).

ALTER TABLE "restaurante" ADD COLUMN IF NOT EXISTS "acceso_hasta" TIMESTAMP(3);

INSERT INTO "rol" ("nombre", "descripcion")
VALUES ('superadmin', 'Operación oculta del sistema')
ON CONFLICT ("nombre") DO NOTHING;
