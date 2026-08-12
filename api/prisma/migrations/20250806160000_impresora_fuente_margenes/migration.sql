-- Tamaño de letra y márgenes (inicio/fin) configurables por impresora POS.

ALTER TABLE "impresora_pos"
  ADD COLUMN IF NOT EXISTS "tamano_fuente" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "margen_inicio_lineas" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "margen_fin_lineas" INTEGER NOT NULL DEFAULT 2;
