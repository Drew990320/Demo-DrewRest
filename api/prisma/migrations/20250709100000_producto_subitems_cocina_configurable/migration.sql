ALTER TABLE "producto"
ADD COLUMN "envia_cocina" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "usa_subitems_repartibles" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "producto_subitem" (
  "id_subitem" SERIAL NOT NULL,
  "id_producto" INTEGER NOT NULL,
  "nombre" VARCHAR(150) NOT NULL,
  "activo" BOOLEAN NOT NULL DEFAULT true,
  "orden" INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "producto_subitem_pkey" PRIMARY KEY ("id_subitem")
);

CREATE TABLE "det_subitem_cantidad" (
  "id_det_subitem" SERIAL NOT NULL,
  "id_detalle" INTEGER NOT NULL,
  "id_subitem" INTEGER NOT NULL,
  "cantidad" INTEGER NOT NULL,

  CONSTRAINT "det_subitem_cantidad_pkey" PRIMARY KEY ("id_det_subitem")
);

CREATE INDEX "producto_subitem_id_producto_activo_orden_idx"
ON "producto_subitem"("id_producto", "activo", "orden");

CREATE INDEX "det_subitem_cantidad_id_detalle_idx"
ON "det_subitem_cantidad"("id_detalle");

CREATE INDEX "det_subitem_cantidad_id_subitem_idx"
ON "det_subitem_cantidad"("id_subitem");

CREATE UNIQUE INDEX "det_subitem_cantidad_id_detalle_id_subitem_key"
ON "det_subitem_cantidad"("id_detalle", "id_subitem");

ALTER TABLE "producto_subitem"
ADD CONSTRAINT "producto_subitem_id_producto_fkey"
FOREIGN KEY ("id_producto") REFERENCES "producto"("id_producto")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "det_subitem_cantidad"
ADD CONSTRAINT "det_subitem_cantidad_id_detalle_fkey"
FOREIGN KEY ("id_detalle") REFERENCES "detalle_pedido"("id_detalle")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "det_subitem_cantidad"
ADD CONSTRAINT "det_subitem_cantidad_id_subitem_fkey"
FOREIGN KEY ("id_subitem") REFERENCES "producto_subitem"("id_subitem")
ON DELETE RESTRICT ON UPDATE CASCADE;
