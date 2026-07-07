export function nombreUsuarioPublico(
  nombre: string,
  apellido: string,
  rol: string,
): { nombre: string; apellido: string } {
  if (rol === 'superadmin') {
    return { nombre: 'Superadmin', apellido: 'DrewTech' };
  }
  if (rol === 'admin') {
    return { nombre: 'Administrador', apellido: '' };
  }
  return { nombre, apellido };
}

export function nombreUsuarioDisplay(u: {
  nombre: string;
  apellido: string;
  rol?: string;
}): string {
  if (u.rol === 'superadmin') return 'Superadmin DrewTech';
  if (u.rol === 'admin') return 'Administrador';
  return `${u.nombre} ${u.apellido}`.trim() || u.nombre;
}
