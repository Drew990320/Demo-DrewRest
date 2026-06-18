import { Platform, Vibration } from 'react-native';
import { pushAppNotification } from './app-notifications';

export type CodigoErrorImpresion = 'sin_papel' | 'papel_bajo' | 'offline' | 'otro';

function reproducirAlarmaSonora() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const Ctx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      for (let i = 0; i < 4; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = i % 2 === 0 ? 880 : 660;
        gain.gain.value = 0.25;
        osc.connect(gain);
        gain.connect(ctx.destination);
        const t = ctx.currentTime + i * 0.45;
        osc.start(t);
        osc.stop(t + 0.35);
      }
      void ctx.close();
    } catch {
      /* sin audio en este navegador */
    }
    return;
  }
  Vibration.vibrate([0, 700, 250, 700, 250, 700, 250, 700]);
}

let ultimaAlarmaEn = 0;
let ultimaAlarmaClave = '';

/** Alarma visible + sonora/vibración cuando falta papel en la impresora POS. */
export function activarAlarmaSinPapel(
  mensaje: string,
  codigo: 'sin_papel' | 'papel_bajo' = 'sin_papel',
) {
  const clave = `${codigo}:${mensaje.slice(0, 100)}`;
  const ahora = Date.now();
  if (ahora - ultimaAlarmaEn < 4000 && ultimaAlarmaClave === clave) {
    return;
  }
  ultimaAlarmaEn = ahora;
  ultimaAlarmaClave = clave;

  reproducirAlarmaSonora();
  const titulo =
    codigo === 'papel_bajo'
      ? 'Papel bajo en impresora POS'
      : 'Sin papel en impresora POS';

  pushAppNotification({
    title: titulo,
    message: mensaje,
    variant: 'warning',
  });
}

export function esErrorDePapel(codigo?: string | null): codigo is 'sin_papel' | 'papel_bajo' {
  return codigo === 'sin_papel' || codigo === 'papel_bajo';
}

/** Muestra alarma si el código indica falta de papel; devuelve true si activó alarma. */
export function alertarSiSinPapel(res: {
  codigo_error?: string | null;
  codigo_error_impresion?: string | null;
  error?: string | null;
  error_impresion?: string | null;
  impresion_comanda?: {
    codigo_error?: string | null;
    error?: string | null;
  } | null;
  impresion_factura?: {
    codigo_error?: string | null;
    error?: string | null;
  } | null;
}): boolean {
  const anidado = res.impresion_comanda ?? res.impresion_factura;
  const codigo =
    anidado?.codigo_error ?? res.codigo_error ?? res.codigo_error_impresion;
  if (!esErrorDePapel(codigo)) return false;

  const mensaje =
    anidado?.error ??
    res.error ??
    res.error_impresion ??
    (codigo === 'papel_bajo'
      ? 'El rollo está por acabarse. Cambie el papel pronto.'
      : 'Recargue el rollo de papel en la impresora POS y vuelva a intentar.');

  activarAlarmaSinPapel(mensaje, codigo);
  return true;
}

export type ImpresoraAlertaSocket = {
  codigo: 'sin_papel' | 'papel_bajo';
  mensaje: string;
  destino?: string;
  contexto?: 'comanda' | 'factura' | 'prueba';
  pedidoId?: number;
  at: string;
};

export function manejarAlertaImpresoraSocket(payload: ImpresoraAlertaSocket) {
  const ctx =
    payload.contexto === 'comanda'
      ? 'al enviar comanda a cocina'
      : payload.contexto === 'factura'
        ? 'al imprimir la factura'
        : payload.contexto === 'prueba'
          ? 'en prueba de impresora'
          : 'en la impresora POS';

  const extra = payload.destino ? `\n\nImpresora: ${payload.destino}` : '';
  activarAlarmaSinPapel(`${payload.mensaje}\n\n(Ocurrió ${ctx}.)${extra}`, payload.codigo);
}
