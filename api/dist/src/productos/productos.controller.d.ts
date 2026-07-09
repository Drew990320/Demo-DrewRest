import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { ProductosService } from './productos.service';
export declare class ProductosController {
    private readonly productos;
    constructor(productos: ProductosService);
    categorias(): Promise<{
        id_categoria: number;
        nombre: string;
    }[]>;
    listar(incluirInactivos?: string): Promise<{
        id_producto: number;
        id_categoria: number;
        categoria_nombre: string;
        nombre: string;
        descripcion: string | null;
        precio: number;
        activo: boolean;
        es_plato_principal: boolean;
        es_empacable: boolean;
        es_acompanamiento_mazorca: boolean;
        tipo_proteina: string;
        control_stock: boolean;
        stock_disponible: number;
        ocultar_sin_stock: boolean;
        es_bebida: boolean;
        total_usos_pedido: number;
    }[]>;
    crear(dto: CreateProductoDto): Promise<{
        id_producto: number;
        id_categoria: number;
        categoria_nombre: string;
        nombre: string;
        descripcion: string | null;
        precio: number;
        activo: boolean;
        es_plato_principal: boolean;
        es_empacable: boolean;
        es_acompanamiento_mazorca: boolean;
        tipo_proteina: string;
        control_stock: boolean;
        stock_disponible: number;
        ocultar_sin_stock: boolean;
        es_bebida: boolean;
        total_usos_pedido: number;
    }>;
    actualizar(id: number, dto: UpdateProductoDto): Promise<{
        id_producto: number;
        id_categoria: number;
        categoria_nombre: string;
        nombre: string;
        descripcion: string | null;
        precio: number;
        activo: boolean;
        es_plato_principal: boolean;
        es_empacable: boolean;
        es_acompanamiento_mazorca: boolean;
        tipo_proteina: string;
        control_stock: boolean;
        stock_disponible: number;
        ocultar_sin_stock: boolean;
        es_bebida: boolean;
        total_usos_pedido: number;
    }>;
    eliminar(id: number): Promise<{
        ok: boolean;
        id_producto: number;
    }>;
}
