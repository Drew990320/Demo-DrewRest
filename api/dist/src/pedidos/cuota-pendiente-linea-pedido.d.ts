import type { Prisma } from '@prisma/client';
import { NOMBRE_PRODUCTO_CUOTA_PENDIENTE, formatCuotaPendienteNota } from '@la-reserva/shared-domain/cuota-pendiente-reparto';
export declare function invalidateCuotaPendienteProductIdCache(): void;
export declare function idProductoCuotaPendienteReparto(prisma: Pick<Prisma.TransactionClient, 'producto' | 'categoria' | 'configOperativa'>, idConfigurado?: number | null): Promise<number>;
export { formatCuotaPendienteNota, NOMBRE_PRODUCTO_CUOTA_PENDIENTE };
