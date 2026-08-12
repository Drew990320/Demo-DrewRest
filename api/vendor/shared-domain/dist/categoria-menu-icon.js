"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CATEGORIA_MENU_ICON_IDS = exports.CATEGORIA_MENU_ICONOS = exports.CATEGORIA_MENU_ICON_CATEGORIAS = void 0;
exports.esIconoCategoriaMenuValido = esIconoCategoriaMenuValido;
exports.inferirIconoCategoriaDesdeNombre = inferirIconoCategoriaDesdeNombre;
exports.normalizarIconoMenuGuardado = normalizarIconoMenuGuardado;
exports.resolverIconoCategoriaMenu = resolverIconoCategoriaMenu;
/**
 * Iconos Material Community Icons para categorías del menú.
 * Catálogo en categoria-menu-icon-catalog.ts (regenerable con scripts/generate-categoria-menu-icon-catalog.js).
 */
const categoria_menu_icon_catalog_1 = require("./categoria-menu-icon-catalog");
var categoria_menu_icon_catalog_2 = require("./categoria-menu-icon-catalog");
Object.defineProperty(exports, "CATEGORIA_MENU_ICON_CATEGORIAS", { enumerable: true, get: function () { return categoria_menu_icon_catalog_2.CATEGORIA_MENU_ICON_CATEGORIAS; } });
function flattenCategoriaIconCatalog() {
    const seen = new Set();
    const out = [];
    for (const cat of categoria_menu_icon_catalog_1.CATEGORIA_MENU_ICON_CATEGORIAS) {
        for (const icon of cat.iconos) {
            if (seen.has(icon.id))
                continue;
            seen.add(icon.id);
            out.push({ id: icon.id, label: icon.label });
        }
    }
    return out;
}
/** Lista plana de iconos permitidos (derivada del catálogo categorizado). */
exports.CATEGORIA_MENU_ICONOS = flattenCategoriaIconCatalog();
exports.CATEGORIA_MENU_ICON_IDS = exports.CATEGORIA_MENU_ICONOS.map((i) => i.id);
const ICON_SET = new Set(exports.CATEGORIA_MENU_ICON_IDS);
/** Iconos guardados antes de corregir el catálogo. */
const ICONOS_LEGACY = {
    salad: 'bowl-mix-outline',
    shrimp: 'jellyfish',
    bacon: 'sausage',
    lobster: 'jellyfish-outline',
    squid: 'anchor',
    dumpling: 'food-variant',
    falafel: 'food-croissant',
    chocolate: 'candy-outline',
    'birthday-cake': 'cake-layered',
    honey: 'bee-flower',
    soup: 'bowl-mix-outline',
    sushi: 'noodles',
};
function esIconoCategoriaMenuValido(icono) {
    return typeof icono === 'string' && ICON_SET.has(icono);
}
/** Sugiere icono según el nombre (cuando el admin no eligió uno). */
function inferirIconoCategoriaDesdeNombre(nombre) {
    const n = nombre.toLowerCase();
    if (n.includes('sin alcohol'))
        return 'bottle-soda-outline';
    if (n.includes('con alcohol'))
        return 'beer-outline';
    if (n.includes('arepa'))
        return 'circle-slice-8';
    if (n.includes('patac') || n.includes('patacón') || n.includes('patacon')) {
        return 'layers-outline';
    }
    if (n.includes('plátano') || n.includes('platano') || n.includes('tostón')) {
        return 'leaf';
    }
    if (n.includes('empanada'))
        return 'food-variant';
    if (n.includes('tamal') || n.includes('envuelto'))
        return 'package-variant-closed';
    if (n.includes('sancocho') || n.includes('cazuela'))
        return 'pot-steam-outline';
    if (n.includes('ajiaco') || n.includes('caldo'))
        return 'bowl-outline';
    if (n.includes('bandeja'))
        return 'tray-full';
    if (n.includes('fritanga'))
        return 'fire';
    if (n.includes('lechona') || n.includes('chichar') || n.includes('chicharr')) {
        return 'pig';
    }
    if (n.includes('buñuelo') || n.includes('bunuelo'))
        return 'pretzel';
    if (n.includes('pandebono') ||
        n.includes('almojábana') ||
        n.includes('almojabana') ||
        n.includes('panader')) {
        return 'muffin';
    }
    if (n.includes('mazorca') || n.includes('choclo'))
        return 'corn';
    if (n.includes('panela') || n.includes('aguapanela'))
        return 'bee-flower';
    if (n.includes('limonada') || n.includes('lulo') || n.includes('maracuy')) {
        return 'fruit-citrus';
    }
    if (n.includes('salchipapa') || n.includes('papas chorread'))
        return 'french-fries';
    if (n.includes('picada') || n.includes('compartir'))
        return 'tray-full';
    if (n.includes('desayuno') || n.includes('pericos'))
        return 'egg-outline';
    if (n.includes('tinto') || n.includes('café') || n.includes('cafe'))
        return 'coffee';
    if (n.includes('chocolate'))
        return 'cup';
    if (n.includes('chorizo') || n.includes('morcilla'))
        return 'sausage';
    if (n.includes('bebida'))
        return 'cup-water';
    if (n.includes('té') || n.includes('te '))
        return 'tea-outline';
    if (n.includes('vino'))
        return 'glass-wine';
    if (n.includes('cóctel') || n.includes('coctel'))
        return 'glass-cocktail';
    if (n.includes('postre') || n.includes('dulce') || n.includes('arequipe')) {
        return 'cake-variant';
    }
    if (n.includes('helado'))
        return 'ice-cream';
    if (n.includes('fruta') || n.includes('jugo'))
        return 'fruit-cherries';
    if (n.includes('galleta') || n.includes('cookie') || n.includes('oblea'))
        return 'cookie';
    if (n.includes('empaque') || n.includes('llevar'))
        return 'food-takeout-box-outline';
    if (n.includes('infantil'))
        return 'human-child';
    if (n.includes('sopa'))
        return 'pot-steam-outline';
    if (n.includes('entrada') || n.includes('adicional'))
        return 'silverware-fork-knife';
    if (n.includes('ensalada'))
        return 'bowl-mix-outline';
    if (n.includes('pizza'))
        return 'pizza';
    if (n.includes('pasta') || n.includes('espaguet'))
        return 'noodles';
    if (n.includes('arroz'))
        return 'rice';
    if (n.includes('taco'))
        return 'taco';
    if (n.includes('hamburg'))
        return 'hamburger';
    if (n.includes('pan'))
        return 'bread-slice-outline';
    if (n.includes('queso'))
        return 'cheese';
    if (n.includes('pescad') || n.includes('marisc') || n.includes('camar') || n.includes('ceviche')) {
        return 'fish';
    }
    if (n.includes('cerdo') || n.includes('costilla') || n.includes('bondiola'))
        return 'pig';
    if (n.includes('pollo') || n.includes('pechuga') || n.includes('nugget'))
        return 'food-drumstick-outline';
    if (n.includes('parrill') ||
        n.includes('asado') ||
        n.includes('res') ||
        n.includes('mixto') ||
        n.includes('parrillada')) {
        return 'food-steak';
    }
    if (n.includes('plato'))
        return 'grill-outline';
    return 'food-outline';
}
/** Normaliza un valor persistido (incluye iconos legacy como `salad`). */
function normalizarIconoMenuGuardado(raw, nombreFallback) {
    if (raw == null || raw === '') {
        return nombreFallback
            ? inferirIconoCategoriaDesdeNombre(nombreFallback)
            : null;
    }
    const id = raw.trim();
    const legacy = ICONOS_LEGACY[id];
    if (legacy)
        return legacy;
    if (esIconoCategoriaMenuValido(id))
        return id;
    return nombreFallback
        ? inferirIconoCategoriaDesdeNombre(nombreFallback)
        : null;
}
function resolverIconoCategoriaMenu(nombre, iconoGuardado) {
    return (normalizarIconoMenuGuardado(iconoGuardado, nombre) ??
        inferirIconoCategoriaDesdeNombre(nombre));
}
