export type RedLocalDetectada = {
    ip: string;
    adaptador: string;
    tipo: 'wifi' | 'ethernet' | 'otro';
};
export declare function detectarRedLocal(): RedLocalDetectada | null;
export declare const PUERTO_WEB_POR_DEFECTO = 8080;
export declare function candidatosArchivoPuertoWeb(cwd?: string): string[];
export declare function leerPuertoWebDesdeArchivo(cwd?: string): number | null;
export declare function leerPuertoWeb(): number;
