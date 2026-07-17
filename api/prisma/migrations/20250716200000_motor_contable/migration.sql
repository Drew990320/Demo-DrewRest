-- CreateEnum
CREATE TYPE "NaturalezaCuenta" AS ENUM ('debito', 'credito');

-- CreateEnum
CREATE TYPE "TipoCuentaContable" AS ENUM ('activo', 'pasivo', 'patrimonio', 'ingreso', 'gasto', 'orden');

-- CreateEnum
CREATE TYPE "GrupoCategoriaContable" AS ENUM ('entro_dinero', 'salio_dinero', 'me_deben', 'debo', 'interno');

-- CreateEnum
CREATE TYPE "LadoAsiento" AS ENUM ('debito', 'credito');

-- CreateEnum
CREATE TYPE "FormulaMontoRegla" AS ENUM ('total', 'porcentaje', 'fijo');

-- CreateEnum
CREATE TYPE "EstadoAsiento" AS ENUM ('publicado', 'reversado');

-- CreateEnum
CREATE TYPE "ModoUiContabilidad" AS ENUM ('simplificado', 'profesional');

-- CreateTable
CREATE TABLE "pais_contable" (
    "id_pais" SERIAL NOT NULL,
    "codigo" VARCHAR(8) NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "norma" VARCHAR(40) NOT NULL,

    CONSTRAINT "pais_contable_pkey" PRIMARY KEY ("id_pais")
);

-- CreateTable
CREATE TABLE "plan_cuentas_version" (
    "id_plan" SERIAL NOT NULL,
    "id_pais" INTEGER NOT NULL,
    "codigo_version" VARCHAR(40) NOT NULL,
    "vigente_desde" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "plan_cuentas_version_pkey" PRIMARY KEY ("id_plan")
);

-- CreateTable
CREATE TABLE "cuenta_contable" (
    "id_cuenta" SERIAL NOT NULL,
    "id_plan" INTEGER NOT NULL,
    "codigo" VARCHAR(32) NOT NULL,
    "nombre" VARCHAR(160) NOT NULL,
    "nivel" INTEGER NOT NULL DEFAULT 1,
    "naturaleza" "NaturalezaCuenta" NOT NULL,
    "tipo" "TipoCuentaContable" NOT NULL,
    "id_padre" INTEGER,
    "acepta_movimiento" BOOLEAN NOT NULL DEFAULT true,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "es_auxiliar" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "cuenta_contable_pkey" PRIMARY KEY ("id_cuenta")
);

-- CreateTable
CREATE TABLE "config_contabilidad" (
    "id_restaurante" INTEGER NOT NULL,
    "id_plan_activo" INTEGER NOT NULL,
    "modo_ui_default" "ModoUiContabilidad" NOT NULL DEFAULT 'simplificado',
    "periodo_abierto_desde" DATE,
    "posteo_automatico" BOOLEAN NOT NULL DEFAULT false,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "config_contabilidad_pkey" PRIMARY KEY ("id_restaurante")
);

-- CreateTable
CREATE TABLE "categoria_contable_simple" (
    "id_categoria" SERIAL NOT NULL,
    "id_restaurante" INTEGER NOT NULL DEFAULT 1,
    "codigo" VARCHAR(40) NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "grupo" "GrupoCategoriaContable" NOT NULL,
    "icono" VARCHAR(40),
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "categoria_contable_simple_pkey" PRIMARY KEY ("id_categoria")
);

-- CreateTable
CREATE TABLE "regla_contable" (
    "id_regla" SERIAL NOT NULL,
    "id_restaurante" INTEGER NOT NULL DEFAULT 1,
    "codigo" VARCHAR(60) NOT NULL,
    "nombre" VARCHAR(160) NOT NULL,
    "id_categoria" INTEGER,
    "evento_origen" VARCHAR(60),
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "prioridad" INTEGER NOT NULL DEFAULT 100,

    CONSTRAINT "regla_contable_pkey" PRIMARY KEY ("id_regla")
);

