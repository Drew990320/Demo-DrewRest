import { StyleSheet, Text, View } from 'react-native';
import { IconTooltipButton } from './IconTooltipButton';
import { AccionIcon } from '../lib/app-icons';
import type { PedidoCocinaView } from '../lib/cocina-pedido-view';
import type { LineaPedidoGrupo } from '../lib/pedido-detalle-group';
import {
  agruparDetallesMesero,
  cantidadSeleccionadaGrupoRecogida,
  etiquetaEstadoLineaGrupoMesero,
  grupoCocinaAviso,
  maxRecogibleGrupo,
} from '../lib/recogida-parcial';
import { detallePuedeRecogerMesero } from '../lib/cocina-pedido-view';

type Props = {
  idPedido: number;
  detalles: PedidoCocinaView['detalles'];
  cantidades: Record<number, number>;
  busyGrupoKey: string | null;
  onCambiarCantidad: (g: LineaPedidoGrupo, delta: number) => void;
  onConfirmar: (g: LineaPedidoGrupo) => void;
  onFalta: (g: LineaPedidoGrupo) => void;
  soloRecogibles?: boolean;
};

function grupoKey(idPedido: number, g: LineaPedidoGrupo): string {
  return `${idPedido}:${g.ids_detalle.join('-')}`;
}

export function PedidoRecogidaGrupos({
  idPedido,
  detalles,
  cantidades,
  busyGrupoKey,
  onCambiarCantidad,
  onConfirmar,
  onFalta,
  soloRecogibles = false,
}: Props) {
  const byId = new Map(detalles.map((d) => [d.id_detalle, d]));
  const grupos = agruparDetallesMesero(detalles).filter((g) => {
    if (!soloRecogibles) return true;
    return maxRecogibleGrupo(g, byId) > 0;
  });

  return (
    <>
      {grupos.map((g) => {
        const d = byId.get(g.id_detalle);
        if (!d) return null;
        const pendienteCocina = g.marcar_cocina && !(g.enviado_cocina ?? false);
        const maxRec = maxRecogibleGrupo(g, byId);
        const puedeRecoger = maxRec > 0;
        const cocinaAviso = grupoCocinaAviso(g, byId);
        const enMesa =
          g.listo_cocina && g.marcar_cocina && !puedeRecoger && !soloRecogibles;
        const gKey = grupoKey(idPedido, g);
        const busy = busyGrupoKey === gKey;
        const busyFalta = busyGrupoKey === `${gKey}:falta`;
        const sel = cantidadSeleccionadaGrupoRecogida(g, cantidades, byId);

        if (soloRecogibles && !puedeRecoger) return null;

        return (
          <View
            key={g.ids_detalle.join('-')}
            style={[
              styles.line,
              enMesa && styles.lineEnMesa,
              pendienteCocina && styles.lineSinCocina,
              puedeRecoger && cocinaAviso && styles.lineListoRecoger,
              puedeRecoger && !cocinaAviso && styles.lineRecogerOpcional,
            ]}
          >
            <Text style={styles.lineMain}>
              {g.cantidad}× {g.nombre_producto}
            </Text>
            <Text
              style={[
                styles.lineEstado,
                pendienteCocina && styles.lineEstadoSinCocina,
                puedeRecoger && cocinaAviso && styles.lineEstadoRecoger,
                puedeRecoger && !cocinaAviso && styles.lineEstadoRecogerOpcional,
                enMesa && styles.lineEstadoEnMesa,
              ]}
            >
              {soloRecogibles && !puedeRecoger
                ? 'Recogido · ya en la mesa'
                : etiquetaEstadoLineaGrupoMesero(g, byId)}
            </Text>
            {puedeRecoger ? (
              <View style={styles.lineActions}>
                {maxRec > 1 ? (
                  <View style={styles.qtyRow}>
                    <IconTooltipButton
                      icon="remove-circle-outline"
                      label="Menos unidades"
                      size={22}
                      fixedSize
                      disabled={busy || busyFalta || sel <= 0}
                      onPress={() => onCambiarCantidad(g, -1)}
                    />
                    <Text style={styles.qtyPickVal}>
                      {sel}/{maxRec}
                    </Text>
                    <IconTooltipButton
                      icon="add-circle-outline"
                      label="Más unidades"
                      size={22}
                      fixedSize
                      disabled={busy || busyFalta || sel >= maxRec}
                      onPress={() => onCambiarCantidad(g, 1)}
                    />
                  </View>
                ) : null}
                <View style={styles.iconRow}>
                  <IconTooltipButton
                    icon={busy ? 'hourglass-outline' : AccionIcon.confirmarEnMesa}
                    label={
                      busy ? 'Confirmando…' : `Confirmar en mesa (${sel})`
                    }
                    variant={cocinaAviso ? 'primary' : 'cocina'}
                    disabled={busy || busyFalta || sel <= 0}
                    fixedSize
                    size={22}
                    onPress={() => onConfirmar(g)}
                  />
                  <IconTooltipButton
                    icon={
                      busyFalta ? 'hourglass-outline' : AccionIcon.faltaEnCocina
                    }
                    label={
                      busyFalta
                        ? 'Enviando aviso…'
                        : `Falta en cocina (${sel})`
                    }
                    variant="danger"
                    disabled={busy || busyFalta || sel <= 0}
                    fixedSize
                    size={22}
                    onPress={() => onFalta(g)}
                  />
                </View>
              </View>
            ) : null}
            {g.nota_cocina ? (
              <Text style={styles.nota}>Nota: {g.nota_cocina}</Text>
            ) : null}
            {g.personalizaciones.length > 0 ? (
              <Text style={styles.pers}>
                {g.personalizaciones.map((x) => x.descripcion).join(' · ')}
              </Text>
            ) : null}
          </View>
        );
      })}
    </>
  );
}

export function filtrarDetallesSoloRecogibles(
  detalles: PedidoCocinaView['detalles'],
): PedidoCocinaView['detalles'] {
  return detalles.filter(detallePuedeRecogerMesero);
}

const styles = StyleSheet.create({
  line: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ece9df',
    paddingTop: 10,
    marginTop: 8,
  },
  lineEnMesa: {
    backgroundColor: '#eef7f2',
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderTopWidth: 0,
  },
  lineSinCocina: {
    backgroundColor: '#fff8e6',
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderTopWidth: 0,
  },
  lineListoRecoger: {
    backgroundColor: '#e8f5ef',
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderTopWidth: 0,
  },
  lineRecogerOpcional: {
    backgroundColor: '#fbf6ea',
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderTopWidth: 0,
  },
  lineMain: { fontSize: 15, fontWeight: '700', color: '#262622' },
  lineEstado: { marginTop: 4, fontSize: 12, fontWeight: '700', color: '#5c7a6d' },
  lineEstadoSinCocina: { color: '#9a5a00' },
  lineEstadoRecoger: { color: '#1e6b45' },
  lineEstadoRecogerOpcional: { color: '#8a6a1a' },
  lineEstadoEnMesa: { color: '#2f5e4f', fontWeight: '800' },
  lineActions: { marginTop: 8, gap: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyPickVal: {
    minWidth: 44,
    textAlign: 'center',
    fontWeight: '800',
    color: '#262622',
    fontSize: 14,
  },
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  nota: { color: '#a26a2f', marginTop: 4 },
  pers: { color: '#4a4a45', marginTop: 4, fontSize: 13 },
});
