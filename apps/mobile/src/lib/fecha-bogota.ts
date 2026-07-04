const ZONA_BOGOTA = 'America/Bogota';

/** Fecha calendario YYYY-MM-DD en zona Bogotá (misma lógica que la API). */
export function fechaCalendarioBogota(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_BOGOTA }).format(date);
}

/** Hora HH:mm en zona Bogotá a partir de un ISO UTC. */
export function horaBogota(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: ZONA_BOGOTA,
    });
  } catch {
    return '';
  }
}
