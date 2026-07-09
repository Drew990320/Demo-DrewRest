-- Pago a domiciliario cuando el cliente incluye el domicilio en la transferencia.
ALTER TYPE "TipoMovimientoCaja" ADD VALUE IF NOT EXISTS 'pago_domicilio';
