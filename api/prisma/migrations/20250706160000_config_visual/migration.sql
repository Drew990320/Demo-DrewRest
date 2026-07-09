-- CreateTable
CREATE TABLE "config_visual" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "color_primary" VARCHAR(7),
    "color_primary_dark" VARCHAR(7),
    "color_secondary" VARCHAR(7),
    "color_background" VARCHAR(7),
    "color_background_alt" VARCHAR(7),
    "color_surface" VARCHAR(7),
    "color_text" VARCHAR(7),
    "color_text_muted" VARCHAR(7),
    "color_border" VARCHAR(7),
    "logo_login_archivo" VARCHAR(120),
    "logo_factura_archivo" VARCHAR(120),
    "logo_ticket_archivo" VARCHAR(120),
    "favicon_archivo" VARCHAR(120),
    "navbar_fondo_archivo" VARCHAR(120),
    "iconos_nav" JSONB,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "config_visual_pkey" PRIMARY KEY ("id")
);

INSERT INTO "config_visual" ("id", "actualizado_en") VALUES (1, CURRENT_TIMESTAMP);
