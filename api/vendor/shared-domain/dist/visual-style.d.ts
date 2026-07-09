import type { VisualColorKey } from './nav-app-icon';
import type { MesaFormaId, MesaVistaId } from './mesa-visual';
export declare const VISUAL_STYLE_IDS: readonly ["minimalista", "profesional", "calido", "expresivo"];
export type VisualStyleId = (typeof VISUAL_STYLE_IDS)[number];
export type VisualLayoutTokens = {
    radiusSm: number;
    radiusMd: number;
    radiusLg: number;
    cardBorderWidth: number;
    titleWeight: '600' | '700' | '800';
    chromeElevation: 'flat' | 'soft' | 'raised';
};
/** Apariencia de barras, botones de icono y CTAs (cambio visual fuerte). */
export type NavItemChrome = 'ghost' | 'pill' | 'solid' | 'underline';
export type NavBarChrome = 'flat' | 'bordered' | 'elevated' | 'floating';
export type IconButtonChrome = 'outline' | 'soft' | 'filled' | 'bold';
export type CtaChrome = 'classic' | 'corporate' | 'rounded' | 'chunky';
export type VisualChromeTokens = {
    navItem: NavItemChrome;
    navBar: NavBarChrome;
    iconButton: IconButtonChrome;
    cta: CtaChrome;
    /** Ítem activo de nav con fondo primary sólido e icono claro. */
    navActiveFilled: boolean;
    iconButtonBorderWidth: number;
    mesaForma: MesaFormaId;
    mesaVista: MesaVistaId;
};
export type VisualStylePreset = {
    id: VisualStyleId;
    nombre: string;
    descripcion: string;
    colores: Record<VisualColorKey, string>;
    layout: VisualLayoutTokens;
    chrome: VisualChromeTokens;
};
export declare const VISUAL_LAYOUT_DEFAULTS: VisualLayoutTokens;
export declare const VISUAL_CHROME_DEFAULTS: VisualChromeTokens;
export declare const VISUAL_STYLE_PRESETS: Record<VisualStyleId, VisualStylePreset>;
export declare function esEstiloVisualValido(id: string | null | undefined): id is VisualStyleId;
export declare function resolverEstiloVisual(guardado?: string | null): VisualStyleId;
export declare function presetEstiloVisual(id: VisualStyleId): VisualStylePreset;
