/** Mesa virtual para pedidos para llevar (no mesas 1–15). */
export const MESA_PARA_LLEVAR_NUMERO = 98;

/** Mesa virtual para ventas en mostrador. */
export const MESA_MOSTRADOR_NUMERO = 99;

export type MesasVirtualesConfig = {
  numero_mesa_para_llevar?: number;
  numeroMesaParaLlevar?: number;
  numero_mesa_mostrador?: number;
  numeroMesaMostrador?: number;
  etiqueta_para_llevar?: string;
  etiquetaParaLlevar?: string;
  etiqueta_mostrador?: string;
  etiquetaMostrador?: string;
};

export type MesasVirtualesResueltas = {
  numero_mesa_para_llevar: number;
  numero_mesa_mostrador: number;
  etiqueta_para_llevar: string;
  etiqueta_mostrador: string;
};

function pickNum(snake?: number, camel?: number, fallback?: number): number {
  return snake ?? camel ?? fallback ?? 0;
}

function pickStr(snake?: string, camel?: string, fallback?: string): string {
  return (snake ?? camel ?? fallback ?? '').trim();
}

/** Resuelve números y etiquetas con defaults 98/99. */
export function resolverMesasVirtuales(
  cfg?: MesasVirtualesConfig | null,
): MesasVirtualesResueltas {
  return {
    numero_mesa_para_llevar: pickNum(
      cfg?.numero_mesa_para_llevar,
      cfg?.numeroMesaParaLlevar,
      MESA_PARA_LLEVAR_NUMERO,
    ),
    numero_mesa_mostrador: pickNum(
      cfg?.numero_mesa_mostrador,
      cfg?.numeroMesaMostrador,
      MESA_MOSTRADOR_NUMERO,
    ),
    etiqueta_para_llevar: pickStr(
      cfg?.etiqueta_para_llevar,
      cfg?.etiquetaParaLlevar,
      'Pedidos para llevar',
    ),
    etiqueta_mostrador: pickStr(
      cfg?.etiqueta_mostrador,
      cfg?.etiquetaMostrador,
      'Mostrador',
    ),
  };
}

export function esMesaVirtualNumero(
  numero: number,
  cfg?: MesasVirtualesConfig | null,
): boolean {
  const r = resolverMesasVirtuales(cfg);
  return (
    numero === r.numero_mesa_para_llevar ||
    numero === r.numero_mesa_mostrador
  );
}

export function esMesaMostradorNumero(
  numero: number,
  cfg?: MesasVirtualesConfig | null,
): boolean {
  return numero === resolverMesasVirtuales(cfg).numero_mesa_mostrador;
}

export function esMesaParaLlevarNumero(
  numero: number,
  cfg?: MesasVirtualesConfig | null,
): boolean {
  return numero === resolverMesasVirtuales(cfg).numero_mesa_para_llevar;
}

/** Texto para UI (pantallas de mesero/cocina). */
export function tituloLugarMesa(
  numero: number,
  cfg?: MesasVirtualesConfig | null,
): string {
  const r = resolverMesasVirtuales(cfg);
  if (numero === r.numero_mesa_para_llevar) return r.etiqueta_para_llevar;
  if (numero === r.numero_mesa_mostrador) return r.etiqueta_mostrador;
  return `Mesa ${numero}`;
}

/** Etiqueta corta para la grilla de mesas. */
export function etiquetaMesaNumero(
  numero: number,
  cfg?: MesasVirtualesConfig | null,
): string {
  const r = resolverMesasVirtuales(cfg);
  if (numero === r.numero_mesa_para_llevar) return r.etiqueta_para_llevar;
  if (numero === r.numero_mesa_mostrador) return r.etiqueta_mostrador;
  return String(numero);
}

/** Etiqueta en ticket de comanda impreso (más breve). */
export function etiquetaMesaComanda(
  numero: number,
  cfg?: MesasVirtualesConfig | null,
): string {
  const r = resolverMesasVirtuales(cfg);
  if (numero === r.numero_mesa_para_llevar) {
    return r.etiqueta_para_llevar.length > 14
      ? 'Para llevar'
      : r.etiqueta_para_llevar;
  }
  if (numero === r.numero_mesa_mostrador) return r.etiqueta_mostrador;
  return `Mesa ${numero}`;
}

/** Título en admin de mesas (mesas virtuales con descripción entre paréntesis). */
export function tituloMesaAdmin(
  numero: number,
  cfg?: MesasVirtualesConfig | null,
): string {
  const r = resolverMesasVirtuales(cfg);
  if (numero === r.numero_mesa_para_llevar) {
    return `Mesa ${r.numero_mesa_para_llevar} (${r.etiqueta_para_llevar})`;
  }
  if (numero === r.numero_mesa_mostrador) {
    return `Mesa ${r.numero_mesa_mostrador} (${r.etiqueta_mostrador})`;
  }
  return `Mesa ${numero}`;
}

export function numerosMesasVirtuales(
  cfg?: MesasVirtualesConfig | null,
): number[] {
  const r = resolverMesasVirtuales(cfg);
  return [r.numero_mesa_para_llevar, r.numero_mesa_mostrador];
}
