import {readFileSync} from 'node:fs';
let t=readFileSync('../logs/lint.log','utf8');
if(!t.includes('problems')) t=readFileSync('../logs/lint.log','utf16le');
let f='';const out={};
for(const l of t.split(/\r?\n/)){
  const m=l.match(/^C:[\\/]Users[\\/]yuana[\\/]Documents[\\/]personal-expense-tracker[\\/](.*)$/);
  if(m){f=m[1];continue;}
  const e=l.match(/^\s+(\d+):(\d+)\s+(error|warning)\s+(.*)$/);
  if(e){const r=l.match(/(react-hooks\/\S+|@typescript-eslint\/\S+|@next\/\S+|import\/\S+)\s*$/);(out[f]??=[]).push({sev:e[3],line:e[1],rule:r?r[1]:null,msg:e[4].slice(0,60)});continue;}
  const r2=l.match(/^(.*?)\s+(react-hooks\/[\w-]+)\s*$/);
  if(r2&&out[f]){const last=out[f].filter(x=>!x.rule).pop(); if(last) last.rule=r2[2];}
}
let ec=0;
for(const[k,v] of Object.entries(out)){ for(const x of v) if(x.sev==='error'){ec++;console.log('ERR',k,x.line,x.rule);} }
console.log('errors',ec);
const w={};for(const v of Object.values(out))for(const x of v) if(x.sev==='warning'){w[x.rule]=(w[x.rule]||0)+1;}
console.log(w);
