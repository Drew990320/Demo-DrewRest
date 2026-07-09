"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MESA_MOSTRADOR_NUMERO = exports.MESA_PARA_LLEVAR_NUMERO = void 0;
exports.resolverMesasVirtuales = resolverMesasVirtuales;
exports.esMesaVirtualNumero = esMesaVirtualNumero;
exports.esMesaMostradorNumero = esMesaMostradorNumero;
exports.esMesaParaLlevarNumero = esMesaParaLlevarNumero;
exports.tituloLugarMesa = tituloLugarMesa;
exports.etiquetaMesaNumero = etiquetaMesaNumero;
exports.etiquetaMesaComanda = etiquetaMesaComanda;
exports.tituloMesaAdmin = tituloMesaAdmin;
exports.numerosMesasVirtuales = numerosMesasVirtuales;
/** Mesa virtual para pedidos para llevar (no mesas 1–15). */
exports.MESA_PARA_LLEVAR_NUMERO = 98;
/** Mesa virtual para ventas en mostrador. */
exports.MESA_MOSTRADOR_NUMERO = 99;
function pickNum(snake, camel, fallback) {
    return snake ?? camel ?? fallback ?? 0;
}
function pickStr(snake, camel, fallback) {
    return (snake ?? camel ?? fallback ?? '').trim();
}
/** Resuelve números y etiquetas con defaults 98/99. */
function resolverMesasVirtuales(cfg) {
    return {
        numero_mesa_para_llevar: pickNum(cfg?.numero_mesa_para_llevar, cfg?.numeroMesaParaLlevar, exports.MESA_PARA_LLEVAR_NUMERO),
        numero_mesa_mostrador: pickNum(cfg?.numero_mesa_mostrador, cfg?.numeroMesaMostrador, exports.MESA_MOSTRADOR_NUMERO),
        etiqueta_para_llevar: pickStr(cfg?.etiqueta_para_llevar, cfg?.etiquetaParaLlevar, 'Pedidos para llevar'),
        etiqueta_mostrador: pickStr(cfg?.etiqueta_mostrador, cfg?.etiquetaMostrador, 'Mostrador'),
    };
}
function esMesaVirtualNumero(numero, cfg) {
    const r = resolverMesasVirtuales(cfg);
    return (numero === r.numero_mesa_para_llevar ||
        numero === r.numero_mesa_mostrador);
}
function esMesaMostradorNumero(numero, cfg) {
    return numero === resolverMesasVirtuales(cfg).numero_mesa_mostrador;
}
function esMesaParaLlevarNumero(numero, cfg) {
    return numero === resolverMesasVirtuales(cfg).numero_mesa_para_llevar;
}
/** Texto para UI (pantallas de mesero/cocina). */
function tituloLugarMesa(numero, cfg) {
    const r = resolverMesasVirtuales(cfg);
    if (numero === r.numero_mesa_para_llevar)
        return r.etiqueta_para_llevar;
    if (numero === r.numero_mesa_mostrador)
        return r.etiqueta_mostrador;
    return `Mesa ${numero}`;
}
/** Etiqueta corta para la grilla de mesas. */
function etiquetaMesaNumero(numero, cfg) {
    const r = resolverMesasVirtuales(cfg);
    if (numero === r.numero_mesa_para_llevar)
        return r.etiqueta_para_llevar;
    if (numero === r.numero_mesa_mostrador)
        return r.etiqueta_mostrador;
    return String(numero);
}
/** Etiqueta en ticket de comanda impreso (más breve). */
function etiquetaMesaComanda(numero, cfg) {
    const r = resolverMesasVirtuales(cfg);
    if (numero === r.numero_mesa_para_llevar) {
        return r.etiqueta_para_llevar.length > 14
            ? 'Para llevar'
            : r.etiqueta_para_llevar;
    }
    if (numero === r.numero_mesa_mostrador)
        return r.etiqueta_mostrador;
    return `Mesa ${numero}`;
}
/** Título en admin de mesas (mesas virtuales con descripción entre paréntesis). */
function tituloMesaAdmin(numero, cfg) {
    const r = resolverMesasVirtuales(cfg);
    if (numero === r.numero_mesa_para_llevar) {
        return `Mesa ${r.numero_mesa_para_llevar} (${r.etiqueta_para_llevar})`;
    }
    if (numero === r.numero_mesa_mostrador) {
        return `Mesa ${r.numero_mesa_mostrador} (${r.etiqueta_mostrador})`;
    }
    return `Mesa ${numero}`;
}
function numerosMesasVirtuales(cfg) {
    const r = resolverMesasVirtuales(cfg);
    return [r.numero_mesa_para_llevar, r.numero_mesa_mostrador];
}
