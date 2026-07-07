import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ActionIconBar } from '../../src/components/ActionIconBar';
import { PromocionesAdminPanel } from '../../src/components/PromocionesAdminPanel';
import { ScreenLoading } from '../../src/components/ScreenLoading';
import { useAuth } from '../../src/context/AuthContext';
import { useThemedStyles } from '../../src/hooks/useThemedStyles';
import { useScreenScrollPadding } from '../../src/hooks/useScreenScrollPadding';
import { AdminIcon } from '../../src/lib/app-icons';
import { api } from '../../src/lib/api';
import { deleteOfflineCache } from '../../src/lib/offline-cache';
import { showNotice } from '../../src/lib/app-dialog';
import { manejarErrorAccion } from '../../src/lib/recurso-disponible';
import { useFormStyles } from '../../src/lib/form-layout';
import type { AppColors } from '../../src/lib/theme';
import type {
  EtiquetaPromocionPedido,
  ReglaPromocion,
} from '@la-reserva/shared-domain/promociones-pedido';

type ConfigPromociones = {
  reglas_promocion: ReglaPromocion[];
  etiquetas_pedido: EtiquetaPromocionPedido[];
};

type CategoriaPick = { id_categoria: number; nombre: string };
type ProductoPick = { id_producto: number; nombre: string; id_categoria?: number };

function createStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    pad: { padding: 16, gap: 12 },
    intro: { color: c.textMuted, fontSize: 13, lineHeight: 18 },
  });
}

export default function DescuentosPromocionesScreen() {
  const { token } = useAuth();
  const styles = useThemedStyles(createStyles);
  const formStyles = useFormStyles();
  const listBottomPad = useScreenScrollPadding();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reglas, setReglas] = useState<ReglaPromocion[]>([]);
  const [etiquetas, setEtiquetas] = useState<EtiquetaPromocionPedido[]>([]);
  const [categorias, setCategorias] = useState<CategoriaPick[]>([]);
  const [productos, setProductos] = useState<ProductoPick[]>([]);

  const load = useCallback(async () => {
    const [cfg, cats, prods] = await Promise.all([
      api<ConfigPromociones>('/pedidos/config-descuentos', {
        token,
        cacheKey: 'config_descuentos',
      }),
      api<CategoriaPick[]>('/categorias/admin', { token }),
      api<ProductoPick[]>('/productos?incluir_inactivos=false', { token }),
    ]);
    setReglas(cfg.reglas_promocion ?? []);
    setEtiquetas(cfg.etiquetas_pedido ?? []);
    setCategorias(
      cats.map((c) => ({ id_categoria: c.id_categoria, nombre: c.nombre })),
    );
    setProductos(
      prods.map((p) => ({
        id_producto: p.id_producto,
        nombre: p.nombre,
        id_categoria: p.id_categoria,
      })),
    );
  }, [token]);

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch (e) {
        await manejarErrorAccion(e, 'cargar promociones');
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  async function guardar() {
    setSaving(true);
    try {
      await api<ConfigPromociones>('/pedidos/config-descuentos', {
        method: 'PUT',
        token,
        body: JSON.stringify({
          reglas_promocion: reglas,
          etiquetas_pedido: etiquetas,
        }),
      });
      await deleteOfflineCache('config_descuentos');
      await load();
      await showNotice('Guardado', 'Promociones actualizadas.', 'success');
    } catch (e) {
      await manejarErrorAccion(e, 'guardar promociones');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <ScreenLoading />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.pad, { paddingBottom: listBottomPad }]}
    >
      <Text style={[styles.intro, formStyles.adminIntro]}>
        Crea descuentos y promociones para tu restaurante. Las etiquetas del pedido
        se activan al cobrar; las reglas definen cuándo y cuánto se descuenta.
      </Text>
      <ActionIconBar
        style={formStyles.screenActions}
        actions={[
          {
            key: 'guardar',
            icon: saving ? 'hourglass-outline' : AdminIcon.guardar,
            label: saving ? 'Guardando…' : 'Guardar cambios',
            variant: 'primary',
            disabled: saving,
            onPress: () => void guardar(),
          },
        ]}
      />
      <PromocionesAdminPanel
        reglas={reglas}
        etiquetas={etiquetas}
        categorias={categorias}
        productos={productos}
        onChangeReglas={setReglas}
        onChangeEtiquetas={setEtiquetas}
      />
    </ScrollView>
  );
}
