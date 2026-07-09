import { PrismaService } from '../prisma/prisma.service';
import { PedidosGateway } from '../pedidos/pedidos.gateway';
import { CreatePersonalizacionDto, UpdatePersonalizacionDto } from './dto/personalizacion.dto';
export declare class PersonalizacionesService {
    private readonly prisma;
    private readonly gateway;
    constructor(prisma: PrismaService, gateway: PedidosGateway);
    listarPorProducto(idProducto: number): Promise<{
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
