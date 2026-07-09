import { PERMISOS_MESERO_KEYS, type PermisoMeseroKey, type PermisosMeseroConfig } from '@la-reserva/shared-domain/permisos-mesero';
export declare class PatchPermisosMeseroDto implements Partial<PermisosMeseroConfig> {
    agregar_items?: boolean;
    editar_cantidades?: boolean;
    quitar_lineas?: boolean;
    enviar_cocina?: boolean;
    reimprimir_comanda?: boolean;
    cobrar?: boolean;
    precuenta?: boolean;
    reimprimir_factura?: boolean;
    cancelar_pedido?: boolean;
    transferir_mesa?: boolean;
    ayuda_companeros?: boolean;
}
export declare class PatchPermisosChefDto {
    ver_cola_cocina?: boolean;
    marcar_listo?: boolean;
    reimprimir_comanda?: boolean;
    anular_linea_cocina?: boolean;
}
export declare class AsignarDelegacionCierreDto {
    fecha?: string;
    id_usuario?: number | null;
}
export { PERMISOS_MESERO_KEYS, type PermisoMeseroKey };
