"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VISUAL_STYLE_PRESETS = exports.VISUAL_CHROME_DEFAULTS = exports.VISUAL_LAYOUT_DEFAULTS = exports.VISUAL_STYLE_IDS = void 0;
exports.esEstiloVisualValido = esEstiloVisualValido;
exports.resolverEstiloVisual = resolverEstiloVisual;
exports.presetEstiloVisual = presetEstiloVisual;
const nav_app_icon_1 = require("./nav-app-icon");
exports.VISUAL_STYLE_IDS = [
    'minimalista',
    'profesional',
    'calido',
    'expresivo',
];
exports.VISUAL_LAYOUT_DEFAULTS = {
    radiusSm: 8,
    radiusMd: 12,
    radiusLg: 16,
    cardBorderWidth: 0.5,
    titleWeight: '700',
    chromeElevation: 'flat',
};
exports.VISUAL_CHROME_DEFAULTS = {
    navItem: 'ghost',
    navBar: 'flat',
    iconButton: 'soft',
    cta: 'classic',
    navActiveFilled: false,
    iconButtonBorderWidth: 1,
    mesaForma: 'rectangular',
    mesaVista: 'cuadricula',
};
/** Paleta terracota DrewRest (referencia estilo cálido). */
const PALETA_CALIDA = {
    primary: '#C47A72',
    primary_dark: '#A86158',
    secondary: '#D4A574',
    background: '#FAF6F0',
    background_alt: '#F3EDE4',
    surface: '#FFFFFF',
    text: '#3D3630',
    text_muted: '#7A7268',
    border: '#E8DFD4',
};
exports.VISUAL_STYLE_PRESETS = {
    minimalista: {
        id: 'minimalista',
        nombre: 'Minimalista',
        descripcion: 'Limpio y ligero. Nav discreta, botones con borde suave y CTAs planos.',
        colores: { ...nav_app_icon_1.VISUAL_COLOR_DEFAULTS },
        layout: {
            radiusSm: 8,
            radiusMd: 12,
            radiusLg: 16,
            cardBorderWidth: 0.5,
            titleWeight: '700',
            chromeElevation: 'flat',
        },
        chrome: { ...exports.VISUAL_CHROME_DEFAULTS },
    },
    profesional: {
        id: 'profesional',
        nombre: 'Profesional',
        descripcion: 'Corporativo: barra con borde marcado, ítems con subrayado y botones cuadrados.',
        colores: {
            primary: '#4A6FA5',
            primary_dark: '#365580',
            secondary: '#6B8CAE',
            background: '#EEF2F7',
            background_alt: '#E2E8F0',
            surface: '#FFFFFF',
            text: '#1E293B',
            text_muted: '#64748B',
            border: '#CBD5E1',
        },
        layout: {
            radiusSm: 6,
            radiusMd: 10,
            radiusLg: 14,
            cardBorderWidth: 1,
            titleWeight: '700',
            chromeElevation: 'soft',
        },
        chrome: {
            navItem: 'underline',
            navBar: 'bordered',
            iconButton: 'outline',
            cta: 'corporate',
            navActiveFilled: false,
            iconButtonBorderWidth: 1.5,
            mesaForma: 'cuadrada',
            mesaVista: 'compacta',
        },
    },
    calido: {
        id: 'calido',
        nombre: 'Cálido',
        descripcion: 'Acogedor: nav con pastillas redondeadas, barra elevada y botones suaves.',
        colores: { ...PALETA_CALIDA },
        layout: {
            radiusSm: 10,
            radiusMd: 14,
            radiusLg: 18,
            cardBorderWidth: 0.5,
            titleWeight: '600',
            chromeElevation: 'soft',
        },
        chrome: {
            navItem: 'pill',
            navBar: 'elevated',
            iconButton: 'soft',
            cta: 'rounded',
            navActiveFilled: false,
            iconButtonBorderWidth: 1,
            mesaForma: 'redonda',
            mesaVista: 'cuadricula',
        },
    },
    expresivo: {
        id: 'expresivo',
        nombre: 'Expresivo',
        descripcion: 'Táctil y marcado: nav con ítems sólidos, barra flotante y botones redondos con sombra.',
        colores: {
            primary: '#2563EB',
            primary_dark: '#1D4ED8',
            secondary: '#0EA5E9',
            background: '#F8FAFC',
            background_alt: '#E2E8F0',
            surface: '#FFFFFF',
            text: '#0F172A',
            text_muted: '#475569',
            border: '#94A3B8',
        },
        layout: {
            radiusSm: 12,
            radiusMd: 16,
            radiusLg: 20,
            cardBorderWidth: 1.5,
            titleWeight: '800',
            chromeElevation: 'raised',
        },
        chrome: {
            navItem: 'solid',
            navBar: 'floating',
            iconButton: 'bold',
            cta: 'chunky',
            navActiveFilled: true,
            iconButtonBorderWidth: 2,
            mesaForma: 'barra',
            mesaVista: 'lista',
        },
    },
};
function esEstiloVisualValido(id) {
    return (typeof id === 'string' &&
        exports.VISUAL_STYLE_IDS.includes(id));
}
function resolverEstiloVisual(guardado) {
    return esEstiloVisualValido(guardado) ? guardado : 'minimalista';
}
function presetEstiloVisual(id) {
    return exports.VISUAL_STYLE_PRESETS[id];
}
