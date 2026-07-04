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
import { ActionIconBar } from '../../src/components/ActionIconBar';
import { MoneyTextInput } from '../../src/components/MoneyTextInput';
import { ScreenLoading } from '../../src/components/ScreenLoading';
import { ScreenScroll } from '../../src/components/ScreenScroll';
import { useAuth } from '../../src/context/AuthContext';
import { AccionIcon } from '../../src/lib/app-icons';
import { api } from '../../src/lib/api';
import { deleteOfflineCache } from '../../src/lib/offline-cache';
import { digitsFromMonto, parseCOPDigits } from '../../src/lib/cop-input';
import { formatCOP } from '../../src/lib/format';
import { formStyles } from '../../src/lib/form-layout';
import {
  avisarSiMontoCOPInvalido,
} from '../../src/lib/form-validation';
import { showNotice } from '../../src/lib/app-dialog';
import { manejarErrorAccion, manejarErrorOperacion } from '../../src/lib/recurso-disponible';
import { colors } from '../../src/lib/theme';
import { useFormFieldStyle } from '../../src/hooks/useFormFieldStyle';
import { invalidateConfigOperativaMemCache } from '../../src/hooks/useConfigOperativa';
import {
  MULEROS_MIN_PLATOS_PRINCIPALES_DEFAULT,
  SOPAS_MIN_UNIDADES_DEFAULT,
  UMBRAL_SUBTOTAL_OTROS_COP,
} from '../../src/lib/descuentos-pedido';
import { ReglasPromocionPanel } from '../../src/components/ReglasPromocionPanel';
import { QtyStepper } from '../../src/components/QtyStepper';
import {
  parseReglasPromocion,
  type ReglaPromocionPorCategoria,
} from '../../src/lib/promociones-pedido';

type ConfigDescuentos = {
  sopas_activo: boolean;
  sopas_monto_por_unidad: number;
  sopas_min_unidades: number;
  muleros_activo: boolean;
  muleros_monto_por_plato_principal: number;
  muleros_min_platos_principales: number;
  umbral_subtotal_otros: number;
  reglas_promocion?: ReglaPromocionPorCategoria[];
};

type CategoriaPick = { id_categoria: number; nombre: string };

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

type ProductoPick = {
  id_producto: number;
  nombre: string;
  es_acompanamiento_mazorca: boolean;
  es_bebida?: boolean;
};

