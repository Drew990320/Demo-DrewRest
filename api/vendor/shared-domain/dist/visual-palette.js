"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PALETAS_PREDISENADAS = exports.GRUPOS_VISTA_PALETA_APP = void 0;
exports.modoPaletaVisual = modoPaletaVisual;
exports.normalizarContrastePaleta = normalizarContrastePaleta;
exports.derivarColoresSemanticos = derivarColoresSemanticos;
exports.generarPaletaClaraDesdePrincipal = generarPaletaClaraDesdePrincipal;
exports.generarPaletaOscuraDesdePrincipal = generarPaletaOscuraDesdePrincipal;
exports.generarSugerenciasTemaDesdePrincipal = generarSugerenciasTemaDesdePrincipal;
exports.generarPaletaDesdePrincipal = generarPaletaDesdePrincipal;
const nav_app_icon_1 = require("./nav-app-icon");
/** Grupos para vista previa de todos los tokens que usa la app. */
exports.GRUPOS_VISTA_PALETA_APP = [
    {
        titulo: 'Marca',
        keys: [
            'primary',
            'primaryDark',
            'primaryLight',
            'secondary',
            'secondaryDark',
            'cocina',
        ],
    },
    {
        titulo: 'Fondos',
        keys: ['background', 'backgroundAlt', 'surface', 'surfaceMuted'],
    },
    { titulo: 'Texto', keys: ['text', 'textMuted', 'textHint', 'onPrimary'] },
    {
        titulo: 'Éxito',
        keys: ['success', 'successLight', 'successText', 'successBorder'],
    },
    {
        titulo: 'Aviso',
        keys: ['warning', 'warningLight', 'warningText', 'warningBorder'],
    },
    {
        titulo: 'Error',
        keys: ['danger', 'dangerLight', 'dangerText', 'dangerBorder'],
    },
    { titulo: 'Info', keys: ['info', 'infoLight', 'infoText', 'infoBorder'] },
    {
        titulo: 'Mesas',
        keys: [
            'mesaLibre',
            'mesaLibreBg',
            'mesaOcupada',
            'mesaOcupadaBg',
            'mesaReservada',
            'mesaReservadaBg',
        ],
    },
    { titulo: 'Bordes', keys: ['border', 'borderLight', 'borderInput'] },
];
function parseHex(hex) {
    const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
    if (!m)
        return null;
    return {
        r: parseInt(m[1], 16),
        g: parseInt(m[2], 16),
        b: parseInt(m[3], 16),
    };
}
function rgbToHsl(r, g, b) {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const d = max - min;
    let h = 0;
    const l = (max + min) / 2;
    let s = 0;
    if (d !== 0) {
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case rn:
                h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
                break;
            case gn:
                h = ((bn - rn) / d + 2) / 6;
                break;
            default:
                h = ((rn - gn) / d + 4) / 6;
                break;
        }
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
}
function hslToHex(h, s, l) {
    const sn = s / 100;
    const ln = l / 100;
    const c = (1 - Math.abs(2 * ln - 1)) * sn;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = ln - c / 2;
    let r = 0;
    let g = 0;
    let b = 0;
    if (h < 60) {
        r = c;
        g = x;
    }
    else if (h < 120) {
        r = x;
        g = c;
    }
    else if (h < 180) {
        g = c;
        b = x;
    }
    else if (h < 240) {
        g = x;
        b = c;
    }
    else if (h < 300) {
        r = x;
        b = c;
    }
    else {
        r = c;
        b = x;
    }
    const toHex = (n) => Math.round((n + m) * 255)
        .toString(16)
        .padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}
