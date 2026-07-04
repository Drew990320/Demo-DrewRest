-- Índices para consultas frecuentes bajo carga (mesas activas, cocina, resumen diario).
CREATE INDEX "pedido_id_mesa_estado_idx" ON "pedido"("id_mesa", "estado");
CREATE INDEX "pedido_estado_creado_en_idx" ON "pedido"("estado", "creado_en");
CREATE INDEX "detalle_pedido_id_pedido_idx" ON "detalle_pedido"("id_pedido");
CREATE INDEX "detalle_pedido_id_detalle_padre_idx" ON "detalle_pedido"("id_detalle_padre");
CREATE INDEX "factura_emitida_en_idx" ON "factura"("emitida_en");
