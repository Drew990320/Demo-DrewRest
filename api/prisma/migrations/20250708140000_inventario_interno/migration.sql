DO $$ BEGIN
  CREATE TYPE "TipoMovInventario" AS ENUM ('entrada', 'consumo', 'ajuste');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "inventario" (
    "id_inventario" SERIAL NOT NULL,
    "ingrediente" VARCHAR(150) NOT NULL,
    "cantidad_actual" DECIMAL(10,3) NOT NULL,
    "unidad" VARCHAR(20) NOT NULL,
    "cantidad_minima" DECIMAL(10,3) NOT NULL,

    CONSTRAINT "inventario_pkey" PRIMARY KEY ("id_inventario")
);

CREATE UNIQUE INDEX IF NOT EXISTS "inventario_ingrediente_key" ON "inventario"("ingrediente");

CREATE TABLE IF NOT EXISTS "mov_inventario" (
    "id_mov" SERIAL NOT NULL,
    "id_inventario" INTEGER NOT NULL,
    "id_pedido" INTEGER,
    "tipo_mov" "TipoMovInventario" NOT NULL,
    "cantidad" DECIMAL(10,3) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacion" TEXT,

    CONSTRAINT "mov_inventario_pkey" PRIMARY KEY ("id_mov")
);

DO $$ BEGIN
  ALTER TABLE "mov_inventario" ADD CONSTRAINT "mov_inventario_id_inventario_fkey" FOREIGN KEY ("id_inventario") REFERENCES "inventario"("id_inventario") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "mov_inventario" ADD CONSTRAINT "mov_inventario_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "pedido"("id_pedido") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
