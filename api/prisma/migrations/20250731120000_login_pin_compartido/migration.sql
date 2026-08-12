-- Login con PIN compartido en pantallas de equipo.

ALTER TABLE "config_restaurante"
  ADD COLUMN IF NOT EXISTS "modulo_login_pin_activo" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "config_restaurante"
  ADD COLUMN IF NOT EXISTS "login_pin_compartido_activo" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "config_restaurante"
  ADD COLUMN IF NOT EXISTS "login_pin_hash" VARCHAR(255);
