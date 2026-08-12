-- Ancho de rollo por impresora POS (58 mm o 80 mm).
ALTER TABLE "impresora_pos"
  ADD COLUMN "ancho_papel_mm" INTEGER NOT NULL DEFAULT 58;
