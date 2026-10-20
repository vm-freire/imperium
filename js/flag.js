// ============================================================
//  IMPERIUM — Bandeiras (layouts, emblemas, renderização)
// ============================================================
'use strict';

const FLAG_LAYOUTS = [
  {id:'solido', name:'Sólida'},
  {id:'bicolor_h', name:'Bicolor horizontal'},
  {id:'bicolor_v', name:'Bicolor vertical'},
  {id:'tricolor_h', name:'Tricolor horizontal'},
  {id:'tricolor_v', name:'Tricolor vertical'},
  {id:'faixa_central', name:'Faixa central larga'},
  {id:'listras', name:'Listras (7)'},
  {id:'diagonal', name:'Diagonal'},
  {id:'cruz', name:'Cruz'},
  {id:'cruz_nordica', name:'Cruz nórdica'},
  {id:'aspa', name:'Aspa (X)'},
  {id:'triangulo', name:'Triângulo no mastro'},
  {id:'chevron', name:'Divisa (chevron)'},
  {id:'cantao', name:'Cantão + listras'},
  {id:'quartelado', name:'Quartelado'},
  {id:'borda', name:'Borda'},
  {id:'losango', name:'Losango central'},
  {id:'sol_nascente', name:'Raios de sol'}
];

const FLAG_EMBLEMS = [
  {id:'nenhum', name:'Nenhum'},
  {id:'estrela', name:'Estrela'},
  {id:'estrela6', name:'Estrela de 6 pontas'},
  {id:'estrelas', name:'Anel de estrelas'},
  {id:'sol', name:'Sol'},
  {id:'lua', name:'Crescente e estrela'},
  {id:'circulo', name:'Disco'},
  {id:'anel', name:'Anel'},
  {id:'losango', name:'Losango'},
  {id:'cruz', name:'Cruz grega'},
  {id:'triangulo', name:'Triângulo'},
  {id:'coroa', name:'Coroa'},
  {id:'aguia', name:'Águia'},
  {id:'engrenagem', name:'Engrenagem'},
  {id:'ancora', name:'Âncora'},
  {id:'arvore', name:'Árvore'},
  {id:'escudo', name:'Escudo'},
  {id:'espadas', name:'Espadas cruzadas'},
  {id:'folha', name:'Folha'},
  {id:'olho', name:'Olho'},
  {id:'roda', name:'Roda (chakra)'}
];

const FLAG_COLORS = ['#b22234','#c8102e','#8b1a1a','#e35d1a','#f2a900','#ffd100','#f5f0e1','#ffffff','#111111','#3c3b6e','#002868','#0055a4','#1e90c8','#5fa8d3','#006a4e','#009739','#2e7d32','#6b8e23','#5d3a1a','#7b2d8e','#c71585','#808080'];

function randomFlag(rnd){
  rnd = rnd || Math.random;
  const pick = a => a[Math.floor(rnd()*a.length)];
  let c1 = pick(FLAG_COLORS), c2 = pick(FLAG_COLORS), c3 = pick(FLAG_COLORS);
  while (c2 === c1) c2 = pick(FLAG_COLORS);
  while (c3 === c2 || c3 === c1) c3 = pick(FLAG_COLORS);
  const em = rnd() < 0.25 ? 'nenhum' : pick(FLAG_EMBLEMS).id;
  return {layout: pick(FLAG_LAYOUTS).id, c1, c2, c3, emblem: em, ec: pick(['#ffd100','#ffffff','#f5f0e1','#111111','#c8102e']),
    epos: pick(['centro','centro','cantao','mastro']), esize: 0.5 + rnd()*0.4, stars: 5 + Math.floor(rnd()*8)};
}

function starPath(ctx, cx, cy, r, n, inner, rot){
  n = n || 5; inner = inner || 0.4; rot = rot === undefined ? -Math.PI/2 : rot;
  ctx.beginPath();
  for (let i = 0; i < n*2; i++){
    const rr = i % 2 ? r*inner : r;
    const a = rot + i*Math.PI/n;
    const x = cx + Math.cos(a)*rr, y = cy + Math.sin(a)*rr;
    i ? ctx.lineTo(x,y) : ctx.moveTo(x,y);
  }
  ctx.closePath();
}

