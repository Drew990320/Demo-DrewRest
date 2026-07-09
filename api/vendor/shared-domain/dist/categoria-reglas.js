"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reglasCategoriaPorDefecto = reglasCategoriaPorDefecto;
exports.inferirReglasCategoriaDesdeNombre = inferirReglasCategoriaDesdeNombre;
exports.resolverReglasCategoria = resolverReglasCategoria;
exports.categoriaEsBebida = categoriaEsBebida;
exports.categoriaCobraEmpaqueParaLlevar = categoriaCobraEmpaqueParaLlevar;
exports.categoriaEsLineaEmpaque = categoriaEsLineaEmpaque;
exports.categoriaVisibleEnMostrador = categoriaVisibleEnMostrador;
exports.debeMarcarCocina = debeMarcarCocina;
function pickBool(snake, camel) {
    return snake ?? camel;
}
function pickTipo(snake, camel) {
    return snake ?? camel;
}
/** Defaults neutros en runtime cuando el admin no configuró flags explícitos. */
function reglasCategoriaPorDefecto(nombre) {
    return {
        nombre: nombre.trim(),
        es_bebida: false,
        cobra_empaque_para_llevar: false,
        participa_descuento_sopas: false,
        es_linea_empaque: false,
        visible_en_mostrador: false,
        tipo_linea_cocina_default: 'plato',
        es_plato_principal_default: false,
        prioridad_cocina_baja: false,
    };
}
/**
 * Sugerencias al crear categoría (seed, demo, admin al escribir nombre).
 * No usar en runtime para decidir comportamiento del menú o cocina.
 */
function inferirReglasCategoriaDesdeNombre(nombre) {
    const n = nombre.trim();
    const lower = n.toLowerCase();
    const esBebida = lower.includes('bebida');
    const esLineaEmpaque = lower.includes('empaque');
    const participaSopas = lower.includes('sopa');
    const esPlatoPrincipal = n.startsWith('Platos fuertes') || n === 'Menú infantil';
    const prioridadBaja = lower.includes('cerdo') ||
        lower.includes('para compartir') ||
        lower.includes('parrillada');
    const cobraEmpaque = esPlatoPrincipal;
    let tipo = 'plato';
    if (lower.includes('entrada') || lower.includes('adicional')) {
        tipo = 'entrada';
    }
    return {
        nombre: n,
        es_bebida: esBebida,
        cobra_empaque_para_llevar: cobraEmpaque,
        participa_descuento_sopas: participaSopas,
        es_linea_empaque: esLineaEmpaque,
        visible_en_mostrador: esBebida,
        tipo_linea_cocina_default: tipo,
        es_plato_principal_default: esPlatoPrincipal,
        prioridad_cocina_baja: prioridadBaja,
    };
}
/** Resuelve reglas: flags explícitos de BD; si faltan, defaults neutros (sin inferir nombre). */
function resolverReglasCategoria(input) {
    const defaults = reglasCategoriaPorDefecto(input.nombre);
    return {
        nombre: input.nombre,
        es_bebida: pickBool(input.es_bebida, input.esBebida) ?? defaults.es_bebida,
        cobra_empaque_para_llevar: pickBool(input.cobra_empaque_para_llevar, input.cobraEmpaqueParaLlevar) ?? defaults.cobra_empaque_para_llevar,
        participa_descuento_sopas: pickBool(input.participa_descuento_sopas, input.participaDescuentoSopas) ?? defaults.participa_descuento_sopas,
        es_linea_empaque: pickBool(input.es_linea_empaque, input.esLineaEmpaque) ??
            defaults.es_linea_empaque,
        visible_en_mostrador: pickBool(input.visible_en_mostrador, input.visibleEnMostrador) ??
            defaults.visible_en_mostrador,
        tipo_linea_cocina_default: pickTipo(input.tipo_linea_cocina_default, input.tipoLineaCocinaDefault) ?? defaults.tipo_linea_cocina_default,
        es_plato_principal_default: pickBool(input.es_plato_principal_default, input.esPlatoPrincipalDefault) ?? defaults.es_plato_principal_default,
        prioridad_cocina_baja: pickBool(input.prioridad_cocina_baja, input.prioridadCocinaBaja) ??
            defaults.prioridad_cocina_baja,
    };
}
function normalizarCategoria(categoria) {
    if (typeof categoria === 'string') {
        return resolverReglasCategoria({ nombre: categoria });
    }
    return resolverReglasCategoria(categoria);
}
function categoriaEsBebida(categoria) {
    return normalizarCategoria(categoria).es_bebida;
}
function categoriaCobraEmpaqueParaLlevar(categoria) {
    return normalizarCategoria(categoria).cobra_empaque_para_llevar;
}
function categoriaEsLineaEmpaque(categoria) {
    return normalizarCategoria(categoria).es_linea_empaque;
}
function categoriaVisibleEnMostrador(categoria) {
    return normalizarCategoria(categoria).visible_en_mostrador;
}
function debeMarcarCocina(categoria, esEmpacable) {
    const r = normalizarCategoria(categoria);
    return !r.es_bebida && !esEmpacable && !r.es_linea_empaque;
}
