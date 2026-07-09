/** Producto interno: línea cobrable por cuota omitida en reparto por personas/combinado. */
export declare const NOMBRE_PRODUCTO_CUOTA_PENDIENTE = "Saldo pendiente reparto";
export declare const CUOTA_PENDIENTE_NOTA_PREFIX = "cuota_pendiente:";
export type CuotaPendienteNota = {
    personaIdx: number;
    facturasBase: number;
};
/** Etiqueta en nota_cocina: cuota_pendiente:2@4 → persona 2, sesión plan base 4. */
export declare function formatCuotaPendienteNota(personaIdx: number, facturasBase: number): string;
export declare function parseCuotaPendienteNota(nota: string | null | undefined): CuotaPendienteNota | null;
export declare function esDetalleCuotaPendienteReparto(d: {
    nota_cocina?: string | null;
    es_cuota_pendiente_reparto?: boolean;
    esCuotaPendienteReparto?: boolean;
    nombre_producto?: string;
}): boolean;
export declare function nombreLineaCuotaPendiente(personaIdx: number): string;
/** Nombre visible en factura / ticket / app. */
export declare function nombreProductoCuotaPendienteDisplay(nombreBase: string, nota: string | null | undefined): string;
export type CuotaPlanOmitidaRegistro = {
    persona_plan_indice: number;
    monto: number;
    facturas_base_plan: number;
    /** Identifica la sesión de UI del reparto (evita heredar omisiones viejas). */
    plan_sesion_id?: number;
};
/** Registros legacy: líneas «Saldo pendiente reparto» aún sin cobrar. */
export declare function cuotasPlanOmitidasDesdeDetalles<T extends {
    cobrado?: boolean;
    nota_cocina?: string | null;
    es_cuota_pendiente_reparto?: boolean;
    precio_unitario?: number;
    subtotal_linea?: number;
    cantidad?: number;
}>(detalles: T[]): CuotaPlanOmitidaRegistro[];
/** Registros en historial (sin línea extra en el pedido). */
export declare function cuotasPlanOmitidasDesdeHistorial(historial: {
    tipo: string;
    detalle?: unknown;
}[]): CuotaPlanOmitidaRegistro[];
/** Une historial y líneas legacy; el historial tiene prioridad por persona+sesión. */
export declare function listarCuotasPlanOmitidas(detalles: Parameters<typeof cuotasPlanOmitidasDesdeDetalles>[0], historial?: Parameters<typeof cuotasPlanOmitidasDesdeHistorial>[0]): CuotaPlanOmitidaRegistro[];
/** Índices 0-based de personas omitidas en la sesión de plan activa. */
export declare function personasOmitidasDesdeDetalles<T extends {
    cobrado?: boolean;
    nota_cocina?: string | null;
    es_cuota_pendiente_reparto?: boolean;
}>(detalles: T[], facturasBasePlan: number, planSesionId?: number): number[];
export declare function personasOmitidasDesdeCuotas(cuotas: CuotaPlanOmitidaRegistro[], facturasBasePlan: number, planSesionId?: number): number[];
