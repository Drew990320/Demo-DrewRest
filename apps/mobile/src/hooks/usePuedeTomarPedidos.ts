import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

import { esRolAdministrativo } from '../lib/admin-capacidades';

export function puedeTomarPedidos(rol: string | undefined): boolean {
  return esRolAdministrativo(rol) || rol === 'mesero';
}

/** Cocina / producción: chef y admin. */
export function puedeVerCocina(rol: string | undefined): boolean {
  return esRolAdministrativo(rol) || rol === 'chef';
}

/** Seguimiento de pedidos propios: mesero y admin. */
export function puedeVerMisPedidos(rol: string | undefined): boolean {
  return esRolAdministrativo(rol) || rol === 'mesero';
}

export function useRequiereTomarPedidos() {
  const { user } = useAuth();
  const router = useRouter();
  const ok = puedeTomarPedidos(user?.rol);

  useEffect(() => {
    if (user && !ok) {
      router.replace('/(app)/cocina');
    }
  }, [user, ok, router]);

  return { user, ok, loading: !user };
}
