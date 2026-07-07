import { api } from './api';
import { alertarSiSinPapel } from './alarma-impresora';
import { showAppDialog, showNotice } from './app-dialog';
import { mensajeImpresionFallidaTrasAccion } from './impresion-resultado';
import { manejarErrorAccion } from './recurso-disponible';

export type PasarCocinaPedidoResponse = {
  ok: boolean;
  es_adicional?: boolean;
  impreso: boolean;
  impresion_en_cola?: boolean;
  impresora_destino?: string | null;
  error_impresion: string | null;
  codigo_error_impresion?: string | null;
};

export type PasarCocinaPedidoResult = {
  enviado: boolean;
  response?: PasarCocinaPedidoResponse;
};

function esSinPlatosNuevosCocina(error: unknown): boolean {
  const msg =
    error instanceof Error
      ? error.message
      : typeof error === 'object' &&
          error != null &&
          'message' in error &&
          typeof (error as { message: unknown }).message === 'string'
        ? (error as { message: string }).message
        : String(error);
  return /no hay platos nuevos/i.test(msg);
}

function mensajeExitoCocina(esAdicional?: boolean): string {
  return esAdicional
    ? 'Platos adicionales enviados a cocina (solo los nuevos en la comanda).'
    : 'Platos enviados a cocina.';
}

/** Envía platos pendientes a cocina. En demo no llama a la impresora POS. */
export async function pasarCocinaPedido(
  idPedido: number,
  token: string | null,
  opts: {
    /** Auto tras agregar en menú (tablet): sin avisos salvo impresora. */
    modo?: 'manual' | 'auto';
    onReimprimir?: () => void | Promise<void>;
  } = {},
): Promise<PasarCocinaPedidoResult> {
  const modo = opts.modo ?? 'manual';
  try {
    const res = await api<PasarCocinaPedidoResponse>(
      `/pedidos/${idPedido}/pasar-cocina`,
      { method: 'POST', token },
    );

    if (modo === 'auto') {
      if (alertarSiSinPapel(res)) return { enviado: true, response: res };
      return { enviado: true, response: res };
    }

    if (res.impresion_en_cola) {
      await showNotice(
        'Cocina',
        res.es_adicional
          ? 'Platos adicionales enviados. La comanda adicional se imprime en cola (solo los platos nuevos).'
          : 'Platos enviados. La comanda se imprime en cola (puede tardar unos segundos si hay otros tickets).',
        'success',
      );
      return { enviado: true, response: res };
    }

    if (alertarSiSinPapel(res)) {
      await showAppDialog({
        title: 'Enviado a cocina (sin imprimir)',
        message: 'Sin papel en la impresora. Los platos ya están en cocina.',
        variant: 'warning',
        buttons: [
          { text: 'Entendido', style: 'cancel' },
          ...(opts.onReimprimir
            ? [
                {
                  text: 'Reimprimir comanda',
                  style: 'primary' as const,
                  onPress: () => void opts.onReimprimir?.(),
                },
              ]
            : []),
        ],
      });
      return { enviado: true, response: res };
    }

    if (res.impreso) {
      await showNotice(
        'Cocina',
        res.es_adicional
          ? `Comanda adicional impresa (${res.impresora_destino ?? 'impresora'}). Solo los platos nuevos, sin precios.`
          : `Comanda impresa (${res.impresora_destino ?? 'impresora'}). Solo platos, sin precios.`,
        'success',
      );
    } else if (res.error_impresion) {
      const msg = mensajeImpresionFallidaTrasAccion(
        {
          error: res.error_impresion,
          codigo_error: res.codigo_error_impresion,
        },
        res.es_adicional
          ? 'Los platos adicionales ya están en cocina.'
          : 'Los platos ya están en cocina.',
      );
      await showAppDialog({
        title: res.es_adicional
          ? 'Adicional en cocina (sin imprimir)'
          : 'Enviado a cocina (sin imprimir)',
        message: msg,
        variant: 'warning',
        buttons: [
          { text: 'Entendido', style: 'cancel' },
          ...(opts.onReimprimir
            ? [
                {
                  text: 'Reimprimir comanda',
                  style: 'primary' as const,
                  onPress: () => void opts.onReimprimir?.(),
                },
              ]
            : []),
        ],
      });
    } else {
      await showNotice('Cocina', mensajeExitoCocina(res.es_adicional), 'success');
    }

    return { enviado: true, response: res };
  } catch (e) {
    if (modo === 'auto' && esSinPlatosNuevosCocina(e)) {
      return { enviado: false };
    }
    if (modo === 'auto') {
      return { enviado: false };
    }
    await manejarErrorAccion(e, 'enviar a cocina');
    return { enviado: false };
  }
}
