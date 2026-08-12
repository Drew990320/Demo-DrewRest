-- Color opcional del icono de categoría (#RRGGBB).
ALTER TABLE "categoria"
  ADD COLUMN IF NOT EXISTS "color_icono" VARCHAR(7);
