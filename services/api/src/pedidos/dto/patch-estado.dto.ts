import { IsEnum } from 'class-validator';
import { EstadoPedido } from '@prisma/client';

export class PatchEstadoDto {
  @IsEnum(EstadoPedido)
  estado!: EstadoPedido;
}
