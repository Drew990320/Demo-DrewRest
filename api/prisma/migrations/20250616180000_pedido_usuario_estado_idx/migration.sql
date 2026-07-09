-- Consultas frecuentes: pedidos activos del mesero (mis-activos).
CREATE INDEX IF NOT EXISTS "pedido_id_usuario_estado_idx" ON "pedido"("id_usuario", "estado");
