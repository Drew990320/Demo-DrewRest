const EXT_TO_MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

const ALLOWED_MIMES = new Set(Object.values(EXT_TO_MIME));

export function esArchivoImagenLogo(file: File): boolean {
  const mime = file.type?.toLowerCase().split(';')[0]?.trim() ?? '';
  if (mime && ALLOWED_MIMES.has(mime)) return true;
  if (mime === 'image/x-icon' || mime === 'image/vnd.microsoft.icon') return true;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return ext in EXT_TO_MIME || ext === 'ico';
}

export function mimeLogoDesdeArchivo(file: File): string {
  const mime = file.type?.toLowerCase().split(';')[0]?.trim() ?? '';
  if (ALLOWED_MIMES.has(mime)) return mime;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return EXT_TO_MIME[ext] ?? '';
}
