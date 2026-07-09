import { OnGatewayConnection } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
export type ConfigScope = 'menu' | 'mesas' | 'categorias' | 'visual';
export declare class PedidosGateway implements OnGatewayConnection {
    private readonly jwt;
    private readonly prisma;
    server: Server;
    constructor(jwt: JwtService, prisma: PrismaService);
    private extractToken;
    private authenticate;
    private joinRoleRooms;
    handleConnection(client: Socket): Promise<void>;
    handleJoin(client: Socket, data: {
        mesaId?: number;
        cocina?: boolean;
        resumen?: boolean;
    }): {
        ok: boolean;
        error: string;
    } | {
        ok: boolean;
        error?: undefined;
    };
    emitPedidoActualizado(pedidoId: number, mesaId: number, idUsuario: number): void;
    emitConfigActualizada(scope: ConfigScope): void;
    emitAuthSesionInvalidada(idUsuario: number, motivo: 'desactivado' | 'credenciales', mensaje?: string): void;
    emitCocinaLlamaMesero(payload: {
        pedidoId: number;
        mesaId: number;
        mesaNumero: number;
        idMesero: number;
        meseroNombre: string;
        platosListos: number;
        entradasListos?: number;
        tipo_listo?: 'entrada' | 'plato' | 'mixto';
        at: string;
    }): void;
    emitCocinaFaltaPlato(payload: {
        pedidoId: number;
        mesaId: number;
        mesaNumero: number;
        idDetalle: number;
        productoNombre: string;
        cantidad: number;
        meseroNombre: string;
        at: string;
    }): void;
    emitCompaneroAgregoItems(payload: {
        pedidoId: number;
        mesaId: number;
        mesaNumero: number;
        idMeseroDueno: number;
        idMeseroQuienAgrego: number;
        meseroQuienAgregoNombre: string;
        lineas: {
            nombre_producto: string;
            cantidad: number;
        }[];
        accion?: 'agregado' | 'quitado' | 'reducido';
        at: string;
    }): void;
    emitImpresoraAlerta(payload: {
        codigo: 'sin_papel' | 'papel_bajo';
        mensaje: string;
        destino?: string;
        contexto?: 'comanda' | 'factura' | 'prueba' | 'cierre';
        pedidoId?: number;
        at: string;
    }): void;
}
