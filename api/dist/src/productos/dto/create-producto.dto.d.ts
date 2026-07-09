import { TipoProteina } from '@prisma/client';
export declare class CreateProductoDto {
    id_categoria: number;
    nombre: string;
    descripcion?: string;
    precio: number;
    es_plato_principal?: boolean;
    es_empacable?: boolean;
    es_acompanamiento_mazorca?: boolean;
    tipo_proteina?: TipoProteina;
    control_stock?: boolean;
    stock_disponible?: number;
    ocultar_sin_stock?: boolean;
}
