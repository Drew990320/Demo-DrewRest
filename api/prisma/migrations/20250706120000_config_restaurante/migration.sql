-- Configuración central del restaurante (identidad, textos, módulos).
CREATE TABLE "config_restaurante" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "nombre_comercial" VARCHAR(120) NOT NULL DEFAULT 'Restaurante',
    "telefono" VARCHAR(40),
    "direccion" VARCHAR(255),
    "dominio_email_interno" VARCHAR(80) NOT NULL DEFAULT 'restaurant.local',
    "logo_archivo" VARCHAR(120),
    "texto_gracias_ticket" VARCHAR(200) NOT NULL DEFAULT 'Gracias por su visita',
    "texto_propina_ticket" VARCHAR(120) NOT NULL DEFAULT '*** PROPINA VOLUNTARIA ***',
    "texto_aviso_no_dian" VARCHAR(255) NOT NULL DEFAULT 'No constituye factura electrónica DIAN',
    "texto_pie_correo" TEXT,
    "prefijo_asunto_correo" VARCHAR(80),
    "mostrar_credito_drewtech" BOOLEAN NOT NULL DEFAULT true,
    "etiqueta_descuento_sopas" VARCHAR(80) NOT NULL DEFAULT 'Descuento sopas',
    "etiqueta_descuento_muleros" VARCHAR(80) NOT NULL DEFAULT 'Descuento clientes especiales',
    "modulo_inventario_activo" BOOLEAN NOT NULL DEFAULT false,
    "modulo_meseros_operativos_activo" BOOLEAN NOT NULL DEFAULT true,
    "modulo_envio_correo_activo" BOOLEAN NOT NULL DEFAULT false,
    "modulo_resumen_diario_activo" BOOLEAN NOT NULL DEFAULT true,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "config_restaurante_pkey" PRIMARY KEY ("id")
);

INSERT INTO "config_restaurante" ("id", "actualizado_en")
VALUES (1, CURRENT_TIMESTAMP);

CREATE TABLE "permisos_chef_config" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "ver_cola_cocina" BOOLEAN NOT NULL DEFAULT true,
    "marcar_listo" BOOLEAN NOT NULL DEFAULT true,
    "reimprimir_comanda" BOOLEAN NOT NULL DEFAULT true,
    "anular_linea_cocina" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "permisos_chef_config_pkey" PRIMARY KEY ("id")
);

INSERT INTO "permisos_chef_config" ("id") VALUES (1);
