// ============================================================
//  IMPERIUM — Modo História (para aulas)
//  Cada acontecimento vira uma cena jogável, sem passar o tempo:
//   1. abertura contando a história e as pessoas reais envolvidas
//   2. você faz o que aconteceu, no mapa (clicar, navegar, lançar...)
//   3. animação e as consequências: a "ficha" do país que agiu,
//      com os números antes → depois, e depois a do país atingido
//   4. resumo e uma pergunta para a turma
//  Os números são aproximados (fontes históricas variam) e os textos
//  procuram explicar causas e consequências, inclusive as humanas.
// ============================================================
'use strict';

// ---------------- motor ----------------
const HS = { sc:null, i:0, fx:null, card:{}, misses:0, from:null, busy:false };

// células do mapa: de uma nação (pelo nome da época), num retângulo ou num círculo
function hsNid(name){ if (!G) return -1; if (G.p && G.p.existing === name) return 1; return G.nations.findIndex(n => n && n.name === name); }
function hsNationCells(name){ const id = hsNid(name), out = []; if (id < 1) return out; for (let i=0;i<NCELLS;i++) if (Grid.land[i] && Grid.owner[i] === id) out.push(i); return out; }
function hsBoxCells(lo0, la0, lo1, la1, test){ const out = []; for (let i=0;i<NCELLS;i++){ if (!Grid.land[i]) continue; const [lo, la] = cellCenter(i); if (lo >= lo0 && lo <= lo1 && la >= la0 && la <= la1 && (!test || test(i, lo, la))) out.push(i); } return out; }
function hsCircleCells(lon, lat, r){ return hsBoxCells(lon-r, lat-r, lon+r, lat+r, (i, lo, la) => Math.hypot(lo-lon, la-lat) <= r); }
function hsFx(){ return HS.fx || (HS.fx = {overlays:[], lines:[], ships:[], markers:[], circles:[], pulse:null}); }
const hsNow = () => performance.now();

// efeitos prontos para os cenários
const F = {
  overlay(cells, color, label, alpha){ const fx = hsFx(); let sx = 0, sy = 0; for (const c of cells){ const [x, y] = cellXY(c); sx += x; sy += y; } fx.overlays.push({cells, color, label, alpha: alpha || 0.55, lx: cells.length ? sx/cells.length : 0, ly: cells.length ? sy/cells.length : 0, t0:hsNow()}); },
  line(pts, color, width, dash, dur){ hsFx().lines.push({pts, color, width: width || 2, dash, t0:hsNow(), dur: dur || 1200}); },
  ship(pts, dur, icon){ hsFx().ships.push({pts, t0:hsNow(), dur: dur || 3000, icon: icon || '⛵'}); },
  marker(lon, lat, icon, label, color){ hsFx().markers.push({lon, lat, icon, label, color: color || '#3d2812'}); },
  circle(lon, lat, r, color, fill){ hsFx().circles.push({lon, lat, r, color, fill, t0:hsNow()}); },
  nuke(lon, lat){ const [x, y] = proj(lon, lat); SFX.nuke(); MapView.addAnim({type:'nuke', x, y, dur:3500}); MapView.doShake(18, 1500); },
  boom(lon, lat, big){ const [x, y] = proj(lon, lat); MapView.boom(x, y, big); SFX.explosion && SFX.explosion(0); },
  arrow(a, b, color){ MapView.arrow(proj(a[0], a[1]), proj(b[0], b[1]), color || '#8b1a1a'); },
  plane(a, b){ MapView.addAnim({type:'plane', from:proj(a[0], a[1]), to:proj(b[0], b[1]), dur:2400}); },
  missile(a, b){ MapView.addAnim({type:'missile', from:proj(a[0], a[1]), to:proj(b[0], b[1]), dur:1600}); },
  ring(lon, lat, color, r){ const [x, y] = proj(lon, lat); MapView.ring(x, y, color || '#8b1a1a', r || 30); },
  text(lon, lat, t, color){ const [x, y] = proj(lon, lat); MapView.floatText(x, y, t, color || '#8b1a1a'); },
  cam(lon, lat, z){ MapView.flyTo(lon, lat, z); }
};

// desenho da camada da história (por cima do mapa, ao vivo)
const _hsCorps = MapView.drawCorps;
MapView.drawCorps = function(ctx, z){
  _hsCorps.call(this, ctx, z);
  if (!G || !G.story || !HS.fx) return;
  this.kick = 2;   // a história anima o tempo todo
  const fx = HS.fx, now = hsNow();
  ctx.save();
  for (const o of fx.overlays){
    const k = Math.min(1, (now - o.t0)/900);
    ctx.globalAlpha = o.alpha * k; ctx.fillStyle = o.color;
    for (const c of o.cells){ const [x, y] = cellXY(c); ctx.fillRect(x - DEG/2, y - DEG/2, DEG, DEG); }
    if (o.label && z < 5){ ctx.globalAlpha = k; const fs = Math.max(4, 13/z); ctx.font = `700 ${fs}px "Cinzel", Georgia, serif`; ctx.textAlign = 'center'; ctx.lineWidth = fs*0.25; ctx.strokeStyle = 'rgba(255,245,215,0.9)'; ctx.strokeText(o.label, o.lx, o.ly); ctx.fillStyle = '#2b1a0a'; ctx.fillText(o.label, o.lx, o.ly); }
  }
  ctx.globalAlpha = 1;
  for (const c of fx.circles){
    const k = Math.min(1, (now - c.t0)/1000), [x, y] = proj(c.lon, c.lat), r = c.r * DEG * k;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2);
    if (c.fill){ ctx.fillStyle = c.fill; ctx.fill(); }
    ctx.setLineDash([5/z+1, 4/z+1]); ctx.strokeStyle = c.color; ctx.lineWidth = 2/z + 0.6; ctx.stroke(); ctx.setLineDash([]);
  }
  for (const l of fx.lines){
    const k = Math.min(1, (now - l.t0)/l.dur), pts = l.pts.map(p => proj(p[0], p[1])), n = (pts.length - 1) * k;
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i=1;i<=Math.floor(n);i++) ctx.lineTo(pts[i][0], pts[i][1]);
    const f = n % 1, j = Math.floor(n); if (f && pts[j+1]) ctx.lineTo(pts[j][0] + (pts[j+1][0]-pts[j][0])*f, pts[j][1] + (pts[j+1][1]-pts[j][1])*f);
    if (l.dash) ctx.setLineDash([6/z+2, 4/z+1]); ctx.strokeStyle = l.color; ctx.lineWidth = l.width/z + 0.6; ctx.lineCap = 'round'; ctx.stroke(); ctx.setLineDash([]);
  }
  for (const s of fx.ships){
    const k = Math.min(1, (now - s.t0)/s.dur), pts = s.pts.map(p => proj(p[0], p[1]));
    let len = 0; const seg = []; for (let i=1;i<pts.length;i++){ const d = Math.hypot(pts[i][0]-pts[i-1][0], pts[i][1]-pts[i-1][1]); seg.push(d); len += d; }
    let t = len * k, i = 0; while (i < seg.length - 1 && t > seg[i]){ t -= seg[i]; i++; }
    const a = pts[i], b = pts[i+1] || a, f = seg[i] ? t/seg[i] : 0, x = a[0] + (b[0]-a[0])*f, y = a[1] + (b[1]-a[1])*f;
    ctx.strokeStyle = 'rgba(44,79,115,0.55)'; ctx.setLineDash([3/z+1, 3/z+1]); ctx.lineWidth = 1.2/z + 0.4; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let q=1;q<=i;q++) ctx.lineTo(pts[q][0], pts[q][1]); ctx.lineTo(x, y); ctx.stroke(); ctx.setLineDash([]);
    const fs = Math.max(7, 20/Math.sqrt(z)); ctx.font = `${fs}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(s.icon, x, y + Math.sin(now/300)*0.6);
  }
  for (const m of fx.markers){
    const [x, y] = proj(m.lon, m.lat), fs = Math.max(6, 16/Math.sqrt(z));
    ctx.font = `${fs}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(m.icon, x, y);
    if (m.label){ const f2 = Math.max(3.5, 11/z); ctx.font = `italic 700 ${f2}px "IM Fell English", Georgia, serif`; ctx.lineWidth = f2*0.3; ctx.strokeStyle = 'rgba(255,245,215,0.95)'; ctx.strokeText(m.label, x, y + fs*0.9); ctx.fillStyle = m.color; ctx.fillText(m.label, x, y + fs*0.9); }
  }
  if (fx.pulse){
    const [x, y] = proj(fx.pulse.lon, fx.pulse.lat), ph = (now % 1200)/1200;
    ctx.strokeStyle = `rgba(200,30,20,${1-ph})`; ctx.lineWidth = 2.5/z + 0.5; ctx.beginPath(); ctx.arc(x, y, (fx.pulse.r || 2)*DEG*(0.4 + ph), 0, Math.PI*2); ctx.stroke();
  }
  ctx.restore();
};

// monta um mundo da época (sem salvar, sem passar o tempo)
function hsBuildWorld(sc){
  const keep = {mode:C.mode, cfg:C.cfg, step:C.step};
  C.mode = 'existing'; C.cfg = defaultCfg(); C.cfg.era = sc.era; C.cfg.world = typeof defaultWorld === 'function' ? defaultWorld() : null;
  applyExisting(sc.world);
  const cfg = Object.assign({}, C.cfg, {homePoly:null, center:[0,0], flag:Object.assign({}, C.cfg.flag), gameMode:'livre'});
  Object.assign(C, keep);
  newGame(cfg); G.story = sc.id; G.pendingEvents = []; derive();
  MapView.buildPaths([]); MapView.buildBase([]); MapView.dirty = true; MapView.rails = []; MapView.fronts = [];
}
const _hsSave = saveGame;
saveGame = function(){ if (G && G.story) return; return _hsSave.apply(this, arguments); };

function hsStart(id, from){
  const sc = HIST_SCENES.find(s => s.id === id); if (!sc) return;
  SFX.init && SFX.init(); closeModal(); closePopover && closePopover();
  HS.sc = sc; HS.i = 0; HS.fx = null; HS.misses = 0; HS.from = from || null; HS.card = {};
  hsBuildWorld(sc);
  hideAllScreens(); $('#hud').classList.add('hidden'); document.body.classList.remove('ingame'); document.body.classList.add('story');
  MapView.menuMode = false; MapView.placement = null; MapView.buildMode = null;
  MapView.onHover = null; MapView.onClick = (cell, x, y, lon, lat) => hsClick(lon, lat);
  MapView.resize(); MapView.fit();
  hsUI(); hsStep();
}
function hsExit(){
  HS.sc = null; HS.fx = null; G = null;
  ['story-panel','story-card'].forEach(id => { const e = document.getElementById(id); if (e) e.remove(); });
  document.body.classList.remove('story'); MapView.onClick = null;
  showMenu();
  if (HS.from === 'ency' && typeof openEncyclopedia === 'function') setTimeout(() => openEncyclopedia('modohistoria'), 80);
}

