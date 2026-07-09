import { type MesasVirtualesConfig } from './mesa-label';
/** Mesas virtuales por defecto: sin línea automática de acompañamiento. */
export { MESA_PARA_LLEVAR_NUMERO as MESA_SIN_LINEA_MAZORCA } from './mesa-label';
export { MESA_PARA_LLEVAR_NUMERO, MESA_MOSTRADOR_NUMERO } from './mesa-label';
export declare function pedidoUsaLineaMazorca(mesaNumero: number, mazorcaActiva?: boolean, mesasVirtuales?: MesasVirtualesConfig | null): boolean;
export declare function esMesaSinLineaMazorca(mesaNumero: number, mesasVirtuales?: MesasVirtualesConfig | null): boolean;
export declare function esDetalleMazorcaAcompanamiento(d: {
    es_acompanamiento_mazorca?: boolean;
    esAcompanamientoMazorca?: boolean;
}): boolean;
