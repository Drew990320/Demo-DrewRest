import type { Response } from 'express';
import { PedidosGateway } from '../pedidos/pedidos.gateway';
import { ConfigVisualService } from './config-visual.service';
import { UpsertConfigVisualDto } from './dto/upsert-config-visual.dto';
import { type VisualAssetTipo } from './visual-assets.util';
type UploadFile = {
    buffer: Buffer;
    mimetype: string;
    originalname?: string;
};
export declare class VisualController {
    private readonly visual;
    private readonly gateway;
    constructor(visual: ConfigVisualService, gateway: PedidosGateway);
    obtenerConfig(): Promise<import("./config-visual.service").ConfigVisualApi>;
    actualizarConfig(dto: UpsertConfigVisualDto): Promise<import("./config-visual.service").ConfigVisualApi>;
    restablecerConfig(): Promise<import("./config-visual.service").ConfigVisualApi>;
    obtenerPublica(): Promise<import("./config-visual.service").ConfigVisualPublicaApi>;
    asset(tipoRaw: string, res: Response): Promise<void>;
    subirAsset(tipoRaw: string, file: UploadFile | undefined): Promise<{
        config: import("./config-visual.service").ConfigVisualApi;
        archivo: string;
        tipo: VisualAssetTipo;
    }>;
}
export {};
