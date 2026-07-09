export type LineaMazorcaSync = {
    id_detalle: number;
    cantidad: number;
    listo_cocina: boolean;
    listo_para_recoger: boolean;
};
export declare const MSG_MAZORCA_MIN_COMENSALES = "Debe haber al menos 1 comensal";
export declare const MSG_MAZORCA_BLOQUEADA = "No puedes bajar comensales por debajo del acompa\u00F1amiento ya listo o entregado";
export declare const MSG_MAZORCA_NO_AJUSTE = "No se pudo ajustar comensales: hay acompa\u00F1amiento ya listo o en mesa";
export declare function cantidadBloqueadaMazorca(lineas: LineaMazorcaSync[]): number;
export declare function cantidadTotalMazorca(lineas: LineaMazorcaSync[]): number;
export declare function lineaMazorcaEditable(lineas: LineaMazorcaSync[]): LineaMazorcaSync | undefined;
export type PlanSyncMazorca = {
    tipo: 'limpiar';
} | {
    tipo: 'sin_cambios';
} | {
    tipo: 'error';
    mensaje: string;
} | {
    tipo: 'subir';
    modo: 'editar';
    id_detalle: number;
    nueva_cantidad: number;
} | {
    tipo: 'subir';
    modo: 'crear';
    cantidad: number;
} | {
    tipo: 'bajar';
    actualizar: {
        id_detalle: number;
        nueva_cantidad: number;
    }[];
    eliminar: number[];
};
export declare function planificarSyncMazorca(input: {
    usa_linea_mazorca: boolean;
    num_comensales: number;
    lineas: LineaMazorcaSync[];
}): PlanSyncMazorca;
export declare function cantidadLineaMazorcaInicial(input: {
    usa_linea_mazorca: boolean;
    ya_tiene_linea: boolean;
    num_comensales: number;
}): number | null;
