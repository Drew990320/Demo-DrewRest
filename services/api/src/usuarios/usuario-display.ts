export function nombreUsuarioPublico(
  nombre: string,
  apellido: string,
  rol: string,
): { nombre: string; apellido: string } {
  if (rol === 'admin') {
    return { nombre: 'Administrador', apellido: '' };
  }
  return { nombre, apellido };
}
