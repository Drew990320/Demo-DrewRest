import { EstadoPedido } from '@prisma/client';
export declare const TRANSICIONES_ESTADO_PERMITIDAS: Record<EstadoPedido, EstadoPedido[]>;
export declare function validarTransicionEstadoPedido(actual: EstadoPedido, nuevo: EstadoPedido): void;
