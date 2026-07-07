import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ActionIconBar, type ActionIconItem } from '../../src/components/ActionIconBar';
import { CategoriaIconCatalogPanel } from '../../src/components/CategoriaIconCatalogPanel';
import { NavIconCatalogPanel } from '../../src/components/NavIconCatalogPanel';
import { ScreenLoading } from '../../src/components/ScreenLoading';
import { ScreenScroll } from '../../src/components/ScreenScroll';
import { VisualAssetDropzone } from '../../src/components/VisualAssetDropzone';
import { VisualColorField } from '../../src/components/VisualColorField';
import { VisualPaletteSuggestPanel } from '../../src/components/VisualPaletteSuggestPanel';
import { VisualStylePresetPanel } from '../../src/components/VisualStylePresetPanel';
import { VisualMesaStylePanel } from '../../src/components/VisualMesaStylePanel';
import { useAuth } from '../../src/context/AuthContext';
import {
  esRolAdministrativo,
  puedeCapacidadAdmin,
} from '../../src/lib/admin-capacidades';
import {
  useVisualTheme,
  VisualChromePreviewProvider,
  VisualThemePreviewProvider,
} from '../../src/context/VisualThemeContext';
import { usePersonalizacionVisualToolsRail } from '../../src/context/ResumenDiarioToolsRailContext';
import { useAppNavLayout } from '../../src/hooks/useAppNavLayout';
import { useResponsive } from '../../src/hooks/useResponsive';
import { AdminIcon } from '../../src/lib/app-icons';
import { setActionIconOverrides } from '../../src/lib/app-icons-runtime';
import { api } from '../../src/lib/api';
import { confirmAppDialog, showNotice } from '../../src/lib/app-dialog';
import {
  categoriaMenuIcon,
  type CategoriaMenuIconId,
} from '../../src/lib/categoria-menu-icon';
import { manejarErrorAccion } from '../../src/lib/recurso-disponible';
import { notifyConfigUpdated } from '../../src/lib/config-sync';
import type { VisualConfigAdmin } from '../../src/lib/visual-theme';
import { estiloTarjetaMesa, mergeVisualColorOverrides, resolveVisualChrome } from '../../src/lib/visual-theme';
import {
  VISUAL_COLOR_KEYS,
  VISUAL_COLOR_DEFAULTS,
  esPaletaVisualLegacy,
  resolverIconoNav,
  type NavAppIconId,
  type NavIconKey,
  type VisualColorKey,
} from '@la-reserva/shared-domain/nav-app-icon';
import {
  ACTION_ICON_SECCIONES,
  ACTION_ICON_LABELS,
  resolverIconoAccion,
  type ActionIconKey,
} from '@la-reserva/shared-domain/action-app-icon';
import {
  presetEstiloVisual,
  type VisualStyleId,
} from '@la-reserva/shared-domain/visual-style';
import {
  resolverMesaForma,
  resolverMesaVista,
  type MesaFormaId,
  type MesaVistaId,
} from '@la-reserva/shared-domain/mesa-visual';

type IonName = ComponentProps<typeof Ionicons>['name'];
type MciName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type CategoriaRow = {
  id_categoria: number;
  nombre: string;
  icono_menu: string | null;
};

type PersonalizacionTab =
  | 'estilo'
  | 'colores'
  | 'logos'
  | 'iconos'
  | 'iconos_accion'
  | 'categorias';

const TABS: { id: PersonalizacionTab; label: string }[] = [
  { id: 'estilo', label: 'Estilo' },
  { id: 'colores', label: 'Colores' },
  { id: 'logos', label: 'Logos' },
  { id: 'iconos', label: 'Iconos nav' },
  { id: 'iconos_accion', label: 'Iconos sistema' },
  { id: 'categorias', label: 'Categorías' },
];

const TAB_HINTS: Record<PersonalizacionTab, string> = {
  estilo:
    'Elige el estilo de navegación y botones, y la forma y vista de las mesas. Los colores los defines en la pestaña Colores.',
  colores: 'Toca cada círculo o usa las paletas sugeridas (opcional). Pulsa Guardar para aplicar en toda la app.',
  logos: 'Cada contexto puede tener un logo distinto. Arrastra o haz clic en cada recuadro.',
  iconos: 'Toca una fila para marcarla. En la barra derecha (o arriba en móvil) abre el catálogo de iconos.',
  iconos_accion:
    'Iconos de botones, pedidos, administración y métodos de pago. Toca una fila y elige otro icono del catálogo.',
  categorias: 'Toca una fila para marcarla. En la barra derecha (o arriba en móvil) abre el catálogo. El cambio se guarda al elegir el icono.',
};

