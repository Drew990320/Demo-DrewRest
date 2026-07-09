import { OnModuleInit } from '@nestjs/common';
import { type ConfigVisual } from '@prisma/client';
import { type NavIconKey, type VisualColorKey } from '@la-reserva/shared-domain/nav-app-icon';
import { type ActionIconKey } from '@la-reserva/shared-domain/action-app-icon';
import { type VisualStyleId } from '@la-reserva/shared-domain/visual-style';
import { type MesaFormaId, type MesaVistaId } from '@la-reserva/shared-domain/mesa-visual';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertConfigVisualDto } from './dto/upsert-config-visual.dto';
import { type VisualAssetTipo } from './visual-assets.util';
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
export declare class ConfigVisualService implements OnModuleInit {
    private readonly prisma;
    constructor(prisma: PrismaService);
    onModuleInit(): Promise<void>;
    private coloresCrudos;
    private dataPaletaFabrica;
    private aplicarPaletaFabricaSiCorresponde;
    invalidateCache(): void;
    obtenerRow(): Promise<ConfigVisual>;
    private mapIconosAccion;
    private mapIconosNav;
    private mapColores;
    private mapRow;
    obtener(): Promise<ConfigVisualApi>;
    obtenerPublica(): Promise<ConfigVisualPublicaApi>;
    restablecer(): Promise<ConfigVisualApi>;
    actualizar(dto: UpsertConfigVisualDto): Promise<ConfigVisualApi>;
    guardarAsset(tipo: VisualAssetTipo, buffer: Buffer, mime: string, originalName?: string): Promise<{
        archivo: string;
        tipo: VisualAssetTipo;
    }>;
    resolveAssetPath(tipo: VisualAssetTipo): string | null;
    iconoNav(key: NavIconKey, row?: ConfigVisual): string;
}
