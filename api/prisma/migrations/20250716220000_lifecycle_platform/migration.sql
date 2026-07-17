-- CreateEnum
CREATE TYPE "LifecycleSystemStatus" AS ENUM ('healthy', 'updating', 'recovery');

-- CreateTable
CREATE TABLE "lifecycle_migration_run" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "version_app" VARCHAR(40),
    "schema_version" INTEGER,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duracion_ms" INTEGER NOT NULL,
    "estado" VARCHAR(40) NOT NULL,
    "usuario" VARCHAR(80) NOT NULL DEFAULT 'launcher',
    "resultado" TEXT,
    "error" TEXT,

    CONSTRAINT "lifecycle_migration_run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lifecycle_backup_event" (
    "id" SERIAL NOT NULL,
    "backup_id" VARCHAR(80) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "app_version" VARCHAR(40),
    "schema_version" INTEGER,
    "ruta" VARCHAR(500) NOT NULL,
    "tamano_bytes" BIGINT,
    "estado" VARCHAR(40) NOT NULL,
    "checksum_sha256" VARCHAR(64),
    "error" TEXT,

    CONSTRAINT "lifecycle_backup_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lifecycle_update_event" (
    "id" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "from_version" VARCHAR(40),
    "to_version" VARCHAR(40),
    "canal" VARCHAR(40),
    "backup_id" VARCHAR(80),
    "estado" VARCHAR(40) NOT NULL,
    "detalle" TEXT,
    "error" TEXT,

    CONSTRAINT "lifecycle_update_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lifecycle_system_state" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "estado" "LifecycleSystemStatus" NOT NULL DEFAULT 'healthy',
    "detalle" TEXT,
    "backup_id_activo" VARCHAR(80),
    "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lifecycle_system_state_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lifecycle_migration_run_fecha_idx" ON "lifecycle_migration_run"("fecha");

-- CreateIndex
CREATE INDEX "lifecycle_backup_event_fecha_idx" ON "lifecycle_backup_event"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "lifecycle_backup_event_backup_id_key" ON "lifecycle_backup_event"("backup_id");

-- CreateIndex
CREATE INDEX "lifecycle_update_event_fecha_idx" ON "lifecycle_update_event"("fecha");

-- Seed singleton
INSERT INTO "lifecycle_system_state" ("id", "estado") VALUES (1, 'healthy')
ON CONFLICT ("id") DO NOTHING;
