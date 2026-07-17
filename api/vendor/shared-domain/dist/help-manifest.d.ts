/**
 * Manifest central del Coach — única fuente de verdad para pantallas, targets y señales.
 * Tutoriales, navegación, validación y descubrimiento leen de aquí.
 */
import type { HelpRol } from './help-tutorials';
export type HelpManifestScreen = {
    id: string;
    moduleId: string;
    title: string;
    prioridad: number;
    /** RE2 sobre pathname normalizado (sin grupo expo). */
    patron: string;
    roles: HelpRol[];
    /** Señal booleana al estar en esta pantalla (desde ruta). */
    signalOnEnter: string;
    /** Ruta expo-router para navegación del coach. */
    route?: string;
    navTarget?: string;
    viaMoreMenu?: boolean;
    moreNavTarget?: string;
};
export type HelpManifestTargetKind = 'help' | 'nav' | 'more' | 'action' | 'rail' | 'form';
export type HelpManifestTarget = {
    id: string;
    label: string;
    kind: HelpManifestTargetKind;
    /** Pantallas donde puede aparecer (vacío = global). */
    screenIds?: string[];
    activateOnPress?: boolean;
    /** Si true, el coach intenta scrollIntoView antes de resaltar. */
    scrollIntoView?: boolean;
    /** Permiso mesero requerido (referencia documental; validación en runtime UI). */
    permisoMesero?: string;
    /** IDs de señales que este target puede ayudar a completar. */
    relatedSignals?: string[];
};
export type HelpKnowledgeTopic = {
    id: string;
    moduleId: string;
    title: string;
    summary: string;
    screenIds?: string[];
    roles: HelpRol[];
    relatedTargetIds?: string[];
    faq?: {
        q: string;
        a: string;
    }[];
};
export declare const HELP_MANIFEST_SCREENS: HelpManifestScreen[];
export declare const HELP_MANIFEST_TARGETS: HelpManifestTarget[];
/** Targets dinámicos: el paso referencia un alias resuelto en runtime. */
export declare const HELP_MANIFEST_DYNAMIC_TARGETS: Record<string, string[]>;
export declare function manifestScreen(id: string): HelpManifestScreen | undefined;
export declare function manifestTarget(id: string): HelpManifestTarget | undefined;
export declare function manifestTargetIds(): string[];
export declare function expandirTargetManifest(targetId: string): string[];
/** Convierte pantallas del manifest al formato legacy de help-context. */
export declare function manifestComoScreenDefinitions(): {
    id: string;
    moduleId: string;
    title: string;
    prioridad: number;
    patron: string;
    roles: HelpRol[];
}[];
/** Señales derivadas de rutas según el manifest. */
export declare function senalesDesdeManifest(pathname: string): Record<string, boolean>;
export declare function destinoNavegacionManifest(screenId: string): {
    screenId: string;
    route: string;
    title: string;
    navTarget?: string;
    viaMoreMenu?: boolean;
    moreNavTarget?: string;
} | null;
export declare function screenSignalManifest(screenId: string): string | undefined;