const COLOR_LABELS: Record<VisualColorKey, string> = {
  primary: 'Color principal',
  primary_dark: 'Principal oscuro',
  secondary: 'Secundario',
  background: 'Fondo',
  background_alt: 'Fondo alterno',
  surface: 'Tarjetas / superficie',
  text: 'Texto',
  text_muted: 'Texto secundario',
  border: 'Bordes',
};

const NAV_LABELS: Record<NavIconKey, string> = {
  mesas: 'Mesas',
  pedidos: 'Pedidos',
  mostrador: 'Mostrador',
  para_llevar: 'Para llevar',
  ayuda: 'Ayuda',
  cocina: 'Cocina',
  caja: 'Caja',
  mas: 'Más (admin)',
  cuenta: 'Cuenta (mesero)',
  mesa: 'Mesa (pedido)',
  menu: 'Menú (pedido)',
  cobrar: 'Cobrar',
  usuarios: 'Usuarios',
  editar_menu: 'Editar menú',
  categorias: 'Categorías',
  mesas_admin: 'Gestionar mesas',
  descuentos_promociones: 'Descuentos y promociones',
  creditos: 'Créditos',
  configuracion: 'Configuración',
  conexion: 'Conexión móvil',
  permisos: 'Permisos',
  turno: 'Turno y beneficios',
  personalizacion: 'Personalización visual',
};

const NAV_SECCIONES: { titulo: string; keys: NavIconKey[] }[] = [
  {
    titulo: 'Barra principal',
    keys: ['mesas', 'pedidos', 'mostrador', 'para_llevar', 'ayuda', 'cocina', 'caja', 'mas', 'cuenta'],
  },
  { titulo: 'Dentro del pedido', keys: ['mesa', 'menu', 'cobrar'] },
  {
    titulo: 'Panel «Más»',
    keys: [
      'usuarios',
      'editar_menu',
      'categorias',
      'mesas_admin',
      'descuentos_promociones',
      'creditos',
      'configuracion',
      'personalizacion',
      'conexion',
      'permisos',
      'turno',
    ],
  },
];

const ColorFieldRow = memo(function ColorFieldRow({
  colorKey,
  value,
  disabled,
  onSetColor,
  labelColor,
  borderColor,
  compact,
}: {
  colorKey: VisualColorKey;
  value: string;
  disabled: boolean;
  onSetColor: (key: VisualColorKey, hex: string) => void;
  labelColor: string;
  borderColor: string;
  compact?: boolean;
}) {
  const onChange = useCallback(
    (hex: string) => onSetColor(colorKey, hex),
    [colorKey, onSetColor],
  );

  return (
    <VisualColorField
      label={COLOR_LABELS[colorKey]}
      value={value}
      fallback={VISUAL_COLOR_DEFAULTS[colorKey]}
      disabled={disabled}
      onChange={onChange}
      labelColor={labelColor}
      borderColor={borderColor}
      compact={compact}
    />
  );
});

