import {
  esColorHexValido,
  type VisualColorKey,
} from '@la-reserva/shared-domain/nav-app-icon';
import { generarSugerenciasTemaDesdePrincipal } from './visual-palette';

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((n) =>
      Math.max(0, Math.min(255, Math.round(n)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`.toUpperCase();
}

function colorDistance(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
): number {
  return (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2;
}

/** Colores dominantes (web): ignora blancos, negros y grises muy neutros. */
export async function extraerColoresDominantesDeArchivo(
  file: File,
  maxColors = 4,
): Promise<string[]> {
  if (typeof document === 'undefined') return [];

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 72;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve([]);
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        const buckets = new Map<
          string,
          { count: number; r: number; g: number; b: number }
        >();

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]!;
          const g = data[i + 1]!;
          const b = data[i + 2]!;
          const a = data[i + 3]!;
          if (a < 140) continue;

          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const sat = max === 0 ? 0 : (max - min) / max;
          const light = max / 255;
          if (sat < 0.12 || light > 0.94 || light < 0.06) continue;

          const qr = Math.round(r / 24) * 24;
          const qg = Math.round(g / 24) * 24;
          const qb = Math.round(b / 24) * 24;
          const key = rgbToHex(qr, qg, qb);
          const prev = buckets.get(key);
          if (prev) {
            prev.count += 1;
            prev.r += r;
            prev.g += g;
            prev.b += b;
          } else {
            buckets.set(key, { count: 1, r, g, b });
          }
        }

        const ranked = [...buckets.values()]
          .map((b) => ({
            hex: rgbToHex(b.r / b.count, b.g / b.count, b.b / b.count),
            count: b.count,
          }))
          .filter((c) => esColorHexValido(c.hex))
          .sort((a, b) => b.count - a.count);

        const picked: string[] = [];
        for (const entry of ranked) {
          const rgb = {
            r: parseInt(entry.hex.slice(1, 3), 16),
            g: parseInt(entry.hex.slice(3, 5), 16),
            b: parseInt(entry.hex.slice(5, 7), 16),
          };
          const tooClose = picked.some((hex) => {
            const o = {
              r: parseInt(hex.slice(1, 3), 16),
              g: parseInt(hex.slice(3, 5), 16),
              b: parseInt(hex.slice(5, 7), 16),
            };
            return colorDistance(rgb, o) < 55 * 55;
          });
          if (tooClose) continue;
          picked.push(entry.hex);
          if (picked.length >= maxColors) break;
        }

        resolve(picked);
      } catch (e) {
        reject(e);
      } finally {
        URL.revokeObjectURL(url);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen'));
    };

    img.src = url;
  });
}

export type PaletaSugerida = {
  id: string;
  muestra: string;
  claro: Record<VisualColorKey, string>;
  oscuro: Record<VisualColorKey, string>;
};

export async function sugerirPaletasDesdeImagen(
  file: File,
): Promise<PaletaSugerida[]> {
  const dominantes = await extraerColoresDominantesDeArchivo(file, 4);
  return dominantes.map((hex, i) => {
    const temas = generarSugerenciasTemaDesdePrincipal(hex);
    return {
      id: `img-${i}-${hex}`,
      muestra: hex,
      claro: temas.claro,
      oscuro: temas.oscuro,
    };
  });
}
