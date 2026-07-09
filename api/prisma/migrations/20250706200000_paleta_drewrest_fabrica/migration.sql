-- Migra la paleta terracota de fábrica (o fila sin colores) a la paleta DrewRest pastel.
UPDATE "config_visual"
SET
  "color_primary" = '#82B5D6',
  "color_primary_dark" = '#5E96B8',
  "color_secondary" = '#A3C9E3',
  "color_background" = '#EDF3FA',
  "color_background_alt" = '#E4ECF5',
  "color_surface" = '#FFFFFF',
  "color_text" = '#3D4F63',
  "color_text_muted" = '#6B7D91',
  "color_border" = '#CDD9E8',
  "actualizado_en" = CURRENT_TIMESTAMP
WHERE "id" = 1
  AND (
    "color_primary" IS NULL
    OR (
      LOWER("color_primary") = '#c47a72'
      AND LOWER(COALESCE("color_primary_dark", '#a86158')) = '#a86158'
      AND LOWER(COALESCE("color_secondary", '#d4a574')) = '#d4a574'
      AND LOWER(COALESCE("color_background", '#faf6f0')) = '#faf6f0'
    )
  );
