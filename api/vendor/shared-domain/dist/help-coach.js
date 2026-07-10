"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HELP_SIGNAL = void 0;
exports.pasoCoachCompletado = pasoCoachCompletado;
exports.primerPasoCoachPendiente = primerPasoCoachPendiente;
exports.resumenCoachGuia = resumenCoachGuia;
exports.pasosPendientesTitulos = pasosPendientesTitulos;
exports.resolverTargetCoachPaso = resolverTargetCoachPaso;
exports.senalesDesdeRuta = senalesDesdeRuta;
exports.HELP_SIGNAL = {
    mesasEnMapa: 'mesas.en_mapa',
    mesaEnDetalle: 'mesa.en_detalle',
    mesaTienePedido: 'mesa.tiene_pedido',
    mesaTieneLineas: 'mesa.tiene_lineas',
    pedidoEnMenu: 'pedido.en_menu',
    pedidoLineasPendientesCocina: 'pedido.lineas_pendientes_cocina',
    pedidoEnFactura: 'pedido.en_factura',
    mesaMesasAgrupadas: 'mesa.mesas_agrupadas',
    pedidoPlatosEnCocina: 'pedido.platos_en_cocina',
    inventarioEnPantalla: 'inventario.en_pantalla',
    inventarioTieneItems: 'inventario.tiene_items',
    vistaPreviaEnPantalla: 'vista_previa.en_pantalla',
    conexionEnPantalla: 'conexion.en_pantalla',
    helpHubAbierto: 'help.hub_abierto',
    helpCoachActivo: 'help.coach_activo',
    helpAyudaVisible: 'help.ayuda_visible',
    navMasAbierto: 'nav.mas_abierto',
};
function senalesCumplidas(listoSi, signals) {
    const partes = listoSi.split('|').map((s) => s.trim()).filter(Boolean);
    if (partes.length === 0)
        return false;
    return partes.some((k) => Boolean(signals[k]));
}
/** Un paso está listo si su señal `listoSi` se cumple, fue saltado o marcado como entendido. */
function pasoCoachCompletado(step, signals, opts) {
    if (opts?.index !== undefined && opts.saltados?.has(opts.index))
        return true;
    if (opts?.index !== undefined && opts.confirmados?.has(opts.index))
        return true;
    if (!step.listoSi)
        return false;
    return senalesCumplidas(step.listoSi, signals);
}
function primerPasoCoachPendiente(steps, signals, avance) {
    for (let i = 0; i < steps.length; i++) {
        if (!pasoCoachCompletado(steps[i], signals, { index: i, ...avance }))
            return i;
    }
    return Math.max(0, steps.length - 1);
}
function resumenCoachGuia(steps, signals, stepIndex, avance) {
    const indiceActual = primerPasoCoachPendiente(steps, signals, avance);
    const pasos = steps.map((s, index) => {
        const done = pasoCoachCompletado(s, signals, { index, ...avance });
        return {
            index,
            title: s.title,
            done,
            current: index === indiceActual && !done,
            target: s.target,
        };
    });
    const completados = pasos.filter((p) => p.done).length;
    const guiaTerminada = steps.length > 0 &&
        steps.every((s, i) => pasoCoachCompletado(s, signals, { index: i, ...avance }));
    return {
        total: steps.length,
        completados,
        pendientes: Math.max(0, steps.length - completados),
        indiceActual: guiaTerminada ? steps.length - 1 : indiceActual,
        pasos,
        guiaTerminada,
    };
}
function pasosPendientesTitulos(steps, signals, avance) {
    return steps
        .filter((s, index) => !pasoCoachCompletado(s, signals, { index, ...avance }))
        .map((s) => s.title);
}
/** Resuelve targets dinámicos según el estado de la pantalla. */
function resolverTargetCoachPaso(step, signals) {
    if (!step?.target)
        return null;
    if (step.target === 'pedido.agregar_item_dinamico') {
        return signals['pedido.modo_varios'] ? 'pedido.agregar_lote' : 'pedido.agregar_rapido';
    }
    return step.target;
}
function senalesDesdeRuta(pathname) {
    const path = pathname.replace(/\/$/, '').replace(/^\/\([^)]+\)/, '') || '/';
    return {
        [exports.HELP_SIGNAL.mesasEnMapa]: /\/mesas$/.test(path) || path.endsWith('/mesas'),
        [exports.HELP_SIGNAL.mesaEnDetalle]: /\/mesa\/\d+/.test(path),
        [exports.HELP_SIGNAL.pedidoEnMenu]: /\/pedido\/\d+\/(menu|producto)/.test(path),
        [exports.HELP_SIGNAL.pedidoEnFactura]: /\/pedido\/\d+\/factura/.test(path),
        'pedido.en_activo': /\/pedido\/\d+/.test(path),
        [exports.HELP_SIGNAL.inventarioEnPantalla]: /\/inventario(?:\/|$)/.test(path),
        [exports.HELP_SIGNAL.vistaPreviaEnPantalla]: /\/vista-previa-impresion(?:\/|$)/.test(path),
        [exports.HELP_SIGNAL.conexionEnPantalla]: /\/conexion-movil(?:\/|$)/.test(path),
        'cocina.en_pantalla': /\/cocina(?:\/|$)/.test(path),
        'mis_pedidos.en_pantalla': /\/mis-pedidos(?:\/|$)/.test(path),
        'ayuda_companeros.en_pantalla': /\/ayuda-companeros(?:\/|$)/.test(path),
        'mostrador.en_pantalla': /\/mostrador(?:\/|$)/.test(path),
        'para_llevar.en_pantalla': /\/para-llevar(?:\/|$)/.test(path),
        'resumen_diario.en_pantalla': /\/resumen-diario(?:\/|$)/.test(path),
        'menu_admin.en_pantalla': /\/menu-admin(?:\/|$)/.test(path),
        'categorias_admin.en_pantalla': /\/categorias-admin(?:\/|$)/.test(path),
        'descuentos.en_pantalla': /\/descuentos-promociones(?:\/|$)/.test(path),
        'mesas_admin.en_pantalla': /\/mesas-admin(?:\/|$)/.test(path),
        'lugares_mesa.en_pantalla': /\/lugares-mesa(?:\/|$)/.test(path),
        'configuracion.en_pantalla': /\/configuracion(?:\/|$)/.test(path),
        'permisos.en_pantalla': /\/permisos(?:\/|$)/.test(path),
        'personalizacion.en_pantalla': /\/personalizacion-visual(?:\/|$)/.test(path),
        'superadmin.en_pantalla': /\/superadmin(?:\/|$)/.test(path),
        'usuarios.en_pantalla': /\/usuarios(?:\/|$)/.test(path),
        'contabilidad.en_pantalla': /\/contabilidad(?:\/|$)/.test(path),
        'proveedores.en_pantalla': /\/proveedores(?:\/|$)/.test(path),
        'cuentas_por_pagar.en_pantalla': /\/cuentas-por-pagar(?:\/|$)/.test(path),
        'creditos.en_pantalla': /\/creditos(?:\/|$)/.test(path),
        'meseros_operativos.en_pantalla': /\/meseros-operativos(?:\/|$)/.test(path),
    };
}
