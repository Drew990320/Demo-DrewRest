import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ActionIconBar } from '../../src/components/ActionIconBar';
import { FormModal } from '../../src/components/FormModal';
import { MoneyTextInput } from '../../src/components/MoneyTextInput';
import { useAuth } from '../../src/context/AuthContext';
import { IconTooltipButton } from '../../src/components/IconTooltipButton';
import { AccionIcon, AdminIcon } from '../../src/lib/app-icons';
import { formStyles } from '../../src/lib/form-layout';
import { api } from '../../src/lib/api';
import { digitsFromMonto, parseCOPDigits } from '../../src/lib/cop-input';
import { showAppDialog, showNotice } from '../../src/lib/app-dialog';
import { colors } from '../../src/lib/theme';

type Categoria = { id_categoria: number; nombre: string };

type ProductoRow = {
  id_producto: number;
  id_categoria: number;
  categoria_nombre: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  activo: boolean;
  es_plato_principal: boolean;
  es_empacable: boolean;
  tipo_proteina: string;
};

export default function MenuAdminScreen() {
  const { token } = useAuth();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<ProductoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  /** Si no es null, el modal está en modo edición de ese producto. */
  const [editProduct, setEditProduct] = useState<ProductoRow | null>(null);
  const [saving, setSaving] = useState(false);

  const [idCat, setIdCat] = useState<number | null>(null);
  const [nombre, setNombre] = useState('');
  const [precioStr, setPrecioStr] = useState('');
  const [desc, setDesc] = useState('');
  const [platoPrincipal, setPlatoPrincipal] = useState(false);
  const [empacable, setEmpacable] = useState(false);

  const load = useCallback(async () => {
    const [cats, prods] = await Promise.all([
      api<Categoria[]>('/productos/categorias', { token }),
      api<ProductoRow[]>('/productos?incluir_inactivos=true', { token }),
    ]);
    setCategorias(cats);
    setProductos(prods);
  }, [token]);

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch (e) {
        await showNotice('Error', e instanceof Error ? e.message : String(e), 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  async function setProductoActivo(p: ProductoRow, activo: boolean) {
    await api(`/productos/${p.id_producto}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ activo }),
    });
    await load();
    setEditProduct((prev) =>
      prev?.id_producto === p.id_producto ? { ...prev, activo } : prev,
    );
  }

  async function onSoftDelete(p: ProductoRow) {
    await showAppDialog({
      title: 'Quitar del menú',
      message: `¿Ocultar "${p.nombre}"? No borra historial de pedidos; solo deja de mostrarse en el menú.`,
      variant: 'warning',
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Ocultar',
          style: 'danger',
          onPress: async () => {
            try {
              await setProductoActivo(p, false);
            } catch (e) {
              await showNotice(
                'Error',
                e instanceof Error ? e.message : String(e),
                'error',
              );
            }
          },
        },
      ],
    });
  }

  async function onRestore(p: ProductoRow) {
    try {
      await setProductoActivo(p, true);
    } catch (e) {
      await showNotice('Error', e instanceof Error ? e.message : String(e), 'error');
    }
  }

  function openNew() {
    setEditProduct(null);
    setIdCat(categorias[0]?.id_categoria ?? null);
    setNombre('');
    setPrecioStr('');
    setDesc('');
    setPlatoPrincipal(false);
    setEmpacable(false);
    setModal(true);
  }

  function openEdit(p: ProductoRow) {
    setEditProduct(p);
    setIdCat(p.id_categoria);
    setNombre(p.nombre);
    setPrecioStr(digitsFromMonto(p.precio));
    setDesc(p.descripcion ?? '');
    setPlatoPrincipal(p.es_plato_principal);
    setEmpacable(p.es_empacable);
    setModal(true);
  }

  function closeModal() {
    setModal(false);
    setEditProduct(null);
  }

  async function onSave() {
    if (idCat == null) {
      await showNotice('Categoría', 'Elige una categoría.', 'warning');
      return;
    }
    const faltantes: { etiqueta: string; valor: string }[] = [];
    if (!nombre.trim()) faltantes.push({ etiqueta: 'Nombre', valor: '' });
    if (!precioStr.trim()) faltantes.push({ etiqueta: 'Precio', valor: '' });
    if (faltantes.length > 0) {
      await showNotice(
        'Campos obligatorios',
        faltantes.length === 1
          ? `El campo «${faltantes[0].etiqueta}» es obligatorio.`
          : 'Completa los campos obligatorios: «Nombre», «Precio».',
        'warning',
      );
      return;
    }
    const precio = parseCOPDigits(precioStr);
    if (!Number.isFinite(precio) || precio < 0) {
      await showNotice(
        'Campo inválido',
        'Indica un precio válido en «Precio».',
        'warning',
      );
      return;
    }
    setSaving(true);
    try {
      if (editProduct) {
        await api(`/productos/${editProduct.id_producto}`, {
          method: 'PATCH',
          token,
          body: JSON.stringify({
            id_categoria: idCat,
            nombre: nombre.trim(),
            precio,
            descripcion: desc.trim() || null,
            es_plato_principal: platoPrincipal,
            es_empacable: empacable,
          }),
        });
      } else {
        await api('/productos', {
          method: 'POST',
          token,
          body: JSON.stringify({
            id_categoria: idCat,
            nombre: nombre.trim(),
            precio,
            descripcion: desc.trim() || undefined,
            es_plato_principal: platoPrincipal,
            es_empacable: empacable,
          }),
        });
      }
      closeModal();
      await load();
    } catch (e) {
      await showNotice('Error', e instanceof Error ? e.message : String(e), 'error');
    } finally {
      setSaving(false);
    }
  }

  function productoVisible(p: ProductoRow) {
    return p.activo !== false;
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActionIconBar
        style={[formStyles.screenActions, { margin: 16, marginBottom: 8 }]}
        actions={[
          {
            key: 'nuevo',
            icon: AdminIcon.crear,
            label: 'Nuevo producto',
            variant: 'primary',
            onPress: openNew,
          },
        ]}
      />
      <Text style={[styles.hint, formStyles.adminIntro]}>
        Las categorías y sus días se gestionan en Categorías (admin). Aquí puedes crear
        ítems, cambiar precio y datos con Editar, u ocultar del menú visible.
      </Text>
      <FlatList
        data={productos}
        keyExtractor={(item) => String(item.id_producto)}
        contentContainerStyle={styles.listPad}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <View
            style={[styles.card, !productoVisible(item) && styles.cardInactive]}
          >
            <View style={styles.cardRow}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.nombre}</Text>
                <Text style={styles.cardMeta}>
                  {item.categoria_nombre} · $
                  {Math.round(item.precio).toLocaleString('es-CO')}
                  {!productoVisible(item) ? ' · oculto' : ''}
                </Text>
              </View>
              <View style={styles.cardActions}>
                <IconTooltipButton
                  icon="create-outline"
                  label="Editar precio y detalles"
                  variant="secondary"
                  fixedSize
                  onPress={() => openEdit(item)}
                />
                {productoVisible(item) ? (
                  <IconTooltipButton
                    icon="eye-off-outline"
                    label="Ocultar del menú"
                    variant="danger"
                    fixedSize
                    onPress={() => onSoftDelete(item)}
                  />
                ) : (
                  <IconTooltipButton
                    icon="eye-outline"
                    label="Volver a mostrar"
                    variant="secondary"
                    fixedSize
                    onPress={() => onRestore(item)}
                  />
                )}
              </View>
            </View>
          </View>
        )}
      />

      <FormModal
        visible={modal}
        title={editProduct ? 'Editar producto' : 'Nuevo producto'}
        onClose={closeModal}
        scroll
      >
        <Text style={formStyles.label}>Categoría</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.catScroll}
        >
          {categorias.map((c) => (
            <Pressable
              key={c.id_categoria}
              onPress={() => setIdCat(c.id_categoria)}
              style={[
                styles.chip,
                idCat === c.id_categoria && styles.chipOn,
              ]}
            >
              <Text
                numberOfLines={2}
                style={[
                  styles.chipText,
                  idCat === c.id_categoria && styles.chipTextOn,
                ]}
              >
                {c.nombre}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <Text style={formStyles.label}>Nombre</Text>
        <TextInput
          style={formStyles.input}
          value={nombre}
          onChangeText={setNombre}
          placeholder="Ej. Pechuga a la plancha"
        />
        <Text style={formStyles.label}>Precio</Text>
        <MoneyTextInput
          style={[formStyles.input, formStyles.inputNarrow]}
          digits={precioStr}
          onChangeDigits={setPrecioStr}
          placeholderAmount={28000}
        />
        <Text style={formStyles.label}>Descripción (opcional)</Text>
        <TextInput
          style={[formStyles.input, formStyles.inputMultiline]}
          value={desc}
          onChangeText={setDesc}
          multiline
        />
        <View style={styles.rowSwitch}>
          <Text style={styles.switchLabel}>Plato principal</Text>
          <Switch value={platoPrincipal} onValueChange={setPlatoPrincipal} />
        </View>
        <View style={styles.rowSwitch}>
          <Text style={styles.switchLabel}>Empacable</Text>
          <Switch value={empacable} onValueChange={setEmpacable} />
        </View>
        {editProduct ? (
          <View style={styles.modalVisibilityRow}>
            <Text style={styles.modalVisibilityLabel}>Visibilidad en el menú</Text>
            <View style={styles.modalVisibilityActions}>
              {productoVisible(editProduct) ? (
                <IconTooltipButton
                  icon="eye-off-outline"
                  label="Ocultar del menú"
                  variant="danger"
                  fixedSize
                  onPress={() => onSoftDelete(editProduct)}
                />
              ) : (
                <IconTooltipButton
                  icon="eye-outline"
                  label="Volver a mostrar"
                  variant="secondary"
                  fixedSize
                  onPress={() => onRestore(editProduct)}
                />
              )}
            </View>
          </View>
        ) : null}
        <ActionIconBar
          style={formStyles.modalActionBar}
          actions={[
            {
              key: 'cancel',
              icon: AdminIcon.cancelar,
              label: 'Cancelar',
              variant: 'secondary',
              disabled: saving,
              onPress: closeModal,
            },
            {
              key: 'save',
              icon: saving ? 'hourglass-outline' : AccionIcon.guardar,
              label: saving ? 'Guardando…' : 'Guardar',
              variant: 'primary',
              disabled: saving,
              onPress: onSave,
            },
          ]}
        />
      </FormModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hint: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    color: colors.textMuted,
    fontSize: 13,
  },
  listPad: { padding: 16, paddingTop: 0 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardInactive: { opacity: 0.72 },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardInfo: { flex: 1, minWidth: 0 },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  cardTitle: { fontWeight: '800', fontSize: 16, color: colors.text },
  cardMeta: { marginTop: 4, color: colors.textMuted, fontSize: 13 },
  modalVisibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalVisibilityLabel: { fontWeight: '600', color: colors.text, flex: 1 },
  modalVisibilityActions: { flexDirection: 'row', gap: 8 },
  catScroll: { maxHeight: 88, marginBottom: 4 },
  chip: {
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: 220,
  },
  chipOn: { backgroundColor: colors.successLight, borderColor: colors.primary },
  chipText: { fontSize: 12, color: colors.text },
  chipTextOn: { fontWeight: '800', color: colors.mesaLibre },
  rowSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  switchLabel: { fontWeight: '600', color: colors.text },
});
