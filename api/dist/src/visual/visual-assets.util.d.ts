export type VisualAssetTipo = 'login' | 'factura' | 'ticket' | 'favicon' | 'navbar-fondo';
export declare function guardarAssetVisual(tipo: VisualAssetTipo, buffer: Buffer, mime: string, originalName?: string): {
    archivo: string;
    ruta: string;
};
export declare function assetVisualConfigurado(archivoConfigurado?: string | null): string | null;
export declare function resolverAssetVisualPath(tipo: VisualAssetTipo, archivoConfigurado?: string | null): string | null;
export declare function mimeFromAssetPath(filePath: string): string;
export declare function campoArchivoPorTipo(tipo: VisualAssetTipo): string;
export declare function eliminarTodosAssetsVisuales(): void;
