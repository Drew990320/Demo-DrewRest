import { OnModuleInit } from '@nestjs/common';
import type { ConfigRestaurante } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertConfigRestauranteDto } from './dto/upsert-config-restaurante.dto';
export type ConfigRestauranteApi = {
    nombre_comercial: string;
    telefono: string | null;
    direccion: string | null;
    dominio_email_interno: string;
    logo_archivo: string | null;
    tiene_logo: boolean;
    texto_gracias_ticket: string;
    texto_propina_ticket: string;
    texto_aviso_no_dian: string;
    texto_pie_correo: string | null;
    prefijo_asunto_correo: string | null;
    mostrar_credito_drewtech: boolean;
    etiqueta_descuento_sopas: string;
    etiqueta_descuento_muleros: string;
    modulo_inventario_activo: boolean;
    modulo_meseros_operativos_activo: boolean;
    modulo_envio_correo_activo: boolean;
    modulo_resumen_diario_activo: boolean;
    actualizado_en: string;
};
export declare class ConfigRestauranteService implements OnModuleInit {
    private readonly prisma;
    constructor(prisma: PrismaService);
    onModuleInit(): Promise<void>;
    private mapRow;
    obtenerRow(): Promise<ConfigRestaurante>;
    obtener(): Promise<ConfigRestauranteApi>;
    actualizar(dto: UpsertConfigRestauranteDto): Promise<ConfigRestauranteApi>;
    guardarLogo(buffer: Buffer, mime: string, originalName?: string): Promise<Pick<ConfigRestauranteApi, 'logo_archivo' | 'tiene_logo'>>;
}
