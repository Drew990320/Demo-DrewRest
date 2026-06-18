import { IsBoolean } from 'class-validator';

export class PatchClienteMuleroDto {
  @IsBoolean()
  cliente_mulero!: boolean;
}
