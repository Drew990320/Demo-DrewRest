import type { BaseCajaCierreTicket, BaseCajaTicket, CierreCajaTicket, MovimientoCajaTicket } from './cierre-caja-ticket';
export declare function buildCierreCajaEscPos(ticket: CierreCajaTicket, charWidth?: number): Promise<Buffer>;
export declare function buildBaseCajaEscPos(ticket: BaseCajaTicket, charWidth?: number): Promise<Buffer>;
export declare function buildBaseCajaCierreEscPos(ticket: BaseCajaCierreTicket, charWidth?: number): Promise<Buffer>;
export declare function buildMovimientoCajaEscPos(ticket: MovimientoCajaTicket, charWidth?: number): Promise<Buffer>;
