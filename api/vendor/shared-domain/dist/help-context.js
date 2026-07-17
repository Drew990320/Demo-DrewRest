"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HELP_GUIDES_BY_SCREEN = exports.HELP_SCREEN_DEFINITIONS = void 0;
exports.normalizarPathnameAyuda = normalizarPathnameAyuda;
exports.resolverPantallaAyuda = resolverPantallaAyuda;
exports.guiasContextuales = guiasContextuales;
exports.guiaPrincipalContextual = guiaPrincipalContextual;
exports.moduloDePantalla = moduloDePantalla;
const help_tutorials_1 = require("./help-tutorials");
const help_tutorials_recorrido_1 = require("./help-tutorials-recorrido");
const help_manifest_1 = require("./help-manifest");
exports.HELP_SCREEN_DEFINITIONS = (0, help_manifest_1.manifestComoScreenDefinitions)();
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
    const guias = help_tutorials_1.HELP_TUTORIAL_ACTIONS.filter((g) => g.roles.includes(rol) && !(0, help_tutorials_recorrido_1.esAccionRecorrido)(g.id));
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
