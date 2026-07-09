-- Registrar omisión de cuota en historial (sin línea extra en el pedido)
ALTER TYPE "TipoEventoPedido" ADD VALUE 'cuota_plan_omitida';
