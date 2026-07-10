"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HELP_GUIDES_BY_SCREEN = exports.HELP_SCREEN_DEFINITIONS = void 0;
exports.normalizarPathnameAyuda = normalizarPathnameAyuda;
exports.resolverPantallaAyuda = resolverPantallaAyuda;
exports.guiasContextuales = guiasContextuales;
exports.guiaPrincipalContextual = guiaPrincipalContextual;
exports.moduloDePantalla = moduloDePantalla;
const help_tutorials_1 = require("./help-tutorials");
exports.HELP_SCREEN_DEFINITIONS = [
    { id: 'mesas_lista', moduleId: 'mesas', title: 'Mapa de mesas', prioridad: 10, patron: '/mesas$', roles: ['mesero', 'admin'] },
    { id: 'mesa_detalle', moduleId: 'mesas', title: 'Detalle de mesa', prioridad: 50, patron: '/mesa/\\d+', roles: ['mesero', 'admin'] },
    { id: 'pedido_menu', moduleId: 'pedidos', title: 'Menú del pedido', prioridad: 60, patron: '/pedido/\\d+/(menu|producto)', roles: ['mesero', 'admin'] },
    { id: 'pedido_factura', moduleId: 'cobro', title: 'Cuenta y cobro', prioridad: 65, patron: '/pedido/\\d+/factura', roles: ['mesero', 'admin'] },
    { id: 'pedido_raiz', moduleId: 'pedidos', title: 'Pedido activo', prioridad: 40, patron: '/pedido/\\d+', roles: ['mesero', 'admin'] },
    { id: 'cocina', moduleId: 'cocina', title: 'Cola de cocina', prioridad: 30, patron: '/cocina', roles: ['chef', 'admin'] },
    { id: 'mis_pedidos', moduleId: 'mesas', title: 'Mis pedidos', prioridad: 20, patron: '/mis-pedidos', roles: ['mesero', 'admin'] },
    { id: 'ayuda_companeros', moduleId: 'mesas', title: 'Ayuda a compañeros', prioridad: 25, patron: '/ayuda-companeros', roles: ['mesero', 'admin'] },
    { id: 'mostrador', moduleId: 'mesas', title: 'Mostrador', prioridad: 20, patron: '/mostrador', roles: ['mesero', 'admin'] },
    { id: 'para_llevar', moduleId: 'mesas', title: 'Para llevar', prioridad: 20, patron: '/para-llevar', roles: ['mesero', 'admin'] },
    { id: 'resumen_diario', moduleId: 'cobro', title: 'Resumen diario', prioridad: 30, patron: '/resumen-diario', roles: ['admin', 'superadmin'] },
    { id: 'menu_admin', moduleId: 'admin_catalogo', title: 'Editar menú', prioridad: 30, patron: '/menu-admin', roles: ['admin'] },
    { id: 'categorias_admin', moduleId: 'admin_catalogo', title: 'Días del menú', prioridad: 30, patron: '/categorias-admin', roles: ['admin'] },
    { id: 'descuentos', moduleId: 'admin_catalogo', title: 'Descuentos y promociones', prioridad: 30, patron: '/descuentos-promociones', roles: ['admin'] },
    { id: 'mesas_admin', moduleId: 'admin_operacion', title: 'Gestionar mesas', prioridad: 30, patron: '/mesas-admin', roles: ['admin'] },
    { id: 'lugares_mesa', moduleId: 'admin_operacion', title: 'Lugares de mesas', prioridad: 30, patron: '/lugares-mesa', roles: ['admin'] },
    { id: 'configuracion', moduleId: 'admin_operacion', title: 'Configuración', prioridad: 30, patron: '/configuracion', roles: ['admin'] },
    { id: 'permisos', moduleId: 'admin_operacion', title: 'Permisos meseros', prioridad: 30, patron: '/permisos', roles: ['admin'] },
    { id: 'conexion_movil', moduleId: 'conexion_movil', title: 'Conexión móvil', prioridad: 40, patron: '/conexion-movil', roles: ['admin'] },
    { id: 'personalizacion', moduleId: 'admin_operacion', title: 'Personalización visual', prioridad: 30, patron: '/personalizacion-visual', roles: ['admin'] },
    { id: 'vista_previa_tickets', moduleId: 'admin_operacion', title: 'Vista previa tickets', prioridad: 50, patron: '/vista-previa-impresion(?:/|$)', roles: ['admin'] },
    { id: 'superadmin', moduleId: 'superadmin', title: 'Panel de soporte', prioridad: 50, patron: '/superadmin(?:/|$)', roles: ['superadmin'] },
    { id: 'usuarios', moduleId: 'admin_operacion', title: 'Usuarios', prioridad: 40, patron: '/usuarios(?:/|$)', roles: ['admin'] },
    { id: 'inventario', moduleId: 'admin_operacion', title: 'Inventario interno', prioridad: 45, patron: '/inventario(?:/|$)', roles: ['admin'] },
    { id: 'contabilidad', moduleId: 'cobro', title: 'Contabilidad', prioridad: 45, patron: '/contabilidad(?:/|$)', roles: ['admin'] },
    { id: 'proveedores', moduleId: 'admin_operacion', title: 'Proveedores', prioridad: 45, patron: '/proveedores(?:/|$)', roles: ['admin'] },
    { id: 'cuentas_por_pagar', moduleId: 'admin_operacion', title: 'Cuentas por pagar', prioridad: 45, patron: '/cuentas-por-pagar(?:/|$)', roles: ['admin'] },
    { id: 'creditos', moduleId: 'cobro', title: 'Créditos / fiados', prioridad: 40, patron: '/creditos(?:/|$)', roles: ['admin'] },
    { id: 'meseros_operativos', moduleId: 'admin_operacion', title: 'Meseros en turno', prioridad: 40, patron: '/meseros-operativos(?:/|$)', roles: ['admin'] },
];
/** Guías recomendadas por pantalla (orden = prioridad de la tarea). */
exports.HELP_GUIDES_BY_SCREEN = {
    mesas_lista: ['abrir_mesa_pedido', 'leer_estado_mesas'],
    mesa_detalle: ['tomar_pedido_mesa', 'agrupar_mesas', 'enviar_cocina_mesa', 'ir_a_cobro'],
    pedido_menu: ['agregar_producto_pedido', 'enviar_cocina_pedido', 'transferir_pedido', 'agrupar_mesas'],
    pedido_factura: ['cobrar_pedido', 'cobro_parcial', 'precuenta_ticket'],
    pedido_raiz: ['agregar_producto_pedido', 'enviar_cocina_pedido'],
    cocina: ['marcar_listo_cocina', 'llamar_mesero_cocina'],
    conexion_movil: ['conexion_qr'],
    vista_previa_tickets: ['vista_previa_tickets'],
    ayuda_companeros: ['ayuda_companeros'],
    resumen_diario: ['revisar_caja_dia'],
    menu_admin: ['crear_producto_menu'],
    permisos: ['configurar_permiso_mesero'],
    configuracion: ['vista_previa_tickets'],
    inventario: ['gestionar_inventario', 'como_usar_coach'],
    contabilidad: ['como_usar_coach'],
    proveedores: ['como_usar_coach'],
    cuentas_por_pagar: ['como_usar_coach'],
    personalizacion: ['como_usar_coach'],
    superadmin: ['control_acceso_restaurante', 'como_usar_coach'],
    general: ['como_usar_coach'],
};
function tituloModulo(moduleId) {
    return help_tutorials_1.HELP_TUTORIAL_MODULES.find((m) => m.id === moduleId)?.title ?? 'DrewRest';
}
/** Normaliza rutas expo-router: `/(app)/inventario` → `/inventario`. */
function normalizarPathnameAyuda(pathname) {
    let path = pathname.replace(/\/$/, '') || '/';
    path = path.replace(/^\/\([^)]+\)/, '') || '/';
    return path || '/';
}
function resolverPantallaAyuda(pathname, rol) {
    const path = normalizarPathnameAyuda(pathname);
    let mejor = null;
    for (const def of exports.HELP_SCREEN_DEFINITIONS) {
        if (!def.roles.includes(rol))
            continue;
        try {
            const re = new RegExp(def.patron);
            if (!re.test(path))
                continue;
            if (!mejor || def.prioridad > mejor.prioridad) {
                mejor = def;
            }
        }
        catch {
            // ignore invalid pattern
        }
    }
    if (!mejor) {
        const mod = help_tutorials_1.HELP_TUTORIAL_MODULES.find((m) => m.roles.includes(rol) && m.routeHints.some((h) => path.includes(h)));
        return {
            screenId: 'general',
            moduleId: mod?.id ?? 'inicio',
            screenTitle: 'Pantalla actual',
            moduleTitle: mod?.title ?? 'Inicio',
            pathname: path,
        };
    }
    return {
        screenId: mejor.id,
        moduleId: mejor.moduleId,
        screenTitle: mejor.title,
        moduleTitle: tituloModulo(mejor.moduleId),
        pathname: path,
    };
}
function puntajeGuia(guia, pantalla, pathname) {
    let score = 0;
    const path = normalizarPathnameAyuda(pathname);
    const guiasPantalla = exports.HELP_GUIDES_BY_SCREEN[pantalla.screenId] ?? [];
    const idx = guiasPantalla.indexOf(guia.id);
    if (idx >= 0) {
        score += 1000 - idx * 50;
    }
    if (guia.screenIds?.length) {
        if (guia.screenIds.includes(pantalla.screenId)) {
            score += 80;
        }
        else if (pantalla.screenId !== 'general') {
            return 0;
        }
    }
    if (guia.moduleId === pantalla.moduleId) {
        score += 30;
    }
    if (guia.routeHints.some((h) => path.includes(h))) {
        score += 20;
    }
    return score;
}
function guiasContextuales(pathname, rol, pantalla) {
    const ctx = pantalla ?? resolverPantallaAyuda(pathname, rol);
    const path = normalizarPathnameAyuda(pathname);
    const guias = help_tutorials_1.HELP_TUTORIAL_ACTIONS.filter((g) => g.roles.includes(rol));
    return guias
        .map((g) => {
        const relevancia = puntajeGuia(g, ctx, path);
        return {
            ...g,
            relevancia,
            esPantallaActual: relevancia >= 50,
        };
    })
        .filter((g) => g.relevancia > 0)
        .sort((a, b) => b.relevancia - a.relevancia);
}
function guiaPrincipalContextual(pathname, rol) {
    const ranked = guiasContextuales(pathname, rol);
    return ranked[0] ?? null;
}
function moduloDePantalla(moduleId) {
    return help_tutorials_1.HELP_TUTORIAL_MODULES.find((m) => m.id === moduleId) ?? null;
}
