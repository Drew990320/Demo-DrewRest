import type { Usuario } from '@prisma/client';
import type { Request } from 'express';
import { AplicarSodaAlmuerzoDto, AplicarSodaMeseroDto, AsignarDelegacionCierreDto, UpsertPagoTurnoMeseroDto } from './dto/meseros-operativos.dto';
import { MeserosOperativosService } from './meseros-operativos.service';
export declare class MeserosOperativosController {
    private readonly service;
    constructor(service: MeserosOperativosService);
    miDelegacion(req: Request & {
        user: Usuario & {
            rol: {
                nombre: string;
            };
        };
    }): Promise<{
        puede_cerrar_anulando: boolean;
        es_admin: boolean;
    }>;
    resumen(fecha?: string): Promise<{
        fecha: string;
        delegacion_cierre_anulacion: {
            id_usuario: number;
            nombre: string;
            apellido: string;
            asignado_en: Date;
        } | null;
        config: {
            beneficio_soda_almuerzo_activo: boolean;
            id_producto_soda_almuerzo: number | null;
            producto_soda_nombre: string | null;
            soda_almuerzo_descontar_stock: boolean;
            producto_control_stock: boolean;
            producto_stock_disponible: number | null;
        };
        meseros: {
            id_usuario: number;
            nombre: string;
            apellido: string;
            soda_almuerzo: {
                id_registro: number;
                cantidad: number;
                desconto_stock: boolean;
                producto_nombre: string | null;
            } | null;
            pago_turno: {
                id_registro: number;
                monto: number;
                notas: string | null;
            } | null;
        }[];
        totales: {
            sodas_aplicadas: number;
            pagos_registrados: number;
            monto_pagos_total: number;
        };
    }>;
    upsertPagoTurno(dto: UpsertPagoTurnoMeseroDto, req: Request & {
        user: Usuario;
    }): Promise<{
        id_registro: number;
        monto: number;
        notas: string | null;
    }>;
    aplicarSodaTodos(dto: AplicarSodaAlmuerzoDto, req: Request & {
        user: Usuario;
    }): Promise<{
        fecha: string;
        aplicados: number;
        omitidos: number;
        total_meseros: number;
    }>;
    aplicarSodaMesero(dto: AplicarSodaMeseroDto, req: Request & {
        user: Usuario;
    }): Promise<{
        fecha: string;
        id_usuario: number;
        desconto_stock: boolean;
    }>;
    eliminarRegistro(id: number): Promise<{
        ok: boolean;
    }>;
    asignarDelegacionCierre(dto: AsignarDelegacionCierreDto, req: Request & {
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
