import { PrismaService } from '../prisma/prisma.service';
import { PedidosGateway } from '../pedidos/pedidos.gateway';
import { CreateMesaDto } from './dto/create-mesa.dto';
import { UpdateMesaDto } from './dto/update-mesa.dto';
export { MESA_MOSTRADOR_NUMERO, MESA_PARA_LLEVAR_NUMERO } from '@la-reserva/shared-domain/mesa-label';
export declare class MesasService {
    private readonly prisma;
    private readonly gateway;
    constructor(prisma: PrismaService, gateway: PedidosGateway);
    private configMesasVirtuales;
    private numerosOcultosGrilla;
    private mapMesaPublic;
    private mapMesaAdmin;
    listarVisiblesHoy(): Promise<{
        mesero: {
            nombre: string;
            apellido: string;
        } | null;
        id_mesa: number;
        numero: number;
        capacidad: number;
        estado: string;
    }[]>;
    listarTodasAdmin(): Promise<{
        id_mesa: number;
        numero: number;
        capacidad: number;
        estado: import(".prisma/client").$Enums.EstadoMesa;
        pedidos_activos: number;
        total_pedidos: number;
        disponible_lunes: boolean;
        disponible_martes: boolean;
        disponible_miercoles: boolean;
        disponible_jueves: boolean;
        disponible_viernes: boolean;
        disponible_sabado: boolean;
        disponible_domingo: boolean;
    }[]>;
    crearMesa(dto: CreateMesaDto): Promise<{
        id_mesa: number;
        numero: number;
        capacidad: number;
        estado: import(".prisma/client").$Enums.EstadoMesa;
        pedidos_activos: number;
        total_pedidos: number;
        disponible_lunes: boolean;
        disponible_martes: boolean;
        disponible_miercoles: boolean;
        disponible_jueves: boolean;
        disponible_viernes: boolean;
        disponible_sabado: boolean;
        disponible_domingo: boolean;
    }>;
    private flagsSnakeMesa;
    private patchDisponibilidadDesdeDto;
    private contarPedidosActivosMesa;
    private contarTotalPedidosMesa;
    private contadoresPedidosMesa;
    actualizarMesa(idMesa: number, dto: UpdateMesaDto): Promise<{
        id_mesa: number;
        numero: number;
        capacidad: number;
        estado: import(".prisma/client").$Enums.EstadoMesa;
        pedidos_activos: number;
        total_pedidos: number;
        disponible_lunes: boolean;
        disponible_martes: boolean;
        disponible_miercoles: boolean;
        disponible_jueves: boolean;
        disponible_viernes: boolean;
        disponible_sabado: boolean;
        disponible_domingo: boolean;
    }>;
    eliminarMesa(idMesa: number): Promise<{
        ok: boolean;
        id_mesa: number;
    }>;
    obtenerPorId(idMesa: number): Promise<{
        id_mesa: number;
        numero: number;
        capacidad: number;
        estado: string;
    }>;
    getMostrador(): Promise<{
        id_mesa: number;
        numero: number;
        capacidad: number;
        estado: string;
    }>;
    getParaLlevar(): Promise<{
        id_mesa: number;
        numero: number;
        capacidad: number;
        estado: string;
    }>;
}
