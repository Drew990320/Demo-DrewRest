"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolverReglasCategoria = exports.reglasCategoriaPorDefecto = exports.inferirReglasCategoriaDesdeNombre = exports.debeMarcarCocina = exports.categoriaVisibleEnMostrador = exports.categoriaEsLineaEmpaque = exports.categoriaCobraEmpaqueParaLlevar = exports.categoriaEsBebida = void 0;
exports.tipoLineaCocina = tipoLineaCocina;
exports.etiquetaTipoLineaCocina = etiquetaTipoLineaCocina;
exports.ordenTipoLineaCocina = ordenTipoLineaCocina;
var categoria_reglas_1 = require("./categoria-reglas");
Object.defineProperty(exports, "categoriaEsBebida", { enumerable: true, get: function () { return categoria_reglas_1.categoriaEsBebida; } });
Object.defineProperty(exports, "categoriaCobraEmpaqueParaLlevar", { enumerable: true, get: function () { return categoria_reglas_1.categoriaCobraEmpaqueParaLlevar; } });
Object.defineProperty(exports, "categoriaEsLineaEmpaque", { enumerable: true, get: function () { return categoria_reglas_1.categoriaEsLineaEmpaque; } });
Object.defineProperty(exports, "categoriaVisibleEnMostrador", { enumerable: true, get: function () { return categoria_reglas_1.categoriaVisibleEnMostrador; } });
Object.defineProperty(exports, "debeMarcarCocina", { enumerable: true, get: function () { return categoria_reglas_1.debeMarcarCocina; } });
Object.defineProperty(exports, "inferirReglasCategoriaDesdeNombre", { enumerable: true, get: function () { return categoria_reglas_1.inferirReglasCategoriaDesdeNombre; } });
Object.defineProperty(exports, "reglasCategoriaPorDefecto", { enumerable: true, get: function () { return categoria_reglas_1.reglasCategoriaPorDefecto; } });
Object.defineProperty(exports, "resolverReglasCategoria", { enumerable: true, get: function () { return categoria_reglas_1.resolverReglasCategoria; } });
/** Orden en comanda impresa y pantalla cocina: mazorca → entrada → adicional → sopa → plato. */
const ORDEN_TIPO_LINEA_COCINA = {
    mazorca: 0,
    entrada: 1,
    adicional: 2,
    sopa: 3,
    plato: 4,
};
const categoria_reglas_2 = require("./categoria-reglas");
function tipoLineaCocina(d) {
    if (d.es_acompanamiento_mazorca)
        return 'mazorca';
    const nombre = (d.nombre_producto ?? '').trim().toLowerCase();
    const reglas = d.categoria
        ? (0, categoria_reglas_2.resolverReglasCategoria)(d.categoria)
        : (0, categoria_reglas_2.resolverReglasCategoria)({ nombre: d.categoria_nombre ?? '' });
    if (reglas.participa_descuento_sopas)
        return 'sopa';
    if (d.es_plato_principal || reglas.es_plato_principal_default) {
        return 'plato';
    }
    const tipoCat = reglas.tipo_linea_cocina_default;
    if (tipoCat === 'entrada' || tipoCat === 'adicional')
        return tipoCat;
    return 'plato';
}
function etiquetaTipoLineaCocina(tipo) {
    switch (tipo) {
        case 'mazorca':
            return 'Acompañamiento';
        case 'entrada':
            return 'Entrada';
        case 'adicional':
            return 'Adicional';
        case 'sopa':
            return 'Sopa';
        case 'plato':
            return 'Plato';
    }
}
function ordenTipoLineaCocina(tipo) {
    return ORDEN_TIPO_LINEA_COCINA[tipo];
}