function drawFlag(ctx, f, x, y, w, h){
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.translate(x, y);
  if (f.real && REAL_DRAW[f.real]){ REAL_DRAW[f.real](ctx, w, h); ctx.restore(); flagGloss(ctx, x, y, w, h); return; }
  const {c1, c2, c3} = f;
  const R = (c, a, b, cw, ch) => { ctx.fillStyle = c; ctx.fillRect(a, b, cw, ch); };
  switch (f.layout){
    case 'solido': R(c1,0,0,w,h); break;
    case 'bicolor_h': R(c1,0,0,w,h/2); R(c2,0,h/2,w,h/2+1); break;
    case 'bicolor_v': R(c1,0,0,w/2,h); R(c2,w/2,0,w/2+1,h); break;
    case 'tricolor_h': R(c1,0,0,w,h/3+1); R(c2,0,h/3,w,h/3+1); R(c3,0,2*h/3,w,h/3+1); break;
    case 'tricolor_v': R(c1,0,0,w/3+1,h); R(c2,w/3,0,w/3+1,h); R(c3,2*w/3,0,w/3+1,h); break;
    case 'faixa_central': R(c1,0,0,w,h); R(c2,0,h/4,w,h/2); break;
    case 'listras': for (let i=0;i<7;i++) R(i%2?c2:c1,0,i*h/7,w,h/7+1); break;
    case 'diagonal':
      R(c1,0,0,w,h); ctx.fillStyle=c2; ctx.beginPath(); ctx.moveTo(w,0); ctx.lineTo(w,h); ctx.lineTo(0,h); ctx.fill();
      ctx.strokeStyle=c3; ctx.lineWidth=h*0.12; ctx.beginPath(); ctx.moveTo(-5,h+5*h/w); ctx.lineTo(w+5,-5*h/w); ctx.stroke(); break;
    case 'cruz': R(c1,0,0,w,h); R(c2,w/2-h*0.1,0,h*0.2,h); R(c2,0,h*0.4,w,h*0.2); break;
    case 'cruz_nordica':
      R(c1,0,0,w,h); R(c2,w*0.28,0,h*0.26,h); R(c2,0,h*0.37,w,h*0.26);
      R(c3,w*0.28+h*0.07,0,h*0.12,h); R(c3,0,h*0.44,w,h*0.12); break;
    case 'aspa':
      R(c1,0,0,w,h); ctx.strokeStyle=c2; ctx.lineWidth=h*0.2;
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(w,h); ctx.moveTo(w,0); ctx.lineTo(0,h); ctx.stroke(); break;
    case 'triangulo':
      R(c1,0,0,w,h/2); R(c3,0,h/2,w,h/2+1); ctx.fillStyle=c2; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(w*0.45,h/2); ctx.lineTo(0,h); ctx.fill(); break;
    case 'chevron':
      R(c1,0,0,w,h); ctx.fillStyle=c3; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(w*0.55,h/2); ctx.lineTo(0,h); ctx.fill();
      ctx.fillStyle=c2; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(w*0.42,h/2); ctx.lineTo(0,h); ctx.fill(); break;
    case 'cantao':
      for (let i=0;i<9;i++) R(i%2?c3:c1,0,i*h/9,w,h/9+1); R(c2,0,0,w*0.42,h*5/9); break;
    case 'quartelado': R(c1,0,0,w/2,h/2); R(c2,w/2,0,w/2,h/2); R(c2,0,h/2,w/2,h/2); R(c1,w/2,h/2,w/2,h/2); break;
    case 'borda': R(c2,0,0,w,h); R(c1,h*0.12,h*0.12,w-h*0.24,h*0.76); break;
    case 'losango':
      R(c1,0,0,w,h); ctx.fillStyle=c2; ctx.beginPath(); ctx.moveTo(w/2,h*0.08); ctx.lineTo(w*0.92,h/2); ctx.lineTo(w/2,h*0.92); ctx.lineTo(w*0.08,h/2); ctx.fill(); break;
    case 'sol_nascente':
      R(c1,0,0,w,h); ctx.fillStyle=c2;
      for (let i=0;i<16;i+=2){ const a1=i*Math.PI/8, a2=(i+1)*Math.PI/8; ctx.beginPath(); ctx.moveTo(w*0.4,h/2); ctx.lineTo(w*0.4+Math.cos(a1)*w*2,h/2+Math.sin(a1)*w*2); ctx.lineTo(w*0.4+Math.cos(a2)*w*2,h/2+Math.sin(a2)*w*2); ctx.fill(); }
      break;
    default: R(c1,0,0,w,h);
  }
  // emblema
  if (f.emblem && f.emblem !== 'nenhum'){
    let cx = w/2, cy = h/2, s = h*0.5*(f.esize||0.6);
    if (f.epos === 'cantao'){ cx = w*0.21; cy = h*0.27; s = h*0.26*(f.esize||0.6)*1.4; }
    else if (f.epos === 'mastro'){ cx = h*0.42; cy = h/2; s = h*0.36*(f.esize||0.6)*1.3; }
    drawEmblem(ctx, f.emblem, cx, cy, s, f.ec || '#fff', f);
  }
  ctx.restore();
  flagGloss(ctx, x, y, w, h);
}
function flagGloss(ctx, x, y, w, h){
  // brilho/tecido
  ctx.save();
  const g = ctx.createLinearGradient(x, y, x+w, y+h);
  g.addColorStop(0,'rgba(255,255,255,0.12)'); g.addColorStop(0.5,'rgba(255,255,255,0)'); g.addColorStop(1,'rgba(0,0,0,0.12)');
  ctx.fillStyle = g; ctx.fillRect(x,y,w,h);
  ctx.strokeStyle='rgba(40,25,10,0.55)'; ctx.lineWidth=Math.max(1,h/60); ctx.strokeRect(x+0.5,y+0.5,w-1,h-1);
  ctx.restore();
}

