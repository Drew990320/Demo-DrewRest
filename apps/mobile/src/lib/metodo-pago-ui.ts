export const METODOS_PAGO = ['efectivo', 'transferencia', 'mixto', 'credito'] as const;
export type MetodoPagoUi = (typeof METODOS_PAGO)[number];

/** Métodos con cobro inmediato (efectivo / transferencia / mixto). */
export const METODOS_PAGO_INMEDIATO = ['efectivo', 'transferencia', 'mixto'] as const;

export const METODO_PAGO_LABEL: Record<MetodoPagoUi, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  mixto: 'Mixto',
  credito: 'Crédito',
};

export { metodoPagoIcon, METODO_PAGO_ICON } from './metodo-pago-icons';
