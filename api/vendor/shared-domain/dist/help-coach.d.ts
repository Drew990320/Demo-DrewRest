import type { HelpTutorialStep } from './help-tutorials';
/** Señales booleanas publicadas por pantallas (mesa con pedido, en menú, etc.). */
export type HelpProgressSignals = Record<string, boolean>;
export type HelpCoachStepStatus = {
    index: number;
    title: string;
    done: boolean;
    current: boolean;
    target?: string;
};
export type HelpCoachResumen = {
    total: number;
    completados: number;
    pendientes: number;
    indiceActual: number;
    pasos: HelpCoachStepStatus[];
    guiaTerminada: boolean;
};
/** Avance manual del coach (saltos u «entendido»). */
export type HelpCoachAvance = {
    saltados?: ReadonlySet<number>;
    confirmados?: ReadonlySet<number>;
};
export declare const HELP_SIGNAL: {
    readonly mesasEnMapa: "mesas.en_mapa";
    readonly mesaEnDetalle: "mesa.en_detalle";
    readonly mesaTienePedido: "mesa.tiene_pedido";
    readonly mesaTieneLineas: "mesa.tiene_lineas";
    readonly pedidoEnMenu: "pedido.en_menu";
    readonly pedidoLineasPendientesCocina: "pedido.lineas_pendientes_cocina";
    readonly pedidoEnFactura: "pedido.en_factura";
    readonly mesaMesasAgrupadas: "mesa.mesas_agrupadas";
    readonly pedidoPlatosEnCocina: "pedido.platos_en_cocina";
    readonly inventarioEnPantalla: "inventario.en_pantalla";
    readonly inventarioTieneItems: "inventario.tiene_items";
    readonly vistaPreviaEnPantalla: "vista_previa.en_pantalla";
    readonly conexionEnPantalla: "conexion.en_pantalla";
    readonly helpHubAbierto: "help.hub_abierto";
    readonly helpCoachActivo: "help.coach_activo";
    readonly helpAyudaVisible: "help.ayuda_visible";
    readonly navMasAbierto: "nav.mas_abierto";
};
/** Un paso está listo si su señal `listoSi` se cumple, fue saltado o marcado como entendido. */
export declare function pasoCoachCompletado(step: HelpTutorialStep, signals: HelpProgressSignals, opts?: HelpCoachAvance & {
    index?: number;
}): boolean;
export declare function primerPasoCoachPendiente(steps: HelpTutorialStep[], signals: HelpProgressSignals, avance?: HelpCoachAvance): number;
export declare function resumenCoachGuia(steps: HelpTutorialStep[], signals: HelpProgressSignals, stepIndex: number, avance?: HelpCoachAvance): HelpCoachResumen;
export declare function pasosPendientesTitulos(steps: HelpTutorialStep[], signals: HelpProgressSignals, avance?: HelpCoachAvance): string[];
/** Resuelve targets dinámicos según el estado de la pantalla. */
export declare function resolverTargetCoachPaso(step: HelpTutorialStep | undefined, signals: HelpProgressSignals): string | null;
export declare function senalesDesdeRuta(pathname: string): HelpProgressSignals;
