import { colors } from '../../src/lib/theme';
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
import { ActionIconBar } from '../../src/components/ActionIconBar';
import { FormModal } from '../../src/components/FormModal';
import { IconTooltipButton } from '../../src/components/IconTooltipButton';
import { ScreenLoading } from '../../src/components/ScreenLoading';
import { WeekdayChips } from '../../src/components/WeekdayChips';
import { useAuth } from '../../src/context/AuthContext';
import { useResponsive, gridItemWidth } from '../../src/hooks/useResponsive';
import { adminGridColumns } from '../../src/lib/admin-grid';
import { AdminIcon } from '../../src/lib/app-icons';
import { categoriaMenuIcon } from '../../src/lib/categoria-menu-icon';
import { formStyles } from '../../src/lib/form-layout';
import {
  allWeekdayFlags,
  pickWeekdayFlags,
  type WeekdayFieldKey,
} from '../../src/lib/weekday-visibility';
import { api } from '../../src/lib/api';
import { showNotice } from '../../src/lib/app-dialog';
import { avisarSiFaltanObligatorios } from '../../src/lib/form-validation';
import { manejarErrorAccion } from '../../src/lib/recurso-disponible';
import { useScreenScrollPadding } from '../../src/hooks/useScreenScrollPadding';
import {
  inferirReglasCategoriaDesdeNombre,
  type TipoLineaCocinaCategoria,
} from '@la-reserva/shared-domain/categoria-reglas';

type CategoriaAdmin = {
  id_categoria: number;
  nombre: string;
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
};

const TIPOS_COCINA: { id: TipoLineaCocinaCategoria; label: string }[] = [
  { id: 'plato', label: 'Plato' },
  { id: 'entrada', label: 'Entrada' },
  { id: 'adicional', label: 'Adicional' },
];

function CategoriaIconHead({ nombre }: { nombre: string }) {
  return (
    <IconTooltipButton
      iconSet="material-community"
      icon={categoriaMenuIcon(nombre)}
      label={nombre}
      variant="secondary"
      fixedSize
      size={22}
      onPress={() => {}}
      style={styles.catIconHead}
    />
  );
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
}: {
  categoria: CategoriaAdmin;
  onToggleDia: (key: WeekdayFieldKey, enabled: boolean) => void;
  onSetAllDias: (enabled: boolean) => void;
  onPatch: (partial: Partial<CategoriaAdmin>) => void;
}) {
  return (
    <View style={styles.card}>
      <CategoriaIconHead nombre={categoria.nombre} />
      <Text style={styles.catNombre} numberOfLines={2}>
        {categoria.nombre}
      </Text>
      <WeekdayChips
        flags={pickWeekdayFlags(categoria)}
        onToggle={onToggleDia}
        onSetAll={onSetAllDias}
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
        label="Participa descuento sopas"
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
    </View>
  );
}

export default function CategoriasAdminScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const r = useResponsive();
  const listBottomPad = useScreenScrollPadding();
  const [rows, setRows] = useState<CategoriaAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalNueva, setModalNueva] = useState(false);
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
      await avisarSiFaltanObligatorios([{ etiqueta: 'Nombre', valor: nombre }])
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
            Crea categorías para el menú del local, define días de visibilidad y
            reglas (cocina, mostrador, empaque, descuentos). Los productos nuevos
            heredan flags sugeridos de aquí.
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
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  pad: { paddingTop: 16 },
  intro: { color: colors.textMuted, fontSize: 13, marginBottom: 12, lineHeight: 18 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
  },
  catIconHead: {
    alignSelf: 'center',
    marginBottom: 6,
  },
  catNombre: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  seccionReglas: {
    marginTop: 12,
    marginBottom: 6,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
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
    color: colors.text,
  },
  tipoLabel: {
    marginTop: 8,
    marginBottom: 6,
    fontSize: 12,
    color: colors.textMuted,
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
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  tipoChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  tipoChipText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  tipoChipTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});
