import { api } from './api';
import type { MisActivosResumen } from './mis-activos-resumen';
import type { PendientesCobroResumen } from './pendientes-cobro-resumen';
import { puedeVerMisPedidos } from '../hooks/usePuedeTomarPedidos';

export type OperativosResumenSnapshot = {
  misActivos: MisActivosResumen | null;
  ayudaPlatosParaRecoger: number;
  pendientesCobro: PendientesCobroResumen | null;
};

type Subscriber = (snap: OperativosResumenSnapshot) => void;

const EMPTY: OperativosResumenSnapshot = {
  misActivos: null,
  ayudaPlatosParaRecoger: 0,
  pendientesCobro: null,
};

let snapshot: OperativosResumenSnapshot = { ...EMPTY };
let inflight: Promise<OperativosResumenSnapshot> | null = null;
const subscribers = new Set<Subscriber>();

function notify(): void {
  for (const fn of subscribers) {
    fn(snapshot);
  }
}

export function getOperativosResumenSnapshot(): OperativosResumenSnapshot {
  return snapshot;
}

export function subscribeOperativosResumen(fn: Subscriber): () => void {
  subscribers.add(fn);
  fn(snapshot);
  return () => {
    subscribers.delete(fn);
  };
}

export function resetOperativosResumen(): void {
  snapshot = { ...EMPTY };
  notify();
}

export type LoadOperativosParams = {
  token: string;
  userId: number;
  userRol: string;
  esAdmin: boolean;
  tomaPedidos: boolean;
  ayudaCompaneros: boolean;
};

export async function loadOperativosResumen(
  params: LoadOperativosParams,
): Promise<OperativosResumenSnapshot> {
  if (inflight) {
    return inflight;
  }

  inflight = (async () => {
    const next: OperativosResumenSnapshot = {
      misActivos: null,
      ayudaPlatosParaRecoger: 0,
      pendientesCobro: null,
    };

    try {
      if (params.tomaPedidos) {
        const raw = await api<MisActivosResumen>('/pedidos/mis-activos/resumen', {
          token: params.token,
          cacheKey: `mis_activos_resumen_u${params.userId}`,
        });
        next.misActivos = raw;

        if (puedeVerMisPedidos(params.userRol) && params.ayudaCompaneros) {
          try {
            const ayuda = await api<{ platos_para_recoger: number }>(
              '/pedidos/ayuda-companeros/resumen',
              {
                token: params.token,
                cacheKey: `ayuda_companeros_resumen_u${params.userId}`,
              },
            );
            next.ayudaPlatosParaRecoger = ayuda.platos_para_recoger ?? 0;
          } catch {
            next.ayudaPlatosParaRecoger = snapshot.ayudaPlatosParaRecoger;
          }
        }
      }

      if (params.esAdmin) {
        try {
          next.pendientesCobro = await api<PendientesCobroResumen>(
            '/pedidos/pendientes-cobro/resumen',
            { token: params.token, cacheKey: 'pendientes_cobro_admin' },
          );
        } catch {
          next.pendientesCobro = snapshot.pendientesCobro;
        }
      }
    } catch {
      return snapshot;
    }

    snapshot = next;
    notify();
    return snapshot;
  })().finally(() => {
    inflight = null;
  });

  return inflight;
}
