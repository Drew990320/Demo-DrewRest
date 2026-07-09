"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COBRO_MIXTO_GRUPO_MAX = void 0;
exports.repartoMixtoDesdeTransferencia = repartoMixtoDesdeTransferencia;
exports.repartoMixtoConDevolucion = repartoMixtoConDevolucion;
exports.restarSolicitudesCobro = restarSolicitudesCobro;
exports.dividirSolicitudesCobroMixto = dividirSolicitudesCobroMixto;
exports.nuevoCobroMixtoGrupo = nuevoCobroMixtoGrupo;
exports.cobroMixtoGrupoValido = cobroMixtoGrupoValido;
exports.esGrupoPagoMixto = esGrupoPagoMixto;
exports.facturasDeTandaCobro = facturasDeTandaCobro;
exports.agruparFacturasMixto = agruparFacturasMixto;
exports.cobrosResumenMixto = cobrosResumenMixto;
exports.consolidarCobrosResumenPorMetodo = consolidarCobrosResumenPorMetodo;
exports.agruparCobrosVista = agruparCobrosVista;
exports.facturasIdsImpresionUnica = facturasIdsImpresionUnica;
exports.resumenCobrosPedidoTotal = resumenCobrosPedidoTotal;
const asignar_cobro_por_monto_1 = require("./asignar-cobro-por-monto");
/** Límite de columna INTEGER en PostgreSQL (INT4). */
exports.COBRO_MIXTO_GRUPO_MAX = 2147483647;
/** Reparto de factura según cuánto transfirió el cliente (puede superar el total). */
function repartoMixtoDesdeTransferencia(total, transferenciaReal) {
    const t = Math.max(0, Math.round(total));
    const tr = Math.max(0, Math.round(transferenciaReal));
    if (t <= 0) {
        return { transferenciaFactura: 0, efectivoFactura: 0, excesoDevolverEfectivo: 0 };
    }
    if (tr >= t) {
        return {
            transferenciaFactura: t,
            efectivoFactura: 0,
            excesoDevolverEfectivo: tr - t,
        };
    }
    return {
        transferenciaFactura: tr,
        efectivoFactura: t - tr,
        excesoDevolverEfectivo: 0,
    };
}
/**
 * Si el vuelto se devuelve por transferencia, se conserva todo el efectivo en la
 * venta (cuadre de caja) y el exceso total sale por transferencia.
 * En cualquier otro caso se usa el reparto clásico (transferencia primero).
 */
