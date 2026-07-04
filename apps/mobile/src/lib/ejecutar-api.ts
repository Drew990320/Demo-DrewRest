import { manejarErrorOperacion } from './recurso-disponible';

type OpcionesEjecutarApi = {
  fallback?: { title: string; message?: string };
  /** No muestra diálogo (sincronización en segundo plano). */
  silencioso?: boolean;
};

/**
 * Envuelve una llamada async al API: captura el error y muestra aviso amigable.
 * Devuelve undefined si falló.
 */
export async function ejecutarApi<T>(
  fn: () => Promise<T>,
  opts?: OpcionesEjecutarApi,
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    if (!opts?.silencioso) {
      await manejarErrorOperacion(error, opts?.fallback);
    }
    return undefined;
  }
}
