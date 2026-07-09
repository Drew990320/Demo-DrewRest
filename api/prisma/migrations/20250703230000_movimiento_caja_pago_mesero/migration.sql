-- Pago al mesero cuando el cliente incluye propina/extra en la transferencia.
ALTER TYPE "TipoMovimientoCaja" ADD VALUE IF NOT EXISTS 'pago_mesero';
