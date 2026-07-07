-- Rol superadmin y tablas de horarios/permisos por admin

INSERT INTO "rol" ("nombre", "descripcion")
VALUES ('superadmin', 'Superadministración DrewTech')
ON CONFLICT ("nombre") DO NOTHING;

CREATE TABLE IF NOT EXISTS "horario_acceso_usuario" (
  "id_horario" SERIAL PRIMARY KEY,
  "id_usuario" INTEGER NOT NULL,
  "dia_semana" INTEGER NOT NULL,
  "hora_inicio" VARCHAR(5) NOT NULL,
  "hora_fin" VARCHAR(5) NOT NULL,
  CONSTRAINT "horario_acceso_usuario_id_usuario_fkey"
    FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "horario_acceso_usuario_id_usuario_dia_semana_key"
  ON "horario_acceso_usuario"("id_usuario", "dia_semana");
CREATE INDEX IF NOT EXISTS "horario_acceso_usuario_id_usuario_idx"
  ON "horario_acceso_usuario"("id_usuario");

CREATE TABLE IF NOT EXISTS "permisos_admin_usuario" (
  "id_usuario" INTEGER PRIMARY KEY,
  "perm_usuarios" BOOLEAN NOT NULL DEFAULT true,
  "perm_permisos" BOOLEAN NOT NULL DEFAULT true,
  "perm_menu" BOOLEAN NOT NULL DEFAULT true,
  "perm_mesas" BOOLEAN NOT NULL DEFAULT true,
  "perm_configuracion" BOOLEAN NOT NULL DEFAULT true,
  "perm_resumen_diario" BOOLEAN NOT NULL DEFAULT true,
  "perm_creditos" BOOLEAN NOT NULL DEFAULT true,
  "perm_personalizacion" BOOLEAN NOT NULL DEFAULT true,
  "perm_meseros_operativos" BOOLEAN NOT NULL DEFAULT true,
  "perm_conexion_movil" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "permisos_admin_usuario_id_usuario_fkey"
    FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE
);
