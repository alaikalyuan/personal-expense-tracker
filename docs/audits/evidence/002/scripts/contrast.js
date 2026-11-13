// WCAG 2.x contrast for token pairs. Values copied from app/globals.css (line refs in DESIGN_TOKENS.md).
const shared={light:{ok:'#2f7d4f',danger:'#b3261e'},dark:{ok:'#7fc596',danger:'#ee9085'}};
const P={
 orange:{light:{paper:'#fff8ec',card:'#ffffff',ink:'#2b2118','ink-soft':'#6b5a48',accent:'#e8590c','accent-strong':'#c2470a','on-accent':'#17110b','muted-400':'#7f6e57'},
         dark:{paper:'#1a130d',card:'#261d15',ink:'#f6ebdd','ink-soft':'#c4b29b',accent:'#f98229','accent-strong':'#ffa65c','on-accent':'#17110b','muted-400':'#ae9d85'}},
 pink:{light:{paper:'#fff5f7',card:'#ffffff',ink:'#2e1720','ink-soft':'#6e4a58',accent:'#d6336c','accent-strong':'#a61e4d','on-accent':'#ffffff','muted-400':'#85606e'},
       dark:{paper:'#1b1015',card:'#28181f',ink:'#fbe9ef','ink-soft':'#d1aebb',accent:'#f06595','accent-strong':'#ff8fb3','on-accent':'#1b0a11','muted-400':'#b993a2'}},
 blue:{light:{paper:'#f3f7fc',card:'#ffffff',ink:'#14213a','ink-soft':'#4a5b78',accent:'#1f6feb','accent-strong':'#1553b8','on-accent':'#ffffff','muted-400':'#5f7090'},
       dark:{paper:'#0d1421',card:'#16202f',ink:'#e6eefa','ink-soft':'#a8b8d0',accent:'#5b9bff','accent-strong':'#8cb8ff','on-accent':'#07111f','muted-400':'#8fa1bd'}},
 mono:{light:{paper:'#f6f6f4',card:'#ffffff',ink:'#1c1c1c','ink-soft':'#5c5c5c',accent:'#1c1c1c','accent-strong':'#000000','on-accent':'#ffffff','muted-400':'#707070'},
       dark:{paper:'#121212',card:'#1e1e1e',ink:'#f0f0f0','ink-soft':'#b0b0b0',accent:'#f0f0f0','accent-strong':'#ffffff','on-accent':'#121212','muted-400':'#9a9a9a'}},
};
const lum=h=>{const c=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4));return .2126*c[0]+.7152*c[1]+.0722*c[2];};
const cr=(a,b)=>{const [x,y]=[lum(a),lum(b)].sort((p,q)=>q-p);return (x+.05)/(y+.05);};
const pairs=[['ink','paper'],['ink-soft','paper'],['ink-soft','card'],['on-accent','accent'],['accent-strong','paper'],['ok','paper'],['danger','paper'],['accent-strong','card'],['ok','card'],['danger','card'],['muted-400','paper'],['accent','paper']];
const out=[];
for(const pal of Object.keys(P))for(const th of ['light','dark']){const t={...P[pal][th],...shared[th]};
  for(const [fg,bg] of pairs){const r=cr(t[fg],t[bg]);out.push({pal,th,fg,bg,fgv:t[fg],bgv:t[bg],r:+r.toFixed(2)});}}
const json=process.argv[2]==='json';
if(json){console.log(JSON.stringify(out));}
else{
 for(const [fg,bg] of pairs){
  const cells=[];
  for(const pal of Object.keys(P)){for(const th of ['light','dark']){const o=out.find(x=>x.pal===pal&&x.th===th&&x.fg===fg&&x.bg===bg);cells.push(o.r.toFixed(2)+(o.r<4.5?'*':''));}}
  console.log(`| ${fg} / ${bg} | `+cells.join(' | ')+' |');
 }
}
