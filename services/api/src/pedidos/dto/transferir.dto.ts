import { IsInt, IsOptional } from 'class-validator';

export class TransferirPedidoDto {
  /** Compatibilidad: ID interno (no usar en UI). */
  @IsOptional()
  @IsInt()
  id_mesa_nueva?: number;

  /** Recomendado: número visible de mesa (no 98 ni 99). */
  @IsOptional()
  @IsInt()
  mesa_numero_nuevo?: number;
}

