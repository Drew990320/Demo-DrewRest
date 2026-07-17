"use strict";
/**
 * Flags de comportamiento de una categoría de recurso.
 * El comportamiento efectivo sale de la categoría (configurable), no de if (clase === ...).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ESTADOS_RECURSO = exports.SEED_CATEGORIAS_RECURSO = exports.FLAGS_CATEGORIA_VACIO = void 0;
exports.esEstadoRecurso = esEstadoRecurso;
exports.parseFlagsCategoriaJson = parseFlagsCategoriaJson;
exports.flagsDesdeCategoriaRow = flagsDesdeCategoriaRow;
exports.categoriaCodigoParaClaseLegacy = categoriaCodigoParaClaseLegacy;
exports.estadoTrasStock = estadoTrasStock;
exports.FLAGS_CATEGORIA_VACIO = {
    controla_stock: false,
    se_consume_auto: false,
    puede_venderse: false,
    requiere_receta: false,
    controla_vencimiento: false,
    controla_lote: false,
    maneja_serie: false,
    requiere_mantenimiento: false,
    es_activo_fijo: false,
    permite_depreciacion: false,
    tiene_responsable: false,
    tiene_ubicacion: false,
    permite_prestamo: false,
};
const FLAGS_INGREDIENTE = {
    ...exports.FLAGS_CATEGORIA_VACIO,
    controla_stock: true,
    se_consume_auto: true,
    controla_vencimiento: true,
    controla_lote: true,
};
const FLAGS_PRODUCTO_VENTA = {
    ...exports.FLAGS_CATEGORIA_VACIO,
    controla_stock: true,
    se_consume_auto: true,
    puede_venderse: true,
};
const FLAGS_BEBIDA = {
    ...exports.FLAGS_CATEGORIA_VACIO,
    controla_stock: true,
    se_consume_auto: true,
    puede_venderse: true,
    controla_vencimiento: true,
};
const FLAGS_INSUMO = {
    ...exports.FLAGS_CATEGORIA_VACIO,
    controla_stock: true,
    se_consume_auto: false,
};
const FLAGS_ACTIVO = {
    ...exports.FLAGS_CATEGORIA_VACIO,
    controla_stock: true,
    es_activo_fijo: true,
    maneja_serie: true,
    requiere_mantenimiento: true,
    tiene_responsable: true,
    tiene_ubicacion: true,
    permite_prestamo: true,
    permite_depreciacion: true,
};
const FLAGS_HERRAMIENTA = {
    ...exports.FLAGS_CATEGORIA_VACIO,
    controla_stock: true,
    maneja_serie: true,
    tiene_ubicacion: true,
    permite_prestamo: true,
};
const FLAGS_EQUIPO = {
    ...FLAGS_ACTIVO,
};
const FLAGS_TECNOLOGIA = {
    ...FLAGS_ACTIVO,
};
const FLAGS_UNIFORME = {
    ...exports.FLAGS_CATEGORIA_VACIO,
    controla_stock: true,
    tiene_responsable: true,
    permite_prestamo: true,
};
const FLAGS_LIMPIEZA = {
    ...exports.FLAGS_CATEGORIA_VACIO,
    controla_stock: true,
    se_consume_auto: false,
};
const FLAGS_OTROS = {
    ...exports.FLAGS_CATEGORIA_VACIO,
    controla_stock: true,
};
/** Seed inicial de categorías (mapea presets de inventario-comportamiento). */
exports.SEED_CATEGORIAS_RECURSO = [
    {
        codigo: 'ingredientes',
        nombre: 'Ingredientes',
        descripcion: 'Insumos de producción / BOM',
        orden: 10,
        flags: FLAGS_INGREDIENTE,
        clases_legacy: ['produccion'],
    },
    {
        codigo: 'productos_venta',
        nombre: 'Productos venta',
        descripcion: 'Vendibles con stock comercial',
        orden: 20,
        flags: FLAGS_PRODUCTO_VENTA,
        clases_legacy: ['comercial'],
    },
    {
        codigo: 'bebidas',
        nombre: 'Bebidas',
        orden: 30,
        flags: FLAGS_BEBIDA,
    },
    {
        codigo: 'insumos',
        nombre: 'Insumos',
        descripcion: 'Consumibles internos',
        orden: 40,
        flags: FLAGS_INSUMO,
        clases_legacy: ['consumible_interno'],
    },
    {
        codigo: 'activos_fijos',
        nombre: 'Activos fijos',
        orden: 50,
        flags: FLAGS_ACTIVO,
        clases_legacy: ['activo_interno'],
    },
    {
        codigo: 'herramientas',
        nombre: 'Herramientas',
        orden: 60,
        flags: FLAGS_HERRAMIENTA,
    },
    {
        codigo: 'equipos',
        nombre: 'Equipos',
        orden: 70,
        flags: FLAGS_EQUIPO,
    },
    {
        codigo: 'tecnologia',
        nombre: 'Tecnología',
        orden: 80,
        flags: FLAGS_TECNOLOGIA,
    },
    {
        codigo: 'uniformes',
        nombre: 'Uniformes',
        orden: 90,
        flags: FLAGS_UNIFORME,
    },
    {
        codigo: 'limpieza',
        nombre: 'Limpieza',
        orden: 100,
        flags: FLAGS_LIMPIEZA,
    },
    {
        codigo: 'otros',
        nombre: 'Otros',
        orden: 110,
        flags: FLAGS_OTROS,
    },
];
exports.ESTADOS_RECURSO = [
    'activo',
    'agotado',
    'mantenimiento',
    'baja',
    'prestado',
];
function esEstadoRecurso(v) {
    return exports.ESTADOS_RECURSO.includes(v);
}
function parseFlagsCategoriaJson(raw) {
    const base = { ...exports.FLAGS_CATEGORIA_VACIO };
    if (!raw || typeof raw !== 'object')
        return base;
    for (const key of Object.keys(base)) {
        if (typeof raw[key] === 'boolean')
            base[key] = raw[key];
    }
    return base;
}
/** Resuelve flags efectivos desde fila de categoría (API/Prisma snake o camel). */
function flagsDesdeCategoriaRow(row) {
    const pick = (snake, camel) => {
        if (typeof row[snake] === 'boolean')
            return row[snake];
        if (typeof row[camel] === 'boolean')
            return row[camel];
        return false;
    };
    return {
        controla_stock: pick('controla_stock', 'controlaStock'),
        se_consume_auto: pick('se_consume_auto', 'seConsumeAuto'),
        puede_venderse: pick('puede_venderse', 'puedeVenderse'),
        requiere_receta: pick('requiere_receta', 'requiereReceta'),
        controla_vencimiento: pick('controla_vencimiento', 'controlaVencimiento'),
        controla_lote: pick('controla_lote', 'controlaLote'),
        maneja_serie: pick('maneja_serie', 'manejaSerie'),
        requiere_mantenimiento: pick('requiere_mantenimiento', 'requiereMantenimiento'),
        es_activo_fijo: pick('es_activo_fijo', 'esActivoFijo'),
        permite_depreciacion: pick('permite_depreciacion', 'permiteDepreciacion'),
        tiene_responsable: pick('tiene_responsable', 'tieneResponsable'),
        tiene_ubicacion: pick('tiene_ubicacion', 'tieneUbicacion'),
        permite_prestamo: pick('permite_prestamo', 'permitePrestamo'),
    };
}
function categoriaCodigoParaClaseLegacy(clase) {
    for (const seed of exports.SEED_CATEGORIAS_RECURSO) {
        if (seed.clases_legacy?.includes(clase))
            return seed.codigo;
    }
    return 'otros';
}
/** Estado derivado tras cambiar stock (si controla stock). */
function estadoTrasStock(stock, stockMin, estadoActual) {
    if (estadoActual === 'baja' || estadoActual === 'mantenimiento' || estadoActual === 'prestado') {
        return estadoActual;
    }
    if (stock <= 0)
        return 'agotado';
    return 'activo';
}
