import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import {
  NAV_ICON_KEYS,
  VISUAL_COLOR_DEFAULTS,
  esPaletaVisualLegacy,
  resolverIconoNav,
  type NavIconKey,
} from '@la-reserva/shared-domain/nav-app-icon';
import {
  resolverIconoAccion,
  type ActionIconKey,
} from '@la-reserva/shared-domain/action-app-icon';
import {
  presetEstiloVisual,
  resolverEstiloVisual,
  type VisualChromeTokens,
  type VisualLayoutTokens,
  type VisualStyleId,
} from '@la-reserva/shared-domain/visual-style';
import { API_URL } from '../lib/config';
import { subscribeConfigUpdated } from '../lib/config-sync';
import {
  clearActionIconOverrides,
  setActionIconOverrides,
} from '../lib/app-icons-runtime';
import { colors as staticColors, type AppColors } from '../lib/theme';
import {
  mergeVisualColors,
  resolveVisualChrome,
  type VisualAssetTipo,
  type VisualPublica,
} from '../lib/visual-theme';
import {
  clearVisualPublicaSnapshot,
  getVisualPublicaEtag,
  getVisualPublicaSnapshot,
  setVisualPublicaSnapshot,
} from '../lib/visual-publica-cache';

type IonName = ComponentProps<typeof Ionicons>['name'];

type VisualThemeContextValue = {
  colors: AppColors;
  visual: VisualPublica | null;
  loading: boolean;
  estiloVisual: VisualStyleId;
  layout: VisualLayoutTokens;
  chrome: VisualChromeTokens;
  navIcon: (key: NavIconKey) => IonName;
  actionIcon: (key: ActionIconKey) => IonName;
  assetUrl: (tipo: VisualAssetTipo, cacheBust?: number) => string | null;
  reload: () => Promise<void>;
};

const VisualThemeContext = createContext<VisualThemeContextValue | null>(null);
const VisualThemePreviewContext = createContext<AppColors | null>(null);
const VisualChromePreviewContext = createContext<{
  chrome: VisualChromeTokens;
  layout: VisualLayoutTokens;
} | null>(null);

export function VisualChromePreviewProvider({
  chrome,
  layout,
  children,
}: {
  chrome: VisualChromeTokens;
  layout: VisualLayoutTokens;
  children: ReactNode;
}) {
  return (
    <VisualChromePreviewContext.Provider value={{ chrome, layout }}>
      {children}
    </VisualChromePreviewContext.Provider>
  );
}

export function VisualThemePreviewProvider({
  colors: previewColors,
  children,
}: {
  colors: AppColors;
  children: ReactNode;
}) {
  return (
    <VisualThemePreviewContext.Provider value={previewColors}>
      {children}
    </VisualThemePreviewContext.Provider>
  );
}

function assetAbsolute(path: string | null | undefined, v?: number): string | null {
  if (!path) return null;
  const base = `${API_URL.replace(/\/$/, '')}${path}`;
  if (v === undefined) return base;
  return `${base}?v=${v}`;
}

function urlsEqual(
  a: VisualPublica['urls'] | undefined,
  b: VisualPublica['urls'] | undefined,
): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return (
    (a.login ?? null) === (b.login ?? null) &&
    (a.factura ?? null) === (b.factura ?? null) &&
    (a.ticket ?? null) === (b.ticket ?? null) &&
    (a.favicon ?? null) === (b.favicon ?? null) &&
    (a['navbar-fondo'] ?? null) === (b['navbar-fondo'] ?? null)
  );
}

function normalizeVisualPublica(data: VisualPublica): VisualPublica {
  const raw = data.urls as Record<string, string | null | undefined> | undefined;
  const colores = esPaletaVisualLegacy(data.colores)
    ? { ...VISUAL_COLOR_DEFAULTS }
    : data.colores;
  if (!raw) return { ...data, colores };
  return {
    ...data,
    colores,
    estilo_visual: resolverEstiloVisual(data.estilo_visual),
    mesa_forma: data.mesa_forma ?? null,
    mesa_vista: data.mesa_vista ?? null,
    urls: {
      login: raw.login ?? null,
      factura: raw.factura ?? null,
      ticket: raw.ticket ?? null,
      favicon: raw.favicon ?? null,
      'navbar-fondo': raw['navbar-fondo'] ?? raw.navbar_fondo ?? null,
    },
  };
}

