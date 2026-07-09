/** Subtotal mínimo de ítems que no son sopa para activar el descuento de sopas. */
export declare const UMBRAL_SUBTOTAL_OTROS_COP = 50000;
/** Mínimo de unidades de sopa para activar el descuento global de sopas. */
export declare const SOPAS_MIN_UNIDADES_DEFAULT = 2;
/** Mínimo de platos principales para el descuento de clientes camioneros. */
export declare const MULEROS_MIN_PLATOS_PRINCIPALES_DEFAULT = 1;
export type LineaDescuento = {
    cantidad: number;
    subtotal_linea: number;
    nombre_producto: string;
    categoria_nombre: string;
    id_categoria?: number;
    id_producto?: number;
    precio_unitario?: number;
    es_plato_principal?: boolean;
    participa_descuento_sopas?: boolean;
};
import { type ConfigPromocionesLegacy, type DesglosePromocion, type EtiquetaPromocionPedido, type ReglaPromocion } from './promociones-pedido';
export type { DesglosePromocion, EtiquetaPromocionPedido, ReglaPromocion };
export type ConfigDescuentoCalc = ConfigPromocionesLegacy & {
    reglas_promocion?: ReglaPromocion[];
    etiquetas_pedido?: EtiquetaPromocionPedido[];
};
export type ContextoDescuentosPedido = {
    /** Etiquetas activas en el pedido (convenio, cliente especial, etc.). */
    etiquetas_promocion?: string[];
    /** Compatibilidad: equivale a incluir `cliente_especial` en etiquetas. */
    cliente_mulero?: boolean;
};
/** @deprecated Usar flag de categoría o `lineaMarcadaPromo` en promociones-pedido. */
export declare function esLineaSopa(linea: LineaDescuento): boolean;
export declare function resolverConfigPromociones(config: ConfigDescuentoCalc): {
    reglas_promocion: ReglaPromocion[];
    etiquetas_pedido: EtiquetaPromocionPedido[];
};
export declare function calcularDescuentosPedido(lineas: LineaDescuento[], config: ConfigDescuentoCalc, ctx?: ContextoDescuentosPedido | boolean): {
    descuento_sopas: number;
    descuento_muleros: number;
    descuento_promociones: number;
    promociones_desglose: DesglosePromocion[];
};
