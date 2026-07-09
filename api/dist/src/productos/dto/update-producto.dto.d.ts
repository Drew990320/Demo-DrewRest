import { TipoProteina } from '@prisma/client';
export declare class UpdateProductoDto {
    id_categoria?: number;
    nombre?: string;
    descripcion?: string | null;
    precio?: number;
    activo?: boolean;
    es_plato_principal?: boolean;
    es_empacable?: boolean;
    es_acompanamiento_mazorca?: boolean;
    tipo_proteina?: TipoProteina;
    control_stock?: boolean;
    stock_disponible?: number;
    ocultar_sin_stock?: boolean;
}
