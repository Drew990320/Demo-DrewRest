import { formatCOP } from './format';

/** Solo dígitos del monto (máx. 14 cifras). */
export function sanitizeMontoDigitos(s: string): string {
  return s.replace(/\D/g, '').slice(0, 14);
}

/** Convierte dígitos del input a pesos enteros COP. */
export function parseCOPDigits(s: string): number {
  const d = sanitizeMontoDigitos(s);
  if (!d) return 0;
  const n = parseInt(d, 10);
  return Number.isFinite(n) ? n : 0;
}

/** Dígitos para el estado del input a partir de un monto guardado. */
export function digitsFromMonto(monto: number): string {
  if (!monto) return '';
  return String(Math.round(monto));
}

/** Valor visible en el TextInput con formato de moneda COP. */
export function formatCOPInput(digitos: string): string {
  if (digitos === '') return '';
  return formatCOP(parseCOPDigits(digitos));
}
