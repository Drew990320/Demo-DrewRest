export type HelpRol = 'mesero' | 'chef' | 'admin' | 'superadmin';
export type HelpTutorialStep = {
    title: string;
    body: string;
    tip?: string;
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
