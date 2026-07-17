"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aplicarMovimientos = aplicarMovimientos;
exports.planificarDeduccionVentaComercial = planificarDeduccionVentaComercial;
exports.planificarDeduccionReceta = planificarDeduccionReceta;
exports.articuloBajoMinimo = articuloBajoMinimo;
const inventario_comportamiento_1 = require("./inventario-comportamiento");
const inventario_deduccion_1 = require("./inventario-deduccion");
const inventario_movimientos_1 = require("./inventario-movimientos");
const inventario_receta_1 = require("./inventario-receta");
const inventario_unidades_1 = require("./inventario-unidades");
function aplicarMovimientos(articulos, movimientos) {
    const next = new Map(articulos);
    const rechazados = [];
    for (const mov of movimientos) {
        const art = next.get(mov.id_articulo);
        if (!art) {
            rechazados.push({
                id_articulo: mov.id_articulo,
                motivo: 'Artículo no encontrado',
            });
            continue;
        }
        const delta = (0, inventario_movimientos_1.esMovimientoEntrada)(mov.tipo_mov)
            ? Math.abs(mov.delta)
            : mov.delta;
        const nuevo = (0, inventario_unidades_1.redondearInventario)(art.cantidad_actual + delta);
        // Se permite stock negativo: las ventas siguen mientras el admin compra;
        // al registrar el ingreso se suma sobre el déficit (ej. -3 + 10 = 7).
        next.set(mov.id_articulo, { ...art, cantidad_actual: nuevo });
    }
    return { articulos: next, rechazados };
}
function planificarDeduccionVentaComercial(input) {
    const politica = input.politica ?? inventario_deduccion_1.POLITICA_DEDUCCION_DEFAULT;
    if (!(0, inventario_deduccion_1.debeDeducirEnEvento)({
        comportamiento: input.articulo.comportamiento,
        clase: input.articulo.clase,
        evento: input.evento,
        politica,
    })) {
        return [];
    }
    if (!(0, inventario_comportamiento_1.comportamientoPermiteVentaDirecta)(input.articulo.comportamiento)) {
        return [];
    }
    if (input.linea.cantidad <= 0)
        return [];
    return [
        {
            id_articulo: input.articulo.id_articulo,
            tipo_mov: 'venta',
            delta: -input.linea.cantidad,
            unidad: input.articulo.unidad_stock,
            costo_unitario: input.articulo.costo_unitario,
            modulo_origen: 'pedido',
            id_pedido: input.id_pedido,
            id_detalle_pedido: input.linea.id_detalle_pedido,
            observacion: input.linea.nombre_producto,
        },
    ];
}
function planificarDeduccionReceta(input) {
    const politica = input.politica ?? inventario_deduccion_1.POLITICA_DEDUCCION_DEFAULT;
    const advertencias = [];
    if (!(0, inventario_deduccion_1.debeDeducirEnEvento)({
        comportamiento: (0, inventario_comportamiento_1.resolverComportamiento)('produccion'),
        clase: 'produccion',
        evento: input.evento,
        politica,
        es_consumo_por_receta: true,
    })) {
        return { evento: input.evento, movimientos: [], advertencias };
    }
    const articulosReceta = new Map();
    for (const [id, a] of input.articulos) {
        articulosReceta.set(id, a);
    }
    const r = (0, inventario_receta_1.calcularConsumoReceta)(input.receta, input.linea.cantidad, articulosReceta, input.recetas ?? new Map(), input.conversiones ?? []);
    if (!r.ok) {
        advertencias.push(...r.errores.map((e) => e.mensaje));
        return { evento: input.evento, movimientos: [], advertencias };
    }
    const movimientos = r.movimientos.map((m) => ({
        ...m,
        id_pedido: input.id_pedido,
        id_detalle_pedido: input.linea.id_detalle_pedido,
        modulo_origen: 'cocina',
    }));
    return { evento: input.evento, movimientos, advertencias };
}
function articuloBajoMinimo(a) {
    return a.cantidad_actual <= a.cantidad_minima;
}