export function VisualThemeProvider({ children }: { children: ReactNode }) {
  const [visual, setVisual] = useState<VisualPublica | null>(
    () => getVisualPublicaSnapshot(),
  );
  const [loading, setLoading] = useState(() => getVisualPublicaSnapshot() == null);
  const [assetVersion, setAssetVersion] = useState(0);

  const load = useCallback(async (opts?: { bustCache?: boolean }) => {
    try {
      if (opts?.bustCache) clearVisualPublicaSnapshot();

      const url = `${API_URL.replace(/\/$/, '')}/visual/publica`;
      const headers: Record<string, string> = {};
      const cachedEtag = getVisualPublicaEtag();
      if (cachedEtag && !opts?.bustCache) {
        headers['If-None-Match'] = cachedEtag;
      }

      const res = await fetch(url, { cache: 'no-store', headers });
      if (res.status === 304) {
        const snap = getVisualPublicaSnapshot();
        if (snap) setVisual(snap);
        return;
      }
      if (!res.ok) return;
      const data = normalizeVisualPublica((await res.json()) as VisualPublica);
      setVisualPublicaSnapshot(data, res.headers.get('ETag'));
      setVisual((prev) => {
        const urlsChanged = !urlsEqual(prev?.urls, data.urls);
        const stampChanged =
          (prev?.actualizado_en ?? null) !== (data.actualizado_en ?? null);
        if (urlsChanged || stampChanged) {
          setAssetVersion((v) => v + 1);
        }
        return data;
      });
    } catch {
      /* offline / sin API */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    return subscribeConfigUpdated((p) => {
      if (p.scope === 'visual') {
        setAssetVersion((v) => v + 1);
        void load({ bustCache: true });
      }
    });
  }, [load]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const href = assetAbsolute(visual?.urls?.favicon ?? null, assetVersion);
    if (!href) return;
    let link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = href;
  }, [visual?.urls?.favicon, assetVersion]);

  useEffect(() => {
    setActionIconOverrides(visual?.iconos_accion ?? {});
    return () => clearActionIconOverrides();
  }, [visual?.iconos_accion]);

  const estiloVisual = resolverEstiloVisual(visual?.estilo_visual);
  const preset = presetEstiloVisual(estiloVisual);
  const layout = preset.layout;
  const chrome = resolveVisualChrome(
    estiloVisual,
    visual?.mesa_forma,
    visual?.mesa_vista,
  );

  const colors = useMemo(() => mergeVisualColors(visual), [visual]);

  const navIcon = useCallback(
    (key: NavIconKey): IonName => {
      const saved = visual?.iconos_nav?.[key];
      return resolverIconoNav(key, saved) as IonName;
    },
    [visual?.iconos_nav],
  );

  const actionIcon = useCallback(
    (key: ActionIconKey): IonName => {
      const saved = visual?.iconos_accion?.[key];
      return resolverIconoAccion(key, saved) as IonName;
    },
    [visual?.iconos_accion],
  );

  const assetUrl = useCallback(
    (tipo: VisualAssetTipo, cacheBust?: number) => {
      const path = visual?.urls?.[tipo] ?? null;
      const bust = cacheBust !== undefined ? cacheBust : assetVersion;
      return assetAbsolute(path, bust);
    },
    [visual?.urls, assetVersion],
  );

  const value = useMemo(
    (): VisualThemeContextValue => ({
      colors,
      visual,
      loading,
      estiloVisual,
      layout,
      chrome,
      navIcon,
      actionIcon,
      assetUrl,
      reload: () => load({ bustCache: true }),
    }),
    [colors, visual, loading, estiloVisual, layout, chrome, navIcon, actionIcon, assetUrl, load],
  );

  return (
    <VisualThemeContext.Provider value={value}>
      {children}
    </VisualThemeContext.Provider>
  );
}

export function useVisualTheme(): VisualThemeContextValue {
  const preview = useContext(VisualThemePreviewContext);
  const chromePreview = useContext(VisualChromePreviewContext);
  const ctx = useContext(VisualThemeContext);
  if (!ctx) {
    const colors = preview ?? mergeVisualColors(null);
    const preset = presetEstiloVisual('minimalista');
    return {
      colors,
      visual: null,
      loading: false,
      estiloVisual: 'minimalista',
      layout: chromePreview?.layout ?? preset.layout,
      chrome: chromePreview?.chrome ?? preset.chrome,
      navIcon: (key) => resolverIconoNav(key, null) as IonName,
      actionIcon: (key) => resolverIconoAccion(key, null) as IonName,
      assetUrl: () => null,
      reload: async () => undefined,
    };
  }
  const merged = useMemo(
    () => ({
      ...ctx,
      colors: preview ?? ctx.colors,
      layout: chromePreview?.layout ?? ctx.layout,
      chrome: chromePreview?.chrome ?? ctx.chrome,
    }),
    [ctx, preview, chromePreview],
  );
  return merged;
}

export { NAV_ICON_KEYS };
