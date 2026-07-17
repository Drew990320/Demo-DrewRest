export { idRecorridoCompleto, esAccionRecorrido, HELP_RECORRIDO_ACTIONS } from './help-tutorials-recorrido';
export type HelpRol = 'mesero' | 'chef' | 'admin' | 'superadmin';
export type HelpTutorialStep = {
    title: string;
    body?: string;
    tip?: string;
    /** Qué hacer ahora en la interfaz (imperativo). */
    accion?: string;
    /** Dónde encontrar el botón o sección. */
    buscar?: string;
    /** ID del elemento UI para resaltar en modo guía activa. */
    target?: string;
    /** Señal(es) que confirman el paso (OR con |). Ver help-coach HELP_SIGNAL. */
    listoSi?: string;
    /** Pantalla help-context donde aplica este paso. */
    pantalla?: string;
    /** Ruta expo-router si el mesero no está en la pantalla correcta. */
    irARuta?: string;
    /** El mesero puede marcar el paso como entendido sin completar la acción (flujos variables). */
    confirmarEntendido?: boolean;
    /** Textos alternos para móvil (barra inferior, barra de acciones en pantalla). */
    bodyMovil?: string;
    buscarMovil?: string;
    accionMovil?: string;
    /** Textos alternos para tablet/PC (nav lateral + rail derecho). */
    bodyTablet?: string;
    buscarTablet?: string;
    accionTablet?: string;
};
export type HelpTutorialModule = {
    id: string;
    title: string;
    subtitle: string;
    icon: string;
    roles: HelpRol[];
    steps: HelpTutorialStep[];
    /** Fragmentos de ruta que activan sugerencia contextual. */
    routeHints: string[];
};
export type HelpTutorialAction = {
    id: string;
    title: string;
    subtitle: string;
    moduleId: string;
    roles: HelpRol[];
    steps: HelpTutorialStep[];
    routeHints: string[];
    /** Pantallas donde esta guía es especialmente relevante. */
    screenIds?: string[];
};
export declare const HELP_TUTORIAL_MODULES: HelpTutorialModule[];
export declare const HELP_TUTORIAL_ACTIONS: HelpTutorialAction[];
export declare function normalizarRolHelp(rol: string | null | undefined): HelpRol | null;
export declare function modulosHelpParaRol(rol: HelpRol): HelpTutorialModule[];
export declare function accionesHelpParaRol(rol: HelpRol): HelpTutorialAction[];
export declare function moduloSugeridoPorRuta(pathname: string, rol: HelpRol): HelpTutorialModule | null;
export declare function accionSugeridaPorRuta(pathname: string, rol: HelpRol): HelpTutorialAction | null;
export declare function pasosTourCompleto(rol: HelpRol): HelpTutorialStep[];
export declare function pasosDeModulo(moduleId: string): HelpTutorialStep[];
export declare function pasosDeAccion(actionId: string): HelpTutorialStep[];
