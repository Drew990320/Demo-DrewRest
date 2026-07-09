export declare const PERMISOS_CHEF_KEYS: readonly ["ver_cola_cocina", "marcar_listo", "reimprimir_comanda", "anular_linea_cocina"];
export type PermisoChefKey = (typeof PERMISOS_CHEF_KEYS)[number];
export type PermisosChefConfig = Record<PermisoChefKey, boolean>;
export declare const PERMISOS_CHEF_DEFAULTS: PermisosChefConfig;
export declare const PERMISOS_CHEF_META: Record<PermisoChefKey, {
    titulo: string;
    detalle: string;
}>;
