import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ActionIconBar } from '../../src/components/ActionIconBar';
import { MoneyTextInput } from '../../src/components/MoneyTextInput';
import { ScreenLoading } from '../../src/components/ScreenLoading';
import { ScreenScroll } from '../../src/components/ScreenScroll';
import { useAuth } from '../../src/context/AuthContext';
import { useVisualTheme } from '../../src/context/VisualThemeContext';
import { useThemedStyles } from '../../src/hooks/useThemedStyles';
import type { AppColors } from '../../src/lib/theme';
import { AccionIcon } from '../../src/lib/app-icons';
import { api } from '../../src/lib/api';
import { deleteOfflineCache } from '../../src/lib/offline-cache';
import { digitsFromMonto, parseCOPDigits } from '../../src/lib/cop-input';
import { formatCOP } from '../../src/lib/format';
import { useFormStyles, textInputPlaceholderColor } from '../../src/lib/form-layout';
import {
  avisarSiMontoCOPInvalido,
} from '../../src/lib/form-validation';
import { showNotice } from '../../src/lib/app-dialog';
import { manejarErrorAccion, manejarErrorOperacion } from '../../src/lib/recurso-disponible';
import { useFormFieldStyle } from '../../src/hooks/useFormFieldStyle';
import { invalidateConfigOperativaMemCache } from '../../src/hooks/useConfigOperativa';
import { invalidarCacheModulosRestaurante } from '../../src/hooks/useModulosRestaurante';

type ConfigOperativa = {
  precio_empaque_para_llevar: number;
  mazorca_activa: boolean;
  id_producto_mazorca: number | null;
  producto_mazorca_nombre: string | null;
  numero_mesa_para_llevar: number;
  numero_mesa_mostrador: number;
  etiqueta_para_llevar: string;
  etiqueta_mostrador: string;
  mostrador_activo: boolean;
  para_llevar_activo: boolean;
  beneficio_soda_almuerzo_activo: boolean;
  id_producto_soda_almuerzo: number | null;
  producto_soda_nombre: string | null;
  soda_almuerzo_descontar_stock: boolean;
};

type ConfigRestaurante = {
  nombre_comercial: string;
  telefono: string | null;
  direccion: string | null;
  dominio_email_interno: string;
  logo_archivo: string | null;
  tiene_logo: boolean;
  texto_gracias_ticket: string;
  texto_propina_ticket: string;
  texto_aviso_no_dian: string;
  texto_pie_correo: string | null;
  prefijo_asunto_correo: string | null;
  mostrar_credito_drewtech: boolean;
  modulo_inventario_activo: boolean;
  modulo_meseros_operativos_activo: boolean;
  modulo_envio_correo_activo: boolean;
  modulo_resumen_diario_activo: boolean;
};

type ProductoPick = {
  id_producto: number;
  nombre: string;
  es_acompanamiento_mazorca: boolean;
  es_bebida?: boolean;
};

