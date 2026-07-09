"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CATEGORIA_MENU_ICON_IDS = exports.CATEGORIA_MENU_ICONOS = exports.CATEGORIA_MENU_ICON_CATEGORIAS = void 0;
exports.esIconoCategoriaMenuValido = esIconoCategoriaMenuValido;
exports.inferirIconoCategoriaDesdeNombre = inferirIconoCategoriaDesdeNombre;
exports.normalizarIconoMenuGuardado = normalizarIconoMenuGuardado;
exports.resolverIconoCategoriaMenu = resolverIconoCategoriaMenu;
/**
 * Iconos Material Community Icons para categorías del menú.
 * Los ids deben existir en @expo/vector-icons/MaterialCommunityIcons.
 */
exports.CATEGORIA_MENU_ICON_CATEGORIAS = [
    {
        id: 'general',
        titulo: 'General',
        iconos: [
            { id: 'food-outline', label: 'Comida general' },
            { id: 'silverware-fork-knife', label: 'Entrada' },
            { id: 'tray-full', label: 'Para compartir' },
            { id: 'human-child', label: 'Menú infantil' },
            { id: 'food-takeout-box-outline', label: 'Empaque / llevar' },
            { id: 'room-service-outline', label: 'Servicio a mesa' },
            { id: 'table-furniture', label: 'Mesa servida' },
            { id: 'chef-hat', label: 'Especial del chef' },
            { id: 'star-outline', label: 'Recomendado' },
        ],
    },
    {
        id: 'carnes',
        titulo: 'Carnes y pescado',
        iconos: [
            { id: 'grill-outline', label: 'Plato / parrilla' },
            { id: 'food-steak', label: 'Res / carne' },
            { id: 'food-drumstick-outline', label: 'Pollo' },
            { id: 'pig', label: 'Cerdo' },
            { id: 'fish', label: 'Pescado' },
            { id: 'jellyfish', label: 'Camarón / marisco' },
            { id: 'food-turkey', label: 'Pavo / ave' },
            { id: 'sausage', label: 'Cerdo / tocino' },
            { id: 'food-hot-dog', label: 'Salchicha' },
            { id: 'jellyfish-outline', label: 'Langosta / mariscos' },
            { id: 'anchor', label: 'Calamar / mar' },
        ],
    },
    {
        id: 'platos',
        titulo: 'Platos y acompañamientos',
        iconos: [
            { id: 'pizza', label: 'Pizza' },
            { id: 'noodles', label: 'Pasta' },
            { id: 'rice', label: 'Arroz' },
            { id: 'taco', label: 'Tacos' },
            { id: 'hamburger', label: 'Hamburguesa' },
            { id: 'bowl-mix-outline', label: 'Ensalada' },
            { id: 'egg-fried', label: 'Huevos' },
            { id: 'pot-steam-outline', label: 'Sopa' },
            { id: 'bread-slice-outline', label: 'Pan' },
            { id: 'cheese', label: 'Queso' },
            { id: 'french-fries', label: 'Papas / fritos' },
            { id: 'corn', label: 'Maíz / mazorca' },
            { id: 'mushroom-outline', label: 'Hongos' },
            { id: 'carrot', label: 'Verduras' },
            { id: 'pasta', label: 'Pasta italiana' },
            { id: 'baguette', label: 'Baguette' },
            { id: 'food-variant', label: 'Empanada / relleno' },
            { id: 'food-croissant', label: 'Wrap / burrito' },
        ],
    },
    {
        id: 'bebidas',
        titulo: 'Bebidas',
        iconos: [
            { id: 'cup-water', label: 'Bebida' },
            { id: 'bottle-soda-outline', label: 'Gaseosa' },
            { id: 'beer-outline', label: 'Cerveza' },
            { id: 'glass-wine', label: 'Vino' },
            { id: 'coffee', label: 'Café' },
            { id: 'tea-outline', label: 'Té' },
            { id: 'glass-cocktail', label: 'Cóctel' },
            { id: 'bottle-wine-outline', label: 'Botella' },
            { id: 'cup', label: 'Taza / café' },
            { id: 'glass-mug-variant', label: 'Jarra / cerveza' },
            { id: 'bottle-soda-classic-outline', label: 'Refresco clásico' },
            { id: 'fruit-grapes-outline', label: 'Jugo / uvas' },
            { id: 'barley', label: 'Malta / cerveza artesanal' },
            { id: 'water', label: 'Agua' },
            { id: 'cup-off-outline', label: 'Sin alcohol' },
        ],
    },
    {
        id: 'postres',
        titulo: 'Postres y dulces',
        iconos: [
            { id: 'ice-cream', label: 'Helado' },
            { id: 'cake-variant', label: 'Postre' },
            { id: 'fruit-cherries', label: 'Fruta' },
            { id: 'cookie', label: 'Galleta' },
            { id: 'cupcake', label: 'Cupcake' },
            { id: 'candycane', label: 'Dulce' },
            { id: 'candy-outline', label: 'Chocolate' },
            { id: 'ice-pop', label: 'Paleta' },
            { id: 'cake-layered', label: 'Torta' },
            { id: 'bee-flower', label: 'Miel / panela' },
        ],
    },
    {
        id: 'sopas',
        titulo: 'Sopas y caldos',
        iconos: [
            { id: 'bowl-outline', label: 'Sopa / bowl' },
            { id: 'bowl-mix-outline', label: 'Caldo' },
            { id: 'pot-mix-outline', label: 'Olla / guiso' },
            { id: 'kettle-steam-outline', label: 'Caliente / infusión' },
        ],
    },
    {
        id: 'snacks',
        titulo: 'Snacks y extras',
        iconos: [
            { id: 'popcorn', label: 'Snack' },
            { id: 'peanut-outline', label: 'Frutos secos' },
            { id: 'seed-outline', label: 'Granos / semillas' },
            { id: 'food-apple-outline', label: 'Fruta fresca' },
            { id: 'chili-hot', label: 'Picante' },
            { id: 'shaker-outline', label: 'Condimentos' },
            { id: 'bottle-tonic-plus-outline', label: 'Salsa / aderezo' },
        ],
    },
    {
        id: 'internacional',
        titulo: 'Cocina internacional',
        iconos: [
            { id: 'food-variant', label: 'Plato variado' },
            { id: 'noodles', label: 'Sushi / oriental' },
            { id: 'taco', label: 'Mexicano' },
            { id: 'baguette', label: 'Europeo' },
            { id: 'rice', label: 'Arroz oriental' },
        ],
    },
];
function flattenCategoriaIconCatalog() {
    const seen = new Set();
    const out = [];
    for (const cat of exports.CATEGORIA_MENU_ICON_CATEGORIAS) {
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
    if (n.includes('bebida'))
        return 'cup-water';
    if (n.includes('café') || n.includes('cafe'))
        return 'coffee';
    if (n.includes('té') || n.includes('te '))
        return 'tea-outline';
    if (n.includes('vino'))
        return 'glass-wine';
    if (n.includes('cóctel') || n.includes('coctel'))
        return 'glass-cocktail';
    if (n.includes('postre') || n.includes('dulce'))
        return 'cake-variant';
    if (n.includes('helado'))
        return 'ice-cream';
    if (n.includes('fruta'))
        return 'fruit-cherries';
    if (n.includes('galleta') || n.includes('cookie'))
        return 'cookie';
    if (n.includes('empaque') || n.includes('llevar'))
        return 'food-takeout-box-outline';
    if (n.includes('infantil'))
        return 'human-child';
    if (n.includes('compartir') || n.includes('picada'))
        return 'tray-full';
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
    if (n.includes('pescad') || n.includes('marisc') || n.includes('camar'))
        return 'fish';
    if (n.includes('cerdo') || n.includes('costilla') || n.includes('bondiola'))
        return 'pig';
    if (n.includes('pollo') || n.includes('pechuga') || n.includes('nugget'))
        return 'food-drumstick-outline';
    if (n.includes('res') || n.includes('mixto') || n.includes('parrillada'))
        return 'food-steak';
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
