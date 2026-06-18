export function nombreUsuarioDisplay(u: {
  nombre: string;
  apellido: string;
  rol?: string;
}): string {
  if (u.rol === 'admin') return 'Administrador';
  return `${u.nombre} ${u.apellido}`.trim() || u.nombre;
}
