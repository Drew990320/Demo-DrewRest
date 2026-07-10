import type { PermisosChefConfig } from './permisos-chef';
/** Claves de permisos configurables para el rol mesero. */
export declare const PERMISOS_MESERO_KEYS: readonly ["agregar_items", "editar_cantidades", "quitar_lineas", "enviar_cocina", "reimprimir_comanda", "cobrar", "precuenta", "reimprimir_factura", "cancelar_pedido", "transferir_mesa", "agrupar_mesas", "ayuda_companeros"];
export type PermisoMeseroKey = (typeof PERMISOS_MESERO_KEYS)[number];
export type PermisosMeseroConfig = Record<PermisoMeseroKey, boolean>;
export declare const PERMISOS_MESERO_DEFAULTS: PermisosMeseroConfig;
export type PermisoMeseroMeta = {
    titulo: string;
    detalle: string;
};
export declare const PERMISOS_MESERO_META: Record<PermisoMeseroKey, PermisoMeseroMeta>;
export type PermisosMeseroEfectivos = PermisosMeseroConfig & {
    puede_cerrar_anulando: boolean;
    es_admin: boolean;
    permisos_chef?: PermisosChefConfig;
};
export declare function permisosMeseroTodos(): PermisosMeseroEfectivos;
