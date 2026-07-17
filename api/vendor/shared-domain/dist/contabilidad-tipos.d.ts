/** Eventos operativos que disparan posteo contable automático. */
export type EventoContable = 'venta_contado_efectivo' | 'venta_tarjeta' | 'venta_transferencia' | 'venta_fiado' | 'abono_cliente' | 'pago_proveedor' | 'cxp_compra_credito' | 'cxp_compra_contado' | 'caja_entrada_manual' | 'caja_salida_manual' | 'exceso_devolucion' | 'movimiento_simple';
export declare const EVENTOS_CONTABLES: readonly EventoContable[];
export declare function esEventoContable(v: string): v is EventoContable;
export type GrupoCategoriaContable = 'entro_dinero' | 'salio_dinero' | 'me_deben' | 'debo' | 'interno';
export declare const GRUPOS_CATEGORIA_CONTABLE: readonly GrupoCategoriaContable[];
export type NaturalezaCuenta = 'debito' | 'credito';
export type TipoCuentaContable = 'activo' | 'pasivo' | 'patrimonio' | 'ingreso' | 'gasto' | 'orden';
export type LadoAsiento = 'debito' | 'credito';
export type FormulaMontoRegla = 'total' | 'porcentaje' | 'fijo';
export type LineaAsientoPlan = Readonly<{
    id_cuenta: number;
    codigo_cuenta?: string;
    debito: number;
    credito: number;
    detalle?: string;
    orden: number;
}>;
export type AsientoPlan = Readonly<{
    descripcion: string;
    lineas: LineaAsientoPlan[];
}>;
/** Seed mínimo PUC CO (códigos usados por reglas POS). */
export type SeedCuentaContable = Readonly<{
    codigo: string;
    nombre: string;
    nivel: number;
    naturaleza: NaturalezaCuenta;
    tipo: TipoCuentaContable;
    codigo_padre?: string;
    acepta_movimiento?: boolean;
}>;
export declare const SEED_CUENTAS_PUC_CO: readonly SeedCuentaContable[];
export type SeedCategoriaContable = Readonly<{
    codigo: string;
    nombre: string;
    grupo: GrupoCategoriaContable;
    orden: number;
    /** Código de regla asociada (evento o categoría). */
    regla_codigo: string;
    /** Cuentas Dr/Cr por código PUC. */
    debito: string;
    credito: string;
    evento_origen?: EventoContable;
}>;
export declare const SEED_CATEGORIAS_REGLAS_CO: readonly SeedCategoriaContable[];
/** Reglas ligadas a eventos POS (sin categoría UI). */
export declare const SEED_REGLAS_EVENTO_CO: readonly {
    codigo: string;
    nombre: string;
    evento: EventoContable;
    debito: string;
    credito: string;
}[];
