import type { Usuario } from '@prisma/client';
import type { Request } from 'express';
import { AsignarDelegacionCierreDto, PatchPermisosChefDto, PatchPermisosMeseroDto } from './dto/permisos.dto';
import { PermisosService } from './permisos.service';
export declare class PermisosController {
    private readonly permisos;
    constructor(permisos: PermisosService);
    efectivos(req: Request & {
        user: Usuario & {
            rol: {
                nombre: string;
            };
        };
    }): Promise<import("@la-reserva/shared-domain/permisos-mesero").PermisosMeseroEfectivos>;
    resumen(fecha?: string): Promise<{
        fecha: string;
        permisos_mesero: import("@la-reserva/shared-domain/permisos-mesero").PermisosMeseroConfig;
        permisos_chef: import("@la-reserva/shared-domain/permisos-chef").PermisosChefConfig;
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
    actualizarMesero(dto: PatchPermisosMeseroDto): Promise<import("@la-reserva/shared-domain/permisos-mesero").PermisosMeseroConfig>;
    actualizarChef(dto: PatchPermisosChefDto): Promise<import("@la-reserva/shared-domain/permisos-chef").PermisosChefConfig>;
    delegacionCierre(dto: AsignarDelegacionCierreDto, req: Request & {
        user: Usuario;
    }): Promise<{
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
}
