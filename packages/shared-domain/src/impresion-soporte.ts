export const DREWTECH_SOPORTE_TELEFONO = '3207964367';
export const DREWTECH_SOPORTE_TELEFONO_LABEL = '320 796 4367';

export function mensajeImpresionRequiereDrewTech(): string {
  return (
    'La impresión térmica no está disponible en esta demo.\n\n' +
    'Para activar impresoras POS en tu restaurante, contacta a DrewTech:\n' +
    `Tel: ${DREWTECH_SOPORTE_TELEFONO_LABEL}`
  );
}

export function esErrorImpresionNoDisponible(res: {
  codigo_error?: string | null;
  error?: string | null;
} | null | undefined): boolean {
  if (!res) return false;
  if (res.codigo_error === 'no_disponible') return true;
  const err = res.error?.toLowerCase() ?? '';
  return (
    err.includes('deshabilitada') ||
    err.includes('printer_enabled') ||
    err.includes('no está disponible en esta demo') ||
    err.includes('vista previa demo')
  );
}
