/** Mesa virtual para pedidos para llevar (no mesas 1–15). */
export declare const MESA_PARA_LLEVAR_NUMERO = 98;
/** Mesa virtual para ventas en mostrador. */
export declare const MESA_MOSTRADOR_NUMERO = 99;
export type MesasVirtualesConfig = {
    numero_mesa_para_llevar?: number;
    numeroMesaParaLlevar?: number;
    numero_mesa_mostrador?: number;
    numeroMesaMostrador?: number;
    etiqueta_para_llevar?: string;
    etiquetaParaLlevar?: string;
    etiqueta_mostrador?: string;
    etiquetaMostrador?: string;
};
export type MesasVirtualesResueltas = {
    numero_mesa_para_llevar: number;
    numero_mesa_mostrador: number;
    etiqueta_para_llevar: string;
    etiqueta_mostrador: string;
};
/** Resuelve números y etiquetas con defaults 98/99. */
export declare function resolverMesasVirtuales(cfg?: MesasVirtualesConfig | null): MesasVirtualesResueltas;
export declare function esMesaVirtualNumero(numero: number, cfg?: MesasVirtualesConfig | null): boolean;
export declare function esMesaMostradorNumero(numero: number, cfg?: MesasVirtualesConfig | null): boolean;
export declare function esMesaParaLlevarNumero(numero: number, cfg?: MesasVirtualesConfig | null): boolean;
/** Texto para UI (pantallas de mesero/cocina). */
export declare function tituloLugarMesa(numero: number, cfg?: MesasVirtualesConfig | null): string;
/** Etiqueta corta para la grilla de mesas. */
export declare function etiquetaMesaNumero(numero: number, cfg?: MesasVirtualesConfig | null): string;
/** Etiqueta en ticket de comanda impreso (más breve). */
export declare function etiquetaMesaComanda(numero: number, cfg?: MesasVirtualesConfig | null): string;
/** Título en admin de mesas (mesas virtuales con descripción entre paréntesis). */
export declare function tituloMesaAdmin(numero: number, cfg?: MesasVirtualesConfig | null): string;
export declare function numerosMesasVirtuales(cfg?: MesasVirtualesConfig | null): number[];
