-- Autoservicio desde login (opción pública sin sesión de mesero).
ALTER TABLE "config_restaurante" ADD COLUMN IF NOT EXISTS "modulo_autoservicio_activo" BOOLEAN NOT NULL DEFAULT false;

INSERT INTO "rol" ("nombre", "descripcion")
SELECT 'autoservicio', 'Cliente en kiosco / login: solo arma su pedido'
WHERE NOT EXISTS (SELECT 1 FROM "rol" WHERE "nombre" = 'autoservicio');
