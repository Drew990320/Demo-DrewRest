import type { HelpRol } from './help-tutorials';
import { type HelpTutorialAction, type HelpTutorialModule } from './help-tutorials';
/** Pantalla concreta dentro de un módulo (más específico que routeHints sueltos). */
export type HelpScreenDefinition = {
    id: string;
    moduleId: string;
    title: string;
    /** Mayor = gana si varias pantallas coinciden. */
    prioridad: number;
    /** Expresión RE2 sobre pathname (sin flags). */
    patron: string;
    roles: HelpRol[];
};
export type HelpScreenContext = {
    screenId: string;
    moduleId: string;
    screenTitle: string;
    moduleTitle: string;
    pathname: string;
};
export declare const HELP_SCREEN_DEFINITIONS: HelpScreenDefinition[];
/** Guías recomendadas por pantalla (orden = prioridad de la tarea). */
export declare const HELP_GUIDES_BY_SCREEN: Record<string, string[]>;
/** Normaliza rutas expo-router: `/(app)/inventario` → `/inventario`. */
export declare function normalizarPathnameAyuda(pathname: string): string;
export declare function resolverPantallaAyuda(pathname: string, rol: HelpRol): HelpScreenContext;
export type HelpGuideRanked = HelpTutorialAction & {
    relevancia: number;
    esPantallaActual: boolean;
};
export declare function guiasContextuales(pathname: string, rol: HelpRol, pantalla?: HelpScreenContext): HelpGuideRanked[];
export declare function guiaPrincipalContextual(pathname: string, rol: HelpRol): HelpGuideRanked | null;
export declare function moduloDePantalla(moduleId: string): HelpTutorialModule | null;
