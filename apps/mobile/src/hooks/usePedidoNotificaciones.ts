import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { showBriefNotice } from '../lib/app-dialog';
import { tituloLugarMesa } from '../lib/mesa-label';
import {
  mensajeCocinaLlamaMesero,
  subscribeCocinaLlamaMesero,
  subscribeCompaneroAgregoItems,
  tituloCocinaLlamaMesero,
} from '../lib/pedido-sync';
import {
  mensajeCompaneroModificoPedido,
  tituloCompaneroModificoPedido,
} from '@la-reserva/shared-domain/companero-pedido';
import { puedeVerMisPedidos } from './usePuedeTomarPedidos';

/** Un solo listener de avisos de cocina / compañeros para toda la app (evita duplicados por pantalla). */
export function usePedidoNotificaciones() {
  const { user } = useAuth();

  useEffect(() => {
    if (!puedeVerMisPedidos(user?.rol) || user?.id == null) return;

    const idMesero = Number(user.id);

    const unsubLlama = subscribeCocinaLlamaMesero((payload) => {
      if (Number(payload.idMesero) !== idMesero) return;
      void showBriefNotice(
        tituloCocinaLlamaMesero(
          payload.platosListos,
          payload.entradasListos ??
            (payload.tipo_listo === 'entrada' ? payload.platosListos : 0),
        ),
        mensajeCocinaLlamaMesero(payload),
        'info',
      );
    });

    const unsubCompanero = subscribeCompaneroAgregoItems((payload) => {
      if (Number(payload.idMeseroDueno) !== idMesero) return;
      const accion = payload.accion ?? 'agregado';
      void showBriefNotice(
        tituloCompaneroModificoPedido(accion),
        mensajeCompaneroModificoPedido(
          accion,
          payload.meseroQuienAgregoNombre,
          payload.lineas,
          tituloLugarMesa(payload.mesaNumero),
          payload.pedidoId,
        ),
        accion === 'quitado' ? 'warning' : 'info',
      );
    });

    return () => {
      unsubLlama();
      unsubCompanero();
    };
  }, [user?.id, user?.rol]);
}
