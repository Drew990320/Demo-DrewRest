"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEGACY_VISUAL_COLOR_DEFAULTS = exports.VISUAL_COLOR_DEFAULTS = exports.VISUAL_COLOR_KEYS = exports.NAV_ICON_DEFAULTS = exports.NAV_ICON_KEYS = exports.NAV_APP_ICONOS = exports.NAV_APP_ICON_CATEGORIAS = void 0;
exports.esNavAppIconValido = esNavAppIconValido;
exports.resolverIconoNav = resolverIconoNav;
exports.esPaletaVisualLegacy = esPaletaVisualLegacy;
exports.coloresVisualesSinConfigurar = coloresVisualesSinConfigurar;
exports.esColorHexValido = esColorHexValido;
exports.resolverColorVisual = resolverColorVisual;
/**
 * Iconos Ionicons configurables para la barra de navegación y panel admin.
 * Agrupados por tema visual para el selector de personalización.
 */
exports.NAV_APP_ICON_CATEGORIAS = [
    {
        id: 'lugares',
        titulo: 'Mesas y lugares',
        iconos: [
            { id: 'grid-outline', label: 'Cuadrícula / mesas' },
            { id: 'restaurant-outline', label: 'Mesa / restaurante' },
            { id: 'home-outline', label: 'Inicio' },
            { id: 'storefront-outline', label: 'Mostrador / tienda' },
            { id: 'business-outline', label: 'Negocio' },
            { id: 'map-outline', label: 'Mapa' },
            { id: 'location-outline', label: 'Ubicación' },
            { id: 'layers-outline', label: 'Zonas / plantas' },
            { id: 'pin-outline', label: 'Pin de mesa' },
            { id: 'compass-outline', label: 'Terraza / exterior' },
            { id: 'globe-outline', label: 'Sucursal / red' },
            { id: 'tablet-portrait-outline', label: 'Tablet / POS' },
            { id: 'desktop-outline', label: 'Escritorio / caja' },
            { id: 'tv-outline', label: 'Pantalla / barra' },
        ],
    },
    {
        id: 'pedidos',
        titulo: 'Pedidos y ventas',
        iconos: [
            { id: 'list-outline', label: 'Lista / pedidos' },
            { id: 'bag-check-outline', label: 'Para llevar' },
            { id: 'cart-outline', label: 'Carrito' },
            { id: 'receipt-outline', label: 'Recibo' },
            { id: 'clipboard-outline', label: 'Comanda' },
            { id: 'document-text-outline', label: 'Documento' },
            { id: 'print-outline', label: 'Imprimir' },
            { id: 'basket-outline', label: 'Canasta / pedido' },
            { id: 'ticket-outline', label: 'Ticket' },
            { id: 'reader-outline', label: 'Lector / comanda' },
            { id: 'albums-outline', label: 'Varios pedidos' },
            { id: 'file-tray-full-outline', label: 'Bandeja de pedidos' },
            { id: 'send-outline', label: 'Enviar a cocina' },
            { id: 'play-circle-outline', label: 'Iniciar pedido' },
            { id: 'hourglass-outline', label: 'En espera' },
            { id: 'timer-outline', label: 'Tiempo de pedido' },
            { id: 'checkbox-outline', label: 'Selección múltiple' },
            { id: 'swap-horizontal-outline', label: 'Transferir pedido' },
        ],
    },
    {
        id: 'comida',
        titulo: 'Comida y bebida',
        iconos: [
            { id: 'fast-food-outline', label: 'Menú comida' },
            { id: 'bonfire-outline', label: 'Cocina / fuego' },
            { id: 'wine-outline', label: 'Bebidas' },
            { id: 'cafe-outline', label: 'Café' },
            { id: 'pizza-outline', label: 'Pizza' },
            { id: 'beer-outline', label: 'Cerveza' },
            { id: 'fish-outline', label: 'Pescado' },
            { id: 'leaf-outline', label: 'Vegetariano' },
            { id: 'flame-outline', label: 'Plato caliente' },
            { id: 'nutrition-outline', label: 'Menú saludable' },
            { id: 'ice-cream-outline', label: 'Helado / postre' },
            { id: 'water-outline', label: 'Agua' },
            { id: 'egg-outline', label: 'Desayuno / huevos' },
            { id: 'restaurant', label: 'Restaurante (relleno)' },
            { id: 'rose-outline', label: 'Vino / barra' },
            { id: 'cube-outline', label: 'Empaque / porción' },
            { id: 'snow-outline', label: 'Frío / congelados' },
            { id: 'sunny-outline', label: 'Plato del día' },
        ],
    },
    {
        id: 'personas',
        titulo: 'Personas y equipo',
        iconos: [
            { id: 'people-outline', label: 'Personas / ayuda' },
            { id: 'person-circle-outline', label: 'Usuario' },
            { id: 'person-add-outline', label: 'Agregar persona' },
            { id: 'hand-left-outline', label: 'Ayuda / mano' },
            { id: 'chatbubbles-outline', label: 'Mensajes' },
            { id: 'notifications-outline', label: 'Avisos' },
            { id: 'people-circle-outline', label: 'Equipo / grupo' },
            { id: 'shirt-outline', label: 'Personal / uniforme' },
            { id: 'id-card-outline', label: 'Identificación' },
            { id: 'megaphone-outline', label: 'Llamar / avisar' },
            { id: 'headset-outline', label: 'Soporte / atención' },
            { id: 'call-outline', label: 'Teléfono' },
            { id: 'walk-outline', label: 'Mesero en sala' },
            { id: 'happy-outline', label: 'Cliente satisfecho' },
        ],
    },
    {
        id: 'dinero',
        titulo: 'Dinero y caja',
        iconos: [
            { id: 'cash-outline', label: 'Cobrar / efectivo' },
            { id: 'wallet-outline', label: 'Billetera / turno' },
            { id: 'stats-chart-outline', label: 'Caja / resumen' },
            { id: 'card-outline', label: 'Tarjeta' },
            { id: 'calculator-outline', label: 'Calculadora' },
            { id: 'trending-up-outline', label: 'Ingresos' },
            { id: 'pricetag-outline', label: 'Precio / etiqueta' },
            { id: 'pricetags-outline', label: 'Promociones' },
            { id: 'bar-chart-outline', label: 'Reporte de ventas' },
            { id: 'pie-chart-outline', label: 'Distribución / caja' },
            { id: 'gift-outline', label: 'Cortesía / regalo' },
            { id: 'logo-bitcoin', label: 'Pago digital' },
            { id: 'receipt', label: 'Factura (relleno)' },
        ],
    },
    {
        id: 'admin',
        titulo: 'Configuración y admin',
        iconos: [
            { id: 'settings-outline', label: 'Configuración' },
            { id: 'shield-checkmark-outline', label: 'Permisos' },
            { id: 'phone-portrait-outline', label: 'Móvil' },
            { id: 'book-outline', label: 'Libro / menú' },
            { id: 'calendar-outline', label: 'Calendario' },
            { id: 'color-palette-outline', label: 'Paleta / visual' },
            { id: 'build-outline', label: 'Herramientas' },
            { id: 'key-outline', label: 'Acceso / llave' },
            { id: 'lock-closed-outline', label: 'Bloqueado' },
            { id: 'cloud-outline', label: 'Nube / respaldo' },
            { id: 'server-outline', label: 'Servidor' },
            { id: 'wifi-outline', label: 'Red Wi‑Fi' },
            { id: 'bluetooth-outline', label: 'Bluetooth / impresora' },
            { id: 'folder-outline', label: 'Carpeta / archivos' },
            { id: 'document-outline', label: 'Documento admin' },
            { id: 'hammer-outline', label: 'Mantenimiento' },
            { id: 'options-outline', label: 'Opciones avanzadas' },
            { id: 'toggle-outline', label: 'Interruptores' },
            { id: 'scan-outline', label: 'Escanear' },
            { id: 'qr-code-outline', label: 'Código QR' },
        ],
    },
    {
        id: 'navegacion',
        titulo: 'Navegación general',
        iconos: [
            { id: 'ellipsis-horizontal', label: 'Más opciones' },
            { id: 'log-out-outline', label: 'Cerrar sesión' },
            { id: 'menu-outline', label: 'Menú' },
            { id: 'apps-outline', label: 'Aplicaciones' },
            { id: 'navigate-outline', label: 'Navegar' },
            { id: 'arrow-back-outline', label: 'Volver' },
            { id: 'star-outline', label: 'Destacado' },
            { id: 'time-outline', label: 'Tiempo / horario' },
            { id: 'today-outline', label: 'Hoy' },
            { id: 'help-circle-outline', label: 'Ayuda' },
            { id: 'information-circle-outline', label: 'Información' },
            { id: 'search-outline', label: 'Buscar' },
            { id: 'filter-outline', label: 'Filtrar' },
            { id: 'refresh-outline', label: 'Actualizar' },
            { id: 'sync-outline', label: 'Sincronizar' },
            { id: 'add-circle-outline', label: 'Agregar' },
            { id: 'remove-circle-outline', label: 'Quitar' },
            { id: 'create-outline', label: 'Editar' },
            { id: 'pencil-outline', label: 'Lápiz / editar' },
            { id: 'save-outline', label: 'Guardar' },
            { id: 'close-outline', label: 'Cerrar / cancelar' },
            { id: 'checkmark-outline', label: 'Confirmar' },
            { id: 'arrow-forward-circle-outline', label: 'Ir adelante' },
            { id: 'log-in-outline', label: 'Entrar' },
            { id: 'trash-outline', label: 'Eliminar' },
            { id: 'share-outline', label: 'Compartir' },
            { id: 'download-outline', label: 'Descargar' },
            { id: 'cloud-upload-outline', label: 'Subir' },
            { id: 'copy-outline', label: 'Copiar' },
            { id: 'bookmark-outline', label: 'Marcador' },
            { id: 'flag-outline', label: 'Marcar / prioridad' },
            { id: 'eye-outline', label: 'Ver' },
            { id: 'eye-off-outline', label: 'Ocultar' },
            { id: 'heart-outline', label: 'Favorito' },
            { id: 'chevron-forward-outline', label: 'Siguiente' },
            { id: 'reorder-three-outline', label: 'Reordenar' },
        ],
    },
    {
        id: 'estado',
        titulo: 'Estado y alertas',
        iconos: [
            { id: 'checkmark-circle-outline', label: 'Listo / confirmado' },
            { id: 'close-circle-outline', label: 'Cancelar / cerrar' },
            { id: 'alert-circle-outline', label: 'Alerta' },
            { id: 'warning-outline', label: 'Advertencia' },
            { id: 'ban-outline', label: 'Prohibido / bloqueado' },
            { id: 'shield-outline', label: 'Protección' },
            { id: 'thumbs-up-outline', label: 'Aprobado' },
            { id: 'thumbs-down-outline', label: 'Rechazado' },
            { id: 'pulse-outline', label: 'Actividad en vivo' },
            { id: 'alarm-outline', label: 'Alarma / recordatorio' },
            { id: 'bulb-outline', label: 'Idea / sugerencia' },
            { id: 'flash-outline', label: 'Urgente / rápido' },
        ],
    },
    {
        id: 'entrega',
        titulo: 'Entrega y domicilio',
        iconos: [
            { id: 'bicycle-outline', label: 'Domicilio / bici' },
            { id: 'car-outline', label: 'Entrega en auto' },
            { id: 'bus-outline', label: 'Ruta / reparto' },
            { id: 'airplane-outline', label: 'Express' },
            { id: 'boat-outline', label: 'Mar / costa' },
            { id: 'trail-sign-outline', label: 'Ruta de entrega' },
            { id: 'archive-outline', label: 'Paquete / empaque' },
        ],
    },
    {
        id: 'contabilidad',
        titulo: 'Contabilidad y finanzas',
        iconos: [
            { id: 'calculator-outline', label: 'Contabilidad' },
            { id: 'journal-outline', label: 'Libro diario' },
            { id: 'documents-outline', label: 'Documentos contables' },
            { id: 'analytics-outline', label: 'Análisis financiero' },
            { id: 'funnel-outline', label: 'Flujo / filtro' },
            { id: 'scale-outline', label: 'Balance / equilibrio' },
            { id: 'newspaper-outline', label: 'Reporte / prensa' },
            { id: 'swap-vertical-outline', label: 'Movimiento contable' },
            { id: 'file-tray-outline', label: 'Bandeja documentos' },
            { id: 'document-lock-outline', label: 'Documento cerrado' },
            { id: 'contract-outline', label: 'Contrato / acuerdo' },
            { id: 'link-outline', label: 'Vincular cuenta' },
            { id: 'attach-outline', label: 'Adjunto / soporte' },
            { id: 'mail-outline', label: 'Correo factura' },
            { id: 'trending-down-outline', label: 'Egreso / gasto' },
            { id: 'logo-usd', label: 'Dólares' },
            { id: 'logo-euro', label: 'Euros' },
            { id: 'card-outline', label: 'Tarjeta / crédito' },
            { id: 'wallet-outline', label: 'Cartera / pagos' },
            { id: 'receipt-outline', label: 'Recibo compra' },
        ],
    },
    {
        id: 'inventario_ops',
        titulo: 'Inventario y bodega',
        iconos: [
            { id: 'cube-outline', label: 'Inventario / caja' },
            { id: 'file-tray-stacked-outline', label: 'Stock apilado' },
            { id: 'bag-handle-outline', label: 'Bolsa insumos' },
            { id: 'barcode-outline', label: 'Código de barras' },
            { id: 'beaker-outline', label: 'Laboratorio / medida' },
            { id: 'flask-outline', label: 'Insumo líquido' },
            { id: 'thermometer-outline', label: 'Temperatura / frío' },
            { id: 'hardware-chip-outline', label: 'Equipo / sensor' },
            { id: 'extension-puzzle-outline', label: 'Pieza / repuesto' },
            { id: 'git-network-outline', label: 'Red de suministro' },
            { id: 'construct-outline', label: 'Mantenimiento' },
            { id: 'wrench-outline', label: 'Herramienta' },
            { id: 'brush-outline', label: 'Limpieza' },
            { id: 'color-filter-outline', label: 'Clasificación' },
            { id: 'layers-outline', label: 'Niveles de stock' },
            { id: 'albums-outline', label: 'Lotes / grupos' },
            { id: 'push-outline', label: 'Despacho / salida' },
            { id: 'download-outline', label: 'Entrada mercancía' },
            { id: 'cloud-download-outline', label: 'Recepción nube' },
            { id: 'trail-sign-outline', label: 'Ruta interna' },
        ],
    },
    {
        id: 'cocina_ops',
        titulo: 'Cocina y producción',
        iconos: [
            { id: 'bonfire-outline', label: 'Cocina / brasas' },
            { id: 'flame-outline', label: 'Plancha / calor' },
            { id: 'cut-outline', label: 'Corte / porción' },
            { id: 'color-wand-outline', label: 'Presentación / emplatado' },
            { id: 'speedometer-outline', label: 'Ritmo cocina' },
            { id: 'medkit-outline', label: 'Higiene / BPM' },
            { id: 'hand-right-outline', label: 'Servicio mano' },
            { id: 'moon-outline', label: 'Turno noche' },
            { id: 'sunny-outline', label: 'Turno día' },
            { id: 'rainy-outline', label: 'Sopa / caldo' },
            { id: 'umbrella-outline', label: 'Cubierto / lluvia' },
            { id: 'telescope-outline', label: 'Especial del chef' },
            { id: 'rocket-outline', label: 'Rápido / express' },
            { id: 'podium-outline', label: 'Estación cocina' },
            { id: 'easel-outline', label: 'Tabla preparación' },
            { id: 'pizza-outline', label: 'Pizza / horno' },
            { id: 'fish-outline', label: 'Pescado' },
            { id: 'egg-outline', label: 'Huevos / desayuno' },
            { id: 'ice-cream-outline', label: 'Postres / frío' },
            { id: 'cafe-outline', label: 'Cafetería' },
        ],
    },
    {
        id: 'marketing',
        titulo: 'Marketing y fidelización',
        iconos: [
            { id: 'star-outline', label: 'Destacado / VIP' },
            { id: 'gift-outline', label: 'Regalo / cortesía' },
            { id: 'heart-outline', label: 'Fidelización' },
            { id: 'trophy-outline', label: 'Premio / reto' },
            { id: 'medal-outline', label: 'Cliente frecuente' },
            { id: 'diamond-outline', label: 'Premium' },
            { id: 'balloon-outline', label: 'Celebración' },
            { id: 'sparkles-outline', label: 'Novedad / promo' },
            { id: 'share-social-outline', label: 'Redes sociales' },
            { id: 'chatbubble-ellipses-outline', label: 'Comentarios' },
            { id: 'megaphone-outline', label: 'Anuncio' },
            { id: 'ticket-outline', label: 'Cupón / ticket' },
            { id: 'ribbon-outline', label: 'Campaña' },
            { id: 'rose-outline', label: 'Bar / vino' },
            { id: 'happy-outline', label: 'Cliente feliz' },
            { id: 'thumbs-up-outline', label: 'Recomendado' },
            { id: 'earth-outline', label: 'Marca global' },
            { id: 'videocam-outline', label: 'Video / stories' },
            { id: 'musical-notes-outline', label: 'Ambiente / música' },
            { id: 'images-outline', label: 'Galería fotos' },
        ],
    },
];
function flattenNavIconCatalog() {
    const seen = new Set();
    const out = [];
    for (const cat of exports.NAV_APP_ICON_CATEGORIAS) {
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
exports.NAV_APP_ICONOS = flattenNavIconCatalog();
exports.NAV_ICON_KEYS = [
    'mesas',
    'pedidos',
    'mostrador',
    'para_llevar',
    'ayuda',
    'cocina',
    'caja',
    'mas',
    'cuenta',
    'mesa',
    'menu',
    'cobrar',
    'usuarios',
    'editar_menu',
    'categorias',
    'mesas_admin',
    'descuentos_promociones',
    'creditos',
    'inventario',
    'contabilidad',
    'configuracion',
    'conexion',
    'permisos',
    'turno',
    'personalizacion',
];
exports.NAV_ICON_DEFAULTS = {
    mesas: 'grid-outline',
    pedidos: 'list-outline',
    mostrador: 'storefront-outline',
    para_llevar: 'bag-check-outline',
    ayuda: 'people-outline',
    cocina: 'bonfire-outline',
    caja: 'stats-chart-outline',
    mas: 'ellipsis-horizontal',
    cuenta: 'log-out-outline',
    mesa: 'restaurant-outline',
    menu: 'fast-food-outline',
    cobrar: 'cash-outline',
    usuarios: 'person-circle-outline',
    editar_menu: 'book-outline',
    categorias: 'calendar-outline',
    mesas_admin: 'grid-outline',
    descuentos_promociones: 'pricetag-outline',
    creditos: 'card-outline',
    inventario: 'cube-outline',
    contabilidad: 'calculator-outline',
    configuracion: 'settings-outline',
    conexion: 'phone-portrait-outline',
    permisos: 'shield-checkmark-outline',
    turno: 'wallet-outline',
    personalizacion: 'color-palette-outline',
};
const ICON_SET = new Set(exports.NAV_APP_ICONOS.map((i) => i.id));
function esNavAppIconValido(icono) {
    return typeof icono === 'string' && ICON_SET.has(icono);
}
function resolverIconoNav(key, guardado) {
    if (esNavAppIconValido(guardado))
        return guardado;
    return exports.NAV_ICON_DEFAULTS[key];
}
exports.VISUAL_COLOR_KEYS = [
    'primary',
    'primary_dark',
    'secondary',
    'background',
    'background_alt',
    'surface',
    'text',
    'text_muted',
    'border',
];
exports.VISUAL_COLOR_DEFAULTS = {
    primary: '#82B5D6',
    primary_dark: '#5E96B8',
    secondary: '#A3C9E3',
    background: '#EDF3FA',
    background_alt: '#E4ECF5',
    surface: '#FFFFFF',
    text: '#3D4F63',
    text_muted: '#6B7D91',
    border: '#CDD9E8',
};
/** Paleta terracota original de DrewRest (para migrar instalaciones existentes). */
exports.LEGACY_VISUAL_COLOR_DEFAULTS = {
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
function normalizarHexVisual(hex) {
    return hex.trim().toUpperCase();
}
function esPaletaVisualLegacy(palette) {
    return exports.VISUAL_COLOR_KEYS.every((key) => normalizarHexVisual(palette[key]) ===
        normalizarHexVisual(exports.LEGACY_VISUAL_COLOR_DEFAULTS[key]));
}
function coloresVisualesSinConfigurar(stored) {
    return exports.VISUAL_COLOR_KEYS.every((key) => {
        const value = stored[key];
        return value == null || !esColorHexValido(value);
    });
}
function esColorHexValido(color) {
    return typeof color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(color.trim());
}
function resolverColorVisual(key, guardado) {
    if (guardado != null && esColorHexValido(guardado))
        return guardado.trim();
    return exports.VISUAL_COLOR_DEFAULTS[key];
}
