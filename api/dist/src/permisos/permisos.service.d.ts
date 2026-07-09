import type { PermisosMeseroConfig as PermisosMeseroRow, PermisosChefConfig as PermisosChefRow } from '@prisma/client';
import { type PermisosChefConfig } from '@la-reserva/shared-domain/permisos-chef';
import { type PermisoMeseroKey, type PermisosMeseroConfig, type PermisosMeseroEfectivos } from '@la-reserva/shared-domain/permisos-mesero';
import { PrismaService } from '../prisma/prisma.service';
import { AsignarDelegacionCierreDto, PatchPermisosChefDto, PatchPermisosMeseroDto } from './dto/permisos.dto';
export declare class PermisosService {
    private readonly prisma;
    private cache;
    private chefCache;
    private static readonly CACHE_TTL_MS;
    constructor(prisma: PrismaService);
    invalidateCache(): void;
    private mapRow;
    obtenerConfigRow(): Promise<PermisosMeseroRow>;
    obtenerConfigChefRow(): Promise<PermisosChefRow>;
    private mapChefRow;
    obtenerConfigChef(): Promise<PermisosChefConfig>;
    actualizarConfigChef(dto: PatchPermisosChefDto): Promise<PermisosChefConfig>;
    obtenerConfig(): Promise<PermisosMeseroConfig>;
    actualizarConfig(dto: PatchPermisosMeseroDto): Promise<PermisosMeseroConfig>;
    private puedeCerrarAnulando;
    getEfectivos(idUsuario: number, rol: string): Promise<PermisosMeseroEfectivos>;
    assertPermiso(actor: {
        idUsuario: number;
        rol: {
            nombre: string;
        };
    }, permiso: PermisoMeseroKey, opts?: {
        permitirChef?: boolean;
    }): Promise<void>;
    resumenAdmin(fecha?: string): Promise<{
        fecha: string;
        permisos_mesero: PermisosMeseroConfig;
        permisos_chef: PermisosChefConfig;
        delegacion_cierre_anulacion: {
            id_usuario: number;
            nombre: string;
            apellido: string;
            asignado_en: Date;
        } | null;
        meseros: {
            id_usuario: number;
            nombre: string;
            apellido: string;
        }[];
    }>;
    asignarDelegacionCierre(dto: AsignarDelegacionCierreDto, idAdmin: number): Promise<{
        fecha: string;
        delegacion_cierre_anulacion: null;
    } | {
        fecha: string;
        delegacion_cierre_anulacion: {
            id_usuario: number;
            nombre: string;
            apellido: string;
            asignado_en: Date;
        };
    }>;
    miDelegacionHoy(idUsuario: number, rol: string): Promise<{
        puede_cerrar_anulando: boolean;
        es_admin: boolean;
    }>;
    private ensureMeseroActivo;
}
