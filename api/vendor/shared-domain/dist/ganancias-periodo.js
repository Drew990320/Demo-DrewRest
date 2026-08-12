"use strict";
/**
 * Cálculo de ganancias operativas por periodo (ventas − costo − gastos).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.costoEfectivoProducto = costoEfectivoProducto;
exports.cuotaDiariaSugerida = cuotaDiariaSugerida;
exports.topeFondoAlcanzado = topeFondoAlcanzado;
exports.disponibleFondo = disponibleFondo;
exports.montoPagoFondoSugerido = montoPagoFondoSugerido;
exports.rangoMesCalendario = rangoMesCalendario;
exports.sumarCuotasAplicadas = sumarCuotasAplicadas;
exports.debeAutoAplicarCuota = debeAutoAplicarCuota;
exports.armarGastosFijosPeriodo = armarGastosFijosPeriodo;
exports.prorratearGastosFijos = prorratearGastosFijos;
exports.armarResumenGanancias = armarResumenGanancias;
exports.consolidarLineasCostoVenta = consolidarLineasCostoVenta;
exports.ymdEnRango = ymdEnRango;
exports.ymdGanancias = ymd;
function costoEfectivoProducto(precioCosto, costoReceta) {
    if (precioCosto != null) {
        const manual = Number(precioCosto);
        if (Number.isFinite(manual) && manual >= 0) {
            return { costo: Math.round(manual), origen: 'manual' };
        }
    }
    if (costoReceta != null) {
        const receta = Number(costoReceta);
        if (Number.isFinite(receta) && receta >= 0) {
            return { costo: Math.round(receta), origen: 'receta' };
        }
    }
    return { costo: 0, origen: 'ninguno' };
}
function parseYmd(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s ?? '').trim());
    if (!m)
        return null;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (!Number.isFinite(y) || mo < 1 || mo > 12 || d < 1 || d > 31)
        return null;
    return { y, m: mo, d };
}
function daysInMonth(y, m) {
    return new Date(Date.UTC(y, m, 0)).getUTCDate();
}
function ymd(y, m, d) {
    const pad = (n) => (n < 10 ? `0${n}` : String(n));
    return `${y}-${pad(m)}-${pad(d)}`;
}
function eachYmdInclusive(desde, hasta) {
    const a = parseYmd(desde);
    const b = parseYmd(hasta);
    if (!a || !b)
        return [];
    const out = [];
    let ms = Date.UTC(a.y, a.m - 1, a.d);
    const end = Date.UTC(b.y, b.m - 1, b.d);
    if (ms > end)
        return [];
    while (ms <= end) {
        const dt = new Date(ms);
        out.push({
            y: dt.getUTCFullYear(),
            m: dt.getUTCMonth() + 1,
            d: dt.getUTCDate(),
        });
        ms += 86400000;
    }
    return out;
}
/** Cuota sugerida: monto mensual / 30, en pesos enteros. */
function cuotaDiariaSugerida(montoMensual) {
    return Math.max(0, Math.round((Number(montoMensual) || 0) / 30));
}
function topeFondoAlcanzado(acumuladoMes, montoMensual) {
    return Math.round(Number(acumuladoMes) || 0) >= Math.round(Number(montoMensual) || 0);
}
/** Lo que queda en el sobre: cuotas aplicadas − pagos ya hechos con el fondo. */
function disponibleFondo(acumulado, pagado) {
    return Math.max(0, Math.round(Number(acumulado) || 0) - Math.round(Number(pagado) || 0));
}
/** Sugiere pagar lo que falta de la meta del mes, sin pasar el disponible. */
function montoPagoFondoSugerido(input) {
    const disp = Math.max(0, Math.round(Number(input.disponible) || 0));
    const falta = Math.max(0, Math.round(Number(input.monto_mensual) || 0) -
        Math.round(Number(input.pagado_mes) || 0));
    if (falta <= 0)
        return 0;
    return Math.min(disp, falta);
}
function rangoMesCalendario(fechaYmd) {
    const p = parseYmd(fechaYmd);
    if (!p)
        return null;
    const dim = daysInMonth(p.y, p.m);
    return { desde: ymd(p.y, p.m, 1), hasta: ymd(p.y, p.m, dim) };
}
function sumarCuotasAplicadas(cuotas, idGastoFijo, fechaDesdeYmd, fechaHastaYmd) {
    let total = 0;
    for (const c of cuotas) {
        if (c.id_gasto_fijo !== idGastoFijo)
            continue;
        if (c.estado && c.estado !== 'aplicada')
            continue;
        if (!ymdEnRango(c.fecha, fechaDesdeYmd, fechaHastaYmd))
            continue;
        total += Math.max(0, Math.round(Number(c.monto) || 0));
    }
    return total;
}
/**
 * Auto-aplica solo si el fondo está on, modo automático, no hay decisión
 * del día y el acumulado del mes aún no cubre la meta.
 */
