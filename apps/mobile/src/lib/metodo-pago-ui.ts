export const METODOS_PAGO = ['efectivo', 'transferencia', 'mixto'] as const;
export type MetodoPagoUi = (typeof METODOS_PAGO)[number];

export const METODO_PAGO_LABEL: Record<MetodoPagoUi, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  mixto: 'Mixto',
};

export { metodoPagoIcon, METODO_PAGO_ICON } from './metodo-pago-icons';
