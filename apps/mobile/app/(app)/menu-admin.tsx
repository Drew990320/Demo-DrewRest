import { useCallback, useEffect, useState } from 'react';
import {
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
import { ScreenLoading } from '../../src/components/ScreenLoading';
import { useAuth } from '../../src/context/AuthContext';
import { useVisualTheme } from '../../src/context/VisualThemeContext';
import { useThemedStyles } from '../../src/hooks/useThemedStyles';
import type { AppColors } from '../../src/lib/theme';
import { IconTooltipButton } from '../../src/components/IconTooltipButton';
import { AccionIcon, AdminIcon } from '../../src/lib/app-icons';
import { useFormStyles } from '../../src/lib/form-layout';
import { api } from '../../src/lib/api';
import { digitsFromMonto, parseCOPDigits, sanitizeMontoDigitos } from '../../src/lib/cop-input';
import { confirmAppDialog, showAppDialog, showNotice } from '../../src/lib/app-dialog';
import { manejarErrorAccion, manejarErrorOperacion } from '../../src/lib/recurso-disponible';
import { flagsProductoMenuPorCategoria } from '../../src/lib/empaque-para-llevar';
import { ProductoPersonalizacionesPanel } from '../../src/components/ProductoPersonalizacionesPanel';
import { useScreenScrollPadding } from '../../src/hooks/useScreenScrollPadding';

type Categoria = { id_categoria: number; nombre: string; es_bebida?: boolean };

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
  es_acompanamiento_mazorca: boolean;
  tipo_proteina: string;
  es_bebida?: boolean;
  control_stock?: boolean;
  stock_disponible?: number;
  ocultar_sin_stock?: boolean;
  total_usos_pedido?: number;
};

const TIPOS_PROTEINA = [
  'ninguno',
  'pollo',
  'res',
  'cerdo',
  'otro',
] as const;

