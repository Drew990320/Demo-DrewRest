import { colors } from '../../src/lib/theme';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ActionIconBar } from '../../src/components/ActionIconBar';
import { IconTooltipButton } from '../../src/components/IconTooltipButton';
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
};

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

function CategoriaAdminCard({
  categoria,
  onToggle,
  onSetAll,
}: {
  categoria: CategoriaAdmin;
  onToggle: (key: WeekdayFieldKey, enabled: boolean) => void;
  onSetAll: (enabled: boolean) => void;
}) {
  return (
    <View style={styles.card}>
      <CategoriaIconHead nombre={categoria.nombre} />
      <WeekdayChips
        flags={pickWeekdayFlags(categoria)}
        onToggle={onToggle}
        onSetAll={onSetAll}
      />
    </View>
  );
}

export default function CategoriasAdminScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const r = useResponsive();
  const [rows, setRows] = useState<CategoriaAdmin[]>([]);
  const [loading, setLoading] = useState(true);

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
        Alert.alert('Error', e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  async function patchCategoria(id: number, partial: Partial<CategoriaAdmin>) {
    await api(`/categorias/admin/${id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(partial),
    });
    await load();
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
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
        { paddingHorizontal: r.contentPadding, paddingBottom: 32 },
      ]}
      ListHeaderComponent={
        <>
          <Text style={[styles.intro, formStyles.adminIntro]}>
            Activa o desactiva cada categoría por día de la semana (zona horaria del API:
            Bogotá). Todos los platos de la categoría siguen la misma visibilidad. El menú
            del día solo muestra categorías habilitadas para hoy.
          </Text>
          <ActionIconBar
            style={formStyles.screenActions}
            actions={[
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
            onToggle={(key, enabled) =>
              patchCategoria(c.id_categoria, { [key]: enabled } as Partial<CategoriaAdmin>).catch(
                (e) =>
                  Alert.alert('Error', e instanceof Error ? e.message : String(e)),
              )
            }
            onSetAll={(enabled) =>
              patchCategoria(
                c.id_categoria,
                allWeekdayFlags(enabled) as Partial<CategoriaAdmin>,
              ).catch((e) =>
                Alert.alert('Error', e instanceof Error ? e.message : String(e)),
              )
            }
          />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  pad: { paddingTop: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
    marginBottom: 10,
  },
});
