/**
 * Reemplaza hex hardcodeados por tokens de theme.ts en la app móvil.
 * Uso: node scripts/apply-theme-colors.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const THEME = path.join(ROOT, 'src/lib/theme.ts');

const HEX_MAP = {
  '#FAF6F0': 'colors.background',
  '#faf6f0': 'colors.background',
  '#F3EDE4': 'colors.backgroundAlt',
  '#FFFFFF': 'colors.surface',
  '#ffffff': 'colors.surface',
  '#fff': 'colors.surface',
  '#F8F3EB': 'colors.surfaceMuted',
  '#C47A72': 'colors.primary',
  '#A86158': 'colors.primaryDark',
  '#F5E8E6': 'colors.primaryLight',
  '#E8CCC8': 'colors.primaryMuted',
  '#D4A574': 'colors.secondary',
  '#FBF0E3': 'colors.secondaryLight',
  '#C9925A': 'colors.cocina',
  '#3D3630': 'colors.text',
  '#3d3d3a': 'colors.text',
  '#4a4a45': 'colors.textMuted',
  '#7A7268': 'colors.textMuted',
  '#A39A8F': 'colors.textHint',
  '#8a8880': 'colors.textHint',
  '#b8b5ac': 'colors.textHint',
  '#E8DFD4': 'colors.border',
  '#F0E9DF': 'colors.borderLight',
  '#DDD4C8': 'colors.borderInput',
  '#3D9B62': 'colors.success',
  '#2E7D4A': 'colors.successText',
  '#E2F5E8': 'colors.successLight',
  '#5CB87A': 'colors.successBorder',
  '#D4922A': 'colors.warning',
  '#9A6418': 'colors.warningText',
  '#7A5C38': 'colors.warningText',
  '#FFF3DC': 'colors.warningLight',
  '#E5A82E': 'colors.warningBorder',
  '#D64545': 'colors.danger',
  '#B83232': 'colors.dangerText',
  '#8B4A44': 'colors.dangerText',
  '#FDE8E8': 'colors.dangerLight',
  '#E86060': 'colors.dangerBorder',
  '#C45C5C': 'colors.danger',
  '#5A8FB0': 'colors.info',
  '#8A9BB0': 'colors.info',
  '#4A5A6E': 'colors.infoText',
  '#EEF2F7': 'colors.infoLight',
  '#E8F1F8': 'colors.infoLight',
  '#6B9B62': 'colors.mesaLibre',
  '#8B7368': 'colors.offline',
  '#f0d78c': 'colors.warningBorder',
  '#f7f6f2': 'colors.surfaceMuted',
  '#3d3d38': 'colors.text',
  '#c5d9ce': 'colors.successBorder',
  '#d5e5dc': 'colors.successBorder',
  '#c5c2b8': 'colors.borderInput',
  '#f0c6cb': 'colors.dangerBorder',
  '#fff5f6': 'colors.dangerLight',
  '#fff8f9': 'colors.dangerLight',
  '#b23a48': 'colors.dangerDark',
  '#a33c48': 'colors.dangerDark',
  '#6f5a20': 'colors.warningText',
  '#7a5a00': 'colors.warningText',
  '#8a8578': 'colors.textHint',
  '#c9c4b8': 'colors.borderInput',
  '#eeeae0': 'colors.borderLight',
  '#b4b2a9': 'colors.textHint',
  '#444': 'colors.text',
  '#e8f5e9': 'colors.successLight',
  '#9ec4b5': 'colors.successBorder',
  '#f4f3f4': 'colors.borderLight',
  '#efece2': 'colors.backgroundAlt',
  '#e8f2ee': 'colors.primaryLight',
  '#fbf6ea': 'colors.warningLight',
  '#5c7a6d': 'colors.successText',
  '#F0D9BC': 'colors.secondaryLight',
  '#e8d9a8': 'colors.warningBorder',
  '#faf6eb': 'colors.warningLight',
  '#e8c4c8': 'colors.dangerBorder',
};

function relImport(file) {
  const from = path.dirname(file);
  let rel = path.relative(from, THEME).replace(/\\/g, '/');
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel.replace(/\.ts$/, '');
}

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === 'dist' || ent.name === 'scripts') continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(tsx?)$/.test(ent.name) && ent.name !== 'theme.ts' && ent.name !== 'screen-styles.ts')
      out.push(p);
  }
  return out;
}

function apply(file) {
  let content = fs.readFileSync(file, 'utf8');
  const orig = content;

  for (const [hex, token] of Object.entries(HEX_MAP)) {
    // Solo dentro de StyleSheet / objetos — no tocar atributos JSX ("#hex" en props).
    content = content.split(`'${hex}'`).join(token);
    content = content.split(`"${hex}"`).join(token);
  }

  const usesColors = /\bcolors\./.test(content);
  const usesStatus = /\bstatus\./.test(content);
  if (!usesColors && !usesStatus) return false;

  const hasThemeImport = /from ['"].*\/theme['"]/.test(content);

  if (!hasThemeImport) {
    const rel = relImport(file);
    const imports = [];
    if (usesColors) imports.push('colors');
    if (usesStatus) imports.push('status');
    const line = `import { ${imports.join(', ')} } from '${rel}';\n`;
    const importBlocks = [...content.matchAll(/^import .+;\n/gm)];
    if (importBlocks.length > 0) {
      const last = importBlocks[importBlocks.length - 1];
      const idx = last.index + last[0].length;
      content = content.slice(0, idx) + line + content.slice(idx);
    } else {
      content = line + content;
    }
  }

  if (content !== orig) {
    fs.writeFileSync(file, content);
    return true;
  }
  return false;
}

let n = 0;
for (const f of walk(ROOT)) {
  if (apply(f)) {
    n++;
    console.log(path.relative(ROOT, f));
  }
}
console.log(`Updated ${n} files`);
