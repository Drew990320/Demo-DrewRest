/**
 * Tipos de movimiento de inventario (ledger).
 * Incluye mapeo desde valores legacy de la API actual.
 */
export type TipoMovInventario = 'compra' | 'venta' | 'produccion' | 'consumo_receta' | 'consumo_manual' | 'ajuste_manual' | 'perdida' | 'dano' | 'vencimiento' | 'transferencia' | 'devolucion' | 'inventario_fisico' | 'prestamo' | 'reposicion' | 'mantenimiento'
/** @deprecated usar compra */
 | 'entrada'
/** @deprecated usar consumo_manual o consumo_receta */
 | 'consumo'
/** @deprecated usar ajuste_manual */
 | 'ajuste';
export type ModuloOrigenInventario = 'inventario' | 'pedido' | 'cocina' | 'factura' | 'compras' | 'activos' | 'sistema';
export type MovimientoInventarioPlan = Readonly<{
    id_articulo: number;
    tipo_mov: TipoMovInventario;
    /** Positivo = entrada al stock; negativo = salida. */
    delta: number;
    unidad: string;
    costo_unitario?: number;
    modulo_origen?: ModuloOrigenInventario;
    id_documento?: string;
    id_pedido?: number;
    id_detalle_pedido?: number;
    observacion?: string;
}>;
export type MovimientoInventarioRegistro = MovimientoInventarioPlan & Readonly<{
    fecha: string;
    id_usuario?: number;
    costo_total?: number;
}>;
export declare function esMovimientoEntrada(tipo: TipoMovInventario): boolean;
export declare function normalizarTipoMovLegacy(tipo: string): TipoMovInventario;
export declare function tipoMovCanonico(tipo: TipoMovInventario): TipoMovInventario;
