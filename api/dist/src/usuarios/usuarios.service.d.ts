import { PrismaService } from '../prisma/prisma.service';
import { PedidosGateway } from '../pedidos/pedidos.gateway';
import { CreateMeseroDto } from './dto/create-mesero.dto';
import { PatchUsuarioDto } from './dto/patch-usuario.dto';
export declare class UsuariosService {
    private readonly prisma;
    private readonly gateway;
    constructor(prisma: PrismaService, gateway: PedidosGateway);
    listar(): Promise<{
        id: number;
        nombre: string;
        apellido: string;
        email: string;
        rol: string;
        activo: boolean;
        creado_en: Date;
    }[]>;
    crearMesero(dto: CreateMeseroDto): Promise<{
        id: number;
        nombre: string;
        apellido: string;
        email: string;
        rol: string;
        activo: boolean;
        creado_en: Date;
    }>;
    private resolverEmailMesero;
    actualizar(idUsuario: number, dto: PatchUsuarioDto, actorId: number): Promise<{
        id: number;
        nombre: string;
        apellido: string;
        email: string;
        rol: string;
        activo: boolean;
        creado_en: Date;
    }>;
    private mapOne;
}
