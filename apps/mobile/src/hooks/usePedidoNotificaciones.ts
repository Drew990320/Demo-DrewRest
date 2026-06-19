import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { showBriefNotice } from '../lib/app-dialog';
import { tituloLugarMesa } from '../lib/mesa-label';
import {
  mensajeCocinaLlamaMesero,
  resumenLineasAgregadas,
  subscribeCocinaLlamaMesero,
  subscribeCompaneroAgregoItems,
  tituloCocinaLlamaMesero,
} from '../lib/pedido-sync';
import { puedeVerMisPedidos } from './usePuedeTomarPedidos';

/** Un solo listener de avisos de cocina / compañeros para toda la app (evita duplicados por pantalla). */
export function usePedidoNotificaciones() {
  const { user } = useAuth();

  useEffect(() => {
    if (!puedeVerMisPedidos(user?.rol) || user?.id == null) return;

    const idMesero = user.id;

    const unsubLlama = subscribeCocinaLlamaMesero((payload) => {
      if (payload.idMesero !== idMesero) return;
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
      if (payload.idMeseroDueno !== idMesero) return;
      void showBriefNotice(
        'Tu mesa fue actualizada',
        `${payload.meseroQuienAgregoNombre} agregó ${resumenLineasAgregadas(payload.lineas)} en ${tituloLugarMesa(payload.mesaNumero)} · pedido #${payload.pedidoId}`,
        'info',
      );
    });

    return () => {
      unsubLlama();
      unsubCompanero();
    };
  }, [user?.id, user?.rol]);
}