function PersonalizacionTabs({
  active,
  onChange,
  colors,
}: {
  active: PersonalizacionTab;
  onChange: (tab: PersonalizacionTab) => void;
  colors: ReturnType<typeof mergeVisualColorOverrides>;
}) {
  return (
    <View style={[styles.tabsWrap, { borderBottomColor: colors.border }]}>
      <View style={styles.tabsRow}>
        {TABS.map((tab) => {
          const on = tab.id === active;
          return (
            <Pressable
              key={tab.id}
              style={[
                styles.tab,
                {
                  borderColor: on ? colors.primary : colors.border,
                  backgroundColor: on ? colors.backgroundAlt : colors.surface,
                },
              ]}
              onPress={() => onChange(tab.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
            >
              <Text
                style={[
                  styles.tabLabel,
                  { color: on ? colors.primaryDark : colors.textMuted },
                  on && styles.tabLabelActive,
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function PersonalizacionVisualScreen() {
  const { token, user } = useAuth();
  const { reload: reloadVisual, visual: visualActivo } = useVisualTheme();
  const { isWide } = useResponsive();
  const nav = useAppNavLayout();
  const toolsRail = nav.sidebar;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<PersonalizacionTab>('estilo');
  const [selectedNavKey, setSelectedNavKey] = useState<NavIconKey | null>(null);
  const [selectedActionKey, setSelectedActionKey] = useState<ActionIconKey | null>(null);
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<number | null>(null);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [config, setConfig] = useState<VisualConfigAdmin | null>(null);
  const [estiloVisual, setEstiloVisual] = useState<VisualStyleId>('minimalista');
  const [mesaForma, setMesaForma] = useState<MesaFormaId>('rectangular');
  const [mesaVista, setMesaVista] = useState<MesaVistaId>('cuadricula');
  const [colores, setColores] = useState<Record<VisualColorKey, string>>(() => ({
    ...VISUAL_COLOR_DEFAULTS,
  }));
  const [iconosNav, setIconosNav] = useState<Record<string, string>>({});
  const [iconosAccion, setIconosAccion] = useState<Record<string, string>>({});
  const [categorias, setCategorias] = useState<CategoriaRow[]>([]);

  const previewColors = useMemo(
    () => mergeVisualColorOverrides(colores),
    [colores],
  );

  const previewPreset = useMemo(
    () => presetEstiloVisual(estiloVisual),
    [estiloVisual],
  );

  const previewChrome = useMemo(
    () => resolveVisualChrome(estiloVisual, mesaForma, mesaVista),
    [estiloVisual, mesaForma, mesaVista],
  );

  const setColor = useCallback((key: VisualColorKey, hex: string) => {
    setColores((prev) => ({ ...prev, [key]: hex }));
  }, []);

  const applyPalette = useCallback((palette: Record<VisualColorKey, string>) => {
    setColores((prev) => ({ ...prev, ...palette }));
  }, []);

  const applyEstilo = useCallback((id: VisualStyleId) => {
    const preset = presetEstiloVisual(id);
    setEstiloVisual(id);
    setColores({ ...preset.colores });
    setMesaForma(preset.chrome.mesaForma);
    setMesaVista(preset.chrome.mesaVista);
  }, []);

  useEffect(() => {
    setIconPickerOpen(false);
    if (tab !== 'iconos') setSelectedNavKey(null);
    if (tab !== 'iconos_accion') setSelectedActionKey(null);
    if (tab !== 'categorias') setSelectedCategoriaId(null);
  }, [tab]);

  useEffect(() => {
    setActionIconOverrides(iconosAccion);
  }, [iconosAccion]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setActionIconOverrides(visualActivo?.iconos_accion ?? {});
      };
    }, [visualActivo?.iconos_accion]),
  );

  const load = useCallback(async () => {
    const [vis, cats] = await Promise.all([
      api<VisualConfigAdmin>('/visual/config', { token }),
      api<CategoriaRow[]>('/categorias/admin', { token }),
    ]);
    const coloresResueltos = esPaletaVisualLegacy(vis.colores)
      ? { ...VISUAL_COLOR_DEFAULTS }
      : vis.colores;
    if (esPaletaVisualLegacy(vis.colores)) {
      await api('/visual/config', {
        method: 'PUT',
        token,
        body: JSON.stringify({
          color_primary: coloresResueltos.primary,
          color_primary_dark: coloresResueltos.primary_dark,
          color_secondary: coloresResueltos.secondary,
          color_background: coloresResueltos.background,
          color_background_alt: coloresResueltos.background_alt,
          color_surface: coloresResueltos.surface,
          color_text: coloresResueltos.text,
          color_text_muted: coloresResueltos.text_muted,
          color_border: coloresResueltos.border,
        }),
      });
      notifyConfigUpdated('visual');
      void reloadVisual();
    }
    setConfig({ ...vis, colores: coloresResueltos });
    setColores(coloresResueltos);
    setEstiloVisual(vis.estilo_visual ?? 'minimalista');
    const preset = presetEstiloVisual(vis.estilo_visual ?? 'minimalista');
    setMesaForma(
      vis.mesa_forma != null ? resolverMesaForma(vis.mesa_forma) : preset.chrome.mesaForma,
    );
    setMesaVista(
      vis.mesa_vista != null ? resolverMesaVista(vis.mesa_vista) : preset.chrome.mesaVista,
    );
    setIconosNav(vis.iconos_nav);
    setIconosAccion(vis.iconos_accion ?? {});
    setCategorias(cats);
    setLoading(false);
  }, [token, reloadVisual]);

  const guardar = useCallback(async () => {
    setSaving(true);
    try {
      await api('/visual/config', {
        method: 'PUT',
        token,
        body: JSON.stringify({
          color_primary: colores.primary,
          color_primary_dark: colores.primary_dark,
          color_secondary: colores.secondary,
          color_background: colores.background,
          color_background_alt: colores.background_alt,
          color_surface: colores.surface,
          color_text: colores.text,
          color_text_muted: colores.text_muted,
          color_border: colores.border,
          iconos_nav: iconosNav,
          iconos_accion: iconosAccion,
          estilo_visual: estiloVisual,
          mesa_forma: mesaForma,
          mesa_vista: mesaVista,
        }),
      });
      notifyConfigUpdated('visual');
      await reloadVisual();
      await load();
      await showNotice('Guardado', 'La apariencia se actualizó en toda la app.', 'success');
    } catch (e) {
      await manejarErrorAccion(e, 'guardar la personalización');
    } finally {
      setSaving(false);
    }
  }, [token, colores, iconosNav, iconosAccion, estiloVisual, mesaForma, mesaVista, reloadVisual, load]);

  const restablecer = useCallback(async () => {
    const ok = await confirmAppDialog(
      '¿Restablecer apariencia?',
      'Se volverán el estilo, colores e iconos a los valores de fábrica, se restaurará el logo DrewRest, se quitarán los logos subidos y los iconos de categorías volverán a asignarse automáticamente según el nombre. No se puede deshacer.',
      'warning',
    );
    if (!ok) return;

    setSaving(true);
    try {
      await api('/visual/config/restablecer', { method: 'POST', token });
      notifyConfigUpdated('visual');
      notifyConfigUpdated('categorias');
      await reloadVisual();
      await load();
      await showNotice(
        'Restablecido',
        'La personalización volvió al estado de fábrica.',
        'success',
      );
    } catch (e) {
      await manejarErrorAccion(e, 'restablecer la personalización');
    } finally {
      setSaving(false);
    }
  }, [token, reloadVisual, load]);

  const patchIconoCategoria = useCallback(async (id: number, icono: CategoriaMenuIconId) => {
    try {
      await api(`/categorias/admin/${id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ icono_menu: icono }),
      });
      notifyConfigUpdated('categorias');
      setCategorias((prev) =>
        prev.map((c) =>
          c.id_categoria === id ? { ...c, icono_menu: icono } : c,
        ),
      );
    } catch (e) {
      await manejarErrorAccion(e, 'actualizar el icono de categoría');
    }
  }, [token]);

  const toggleIconPicker = useCallback(() => {
    setIconPickerOpen((open) => {
      if (open) return false;
      if (tab === 'iconos') return !!selectedNavKey;
      if (tab === 'iconos_accion') return !!selectedActionKey;
      if (tab === 'categorias') return selectedCategoriaId != null;
      return false;
    });
  }, [tab, selectedNavKey, selectedActionKey, selectedCategoriaId]);

  const onSelectNavIcon = useCallback((icon: NavAppIconId) => {
    if (!selectedNavKey) return;
    setIconosNav((prev) => ({ ...prev, [selectedNavKey]: icon }));
  }, [selectedNavKey]);

  const onSelectActionIcon = useCallback((icon: NavAppIconId) => {
    if (!selectedActionKey) return;
    setIconosAccion((prev) => ({ ...prev, [selectedActionKey]: icon }));
  }, [selectedActionKey]);

  const onSelectCategoriaIcon = useCallback((icon: CategoriaMenuIconId) => {
    if (selectedCategoriaId == null) return;
    void patchIconoCategoria(selectedCategoriaId, icon);
  }, [selectedCategoriaId, patchIconoCategoria]);

  const selectedNavLabel = selectedNavKey ? NAV_LABELS[selectedNavKey] : null;
  const selectedNavIcon = selectedNavKey
    ? resolverIconoNav(selectedNavKey, iconosNav[selectedNavKey])
    : 'grid-outline';

  const selectedCategoria = useMemo(
    () =>
      selectedCategoriaId != null
        ? categorias.find((c) => c.id_categoria === selectedCategoriaId) ?? null
        : null,
    [categorias, selectedCategoriaId],
  );
  const selectedCategoriaLabel = selectedCategoria?.nombre ?? null;
  const selectedCategoriaIcon = selectedCategoria
    ? categoriaMenuIcon(selectedCategoria.nombre, selectedCategoria.icono_menu)
    : 'food-outline';

  const selectedActionLabel = selectedActionKey
    ? ACTION_ICON_LABELS[selectedActionKey]
    : null;
  const selectedActionIcon = selectedActionKey
    ? resolverIconoAccion(selectedActionKey, iconosAccion[selectedActionKey])
    : 'grid-outline';

  const pickerTab =
    tab === 'iconos' || tab === 'iconos_accion' || tab === 'categorias' ? tab : null;
  const selectedPickerLabel =
    tab === 'iconos'
      ? selectedNavLabel
      : tab === 'iconos_accion'
        ? selectedActionLabel
        : tab === 'categorias'
          ? selectedCategoriaLabel
          : null;

  usePersonalizacionVisualToolsRail(
    toolsRail,
    {
      saving,
      onGuardar: () => void guardar(),
      onRestablecer: () => void restablecer(),
      pickerTab,
      selectedPickerLabel,
      pickerOpen: iconPickerOpen,
      onTogglePicker: toggleIconPicker,
    },
    [
      saving,
      pickerTab,
      selectedPickerLabel,
      iconPickerOpen,
      guardar,
      restablecer,
      toggleIconPicker,
    ],
  );

  const topBarActions = useMemo((): ActionIconItem[] => {
    const actions: ActionIconItem[] = [
      {
        key: 'guardar',
        icon: AdminIcon.guardar,
        label: saving ? 'Guardando…' : 'Guardar cambios',
        variant: 'primary' as const,
        onPress: () => void guardar(),
        disabled: saving,
      },
      {
        key: 'restablecer',
        icon: AdminIcon.restablecer,
        label: saving ? 'Restableciendo…' : 'Restablecer fábrica',
        variant: 'danger' as const,
        onPress: () => void restablecer(),
        disabled: saving,
      },
    ];
    if (
      (tab === 'iconos' && selectedNavKey) ||
      (tab === 'iconos_accion' && selectedActionKey) ||
      (tab === 'categorias' && selectedCategoriaId != null)
    ) {
      actions.push({
        key: 'elegir-icono',
        icon: iconPickerOpen ? 'close-outline' : 'color-palette-outline',
        label: iconPickerOpen ? 'Cerrar selector' : 'Seleccionar icono',
        variant: 'secondary' as const,
        onPress: toggleIconPicker,
        disabled: saving,
      });
    }
    return actions;
  }, [saving, tab, selectedNavKey, selectedActionKey, selectedCategoriaId, iconPickerOpen, guardar, restablecer, toggleIconPicker]);

  const ui = useMemo(
    () => ({
      card: {
        ...styles.cardBase,
        backgroundColor: previewColors.surface,
        borderColor: previewColors.border,
      },
      sectionTitle: { ...styles.sectionTitle, color: previewColors.text },
      sectionHint: { ...styles.sectionHint, color: previewColors.textMuted },
      navSectionTitle: {
        ...styles.navSectionTitle,
        color: previewColors.text,
      },
      tabHint: { ...styles.tabHint, color: previewColors.textMuted },
      previewStripHint: {
        ...styles.previewStripHint,
        color: previewColors.textMuted,
      },
    }),
    [previewColors],
  );

  useFocusEffect(
    useCallback(() => {
      if (
        !esRolAdministrativo(user?.rol) ||
        !puedeCapacidadAdmin(user, 'personalizacion')
      ) return;
      setLoading(true);
      void load().catch((e) => {
        void manejarErrorAccion(e, 'cargar la personalización visual');
        setLoading(false);
      });
    }, [load, user?.rol]),
  );

  if (
    !esRolAdministrativo(user?.rol) ||
    !puedeCapacidadAdmin(user, 'personalizacion')
  ) {
    return (
      <View style={styles.denied}>
        <Text style={styles.deniedText}>Solo el administrador puede personalizar la apariencia.</Text>
      </View>
    );
  }

  if (loading || !config) {
    return <ScreenLoading />;
  }

  const colorCols = isWide ? 2 : 1;
  const colHalf = isWide ? styles.colHalfWide : styles.colFull;

  return (
    <VisualThemePreviewProvider colors={previewColors}>
      <VisualChromePreviewProvider
        chrome={previewChrome}
        layout={previewPreset.layout}
      >
    <>
      {!toolsRail ? (
          <ActionIconBar
            backgroundColor={previewColors.backgroundAlt}
            actions={topBarActions}
          />
      ) : null}

      <View style={[styles.body, { backgroundColor: previewColors.background }]}>
        <PersonalizacionTabs
          active={tab}
          onChange={setTab}
          colors={previewColors}
        />
        <ScreenScroll
          backgroundColor={previewColors.background}
          style={styles.scroll}
        >
          <Text style={ui.tabHint}>{TAB_HINTS[tab]}</Text>

          {tab === 'estilo' ? (
            <>
              <View style={ui.card}>
                <VisualStylePresetPanel
                  value={estiloVisual}
                  disabled={saving}
                  onSelect={applyEstilo}
                />
              </View>
              <View style={ui.card}>
                <VisualMesaStylePanel
                  forma={mesaForma}
                  vista={mesaVista}
                  disabled={saving}
                  onFormaChange={setMesaForma}
                  onVistaChange={setMesaVista}
                />
              </View>
            </>
          ) : null}

          {tab === 'colores' ? (
            <View style={ui.card}>
              <View
                style={[
                  styles.previewStrip,
                  { borderColor: previewColors.border },
                ]}
              >
                <View
                  style={[
                    styles.previewSwatch,
                    { backgroundColor: previewColors.background },
                  ]}
                />
                <View
                  style={[
                    styles.previewSwatch,
                    { backgroundColor: previewColors.backgroundAlt },
                  ]}
                />
              </View>
              <Text style={ui.previewStripHint}>
                Vista previa: fondo (izq.) y fondo alterno (der.).
              </Text>
              <View style={styles.mesaPreviewRow}>
                {(['libre', 'ocupada'] as const).map((estado) => {
                  const v = estiloTarjetaMesa(previewColors, estado);
                  const label = estado === 'libre' ? 'Disponible' : 'Ocupada';
                  const num = estado === 'libre' ? '2' : '1';
                  return (
                    <View
                      key={estado}
                      style={[
                        styles.mesaPreviewCard,
                        {
                          backgroundColor: v.backgroundColor,
                          borderColor: v.borderColor,
                          borderLeftColor: v.accent,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.mesaPreviewNum,
                          { color: previewColors.text },
                        ]}
                      >
                        {num}
                      </Text>
                      <Text
                        style={[styles.mesaPreviewEst, { color: v.text }]}
                        numberOfLines={1}
                      >
                        {label}
                      </Text>
                    </View>
                  );
                })}
              </View>
              <Text style={ui.previewStripHint}>
                Vista previa de mesas según el tema activo.
              </Text>
              <VisualPaletteSuggestPanel
                primaryColor={colores.primary}
                colors={previewColors}
                disabled={saving}
                onApply={applyPalette}
              />
              <View style={[styles.colorGrid, colorCols === 2 && styles.colorGridTwo]}>
                {VISUAL_COLOR_KEYS.map((key) => (
                  <View
                    key={key}
                    style={colorCols === 2 ? styles.colorGridItem : undefined}
                  >
                    <ColorFieldRow
                      colorKey={key}
                      value={colores[key] ?? VISUAL_COLOR_DEFAULTS[key]}
                      disabled={saving}
                      onSetColor={setColor}
                      labelColor={previewColors.text}
                      borderColor={previewColors.border}
                      compact
                    />
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {tab === 'logos' ? (
            <View style={ui.card}>
              <View style={[styles.assetGrid, isWide && styles.assetGridWide]}>
                <View style={colHalf}>
                  <VisualAssetDropzone
                    key={`login-${config.actualizado_en}`}
                    token={token}
                    tipo="login"
                    label="Logo en pantalla de inicio de sesión"
                    tieneAsset={config.tiene_logo_login}
                    disabled={saving}
                    onUploaded={() => void load().then(() => reloadVisual())}
                    onError={(e) => void manejarErrorAccion(e, 'subir el logo de login')}
                  />
                </View>
                <View style={colHalf}>
                  <VisualAssetDropzone
                    key={`factura-${config.actualizado_en}`}
                    token={token}
                    tipo="factura"
                    label="Logo en cobro / factura (también en tickets si no hay logo de ticket)"
                    tieneAsset={config.tiene_logo_factura}
                    disabled={saving}
                    onUploaded={() => void load().then(() => reloadVisual())}
                    onError={(e) => void manejarErrorAccion(e, 'subir el logo de factura')}
                  />
                </View>
                <View style={colHalf}>
                  <VisualAssetDropzone
                    key={`ticket-${config.actualizado_en}`}
                    token={token}
                    tipo="ticket"
                    label="Logo en tickets impresos (opcional; prioridad sobre el de factura)"
                    tieneAsset={config.tiene_logo_ticket}
                    disabled={saving}
                    onUploaded={() => void load()}
                    onError={(e) => void manejarErrorAccion(e, 'subir el logo de ticket')}
                  />
                </View>
                <View style={colHalf}>
                  <VisualAssetDropzone
                    key={`favicon-${config.actualizado_en}`}
                    token={token}
                    tipo="favicon"
                    label="Icono de la pestaña del navegador"
                    tieneAsset={config.tiene_favicon}
                    disabled={saving}
                    onUploaded={() => void load().then(() => reloadVisual())}
                    onError={(e) => void manejarErrorAccion(e, 'subir el favicon')}
                  />
                </View>
                <View style={styles.colFull}>
                  <VisualAssetDropzone
                    key={`navbar-fondo-${config.actualizado_en}`}
                    token={token}
                    tipo="navbar-fondo"
                    label="Imagen de fondo de las barras (navegación y herramientas)"
                    tieneAsset={config.tiene_navbar_fondo}
                    disabled={saving}
                    onUploaded={() => void load().then(() => reloadVisual())}
                    onError={(e) => void manejarErrorAccion(e, 'subir el fondo de navegación')}
                  />
                </View>
              </View>
            </View>
          ) : null}

          {tab === 'iconos' ? (
            <View style={ui.card}>
              {NAV_SECCIONES.map((sec) => (
                <View key={sec.titulo} style={styles.navSection}>
                  <Text style={ui.navSectionTitle}>{sec.titulo}</Text>
                  {sec.keys.map((key) => {
                    const iconId = resolverIconoNav(key, iconosNav[key]);
                    const selected = selectedNavKey === key;
                    return (
                      <Pressable
                        key={key}
                        onPress={() => {
                          setSelectedNavKey(key);
                          if (toolsRail) setIconPickerOpen(false);
                        }}
                        style={({ pressed }) => [
                          styles.navIconRow,
                          {
                            borderColor: selected
                              ? previewColors.primary
                              : previewColors.border,
                            backgroundColor: selected
                              ? previewColors.backgroundAlt
                              : previewColors.surface,
                          },
                          pressed && styles.navIconRowPressed,
                        ]}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                      >
                        <Text
                          style={[
                            styles.navIconLabel,
                            { color: previewColors.text },
                          ]}
                          numberOfLines={1}
                        >
                          {NAV_LABELS[key]}
                        </Text>
                        <View
                          style={[
                            styles.navIconBadge,
                            { borderColor: previewColors.border },
                          ]}
                        >
                          <Ionicons
                            name={iconId as IonName}
                            size={26}
                            color={
                              selected
                                ? previewColors.primaryDark
                                : previewColors.textMuted
                            }
                          />
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          ) : null}

          {tab === 'iconos_accion' ? (
            <View style={ui.card}>
              {ACTION_ICON_SECCIONES.map((sec) => (
                <View key={sec.titulo} style={styles.navSection}>
                  <Text style={ui.navSectionTitle}>{sec.titulo}</Text>
                  {sec.keys.map((key) => {
                    const iconId = resolverIconoAccion(key, iconosAccion[key]);
                    const selected = selectedActionKey === key;
                    return (
                      <Pressable
                        key={key}
                        onPress={() => {
                          setSelectedActionKey(key);
                          if (toolsRail) setIconPickerOpen(false);
                        }}
                        style={({ pressed }) => [
                          styles.navIconRow,
                          {
                            borderColor: selected
                              ? previewColors.primary
                              : previewColors.border,
                            backgroundColor: selected
                              ? previewColors.backgroundAlt
                              : previewColors.surface,
                          },
                          pressed && styles.navIconRowPressed,
                        ]}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                      >
                        <Text
                          style={[
                            styles.navIconLabel,
                            { color: previewColors.text },
                          ]}
                          numberOfLines={1}
                        >
                          {ACTION_ICON_LABELS[key]}
                        </Text>
                        <View
                          style={[
                            styles.navIconBadge,
                            { borderColor: previewColors.border },
                          ]}
                        >
                          <Ionicons
                            name={iconId as IonName}
                            size={26}
                            color={
                              selected
                                ? previewColors.primaryDark
                                : previewColors.textMuted
                            }
                          />
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          ) : null}

          {tab === 'categorias' ? (
            <View style={ui.card}>
              {categorias.map((cat) => {
                const iconId = categoriaMenuIcon(cat.nombre, cat.icono_menu);
                const selected = selectedCategoriaId === cat.id_categoria;
                return (
                  <Pressable
                    key={cat.id_categoria}
                    onPress={() => {
                      setSelectedCategoriaId(cat.id_categoria);
                      if (toolsRail) setIconPickerOpen(false);
                    }}
                    disabled={saving}
                    style={({ pressed }) => [
                      styles.navIconRow,
                      {
                        borderColor: selected
                          ? previewColors.primary
                          : previewColors.border,
                        backgroundColor: selected
                          ? previewColors.backgroundAlt
                          : previewColors.surface,
                      },
                      pressed && !saving && styles.navIconRowPressed,
                      saving && styles.navIconRowDisabled,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text
                      style={[
                        styles.navIconLabel,
                        { color: previewColors.text },
                      ]}
                      numberOfLines={1}
                    >
                      {cat.nombre}
                    </Text>
                    <View
                      style={[
                        styles.navIconBadge,
                        { borderColor: previewColors.border },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={iconId as MciName}
                        size={26}
                        color={
                          selected
                            ? previewColors.primaryDark
                            : previewColors.textMuted
                        }
                      />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </ScreenScroll>

        <NavIconCatalogPanel
          visible={iconPickerOpen && tab === 'iconos' && !!selectedNavKey}
          presentation={toolsRail ? 'drawer' : 'modal'}
          value={selectedNavIcon}
          targetLabel={selectedNavLabel ?? undefined}
          onChange={onSelectNavIcon}
          onClose={() => setIconPickerOpen(false)}
        />
        <NavIconCatalogPanel
          visible={iconPickerOpen && tab === 'iconos_accion' && !!selectedActionKey}
          presentation={toolsRail ? 'drawer' : 'modal'}
          value={selectedActionIcon}
          targetLabel={selectedActionLabel ?? undefined}
          onChange={onSelectActionIcon}
          onClose={() => setIconPickerOpen(false)}
        />
        <CategoriaIconCatalogPanel
          visible={iconPickerOpen && tab === 'categorias' && selectedCategoriaId != null}
          presentation={toolsRail ? 'drawer' : 'modal'}
          value={selectedCategoriaIcon as CategoriaMenuIconId}
          targetLabel={selectedCategoriaLabel ?? undefined}
          onChange={onSelectCategoriaIcon}
          onClose={() => setIconPickerOpen(false)}
        />
      </View>
    </>
      </VisualChromePreviewProvider>
    </VisualThemePreviewProvider>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, position: 'relative' },
  scroll: { flex: 1 },
  tabsWrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
  },
  tabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tab: {
    flexGrow: 1,
    flexBasis: '22%',
    minWidth: 72,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  tabLabel: {
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
  },
  tabLabelActive: { fontWeight: '800' },
  tabHint: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
    opacity: 0.8,
  },
  previewStrip: {
    flexDirection: 'row',
    height: 24,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 4,
  },
  previewSwatch: { flex: 1 },
  previewStripHint: {
    fontSize: 11,
    opacity: 0.65,
    marginBottom: 10,
    lineHeight: 15,
  },
  mesaPreviewRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  mesaPreviewCard: {
    flex: 1,
    minHeight: 72,
    borderRadius: 12,
    borderWidth: 2,
    borderLeftWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  mesaPreviewNum: {
    fontWeight: '800',
    fontSize: 22,
  },
  mesaPreviewEst: {
    marginTop: 4,
    fontWeight: '700',
    fontSize: 11,
  },
  cardBase: {
    borderRadius: 12,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  colorGrid: { gap: 0 },
  colorGridTwo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 16,
  },
  colorGridItem: {
    width: '47%',
    minWidth: 0,
  },
  assetGrid: { gap: 12 },
  assetGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 12,
  },
  colFull: {
    width: '100%',
    minWidth: 0,
  },
  colHalfWide: {
    width: '48%',
    minWidth: 0,
  },
  navSection: { gap: 6, marginTop: 4 },
  navSectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  navIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 6,
  },
  navIconRowPressed: { opacity: 0.88 },
  navIconRowDisabled: { opacity: 0.55 },
  navIconLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    minWidth: 0,
  },
  navIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionHint: {
    fontSize: 12,
    opacity: 0.7,
  },
  denied: { flex: 1, justifyContent: 'center', padding: 24 },
  deniedText: { textAlign: 'center', fontSize: 15 },
});
