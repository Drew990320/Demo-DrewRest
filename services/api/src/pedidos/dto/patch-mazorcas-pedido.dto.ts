import { IsInt, Min } from 'class-validator';

export class PatchMazorcasPedidoDto {
  @IsInt()
  @Min(1)
  num_comensales!: number;
}
