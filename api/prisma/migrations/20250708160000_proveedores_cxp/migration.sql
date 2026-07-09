DO $$ BEGIN
  CREATE TYPE "EstadoCuentaPorPagar" AS ENUM ('abierta', 'pagada', 'anulada');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "MetodoPagoProveedor" AS ENUM ('efectivo', 'transferencia');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "proveedor" (
    "id_proveedor" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "nit" VARCHAR(20),
    "telefono" VARCHAR(40),
    "email" VARCHAR(120),
    "direccion" VARCHAR(255),
    "notas" VARCHAR(500),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proveedor_pkey" PRIMARY KEY ("id_proveedor")
);

CREATE TABLE IF NOT EXISTS "cuenta_por_pagar" (
    "id_cuenta_por_pagar" SERIAL NOT NULL,
    "id_proveedor" INTEGER NOT NULL,
    "numero_documento" VARCHAR(60),
    "descripcion" VARCHAR(255),
    "fecha_emision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_vencimiento" DATE,
    "monto_total" DECIMAL(12,2) NOT NULL,
    "saldo_pendiente" DECIMAL(12,2) NOT NULL,
    "estado" "EstadoCuentaPorPagar" NOT NULL DEFAULT 'abierta',
    "notas" VARCHAR(500),
    "es_contado" BOOLEAN NOT NULL DEFAULT false,
    "id_usuario" INTEGER NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pagado_en" TIMESTAMP(3),

    CONSTRAINT "cuenta_por_pagar_pkey" PRIMARY KEY ("id_cuenta_por_pagar")
);

CREATE TABLE IF NOT EXISTS "pago_proveedor" (
    "id_pago_proveedor" SERIAL NOT NULL,
    "id_cuenta_por_pagar" INTEGER NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "metodo_pago" "MetodoPagoProveedor" NOT NULL,
    "notas" VARCHAR(500),
    "id_usuario" INTEGER NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pago_proveedor_pkey" PRIMARY KEY ("id_pago_proveedor")
);

CREATE INDEX IF NOT EXISTS "cuenta_por_pagar_estado_fecha_emision_idx" ON "cuenta_por_pagar"("estado", "fecha_emision");
CREATE INDEX IF NOT EXISTS "cuenta_por_pagar_id_proveedor_idx" ON "cuenta_por_pagar"("id_proveedor");
CREATE INDEX IF NOT EXISTS "pago_proveedor_id_cuenta_por_pagar_idx" ON "pago_proveedor"("id_cuenta_por_pagar");

DO $$ BEGIN
  ALTER TABLE "cuenta_por_pagar" ADD CONSTRAINT "cuenta_por_pagar_id_proveedor_fkey" FOREIGN KEY ("id_proveedor") REFERENCES "proveedor"("id_proveedor") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "cuenta_por_pagar" ADD CONSTRAINT "cuenta_por_pagar_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "pago_proveedor" ADD CONSTRAINT "pago_proveedor_id_cuenta_por_pagar_fkey" FOREIGN KEY ("id_cuenta_por_pagar") REFERENCES "cuenta_por_pagar"("id_cuenta_por_pagar") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "pago_proveedor" ADD CONSTRAINT "pago_proveedor_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
