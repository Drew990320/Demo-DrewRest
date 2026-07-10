-- Agrupación de mesas: varias mesas físicas para un solo pedido.

CREATE TABLE "pedido_mesa_anexa" (
    "id_pedido_mesa_anexa" SERIAL NOT NULL,
    "id_pedido" INTEGER NOT NULL,
    "id_mesa" INTEGER NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pedido_mesa_anexa_pkey" PRIMARY KEY ("id_pedido_mesa_anexa")
);

CREATE UNIQUE INDEX "pedido_mesa_anexa_id_mesa_key" ON "pedido_mesa_anexa"("id_mesa");
CREATE UNIQUE INDEX "pedido_mesa_anexa_id_pedido_id_mesa_key" ON "pedido_mesa_anexa"("id_pedido", "id_mesa");
CREATE INDEX "pedido_mesa_anexa_id_pedido_idx" ON "pedido_mesa_anexa"("id_pedido");

ALTER TABLE "pedido_mesa_anexa" ADD CONSTRAINT "pedido_mesa_anexa_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "pedido"("id_pedido") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pedido_mesa_anexa" ADD CONSTRAINT "pedido_mesa_anexa_id_mesa_fkey" FOREIGN KEY ("id_mesa") REFERENCES "mesa"("id_mesa") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "permisos_mesero_config" ADD COLUMN "agrupar_mesas" BOOLEAN NOT NULL DEFAULT true;
