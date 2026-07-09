"use strict";
/**
 * Ítem interno «Saldo pendiente»: absorbe abonos parciales (plan personas / combinado)
 * sin partir platos reales del pedido.
 *
 * - Mesa: oculto (mismo flag es_cuota_pendiente_reparto).
 * - Cobro: línea cobrable del reparto; los platos del alcance quedan intactos.
 * - Al liquidar el saldo, solo se marcan cobrados los platos del alcance
 *   (todos en personas; pool en combinado).
 *
 * Nota:
 * - `saldo_restante` → reparto sobre el total del pedido.
 * - `saldo_restante@1:2,5:1` → pool combinado (id_detalle:cantidad).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SALDO_ABONO_NOTA = exports.SALDO_RESTANTE_FRAGMENTO_NOTA = exports.SALDO_RESTANTE_NOTA = exports.NOMBRE_DISPLAY_SALDO_PENDIENTE = exports.NOMBRE_PRODUCTO_SALDO_RESTANTE = void 0;
exports.esNotaSaldoRestantePendiente = esNotaSaldoRestantePendiente;
exports.esNotaSaldoFragmentoHuerfano = esNotaSaldoFragmentoHuerfano;
exports.esNotaSaldoAbono = esNotaSaldoAbono;
exports.esDetalleSaldoRestante = esDetalleSaldoRestante;
exports.formatSaldoRestanteNota = formatSaldoRestanteNota;
exports.parseSaldoRestantePool = parseSaldoRestantePool;
exports.notaDisplaySaldoPendiente = notaDisplaySaldoPendiente;
exports.montoSaldoRestantePendiente = montoSaldoRestantePendiente;
exports.detalleSaldoRestantePendiente = detalleSaldoRestantePendiente;
exports.distribuirSaldoEnPlatos = distribuirSaldoEnPlatos;
exports.saldoNecesitaReconciliarAPlatos = saldoNecesitaReconciliarAPlatos;
exports.NOMBRE_PRODUCTO_SALDO_RESTANTE = 'Saldo restante';
/** Nombre visible en app / ticket. */
exports.NOMBRE_DISPLAY_SALDO_PENDIENTE = 'Saldo pendiente';
/** Línea pendiente con el monto aún por cobrar. */
exports.SALDO_RESTANTE_NOTA = 'saldo_restante';
/**
 * Remanente tras repartir el saldo en platos enteros (no absorbe platos).
 * Ej.: cuota omitida que no alcanza para otro plato del menú.
 */
