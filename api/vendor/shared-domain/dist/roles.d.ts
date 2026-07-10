export declare const ROL_MESERO = "mesero";
export declare const ROL_CHEF = "chef";
export declare const ROL_ADMIN = "admin";
export declare const ROL_SUPERADMIN = "superadmin";
export declare function esRolSuperadmin(rol: string | undefined | null): boolean;
export declare function esRolAdmin(rol: string | undefined | null): boolean;
/** Cuentas ocultas en listados de usuarios del restaurante. */
export declare function esRolOcultoEnUsuarios(rol: string | undefined | null): boolean;
