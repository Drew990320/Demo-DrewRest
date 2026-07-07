import { Injectable, OnModuleInit } from '@nestjs/common';
import type { ConfigRestaurante } from '@prisma/client';
import { restaurantHasLogo } from '../common/restaurant-branding';
import { PrismaService } from '../prisma/prisma.service';
import {
  getCachedConfigRestaurante,
  invalidateConfigRestauranteCache,
  setCachedConfigRestaurante,
} from './config-restaurante-cache';
import { UpsertConfigRestauranteDto } from './dto/upsert-config-restaurante.dto';
import { guardarArchivoLogoRestaurante } from './logo-upload.util';

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

function envFallbackNombre(): string | undefined {
  return process.env.RESTAURANT_NAME?.trim() || undefined;
}

function envFallbackTelefono(): string | undefined {
  return process.env.RESTAURANT_TICKET_PHONE?.trim() || undefined;
}

function envFallbackDireccion(): string | undefined {
  return process.env.RESTAURANT_TICKET_ADDRESS?.trim() || undefined;
}

function envFallbackDominio(): string | undefined {
  return process.env.RESTAURANT_EMAIL_DOMAIN?.trim()?.replace(/^@/, '') || undefined;
}

@Injectable()
export class ConfigRestauranteService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await this.obtenerRow();
  }

  private mapRow(row: ConfigRestaurante): ConfigRestauranteApi {
    return {
      nombre_comercial: row.nombreComercial,
      telefono: row.telefono,
      direccion: row.direccion,
      dominio_email_interno: row.dominioEmailInterno,
      logo_archivo: row.logoArchivo,
      tiene_logo: restaurantHasLogo(),
      texto_gracias_ticket: row.textoGraciasTicket,
      texto_propina_ticket: row.textoPropinaTicket,
      texto_aviso_no_dian: row.textoAvisoNoDian,
      texto_pie_correo: row.textoPieCorreo,
      prefijo_asunto_correo: row.prefijoAsuntoCorreo,
      mostrar_credito_drewtech: row.mostrarCreditoDrewTech,
      etiqueta_descuento_sopas: row.etiquetaDescuentoSopas,
      etiqueta_descuento_muleros: row.etiquetaDescuentoMuleros,
      modulo_inventario_activo: row.moduloInventarioActivo,
      modulo_meseros_operativos_activo: row.moduloMeserosOperativosActivo,
      modulo_envio_correo_activo: row.moduloEnvioCorreoActivo,
      modulo_resumen_diario_activo: row.moduloResumenDiarioActivo,
      actualizado_en: row.actualizadoEn.toISOString(),
    };
  }

  async obtenerRow(): Promise<ConfigRestaurante> {
    const cached = getCachedConfigRestaurante();
    if (cached) return cached;

    let row = await this.prisma.configRestaurante.findUnique({ where: { id: 1 } });
    if (!row) {
      row = await this.prisma.configRestaurante.create({
        data: {
          id: 1,
          nombreComercial: envFallbackNombre() ?? 'Restaurante',
          telefono: envFallbackTelefono() ?? null,
          direccion: envFallbackDireccion() ?? null,
          dominioEmailInterno: envFallbackDominio() ?? 'restaurant.local',
        },
      });
    }
    setCachedConfigRestaurante(row);
    return row;
  }

  async obtener(): Promise<ConfigRestauranteApi> {
    return this.mapRow(await this.obtenerRow());
  }

  async actualizar(dto: UpsertConfigRestauranteDto): Promise<ConfigRestauranteApi> {
    const row = await this.prisma.configRestaurante.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        nombreComercial: dto.nombre_comercial?.trim() || 'Restaurante',
        telefono: dto.telefono?.trim() || null,
        direccion: dto.direccion?.trim() || null,
        dominioEmailInterno:
          dto.dominio_email_interno?.trim().replace(/^@/, '') ||
          'restaurant.local',
        logoArchivo: dto.logo_archivo?.trim() || null,
        textoGraciasTicket:
          dto.texto_gracias_ticket?.trim() || 'Gracias por su visita',
        textoPropinaTicket:
          dto.texto_propina_ticket?.trim() || '*** PROPINA VOLUNTARIA ***',
        textoAvisoNoDian:
          dto.texto_aviso_no_dian?.trim() ||
          'No constituye factura electrónica DIAN',
        textoPieCorreo: dto.texto_pie_correo?.trim() || null,
        prefijoAsuntoCorreo: dto.prefijo_asunto_correo?.trim() || null,
        mostrarCreditoDrewTech: dto.mostrar_credito_drewtech ?? true,
        etiquetaDescuentoSopas:
          dto.etiqueta_descuento_sopas?.trim() || 'Descuento sopas',
        etiquetaDescuentoMuleros:
          dto.etiqueta_descuento_muleros?.trim() ||
          'Descuento clientes especiales',
        moduloInventarioActivo: dto.modulo_inventario_activo ?? false,
        moduloMeserosOperativosActivo:
          dto.modulo_meseros_operativos_activo ?? true,
        moduloEnvioCorreoActivo: dto.modulo_envio_correo_activo ?? false,
        moduloResumenDiarioActivo: dto.modulo_resumen_diario_activo ?? true,
      },
      update: {
        ...(dto.nombre_comercial !== undefined
          ? { nombreComercial: dto.nombre_comercial.trim() || 'Restaurante' }
          : {}),
        ...(dto.telefono !== undefined
          ? { telefono: dto.telefono?.trim() || null }
          : {}),
        ...(dto.direccion !== undefined
          ? { direccion: dto.direccion?.trim() || null }
          : {}),
        ...(dto.dominio_email_interno !== undefined
          ? {
              dominioEmailInterno:
                dto.dominio_email_interno.trim().replace(/^@/, '') ||
                'restaurant.local',
            }
          : {}),
        ...(dto.logo_archivo !== undefined
          ? { logoArchivo: dto.logo_archivo?.trim() || null }
          : {}),
        ...(dto.texto_gracias_ticket !== undefined
          ? {
              textoGraciasTicket:
                dto.texto_gracias_ticket.trim() || 'Gracias por su visita',
            }
          : {}),
        ...(dto.texto_propina_ticket !== undefined
          ? {
              textoPropinaTicket:
                dto.texto_propina_ticket.trim() || '*** PROPINA VOLUNTARIA ***',
            }
          : {}),
        ...(dto.texto_aviso_no_dian !== undefined
          ? { textoAvisoNoDian: dto.texto_aviso_no_dian.trim() }
          : {}),
        ...(dto.texto_pie_correo !== undefined
          ? { textoPieCorreo: dto.texto_pie_correo?.trim() || null }
          : {}),
        ...(dto.prefijo_asunto_correo !== undefined
          ? {
              prefijoAsuntoCorreo: dto.prefijo_asunto_correo?.trim() || null,
            }
          : {}),
        ...(dto.mostrar_credito_drewtech !== undefined
          ? { mostrarCreditoDrewTech: dto.mostrar_credito_drewtech }
          : {}),
        ...(dto.etiqueta_descuento_sopas !== undefined
          ? { etiquetaDescuentoSopas: dto.etiqueta_descuento_sopas.trim() }
          : {}),
        ...(dto.etiqueta_descuento_muleros !== undefined
          ? { etiquetaDescuentoMuleros: dto.etiqueta_descuento_muleros.trim() }
          : {}),
        ...(dto.modulo_inventario_activo !== undefined
          ? { moduloInventarioActivo: dto.modulo_inventario_activo }
          : {}),
        ...(dto.modulo_meseros_operativos_activo !== undefined
          ? {
              moduloMeserosOperativosActivo:
                dto.modulo_meseros_operativos_activo,
            }
          : {}),
        ...(dto.modulo_envio_correo_activo !== undefined
          ? { moduloEnvioCorreoActivo: dto.modulo_envio_correo_activo }
          : {}),
        ...(dto.modulo_resumen_diario_activo !== undefined
          ? { moduloResumenDiarioActivo: dto.modulo_resumen_diario_activo }
          : {}),
      },
    });
    invalidateConfigRestauranteCache();
    setCachedConfigRestaurante(row);
    return this.mapRow(row);
  }

  async guardarLogo(
    buffer: Buffer,
    mime: string,
    originalName?: string,
  ): Promise<Pick<ConfigRestauranteApi, 'logo_archivo' | 'tiene_logo'>> {
    const { archivo } = guardarArchivoLogoRestaurante(
      buffer,
      mime,
      originalName,
    );
    const row = await this.prisma.configRestaurante.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        logoArchivo: archivo,
      },
      update: {
        logoArchivo: archivo,
      },
    });
    invalidateConfigRestauranteCache();
    setCachedConfigRestaurante(row);
    return {
      logo_archivo: archivo,
      tiene_logo: restaurantHasLogo(),
    };
  }
}
