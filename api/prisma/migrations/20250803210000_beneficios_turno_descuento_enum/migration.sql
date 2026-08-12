-- PostgreSQL: el nuevo valor de enum debe existir en una migración previa
-- antes de usarlo en UPDATEs (misma transacción).
ALTER TYPE "TipoRegistroBeneficioMesero" ADD VALUE IF NOT EXISTS 'descuento_turno';
