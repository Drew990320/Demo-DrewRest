import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePersonalizacionDto {
  @IsIn(['omitir_ingrediente', 'aderezo'])
  tipo!: 'omitir_ingrediente' | 'aderezo';

  @IsString()
  @MinLength(1)
  @MaxLength(150)
  descripcion!: string;
}

export class UpdatePersonalizacionDto {
  @IsOptional()
  @IsIn(['omitir_ingrediente', 'aderezo'])
  tipo?: 'omitir_ingrediente' | 'aderezo';

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  descripcion?: string;
}
