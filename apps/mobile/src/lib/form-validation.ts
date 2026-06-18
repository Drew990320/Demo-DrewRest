import { parseCOPDigits } from './cop-input';

type AvisoFn = (
  title: string,
  message?: string,
  kind?: 'info' | 'warning' | 'error' | 'success',
) => Promise<void>;

/** Etiquetas de campos obligatorios que están vacíos (solo texto en blanco). */
export function camposObligatoriosVacios(
  campos: { etiqueta: string; valor: string }[],
): string[] {
  return campos
    .filter((c) => !String(c.valor ?? '').trim())
    .map((c) => c.etiqueta);
}

export function mensajeCamposObligatorios(faltantes: string[]): string {
  if (faltantes.length === 0) return '';
  if (faltantes.length === 1) {
    return `El campo «${faltantes[0]}» es obligatorio.`;
  }
  return `Completa los campos obligatorios: ${faltantes.map((e) => `«${e}»`).join(', ')}.`;
}

/** Muestra aviso y devuelve true si faltan campos obligatorios. */
export async function avisarSiFaltanObligatorios(
  campos: { etiqueta: string; valor: string }[],
  showNotice: AvisoFn,
): Promise<boolean> {
  const faltantes = camposObligatoriosVacios(campos);
  if (faltantes.length === 0) return false;
  await showNotice(
    'Campos obligatorios',
    mensajeCamposObligatorios(faltantes),
    'warning',
  );
  return true;
}

/** Entero ≥ min; muestra aviso y devuelve true si el valor no es válido. */
export async function avisarSiEnteroInvalido(
  etiqueta: string,
  valor: string,
  min: number,
  showNotice: AvisoFn,
): Promise<boolean> {
  const n = parseInt(valor.trim(), 10);
  if (!Number.isFinite(n) || n < min) {
    await showNotice(
      'Campo inválido',
      `Indica un valor válido en «${etiqueta}» (mínimo ${min}).`,
      'warning',
    );
    return true;
  }
  return false;
}

/** Monto COP desde dígitos; vacío o ≤ 0 es inválido cuando el campo es obligatorio. */
export async function avisarSiMontoCOPInvalido(
  etiqueta: string,
  digitos: string,
  showNotice: AvisoFn,
  opts?: { permitirCero?: boolean },
): Promise<boolean> {
  if (!digitos.trim()) {
    await showNotice(
      'Campos obligatorios',
      `El campo «${etiqueta}» es obligatorio.`,
      'warning',
    );
    return true;
  }
  const n = parseCOPDigits(digitos);
  const min = opts?.permitirCero ? 0 : 1;
  if (!Number.isFinite(n) || n < min) {
    await showNotice(
      'Campo inválido',
      `Indica un monto válido en «${etiqueta}».`,
      'warning',
    );
    return true;
  }
  return false;
}
