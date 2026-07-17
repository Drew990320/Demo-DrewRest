"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEED_REGLAS_EVENTO_CO = exports.SEED_CATEGORIAS_REGLAS_CO = exports.SEED_CUENTAS_PUC_CO = exports.GRUPOS_CATEGORIA_CONTABLE = exports.EVENTOS_CONTABLES = void 0;
exports.esEventoContable = esEventoContable;
exports.EVENTOS_CONTABLES = [
    'venta_contado_efectivo',
    'venta_tarjeta',
    'venta_transferencia',
    'venta_fiado',
    'abono_cliente',
    'pago_proveedor',
    'cxp_compra_credito',
    'cxp_compra_contado',
    'caja_entrada_manual',
    'caja_salida_manual',
    'exceso_devolucion',
    'movimiento_simple',
];
function esEventoContable(v) {
    return exports.EVENTOS_CONTABLES.includes(v);
}
exports.GRUPOS_CATEGORIA_CONTABLE = [
    'entro_dinero',
    'salio_dinero',
    'me_deben',
    'debo',
    'interno',
];
exports.SEED_CUENTAS_PUC_CO = [
    { codigo: '1', nombre: 'ACTIVO', nivel: 1, naturaleza: 'debito', tipo: 'activo', acepta_movimiento: false },
    { codigo: '11', nombre: 'DISPONIBLE', nivel: 2, naturaleza: 'debito', tipo: 'activo', codigo_padre: '1', acepta_movimiento: false },
    { codigo: '1105', nombre: 'CAJA', nivel: 3, naturaleza: 'debito', tipo: 'activo', codigo_padre: '11' },
    { codigo: '1110', nombre: 'BANCOS', nivel: 3, naturaleza: 'debito', tipo: 'activo', codigo_padre: '11' },
    { codigo: '13', nombre: 'DEUDORES', nivel: 2, naturaleza: 'debito', tipo: 'activo', codigo_padre: '1', acepta_movimiento: false },
    { codigo: '1305', nombre: 'CLIENTES', nivel: 3, naturaleza: 'debito', tipo: 'activo', codigo_padre: '13' },
    { codigo: '14', nombre: 'INVENTARIOS', nivel: 2, naturaleza: 'debito', tipo: 'activo', codigo_padre: '1', acepta_movimiento: false },
    { codigo: '1435', nombre: 'MERCANCIAS NO FABRICADAS', nivel: 3, naturaleza: 'debito', tipo: 'activo', codigo_padre: '14' },
    { codigo: '2', nombre: 'PASIVO', nivel: 1, naturaleza: 'credito', tipo: 'pasivo', acepta_movimiento: false },
    { codigo: '22', nombre: 'PROVEEDORES', nivel: 2, naturaleza: 'credito', tipo: 'pasivo', codigo_padre: '2', acepta_movimiento: false },
    { codigo: '2205', nombre: 'PROVEEDORES NACIONALES', nivel: 3, naturaleza: 'credito', tipo: 'pasivo', codigo_padre: '22' },
    { codigo: '3', nombre: 'PATRIMONIO', nivel: 1, naturaleza: 'credito', tipo: 'patrimonio', acepta_movimiento: false },
    { codigo: '31', nombre: 'CAPITAL SOCIAL', nivel: 2, naturaleza: 'credito', tipo: 'patrimonio', codigo_padre: '3', acepta_movimiento: false },
    { codigo: '3105', nombre: 'CAPITAL SUSCRITO Y PAGADO', nivel: 3, naturaleza: 'credito', tipo: 'patrimonio', codigo_padre: '31' },
    { codigo: '4', nombre: 'INGRESOS', nivel: 1, naturaleza: 'credito', tipo: 'ingreso', acepta_movimiento: false },
    { codigo: '41', nombre: 'OPERACIONALES', nivel: 2, naturaleza: 'credito', tipo: 'ingreso', codigo_padre: '4', acepta_movimiento: false },
    { codigo: '4135', nombre: 'COMERCIO AL POR MAYOR Y MENOR', nivel: 3, naturaleza: 'credito', tipo: 'ingreso', codigo_padre: '41' },
    { codigo: '42', nombre: 'NO OPERACIONALES', nivel: 2, naturaleza: 'credito', tipo: 'ingreso', codigo_padre: '4', acepta_movimiento: false },
    { codigo: '4210', nombre: 'FINANCIEROS', nivel: 3, naturaleza: 'credito', tipo: 'ingreso', codigo_padre: '42' },
    { codigo: '5', nombre: 'GASTOS', nivel: 1, naturaleza: 'debito', tipo: 'gasto', acepta_movimiento: false },
    { codigo: '51', nombre: 'OPERACIONALES DE ADMINISTRACION', nivel: 2, naturaleza: 'debito', tipo: 'gasto', codigo_padre: '5', acepta_movimiento: false },
    { codigo: '5105', nombre: 'GASTOS DE PERSONAL', nivel: 3, naturaleza: 'debito', tipo: 'gasto', codigo_padre: '51' },
    { codigo: '5110', nombre: 'HONORARIOS', nivel: 3, naturaleza: 'debito', tipo: 'gasto', codigo_padre: '51' },
    { codigo: '5120', nombre: 'ARRENDAMIENTOS', nivel: 3, naturaleza: 'debito', tipo: 'gasto', codigo_padre: '51' },
    { codigo: '5135', nombre: 'SERVICIOS', nivel: 3, naturaleza: 'debito', tipo: 'gasto', codigo_padre: '51' },
    { codigo: '5145', nombre: 'MANTENIMIENTO Y REPARACIONES', nivel: 3, naturaleza: 'debito', tipo: 'gasto', codigo_padre: '51' },
    { codigo: '5195', nombre: 'DIVERSOS', nivel: 3, naturaleza: 'debito', tipo: 'gasto', codigo_padre: '51' },
    { codigo: '52', nombre: 'OPERACIONALES DE VENTAS', nivel: 2, naturaleza: 'debito', tipo: 'gasto', codigo_padre: '5', acepta_movimiento: false },
    { codigo: '5235', nombre: 'PROMOCION Y PUBLICIDAD', nivel: 3, naturaleza: 'debito', tipo: 'gasto', codigo_padre: '52' },
    { codigo: '6', nombre: 'COSTOS DE VENTAS', nivel: 1, naturaleza: 'debito', tipo: 'gasto', acepta_movimiento: false },
    { codigo: '61', nombre: 'COSTO DE VENTAS', nivel: 2, naturaleza: 'debito', tipo: 'gasto', codigo_padre: '6', acepta_movimiento: false },
    { codigo: '6135', nombre: 'COSTO DE VENTAS MERCANCIAS', nivel: 3, naturaleza: 'debito', tipo: 'gasto', codigo_padre: '61' },
];
exports.SEED_CATEGORIAS_REGLAS_CO = [
    { codigo: 'venta', nombre: 'Venta', grupo: 'entro_dinero', orden: 10, regla_codigo: 'cat_venta', debito: '1105', credito: '4135' },
    { codigo: 'abono_cliente', nombre: 'Abono de cliente', grupo: 'entro_dinero', orden: 20, regla_codigo: 'cat_abono_cliente', debito: '1105', credito: '1305' },
    { codigo: 'prestamo_recibido', nombre: 'Préstamo recibido', grupo: 'entro_dinero', orden: 30, regla_codigo: 'cat_prestamo_recibido', debito: '1105', credito: '2205' },
    { codigo: 'capital_propietario', nombre: 'Capital del propietario', grupo: 'entro_dinero', orden: 40, regla_codigo: 'cat_capital', debito: '1105', credito: '3105' },
    { codigo: 'otro_ingreso', nombre: 'Otro ingreso', grupo: 'entro_dinero', orden: 50, regla_codigo: 'cat_otro_ingreso', debito: '1105', credito: '4210' },
    { codigo: 'compra_insumos', nombre: 'Compra de insumos', grupo: 'salio_dinero', orden: 60, regla_codigo: 'cat_compra_insumos', debito: '1435', credito: '1105' },
    { codigo: 'servicios_publicos', nombre: 'Pago de servicios públicos', grupo: 'salio_dinero', orden: 70, regla_codigo: 'cat_servicios', debito: '5135', credito: '1105' },
    { codigo: 'nomina', nombre: 'Nómina', grupo: 'salio_dinero', orden: 80, regla_codigo: 'cat_nomina', debito: '5105', credito: '1105' },
    { codigo: 'arriendo', nombre: 'Arriendo', grupo: 'salio_dinero', orden: 90, regla_codigo: 'cat_arriendo', debito: '5120', credito: '1105' },
    { codigo: 'mantenimiento', nombre: 'Mantenimiento', grupo: 'salio_dinero', orden: 100, regla_codigo: 'cat_mantenimiento', debito: '5145', credito: '1105' },
    { codigo: 'publicidad', nombre: 'Publicidad', grupo: 'salio_dinero', orden: 110, regla_codigo: 'cat_publicidad', debito: '5235', credito: '1105' },
    { codigo: 'transporte', nombre: 'Transporte', grupo: 'salio_dinero', orden: 120, regla_codigo: 'cat_transporte', debito: '5195', credito: '1105' },
    { codigo: 'impuestos', nombre: 'Impuestos', grupo: 'salio_dinero', orden: 130, regla_codigo: 'cat_impuestos', debito: '5195', credito: '1105' },
    { codigo: 'otros_gastos', nombre: 'Otros gastos', grupo: 'salio_dinero', orden: 140, regla_codigo: 'cat_otros_gastos', debito: '5195', credito: '1105' },
    { codigo: 'ajuste_caja', nombre: 'Ajuste de caja', grupo: 'interno', orden: 200, regla_codigo: 'cat_ajuste_caja', debito: '1105', credito: '4210' },
    { codigo: 'reposicion_caja', nombre: 'Reposición de caja menor', grupo: 'interno', orden: 210, regla_codigo: 'cat_reposicion_caja', debito: '1105', credito: '1110' },
];
/** Reglas ligadas a eventos POS (sin categoría UI). */
exports.SEED_REGLAS_EVENTO_CO = [
    { codigo: 'evt_venta_efectivo', nombre: 'Venta contado efectivo', evento: 'venta_contado_efectivo', debito: '1105', credito: '4135' },
    { codigo: 'evt_venta_tarjeta', nombre: 'Venta tarjeta', evento: 'venta_tarjeta', debito: '1110', credito: '4135' },
    { codigo: 'evt_venta_transferencia', nombre: 'Venta transferencia', evento: 'venta_transferencia', debito: '1110', credito: '4135' },
    { codigo: 'evt_venta_fiado', nombre: 'Venta fiado', evento: 'venta_fiado', debito: '1305', credito: '4135' },
    { codigo: 'evt_abono_cliente', nombre: 'Abono cliente', evento: 'abono_cliente', debito: '1105', credito: '1305' },
    { codigo: 'evt_pago_proveedor', nombre: 'Pago proveedor', evento: 'pago_proveedor', debito: '2205', credito: '1105' },
    { codigo: 'evt_cxp_credito', nombre: 'Compra a crédito', evento: 'cxp_compra_credito', debito: '1435', credito: '2205' },
    { codigo: 'evt_cxp_contado', nombre: 'Compra de contado', evento: 'cxp_compra_contado', debito: '1435', credito: '1105' },
    { codigo: 'evt_caja_entrada', nombre: 'Entrada manual caja', evento: 'caja_entrada_manual', debito: '1105', credito: '4210' },
    { codigo: 'evt_caja_salida', nombre: 'Salida manual caja', evento: 'caja_salida_manual', debito: '5195', credito: '1105' },
    { codigo: 'evt_exceso', nombre: 'Devolución exceso', evento: 'exceso_devolucion', debito: '4135', credito: '1105' },
];
