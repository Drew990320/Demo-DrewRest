"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.senalLlegadaPantalla = senalLlegadaPantalla;
exports.destinoDesdePantalla = destinoDesdePantalla;
exports.destinoModuloCoach = destinoModuloCoach;
exports.destinoAccionCoach = destinoAccionCoach;
exports.usuarioEnPantallaAyuda = usuarioEnPantallaAyuda;
exports.usuarioEnZonaTutorial = usuarioEnZonaTutorial;
exports.construirPreludioNavegacion = construirPreludioNavegacion;
exports.pasosCoachAccion = pasosCoachAccion;
exports.pasosCoachModulo = pasosCoachModulo;
exports.primaryActionModulo = primaryActionModulo;
const help_tutorials_1 = require("./help-tutorials");
const help_coach_1 = require("./help-coach");
const help_context_1 = require("./help-context");
const SCREEN_SIGNAL = {
    mesas_lista: help_coach_1.HELP_SIGNAL.mesasEnMapa,
    mesa_detalle: help_coach_1.HELP_SIGNAL.mesaEnDetalle,
    pedido_menu: help_coach_1.HELP_SIGNAL.pedidoEnMenu,
    pedido_factura: help_coach_1.HELP_SIGNAL.pedidoEnFactura,
    pedido_raiz: 'pedido.en_activo',
    cocina: 'cocina.en_pantalla',
    mis_pedidos: 'mis_pedidos.en_pantalla',
    ayuda_companeros: 'ayuda_companeros.en_pantalla',
    mostrador: 'mostrador.en_pantalla',
    para_llevar: 'para_llevar.en_pantalla',
    resumen_diario: 'resumen_diario.en_pantalla',
    menu_admin: 'menu_admin.en_pantalla',
    categorias_admin: 'categorias_admin.en_pantalla',
    descuentos: 'descuentos.en_pantalla',
    mesas_admin: 'mesas_admin.en_pantalla',
    lugares_mesa: 'lugares_mesa.en_pantalla',
    configuracion: 'configuracion.en_pantalla',
    permisos: 'permisos.en_pantalla',
    conexion_movil: help_coach_1.HELP_SIGNAL.conexionEnPantalla,
    personalizacion: 'personalizacion.en_pantalla',
    vista_previa_tickets: help_coach_1.HELP_SIGNAL.vistaPreviaEnPantalla,
    superadmin: 'superadmin.en_pantalla',
    usuarios: 'usuarios.en_pantalla',
    inventario: help_coach_1.HELP_SIGNAL.inventarioEnPantalla,
    contabilidad: 'contabilidad.en_pantalla',
    proveedores: 'proveedores.en_pantalla',
    cuentas_por_pagar: 'cuentas_por_pagar.en_pantalla',
    creditos: 'creditos.en_pantalla',
    meseros_operativos: 'meseros_operativos.en_pantalla',
};
/** Pantallas que requieren contexto (mesa/pedido); el preludio lleva al listado más cercano. */
const SCREEN_FALLBACK_ROUTE = {
    mesa_detalle: {
        screenId: 'mesas_lista',
        route: '/(app)/mesas',
        title: 'Mesas',
        navTarget: 'nav.mesas',
    },
    pedido_menu: {
        screenId: 'mesas_lista',
        route: '/(app)/mesas',
        title: 'Mesas',
        navTarget: 'nav.mesas',
    },
    pedido_factura: {
        screenId: 'mesas_lista',
        route: '/(app)/mesas',
        title: 'Mesas',
        navTarget: 'nav.mesas',
    },
    pedido_raiz: {
        screenId: 'mesas_lista',
        route: '/(app)/mesas',
        title: 'Mesas',
        navTarget: 'nav.mesas',
    },
};
const SCREEN_DESTINATIONS = {
    mesas_lista: {
        screenId: 'mesas_lista',
        route: '/(app)/mesas',
        title: 'Mesas',
        navTarget: 'nav.mesas',
    },
    cocina: {
        screenId: 'cocina',
        route: '/(app)/cocina',
        title: 'Cocina',
        navTarget: 'nav.cocina',
    },
    mis_pedidos: {
        screenId: 'mis_pedidos',
        route: '/(app)/mis-pedidos',
        title: 'Mis pedidos',
        navTarget: 'nav.pedidos',
    },
    ayuda_companeros: {
        screenId: 'ayuda_companeros',
        route: '/(app)/ayuda-companeros',
        title: 'Ayudar a compañeros',
        navTarget: 'nav.ayuda_companeros',
    },
    mostrador: {
        screenId: 'mostrador',
        route: '/(app)/mostrador',
        title: 'Mostrador',
        navTarget: 'nav.mostrador',
    },
    para_llevar: {
        screenId: 'para_llevar',
        route: '/(app)/para-llevar',
        title: 'Para llevar',
        navTarget: 'nav.para_llevar',
    },
    resumen_diario: {
        screenId: 'resumen_diario',
        route: '/(app)/resumen-diario',
        title: 'Resumen diario',
        navTarget: 'nav.caja',
    },
    inventario: {
        screenId: 'inventario',
        route: '/(app)/inventario',
        title: 'Inventario',
        navTarget: 'nav.inventario',
    },
    contabilidad: {
        screenId: 'contabilidad',
        route: '/(app)/contabilidad',
        title: 'Contabilidad',
        navTarget: 'nav.contabilidad',
    },
    superadmin: {
        screenId: 'superadmin',
        route: '/(app)/superadmin',
        title: 'Panel de soporte',
    },
    menu_admin: {
        screenId: 'menu_admin',
        route: '/(app)/menu-admin',
        title: 'Editar menú',
        viaMoreMenu: true,
        moreNavTarget: 'more.menu_admin',
    },
    categorias_admin: {
        screenId: 'categorias_admin',
        route: '/(app)/categorias-admin',
        title: 'Días del menú',
        viaMoreMenu: true,
        moreNavTarget: 'more.categorias_admin',
    },
    descuentos: {
        screenId: 'descuentos',
        route: '/(app)/descuentos-promociones',
        title: 'Descuentos y promociones',
        viaMoreMenu: true,
        moreNavTarget: 'more.descuentos',
    },
    mesas_admin: {
        screenId: 'mesas_admin',
        route: '/(app)/mesas-admin',
        title: 'Gestionar mesas',
        viaMoreMenu: true,
        moreNavTarget: 'more.mesas_admin',
    },
    lugares_mesa: {
        screenId: 'lugares_mesa',
        route: '/(app)/lugares-mesa',
        title: 'Lugares de mesas',
        viaMoreMenu: true,
        moreNavTarget: 'more.lugares_mesa',
    },
    configuracion: {
        screenId: 'configuracion',
        route: '/(app)/configuracion',
        title: 'Configuración',
        viaMoreMenu: true,
        moreNavTarget: 'more.configuracion',
    },
    permisos: {
        screenId: 'permisos',
        route: '/(app)/permisos',
        title: 'Permisos meseros',
        viaMoreMenu: true,
        moreNavTarget: 'more.permisos',
    },
    conexion_movil: {
        screenId: 'conexion_movil',
        route: '/(app)/conexion-movil',
        title: 'Conexión móvil',
        viaMoreMenu: true,
        moreNavTarget: 'more.conexion',
    },
    personalizacion: {
        screenId: 'personalizacion',
        route: '/(app)/personalizacion-visual',
        title: 'Personalización visual',
        viaMoreMenu: true,
        moreNavTarget: 'more.personalizacion',
    },
    vista_previa_tickets: {
        screenId: 'vista_previa_tickets',
        route: '/(app)/vista-previa-impresion',
        title: 'Vista previa tickets',
        viaMoreMenu: true,
        moreNavTarget: 'more.vista_previa',
    },
    usuarios: {
        screenId: 'usuarios',
        route: '/(app)/usuarios',
        title: 'Usuarios',
        viaMoreMenu: true,
        moreNavTarget: 'more.usuarios',
    },
    proveedores: {
        screenId: 'proveedores',
        route: '/(app)/proveedores',
        title: 'Proveedores',
        viaMoreMenu: true,
        moreNavTarget: 'more.proveedores',
    },
    cuentas_por_pagar: {
        screenId: 'cuentas_por_pagar',
        route: '/(app)/cuentas-por-pagar',
        title: 'Cuentas por pagar',
        viaMoreMenu: true,
        moreNavTarget: 'more.cuentas_por_pagar',
    },
    creditos: {
        screenId: 'creditos',
        route: '/(app)/creditos',
        title: 'Créditos / fiados',
        viaMoreMenu: true,
        moreNavTarget: 'more.creditos',
    },
    meseros_operativos: {
        screenId: 'meseros_operativos',
        route: '/(app)/meseros-operativos',
        title: 'Meseros en turno',
        viaMoreMenu: true,
        moreNavTarget: 'more.meseros_operativos',
    },
};
const MODULE_COACH_META = {
    inicio: {
        screenId: 'mesas_lista',
        route: '/(app)/mesas',
        navTarget: 'nav.mesas',
        title: 'Mesas',
        primaryActionId: 'como_usar_coach',
    },
    mesas: {
        screenId: 'mesas_lista',
        route: '/(app)/mesas',
        navTarget: 'nav.mesas',
        title: 'Mesas',
        primaryActionId: 'abrir_mesa_pedido',
    },
    pedidos: {
        screenId: 'mesas_lista',
        route: '/(app)/mesas',
        navTarget: 'nav.mesas',
        title: 'Mesas',
        primaryActionId: 'tomar_pedido_mesa',
    },
    cocina: {
        screenId: 'cocina',
        route: '/(app)/cocina',
        navTarget: 'nav.cocina',
        title: 'Cocina',
        primaryActionId: 'marcar_listo_cocina',
    },
    cobro: {
        primaryActionId: 'ir_a_cobro',
    },
    admin_catalogo: {
        screenId: 'menu_admin',
        route: '/(app)/menu-admin',
        viaMoreMenu: true,
        moreNavTarget: 'more.menu_admin',
        title: 'Editar menú',
        primaryActionId: 'crear_producto_menu',
    },
    admin_operacion: {
        screenId: 'configuracion',
        route: '/(app)/configuracion',
        viaMoreMenu: true,
        moreNavTarget: 'more.configuracion',
        title: 'Configuración',
        primaryActionId: 'gestionar_inventario',
    },
    conexion_movil: {
        screenId: 'conexion_movil',
        route: '/(app)/conexion-movil',
        viaMoreMenu: true,
        moreNavTarget: 'more.conexion',
        title: 'Conexión móvil',
        primaryActionId: 'conexion_qr',
    },
    superadmin: {
        screenId: 'superadmin',
        route: '/(app)/superadmin',
        title: 'Panel de soporte',
        primaryActionId: 'control_acceso_restaurante',
    },
};
function senalLlegadaPantalla(screenId) {
    return SCREEN_SIGNAL[screenId];
}
function destinoDesdePantalla(screenId, routeOverride) {
    const direct = SCREEN_DESTINATIONS[screenId] ?? SCREEN_FALLBACK_ROUTE[screenId];
    if (!direct)
        return null;
    if (routeOverride)
        return { ...direct, route: routeOverride };
    return direct;
}
function destinoModuloCoach(moduleId, rol) {
    const meta = MODULE_COACH_META[moduleId];
    if (!meta?.screenId && !meta?.route) {
        const mod = help_tutorials_1.HELP_TUTORIAL_MODULES.find((m) => m.id === moduleId);
        const hint = mod?.routeHints.find((h) => h.length > 1);
        if (hint) {
            const path = hint.replace(/^\//, '');
            for (const dest of Object.values(SCREEN_DESTINATIONS)) {
                if (dest.route.includes(path))
                    return dest;
            }
        }
        return null;
    }
    if (moduleId === 'cobro') {
        if (rol === 'admin' || rol === 'superadmin') {
            return SCREEN_DESTINATIONS.resumen_diario;
        }
        return SCREEN_DESTINATIONS.mesas_lista;
    }
    return {
        screenId: meta.screenId,
        route: meta.route,
        title: meta.title ?? help_tutorials_1.HELP_TUTORIAL_MODULES.find((m) => m.id === moduleId)?.title ?? 'Módulo',
        navTarget: meta.navTarget,
        viaMoreMenu: meta.viaMoreMenu,
        moreNavTarget: meta.moreNavTarget,
    };
}
function destinoAccionCoach(actionId, rol) {
    const action = help_tutorials_1.HELP_TUTORIAL_ACTIONS.find((a) => a.id === actionId);
    if (!action)
        return null;
    const stepDest = action.steps.find((s) => s.pantalla && s.irARuta);
    if (stepDest?.pantalla) {
        const base = destinoDesdePantalla(stepDest.pantalla, stepDest.irARuta);
        if (base)
            return base;
    }
    const screenId = action.steps.find((s) => s.pantalla)?.pantalla ?? action.screenIds?.[0];
    if (screenId) {
        const dest = destinoDesdePantalla(screenId);
        if (dest)
            return dest;
    }
    return destinoModuloCoach(action.moduleId, rol);
}
function usuarioEnPantallaAyuda(pathname, screenId, rol) {
    const ctx = (0, help_context_1.resolverPantallaAyuda)(pathname, rol);
    if (ctx.screenId === screenId)
        return true;
    const fallback = SCREEN_FALLBACK_ROUTE[screenId];
    if (fallback && ctx.screenId === fallback.screenId)
        return true;
    if (screenId === 'pedido_menu' && ctx.screenId === 'pedido_raiz')
        return true;
    if (screenId === 'mesa_detalle' && ctx.screenId === 'mesas_lista')
        return false;
    return false;
}
/** Ya estás en una pantalla donde puede ejecutarse esta guía (no hace falta preludio de navegación). */
function usuarioEnZonaTutorial(pathname, action, rol) {
    const ctx = (0, help_context_1.resolverPantallaAyuda)(pathname, rol);
    const pantallas = new Set();
    for (const sid of action.screenIds ?? [])
        pantallas.add(sid);
    for (const step of action.steps) {
        if (step.pantalla)
            pantallas.add(step.pantalla);
    }
    if (pantallas.has(ctx.screenId))
        return true;
    if (pantallas.has('pedido_menu') && ctx.screenId === 'pedido_raiz')
        return true;
    if (pantallas.has('pedido_raiz') && ctx.screenId === 'pedido_menu')
        return true;
    if (pantallas.has('mesa_detalle') && ctx.screenId === 'mesas_lista')
        return false;
    return false;
}
function pasoAbrirMas(dest, moduloLabel) {
    return {
        title: '1. Abre el menú «Más»',
        body: `Para llegar a ${dest.title} (${moduloLabel}), primero abre «Más» en la barra de navegación.`,
        buscar: 'Ícono «Más» en la barra inferior o lateral',
        accion: 'Pulsa «Más» para ver las opciones de administración.',
        target: 'nav.mas',
        listoSi: 'nav.mas_abierto',
        pantalla: 'nav_mas_abierto',
    };
}
function pasoIrDestino(dest, moduloLabel, viaMore) {
    const signal = senalLlegadaPantalla(dest.screenId);
    const prefix = viaMore ? '2. ' : '';
    return {
        title: `${prefix}Ve a ${dest.title}`,
        body: viaMore
            ? `En el menú «Más», elige ${dest.title} para continuar el tutorial de ${moduloLabel}.`
            : `Estás en otra pantalla. Te guiamos hasta ${dest.title} para el tutorial de ${moduloLabel}.`,
        buscar: viaMore
            ? `Opción «${dest.title}» en la hoja «Más»`
            : `Ícono «${dest.title}» en la barra de navegación`,
        accion: viaMore
            ? 'Pulsa la opción resaltada.'
            : 'Pulsa el botón resaltado en la barra o usa «Ir a la pantalla».',
        target: viaMore ? dest.moreNavTarget : dest.navTarget,
        irARuta: dest.route,
        listoSi: signal,
        pantalla: dest.screenId,
    };
}
/** Pasos de navegación desde la pantalla actual hasta el destino del tutorial. */
function construirPreludioNavegacion(pathname, dest, moduloLabel, rol) {
    if (usuarioEnPantallaAyuda(pathname, dest.screenId, rol))
        return [];
    const steps = [];
    if (dest.viaMoreMenu && dest.moreNavTarget) {
        steps.push(pasoAbrirMas(dest, moduloLabel));
        steps.push(pasoIrDestino(dest, moduloLabel, true));
        return steps;
    }
    if (dest.navTarget || dest.route) {
        steps.push(pasoIrDestino(dest, moduloLabel, false));
    }
    return steps;
}
function pasosCoachAccion(actionId, pathname, rol, opts) {
    const action = help_tutorials_1.HELP_TUTORIAL_ACTIONS.find((a) => a.id === actionId);
    if (!action)
        return [];
    const base = (0, help_tutorials_1.pasosDeAccion)(actionId);
    const dest = destinoAccionCoach(actionId, rol);
    const prelude = opts?.skipPrelude || !dest || usuarioEnZonaTutorial(pathname, action, rol)
        ? []
        : construirPreludioNavegacion(pathname, dest, action.title, rol);
    return [...prelude, ...base];
}
function pasosCoachModulo(moduleId, pathname, rol) {
    const mod = help_tutorials_1.HELP_TUTORIAL_MODULES.find((m) => m.id === moduleId);
    if (!mod)
        return [];
    const meta = MODULE_COACH_META[moduleId];
    const dest = destinoModuloCoach(moduleId, rol);
    const prelude = dest != null ? construirPreludioNavegacion(pathname, dest, mod.title, rol) : [];
    let primaryId = meta?.primaryActionId;
    if (moduleId === 'cobro') {
        primaryId = rol === 'admin' || rol === 'superadmin' ? 'revisar_caja_dia' : 'ir_a_cobro';
    }
    if (primaryId) {
        const actionSteps = pasosCoachAccion(primaryId, pathname, rol, {
            skipPrelude: prelude.length > 0,
        });
        if (actionSteps.length > 0) {
            const intro = prelude.length > 0
                ? [
                    {
                        title: `Bienvenido a ${mod.title}`,
                        body: mod.subtitle,
                        listoSi: dest ? senalLlegadaPantalla(dest.screenId) : undefined,
                        pantalla: dest?.screenId,
                        confirmarEntendido: true,
                    },
                ]
                : [];
            return [...prelude, ...intro, ...actionSteps];
        }
    }
    return [...prelude, ...(0, help_tutorials_1.pasosDeModulo)(moduleId)];
}
function primaryActionModulo(moduleId) {
    return MODULE_COACH_META[moduleId]?.primaryActionId;
}