export default function MenuAdminScreen() {
  const { colors } = useVisualTheme();
  const styles = useThemedStyles(createStyles);
  const formStyles = useFormStyles();
  const { token } = useAuth();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<ProductoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  /** Si no es null, el modal está en modo edición de ese producto. */
  const [editProduct, setEditProduct] = useState<ProductoRow | null>(null);
  const [saving, setSaving] = useState(false);
  const listBottomPad = useScreenScrollPadding();

  const [idCat, setIdCat] = useState<number | null>(null);
  const [nombre, setNombre] = useState('');
  const [precioStr, setPrecioStr] = useState('');
  const [desc, setDesc] = useState('');
  const [platoPrincipal, setPlatoPrincipal] = useState(false);
  const [empacable, setEmpacable] = useState(false);
  const [mazorcaAcompanamiento, setMazorcaAcompanamiento] = useState(false);
  const [tipoProteina, setTipoProteina] =
    useState<(typeof TIPOS_PROTEINA)[number]>('ninguno');
  const [controlStock, setControlStock] = useState(false);
  const [stockDigits, setStockDigits] = useState('');
  const [ocultarSinStock, setOcultarSinStock] = useState(true);

  const categoriaSeleccionada = categorias.find((c) => c.id_categoria === idCat);
  const esCategoriaBebida =
    categoriaSeleccionada?.es_bebida ??
    Boolean(
      editProduct?.es_bebida ??
      /bebida/i.test(categoriaSeleccionada?.nombre ?? ''),
    );
  const sugeridoCategoria = categoriaSeleccionada
    ? flagsProductoMenuPorCategoria(categoriaSeleccionada.nombre)
    : null;

  function seleccionarCategoria(id: number) {
    setIdCat(id);
    const cat = categorias.find((c) => c.id_categoria === id);
    if (!cat) return;
    if (editProduct) return;
    const sugerido = flagsProductoMenuPorCategoria(cat.nombre);
    setPlatoPrincipal(sugerido.es_plato_principal);
    setEmpacable(sugerido.es_empacable);
  }

  async function patchFlagsProducto(
    p: ProductoRow,
    patch: Partial<
      Pick<
        ProductoRow,
        'es_plato_principal' | 'es_empacable' | 'es_acompanamiento_mazorca' | 'tipo_proteina'
      >
    >,
  ) {
    await api(`/productos/${p.id_producto}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(patch),
    });
    await load();
    setEditProduct((prev) =>
      prev?.id_producto === p.id_producto ? { ...prev, ...patch } : prev,
    );
  }

  async function onPlatoPrincipalChange(value: boolean) {
    setPlatoPrincipal(value);
    if (editProduct) {
      try {
        await patchFlagsProducto(editProduct, { es_plato_principal: value });
      } catch (e) {
        setPlatoPrincipal(!value);
        await manejarErrorAccion(e, 'guardar el cambio');
      }
    }
  }

  async function onEmpacableChange(value: boolean) {
    setEmpacable(value);
    if (value) setPlatoPrincipal(false);
    if (editProduct) {
      try {
        await patchFlagsProducto(editProduct, {
          es_empacable: value,
          es_plato_principal: value ? false : editProduct.es_plato_principal,
        });
      } catch (e) {
        setEmpacable(!value);
        await manejarErrorAccion(e, 'guardar el cambio');
      }
    }
  }

  async function onMazorcaChange(value: boolean) {
    setMazorcaAcompanamiento(value);
    if (editProduct) {
      try {
        await patchFlagsProducto(editProduct, {
          es_acompanamiento_mazorca: value,
        });
      } catch (e) {
        setMazorcaAcompanamiento(!value);
        await manejarErrorAccion(e, 'guardar el cambio');
      }
    }
  }

  const load = useCallback(async () => {
    const [cats, prods] = await Promise.all([
      api<Categoria[]>('/categorias/admin', { token }),
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
        await manejarErrorAccion(e, 'cargar el menú de administración');
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
              await manejarErrorAccion(e, 'ocultar el producto');
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
      await manejarErrorAccion(e, 'restaurar el producto');
    }
  }

  function puedeEliminarProducto(p: ProductoRow) {
    return (p.total_usos_pedido ?? 0) === 0;
  }

  async function onEliminarPermanente(p: ProductoRow) {
    const ok = await confirmAppDialog(
      'Eliminar producto',
      `¿Eliminar «${p.nombre}» de forma permanente? Esta acción no se puede deshacer.`,
    );
    if (!ok) return;
    try {
      await api(`/productos/${p.id_producto}`, {
        method: 'DELETE',
        token,
      });
      await load();
    } catch (e) {
      await manejarErrorOperacion(e, {
        title: 'No se pudo eliminar',
        message:
          'Solo se eliminan productos sin historial de pedidos. Usa «Ocultar» para quitarlos del menú.',
      });
    }
  }

  function openNew() {
    setEditProduct(null);
    const first = categorias[0]?.id_categoria ?? null;
    setNombre('');
    setPrecioStr('');
    setDesc('');
    if (first != null) seleccionarCategoria(first);
    else {
      setIdCat(null);
      setPlatoPrincipal(false);
      setEmpacable(false);
      setMazorcaAcompanamiento(false);
      setTipoProteina('ninguno');
    }
    setControlStock(false);
    setStockDigits('');
    setOcultarSinStock(true);
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
    setMazorcaAcompanamiento(p.es_acompanamiento_mazorca);
    setTipoProteina(
      (TIPOS_PROTEINA.includes(p.tipo_proteina as (typeof TIPOS_PROTEINA)[number])
        ? p.tipo_proteina
        : 'ninguno') as (typeof TIPOS_PROTEINA)[number],
    );
    setControlStock(Boolean(p.control_stock));
    setStockDigits(digitsFromMonto(p.stock_disponible ?? 0));
    setOcultarSinStock(p.ocultar_sin_stock !== false);
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
      const payload: Record<string, unknown> = {
        id_categoria: idCat,
        nombre: nombre.trim(),
        precio,
        descripcion: desc.trim() || null,
        es_plato_principal: platoPrincipal,
        es_empacable: empacable,
        es_acompanamiento_mazorca: mazorcaAcompanamiento,
        tipo_proteina: tipoProteina,
      };
      if (esCategoriaBebida) {
        const stock = Math.max(0, parseCOPDigits(stockDigits));
        Object.assign(payload, {
          control_stock: controlStock,
          stock_disponible: stock,
          ocultar_sin_stock: ocultarSinStock,
        });
      }
      if (editProduct) {
        await api(`/productos/${editProduct.id_producto}`, {
          method: 'PATCH',
          token,
          body: JSON.stringify(payload),
        });
      } else {
        await api('/productos', {
          method: 'POST',
          token,
          body: JSON.stringify({
            ...payload,
            descripcion: desc.trim() || undefined,
          }),
        });
      }
      closeModal();
      await load();
    } catch (e) {
      await manejarErrorAccion(e, 'guardar el producto');
    } finally {
      setSaving(false);
    }
  }

  function productoVisible(p: ProductoRow) {
    return p.activo !== false;
  }

  if (loading) {
    return <ScreenLoading />;
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
        Precios, datos y visibilidad del menú. Ocultar quita el producto sin borrar
        historial; eliminar solo si nunca tuvo pedidos. Categorías y días en
        Categorías.
      </Text>
      <FlatList
        data={productos}
        keyExtractor={(item) => String(item.id_producto)}
        contentContainerStyle={[styles.listPad, { paddingBottom: listBottomPad }]}
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
                  {item.es_plato_principal ? ' · plato principal' : ''}
                  {item.es_empacable ? ' · línea empaque' : ''}
                  {item.es_acompanamiento_mazorca ? ' · acomp. comensal' : ''}
                  {item.tipo_proteina !== 'ninguno'
                    ? ` · ${item.tipo_proteina}`
                    : ''}
                  {item.control_stock
                    ? ` · stock ${item.stock_disponible ?? 0}`
                    : ''}
                  {!productoVisible(item) ? ' · oculto' : ''}
                  {(item.total_usos_pedido ?? 0) > 0 ? ' · con historial' : ''}
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
                {puedeEliminarProducto(item) ? (
                  <IconTooltipButton
                    icon={AdminIcon.eliminar}
                    label="Eliminar definitivamente"
                    variant="danger"
                    fixedSize
                    onPress={() => void onEliminarPermanente(item)}
                  />
                ) : null}
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
        footer={
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
        }
      >
        <Text style={[formStyles.label, styles.modalLabel]}>Categoría</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.catScroll}
        >
          {categorias.map((c) => (
            <Pressable
              key={c.id_categoria}
              onPress={() => seleccionarCategoria(c.id_categoria)}
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
        <Text style={[formStyles.label, styles.modalLabel]}>Nombre</Text>
        <TextInput
          style={[formStyles.input, styles.modalInput]}
          value={nombre}
          onChangeText={setNombre}
          placeholder="Ej. Pechuga a la plancha"
        />
        <Text style={[formStyles.label, styles.modalLabel]}>Precio</Text>
        <MoneyTextInput
          style={[formStyles.input, formStyles.inputNarrow, styles.modalInput]}
          digits={precioStr}
          onChangeDigits={setPrecioStr}
          placeholderAmount={28000}
        />
        <Text style={[formStyles.label, styles.modalLabel]}>Descripción (opcional)</Text>
        <TextInput
          style={[formStyles.input, styles.modalInput, styles.modalInputMultiline]}
          value={desc}
          onChangeText={setDesc}
          multiline
        />
        <View style={styles.rowSwitch}>
          <View style={styles.switchTextCol}>
            <Text style={styles.switchLabel}>Plato principal</Text>
            <Text style={styles.switchHint}>
              Cocina, camionero y empaque para llevar.
            </Text>
          </View>
          <Switch
            value={platoPrincipal}
            onValueChange={onPlatoPrincipalChange}
            disabled={empacable}
          />
        </View>
        <View style={styles.rowSwitch}>
          <View style={styles.switchTextCol}>
            <Text style={styles.switchLabel}>Línea de empaque</Text>
            <Text style={styles.switchHint}>Empaque automático en para llevar.</Text>
          </View>
          <Switch value={empacable} onValueChange={onEmpacableChange} />
        </View>
        <View style={styles.rowSwitch}>
          <View style={styles.switchTextCol}>
            <Text style={styles.switchLabel}>Acompañamiento opcional por comensal</Text>
            <Text style={styles.switchHint}>
              Línea automática en mesas (opcional). Sin producto configurado no bloquea pedidos.
            </Text>
          </View>
          <Switch
            value={mazorcaAcompanamiento}
            onValueChange={onMazorcaChange}
          />
        </View>
        <Text style={[formStyles.label, styles.modalLabel]}>Tipo de proteína (cocina)</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.catScroll}
        >
          {TIPOS_PROTEINA.map((t) => (
            <Pressable
              key={t}
              onPress={() => setTipoProteina(t)}
              style={[styles.chip, tipoProteina === t && styles.chipOn]}
            >
              <Text
                style={[
                  styles.chipText,
                  tipoProteina === t && styles.chipTextOn,
                ]}
              >
                {t}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        {esCategoriaBebida ? (
          <>
            <View style={styles.rowSwitch}>
              <View style={styles.switchTextCol}>
                <Text style={styles.switchLabel}>Controlar stock</Text>
                <Text style={styles.switchHint}>Límite de unidades por día.</Text>
              </View>
              <Switch value={controlStock} onValueChange={setControlStock} />
            </View>
            {controlStock ? (
              <>
                <Text style={[formStyles.label, styles.modalLabel]}>Unidades disponibles</Text>
                <TextInput
                  style={formStyles.input}
                  keyboardType="number-pad"
                  value={stockDigits}
                  onChangeText={(t) =>
                    setStockDigits(sanitizeMontoDigitos(t).slice(0, 4))
                  }
                  placeholder="0"
                />
                <View style={styles.rowSwitch}>
                  <View style={styles.switchTextCol}>
                    <Text style={styles.switchLabel}>Ocultar al agotarse</Text>
                    <Text style={styles.switchHint}>Si está apagado, se ve como agotado.</Text>
                  </View>
                  <Switch
                    value={ocultarSinStock}
                    onValueChange={setOcultarSinStock}
                  />
                </View>
              </>
            ) : null}
          </>
        ) : null}
        <Text style={styles.flagsNote}>
          {editProduct
            ? 'Los cambios de flags se guardan al instante al editar, o con Guardar al crear.'
            : sugeridoCategoria
              ? 'Se sugiere según la categoría; ajusta antes de guardar.'
              : 'Elige categoría para ver sugerencias.'}
        </Text>
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
        {editProduct ? (
          <ProductoPersonalizacionesPanel idProducto={editProduct.id_producto} />
        ) : null}
      </FormModal>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hint: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    color: c.textMuted,
    fontSize: 13,
  },
  listPad: { padding: 16, paddingTop: 0 },
  card: {
    backgroundColor: c.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: c.border,
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
  cardTitle: { fontWeight: '800', fontSize: 16, color: c.text },
  cardMeta: { marginTop: 4, color: c.textMuted, fontSize: 13 },
  modalVisibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  modalVisibilityLabel: { fontWeight: '600', color: c.text, flex: 1 },
  modalVisibilityActions: { flexDirection: 'row', gap: 8 },
  modalLabel: { marginBottom: 2 },
  modalInput: { marginBottom: 6, paddingVertical: 8 },
  modalInputMultiline: { minHeight: 44, maxHeight: 72 },
  catScroll: { maxHeight: 72, marginBottom: 2 },
  chip: {
    marginRight: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    maxWidth: 220,
  },
  chipOn: { backgroundColor: c.successLight, borderColor: c.primary },
  chipText: { fontSize: 12, color: c.text },
  chipTextOn: { fontWeight: '800', color: c.mesaLibre },
  rowSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    gap: 10,
  },
  switchTextCol: { flex: 1, minWidth: 0 },
  switchLabel: { fontWeight: '600', color: c.text },
  switchHint: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 15,
    color: c.textMuted,
  },
  flagsNote: {
    marginTop: 4,
    marginBottom: 4,
    fontSize: 11,
    color: c.textMuted,
    fontStyle: 'italic',
  },
});
}
