import { useMemo } from 'react';
import {
  esMesaMostradorNumero,
  esMesaParaLlevarNumero,
  esMesaVirtualNumero,
  etiquetaMesaComanda,
  etiquetaMesaNumero,
  resolverMesasVirtuales,
  tituloLugarMesa,
  tituloMesaAdmin,
} from '@la-reserva/shared-domain/mesa-label';
import { useConfigOperativa, type ConfigOperativa } from './useConfigOperativa';

export function useMesasVirtuales() {
  const { config, loading, reload } = useConfigOperativa();
  return useMemo(() => {
    const mv = resolverMesasVirtuales(config as ConfigOperativa);
    return {
      config,
      loading,
      reload,
      resueltas: mv,
      mostradorActivo: config.mostrador_activo ?? true,
      paraLlevarActivo: config.para_llevar_activo ?? true,
      etiquetaMesa: (numero: number) => etiquetaMesaNumero(numero, config),
      tituloLugar: (numero: number) => tituloLugarMesa(numero, config),
      tituloAdmin: (numero: number) => tituloMesaAdmin(numero, config),
      etiquetaComanda: (numero: number) => etiquetaMesaComanda(numero, config),
      esMostrador: (numero: number) => esMesaMostradorNumero(numero, config),
      esParaLlevar: (numero: number) => esMesaParaLlevarNumero(numero, config),
      esVirtual: (numero: number) => esMesaVirtualNumero(numero, config),
    };
  }, [config, loading, reload]);
}
