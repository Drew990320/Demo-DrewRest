"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HELP_MANIFEST_DYNAMIC_TARGETS = exports.HELP_MANIFEST_TARGETS = exports.HELP_MANIFEST_SCREENS = void 0;
exports.manifestScreen = manifestScreen;
exports.manifestTarget = manifestTarget;
exports.manifestTargetIds = manifestTargetIds;
exports.expandirTargetManifest = expandirTargetManifest;
exports.manifestComoScreenDefinitions = manifestComoScreenDefinitions;
exports.senalesDesdeManifest = senalesDesdeManifest;
exports.destinoNavegacionManifest = destinoNavegacionManifest;
exports.screenSignalManifest = screenSignalManifest;
exports.HELP_MANIFEST_SCREENS = [
    { id: 'mesas_lista', moduleId: 'mesas', title: 'Mapa de mesas', prioridad: 10, patron: '/mesas$', roles: ['mesero', 'admin'], signalOnEnter: 'mesas.en_mapa', route: '/(app)/mesas', navTarget: 'nav.mesas' },
    { id: 'mesa_detalle', moduleId: 'mesas', title: 'Detalle de mesa', prioridad: 50, patron: '/mesa/\\d+', roles: ['mesero', 'admin'], signalOnEnter: 'mesa.en_detalle' },
    { id: 'pedido_menu', moduleId: 'pedidos', title: 'Menú del pedido', prioridad: 60, patron: '/pedido/\\d+/(menu|producto)', roles: ['mesero', 'admin'], signalOnEnter: 'pedido.en_menu' },
    { id: 'pedido_factura', moduleId: 'cobro', title: 'Cuenta y cobro', prioridad: 65, patron: '/pedido/\\d+/factura', roles: ['mesero', 'admin'], signalOnEnter: 'pedido.en_factura' },
    { id: 'pedido_raiz', moduleId: 'pedidos', title: 'Pedido activo', prioridad: 40, patron: '/pedido/\\d+', roles: ['mesero', 'admin'], signalOnEnter: 'pedido.en_activo' },
    { id: 'cocina', moduleId: 'cocina', title: 'Cola de cocina', prioridad: 30, patron: '/cocina', roles: ['chef', 'admin'], signalOnEnter: 'cocina.en_pantalla', route: '/(app)/cocina', navTarget: 'nav.cocina' },
    { id: 'mis_pedidos', moduleId: 'mesas', title: 'Mis pedidos', prioridad: 20, patron: '/mis-pedidos', roles: ['mesero', 'admin'], signalOnEnter: 'mis_pedidos.en_pantalla', route: '/(app)/mis-pedidos', navTarget: 'nav.pedidos' },
    { id: 'ayuda_companeros', moduleId: 'mesas', title: 'Ayuda a compañeros', prioridad: 25, patron: '/ayuda-companeros', roles: ['mesero', 'admin'], signalOnEnter: 'ayuda_companeros.en_pantalla', route: '/(app)/ayuda-companeros', navTarget: 'nav.ayuda_companeros' },
    { id: 'mostrador', moduleId: 'mesas', title: 'Mostrador', prioridad: 20, patron: '/mostrador', roles: ['mesero', 'admin'], signalOnEnter: 'mostrador.en_pantalla', route: '/(app)/mostrador', navTarget: 'nav.mostrador' },
    { id: 'para_llevar', moduleId: 'mesas', title: 'Para llevar', prioridad: 20, patron: '/para-llevar', roles: ['mesero', 'admin'], signalOnEnter: 'para_llevar.en_pantalla', route: '/(app)/para-llevar', navTarget: 'nav.para_llevar' },
    { id: 'resumen_diario', moduleId: 'cobro', title: 'Resumen', prioridad: 30, patron: '/resumen-diario', roles: ['admin', 'superadmin'], signalOnEnter: 'resumen_diario.en_pantalla', route: '/(app)/resumen-diario', navTarget: 'nav.caja' },
    { id: 'menu_admin', moduleId: 'admin_catalogo', title: 'Editar menú', prioridad: 30, patron: '/menu-admin', roles: ['admin'], signalOnEnter: 'menu_admin.en_pantalla', route: '/(app)/menu-admin', viaMoreMenu: true, moreNavTarget: 'more.menu_admin' },
    { id: 'categorias_admin', moduleId: 'admin_catalogo', title: 'Días del menú', prioridad: 30, patron: '/categorias-admin', roles: ['admin'], signalOnEnter: 'categorias_admin.en_pantalla', route: '/(app)/categorias-admin', viaMoreMenu: true, moreNavTarget: 'more.categorias_admin' },
    { id: 'descuentos', moduleId: 'admin_catalogo', title: 'Descuentos y promociones', prioridad: 30, patron: '/descuentos-promociones', roles: ['admin'], signalOnEnter: 'descuentos.en_pantalla', route: '/(app)/descuentos-promociones', viaMoreMenu: true, moreNavTarget: 'more.descuentos' },
    { id: 'mesas_admin', moduleId: 'admin_operacion', title: 'Gestionar mesas', prioridad: 30, patron: '/mesas-admin', roles: ['admin'], signalOnEnter: 'mesas_admin.en_pantalla', route: '/(app)/mesas-admin', viaMoreMenu: true, moreNavTarget: 'more.mesas_admin' },
    { id: 'lugares_mesa', moduleId: 'admin_operacion', title: 'Lugares de mesas', prioridad: 30, patron: '/lugares-mesa', roles: ['admin'], signalOnEnter: 'lugares_mesa.en_pantalla', route: '/(app)/lugares-mesa', viaMoreMenu: true, moreNavTarget: 'more.lugares_mesa' },
    { id: 'configuracion', moduleId: 'admin_operacion', title: 'Configuración', prioridad: 30, patron: '/configuracion', roles: ['admin'], signalOnEnter: 'configuracion.en_pantalla', route: '/(app)/configuracion', viaMoreMenu: true, moreNavTarget: 'more.configuracion' },
    { id: 'permisos', moduleId: 'admin_operacion', title: 'Permisos meseros', prioridad: 30, patron: '/permisos', roles: ['admin'], signalOnEnter: 'permisos.en_pantalla', route: '/(app)/permisos', viaMoreMenu: true, moreNavTarget: 'more.permisos' },
    { id: 'conexion_movil', moduleId: 'conexion_movil', title: 'Conexión móvil', prioridad: 40, patron: '/conexion-movil', roles: ['admin'], signalOnEnter: 'conexion.en_pantalla', route: '/(app)/conexion-movil', viaMoreMenu: true, moreNavTarget: 'more.conexion' },
    { id: 'personalizacion', moduleId: 'admin_operacion', title: 'Personalización visual', prioridad: 30, patron: '/personalizacion-visual', roles: ['admin'], signalOnEnter: 'personalizacion.en_pantalla', route: '/(app)/personalizacion-visual', viaMoreMenu: true, moreNavTarget: 'more.personalizacion' },
    { id: 'vista_previa_tickets', moduleId: 'admin_operacion', title: 'Vista previa tickets', prioridad: 50, patron: '/vista-previa-impresion(?:/|$)', roles: ['admin'], signalOnEnter: 'vista_previa.en_pantalla', route: '/(app)/vista-previa-impresion', viaMoreMenu: true },
    { id: 'superadmin', moduleId: 'superadmin', title: 'Panel de soporte', prioridad: 50, patron: '/superadmin(?:/|$)', roles: ['superadmin'], signalOnEnter: 'superadmin.en_pantalla', route: '/(app)/superadmin' },
    { id: 'usuarios', moduleId: 'admin_operacion', title: 'Usuarios', prioridad: 40, patron: '/usuarios(?:/|$)', roles: ['admin'], signalOnEnter: 'usuarios.en_pantalla', route: '/(app)/usuarios', viaMoreMenu: true, moreNavTarget: 'more.usuarios' },
    { id: 'inventario', moduleId: 'admin_operacion', title: 'Recursos', prioridad: 45, patron: '/(?:inventario|recursos)(?:/|$)', roles: ['admin'], signalOnEnter: 'inventario.en_pantalla', route: '/(app)/recursos', navTarget: 'nav.recursos' },
    { id: 'contabilidad', moduleId: 'cobro', title: 'Contabilidad', prioridad: 45, patron: '/contabilidad(?:/|$)', roles: ['admin'], signalOnEnter: 'contabilidad.en_pantalla', route: '/(app)/contabilidad', navTarget: 'nav.contabilidad' },
    { id: 'proveedores', moduleId: 'admin_operacion', title: 'Proveedores', prioridad: 45, patron: '/proveedores(?:/|$)', roles: ['admin'], signalOnEnter: 'proveedores.en_pantalla', route: '/(app)/proveedores' },
    { id: 'cuentas_por_pagar', moduleId: 'admin_operacion', title: 'Cuentas por pagar', prioridad: 45, patron: '/cuentas-por-pagar(?:/|$)', roles: ['admin'], signalOnEnter: 'cuentas_por_pagar.en_pantalla', route: '/(app)/cuentas-por-pagar' },
    { id: 'creditos', moduleId: 'cobro', title: 'Créditos / fiados', prioridad: 40, patron: '/creditos(?:/|$)', roles: ['admin'], signalOnEnter: 'creditos.en_pantalla', route: '/(app)/creditos', viaMoreMenu: true, moreNavTarget: 'more.creditos' },
    { id: 'meseros_operativos', moduleId: 'admin_operacion', title: 'Meseros en turno', prioridad: 40, patron: '/meseros-operativos(?:/|$)', roles: ['admin'], signalOnEnter: 'meseros_operativos.en_pantalla', route: '/(app)/meseros-operativos', viaMoreMenu: true, moreNavTarget: 'more.meseros_operativos' },
    { id: 'integracion_odoo', moduleId: 'admin_operacion', title: 'Integración Odoo', prioridad: 40, patron: '/integracion-odoo(?:/|$)', roles: ['admin'], signalOnEnter: 'integracion_odoo.en_pantalla', route: '/(app)/integracion-odoo' },
];
exports.HELP_MANIFEST_TARGETS = [
    { id: 'help.header', label: 'Ayuda y tutoriales', kind: 'help', scrollIntoView: true, relatedSignals: ['help.ayuda_visible'] },
    { id: 'help.fab', label: 'Ayuda', kind: 'help', activateOnPress: true },
    { id: 'help.hero_guia_activa', label: 'Guíame paso a paso', kind: 'help', activateOnPress: true, screenIds: ['help_hub'] },
    { id: 'nav.mesas', label: 'Mesas', kind: 'nav', activateOnPress: true, scrollIntoView: true },
    { id: 'nav.pedidos', label: 'Pedidos', kind: 'nav', activateOnPress: true, scrollIntoView: true },
    { id: 'nav.mostrador', label: 'Mostrador', kind: 'nav', activateOnPress: true },
    { id: 'nav.para_llevar', label: 'Para llevar', kind: 'nav', activateOnPress: true },
    { id: 'nav.ayuda_companeros', label: 'Ayuda', kind: 'nav', activateOnPress: true },
    { id: 'nav.cocina', label: 'Cocina', kind: 'nav', activateOnPress: true, scrollIntoView: true },
    { id: 'nav.caja', label: 'Resumen', kind: 'nav', activateOnPress: true },
    { id: 'nav.inventario', label: 'Recursos', kind: 'nav', activateOnPress: true },
    { id: 'nav.recursos', label: 'Recursos', kind: 'nav', activateOnPress: true },
    { id: 'nav.contabilidad', label: 'Contabilidad', kind: 'nav', activateOnPress: true },
    { id: 'nav.mas', label: 'Más', kind: 'nav', activateOnPress: true, relatedSignals: ['nav.mas_abierto'] },
    { id: 'nav.pedido_mesas', label: 'Mesas', kind: 'nav', activateOnPress: true, screenIds: ['pedido_menu', 'pedido_factura', 'mesa_detalle', 'pedido_raiz'] },
    { id: 'nav.pedido_mesa', label: 'Mesa', kind: 'nav', activateOnPress: true, screenIds: ['pedido_menu', 'pedido_factura', 'pedido_raiz'] },
    { id: 'nav.pedido_menu', label: 'Menú', kind: 'nav', activateOnPress: true, screenIds: ['mesa_detalle', 'pedido_factura', 'pedido_raiz'] },
    { id: 'nav.pedido_cobrar', label: 'Cobrar', kind: 'nav', activateOnPress: true, screenIds: ['pedido_menu', 'mesa_detalle', 'pedido_raiz'], relatedSignals: ['pedido.en_factura'] },
    { id: 'more.usuarios', label: 'Usuarios', kind: 'more', activateOnPress: true },
    { id: 'more.menu_admin', label: 'Editar menú', kind: 'more', activateOnPress: true },
    { id: 'more.categorias_admin', label: 'Días del menú', kind: 'more', activateOnPress: true },
    { id: 'more.lugares_mesa', label: 'Lugares de mesas', kind: 'more', activateOnPress: true },
    { id: 'more.mesas_admin', label: 'Gestionar mesas', kind: 'more', activateOnPress: true },
    { id: 'more.descuentos', label: 'Descuentos y promociones', kind: 'more', activateOnPress: true },
    { id: 'more.creditos', label: 'Créditos / fiados', kind: 'more', activateOnPress: true },
    { id: 'more.personalizacion', label: 'Personalización visual', kind: 'more', activateOnPress: true },
    { id: 'more.configuracion', label: 'Configuración', kind: 'more', activateOnPress: true },
    { id: 'more.vista_previa', label: 'Vista previa tickets POS', kind: 'more', activateOnPress: true },
    { id: 'more.conexion', label: 'Conexión móvil', kind: 'more', activateOnPress: true, relatedSignals: ['conexion.en_pantalla'] },
    { id: 'more.permisos', label: 'Permisos', kind: 'more', activateOnPress: true },
    { id: 'more.meseros_operativos', label: 'Turno y beneficios', kind: 'more', activateOnPress: true },
    { id: 'mesas.tarjeta_mesa', label: 'Tarjeta de mesa', kind: 'action', screenIds: ['mesas_lista'], activateOnPress: true, relatedSignals: ['mesa.en_detalle'] },
    { id: 'mesa.abrir_pedido', label: 'Abrir mesa', kind: 'action', screenIds: ['mesa_detalle'], activateOnPress: true, relatedSignals: ['mesa.tiene_pedido'] },
    { id: 'mesa.accion_menu', label: 'Agregar del menú', kind: 'action', screenIds: ['mesa_detalle'], activateOnPress: true, permisoMesero: 'agregar_items', relatedSignals: ['pedido.en_menu'] },
    { id: 'mesa.accion_cocina', label: 'Pasar a cocina', kind: 'action', screenIds: ['mesa_detalle'], activateOnPress: true, permisoMesero: 'enviar_cocina', relatedSignals: ['pedido.platos_en_cocina'] },
    { id: 'mesa.accion_cobrar', label: 'Cobrar / facturar', kind: 'action', screenIds: ['mesa_detalle'], activateOnPress: true, permisoMesero: 'cobrar', relatedSignals: ['pedido.en_factura'] },
    { id: 'mesa.agrupar_mesas', label: 'Agregar mesa libre', kind: 'action', screenIds: ['mesa_detalle'], activateOnPress: true, permisoMesero: 'agrupar_mesas', relatedSignals: ['mesa.mesas_agrupadas'] },
    { id: 'pedido.modos_seleccion', label: 'Modos de selección', kind: 'form', screenIds: ['pedido_menu'], scrollIntoView: true },
    { id: 'pedido.producto_tarjeta', label: 'Producto del menú', kind: 'action', screenIds: ['pedido_menu'] },
    { id: 'pedido.agregar_rapido', label: 'Agregar 1 al pedido', kind: 'action', screenIds: ['pedido_menu'], activateOnPress: true, relatedSignals: ['pedido.agrego_item'] },
    { id: 'pedido.agregar_lote', label: 'Agregar', kind: 'action', screenIds: ['pedido_menu'], activateOnPress: true, relatedSignals: ['pedido.agrego_item'] },
    { id: 'pedido.agregar_item_dinamico', label: 'Agregar producto', kind: 'action', screenIds: ['pedido_menu'], relatedSignals: ['pedido.agrego_item'] },
    { id: 'pedido.menu_categoria', label: 'Categoría del menú', kind: 'action', screenIds: ['pedido_menu'], activateOnPress: true },
    { id: 'tools.pedido_rail', label: 'PEDIDO', kind: 'rail', screenIds: ['mesa_detalle', 'pedido_menu', 'pedido_raiz'], scrollIntoView: true },
    { id: 'tools.operacion_rail', label: 'Acciones de pantalla', kind: 'rail', scrollIntoView: true },
    { id: 'inventario.agregar_item', label: 'Agregar ítem', kind: 'action', screenIds: ['inventario'], activateOnPress: true, relatedSignals: ['inventario.tiene_items'] },
    { id: 'inventario.movimiento_entrada', label: '+ Entrada', kind: 'action', screenIds: ['inventario'], activateOnPress: true },
    { id: 'vista_previa.primer_formato', label: 'Formato de ticket', kind: 'action', screenIds: ['vista_previa_tickets'] },
    { id: 'conexion.qr', label: 'Código QR', kind: 'action', screenIds: ['conexion_movil'] },
    { id: 'conexion.copiar_url', label: 'Copiar URL', kind: 'action', screenIds: ['conexion_movil'], activateOnPress: true },
];
/** Targets dinámicos: el paso referencia un alias resuelto en runtime. */
exports.HELP_MANIFEST_DYNAMIC_TARGETS = {
    'pedido.agregar_item_dinamico': ['pedido.agregar_lote', 'pedido.agregar_rapido'],
};
const screenById = new Map(exports.HELP_MANIFEST_SCREENS.map((s) => [s.id, s]));
const targetById = new Map(exports.HELP_MANIFEST_TARGETS.map((t) => [t.id, t]));
function manifestScreen(id) {
    return screenById.get(id);
}
function manifestTarget(id) {
    return targetById.get(id);
}
function manifestTargetIds() {
    return exports.HELP_MANIFEST_TARGETS.map((t) => t.id);
}
function expandirTargetManifest(targetId) {
    const dyn = exports.HELP_MANIFEST_DYNAMIC_TARGETS[targetId];
    if (dyn?.length)
        return dyn;
    return targetById.has(targetId) ? [targetId] : [];
}
/** Convierte pantallas del manifest al formato legacy de help-context. */
function manifestComoScreenDefinitions() {
    return exports.HELP_MANIFEST_SCREENS.map(({ signalOnEnter: _s, route: _r, navTarget: _n, viaMoreMenu: _v, moreNavTarget: _m, ...rest }) => rest);
}
/** Señales derivadas de rutas según el manifest. */
function senalesDesdeManifest(pathname) {
    const path = pathname.replace(/\/$/, '').replace(/^\/\([^)]+\)/, '') || '/';
    const out = {};
    for (const screen of exports.HELP_MANIFEST_SCREENS) {
        try {
            out[screen.signalOnEnter] = new RegExp(screen.patron).test(path);
        }
        catch {
            out[screen.signalOnEnter] = false;
        }
    }
    return out;
}
function destinoNavegacionManifest(screenId) {
    const s = screenById.get(screenId);
    if (!s?.route)
        return null;
    return {
        screenId: s.id,
        route: s.route,
        title: s.title,
        navTarget: s.navTarget,
        viaMoreMenu: s.viaMoreMenu,
        moreNavTarget: s.moreNavTarget,
    };
}
function screenSignalManifest(screenId) {
    return screenById.get(screenId)?.signalOnEnter;
}
