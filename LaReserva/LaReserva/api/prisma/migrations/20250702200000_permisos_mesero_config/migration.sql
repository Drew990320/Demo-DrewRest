CREATE TABLE "permisos_mesero_config" (
  "id" INTEGER NOT NULL DEFAULT 1,
  "agregar_items" BOOLEAN NOT NULL DEFAULT true,
  "editar_cantidades" BOOLEAN NOT NULL DEFAULT true,
  "quitar_lineas" BOOLEAN NOT NULL DEFAULT true,
  "enviar_cocina" BOOLEAN NOT NULL DEFAULT true,
  "reimprimir_comanda" BOOLEAN NOT NULL DEFAULT true,
  "cobrar" BOOLEAN NOT NULL DEFAULT true,
  "precuenta" BOOLEAN NOT NULL DEFAULT true,
  "reimprimir_factura" BOOLEAN NOT NULL DEFAULT true,
  "cancelar_pedido" BOOLEAN NOT NULL DEFAULT true,
  "transferir_mesa" BOOLEAN NOT NULL DEFAULT true,
  "ayuda_companeros" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "permisos_mesero_config_pkey" PRIMARY KEY ("id")
);

INSERT INTO "permisos_mesero_config" ("id") VALUES (1);