export default function ConfiguracionScreen() {
  const { colors } = useVisualTheme();
  const inputPlaceholder = textInputPlaceholderColor(colors);
  const styles = useThemedStyles(createStyles);
  const formStyles = useFormStyles();
  const { token, user } = useAuth();
  const router = useRouter();
  const moneyField = useFormFieldStyle('money');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [precioEmpaqueDigits, setPrecioEmpaqueDigits] = useState('');
  const [mazorcaActiva, setMazorcaActiva] = useState(false);
  const [idProductoMazorca, setIdProductoMazorca] = useState<number | null>(
    null,
  );
  const [productos, setProductos] = useState<ProductoPick[]>([]);

  const [numeroParaLlevar, setNumeroParaLlevar] = useState('98');
  const [numeroMostrador, setNumeroMostrador] = useState('99');
  const [etiquetaParaLlevar, setEtiquetaParaLlevar] = useState('');
  const [etiquetaMostrador, setEtiquetaMostrador] = useState('');
  const [mostradorActivo, setMostradorActivo] = useState(true);
  const [paraLlevarActivo, setParaLlevarActivo] = useState(true);
  const [sodaAlmuerzoActiva, setSodaAlmuerzoActiva] = useState(false);
  const [idProductoSoda, setIdProductoSoda] = useState<number | null>(null);
  const [sodaDescontarStock, setSodaDescontarStock] = useState(true);

  const [nombreComercial, setNombreComercial] = useState('Restaurante');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [dominioEmail, setDominioEmail] = useState('restaurant.local');
  const [textoGracias, setTextoGracias] = useState('Gracias por su visita');
  const [textoPropina, setTextoPropina] = useState('*** PROPINA VOLUNTARIA ***');
  const [textoAvisoDian, setTextoAvisoDian] = useState(
    'No constituye factura electrónica DIAN',
  );
  const [textoPieCorreo, setTextoPieCorreo] = useState('');
  const [prefijoAsuntoCorreo, setPrefijoAsuntoCorreo] = useState('');
  const [mostrarCreditoDrewTech, setMostrarCreditoDrewTech] = useState(true);
  const [moduloInventario, setModuloInventario] = useState(false);
  const [moduloMeserosOp, setModuloMeserosOp] = useState(true);
  const [moduloEnvioCorreo, setModuloEnvioCorreo] = useState(false);
  const [moduloResumenDiario, setModuloResumenDiario] = useState(true);

  function aplicarRestaurante(r: ConfigRestaurante) {
    setNombreComercial(r.nombre_comercial);
    setTelefono(r.telefono ?? '');
    setDireccion(r.direccion ?? '');
    setDominioEmail(r.dominio_email_interno);
    setTextoGracias(r.texto_gracias_ticket);
    setTextoPropina(r.texto_propina_ticket);
    setTextoAvisoDian(r.texto_aviso_no_dian);
    setTextoPieCorreo(r.texto_pie_correo ?? '');
    setPrefijoAsuntoCorreo(r.prefijo_asunto_correo ?? '');
    setMostrarCreditoDrewTech(r.mostrar_credito_drewtech);
    setModuloInventario(r.modulo_inventario_activo);
    setModuloMeserosOp(r.modulo_meseros_operativos_activo);
    setModuloEnvioCorreo(r.modulo_envio_correo_activo);
    setModuloResumenDiario(r.modulo_resumen_diario_activo);
  }

  const load = useCallback(async () => {
    const [rest, op, prods] = await Promise.all([
      api<ConfigRestaurante>('/restaurante/config', { token }),
      api<ConfigOperativa>('/pedidos/config-operativa', {
        token,
        cacheKey: 'config_operativa',
      }),
      api<ProductoPick[]>('/productos?incluir_inactivos=true', { token }),
    ]);
    aplicarRestaurante(rest);
    setPrecioEmpaqueDigits(digitsFromMonto(op.precio_empaque_para_llevar));
    setMazorcaActiva(op.mazorca_activa);
    setIdProductoMazorca(op.id_producto_mazorca);
    setNumeroParaLlevar(String(op.numero_mesa_para_llevar ?? 98));
    setNumeroMostrador(String(op.numero_mesa_mostrador ?? 99));
    setEtiquetaParaLlevar(op.etiqueta_para_llevar ?? 'Pedidos para llevar');
    setEtiquetaMostrador(op.etiqueta_mostrador ?? 'Mostrador');
    setMostradorActivo(op.mostrador_activo !== false);
    setParaLlevarActivo(op.para_llevar_activo !== false);
    setSodaAlmuerzoActiva(Boolean(op.beneficio_soda_almuerzo_activo));
    setIdProductoSoda(op.id_producto_soda_almuerzo);
    setSodaDescontarStock(op.soda_almuerzo_descontar_stock !== false);
    setProductos(prods);
    setDirty(false);
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      if (user?.rol !== 'admin') {
        setLoading(false);
        return;
      }
      let active = true;
      setLoading(true);
      (async () => {
        try {
          await load();
        } catch (e) {
          if (!active) return;
          await manejarErrorAccion(e, 'cargar la configuración');
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [load, user?.rol]),
  );

  async function guardar() {
    if (
      await avisarSiMontoCOPInvalido(
        'Precio empaque para llevar',
        precioEmpaqueDigits,
        showNotice,
      )
    ) {
      return;
    }

    const nParaLlevar = Number(numeroParaLlevar);
    const nMostrador = Number(numeroMostrador);
    if (
      !Number.isFinite(nParaLlevar) ||
      nParaLlevar < 1 ||
      nParaLlevar > 999 ||
      !Number.isFinite(nMostrador) ||
      nMostrador < 1 ||
      nMostrador > 999
    ) {
      await showNotice(
        'Números inválidos',
        'Los números de mesa virtual deben estar entre 1 y 999.',
        'warning',
      );
      return;
    }
    if (nParaLlevar === nMostrador) {
      await showNotice(
        'Números duplicados',
        'Para llevar y mostrador deben usar números distintos.',
        'warning',
      );
      return;
    }
    if (!etiquetaParaLlevar.trim() || !etiquetaMostrador.trim()) {
      await showNotice(
        'Etiquetas requeridas',
        'Indica un nombre visible para cada canal virtual.',
        'warning',
      );
      return;
    }

    if (!nombreComercial.trim()) {
      await showNotice(
        'Nombre requerido',
        'Indica el nombre comercial del restaurante.',
        'warning',
      );
      return;
    }

    setSaving(true);
    try {
      await Promise.all([
        api<ConfigRestaurante>('/restaurante/config', {
          method: 'PUT',
          token,
          body: JSON.stringify({
            nombre_comercial: nombreComercial.trim(),
            telefono: telefono.trim() || null,
            direccion: direccion.trim() || null,
            dominio_email_interno: dominioEmail.trim(),
            texto_gracias_ticket: textoGracias.trim(),
            texto_propina_ticket: textoPropina.trim(),
            texto_aviso_no_dian: textoAvisoDian.trim(),
            texto_pie_correo: textoPieCorreo.trim() || null,
            prefijo_asunto_correo: prefijoAsuntoCorreo.trim() || null,
            mostrar_credito_drewtech: mostrarCreditoDrewTech,
            modulo_inventario_activo: moduloInventario,
            modulo_meseros_operativos_activo: moduloMeserosOp,
            modulo_envio_correo_activo: moduloEnvioCorreo,
            modulo_resumen_diario_activo: moduloResumenDiario,
          }),
        }),
        api<ConfigOperativa>('/pedidos/config-operativa', {
          method: 'PUT',
          token,
          body: JSON.stringify({
            precio_empaque_para_llevar: parseCOPDigits(precioEmpaqueDigits),
            mazorca_activa: mazorcaActiva,
            id_producto_mazorca: idProductoMazorca,
            numero_mesa_para_llevar: nParaLlevar,
            numero_mesa_mostrador: nMostrador,
            etiqueta_para_llevar: etiquetaParaLlevar.trim(),
            etiqueta_mostrador: etiquetaMostrador.trim(),
            mostrador_activo: mostradorActivo,
            para_llevar_activo: paraLlevarActivo,
            beneficio_soda_almuerzo_activo: sodaAlmuerzoActiva,
            id_producto_soda_almuerzo: idProductoSoda,
            soda_almuerzo_descontar_stock: sodaDescontarStock,
          }),
        }),
      ]);
      await deleteOfflineCache('config_operativa');
      invalidateConfigOperativaMemCache();
      invalidarCacheModulosRestaurante();
      await load();
      setDirty(false);
      await showNotice(
        'Configuración guardada',
        'Las reglas aplican a pedidos nuevos y al cobrar.',
        'success',
      );
    } catch (e) {
      await manejarErrorAccion(e, 'guardar la configuración');
    } finally {
      setSaving(false);
    }
  }

  function marcarDirty() {
    setDirty(true);
  }

  if (user && user.rol !== 'admin') {
    return (
      <View style={styles.deniedWrap}>
        <Text style={styles.denied}>
          Solo el administrador puede cambiar la configuración del restaurante.
        </Text>
      </View>
    );
  }

  if (loading) {
    return <ScreenLoading />;
  }

  const productosMazorca = productos.filter(
    (p) => p.es_acompanamiento_mazorca || p.id_producto === idProductoMazorca,
  );
  const listaMazorca =
    productosMazorca.length > 0 ? productosMazorca : productos.slice(0, 12);

  const productosBebida = productos.filter((p) => p.es_bebida);
  const listaSoda =
    productosBebida.length > 0
      ? productosBebida
      : productos.filter(
          (p) =>
            p.id_producto === idProductoSoda ||
            /gaseosa|soda|bebida/i.test(p.nombre),
        );

  return (
    <ScreenScroll contentContainerStyle={styles.content}>
      <Text style={[styles.intro, formStyles.adminIntro]}>
        Identidad del restaurante, reglas de negocio y módulos activos. El
        catálogo, mesas y permisos se gestionan en sus pantallas dedicadas.
      </Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Accesos rápidos</Text>
        <View style={styles.linkRow}>
          <Pressable style={styles.linkChip} onPress={() => router.push('/(app)/mesas-admin')}>
            <Text style={styles.linkChipText}>Mesas</Text>
          </Pressable>
          <Pressable style={styles.linkChip} onPress={() => router.push('/(app)/menu-admin')}>
            <Text style={styles.linkChipText}>Menú / catálogo</Text>
          </Pressable>
          <Pressable style={styles.linkChip} onPress={() => router.push('/(app)/categorias-admin')}>
            <Text style={styles.linkChipText}>Categorías</Text>
          </Pressable>
          <Pressable style={styles.linkChip} onPress={() => router.push('/(app)/permisos')}>
            <Text style={styles.linkChipText}>Permisos</Text>
          </Pressable>
          <Pressable
            style={styles.linkChip}
            onPress={() => router.push('/(app)/personalizacion-visual')}
          >
            <Text style={styles.linkChipText}>Personalización visual</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Restaurante</Text>
        <Text style={styles.fieldLabel}>Nombre comercial</Text>
        <TextInput
          placeholderTextColor={inputPlaceholder}
          style={styles.input}
          value={nombreComercial}
          onChangeText={(t) => {
            setNombreComercial(t);
            marcarDirty();
          }}
        />
        <Text style={styles.fieldLabel}>Teléfono (tickets)</Text>
        <TextInput
          placeholderTextColor={inputPlaceholder}
          style={styles.input}
          value={telefono}
          onChangeText={(t) => {
            setTelefono(t);
            marcarDirty();
          }}
        />
        <Text style={styles.fieldLabel}>Dirección</Text>
        <TextInput
          placeholderTextColor={inputPlaceholder}
          style={styles.input}
          value={direccion}
          onChangeText={(t) => {
            setDireccion(t);
            marcarDirty();
          }}
        />
        <Text style={styles.fieldLabel}>Dominio correos internos</Text>
        <TextInput
          placeholderTextColor={inputPlaceholder}
          style={styles.input}
          autoCapitalize="none"
          value={dominioEmail}
          onChangeText={(t) => {
            setDominioEmail(t);
            marcarDirty();
          }}
          placeholder="restaurant.local"
        />
        <Text style={styles.hintSmall}>
          Los meseros nuevos reciben correo como nombre@{dominioEmail || 'restaurant.local'}
        </Text>
        <Text style={styles.hintSmall}>
          Logos, colores e iconos del menú se configuran en Personalización visual.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Textos de ticket y correo</Text>
        <Text style={styles.fieldLabel}>Mensaje de agradecimiento</Text>
        <TextInput
          placeholderTextColor={inputPlaceholder}
          style={styles.input}
          value={textoGracias}
          onChangeText={(t) => {
            setTextoGracias(t);
            marcarDirty();
          }}
        />
        <Text style={styles.fieldLabel}>Línea de propina</Text>
        <TextInput
          placeholderTextColor={inputPlaceholder}
          style={styles.input}
          value={textoPropina}
          onChangeText={(t) => {
            setTextoPropina(t);
            marcarDirty();
          }}
        />
        <Text style={styles.fieldLabel}>Aviso legal (no DIAN)</Text>
        <TextInput
          placeholderTextColor={inputPlaceholder}
          style={styles.input}
          value={textoAvisoDian}
          onChangeText={(t) => {
            setTextoAvisoDian(t);
            marcarDirty();
          }}
        />
        <Text style={styles.fieldLabel}>Pie adicional del correo</Text>
        <TextInput
          placeholderTextColor={inputPlaceholder}
          style={[styles.input, styles.inputMultiline]}
          multiline
          value={textoPieCorreo}
          onChangeText={(t) => {
            setTextoPieCorreo(t);
            marcarDirty();
          }}
        />
        <Text style={styles.fieldLabel}>Prefijo asunto correo (opcional)</Text>
        <TextInput
          placeholderTextColor={inputPlaceholder}
          style={styles.input}
          value={prefijoAsuntoCorreo}
          onChangeText={(t) => {
            setPrefijoAsuntoCorreo(t);
            marcarDirty();
          }}
          placeholder="Vacío = nombre del restaurante"
        />
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>
            Mostrar crédito DrewTech POS en tickets
          </Text>
          <Switch
            value={mostrarCreditoDrewTech}
            onValueChange={(v) => {
              setMostrarCreditoDrewTech(v);
              marcarDirty();
            }}
            trackColor={{ false: colors.borderInput, true: colors.successBorder }}
            thumbColor={mostrarCreditoDrewTech ? colors.primary : colors.borderLight}
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Módulos del sistema</Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Resumen diario</Text>
          <Switch
            value={moduloResumenDiario}
            onValueChange={(v) => {
              setModuloResumenDiario(v);
              marcarDirty();
            }}
            trackColor={{ false: colors.borderInput, true: colors.successBorder }}
            thumbColor={moduloResumenDiario ? colors.primary : colors.borderLight}
          />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Meseros operativos / beneficios</Text>
          <Switch
            value={moduloMeserosOp}
            onValueChange={(v) => {
              setModuloMeserosOp(v);
              marcarDirty();
            }}
            trackColor={{ false: colors.borderInput, true: colors.successBorder }}
            thumbColor={moduloMeserosOp ? colors.primary : colors.borderLight}
          />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Envío de factura por correo</Text>
          <Switch
            value={moduloEnvioCorreo}
            onValueChange={(v) => {
              setModuloEnvioCorreo(v);
              marcarDirty();
            }}
            trackColor={{ false: colors.borderInput, true: colors.successBorder }}
            thumbColor={moduloEnvioCorreo ? colors.primary : colors.borderLight}
          />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Inventario</Text>
          <Switch
            value={moduloInventario}
            onValueChange={(v) => {
              setModuloInventario(v);
              marcarDirty();
            }}
            trackColor={{ false: colors.borderInput, true: colors.successBorder }}
            thumbColor={moduloInventario ? colors.primary : colors.borderLight}
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Para llevar</Text>
        <Text style={styles.hint}>
          Precio del empaque automático que se agrega por unidad de plato
          principal en pedidos para llevar.
        </Text>
        <Text style={styles.fieldLabel}>Precio empaque (COP)</Text>
        <MoneyTextInput
          style={[styles.input, moneyField]}
          placeholderAmount={1000}
          digits={precioEmpaqueDigits}
          onChangeDigits={(t) => {
            setPrecioEmpaqueDigits(t);
            marcarDirty();
          }}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Mesas virtuales</Text>
        <Text style={styles.hint}>
          Canales sin mesa física en el salón. Los meseros los ven como accesos
          rápidos; el número se usa en comandas y reportes.
        </Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Mostrador activo</Text>
          <Switch
            value={mostradorActivo}
            onValueChange={(v) => {
              setMostradorActivo(v);
              marcarDirty();
            }}
            trackColor={{ false: colors.borderInput, true: colors.successBorder }}
            thumbColor={mostradorActivo ? colors.primary : colors.borderLight}
          />
        </View>
        {mostradorActivo ? (
          <>
            <Text style={[styles.fieldLabel, styles.fieldGap]}>Número mesa mostrador</Text>
            <TextInput
              placeholderTextColor={inputPlaceholder}
              style={styles.input}
              value={numeroMostrador}
              onChangeText={(t) => {
                setNumeroMostrador(t.replace(/\D/g, '').slice(0, 3));
                marcarDirty();
              }}
              keyboardType="number-pad"
              placeholder="99"
            />
            <Text style={styles.fieldLabel}>Etiqueta en la app</Text>
            <TextInput
              placeholderTextColor={inputPlaceholder}
              style={styles.input}
              value={etiquetaMostrador}
              onChangeText={(t) => {
                setEtiquetaMostrador(t);
                marcarDirty();
              }}
              placeholder="Mostrador"
            />
          </>
        ) : null}
        <View style={[styles.switchRow, styles.fieldGap]}>
          <Text style={styles.switchLabel}>Para llevar activo</Text>
          <Switch
            value={paraLlevarActivo}
            onValueChange={(v) => {
              setParaLlevarActivo(v);
              marcarDirty();
            }}
            trackColor={{ false: colors.borderInput, true: colors.successBorder }}
            thumbColor={paraLlevarActivo ? colors.primary : colors.borderLight}
          />
        </View>
        {paraLlevarActivo ? (
          <>
            <Text style={[styles.fieldLabel, styles.fieldGap]}>
              Número mesa para llevar
            </Text>
            <TextInput
              placeholderTextColor={inputPlaceholder}
              style={styles.input}
              value={numeroParaLlevar}
              onChangeText={(t) => {
                setNumeroParaLlevar(t.replace(/\D/g, '').slice(0, 3));
                marcarDirty();
              }}
              keyboardType="number-pad"
              placeholder="98"
            />
            <Text style={styles.fieldLabel}>Etiqueta en la app</Text>
            <TextInput
              placeholderTextColor={inputPlaceholder}
              style={styles.input}
              value={etiquetaParaLlevar}
              onChangeText={(t) => {
                setEtiquetaParaLlevar(t);
                marcarDirty();
              }}
              placeholder="Pedidos para llevar"
            />
          </>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Acompañamiento opcional por comensal</Text>
        <Text style={styles.hint}>
          Opcional: en mesas normales puedes agregar una línea automática por
          comensal. Si no eliges producto, el pedido se abre igual; activa esto
          solo cuando quieras usar la función.
        </Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Acompañamiento automático activo</Text>
          <Switch
            value={mazorcaActiva}
            onValueChange={(v) => {
              setMazorcaActiva(v);
              marcarDirty();
            }}
            trackColor={{ false: colors.borderInput, true: colors.successBorder }}
            thumbColor={mazorcaActiva ? colors.primary : colors.borderLight}
          />
        </View>
        <Text style={[styles.fieldLabel, styles.fieldGap]}>
          Producto de acompañamiento
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {listaMazorca.map((p) => (
            <Pressable
              key={p.id_producto}
              onPress={() => {
                setIdProductoMazorca(p.id_producto);
                marcarDirty();
              }}
              style={[
                styles.chip,
                idProductoMazorca === p.id_producto && styles.chipOn,
              ]}
            >
              <Text
                numberOfLines={2}
                style={[
                  styles.chipText,
                  idProductoMazorca === p.id_producto && styles.chipTextOn,
                ]}
              >
                {p.nombre}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <Text style={styles.hintSmall}>
          Marca un producto como «acompañamiento por comensal» en Editar menú, o
          elígelo aquí.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Meseros — Soda almuerzo</Text>
        <Text style={styles.hint}>
          Una gaseosa por mesero al día (turno almuerzo). Regístrala en
          «Meseros (turno)» y, si el producto tiene control de stock, se
          descuenta del inventario.
        </Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Beneficio activo</Text>
          <Switch
            value={sodaAlmuerzoActiva}
            onValueChange={(v) => {
              setSodaAlmuerzoActiva(v);
              marcarDirty();
            }}
            trackColor={{ false: colors.borderInput, true: colors.successBorder }}
            thumbColor={sodaAlmuerzoActiva ? colors.primary : colors.borderLight}
          />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Descontar del stock de bebidas</Text>
          <Switch
            value={sodaDescontarStock}
            onValueChange={(v) => {
              setSodaDescontarStock(v);
              marcarDirty();
            }}
            trackColor={{ false: colors.borderInput, true: colors.successBorder }}
            thumbColor={sodaDescontarStock ? colors.primary : colors.borderLight}
          />
        </View>
        <Text style={[styles.fieldLabel, styles.fieldGap]}>
          Producto (ej. Gaseosa 250 ml)
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {listaSoda.map((p) => (
            <Pressable
              key={p.id_producto}
              onPress={() => {
                setIdProductoSoda(p.id_producto);
                marcarDirty();
              }}
              style={[
                styles.chip,
                idProductoSoda === p.id_producto && styles.chipOn,
              ]}
            >
              <Text
                numberOfLines={2}
                style={[
                  styles.chipText,
                  idProductoSoda === p.id_producto && styles.chipTextOn,
                ]}
              >
                {p.nombre}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ActionIconBar
        style={styles.saveBar}
        actions={[
          {
            key: 'save',
            icon: saving ? 'hourglass-outline' : AccionIcon.guardar,
            label: saving ? 'Guardando…' : 'Guardar configuración',
            variant: 'primary',
            disabled: !dirty || saving,
            onPress: guardar,
          },
        ]}
      />
    </ScreenScroll>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  content: {},
  intro: { marginBottom: 12 },
  card: {
    backgroundColor: c.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: c.border,
  },
  sectionTitle: {
    fontWeight: '800',
    fontSize: 16,
    color: c.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  hint: { color: c.textMuted, fontSize: 13, marginBottom: 10, textAlign: 'center' },
  hintSmall: {
    color: c.textMuted,
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  switchLabel: { flex: 1, fontWeight: '600', color: c.text },
  fieldLabel: {
    fontWeight: '600',
    color: c.text,
    marginBottom: 6,
    marginTop: 4,
    textAlign: 'center',
  },
  fieldGap: { marginTop: 12 },
    input: {
      borderWidth: 1,
      borderColor: c.borderInput,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: c.surface,
      color: c.text,
    },
  inputMultiline: { minHeight: 72, textAlignVertical: 'top' },
  linkRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  linkChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: c.primary,
    backgroundColor: c.primarySoft,
  },
  linkChipText: { color: c.primary, fontWeight: '700', fontSize: 13 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: c.border,
    marginRight: 8,
    maxWidth: 160,
  },
  chipOn: { backgroundColor: c.primary, borderColor: c.primary },
  chipText: { color: c.text, fontWeight: '600', fontSize: 13 },
  chipTextOn: { color: c.onPrimary },
  saveBar: { marginTop: 4 },
  deniedWrap: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: c.background,
  },
  denied: { textAlign: 'center', color: c.textMuted, fontWeight: '600' },
});
}
