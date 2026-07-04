-- Delegación de un mesero por día (cierre con anulación) + historial de pedido
CREATE TYPE "TipoDelegacionMesero" AS ENUM ('cierre_con_anulacion');

ALTER TYPE "TipoEventoPedido" ADD VALUE 'pendiente_anulado_cierre';

CREATE TABLE "delegacion_mesero_turno" (
    "id_registro" SERIAL NOT NULL,
    "fecha" DATE NOT NULL,
    "tipo" "TipoDelegacionMesero" NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_usuario_registro" INTEGER NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delegacion_mesero_turno_pkey" PRIMARY KEY ("id_registro")
);

CREATE UNIQUE INDEX "delegacion_mesero_turno_fecha_tipo_key" ON "delegacion_mesero_turno"("fecha", "tipo");
CREATE INDEX "delegacion_mesero_turno_fecha_id_usuario_idx" ON "delegacion_mesero_turno"("fecha", "id_usuario");

ALTER TABLE "delegacion_mesero_turno" ADD CONSTRAINT "delegacion_mesero_turno_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "delegacion_mesero_turno" ADD CONSTRAINT "delegacion_mesero_turno_id_usuario_registro_fkey" FOREIGN KEY ("id_usuario_registro") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
