import type { ClaseInventario, ComportamientoInventario } from './inventario-comportamiento';
/**
 * Eventos del ciclo operativo donde puede ejecutarse la deducción de inventario.
 * Genérico: aplica a restaurantes, retail, producción, etc.
 */
export type EventoDeduccionInventario = 'al_crear_pedido' | 'al_confirmar_pedido' | 'cocina_acepta' | 'cocina_en_preparacion' | 'cocina_listo' | 'al_facturar' | 'al_entregar';
export declare const EVENTOS_DEDUCCION: readonly EventoDeduccionInventario[];
export type PoliticaDeduccionInventario = Readonly<{
    evento_receta: EventoDeduccionInventario;
    evento_comercial: EventoDeduccionInventario;
    evento_consumible?: EventoDeduccionInventario;
}>;
export declare const POLITICA_DEDUCCION_DEFAULT: PoliticaDeduccionInventario;
export declare function eventoDeduccionParaClase(clase: ClaseInventario, politica?: PoliticaDeduccionInventario): EventoDeduccionInventario;
export declare function debeDeducirEnEvento(input: Readonly<{
    comportamiento: ComportamientoInventario;
    clase: ClaseInventario;
    evento: EventoDeduccionInventario;
    politica?: PoliticaDeduccionInventario;
    /** Producto preparado con receta (descuenta ingredientes, no el artículo de menú). */
    es_consumo_por_receta?: boolean;
}>): boolean;
/** Orden cronológico de eventos (para idempotencia / reversiones). */
export declare const ORDEN_EVENTOS_DEDUCCION: readonly EventoDeduccionInventario[];
export declare function indiceEventoDeduccion(evento: EventoDeduccionInventario): number;