export default function ConfiguracionScreen() {
  const { token, user } = useAuth();
  const moneyField = useFormFieldStyle('money');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [descSopaOn, setDescSopaOn] = useState(false);
  const [descMulerosOn, setDescMulerosOn] = useState(false);
  const [descSopaDigits, setDescSopaDigits] = useState('');
  const [descMulerosDigits, setDescMulerosDigits] = useState('');
  const [umbralDigits, setUmbralDigits] = useState('');
  const [sopasMinUnidades, setSopasMinUnidades] = useState(
    SOPAS_MIN_UNIDADES_DEFAULT,
  );
  const [mulerosMinPlatos, setMulerosMinPlatos] = useState(
    MULEROS_MIN_PLATOS_PRINCIPALES_DEFAULT,
  );

  const [precioEmpaqueDigits, setPrecioEmpaqueDigits] = useState('');
  const [mazorcaActiva, setMazorcaActiva] = useState(true);
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
  const [reglasPromocion, setReglasPromocion] = useState<
    ReglaPromocionPorCategoria[]
  >([]);
  const [categorias, setCategorias] = useState<CategoriaPick[]>([]);

  const load = useCallback(async () => {
    const [desc, op, prods, cats] = await Promise.all([
      api<ConfigDescuentos>('/pedidos/config-descuentos', {
        token,
        cacheKey: 'config_descuentos',
      }),
      api<ConfigOperativa>('/pedidos/config-operativa', {
        token,
        cacheKey: 'config_operativa',
      }),
      api<ProductoPick[]>('/productos?incluir_inactivos=true', { token }),
      api<CategoriaPick[]>('/categorias/admin', { token }),
    ]);
    setDescSopaOn(desc.sopas_activo);
    setDescMulerosOn(desc.muleros_activo);
    setDescSopaDigits(digitsFromMonto(desc.sopas_monto_por_unidad));
    setDescMulerosDigits(
      digitsFromMonto(desc.muleros_monto_por_plato_principal),
    );
    setUmbralDigits(
      digitsFromMonto(
        desc.umbral_subtotal_otros ?? UMBRAL_SUBTOTAL_OTROS_COP,
      ),
    );
    setSopasMinUnidades(
      desc.sopas_min_unidades ?? SOPAS_MIN_UNIDADES_DEFAULT,
    );
    setMulerosMinPlatos(
      desc.muleros_min_platos_principales ??
        MULEROS_MIN_PLATOS_PRINCIPALES_DEFAULT,
    );
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
    setReglasPromocion(parseReglasPromocion(desc.reglas_promocion ?? []));
    setCategorias(cats);
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
          const [desc, op, prods, cats] = await Promise.all([
            api<ConfigDescuentos>('/pedidos/config-descuentos', {
              token,
              cacheKey: 'config_descuentos',
            }),
            api<ConfigOperativa>('/pedidos/config-operativa', {
              token,
              cacheKey: 'config_operativa',
            }),
            api<ProductoPick[]>('/productos?incluir_inactivos=true', { token }),
            api<CategoriaPick[]>('/categorias/admin', { token }),
          ]);
          if (!active) return;
          setDescSopaOn(desc.sopas_activo);
          setDescMulerosOn(desc.muleros_activo);
          setDescSopaDigits(digitsFromMonto(desc.sopas_monto_por_unidad));
          setDescMulerosDigits(
            digitsFromMonto(desc.muleros_monto_por_plato_principal),
          );
          setUmbralDigits(
            digitsFromMonto(
              desc.umbral_subtotal_otros ?? UMBRAL_SUBTOTAL_OTROS_COP,
            ),
          );
          setSopasMinUnidades(
            desc.sopas_min_unidades ?? SOPAS_MIN_UNIDADES_DEFAULT,
          );
          setMulerosMinPlatos(
            desc.muleros_min_platos_principales ??
              MULEROS_MIN_PLATOS_PRINCIPALES_DEFAULT,
          );
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
          setReglasPromocion(parseReglasPromocion(desc.reglas_promocion ?? []));
          setCategorias(cats);
          setProductos(prods);
          setDirty(false);
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
      descSopaOn &&
      (await avisarSiMontoCOPInvalido(
        'Monto descuento por sopa',
        descSopaDigits,
        showNotice,
      ))
    ) {
      return;
    }
    if (
      descMulerosOn &&
      (await avisarSiMontoCOPInvalido(
        'Monto descuento camionero',
        descMulerosDigits,
        showNotice,
      ))
    ) {
      return;
    }
    if (
      await avisarSiMontoCOPInvalido(
        'Umbral subtotal otros ítems',
        umbralDigits,
        showNotice,
      )
    ) {
      return;
    }
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

    setSaving(true);
    try {
      await Promise.all([
        api<ConfigDescuentos>('/pedidos/config-descuentos', {
          method: 'PUT',
          token,
          body: JSON.stringify({
            sopas_activo: descSopaOn,
            sopas_monto_por_unidad: parseCOPDigits(descSopaDigits),
            sopas_min_unidades: sopasMinUnidades,
            muleros_activo: descMulerosOn,
            muleros_monto_por_plato_principal: parseCOPDigits(descMulerosDigits),
            muleros_min_platos_principales: mulerosMinPlatos,
            umbral_subtotal_otros: parseCOPDigits(umbralDigits),
            reglas_promocion: reglasPromocion,
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
      await deleteOfflineCache('config_descuentos');
      await deleteOfflineCache('config_operativa');
      invalidateConfigOperativaMemCache();
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
        Reglas globales del restaurante: descuentos, empaque y línea de mazorca
        en mesas.
      </Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Descuentos — Sopas</Text>
        <Text style={styles.hint}>
          Se aplica si hay al menos la cantidad mínima de sopas y el subtotal de
          otros ítems supera el umbral configurado.
        </Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Descuento sopas activo</Text>
          <Switch
            value={descSopaOn}
            onValueChange={(v) => {
              setDescSopaOn(v);
              marcarDirty();
            }}
            trackColor={{ false: colors.borderInput, true: colors.successBorder }}
            thumbColor={descSopaOn ? colors.primary : colors.borderLight}
          />
        </View>
        {descSopaOn ? (
          <>
            <Text style={styles.fieldLabel}>Monto por unidad de sopa</Text>
            <MoneyTextInput
              style={[styles.input, moneyField]}
              placeholderAmount={2000}
              digits={descSopaDigits}
              onChangeDigits={(t) => {
                setDescSopaDigits(t);
                marcarDirty();
              }}
            />
          </>
        ) : null}
        <Text style={[styles.fieldLabel, styles.fieldGap]}>
          Mínimo de unidades de sopa
        </Text>
        <QtyStepper
          value={sopasMinUnidades}
          min={1}
          max={99}
          onChange={(n) => {
            setSopasMinUnidades(n);
            marcarDirty();
          }}
        />
        <Text style={styles.hintSmall}>
          Hoy: se requieren al menos {sopasMinUnidades} unidad
          {sopasMinUnidades === 1 ? '' : 'es'} de sopa para activar el descuento.
        </Text>
        <Text style={[styles.fieldLabel, styles.fieldGap]}>
          Umbral subtotal otros ítems
        </Text>
        <MoneyTextInput
          style={[styles.input, moneyField]}
          placeholderAmount={UMBRAL_SUBTOTAL_OTROS_COP}
          digits={umbralDigits}
          onChangeDigits={(t) => {
            setUmbralDigits(t);
            marcarDirty();
          }}
        />
        <Text style={styles.hintSmall}>
          Hoy: otros ítems deben sumar más de{' '}
          {formatCOP(parseCOPDigits(umbralDigits) || UMBRAL_SUBTOTAL_OTROS_COP)}{' '}
          para activar el descuento de sopas.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Descuentos — Clientes camioneros</Text>
        <Text style={styles.hint}>
          Al cobrar, el mesero marca el pedido como camionero; se rebaja el monto
          por cada plato principal si se alcanza la cantidad mínima.
        </Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Descuento camioneros activo</Text>
          <Switch
            value={descMulerosOn}
            onValueChange={(v) => {
              setDescMulerosOn(v);
              marcarDirty();
            }}
            trackColor={{ false: colors.borderInput, true: colors.successBorder }}
            thumbColor={descMulerosOn ? colors.primary : colors.borderLight}
          />
        </View>
        {descMulerosOn ? (
          <>
            <Text style={styles.fieldLabel}>Monto por plato principal</Text>
            <MoneyTextInput
              style={[styles.input, moneyField]}
              placeholderAmount={10000}
              digits={descMulerosDigits}
              onChangeDigits={(t) => {
                setDescMulerosDigits(t);
                marcarDirty();
              }}
            />
          </>
        ) : null}
        <Text style={[styles.fieldLabel, styles.fieldGap]}>
          Mínimo de platos principales
        </Text>
        <QtyStepper
          value={mulerosMinPlatos}
          min={1}
          max={99}
          onChange={(n) => {
            setMulerosMinPlatos(n);
            marcarDirty();
          }}
        />
        <Text style={styles.hintSmall}>
          Hoy: se requieren al menos {mulerosMinPlatos} plato
          {mulerosMinPlatos === 1 ? '' : 's'} principal
          {mulerosMinPlatos === 1 ? '' : 'es'} para activar el descuento.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Promociones por categoría</Text>
        <ReglasPromocionPanel
          reglas={reglasPromocion}
          categorias={categorias}
          onChange={(r) => {
            setReglasPromocion(r);
            marcarDirty();
          }}
        />
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
        <Text style={styles.sectionTitle}>Cocina — Mazorca</Text>
        <Text style={styles.hint}>
          En mesas normales, el sistema crea una línea de acompañamiento por
          comensal. Puedes desactivarla o elegir el producto en Menú (admin).
        </Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Línea de mazorca activa</Text>
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
          Marca un producto como «acompañamiento mazorca» en Editar menú, o
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {},
  intro: { marginBottom: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontWeight: '800',
    fontSize: 16,
    color: colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  hint: { color: colors.textMuted, fontSize: 13, marginBottom: 10, textAlign: 'center' },
  hintSmall: {
    color: colors.textMuted,
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
  switchLabel: { flex: 1, fontWeight: '600', color: colors.text },
  fieldLabel: {
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
    marginTop: 4,
    textAlign: 'center',
  },
  fieldGap: { marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: colors.borderInput,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surface,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    maxWidth: 160,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: '600', fontSize: 13 },
  chipTextOn: { color: colors.onPrimary },
  saveBar: { marginTop: 4 },
  deniedWrap: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  denied: { textAlign: 'center', color: colors.textMuted, fontWeight: '600' },
});
