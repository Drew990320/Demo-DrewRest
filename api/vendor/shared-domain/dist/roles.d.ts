export declare const ROL_MESERO = "mesero";
export declare const ROL_CHEF = "chef";
export declare const ROL_ADMIN = "admin";
export declare const ROL_SUPERADMIN = "superadmin";
export declare const ROL_AUTOSERVICIO = "autoservicio";
export declare function esRolSuperadmin(rol: string | undefined | null): boolean;
export declare function esRolAdmin(rol: string | undefined | null): boolean;
export declare function esRolAutoservicio(rol: string | undefined | null): boolean;
/**
 * ¿El rol del usuario satisface alguno de los roles requeridos?
 * Superadmin cubre `admin` (soporte opera pantallas de administración).
 */
export declare function rolCumpleRequeridos(rolUsuario: string | undefined | null, rolesRequeridos: readonly string[]): boolean;
/** Cuentas ocultas en listados de usuarios del restaurante. */
export declare function esRolOcultoEnUsuarios(rol: string | undefined | null): boolean;
