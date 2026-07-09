import type { EstadoPedido, Prisma } from '@prisma/client';
import { pedidoUsaLineaMazorca, esDetalleMazorcaAcompanamiento } from '@la-reserva/shared-domain/mazorca-pedido';
export { pedidoUsaLineaMazorca, esDetalleMazorcaAcompanamiento };
export declare function invalidateMazorcaProductIdCache(): void;
export declare function idProductoMazorcaAcompanamiento(prisma: Pick<Prisma.TransactionClient, 'producto'>, idConfigurado?: number | null): Promise<number>;
export declare function sincronizarLineaMazorcaAcompanamiento(tx: Prisma.TransactionClient, params: {
    idPedido: number;
    numComensales: number;
    mesaNumero: number;
    estadoPedido: EstadoPedido;
    usaLineaMazorca?: boolean;
    mazorcaActiva?: boolean;
    idProductoMazorca?: number | null;
}): Promise<void>;
export declare function crearLineaMazorcaInicial(tx: Prisma.TransactionClient, params: {
    idPedido: number;
    numComensales: number;
    mesaNumero: number;
    mazorcaActiva?: boolean;
    idProductoMazorca?: number | null;
}): Promise<void>;
