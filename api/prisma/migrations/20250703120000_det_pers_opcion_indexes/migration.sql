-- Índices para cargas frecuentes de personalizaciones y opciones de menú
CREATE INDEX IF NOT EXISTS "det_personalizacion_id_detalle_idx" ON "det_personalizacion"("id_detalle");
CREATE INDEX IF NOT EXISTS "personalizacion_opcion_id_producto_idx" ON "personalizacion_opcion"("id_producto");
