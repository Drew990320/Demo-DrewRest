import { Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma, type ConfigVisual } from '@prisma/client';
import {
  NAV_ICON_DEFAULTS,
  NAV_ICON_KEYS,
  type NavIconKey,
  VISUAL_COLOR_DEFAULTS,
  VISUAL_COLOR_KEYS,
  type VisualColorKey,
  coloresVisualesSinConfigurar,
  esColorHexValido,
  esNavAppIconValido,
  esPaletaVisualLegacy,
  resolverColorVisual,
  resolverIconoNav,
} from '@la-reserva/shared-domain/nav-app-icon';
import {
  ACTION_ICON_DEFAULTS,
  ACTION_ICON_KEYS,
  type ActionIconKey,
  resolverIconoAccion,
} from '@la-reserva/shared-domain/action-app-icon';
import {
  esEstiloVisualValido,
  resolverEstiloVisual,
  type VisualStyleId,
} from '@la-reserva/shared-domain/visual-style';
import {
  esMesaFormaValida,
  esMesaVistaValida,
  resolverMesaForma,
  resolverMesaVista,
  type MesaFormaId,
  type MesaVistaId,
} from '@la-reserva/shared-domain/mesa-visual';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertConfigVisualDto } from './dto/upsert-config-visual.dto';
import { invalidateConfigRestauranteCache } from '../restaurante/config-restaurante-cache';
import { copiarLogoFabricaRestaurante } from '../restaurante/logo-upload.util';
import {
  assetVisualConfigurado,
  campoArchivoPorTipo,
  eliminarTodosAssetsVisuales,
  guardarAssetVisual,
  invalidarCacheAssetsTipo,
  resolverAssetVisualPath,
  type VisualAssetTipo,
} from './visual-assets.util';
import { invalidateAssetFileCache } from './asset-file-cache';
import {
  LOGO_TIPOS_IMPRESION,
  normalizarBufferLogoPng,
} from './image-png.util';

export type ConfigVisualApi = {
  colores: Record<VisualColorKey, string>;
  iconos_nav: Record<NavIconKey, string>;
  iconos_accion: Record<ActionIconKey, string>;
  estilo_visual: VisualStyleId;
  mesa_forma: MesaFormaId | null;
  mesa_vista: MesaVistaId | null;
  logo_login_archivo: string | null;
  logo_factura_archivo: string | null;
  logo_ticket_archivo: string | null;
  favicon_archivo: string | null;
  navbar_fondo_archivo: string | null;
  tiene_logo_login: boolean;
  tiene_logo_factura: boolean;
  tiene_logo_ticket: boolean;
  tiene_favicon: boolean;
  tiene_navbar_fondo: boolean;
  actualizado_en: string;
};

export type ConfigVisualPublicaApi = ConfigVisualApi & {
  urls: {
    login: string | null;
    factura: string | null;
    ticket: string | null;
    favicon: string | null;
    'navbar-fondo': string | null;
  };
};

let cachedRow: ConfigVisual | null = null;

