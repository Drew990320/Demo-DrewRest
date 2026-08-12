"use strict";
/** Match de ítems detectados en foto de menú → productos del catálogo/franja. */
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizarNombreMenuFoto = normalizarNombreMenuFoto;
exports.emparejarPreciosDesdeFoto = emparejarPreciosDesdeFoto;
/** Minúsculas, sin acentos, solo letras/números/espacios. */
function normalizarNombreMenuFoto(raw) {
    return String(raw ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
function tokens(norm) {
    return norm.split(' ').filter((t) => t.length > 1);
}
function jaccard(a, b) {
    if (a.length === 0 || b.length === 0)
        return 0;
    const sa = new Set(a);
    const sb = new Set(b);
    let inter = 0;
    for (const t of sa) {
        if (sb.has(t))
            inter += 1;
    }
    const union = sa.size + sb.size - inter;
    return union === 0 ? 0 : inter / union;
}
/** Distancia de Levenshtein relativa (0 = idéntico, 1 = distinto). */
function levRatio(a, b) {
    if (a === b)
        return 0;
    if (!a.length || !b.length)
        return 1;
    const m = a.length;
    const n = b.length;
    const prev = new Array(n + 1);
    const cur = new Array(n + 1);
    for (let j = 0; j <= n; j++)
        prev[j] = j;
    for (let i = 1; i <= m; i++) {
        cur[0] = i;
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            cur[j] = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
        }
        for (let j = 0; j <= n; j++)
            prev[j] = cur[j];
    }
    const dist = prev[n];
    return dist / Math.max(m, n);
}
function scorePar(detectadoNorm, candidatoNorm) {
    if (!detectadoNorm || !candidatoNorm)
        return 0;
    if (detectadoNorm === candidatoNorm)
        return 1;
    if (detectadoNorm.includes(candidatoNorm) ||
        candidatoNorm.includes(detectadoNorm)) {
        const shorter = Math.min(detectadoNorm.length, candidatoNorm.length);
        const longer = Math.max(detectadoNorm.length, candidatoNorm.length);
        return 0.72 + 0.28 * (shorter / longer);
    }
    const jac = jaccard(tokens(detectadoNorm), tokens(candidatoNorm));
    const lev = 1 - levRatio(detectadoNorm, candidatoNorm);
    return Math.max(jac * 0.85 + lev * 0.15, lev * 0.9);
}
function confianzaDesdeScore(score) {
    if (score >= 0.92)
        return 'alta';
    if (score >= 0.72)
        return 'media';
    if (score >= 0.55)
        return 'baja';
    return 'sin_match';
}
/**
 * Empareja cada ítem detectado con a lo sumo un candidato (greedy por score).
 * No crea productos; `sin_match` deja ids en null.
 */
function emparejarPreciosDesdeFoto(detectados, candidatos) {
    const candNorm = candidatos.map((c) => ({
        ...c,
        norm: normalizarNombreMenuFoto(c.nombre),
    }));
    const usados = new Set();
    const pairs = [];
    for (let di = 0; di < detectados.length; di++) {
        const dNorm = normalizarNombreMenuFoto(detectados[di].nombre);
        for (let ci = 0; ci < candNorm.length; ci++) {
            const score = scorePar(dNorm, candNorm[ci].norm);
            if (score >= 0.55)
                pairs.push({ di, ci, score });
        }
    }
    pairs.sort((a, b) => b.score - a.score);
    const bestByDetectado = new Map();
    for (const p of pairs) {
        if (bestByDetectado.has(p.di))
            continue;
        if (usados.has(p.ci))
            continue;
        bestByDetectado.set(p.di, p);
        usados.add(p.ci);
    }
    return detectados.map((d, di) => {
        const precio = Number.isFinite(d.precio) ? Math.max(0, Math.round(d.precio)) : 0;
        const pair = bestByDetectado.get(di);
        if (!pair) {
            return {
                nombre_detectado: d.nombre,
                precio_detectado: precio,
                id_producto: null,
                id_menu_producto: null,
                nombre_match: null,
                precio_actual: null,
                confianza: 'sin_match',
            };
        }
        const c = candNorm[pair.ci];
        return {
            nombre_detectado: d.nombre,
            precio_detectado: precio,
            id_producto: c.id_producto,
            id_menu_producto: c.id_menu_producto ?? null,
            nombre_match: c.nombre,
            precio_actual: c.precio_actual,
            confianza: confianzaDesdeScore(pair.score),
        };
    });
}
