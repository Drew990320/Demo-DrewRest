-- Fase C slice 3: configs por tenant, módulos contabilidad, lugares, caja, proveedores, inventario

-- Lugar mesa
ALTER TABLE "lugar_mesa" ADD COLUMN "id_restaurante" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "lugar_mesa" ADD CONSTRAINT "lugar_mesa_id_restaurante_fkey"
    FOREIGN KEY ("id_restaurante") REFERENCES "restaurante"("id_restaurante") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "lugar_mesa_id_restaurante_activo_orden_idx" ON "lugar_mesa"("id_restaurante", "activo", "orden");

-- Config operativa
ALTER TABLE "config_operativa" ADD COLUMN "id_restaurante" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "config_operativa" ADD CONSTRAINT "config_operativa_id_restaurante_fkey"
    FOREIGN KEY ("id_restaurante") REFERENCES "restaurante"("id_restaurante") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "config_operativa_id_restaurante_key" ON "config_operativa"("id_restaurante");

-- Config descuento
ALTER TABLE "config_descuento" ADD COLUMN "id_restaurante" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "config_descuento" ADD CONSTRAINT "config_descuento_id_restaurante_fkey"
    FOREIGN KEY ("id_restaurante") REFERENCES "restaurante"("id_restaurante") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "config_descuento_id_restaurante_key" ON "config_descuento"("id_restaurante");

-- Config visual
ALTER TABLE "config_visual" ADD COLUMN "id_restaurante" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "config_visual" ADD CONSTRAINT "config_visual_id_restaurante_fkey"
    FOREIGN KEY ("id_restaurante") REFERENCES "restaurante"("id_restaurante") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "config_visual_id_restaurante_key" ON "config_visual"("id_restaurante");

-- Permisos chef
ALTER TABLE "permisos_chef_config" ADD COLUMN "id_restaurante" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "permisos_chef_config" ADD CONSTRAINT "permisos_chef_config_id_restaurante_fkey"
    FOREIGN KEY ("id_restaurante") REFERENCES "restaurante"("id_restaurante") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "permisos_chef_config_id_restaurante_key" ON "permisos_chef_config"("id_restaurante");

-- Permisos mesero
ALTER TABLE "permisos_mesero_config" ADD COLUMN "id_restaurante" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "permisos_mesero_config" ADD CONSTRAINT "permisos_mesero_config_id_restaurante_fkey"
    FOREIGN KEY ("id_restaurante") REFERENCES "restaurante"("id_restaurante") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "permisos_mesero_config_id_restaurante_key" ON "permisos_mesero_config"("id_restaurante");

-- Caja diaria: fecha única por tenant
ALTER TABLE "caja_diaria" ADD COLUMN "id_restaurante" INTEGER NOT NULL DEFAULT 1;
DROP INDEX IF EXISTS "caja_diaria_fecha_key";
CREATE UNIQUE INDEX "caja_diaria_id_restaurante_fecha_key" ON "caja_diaria"("id_restaurante", "fecha");
CREATE INDEX "caja_diaria_id_restaurante_idx" ON "caja_diaria"("id_restaurante");

-- Proveedor
ALTER TABLE "proveedor" ADD COLUMN "id_restaurante" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "proveedor" ADD CONSTRAINT "proveedor_id_restaurante_fkey"
    FOREIGN KEY ("id_restaurante") REFERENCES "restaurante"("id_restaurante") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "proveedor_id_restaurante_idx" ON "proveedor"("id_restaurante");

-- Inventario: ingrediente único por tenant
ALTER TABLE "inventario" ADD COLUMN "id_restaurante" INTEGER NOT NULL DEFAULT 1;
DROP INDEX IF EXISTS "inventario_ingrediente_key";
CREATE UNIQUE INDEX "inventario_id_restaurante_ingrediente_key" ON "inventario"("id_restaurante", "ingrediente");
CREATE INDEX "inventario_id_restaurante_idx" ON "inventario"("id_restaurante");

-- Módulos contabilidad en config restaurante
ALTER TABLE "config_restaurante" ADD COLUMN "modulo_contabilidad_activo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "config_restaurante" ADD COLUMN "modulo_creditos_activo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "config_restaurante" ADD COLUMN "modulo_odoo_activo" BOOLEAN NOT NULL DEFAULT false;