function drawEmblem(ctx, em, cx, cy, s, col, f){
  const r = s/2;
  ctx.save();
  ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineCap='round'; ctx.lineJoin='round';
  switch (em){
    case 'estrela': starPath(ctx,cx,cy,r,5,0.4); ctx.fill(); break;
    case 'estrela6': starPath(ctx,cx,cy,r,6,0.55); ctx.fill(); break;
    case 'estrelas': {
      const n = Math.max(3, Math.min(20, f.stars||8));
      for (let i=0;i<n;i++){ const a=-Math.PI/2+i*2*Math.PI/n; starPath(ctx,cx+Math.cos(a)*r*0.78,cy+Math.sin(a)*r*0.78,r*0.17,5,0.4); ctx.fill(); }
      break; }
    case 'sol':
      ctx.beginPath(); ctx.arc(cx,cy,r*0.5,0,Math.PI*2); ctx.fill();
      for (let i=0;i<16;i++){ const a=i*Math.PI/8; ctx.beginPath(); ctx.moveTo(cx+Math.cos(a-0.12)*r*0.6,cy+Math.sin(a-0.12)*r*0.6); ctx.lineTo(cx+Math.cos(a)*r*(i%2?0.85:1),cy+Math.sin(a)*r*(i%2?0.85:1)); ctx.lineTo(cx+Math.cos(a+0.12)*r*0.6,cy+Math.sin(a+0.12)*r*0.6); ctx.fill(); }
      break;
    case 'lua': {
      ctx.save(); const p = new Path2D(); p.rect(cx-r*2,cy-r*2,r*4,r*4); p.arc(cx+r*0.32,cy,r*0.78,0,Math.PI*2);
      ctx.clip(p,'evenodd'); ctx.beginPath(); ctx.arc(cx,cy,r*0.9,0,Math.PI*2); ctx.fill(); ctx.restore();
      starPath(ctx,cx+r*0.45,cy,r*0.3,5,0.4,0); ctx.fill(); break; }
    case 'circulo': ctx.beginPath(); ctx.arc(cx,cy,r*0.85,0,Math.PI*2); ctx.fill(); break;
    case 'anel': ctx.lineWidth=r*0.22; ctx.beginPath(); ctx.arc(cx,cy,r*0.75,0,Math.PI*2); ctx.stroke(); break;
    case 'losango': ctx.beginPath(); ctx.moveTo(cx,cy-r); ctx.lineTo(cx+r*0.7,cy); ctx.lineTo(cx,cy+r); ctx.lineTo(cx-r*0.7,cy); ctx.fill(); break;
    case 'cruz': ctx.fillRect(cx-r*0.2,cy-r*0.85,r*0.4,r*1.7); ctx.fillRect(cx-r*0.85,cy-r*0.2,r*1.7,r*0.4); break;
    case 'triangulo': ctx.beginPath(); ctx.moveTo(cx,cy-r*0.9); ctx.lineTo(cx+r*0.85,cy+r*0.65); ctx.lineTo(cx-r*0.85,cy+r*0.65); ctx.fill(); break;
    case 'coroa':
      ctx.beginPath(); ctx.moveTo(cx-r*0.85,cy+r*0.5); ctx.lineTo(cx-r*0.9,cy-r*0.45); ctx.lineTo(cx-r*0.45,cy); ctx.lineTo(cx,cy-r*0.75);
      ctx.lineTo(cx+r*0.45,cy); ctx.lineTo(cx+r*0.9,cy-r*0.45); ctx.lineTo(cx+r*0.85,cy+r*0.5); ctx.fill();
      ctx.fillRect(cx-r*0.85,cy+r*0.58,r*1.7,r*0.22);
      [[-0.9,-0.45],[0,-0.75],[0.9,-0.45]].forEach(([a,b])=>{ctx.beginPath(); ctx.arc(cx+a*r,cy+b*r,r*0.12,0,Math.PI*2); ctx.fill();});
      break;
    case 'aguia':
      ctx.beginPath(); ctx.moveTo(cx,cy-r*0.55);
      ctx.quadraticCurveTo(cx-r*0.4,cy-r*0.9,cx-r*1.0,cy-r*0.55); ctx.lineTo(cx-r*0.75,cy-r*0.3); ctx.lineTo(cx-r*0.95,cy-r*0.15); ctx.lineTo(cx-r*0.6,cy-r*0.05); ctx.lineTo(cx-r*0.7,cy+r*0.1);
      ctx.quadraticCurveTo(cx-r*0.3,cy+r*0.05,cx-r*0.2,cy+r*0.35); ctx.lineTo(cx-r*0.35,cy+r*0.85); ctx.lineTo(cx,cy+r*0.6); ctx.lineTo(cx+r*0.35,cy+r*0.85); ctx.lineTo(cx+r*0.2,cy+r*0.35);
      ctx.quadraticCurveTo(cx+r*0.3,cy+r*0.05,cx+r*0.7,cy+r*0.1); ctx.lineTo(cx+r*0.6,cy-r*0.05); ctx.lineTo(cx+r*0.95,cy-r*0.15); ctx.lineTo(cx+r*0.75,cy-r*0.3); ctx.lineTo(cx+r*1.0,cy-r*0.55);
      ctx.quadraticCurveTo(cx+r*0.4,cy-r*0.9,cx,cy-r*0.55); ctx.fill();
      ctx.beginPath(); ctx.arc(cx,cy-r*0.6,r*0.17,0,Math.PI*2); ctx.fill(); break;
    case 'engrenagem': {
      ctx.beginPath(); const n=10;
      for (let i=0;i<n*2;i++){ const a=i*Math.PI/n; const rr = i%2 ? r*0.7 : r*0.92; ctx.lineTo(cx+Math.cos(a-0.15)*rr,cy+Math.sin(a-0.15)*rr); ctx.lineTo(cx+Math.cos(a+0.15)*rr,cy+Math.sin(a+0.15)*rr); }
      ctx.closePath(); ctx.arc(cx,cy,r*0.35,0,Math.PI*2,true); ctx.fill('evenodd'); break; }
    case 'ancora':
      ctx.lineWidth=r*0.16; ctx.beginPath(); ctx.moveTo(cx,cy-r*0.6); ctx.lineTo(cx,cy+r*0.8);
      ctx.moveTo(cx-r*0.4,cy-r*0.3); ctx.lineTo(cx+r*0.4,cy-r*0.3); ctx.moveTo(cx-r*0.75,cy+r*0.3);
      ctx.quadraticCurveTo(cx-r*0.6,cy+r*0.85,cx,cy+r*0.8); ctx.quadraticCurveTo(cx+r*0.6,cy+r*0.85,cx+r*0.75,cy+r*0.3); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx,cy-r*0.75,r*0.16,0,Math.PI*2); ctx.stroke(); break;
    case 'arvore':
      for (let i=0;i<3;i++){ const yy=cy-r*0.85+i*r*0.42; ctx.beginPath(); ctx.moveTo(cx,yy); ctx.lineTo(cx+r*(0.35+i*0.2),yy+r*0.55); ctx.lineTo(cx-r*(0.35+i*0.2),yy+r*0.55); ctx.fill(); }
      ctx.fillRect(cx-r*0.1,cy+r*0.4,r*0.2,r*0.5); break;
    case 'escudo':
      ctx.beginPath(); ctx.moveTo(cx-r*0.7,cy-r*0.8); ctx.lineTo(cx+r*0.7,cy-r*0.8); ctx.lineTo(cx+r*0.7,cy);
      ctx.quadraticCurveTo(cx+r*0.6,cy+r*0.7,cx,cy+r*0.95); ctx.quadraticCurveTo(cx-r*0.6,cy+r*0.7,cx-r*0.7,cy); ctx.closePath(); ctx.fill();
      ctx.fillStyle = f && f.c1 ? f.c1 : '#000'; ctx.globalAlpha=0.5; starPath(ctx,cx,cy-r*0.05,r*0.35,5,0.4); ctx.fill(); break;
    case 'espadas':
      ctx.lineWidth=r*0.13;
      [[-1,1],[1,1]].forEach(([d])=>{ ctx.beginPath(); ctx.moveTo(cx-d*r*0.75,cy+r*0.75); ctx.lineTo(cx+d*r*0.7,cy-r*0.7); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx-d*r*0.75+r*0.25,cy+r*0.45+d*0); ctx.lineTo(cx-d*r*0.45-r*0.05,cy+r*0.8); ctx.stroke(); });
      break;
    case 'folha':
      ctx.beginPath(); ctx.moveTo(cx,cy-r*0.95); ctx.lineTo(cx+r*0.18,cy-r*0.55); ctx.lineTo(cx+r*0.55,cy-r*0.7); ctx.lineTo(cx+r*0.45,cy-r*0.25);
      ctx.lineTo(cx+r*0.9,cy-r*0.35); ctx.lineTo(cx+r*0.75,cy); ctx.lineTo(cx+r*0.9,cy+r*0.15); ctx.lineTo(cx+r*0.3,cy+r*0.45); ctx.lineTo(cx+r*0.35,cy+r*0.6);
      ctx.lineTo(cx+r*0.05,cy+r*0.55); ctx.lineTo(cx+r*0.05,cy+r*0.95); ctx.lineTo(cx-r*0.05,cy+r*0.95); ctx.lineTo(cx-r*0.05,cy+r*0.55); ctx.lineTo(cx-r*0.35,cy+r*0.6);
      ctx.lineTo(cx-r*0.3,cy+r*0.45); ctx.lineTo(cx-r*0.9,cy+r*0.15); ctx.lineTo(cx-r*0.75,cy); ctx.lineTo(cx-r*0.9,cy-r*0.35); ctx.lineTo(cx-r*0.45,cy-r*0.25);
      ctx.lineTo(cx-r*0.55,cy-r*0.7); ctx.lineTo(cx-r*0.18,cy-r*0.55); ctx.closePath(); ctx.fill(); break;
    case 'roda':
      ctx.lineWidth=r*0.1; ctx.beginPath(); ctx.arc(cx,cy,r*0.8,0,Math.PI*2); ctx.stroke(); ctx.lineWidth=r*0.05;
      for (let i=0;i<24;i++){ const a=i*Math.PI/12; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(a)*r*0.8,cy+Math.sin(a)*r*0.8); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(cx,cy,r*0.15,0,Math.PI*2); ctx.fill(); break;
    case 'olho':
      ctx.lineWidth=r*0.12; ctx.beginPath(); ctx.moveTo(cx-r*0.9,cy); ctx.quadraticCurveTo(cx,cy-r*0.8,cx+r*0.9,cy); ctx.quadraticCurveTo(cx,cy+r*0.8,cx-r*0.9,cy); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx,cy,r*0.28,0,Math.PI*2); ctx.fill(); break;
  }
  ctx.restore();
}

// renderiza bandeira para um canvas (cache)
function flagCanvas(f, w, h){
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  drawFlag(c.getContext('2d'), f, 0, 0, w, h);
  return c;
}
function flagDataURL(f, w, h){ return flagCanvas(f, w||90, h||60).toDataURL(); }
