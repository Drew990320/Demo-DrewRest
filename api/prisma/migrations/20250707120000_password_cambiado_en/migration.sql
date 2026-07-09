-- Revocación de JWT: marca cuándo cambió la contraseña por última vez.
ALTER TABLE "usuario" ADD COLUMN "password_cambiado_en" TIMESTAMP(3);

UPDATE "usuario"
SET "password_cambiado_en" = "creado_en"
WHERE "password_cambiado_en" IS NULL;
