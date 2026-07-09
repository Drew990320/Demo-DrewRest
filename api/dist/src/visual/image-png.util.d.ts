export declare const LOGO_TIPOS_IMPRESION: Set<string>;
export declare function normalizarBufferLogoPng(buffer: Buffer, mime: string): Promise<Buffer>;
export declare function leerImagenComoPngBuffer(sourcePath: string): Promise<Buffer>;
