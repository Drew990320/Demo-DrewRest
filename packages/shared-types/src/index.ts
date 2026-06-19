/**
 * Tipos alineados con respuestas JSON del API La Reserva.
 * Mantener sincronizado con `services/api` y la app móvil.
 */

export type RolNombre = 'mesero' | 'chef' | 'admin';

export interface AuthUserDto {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: RolNombre;
}

export interface LoginResponseDto {
  access_token: string;
  user: AuthUserDto;
}

export type EstadoMesa = 'libre' | 'ocupada' | 'reservada';

/** Respuesta pública `GET /mesas` (grilla del día). */
export interface MesaDto {
  id_mesa: number;
  numero: number;
  capacidad: number;
  estado: EstadoMesa;
}

/** Respuesta admin `GET /mesas/admin` — visibilidad por día (API en zona Bogotá). */
export interface MesaAdminDto extends MesaDto {
  pedidos_activos?: number;
  total_pedidos?: number;
  disponible_lunes: boolean;
  disponible_martes: boolean;
  disponible_miercoles: boolean;
  disponible_jueves: boolean;
  disponible_viernes: boolean;
  disponible_sabado: boolean;
  disponible_domingo: boolean;
}

/** Respuesta admin `GET /categorias/admin` — visibilidad del menú por día. */
export interface CategoriaAdminDto {
  id_categoria: number;
  nombre: string;
  disponible_lunes: boolean;
  disponible_martes: boolean;
  disponible_miercoles: boolean;
  disponible_jueves: boolean;
  disponible_viernes: boolean;
  disponible_sabado: boolean;
  disponible_domingo: boolean;
}

/** Reglas globales de descuento en facturación (`GET/PUT /pedidos/config-descuentos`). */
export interface ConfigDescuentosDto {
  sopas_activo: boolean;
  sopas_monto_por_unidad: number;
  muleros_activo: boolean;
  muleros_monto_por_plato_principal: number;
  umbral_subtotal_otros: number;
}

export interface DescuentosEstimadosDto {
  descuento_sopas: number;
  descuento_muleros: number;
}
