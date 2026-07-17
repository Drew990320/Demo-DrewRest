import { type LineaCocinaTipoInput } from './cocina-producto';
export type LineaComandaAgrupable = LineaCocinaTipoInput & {
    id_detalle: number;
    id_producto?: number;
    id_categoria?: number;
    id_detalle_padre: number | null;
    nombre_producto: string;
    cantidad: number;
    nota_cocina?: string | null;
    personalizaciones?: {
        id_opcion?: number;
        descripcion: string;
    }[];
};
export type LineaComandaTicket = {
    id_detalle: number;
    cantidad: number;
    nombre_producto: string;
    nota_cocina: string | null;
    personalizaciones: string[];
    id_producto?: number;
    id_categoria?: number;
};
export declare function lineasComandaParaTicket(detalles: LineaComandaAgrupable[]): LineaComandaTicket[];
