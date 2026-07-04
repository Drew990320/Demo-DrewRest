import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { IconTooltipButton } from './IconTooltipButton';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { manejarErrorAccion } from '../lib/recurso-disponible';
import { colors } from '../lib/theme';
import { formStyles } from '../lib/form-layout';

type Opcion = {
  id_opcion: number;
  tipo: 'omitir_ingrediente' | 'aderezo';
  descripcion: string;
};

const TIPOS: { id: Opcion['tipo']; label: string }[] = [
  { id: 'omitir_ingrediente', label: 'Omitir' },
  { id: 'aderezo', label: 'Aderezo' },
];

export function ProductoPersonalizacionesPanel({
  idProducto,
}: {
  idProducto: number;
}) {
  const { token } = useAuth();
  const [opciones, setOpciones] = useState<Opcion[]>([]);
  const [tipo, setTipo] = useState<Opcion['tipo']>('omitir_ingrediente');
  const [texto, setTexto] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const rows = await api<Opcion[]>(
      `/productos/${idProducto}/personalizaciones`,
      { token },
    );
    setOpciones(rows);
  }, [idProducto, token]);

  useEffect(() => {
    void load().catch(() => undefined);
  }, [load]);

  async function agregar() {
    const descripcion = texto.trim();
    if (!descripcion) return;
    setSaving(true);
    try {
      await api(`/productos/${idProducto}/personalizaciones`, {
        method: 'POST',
        token,
        body: JSON.stringify({ tipo, descripcion }),
      });
      setTexto('');
      await load();
    } catch (e) {
      await manejarErrorAccion(e, 'agregar la opción');
    } finally {
      setSaving(false);
    }
  }

  async function eliminar(idOpcion: number) {
    try {
      await api(`/personalizaciones/${idOpcion}`, {
        method: 'DELETE',
        token,
      });
      await load();
    } catch (e) {
      await manejarErrorAccion(e, 'eliminar la opción');
    }
  }

  const omitir = opciones.filter((o) => o.tipo === 'omitir_ingrediente');
  const aderezos = opciones.filter((o) => o.tipo === 'aderezo');

  return (
    <View style={styles.wrap}>
      <Text style={formStyles.label}>Personalizaciones del producto</Text>
      <Text style={styles.hint}>
        Opciones que el mesero puede elegir al pedir (omitir ingredientes o
        aderezos).
      </Text>
      <View style={styles.tipoRow}>
        {TIPOS.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => setTipo(t.id)}
            style={[styles.chip, tipo === t.id && styles.chipOn]}
          >
            <Text style={[styles.chipText, tipo === t.id && styles.chipTextOn]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.addRow}>
        <TextInput
          style={[formStyles.input, styles.inputFlex]}
          value={texto}
          onChangeText={setTexto}
          placeholder={
            tipo === 'omitir_ingrediente'
              ? 'Ej. Sin yuca'
              : 'Ej. Chimichurri'
          }
        />
        <IconTooltipButton
          icon="add"
          label="Agregar"
          variant="primary"
          fixedSize
          disabled={saving || !texto.trim()}
          onPress={() => void agregar()}
        />
      </View>
      {omitir.length > 0 ? (
        <OpcionList titulo="Omitir ingrediente" items={omitir} onDelete={eliminar} />
      ) : null}
      {aderezos.length > 0 ? (
        <OpcionList titulo="Aderezos" items={aderezos} onDelete={eliminar} />
      ) : null}
      {opciones.length === 0 ? (
        <Text style={styles.empty}>Sin opciones configuradas.</Text>
      ) : null}
    </View>
  );
}

function OpcionList({
  titulo,
  items,
  onDelete,
}: {
  titulo: string;
  items: Opcion[];
  onDelete: (id: number) => void;
}) {
  return (
    <View style={styles.listBlock}>
      <Text style={styles.listTitle}>{titulo}</Text>
      {items.map((o) => (
        <View key={o.id_opcion} style={styles.opcionRow}>
          <Text style={styles.opcionText}>{o.descripcion}</Text>
          <IconTooltipButton
            icon="trash-outline"
            label="Eliminar"
            variant="danger"
            fixedSize
            size={18}
            onPress={() => void onDelete(o.id_opcion)}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8 },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 8,
    lineHeight: 17,
  },
  tipoRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    justifyContent: 'center',
  },
  chip: {
    minWidth: 120,
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  chipText: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  chipTextOn: { color: colors.primary, fontWeight: '600' },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  inputFlex: { flex: 1, marginBottom: 0 },
  listBlock: { marginTop: 6 },
  listTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  opcionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    gap: 8,
  },
  opcionText: { flex: 1, fontSize: 14, color: colors.text },
  empty: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },
});
