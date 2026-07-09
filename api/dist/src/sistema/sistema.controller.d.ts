import type { Response } from 'express';
import { ConfigRestauranteService } from '../restaurante/config-restaurante.service';
export declare class SistemaController {
    private readonly configRestaurante;
    constructor(configRestaurante: ConfigRestauranteService);
    branding(): Promise<{
        nombre: string;
        telefono: string | null;
        direccion: string | null;
        tiene_logo: boolean;
        logo_url: string | null;
    }>;
    logo(res: Response): Promise<void>;
    conexionCelulares(): {
        ip: string | null;
        adaptador: string | null;
        tipo_red: "otro" | "wifi" | "ethernet" | null;
        puerto_api: number;
        puerto_web: number;
        puerto_web_por_defecto: number;
        url_api: string | null;
        url_web_celular: string | null;
        url_web_local: string;
        health_celular: string | null;
        aviso: string;
    };
}