function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}
function normalizePrimary(hex) {
    const trimmed = hex.trim();
    if ((0, nav_app_icon_1.esColorHexValido)(trimmed))
        return trimmed.toUpperCase();
    return nav_app_icon_1.VISUAL_COLOR_DEFAULTS.primary;
}
function mixHex(a, b, weightB) {
    const pa = parseHex(a);
    const pb = parseHex(b);
    if (!pa || !pb)
        return a;
    const w = clamp(weightB, 0, 1);
    const ch = (x, y) => Math.round(x * (1 - w) + y * w)
        .toString(16)
        .padStart(2, '0');
    return `#${ch(pa.r, pb.r)}${ch(pa.g, pb.g)}${ch(pa.b, pb.b)}`.toUpperCase();
}
function modoPaletaVisual(palette) {
    const bg = parseHex(palette.background);
    if (!bg)
        return 'claro';
    return rgbToHsl(bg.r, bg.g, bg.b).l < 50 ? 'oscuro' : 'claro';
}
function luminanciaRelativa(hex) {
    const p = parseHex(hex);
    if (!p)
        return 0;
    const canal = (v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    const r = canal(p.r);
    const g = canal(p.g);
    const b = canal(p.b);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrasteRelativo(fg, bg) {
    const l1 = luminanciaRelativa(fg);
    const l2 = luminanciaRelativa(bg);
    const claro = Math.max(l1, l2);
    const oscuro = Math.min(l1, l2);
    return (claro + 0.05) / (oscuro + 0.05);
}
/** Corrige texto/bordes ilegibles cuando fondo y texto no contrastan. */
function normalizarContrastePaleta(palette) {
    const modo = modoPaletaVisual(palette);
    const ratioTexto = contrasteRelativo(palette.text, palette.background);
    const ratioMuted = contrasteRelativo(palette.text_muted, palette.background);
    if (ratioTexto >= 4.5 && ratioMuted >= 3)
        return palette;
    const sugerida = modo === 'oscuro'
        ? generarPaletaOscuraDesdePrincipal(palette.primary)
        : generarPaletaClaraDesdePrincipal(palette.primary);
    return {
        ...palette,
        text: ratioTexto < 4.5 ? sugerida.text : palette.text,
        text_muted: ratioMuted < 3 ? sugerida.text_muted : palette.text_muted,
        border: contrasteRelativo(palette.border, palette.background) < 2
            ? sugerida.border
            : palette.border,
        surface: modo === 'oscuro' &&
            luminanciaRelativa(palette.surface) > luminanciaRelativa(palette.background) + 0.35
            ? sugerida.surface
            : palette.surface,
    };
}
/** Estados, mesas y acentos derivados del tema (claro u oscuro). */
function derivarColoresSemanticos(palette, modo = modoPaletaVisual(palette)) {
    const brand = parseHex(palette.primary);
    const brandH = brand ? rgbToHsl(brand.r, brand.g, brand.b).h : 12;
    const oscuro = modo === 'oscuro';
    const infoH = brandH >= 160 && brandH <= 260
        ? (brandH + 12) % 360
        : (brandH + 205) % 360;
    const success = hslToHex(142, oscuro ? 36 : 44, oscuro ? 50 : 42);
    const successDark = hslToHex(142, oscuro ? 40 : 46, oscuro ? 40 : 32);
    const successLight = oscuro
        ? hslToHex(142, 28, 20)
        : hslToHex(142, 38, 92);
    const successBorder = hslToHex(142, oscuro ? 34 : 42, oscuro ? 44 : 52);
    const successText = oscuro
        ? hslToHex(142, 42, 72)
        : hslToHex(142, 46, 32);
    const warning = hslToHex(38, oscuro ? 48 : 55, oscuro ? 52 : 50);
    const warningDark = hslToHex(38, oscuro ? 52 : 58, oscuro ? 42 : 38);
    const warningLight = oscuro
        ? hslToHex(38, 32, 18)
        : hslToHex(38, 45, 92);
    const warningBorder = hslToHex(38, oscuro ? 46 : 52, oscuro ? 46 : 54);
    const warningText = oscuro
        ? hslToHex(38, 48, 72)
        : hslToHex(38, 52, 38);
    const danger = hslToHex(0, oscuro ? 52 : 60, oscuro ? 54 : 52);
    const dangerDark = hslToHex(0, oscuro ? 56 : 62, oscuro ? 44 : 40);
    const dangerLight = oscuro ? hslToHex(0, 34, 18) : hslToHex(0, 48, 94);
    const dangerBorder = hslToHex(0, oscuro ? 50 : 58, oscuro ? 48 : 56);
    const dangerText = oscuro ? hslToHex(0, 52, 74) : hslToHex(0, 56, 40);
    const info = hslToHex(infoH, oscuro ? 32 : 36, oscuro ? 54 : 48);
    const infoDark = hslToHex(infoH, oscuro ? 36 : 40, oscuro ? 42 : 36);
    const infoLight = oscuro ? hslToHex(infoH, 24, 18) : hslToHex(infoH, 30, 94);
    const infoBorder = hslToHex(infoH, oscuro ? 30 : 34, oscuro ? 46 : 54);
    const infoText = oscuro ? hslToHex(infoH, 34, 74) : hslToHex(infoH, 38, 36);
    const cocina = mixHex(palette.secondary, palette.primary, 0.35);
    const cocinaDark = mixHex(palette.primary_dark, '#000000', 0.22);
    return {
        cocina,
        cocinaDark,
        success,
        successDark,
        successLight,
        successBorder,
        successText,
        warning,
        warningDark,
        warningLight,
        warningBorder,
        warningText,
        danger,
        dangerDark,
        dangerLight,
        dangerBorder,
        dangerText,
        info,
        infoDark,
        infoLight,
        infoBorder,
        infoText,
        mesaLibre: oscuro ? successText : successDark,
        mesaLibreBg: successLight,
        mesaLibreBorder: successBorder,
        mesaOcupada: oscuro ? dangerText : dangerDark,
        mesaOcupadaBg: dangerLight,
        mesaOcupadaBorder: dangerBorder,
        mesaReservada: oscuro ? warningText : warningDark,
        mesaReservadaBg: warningLight,
        mesaReservadaBorder: warningBorder,
        prioridadAlta: danger,
        prioridadAltaLight: dangerLight,
        prioridadAltaText: dangerText,
        prioridadBaja: warning,
        prioridadBajaLight: warningLight,
        prioridadBajaText: warningText,
        offline: palette.text_muted,
        onInfoMuted: oscuro
            ? mixHex(infoText, info, 0.42)
            : mixHex(infoLight, info, 0.55),
        onInfoSoft: oscuro
            ? mixHex(infoText, info, 0.22)
            : mixHex(infoLight, palette.surface, 0.4),
    };
}
function generarPaletaClaraDesdePrincipal(primaryHex) {
    const parsed = parseHex(primaryHex);
    if (!parsed)
        return { ...nav_app_icon_1.VISUAL_COLOR_DEFAULTS };
    const { h, s, l } = rgbToHsl(parsed.r, parsed.g, parsed.b);
    const primary = normalizePrimary(primaryHex);
    const sBrand = clamp(s, 28, 78);
    const lBrand = clamp(l, 42, 68);
    return {
        primary,
        primary_dark: hslToHex(h, clamp(sBrand * 1.05, 30, 82), clamp(lBrand - 16, 28, 52)),
        secondary: hslToHex((h + 32) % 360, clamp(sBrand * 0.92, 25, 75), clamp(lBrand + 6, 40, 72)),
        background: hslToHex(h, clamp(sBrand * 0.28, 6, 28), 97),
        background_alt: hslToHex(h, clamp(sBrand * 0.32, 8, 32), 94),
        surface: '#FFFFFF',
        text: hslToHex(h, clamp(sBrand * 0.22, 6, 22), 26),
        text_muted: hslToHex(h, clamp(sBrand * 0.18, 5, 18), 50),
        border: hslToHex(h, clamp(sBrand * 0.22, 6, 26), 90),
    };
}
function generarPaletaOscuraDesdePrincipal(primaryHex) {
    const parsed = parseHex(primaryHex);
    if (!parsed)
        return { ...nav_app_icon_1.VISUAL_COLOR_DEFAULTS };
    const { h, s, l } = rgbToHsl(parsed.r, parsed.g, parsed.b);
    const primary = normalizePrimary(primaryHex);
    const sBrand = clamp(s, 32, 82);
    const lBrand = clamp(l, 38, 68);
    return {
        primary,
        primary_dark: hslToHex(h, clamp(sBrand * 1.08, 34, 88), clamp(lBrand - 10, 32, 56)),
        secondary: hslToHex((h + 32) % 360, clamp(sBrand * 0.9, 28, 72), clamp(lBrand + 2, 42, 62)),
        background: hslToHex(h, clamp(sBrand * 0.38, 14, 42), 10),
        background_alt: hslToHex(h, clamp(sBrand * 0.4, 16, 44), 14),
        surface: hslToHex(h, clamp(sBrand * 0.32, 12, 38), 18),
        text: hslToHex(h, clamp(sBrand * 0.14, 4, 18), 93),
        text_muted: hslToHex(h, clamp(sBrand * 0.12, 4, 16), 68),
        border: hslToHex(h, clamp(sBrand * 0.28, 10, 34), 28),
    };
}
function generarSugerenciasTemaDesdePrincipal(primaryHex) {
    return {
        claro: generarPaletaClaraDesdePrincipal(primaryHex),
        oscuro: generarPaletaOscuraDesdePrincipal(primaryHex),
    };
}
/** @deprecated Usar generarPaletaClaraDesdePrincipal */
function generarPaletaDesdePrincipal(primaryHex) {
    return generarPaletaClaraDesdePrincipal(primaryHex);
}
const preset = (id, nombre, descripcion, muestra) => {
    const tema = generarSugerenciasTemaDesdePrincipal(muestra);
    return { id, nombre, descripcion, muestra, claro: tema.claro, oscuro: tema.oscuro };
};
/** Galería de temas listos para aplicar en personalización visual. */
exports.PALETAS_PREDISENADAS = [
    preset('drewrest', 'DrewRest', 'Azul claro de fábrica', '#82B5D6'),
    preset('terracota', 'Terracota', 'Cálido y acogedor', '#C47A72'),
    preset('profesional', 'Corporativo', 'Azul sobrio para operación', '#4A6FA5'),
    preset('bosque', 'Bosque', 'Verde natural y fresco', '#3D7A5F'),
    preset('oceano', 'Océano', 'Azul profundo costero', '#2B7A9B'),
    preset('vino', 'Vino', 'Borgoña elegante de barra', '#7B3F61'),
    preset('cafe', 'Café', 'Marrón tostado de cafetería', '#8B5E3C'),
    preset('limon', 'Limón', 'Verde lima vibrante', '#8FA82E'),
    preset('lavanda', 'Lavanda', 'Púrpura suave', '#7B68B8'),
    preset('coral', 'Coral', 'Coral cálido de terraza', '#E07A5F'),
    preset('menta', 'Menta', 'Verde agua relajante', '#4DB6AC'),
    preset('grafito', 'Grafito', 'Gris azulado moderno', '#5C6370'),
    preset('rosa', 'Rosa pastel', 'Rosa suave de repostería', '#D4849A'),
    preset('dorado', 'Dorado', 'Dorado premium', '#C9A227'),
    preset('cielo', 'Cielo', 'Azul cielo despejado', '#5B9BD5'),
    preset('berenjena', 'Berenjena', 'Púrpura oscuro sofisticado', '#6B4E71'),
    preset('carbon', 'Carbón', 'Neutro oscuro elegante', '#4A5568'),
    preset('naranja', 'Naranja', 'Energía de comida rápida', '#E8913A'),
];
