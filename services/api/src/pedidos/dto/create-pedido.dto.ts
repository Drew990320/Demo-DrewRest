import { IsInt, Min } from 'class-validator';

export class CreatePedidoDto {
  @IsInt()
  id_mesa!: number;

  @IsInt()
  @Min(1)
  num_comensales!: number;
}
