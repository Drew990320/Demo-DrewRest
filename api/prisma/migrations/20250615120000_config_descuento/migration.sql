-- Reglas globales de descuento (sopas / muleros), configuradas por el administrador.
CREATE TABLE "config_descuento" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "sopas_activo" BOOLEAN NOT NULL DEFAULT false,
    "sopas_monto_por_unidad" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "muleros_activo" BOOLEAN NOT NULL DEFAULT false,
    "muleros_monto_por_unidad" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "config_descuento_pkey" PRIMARY KEY ("id")
);

INSERT INTO "config_descuento" ("id") VALUES (1);