function repartoMixtoConDevolucion(total, transferenciaReal, efectivoRecibido, devolucionMetodo) {
    const t = Math.max(0, Math.round(total));
    const tr = Math.max(0, Math.round(transferenciaReal));
    const ef = Math.max(0, Math.round(efectivoRecibido));
    const vueltoTotal = tr + ef - t;
    if (devolucionMetodo === 'transferencia' && t > 0 && vueltoTotal > 0) {
        const efectivoFactura = Math.min(ef, t);
        return {
            transferenciaFactura: t - efectivoFactura,
            efectivoFactura,
            excesoDevolverEfectivo: vueltoTotal,
        };
    }
    return repartoMixtoDesdeTransferencia(t, tr);
}
/** Resta cantidades ya asignadas a un cobro parcial. */
function restarSolicitudesCobro(total, parcial) {
    const usado = new Map(parcial.map((s) => [s.id_detalle, s.cantidad]));
    const out = [];
    for (const s of total) {
        const q = s.cantidad - (usado.get(s.id_detalle) ?? 0);
        if (q > 0)
            out.push({ id_detalle: s.id_detalle, cantidad: q });
    }
    return out;
}
function lineasDesdeSolicitudes(solicitudes, precioUnitarioPorDetalle) {
    return solicitudes
        .map((s) => ({
        id_detalle: s.id_detalle,
        precio_unitario: Math.round(precioUnitarioPorDetalle[s.id_detalle] ?? 0),
        cantidad_pendiente: s.cantidad,
    }))
        .filter((l) => l.precio_unitario > 0 && l.cantidad_pendiente > 0);
}
function solicitudesDesdeCantidadesParciales(solicitudes, cantidades) {
    const efectivo = [];
    for (const s of solicitudes) {
        const qE = cantidades[s.id_detalle] ?? 0;
        if (qE > 0)
            efectivo.push({ id_detalle: s.id_detalle, cantidad: qE });
    }
    return efectivo;
}
function asegurarAmbosLadosMixto(solicitudes, efectivo, transferencia, montoNetoEfectivo, totalNetoCompleto, lineas) {
    if (montoNetoEfectivo <= 0 || montoNetoEfectivo >= totalNetoCompleto) {
        return { efectivo, transferencia };
    }
    let e = [...efectivo];
    let t = [...transferencia];
    const totalUnidades = solicitudes.reduce((s, x) => s + x.cantidad, 0);
    if (e.length === 0 && t.length > 0 && totalUnidades >= 2) {
        const linea = [...lineas].sort((a, b) => a.precio_unitario - b.precio_unitario)[0];
        if (linea) {
            e = [{ id_detalle: linea.id_detalle, cantidad: 1 }];
            t = restarSolicitudesCobro(solicitudes, e);
        }
    }
    else if (t.length === 0 && e.length > 0 && totalUnidades >= 2) {
        const candidato = [...e].sort((a, b) => {
            const pa = lineas.find((l) => l.id_detalle === a.id_detalle)?.precio_unitario ?? 0;
            const pb = lineas.find((l) => l.id_detalle === b.id_detalle)?.precio_unitario ?? 0;
            return pb - pa;
        })[0];
        if (candidato) {
            e = e
                .map((x) => x.id_detalle === candidato.id_detalle
                ? { ...x, cantidad: x.cantidad - 1 }
                : x)
                .filter((x) => x.cantidad > 0);
            t = restarSolicitudesCobro(solicitudes, e);
        }
    }
    return { efectivo: e, transferencia: t };
}
/**
 * Reparte ítems de un cobro entre factura efectivo y transferencia (mismo turno).
 */
function dividirSolicitudesCobroMixto(solicitudes, precioUnitarioPorDetalle, montoNetoEfectivo, totalNetoCompleto, opciones) {
    if (montoNetoEfectivo <= 0) {
        return { efectivo: [], transferencia: [...solicitudes] };
    }
    if (montoNetoEfectivo >= totalNetoCompleto) {
        return { efectivo: [...solicitudes], transferencia: [] };
    }
    const lineas = opciones?.lineasPadre ?? lineasDesdeSolicitudes(solicitudes, precioUnitarioPorDetalle);
    if (lineas.length === 0) {
        return { efectivo: [], transferencia: [...solicitudes] };
    }
    const brutoTotal = lineas.reduce((s, l) => s + l.precio_unitario * l.cantidad_pendiente, 0);
    let subBruto = totalNetoCompleto > 0 && brutoTotal > 0
        ? Math.round((montoNetoEfectivo / totalNetoCompleto) * brutoTotal)
        : montoNetoEfectivo;
    const netoDeCantidades = opciones?.netoDeCantidades ??
        ((cantidades) => {
            const parcial = solicitudesDesdeCantidadesParciales(solicitudes, cantidades);
            const bruto = parcial.reduce((s, x) => s +
                (precioUnitarioPorDetalle[x.id_detalle] ?? 0) * x.cantidad, 0);
            return Math.round(bruto);
        });
    const expandir = opciones?.expandirCantidades ??
        ((cantidades) => solicitudesDesdeCantidadesParciales(solicitudes, cantidades));
    let cantidades = (0, asignar_cobro_por_monto_1.asignarCantidadesParaSubtotal)(lineas, subBruto);
    let netoEfectivo = netoDeCantidades(cantidades);
    for (let i = 0; i < 14; i++) {
        if (Object.keys(cantidades).length === 0)
            break;
        if (netoEfectivo > 0 && netoEfectivo <= montoNetoEfectivo)
            break;
        if (netoEfectivo > montoNetoEfectivo) {
            subBruto = Math.max(0, Math.round(subBruto * (montoNetoEfectivo / netoEfectivo) * 0.97));
        }
        else {
            subBruto = Math.min(brutoTotal, Math.round(subBruto * 1.04));
        }
        cantidades = (0, asignar_cobro_por_monto_1.asignarCantidadesParaSubtotal)(lineas, subBruto);
        netoEfectivo = netoDeCantidades(cantidades);
    }
    let efectivo = expandir(cantidades);
    let transferencia = restarSolicitudesCobro(solicitudes, efectivo);
    ({ efectivo, transferencia } = asegurarAmbosLadosMixto(solicitudes, efectivo, transferencia, montoNetoEfectivo, totalNetoCompleto, lineas));
    if (efectivo.length === 0 && transferencia.length === 0) {
        return { efectivo: [], transferencia: [...solicitudes] };
    }
    return { efectivo, transferencia };
}
function mismoInstanteCobro(a, b) {
    if (!a || !b)
        return false;
    return new Date(a).getTime() === new Date(b).getTime();
}
/**
 * ID de grupo para cobrar efectivo + transferencia en la misma operación.
 * Debe caber en INT4 de PostgreSQL (no usar Date.now() en milisegundos).
 */