exports.SALDO_RESTANTE_FRAGMENTO_NOTA = 'saldo_restante#fragmento';
/** Abono ya aplicado (ligado a una factura). */
exports.SALDO_ABONO_NOTA = 'saldo_restante:abono';
function esNotaSaldoRestantePendiente(nota) {
    const n = (nota ?? '').trim();
    return (n === exports.SALDO_RESTANTE_NOTA ||
        n === exports.SALDO_RESTANTE_FRAGMENTO_NOTA ||
        n.startsWith(`${exports.SALDO_RESTANTE_NOTA}@`));
}
/** Saldo ya reconciliado a platos: solo el fragmento huérfano. */
function esNotaSaldoFragmentoHuerfano(nota) {
    return (nota ?? '').trim() === exports.SALDO_RESTANTE_FRAGMENTO_NOTA;
}
function esNotaSaldoAbono(nota) {
    return (nota ?? '').trim().startsWith(exports.SALDO_ABONO_NOTA);
}
function esDetalleSaldoRestante(d) {
    if (esNotaSaldoRestantePendiente(d.nota_cocina) || esNotaSaldoAbono(d.nota_cocina)) {
        return true;
    }
    return (Boolean(d.es_cuota_pendiente_reparto) &&
        (d.nombre_producto === exports.NOMBRE_PRODUCTO_SALDO_RESTANTE ||
            d.nombre_producto === exports.NOMBRE_DISPLAY_SALDO_PENDIENTE ||
            d.nombre_producto === 'Saldo pendiente reparto'));
}
/** Codifica el alcance del saldo (total o pool combinado). */
function formatSaldoRestanteNota(pool) {
    if (pool == null || pool.length === 0)
        return exports.SALDO_RESTANTE_NOTA;
    const parts = pool
        .filter((p) => p.id_detalle > 0 && p.cantidad > 0)
        .map((p) => `${p.id_detalle}:${p.cantidad}`);
    if (parts.length === 0)
        return exports.SALDO_RESTANTE_NOTA;
    return `${exports.SALDO_RESTANTE_NOTA}@${parts.join(',')}`;
}
/** Pool de platos del saldo combinado; `null` = sobre el total. */
function parseSaldoRestantePool(nota) {
    const n = (nota ?? '').trim();
    if (!esNotaSaldoRestantePendiente(n))
        return null;
    if (n === exports.SALDO_RESTANTE_NOTA)
        return null;
    const payload = n.slice(exports.SALDO_RESTANTE_NOTA.length + 1);
    if (!payload)
        return null;
    const out = [];
    for (const part of payload.split(',')) {
        const [idRaw, qtyRaw] = part.split(':');
        const id_detalle = Number(idRaw);
        const cantidad = Number(qtyRaw);
        if (!Number.isFinite(id_detalle) || id_detalle <= 0)
            continue;
        if (!Number.isFinite(cantidad) || cantidad <= 0)
            continue;
        out.push({ id_detalle, cantidad });
    }
    return out.length > 0 ? out : null;
}
/** Etiqueta legible del pool (nombres de platos) para la UI. */
function notaDisplaySaldoPendiente(nota, nombresPorDetalle) {
    const pool = parseSaldoRestantePool(nota);
    if (pool == null || pool.length === 0)
        return null;
    const getNombre = (id) => {
        if (!nombresPorDetalle)
            return `#${id}`;
        if (nombresPorDetalle instanceof Map) {
            return nombresPorDetalle.get(id) ?? `#${id}`;
        }
        return nombresPorDetalle[id] ?? `#${id}`;
    };
    const labels = pool.map((p) => {
        const nombre = getNombre(p.id_detalle);
        return p.cantidad > 1 ? `${p.cantidad}× ${nombre}` : nombre;
    });
    return `Reparto de: ${labels.join(', ')}`;
}
/** Monto pendiente del saldo (solo líneas no cobradas de saldo pendiente). */
function montoSaldoRestantePendiente(detalles) {
    return detalles
        .filter((d) => !d.cobrado &&
        d.id_factura == null &&
        esNotaSaldoRestantePendiente(d.nota_cocina))
        .reduce((s, d) => s + Math.round(d.precio_unitario) * d.cantidad, 0);
}
/** Detalle de saldo pendiente aún no cobrado (si existe). */
function detalleSaldoRestantePendiente(detalles) {
    return detalles.find((d) => !d.cobrado &&
        d.id_factura == null &&
        esNotaSaldoRestantePendiente(d.nota_cocina));
}
/**
 * Reparte un saldo pendiente en unidades enteras del menú (sin partir precios).
 * Prioriza mayor precio unitario. Ej.: saldo 150.000 y 3× picada 100.000
 * → libera 1 picada y deja 50.000 como saldo pendiente.
 */
function distribuirSaldoEnPlatos(saldoMonto, platos) {
    let resto = Math.max(0, Math.round(saldoMonto));
    if (resto <= 0 || platos.length === 0) {
        return {
            idsLiberados: [],
            liberaciones: [],
            montoPlatos: 0,
            montoSaldoRestante: resto,
        };
    }
    const ordenados = platos
        .map((p) => ({
        id_detalle: p.id_detalle,
        precio_unitario: Math.round(p.precio_unitario),
        cantidad: Math.max(1, p.cantidad),
    }))
        .filter((p) => p.precio_unitario > 0)
        .sort((a, b) => b.precio_unitario - a.precio_unitario ||
        a.id_detalle - b.id_detalle);
    const liberaciones = [];
    for (const p of ordenados) {
        if (p.precio_unitario > resto)
            continue;
        const maxUnidades = Math.min(p.cantidad, Math.floor(resto / p.precio_unitario));
        if (maxUnidades < 1)
            continue;
        liberaciones.push({ id_detalle: p.id_detalle, cantidad: maxUnidades });
        resto -= maxUnidades * p.precio_unitario;
        if (resto <= 0)
            break;
    }
    const montoPlatos = Math.max(0, Math.round(saldoMonto) - resto);
    return {
        idsLiberados: liberaciones.map((l) => l.id_detalle),
        liberaciones,
        montoPlatos,
        montoSaldoRestante: resto,
    };
}
/**
 * True si los platos pendientes aún están «absorbidos» por el saldo (reparto
 * personas/combinado sin reconciliar a platos): el valor de platos supera al saldo.
 */
function saldoNecesitaReconciliarAPlatos(montoSaldo, platosPendientes, notaSaldo) {
    if (montoSaldo <= 0)
        return false;
    const totalPlatos = platosPendientes.reduce((s, p) => s + Math.round(p.precio_unitario) * Math.max(1, p.cantidad), 0);
    // Fragmento sin platos pendientes: reconcile previo falló (marcó todo cobrado).
    if (esNotaSaldoFragmentoHuerfano(notaSaldo)) {
        return totalPlatos === 0;
    }
    // Platos absorbidos aún valen más que el saldo → hay que repartir.
    return totalPlatos > montoSaldo;
}
