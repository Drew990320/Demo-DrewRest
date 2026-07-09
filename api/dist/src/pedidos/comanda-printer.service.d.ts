import { ConfigService } from '@nestjs/config';
import type { ComandaTicket } from './comanda-ticket';
import type { FacturaTicket } from './factura-ticket';
import type { BaseCajaCierreTicket, BaseCajaTicket, CierreCajaTicket, MovimientoCajaTicket } from './cierre-caja-ticket';
import type { CuentasDivididasTicket } from './cuentas-divididas-ticket';
export type CodigoErrorImpresion = 'sin_papel' | 'papel_bajo' | 'offline' | 'otro';
export type ResultadoImpresion = {
    impreso: boolean;
    error?: string;
    codigo_error?: CodigoErrorImpresion;
    destino?: string;
    omitido?: boolean;
    en_cola?: boolean;
};
export declare class ComandaPrinterService {
    private readonly config;
    private readonly logger;
    private colaImpresion;
    private trabajosEnCola;
    private impresionRapida;
    constructor(config: ConfigService);
    private enabled;
    private charWidth;
    private baudRate;
    private jobCooldownMs;
    private sleep;
    runWithImpresionRapida<T>(fn: () => Promise<T>): Promise<T>;
    private encolarImpresion;
    private debeEsperarTrasImpresion;
    private targets;
    imprimirComanda(ticket: ComandaTicket): Promise<ResultadoImpresion>;
    imprimirFactura(ticket: FacturaTicket): Promise<ResultadoImpresion>;
    imprimirCierreCaja(ticket: CierreCajaTicket): Promise<ResultadoImpresion>;
    imprimirCuentasDivididas(ticket: CuentasDivididasTicket): Promise<ResultadoImpresion>;
    imprimirBaseCaja(ticket: BaseCajaTicket): Promise<ResultadoImpresion>;
    imprimirBaseCajaCierre(ticket: BaseCajaCierreTicket): Promise<ResultadoImpresion>;
    imprimirMovimientoCaja(ticket: MovimientoCajaTicket): Promise<ResultadoImpresion>;
    private enviarBuffer;
    consultarEstadoPapel(): Promise<{
        destino: string | null;
        sin_papel: boolean | null;
        papel_bajo: boolean | null;
        error?: string;
    }>;
    private consultarPapel;
    private sendBuffer;
    private normalizeComPath;
    private sendSerial;
    imprimirPrueba(): Promise<{
        impreso: boolean;
        error?: string;
        destino?: string;
    }>;
}
