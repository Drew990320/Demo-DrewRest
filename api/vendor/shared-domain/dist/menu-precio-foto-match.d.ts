/** Match de ítems detectados en foto de menú → productos del catálogo/franja. */
export type ConfianzaMatchPrecioFoto = 'alta' | 'media' | 'baja' | 'sin_match';
export type CandidatoMatchPrecioFoto = {
    id_producto: number;
    nombre: string;
    precio_actual: number;
    id_menu_producto?: number | null;
};
export type ItemDetectadoPrecioFoto = {
    nombre: string;
    precio: number;
};
export type SugerenciaPrecioFoto = {
    nombre_detectado: string;
    precio_detectado: number;
    id_producto: number | null;
    id_menu_producto: number | null;
    nombre_match: string | null;
    precio_actual: number | null;
    confianza: ConfianzaMatchPrecioFoto;
};
/** Minúsculas, sin acentos, solo letras/números/espacios. */
export declare function normalizarNombreMenuFoto(raw: string): string;
/**
 * Empareja cada ítem detectado con a lo sumo un candidato (greedy por score).
 * No crea productos; `sin_match` deja ids en null.
 */
export declare function emparejarPreciosDesdeFoto(detectados: ItemDetectadoPrecioFoto[], candidatos: CandidatoMatchPrecioFoto[]): SugerenciaPrecioFoto[];
