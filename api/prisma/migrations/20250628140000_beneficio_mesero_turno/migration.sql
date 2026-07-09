-- Beneficio de meseros (soda almuerzo / pago por turno) + config operativa.
CREATE TYPE "TipoRegistroBeneficioMesero" AS ENUM ('soda_almuerzo', 'pago_turno');

CREATE TABLE "registro_beneficio_mesero" (
    "id_registro" SERIAL NOT NULL,
    "fecha" DATE NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "tipo" "TipoRegistroBeneficioMesero" NOT NULL,
    "monto" DECIMAL(12,2),
    "id_producto" INTEGER,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "desconto_stock" BOOLEAN NOT NULL DEFAULT false,
    "notas" TEXT,
    "id_usuario_registro" INTEGER NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registro_beneficio_mesero_pkey" PRIMARY KEY ("id_registro")
);

CREATE UNIQUE INDEX "registro_beneficio_mesero_fecha_usuario_tipo_key"
    ON "registro_beneficio_mesero"("fecha", "id_usuario", "tipo");

CREATE INDEX "registro_beneficio_mesero_fecha_idx"
    ON "registro_beneficio_mesero"("fecha");

ALTER TABLE "registro_beneficio_mesero"
    ADD CONSTRAINT "registro_beneficio_mesero_id_usuario_fkey"
    FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "registro_beneficio_mesero"
    ADD CONSTRAINT "registro_beneficio_mesero_id_usuario_registro_fkey"
    FOREIGN KEY ("id_usuario_registro") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "registro_beneficio_mesero"
    ADD CONSTRAINT "registro_beneficio_mesero_id_producto_fkey"
    FOREIGN KEY ("id_producto") REFERENCES "producto"("id_producto") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "config_operativa" ADD COLUMN "beneficio_soda_almuerzo_activo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "config_operativa" ADD COLUMN "id_producto_soda_almuerzo" INTEGER;
ALTER TABLE "config_operativa" ADD COLUMN "soda_almuerzo_descontar_stock" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "config_operativa"
    ADD CONSTRAINT "config_operativa_id_producto_soda_almuerzo_fkey"
    FOREIGN KEY ("id_producto_soda_almuerzo") REFERENCES "producto"("id_producto") ON DELETE SET NULL ON UPDATE CASCADE;
