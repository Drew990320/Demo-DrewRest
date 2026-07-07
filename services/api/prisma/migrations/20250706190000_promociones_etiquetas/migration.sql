ALTER TABLE "config_descuento" ADD COLUMN "etiquetas_pedido" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "pedido" ADD COLUMN "etiquetas_promocion" JSONB NOT NULL DEFAULT '[]';
