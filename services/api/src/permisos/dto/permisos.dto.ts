import { IsBoolean, IsInt, IsOptional, ValidateIf } from 'class-validator';
import {
  PERMISOS_MESERO_KEYS,
  type PermisoMeseroKey,
  type PermisosMeseroConfig,
} from '@la-reserva/shared-domain/permisos-mesero';

export class PatchPermisosMeseroDto implements Partial<PermisosMeseroConfig> {
  @IsOptional()
  @IsBoolean()
  agregar_items?: boolean;

  @IsOptional()
  @IsBoolean()
  editar_cantidades?: boolean;

  @IsOptional()
  @IsBoolean()
  quitar_lineas?: boolean;

  @IsOptional()
  @IsBoolean()
  enviar_cocina?: boolean;

  @IsOptional()
  @IsBoolean()
  reimprimir_comanda?: boolean;

  @IsOptional()
  @IsBoolean()
  cobrar?: boolean;

  @IsOptional()
  @IsBoolean()
  precuenta?: boolean;

  @IsOptional()
  @IsBoolean()
  reimprimir_factura?: boolean;

  @IsOptional()
  @IsBoolean()
  cancelar_pedido?: boolean;

  @IsOptional()
  @IsBoolean()
  transferir_mesa?: boolean;

  @IsOptional()
  @IsBoolean()
  ayuda_companeros?: boolean;
}

export class AsignarDelegacionCierreDto {
  @IsOptional()
  fecha?: string;

  @ValidateIf((o) => o.id_usuario != null)
  @IsInt()
  id_usuario?: number | null;
}

export { PERMISOS_MESERO_KEYS, type PermisoMeseroKey };
