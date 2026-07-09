import { ConfigService } from '@nestjs/config';
import type { FacturaTicket } from './factura-ticket';
export type ResultadoEnvioFacturaCorreo = {
    enviado: boolean;
    email: string;
    error?: string;
};
export declare class FacturaEmailService {
    private readonly config;
    private readonly logger;
    constructor(config: ConfigService);
    estaConfigurado(): boolean;
    private crearTransporter;
    enviarFactura(ticket: FacturaTicket, emailDestino: string): Promise<ResultadoEnvioFacturaCorreo>;
}