-- CreateTable
CREATE TABLE "regla_contable_linea" (
    "id_linea_regla" SERIAL NOT NULL,
    "id_regla" INTEGER NOT NULL,
    "lado" "LadoAsiento" NOT NULL,
    "id_cuenta" INTEGER NOT NULL,
    "formula_monto" "FormulaMontoRegla" NOT NULL DEFAULT 'total',
    "porcentaje" DECIMAL(8,4),
    "monto_fijo" DECIMAL(12,2),
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "regla_contable_linea_pkey" PRIMARY KEY ("id_linea_regla")
);

-- CreateTable
CREATE TABLE "centro_costo" (
    "id_centro" SERIAL NOT NULL,
    "id_restaurante" INTEGER NOT NULL DEFAULT 1,
    "codigo" VARCHAR(40) NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "centro_costo_pkey" PRIMARY KEY ("id_centro")
);

-- CreateTable
CREATE TABLE "asiento_contable" (
    "id_asiento" SERIAL NOT NULL,
    "id_restaurante" INTEGER NOT NULL DEFAULT 1,
    "numero" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "descripcion" VARCHAR(255) NOT NULL,
    "origen_modulo" VARCHAR(40) NOT NULL,
    "origen_tipo" VARCHAR(40) NOT NULL,
    "origen_id" INTEGER,
    "id_documento" VARCHAR(80) NOT NULL,
    "estado" "EstadoAsiento" NOT NULL DEFAULT 'publicado',
    "id_asiento_reverso" INTEGER,
    "id_usuario" INTEGER NOT NULL,
    "id_caja_diaria" INTEGER,
    "equipo" VARCHAR(80),
    "motivo" VARCHAR(255),
    "id_categoria_simple" INTEGER,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asiento_contable_pkey" PRIMARY KEY ("id_asiento")
);

-- CreateTable
CREATE TABLE "asiento_linea" (
    "id_linea" SERIAL NOT NULL,
    "id_asiento" INTEGER NOT NULL,
    "id_cuenta" INTEGER NOT NULL,
    "debito" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "credito" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "id_centro_costo" INTEGER,
    "detalle" VARCHAR(255),
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "asiento_linea_pkey" PRIMARY KEY ("id_linea")
);

-- CreateIndex
CREATE UNIQUE INDEX "pais_contable_codigo_key" ON "pais_contable"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "plan_cuentas_version_id_pais_codigo_version_key" ON "plan_cuentas_version"("id_pais", "codigo_version");

-- CreateIndex
CREATE INDEX "plan_cuentas_version_id_pais_activa_idx" ON "plan_cuentas_version"("id_pais", "activa");

-- CreateIndex
CREATE UNIQUE INDEX "cuenta_contable_id_plan_codigo_key" ON "cuenta_contable"("id_plan", "codigo");

-- CreateIndex
CREATE INDEX "cuenta_contable_id_plan_tipo_idx" ON "cuenta_contable"("id_plan", "tipo");

-- CreateIndex
CREATE INDEX "cuenta_contable_id_padre_idx" ON "cuenta_contable"("id_padre");

-- CreateIndex
CREATE UNIQUE INDEX "categoria_contable_simple_id_restaurante_codigo_key" ON "categoria_contable_simple"("id_restaurante", "codigo");

-- CreateIndex
CREATE INDEX "categoria_contable_simple_id_restaurante_grupo_activa_idx" ON "categoria_contable_simple"("id_restaurante", "grupo", "activa");

-- CreateIndex
CREATE UNIQUE INDEX "regla_contable_id_restaurante_codigo_key" ON "regla_contable"("id_restaurante", "codigo");

-- CreateIndex
CREATE INDEX "regla_contable_id_restaurante_evento_origen_activa_idx" ON "regla_contable"("id_restaurante", "evento_origen", "activa");

-- CreateIndex
CREATE INDEX "regla_contable_id_categoria_idx" ON "regla_contable"("id_categoria");

