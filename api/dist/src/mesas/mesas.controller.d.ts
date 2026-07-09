import { CreateMesaDto } from './dto/create-mesa.dto';
import { UpdateMesaDto } from './dto/update-mesa.dto';
import { MesasService } from './mesas.service';
export declare class MesasController {
    private readonly mesas;
    constructor(mesas: MesasService);
    listar(): Promise<{
        mesero: {
            nombre: string;
            apellido: string;
        } | null;
        id_mesa: number;
        numero: number;
        capacidad: number;
        estado: string;
    }[]>;
    listarAdmin(): Promise<{
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
    crear(dto: CreateMesaDto): Promise<{
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
    actualizar(id: number, dto: UpdateMesaDto): Promise<{
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
    eliminar(id: number): Promise<{
        ok: boolean;
        id_mesa: number;
    }>;
    mostrador(): Promise<{
        id_mesa: number;
        numero: number;
        capacidad: number;
        estado: string;
    }>;
    paraLlevar(): Promise<{
        id_mesa: number;
        numero: number;
        capacidad: number;
        estado: string;
    }>;
    obtener(id: number): Promise<{
        id_mesa: number;
        numero: number;
        capacidad: number;
        estado: string;
    }>;
}
