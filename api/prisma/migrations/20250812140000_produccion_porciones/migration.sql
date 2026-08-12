-- Producción por porciones (enteras → porciones vendibles).
ALTER TABLE "config_restaurante" ADD COLUMN IF NOT EXISTS "modulo_produccion_porciones_activo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "producto" ADD COLUMN IF NOT EXISTS "usa_produccion_porciones" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "producto" ADD COLUMN IF NOT EXISTS "porciones_por_entera" INTEGER NOT NULL DEFAULT 8;

CREATE TABLE IF NOT EXISTS "produccion_porcion" (
  "id_produccion" SERIAL PRIMARY KEY,
  "id_restaurante" INTEGER NOT NULL DEFAULT 1,
  "id_producto" INTEGER NOT NULL,
  "fecha" DATE NOT NULL,
  "enteras" INTEGER NOT NULL,
  "porciones_por_entera" INTEGER NOT NULL,
  "porciones_generadas" INTEGER NOT NULL,
  "id_usuario" INTEGER,
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "produccion_porcion_id_restaurante_fkey"
    FOREIGN KEY ("id_restaurante") REFERENCES "restaurante"("id_restaurante") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "produccion_porcion_id_producto_fkey"
    FOREIGN KEY ("id_producto") REFERENCES "producto"("id_producto") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "produccion_porcion_id_usuario_fkey"
    FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "produccion_porcion_id_restaurante_fecha_idx"
  ON "produccion_porcion"("id_restaurante", "fecha");
CREATE INDEX IF NOT EXISTS "produccion_porcion_id_producto_fecha_idx"
  ON "produccion_porcion"("id_producto", "fecha");
