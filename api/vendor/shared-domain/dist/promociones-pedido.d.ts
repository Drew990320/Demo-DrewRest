import type { LineaDescuento } from './descuentos-pedido';
/** Etiqueta activable en un pedido (convenio, empleado, etc.). */
export type EtiquetaPromocionPedido = {
    id: string;
    etiqueta: string;
    activa: boolean;
    descripcion?: string;
};
/** Descuento por unidades en una categoría concreta. */
export type ReglaPromocionPorCategoria = {
    id: string;
    activa: boolean;
    etiqueta: string;
    tipo: 'por_categoria';
    id_categoria: number;
    monto_por_unidad: number;
    min_unidades: number;
    min_subtotal_otros: number;
};
/**
 * Descuento por líneas cuya categoría tiene el flag `participa_descuento_sopas`
 * (nombre legacy en BD; en UI: «categoría marcada para promos»).
 */
export type ReglaPromocionPorCategoriaMarcada = {
    id: string;
    activa: boolean;
    etiqueta: string;
    tipo: 'por_categoria_marcada';
    monto_por_unidad: number;
    min_unidades: number;
    min_subtotal_otros: number;
};
/** Descuento por platos principales; opcionalmente solo si el pedido tiene una etiqueta. */
export type ReglaPromocionPorPlatoPrincipal = {
    id: string;
    activa: boolean;
    etiqueta: string;
    tipo: 'por_plato_principal';
    monto_por_unidad: number;
    min_unidades: number;
    /** Si se define, la regla solo aplica cuando el pedido incluye esta etiqueta. */
    requiere_etiqueta_pedido?: string;
};
/**
 * Cliente con etiqueta especial: todos los ítems de una categoría cobran un precio fijo
 * (ej. platos de $45k o $38k pasan a $35k si comparten categoría).
 */
export type ReglaPromocionPrecioFijoCategoria = {
    id: string;
    activa: boolean;
    etiqueta: string;
    tipo: 'precio_fijo_categoria';
    id_categoria: number;
    precio_fijo_unidad: number;
    requiere_etiqueta_pedido: string;
};
/**
 * Promoción N×M (ej. 2×1: compra 2, paga 1). Por categoría o por producto.
 * `alcance`: 'categoria' agrupa unidades de la categoría; 'producto' por ítem.
 */
export type ReglaPromocionCompraPaga = {
    id: string;
    activa: boolean;
    etiqueta: string;
    tipo: 'compra_paga';
    alcance: 'categoria' | 'producto';
    id_categoria?: number;
    id_producto?: number;
    compra_unidades: number;
    paga_unidades: number;
    requiere_etiqueta_pedido?: string;
    min_subtotal_pedido?: number;
};
/** Descuento cuando el subtotal del pedido supera un umbral (monto fijo o %). */
export type ReglaPromocionUmbralSubtotal = {
    id: string;
    activa: boolean;
    etiqueta: string;
    tipo: 'umbral_subtotal_pedido';
    min_subtotal_pedido: number;
    monto_descuento?: number;
    porcentaje_descuento?: number;
    requiere_etiqueta_pedido?: string;
};
export type ReglaPromocion = ReglaPromocionPorCategoria | ReglaPromocionPorCategoriaMarcada | ReglaPromocionPorPlatoPrincipal | ReglaPromocionPrecioFijoCategoria | ReglaPromocionCompraPaga | ReglaPromocionUmbralSubtotal;
export type DesglosePromocion = {
    id: string;
    etiqueta: string;
    monto: number;
};
export declare const ETIQUETA_LEGACY_MULERO = "cliente_especial";
export type ConfigPromocionesLegacy = {
    sopas_activo?: boolean;
    sopas_monto_por_unidad?: number;
    sopas_min_unidades?: number;
    umbral_subtotal_otros?: number;
    muleros_activo?: boolean;
    muleros_monto_por_plato_principal?: number;
    muleros_min_platos_principales?: number;
    reglas_promocion?: unknown;
    etiquetas_pedido?: unknown;
};
/** Normaliza JSON de BD/API a reglas válidas. */
export declare function parseReglasPromocion(raw: unknown): ReglaPromocion[];
export declare function parseEtiquetasPedido(raw: unknown): EtiquetaPromocionPedido[];
export declare function calcularDescuentoPromociones(lineas: LineaDescuento[], reglas: ReglaPromocion[] | unknown, etiquetasPedido?: string[]): {
    total: number;
    desglose: DesglosePromocion[];
};
/** Convierte columnas legacy de config_descuento a reglas unificadas (solo si faltan). */
export declare function migrarLegacyConfigPromociones(cfg: ConfigPromocionesLegacy): {
    reglas: ReglaPromocion[];
    etiquetas_pedido: EtiquetaPromocionPedido[];
};
export declare function nuevaReglaPromocionId(): string;
export declare function nuevaEtiquetaPedidoId(): string;