function hsUI(){
  if (!document.getElementById('story-style')) document.head.insertAdjacentHTML('beforeend', `<style id="story-style">
    #story-panel{position:fixed;right:14px;top:14px;bottom:14px;width:min(400px,46vw);z-index:60;display:flex;flex-direction:column;background:var(--paper,#f3e6c4);border:2px solid var(--ink2,#5a3d1e);border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.45);overflow:hidden}
    #story-panel .sp-head{padding:10px 14px;background:linear-gradient(#5a1a12,#3d0f0a);color:#f3e6c4}
    #story-panel .sp-head small{opacity:.8;display:block;font-style:italic}
    #story-panel .sp-head b{font-family:var(--title,'Cinzel'),serif;font-size:19px;letter-spacing:.5px}
    #story-panel .sp-body{flex:1;overflow:auto;padding:12px 16px;font-size:15.5px;line-height:1.5}
    #story-panel .sp-body h3{margin:0 0 6px;font-family:var(--title,'Cinzel'),serif;color:#7a1b14;font-size:17px}
    #story-panel .sp-body p{margin:0 0 9px}
    #story-panel .sp-act{margin:10px 0;padding:10px;border:2px dashed #b3261e;border-radius:8px;background:rgba(179,38,30,.07);font-weight:700}
    #story-panel .sp-foot{display:flex;gap:6px;align-items:center;padding:8px 12px;border-top:1px solid rgba(90,61,30,.3)}
    #story-panel .sp-dots{flex:1;display:flex;gap:4px;flex-wrap:wrap}#story-panel .sp-dots i{width:9px;height:9px;border-radius:50%;background:#cdbb92}#story-panel .sp-dots i.on{background:#8b1a1a}#story-panel .sp-dots i.done{background:#5a3d1e}
    #story-panel .quiz button{display:block;width:100%;text-align:left;margin:5px 0}
    #story-card{position:fixed;left:14px;top:14px;width:min(330px,40vw);z-index:59;background:rgba(243,230,196,.97);border:2px solid #5a3d1e;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.4);padding:10px 12px;font-size:14px}
    #story-card .sc-h{display:flex;gap:10px;align-items:center;margin-bottom:6px}#story-card .sc-h b{font-family:var(--title,'Cinzel'),serif;font-size:16px;display:block}
    #story-card .sc-r{display:flex;justify-content:space-between;gap:8px;padding:3px 0;border-bottom:1px dotted rgba(90,61,30,.3)}
    #story-card .sc-r .v{font-weight:700;text-align:right}#story-card .up{color:#2d6a2d}#story-card .down{color:#a3322a}
    #story-card .sc-note{font-size:11.5px;font-style:italic;opacity:.75;margin-top:4px}
    body.story #tb, body.story #hud{display:none!important}
    @media (max-width:760px){#story-panel{left:8px;right:8px;top:auto;height:52vh;width:auto}#story-card{width:auto;right:8px;font-size:12.5px}}
  </style>`);
  document.body.insertAdjacentHTML('beforeend', `<div id="story-panel"><div class="sp-head"><small>🎬 Modo História · ${esc(HS.sc.year)}</small><b>${esc(HS.sc.title)}</b></div><div class="sp-body" id="sp-body"></div>
    <div class="sp-foot"><button class="btn sm" id="sp-back">◀</button><div class="sp-dots" id="sp-dots"></div><button class="btn sm" id="sp-exit">✖ Sair</button><button class="btn sm green" id="sp-next">Próximo ▶</button></div></div>
    <div id="story-card" style="display:none"></div>`);
  $('#sp-exit').onclick = () => { SFX.click(); hsExit(); };
  $('#sp-back').onclick = () => { if (HS.busy || HS.i === 0) return; SFX.page(); HS.i--; hsStep(true); };
  $('#sp-next').onclick = () => { if (HS.busy) return; const st = HS.sc.steps[HS.i]; if (st.act && !st._done){ SFX.error(); toast('👉 Faça a ação no mapa primeiro (ou use "Mostrar onde").', 'bad'); return; } if (HS.i < HS.sc.steps.length - 1){ SFX.page(); HS.i++; hsStep(); } else hsExit(); };
}

// ficha do país: números antes → depois
function hsCard(key, phase){
  const el = $('#story-card'); if (!el) return;
  const cd = key && HS.sc.cards[key]; if (!cd){ el.style.display = 'none'; return; }
  el.style.display = '';
  const after = phase === 'after';
  el.innerHTML = `<div class="sc-h">${cd.flag ? '<canvas width="66" height="44" id="sc-flag" style="border:1px solid #5a3d1e"></canvas>' : `<div style="font-size:38px">${cd.icon || '🏳️'}</div>`}
    <div><b>${esc(cd.name)}</b><small>${esc(cd.leader || '')}</small></div></div>
    ${cd.rows.map((r, i) => { const [l, b, a, good] = r; const changed = after && a !== undefined && a !== b;
      const cls = !changed ? '' : (typeof good === 'number' ? ((typeof a === 'number' && typeof b === 'number' ? (a > b ? 1 : -1) : 1) * good > 0 ? 'up' : 'down') : '');
      return `<div class="sc-r"><span>${l}</span><span class="v ${cls}" data-scv="${i}">${hsFmt(after && a !== undefined ? a : b)}${changed && typeof a !== 'number' ? '' : ''}</span></div>`; }).join('')}
    <div class="sc-note">${after ? '🔴 Depois do acontecimento' : '⚪ Antes do acontecimento'} · valores aproximados${cd.note ? ' · ' + esc(cd.note) : ''}</div>`;
  if (cd.flag){ const d = eraNations(HS.sc.era).find(x => x.name === cd.flag); const f = d ? (eraNationFlag(d) || null) : (cd.flagObj || null); if (f) drawFlag($('#sc-flag').getContext('2d'), f, 0, 0, 66, 44); }
  // contagem animada dos números
  if (after) cd.rows.forEach((r, i) => { const [, b, a] = r; if (typeof b !== 'number' || typeof a !== 'number' || a === b) return;
    const sp = el.querySelector(`[data-scv="${i}"]`), t0 = hsNow(), D = 1600;
    const tick = () => { if (!sp.isConnected) return; const k = Math.min(1, (hsNow() - t0)/D), e = 1 - Math.pow(1-k, 3); sp.textContent = hsFmt(b + (a - b)*e); if (k < 1) requestAnimationFrame(tick); else sp.textContent = hsFmt(a); };
    setTimeout(tick, 60); setTimeout(() => { if (sp.isConnected) sp.textContent = hsFmt(a); }, D + 200); });
}
function hsFmt(v){ if (typeof v !== 'number') return String(v); const a = Math.abs(v); return a >= 1e6 ? (v/1e6).toFixed(a >= 1e7 ? 0 : 1).replace('.', ',') + ' mi' : a >= 1000 ? Math.round(v).toLocaleString('pt-BR') : (Math.round(v*10)/10).toString().replace('.', ','); }

function hsStep(back){
  const sc = HS.sc, st = sc.steps[HS.i];
  HS.misses = 0; hsFx().pulse = null;
  $('#sp-dots').innerHTML = sc.steps.map((s, i) => `<i class="${i === HS.i ? 'on' : i < HS.i ? 'done' : ''}"></i>`).join('');
  $('#sp-back').disabled = HS.i === 0;
  $('#sp-next').textContent = HS.i === sc.steps.length - 1 ? '✔ Concluir' : 'Próximo ▶';
  if (st.cam) F.cam(st.cam[0], st.cam[1], st.cam[2]);
  if (st.fx && !back) st.fx(F);
  hsCard(st.card, st.phase);
  let html = `${st.title ? `<h3>${st.title}</h3>` : ''}${st.text || ''}`;
  if (st.act) html += `<div class="sp-act">👉 ${st.act.prompt}</div><button class="btn xs" id="sp-hint">📍 Mostrar onde</button>`;
  if (st.quiz) html += `<div class="quiz"><p><b>❓ ${st.quiz.q}</b></p>${st.quiz.o.map((o, i) => `<button class="btn sm" data-qz="${i}">${String.fromCharCode(65+i)}) ${o}</button>`).join('')}<div id="qz-r"></div></div>`;
  if (st.choice) html += `<div class="quiz">${st.choice.map((o, i) => `<button class="btn sm" data-ch="${i}">${o.t}</button>`).join('')}<div id="ch-r"></div></div>`;
  $('#sp-body').innerHTML = html; $('#sp-body').scrollTop = 0;
  const hb = $('#sp-hint'); if (hb) hb.onclick = () => { SFX.click(); hsFx().pulse = {lon:st.act.lon, lat:st.act.lat, r:st.act.r}; F.cam(st.act.lon, st.act.lat, Math.max(MapView.cam.z, st.act.z || 3)); };
  $$('#sp-body [data-qz]').forEach(b => b.onclick = () => { const k = +b.dataset.qz, ok = k === st.quiz.a; ok ? SFX.fanfare() : SFX.error();
    $$('#sp-body [data-qz]').forEach((x, i) => { x.disabled = true; x.style.background = i === st.quiz.a ? '#cfe8c4' : i === k ? '#f2c4be' : ''; });
    $('#qz-r').innerHTML = `<p style="margin-top:8px">${ok ? '✅ <b>Isso mesmo!</b>' : '❌ <b>Não foi bem assim.</b>'} ${st.quiz.e}</p>`; });
  $$('#sp-body [data-ch]').forEach(b => b.onclick = () => { const o = st.choice[+b.dataset.ch]; SFX.page(); $$('#sp-body [data-ch]').forEach(x => x.disabled = true); $('#ch-r').innerHTML = `<p style="margin-top:8px">${o.r}</p>`; if (o.fx) o.fx(F); st._done = true; });
  if (st.act) st._done = false;
  if (st.choice) st._done = false;
}
function hsClick(lon, lat){
  if (!HS.sc || HS.busy) return;
  const st = HS.sc.steps[HS.i]; if (!st.act || st._done) return;
  let dl = Math.abs(lon - st.act.lon); if (dl > 180) dl = 360 - dl;
  const d = st.act.lonOnly ? dl : Math.hypot(dl, lat - st.act.lat);
  if (d <= st.act.r){
    st._done = true; HS.busy = true; hsFx().pulse = null; SFX.click();
    st.act.do(F, lon, lat);
    setTimeout(() => { HS.busy = false; if (HS.sc && HS.sc.steps[HS.i] === st && HS.i < HS.sc.steps.length - 1){ HS.i++; hsStep(); } }, st.act.wait || 2600);
  } else {
    HS.misses++; SFX.error();
    toast(HS.misses >= 2 ? `📍 ${st.act.hint || 'Veja o círculo vermelho piscando.'}` : 'Ainda não é aí — tente de novo.', 'bad');
    if (HS.misses >= 2) hsFx().pulse = {lon:st.act.lon, lat:st.act.lat, r:st.act.r};
  }
}

