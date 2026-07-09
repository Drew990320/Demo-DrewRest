import { PrismaService } from '../prisma/prisma.service';
import { CrearCuentaCreditoDto } from './dto/crear-cuenta-credito.dto';
import { AbonoCuentaCreditoDto } from './dto/abono-cuenta-credito.dto';
export declare class CreditosService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private mapCuenta;
    listar(soloAbiertos?: boolean): Promise<{
        id_credito: number;
        id_pedido: number;
        id_factura: number | null;
        mesa_numero: number;
        nombre_cliente: string;
        telefono: string | null;
        monto_total: number;
        saldo_pendiente: number;
        notas: string | null;
        estado: import(".prisma/client").$Enums.EstadoCredito;
        creado_en: string;
        pagado_en: string | null;
        id_usuario: number;
    }[]>;
    crear(dto: CrearCuentaCreditoDto, idUsuario: number): Promise<{
        id_credito: number;
        id_pedido: number;
        id_factura: number | null;
        mesa_numero: number;
        nombre_cliente: string;
        telefono: string | null;
        monto_total: number;
        saldo_pendiente: number;
        notas: string | null;
        estado: import(".prisma/client").$Enums.EstadoCredito;
        creado_en: string;
        pagado_en: string | null;
        id_usuario: number;
    }>;
    registrarAbono(idCredito: number, dto: AbonoCuentaCreditoDto): Promise<{
        id_credito: number;
        id_pedido: number;
        id_factura: number | null;
        mesa_numero: number;
        nombre_cliente: string;
        telefono: string | null;
        monto_total: number;
        saldo_pendiente: number;
        notas: string | null;
        estado: import(".prisma/client").$Enums.EstadoCredito;
        creado_en: string;
        pagado_en: string | null;
        id_usuario: number;
    }>;
}
