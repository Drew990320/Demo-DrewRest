"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detallePendienteRecogerMesero = exports.tipoLineaCocina = exports.ordenTipoLineaCocina = exports.etiquetaTipoLineaCocina = void 0;
exports.detalleVisibleEnCocina = detalleVisibleEnCocina;
exports.pedidoActivoEnCocina = pedidoActivoEnCocina;
exports.ordenarDetallesCocina = ordenarDetallesCocina;
exports.agruparLineasCocinaVisibles = agruparLineasCocinaVisibles;
exports.ordenarDetallesMesero = ordenarDetallesMesero;
exports.etiquetaEstadoLineaMesero = etiquetaEstadoLineaMesero;
exports.detallePuedeRecogerMesero = detallePuedeRecogerMesero;
exports.platosPendientesRecogerPedido = platosPendientesRecogerPedido;
exports.pedidoTieneRecogidaPendiente = pedidoTieneRecogidaPendiente;
exports.nombreMeseroPedido = nombreMeseroPedido;
exports.detalleCocinaAviso = detalleCocinaAviso;
exports.conteoPorTipoEnCocina = conteoPorTipoEnCocina;
exports.textoResumenTiposCocina = textoResumenTiposCocina;
exports.ordenarPedidosCocinaPorLlegada = ordenarPedidosCocinaPorLlegada;
exports.mesasEnOrdenDeLlegada = mesasEnOrdenDeLlegada;
exports.ordenarMesasPorCola = ordenarMesasPorCola;
exports.porcionesVisiblesEnCocina = porcionesVisiblesEnCocina;
exports.platosEsperandoRecogida = platosEsperandoRecogida;
exports.totalPlatosEsperandoRecogida = totalPlatosEsperandoRecogida;
exports.conteoRecogidaPorTipo = conteoRecogidaPorTipo;
exports.conteoEsperandoRecogidaPorTipo = conteoEsperandoRecogidaPorTipo;
exports.totalEsperandoRecogidaPorTipo = totalEsperandoRecogidaPorTipo;
exports.mensajeListosParaRecoger = mensajeListosParaRecoger;
exports.platosSinEnviarCocina = platosSinEnviarCocina;
exports.totalPlatosSinEnviarCocina = totalPlatosSinEnviarCocina;
exports.etiquetaPlatoPendiente = etiquetaPlatoPendiente;
exports.agruparPlatosPendientes = agruparPlatosPendientes;
exports.mesasActivasDePedidos = mesasActivasDePedidos;
exports.resumenItemsMesero = resumenItemsMesero;
const cocina_prioridad_1 = require("./cocina-prioridad");
const mesa_label_1 = require("./mesa-label");
const cocina_producto_1 = require("./cocina-producto");
var cocina_producto_2 = require("./cocina-producto");
Object.defineProperty(exports, "etiquetaTipoLineaCocina", { enumerable: true, get: function () { return cocina_producto_2.etiquetaTipoLineaCocina; } });
Object.defineProperty(exports, "ordenTipoLineaCocina", { enumerable: true, get: function () { return cocina_producto_2.ordenTipoLineaCocina; } });
Object.defineProperty(exports, "tipoLineaCocina", { enumerable: true, get: function () { return cocina_producto_2.tipoLineaCocina; } });
function detalleVisibleEnCocina(d) {
    return (d.marcar_cocina &&
        (d.enviado_cocina ?? false) &&
        !d.listo_cocina &&
        !d.es_bebida &&
        !d.es_empacable);
}
function pedidoActivoEnCocina(pedido) {
    return pedido.detalles.some(detalleVisibleEnCocina);
}
function ordenarDetallesCocina(detalles) {
    const visibles = detalles.filter(detalleVisibleEnCocina);
    return [...visibles].sort((a, b) => {
        const ta = (0, cocina_producto_1.ordenTipoLineaCocina)((0, cocina_producto_1.tipoLineaCocina)(a));
        const tb = (0, cocina_producto_1.ordenTipoLineaCocina)((0, cocina_producto_1.tipoLineaCocina)(b));
        if (ta !== tb)
            return ta - tb;
        return a.id_detalle - b.id_detalle;
    });
}
function claveAgrupacionCocina(d) {
    const pers = (d.personalizaciones ?? [])
        .map((p) => String(p.id_opcion ?? p.descripcion))
        .sort()
        .join(',');
    return [
        d.id_producto ?? (d.nombre_producto ?? '').trim(),
        (d.nota_cocina ?? '').trim(),
        pers,
        d.id_detalle_padre ?? 'root',
    ].join('|');
}
/**
 * Agrupa platos visibles en cocina (mismo producto/nota/personalización),
 * aunque se hayan agregado en distintos momentos o por distintos usuarios.
 */
