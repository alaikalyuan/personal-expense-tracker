// Heuristic scan of <input|select|textarea> tags in app/**/*.tsx (excluding app/ui/Field.tsx).
const fs=require('fs'),path=require('path');
const root=process.argv[2];
function walk(d,o=[]){for(const f of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,f.name);if(f.isDirectory())walk(p,o);else if(p.endsWith('.tsx'))o.push(p);}return o;}
const rows=[];
for(const f of walk(path.join(root,'app'))){
  if(f.endsWith(path.join('ui','Field.tsx')))continue;
  const s=fs.readFileSync(f,'utf8');
  const re=/<(input|select|textarea)\b/g;let m;
  while((m=re.exec(s))){
    // read tag to matching '>' honoring braces
    let i=m.index+m[0].length,depth=0,q=null;
    for(;i<s.length;i++){const c=s[i];
      if(q){if(c===q)q=null;continue;}
      if(c==='"'||c==="'"||c==='`'){q=c;continue;}
      if(c==='{')depth++;else if(c==='}')depth--;
      else if(c==='>'&&depth===0)break;}
    const tag=s.slice(m.index,i+1);
    const line=s.slice(0,m.index).split('\n').length;
    const type=(tag.match(/type="([a-z]+)"/)||[])[1]||(m[1]==='input'?'text':m[1]);
    const hasId=/\sid=/.test(tag), aria=/aria-label(ledby)?=/.test(tag);
    // wrapped by <label> ? look back for an unclosed <label
    const before=s.slice(Math.max(0,m.index-1500),m.index);
    const lo=before.lastIndexOf('<label'),lc=before.lastIndexOf('</label>');
    const wrapped=lo>lc;
    rows.push({f:path.relative(root,f).split(path.sep).join("/"),line,tag:m[1],type,hasId,aria,wrapped});
  }
}
const cls=r=>r.type==='hidden'?'hidden':(r.aria||r.wrapped||r.hasId)?'ok':'unlabelled';
const tot={};for(const r of rows){const c=cls(r);tot[c]=(tot[c]||0)+1;}
console.log('TOTAL',rows.length,JSON.stringify(tot));
const by={};for(const r of rows){const k=cls(r);if(k==='ok')continue;(by[r.f]=by[r.f]||[]).push(`${r.line}:${r.tag}[${r.type}]${k==='hidden'?'(hidden)':''}`);}
for(const [f,l] of Object.entries(by))console.log(f,l.join(' '));
// breakdown of ok reasons
const ok=rows.filter(r=>cls(r)==='ok');
console.log('ok via aria',ok.filter(r=>r.aria).length,'via wrapping label (no aria)',ok.filter(r=>!r.aria&&r.wrapped).length,'via id only (htmlFor unverified)',ok.filter(r=>!r.aria&&!r.wrapped&&r.hasId).length);
console.log('by type',JSON.stringify(rows.reduce((a,r)=>(a[r.type]=(a[r.type]||0)+1,a),{})));
