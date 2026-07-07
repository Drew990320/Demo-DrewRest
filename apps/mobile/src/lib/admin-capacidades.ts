import type { PermisosAdminConfig, PermisoAdminKey } from '@la-reserva/shared-domain/permisos-admin';
import { PERMISOS_ADMIN_KEYS } from '@la-reserva/shared-domain/permisos-admin';
import {
  esRolAdministrativo,
  esSuperadmin,
} from '@la-reserva/shared-domain/roles';

export { esRolAdministrativo, esSuperadmin, esAdminRestaurante, esCuentaSuperadmin } from '@la-reserva/shared-domain/roles';

export function puedeCapacidadAdmin(
  user:
    | {
        rol?: string;
        permisos_admin?: PermisosAdminConfig | Record<string, boolean> | null;
      }
    | null
    | undefined,
  clave: PermisoAdminKey,
): boolean {
  if (!user) return false;
  if (esSuperadmin(user.rol)) return true;
  if (!esRolAdministrativo(user.rol)) return false;
  return user.permisos_admin?.[clave] !== false;
}

export function tieneAlgunaCapacidadAdmin(
  user:
    | {
        rol?: string;
        permisos_admin?: PermisosAdminConfig | Record<string, boolean> | null;
      }
    | null
    | undefined,
): boolean {
  if (!user) return false;
  if (esSuperadmin(user.rol)) return true;
  if (!esRolAdministrativo(user.rol)) return false;
  return PERMISOS_ADMIN_KEYS.some((k) => user.permisos_admin?.[k] !== false);
}
