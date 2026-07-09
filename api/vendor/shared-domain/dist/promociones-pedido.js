"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ETIQUETA_LEGACY_MULERO = void 0;
exports.parseReglasPromocion = parseReglasPromocion;
exports.parseEtiquetasPedido = parseEtiquetasPedido;
exports.calcularDescuentoPromociones = calcularDescuentoPromociones;
exports.migrarLegacyConfigPromociones = migrarLegacyConfigPromociones;
exports.nuevaReglaPromocionId = nuevaReglaPromocionId;
exports.nuevaEtiquetaPedidoId = nuevaEtiquetaPedidoId;
exports.ETIQUETA_LEGACY_MULERO = 'cliente_especial';
function isRecord(v) {
    return typeof v === 'object' && v != null && !Array.isArray(v);
}
function parseReglaPorCategoria(raw) {
    if (raw.tipo !== 'por_categoria')
        return null;
    const id = String(raw.id ?? '').trim();
    const idCategoria = Number(raw.id_categoria);
    const monto = Math.round(Number(raw.monto_por_unidad) || 0);
    const minUnidades = Math.max(1, Math.round(Number(raw.min_unidades) || 2));
    const minOtros = Math.round(Number(raw.min_subtotal_otros) || 0);
    if (!id || !Number.isFinite(idCategoria) || idCategoria < 1)
        return null;
    const etiqueta = String(raw.etiqueta ?? '').trim() || `Promo cat. ${idCategoria}`;
    return {
        id,
        activa: raw.activa !== false,
        etiqueta,
        tipo: 'por_categoria',
        id_categoria: idCategoria,
        monto_por_unidad: monto,
        min_unidades: minUnidades,
        min_subtotal_otros: minOtros,
    };
}
function parseReglaPorCategoriaMarcada(raw) {
    if (raw.tipo !== 'por_categoria_marcada')
        return null;
    const id = String(raw.id ?? '').trim();
    const monto = Math.round(Number(raw.monto_por_unidad) || 0);
    const minUnidades = Math.max(1, Math.round(Number(raw.min_unidades) || 2));
    const minOtros = Math.round(Number(raw.min_subtotal_otros) || 0);
    if (!id)
        return null;
    const etiqueta = String(raw.etiqueta ?? '').trim() || 'Promoción por categoría marcada';
    return {
        id,
        activa: raw.activa !== false,
        etiqueta,
        tipo: 'por_categoria_marcada',
        monto_por_unidad: monto,
        min_unidades: minUnidades,
        min_subtotal_otros: minOtros,
    };
}
function parseReglaPorPlatoPrincipal(raw) {
    if (raw.tipo !== 'por_plato_principal')
        return null;
    const id = String(raw.id ?? '').trim();
    const monto = Math.round(Number(raw.monto_por_unidad) || 0);
    const minUnidades = Math.max(1, Math.round(Number(raw.min_unidades) || 1));
    if (!id)
        return null;
    const etiqueta = String(raw.etiqueta ?? '').trim() || 'Promoción por plato principal';
    const req = raw.requiere_etiqueta_pedido;
    return {
        id,
        activa: raw.activa !== false,
        etiqueta,
        tipo: 'por_plato_principal',
        monto_por_unidad: monto,
        min_unidades: minUnidades,
        ...(typeof req === 'string' && req.trim()
            ? { requiere_etiqueta_pedido: req.trim() }
            : {}),
    };
}
function parseReglaPrecioFijoCategoria(raw) {
    if (raw.tipo !== 'precio_fijo_categoria')
        return null;
    const id = String(raw.id ?? '').trim();
    const idCategoria = Number(raw.id_categoria);
    const precio = Math.round(Number(raw.precio_fijo_unidad) || 0);
    const req = String(raw.requiere_etiqueta_pedido ?? '').trim();
    if (!id || !Number.isFinite(idCategoria) || idCategoria < 1 || precio < 0 || !req) {
        return null;
    }
    const etiqueta = String(raw.etiqueta ?? '').trim() || `Precio fijo cat. ${idCategoria}`;
    return {
        id,
        activa: raw.activa !== false,
        etiqueta,
        tipo: 'precio_fijo_categoria',
        id_categoria: idCategoria,
        precio_fijo_unidad: precio,
        requiere_etiqueta_pedido: req,
    };
}
function parseReglaCompraPaga(raw) {
    if (raw.tipo !== 'compra_paga')
        return null;
    const id = String(raw.id ?? '').trim();
    const compra = Math.max(2, Math.round(Number(raw.compra_unidades) || 2));
    const paga = Math.max(1, Math.round(Number(raw.paga_unidades) || 1));
    if (!id || paga >= compra)
        return null;
    const alcanceRaw = String(raw.alcance ?? 'categoria');
    const alcance = alcanceRaw === 'producto' ? 'producto' : 'categoria';
    const idCategoria = raw.id_categoria != null ? Number(raw.id_categoria) : undefined;
    const idProducto = raw.id_producto != null ? Number(raw.id_producto) : undefined;
    if (alcance === 'categoria' && (!idCategoria || idCategoria < 1))
        return null;
    if (alcance === 'producto' && (!idProducto || idProducto < 1))
        return null;
    const etiqueta = String(raw.etiqueta ?? '').trim() || `${compra}x${paga}`;
    const req = raw.requiere_etiqueta_pedido;
    const minSub = raw.min_subtotal_pedido;
    return {
        id,
        activa: raw.activa !== false,
        etiqueta,
        tipo: 'compra_paga',
        alcance,
        ...(alcance === 'categoria' && idCategoria
            ? { id_categoria: idCategoria }
            : {}),
        ...(alcance === 'producto' && idProducto ? { id_producto: idProducto } : {}),
        compra_unidades: compra,
        paga_unidades: paga,
        ...(typeof req === 'string' && req.trim()
            ? { requiere_etiqueta_pedido: req.trim() }
            : {}),
        ...(minSub != null && Number(minSub) > 0
            ? { min_subtotal_pedido: Math.round(Number(minSub)) }
            : {}),
    };
}
function parseReglaUmbralSubtotal(raw) {
    if (raw.tipo !== 'umbral_subtotal_pedido')
        return null;
    const id = String(raw.id ?? '').trim();
    const minSub = Math.round(Number(raw.min_subtotal_pedido) || 0);
    const monto = raw.monto_descuento != null ? Math.round(Number(raw.monto_descuento)) : undefined;
    const pct = raw.porcentaje_descuento != null
        ? Math.min(100, Math.max(0, Math.round(Number(raw.porcentaje_descuento))))
        : undefined;
    if (!id || minSub <= 0 || ((monto ?? 0) <= 0 && (pct ?? 0) <= 0))
        return null;
    const etiqueta = String(raw.etiqueta ?? '').trim() || 'Descuento por consumo';
    const req = raw.requiere_etiqueta_pedido;
    return {
        id,
        activa: raw.activa !== false,
        etiqueta,
        tipo: 'umbral_subtotal_pedido',
        min_subtotal_pedido: minSub,
        ...(monto != null && monto > 0 ? { monto_descuento: monto } : {}),
        ...(pct != null && pct > 0 ? { porcentaje_descuento: pct } : {}),
        ...(typeof req === 'string' && req.trim()
            ? { requiere_etiqueta_pedido: req.trim() }
            : {}),
    };
}
function parseRegla(raw) {
    return (parseReglaPorCategoria(raw) ??
        parseReglaPorCategoriaMarcada(raw) ??
        parseReglaPorPlatoPrincipal(raw) ??
        parseReglaPrecioFijoCategoria(raw) ??
        parseReglaCompraPaga(raw) ??
        parseReglaUmbralSubtotal(raw));
}
/** Normaliza JSON de BD/API a reglas válidas. */
function parseReglasPromocion(raw) {
    if (!Array.isArray(raw))
        return [];
    const out = [];
    const seen = new Set();
    for (const item of raw) {
        if (!isRecord(item))
            continue;
        const regla = parseRegla(item);
        if (!regla || seen.has(regla.id))
            continue;
        seen.add(regla.id);
        out.push(regla);
    }
    return out;
}
function parseEtiquetasPedido(raw) {
    if (!Array.isArray(raw))
        return [];
    const out = [];
    const seen = new Set();
    for (const item of raw) {
        if (!isRecord(item))
            continue;
        const id = String(item.id ?? '').trim();
        const etiqueta = String(item.etiqueta ?? '').trim();
        if (!id || !etiqueta || seen.has(id))
            continue;
        seen.add(id);
        out.push({
            id,
            etiqueta,
            activa: item.activa !== false,
            ...(typeof item.descripcion === 'string' && item.descripcion.trim()
                ? { descripcion: item.descripcion.trim() }
                : {}),
        });
    }
    return out;
}
function lineaMarcadaPromo(linea) {
    if (linea.participa_descuento_sopas != null) {
        return linea.participa_descuento_sopas;
    }
    const cat = (linea.categoria_nombre ?? '').toLowerCase();
    const nom = (linea.nombre_producto ?? '').toLowerCase();
    return cat.includes('sopa') || nom.includes('sopa');
}
function calcReglaPorCategoria(lineas, regla) {
    if (!regla.activa || regla.monto_por_unidad <= 0)
        return 0;
    const enCategoria = lineas.filter((l) => l.id_categoria === regla.id_categoria);
    const cant = enCategoria.reduce((s, l) => s + l.cantidad, 0);
    if (cant < regla.min_unidades)
        return 0;
    const otras = lineas.filter((l) => l.id_categoria !== regla.id_categoria);
    if (otras.length === 0)
        return 0;
    const subtotalOtras = otras.reduce((s, l) => s + l.subtotal_linea, 0);
    if (subtotalOtras <= regla.min_subtotal_otros)
        return 0;
    return cant * Math.round(regla.monto_por_unidad);
}
function calcReglaPorCategoriaMarcada(lineas, regla) {
    if (!regla.activa || regla.monto_por_unidad <= 0)
        return 0;
    const marcadas = lineas.filter(lineaMarcadaPromo);
    const cant = marcadas.reduce((s, l) => s + l.cantidad, 0);
    if (cant < regla.min_unidades)
        return 0;
    const otras = lineas.filter((l) => !lineaMarcadaPromo(l));
    if (otras.length === 0)
        return 0;
    const subtotalOtras = otras.reduce((s, l) => s + l.subtotal_linea, 0);
    if (subtotalOtras <= regla.min_subtotal_otros)
        return 0;
    return cant * Math.round(regla.monto_por_unidad);
}
function precioUnitarioLinea(linea) {
    if (linea.precio_unitario != null && linea.precio_unitario > 0) {
        return Math.round(linea.precio_unitario);
    }
    if (linea.cantidad > 0) {
        return Math.round(linea.subtotal_linea / linea.cantidad);
    }
    return 0;
}
function etiquetaPermiteRegla(requiere, etiquetasPedido) {
    if (!requiere)
        return true;
    return etiquetasPedido.has(requiere);
}
function subtotalLineas(lineas) {
    return lineas.reduce((s, l) => s + l.subtotal_linea, 0);
}
function calcReglaPorPlatoPrincipal(lineas, regla, etiquetasPedido) {
    if (!regla.activa || regla.monto_por_unidad <= 0)
        return 0;
    if (!etiquetaPermiteRegla(regla.requiere_etiqueta_pedido, etiquetasPedido)) {
        return 0;
    }
    const cant = lineas
        .filter((l) => l.es_plato_principal)
        .reduce((s, l) => s + l.cantidad, 0);
    if (cant < regla.min_unidades)
        return 0;
    return cant * Math.round(regla.monto_por_unidad);
}
function calcReglaPrecioFijoCategoria(lineas, regla, etiquetasPedido) {
    if (!regla.activa)
        return 0;
    if (!etiquetaPermiteRegla(regla.requiere_etiqueta_pedido, etiquetasPedido)) {
        return 0;
    }
    let desc = 0;
    for (const l of lineas) {
        if (l.id_categoria !== regla.id_categoria)
            continue;
        const objetivo = regla.precio_fijo_unidad * l.cantidad;
        if (l.subtotal_linea > objetivo) {
            desc += l.subtotal_linea - objetivo;
        }
    }
    return desc;
}
function calcReglaCompraPaga(lineas, regla, etiquetasPedido) {
    if (!regla.activa)
        return 0;
    if (!etiquetaPermiteRegla(regla.requiere_etiqueta_pedido, etiquetasPedido)) {
        return 0;
    }
    if (regla.min_subtotal_pedido != null &&
        regla.min_subtotal_pedido > 0 &&
        subtotalLineas(lineas) < regla.min_subtotal_pedido) {
        return 0;
    }
    const unidadesGratisPorPromo = regla.compra_unidades - regla.paga_unidades;
    if (regla.alcance === 'producto' && regla.id_producto != null) {
        let total = 0;
        for (const l of lineas) {
            if (l.id_producto !== regla.id_producto)
                continue;
            const sets = Math.floor(l.cantidad / regla.compra_unidades);
            total += sets * unidadesGratisPorPromo * precioUnitarioLinea(l);
        }
        return total;
    }
    if (regla.id_categoria == null)
        return 0;
    const enCategoria = lineas.filter((l) => l.id_categoria === regla.id_categoria);
    const cant = enCategoria.reduce((s, l) => s + l.cantidad, 0);
    if (cant < regla.compra_unidades)
        return 0;
    const sub = enCategoria.reduce((s, l) => s + l.subtotal_linea, 0);
    const puPromedio = cant > 0 ? Math.round(sub / cant) : 0;
    const sets = Math.floor(cant / regla.compra_unidades);
    return sets * unidadesGratisPorPromo * puPromedio;
}
function calcReglaUmbralSubtotal(lineas, regla, etiquetasPedido) {
    if (!regla.activa)
        return 0;
    if (!etiquetaPermiteRegla(regla.requiere_etiqueta_pedido, etiquetasPedido)) {
        return 0;
    }
    const sub = subtotalLineas(lineas);
    if (sub < regla.min_subtotal_pedido)
        return 0;
    if (regla.monto_descuento != null && regla.monto_descuento > 0) {
        return Math.min(Math.round(regla.monto_descuento), sub);
    }
    if (regla.porcentaje_descuento != null && regla.porcentaje_descuento > 0) {
        return Math.min(Math.round((sub * regla.porcentaje_descuento) / 100), sub);
    }
    return 0;
}
function calcularDescuentoPromociones(lineas, reglas, etiquetasPedido = []) {
    const lista = Array.isArray(reglas)
        ? reglas.every((r) => r && typeof r === 'object' && 'tipo' in r)
            ? reglas
            : parseReglasPromocion(reglas)
        : parseReglasPromocion(reglas);
    const etiquetas = new Set(etiquetasPedido);
    const desglose = [];
    let total = 0;
    for (const regla of lista) {
        let monto = 0;
        if (regla.tipo === 'por_categoria') {
            monto = calcReglaPorCategoria(lineas, regla);
        }
        else if (regla.tipo === 'por_categoria_marcada') {
            monto = calcReglaPorCategoriaMarcada(lineas, regla);
        }
        else if (regla.tipo === 'por_plato_principal') {
            monto = calcReglaPorPlatoPrincipal(lineas, regla, etiquetas);
        }
        else if (regla.tipo === 'precio_fijo_categoria') {
            monto = calcReglaPrecioFijoCategoria(lineas, regla, etiquetas);
        }
        else if (regla.tipo === 'compra_paga') {
            monto = calcReglaCompraPaga(lineas, regla, etiquetas);
        }
        else if (regla.tipo === 'umbral_subtotal_pedido') {
            monto = calcReglaUmbralSubtotal(lineas, regla, etiquetas);
        }
        if (monto <= 0)
            continue;
        desglose.push({ id: regla.id, etiqueta: regla.etiqueta, monto });
        total += monto;
    }
    return { total, desglose };
}
/** Convierte columnas legacy de config_descuento a reglas unificadas (solo si faltan). */
function migrarLegacyConfigPromociones(cfg) {
    const reglas = parseReglasPromocion(cfg.reglas_promocion ?? []);
    const etiquetas = parseEtiquetasPedido(cfg.etiquetas_pedido ?? []);
    const ids = new Set(reglas.map((r) => r.id));
    if (cfg.sopas_activo &&
        !ids.has('legacy-sopas') &&
        Math.round(Number(cfg.sopas_monto_por_unidad) || 0) > 0) {
        reglas.push({
            id: 'legacy-sopas',
            activa: true,
            etiqueta: 'Promoción por categoría marcada',
            tipo: 'por_categoria_marcada',
            monto_por_unidad: Math.round(Number(cfg.sopas_monto_por_unidad) || 0),
            min_unidades: Math.max(1, Math.round(cfg.sopas_min_unidades ?? 2)),
            min_subtotal_otros: Math.round(Number(cfg.umbral_subtotal_otros) || 0),
        });
        ids.add('legacy-sopas');
    }
    const tieneEtiquetaMulero = etiquetas.some((e) => e.id === exports.ETIQUETA_LEGACY_MULERO);
    if (!tieneEtiquetaMulero && cfg.muleros_activo) {
        etiquetas.push({
            id: exports.ETIQUETA_LEGACY_MULERO,
            etiqueta: 'Cliente especial',
            activa: true,
            descripcion: 'Activa promociones que requieren esta etiqueta en el pedido.',
        });
    }
    if (cfg.muleros_activo &&
        !ids.has('legacy-plato-principal') &&
        Math.round(Number(cfg.muleros_monto_por_plato_principal) || 0) > 0) {
        reglas.push({
            id: 'legacy-plato-principal',
            activa: true,
            etiqueta: 'Promoción por plato principal',
            tipo: 'por_plato_principal',
            monto_por_unidad: Math.round(Number(cfg.muleros_monto_por_plato_principal) || 0),
            min_unidades: Math.max(1, Math.round(cfg.muleros_min_platos_principales ?? 1)),
            requiere_etiqueta_pedido: exports.ETIQUETA_LEGACY_MULERO,
        });
    }
    return { reglas, etiquetas_pedido: etiquetas };
}
function nuevaReglaPromocionId() {
    return `promo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
function nuevaEtiquetaPedidoId() {
    return `etq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
