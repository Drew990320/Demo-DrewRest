-- Marca cuándo se envió cada línea a cocina (permite reconstruir comanda adicional en vista previa).
ALTER TABLE "detalle_pedido" ADD COLUMN "enviado_cocina_en" TIMESTAMP(3);