function debeAutoAplicarCuota(input) {
    if (!input.usa_fondo_diario)
        return false;
    if (input.activo === false)
        return false;
    if (input.modo_registro_fondo !== 'automatico')
        return false;
    if (input.estado_hoy === 'aplicada' || input.estado_hoy === 'omitida') {
        return false;
    }
    if (Math.round(Number(input.cuota_diaria) || 0) <= 0)
        return false;
    if (topeFondoAlcanzado(input.acumulado_mes, input.monto_mensual))
        return false;
    return true;
}
/**
 * Gastos sin fondo: prorrateo mensual.
 * Gastos con fondo: solo cuotas aplicadas del periodo (sin doble conteo).
 */
function armarGastosFijosPeriodo(gastos, cuotasAplicadas, fechaDesdeYmd, fechaHastaYmd) {
    const mes = rangoMesCalendario(fechaHastaYmd);
    const sinFondo = gastos.filter((g) => !g.usa_fondo_diario);
    const prorrateo = prorratearGastosFijos(sinFondo.map((g) => ({
        id: g.id,
        nombre: g.nombre,
        monto_mensual: g.monto_mensual,
    })), fechaDesdeYmd, fechaHastaYmd);
    const porId = new Map();
    for (const d of prorrateo.detalle) {
        const g = sinFondo.find((x) => x.id === d.id);
        porId.set(d.id, {
            ...d,
            usa_fondo_diario: false,
            cuota_diaria: g?.cuota_diaria ?? null,
            acumulado_mes: 0,
        });
    }
    for (const g of gastos) {
        if (!g.usa_fondo_diario)
            continue;
        const monto_periodo = sumarCuotasAplicadas(cuotasAplicadas, g.id, fechaDesdeYmd, fechaHastaYmd);
        const acumulado_mes = mes
            ? sumarCuotasAplicadas(cuotasAplicadas, g.id, mes.desde, mes.hasta)
            : monto_periodo;
        porId.set(g.id, {
            id: g.id,
            nombre: g.nombre,
            monto_mensual: Math.round(Number(g.monto_mensual) || 0),
            monto_periodo,
            usa_fondo_diario: true,
            cuota_diaria: g.cuota_diaria != null
                ? Math.max(0, Math.round(Number(g.cuota_diaria) || 0))
                : null,
            acumulado_mes,
        });
    }
    const detalle = gastos.map((g) => {
        const d = porId.get(g.id);
        if (d)
            return d;
        return {
            id: g.id,
            nombre: g.nombre,
            monto_mensual: Math.round(Number(g.monto_mensual) || 0),
            monto_periodo: 0,
            usa_fondo_diario: g.usa_fondo_diario,
            cuota_diaria: g.cuota_diaria != null
                ? Math.max(0, Math.round(Number(g.cuota_diaria) || 0))
                : null,
            acumulado_mes: 0,
        };
    });
    const total = detalle.reduce((s, d) => s + d.monto_periodo, 0);
    return { total, detalle };
}
function prorratearGastosFijos(gastos, fechaDesdeYmd, fechaHastaYmd) {
    const dias = eachYmdInclusive(fechaDesdeYmd, fechaHastaYmd);
    if (dias.length === 0 || gastos.length === 0) {
        return {
            total: 0,
            detalle: gastos.map((g) => ({
                id: g.id,
                nombre: g.nombre,
                monto_mensual: Math.round(Number(g.monto_mensual) || 0),
                monto_periodo: 0,
            })),
        };
    }
    const detalle = gastos.map((g) => {
        const mensual = Math.max(0, Number(g.monto_mensual) || 0);
        let acumulado = 0;
        for (const day of dias) {
            const dim = daysInMonth(day.y, day.m);
            if (dim > 0)
                acumulado += mensual / dim;
        }
        return {
            id: g.id,
            nombre: g.nombre,
            monto_mensual: Math.round(mensual),
            monto_periodo: Math.round(acumulado),
        };
    });
    const total = detalle.reduce((s, d) => s + d.monto_periodo, 0);
    return { total, detalle };
}
function armarResumenGanancias(input) {
    const ventas = Math.round(Number(input.ventas) || 0);
    const costo_ventas = input.lineas.reduce((s, l) => s + Math.round(Number(l.costo_total) || 0), 0);
    const ganancia_bruta = ventas - costo_ventas;
    const gastos_fijos = Math.round(Number(input.gastos_fijos) || 0);
    const gastos_extras = Math.round(Number(input.gastos_extras) || 0);
    const gastos_meseros = Math.round(Number(input.gastos_meseros) || 0);
    const gastos_total = gastos_fijos + gastos_extras + gastos_meseros;
    const ganancia_neta = ganancia_bruta - gastos_total;
    const unidades_vendidas = input.lineas.reduce((s, l) => s + Math.max(0, Number(l.cantidad) || 0), 0);
    const sinCosto = input.lineas.filter((l) => l.origen_costo === 'ninguno');
    const unidades_sin_costo = sinCosto.reduce((s, l) => s + Math.max(0, Number(l.cantidad) || 0), 0);
    const productos_sin_costo = new Set(sinCosto.map((l) => l.id_producto)).size;
    const margen_bruto_pct = ventas > 0
        ? Math.round((ganancia_bruta / ventas) * 10000) / 100
        : null;
    const margen_neto_pct = ventas > 0
        ? Math.round((ganancia_neta / ventas) * 10000) / 100
        : null;
    return {
        ventas,
        costo_ventas,
        ganancia_bruta,
        gastos_fijos,
        gastos_extras,
        gastos_meseros,
        gastos_total,
        ganancia_neta,
        margen_bruto_pct,
        margen_neto_pct,
        unidades_vendidas,
        unidades_sin_costo,
        productos_sin_costo,
    };
}
/** Agrupa líneas del mismo producto (suma cantidades / totales). */
function consolidarLineasCostoVenta(lineas) {
    const map = new Map();
    for (const l of lineas) {
        const prev = map.get(l.id_producto);
        if (!prev) {
            map.set(l.id_producto, { ...l });
            continue;
        }
        const cantidad = prev.cantidad + l.cantidad;
        const venta_total = prev.venta_total + l.venta_total;
        const costo_total = prev.costo_total + l.costo_total;
        const origen = prev.origen_costo === 'ninguno' || l.origen_costo === 'ninguno'
            ? 'ninguno'
            : prev.origen_costo === 'manual' || l.origen_costo === 'manual'
                ? 'manual'
                : 'receta';
        map.set(l.id_producto, {
            id_producto: l.id_producto,
            nombre: prev.nombre,
            cantidad,
            precio_venta_unitario: cantidad > 0 ? Math.round(venta_total / cantidad) : prev.precio_venta_unitario,
            costo_unitario: cantidad > 0 ? Math.round(costo_total / cantidad) : prev.costo_unitario,
            origen_costo: origen,
            venta_total,
            costo_total,
            ganancia: venta_total - costo_total,
        });
    }
    return [...map.values()].sort((a, b) => b.ganancia - a.ganancia);
}
function ymdEnRango(fechaYmd, desdeYmd, hastaYmd) {
    const f = parseYmd(fechaYmd);
    const a = parseYmd(desdeYmd);
    const b = parseYmd(hastaYmd);
    if (!f || !a || !b)
        return false;
    const ms = Date.UTC(f.y, f.m - 1, f.d);
    return ms >= Date.UTC(a.y, a.m - 1, a.d) && ms <= Date.UTC(b.y, b.m - 1, b.d);
}
