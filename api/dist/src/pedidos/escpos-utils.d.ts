export declare const DEFAULT_ESC_POS_WIDTH = 32;
export declare function ticketNombreLocal(): string;
export declare function ticketTelefono(): string;
export declare function ticketDireccion(): string;
export declare function dimensionesLogoContenidas(srcW: number, srcH: number, maxW: number, maxH: number): {
    width: number;
    height: number;
};
export declare const DREWTECH_TELEFONO = "3207964367";
export declare const DREWTECH_TELEFONO_LABEL = "Tel: 320 796 4367";
export declare const DREWTECH_CREDITO_LINEA = "Sistema interno del restaurante elaborado por DrewTech POS";
export declare function printPieDrewTechFactura(printer: EscPosPrinter, charWidth?: number): Promise<void>;
export declare function formatCopEscPos(value: number): string;
export declare function wrapEscPos(text: string, width: number): string[];
export declare function lineaConPrecio(etiqueta: string, precio: string, width: number): string;
export declare function createEscPosPrinter(charWidth: number): import("node-thermal-printer").printer;
export type EscPosPrinter = ReturnType<typeof createEscPosPrinter>;
export declare function printEncabezadoRestaurante(printer: EscPosPrinter, charWidth?: number): Promise<void>;
export declare const printEncabezadoLaReserva: typeof printEncabezadoRestaurante;
export declare function bufferFromPrinter(printer: {
    getBuffer: () => Buffer | Uint8Array | string;
}): Buffer;
