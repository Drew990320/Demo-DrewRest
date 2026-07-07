import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ActionIconBar, type ActionIconItem } from '../../src/components/ActionIconBar';
import { FormModal } from '../../src/components/FormModal';
import { ScreenLoading } from '../../src/components/ScreenLoading';
import { WeekdayChips } from '../../src/components/WeekdayChips';
import { useAuth } from '../../src/context/AuthContext';
import { useVisualTheme } from '../../src/context/VisualThemeContext';
import { useThemedStyles } from '../../src/hooks/useThemedStyles';
import { useResponsive, gridItemWidth } from '../../src/hooks/useResponsive';
import { adminGridColumns } from '../../src/lib/admin-grid';
import { AdminIcon } from '../../src/lib/app-icons';
import { useFormStyles } from '../../src/lib/form-layout';
import {
  allWeekdayFlags,
  pickWeekdayFlags,
  type WeekdayFieldKey,
} from '../../src/lib/weekday-visibility';
import { api } from '../../src/lib/api';
import { confirmAppDialog, showNotice } from '../../src/lib/app-dialog';
import { avisarSiFaltanObligatorios } from '../../src/lib/form-validation';
import { manejarErrorAccion, manejarErrorOperacion } from '../../src/lib/recurso-disponible';
import { useScreenScrollPadding } from '../../src/hooks/useScreenScrollPadding';
import { inferirIconoCategoriaDesdeNombre } from '../../src/lib/categoria-menu-icon';
import {
  inferirReglasCategoriaDesdeNombre,
  type TipoLineaCocinaCategoria,
} from '@la-reserva/shared-domain/categoria-reglas';
import type { AppColors } from '../../src/lib/theme';

type CategoriaAdmin = {
  id_categoria: number;
  nombre: string;
  icono_menu: string | null;
  activo?: boolean;
  disponible_lunes: boolean;
  disponible_martes: boolean;
  disponible_miercoles: boolean;
  disponible_jueves: boolean;
  disponible_viernes: boolean;
  disponible_sabado: boolean;
  disponible_domingo: boolean;
  es_bebida: boolean;
  cobra_empaque_para_llevar: boolean;
  participa_descuento_sopas: boolean;
  es_linea_empaque: boolean;
  visible_en_mostrador: boolean;
  tipo_linea_cocina_default: TipoLineaCocinaCategoria;
  es_plato_principal_default: boolean;
  total_productos?: number;
  total_usos_pedido?: number;
};

function categoriaVisible(c: CategoriaAdmin) {
  return c.activo !== false;
}

function subtituloCategoriaAdmin(c: CategoriaAdmin): string {
  if (c.es_linea_empaque) {
    return 'Categoría del sistema — no eliminar';
  }
  const productos = c.total_productos ?? 0;
  const usos = c.total_usos_pedido ?? 0;
  const partes: string[] = [];
  if (!categoriaVisible(c)) partes.push('oculta del menú');
  if (productos > 0) {
    partes.push(
      productos === 1 ? '1 producto' : `${productos} productos`,
    );
  }
  if (usos > 0) {
    partes.push('historial de pedidos — no eliminar');
  }
  return partes.length > 0 ? partes.join(' · ') : 'Sin productos';
}

function puedeEliminarCategoria(c: CategoriaAdmin): boolean {
  return (
    !c.es_linea_empaque &&
    (c.total_usos_pedido ?? 0) === 0
  );
}

function puedeRenombrarCategoria(c: CategoriaAdmin): boolean {
  return !c.es_linea_empaque;
}

const TIPOS_COCINA: { id: TipoLineaCocinaCategoria; label: string }[] = [
  { id: 'plato', label: 'Plato' },
  { id: 'entrada', label: 'Entrada' },
  { id: 'adicional', label: 'Adicional' },
];

function createStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    pad: { paddingTop: 16 },
    intro: { color: c.textMuted, fontSize: 13, marginBottom: 12, lineHeight: 18 },
    card: {
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: c.border,
      flex: 1,
    },
    cardInactive: {
      opacity: 0.72,
      borderColor: c.textMuted,
    },
    cardSistema: {
      borderColor: c.secondary,
      backgroundColor: c.secondaryLight,
    },
    cardHead: { marginBottom: 8, alignItems: 'center' },
    cardTitle: {
      fontSize: 16,
      fontWeight: '900',
      color: c.text,
      textAlign: 'center',
    },
    cardMeta: {
      color: c.textMuted,
      fontSize: 12,
      marginTop: 4,
      textAlign: 'center',
      lineHeight: 17,
    },
    cardActions: { marginTop: 10 },
    catNombre: {
      textAlign: 'center',
      fontSize: 13,
      fontWeight: '600',
      color: c.text,
      marginBottom: 8,
    },
    seccionReglas: {
      marginTop: 12,
      marginBottom: 6,
      fontSize: 12,
      fontWeight: '600',
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    rowSwitch: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
      gap: 8,
    },
    switchLabel: {
      flex: 1,
      fontSize: 13,
      color: c.text,
    },
    tipoLabel: {
      marginTop: 8,
      marginBottom: 6,
      fontSize: 12,
      color: c.textMuted,
    },
    tipoRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    tipoChip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
    },
    tipoChipActive: {
      borderColor: c.primary,
      backgroundColor: c.primaryMuted,
    },
    tipoChipText: {
      fontSize: 12,
      color: c.textMuted,
    },
    tipoChipTextActive: {
      color: c.primary,
      fontWeight: '600',
    },
  });
}

function ReglaSwitch({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const { colors } = useVisualTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.rowSwitch}>
      <Text style={styles.switchLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.primaryMuted }}
        thumbColor={value ? colors.primary : colors.surface}
      />
    </View>
  );
}

