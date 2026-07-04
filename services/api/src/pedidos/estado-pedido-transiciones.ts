import { BadRequestException, ConflictException } from '@nestjs/common';
import { EstadoPedido } from '@prisma/client';

/** Transiciones permitidas vía PATCH /pedidos/:id/estado (solo admin). */
export const TRANSICIONES_ESTADO_PERMITIDAS: Record<
  EstadoPedido,
  EstadoPedido[]
> = {
  abierto: ['en_cocina'],
  en_cocina: ['abierto'],
  facturado: [],
};

export function validarTransicionEstadoPedido(
  actual: EstadoPedido,
  nuevo: EstadoPedido,
): void {
  if (actual === nuevo) return;
  if (actual === 'facturado') {
    throw new ConflictException('Pedido ya cerrado');
  }
  if (nuevo === 'facturado') {
    throw new BadRequestException(
      'Para cerrar el pedido use facturar, no cambiar estado',
    );
  }
  const permitidas = TRANSICIONES_ESTADO_PERMITIDAS[actual] ?? [];
  if (!permitidas.includes(nuevo)) {
    throw new BadRequestException(
      `No se puede cambiar el pedido de "${actual}" a "${nuevo}"`,
    );
  }
}
