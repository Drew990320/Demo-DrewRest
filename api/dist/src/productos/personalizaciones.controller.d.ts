import { CreatePersonalizacionDto, UpdatePersonalizacionDto } from './dto/personalizacion.dto';
import { PersonalizacionesService } from './personalizaciones.service';
export declare class PersonalizacionesController {
    private readonly personalizaciones;
    constructor(personalizaciones: PersonalizacionesService);
    listar(idProducto: number): Promise<{
        id_opcion: number;
        id_producto: number;
        tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
        descripcion: string;
    }[]>;
    crear(idProducto: number, dto: CreatePersonalizacionDto): Promise<{
        id_opcion: number;
        id_producto: number;
        tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
        descripcion: string;
    }>;
    actualizar(idOpcion: number, dto: UpdatePersonalizacionDto): Promise<{
        id_opcion: number;
        id_producto: number;
        tipo: import(".prisma/client").$Enums.TipoPersonalizacion;
        descripcion: string;
    }>;
    eliminar(idOpcion: number): Promise<{
        ok: boolean;
        id_opcion: number;
    }>;
}
