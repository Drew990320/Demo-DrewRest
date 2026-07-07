import type { VisualPublica } from './visual-theme';

let etag: string | null = null;
let snapshot: VisualPublica | null = null;

export function getVisualPublicaEtag(): string | null {
  return etag;
}

export function getVisualPublicaSnapshot(): VisualPublica | null {
  return snapshot;
}

export function setVisualPublicaSnapshot(
  data: VisualPublica,
  nextEtag: string | null,
): void {
  snapshot = data;
  if (nextEtag) etag = nextEtag;
}

export function clearVisualPublicaSnapshot(): void {
  etag = null;
  snapshot = null;
}