function nuevoCobroMixtoGrupo(nowMs = Date.now()) {
    const sec = Math.floor(nowMs / 1000);
    const salt = Math.floor(Math.random() * 1000);
    const id = sec + salt;
    if (id <= exports.COBRO_MIXTO_GRUPO_MAX)
        return id;
    return (sec % 2000000000) + salt + 1;
}
function cobroMixtoGrupoValido(value) {
    return (value != null &&
        Number.isInteger(value) &&
        value >= 1 &&
        value <= exports.COBRO_MIXTO_GRUPO_MAX);
}
function esGrupoPagoMixto(facturas) {
    if (facturas.length < 2)
        return false;
    const metodos = new Set(facturas.map((f) => f.metodo_pago));
    return metodos.has('efectivo') && metodos.has('transferencia');
}
function parMixtoSinGrupo(facturas, actual) {
    if (actual.cobro_mixto_grupo != null || !actual.emitida_en)
        return null;
    const opuesto = actual.metodo_pago === 'efectivo' ? 'transferencia' : 'efectivo';
    const hermano = facturas.find((f) => f.id_factura !== actual.id_factura &&
        f.cobro_mixto_grupo == null &&
        mismoInstanteCobro(f.emitida_en, actual.emitida_en) &&
        f.metodo_pago === opuesto);
    if (!hermano)
        return null;
    const par = [actual, hermano];
    return esGrupoPagoMixto(par) ? par : null;
}
/**
 * Facturas que forman una misma tanda de cobro a partir de una factura.
 * - Mixto: ambas patas (cobro_mixto_grupo o persona del plan).
 * - Simple: solo esa factura.
 */
