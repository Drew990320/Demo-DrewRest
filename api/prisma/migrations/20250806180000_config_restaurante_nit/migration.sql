-- NIT del restaurante (tickets e informacion publica).
ALTER TABLE "config_restaurante"
  ADD COLUMN IF NOT EXISTS "nit" VARCHAR(40);
