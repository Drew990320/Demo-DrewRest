export declare function mimeFromLogoPath(filePath: string): string;
export declare function guardarArchivoLogoRestaurante(buffer: Buffer, mime: string, originalName?: string): {
    archivo: string;
    ruta: string;
};
export declare function eliminarLogoRestaurante(): void;
export declare function copiarLogoFabricaRestaurante(): string | null;
