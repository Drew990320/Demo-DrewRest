-- Menú por imágenes: flag superadmin + foto por producto.
ALTER TABLE "config_restaurante" ADD COLUMN IF NOT EXISTS "modulo_menu_imagenes_activo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "producto" ADD COLUMN IF NOT EXISTS "imagen_archivo" VARCHAR(120);
