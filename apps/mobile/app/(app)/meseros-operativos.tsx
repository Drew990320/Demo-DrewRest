import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'react-native-calendars';
import { ActionIconBar } from '../../src/components/ActionIconBar';
import { CtaButton } from '../../src/components/CtaButton';
import { MoneyTextInput } from '../../src/components/MoneyTextInput';
import { ScreenLoading } from '../../src/components/ScreenLoading';
import { ScreenScroll } from '../../src/components/ScreenScroll';
import { useAuth } from '../../src/context/AuthContext';
import {
  esRolAdministrativo,
  puedeCapacidadAdmin,
} from '../../src/lib/admin-capacidades';
import { useVisualTheme } from '../../src/context/VisualThemeContext';
import { useThemedStyles } from '../../src/hooks/useThemedStyles';
import type { AppColors } from '../../src/lib/theme';
import { AccionIcon, AdminIcon } from '../../src/lib/app-icons';
import { api } from '../../src/lib/api';
import { confirmAppDialog, showNotice } from '../../src/lib/app-dialog';
import { digitsFromMonto, parseCOPDigits } from '../../src/lib/cop-input';
import { fechaCalendarioBogota } from '../../src/lib/fecha-bogota';
import { formatCOP } from '../../src/lib/format';
import { useFormStyles } from '../../src/lib/form-layout';
import { avisarSiMontoCOPInvalido } from '../../src/lib/form-validation';
import { manejarErrorAccion, manejarErrorOperacion } from '../../src/lib/recurso-disponible';
import { useFormFieldStyle } from '../../src/hooks/useFormFieldStyle';

type MeseroFila = {
  id_usuario: number;
  nombre: string;
  apellido: string;
  soda_almuerzo: {
    id_registro: number;
    cantidad: number;
    desconto_stock: boolean;
    producto_nombre: string | null;
  } | null;
  pago_turno: {
    id_registro: number;
    monto: number;
    notas: string | null;
  } | null;
};

type ResumenMeseros = {
  fecha: string;
  delegacion_cierre_anulacion: {
    id_usuario: number;
    nombre: string;
    apellido: string;
    asignado_en: string;
  } | null;
  config: {
    beneficio_soda_almuerzo_activo: boolean;
    id_producto_soda_almuerzo: number | null;
    producto_soda_nombre: string | null;
    soda_almuerzo_descontar_stock: boolean;
    producto_control_stock: boolean;
    producto_stock_disponible: number | null;
  };
  meseros: MeseroFila[];
  totales: {
    sodas_aplicadas: number;
    pagos_registrados: number;
    monto_pagos_total: number;
  };
};

function nombreCompleto(m: MeseroFila): string {
  return [m.nombre, m.apellido].filter(Boolean).join(' ').trim() || 'Mesero';
}

function parseFechaInput(iso: string): Date {
  const [y, mo, d] = iso.split('-').map(Number);
  return new Date(y, (mo ?? 1) - 1, d ?? 1);
}

