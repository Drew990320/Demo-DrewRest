import { type TipoLineaCocina } from './cocina-producto';
export type { TipoLineaCocina };
export { etiquetaTipoLineaCocina, ordenTipoLineaCocina, tipoLineaCocina, } from './cocina-producto';
export type DetalleCocinaLike = {
    id_detalle: number;
    id_producto?: number;
    id_detalle_padre?: number | null;
    nombre_producto?: string;
    cantidad: number;
    categoria_nombre?: string;
    tipo_proteina?: string;
    nota_cocina?: string | null;
    personalizaciones?: {
        id_opcion?: number;
        descripcion: string;
    }[];
    enviado_cocina?: boolean;
    listo_para_recoger?: boolean;
    es_bebida?: boolean;
    es_empacable?: boolean;
    es_plato_principal?: boolean;
    es_acompanamiento_mazorca?: boolean;
    marcar_cocina: boolean;
    listo_cocina: boolean;
    categoria_prioridad_cocina_baja?: boolean;
    producto_prioridad_cocina_baja?: boolean | null;
    prioridad_cocina_baja?: boolean;
};
export type PedidoCocinaLike = {
    mesa_numero: number;
    mesero?: {
        nombre?: string;
        apellido?: string;
    };
    detalles: DetalleCocinaLike[];
};
export declare function detalleVisibleEnCocina(d: DetalleCocinaLike): boolean;
export declare function pedidoActivoEnCocina(pedido: PedidoCocinaLike): boolean;
export declare function ordenarDetallesCocina<T extends DetalleCocinaLike>(detalles: T[]): T[];
export type LineaCocinaGrupo<T extends DetalleCocinaLike = DetalleCocinaLike> = T & {
    ids_detalle: number[];
    /** Todas las líneas del grupo están listas para recoger. */
    listo_para_recoger: boolean;
    /** Algunas líneas listas, otras no (p. ej. agregadas en distintos momentos). */
    listo_para_recoger_parcial: boolean;
};
/**
 * Agrupa platos visibles en cocina (mismo producto/nota/personalización),
 * aunque se hayan agregado en distintos momentos o por distintos usuarios.
 */
export declare function agruparLineasCocinaVisibles<T extends DetalleCocinaLike>(detalles: T[]): LineaCocinaGrupo<T>[];
export declare function ordenarDetallesMesero<T extends DetalleCocinaLike>(detalles: T[]): T[];
export declare function etiquetaEstadoLineaMesero(d: DetalleCocinaLike): string;
/** Plato enviado a cocina que el mesero aún puede recoger o reportar. */
export declare function detallePuedeRecogerMesero(d: DetalleCocinaLike): boolean;
/** Alias usado en el API (`pedidos-vista-operativa`). */
export declare const detallePendienteRecogerMesero: typeof detallePuedeRecogerMesero;
export declare function platosPendientesRecogerPedido(p: PedidoCocinaLike): number;
export declare function pedidoTieneRecogidaPendiente(p: PedidoCocinaLike): boolean;
export declare function nombreMeseroPedido(p: PedidoCocinaLike): string;
export declare function detalleCocinaAviso(d: DetalleCocinaLike): boolean;
export type PlatoPendienteResumen = {
    nombre: string;
    total: number;
    mesas: number[];
    /** Línea con prioridad baja configurada (antes «cerdo»). */
    esPrioridadBaja: boolean;
    tipo: TipoLineaCocina;
};
export declare function conteoPorTipoEnCocina(pedidos: PedidoCocinaLike[]): Record<TipoLineaCocina, number>;
export declare function textoResumenTiposCocina(conteo: Record<TipoLineaCocina, number>): string;
/** Cola FIFO por hora de creación del pedido (sin prioridad alta/baja). */
export declare function ordenarPedidosCocinaPorLlegada<T extends {
    creado_en: Date | string;
}>(pedidos: T[]): T[];
export declare function mesasEnOrdenDeLlegada(pedidos: {
    mesa_numero: number;
    creado_en: Date | string;
}[]): number[];
export declare function ordenarMesasPorCola(mesas: number[], colaMesas: number[]): number[];
export declare function porcionesVisiblesEnCocina(pedido: PedidoCocinaLike): number;
export declare function platosEsperandoRecogida(pedido: PedidoCocinaLike): number;
export declare function totalPlatosEsperandoRecogida(pedidos: PedidoCocinaLike[]): number;
/** Separa platos de cocina y mazorcas (entradas) en conteos de recogida. */
export declare function conteoRecogidaPorTipo(detalles: DetalleCocinaLike[], incluir: (d: DetalleCocinaLike) => boolean): {
    platos: number;
    entradas: number;
};
export declare function conteoEsperandoRecogidaPorTipo(pedido: PedidoCocinaLike): {
    platos: number;
    entradas: number;
};
export declare function totalEsperandoRecogidaPorTipo(pedidos: PedidoCocinaLike[]): {
    platos: number;
    entradas: number;
};
/** Texto para avisos al mesero (notificación / banner). */
export declare function mensajeListosParaRecoger(platos: number, entradas: number, sufijo?: string): string;
export declare function platosSinEnviarCocina(pedido: PedidoCocinaLike): number;
export declare function totalPlatosSinEnviarCocina(pedidos: PedidoCocinaLike[]): number;
export declare function etiquetaPlatoPendiente(nombre: string, total: number): string;
export declare function agruparPlatosPendientes(items: PedidoCocinaLike[], colaMesas?: number[]): PlatoPendienteResumen[];
export declare function mesasActivasDePedidos(pedidos: Pick<PedidoCocinaLike, 'mesa_numero'>[]): number[];
export declare function resumenItemsMesero(pedidos: PedidoCocinaLike[], etiquetaMesa?: (numero: number) => string): {
    nombre: string;
    total: number;
    mesasLabel: string;
}[];
