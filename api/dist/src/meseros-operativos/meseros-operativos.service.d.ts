import { PrismaService } from '../prisma/prisma.service';
import { PermisosService } from '../permisos/permisos.service';
import { PedidosGateway } from '../pedidos/pedidos.gateway';
import { AplicarSodaAlmuerzoDto, AplicarSodaMeseroDto, AsignarDelegacionCierreDto, UpsertPagoTurnoMeseroDto } from './dto/meseros-operativos.dto';
export declare class MeserosOperativosService {
    private readonly prisma;
    private readonly gateway;
    private readonly permisos;
    constructor(prisma: PrismaService, gateway: PedidosGateway, permisos: PermisosService);
    private parseFechaBogota;
    private ctxSodaAlmuerzo;
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
    upsertPagoTurno(dto: UpsertPagoTurnoMeseroDto, idAdmin: number): Promise<{
        id_registro: number;
        monto: number;
        notas: string | null;
    }>;
    aplicarSodaAlmuerzoTodos(dto: AplicarSodaAlmuerzoDto, idAdmin: number): Promise<{
        fecha: string;
        aplicados: number;
        omitidos: number;
        total_meseros: number;
    }>;
    aplicarSodaAlmuerzoMesero(dto: AplicarSodaMeseroDto, idAdmin: number): Promise<{
        fecha: string;
        id_usuario: number;
        desconto_stock: boolean;
    }>;
    eliminarRegistro(idRegistro: number): Promise<{
        ok: boolean;
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