-- CreateIndex
CREATE INDEX "regla_contable_linea_id_regla_orden_idx" ON "regla_contable_linea"("id_regla", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "centro_costo_id_restaurante_codigo_key" ON "centro_costo"("id_restaurante", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "asiento_contable_id_asiento_reverso_key" ON "asiento_contable"("id_asiento_reverso");

-- CreateIndex
CREATE UNIQUE INDEX "asiento_contable_id_restaurante_id_documento_key" ON "asiento_contable"("id_restaurante", "id_documento");

-- CreateIndex
CREATE UNIQUE INDEX "asiento_contable_id_restaurante_numero_key" ON "asiento_contable"("id_restaurante", "numero");

-- CreateIndex
CREATE INDEX "asiento_contable_id_restaurante_fecha_idx" ON "asiento_contable"("id_restaurante", "fecha");

-- CreateIndex
CREATE INDEX "asiento_contable_id_restaurante_estado_idx" ON "asiento_contable"("id_restaurante", "estado");

-- CreateIndex
CREATE INDEX "asiento_contable_origen_modulo_origen_tipo_origen_id_idx" ON "asiento_contable"("origen_modulo", "origen_tipo", "origen_id");

-- CreateIndex
CREATE INDEX "asiento_linea_id_asiento_orden_idx" ON "asiento_linea"("id_asiento", "orden");

-- CreateIndex
CREATE INDEX "asiento_linea_id_cuenta_idx" ON "asiento_linea"("id_cuenta");

-- AddForeignKey
ALTER TABLE "plan_cuentas_version" ADD CONSTRAINT "plan_cuentas_version_id_pais_fkey" FOREIGN KEY ("id_pais") REFERENCES "pais_contable"("id_pais") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuenta_contable" ADD CONSTRAINT "cuenta_contable_id_plan_fkey" FOREIGN KEY ("id_plan") REFERENCES "plan_cuentas_version"("id_plan") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuenta_contable" ADD CONSTRAINT "cuenta_contable_id_padre_fkey" FOREIGN KEY ("id_padre") REFERENCES "cuenta_contable"("id_cuenta") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "config_contabilidad" ADD CONSTRAINT "config_contabilidad_id_restaurante_fkey" FOREIGN KEY ("id_restaurante") REFERENCES "restaurante"("id_restaurante") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "config_contabilidad" ADD CONSTRAINT "config_contabilidad_id_plan_activo_fkey" FOREIGN KEY ("id_plan_activo") REFERENCES "plan_cuentas_version"("id_plan") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categoria_contable_simple" ADD CONSTRAINT "categoria_contable_simple_id_restaurante_fkey" FOREIGN KEY ("id_restaurante") REFERENCES "restaurante"("id_restaurante") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regla_contable" ADD CONSTRAINT "regla_contable_id_restaurante_fkey" FOREIGN KEY ("id_restaurante") REFERENCES "restaurante"("id_restaurante") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regla_contable" ADD CONSTRAINT "regla_contable_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "categoria_contable_simple"("id_categoria") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regla_contable_linea" ADD CONSTRAINT "regla_contable_linea_id_regla_fkey" FOREIGN KEY ("id_regla") REFERENCES "regla_contable"("id_regla") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regla_contable_linea" ADD CONSTRAINT "regla_contable_linea_id_cuenta_fkey" FOREIGN KEY ("id_cuenta") REFERENCES "cuenta_contable"("id_cuenta") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "centro_costo" ADD CONSTRAINT "centro_costo_id_restaurante_fkey" FOREIGN KEY ("id_restaurante") REFERENCES "restaurante"("id_restaurante") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asiento_contable" ADD CONSTRAINT "asiento_contable_id_restaurante_fkey" FOREIGN KEY ("id_restaurante") REFERENCES "restaurante"("id_restaurante") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asiento_contable" ADD CONSTRAINT "asiento_contable_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asiento_contable" ADD CONSTRAINT "asiento_contable_id_asiento_reverso_fkey" FOREIGN KEY ("id_asiento_reverso") REFERENCES "asiento_contable"("id_asiento") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asiento_linea" ADD CONSTRAINT "asiento_linea_id_asiento_fkey" FOREIGN KEY ("id_asiento") REFERENCES "asiento_contable"("id_asiento") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asiento_linea" ADD CONSTRAINT "asiento_linea_id_cuenta_fkey" FOREIGN KEY ("id_cuenta") REFERENCES "cuenta_contable"("id_cuenta") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asiento_linea" ADD CONSTRAINT "asiento_linea_id_centro_costo_fkey" FOREIGN KEY ("id_centro_costo") REFERENCES "centro_costo"("id_centro") ON DELETE SET NULL ON UPDATE CASCADE;
