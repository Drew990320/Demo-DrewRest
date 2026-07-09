-- Auditoría al revertir una sola tanda/cobro (no todo el pedido).
ALTER TYPE "TipoEventoPedido" ADD VALUE IF NOT EXISTS 'cobro_tanda_revertida';
