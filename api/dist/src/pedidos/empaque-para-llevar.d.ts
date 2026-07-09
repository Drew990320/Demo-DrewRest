import { Prisma } from '@prisma/client';
import { PRECIO_EMPAQUE_PARA_LLEVAR_COP, productoCobraEmpaqueParaLlevarPorPlatoFuerte } from '@la-reserva/shared-domain/empaque-para-llevar';
export { PRECIO_EMPAQUE_PARA_LLEVAR_COP, productoCobraEmpaqueParaLlevarPorPlatoFuerte, };
export declare const precioEmpaqueParaLlevarDecimal: (monto?: number) => Prisma.Decimal;
