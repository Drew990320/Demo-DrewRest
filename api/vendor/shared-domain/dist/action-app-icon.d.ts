import { type NavAppIconId } from './nav-app-icon';
/** Iconos de acciones, formularios, pedido, resumen y métodos de pago (Ionicons). */
export declare const ACTION_ICON_KEYS: readonly ["pedido_agregar_menu", "pedido_agregar_bebidas", "pedido_abrir_mesa", "pedido_abrir_pedido", "pedido_pasar_cocina", "pedido_reimprimir_comanda", "pedido_cobrar", "pedido_ver_pedido", "pedido_nuevo_para_llevar", "pedido_nueva_venta_bebidas", "accion_reimprimir", "accion_reimprimir_comanda", "accion_reimprimir_total_pedido", "accion_reimprimir_cobro", "accion_guardar", "accion_cancelar", "accion_consultar", "accion_llamar_mesero", "accion_ir_mesa", "accion_ir_cocina", "accion_confirmar_en_mesa", "accion_falta_en_cocina", "resumen_elegir_impresion", "resumen_imprimir_todas", "resumen_totales_caja", "admin_crear", "admin_crear_mesero", "admin_cancelar", "admin_confirmar", "admin_volver_mesas", "admin_activar", "admin_desactivar", "admin_ver_hoy", "admin_entrar", "admin_probar_api", "admin_ir_menu", "admin_eliminar", "admin_editar", "admin_guardar", "admin_restablecer", "pago_efectivo", "pago_transferencia", "pago_mixto", "pago_fiado"];
export type ActionIconKey = (typeof ACTION_ICON_KEYS)[number];
export declare const ACTION_ICON_DEFAULTS: Record<ActionIconKey, NavAppIconId>;
export declare const ACTION_ICON_SECCIONES: {
    titulo: string;
    keys: ActionIconKey[];
}[];
export declare const ACTION_ICON_LABELS: Record<ActionIconKey, string>;
export declare function resolverIconoAccion(key: ActionIconKey, guardado?: string | null): NavAppIconId;