// ---------------- cenários ----------------
const P = t => `<p>${t}</p>`;
const HIST_SCENES = [
// 1 ---------------------------------------------------------------
{ id:'tordesilhas', year:'1494', era:1500, world:'Reino de Portugal', icon:'📜', title:'O Tratado de Tordesilhas',
  sub:'Portugal e Castela dividem o "Novo Mundo" com uma linha no mapa',
  cards:{
    A:{name:'Reino de Portugal', flag:'Reino de Portugal', leader:'Rei Dom João II', rows:[['👥 População', 1000000, 1000000], ['🗺️ Terras reivindicadas na América', 'nenhuma', 'a leste da linha', 1], ['⛵ Rota para as Índias', 'pela África (em estudo)', 'garantida pela África', 1]]},
    B:{name:'Coroas de Castela e Aragão', flag:'Coroas de Castela e Aragão', leader:'Reis Católicos: Isabel e Fernando', rows:[['👥 População', 7000000, 7000000], ['🗺️ Terras reivindicadas na América', 'as de Colombo', 'quase toda a América', 1], ['🌊 Rota pela África', 'disputada', 'fica com Portugal', -1]]}
  },
  steps:[
    {cam:[-30, 10, 1.6], card:'A', phase:'before', title:'Um mundo para dois reinos',
     text:P('Em 1492, <b>Cristóvão Colombo</b>, navegando para os <b>Reis Católicos</b> (Isabel de Castela e Fernando de Aragão), chegou ao Caribe. Portugal, que há décadas explorava a costa da África, se sentiu ameaçado: de quem seriam as novas terras?') + P('Em 1493 o papa <b>Alexandre VI</b> publicou a bula <i>Inter Caetera</i>, com uma linha a 100 léguas das ilhas de Cabo Verde. O rei português <b>Dom João II</b> não aceitou e negociou direto com os espanhóis.')},
    {cam:[-35, -5, 2], card:'A', phase:'before', title:'Trace a linha',
     text:P('Em 7 de junho de 1494, na cidadezinha de <b>Tordesilhas</b> (Castela), os dois reinos combinaram: a linha passaria <b>370 léguas a oeste do arquipélago de Cabo Verde</b>. O que ficasse a leste seria de Portugal; a oeste, de Castela.'),
     fx:F => { F.marker(-23.6, 15.1, '🏝️', 'Cabo Verde'); },
     act:{prompt:'Clique no mapa onde passa a linha de 370 léguas a oeste de Cabo Verde (ela corta o atual Brasil).', lon:-46.6, lat:-10, r:6, lonOnly:true, hint:'A linha fica por volta de 46° de longitude oeste: do Pará até Santa Catarina.',
       do:F => { F.line([[-46.6, 75], [-46.6, -62]], '#8b1a1a', 3, true, 1600); F.marker(-48.5, -1.45, '📍', 'Belém'); F.marker(-48.78, -28.48, '📍', 'Laguna (SC)');
         F.overlay(hsBoxCells(-46.6, -60, -28, 15), '#1f6f3a', 'Portugal', 0.35); F.overlay(hsBoxCells(-170, -60, -46.6, 72), '#b8860b', 'Castela', 0.25); SFX.bell(); }}},
    {card:'A', phase:'after', title:'O que Portugal ganhou',
     text:P('Portugal garantiu a <b>rota pela África</b> até as Índias (que Vasco da Gama completaria em 1498) e, sem ainda saber, uma faixa do litoral da América do Sul: a do futuro <b>Brasil</b>, onde Cabral chegaria em 1500.') + P('Repare: a linha passava mais ou menos entre <b>Belém (PA)</b> e <b>Laguna (SC)</b>. Tudo a oeste disso — a Amazônia, o Centro-Oeste — era, no papel, espanhol.')},
    {card:'B', phase:'after', title:'E do lado de Castela',
     text:P('Os Reis Católicos ficaram com quase toda a América, onde depois existiriam os impérios espanhóis do México e do Peru (conquistando os <b>astecas</b> e os <b>incas</b>).') + P('Ninguém perguntou aos povos que já viviam nessas terras — milhões de pessoas, de centenas de povos diferentes. Para eles, o tratado era invisível, mas mudaria tudo.') + P('Outros reis também não aceitaram. O rei da França, <b>Francisco I</b>, teria ironizado que queria ver "o testamento de Adão" que dividia o mundo entre os dois.')},
    {cam:[-55, -15, 2.2], title:'Por que o Brasil é bem maior?',
     fx:F => { F.overlay(hsBoxCells(-74, -34, -46.6, 5, (i, lo, la) => !(lo < -70 && la < -10)), '#2d6a2d', 'Expansão (bandeirantes, Madri 1750)', 0.35); },
     text:P('Nos séculos seguintes, <b>bandeirantes</b>, missionários e criadores de gado avançaram para o oeste, muito além da linha. Em 1750, o <b>Tratado de Madri</b> — negociado por <b>Alexandre de Gusmão</b> — trocou Tordesilhas pelo princípio do <i>uti possidetis</i>: "quem ocupa, fica com a terra".') + P('Por isso o Brasil de hoje tem fronteiras parecidas com as de 1750, e não com a linha de 1494.')},
    {title:'Pergunta para a turma',
     quiz:{q:'Por que o território brasileiro é muito maior do que a parte portuguesa de Tordesilhas?', o:['Portugal comprou as terras da Espanha', 'A ocupação para o oeste e o Tratado de Madri (1750), com o uti possidetis', 'O papa apagou a linha em 1500'], a:1,
       e:'O Tratado de Madri reconheceu como portuguesas as terras que os portugueses já ocupavam — o uti possidetis.'}}
  ]},
// 2 ---------------------------------------------------------------
{ id:'vasco', year:'1498', era:1500, world:'Reino de Portugal', icon:'⛵', title:'Vasco da Gama chega à Índia',
  sub:'A primeira rota marítima da Europa até a Ásia',
  cards:{
    A:{name:'Reino de Portugal', flag:'Reino de Portugal', leader:'Rei Dom Manuel I', rows:[['⛵ Navios na expedição', 4, 2, -1], ['🧑‍✈️ Tripulantes', 170, 55, -1], ['🌶️ Comércio direto de especiarias', 'não', 'sim', 1], ['💰 Riqueza da Coroa', 'média', 'em alta', 1]], note:'número de tripulantes: estimativa'},
    B:{name:'Calicute (Índia)', icon:'🌶️', leader:'Samorim (governante de Calicute)', rows:[['🚢 Mercadores árabes e indianos', 'controlam o comércio', 'ganham concorrentes armados', -1], ['🏰 Presença europeia', 'nenhuma', 'começa', -1]]}
  },
  steps:[
    {cam:[-5, 25, 1.6], card:'A', phase:'before', title:'O caminho das especiarias',
     text:P('Pimenta, cravo, canela e noz-moscada valiam fortunas na Europa. Mas elas vinham da Ásia por terra e pelo Mediterrâneo, passando por muitos intermediários (venezianos, árabes, otomanos), e o preço subia a cada mão.') + P('Em 1488, <b>Bartolomeu Dias</b> contornou o sul da África. Dez anos depois, o rei <b>Dom Manuel I</b> mandou <b>Vasco da Gama</b> terminar o caminho.')},
    {cam:[0, -10, 1.4], card:'A', phase:'before', title:'Contorne a África',
     text:P('Em 8 de julho de 1497, quatro navios — <i>São Gabriel</i>, <i>São Rafael</i>, <i>Bérrio</i> e um navio de mantimentos — partiram de Lisboa com cerca de 170 homens. Para aproveitar os ventos, fizeram uma grande curva pelo Atlântico Sul (a "volta do mar").'),
     fx:F => { F.marker(-9.14, 38.7, '⚓', 'Lisboa'); },
     act:{prompt:'Leve a frota até o extremo sul da África: clique no Cabo da Boa Esperança.', lon:18.5, lat:-34.3, r:5, hint:'É a ponta sul da África do Sul.',
       do:F => { F.ship([[-9.14, 38.7], [-16, 28], [-23.6, 15], [-20, 0], [-25, -20], [-10, -33], [18.5, -34.4]], 2600, '⛵'); F.marker(18.5, -34.3, '🌊', 'Cabo da Boa Esperança'); }, wait:2900}},
    {cam:[55, 0, 1.8], card:'A', phase:'before', title:'Atravesse o Oceano Índico',
     text:P('Subindo a costa leste da África, a frota parou em <b>Melinde</b> (no atual Quênia), onde contratou um <b>piloto local</b> experiente que conhecia os ventos de monção do Índico.'),
     act:{prompt:'Atravesse o Índico até a costa da Índia: clique em Calicute.', lon:75.78, lat:11.25, r:5, hint:'Calicute fica na costa sudoeste da Índia.',
       do:F => { F.ship([[18.5, -34.4], [32, -28], [40.6, -15], [40.1, -3.2], [55, 5], [75.78, 11.25]], 2600, '⛵'); F.marker(40.1, -3.2, '🧭', 'Melinde'); F.marker(75.78, 11.25, '🌶️', 'Calicute'); }, wait:2900}},
    {card:'A', phase:'after', title:'Chegada: 20 de maio de 1498',
     text:P('Vasco da Gama chegou a <b>Calicute</b>, governada pelo <b>Samorim</b>. Os presentes portugueses foram considerados pobres, e a negociação foi difícil — mas ele voltou com especiarias.') + P('O preço foi alto: na volta, o escorbuto (falta de vitamina C) matou boa parte da tripulação. Só 2 navios e algumas dezenas de homens chegaram a Lisboa em 1499. Ainda assim, a carga pagou a viagem muitas vezes.')},
    {card:'B', phase:'after', title:'Do lado da Índia',
     text:P('Para os comerciantes do Índico, a chegada dos portugueses não trouxe só concorrência: eles vinham com canhões. Em 1500 Cabral bombardeou Calicute, e em 1510 <b>Afonso de Albuquerque</b> conquistou <b>Goa</b>, que ficou portuguesa até 1961.') + P('Começava a era dos impérios marítimos europeus na Ásia.')},
    {title:'Pergunta para a turma',
     quiz:{q:'Por que a rota de Vasco da Gama era tão valiosa?', o:['Porque era a mais curta da história', 'Porque levava às especiarias pelo mar, sem os intermediários do caminho terrestre', 'Porque descobriu o Brasil'], a:1,
       e:'Comprando direto na Índia e trazendo tudo por mar, Portugal escapava dos intermediários do Mediterrâneo — e lucrava muito mais.'}}
  ]},
// 3 ---------------------------------------------------------------
{ id:'cabral', year:'1500', era:1500, world:'Reino de Portugal', icon:'🏝️', title:'Cabral chega ao Brasil',
  sub:'A frota que ia para a Índia avista o Monte Pascoal',
  cards:{
    A:{name:'Reino de Portugal', flag:'Reino de Portugal', leader:'Rei Dom Manuel I', rows:[['🗺️ Terras na América', 'nenhuma', 'Terra de Vera Cruz', 1], ['🌳 Novo produto', '—', 'pau-brasil (tinta vermelha)', 1], ['⛵ Navios de Cabral', 13, 13]]},
    B:{name:'Povos indígenas do Brasil', icon:'🪶', leader:'Tupiniquins, Tupinambás, Guaranis e centenas de outros povos', rows:[['👥 População (estimativa)', 3000000, 1690000, 1], ['🗣️ Línguas faladas (estimativa)', 1000, 274, 1], ['🏞️ Terras', 'todo o território', 'cerca de 14% (terras indígenas hoje)', 1]], note:'1500: estimativas variam de 1 a 5 milhões; hoje: Censo 2022 e 2010'}
  },
  steps:[
    {cam:[-25, 10, 1.6], card:'A', phase:'before', title:'Rumo à Índia... pelo oeste?',
     text:P('Em 9 de março de 1500, <b>Pedro Álvares Cabral</b> saiu de Lisboa com <b>13 navios</b> e cerca de 1.200 a 1.500 homens. O destino oficial era a Índia, seguindo a rota de Vasco da Gama.') + P('Para pegar bons ventos, a frota se afastou muito da costa da África — tanto que, no dia 22 de abril, os marinheiros avistaram um monte a oeste.')},
    {cam:[-30, -5, 2], card:'A', phase:'before', title:'Terra à vista!',
     fx:F => { F.marker(-9.14, 38.7, '⚓', 'Lisboa'); F.ship([[-9.14, 38.7], [-16, 28], [-23.6, 15], [-28, 0]], 2200, '⛵'); },
     text:P('A frota atravessa o Atlântico. Para onde ela foi?'),
     act:{prompt:'Clique onde a frota avistou terra: o Monte Pascoal, no sul da Bahia.', lon:-39.4, lat:-16.9, r:4, hint:'Fica no litoral do sul da Bahia, perto de Porto Seguro.',
       do:F => { F.ship([[-28, 0], [-34, -12], [-39.0, -16.6]], 1800, '⛵'); F.marker(-39.4, -16.9, '⛰️', 'Monte Pascoal'); F.marker(-39.06, -16.45, '✝️', 'Porto Seguro');
         setTimeout(() => F.overlay(hsBoxCells(-41, -18, -38.9, -14), '#1f6f3a', '', 0.55), 1900); SFX.bell(); }, wait:3000}},
    {cam:[-39, -16.5, 4], card:'A', phase:'after', title:'22 de abril de 1500',
     text:P('Os portugueses chamaram a terra de <b>Ilha de Vera Cruz</b> (depois, Terra de Santa Cruz). No dia 26, frei <b>Henrique de Coimbra</b> celebrou a primeira missa.') + P('O escrivão <b>Pero Vaz de Caminha</b> escreveu ao rei uma longa carta descrevendo a terra e os povos que encontraram — ela é chamada de "certidão de nascimento" do Brasil. Ele contou que os indígenas eram curiosos, hospitaleiros e trocaram objetos com os portugueses.') + P('Nas décadas seguintes, o interesse foi o <b>pau-brasil</b>, árvore que dava tinta vermelha e acabou dando nome ao país.')},
    {cam:[-50, -12, 1.8], card:'B', phase:'after', title:'Do lado dos povos indígenas',
     fx:F => { F.overlay(hsBoxCells(-74, -34, -34, 5), '#8b4513', 'Terras dos povos indígenas em 1500', 0.25); },
     text:P('A terra não estava vazia: viviam aqui <b>milhões de pessoas</b>, de centenas de povos, com línguas, culturas e conhecimentos próprios. O primeiro contato, em Porto Seguro, foi com os <b>Tupiniquins</b>.') + P('A colonização trouxe <b>doenças</b> para as quais eles não tinham defesa (varíola, sarampo, gripe), <b>escravização</b>, guerras e a perda das terras. A população indígena caiu drasticamente nos séculos seguintes.') + P('Hoje, o Censo de 2022 contou cerca de <b>1,7 milhão</b> de indígenas no Brasil, de mais de 300 povos, falando cerca de 274 línguas — uma riqueza que resiste.')},
    {title:'Pergunta para a turma',
     quiz:{q:'Por que a carta de Pero Vaz de Caminha é tão importante?', o:['Porque é o primeiro registro escrito sobre a terra e os povos que viviam aqui', 'Porque foi o tratado que dividiu o Brasil', 'Porque proclamou a independência'], a:0,
       e:'A carta descreve em detalhes a chegada, a natureza e os indígenas — por isso é chamada de "certidão de nascimento" do Brasil.'}}
  ]},
// 4 ---------------------------------------------------------------
{ id:'familia_real', year:'1808', era:1700, world:'Império Português', icon:'👑', title:'A família real vem para o Brasil',
  sub:'Fugindo de Napoleão, a corte portuguesa atravessa o Atlântico',
  cards:{
    A:{name:'Portugal', flag:'Império Português', leader:'Príncipe regente Dom João (futuro D. João VI)', rows:[['🏛️ Capital do império', 'Lisboa', 'Rio de Janeiro', 0], ['⚔️ Situação', 'ameaçado por Napoleão', 'ocupado pelos franceses', -1]]},
    B:{name:'Brasil (colônia)', icon:'🌴', leader:'Vice-rei → a própria corte', rows:[['⚓ Portos', 'só para Portugal', 'abertos às nações amigas', 1], ['🏦 Banco', 'nenhum', 'Banco do Brasil (1808)', 1], ['📰 Imprensa', 'proibida', 'Imprensa Régia (1808)', 1], ['👥 Rio de Janeiro (habitantes)', 60000, 100000, 1]], note:'população do Rio: estimativa para 1808 e c. 1820'}
  },
  steps:[
    {cam:[-5, 42, 3], card:'A', phase:'before', title:'Napoleão e o Bloqueio Continental',
     text:P('Em 1806, o imperador francês <b>Napoleão Bonaparte</b> proibiu os países da Europa de comerciar com a Inglaterra (o <b>Bloqueio Continental</b>). Portugal, velho aliado dos ingleses, não obedeceu.') + P('Em novembro de 1807, as tropas do general <b>Junot</b> marcharam para Lisboa. O príncipe regente <b>Dom João</b> e a rainha <b>Dona Maria I</b> decidiram partir com a corte — talvez 10 a 15 mil pessoas — escoltados pela marinha britânica.')},
    {cam:[-25, 10, 1.6], card:'A', phase:'before', title:'A travessia',
     fx:F => { F.marker(-9.14, 38.7, '⚓', 'Lisboa'); F.arrow([2.35, 48.85], [-9.14, 38.7], '#1f3f8c'); F.text(-3, 42, 'Exército de Napoleão', '#1f3f8c'); },
     text:P('Em 29 de novembro de 1807 a frota zarpou, poucas horas antes de os franceses entrarem em Lisboa. A viagem durou quase dois meses, com navios lotados, falta de água e até piolhos.'),
     act:{prompt:'Leve a corte até o Brasil: clique em Salvador, a primeira parada.', lon:-38.5, lat:-12.97, r:4, hint:'Salvador fica no litoral da Bahia.',
       do:F => { F.ship([[-9.14, 38.7], [-16, 28], [-24, 12], [-32, -2], [-38.5, -12.97]], 2600, '⛵'); F.marker(-38.5, -12.97, '⚓', 'Salvador'); }, wait:2900}},
    {cam:[-40, -18, 3], card:'B', phase:'before', title:'Salvador: os portos se abrem',
     text:P('Em 22 de janeiro de 1808 a corte chegou a Salvador. Seis dias depois, Dom João assinou a <b>abertura dos portos às nações amigas</b>: o Brasil podia comerciar diretamente com outros países, principalmente a Inglaterra. Era o fim do monopólio colonial.'),
     act:{prompt:'Siga para a nova capital do império: clique no Rio de Janeiro.', lon:-43.2, lat:-22.9, r:3, hint:'O Rio fica no litoral sudeste.',
       do:F => { F.ship([[-38.5, -12.97], [-37.5, -18], [-40, -22.5], [-43.2, -22.95]], 2000, '⛵'); F.marker(-43.2, -22.9, '👑', 'Rio de Janeiro'); SFX.bell(); }, wait:2400}},
    {card:'B', phase:'after', title:'O Rio vira capital de um império',
     text:P('Em março de 1808 a corte se instalou no Rio. Em poucos anos surgiram o <b>Banco do Brasil</b>, a <b>Imprensa Régia</b> (o primeiro jornal impresso no país), a <b>Biblioteca Real</b>, o <b>Jardim Botânico</b> e escolas de medicina.') + P('Em 1815 o Brasil foi elevado a <b>Reino Unido de Portugal, Brasil e Algarves</b> — deixou, no papel, de ser colônia. Para dar lugar à corte, muitos moradores foram despejados de suas casas, marcadas com "P.R." (Príncipe Regente) — que o povo apelidou de "Ponha-se na Rua".')},
    {card:'A', phase:'after', title:'E Portugal?',
     text:P('Portugal foi ocupado pelos franceses e só se livrou deles com a ajuda inglesa. Governado de longe, o país viveu crise. Em 1820, a <b>Revolução do Porto</b> exigiu a volta do rei — Dom João VI voltou em 1821, deixando no Brasil seu filho, <b>Dom Pedro</b>. O resto da história você vê no cenário da Independência.')},
    {title:'Pergunta para a turma',
     quiz:{q:'Qual foi a primeira grande medida de Dom João ao chegar ao Brasil?', o:['A abolição da escravidão', 'A abertura dos portos às nações amigas', 'A proclamação da República'], a:1,
       e:'A abertura dos portos (28 de janeiro de 1808) acabou com o monopólio comercial de Portugal sobre o Brasil.'}}
  ]},
// 5 ---------------------------------------------------------------
{ id:'independencia', year:'1822', era:1700, world:'Império Português', icon:'🇧🇷', title:'A Independência do Brasil',
  sub:'"Independência ou Morte!" às margens do Ipiranga',
  cards:{
    A:{name:'Reino de Portugal', flag:'Império Português', leader:'Rei Dom João VI', rows:[['🗺️ Território na América', 'o Brasil inteiro', 'nenhum', -1], ['💰 Comércio com o Brasil', 'controlado por Lisboa', 'perdido', -1]]},
    B:{name:'Império do Brasil', icon:'🟩', leader:'Imperador Dom Pedro I', rows:[['🏛️ Situação', 'reino unido a Portugal', 'país independente', 1], ['👥 População (estimativa)', 4500000, 4500000], ['⛓️ Pessoas escravizadas (estimativa)', 'cerca de 1/3', 'cerca de 1/3 (abolição só em 1888)', -1]], note:'estimativas para a década de 1820'}
  },
  steps:[
    {cam:[-45, -15, 2], card:'A', phase:'before', title:'Portugal quer o Brasil de volta como colônia',
     fx:F => { F.overlay(hsNationCells('Império Português').filter(c => cellCenter(c)[0] < -30), '#1f4e8c', 'Domínio português', 0.3); },
     text:P('Depois da <b>Revolução do Porto</b> (1820), as Cortes de Lisboa exigiram a volta de Dom João VI e queriam devolver ao Brasil a condição de colônia.') + P('O príncipe <b>Dom Pedro</b> ficou como regente. Em 9 de janeiro de 1822, desobedeceu à ordem de voltar: o "<b>Dia do Fico</b>". Ao seu lado estavam <b>José Bonifácio</b>, o "Patriarca da Independência", e sua esposa, <b>Dona Maria Leopoldina</b>.')},
    {cam:[-46.6, -23.5, 4], card:'B', phase:'before', title:'7 de setembro de 1822',
     text:P('Enquanto Dom Pedro viajava a São Paulo, cartas de Lisboa chegaram ao Rio. Em 2 de setembro, <b>Leopoldina</b>, que presidia o Conselho de Estado, assinou o decreto recomendando a separação e mandou as cartas ao marido.') + P('Ele as recebeu no dia 7, perto do riacho Ipiranga.'),
     act:{prompt:'Clique em São Paulo, às margens do Ipiranga, onde Dom Pedro proclamou a independência.', lon:-46.61, lat:-23.58, r:2.5, z:4, hint:'O Ipiranga fica na cidade de São Paulo.',
       do:F => { F.ring(-46.61, -23.58, '#2d6a2d', 40); F.text(-46.61, -22.6, '"Independência ou Morte!"', '#2d6a2d'); SFX.fanfare();
         setTimeout(() => { F.cam(-50, -14, 1.8); F.overlay(hsNationCells('Império Português').filter(c => cellCenter(c)[0] < -30), '#1e7a32', 'Império do Brasil', 0.6); }, 1300); }, wait:3200}},
    {card:'B', phase:'after', title:'Nasce o Império do Brasil',
     text:P('Em 1º de dezembro de 1822, Dom Pedro foi coroado <b>Imperador Pedro I</b>. Diferente dos vizinhos hispânicos, que viraram repúblicas, o Brasil continuou monarquia — e unido num só país.') + P('A independência não foi só um grito: houve guerras contra tropas portuguesas, principalmente na <b>Bahia</b> (vitória em <b>2 de julho de 1823</b>, com heróis como <b>Maria Quitéria</b> e <b>Joana Angélica</b>), no Pará, no Maranhão e na Cisplatina.') + P('E houve um limite grande: a escravidão continuou. Só acabaria em 1888, com a Lei Áurea.')},
    {card:'A', phase:'after', title:'E Portugal?',
     text:P('Portugal só reconheceu a independência em <b>1825</b>, num tratado mediado pela Inglaterra — e o Brasil pagou uma indenização de cerca de <b>2 milhões de libras esterlinas</b>.') + P('Perder o Brasil, sua colônia mais rica, foi um golpe enorme na economia portuguesa.')},
    {title:'Pergunta para a turma',
     quiz:{q:'Quem assinou o decreto que levou à separação, enquanto Dom Pedro estava em viagem?', o:['José Bonifácio, sozinho', 'A princesa Maria Leopoldina, à frente do Conselho de Estado', 'O rei Dom João VI'], a:1,
       e:'Em 2 de setembro de 1822, Leopoldina presidiu o Conselho de Estado e assinou o decreto, mandando as cartas a Dom Pedro.'}}
  ]},
// 6 ---------------------------------------------------------------
{ id:'sarajevo', year:'1914', era:1914, world:'Áustria-Hungria', icon:'💥', title:'De Sarajevo à Primeira Guerra Mundial',
  sub:'Um atentado e o efeito dominó das alianças',
  cards:{
    A:{name:'Áustria-Hungria', flag:'Áustria-Hungria', leader:'Imperador Francisco José I', rows:[['👥 População', 52000000, 52000000], ['⚔️ Em guerra com', 'ninguém', 'Sérvia, Rússia, França, Reino Unido...', -1], ['🏛️ Futuro do império', '—', 'dissolvido em 1918', -1]]},
    B:{name:'Reino da Sérvia', flag:'Reino da Sérvia', leader:'Rei Pedro I', rows:[['👥 População', 4500000, 3700000, 1], ['⚔️ Situação', 'em paz', 'invadida', -1]], note:'perdas sérvias: as estimativas variam muito entre os historiadores'}
  },
  steps:[
    {cam:[15, 48, 2.6], card:'A', phase:'before', title:'Uma Europa dividida em alianças',
     fx:F => { F.overlay(hsNationCells('Império Alemão').concat(hsNationCells('Áustria-Hungria'), hsNationCells('Reino da Itália')), '#7a5c2e', 'Tríplice Aliança', 0.35);
       F.overlay(hsNationCells('França').concat(hsNationCells('Império Russo').filter(c => cellCenter(c)[0] < 45), hsNationCells('Reino Unido')), '#1f4e8c', 'Tríplice Entente', 0.3); },
     text:P('Em 1914 as grandes potências estavam divididas em dois blocos: a <b>Tríplice Aliança</b> (Alemanha, Áustria-Hungria e Itália) e a <b>Tríplice Entente</b> (França, Rússia e Reino Unido).') + P('Havia corrida armamentista, disputa por colônias e nacionalismos. Nos Bálcãs, a <b>Bósnia</b>, anexada pela Áustria-Hungria em 1908, era desejada pela <b>Sérvia</b>, aliada da Rússia.')},
    {cam:[18.4, 43.9, 5], card:'A', phase:'before', title:'28 de junho de 1914',
     text:P('O herdeiro do trono austro-húngaro, o arquiduque <b>Francisco Ferdinando</b>, e sua esposa <b>Sofia</b> visitavam Sarajevo. Um grupo de jovens nacionalistas (a "Jovem Bósnia") os esperava.'),
     act:{prompt:'Clique em Sarajevo, na Bósnia, onde aconteceu o atentado.', lon:18.41, lat:43.86, r:2, z:5, hint:'Sarajevo fica nos Bálcãs, entre a Croácia e a Sérvia.',
       do:F => { F.ring(18.41, 43.86, '#8b1a1a', 20); F.text(18.41, 44.6, 'Atentado', '#8b1a1a'); SFX.cannon && SFX.cannon(0); F.marker(18.41, 43.86, '🎯', 'Sarajevo'); }, wait:2000}},
    {cam:[18, 46, 3.5], card:'A', phase:'before', title:'Gavrilo Princip',
     text:P('Depois de uma primeira tentativa fracassada com uma bomba, o carro do arquiduque errou o caminho e parou perto de <b>Gavrilo Princip</b>, de 19 anos, que disparou. Francisco Ferdinando e Sofia morreram.') + P('A Áustria-Hungria culpou a Sérvia e mandou um <b>ultimato</b> com exigências duríssimas.'),
     act:{prompt:'Como Áustria-Hungria, declare guerra: clique na Sérvia (capital Belgrado).', lon:20.46, lat:44.8, r:2, z:4, hint:'Belgrado fica a leste de Sarajevo.',
       do:F => { F.arrow([16.37, 48.2], [20.46, 44.8], '#7a5c2e'); setTimeout(() => F.boom(20.46, 44.8), 1100); F.text(18.5, 47, '28 de julho: guerra à Sérvia', '#7a5c2e'); }, wait:2600}},
    {cam:[15, 50, 2.2], card:'A', phase:'before', title:'O efeito dominó',
     fx:F => { F.arrow([37.6, 55.75], [20.46, 44.8], '#1f4e8c'); setTimeout(() => F.arrow([13.4, 52.52], [37.6, 55.75], '#7a5c2e'), 900); setTimeout(() => F.arrow([13.4, 52.52], [2.35, 48.85], '#7a5c2e'), 1800); },
     text:P('Em poucos dias, as alianças arrastaram todos: a <b>Rússia</b> mobilizou o exército para defender a Sérvia; a <b>Alemanha</b> declarou guerra à Rússia (1º de agosto) e à <b>França</b> (3 de agosto).') + P('O plano alemão (o <b>Plano Schlieffen</b>) era derrotar a França rapidamente atravessando um país neutro.'),
     act:{prompt:'Siga o Plano Schlieffen: clique na Bélgica, o país neutro invadido pela Alemanha.', lon:4.35, lat:50.85, r:2, z:4, hint:'A Bélgica fica entre a França e a Alemanha.',
       do:F => { F.arrow([13.4, 52.52], [4.35, 50.85], '#7a5c2e'); setTimeout(() => F.boom(4.35, 50.85), 1100); setTimeout(() => F.arrow([-0.13, 51.5], [4.35, 50.85], '#1f4e8c'), 1500); F.text(1, 52.5, '4 de agosto: o Reino Unido entra na guerra', '#1f4e8c'); }, wait:3000}},
    {cam:[20, 48, 1.9], card:'A', phase:'after', title:'Uma guerra mundial',
     fx:F => { F.overlay(hsNationCells('Império Otomano'), '#7a5c2e', 'Impérios Centrais', 0.35); },
     text:P('A invasão da Bélgica levou o <b>Reino Unido</b> à guerra. Depois entraram o <b>Império Otomano</b> (ao lado da Alemanha), a <b>Itália</b> (que trocou de lado em 1915), os <b>Estados Unidos</b> (1917) e até o <b>Brasil</b> (1917, após ataques a navios brasileiros).') + P('A guerra de trincheiras, as metralhadoras, os gases venenosos e os primeiros tanques e aviões deixaram cerca de <b>17 milhões de mortos</b>, entre soldados e civis. Ela terminou em 11 de novembro de 1918.') + P('A Áustria-Hungria, o Império Alemão, o Império Russo e o Império Otomano deixaram de existir.')},
    {card:'B', phase:'after', title:'Do lado da Sérvia',
     text:P('A Sérvia resistiu às primeiras invasões, mas foi ocupada em 1915. O exército e milhares de civis fugiram a pé pelas montanhas da Albânia no inverno — a "Grande Retirada".') + P('Proporcionalmente, foi um dos países que mais perdeu gente na guerra — as estimativas variam, mas falam em uma parte muito grande da população, entre combates, fome e epidemias (como o tifo). Em 1918 a Sérvia se tornou o centro de um novo país: a <b>Iugoslávia</b>.')},
    {title:'Pergunta para a turma',
     quiz:{q:'Por que um atentado numa cidade dos Bálcãs virou uma guerra mundial?', o:['Porque Sarajevo era a capital da Europa', 'Por causa do sistema de alianças, que arrastou as potências uma após a outra', 'Porque Gavrilo Princip era alemão'], a:1,
       e:'As alianças transformaram um conflito entre Áustria-Hungria e Sérvia numa guerra entre os dois grandes blocos da Europa.'}}
  ]},
// 7 ---------------------------------------------------------------
{ id:'hiroshima', year:'1945', era:1914, world:'Estados Unidos', icon:'☢️', title:'Hiroshima e Nagasaki',
  sub:'As únicas bombas atômicas já usadas numa guerra',
  cards:{
    A:{name:'Estados Unidos', flag:'Estados Unidos', leader:'Presidente Harry S. Truman', rows:[['⚔️ Guerra no Pacífico', 'em andamento', 'encerrada (2 de setembro)', 1], ['😊 Aprovação de Truman', '87% (Gallup, jun/1945)', 'continua alta'], ['☢️ Bombas atômicas prontas', 2, 0], ['🌍 Monopólio nuclear', 'sim', 'até 1949 (URSS testa a sua)', 0]]},
    B:{name:'Império do Japão', flag:'Império do Japão', leader:'Imperador Hirohito · Premiê Kantarō Suzuki', rows:[['🏙️ Hiroshima: habitantes', 350000, 210000, 1], ['🏙️ Nagasaki: habitantes', 240000, 166000, 1], ['🏚️ Prédios destruídos em Hiroshima', '0%', '≈70%', -1], ['⚔️ Situação', 'em guerra', 'rendição (15 de agosto)', 0]], note:'mortes até o fim de 1945: ≈140 mil em Hiroshima e ≈74 mil em Nagasaki'}
  },
  steps:[
    {cam:[160, 30, 1.4], card:'A', phase:'before', title:'O fim da Segunda Guerra Mundial',
     text:P('Em maio de 1945 a Alemanha nazista se rendeu, mas a guerra no Pacífico continuava. Os Estados Unidos avançavam ilha por ilha (batalhas de <b>Iwo Jima</b> e <b>Okinawa</b>, com dezenas de milhares de mortos) e planejavam invadir o Japão.') + P('Em segredo, o <b>Projeto Manhattan</b>, liderado pelo físico <b>J. Robert Oppenheimer</b> e pelo general <b>Leslie Groves</b>, criou a bomba atômica. O primeiro teste, "Trinity", explodiu no deserto do Novo México em <b>16 de julho de 1945</b>.')},
    {cam:[133, 34, 3], card:'A', phase:'before', title:'A decisão',
     text:P('Em 26 de julho, a <b>Declaração de Potsdam</b> exigiu a rendição incondicional do Japão, sob ameaça de "destruição imediata e total". O governo japonês não aceitou.') + P('O presidente <b>Harry Truman</b> autorizou o uso da bomba. Até hoje os historiadores debatem se ela era necessária para encerrar a guerra.') + P('Em <b>6 de agosto de 1945</b>, o bombardeiro B-29 <i>Enola Gay</i>, pilotado pelo coronel <b>Paul Tibbets</b>, decolou da ilha de Tinian levando a bomba "<b>Little Boy</b>".'),
     act:{prompt:'Clique em Hiroshima, no sul da ilha de Honshu, o alvo do Enola Gay.', lon:132.45, lat:34.39, r:2, z:4, hint:'Hiroshima fica no sudoeste do Japão, na ilha principal (Honshu).',
       do:F => { F.plane([145.6, 15], [132.45, 34.39]); setTimeout(() => { F.nuke(132.45, 34.39); F.circle(132.45, 34.39, 0.6, '#b3261e', 'rgba(179,38,30,0.25)'); F.text(132.45, 35.3, '6/8/1945 · 8h15', '#8b1a1a'); }, 2300); }, wait:4800}},
    {card:'A', phase:'after', title:'No lado de quem lançou a bomba',
     text:P('A bomba explodiu a cerca de 600 metros de altura, com força equivalente a cerca de <b>15 mil toneladas de TNT</b>. Truman anunciou ao mundo: "uma bomba atômica... é o poder básico do universo".') + P('Para a população americana, cansada da guerra, a notícia foi recebida como o caminho para o fim do conflito — em junho de 1945, 87% aprovavam Truman (Gallup). Mas cientistas do próprio Projeto Manhattan, como <b>Leó Szilárd</b>, já tinham pedido que a bomba não fosse usada contra cidades.')},
    {cam:[132.45, 34.39, 6], card:'B', phase:'before', title:'Agora, do lado de Hiroshima',
     fx:F => { setTimeout(() => F.nuke(132.45, 34.39), 400); },
     text:P('Veja de novo, agora do chão. Às 8h15 da manhã, as pessoas iam para o trabalho e as crianças para a escola.') + P('Num clarão mais quente que a superfície do Sol, quase tudo num raio de cerca de 1,6 km foi destruído e incendiado. Dezenas de milhares morreram na hora. Depois veio a "<b>chuva negra</b>", carregada de fuligem radioativa.')},
    {card:'B', phase:'after', title:'As consequências em Hiroshima',
     text:P('Até o fim de 1945, cerca de <b>140 mil pessoas</b> tinham morrido, por queimaduras, ferimentos e pela <b>doença da radiação</b>. Cerca de 70% dos prédios foram destruídos.') + P('Os sobreviventes, chamados <b>hibakusha</b>, sofreram por décadas com câncer e com o preconceito. A menina <b>Sadako Sasaki</b>, que tinha 2 anos na explosão, ficou doente de leucemia aos 12 e dobrou centenas de tsurus de papel esperando a cura — virou símbolo mundial da paz.')},
    {cam:[131, 33.5, 3.5], card:'B', phase:'after', title:'9 de agosto: Nagasaki',
     text:P('O Japão ainda não tinha se rendido. Em 8 de agosto a <b>União Soviética</b> declarou guerra ao Japão. No dia 9, o B-29 <i>Bockscar</i>, pilotado pelo major <b>Charles Sweeney</b>, levou a bomba de plutônio "<b>Fat Man</b>".') + P('O alvo principal (Kokura) estava encoberto por nuvens e fumaça, e o avião seguiu para o alvo reserva.'),
     act:{prompt:'Clique em Nagasaki, na ilha de Kyushu.', lon:129.87, lat:32.75, r:1.8, z:4, hint:'Nagasaki fica na costa oeste de Kyushu, a ilha ao sul.',
       do:F => { F.plane([145.6, 15], [129.87, 32.75]); setTimeout(() => { F.nuke(129.87, 32.75); F.circle(129.87, 32.75, 0.6, '#b3261e', 'rgba(179,38,30,0.25)'); F.text(129.87, 33.6, '9/8/1945 · 11h02', '#8b1a1a'); }, 2300); }, wait:4800}},
    {card:'B', phase:'after', title:'A rendição',
     text:P('Em Nagasaki, cerca de <b>74 mil pessoas</b> morreram até o fim de 1945. Em 15 de agosto, o imperador <b>Hirohito</b> falou pela primeira vez no rádio ao povo e anunciou a rendição. Ela foi assinada em <b>2 de setembro de 1945</b>, no navio <i>USS Missouri</i>: era o fim da Segunda Guerra Mundial.')},
    {cam:[132.45, 34.39, 4], card:'B', phase:'after', title:'Hiroshima ficou inabitável? Não.',
     fx:F => { F.marker(132.45, 34.39, '🕊️', 'Hiroshima hoje: ≈1,2 milhão de habitantes'); },
     text:P('É um engano comum. Como as bombas explodiram <b>no ar</b>, a maior parte da radiação se dissipou em poucos dias ou semanas. As cidades foram reconstruídas: Hiroshima tem hoje cerca de <b>1,2 milhão</b> de habitantes.') + P('As ruínas do antigo Pavilhão de Exposições — o <b>Domo da Bomba Atômica</b> — foram preservadas e são Patrimônio da Humanidade (UNESCO, 1996). Lugares que ficaram inabitáveis são outra história: veja o cenário de <b>Chernobyl</b> (1986).') + P('Desde 1945, nenhuma arma nuclear foi usada numa guerra. Mas a corrida nuclear começou: a URSS testou sua bomba em 1949.')},
    {title:'Pergunta para a turma',
     quiz:{q:'Por que Hiroshima pôde ser reconstruída, enquanto a região de Chernobyl continua isolada?', o:['Porque a bomba de Hiroshima não tinha radiação', 'Porque a bomba explodiu no ar e a radiação se dissipou rápido; em Chernobyl o reator espalhou material radioativo de longa duração', 'Porque os japoneses limparam toda a radiação em um dia'], a:1,
       e:'A explosão aérea deixou pouca contaminação duradoura no solo. Em Chernobyl, toneladas de material radioativo do reator ficaram no ambiente por décadas.'}}
  ]},
// 8 ---------------------------------------------------------------
{ id:'cuba', year:'1962', era:1960, world:'União Soviética', icon:'🚀', title:'A Crise dos Mísseis de Cuba',
  sub:'13 dias em que o mundo esteve à beira de uma guerra nuclear',
  cards:{
    A:{name:'União Soviética', flag:'União Soviética', leader:'Nikita Khrushchev', rows:[['🚀 Mísseis em Cuba', 0, 0], ['🇹🇷 Mísseis dos EUA na Turquia', 'apontados para a URSS', 'retirados (1963)', 1], ['☎️ Linha direta com Washington', 'não', 'sim (1963)', 1]]},
    B:{name:'Estados Unidos', icon:'🇺🇸', leader:'Presidente John F. Kennedy', rows:[['🎯 Cidades ao alcance de mísseis em Cuba', 'nenhuma', 'quase todo o leste dos EUA', -1], ['🚢 Bloqueio naval de Cuba', 'não', 'sim (24 de outubro)', 0], ['🤝 Promessa', '—', 'não invadir Cuba', 0]]}
  },
  steps:[
    {cam:[-60, 30, 1.6], card:'A', phase:'before', title:'A Guerra Fria',
     text:P('Depois da Segunda Guerra, <b>Estados Unidos</b> e <b>União Soviética</b> disputavam o mundo sem se enfrentar diretamente: a <b>Guerra Fria</b>. Os dois tinham bombas nucleares.') + P('Em 1959, a revolução de <b>Fidel Castro</b> tomou o poder em Cuba, a 150 km da Flórida, e se aproximou da URSS. Em 1961, os EUA apoiaram uma invasão fracassada à ilha (a Baía dos Porcos). E os EUA tinham mísseis na Turquia, perto da URSS.')},
    {cam:[-80, 22, 3], card:'A', phase:'before', title:'Operação Anadyr',
     text:P('O líder soviético <b>Nikita Khrushchev</b> decidiu, em segredo, instalar mísseis nucleares em Cuba: proteger o aliado e responder aos mísseis americanos na Turquia.'),
     act:{prompt:'Como União Soviética, instale os mísseis: clique em Cuba.', lon:-79.5, lat:22, r:3.5, z:3, hint:'Cuba é a grande ilha ao sul da Flórida.',
       do:F => { F.missile([37.6, 55.75], [-79.5, 22]); F.marker(-82.4, 23.1, '🚀', 'Mísseis soviéticos'); setTimeout(() => { F.circle(-80, 22.5, 18, '#b3261e', 'rgba(179,38,30,0.08)'); F.marker(-77.04, 38.9, '🎯', 'Washington'); F.cam(-82, 30, 1.9); }, 1600); }, wait:3400}},
    {card:'B', phase:'before', title:'14 de outubro: as fotos do avião espião',
     text:P('Um avião espião americano U-2 fotografou as bases. Em 16 de outubro, <b>John F. Kennedy</b> viu as fotos. Os mísseis de médio alcance (≈2.000 km, o círculo vermelho) alcançariam <b>Washington</b>, Miami e boa parte do leste dos EUA em minutos.') + P('Os militares queriam bombardear Cuba. Kennedy escolheu outro caminho e anunciou, em 22 de outubro, na TV:'),
     act:{prompt:'Como Estados Unidos, declare a "quarentena": clique no mar ao redor de Cuba para cercá-la com navios.', lon:-76, lat:24, r:7, z:2.5, hint:'Clique no mar perto de Cuba.',
       do:F => { F.circle(-79.5, 22, 6, '#1f4e8c', null); for (let a=0; a<6; a++){ const t = a/6*Math.PI*2; F.marker(-79.5 + Math.cos(t)*6, 22 + Math.sin(t)*6, '🚢', ''); } F.text(-79.5, 29, 'Quarentena naval', '#1f4e8c'); }, wait:2600}},
    {card:'A', phase:'before', title:'27 de outubro: o "Sábado Negro"',
     text:P('Navios soviéticos se aproximavam do bloqueio. Um U-2 foi derrubado sobre Cuba e seu piloto, o major <b>Rudolf Anderson</b>, morreu. Perto do bloqueio, o submarino soviético B-59, atacado com cargas de profundidade, quase lançou um torpedo nuclear — o oficial <b>Vasili Arkhipov</b> se recusou a autorizar.') + P('E se você fosse Khrushchev?'),
     choice:[
       {t:'🤝 Negociar: retirar os mísseis em troca de garantias', r:'Foi o que aconteceu. Em 28 de outubro, Khrushchev anunciou a retirada. Em troca, Kennedy prometeu não invadir Cuba e, em segredo, retirou os mísseis Júpiter da Turquia (1963).', fx:F => { F.arrow([-79.5, 22], [37.6, 55.75], '#2d6a2d'); }},
       {t:'🚀 Manter os mísseis e enfrentar o bloqueio', r:'Na história real isso NÃO aconteceu — e ainda bem. Os planos militares previam bombardeios e invasão de Cuba, e a escalada poderia levar a uma guerra nuclear com dezenas de milhões de mortos. Por isso os dois líderes negociaram.', fx:F => { F.boom(-79.5, 22, true); }}
     ]},
    {card:'A', phase:'after', title:'Depois dos 13 dias',
     text:P('Os dois lados perceberam como tinham chegado perto da catástrofe. Em 1963 foi criada a <b>linha direta</b> ("telefone vermelho") entre Moscou e Washington, e assinado o <b>Tratado de Proibição Parcial de Testes Nucleares</b>.') + P('Khrushchev, visto como derrotado por parte da cúpula soviética, foi afastado do poder em 1964.')},
    {card:'B', phase:'after', title:'Do lado dos Estados Unidos',
     text:P('Kennedy saiu fortalecido aos olhos do público, que não sabia do acordo secreto sobre a Turquia. Cuba continuou socialista e aliada da URSS, e os EUA mantiveram um embargo econômico à ilha que dura até hoje.')},
    {title:'Pergunta para a turma',
     quiz:{q:'Como a Crise dos Mísseis terminou?', o:['Com a invasão de Cuba pelos EUA', 'Com um acordo: a URSS retirou os mísseis de Cuba e os EUA prometeram não invadir a ilha (e tiraram mísseis da Turquia)', 'Com uma guerra nuclear limitada'], a:1,
       e:'A negociação entre Kennedy e Khrushchev evitou a guerra. Parte do acordo (a Turquia) ficou em segredo por anos.'}}
  ]},
// 9 ---------------------------------------------------------------
{ id:'chernobyl', year:'1986', era:1960, world:'União Soviética', icon:'☢️', title:'O desastre de Chernobyl',
  sub:'O pior acidente nuclear da história',
  cards:{
    A:{name:'União Soviética', flag:'União Soviética', leader:'Mikhail Gorbachev', rows:[['🏙️ Pripyat: habitantes', 49000, 0, 1], ['🚷 Zona de exclusão', 'não', 'raio de 30 km', -1], ['👷 "Liquidadores" mobilizados', 0, 600000, 0], ['🗞️ Glasnost (transparência)', 'começando', 'acelera', 1]], note:'liquidadores: estimativa'},
    B:{name:'Europa atingida', icon:'🌫️', leader:'Ucrânia, Belarus, Rússia, Escandinávia...', rows:[['☁️ Precipitação radioativa em Belarus', '0%', '≈70% do total', -1], ['💀 Mortes diretas (1986)', 0, 31, -1], ['🏥 Mortes de longo prazo (OMS, estimativa)', 0, 4000, -1]], note:'estimativas de longo prazo variam muito entre estudos'}
  },
  steps:[
    {cam:[30.1, 51.39, 3], card:'A', phase:'before', title:'A usina V. I. Lenin',
     fx:F => { F.marker(30.1, 51.39, '🏭', 'Usina de Chernobyl'); F.marker(30.05, 51.405, '🏙️', ''); },
     text:P('No norte da Ucrânia (então parte da URSS), perto da cidade de <b>Pripyat</b>, funcionava a usina nuclear de Chernobyl, com reatores do tipo RBMK.') + P('Na madrugada de <b>26 de abril de 1986</b>, a equipe do reator 4 fazia um teste de segurança. O reator tinha falhas de projeto, e as regras de segurança foram desrespeitadas.')},
    {cam:[30.1, 51.39, 5], card:'A', phase:'before', title:'1h23 da madrugada',
     text:P('A potência do reator disparou em segundos.'),
     act:{prompt:'Clique no reator 4 da usina de Chernobyl.', lon:30.1, lat:51.39, r:1.2, z:5, hint:'A usina fica no norte da Ucrânia, perto da fronteira com Belarus.',
       do:F => { F.boom(30.1, 51.39, true); setTimeout(() => F.boom(30.1, 51.39, true), 500); MapView.doShake(12, 900); F.text(30.1, 52.2, 'Explosão do reator 4', '#8b1a1a'); }, wait:2400}},
    {cam:[24, 56, 2.3], card:'A', phase:'before', title:'A nuvem radioativa',
     fx:F => { F.circle(30.1, 51.39, 0.27, '#b3261e', 'rgba(179,38,30,0.3)');
       [[27.5, 53.9], [18, 59.5], [17.6, 60.4], [10, 50], [37.6, 55.75], [24, 46]].forEach((d, i) => setTimeout(() => F.arrow([30.1, 51.39], d, 'rgba(110,110,60,0.9)'), i*450));
       setTimeout(() => F.overlay(hsCircleCells(29, 52.5, 4.5), '#6b6b2a', 'Contaminação mais forte', 0.35), 2400); F.marker(17.6, 60.4, '🔍', 'Forsmark (Suécia)'); },
     text:P('As explosões e o incêndio do grafite lançaram material radioativo durante 10 dias. O vento levou a nuvem para <b>Belarus</b>, Rússia e Escandinávia.') + P('O mundo só soube porque, em <b>28 de abril</b>, funcionários da usina de <b>Forsmark</b>, na Suécia — a mais de 1.000 km —, detectaram radiação nas próprias roupas e descobriram que ela não vinha dali.')},
    {card:'A', phase:'after', title:'Do lado da União Soviética',
     text:P('<b>Pripyat</b> (49 mil habitantes) só foi evacuada cerca de 36 horas depois; as pessoas pensavam que voltariam em três dias e nunca voltaram. Uma <b>zona de exclusão de 30 km</b> foi criada.') + P('Bombeiros e operadores trabalharam sem saber o tamanho do perigo: 2 morreram naquela noite e 28 nos meses seguintes, de síndrome aguda da radiação. Centenas de milhares de "<b>liquidadores</b>" limparam a área. O cientista <b>Valery Legasov</b> chefiou a investigação e expôs as falhas.') + P('O acidente envergonhou o governo e acelerou a <b>glasnost</b> (transparência) de <b>Mikhail Gorbachev</b>. Anos depois, ele disse que Chernobyl talvez tenha sido a verdadeira causa do fim da URSS.')},
    {cam:[29, 52, 3.5], card:'B', phase:'after', title:'Do lado de quem recebeu a nuvem',
     text:P('<b>Belarus</b> recebeu cerca de 70% da precipitação radioativa. Houve aumento de câncer de tireoide, principalmente em crianças que beberam leite contaminado.') + P('Os efeitos de longo prazo ainda são debatidos: a OMS estima cerca de 4.000 mortes entre os mais expostos; outros estudos estimam números maiores.')},
    {cam:[30.05, 51.405, 6], title:'Inabitável',
     fx:F => { F.marker(30.05, 51.405, '🎡', 'Pripyat: cidade-fantasma'); },
     text:P('Diferente de Hiroshima, aqui o material radioativo do reator — como o césio-137 e o plutônio — ficou no solo. Pripyat é até hoje uma cidade-fantasma, com a roda-gigante que nunca chegou a ser inaugurada.') + P('O reator foi coberto por um "sarcófago" em 1986 e, em 2016, por uma nova estrutura de aço gigante. Partes da zona devem continuar impróprias para morar por muitas gerações.')},
    {title:'Pergunta para a turma',
     quiz:{q:'Como o resto do mundo descobriu o acidente?', o:['A URSS anunciou na mesma hora', 'Uma usina na Suécia detectou radiação vinda do leste', 'Um satélite americano filmou a explosão ao vivo'], a:1,
       e:'Em 28 de abril, a usina de Forsmark, na Suécia, detectou radiação — só então a URSS admitiu o acidente.'}}
  ]},
// 10 --------------------------------------------------------------
{ id:'muro', year:'1989', era:1960, world:'Alemanha Oriental', icon:'🧱', title:'A Queda do Muro de Berlim',
  sub:'O símbolo da Guerra Fria vem abaixo',
  cards:{
    A:{name:'Alemanha Oriental (RDA)', flag:'Alemanha Oriental', leader:'Egon Krenz (líder em 1989)', rows:[['👥 População', 16400000, 16400000], ['🧱 Muro de Berlim', 'de pé (155 km)', 'aberto', 1], ['🏛️ Futuro do país', '—', 'deixa de existir (3/10/1990)', 0]]},
    B:{name:'Alemanha unificada', icon:'🇩🇪', leader:'Chanceler Helmut Kohl', rows:[['👥 População', 62700000, 79000000, 1], ['🗺️ Países alemães', 2, 1, 0], ['💶 Custo da reunificação', '—', 'muito alto', -1]]}
  },
  steps:[
    {cam:[11, 52, 3.5], card:'A', phase:'before', title:'Duas Alemanhas',
     fx:F => { F.overlay(hsNationCells('Alemanha Oriental'), '#a3322a', 'RDA (comunista)', 0.3); F.overlay(hsNationCells('Alemanha Ocidental'), '#1f4e8c', 'RFA (capitalista)', 0.3); },
     text:P('Depois da Segunda Guerra, a Alemanha foi dividida: a ocidental (RFA), capitalista e aliada dos EUA, e a oriental (RDA), comunista e ligada à URSS. Berlim, dentro da RDA, também foi dividida.') + P('Cerca de 2,5 a 3 milhões de pessoas fugiram do leste para o oeste. Para impedir, em <b>13 de agosto de 1961</b> o governo da RDA ergueu, da noite para o dia, o <b>Muro de Berlim</b>: 155 km de concreto, arame e torres de vigia. Pelo menos 140 pessoas morreram tentando atravessá-lo.')},
    {cam:[13.4, 52.52, 6], card:'A', phase:'before', title:'9 de novembro de 1989',
     fx:F => { F.line([[13.2, 52.6], [13.35, 52.56], [13.42, 52.5], [13.5, 52.43]], '#555', 4, false, 900); },
     text:P('Em 1989, as reformas de <b>Mikhail Gorbachev</b> na URSS e os protestos (como as manifestações de segunda-feira em Leipzig) enfraqueceram o governo da RDA.') + P('Numa entrevista coletiva, o porta-voz <b>Günter Schabowski</b> anunciou, por engano, que as viagens ao oeste estavam liberadas "imediatamente". Milhares de pessoas correram para os postos de fronteira.'),
     act:{prompt:'Abra o Muro: clique em Berlim.', lon:13.4, lat:52.52, r:1.2, z:6, hint:'Berlim fica no leste da Alemanha.',
       do:F => { hsFx().lines = []; F.ring(13.4, 52.52, '#2d6a2d', 26); F.text(13.4, 53, 'O Muro caiu!', '#2d6a2d'); SFX.fanfare(); [0, 300, 600].forEach(d => setTimeout(() => F.boom(13.35 + Math.random()*0.1, 52.5 + Math.random()*0.05), d)); }, wait:2400}},
    {card:'A', phase:'after', title:'A noite em que o Muro caiu',
     text:P('No posto da rua Bornholmer, o oficial <b>Harald Jäger</b>, sem ordens e diante de uma multidão, abriu a cancela. Naquela noite, berlinenses do leste e do oeste se abraçaram e subiram no Muro com martelos e picaretas.') + P('Nos meses seguintes, o regime comunista da RDA caiu. Era o começo do fim da Guerra Fria.')},
    {cam:[11, 51.5, 3.5], card:'B', phase:'before', title:'Reunificação',
     text:P('O chanceler <b>Helmut Kohl</b> negociou com os EUA, a URSS, o Reino Unido e a França a reunificação.'),
     act:{prompt:'Reúna as duas Alemanhas: clique na Alemanha Oriental.', lon:12.5, lat:51.5, r:2.5, z:3.5, hint:'É a parte leste do território alemão.',
       do:F => { hsFx().overlays = []; F.overlay(hsNationCells('Alemanha Oriental').concat(hsNationCells('Alemanha Ocidental')), '#2d2d2d', 'Alemanha (3/10/1990)', 0.35); SFX.bell(); }, wait:2000}},
    {card:'B', phase:'after', title:'Uma Alemanha só',
     text:P('Em <b>3 de outubro de 1990</b> a Alemanha voltou a ser um único país, com cerca de 79 milhões de habitantes — a maior economia da Europa.') + P('Mas a reunificação foi cara e difícil: muitas fábricas do leste fecharam, houve desemprego, e as diferenças de renda entre leste e oeste duraram décadas. Em 1991, a própria União Soviética deixou de existir.')},
    {title:'Pergunta para a turma',
     quiz:{q:'Por que o Muro de Berlim foi construído em 1961?', o:['Para proteger Berlim de uma invasão americana', 'Para impedir que os alemães orientais fugissem para o oeste', 'Para separar dois bairros que brigavam'], a:1,
       e:'Milhões de pessoas fugiam da RDA. O muro foi erguido para fechar essa saída — e virou o símbolo da Guerra Fria.'}}
  ]}
];

