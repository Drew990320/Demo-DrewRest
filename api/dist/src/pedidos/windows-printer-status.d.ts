import type { EstadoPapel } from './escpos-paper-status';
export declare function consultarPapelWindows(printerName: string): Promise<EstadoPapel | null>;
