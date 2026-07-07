import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { puertoDesdeUrlWeb, resolveUrlWebCelular } from '../lib/config';
import { showNotice } from '../lib/app-dialog';
import { manejarErrorOperacion } from '../lib/recurso-disponible';
import { colors } from '../lib/theme';

type ConexionCelulares = {
  ip: string | null;
  adaptador: string | null;
  tipo_red: string | null;
  puerto_web: number;
  puerto_web_por_defecto?: number;
  url_web_celular: string | null;
  url_web_local: string;
  health_celular: string | null;
  aviso: string;
};

type Props = {
  /** Si true, empieza expandido (solo acordeón). */
  defaultOpen?: boolean;
  /** `page` = pantalla dedicada sin acordeón. */
  variant?: 'accordion' | 'page';
};

async function copiarTexto(text: string): Promise<boolean> {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  return false;
}

export function ConexionCelularesCard({
  defaultOpen = false,
  variant = 'accordion',
}: Props) {
  const { token, user } = useAuth();
  const isPage = variant === 'page';
  const [open, setOpen] = useState(isPage || defaultOpen);
  const [data, setData] = useState<ConexionCelulares | null>(null);
  const [loading, setLoading] = useState(false);

  const cargar = useCallback(async () => {
    if (!token || user?.rol !== 'admin') return;
    setLoading(true);
    try {
      const res = await api<ConexionCelulares>('/sistema/conexion-celulares', { token });
      setData(res);
    } catch (e) {
      await manejarErrorOperacion(e, {
        title: 'Conexion celulares',
        message: 'No se pudo obtener la IP del servidor.',
      });
    } finally {
      setLoading(false);
    }
  }, [token, user?.rol]);

  useEffect(() => {
    if ((open || isPage) && !data && !loading) {
      void cargar();
    }
  }, [open, isPage, data, loading, cargar]);

  if (user?.rol !== 'admin') return null;

  const urlCelular = resolveUrlWebCelular(data);
  const puertoQr = puertoDesdeUrlWeb(urlCelular);
  const puertoServidor = data?.puerto_web ?? null;
  const usaPuertoDistinto =
    puertoQr != null && puertoServidor != null && puertoQr !== puertoServidor;

  async function onCopiarUrl() {
    if (!urlCelular) return;
    const ok = await copiarTexto(urlCelular);
    await showNotice(
      ok ? 'Copiado' : 'URL para el celular',
      ok
        ? 'Pega la direccion en el navegador del celular (misma red Wi-Fi).'
        : urlCelular,
      ok ? 'success' : 'info',
    );
  }

  return (
    <View style={[styles.card, isPage && styles.cardPage]}>
      {!isPage ? (
        <Pressable style={styles.head} onPress={() => setOpen((v) => !v)}>
          <View style={styles.headLeft}>
            <Ionicons
              name={open ? 'chevron-down' : 'chevron-forward'}
              size={18}
              color={colors.primary}
            />
            <View style={styles.headText}>
              <Text style={styles.title}>Celulares en la red</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {data?.ip
                  ? `IP ${data.ip} · puerto ${puertoQr ?? data.puerto_web}`
                  : 'Toca para ver QR y URL del celular'}
              </Text>
            </View>
          </View>
          <Ionicons name="phone-portrait-outline" size={22} color={colors.primary} />
        </Pressable>
      ) : (
        <View style={styles.pageHead}>
          <Ionicons name="phone-portrait-outline" size={28} color={colors.primary} />
          <View style={styles.headText}>
            <Text style={styles.title}>Conexión móvil</Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              {data?.ip
                ? `IP ${data.ip} · puerto ${puertoQr ?? data.puerto_web}`
                : 'Obteniendo la URL para celulares…'}
            </Text>
          </View>
        </View>
      )}
      {(open || isPage) && (
        <View style={[styles.body, isPage && styles.bodyPage]}>
          {loading ? (
            <ActivityIndicator style={{ marginVertical: 8 }} />
          ) : !urlCelular ? (
            <Text style={styles.muted}>
              No se detecto Wi-Fi ni Ethernet con IP valida en este PC. Conecta el
              servidor a la red del restaurante y pulsa Actualizar.
            </Text>
          ) : (
            <>
              {data != null ? (
                <>
                  {usaPuertoDistinto ? (
                    <View style={styles.portNotice}>
                      <Text style={styles.portNoticeText}>
                        La app está corriendo en el puerto {puertoQr} (Expo / navegador
                        actual). El servidor empaquetado usa el puerto {puertoServidor}.
                      </Text>
                    </View>
                  ) : null}
                  {data.puerto_web_por_defecto != null &&
                  data.puerto_web !== data.puerto_web_por_defecto &&
                  !usaPuertoDistinto ? (
                    <View style={styles.portNotice}>
                      <Text style={styles.portNoticeText}>
                        El puerto {data.puerto_web_por_defecto} estaba ocupado. La web del
                        restaurante usa el puerto {data.puerto_web}.
                      </Text>
                    </View>
                  ) : null}
                  <View style={styles.qrSection}>
                    <Text style={styles.label}>Escanea con el celular</Text>
                    <Text style={styles.qrHint}>
                      Misma red Wi‑Fi · abre la app en el navegador del teléfono
                    </Text>
                    <View style={styles.qrBox}>
                      <QRCode
                        value={urlCelular}
                        size={isPage ? 220 : 200}
                        color="#1a1a1a"
                        backgroundColor="#ffffff"
                      />
                    </View>
                  </View>
                  <Text style={[styles.label, styles.labelSpaced]}>
                    O abre / copia esta dirección:
                  </Text>
                  <Pressable style={styles.urlBox} onPress={() => void onCopiarUrl()}>
                    <Text style={styles.url} selectable>
                      {urlCelular}
                    </Text>
                    <Text style={styles.tapCopy}>Toca para copiar</Text>
                  </Pressable>
                  {data.adaptador ? (
                    <Text style={styles.meta}>
                      Red: {data.tipo_red === 'wifi' ? 'Wi-Fi' : data.tipo_red === 'ethernet' ? 'Ethernet' : 'LAN'} (
                      {data.adaptador})
                    </Text>
                  ) : null}
                  <Text style={styles.meta}>En este PC: {data.url_web_local}</Text>
                  {data.health_celular ? (
                    <Text style={styles.meta}>Probar API: {data.health_celular}</Text>
                  ) : null}
                  <Text style={styles.aviso}>{data.aviso}</Text>
                </>
              ) : null}
              <Pressable style={styles.refreshBtn} onPress={() => void cargar()} hitSlop={8}>
                <Text style={styles.refreshText}>Actualizar</Text>
              </Pressable>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardPage: { marginBottom: 0 },
  pageHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: colors.backgroundAlt,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.backgroundAlt,
    gap: 8,
  },
  headLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  headText: { flex: 1 },
  title: { fontWeight: '800', color: colors.text, fontSize: 15 },
  subtitle: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  body: { padding: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderLight },
  bodyPage: { padding: 14 },
  qrSection: { alignItems: 'center', marginBottom: 14 },
  qrHint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  qrBox: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { fontWeight: '700', color: colors.text, marginBottom: 6 },
  labelSpaced: { marginTop: 4 },
  portNotice: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  portNoticeText: {
    color: colors.text,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  urlBox: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    padding: 10,
    backgroundColor: colors.surfaceMuted,
    marginBottom: 8,
  },
  url: { fontWeight: '800', color: colors.primary, fontSize: 15 },
  tapCopy: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  meta: { color: colors.textMuted, fontSize: 12, marginBottom: 4 },
  aviso: { color: colors.textMuted, fontSize: 12, marginTop: 6, lineHeight: 17 },
  muted: { color: colors.textMuted, fontSize: 13 },
  refreshBtn: { alignSelf: 'center', marginTop: 10, paddingVertical: 6 },
  refreshText: { color: colors.primary, fontWeight: '800', fontSize: 13 },
});
