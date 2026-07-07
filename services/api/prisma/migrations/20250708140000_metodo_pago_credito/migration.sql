-- Crédito / cuenta por cobrar como método de pago en factura.
ALTER TYPE "MetodoPago" ADD VALUE IF NOT EXISTS 'credito';
