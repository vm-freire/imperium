// ============================================================
//  IMPERIUM — Bandeiras de países reais
// ============================================================
'use strict';

function _R(ctx, c, x, y, w, h){ ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
function _star(ctx, cx, cy, r, col, n, inner){ ctx.fillStyle = col; starPath(ctx, cx, cy, r, n||5, inner||0.4); ctx.fill(); }
function _unionJack(ctx, w, h){
  _R(ctx,'#012169',0,0,w,h);
  ctx.save(); ctx.beginPath(); ctx.rect(0,0,w,h); ctx.clip(); ctx.lineCap='butt';
  ctx.strokeStyle='#fff'; ctx.lineWidth=h*0.2; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(w,h); ctx.moveTo(w,0); ctx.lineTo(0,h); ctx.stroke();
  ctx.strokeStyle='#c8102e'; ctx.lineWidth=h*0.067; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(w,h); ctx.moveTo(w,0); ctx.lineTo(0,h); ctx.stroke();
  _R(ctx,'#fff',w/2-h/6,0,h/3,h); _R(ctx,'#fff',0,h/3,w,h/3);
  _R(ctx,'#c8102e',w/2-h/10,0,h/5,h); _R(ctx,'#c8102e',0,h*0.4,w,h/5);
  ctx.restore();
}

const REAL_DRAW = {
  eua(ctx, w, h){
    for (let i=0;i<13;i++) _R(ctx, i%2?'#fff':'#b22234', 0, i*h/13, w, h/13+0.5);
    const cw = w*0.4, ch = h*7/13; _R(ctx,'#3c3b6e',0,0,cw,ch);
    for (let r=0;r<9;r++){ const n = r%2?5:6; for (let c=0;c<n;c++){ const x = cw*(r%2 ? (c+1)/6 : (c+0.5)/6); _star(ctx, x, ch*(r+0.6)/9.6, ch/26, '#fff'); } }
  },
  canada(ctx, w, h){ _R(ctx,'#d52b1e',0,0,w,h); _R(ctx,'#fff',w/4,0,w/2,h); drawEmblem(ctx,'folha',w/2,h/2,h*0.62,'#d52b1e'); },
  cuba(ctx, w, h){
    for (let i=0;i<5;i++) _R(ctx, i%2?'#fff':'#002a8f', 0, i*h/5, w, h/5+0.5);
    ctx.fillStyle='#cf142b'; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(h*0.866,h/2); ctx.lineTo(0,h); ctx.fill();
    _star(ctx, h*0.3, h/2, h*0.13, '#fff');
  },
  colombia(ctx, w, h){ _R(ctx,'#fcd116',0,0,w,h/2); _R(ctx,'#003893',0,h/2,w,h/4); _R(ctx,'#ce1126',0,h*0.75,w,h/4+0.5); },
  brasil(ctx, w, h){
    _R(ctx,'#009c3b',0,0,w,h);
    ctx.fillStyle='#ffdf00'; ctx.beginPath(); ctx.moveTo(w*0.085,h/2); ctx.lineTo(w/2,h*0.115); ctx.lineTo(w*0.915,h/2); ctx.lineTo(w/2,h*0.885); ctx.fill();
    const r = h*0.25; ctx.fillStyle='#002776'; ctx.beginPath(); ctx.arc(w/2,h/2,r,0,Math.PI*2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(w/2,h/2,r,0,Math.PI*2); ctx.clip();
    ctx.strokeStyle='#fff'; ctx.lineWidth=h*0.035; ctx.beginPath(); ctx.arc(w/2-r*0.3, h/2+r*1.6, r*1.85, -Math.PI*0.68, -Math.PI*0.2); ctx.stroke();
    ctx.fillStyle='#fff'; [[0.2,0.4],[-0.3,0.3],[0.35,0.15],[-0.1,0.55],[0.05,0.25],[-0.45,0.05],[0.5,0.45],[-0.2,0.7],[0.25,0.65]].forEach(([a,b])=>{ ctx.beginPath(); ctx.arc(w/2+a*r, h/2+b*r, h*0.012, 0, Math.PI*2); ctx.fill(); });
    ctx.restore();
  },
  reino_unido(ctx, w, h){ _unionJack(ctx, w, h); },
  argelia(ctx, w, h){ _R(ctx,'#006233',0,0,w/2,h); _R(ctx,'#fff',w/2,0,w/2,h); drawEmblem(ctx,'lua',w/2,h/2,h*0.55,'#d21034'); },
  africa_do_sul(ctx, w, h){
    _R(ctx,'#de3831',0,0,w,h/2); _R(ctx,'#002395',0,h/2,w,h/2);
    ctx.lineJoin='miter';
    const yPath = ()=>{ ctx.beginPath(); ctx.moveTo(-5,-h*0.1); ctx.lineTo(w*0.42,h/2); ctx.lineTo(-5,h*1.1); ctx.moveTo(w*0.42,h/2); ctx.lineTo(w+5,h/2); };
    ctx.strokeStyle='#fff'; ctx.lineWidth=h/3; yPath(); ctx.stroke();
    ctx.strokeStyle='#007a4d'; ctx.lineWidth=h/5; yPath(); ctx.stroke();
    ctx.fillStyle='#ffb612'; ctx.beginPath(); ctx.moveTo(0,h*0.18); ctx.lineTo(w*0.28,h/2); ctx.lineTo(0,h*0.82); ctx.fill();
    ctx.fillStyle='#000'; ctx.beginPath(); ctx.moveTo(0,h*0.27); ctx.lineTo(w*0.2,h/2); ctx.lineTo(0,h*0.73); ctx.fill();
  },
  paquistao(ctx, w, h){ _R(ctx,'#fff',0,0,w/4,h); _R(ctx,'#01411c',w/4,0,w*0.75,h); drawEmblem(ctx,'lua',w*0.625,h/2,h*0.6,'#fff'); },
  china(ctx, w, h){
    _R(ctx,'#de2910',0,0,w,h); _star(ctx, w*0.167, h*0.25, h*0.15, '#ffde00');
    [[0.333,0.1],[0.4,0.2],[0.4,0.35],[0.333,0.45]].forEach(([a,b])=>_star(ctx, w*a, h*b, h*0.05, '#ffde00'));
  },
  coreia(ctx, w, h){
    _R(ctx,'#fff',0,0,w,h); const cx = w/2, cy = h/2, r = h*0.25;
    ctx.fillStyle='#cd2e3a'; ctx.beginPath(); ctx.arc(cx,cy,r,Math.PI,0); ctx.fill();
    ctx.fillStyle='#0047a0'; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI); ctx.fill();
    ctx.fillStyle='#cd2e3a'; ctx.beginPath(); ctx.arc(cx+r/2,cy,r/2,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#0047a0'; ctx.beginPath(); ctx.arc(cx-r/2,cy,r/2,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#000';
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([dx,dy])=>{ ctx.save(); ctx.translate(cx+dx*w*0.3, cy+dy*h*0.3); ctx.rotate(Math.atan2(dy*h,dx*w)+Math.PI/2);
      for (let k=0;k<3;k++) _R(ctx,'#000',-h*0.08,-h*0.08+k*h*0.06,h*0.16,h*0.035); ctx.restore(); });
  },
  tailandia(ctx, w, h){ _R(ctx,'#a51931',0,0,w,h); _R(ctx,'#f4f5f8',0,h/6,w,h*4/6); _R(ctx,'#2d2a4a',0,h/3,w,h/3); },
  filipinas(ctx, w, h){
    _R(ctx,'#0038a8',0,0,w,h/2); _R(ctx,'#ce1126',0,h/2,w,h/2);
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(h*0.866,h/2); ctx.lineTo(0,h); ctx.fill();
    drawEmblem(ctx,'sol',h*0.3,h/2,h*0.25,'#fcd116');
    [[0.07,0.12],[0.07,0.88],[0.72,0.5]].forEach(([a,b])=>_star(ctx, h*a, h*b, h*0.045, '#fcd116'));
  },
  australia(ctx, w, h){
    _R(ctx,'#00008b',0,0,w,h); _unionJack(ctx, w/2, h/2);
    _star(ctx, w/4, h*0.75, h*0.13, '#fff', 7, 0.45);
    [[0.75,0.83],[0.6,0.45],[0.75,0.18],[0.88,0.4]].forEach(([a,b])=>_star(ctx, w*a, h*b, h*0.06, '#fff', 7, 0.45));
    _star(ctx, w*0.82, h*0.56, h*0.035, '#fff');
  },
  nova_zelandia(ctx, w, h){
    _R(ctx,'#00247d',0,0,w,h); _unionJack(ctx, w/2, h/2);
    [[0.75,0.83],[0.63,0.45],[0.75,0.2],[0.86,0.4]].forEach(([a,b])=>{ _star(ctx, w*a, h*b, h*0.075, '#fff'); _star(ctx, w*a, h*b, h*0.05, '#cc142b'); });
  },
  sudao(ctx, w, h){ _R(ctx,'#d21034',0,0,w,h/3); _R(ctx,'#fff',0,h/3,w,h/3); _R(ctx,'#000',0,h*2/3,w,h/3+0.5);
    ctx.fillStyle='#007229'; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(w/3,h/2); ctx.lineTo(0,h); ctx.fill(); },
  grecia(ctx, w, h){ for (let i=0;i<9;i++) _R(ctx, i%2?'#fff':'#0d5eaf', 0, i*h/9, w, h/9+0.5); const s=h*5/9; _R(ctx,'#0d5eaf',0,0,s,s); _R(ctx,'#fff',s*0.4,0,s*0.2,s); _R(ctx,'#fff',0,s*0.4,s,s*0.2); },
  israel(ctx, w, h){ _R(ctx,'#fff',0,0,w,h); _R(ctx,'#0038b8',0,h*0.1,w,h*0.15); _R(ctx,'#0038b8',0,h*0.75,w,h*0.15);
    ctx.strokeStyle='#0038b8'; ctx.lineWidth=h*0.03; const cx=w/2, cy=h/2, r=h*0.2;
    [0, Math.PI].forEach(o=>{ ctx.beginPath(); for (let i=0;i<3;i++){ const a=o-Math.PI/2+i*2*Math.PI/3; i?ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r):ctx.moveTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r); } ctx.closePath(); ctx.stroke(); }); },
  portugal(ctx, w, h){ _R(ctx,'#006600',0,0,w*0.4,h); _R(ctx,'#ff0000',w*0.4,0,w*0.6,h);
    ctx.strokeStyle='#ffcc00'; ctx.lineWidth=h*0.04; ctx.beginPath(); ctx.arc(w*0.4,h/2,h*0.23,0,Math.PI*2); ctx.stroke();
    _R(ctx,'#fff',w*0.4-h*0.13,h/2-h*0.15,h*0.26,h*0.3); _R(ctx,'#ff0000',w*0.4-h*0.1,h/2-h*0.12,h*0.2,h*0.24); _R(ctx,'#fff',w*0.4-h*0.04,h/2-h*0.07,h*0.08,h*0.14); },
  chile(ctx, w, h){ _R(ctx,'#fff',0,0,w,h/2); _R(ctx,'#d52b1e',0,h/2,w,h/2); _R(ctx,'#0039a6',0,0,h/2,h/2); _star(ctx, h/4, h/4, h*0.12, '#fff'); },
  uruguai(ctx, w, h){ for (let i=0;i<9;i++) _R(ctx, i%2?'#0038a8':'#fff', 0, i*h/9, w, h/9+0.5); _R(ctx,'#fff',0,0,h*5/9,h*5/9); drawEmblem(ctx,'sol',h*5/18,h*5/18,h*0.42,'#fcd116'); },
  suica(ctx, w, h){ _R(ctx,'#da291c',0,0,w,h); _R(ctx,'#fff',w/2-h*0.1,h*0.2,h*0.2,h*0.6); _R(ctx,'#fff',w/2-h*0.3,h*0.4,h*0.6,h*0.2); },
  turquia(ctx, w, h){ _R(ctx,'#e30a17',0,0,w,h); drawEmblem(ctx,'lua',w*0.42,h/2,h*0.62,'#fff'); },
  india(ctx, w, h){ _R(ctx,'#ff9933',0,0,w,h/3); _R(ctx,'#fff',0,h/3,w,h/3); _R(ctx,'#138808',0,h*2/3,w,h/3+0.5); drawEmblem(ctx,'roda',w/2,h/2,h*0.3,'#000080'); },
  vietna(ctx, w, h){ _R(ctx,'#da251d',0,0,w,h); _star(ctx, w/2, h/2, h*0.3, '#ffff00'); }
};