export default function MeserosOperativosScreen() {
  const { colors } = useVisualTheme();
  const styles = useThemedStyles(createStyles);
  const formStyles = useFormStyles();
  const { token, user } = useAuth();
  const moneyField = useFormFieldStyle('money');
  const [fecha, setFecha] = useState(() => fechaCalendarioBogota());
  const [data, setData] = useState<ResumenMeseros | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [pagoDigits, setPagoDigits] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);
  const [aplicandoSodas, setAplicandoSodas] = useState(false);

  const load = useCallback(async () => {
    const q = fecha ? `?fecha=${encodeURIComponent(fecha)}` : '';
    const res = await api<ResumenMeseros>(`/meseros-operativos/resumen${q}`, {
      token,
    });
    setData(res);
    const drafts: Record<number, string> = {};
    for (const m of res.meseros) {
      if (m.pago_turno) {
        drafts[m.id_usuario] = digitsFromMonto(m.pago_turno.monto);
      }
    }
    setPagoDigits(drafts);
    return res;
  }, [fecha, token]);

  useFocusEffect(
    useCallback(() => {
      if (
        !esRolAdministrativo(user?.rol) ||
        !puedeCapacidadAdmin(user, 'meseros_operativos')
      ) {
        setLoading(false);
        return;
      }
      let cancelled = false;
      (async () => {
        try {
          await load();
        } catch (e) {
          if (!cancelled) {
            await manejarErrorAccion(e, 'cargar el resumen de meseros');
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [load, user?.rol]),
  );

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } catch (e) {
      await manejarErrorAccion(e, 'actualizar el resumen');
    } finally {
      setRefreshing(false);
    }
  }

  async function aplicarSodaTodos() {
    if (!data?.config.beneficio_soda_almuerzo_activo) {
      await showNotice(
        'Beneficio inactivo',
        'Activa la soda almuerzo en Configuración.',
        'warning',
      );
      return;
    }
    const ok = await confirmAppDialog(
      'Aplicar soda a todos',
      `¿Registrar una soda de almuerzo para cada mesero activo el ${fecha}?`,
    );
    if (!ok) return;
    setAplicandoSodas(true);
    try {
      const r = await api<{ aplicados: number; omitidos: number }>(
        '/meseros-operativos/soda-almuerzo/aplicar',
        {
          method: 'POST',
          token,
          body: JSON.stringify({ fecha }),
        },
      );
      await load();
      await showNotice(
        'Sodas registradas',
        `Aplicadas: ${r.aplicados}. Ya tenían registro: ${r.omitidos}.`,
        'success',
      );
    } catch (e) {
      await manejarErrorAccion(e, 'registrar las sodas');
    } finally {
      setAplicandoSodas(false);
    }
  }

  async function aplicarSodaMesero(idUsuario: number) {
    setBusyId(idUsuario);
    try {
      await api('/meseros-operativos/soda-almuerzo/mesero', {
        method: 'POST',
        token,
        body: JSON.stringify({ fecha, id_usuario: idUsuario }),
      });
      await load();
    } catch (e) {
      await manejarErrorAccion(e, 'registrar la soda');
    } finally {
      setBusyId(null);
    }
  }

  async function guardarPago(idUsuario: number) {
    const digits = pagoDigits[idUsuario] ?? '';
    if (
      await avisarSiMontoCOPInvalido(
        'Pago por turno',
        digits,
        showNotice,
      )
    ) {
      return;
    }
    setBusyId(idUsuario);
    try {
      await api('/meseros-operativos/pago-turno', {
        method: 'POST',
        token,
        body: JSON.stringify({
          fecha,
          id_usuario: idUsuario,
          monto: parseCOPDigits(digits),
        }),
      });
      await load();
      await showNotice('Pago registrado', 'Monto guardado para este turno.', 'success');
    } catch (e) {
      await manejarErrorAccion(e, 'guardar el pago');
    } finally {
      setBusyId(null);
    }
  }


  async function quitarRegistro(idRegistro: number, etiqueta: string) {
    const ok = await confirmAppDialog(
      'Quitar registro',
      `¿Eliminar ${etiqueta}? Si descontó stock, se reintegrará.`,
    );
    if (!ok) return;
    setBusyId(idRegistro);
    try {
      await api(`/meseros-operativos/registros/${idRegistro}`, {
        method: 'DELETE',
        token,
      });
      await load();
    } catch (e) {
      await manejarErrorAccion(e, 'eliminar el registro');
    } finally {
      setBusyId(null);
    }
  }

  const configHint = useMemo(() => {
    if (!data) return '';
    const c = data.config;
    if (!c.beneficio_soda_almuerzo_activo) {
      return 'Activa el beneficio en Configuración.';
    }
    const parts = [c.producto_soda_nombre ?? 'Sin producto'];
    if (c.producto_control_stock && c.producto_stock_disponible != null) {
      parts.push(`Stock: ${c.producto_stock_disponible}`);
    }
    if (c.soda_almuerzo_descontar_stock) {
      parts.push('descuenta stock');
    }
    return parts.join(' · ');
  }, [data]);

  if (
    user &&
    (!esRolAdministrativo(user.rol) ||
      !puedeCapacidadAdmin(user, 'meseros_operativos'))
  ) {
    return (
      <View style={styles.deniedWrap}>
        <Text style={styles.denied}>
          Solo el administrador puede gestionar pagos y beneficios de meseros.
        </Text>
      </View>
    );
  }

  if (loading) {
    return <ScreenLoading />;
  }

  return (
    <ScreenScroll
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.intro}>
        Control de pago por turno y soda de almuerzo. Los meseros son los
        usuarios con rol «mesero»; aquí no se crean cuentas.
      </Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Fecha</Text>
        <Pressable
          onPress={() =>
            Platform.OS === 'web' ? setShowCalendar(true) : setShowPicker(true)
          }
          style={styles.dateBtn}
        >
          <Text style={styles.dateText}>{fecha}</Text>
          <Text style={styles.dateHint}>Toca para cambiar</Text>
        </Pressable>
        {showPicker && Platform.OS !== 'web' ? (
          <DateTimePicker
            value={parseFechaInput(fecha)}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, d) => {
              setShowPicker(Platform.OS === 'ios');
              if (d) setFecha(fechaCalendarioBogota(d));
            }}
          />
        ) : null}
      </View>

      {data ? (
        <>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Resumen del día</Text>
            <Text style={styles.statRow}>
              Sodas: {data.totales.sodas_aplicadas} / {data.meseros.length}
            </Text>
            <Text style={styles.statRow}>
              Pagos registrados: {data.totales.pagos_registrados}
            </Text>
            <Text style={styles.statRow}>
              Total pagos turno: {formatCOP(data.totales.monto_pagos_total)}
            </Text>
            <Text style={styles.hint}>{configHint}</Text>
          </View>

          {data.config.beneficio_soda_almuerzo_activo ? (
            <CtaButton
              icon="wine-outline"
              title="Aplicar soda a todos los meseros"
              subtitle="Una por mesero activo; omite quien ya la tenga"
              onPress={aplicarSodaTodos}
              busy={aplicandoSodas}
              variant="secondary"
              style={styles.cta}
            />
          ) : null}

          {data.meseros.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.hint}>
                No hay meseros activos. Créalos en Usuarios con rol mesero.
              </Text>
            </View>
          ) : (
            data.meseros.map((m) => {
              const busy = busyId === m.id_usuario;
              return (
                <View key={m.id_usuario} style={styles.card}>
                  <Text style={styles.meseroNombre}>{nombreCompleto(m)}</Text>

                  <View style={styles.rowBlock}>
                    <Text style={styles.rowLabel}>Soda almuerzo</Text>
                    {m.soda_almuerzo ? (
                      <View style={styles.rowActions}>
                        <Text style={styles.okBadge}>
                          ✓ {m.soda_almuerzo.producto_nombre ?? 'Registrada'}
                          {m.soda_almuerzo.desconto_stock ? ' · stock' : ''}
                        </Text>
                        <Pressable
                          disabled={busy}
                          onPress={() =>
                            quitarRegistro(
                              m.soda_almuerzo!.id_registro,
                              'la soda de almuerzo',
                            )
                          }
                          style={styles.linkBtn}
                        >
                          <Text style={styles.linkBtnText}>Quitar</Text>
                        </Pressable>
                      </View>
                    ) : data.config.beneficio_soda_almuerzo_activo ? (
                      <Pressable
                        disabled={busy}
                        onPress={() => aplicarSodaMesero(m.id_usuario)}
                        style={[styles.smallBtn, formStyles.centeredTextBtn]}
                      >
                        <Text style={styles.smallBtnText}>Registrar soda</Text>
                      </Pressable>
                    ) : (
                      <Text style={styles.hint}>Beneficio desactivado</Text>
                    )}
                  </View>

                  <View style={styles.rowBlock}>
                    <Text style={styles.rowLabel}>Pago por turno</Text>
                    <MoneyTextInput
                      style={[formStyles.input, moneyField, styles.pagoInput]}
                      digits={pagoDigits[m.id_usuario] ?? ''}
                      onChangeDigits={(t) =>
                        setPagoDigits((prev) => ({
                          ...prev,
                          [m.id_usuario]: t,
                        }))
                      }
                      placeholderAmount={0}
                    />
                    <ActionIconBar
                      style={styles.pagoBar}
                      actions={[
                        {
                          key: 'save',
                          icon: AccionIcon.guardar,
                          label: busy ? 'Guardando…' : 'Guardar pago',
                          variant: 'primary',
                          disabled: busy,
                          onPress: () => guardarPago(m.id_usuario),
                        },
                        ...(m.pago_turno
                          ? [
                              {
                                key: 'clear',
                                icon: AdminIcon.eliminar,
                                label: 'Quitar pago',
                                variant: 'secondary' as const,
                                disabled: busy,
                                onPress: () =>
                                  quitarRegistro(
                                    m.pago_turno!.id_registro,
                                    'el pago del turno',
                                  ),
                              },
                            ]
                          : []),
                      ]}
                    />
                    {m.pago_turno ? (
                      <Text style={styles.hintSmall}>
                        Guardado: {formatCOP(m.pago_turno.monto)}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </>
      ) : null}

      <Modal
        visible={showCalendar}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowCalendar(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Selecciona una fecha</Text>
            <Calendar
              onDayPress={(day) => {
                setFecha(day.dateString);
                setShowCalendar(false);
              }}
              markedDates={{
                [fecha]: {
                  selected: true,
                  selectedColor: colors.primary,
                },
              }}
              theme={{
                todayTextColor: colors.primary,
                arrowColor: colors.primary,
              }}
            />
            <ActionIconBar
              style={formStyles.modalActionBar}
              actions={[
                {
                  key: 'close',
                  icon: AdminIcon.cancelar,
                  label: 'Cerrar',
                  variant: 'primary',
                  onPress: () => setShowCalendar(false),
                },
                {
                  key: 'hoy',
                  icon: AdminIcon.verHoy,
                  label: 'Hoy',
                  variant: 'secondary',
                  onPress: () => {
                    setFecha(fechaCalendarioBogota());
                    setShowCalendar(false);
                  },
                },
              ]}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenScroll>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  content: {},
  intro: { marginBottom: 12, color: c.textMuted, lineHeight: 20 },
  deniedWrap: { flex: 1, padding: 24, justifyContent: 'center' },
  denied: { textAlign: 'center', color: c.textMuted },
  card: {
    backgroundColor: c.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: c.borderLight,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: c.text,
    marginBottom: 8,
  },
  dateBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: c.background,
    borderWidth: 1,
    borderColor: c.borderInput,
  },
  dateText: { fontSize: 18, fontWeight: '700', color: c.text },
  dateHint: { marginTop: 4, fontSize: 12, color: c.textMuted },
  statRow: { fontSize: 15, color: c.text, marginBottom: 4 },
  hint: { fontSize: 13, color: c.textMuted, marginTop: 6, lineHeight: 18 },
  hintSmall: { fontSize: 12, color: c.textMuted, marginTop: 4 },
  cta: { marginBottom: 12 },
  meseroNombre: {
    fontSize: 17,
    fontWeight: '700',
    color: c.text,
    marginBottom: 10,
  },
  rowBlock: { marginTop: 8, gap: 6 },
  rowLabel: { fontSize: 13, fontWeight: '600', color: c.textMuted },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  okBadge: { color: c.success, fontWeight: '600', flex: 1 },
  linkBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  linkBtnText: { color: c.danger, fontWeight: '600' },
  smallBtn: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: c.secondary,
  },
  smallBtnText: { color: c.onDark, fontWeight: '600' },
  pagoInput: { marginTop: 4, marginBottom: 4, alignSelf: 'stretch' },
  pagoBar: { marginTop: 8 },
  delegacionActiva: {
    marginTop: 10,
    gap: 6,
  },
  delegacionNombre: {
    fontWeight: '700',
    color: c.success,
    fontSize: 15,
  },
  delegacionLista: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  delegacionChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: c.borderInput,
    backgroundColor: c.background,
  },
  delegacionChipActivo: {
    borderColor: c.successBorder,
    backgroundColor: c.background,
  },
  delegacionChipText: {
    fontWeight: '600',
    color: c.text,
    fontSize: 13,
  },
  delegacionChipTextActivo: {
    color: c.success,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: c.surface,
    borderRadius: 14,
    padding: 16,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  modalTitle: { fontWeight: '900', color: c.text, marginBottom: 10 },
});
}
