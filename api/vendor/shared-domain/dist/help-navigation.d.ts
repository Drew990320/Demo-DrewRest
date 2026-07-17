import type { HelpRol, HelpTutorialAction, HelpTutorialStep } from './help-tutorials';
/** Destino de navegación para el coach. */
export type HelpNavDestination = {
    screenId: string;
    route: string;
    title: string;
    navTarget?: string;
    viaMoreMenu?: boolean;
    moreNavTarget?: string;
};
export declare function senalLlegadaPantalla(screenId: string): string | undefined;
export declare function destinoDesdePantalla(screenId: string, routeOverride?: string): HelpNavDestination | null;
export declare function destinoModuloCoach(moduleId: string, rol: HelpRol): HelpNavDestination | null;
export declare function destinoAccionCoach(actionId: string, rol: HelpRol): HelpNavDestination | null;
export declare function usuarioEnPantallaAyuda(pathname: string, screenId: string, rol: HelpRol): boolean;
/** Ya estás en una pantalla donde puede ejecutarse esta guía (no hace falta preludio de navegación). */
export declare function usuarioEnZonaTutorial(pathname: string, action: HelpTutorialAction, rol: HelpRol): boolean;
/** Pasos de navegación desde la pantalla actual hasta el destino del tutorial. */
export declare function construirPreludioNavegacion(pathname: string, dest: HelpNavDestination, moduloLabel: string, rol: HelpRol): HelpTutorialStep[];
type CoachPasosOpts = {
    skipPrelude?: boolean;
};
export declare function pasosCoachAccion(actionId: string, pathname: string, rol: HelpRol, opts?: CoachPasosOpts): HelpTutorialStep[];
export declare function pasosCoachModulo(moduleId: string, pathname: string, rol: HelpRol): HelpTutorialStep[];
export declare function primaryActionModulo(moduleId: string): string | undefined;
export {};
