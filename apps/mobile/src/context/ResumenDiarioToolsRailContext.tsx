import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { ActionIconItem } from '../components/ActionIconBar';
import { PedidoToolsRail, type PedidoToolsRailModel } from '../components/PedidoToolsRail';
import { ResumenDiarioToolsRail } from '../components/ResumenDiarioToolsRail';
import { useAppNavLayout } from '../hooks/useAppNavLayout';

export type PedidoGrupoRail = {
  id_pedido: number;
  mesa_numero: number;
  pedido_estado: string;
  total: number;
};

export type ResumenDiarioToolsRailModel = {
  cajaActions: ActionIconItem[];
  impresionActions: ActionIconItem[];
  pruebasActions: ActionIconItem[];
  modoPruebasHabilitado: boolean;
  minutosModoPruebas: number;
  onAbrirModoPruebas: () => void;
  onDesactivarModoPruebas: () => void;
  filtroNumPedido: string;
  onFiltroNumPedidoChange: (value: string) => void;
  filtroPedidoDigits: string;
  pedidoGrupoAccion: PedidoGrupoRail | null;
  pedidosCoinciden: number;
  reimprimiendoComandaId: number | null;
  reimprimiendoPedidoId: number | null;
  reabririendoPedidoId: number | null;
  onReimprimirComanda: (idPedido: number) => void;
  onReimprimirPedidoTotal: (idPedido: number) => void;
  onReabrirCobro: (idPedido: number) => void;
};

export type AppToolsRailModel =
  | { kind: 'resumen'; model: ResumenDiarioToolsRailModel }
  | { kind: 'pedido'; model: PedidoToolsRailModel };

type Ctx = {
  model: AppToolsRailModel | null;
  setModel: (model: AppToolsRailModel | null) => void;
};

const AppToolsRailContext = createContext<Ctx | null>(null);

/** @deprecated Alias del provider unificado de barras laterales. */
export const ResumenDiarioToolsRailProvider = AppToolsRailProvider;

export function AppToolsRailProvider({ children }: { children: ReactNode }) {
  const [model, setModel] = useState<AppToolsRailModel | null>(null);
  const value = useMemo(() => ({ model, setModel }), [model]);
  return (
    <AppToolsRailContext.Provider value={value}>
      {children}
    </AppToolsRailContext.Provider>
  );
}

function useAppToolsRailContext(hookName: string) {
  const ctx = useContext(AppToolsRailContext);
  if (!ctx) {
    throw new Error(`${hookName} requiere AppToolsRailProvider`);
  }
  return ctx;
}

function usePublishAppToolsRail(
  enabled: boolean,
  model: AppToolsRailModel,
  syncDeps: readonly unknown[],
) {
  const { setModel } = useAppToolsRailContext('usePublishAppToolsRail');
  const modelRef = useRef(model);
  modelRef.current = model;

  useEffect(() => {
    if (!enabled) return;
    return () => setModel(null);
  }, [enabled, setModel]);

  useEffect(() => {
    if (!enabled) {
      setModel(null);
      return;
    }
    setModel(modelRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- model vía ref; syncDeps explícitas
  }, [enabled, setModel, ...syncDeps]);
}

/** Publica la barra de herramientas del resumen en el shell global (tablet+). */
export function useResumenDiarioToolsRail(
  enabled: boolean,
  model: ResumenDiarioToolsRailModel,
  syncDeps: readonly unknown[],
) {
  usePublishAppToolsRail(
    enabled,
    { kind: 'resumen', model },
    syncDeps,
  );
}

/** Publica acciones del pedido activo en la barra derecha (tablet+). */
export function usePedidoToolsRail(
  enabled: boolean,
  model: PedidoToolsRailModel,
  syncDeps: readonly unknown[],
) {
  usePublishAppToolsRail(
    enabled,
    { kind: 'pedido', model },
    syncDeps,
  );
}

export function useAppToolsRailActive(): boolean {
  const ctx = useContext(AppToolsRailContext);
  return !!ctx?.model;
}

/** Ranura derecha del shell: espejo de la navbar izquierda, fuera del scroll de pantalla. */
export function AppToolsRailSlot() {
  const nav = useAppNavLayout();
  const ctx = useContext(AppToolsRailContext);
  if (!nav.sidebar || !ctx?.model) return null;
  if (ctx.model.kind === 'resumen') {
    return <ResumenDiarioToolsRail {...ctx.model.model} />;
  }
  return <PedidoToolsRail {...ctx.model.model} />;
}
