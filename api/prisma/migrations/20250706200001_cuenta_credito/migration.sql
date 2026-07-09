CREATE TYPE "EstadoCredito" AS ENUM ('abierto', 'pagado');

CREATE TABLE "cuenta_credito" (
    "id_credito" SERIAL NOT NULL,
    "id_pedido" INTEGER NOT NULL,
    "id_factura" INTEGER,
    "nombre_cliente" VARCHAR(120) NOT NULL,
    "telefono" VARCHAR(40),
    "monto_total" DECIMAL(10,2) NOT NULL,
    "saldo_pendiente" DECIMAL(10,2) NOT NULL,
    "notas" VARCHAR(500),
    "estado" "EstadoCredito" NOT NULL DEFAULT 'abierto',
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pagado_en" TIMESTAMP(3),
    "id_usuario" INTEGER NOT NULL,

    CONSTRAINT "cuenta_credito_pkey" PRIMARY KEY ("id_credito")
);

CREATE UNIQUE INDEX "cuenta_credito_id_factura_key" ON "cuenta_credito"("id_factura");
CREATE INDEX "cuenta_credito_estado_creado_en_idx" ON "cuenta_credito"("estado", "creado_en");

ALTER TABLE "cuenta_credito" ADD CONSTRAINT "cuenta_credito_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "pedido"("id_pedido") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cuenta_credito" ADD CONSTRAINT "cuenta_credito_id_factura_fkey" FOREIGN KEY ("id_factura") REFERENCES "factura"("id_factura") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "cuenta_credito" ADD CONSTRAINT "cuenta_credito_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