@Injectable()
export class ConfigVisualService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    cachedRow = null;
    let row = await this.prisma.configVisual.findUnique({ where: { id: 1 } });
    if (!row) {
      row = await this.prisma.configVisual.create({ data: { id: 1 } });
    }
    row = await this.aplicarPaletaFabricaSiCorresponde(row);
    cachedRow = row;
  }

  private coloresCrudos(
    row: ConfigVisual,
  ): Partial<Record<VisualColorKey, string | null>> {
    return {
      primary: row.colorPrimary,
      primary_dark: row.colorPrimaryDark,
      secondary: row.colorSecondary,
      background: row.colorBackground,
      background_alt: row.colorBackgroundAlt,
      surface: row.colorSurface,
      text: row.colorText,
      text_muted: row.colorTextMuted,
      border: row.colorBorder,
    };
  }

  private dataPaletaFabrica(): Prisma.ConfigVisualUpdateInput {
    return {
      colorPrimary: VISUAL_COLOR_DEFAULTS.primary,
      colorPrimaryDark: VISUAL_COLOR_DEFAULTS.primary_dark,
      colorSecondary: VISUAL_COLOR_DEFAULTS.secondary,
      colorBackground: VISUAL_COLOR_DEFAULTS.background,
      colorBackgroundAlt: VISUAL_COLOR_DEFAULTS.background_alt,
      colorSurface: VISUAL_COLOR_DEFAULTS.surface,
      colorText: VISUAL_COLOR_DEFAULTS.text,
      colorTextMuted: VISUAL_COLOR_DEFAULTS.text_muted,
      colorBorder: VISUAL_COLOR_DEFAULTS.border,
    };
  }

  private async aplicarPaletaFabricaSiCorresponde(
    row: ConfigVisual,
  ): Promise<ConfigVisual> {
    const crudos = this.coloresCrudos(row);
    const resueltos = this.mapColores(row);
    const debeAplicar =
      coloresVisualesSinConfigurar(crudos) ||
      esPaletaVisualLegacy(resueltos);
    if (!debeAplicar) return row;
    return this.prisma.configVisual.update({
      where: { id: 1 },
      data: this.dataPaletaFabrica(),
    });
  }

  invalidateCache(): void {
    cachedRow = null;
  }

  async obtenerRow(): Promise<ConfigVisual> {
    if (cachedRow) return cachedRow;
    let row = await this.prisma.configVisual.findUnique({ where: { id: 1 } });
    if (!row) {
      row = await this.prisma.configVisual.create({ data: { id: 1 } });
    }
    cachedRow = row;
    return row;
  }

  private mapIconosAccion(raw: unknown): Record<ActionIconKey, string> {
    const out = { ...ACTION_ICON_DEFAULTS } as Record<ActionIconKey, string>;
    if (!raw || typeof raw !== 'object') return out;
    for (const key of ACTION_ICON_KEYS) {
      const val = (raw as Record<string, unknown>)[key];
      if (typeof val === 'string' && esNavAppIconValido(val)) {
        out[key] = val;
      }
    }
    return out;
  }

  private mapIconosNav(raw: unknown): Record<NavIconKey, string> {
    const out = { ...NAV_ICON_DEFAULTS } as Record<NavIconKey, string>;
    if (!raw || typeof raw !== 'object') return out;
    for (const key of NAV_ICON_KEYS) {
      const val = (raw as Record<string, unknown>)[key];
      if (typeof val === 'string' && esNavAppIconValido(val)) {
        out[key] = val;
      }
    }
    return out;
  }

  private mapColores(row: ConfigVisual): Record<VisualColorKey, string> {
    const stored: Partial<Record<VisualColorKey, string | null>> = {
      primary: row.colorPrimary,
      primary_dark: row.colorPrimaryDark,
      secondary: row.colorSecondary,
      background: row.colorBackground,
      background_alt: row.colorBackgroundAlt,
      surface: row.colorSurface,
      text: row.colorText,
      text_muted: row.colorTextMuted,
      border: row.colorBorder,
    };
    const out = {} as Record<VisualColorKey, string>;
    for (const key of VISUAL_COLOR_KEYS) {
      out[key] = resolverColorVisual(key, stored[key]);
    }
    return out;
  }

  private mapRow(row: ConfigVisual): ConfigVisualApi {
    return {
      colores: this.mapColores(row),
      iconos_nav: this.mapIconosNav(row.iconosNav),
      iconos_accion: this.mapIconosAccion(row.iconosAccion),
      estilo_visual: resolverEstiloVisual(row.estiloVisual),
      mesa_forma: esMesaFormaValida(row.mesaForma) ? row.mesaForma : null,
      mesa_vista: esMesaVistaValida(row.mesaVista) ? row.mesaVista : null,
      logo_login_archivo: row.logoLoginArchivo,
      logo_factura_archivo: row.logoFacturaArchivo,
      logo_ticket_archivo: row.logoTicketArchivo,
      favicon_archivo: row.faviconArchivo,
      navbar_fondo_archivo: row.navbarFondoArchivo,
      tiene_logo_login: Boolean(assetVisualConfigurado(row.logoLoginArchivo)),
      tiene_logo_factura: Boolean(assetVisualConfigurado(row.logoFacturaArchivo)),
      tiene_logo_ticket: Boolean(assetVisualConfigurado(row.logoTicketArchivo)),
      tiene_favicon: Boolean(assetVisualConfigurado(row.faviconArchivo)),
      tiene_navbar_fondo: Boolean(
        assetVisualConfigurado(row.navbarFondoArchivo),
      ),
      actualizado_en: row.actualizadoEn.toISOString(),
    };
  }

  async obtener(): Promise<ConfigVisualApi> {
    return this.mapRow(await this.obtenerRow());
  }

  async obtenerPublica(): Promise<ConfigVisualPublicaApi> {
    const base = await this.obtener();
    return {
      ...base,
      urls: {
        login: base.tiene_logo_login ? '/visual/asset/login' : null,
        factura: base.tiene_logo_factura ? '/visual/asset/factura' : null,
        ticket: base.tiene_logo_ticket ? '/visual/asset/ticket' : null,
        favicon: base.tiene_favicon ? '/visual/asset/favicon' : null,
        'navbar-fondo': base.tiene_navbar_fondo
          ? '/visual/asset/navbar-fondo'
          : null,
      },
    };
  }

  async restablecer(): Promise<ConfigVisualApi> {
    eliminarTodosAssetsVisuales();
    invalidateAssetFileCache();
    const logoFabrica = copiarLogoFabricaRestaurante();
    await this.prisma.configRestaurante.updateMany({
      data: { logoArchivo: logoFabrica },
    });
    invalidateConfigRestauranteCache();
    await this.prisma.categoria.updateMany({
      data: { iconoMenu: null },
    });
    await this.obtenerRow();
    const row = await this.prisma.configVisual.update({
      where: { id: 1 },
      data: {
        ...this.dataPaletaFabrica(),
        logoLoginArchivo: null,
        logoFacturaArchivo: null,
        logoTicketArchivo: null,
        faviconArchivo: null,
        navbarFondoArchivo: null,
        iconosNav: Prisma.DbNull,
        iconosAccion: Prisma.DbNull,
        estiloVisual: 'minimalista',
        mesaForma: null,
        mesaVista: null,
        actualizadoEn: new Date(),
      },
    });
    cachedRow = row;
    return this.mapRow(row);
  }

  async actualizar(dto: UpsertConfigVisualDto): Promise<ConfigVisualApi> {
    const data: Prisma.ConfigVisualUpdateInput = {};

    if (dto.color_primary !== undefined) {
      data.colorPrimary = esColorHexValido(dto.color_primary)
        ? dto.color_primary!.trim()
        : null;
    }
    if (dto.color_primary_dark !== undefined) {
      data.colorPrimaryDark = esColorHexValido(dto.color_primary_dark)
        ? dto.color_primary_dark!.trim()
        : null;
    }
    if (dto.color_secondary !== undefined) {
      data.colorSecondary = esColorHexValido(dto.color_secondary)
        ? dto.color_secondary!.trim()
        : null;
    }
    if (dto.color_background !== undefined) {
      data.colorBackground = esColorHexValido(dto.color_background)
        ? dto.color_background!.trim()
        : null;
    }
    if (dto.color_background_alt !== undefined) {
      data.colorBackgroundAlt = esColorHexValido(dto.color_background_alt)
        ? dto.color_background_alt!.trim()
        : null;
    }
    if (dto.color_surface !== undefined) {
      data.colorSurface = esColorHexValido(dto.color_surface)
        ? dto.color_surface!.trim()
        : null;
    }
    if (dto.color_text !== undefined) {
      data.colorText = esColorHexValido(dto.color_text)
        ? dto.color_text!.trim()
        : null;
    }
    if (dto.color_text_muted !== undefined) {
      data.colorTextMuted = esColorHexValido(dto.color_text_muted)
        ? dto.color_text_muted!.trim()
        : null;
    }
    if (dto.color_border !== undefined) {
      data.colorBorder = esColorHexValido(dto.color_border)
        ? dto.color_border!.trim()
        : null;
    }
    if (dto.iconos_nav !== undefined) {
      const merged = this.mapIconosNav(dto.iconos_nav);
      data.iconosNav = merged;
    }
    if (dto.iconos_accion !== undefined) {
      data.iconosAccion = this.mapIconosAccion(dto.iconos_accion);
    }
    if (dto.estilo_visual !== undefined) {
      data.estiloVisual = esEstiloVisualValido(dto.estilo_visual)
        ? dto.estilo_visual
        : 'minimalista';
    }
    if (dto.mesa_forma !== undefined) {
      data.mesaForma =
        dto.mesa_forma == null || dto.mesa_forma === ''
          ? null
          : esMesaFormaValida(dto.mesa_forma)
            ? dto.mesa_forma
            : resolverMesaForma(null);
    }
    if (dto.mesa_vista !== undefined) {
      data.mesaVista =
        dto.mesa_vista == null || dto.mesa_vista === ''
          ? null
          : esMesaVistaValida(dto.mesa_vista)
            ? dto.mesa_vista
            : resolverMesaVista(null);
    }

    await this.obtenerRow();
    const row = await this.prisma.configVisual.update({
      where: { id: 1 },
      data,
    });
    cachedRow = row;
    return this.mapRow(row);
  }

  async guardarAsset(
    tipo: VisualAssetTipo,
    buffer: Buffer,
    mime: string,
    originalName?: string,
  ): Promise<{ archivo: string; tipo: VisualAssetTipo }> {
    let uploadBuffer = buffer;
    let uploadMime = mime;
    if (LOGO_TIPOS_IMPRESION.has(tipo)) {
      uploadBuffer = await normalizarBufferLogoPng(buffer, mime);
      uploadMime = 'image/png';
    }
    const { archivo } = guardarAssetVisual(
      tipo,
      uploadBuffer,
      uploadMime,
      originalName,
    );
    const field = campoArchivoPorTipo(tipo);
    const row = await this.prisma.configVisual.upsert({
      where: { id: 1 },
      create: { id: 1, [field]: archivo },
      update: {
        [field]: archivo,
        // Mismo nombre de archivo (p. ej. logo-factura.png): forzar bust de caché en clientes.
        actualizadoEn: new Date(),
      },
    });
    cachedRow = row;
    invalidarCacheAssetsTipo(tipo);
    return { archivo, tipo };
  }

  resolveAssetPath(tipo: VisualAssetTipo): string | null {
    const row = cachedRow;
    if (!row) return null;
    switch (tipo) {
      case 'login':
        return assetVisualConfigurado(row.logoLoginArchivo);
      case 'factura':
        return assetVisualConfigurado(row.logoFacturaArchivo);
      case 'ticket':
        return assetVisualConfigurado(row.logoTicketArchivo);
      case 'favicon':
        return assetVisualConfigurado(row.faviconArchivo);
      case 'navbar-fondo':
        return assetVisualConfigurado(row.navbarFondoArchivo);
    }
  }

  iconoNav(key: NavIconKey, row?: ConfigVisual): string {
    const iconos = this.mapIconosNav(row?.iconosNav ?? cachedRow?.iconosNav);
    return resolverIconoNav(key, iconos[key]);
  }
}