function CategoriaAdminCard({
  categoria,
  onToggleDia,
  onSetAllDias,
  onPatch,
  onRenombrar,
  onOcultar,
  onMostrar,
  onEliminar,
}: {
  categoria: CategoriaAdmin;
  onToggleDia: (key: WeekdayFieldKey, enabled: boolean) => void;
  onSetAllDias: (enabled: boolean) => void;
  onPatch: (partial: Partial<CategoriaAdmin>) => void;
  onRenombrar?: () => void;
  onOcultar?: () => void;
  onMostrar?: () => void;
  onEliminar?: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  const esSistema = categoria.es_linea_empaque;
  const acciones = [
    onRenombrar
      ? {
          key: 'renombrar',
          icon: AdminIcon.editar,
          label: 'Renombrar',
          variant: 'secondary',
          onPress: onRenombrar,
        }
      : null,
    onOcultar
      ? {
          key: 'ocultar',
          icon: 'eye-off-outline',
          label: 'Ocultar del menú',
          variant: 'danger',
          onPress: onOcultar,
        }
      : null,
    onMostrar
      ? {
          key: 'mostrar',
          icon: 'eye-outline',
          label: 'Volver a mostrar',
          variant: 'secondary',
          onPress: onMostrar,
        }
      : null,
    onEliminar
      ? {
          key: 'eliminar',
          icon: AdminIcon.eliminar,
          label: 'Eliminar',
          variant: 'danger',
          onPress: onEliminar,
        }
      : null,
  ].filter((x) => x != null) as ActionIconItem[];

  return (
    <View
      style={[
        styles.card,
        esSistema && styles.cardSistema,
        !categoriaVisible(categoria) && styles.cardInactive,
      ]}
    >
      <View style={styles.cardHead}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {categoria.nombre}
        </Text>
        <Text style={styles.cardMeta}>{subtituloCategoriaAdmin(categoria)}</Text>
      </View>
      <WeekdayChips
        flags={pickWeekdayFlags(categoria)}
        onToggle={onToggleDia}
        onSetAll={onSetAllDias}
        disabled={esSistema}
      />
      <Text style={styles.seccionReglas}>Reglas operativas</Text>
      <ReglaSwitch
        label="Es bebida"
        value={categoria.es_bebida}
        onChange={(v) => onPatch({ es_bebida: v })}
      />
      <ReglaSwitch
        label="Visible en mostrador"
        value={categoria.visible_en_mostrador}
        onChange={(v) => onPatch({ visible_en_mostrador: v })}
      />
      <ReglaSwitch
        label="Cobra empaque (para llevar)"
        value={categoria.cobra_empaque_para_llevar}
        onChange={(v) => onPatch({ cobra_empaque_para_llevar: v })}
      />
      <ReglaSwitch
        label="Elegible para promos por categoría marcada"
        value={categoria.participa_descuento_sopas}
        onChange={(v) => onPatch({ participa_descuento_sopas: v })}
      />
      <ReglaSwitch
        label="Línea empaque (sistema)"
        value={categoria.es_linea_empaque}
        onChange={(v) => onPatch({ es_linea_empaque: v })}
      />
      <ReglaSwitch
        label="Plato principal por defecto"
        value={categoria.es_plato_principal_default}
        onChange={(v) => onPatch({ es_plato_principal_default: v })}
      />
      <Text style={styles.tipoLabel}>Tipo en cocina (por defecto)</Text>
      <View style={styles.tipoRow}>
        {TIPOS_COCINA.map((t) => {
          const active = categoria.tipo_linea_cocina_default === t.id;
          return (
            <Pressable
              key={t.id}
              style={[styles.tipoChip, active && styles.tipoChipActive]}
              onPress={() => onPatch({ tipo_linea_cocina_default: t.id })}
            >
              <Text style={[styles.tipoChipText, active && styles.tipoChipTextActive]}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {acciones.length > 0 ? (
        <ActionIconBar style={styles.cardActions} actions={acciones} />
      ) : null}
    </View>
  );
}

export default function CategoriasAdminScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const r = useResponsive();
  const styles = useThemedStyles(createStyles);
  const formStyles = useFormStyles();
  const listBottomPad = useScreenScrollPadding();
  const [rows, setRows] = useState<CategoriaAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalNueva, setModalNueva] = useState(false);
  const [modalRenombrar, setModalRenombrar] = useState(false);
  const [editCategoria, setEditCategoria] = useState<CategoriaAdmin | null>(null);
  const [nombreRenombrar, setNombreRenombrar] = useState('');
  const [saving, setSaving] = useState(false);
  const [nombreNueva, setNombreNueva] = useState('');
  const [tipoCocinaNueva, setTipoCocinaNueva] =
    useState<TipoLineaCocinaCategoria>('plato');
  const [esBebidaNueva, setEsBebidaNueva] = useState(false);
  const [visibleMostradorNueva, setVisibleMostradorNueva] = useState(false);
  const [platoPrincipalNueva, setPlatoPrincipalNueva] = useState(false);
  const [diasNueva, setDiasNueva] = useState(allWeekdayFlags(true));

  const gridColumns = useMemo(
    () => adminGridColumns(r.contentWidth, r.gridColumns),
    [r.contentWidth, r.gridColumns],
  );
  const cardWidth = gridItemWidth(r.contentWidth, gridColumns, r.gridGap);

  const load = useCallback(async () => {
    const data = await api<CategoriaAdmin[]>('/categorias/admin', { token });
    setRows(data);
  }, [token]);

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch (e) {
        await manejarErrorAccion(e, 'cargar las categorías');
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  async function patchCategoria(id: number, partial: Partial<CategoriaAdmin>) {
    try {
      await api(`/categorias/admin/${id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify(partial),
      });
      await load();
    } catch (e) {
      await manejarErrorAccion(e, 'actualizar la categoría');
    }
  }

  function aplicarSugerenciasNombre(nombre: string) {
    const reglas = inferirReglasCategoriaDesdeNombre(nombre);
    setTipoCocinaNueva(reglas.tipo_linea_cocina_default);
    setEsBebidaNueva(reglas.es_bebida);
    setVisibleMostradorNueva(reglas.visible_en_mostrador);
    setPlatoPrincipalNueva(reglas.es_plato_principal_default);
  }

  function closeRenombrar() {
    if (saving) return;
    setModalRenombrar(false);
    setEditCategoria(null);
    setNombreRenombrar('');
  }

  function openRenombrar(c: CategoriaAdmin) {
    setEditCategoria(c);
    setNombreRenombrar(c.nombre);
    setModalRenombrar(true);
  }

  async function guardarRenombrar() {
    if (!editCategoria) return;
    const nombre = nombreRenombrar.trim();
    if (
      await avisarSiFaltanObligatorios(
        [{ etiqueta: 'Nombre', valor: nombre }],
        showNotice,
      )
    ) {
      return;
    }
    setSaving(true);
    try {
      await patchCategoria(editCategoria.id_categoria, { nombre });
      closeRenombrar();
    } catch (e) {
      await manejarErrorAccion(e, 'renombrar la categoría');
    } finally {
      setSaving(false);
    }
  }

  async function ocultarCategoria(c: CategoriaAdmin) {
    try {
      await patchCategoria(c.id_categoria, { activo: false });
    } catch (e) {
      await manejarErrorAccion(e, 'ocultar la categoría');
    }
  }

  async function mostrarCategoria(c: CategoriaAdmin) {
    try {
      await patchCategoria(c.id_categoria, { activo: true });
    } catch (e) {
      await manejarErrorAccion(e, 'mostrar la categoría');
    }
  }

  async function eliminarCategoria(c: CategoriaAdmin) {
    const ok = await confirmAppDialog(
      'Eliminar categoría',
      `¿Eliminar «${c.nombre}» y sus productos sin historial? Esta acción no se puede deshacer.`,
    );
    if (!ok) return;
    try {
      await api(`/categorias/admin/${c.id_categoria}`, {
        method: 'DELETE',
        token,
      });
      await load();
    } catch (e) {
      await manejarErrorOperacion(e, {
        title: 'No se pudo eliminar',
        message:
          'Solo se eliminan categorías sin historial de pedidos en sus productos.',
      });
    }
  }

  function openNuevaCategoria() {
    setNombreNueva('');
    setTipoCocinaNueva('plato');
    setEsBebidaNueva(false);
    setVisibleMostradorNueva(false);
    setPlatoPrincipalNueva(false);
    setDiasNueva(allWeekdayFlags(true));
    setModalNueva(true);
  }

  function closeNuevaCategoria() {
    if (saving) return;
    setModalNueva(false);
  }

  async function guardarNuevaCategoria() {
    const nombre = nombreNueva.trim();
    if (
      await avisarSiFaltanObligatorios(
        [{ etiqueta: 'Nombre', valor: nombre }],
        showNotice,
      )
    ) {
      return;
    }
    setSaving(true);
    try {
      await api('/categorias/admin', {
        method: 'POST',
        token,
        body: JSON.stringify({
          nombre,
          ...diasNueva,
          tipo_linea_cocina_default: tipoCocinaNueva,
          es_bebida: esBebidaNueva,
          visible_en_mostrador: visibleMostradorNueva,
          es_plato_principal_default: platoPrincipalNueva,
          icono_menu: inferirIconoCategoriaDesdeNombre(nombre),
        }),
      });
      await load();
      setModalNueva(false);
      await showNotice(
        'Categoría creada',
        `«${nombre}» ya está disponible. Agrega productos en Menú y precios.`,
        'success',
      );
    } catch (e) {
      await manejarErrorAccion(e, 'crear la categoría');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <ScreenLoading />;
  }

  return (
    <>
    <FlatList
      key={`categorias-admin-grid-${gridColumns}`}
      style={styles.container}
      data={rows}
      keyExtractor={(c) => String(c.id_categoria)}
      numColumns={gridColumns}
      columnWrapperStyle={
        gridColumns > 1 ? { gap: r.gridGap, marginBottom: r.gridGap } : undefined
      }
      contentContainerStyle={[
        styles.pad,
        { paddingHorizontal: r.contentPadding, paddingBottom: listBottomPad },
      ]}
      ListHeaderComponent={
        <>
          <Text style={[styles.intro, formStyles.adminIntro]}>
            Crea categorías, define días de visibilidad y reglas operativas. Ocultar
            quita la categoría del menú sin borrar historial; eliminar solo aplica
            si ningún producto tuvo pedidos (como en Mesas).
          </Text>
          <ActionIconBar
            style={formStyles.screenActions}
            actions={[
              {
                key: 'nueva',
                icon: AdminIcon.crear,
                label: 'Nueva categoría',
                variant: 'primary',
                onPress: openNuevaCategoria,
              },
              {
                key: 'menu',
                icon: AdminIcon.irMenu,
                label: 'Ir a editar productos y precios',
                variant: 'secondary',
                onPress: () => router.push('/(app)/menu-admin'),
              },
            ]}
          />
        </>
      }
      renderItem={({ item: c }) => (
        <View
          style={{
            width: cardWidth,
            marginBottom: gridColumns === 1 ? r.gridGap : 0,
          }}
        >
          <CategoriaAdminCard
            categoria={c}
            onToggleDia={(key, enabled) =>
              void patchCategoria(c.id_categoria, { [key]: enabled } as Partial<CategoriaAdmin>)
            }
            onSetAllDias={(enabled) =>
              void patchCategoria(
                c.id_categoria,
                allWeekdayFlags(enabled) as Partial<CategoriaAdmin>,
              )
            }
            onPatch={(partial) => void patchCategoria(c.id_categoria, partial)}
            onRenombrar={
              puedeRenombrarCategoria(c) ? () => openRenombrar(c) : undefined
            }
            onOcultar={
              !c.es_linea_empaque && categoriaVisible(c)
                ? () => void ocultarCategoria(c)
                : undefined
            }
            onMostrar={
              !c.es_linea_empaque && !categoriaVisible(c)
                ? () => void mostrarCategoria(c)
                : undefined
            }
            onEliminar={
              puedeEliminarCategoria(c) ? () => void eliminarCategoria(c) : undefined
            }
          />
        </View>
      )}
    />

    <FormModal
      visible={modalNueva}
      title="Nueva categoría"
      onClose={closeNuevaCategoria}
    >
      <Text style={formStyles.help}>
        Ejemplos: Postres, Promociones, Platos fuertes - Pescado. Después agrega
        productos en «Menú y precios».
      </Text>
      <Text style={formStyles.label}>Nombre</Text>
      <TextInput
        style={formStyles.input}
        value={nombreNueva}
        onChangeText={(text) => {
          setNombreNueva(text);
          if (text.trim()) aplicarSugerenciasNombre(text);
        }}
        placeholder="Nombre de la categoría"
        maxLength={100}
        autoCapitalize="sentences"
      />
      <Text style={formStyles.help}>
        El icono del menú se asigna automáticamente y puedes cambiarlo en
        Personalización visual.
      </Text>
      <Text style={formStyles.label}>Días visibles en el menú</Text>
      <WeekdayChips
        flags={diasNueva}
        onToggle={(key, enabled) =>
          setDiasNueva((prev) => ({ ...prev, [key]: enabled }))
        }
        onSetAll={(enabled) => setDiasNueva(allWeekdayFlags(enabled))}
      />
      <Text style={styles.tipoLabel}>Tipo en cocina (por defecto)</Text>
      <View style={styles.tipoRow}>
        {TIPOS_COCINA.map((t) => {
          const active = tipoCocinaNueva === t.id;
          return (
            <Pressable
              key={t.id}
              style={[styles.tipoChip, active && styles.tipoChipActive]}
              onPress={() => setTipoCocinaNueva(t.id)}
            >
              <Text style={[styles.tipoChipText, active && styles.tipoChipTextActive]}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <ReglaSwitch
        label="Es bebida"
        value={esBebidaNueva}
        onChange={setEsBebidaNueva}
      />
      <ReglaSwitch
        label="Visible en mostrador"
        value={visibleMostradorNueva}
        onChange={setVisibleMostradorNueva}
      />
      <ReglaSwitch
        label="Plato principal por defecto"
        value={platoPrincipalNueva}
        onChange={setPlatoPrincipalNueva}
      />
      <ActionIconBar
        style={formStyles.modalActionBar}
        actions={[
          {
            key: 'cancel',
            icon: AdminIcon.cancelar,
            label: 'Cancelar',
            variant: 'secondary',
            disabled: saving,
            onPress: closeNuevaCategoria,
          },
          {
            key: 'guardar',
            icon: saving ? 'hourglass-outline' : AdminIcon.crear,
            label: saving ? 'Guardando…' : 'Crear categoría',
            variant: 'primary',
            disabled: saving,
            onPress: () => void guardarNuevaCategoria(),
          },
        ]}
      />
    </FormModal>

    <FormModal
      visible={modalRenombrar}
      title="Renombrar categoría"
      onClose={closeRenombrar}
    >
      <Text style={formStyles.label}>Nombre</Text>
      <TextInput
        style={formStyles.input}
        value={nombreRenombrar}
        onChangeText={setNombreRenombrar}
        placeholder="Nombre de la categoría"
        maxLength={100}
        autoCapitalize="sentences"
      />
      <ActionIconBar
        style={formStyles.modalActionBar}
        actions={[
          {
            key: 'cancel',
            icon: AdminIcon.cancelar,
            label: 'Cancelar',
            variant: 'secondary',
            disabled: saving,
            onPress: closeRenombrar,
          },
          {
            key: 'guardar',
            icon: saving ? 'hourglass-outline' : AdminIcon.guardar,
            label: saving ? 'Guardando…' : 'Guardar',
            variant: 'primary',
            disabled: saving,
            onPress: () => void guardarRenombrar(),
          },
        ]}
      />
    </FormModal>
    </>
  );
}
