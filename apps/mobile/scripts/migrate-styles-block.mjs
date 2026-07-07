import fs from 'fs';

const file = process.argv[2];
const fnName = process.argv[3];
if (!file || !fnName) process.exit(1);

let s = fs.readFileSync(file, 'utf8');
const marker = 'const styles = StyleSheet.create({';
const idx = s.lastIndexOf(marker);
if (idx < 0) {
  console.error('no styles');
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
console.log('ok', file);
