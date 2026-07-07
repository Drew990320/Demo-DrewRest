import fs from 'fs';

const file = process.argv[2];
const fnName = process.argv[3];
if (!file || !fnName) {
  console.error('Usage: node migrate-themed-styles.mjs <file> <fnName>');
  process.exit(1);
}

let s = fs.readFileSync(file, 'utf8');

if (!s.includes("import { colors } from '../../src/lib/theme'")) {
  console.log('skip: no static colors import');
  process.exit(0);
}

s = s.replace(
  "import { colors } from '../../src/lib/theme';",
  "import { useVisualTheme } from '../../src/context/VisualThemeContext';\nimport { useThemedStyles } from '../../src/hooks/useThemedStyles';\nimport type { AppColors } from '../../src/lib/theme';",
);

const exportMatch = s.match(/export default function (\w+)\(\) \{\n  const /);
if (!exportMatch) {
  console.error('no export default function');
  process.exit(1);
}

const hookInsert = `export default function ${exportMatch[1]}() {\n  const { colors } = useVisualTheme();\n  const styles = useThemedStyles(${fnName});\n  const `;
s = s.replace(`export default function ${exportMatch[1]}() {\n  const `, hookInsert);

const marker = 'const styles = StyleSheet.create({';
const idx = s.lastIndexOf(marker);
if (idx < 0) {
  console.error('no styles block');
  process.exit(1);
}
const end = s.lastIndexOf('});\n');
let stylesBody = s.slice(idx + marker.length, end);
stylesBody = stylesBody.replace(/colors\./g, 'c.');
const before = s.slice(0, idx);
const after = s.slice(end + 4);
s =
  before +
  `function ${fnName}(c: AppColors) {\n  return StyleSheet.create({` +
  stylesBody +
  '});\n}\n' +
  after;

fs.writeFileSync(file, s);
console.log(`migrated ${file}`);
