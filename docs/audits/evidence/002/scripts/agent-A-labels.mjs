import fs from 'node:fs';
import path from 'node:path';
const R = 'C:/Users/yuana/Documents/personal-expense-tracker/app';
function walk(d) { return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : /\.tsx$/.test(e.name) ? [path.join(d, e.name)] : []); }
let tot = 0, named = 0, wrapped = 0, hiddenish = 0; const un = [];
for (const f of walk(R)) {
  const s = fs.readFileSync(f, 'utf8');
  const re = /<(input|textarea|select)\b([^>]*?)(\/?>)/gs; let m;
  while ((m = re.exec(s))) {
    const attrs = m[2];
    if (/type="hidden"/.test(attrs)) continue;
    tot++;
    const line = s.slice(0, m.index).split('\n').length;
    if (/aria-label|aria-labelledby|\bid=|\{\.\.\.rest\}|\{\.\.\.props\}/.test(attrs)) { named++; continue; }
    const back = s.slice(Math.max(0, m.index - 500), m.index);
    const lo = back.lastIndexOf('<label'), lc = back.lastIndexOf('</label>');
    if (lo > lc) { wrapped++; continue; }
    un.push(path.relative(R, f).replace(/\\/g, '/') + ':' + line);
  }
}
console.log({ tot, named, wrapped, unassociated: un.length });
console.log(un.join('\n'));
