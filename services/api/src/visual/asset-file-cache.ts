import * as fs from 'fs';
import * as path from 'path';

type CacheEntry = { mtimeMs: number; data: Buffer };

const cache = new Map<string, CacheEntry>();

export function readAssetFileCached(filePath: string): Buffer {
  const abs = path.resolve(filePath);
  const stat = fs.statSync(abs);
  const hit = cache.get(abs);
  if (hit && hit.mtimeMs === stat.mtimeMs) {
    return hit.data;
  }
  const data = fs.readFileSync(abs);
  cache.set(abs, { mtimeMs: stat.mtimeMs, data });
  return data;
}

export function assetEtagFromPath(filePath: string): string {
  const stat = fs.statSync(path.resolve(filePath));
  return `"${stat.mtimeMs}"`;
}

export function invalidateAssetFileCache(filePath?: string): void {
  if (!filePath) {
    cache.clear();
    return;
  }
  cache.delete(path.resolve(filePath));
}
