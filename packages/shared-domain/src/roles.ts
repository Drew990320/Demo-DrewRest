export const ROL_SUPERADMIN = 'superadmin' as const;
export const ROL_ADMIN = 'admin' as const;
export const SUPERADMIN_EMAIL = 'drewtechpos@gmail.com';

export function esSuperadmin(rol: string | undefined | null): boolean {
  return rol === ROL_SUPERADMIN;
}

export function esAdminRestaurante(rol: string | undefined | null): boolean {
  return rol === ROL_ADMIN;
}

/** Admin de restaurante o superadmin DrewTech. */
export function esRolAdministrativo(rol: string | undefined | null): boolean {
  return esAdminRestaurante(rol) || esSuperadmin(rol);
}