// ---------------- onde jogar: Enciclopédia, linha do tempo e menu ----------------
function hsListHTML(){
  return `<div class="enc-intro">🎬 <b>Modo História</b>: viva os acontecimentos no mapa. Cada cena conta a história, deixa você fazer o que aconteceu e mostra as consequências dos dois lados — ótimo para aulas. O tempo não passa: é só a história.</div>` +
    HIST_SCENES.map(s => `<div class="enc-item" style="display:flex;gap:10px;align-items:center"><div style="font-size:30px">${s.icon}</div><div style="flex:1"><b>${s.year} — ${esc(s.title)}</b><div class="muted">${esc(s.sub)}</div></div><button class="btn sm green" data-story="${s.id}">▶ Jogar</button></div>`).join('');
}
if (typeof ENC_SECTIONS !== 'undefined'){
  ENC_SECTIONS.splice(1, 0, {id:'modohistoria', n:'🎬 Modo História', f:hsListHTML});
  if (typeof TIMELINE !== 'undefined' && !TIMELINE.some(e => /Chernobyl/.test(e[1]))) TIMELINE.push([1986, 'Acidente nuclear de Chernobyl, na Ucrânia (então parte da URSS).']);
  // linha do tempo: um ▶ nos acontecimentos que dá para jogar
  const TL_MATCH = {tordesilhas:/Tordesilhas/, vasco:/Vasco da Gama/, cabral:/Cabral/, familia_real:/família real/i, independencia:/Independência do Brasil/, sarajevo:/Primeira Guerra/, hiroshima:/Hiroshima/, cuba:/Mísseis/, chernobyl:/Chernobyl/, muro:/Muro de Berlim/};
  const tl = ENC_SECTIONS.find(s => s.id === 'historia');
  if (tl) tl.f = () => `<div class="enc-intro">Acontecimentos reais que moldaram o mundo do jogo. ▶ = dá para <b>jogar no mapa</b> (Modo História).</div>` +
    TIMELINE.slice().sort((a, b) => a[0] - b[0]).map(([y, t]) => { const sc = HIST_SCENES.find(x => +x.year === y && TL_MATCH[x.id] && TL_MATCH[x.id].test(t));
      return encItem(`${sc ? `<button class="btn xs green" data-story="${sc.id}" style="margin-right:6px">▶ Jogar</button>` : ''}${y}`, t); }).join('');
}
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-story]'); if (!b) return; e.preventDefault(); SFX.page && SFX.page(); hsStart(b.dataset.story, document.querySelector('#scr-page:not(.hidden)') ? 'ency' : 'menu'); });
// botão no menu principal
(function(){ const ency = document.getElementById('m-ency'); if (ency && !document.getElementById('m-story')){ ency.insertAdjacentHTML('afterend', `<button class="btn" id="m-story">🎬 Modo História (aulas)</button>`); document.getElementById('m-story').className = ency.className;
  document.getElementById('m-story').onclick = () => { SFX.init && SFX.init(); SFX.page(); showPage('🎬 Modo História', hsListHTML()); }; } })();
