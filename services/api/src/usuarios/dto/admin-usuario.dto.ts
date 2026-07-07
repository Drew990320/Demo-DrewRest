import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { PermisosAdminConfig } from '@la-reserva/shared-domain/permisos-admin';

export class HorarioAccesoDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dia_semana!: number;

  @IsString()
  @MinLength(5)
  hora_inicio!: string;

  @IsString()
  @MinLength(5)
  hora_fin!: string;
}

export class PermisosAdminDto implements Partial<PermisosAdminConfig> {
  @IsOptional()
  @IsBoolean()
  usuarios?: boolean;

  @IsOptional()
  @IsBoolean()
  permisos?: boolean;

  @IsOptional()
  @IsBoolean()
  menu?: boolean;

  @IsOptional()
  @IsBoolean()
  mesas?: boolean;

  @IsOptional()
  @IsBoolean()
  configuracion?: boolean;

  @IsOptional()
  @IsBoolean()
  resumen_diario?: boolean;

  @IsOptional()
  @IsBoolean()
  creditos?: boolean;

  @IsOptional()
  @IsBoolean()
  personalizacion?: boolean;

  @IsOptional()
  @IsBoolean()
  meseros_operativos?: boolean;

  @IsOptional()
  @IsBoolean()
  conexion_movil?: boolean;
}

export class CreateAdminDto {
  @IsString()
  @MinLength(1)
  nombre!: string;

  @IsString()
  apellido!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HorarioAccesoDto)
  horarios?: HorarioAccesoDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => PermisosAdminDto)
  permisos?: PermisosAdminDto;
}

export class PatchAdminDto {
  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  nombre?: string;

  @IsOptional()
  @IsString()
  apellido?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HorarioAccesoDto)
  horarios?: HorarioAccesoDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => PermisosAdminDto)
  permisos?: PermisosAdminDto;
}