// configurações de bandeiras (reais) — {real:'chave'} usa desenho próprio
const FLAG_PRESETS = {
  'Estados Unidos':{real:'eua'}, 'Canadá':{real:'canada'}, 'Cuba':{real:'cuba'}, 'Colômbia':{real:'colombia'}, 'Brasil':{real:'brasil'},
  'Reino Unido':{real:'reino_unido'}, 'Argélia':{real:'argelia'}, 'África do Sul':{real:'africa_do_sul'}, 'Paquistão':{real:'paquistao'},
  'China':{real:'china'}, 'Coreia':{real:'coreia'}, 'Tailândia':{real:'tailandia'}, 'Filipinas':{real:'filipinas'}, 'Austrália':{real:'australia'},
  'Nova Zelândia':{real:'nova_zelandia'}, 'Sudão':{real:'sudao'}, 'Turquia':{real:'turquia'}, 'Índia':{real:'india'},
  'México':{layout:'tricolor_v', c1:'#006847', c2:'#ffffff', c3:'#ce1126', emblem:'aguia', ec:'#8b5a2b', epos:'centro', esize:0.45},
  'Venezuela':{layout:'tricolor_h', c1:'#ffcc00', c2:'#00247d', c3:'#cf142b', emblem:'estrelas', ec:'#ffffff', epos:'centro', esize:0.55, stars:8},
  'Peru':{layout:'tricolor_v', c1:'#d91023', c2:'#ffffff', c3:'#d91023', emblem:'nenhum'},
  'Argentina':{layout:'tricolor_h', c1:'#74acdf', c2:'#ffffff', c3:'#74acdf', emblem:'sol', ec:'#f6b40e', epos:'centro', esize:0.42},
  'França':{layout:'tricolor_v', c1:'#0055a4', c2:'#ffffff', c3:'#ef4135', emblem:'nenhum'},
  'Espanha':{layout:'faixa_central', c1:'#aa151b', c2:'#f1bf00', emblem:'escudo', ec:'#aa151b', epos:'mastro', esize:0.5},
  'Alemanha':{layout:'tricolor_h', c1:'#000000', c2:'#dd0000', c3:'#ffce00', emblem:'nenhum'},
  'Itália':{layout:'tricolor_v', c1:'#009246', c2:'#ffffff', c3:'#ce2b37', emblem:'nenhum'},
  'Polônia':{layout:'bicolor_h', c1:'#ffffff', c2:'#dc143c', emblem:'nenhum'},
  'Escandinávia':{layout:'cruz_nordica', c1:'#006aa7', c2:'#fecc00', c3:'#fecc00', emblem:'nenhum'},
  'Ucrânia':{layout:'bicolor_h', c1:'#0057b7', c2:'#ffd700', emblem:'nenhum'},
  'Rússia':{layout:'tricolor_h', c1:'#ffffff', c2:'#0039a6', c3:'#d52b1e', emblem:'nenhum'},
  'Egito':{layout:'tricolor_h', c1:'#ce1126', c2:'#ffffff', c3:'#000000', emblem:'aguia', ec:'#c09300', epos:'centro', esize:0.35},
  'Nigéria':{layout:'tricolor_v', c1:'#008751', c2:'#ffffff', c3:'#008751', emblem:'nenhum'},
  'Etiópia':{layout:'tricolor_h', c1:'#078930', c2:'#fcdd09', c3:'#da121a', emblem:'circulo', ec:'#0f47af', epos:'centro', esize:0.55},
  'Congo':{layout:'diagonal', c1:'#007fff', c2:'#007fff', c3:'#ce1021', emblem:'estrela', ec:'#f7d618', epos:'cantao', esize:0.8},
  'Arábia Saudita':{layout:'solido', c1:'#006c35', emblem:'espadas', ec:'#ffffff', epos:'centro', esize:0.55},
  'Irã':{layout:'tricolor_h', c1:'#239f40', c2:'#ffffff', c3:'#da0000', emblem:'folha', ec:'#da0000', epos:'centro', esize:0.35},
  'Cazaquistão':{layout:'solido', c1:'#00afca', emblem:'sol', ec:'#fec50c', epos:'centro', esize:0.6},
  'Mongólia':{layout:'tricolor_v', c1:'#c4272f', c2:'#015197', c3:'#c4272f', emblem:'estrela', ec:'#f9cf02', epos:'mastro', esize:0.5},
  'Japão':{layout:'solido', c1:'#ffffff', emblem:'circulo', ec:'#bc002d', epos:'centro', esize:0.72},
  'Indonésia':{layout:'bicolor_h', c1:'#ce1126', c2:'#ffffff', emblem:'nenhum'},
  'Mali':{layout:'tricolor_v', c1:'#14b53a', c2:'#fcd116', c3:'#ce1126', emblem:'nenhum'},
  'Angola':{layout:'bicolor_h', c1:'#cc092f', c2:'#000000', emblem:'engrenagem', ec:'#ffcb00', epos:'centro', esize:0.5},
  'África Oriental':{layout:'tricolor_h', c1:'#000000', c2:'#bb0000', c3:'#006600', emblem:'escudo', ec:'#bb0000', epos:'centro', esize:0.55},
  // extras para o jogador
  'Portugal':{real:'portugal'}, 'Grécia':{real:'grecia'}, 'Israel':{real:'israel'}, 'Chile':{real:'chile'}, 'Uruguai':{real:'uruguai'}, 'Suíça':{real:'suica'}, 'Vietnã':{real:'vietna'},
  'Holanda':{layout:'tricolor_h', c1:'#ae1c28', c2:'#ffffff', c3:'#21468b', emblem:'nenhum'},
  'Bélgica':{layout:'tricolor_v', c1:'#000000', c2:'#fdda24', c3:'#ef3340', emblem:'nenhum'},
  'Irlanda':{layout:'tricolor_v', c1:'#169b62', c2:'#ffffff', c3:'#ff883e', emblem:'nenhum'},
  'Áustria':{layout:'tricolor_h', c1:'#ed2939', c2:'#ffffff', c3:'#ed2939', emblem:'nenhum'},
  'Hungria':{layout:'tricolor_h', c1:'#ce2939', c2:'#ffffff', c3:'#477050', emblem:'nenhum'},
  'Bolívia':{layout:'tricolor_h', c1:'#d52b1e', c2:'#f9e300', c3:'#007934', emblem:'nenhum'},
  'Dinamarca':{layout:'cruz_nordica', c1:'#c8102e', c2:'#ffffff', c3:'#ffffff', emblem:'nenhum'},
  'Noruega':{layout:'cruz_nordica', c1:'#ba0c2f', c2:'#ffffff', c3:'#00205b', emblem:'nenhum'},
  'Finlândia':{layout:'cruz_nordica', c1:'#ffffff', c2:'#002f6c', c3:'#002f6c', emblem:'nenhum'},
  'Paraguai':{layout:'tricolor_h', c1:'#d52b1e', c2:'#ffffff', c3:'#0038a8', emblem:'anel', ec:'#0038a8', epos:'centro', esize:0.35},
  'Equador':{layout:'tricolor_h', c1:'#ffd100', c2:'#034ea2', c3:'#ef3340', emblem:'aguia', ec:'#5b3a1a', epos:'centro', esize:0.4},
  'Gana':{layout:'tricolor_h', c1:'#ce1126', c2:'#fcd116', c3:'#006b3f', emblem:'estrela', ec:'#000000', epos:'centro', esize:0.5},
  'Bangladesh':{layout:'solido', c1:'#006a4e', emblem:'circulo', ec:'#f42a41', epos:'centro', esize:0.75},
  'Marrocos':{layout:'solido', c1:'#c1272d', emblem:'estrela', ec:'#006233', epos:'centro', esize:0.6}
};
const REAL_MAIN = {eua:'#b22234', canada:'#d52b1e', cuba:'#002a8f', colombia:'#e0b000', brasil:'#009c3b', reino_unido:'#012169', argelia:'#006233', africa_do_sul:'#007a4d', paquistao:'#01411c', china:'#de2910', coreia:'#0047a0', tailandia:'#2d2a4a', filipinas:'#0038a8', australia:'#00008b', nova_zelandia:'#00247d', sudao:'#007229', turquia:'#e30a17', india:'#ff9933', portugal:'#006600', grecia:'#0d5eaf', israel:'#0038b8', chile:'#d52b1e', uruguai:'#0038a8', suica:'#da291c', vietna:'#da251d'};
function presetFlag(name){
  const f = FLAG_PRESETS[name]; if (!f) return null;
  const out = Object.assign({layout:'solido', c1:'#888888', c2:'#ffffff', c3:'#000000', emblem:'nenhum', ec:'#ffffff', epos:'centro', esize:0.6, stars:8}, f);
  if (f.real) out.c1 = REAL_MAIN[f.real] || out.c1;
  return out;
}
// cor do país no mapa: evita branco/preto
function flagMapColor(f){
  const ok = c => { if (!c) return false; const [r,g,b] = hexToRgb(c); const l = (r+g+b)/3; return l > 40 && l < 225; };
  return [f.c1, f.ec, f.c2, f.c3].find(ok) || '#8b1a1a';
}
