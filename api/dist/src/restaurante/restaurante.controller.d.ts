import { ConfigRestauranteService } from './config-restaurante.service';
import { UpsertConfigRestauranteDto } from './dto/upsert-config-restaurante.dto';
type LogoUploadFile = {
    buffer: Buffer;
    mimetype: string;
    size: number;
    originalname?: string;
};
export declare class RestauranteController {
    private readonly config;
    constructor(config: ConfigRestauranteService);
    obtenerConfig(): Promise<import("./config-restaurante.service").ConfigRestauranteApi>;
    actualizarConfig(dto: UpsertConfigRestauranteDto): Promise<import("./config-restaurante.service").ConfigRestauranteApi>;
    subirLogo(file: LogoUploadFile | undefined): Promise<Pick<import("./config-restaurante.service").ConfigRestauranteApi, "logo_archivo" | "tiene_logo">>;
    configPublica(): Promise<{
        nombre: string;
        telefono: string | null;
        direccion: string | null;
        tiene_logo: boolean;
        logo_url: string | null;
    }>;
}
export {};