function agruparLineasCocinaVisibles(detalles) {
    const byId = new Map(detalles.map((d) => [d.id_detalle, d]));
    const visibles = ordenarDetallesCocina(detalles);
    const orden = [];
    const map = new Map();
    for (const d of visibles) {
        const key = claveAgrupacionCocina(d);
        const prev = map.get(key);
        if (!prev) {
            orden.push(key);
            const listo = Boolean(d.listo_para_recoger);
            map.set(key, {
                ...d,
                ids_detalle: [d.id_detalle],
                cantidad: d.cantidad,
                listo_para_recoger: listo,
                listo_para_recoger_parcial: false,
            });
            continue;
        }
        prev.cantidad += d.cantidad;
        prev.ids_detalle.push(d.id_detalle);
        const listos = prev.ids_detalle.filter((id) => Boolean(byId.get(id)?.listo_para_recoger)).length;
        const total = prev.ids_detalle.length;
        prev.listo_para_recoger = listos === total && total > 0;
        prev.listo_para_recoger_parcial = listos > 0 && listos < total;
    }
    return orden
        .map((key) => map.get(key))
        .filter((g) => g != null);
}
function ordenarDetallesMesero(detalles) {
    return [...detalles].sort((a, b) => a.id_detalle - b.id_detalle);
}
function etiquetaEstadoLineaMesero(d) {
    if (d.es_acompanamiento_mazorca) {
        if (d.listo_cocina)
            return ' · en la mesa';
        if (d.listo_para_recoger)
            return ' · ¡lista en cocina!';
        if (d.enviado_cocina ?? false)
            return ' · en cocina';
        return ' · pendiente de enviar';
    }
    if (d.es_bebida)
        return 'Bebida (se cobra al final)';
    if (d.es_empacable)
        return 'Empaque';
    if (d.listo_cocina)
        return 'Recogido · ya en la mesa';
    if (d.listo_para_recoger)
        return '¡Cocina avisó! Listo para recoger';
    if (d.enviado_cocina ?? false) {
        return 'En cocina · puedes recoger cuando esté';
    }
    return 'Sin enviar a cocina';
}
/** Plato enviado a cocina que el mesero aún puede recoger o reportar. */
function detallePuedeRecogerMesero(d) {
    return (d.marcar_cocina &&
        (d.enviado_cocina ?? false) &&
        !d.listo_cocina &&
        !d.es_bebida &&
        !d.es_empacable);
}
/** Alias usado en el API (`pedidos-vista-operativa`). */
exports.detallePendienteRecogerMesero = detallePuedeRecogerMesero;
function platosPendientesRecogerPedido(p) {
    return p.detalles
        .filter(detallePuedeRecogerMesero)
        .reduce((acc, d) => acc + d.cantidad, 0);
}
function pedidoTieneRecogidaPendiente(p) {
    return platosPendientesRecogerPedido(p) > 0;
}
function nombreMeseroPedido(p) {
    const m = p.mesero;
    if (!m)
        return 'Mesero';
    const nombre = (m.nombre ?? '').trim();
    const apellido = (m.apellido ?? '').trim();
    if (!nombre && !apellido)
        return 'Mesero';
    if (!apellido)
        return nombre;
    if (!nombre)
        return apellido;
    return `${nombre} ${apellido.charAt(0)}.`;
}
function detalleCocinaAviso(d) {
    return detallePuedeRecogerMesero(d) && (d.listo_para_recoger ?? false);
}
function conteoPorTipoEnCocina(pedidos) {
    const out = {
        plato: 0,
        entrada: 0,
        adicional: 0,
        mazorca: 0,
        sopa: 0,
    };
    for (const pedido of pedidos) {
        for (const d of pedido.detalles) {
            if (!detalleVisibleEnCocina(d))
                continue;
            out[(0, cocina_producto_1.tipoLineaCocina)(d)] += d.cantidad;
        }
    }
    return out;
}
function textoResumenTiposCocina(conteo) {
    const parts = [];
    if (conteo.plato > 0) {
        parts.push(`${conteo.plato} ${conteo.plato === 1 ? 'plato' : 'platos'}`);
    }
    if (conteo.entrada > 0) {
        parts.push(`${conteo.entrada} ${conteo.entrada === 1 ? 'entrada' : 'entradas'}`);
    }
    if (conteo.adicional > 0) {
        parts.push(`${conteo.adicional} ${conteo.adicional === 1 ? 'adicional' : 'adicionales'}`);
    }
    if (conteo.mazorca > 0) {
        parts.push(`${conteo.mazorca} ${conteo.mazorca === 1 ? 'acompañamiento' : 'acompañamientos'}`);
    }
    if (conteo.sopa > 0) {
        parts.push(`${conteo.sopa} ${conteo.sopa === 1 ? 'sopa' : 'sopas'}`);
    }
    return parts.join(' · ');
}
/** Cola FIFO por hora de creación del pedido (sin prioridad alta/baja). */
function ordenarPedidosCocinaPorLlegada(pedidos) {
    return [...pedidos].sort((a, b) => {
        const ta = typeof a.creado_en === 'string'
            ? new Date(a.creado_en).getTime()
            : a.creado_en.getTime();
        const tb = typeof b.creado_en === 'string'
            ? new Date(b.creado_en).getTime()
            : b.creado_en.getTime();
        return ta - tb;
    });
}
function mesasEnOrdenDeLlegada(pedidos) {
    const seen = new Set();
    const out = [];
    for (const p of ordenarPedidosCocinaPorLlegada(pedidos)) {
        if (!seen.has(p.mesa_numero)) {
            seen.add(p.mesa_numero);
            out.push(p.mesa_numero);
        }
    }
    return out;
}
function ordenarMesasPorCola(mesas, colaMesas) {
    const rank = new Map(colaMesas.map((m, i) => [m, i]));
    return [...mesas].sort((a, b) => (rank.get(a) ?? 999) - (rank.get(b) ?? 999) || a - b);
}
function porcionesVisiblesEnCocina(pedido) {
    return pedido.detalles
        .filter(detalleVisibleEnCocina)
        .reduce((acc, d) => acc + d.cantidad, 0);
}
function detalleEsperandoRecogida(d) {
    return (d.marcar_cocina &&
        (d.enviado_cocina ?? false) &&
        (d.listo_para_recoger ?? false) &&
        !d.listo_cocina &&
        !d.es_bebida &&
        !d.es_empacable);
}
function platosEsperandoRecogida(pedido) {
    return pedido.detalles
        .filter(detalleEsperandoRecogida)
        .reduce((acc, d) => acc + d.cantidad, 0);
}
function totalPlatosEsperandoRecogida(pedidos) {
    return pedidos.reduce((acc, p) => acc + platosEsperandoRecogida(p), 0);
}
/** Separa platos de cocina y mazorcas (entradas) en conteos de recogida. */
function conteoRecogidaPorTipo(detalles, incluir) {
    let platos = 0;
    let entradas = 0;
    for (const d of detalles) {
        if (!incluir(d))
            continue;
        if (d.es_acompanamiento_mazorca)
            entradas += d.cantidad;
        else
            platos += d.cantidad;
    }
    return { platos, entradas };
}
function conteoEsperandoRecogidaPorTipo(pedido) {
    return conteoRecogidaPorTipo(pedido.detalles, detalleEsperandoRecogida);
}
function totalEsperandoRecogidaPorTipo(pedidos) {
    return pedidos.reduce((acc, p) => {
        const c = conteoEsperandoRecogidaPorTipo(p);
        return { platos: acc.platos + c.platos, entradas: acc.entradas + c.entradas };
    }, { platos: 0, entradas: 0 });
}
/** Texto para avisos al mesero (notificación / banner). */
function mensajeListosParaRecoger(platos, entradas, sufijo = '') {
    const parts = [];
    if (platos > 0) {
        parts.push(`${platos} ${platos === 1 ? 'plato' : 'platos'}`);
    }
    if (entradas > 0) {
        parts.push(`${entradas} ${entradas === 1 ? 'acompañamiento' : 'acompañamientos'}`);
    }
    if (parts.length === 0)
        return `Listo para recoger${sufijo}`;
    const cuerpo = parts.length === 2 ? `${parts[0]} y ${parts[1]}` : parts[0];
    const verbo = platos > 0 && entradas > 0
        ? 'listos'
        : entradas > 0
            ? entradas === 1
                ? 'lista'
                : 'listas'
            : platos === 1
                ? 'listo'
                : 'listos';
    return `${cuerpo} ${verbo} para recoger${sufijo}`;
}
function detalleSinEnviarCocina(d) {
    return d.marcar_cocina && !(d.enviado_cocina ?? false);
}
function platosSinEnviarCocina(pedido) {
    return pedido.detalles
        .filter(detalleSinEnviarCocina)
        .reduce((acc, d) => acc + d.cantidad, 0);
}
function totalPlatosSinEnviarCocina(pedidos) {
    return pedidos.reduce((acc, p) => acc + platosSinEnviarCocina(p), 0);
}
function etiquetaPlatoPendiente(nombre, total) {
    const base = nombre.trim() || 'Plato';
    if (total === 1)
        return `${base} pendiente: 1`;
    return `${base} pendientes: ${total}`;
}
function agruparPlatosPendientes(items, colaMesas) {
    const porPlato = new Map();
    for (const pedido of items) {
        for (const d of pedido.detalles) {
            if (!detalleVisibleEnCocina(d))
                continue;
            const nombre = (d.nombre_producto ?? '').trim() || 'Plato';
            const prioridadDetalle = {
                marcar_cocina: d.marcar_cocina,
                es_plato_principal: d.es_plato_principal,
                categoria_prioridad_cocina_baja: d.categoria_prioridad_cocina_baja,
                producto_prioridad_cocina_baja: d.producto_prioridad_cocina_baja,
            };
            const esPrioridadBaja = d.prioridad_cocina_baja ?? (0, cocina_prioridad_1.detalleMarcaPrioridadBaja)(prioridadDetalle);
            const tipo = (0, cocina_producto_1.tipoLineaCocina)(d);
            const prev = porPlato.get(nombre) ?? {
                total: 0,
                mesas: new Set(),
                esPrioridadBaja,
                tipo,
            };
            prev.total += d.cantidad;
            prev.mesas.add(pedido.mesa_numero);
            prev.esPrioridadBaja = prev.esPrioridadBaja || esPrioridadBaja;
            porPlato.set(nombre, prev);
        }
    }
    return Array.from(porPlato.entries())
        .map(([nombre, v]) => ({
        nombre,
        total: v.total,
        mesas: colaMesas?.length
            ? ordenarMesasPorCola(Array.from(v.mesas), colaMesas)
            : Array.from(v.mesas).sort((a, b) => a - b),
        esPrioridadBaja: v.esPrioridadBaja,
        tipo: v.tipo,
    }))
        .sort((a, b) => {
        const ta = (0, cocina_producto_1.ordenTipoLineaCocina)(a.tipo);
        const tb = (0, cocina_producto_1.ordenTipoLineaCocina)(b.tipo);
        if (ta !== tb)
            return ta - tb;
        return b.total - a.total || a.nombre.localeCompare(b.nombre, 'es');
    });
}
function mesasActivasDePedidos(pedidos) {
    return Array.from(new Set(pedidos.map((p) => p.mesa_numero))).sort((a, b) => a - b);
}
function resumenItemsMesero(pedidos, etiquetaMesa = mesa_label_1.tituloLugarMesa) {
    const porItem = new Map();
    for (const pedido of pedidos) {
        for (const d of pedido.detalles) {
            const nombre = (d.nombre_producto ?? '').trim() || 'Ítem';
            const prev = porItem.get(nombre) ?? { total: 0, mesas: new Set() };
            prev.total += d.cantidad;
            prev.mesas.add(pedido.mesa_numero);
            porItem.set(nombre, prev);
        }
    }
    return Array.from(porItem.entries())
        .map(([nombre, v]) => ({
        nombre,
        total: v.total,
        mesasLabel: Array.from(v.mesas)
            .sort((a, b) => a - b)
            .map((m) => etiquetaMesa(m))
            .join(', '),
    }))
        .sort((a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre, 'es'));
}
