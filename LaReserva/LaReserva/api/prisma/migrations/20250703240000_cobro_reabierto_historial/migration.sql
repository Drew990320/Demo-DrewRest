-- Auditoría al anular cobros de un pedido para corregir y volver a facturar.
ALTER TYPE "TipoEventoPedido" ADD VALUE IF NOT EXISTS 'cobro_reabierto';