function facturasDeTandaCobro(facturas, idFactura) {
    const actual = facturas.find((f) => f.id_factura === idFactura);
    if (!actual)
        return [];
    return agruparFacturasMixto(facturas, actual);
}
/** Facturas del mismo cobro mixto (mismo grupo o misma persona del plan). */
function agruparFacturasMixto(facturas, actual) {
    if (actual.cobro_mixto_grupo != null) {
        const porGrupo = facturas.filter((f) => f.cobro_mixto_grupo === actual.cobro_mixto_grupo);
        if (esGrupoPagoMixto(porGrupo))
            return porGrupo;
    }
    if (actual.persona_plan_indice != null && actual.persona_plan_indice > 0) {
        const porPersona = facturas.filter((f) => f.persona_plan_indice === actual.persona_plan_indice);
        if (esGrupoPagoMixto(porPersona))
            return porPersona;
    }
    const parSinGrupo = parMixtoSinGrupo(facturas, actual);
    if (parSinGrupo)
        return parSinGrupo;
    return [actual];
}
function cobrosResumenMixto(facturas) {
    const orden = ['efectivo', 'transferencia'];
    return orden
        .map((metodo) => {
        const total = facturas
            .filter((f) => f.metodo_pago === metodo)
            .reduce((s, f) => s + f.total, 0);
        return total > 0 ? { metodo_pago: metodo, total } : null;
    })
        .filter((x) => x != null);
}
/** Suma varios cobros parciales en una línea por método (ticket total del pedido). */
function consolidarCobrosResumenPorMetodo(cobros) {
    const orden = ['efectivo', 'transferencia'];
    return orden
        .map((metodo) => {
        const total = cobros
            .filter((c) => c.metodo_pago === metodo)
            .reduce((s, c) => s + c.total, 0);
        return total > 0 ? { metodo_pago: metodo, total } : null;
    })
        .filter((x) => x != null);
}
/** Agrupa cobros mixtos para mostrar una sola fila en UI e impresión. */
function agruparCobrosVista(cobros) {
    const vistas = [];
    const procesadas = new Set();
    for (const cobro of cobros) {
        if (procesadas.has(cobro.id_factura))
            continue;
        const grupo = agruparFacturasMixto(cobros, cobro);
        if (grupo.length > 1 && esGrupoPagoMixto(grupo)) {
            for (const g of grupo)
                procesadas.add(g.id_factura);
            const key = cobro.cobro_mixto_grupo != null
                ? `mixto-${cobro.cobro_mixto_grupo}`
                : `mixto-p${cobro.persona_plan_indice}-f${cobro.id_factura}`;
            vistas.push({ tipo: 'mixto', cobros: grupo, key });
        }
        else {
            procesadas.add(cobro.id_factura);
            vistas.push({ tipo: 'simple', cobro });
        }
    }
    return vistas;
}
/** Una id_factura por cobro lógico (evita imprimir el mismo ticket mixto dos veces). */
function facturasIdsImpresionUnica(facturas) {
    return agruparCobrosVista(facturas).map((v) => v.tipo === 'mixto'
        ? Math.min(...v.cobros.map((c) => c.id_factura))
        : v.cobro.id_factura);
}
/** Resumen de cobros de un pedido para ticket total (agrupa mixtos). */
function resumenCobrosPedidoTotal(facturas) {
    const vistas = agruparCobrosVista(facturas);
    const cobros = vistas.map((v) => {
        if (v.tipo === 'mixto') {
            const desglose = cobrosResumenMixto(v.cobros);
            return {
                metodo_pago: 'mixto',
                total: desglose.reduce((s, d) => s + d.total, 0),
            };
        }
        return {
            metodo_pago: v.cobro.metodo_pago,
            total: v.cobro.total,
        };
    });
    if (vistas.length === 1 && vistas[0].tipo === 'mixto') {
        return {
            cobros,
            metodo_pago: 'mixto',
            cobros_resumen: cobrosResumenMixto(vistas[0].cobros),
        };
    }
    if (vistas.length === 1 && vistas[0].tipo === 'simple') {
        const m = vistas[0].cobro.metodo_pago;
        return {
            cobros,
            metodo_pago: m,
            cobros_resumen: undefined,
        };
    }
    const cobros_resumen = [];
    for (const v of vistas) {
        if (v.tipo === 'mixto') {
            cobros_resumen.push(...cobrosResumenMixto(v.cobros));
        }
        else {
            cobros_resumen.push({
                metodo_pago: v.cobro.metodo_pago,
                total: v.cobro.total,
            });
        }
    }
    return { cobros, cobros_resumen: consolidarCobrosResumenPorMetodo(cobros_resumen) };
}
