-- CreateTable
CREATE TABLE "caja_diaria" (
    "id_caja_diaria" SERIAL NOT NULL,
    "fecha" DATE NOT NULL,
    "monto_base_efectivo" DECIMAL(12,2) NOT NULL,
    "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "caja_diaria_pkey" PRIMARY KEY ("id_caja_diaria")
);

-- CreateIndex
CREATE UNIQUE INDEX "caja_diaria_fecha_key" ON "caja_diaria"("fecha");
