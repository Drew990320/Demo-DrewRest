import {
  normalizarPedidoCocinaView,
  type PedidoCocinaView,
} from './cocina-pedido-view';

type CocinaResponse = {
  pedidos: PedidoCocinaView[];
};

type CocinaSubscriber = (items: PedidoCocinaView[]) => void;

let memItems: PedidoCocinaView[] | null = null;
let inflightLoad: Promise<PedidoCocinaView[]> | null = null;
const subscribers = new Set<CocinaSubscriber>();

function parsePayload(raw: CocinaResponse | PedidoCocinaView[]): PedidoCocinaView[] {
  return (Array.isArray(raw) ? raw : (raw.pedidos ?? [])).map(
    normalizarPedidoCocinaView,
  );
}

function notify(): void {
  if (!memItems) return;
  for (const fn of subscribers) {
    fn(memItems);
  }
}

export function getCachedCocinaQueue(): PedidoCocinaView[] | null {
  return memItems;
}

export function subscribeCocinaQueue(fn: CocinaSubscriber): () => void {
  subscribers.add(fn);
  if (memItems) {
    fn(memItems);
  }
  return () => {
    subscribers.delete(fn);
  };
}

export function invalidateCocinaQueueCache(): void {
  memItems = null;
}

export async function loadCocinaQueue(
  fetcher: () => Promise<CocinaResponse | PedidoCocinaView[]>,
): Promise<PedidoCocinaView[]> {
  if (inflightLoad) {
    return inflightLoad;
  }
  inflightLoad = (async () => {
    try {
      const raw = await fetcher();
      memItems = parsePayload(raw);
      notify();
      return memItems;
    } finally {
      inflightLoad = null;
    }
  })();
  return inflightLoad;
}
