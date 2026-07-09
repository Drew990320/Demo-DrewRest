import { Prisma } from '@prisma/client';
export declare function lockMesaEnTx(tx: Prisma.TransactionClient, idMesa: number): Promise<void>;
export declare function lockPedidoEnTx(tx: Prisma.TransactionClient, idPedido: number): Promise<void>;
