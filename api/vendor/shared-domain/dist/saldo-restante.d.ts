/**
 * Ítem interno «Saldo pendiente»: absorbe abonos parciales (plan personas / combinado)
 * sin partir platos reales del pedido.
 *
 * - Mesa: oculto (mismo flag es_cuota_pendiente_reparto).
 * - Cobro: línea cobrable del reparto; los platos del alcance quedan intactos.
 * - Al liquidar el saldo, solo se marcan cobrados los platos del alcance
 *   (todos en personas; pool en combinado).
 *
 * Nota:
 * - `saldo_restante` → reparto sobre el total del pedido.
 * - `saldo_restante@1:2,5:1` → pool combinado (id_detalle:cantidad).
 */
export declare const NOMBRE_PRODUCTO_SALDO_RESTANTE = "Saldo restante";
/** Nombre visible en app / ticket. */
export declare const NOMBRE_DISPLAY_SALDO_PENDIENTE = "Saldo pendiente";
/** Línea pendiente con el monto aún por cobrar. */
export declare const SALDO_RESTANTE_NOTA = "saldo_restante";
/**
 * Remanente tras repartir el saldo en platos enteros (no absorbe platos).
 * Ej.: cuota omitida que no alcanza para otro plato del menú.
 */
export declare const SALDO_RESTANTE_FRAGMENTO_NOTA = "saldo_restante#fragmento";
/** Abono ya aplicado (ligado a una factura). */
export declare const SALDO_ABONO_NOTA = "saldo_restante:abono";
export type SaldoPoolRef = {
    id_detalle: number;
    cantidad: number;
};
export declare function esNotaSaldoRestantePendiente(nota: string | null | undefined): boolean;
/** Saldo ya reconciliado a platos: solo el fragmento huérfano. */
export declare function esNotaSaldoFragmentoHuerfano(nota: string | null | undefined): boolean;
export declare function esNotaSaldoAbono(nota: string | null | undefined): boolean;
export declare function esDetalleSaldoRestante(d: {
    nota_cocina?: string | null;
    es_cuota_pendiente_reparto?: boolean;
    nombre_producto?: string;
}): boolean;
/** Codifica el alcance del saldo (total o pool combinado). */
export declare function formatSaldoRestanteNota(pool?: SaldoPoolRef[] | null): string;
/** Pool de platos del saldo combinado; `null` = sobre el total. */
export declare function parseSaldoRestantePool(nota: string | null | undefined): SaldoPoolRef[] | null;
/** Etiqueta legible del pool (nombres de platos) para la UI. */
export declare function notaDisplaySaldoPendiente(nota: string | null | undefined, nombresPorDetalle?: Map<number, string> | Record<number, string>): string | null;
/** Monto pendiente del saldo (solo líneas no cobradas de saldo pendiente). */
export declare function montoSaldoRestantePendiente(detalles: {
    cobrado?: boolean;
    id_factura?: number | null;
    nota_cocina?: string | null;
    precio_unitario: number;
    cantidad: number;
}[]): number;
/** Detalle de saldo pendiente aún no cobrado (si existe). */
export declare function detalleSaldoRestantePendiente<T extends {
    cobrado?: boolean;
    id_factura?: number | null;
    nota_cocina?: string | null;
}>(detalles: T[]): T | undefined;
export type PlatoParaDistribuirSaldo = {
    id_detalle: number;
    precio_unitario: number;
    cantidad: number;
};
export type LiberacionPlatoSaldo = {
    id_detalle: number;
    /** Unidades que quedan pendientes para cobrar por platos. */
    cantidad: number;
};
export type DistribucionSaldoEnPlatos = {
    /**
     * Unidades liberadas por línea (pueden ser parciales: 1 de 3 picadas).
     * @deprecated Preferir `liberaciones`.
     */
    idsLiberados: number[];
    /** Unidades a dejar pendientes por platos (sin partir el precio unitario). */
    liberaciones: LiberacionPlatoSaldo[];
    montoPlatos: number;
    /** Remanente que no forma un plato completo. */
    montoSaldoRestante: number;
};
/**
 * Reparte un saldo pendiente en unidades enteras del menú (sin partir precios).
 * Prioriza mayor precio unitario. Ej.: saldo 150.000 y 3× picada 100.000
 * → libera 1 picada y deja 50.000 como saldo pendiente.
 */
export declare function distribuirSaldoEnPlatos(saldoMonto: number, platos: PlatoParaDistribuirSaldo[]): DistribucionSaldoEnPlatos;
/**
 * True si los platos pendientes aún están «absorbidos» por el saldo (reparto
 * personas/combinado sin reconciliar a platos): el valor de platos supera al saldo.
 */
export declare function saldoNecesitaReconciliarAPlatos(montoSaldo: number, platosPendientes: PlatoParaDistribuirSaldo[], notaSaldo?: string | null): boolean;
