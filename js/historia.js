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
const HS = { sc:null, i:0, fx:null, nat:{}, view:'A', date:'', misses:0, from:null, busy:false, timer:null };

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

function hsFmt(v){ if (typeof v !== 'number') return String(v); const a = Math.abs(v); return a >= 1e6 ? (v/1e6).toFixed(a >= 1e7 ? 0 : 1).replace('.', ',') + ' mi' : a >= 1000 ? Math.round(v).toLocaleString('pt-BR') : (Math.round(v*10)/10).toString().replace('.', ','); }
// monta um mundo da época (sem salvar, sem passar o tempo do jogo)
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

// estado de cada país do cenário (o que aparece na "tela do jogo" do topo)
function hsResetNations(sc){ HS.nat = {}; for (const k in sc.nat) HS.nat[k] = Object.assign({}, sc.nat[k], {s:Object.assign({}, sc.nat[k].s)}); }
// aplica mudanças; devolve a lista de mudanças para mostrar
function hsApply(set){
  const out = []; if (!set) return out;
  for (const k in set){ const n = HS.nat[k]; if (!n) continue;
    for (const f in set[k]){ const v = set[k][f];
      if (f === 'leader' || f === 'name' || f === 'short'){ if (n[f] !== v && f !== 'short') out.push({k, f, b:n[f], a:v}); n[f] = v; continue; }
      const b = n.s[f], a = typeof v === 'string' && /^[+-]\d/.test(v) && typeof b === 'number' ? b + parseFloat(v) : v;
      if (a !== b){ out.push({k, f, b, a}); n.s[f] = a; } } }
  return out;
}
const HS_STATS = [['eco','💰 Economia', 'índice (100 = início)'], ['pop','👥 População', 'milhões'], ['app','😊 Apoio', '%'], ['stab','⚖️ Estabilidade', '%'], ['mil','⚔️ Militar', 'índice'], ['sci','🔬 Ciência', '']];
const hsVal = (f, v) => typeof v !== 'number' ? String(v) : f === 'pop' ? (Math.abs(v) < 1 ? Math.round(v*1000).toLocaleString('pt-BR') + ' mil' : hsFmt(v) + ' mi') : (f === 'app' || f === 'stab') ? Math.round(v) + '%' : hsFmt(v);

// barra no topo, com cara da tela do jogo: bandeira, líder, data e indicadores
function hsBar(flash){
  const el = $('#hs-bar'); if (!el) return;
  const k = HS.view, n = HS.nat[k]; if (!n) return;
  const tabs = Object.keys(HS.nat).map(x => `<button class="hs-tab ${x === k ? 'on' : ''}" data-hsv="${x}">${esc(HS.nat[x].short || HS.nat[x].name)}</button>`).join('');
  el.innerHTML = `<div class="hs-id">${n.flag ? '<canvas width="54" height="36" id="hs-flag"></canvas>' : `<span style="font-size:30px">${n.icon || '🏳️'}</span>`}<div><b>${esc(n.name)}</b><small>${esc(n.leader || '')}</small></div></div>
    <div class="hs-date">📅 ${esc(HS.date || '')}</div>
    <div class="hs-stats">${HS_STATS.map(([f, l, u]) => { const v = n.s[f]; if (v === undefined) return ''; const ch = (flash||[]).find(c => c.k === k && c.f === f);
      const d = ch && typeof ch.a === 'number' && typeof ch.b === 'number' ? ch.a - ch.b : null;
      return `<div class="st ${ch ? (d === null ? 'flash-up' : d >= 0 ? 'flash-up' : 'flash-down') : ''}" title="${esc(u)}"><span class="l">${l}</span><span class="v">${esc(hsVal(f, v))}</span>${d !== null ? `<span class="d ${d >= 0 ? 'up' : 'down'}">${d >= 0 ? '▲ +' : '▼ '}${esc(hsVal(f, d).replace('%',''))}${f === 'app' || f === 'stab' ? ' pts' : ''}</span>` : ch ? '<span class="d up">● mudou</span>' : ''}</div>`; }).join('')}</div>
    <div class="hs-tabs">${tabs}</div>`;
  if (n.flag){ const d = eraNations(HS.sc.era).find(x => x.name === n.flag); const f = d && eraNationFlag(d); if (f) drawFlag($('#hs-flag').getContext('2d'), f, 0, 0, 54, 36); }
  el.querySelectorAll('[data-hsv]').forEach(b => b.onclick = () => { SFX.click(); HS.view = b.dataset.hsv; hsBar();
    const st = HS.sc && HS.sc.steps[HS.i];
    if (st && st.switchTo === HS.view && !st._done){ st._done = true; SFX.bell(); hsAfterAction(st); } });
}

function hsStart(id, from){
  const sc = HIST_SCENES.find(s => s.id === id); if (!sc) return;
  SFX.init && SFX.init(); closeModal(); closePopover && closePopover();
  HS.sc = sc; HS.i = 0; HS.fx = null; HS.misses = 0; HS.from = from || null; HS.busy = false; HS.date = sc.date || sc.year; HS.view = 'A';
  hsResetNations(sc); hsBuildWorld(sc);
  hideAllScreens(); $('#hud').classList.add('hidden'); document.body.classList.remove('ingame'); document.body.classList.add('story');
  MapView.menuMode = false; MapView.placement = null; MapView.buildMode = null;
  MapView.onHover = null; MapView.onClick = (cell, x, y, lon, lat) => hsClick(lon, lat);
  MapView.resize(); MapView.fit();
  hsUI(); hsStep();
}
function hsExit(){
  clearTimeout(HS.timer); HS.sc = null; HS.fx = null; G = null;
  ['story-panel','hs-bar','hs-dark'].forEach(id => { const e = document.getElementById(id); if (e) e.remove(); });
  document.querySelectorAll('.hs-dark-old').forEach(x => x.remove());
  document.body.classList.remove('story'); MapView.onClick = null; closeModal();
  showMenu();
  if (HS.from === 'ency' && typeof openEncyclopedia === 'function') setTimeout(() => openEncyclopedia('modohistoria'), 80);
}

function hsUI(){
  if (!document.getElementById('story-style')) document.head.insertAdjacentHTML('beforeend', `<style id="story-style">
    #story-panel{position:fixed;right:14px;top:84px;bottom:14px;width:min(400px,44vw);z-index:60;display:flex;flex-direction:column;background:#f3e6c4;border:2px solid #5a3d1e;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.45);overflow:hidden}
    #story-panel .sp-head{padding:8px 14px;background:linear-gradient(#5a1a12,#3d0f0a);color:#f3e6c4}
    #story-panel .sp-head small{opacity:.8;display:block;font-style:italic}#story-panel .sp-head b{font-family:var(--title,'Cinzel'),serif;font-size:18px}
    #story-panel .sp-body{flex:1;overflow:auto;padding:12px 16px;font-size:15.5px;line-height:1.5;color:#2e1d0c}
    #story-panel .sp-body h3{margin:0 0 6px;font-family:var(--title,'Cinzel'),serif;color:#7a1b14;font-size:17px}
    #story-panel .sp-body p{margin:0 0 9px}
    #story-panel .sp-act{margin:10px 0;padding:10px;border:2px dashed #b3261e;border-radius:8px;background:rgba(179,38,30,.07);font-weight:700}
    #story-panel .sp-foot{display:flex;gap:6px;align-items:center;padding:8px 12px;border-top:1px solid rgba(90,61,30,.3)}
    #story-panel .sp-dots{flex:1;display:flex;gap:4px;flex-wrap:wrap}#story-panel .sp-dots i{width:8px;height:8px;border-radius:50%;background:#cdbb92}#story-panel .sp-dots i.on{background:#8b1a1a}#story-panel .sp-dots i.done{background:#5a3d1e}
    #story-panel .quiz button{display:block;width:100%;text-align:left;margin:5px 0}
    #hs-bar{position:fixed;left:0;right:0;top:0;height:70px;z-index:61;display:flex;align-items:center;gap:12px;padding:6px 12px;background:linear-gradient(#3b2614,#24170b);color:#f3e6c4;border-bottom:2px solid #c9a13b;box-shadow:0 4px 14px rgba(0,0,0,.4)}
    #hs-bar .hs-id{display:flex;gap:8px;align-items:center;min-width:190px}#hs-bar .hs-id b{display:block;font-family:var(--title,'Cinzel'),serif;font-size:15px}#hs-bar .hs-id small{opacity:.8;font-size:11.5px}
    #hs-bar .hs-date{font-family:var(--title,'Cinzel'),serif;font-size:14px;background:rgba(201,161,59,.18);border:1px solid #c9a13b;border-radius:6px;padding:4px 8px;white-space:nowrap}
    #hs-bar .hs-stats{display:flex;gap:6px;flex:1;overflow:hidden}
    #hs-bar .st{display:flex;flex-direction:column;min-width:86px;padding:3px 7px;border-radius:6px;background:rgba(255,255,255,.06)}
    #hs-bar .st .l{font-size:10.5px;opacity:.75}#hs-bar .st .v{font-weight:800;font-size:13.5px}#hs-dark .hs-dk-btns{display:flex;gap:10px;justify-content:center;margin-top:22px}#hs-dark .hs-dk-btns .btn{font-size:15px;padding:8px 18px}
  #sp-next.hs-pulse{animation:hsPulse 1s ease-in-out infinite}@keyframes hsPulse{50%{box-shadow:0 0 0 4px #e0b240}}
  #hs-bar .st .d{font-size:10.5px;display:block!important;font-weight:700}#hs-bar .up{color:#8fd47a}#hs-bar .down{color:#ff8a7a}
    #hs-bar .hs-tabs{display:flex;flex-direction:column;gap:3px}#hs-bar .hs-tab{font-size:11px;padding:2px 8px;border-radius:5px;border:1px solid #c9a13b;background:transparent;color:#f3e6c4;cursor:pointer}#hs-bar .hs-tab.on{background:#c9a13b;color:#24170b;font-weight:700}
    #hs-dark{position:fixed;inset:0;z-index:80;background:#050302;color:#f3e6c4;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:30px;text-align:center;opacity:0;transition:opacity .8s}
    #hs-dark.on{opacity:1}#hs-dark .ago{font-style:italic;letter-spacing:2px;opacity:.75;font-size:18px}
    #hs-dark .date{font-family:var(--title,'Cinzel'),serif;font-size:clamp(28px,5vw,52px);color:#e8c46a;margin:8px 0 18px}
    #hs-dark .ln{max-width:760px;font-size:clamp(16px,2.1vw,21px);line-height:1.5;margin:6px 0;opacity:0;transform:translateY(8px);transition:all .7s}#hs-dark .ln.on{opacity:1;transform:none}
    #hs-dark .chg{margin-top:16px;display:flex;flex-wrap:wrap;gap:8px;justify-content:center;max-width:820px}#hs-dark .chg span{background:rgba(255,255,255,.08);border:1px solid rgba(232,196,106,.4);border-radius:6px;padding:5px 10px;font-size:14px;opacity:0;transition:opacity .6s}#hs-dark .chg span.on{opacity:1}
    #hs-dark .bar{position:absolute;left:0;bottom:0;height:4px;background:#e8c46a;width:0}#hs-dark .skip{position:absolute;right:18px;bottom:16px;font-size:12px;opacity:.6;cursor:pointer}
    body.story #tb, body.story #hud{display:none!important}
    @media (max-width:760px){#story-panel{left:8px;right:8px;top:auto;height:50vh;width:auto}#hs-bar{height:auto;flex-wrap:wrap}#hs-bar .hs-stats{flex-wrap:wrap}}
  </style>`);
  document.body.insertAdjacentHTML('beforeend', `<div id="hs-bar"></div><div id="story-panel"><div class="sp-head"><small>🎬 Modo História · ${esc(HS.sc.year)}</small><b>${esc(HS.sc.title)}</b></div><div class="sp-body" id="sp-body"></div>
    <div class="sp-foot"><div class="sp-dots" id="sp-dots"></div><button class="btn sm" id="sp-exit">✖ Sair</button><button class="btn sm green" id="sp-next">Próximo ▶</button></div></div>`);
  $('#sp-exit').onclick = () => { SFX.click(); hsExit(); };
  $('#sp-next').onclick = () => { if (HS.busy) return; const st = HS.sc.steps[HS.i]; if ((st.act || st.diplo || st.choice || st.task || st.switchTo) && !st._done){ SFX.error(); toast('👉 Faça a ação primeiro (no mapa, na diplomacia ou no painel).', 'bad'); return; } hsNext(); };
}
function hsNext(){ if (!HS.sc) return; if (HS.i < HS.sc.steps.length - 1){ SFX.page(); HS.i++; hsStep(); } else hsExit(); }

function hsStep(){
  const sc = HS.sc, st = sc.steps[HS.i];
  HS.misses = 0; hsFx().pulse = null; st._done = false;
  $('#sp-dots').innerHTML = sc.steps.map((s, i) => `<i class="${i === HS.i ? 'on' : i < HS.i ? 'done' : ''}"></i>`).join('');
  $('#sp-next').textContent = HS.i === sc.steps.length - 1 ? '✔ Concluir' : 'Próximo ▶';
  if (st.skip){ hsSkip(st); return; }
  if (st.date) HS.date = st.date;
  if (st.view) HS.view = st.view;
  const ch = hsApply(st.set); hsBar(ch);
  if (st.cam) F.cam(st.cam[0], st.cam[1], st.cam[2]);
  if (st.fx) st.fx(F);
  let html = `${st.title ? `<h3>${st.title}</h3>` : ''}${st.text || ''}`;
  if (st.act) html += `<div class="sp-act">👉 ${st.act.prompt}</div><button class="btn xs" id="sp-hint">📍 Mostrar onde</button>`;
  if (st.diplo) html += `<div class="sp-act">🤝 ${st.diplo.prompt}</div><button class="btn xs" id="sp-hint">📍 Mostrar onde</button>`;
  if (st.quiz) html += `<div class="quiz"><p><b>❓ ${st.quiz.q}</b></p>${st.quiz.o.map((o, i) => `<button class="btn sm" data-qz="${i}">${String.fromCharCode(65+i)}) ${o}</button>`).join('')}<div id="qz-r"></div></div>`;
  if (st.choice) html += `<div class="quiz">${st.choice.map((o, i) => `<button class="btn sm" data-ch="${i}">${o.t}</button>`).join('')}<div id="ch-r"></div></div>`;
  if (st.switchTo) html += `<div class="sp-act">🔄 ${st.switchPrompt || `Agora troque de país: clique na aba <b>${esc(HS.nat[st.switchTo].short || HS.nat[st.switchTo].name)}</b> na barra do topo.`}</div>`;
  if (st.task) html += hsTaskHTML(st);
  $('#sp-body').innerHTML = html; $('#sp-body').scrollTop = 0;
  if (st.task) hsTaskBind(st);
  if (st.switchTo){ const tb = document.querySelector(`#hs-bar [data-hsv="${st.switchTo}"]`); if (tb){ tb.style.boxShadow = '0 0 0 3px #e0b240'; } }
  const tgt = st.act || st.diplo;
  const hb = $('#sp-hint'); if (hb) hb.onclick = () => { SFX.click(); hsFx().pulse = {lon:tgt.lon, lat:tgt.lat, r:tgt.r}; F.cam(tgt.lon, tgt.lat, Math.max(MapView.cam.z, tgt.z || 3)); };
  $$('#sp-body [data-qz]').forEach(b => b.onclick = () => { const k = +b.dataset.qz, ok = k === st.quiz.a; ok ? SFX.fanfare() : SFX.error();
    $$('#sp-body [data-qz]').forEach((x, i) => { x.disabled = true; x.style.background = i === st.quiz.a ? '#cfe8c4' : i === k ? '#f2c4be' : ''; });
    $('#qz-r').innerHTML = `<p style="margin-top:8px">${ok ? '✅ <b>Isso mesmo!</b>' : '❌ <b>Não foi bem assim.</b>'} ${st.quiz.e}</p>`; });
  $$('#sp-body [data-ch]').forEach(b => b.onclick = () => { const o = st.choice[+b.dataset.ch]; SFX.page(); $('#ch-r').innerHTML = `<p style="margin-top:8px">${o.r}</p>`; if (o.fx) o.fx(F);
    if (o.ok){ $$('#sp-body [data-ch]').forEach(x => x.disabled = true); st._done = true; hsAfterAction(st); } });
}
// depois de uma ação: aplica as mudanças, mostra a explicação e espera o clique em Próximo
function hsAfterAction(st){
  const ch = hsApply(st.after); if (st.afterView) HS.view = st.afterView; hsBar(ch);
  if (st.afterText){ $('#sp-body').insertAdjacentHTML('beforeend', `<div style="margin-top:10px;padding:8px 10px;border-left:4px solid #2d6a2d;background:rgba(45,106,45,.08)">${st.afterText}</div>`); }
  HS.busy = true;
  const wait = (st.act && st.act.wait) || 900;
  HS.timer = setTimeout(() => {
    HS.busy = false; if (!HS.sc || HS.sc.steps[HS.i] !== st) return;
    const nb = $('#sp-next'); if (nb){ nb.classList.add('hs-pulse'); setTimeout(() => nb.classList.remove('hs-pulse'), 4000); }
  }, wait);
}

// ---------- tarefas com os itens do jogo (recrutar, pesquisar, aprovar lei, ranking) ----------
function hsTaskHTML(st){
  const t = st.task, n = HS.nat[t.nat || HS.view] || HS.nat.A;
  if (t.type === 'recruit'){
    const U = (typeof UNIT !== 'undefined' && UNIT[t.unit]) || {icon:'💂', n:t.label || 'Tropas'};
    t._n = t._n || 0;
    return `<div class="sp-act">🎖️ ${t.prompt || `Recrute ${t.need} divisões de ${t.label || U.n}.`}</div>
      <div class="unit" style="background:rgba(255,255,255,.5);border-radius:8px;padding:6px"><span class="ic">${t.icon || U.icon}</span><span class="nm"><b>${esc(t.label || U.n)}</b><small>${esc(n.short || n.name)} · aba Militar</small></span>
      <span class="ct"><button class="btn xs" data-trec="1">+1</button><button class="btn xs" data-trec="5">+5</button></span></div>
      <div class="lbl" style="margin-top:4px">Recrutadas: <b id="tk-n">${t._n}</b> / ${t.need}</div><div style="height:8px;background:#e6d6ae;border-radius:4px"><i id="tk-bar" style="display:block;height:8px;width:${Math.min(100, t._n/t.need*100)}%;background:#2d6a2d;border-radius:4px"></i></div>`;
  }
  if (t.type === 'research' || t.type === 'law'){
    const law = t.type === 'law';
    return `<div class="sp-act">${law ? '📜' : '🔬'} ${t.prompt}</div><div class="deal-list">${t.opts.map((o, i) => `<div class="deal-opt"><div><b>${o.icon || (law ? '📜' : '🔬')} ${o.n}</b><small>${o.d || ''}</small></div><button class="btn xs ${law ? '' : 'green'}" data-topt="${i}">${law ? 'Votar' : 'Pesquisar'}</button></div>`).join('')}</div><div id="tk-r"></div>`;
  }
  if (t.type === 'ranking'){
    const rows = Object.entries(HS.nat).map(([k, v]) => ({k, v})).filter(x => typeof x.v.s[t.stat] === 'number');
    t._order = rows.slice().sort((a, b) => b.v.s[t.stat] - a.v.s[t.stat]).map(x => x.k);
    const lab = (HS_STATS.find(x => x[0] === t.stat) || [0, t.stat])[1];
    return `<div class="sp-act">🏆 ${t.prompt || `Abra o ranking: qual país está em 1º lugar em ${lab}?`}</div>
      <div class="box">${rows.map(x => `<div class="row"><span class="k">${esc(x.v.name)}</span><span class="v"><button class="btn xs" data-trank="${x.k}">É este</button></span></div>`).join('')}</div><div id="tk-r"></div>`;
  }
  return '';
}
function hsTaskBind(st){
  const t = st.task, k = t.nat || HS.view;
  const done = (msg) => { if (st._done) return; st._done = true; if (msg) $('#sp-body').insertAdjacentHTML('beforeend', `<div class="box" style="margin-top:8px;border-color:#2d6a2d">${msg}</div>`); hsAfterAction(st); };
  $$('#sp-body [data-trec]').forEach(b => b.onclick = () => {
    if (st._done) return; const q = Math.min(+b.dataset.trec, t.need - t._n); t._n += q; SFX.coin();
    const ch = hsApply({[k]:{[t.stat || 'mil']: '+' + (q*(t.per || 1))}}); hsBar(ch);
    $('#tk-n').textContent = t._n; $('#tk-bar').style.width = Math.min(100, t._n/t.need*100) + '%';
    if (t._n >= t.need){ SFX.march(); done(t.doneText || '✅ Tropas prontas!'); }
  });
  $$('#sp-body [data-topt]').forEach(b => b.onclick = () => {
    if (st._done) return; const o = t.opts[+b.dataset.topt];
    if (!o.ok){ SFX.error(); b.disabled = true; $('#tk-r').innerHTML = `<div class="tip" style="margin-top:6px">🤔 ${o.r}</div>`; return; }
    $$('#sp-body [data-topt]').forEach(x => x.disabled = true); SFX.click();
    if (t.type === 'law'){
      const yes = o.yes || 60, no = o.no || 40;
      $('#tk-r').innerHTML = `<div class="box" style="margin-top:6px">🏛️ Votação: <b id="tk-y">0</b> a favor × <b id="tk-no">0</b> contra</div>`;
      let i = 0; const tm = setInterval(() => { i++; const f = Math.min(1, i/20); $('#tk-y').textContent = Math.round(yes*f); $('#tk-no').textContent = Math.round(no*f); if (f >= 1){ clearInterval(tm); SFX.bell(); done(o.r); } }, 70);
    } else {
      $('#tk-r').innerHTML = `<div class="lbl" style="margin-top:6px">${o.icon || '🔬'} Pesquisando ${o.n}...</div><div style="height:8px;background:#e6d6ae;border-radius:4px"><i id="tk-pb" style="display:block;height:8px;width:0;background:#1f4e8c;border-radius:4px;transition:width 1.6s linear"></i></div>`;
      setTimeout(() => { const pb = $('#tk-pb'); if (pb) pb.style.width = '100%'; }, 30);
      setTimeout(() => { SFX.research ? SFX.research() : SFX.bell(); done(o.r); }, 1700);
    }
  });
  $$('#sp-body [data-trank]').forEach(b => b.onclick = () => {
    if (st._done) return; const ok = b.dataset.trank === t._order[0];
    if (!ok){ SFX.error(); b.disabled = true; $('#tk-r').innerHTML = `<div class="tip" style="margin-top:6px">Não é esse. Compare os números na barra do topo (clique nas abas dos países).</div>`; return; }
    SFX.fanfare(); $$('#sp-body [data-trank]').forEach(x => x.disabled = true);
    const lab = (HS_STATS.find(x => x[0] === t.stat) || [0, t.stat])[1];
    done(`🏆 <b>Ranking — ${lab}</b><br>${t._order.map((kk, i) => `${i+1}º ${esc(HS.nat[kk].name)}: ${esc(hsVal(t.stat, HS.nat[kk].s[t.stat]))}`).join('<br>')}${t.doneText ? '<br><br>' + t.doneText : ''}`);
  });
}

// tela escura: "passados tantos meses…" — abre no Próximo e só fecha no botão Continuar
function hsSkip(st){
  const sk = st.skip; HS.busy = true;
  const lines = sk.lines || [];
  const ch = hsApply(sk.set);
  if (sk.date) HS.date = sk.date;
  if (sk.view) HS.view = sk.view;
  const chg = ch.filter(c => c.f !== 'leader' || true).map(c => { const n = HS.nat[c.k], txt = c.f === 'leader' || c.f === 'name', lab = c.f === 'leader' ? '👤 Líder' : c.f === 'name' ? '🏳️ Novo nome' : (HS_STATS.find(s => s[0] === c.f) || [0, c.f])[1];
    return `${esc(n.short || n.name)} · ${lab}: ${esc(txt ? c.a : hsVal(c.f, c.b) + ' → ' + hsVal(c.f, c.a))}`; });
  // cada tela escura é um elemento novo (a anterior pode ainda estar sumindo)
  document.querySelectorAll('.hs-dark-old').forEach(x => x.remove());
  const d = document.createElement('div'); d.id = 'hs-dark';
  d.innerHTML = `<div class="ago">⏳ ${esc(sk.ago || '')}</div><div class="date">${esc(sk.date || '')}</div>
    ${lines.map(l => `<div class="ln">${l}</div>`).join('')}<div class="chg">${chg.map(c => `<span>${c}</span>`).join('')}</div><div class="hs-dk-btns"><button class="btn sm" data-dk="exit">✖ Sair</button><button class="btn sm green" data-dk="go">Continuar ▶</button></div>`;
  document.body.appendChild(d); SFX.page();
  requestAnimationFrame(() => d.classList.add('on'));
  setTimeout(() => d.classList.add('on'), 50);
  const lns = [...d.querySelectorAll('.ln')], chs = [...d.querySelectorAll('.chg span')];
  let t = 900; lns.forEach(l => { setTimeout(() => l.classList.add('on'), t); t += 400 + l.textContent.length * 38; });
  chs.forEach((c, i) => setTimeout(() => c.classList.add('on'), t + i*350));
  let closed = false;
  const close = () => { if (closed) return; closed = true; clearTimeout(HS.timer); d.classList.remove('on'); d.classList.add('hs-dark-old'); d.removeAttribute('id'); d.style.pointerEvents = 'none'; setTimeout(() => d.remove(), 800); HS.busy = false; hsBar(ch); if (sk.fx) sk.fx(F); if (!HS.sc) return;
    // outra tela escura em seguida: volta para a tela do jogo e só abre a próxima no Próximo
    const nx = HS.sc.steps[HS.i + 1];
    if (nx && nx.skip){ $('#sp-body').innerHTML = `<h3>⏳ ${esc(sk.ago || '')}${sk.date ? ' · ' + esc(sk.date) : ''}</h3>${lines.map(l => `<p>${l}</p>`).join('')}<div class="sp-act">Quando terminar de ler, clique em <b>Próximo ▶</b>.</div>`; $('#sp-body').scrollTop = 0; }
    else hsNext(); };
  // clicar no fundo só mostra o texto todo de uma vez; avançar ou sair é sempre no botão
  d.onclick = e => { lns.forEach(l => l.classList.add('on')); chs.forEach(c => c.classList.add('on'));
    const b = e.target.closest('[data-dk]'); if (!b) return; SFX.click();
    if (b.dataset.dk === 'go') close(); else { closed = true; d.remove(); HS.busy = false; hsExit(); } };
}

function hsClick(lon, lat){
  if (!HS.sc || HS.busy) return;
  const st = HS.sc.steps[HS.i], tgt = st.act || st.diplo; if (!tgt || st._done) return;
  let dl = Math.abs(lon - tgt.lon); if (dl > 180) dl = 360 - dl;
  const d = tgt.lonOnly ? dl : Math.hypot(dl, lat - tgt.lat);
  if (d <= tgt.r){
    hsFx().pulse = null; SFX.click();
    if (st.act){ st._done = true; st.act.do(F, lon, lat); hsAfterAction(st); }
    else hsDiplo(st);
  } else {
    HS.misses++; SFX.error();
    toast(HS.misses >= 2 ? `📍 ${tgt.hint || 'Veja o círculo vermelho piscando.'}` : 'Ainda não é aí — tente de novo.', 'bad');
    if (HS.misses >= 2) hsFx().pulse = {lon:tgt.lon, lat:tgt.lat, r:tgt.r};
  }
}

// janela de diplomacia jogável
function hsDiplo(st){
  const dp = st.diplo, me = HS.nat[dp.from || HS.view] || HS.nat.A, other = HS.nat[dp.to] || {name:dp.toName || '—', leader:dp.toLeader || '', icon:dp.toIcon || '🏳️'};
  const flag = (n, id) => n.flag ? `<canvas width="72" height="48" id="${id}"></canvas>` : `<div style="font-size:40px">${n.icon || '🏳️'}</div>`;
  const md = openModal(`<div class="m-title">🤝 Diplomacia</div>
    <div class="flex" style="justify-content:space-around;align-items:center;gap:10px;margin:6px 0">
      <div style="text-align:center">${flag(me, 'dp-f1')}<div><b>${esc(me.name)}</b></div><small class="muted">${esc(me.leader || '')}</small></div>
      <div style="font-size:26px">${dp.icon || '✉️'}</div>
      <div style="text-align:center">${flag(other, 'dp-f2')}<div><b>${esc(other.name)}</b></div><small class="muted">${esc(other.leader || '')}</small></div></div>
    ${dp.rel != null ? `<div class="lbl" style="text-align:center">Relação: <b class="${dp.rel >= 0 ? 'up' : 'down'}">${dp.rel > 0 ? '+' : ''}${dp.rel}</b> — ${esc(dp.relTxt || '')}</div><div class="relbar" style="margin:4px 0 8px"><i style="left:${(dp.rel+100)/2}%"></i></div>` : ''}
    <div class="m-text" style="text-align:left">${dp.intro || ''}</div>
    <div class="sub">Ações diplomáticas</div>
    ${dp.opts.map((o, i) => `<button class="choice" data-dpo="${i}"><b>${o.t}</b><span>${o.h || ''}</span></button>`).join('')}
    <div id="dp-r"></div>`, {wide:true});
  const fl = (n, id) => { const c = md.querySelector('#'+id); if (!c || !n.flag) return; const d = eraNations(HS.sc.era).find(x => x.name === n.flag); const f = d && eraNationFlag(d); if (f) drawFlag(c.getContext('2d'), f, 0, 0, 72, 48); };
  fl(me, 'dp-f1'); fl(other, 'dp-f2'); SFX.page();
  md.querySelectorAll('[data-dpo]').forEach(b => b.onclick = () => {
    const o = dp.opts[+b.dataset.dpo];
    if (!o.ok){ SFX.error(); b.disabled = true; b.style.opacity = .55; md.querySelector('#dp-r').innerHTML = `<div class="tip" style="margin-top:8px">🤔 <b>E se?</b> ${o.r}</div>`; return; }
    SFX.bell(); md.querySelectorAll('[data-dpo]').forEach(x => x.disabled = true);
    md.querySelector('#dp-r').innerHTML = `<div class="box" style="margin-top:8px;border-color:#2d6a2d"><b>✉️ Resposta:</b> ${o.r}</div><div class="m-actions"><button class="btn green" id="dp-ok">Continuar</button></div>`;
    md.querySelector('#dp-ok').onclick = () => { SFX.click(); closeModal(); st._done = true; if (o.fx) o.fx(F); if (dp.fx) dp.fx(F); hsAfterAction(st); };
  });
}

// ---------------- cenários ----------------
// nat: países do cenário (s = indicadores ilustrativos: economia em índice 100, população em milhões,
//      apoio/estabilidade em %, militar em índice, ciência em texto)
// passos: informação · act (ação no mapa) · diplo (diplomacia jogável) · choice · skip (tela escura: o tempo passa) · quiz
const P = t => `<p>${t}</p>`;
const HIST_SCENES = [
// 1 ---------------------------------------------------------------
{ id:'tordesilhas', year:'1494', date:'12 de outubro de 1492', era:1500, world:'Reino de Portugal', icon:'📜', title:'O Tratado de Tordesilhas',
  sub:'Colombo, a bula do papa e a negociação que dividiu o "Novo Mundo"',
  nat:{
    A:{name:'Reino de Portugal', short:'Portugal', flag:'Reino de Portugal', leader:'Rei Dom João II', s:{eco:100, pop:1.0, app:70, stab:72, mil:45, sci:'Caravela, astrolábio'}},
    B:{name:'Coroas de Castela e Aragão', short:'Castela', flag:'Coroas de Castela e Aragão', leader:'Reis Católicos: Isabel I e Fernando II', s:{eco:100, pop:7.0, app:75, stab:70, mil:70, sci:'Navegação atlântica'}}
  },
  steps:[
    {view:'B', cam:[-40, 25, 1.6], title:'Colombo cruza o Atlântico',
     fx:F => { F.marker(-6.95, 37.2, '⚓', 'Palos'); },
     text:P('Em 1492, <b>Cristóvão Colombo</b>, um navegador genovês financiado pelos <b>Reis Católicos</b> (Isabel de Castela e Fernando de Aragão), quis chegar às Índias navegando para o oeste. Partiu de Palos em 3 de agosto com três navios: <i>Santa María</i>, <i>Pinta</i> e <i>Niña</i>.'),
     act:{prompt:'Como Castela, leve as caravelas de Colombo: clique nas ilhas do Caribe onde ele chegou.', lon:-74.5, lat:24, r:6, hint:'São as ilhas das Bahamas, a leste da Flórida.',
       do:F => { F.ship([[-6.95, 37.2], [-16, 28], [-40, 26], [-74.5, 24]], 2600, '⛵'); setTimeout(() => F.marker(-74.5, 24, '🏝️', 'Guanahani'), 2600); }, wait:2900},
     after:{B:{eco:'+8', app:'+10', sci:'Rota para a América'}}, afterText:'<b>12 de outubro de 1492.</b> Colombo desembarcou na ilha que os nativos taínos chamavam de Guanahani, nas Bahamas — convencido de que estava na Ásia. Castela comemorou: tinha um caminho pelo oeste.'},
    {skip:{ago:'7 meses depois', date:'4 de maio de 1493', set:{A:{stab:'-6', app:'-5'}, B:{app:'+5'}},
      fx:F => { F.line([[-38, 75], [-38, -62]], '#b8860b', 2, true, 1400); },
      lines:['Os Reis Católicos pedem ao papa <b>Alexandre VI</b> — um espanhol de Valência — que garanta as novas terras.', 'A bula <b>Inter Caetera</b> traça uma linha a <b>100 léguas</b> a oeste dos Açores e de Cabo Verde: quase tudo o que fosse descoberto seria de Castela.', 'Em Lisboa, o rei <b>Dom João II</b> fica furioso.']}},
    {view:'A', cam:[-15, 35, 2.4], title:'Portugal reage',
     text:P('A linha do papa deixava Portugal quase sem espaço no Atlântico Sul — justamente onde seus navios faziam a grande volta para contornar a África.') + P('Agora é com você, como Portugal.'),
     diplo:{prompt:'Abra a diplomacia com Castela: clique na Espanha.', lon:-3.7, lat:40.4, r:5, hint:'Castela fica no centro da Península Ibérica, ao lado de Portugal.', to:'B', icon:'📜', rel:-15, relTxt:'tensa',
       intro:'Os embaixadores de Dom João II chegam à corte dos Reis Católicos. O que Portugal faz?',
       opts:[
         {t:'Aceitar a bula do papa', h:'A linha fica a 100 léguas de Cabo Verde', ok:false, r:'Dom João II não aceitou: Portugal perderia o Atlântico Sul e a segurança da rota africana para as Índias.'},
         {t:'Ameaçar com guerra', h:'Mobilizar a frota', ok:false, r:'Houve ameaças, mas os dois reinos preferiram negociar — uma guerra seria cara e arriscada para ambos.'},
         {t:'✔ Recusar a bula e propor negociar uma nova linha, mais a oeste', h:'Negociação direta entre os dois reinos', ok:true, r:'Os Reis Católicos aceitam conversar. As delegações vão se reunir na vila de <b>Tordesilhas</b>, em Castela.'}
       ]},
     after:{A:{stab:'+4'}, B:{}}, afterText:'Portugal ganhou tempo e uma mesa de negociação — sem disparar um tiro.'},
    {skip:{ago:'1 ano depois', date:'7 de junho de 1494', set:{A:{app:'+6'}},
      lines:['Por meses, os embaixadores negociam em Tordesilhas.', 'Portugal quer a linha bem mais a oeste: <b>370 léguas</b> de Cabo Verde. Castela aceita — seu interesse está nas terras de Colombo, mais ao norte.', 'Falta traçar a linha no mapa.']}},
    {view:'A', cam:[-35, -5, 2], title:'Trace a linha',
     fx:F => { F.marker(-23.6, 15.1, '🏝️', 'Cabo Verde'); },
     text:P('O tratado diz: o que ficar a <b>leste</b> da linha é de Portugal; a <b>oeste</b>, de Castela.'),
     act:{prompt:'Clique onde passa a linha de 370 léguas a oeste de Cabo Verde (ela corta o atual Brasil).', lon:-46.6, lat:-10, r:6, lonOnly:true, hint:'Por volta de 46° oeste: do Pará até Santa Catarina.',
       do:F => { F.line([[-46.6, 75], [-46.6, -62]], '#8b1a1a', 3, true, 1600); F.marker(-48.5, -1.45, '📍', 'Belém'); F.marker(-48.78, -28.48, '📍', 'Laguna (SC)');
         F.overlay(hsBoxCells(-46.6, -60, -28, 15), '#1f6f3a', 'Portugal', 0.35); F.overlay(hsBoxCells(-170, -60, -46.6, 72), '#b8860b', 'Castela', 0.25); SFX.bell(); }, wait:2400},
     after:{A:{eco:'+6', sci:'Rota da África garantida'}, B:{eco:'+4'}}, afterText:'Assinado! A linha passava mais ou menos entre <b>Belém (PA)</b> e <b>Laguna (SC)</b>. Ninguém perguntou aos povos que já viviam ali.'},
    {view:'B', title:'Do lado de Castela',
     text:P('Castela ficou com quase toda a América. Nas décadas seguintes conquistaria os impérios dos <b>astecas</b> (1521) e dos <b>incas</b> (1533). O rei da França, <b>Francisco I</b>, teria ironizado que queria ver "o testamento de Adão" que dividia o mundo entre os dois.')},
    {skip:{ago:'256 anos depois', date:'13 de janeiro de 1750', view:'A', set:{A:{eco:'+20', pop:'+2.0', leader:'Rei Dom João V'}},
      fx:F => { F.overlay(hsBoxCells(-74, -34, -46.6, 5, (i, lo, la) => !(lo < -70 && la < -10)), '#2d6a2d', 'Expansão para o oeste', 0.35); },
      lines:['Bandeirantes, missionários e criadores de gado avançaram muito além da linha.', 'O <b>Tratado de Madri</b>, negociado pelo diplomata <b>Alexandre de Gusmão</b>, troca Tordesilhas pelo <i>uti possidetis</i>: "quem ocupa, fica com a terra".', 'É por isso que o Brasil de hoje é muito maior que a parte portuguesa de 1494.']}},
    {title:'Pergunta para a turma',
     quiz:{q:'Por que o território brasileiro é muito maior do que a parte portuguesa de Tordesilhas?', o:['Portugal comprou as terras da Espanha', 'A ocupação para o oeste e o Tratado de Madri (1750), com o uti possidetis', 'O papa apagou a linha em 1500'], a:1,
       e:'O Tratado de Madri reconheceu como portuguesas as terras que os portugueses já ocupavam — o uti possidetis.'}}
  ]},
// 2 ---------------------------------------------------------------
{ id:'vasco', year:'1498', date:'8 de julho de 1497', era:1500, world:'Reino de Portugal', icon:'⛵', title:'Vasco da Gama chega à Índia',
  sub:'A primeira rota marítima da Europa até a Ásia',
  nat:{
    A:{name:'Reino de Portugal', short:'Portugal', flag:'Reino de Portugal', leader:'Rei Dom Manuel I', s:{eco:100, pop:1.0, app:68, stab:70, mil:45, sci:'Navegação oceânica'}},
    B:{name:'Calicute', short:'Calicute', icon:'🌶️', leader:'O Samorim (governante)', s:{eco:100, pop:0.1, app:70, stab:70, mil:30, sci:'Rotas das monções'}}
  },
  steps:[
    {view:'A', cam:[-5, 20, 1.6], title:'O caminho das especiarias',
     fx:F => { F.marker(-9.14, 38.7, '⚓', 'Lisboa'); },
     text:P('Pimenta, cravo e canela valiam fortunas, mas vinham da Ásia por terra e pelo Mediterrâneo, passando por muitos intermediários. Em 1488, <b>Bartolomeu Dias</b> tinha contornado o sul da África.') + P('Em 8 de julho de 1497, o rei <b>Dom Manuel I</b> manda <b>Vasco da Gama</b> com quatro navios e cerca de 170 homens.'),
     act:{prompt:'Contorne a África: clique no Cabo da Boa Esperança.', lon:18.5, lat:-34.3, r:5, hint:'A ponta sul da África.',
       do:F => { F.ship([[-9.14, 38.7], [-16, 28], [-23.6, 15], [-20, 0], [-25, -20], [-10, -33], [18.5, -34.4]], 2600, '⛵'); }, wait:2900},
     after:{A:{app:'+3'}}, afterText:'Para pegar bons ventos, a frota fez uma enorme curva pelo Atlântico Sul — a "volta do mar" — e passou o cabo em <b>22 de novembro de 1497</b>.'},
    {skip:{ago:'5 meses depois', date:'abril de 1498', set:{A:{mil:'-5'}},
      lines:['Subindo a costa leste da África, os portugueses enfrentam desconfiança e conflitos em Moçambique e Mombaça.', 'Chegam então a <b>Melinde</b> (no atual Quênia), cujo sultão era rival de Mombaça.']}},
    {view:'A', cam:[42, -5, 3.5], title:'Um piloto para o Índico',
     text:P('O Oceano Índico era desconhecido para os portugueses — mas os navegadores árabes e indianos conheciam os <b>ventos de monção</b> há séculos.'),
     diplo:{prompt:'Abra a diplomacia com o sultão de Melinde: clique em Melinde.', lon:40.1, lat:-3.2, r:3, hint:'Melinde fica na costa do Quênia.', toName:'Sultanato de Melinde', toLeader:'Sultão de Melinde', toIcon:'🕌', icon:'🎁', rel:20, relTxt:'amistosa',
       intro:'O sultão de Melinde recebe Vasco da Gama. O que Portugal faz?',
       opts:[
         {t:'Exigir um piloto à força', h:'Ameaçar a cidade', ok:false, r:'Em outros portos houve violência, mas em Melinde a amizade funcionou — e era muito mais útil ter um aliado na costa.'},
         {t:'Seguir sem piloto', h:'Atravessar o Índico sozinho', ok:false, r:'Sem conhecer as monções, a frota poderia se perder ou ficar meses parada sem vento.'},
         {t:'✔ Trocar presentes e pedir um piloto que conheça as monções', h:'Aliança com o sultão', ok:true, r:'O sultão cede um <b>piloto experiente</b>. Com a monção a favor, a travessia levará só 23 dias.'}
       ]},
     after:{A:{stab:'+3'}}, afterText:'Melinde virou uma aliada dos portugueses por muitos anos.'},
    {view:'A', cam:[60, 5, 2], title:'Atravesse o Índico',
     act:{prompt:'Navegue até a costa da Índia: clique em Calicute.', lon:75.78, lat:11.25, r:5, hint:'Calicute fica na costa sudoeste da Índia.',
       do:F => { F.ship([[40.1, -3.2], [55, 5], [75.78, 11.25]], 2400, '⛵'); F.marker(75.78, 11.25, '🌶️', 'Calicute'); }, wait:2700},
     after:{A:{app:'+6'}}, afterText:'<b>20 de maio de 1498</b>: os portugueses chegam a Calicute, grande porto das especiarias, governado pelo <b>Samorim</b>.'},
    {view:'A', cam:[75.78, 11.25, 4], title:'Diante do Samorim',
     diplo:{prompt:'Abra a diplomacia com Calicute: clique na cidade.', lon:75.78, lat:11.25, r:2, to:'B', icon:'🌶️', rel:0, relTxt:'desconfiada',
       intro:'Os mercadores árabes e indianos, que dominavam o comércio, desconfiam dos recém-chegados. O que Vasco da Gama oferece?',
       opts:[
         {t:'Exigir que só Portugal possa comerciar ali', h:'Monopólio', ok:false, r:'Isso viria depois — em 1500, Cabral tentou impor exclusividade e terminou bombardeando Calicute. Em 1498 os portugueses ainda eram poucos e fracos ali.'},
         {t:'✔ Oferecer os presentes trazidos e pedir licença para comprar especiarias', h:'Tecidos listrados, chapéus, mel, açúcar', ok:true, r:'O Samorim e sua corte acham os presentes <b>pobres</b>. A negociação é tensa e cheia de desconfiança, mas Vasco da Gama consegue comprar pimenta e outras especiarias.'}
       ]},
     after:{B:{app:'-5', stab:'-3'}, A:{eco:'+4'}}, afterText:'Ninguém em Calicute imaginava que aquela visita mudaria o comércio do oceano inteiro.'},
    {skip:{ago:'1 ano depois', date:'setembro de 1499', view:'A', set:{A:{eco:'+25', app:'+10', mil:'-10', sci:'Rota marítima para a Índia'}},
      lines:['Na volta, sem esperar a monção certa, a travessia do Índico leva quase três meses. O escorbuto (falta de vitamina C) mata boa parte da tripulação.', 'Só <b>2 navios</b> e algumas dezenas de homens chegam a Lisboa.', 'Mesmo assim, a carga de especiarias paga a viagem muitas vezes. Dom Manuel se proclama "Senhor da conquista, navegação e comércio da Etiópia, Arábia, Pérsia e Índia".']}},
    {skip:{ago:'11 anos depois', date:'25 de novembro de 1510', view:'B', set:{B:{eco:'-15', stab:'-15', mil:'-5'}},
      fx:F => { F.marker(73.83, 15.49, '🏰', 'Goa (portuguesa até 1961)'); },
      lines:['Os portugueses voltam com canhões e frotas maiores.', '<b>Afonso de Albuquerque</b> conquista <b>Goa</b>, que fica portuguesa até 1961.', 'Para os mercadores do Índico, começa uma era de domínio europeu pelo mar.']}},
    {title:'Pergunta para a turma',
     quiz:{q:'Por que a rota de Vasco da Gama era tão valiosa?', o:['Porque era a mais curta da história', 'Porque levava às especiarias pelo mar, sem os intermediários do caminho terrestre', 'Porque descobriu o Brasil'], a:1,
       e:'Comprando direto na Índia e levando tudo por mar, Portugal escapava dos intermediários do Mediterrâneo — e lucrava muito mais.'}}
  ]},
// 3 ---------------------------------------------------------------
{ id:'cabral', year:'1500', date:'9 de março de 1500', era:1500, world:'Reino de Portugal', icon:'🏝️', title:'Cabral chega ao Brasil',
  sub:'O encontro de dois mundos e o que veio depois',
  nat:{
    A:{name:'Reino de Portugal', short:'Portugal', flag:'Reino de Portugal', leader:'Rei Dom Manuel I', s:{eco:125, pop:1.0, app:75, stab:72, mil:50, sci:'Rota para a Índia'}},
    B:{name:'Povos indígenas do Brasil', short:'Povos indígenas', icon:'🪶', leader:'Tupiniquins, Tupinambás, Guaranis e centenas de outros povos', s:{eco:100, pop:3.0, app:80, stab:80, mil:30, sci:'Agricultura de mandioca, canoas, ervas medicinais'}}
  },
  steps:[
    {view:'A', cam:[-25, 15, 1.6], title:'Treze navios rumo à Índia',
     fx:F => { F.marker(-9.14, 38.7, '⚓', 'Lisboa'); F.ship([[-9.14, 38.7], [-16, 28], [-23.6, 15], [-28, 0]], 2200, '⛵'); },
     text:P('Em 9 de março de 1500, <b>Pedro Álvares Cabral</b> sai de Lisboa com <b>13 navios</b> e cerca de 1.200 a 1.500 homens, rumo à Índia. Para pegar bons ventos, a frota se afasta muito da costa da África...'),
     act:{prompt:'Clique onde a frota avistou terra: o Monte Pascoal, no sul da Bahia.', lon:-39.4, lat:-16.9, r:4, hint:'Litoral sul da Bahia, perto de Porto Seguro.',
       do:F => { F.ship([[-28, 0], [-34, -12], [-39.0, -16.6]], 1800, '⛵'); F.marker(-39.4, -16.9, '⛰️', 'Monte Pascoal'); F.marker(-39.06, -16.45, '✝️', 'Porto Seguro'); SFX.bell(); }, wait:2400},
     after:{A:{app:'+5'}}, afterText:'<b>22 de abril de 1500.</b> "Terra à vista!" Os portugueses chamam o lugar de <b>Ilha de Vera Cruz</b>.'},
    {view:'A', cam:[-39.1, -16.4, 5], title:'O primeiro encontro',
     text:P('Na praia, havia gente: os <b>Tupiniquins</b>. O escrivão <b>Pero Vaz de Caminha</b> anota tudo para o rei.'),
     diplo:{prompt:'Vá até a praia: clique em Porto Seguro para o primeiro contato.', lon:-39.06, lat:-16.45, r:1.5, z:5, to:'B', icon:'🤝', rel:10, relTxt:'curiosidade dos dois lados',
       intro:'Os dois grupos se observam. Ninguém fala a língua do outro. O que os portugueses fazem?',
       opts:[
         {t:'Atacar e tomar a terra', h:'Usar as armas', ok:false, r:'Isso não aconteceu nesse primeiro encontro — Caminha descreve contatos pacíficos. A violência viria nas décadas seguintes.'},
         {t:'Ignorar e seguir viagem', h:'', ok:false, r:'A frota ainda ficou dez dias ali, abastecendo e observando a terra.'},
         {t:'✔ Trocar presentes por gestos', h:'Gorros, contas, guizos ↔ cocares, colares, arcos', ok:true, r:'Caminha conta que os indígenas eram curiosos e hospitaleiros; trocaram um gorro vermelho e outros objetos por um cocar de penas e um colar. Dois deles dormiram num dos navios.'}
       ]},
     after:{B:{app:'-2'}}, afterText:'No dia 26 de abril, frei <b>Henrique de Coimbra</b> celebrou a primeira missa. A carta de Caminha é chamada de "certidão de nascimento" do Brasil.'},
    {skip:{ago:'34 anos depois', date:'1534', set:{A:{eco:'+10', sci:'Engenhos de açúcar'}, B:{pop:'-0.6', stab:'-25', app:'-25'}},
      fx:F => { F.overlay(hsBoxCells(-46.6, -28, -34, -2), '#1f6f3a', 'Capitanias hereditárias', 0.35); },
      lines:['Por três décadas, Portugal explora o <b>pau-brasil</b> com trabalho indígena trocado por objetos (o escambo).', 'Para ocupar a costa contra os franceses, <b>Dom João III</b> divide o litoral em <b>capitanias hereditárias</b> (1534).', 'Chegam os engenhos de açúcar — e a escravização de indígenas e, depois, de africanos.']}},
    {skip:{ago:'Séculos depois', date:'2022', view:'B', set:{B:{pop:1.69, sci:'274 línguas faladas (Censo 2010)'}},
      fx:F => { F.overlay(hsBoxCells(-74, -34, -34, 5), '#8b4513', 'Terras indígenas: ≈14% do Brasil hoje', 0.2); },
      lines:['Doenças trazidas da Europa (varíola, sarampo, gripe), guerras, escravização e a perda das terras fizeram a população indígena cair drasticamente.', 'Mas eles resistiram: o <b>Censo de 2022</b> contou cerca de <b>1,7 milhão</b> de indígenas, de mais de 300 povos.']}},
    {view:'B', cam:[-52, -12, 1.8], title:'Os dois lados da história',
     text:P('Para Portugal, 1500 foi o começo de uma colônia riquíssima. Para os povos originários, o começo de séculos de perdas — e de resistência, que continua hoje na luta pela demarcação de terras e pela preservação das línguas e culturas.') + P('Compare as duas "telas" no topo: clique em <b>Portugal</b> e em <b>Povos indígenas</b>.')},
    {title:'Pergunta para a turma',
     quiz:{q:'Por que a carta de Pero Vaz de Caminha é tão importante?', o:['Porque é o primeiro registro escrito sobre a terra e os povos que viviam aqui', 'Porque foi o tratado que dividiu o Brasil', 'Porque proclamou a independência'], a:0,
       e:'A carta descreve em detalhes a chegada, a natureza e os indígenas — por isso é chamada de "certidão de nascimento" do Brasil.'}}
  ]},
// 4 ---------------------------------------------------------------
{ id:'familia_real', year:'1808', date:'21 de novembro de 1806', era:1700, world:'Império Português', icon:'👑', title:'A família real vem para o Brasil',
  sub:'Fugindo de Napoleão, a corte portuguesa atravessa o Atlântico',
  nat:{
    A:{name:'Portugal', short:'Portugal', flag:'Império Português', leader:'Príncipe regente Dom João', s:{eco:100, pop:3.0, app:60, stab:60, mil:40, sci:'Iluminismo tardio'}},
    B:{name:'Brasil (colônia)', short:'Brasil', icon:'🌴', leader:'Vice-rei Conde dos Arcos', s:{eco:100, pop:3.5, app:55, stab:60, mil:20, sci:'Imprensa proibida'}}
  },
  steps:[
    {view:'A', cam:[0, 45, 3], title:'O Bloqueio Continental',
     fx:F => { F.marker(2.35, 48.85, '🦅', 'Napoleão'); F.marker(-0.13, 51.5, '⚓', 'Londres'); },
     text:P('O imperador francês <b>Napoleão Bonaparte</b> domina quase toda a Europa, mas não consegue vencer a marinha inglesa. Em 21 de novembro de 1806 ele decreta o <b>Bloqueio Continental</b>: nenhum país europeu pode comerciar com a Inglaterra.') + P('Portugal, velho aliado e parceiro comercial dos ingleses, está entre a cruz e a espada.'),
     diplo:{prompt:'Napoleão exige que Portugal feche os portos aos ingleses. Responda: clique na França.', lon:2.35, lat:47, r:5, toName:'Império Francês', toLeader:'Imperador Napoleão Bonaparte', toIcon:'🦅', icon:'⚠️', rel:-30, relTxt:'ameaçadora',
       intro:'O embaixador francês exige: fechar os portos, prender os ingleses em Portugal e confiscar seus bens. O que o príncipe regente faz?',
       opts:[
         {t:'Obedecer e romper com a Inglaterra', h:'Fechar os portos de verdade', ok:false, r:'A Inglaterra era a maior aliada de Portugal — e tinha a marinha capaz de tomar o Brasil e as outras colônias.'},
         {t:'Declarar guerra à França', h:'', ok:false, r:'O exército português era pequeno demais para enfrentar Napoleão.'},
         {t:'✔ Ganhar tempo: fingir que cumpre, mas manter a aliança inglesa', h:'Diplomacia da hesitação', ok:true, r:'Dom João enrola o quanto pode. Napoleão perde a paciência e assina com a Espanha o <b>Tratado de Fontainebleau</b> (27 de outubro de 1807), que divide Portugal entre os dois.'}
       ]},
     after:{A:{stab:'-10', app:'-5'}}, afterText:'O exército francês do general <b>Junot</b> entra na Espanha e marcha para Lisboa.'},
    {skip:{ago:'1 ano depois', date:'29 de novembro de 1807', set:{A:{stab:'-15', mil:'-10'}},
      fx:F => { F.arrow([-1.5, 43], [-9.14, 38.7], '#1f3f8c'); },
      lines:['As tropas de Junot estão a poucos dias de Lisboa.', 'Os ingleses oferecem escoltar a família real até o Brasil.', 'Começa a correria: baús, ouro, arquivos, livros da Biblioteca Real...']}},
    {view:'A', cam:[-25, 10, 1.6], title:'A fuga',
     diplo:{prompt:'Aceite a proteção inglesa: clique na Inglaterra.', lon:-1.5, lat:52.5, r:4, toName:'Reino Unido', toLeader:'Rei Jorge III', toIcon:'⚓', icon:'🛡️', rel:60, relTxt:'aliados',
       intro:'O embaixador britânico, <b>Lord Strangford</b>, insiste: a corte deve partir já.',
       opts:[
         {t:'Ficar e resistir em Lisboa', h:'', ok:false, r:'Sem exército suficiente, a família real seria presa por Napoleão — como aconteceu com a família real espanhola em 1808.'},
         {t:'✔ Embarcar a corte para o Brasil, com escolta da marinha britânica', h:'Talvez 10 a 15 mil pessoas', ok:true, r:'Em 29 de novembro de 1807, a frota zarpa — horas antes de os franceses entrarem em Lisboa.'}
       ]},
     after:{A:{leader:'Governo provisório (ocupado pelos franceses)'}}, afterText:'A rainha <b>Dona Maria I</b>, o príncipe <b>Dom João</b>, a princesa <b>Carlota Joaquina</b> e o pequeno <b>Dom Pedro</b> estão a bordo.'},
    {view:'B', cam:[-25, 5, 1.6], title:'A travessia',
     text:P('Quase dois meses de viagem em navios lotados, com falta de água e de comida.'),
     act:{prompt:'Leve a corte ao Brasil: clique em Salvador, a primeira parada.', lon:-38.5, lat:-12.97, r:4, hint:'Salvador fica no litoral da Bahia.',
       do:F => { F.ship([[-9.14, 38.7], [-16, 28], [-24, 12], [-32, -2], [-38.5, -12.97]], 2600, '⛵'); F.marker(-38.5, -12.97, '⚓', 'Salvador'); }, wait:2900},
     after:{B:{leader:'Príncipe regente Dom João (a corte chegou!)', app:'+10'}}, afterText:'<b>22 de janeiro de 1808.</b> Pela primeira vez na história, um rei europeu pisa numa colônia.'},
    {view:'B', cam:[-38.5, -13, 4], title:'Salvador: a primeira grande decisão',
     diplo:{prompt:'Os comerciantes pedem o fim do monopólio. Decida: clique no porto de Salvador.', lon:-38.5, lat:-12.97, r:1.5, toName:'Comerciantes e "nações amigas"', toLeader:'Visconde de Cairu (economista)', toIcon:'⚓', icon:'📜', rel:40, relTxt:'esperançosa',
       intro:'Com Lisboa ocupada, os navios não têm para onde levar o açúcar e o algodão do Brasil. O economista baiano <b>José da Silva Lisboa</b> (futuro Visconde de Cairu) defende o livre-comércio.',
       opts:[
         {t:'Manter o monopólio: só comerciar com Portugal', h:'', ok:false, r:'Impossível: Portugal estava ocupado pelos franceses. A economia da colônia pararia.'},
         {t:'✔ Abrir os portos às nações amigas', h:'Carta Régia de 28 de janeiro de 1808', ok:true, r:'O Brasil pode comerciar diretamente com outros países — sobretudo a Inglaterra. É o fim do <b>pacto colonial</b>.'}
       ]},
     after:{B:{eco:'+20', app:'+5'}}, afterText:'Os navios ingleses chegam cheios de tecidos e ferramentas; o açúcar e o algodão brasileiros ganham o mundo.'},
    {view:'B', cam:[-41, -18, 3], title:'A nova capital',
     act:{prompt:'Siga para a nova capital do império: clique no Rio de Janeiro.', lon:-43.2, lat:-22.9, r:3, hint:'O Rio fica no litoral sudeste.',
       do:F => { F.ship([[-38.5, -12.97], [-37.5, -18], [-40, -22.5], [-43.2, -22.95]], 2000, '⛵'); F.marker(-43.2, -22.9, '👑', 'Rio de Janeiro'); SFX.bell(); }, wait:2400},
     after:{B:{stab:'+5'}}, afterText:'<b>7 de março de 1808.</b> Para abrigar a corte, casas foram tomadas e marcadas com "P.R." (Príncipe Regente) — que o povo apelidou de "Ponha-se na Rua".'},
    {skip:{ago:'7 anos depois', date:'16 de dezembro de 1815', view:'B', set:{B:{eco:'+30', pop:'+0.8', app:'+10', sci:'Imprensa Régia, Banco do Brasil, Jardim Botânico', mil:'+15'}, A:{eco:'-15', app:'-15'}},
      lines:['Nascem o <b>Banco do Brasil</b> (1808), a <b>Imprensa Régia</b> (1808), o <b>Jardim Botânico</b>, a Biblioteca Real, escolas de medicina.', 'Napoleão é derrotado (1815). Em vez de voltar, Dom João eleva o Brasil a <b>Reino Unido de Portugal, Brasil e Algarves</b>: o Brasil deixa, no papel, de ser colônia.', 'Em Portugal, governado de longe, cresce o descontentamento.']}},
    {skip:{ago:'6 anos depois', date:'26 de abril de 1821', view:'A', set:{A:{stab:'+10', leader:'Rei Dom João VI'}},
      fx:F => { F.ship([[-43.2, -22.95], [-32, -2], [-16, 28], [-9.14, 38.7]], 2600, '⛵'); },
      lines:['A <b>Revolução do Porto</b> (1820) exige a volta do rei.', '<b>Dom João VI</b> embarca de volta a Lisboa, deixando no Brasil seu filho, <b>Dom Pedro</b>, como regente.', 'O que vem depois você joga no cenário da <b>Independência</b>.']}},
    {title:'Pergunta para a turma',
     quiz:{q:'Qual foi a primeira grande medida de Dom João ao chegar ao Brasil?', o:['A abolição da escravidão', 'A abertura dos portos às nações amigas', 'A proclamação da República'], a:1,
       e:'A abertura dos portos (28 de janeiro de 1808) acabou com o monopólio comercial de Portugal sobre o Brasil.'}}
  ]},
// 5 ---------------------------------------------------------------
{ id:'independencia', year:'1822', date:'9 de janeiro de 1822', era:1700, world:'Império Português', icon:'🟩', title:'A Independência do Brasil',
  sub:'Do Dia do Fico ao reconhecimento de 1825',
  nat:{
    A:{name:'Reino de Portugal', short:'Portugal', flag:'Império Português', leader:'Rei Dom João VI', s:{eco:85, pop:3.0, app:60, stab:62, mil:45, sci:'Cortes constitucionais'}},
    B:{name:'Brasil', short:'Brasil', icon:'🟩', leader:'Príncipe regente Dom Pedro', s:{eco:150, pop:4.5, app:60, stab:55, mil:35, sci:'Imprensa e escolas da corte'}}
  },
  steps:[
    {view:'B', cam:[-43.2, -22.9, 3.5], title:'As Cortes de Lisboa',
     fx:F => { F.overlay(hsNationCells('Império Português').filter(c => cellCenter(c)[0] < -30), '#1f4e8c', 'Domínio português', 0.25); },
     text:P('Depois da Revolução do Porto, as <b>Cortes</b> (o parlamento português) querem reduzir o Brasil de novo a colônia: mandam fechar instituições criadas no Rio e ordenam que <b>Dom Pedro</b> volte a Portugal.') + P('No Rio e em São Paulo, um abaixo-assinado com milhares de nomes pede que ele fique. Ao lado dele estão <b>José Bonifácio</b> e a princesa <b>Maria Leopoldina</b>.'),
     diplo:{prompt:'Responda às Cortes: clique em Lisboa.', lon:-9.14, lat:38.7, r:4, to:'A', from:'B', icon:'📜', rel:-20, relTxt:'tensa',
       intro:'A ordem é clara: o príncipe deve voltar imediatamente. O que Dom Pedro responde?',
       opts:[
         {t:'Obedecer e voltar a Portugal', h:'', ok:false, r:'Se Dom Pedro voltasse, as Cortes desmontariam o governo no Rio — e o Brasil poderia se fragmentar em várias repúblicas, como a América espanhola.'},
         {t:'✔ "Se é para o bem de todos e felicidade geral da nação, diga ao povo que fico!"', h:'O Dia do Fico', ok:true, r:'As Cortes ficam furiosas. A ruptura começa: Dom Pedro passa a exigir o "cumpra-se" para qualquer ordem vinda de Lisboa.'}
       ]},
     after:{B:{app:'+12', stab:'+5'}, A:{stab:'-5'}}, afterText:'<b>9 de janeiro de 1822</b>: o Dia do Fico.'},
    {skip:{ago:'8 meses depois', date:'2 de setembro de 1822', set:{B:{stab:'+5'}},
      lines:['Dom Pedro viaja a São Paulo para acalmar disputas políticas.', 'No Rio chegam novas cartas de Lisboa, ainda mais duras.', 'A princesa <b>Leopoldina</b>, que preside o Conselho de Estado, assina o decreto recomendando a separação e manda as cartas ao marido.']}},
    {view:'B', cam:[-46.6, -23.5, 4], title:'7 de setembro de 1822',
     text:P('O mensageiro alcança Dom Pedro perto do riacho Ipiranga.'),
     act:{prompt:'Clique em São Paulo, às margens do Ipiranga.', lon:-46.61, lat:-23.58, r:2.5, z:4, hint:'O Ipiranga fica na cidade de São Paulo.',
       do:F => { F.ring(-46.61, -23.58, '#2d6a2d', 40); F.text(-46.61, -22.6, '"Independência ou Morte!"', '#2d6a2d'); SFX.fanfare();
         setTimeout(() => { F.cam(-50, -14, 1.8); hsFx().overlays = []; F.overlay(hsNationCells('Império Português').filter(c => cellCenter(c)[0] < -30), '#1e7a32', 'Brasil independente', 0.55); }, 1300); }, wait:3200},
     after:{B:{app:'+15', leader:'Dom Pedro I (aclamado imperador)'}, A:{eco:'-20', app:'-10'}}, afterText:'"Independência ou Morte!" Em 1º de dezembro, Dom Pedro é coroado <b>Imperador do Brasil</b>.'},
    {skip:{ago:'10 meses depois', date:'2 de julho de 1823', set:{B:{mil:'+15', eco:'-10', stab:'+5'}, A:{mil:'-10'}},
      fx:F => { F.boom(-38.5, -12.97); F.marker(-38.5, -12.97, '⚔️', 'Bahia, 2 de julho'); },
      lines:['A independência não foi só um grito: tropas portuguesas resistem na <b>Bahia</b>, no Pará, no Maranhão e na Cisplatina.', 'Na Bahia, o povo, soldados e heroínas como <b>Maria Quitéria</b> e <b>Joana Angélica</b> lutam por mais de um ano.', 'Em <b>2 de julho de 1823</b>, os portugueses deixam Salvador.']}},
    {skip:{ago:'2 anos depois', date:'agosto de 1825', view:'B',
      lines:['Portugal ainda não reconhece a independência.', 'A Inglaterra, interessada no comércio com o Brasil, se oferece para mediar o acordo.']}},
    {view:'B', cam:[-20, 15, 1.5], title:'O reconhecimento',
     diplo:{prompt:'Negocie o tratado com Portugal: clique em Lisboa.', lon:-9.14, lat:38.7, r:4, to:'A', from:'B', icon:'🖋️', rel:-10, relTxt:'em negociação (mediação inglesa)',
       intro:'O diplomata inglês <b>Charles Stuart</b> traz a proposta portuguesa.',
       opts:[
         {t:'Recusar qualquer pagamento e continuar a guerra', h:'', ok:false, r:'Sem reconhecimento, o Brasil teria dificuldade de fazer tratados e empréstimos com outros países.'},
         {t:'✔ Aceitar: Portugal reconhece a independência; o Brasil paga uma indenização', h:'≈ 2 milhões de libras esterlinas', ok:true, r:'O <b>Tratado do Rio de Janeiro</b> (29 de agosto de 1825) é assinado. Para pagar, o Brasil faz um empréstimo... na Inglaterra.'}
       ]},
     after:{B:{eco:'-15', stab:'+10'}, A:{eco:'+5', stab:'+5'}}, afterText:'O Brasil é oficialmente um país independente — mas a escravidão continua, e só acabaria em 1888.'},
    {title:'Pergunta para a turma',
     quiz:{q:'Quem assinou o decreto que levou à separação, enquanto Dom Pedro estava em viagem?', o:['José Bonifácio, sozinho', 'A princesa Maria Leopoldina, à frente do Conselho de Estado', 'O rei Dom João VI'], a:1,
       e:'Em 2 de setembro de 1822, Leopoldina presidiu o Conselho de Estado e assinou o decreto, mandando as cartas a Dom Pedro.'}}
  ]},
// 6 ---------------------------------------------------------------
{ id:'sarajevo', year:'1914', date:'28 de junho de 1914', era:1914, world:'Áustria-Hungria', icon:'💥', title:'De Sarajevo à Primeira Guerra Mundial',
  sub:'Um atentado, um ultimato e o efeito dominó das alianças',
  nat:{
    A:{name:'Áustria-Hungria', short:'Áustria-Hungria', flag:'Áustria-Hungria', leader:'Imperador Francisco José I', s:{eco:100, pop:52, app:55, stab:50, mil:100, sci:'Industrial'}},
    B:{name:'Reino da Sérvia', short:'Sérvia', flag:'Reino da Sérvia', leader:'Rei Pedro I (regente: Alexandre)', s:{eco:100, pop:4.5, app:70, stab:65, mil:40, sci:'Agrícola'}},
    C:{name:'Império Alemão', short:'Alemanha', flag:'Império Alemão', leader:'Kaiser Guilherme II', s:{eco:100, pop:67, app:65, stab:70, mil:160, sci:'Química, aço, motores'}}
  },
  steps:[
    {view:'A', cam:[18.4, 44, 4.5], title:'Um herdeiro em Sarajevo',
     fx:F => { F.overlay(hsNationCells('Império Alemão').concat(hsNationCells('Áustria-Hungria'), hsNationCells('Reino da Itália')), '#7a5c2e', 'Tríplice Aliança', 0.25);
       F.overlay(hsNationCells('França').concat(hsNationCells('Império Russo').filter(c => cellCenter(c)[0] < 45), hsNationCells('Reino Unido')), '#1f4e8c', 'Tríplice Entente', 0.22); },
     text:P('A Europa estava dividida em dois blocos de alianças. Nos Bálcãs, a <b>Bósnia</b>, anexada pela Áustria-Hungria em 1908, era desejada pela <b>Sérvia</b>.') + P('Em 28 de junho de 1914, o herdeiro do trono, arquiduque <b>Francisco Ferdinando</b>, e sua esposa <b>Sofia</b> visitam Sarajevo. Jovens nacionalistas, armados com ajuda de uma organização secreta sérvia (a "Mão Negra"), os esperam.'),
     act:{prompt:'Clique em Sarajevo, onde aconteceu o atentado.', lon:18.41, lat:43.86, r:2, z:5, hint:'Sarajevo fica na Bósnia, nos Bálcãs.',
       do:F => { F.ring(18.41, 43.86, '#8b1a1a', 20); F.text(18.41, 44.6, 'Atentado', '#8b1a1a'); F.marker(18.41, 43.86, '🎯', 'Sarajevo'); }, wait:2000},
     after:{A:{stab:'-10', app:'+10'}}, afterText:'<b>Gavrilo Princip</b>, de 19 anos, dispara. Francisco Ferdinando e Sofia morrem. Em Viena, a raiva contra a Sérvia explode.'},
    {skip:{ago:'3 semanas depois', date:'23 de julho de 1914', set:{A:{mil:'+10'}},
      lines:['Viena consulta Berlim. O <b>Kaiser Guilherme II</b> promete apoio total à Áustria-Hungria, aconteça o que acontecer — o famoso "cheque em branco".', 'O governo austro-húngaro prepara um ultimato à Sérvia.']}},
    {view:'A', cam:[19, 45.5, 3.5], title:'O ultimato',
     diplo:{prompt:'Como Áustria-Hungria, abra a diplomacia com a Sérvia: clique em Belgrado.', lon:20.46, lat:44.8, r:2, z:4, to:'B', icon:'⚠️', rel:-60, relTxt:'hostil',
       intro:'O ministro austro-húngaro <b>Leopold Berchtold</b> tem o texto pronto. O que fazer?',
       opts:[
         {t:'Investigar o atentado junto com a Sérvia, sem ameaças', h:'', ok:false, r:'E se? Talvez a guerra fosse evitada. Mas Viena queria usar o atentado para enfraquecer a Sérvia de vez.'},
         {t:'Aceitar a conferência internacional proposta pelo Reino Unido', h:'Mediação das potências', ok:false, r:'O ministro britânico <b>Edward Grey</b> propôs uma conferência; Viena e Berlim recusaram.'},
         {t:'✔ Enviar um ultimato com 10 exigências e prazo de 48 horas', h:'Inclui investigadores austríacos dentro da Sérvia', ok:true, r:'A Sérvia aceita quase tudo — mas não que policiais austríacos investiguem em seu território. Para Viena, é o pretexto: relações rompidas.'}
       ]},
     after:{B:{stab:'-10', mil:'+10'}, A:{app:'+5'}}, afterText:'A Sérvia mobiliza seu exército. A Rússia, protetora dos eslavos, avisa que não vai abandoná-la.'},
    {view:'A', cam:[19, 45.5, 3.5], title:'Guerra à Sérvia',
     act:{prompt:'Declare guerra: clique na Sérvia.', lon:20.46, lat:44.8, r:2, z:4, hint:'Belgrado fica a leste de Sarajevo.',
       do:F => { F.arrow([16.37, 48.2], [20.46, 44.8], '#7a5c2e'); setTimeout(() => F.boom(20.46, 44.8), 1100); }, wait:2400},
     after:{B:{stab:'-10', eco:'-10'}, A:{eco:'-5'}}, afterText:'<b>28 de julho de 1914</b>: Áustria-Hungria declara guerra à Sérvia. Belgrado é bombardeada.'},
    {skip:{ago:'1 semana depois', date:'2 de agosto de 1914', view:'C', set:{C:{mil:'+20', eco:'-5'}},
      fx:F => { F.arrow([37.6, 55.75], [20.46, 44.8], '#1f4e8c'); setTimeout(() => F.arrow([13.4, 52.52], [37.6, 55.75], '#7a5c2e'), 900); setTimeout(() => F.arrow([13.4, 52.52], [2.35, 48.85], '#7a5c2e'), 1800); },
      lines:['30 de julho: a <b>Rússia</b> mobiliza seu exército.', '1º de agosto: a <b>Alemanha</b> declara guerra à Rússia. A França, aliada russa, também se prepara.', 'O plano alemão — o <b>Plano Schlieffen</b> — é vencer a França rapidamente atravessando um país neutro.']}},
    {view:'C', cam:[6, 50.5, 3.5], title:'O Plano Schlieffen',
     diplo:{prompt:'Como Alemanha, abra a diplomacia com a Bélgica: clique em Bruxelas.', lon:4.35, lat:50.85, r:2, z:4, toName:'Reino da Bélgica', toLeader:'Rei Alberto I', toIcon:'🇧🇪', icon:'⚠️', rel:0, relTxt:'neutra (garantida pelo Tratado de Londres, 1839)',
       intro:'Para cercar a França, o exército alemão precisa passar pela Bélgica.',
       opts:[
         {t:'Atacar a França direto pela fronteira, sem passar pela Bélgica', h:'', ok:false, r:'A fronteira franco-alemã era muito fortificada; o plano alemão apostava na rapidez pelo norte.'},
         {t:'✔ Exigir passagem livre pela Bélgica (ultimato de 2 de agosto)', h:'12 horas para responder', ok:true, r:'O rei <b>Alberto I</b> responde: a Bélgica é "uma nação, não uma estrada". Recusa.'}
       ]},
     after:{C:{app:'+5'}}, afterText:'A Alemanha decide invadir mesmo assim.'},
    {view:'C', cam:[5, 50.5, 3], title:'A invasão',
     act:{prompt:'Invada a Bélgica: clique nela.', lon:4.35, lat:50.85, r:2.5, z:3.5, hint:'Entre a França e a Alemanha.',
       do:F => { F.arrow([13.4, 52.52], [4.35, 50.85], '#7a5c2e'); setTimeout(() => F.boom(4.35, 50.85), 1100); setTimeout(() => F.arrow([-0.13, 51.5], [4.35, 50.85], '#1f4e8c'), 1500); F.text(1, 52.5, '4 de agosto: o Reino Unido entra na guerra', '#1f4e8c'); }, wait:3000},
     after:{C:{eco:'-10'}}, afterText:'O Reino Unido tinha garantido a neutralidade belga desde 1839. Em <b>4 de agosto</b>, declara guerra à Alemanha. A guerra é mundial.'},
    {skip:{ago:'4 anos depois', date:'11 de novembro de 1918', view:'A', set:{A:{eco:'-45', app:'-40', stab:'-50', mil:'-80', pop:'-1.5', leader:'Imperador Carlos I (abdica)'}, B:{pop:'-0.8', eco:'-40', stab:'-20', mil:'-20'}, C:{eco:'-40', mil:'-120', stab:'-50', leader:'Kaiser abdica: nasce uma república'}},
      lines:['Trincheiras, metralhadoras, gás venenoso, os primeiros tanques e aviões. Entram o Império Otomano, a Itália, os Estados Unidos — e até o Brasil (1917).', 'Cerca de <b>17 milhões de mortos</b>, entre soldados e civis.', 'O armistício é assinado em 11 de novembro de 1918. Quatro impérios desaparecem: o <b>austro-húngaro</b>, o <b>alemão</b>, o <b>russo</b> e o <b>otomano</b>.']}},
    {view:'B', cam:[20, 44, 3], title:'Do lado da Sérvia',
     text:P('A Sérvia resistiu às primeiras invasões, mas foi ocupada em 1915; o exército e milhares de civis fugiram a pé pelas montanhas da Albânia no inverno, a "Grande Retirada". Proporcionalmente, foi um dos países que mais perdeu gente — as estimativas variam, mas a perda foi enorme, entre combates, fome e epidemias.') + P('Em 1918 a Sérvia virou o centro de um novo país: a <b>Iugoslávia</b>. Compare as três "telas" no topo.')},
    {title:'Pergunta para a turma',
     quiz:{q:'Por que um atentado numa cidade dos Bálcãs virou uma guerra mundial?', o:['Porque Sarajevo era a capital da Europa', 'Por causa do sistema de alianças, que arrastou as potências uma após a outra', 'Porque Gavrilo Princip era alemão'], a:1,
       e:'As alianças transformaram um conflito entre Áustria-Hungria e Sérvia numa guerra entre os dois grandes blocos da Europa.'}}
  ]},
// 7 ---------------------------------------------------------------
{ id:'hiroshima', year:'1945', date:'16 de julho de 1945', era:1914, world:'Estados Unidos', icon:'☢️', title:'Hiroshima e Nagasaki',
  sub:'As únicas bombas atômicas já usadas numa guerra',
  nat:{
    A:{name:'Estados Unidos', short:'EUA', flag:'Estados Unidos', leader:'Presidente Harry S. Truman', s:{eco:100, pop:140, app:87, stab:80, mil:150, sci:'Projeto Manhattan (secreto)'}},
    B:{name:'Império do Japão', short:'Japão', flag:'Império do Japão', leader:'Imperador Hirohito · Premiê Kantarō Suzuki', s:{eco:100, pop:72, app:50, stab:45, mil:60, sci:'Radar e aviação'}}
  },
  steps:[
    {view:'A', cam:[-106.5, 33.7, 4], title:'O teste Trinity',
     text:P('A guerra na Europa acabou em maio, mas no Pacífico continua. Em segredo, o <b>Projeto Manhattan</b> — liderado pelo físico <b>J. Robert Oppenheimer</b> e pelo general <b>Leslie Groves</b> — construiu a primeira bomba atômica.'),
     act:{prompt:'Clique no deserto do Novo México para o teste Trinity.', lon:-106.47, lat:33.68, r:2.5, z:4, hint:'Sudoeste dos Estados Unidos.',
       do:F => { F.nuke(-106.47, 33.68); F.text(-106.47, 34.6, 'Trinity · 16/7/1945 · 5h29', '#8b1a1a'); }, wait:3500},
     after:{A:{sci:'Bomba atômica', mil:'+30'}}, afterText:'Funcionou. Vendo o clarão, Oppenheimer lembrou um verso do texto hindu Bhagavad Gita: "Agora me tornei a Morte, a destruidora de mundos".'},
    {skip:{ago:'10 dias depois', date:'26 de julho de 1945', set:{B:{stab:'-5'}},
      lines:['Em Potsdam, na Alemanha ocupada, <b>Truman</b>, o premiê britânico e o líder chinês <b>Chiang Kai-shek</b> preparam um ultimato ao Japão.', 'Os EUA planejam invadir o Japão em novembro (Operação Downfall). As batalhas de Iwo Jima e Okinawa mostraram que a invasão custaria um número enorme de vidas.']}},
    {view:'A', cam:[150, 35, 2], title:'A Declaração de Potsdam',
     diplo:{prompt:'Como EUA, abra a diplomacia com o Japão: clique em Tóquio.', lon:139.69, lat:35.69, r:3, to:'B', icon:'⚠️', rel:-90, relTxt:'em guerra',
       intro:'O que os Aliados dizem ao Japão?',
       opts:[
         {t:'Oferecer uma rendição com condições (o imperador continua)', h:'', ok:false, r:'E se? Historiadores debatem até hoje se isso teria encerrado a guerra antes. No fim, o imperador foi mantido de qualquer forma.'},
         {t:'Invadir o Japão imediatamente', h:'', ok:false, r:'A invasão (Operação Downfall) só estava pronta para novembro.'},
         {t:'✔ Exigir a rendição incondicional ou "destruição imediata e total"', h:'Declaração de Potsdam', ok:true, r:'O premiê <b>Kantarō Suzuki</b> responde com a palavra <i>mokusatsu</i> — "ignorar" ou "não comentar". Os Aliados entendem como recusa.'}
       ]},
     after:{B:{app:'-5'}}, afterText:'O presidente <b>Truman</b> autoriza o uso da bomba contra uma cidade japonesa. Cientistas como <b>Leó Szilárd</b> tinham pedido, sem sucesso, que ela não fosse usada contra civis.'},
    {skip:{ago:'11 dias depois', date:'6 de agosto de 1945 · 8h15', set:{},
      lines:['Às 2h45 da madrugada, o bombardeiro B-29 <i>Enola Gay</i>, pilotado pelo coronel <b>Paul Tibbets</b>, decola da ilha de Tinian.', 'Ele leva a bomba de urânio "<b>Little Boy</b>".', 'Em Hiroshima, uma manhã de sol. As pessoas vão para o trabalho; as crianças, para a escola.']}},
    {view:'A', cam:[133, 34, 3.5], title:'Hiroshima',
     act:{prompt:'Clique em Hiroshima, no sul da ilha de Honshu.', lon:132.45, lat:34.39, r:2, z:4, hint:'Sudoeste do Japão, na ilha principal.',
       do:F => { F.plane([145.6, 15], [132.45, 34.39]); setTimeout(() => { F.nuke(132.45, 34.39); F.circle(132.45, 34.39, 0.6, '#b3261e', 'rgba(179,38,30,0.25)'); F.text(132.45, 35.3, '6/8/1945 · 8h15', '#8b1a1a'); }, 2300); }, wait:5000},
     after:{A:{mil:'+10'}}, afterText:'A bomba explode a cerca de 600 metros de altura, com força equivalente a cerca de <b>15 mil toneladas de TNT</b>. Truman anuncia ao mundo uma arma que "aproveita o poder básico do universo".'},
    {view:'B', cam:[132.45, 34.39, 6], title:'Agora, do lado de Hiroshima',
     fx:F => { setTimeout(() => F.nuke(132.45, 34.39), 400); },
     set:{B:{pop:'-0.14', eco:'-10', app:'-10', stab:'-10'}},
     text:P('Veja de novo, agora do chão. Um clarão mais quente que a superfície do Sol; quase tudo num raio de cerca de 1,6 km é destruído e incendiado. Depois vem a "<b>chuva negra</b>", carregada de fuligem radioativa.') + P('Até o fim de 1945, cerca de <b>140 mil pessoas</b> morreram em Hiroshima. Cerca de 70% dos prédios foram destruídos. Os sobreviventes, os <b>hibakusha</b>, sofreram por décadas com câncer e preconceito.')},
    {skip:{ago:'3 dias depois', date:'9 de agosto de 1945', view:'B', set:{B:{mil:'-25', stab:'-10'}},
      fx:F => { F.arrow([131.9, 43.1], [125, 45], '#a3322a'); },
      lines:['Em 8 de agosto, a <b>União Soviética</b> declara guerra ao Japão e invade a Manchúria.', 'O governo japonês ainda discute. Os militares não querem se render.', 'Um segundo B-29, o <i>Bockscar</i>, pilotado pelo major <b>Charles Sweeney</b>, decola com a bomba de plutônio "<b>Fat Man</b>". O alvo principal, Kokura, está coberto por nuvens e fumaça.']}},
    {view:'A', cam:[131, 33.5, 3.5], title:'Nagasaki',
     act:{prompt:'Clique em Nagasaki, na ilha de Kyushu (o alvo reserva).', lon:129.87, lat:32.75, r:1.8, z:4, hint:'Costa oeste de Kyushu, a ilha ao sul.',
       do:F => { F.plane([145.6, 15], [129.87, 32.75]); setTimeout(() => { F.nuke(129.87, 32.75); F.circle(129.87, 32.75, 0.6, '#b3261e', 'rgba(179,38,30,0.25)'); F.text(129.87, 33.6, '9/8/1945 · 11h02', '#8b1a1a'); }, 2300); }, wait:5000},
     after:{B:{pop:'-0.07', eco:'-10', stab:'-10'}}, afterView:'B', afterText:'Em Nagasaki, cerca de <b>74 mil pessoas</b> morreram até o fim de 1945.'},
    {skip:{ago:'6 dias depois', date:'15 de agosto de 1945', view:'B',
      lines:['Numa reunião na madrugada, o imperador <b>Hirohito</b> decide aceitar os termos de Potsdam.', 'Oficiais do exército tentam um golpe para impedir a rendição (o Incidente Kyūjō) e procuram a gravação do discurso do imperador. Fracassam.']}},
    {view:'B', cam:[139.69, 35.69, 4], title:'A decisão do imperador',
     diplo:{prompt:'Como Japão, responda aos Aliados: clique nos Estados Unidos (ou em Tóquio).', lon:139.69, lat:35.69, r:4, to:'A', from:'B', icon:'🏳️', rel:-90, relTxt:'em guerra',
       intro:'Pela primeira vez, o povo japonês vai ouvir a voz do imperador no rádio.',
       opts:[
         {t:'Continuar lutando até o fim', h:'O que queriam os militares', ok:false, r:'Seria a invasão, mais bombardeios e talvez mais bombas atômicas — e a URSS avançando pelo norte.'},
         {t:'✔ Aceitar a rendição nos termos de Potsdam', h:'Discurso no rádio, 15 de agosto', ok:true, r:'Hirohito fala em "suportar o insuportável". Em <b>2 de setembro de 1945</b>, a rendição é assinada no navio <i>USS Missouri</i>: fim da Segunda Guerra Mundial.'}
       ]},
     after:{B:{leader:'Ocupação americana (Gen. Douglas MacArthur)', mil:0, stab:'+5'}, A:{app:'+5'}}, afterText:'O Japão foi ocupado pelos EUA até 1952. Ganhou uma nova Constituição, que até hoje proíbe o país de fazer guerra.'},
    {skip:{ago:'4 anos depois', date:'29 de agosto de 1949', view:'A', set:{A:{sci:'Fim do monopólio nuclear', stab:'-10'}},
      fx:F => { F.nuke(73.37, 50.07); },
      lines:['A <b>União Soviética</b> testa sua primeira bomba atômica, no Cazaquistão.', 'Começa a <b>corrida nuclear</b> da Guerra Fria — que você pode ver no cenário da Crise dos Mísseis.']}},
    {skip:{ago:'Décadas depois', date:'hoje', view:'B', set:{B:{eco:'+200', pop:125, app:70, stab:85, sci:'Potência tecnológica', mil:'+10', leader:'Japão democrático'}},
      fx:F => { F.marker(132.45, 34.39, '🕊️', 'Hiroshima hoje: ≈1,2 milhão de habitantes'); },
      lines:['Hiroshima <b>não ficou inabitável</b>: como as bombas explodiram no ar, a maior parte da radiação se dissipou em poucos dias. A cidade foi reconstruída e tem hoje cerca de <b>1,2 milhão</b> de habitantes.', 'O <b>Domo da Bomba Atômica</b> virou Patrimônio da Humanidade (UNESCO, 1996). <b>Sadako Sasaki</b>, que tinha 2 anos na explosão e morreu de leucemia aos 12 dobrando tsurus de papel, virou símbolo mundial da paz.', 'Desde 1945, nenhuma arma nuclear foi usada numa guerra.']}},
    {title:'Pergunta para a turma',
     quiz:{q:'Por que Hiroshima pôde ser reconstruída, enquanto a região de Chernobyl continua isolada?', o:['Porque a bomba de Hiroshima não tinha radiação', 'Porque a bomba explodiu no ar e a radiação se dissipou rápido; em Chernobyl o reator espalhou material radioativo de longa duração', 'Porque os japoneses limparam toda a radiação em um dia'], a:1,
       e:'A explosão aérea deixou pouca contaminação duradoura no solo. Em Chernobyl, toneladas de material radioativo do reator ficaram no ambiente por décadas.'}}
  ]},
// 8 ---------------------------------------------------------------
{ id:'cuba', year:'1962', date:'17 de abril de 1961', era:1960, world:'União Soviética', icon:'🚀', title:'A Crise dos Mísseis de Cuba',
  sub:'13 dias em que o mundo esteve à beira de uma guerra nuclear',
  nat:{
    A:{name:'União Soviética', short:'URSS', flag:'União Soviética', leader:'Nikita Khrushchev', s:{eco:100, pop:220, app:60, stab:70, mil:140, sci:'Sputnik e Gagarin'}},
    B:{name:'Estados Unidos', short:'EUA', icon:'🇺🇸', leader:'Presidente John F. Kennedy', s:{eco:100, pop:186, app:75, stab:80, mil:170, sci:'Corrida espacial'}},
    C:{name:'Cuba', short:'Cuba', flag:'Cuba', leader:'Fidel Castro', s:{eco:100, pop:7.1, app:70, stab:60, mil:20, sci:'Campanha de alfabetização'}}
  },
  steps:[
    {view:'C', cam:[-80, 22, 3.5], title:'A Baía dos Porcos',
     fx:F => { F.boom(-81.1, 22.1); F.marker(-81.1, 22.1, '⚔️', 'Baía dos Porcos'); },
     text:P('Em 1959, a revolução de <b>Fidel Castro</b> tomou o poder em Cuba, a 150 km da Flórida, e se aproximou da União Soviética.') + P('Em 17 de abril de 1961, cerca de 1.400 exilados cubanos treinados pela CIA desembarcam na <b>Baía dos Porcos</b> para derrubá-lo. Em três dias, são derrotados.')},
    {skip:{ago:'1 ano depois', date:'maio de 1962', view:'A', set:{C:{stab:'+10'}, B:{app:'-5'}},
      lines:['Fidel teme uma nova invasão, agora com o exército americano.', 'Na URSS, <b>Nikita Khrushchev</b> se irrita com os mísseis americanos instalados na <b>Turquia</b>, na porta soviética.', 'Ele tem uma ideia ousada.']}},
    {view:'A', cam:[-60, 30, 1.6], title:'A Operação Anadyr',
     diplo:{prompt:'Como URSS, abra a diplomacia com Cuba: clique na ilha.', lon:-79.5, lat:22, r:4, to:'C', icon:'🤝', rel:70, relTxt:'aliados',
       intro:'O que Khrushchev propõe a Fidel Castro?',
       opts:[
         {t:'Enviar só armas convencionais e assessores', h:'', ok:false, r:'Já havia ajuda militar — Khrushchev queria algo que equilibrasse o poder com os EUA.'},
         {t:'✔ Instalar em segredo mísseis nucleares em Cuba', h:'Operação Anadyr', ok:true, r:'Fidel aceita. Navios soviéticos levam mísseis, ogivas e dezenas de milhares de soldados, disfarçados de "equipamento agrícola".'}
       ]},
     after:{C:{mil:'+40'}, A:{mil:'+10'}}, afterText:'Tudo em segredo absoluto. Os soldados nem sabiam para onde estavam indo.'},
    {view:'A', cam:[-80, 22, 3], title:'Os mísseis chegam',
     act:{prompt:'Instale os mísseis: clique em Cuba.', lon:-79.5, lat:22, r:3.5, z:3, hint:'Cuba é a grande ilha ao sul da Flórida.',
       do:F => { F.missile([37.6, 55.75], [-79.5, 22]); F.marker(-82.4, 23.1, '🚀', 'Mísseis soviéticos'); setTimeout(() => { F.circle(-80, 22.5, 18, '#b3261e', 'rgba(179,38,30,0.08)'); F.marker(-77.04, 38.9, '🎯', 'Washington'); F.cam(-82, 30, 1.9); }, 1600); }, wait:3400},
     after:{B:{stab:'-10'}}, afterText:'O círculo vermelho mostra o alcance dos mísseis de médio alcance (≈2.000 km): Washington, Miami e boa parte do leste dos EUA ficariam a minutos de um ataque.'},
    {skip:{ago:'Algumas semanas depois', date:'14 de outubro de 1962', view:'B', set:{B:{stab:'-10', app:'-5'}},
      lines:['Um avião espião <b>U-2</b> sobrevoa Cuba e fotografa as bases em construção.', 'Em 16 de outubro, <b>John F. Kennedy</b> vê as fotos. Os militares querem bombardear Cuba. Kennedy reúne um grupo de conselheiros (o ExComm) e pensa em outra saída.']}},
    {view:'B', cam:[-79.5, 23, 2.5], title:'A quarentena',
     text:P('Em 22 de outubro, Kennedy anuncia na TV o que vai fazer.'),
     act:{prompt:'Como EUA, cerque Cuba com navios: clique no mar ao redor da ilha.', lon:-76, lat:24, r:7, z:2.5, hint:'Clique no mar perto de Cuba.',
       do:F => { F.circle(-79.5, 22, 6, '#1f4e8c', null); for (let a=0; a<6; a++){ const t = a/6*Math.PI*2; F.marker(-79.5 + Math.cos(t)*6, 22 + Math.sin(t)*6, '🚢', ''); } F.text(-79.5, 29, 'Quarentena naval', '#1f4e8c'); }, wait:2600},
     after:{B:{app:'+10', mil:'+10'}, A:{stab:'-10'}}, afterText:'Kennedy chamou de "quarentena" (um bloqueio naval é um ato de guerra). Navios soviéticos se aproximam da linha.'},
    {skip:{ago:'5 dias depois', date:'27 de outubro de 1962 — o "Sábado Negro"', view:'B', set:{B:{stab:'-15'}, A:{stab:'-15'}},
      fx:F => { F.boom(-77.8, 20.5); },
      lines:['Um U-2 é derrubado sobre Cuba; o piloto, major <b>Rudolf Anderson</b>, morre.', 'Perto do bloqueio, o submarino soviético B-59 é atacado com cargas de sinalização. O comandante quer disparar um torpedo nuclear. O oficial <b>Vasili Arkhipov</b> se recusa a autorizar.', 'Khrushchev mandou duas cartas: uma propõe tirar os mísseis se os EUA não invadirem Cuba; a outra exige também a retirada dos mísseis da Turquia.']}},
    {view:'B', cam:[-40, 40, 1.4], title:'A resposta de Kennedy',
     diplo:{prompt:'Responda a Khrushchev: clique em Moscou.', lon:37.6, lat:55.75, r:5, to:'A', from:'B', icon:'✉️', rel:-70, relTxt:'à beira da guerra',
       intro:'Os militares pedem um ataque aéreo às bases na segunda-feira. O que Kennedy responde?',
       opts:[
         {t:'Bombardear as bases de mísseis', h:'Plano dos militares', ok:false, r:'E se? Soube-se depois que havia em Cuba armas nucleares táticas e ordens para usá-las contra uma invasão. A escalada poderia virar guerra nuclear.'},
         {t:'Invadir Cuba', h:'', ok:false, r:'Os planos previam uma invasão com mais de 100 mil soldados — e uma resposta soviética imprevisível.'},
         {t:'✔ Aceitar a primeira carta: retirar os mísseis em troca de não invadir Cuba (e, em segredo, tirar os da Turquia)', h:'Robert Kennedy negocia com o embaixador Dobrynin', ok:true, r:'Em <b>28 de outubro</b>, a Rádio Moscou anuncia: os mísseis serão retirados. O acordo sobre a Turquia fica em segredo por anos.'}
       ]},
     after:{A:{app:'-10', stab:'+15'}, B:{app:'+10', stab:'+15'}, C:{app:'-5'}}, afterText:'Fidel Castro ficou furioso por não ter sido consultado. Mas o mundo respirou.'},
    {skip:{ago:'8 meses depois', date:'20 de junho de 1963', view:'A', set:{A:{sci:'Linha direta com Washington'}, B:{sci:'Linha direta com Moscou'}},
      lines:['Os dois lados criam a <b>linha direta</b> (o "telefone vermelho") entre Moscou e Washington, para nunca mais depender de cartas demoradas.', 'Em agosto, assinam o <b>Tratado de Proibição Parcial de Testes Nucleares</b>.', 'Kennedy é assassinado em novembro de 1963. Khrushchev, visto como derrotado por parte da cúpula soviética, é afastado em 1964.']}},
    {title:'Pergunta para a turma',
     quiz:{q:'Como a Crise dos Mísseis terminou?', o:['Com a invasão de Cuba pelos EUA', 'Com um acordo: a URSS retirou os mísseis de Cuba e os EUA prometeram não invadir a ilha (e tiraram mísseis da Turquia)', 'Com uma guerra nuclear limitada'], a:1,
       e:'A negociação entre Kennedy e Khrushchev evitou a guerra. Parte do acordo (a Turquia) ficou em segredo por anos.'}}
  ]},
// 9 ---------------------------------------------------------------
{ id:'chernobyl', year:'1986', date:'26 de abril de 1986 · 1h23', era:1960, world:'União Soviética', icon:'☢️', title:'O desastre de Chernobyl',
  sub:'O pior acidente nuclear da história',
  nat:{
    A:{name:'União Soviética', short:'URSS', flag:'União Soviética', leader:'Mikhail Gorbachev', s:{eco:100, pop:280, app:60, stab:65, mil:150, sci:'Reatores RBMK'}},
    B:{name:'Pripyat e a Europa atingida', short:'Pripyat/Europa', icon:'🌫️', leader:'Ucrânia, Belarus, Escandinávia...', s:{eco:100, pop:0.049, app:70, stab:80, mil:'—', sci:'—'}}
  },
  steps:[
    {view:'A', cam:[30.1, 51.39, 5], title:'O teste no reator 4',
     fx:F => { F.marker(30.1, 51.39, '🏭', 'Usina de Chernobyl'); F.marker(30.05, 51.405, '🏙️', 'Pripyat'); },
     text:P('No norte da Ucrânia (então parte da URSS), a usina nuclear V. I. Lenin, perto da cidade de <b>Pripyat</b>, funcionava com reatores do tipo RBMK — que tinham falhas de projeto pouco conhecidas.') + P('Na madrugada de 26 de abril de 1986, a equipe do reator 4 faz um teste de segurança, desrespeitando várias regras.'),
     act:{prompt:'Clique no reator 4 da usina.', lon:30.1, lat:51.39, r:1.2, z:5, hint:'Norte da Ucrânia, perto da fronteira com Belarus.',
       do:F => { F.boom(30.1, 51.39, true); setTimeout(() => F.boom(30.1, 51.39, true), 500); MapView.doShake(12, 900); F.text(30.1, 52.2, 'Explosão do reator 4', '#8b1a1a'); }, wait:2400},
     after:{A:{stab:'-10'}}, afterText:'A potência dispara em segundos. Duas explosões destroem o reator. O grafite pega fogo e lança material radioativo para o céu.'},
    {skip:{ago:'36 horas depois', date:'27 de abril de 1986', view:'B', set:{B:{pop:0, app:'-40'}, A:{app:'-10'}},
      fx:F => { F.circle(30.1, 51.39, 0.27, '#b3261e', 'rgba(179,38,30,0.3)'); },
      lines:['Os bombeiros combateram o incêndio sem saber o tamanho do perigo.', 'Só agora <b>Pripyat</b> é evacuada: cerca de <b>49 mil pessoas</b> em mais de mil ônibus.', 'Disseram que voltariam em três dias. Nunca voltaram.']}},
    {skip:{ago:'1 dia depois', date:'28 de abril de 1986', view:'B',
      fx:F => { F.cam(22, 57, 2.2); [[27.5, 53.9], [18, 59.5], [17.6, 60.4], [10, 50], [24, 46]].forEach((d, i) => setTimeout(() => F.arrow([30.1, 51.39], d, 'rgba(110,110,60,0.9)'), i*450)); F.marker(17.6, 60.4, '🔍', 'Forsmark (Suécia)'); },
      lines:['Na usina de <b>Forsmark</b>, na Suécia — a mais de 1.000 km —, funcionários disparam os alarmes de radiação.', 'Descobrem que a radiação não vem dali: vem do leste. A URSS ainda não disse nada ao mundo.']}},
    {view:'B', cam:[22, 57, 2.2], title:'A Suécia quer respostas',
     diplo:{prompt:'Como Suécia, cobre explicações: clique em Moscou.', lon:37.6, lat:55.75, r:5, from:'B', to:'A', icon:'❓', rel:0, relTxt:'desconfiança',
       intro:'Uma nuvem radioativa cruza a Europa e ninguém sabe de onde vem.',
       opts:[
         {t:'Esperar a URSS se pronunciar', h:'', ok:false, r:'A URSS não ia falar sozinha — o segredo era a regra.'},
         {t:'✔ Exigir explicações oficiais de Moscou', h:'Pressão diplomática', ok:true, r:'Na noite de 28 de abril, a agência soviética <b>TASS</b> lê uma nota curta: "ocorreu um acidente na usina nuclear de Chernobyl". Nada mais.'}
       ]},
     after:{A:{app:'-10', stab:'-10'}}, afterText:'O mundo exige transparência. A desconfiança contra o governo soviético cresce, dentro e fora do país.'},
    {skip:{ago:'2 semanas depois', date:'14 de maio de 1986', view:'A', set:{A:{eco:'-10', sci:'Glasnost (transparência)'}},
      fx:F => { F.overlay(hsCircleCells(29, 52.5, 4.5), '#6b6b2a', 'Contaminação mais forte', 0.35); },
      lines:['18 dias depois do acidente, <b>Mikhail Gorbachev</b> fala sobre ele na TV pela primeira vez.', 'Cria-se uma <b>zona de exclusão de 30 km</b>. Centenas de milhares de "<b>liquidadores</b>" — soldados, mineiros, bombeiros — são enviados para limpar a área.', 'O cientista <b>Valery Legasov</b> chefia a investigação e expõe as falhas do reator.']}},
    {skip:{ago:'Meses depois', date:'novembro de 1986', view:'B', set:{B:{app:'-10'}},
      lines:['O reator é coberto por um "<b>sarcófago</b>" de concreto e aço.', '2 pessoas morreram naquela noite e 28 nos meses seguintes, de síndrome aguda da radiação.', '<b>Belarus</b> recebeu cerca de 70% da precipitação radioativa; houve aumento de câncer de tireoide em crianças que beberam leite contaminado.']}},
    {skip:{ago:'5 anos depois', date:'26 de dezembro de 1991', view:'A', set:{A:{leader:'A URSS deixa de existir', stab:'-60', eco:'-30'}},
      lines:['A União Soviética se desfaz em 15 países.', 'Anos depois, Gorbachev escreveu que Chernobyl, "talvez mais do que a perestroika", foi a verdadeira causa do fim da URSS.']}},
    {skip:{ago:'30 anos depois', date:'2016', view:'B',
      fx:F => { F.cam(30.05, 51.405, 6); F.marker(30.05, 51.405, '🎡', 'Pripyat: cidade-fantasma'); },
      lines:['Uma gigantesca estrutura de aço, o <b>Novo Confinamento Seguro</b>, cobre o velho sarcófago.', 'Pripyat continua abandonada — com uma roda-gigante que nunca chegou a ser inaugurada.', 'Diferente de Hiroshima, aqui o material radioativo do reator ficou no solo: partes da zona devem continuar impróprias para morar por muitas gerações.']}},
    {title:'Pergunta para a turma',
     quiz:{q:'Como o resto do mundo descobriu o acidente?', o:['A URSS anunciou na mesma hora', 'Uma usina na Suécia detectou radiação vinda do leste', 'Um satélite americano filmou a explosão ao vivo'], a:1,
       e:'Em 28 de abril, a usina de Forsmark, na Suécia, detectou radiação — só então a URSS admitiu o acidente.'}}
  ]},
// 10 --------------------------------------------------------------
{ id:'muro', year:'1989', date:'13 de agosto de 1961', era:1960, world:'Alemanha Oriental', icon:'🧱', title:'A Queda do Muro de Berlim',
  sub:'Da construção à reunificação da Alemanha',
  nat:{
    A:{name:'Alemanha Oriental (RDA)', short:'RDA', flag:'Alemanha Oriental', leader:'Walter Ulbricht', s:{eco:100, pop:17.1, app:40, stab:55, mil:40, sci:'Indústria estatal'}},
    B:{name:'Alemanha Ocidental (RFA)', short:'RFA', flag:'Alemanha Ocidental', leader:'Chanceler Konrad Adenauer', s:{eco:100, pop:56, app:65, stab:80, mil:50, sci:'"Milagre econômico"'}}
  },
  steps:[
    {view:'A', cam:[11, 52, 3.5], title:'Duas Alemanhas',
     fx:F => { F.overlay(hsNationCells('Alemanha Oriental'), '#a3322a', 'RDA (comunista)', 0.3); F.overlay(hsNationCells('Alemanha Ocidental'), '#1f4e8c', 'RFA (capitalista)', 0.3); },
     text:P('Depois da Segunda Guerra, a Alemanha foi dividida: a ocidental (RFA), capitalista, e a oriental (RDA), comunista e ligada à URSS. Berlim, dentro da RDA, também foi dividida.') + P('Cerca de 2,5 a 3 milhões de pessoas fugiram do leste para o oeste, muitas por Berlim. O líder da RDA, <b>Walter Ulbricht</b>, decide fechar a passagem.'),
     act:{prompt:'Como RDA, feche a fronteira: clique em Berlim.', lon:13.4, lat:52.52, r:1.2, z:6, hint:'Berlim fica no leste da Alemanha.',
       do:F => { F.cam(13.4, 52.52, 6); F.line([[13.2, 52.6], [13.35, 52.56], [13.42, 52.5], [13.5, 52.43]], '#555', 4, false, 1500); }, wait:2400},
     after:{A:{stab:'+10', app:'-15'}, B:{app:'+5'}}, afterText:'Na madrugada de <b>13 de agosto de 1961</b>, soldados estendem arame farpado. Depois vem o concreto: 155 km de muro, torres e a "faixa da morte". Pelo menos 140 pessoas morrem tentando atravessar.'},
    {skip:{ago:'28 anos depois', date:'maio a agosto de 1989', view:'A', set:{A:{pop:'-0.7', leader:'Erich Honecker', app:'-15', stab:'-15', eco:'-20'}, B:{pop:'+6.7', eco:'+150'}},
      fx:F => { F.marker(16.9, 47.7, '🚪', 'Hungria abre a fronteira'); F.arrow([13.4, 52.52], [16.9, 47.7], '#a3322a'); setTimeout(() => F.arrow([16.9, 47.7], [11.6, 48.1], '#1f4e8c'), 1000); },
      lines:['Na URSS, <b>Mikhail Gorbachev</b> faz reformas e avisa que não vai mandar tanques para sustentar os governos do leste.', 'A <b>Hungria</b> começa a desmontar a cerca na fronteira com a Áustria.', 'Milhares de alemães orientais "saem de férias" para a Hungria — e fogem para o oeste.']}},
    {skip:{ago:'2 meses depois', date:'9 de outubro de 1989', view:'A', set:{A:{stab:'-10'}},
      lines:['Em <b>Leipzig</b>, as orações de segunda-feira na igreja de São Nicolau viram marchas.', 'Cerca de <b>70 mil pessoas</b> vão às ruas gritando: "<b>Nós somos o povo!</b>" (Wir sind das Volk).', 'A polícia e o exército estão a postos. Hospitais preparam sangue.']}},
    {view:'A', cam:[12.37, 51.34, 5], title:'Leipzig',
     diplo:{prompt:'Como governo da RDA, decida o que fazer: clique em Leipzig.', lon:12.37, lat:51.34, r:1.5, z:5, toName:'Manifestantes de Leipzig', toLeader:'"Nós somos o povo!"', toIcon:'🕯️', icon:'⚖️', rel:-40, relTxt:'tensa',
       intro:'Há ordens para impedir as manifestações. O que fazer diante de 70 mil pessoas com velas nas mãos?',
       opts:[
         {t:'Reprimir com tropas', h:'', ok:false, r:'E se? Quatro meses antes, a China tinha esmagado os protestos da Praça da Paz Celestial. Em Leipzig, um massacre era temido — mas não aconteceu.'},
         {t:'✔ Não atirar: deixar a marcha seguir', h:'Líderes locais e o maestro Kurt Masur pedem calma', ok:true, r:'Ninguém atira. A marcha passa pacífica. Na semana seguinte, são 120 mil; depois, centenas de milhares.'}
       ]},
     after:{A:{leader:'Egon Krenz', stab:'-15', app:'+5'}}, afterText:'Em 18 de outubro, <b>Erich Honecker</b> é afastado. O regime está acuado.'},
    {skip:{ago:'1 mês depois', date:'9 de novembro de 1989 · 18h53', view:'A',
      lines:['Numa entrevista coletiva transmitida ao vivo, o porta-voz <b>Günter Schabowski</b> lê uma nova regra de viagens.', 'Um jornalista pergunta: "quando entra em vigor?". Ele procura nos papéis e responde: "<b>Imediatamente, sem demora</b>".', 'Milhares de pessoas correm para os postos de fronteira.']}},
    {view:'A', cam:[13.4, 52.52, 6], title:'A noite do Muro',
     fx:F => { F.line([[13.2, 52.6], [13.35, 52.56], [13.42, 52.5], [13.5, 52.43]], '#555', 4, false, 600); },
     text:P('No posto da rua <b>Bornholmer</b>, o oficial <b>Harald Jäger</b> não tem ordens. A multidão grita "abram o portão!".'),
     act:{prompt:'Abra o Muro: clique em Berlim.', lon:13.4, lat:52.52, r:1.2, z:6, hint:'Berlim fica no leste da Alemanha.',
       do:F => { hsFx().lines = []; F.ring(13.4, 52.52, '#2d6a2d', 26); F.text(13.4, 53, 'O Muro caiu!', '#2d6a2d'); SFX.fanfare(); [0, 300, 600].forEach(d => setTimeout(() => F.boom(13.35 + Math.random()*0.1, 52.5 + Math.random()*0.05), d)); }, wait:2400},
     after:{A:{app:'+30', stab:'-20'}, B:{app:'+15'}}, afterText:'Por volta das 23h30, Jäger abre a cancela. Berlinenses do leste e do oeste se abraçam e sobem no Muro com martelos e picaretas.'},
    {skip:{ago:'10 meses depois', date:'setembro de 1990', view:'B', set:{B:{leader:'Chanceler Helmut Kohl'}, A:{leader:'Lothar de Maizière (eleito)'}},
      lines:['A RDA faz suas primeiras eleições livres (março de 1990).', 'O chanceler da RFA, <b>Helmut Kohl</b>, quer a reunificação. Mas ela depende das quatro potências que venceram a Segunda Guerra.']}},
    {view:'B', cam:[20, 52, 2], title:'Dois mais Quatro',
     diplo:{prompt:'Como RFA, negocie a reunificação: clique em Moscou.', lon:37.6, lat:55.75, r:5, toName:'URSS, EUA, Reino Unido e França', toLeader:'Gorbachev · George H. W. Bush · Thatcher · Mitterrand', toIcon:'🌐', icon:'🖋️', rel:20, relTxt:'cautelosa',
       intro:'Thatcher e Mitterrand temem uma Alemanha forte demais. Gorbachev hesita.',
       opts:[
         {t:'Unificar sem consultar ninguém', h:'', ok:false, r:'Sem o acordo das quatro potências, a reunificação não teria validade internacional — e poderia provocar a URSS.'},
         {t:'✔ Negociar o Tratado Dois-mais-Quatro (as duas Alemanhas + as quatro potências)', h:'Fronteiras garantidas, tropas soviéticas saem', ok:true, r:'Assinado em <b>12 de setembro de 1990</b>: a Alemanha unida aceita as fronteiras atuais, limita seu exército e as tropas soviéticas deixam o leste.'}
       ]},
     after:{B:{stab:'+5'}}, afterText:'Falta só o passo final.'},
    {view:'B', cam:[11, 51.5, 3.5], title:'3 de outubro de 1990',
     act:{prompt:'Reúna as duas Alemanhas: clique na Alemanha Oriental.', lon:12.5, lat:51.5, r:2.5, z:3.5, hint:'É a parte leste do território alemão.',
       do:F => { hsFx().overlays = []; F.overlay(hsNationCells('Alemanha Oriental').concat(hsNationCells('Alemanha Ocidental')), '#2d2d2d', 'Alemanha (3/10/1990)', 0.35); SFX.bell(); }, wait:2000},
     after:{B:{pop:79, leader:'Chanceler Helmut Kohl (Alemanha unificada)', app:'+10'}, A:{pop:0, leader:'A RDA deixa de existir', stab:0}}, afterText:'A Alemanha volta a ser um único país, com cerca de 79 milhões de habitantes.'},
    {skip:{ago:'Anos depois', date:'década de 1990', view:'B', set:{B:{eco:'-30', stab:'-10'}},
      lines:['A reunificação foi cara: muitas fábricas do leste fecharam e o desemprego disparou.', 'As diferenças de renda entre leste e oeste duraram décadas.', 'Em 1991, a própria União Soviética deixou de existir. Terminava a Guerra Fria.']}},
    {title:'Pergunta para a turma',
     quiz:{q:'Por que o Muro de Berlim foi construído em 1961?', o:['Para proteger Berlim de uma invasão americana', 'Para impedir que os alemães orientais fugissem para o oeste', 'Para separar dois bairros que brigavam'], a:1,
       e:'Milhões de pessoas fugiam da RDA. O muro foi erguido para fechar essa saída — e virou o símbolo da Guerra Fria.'}}
  ]},
// 11 ---------------------------------------------------------------
{ id:'constantinopla', year:'1453', date:'abril de 1453', era:1500, world:'Império Otomano', icon:'🏰', title:'A Queda de Constantinopla',
  sub:'O fim do Império Bizantino e o começo da Idade Moderna',
  nat:{
    A:{name:'Império Otomano', short:'Otomanos', flag:'Império Otomano', leader:'Sultão Mehmed II (21 anos)', s:{eco:100, pop:6, app:65, stab:60, mil:120, sci:'Canhões de bronze'}},
    B:{name:'Império Bizantino', short:'Bizâncio', icon:'🦅', leader:'Imperador Constantino XI', s:{eco:30, pop:0.05, app:70, stab:50, mil:12, sci:'Muralhas de Teodósio'}}
  },
  steps:[
    {view:'B', cam:[28.98, 41.01, 4.5], title:'A última cidade de Roma',
     fx:F => { F.marker(28.98, 41.01, '🏰', 'Constantinopla'); F.circle(28.98, 41.01, 0.5, '#7a2a8c', 'rgba(122,42,140,0.25)'); },
     text:P('O Império Romano do Oriente, que durou mais de mil anos, encolheu até quase só a cidade de <b>Constantinopla</b>, com cerca de <b>50 mil</b> habitantes.') + P('Suas <b>muralhas triplas</b> resistiram a cercos durante séculos. Mas o jovem sultão <b>Mehmed II</b> quer a cidade como capital do seu império.'),
     switchTo:'A', switchPrompt:'Veja o outro lado: clique na aba <b>Otomanos</b> na barra do topo e compare o tamanho do exército.'},
    {view:'A', title:'Os grandes canhões',
     text:P('Mehmed contrata o engenheiro húngaro <b>Orbán</b>, que funde canhões gigantes de bronze — um deles tinha mais de 8 metros e atirava pedras de mais de 500 kg.'),
     task:{type:'research', nat:'A', prompt:'Escolha a tecnologia que pode vencer as muralhas:',
       opts:[{n:'Cavalaria pesada', icon:'🐎', d:'Cavaleiros com armadura', ok:false, r:'Cavalos não derrubam muralhas de pedra de 12 metros.'},
             {n:'Artilharia de cerco', icon:'💣', d:'Canhões gigantes de bronze', ok:true, r:'💣 <b>Artilharia de cerco</b> pronta! Pela primeira vez, a pólvora decide um grande cerco na Europa.'}]},
     after:{A:{mil:'+20', sci:'Artilharia de cerco'}}},
    {view:'A', cam:[28.98, 41.05, 5], title:'6 de abril de 1453: o cerco',
     act:{prompt:'Comece o cerco: clique nas muralhas de Constantinopla.', lon:28.93, lat:41.02, r:1.5, z:5, hint:'A cidade fica no estreito do Bósforo.',
       do:F => { F.arrow([26.56, 41.68], [28.92, 41.02], '#a3322a'); [0, 500, 1000, 1500].forEach(d => setTimeout(() => F.boom(28.93 + Math.random()*0.04, 41.01 + Math.random()*0.03), d)); }, wait:2200},
     after:{B:{mil:'-4', stab:'-15'}}, afterText:'Os canhões atiram dia e noite. Os defensores consertam as brechas com terra e madeira durante a noite.'},
    {skip:{ago:'7 semanas depois', date:'29 de maio de 1453', set:{B:{mil:'-6', pop:'-0.01'}, A:{stab:'+10'}},
      fx:F => { F.ship([[29.0, 41.08], [28.97, 41.04]], 1500, '⛵'); },
      lines:['Uma corrente de ferro fecha o porto do <b>Chifre de Ouro</b>. Mehmed manda <b>arrastar navios por terra</b>, sobre troncos untados, e os coloca dentro do porto.', 'Na madrugada de 29 de maio, os janízaros entram pela muralha. Constantino XI morre lutando.']}},
    {view:'A', title:'Uma nova capital',
     text:P('Mehmed entra na cidade e transforma a basílica de <b>Santa Sofia</b> em mesquita. Constantinopla (depois chamada <b>Istambul</b>) vira a capital otomana.') + P('Muitos sábios gregos fogem para a Itália levando livros antigos — isso ajuda o <b>Renascimento</b>.'),
     choice:[{t:'Fechar as rotas de comércio para os europeus', ok:false, r:'Os otomanos não fecharam tudo, mas passaram a controlar e cobrar impostos sobre as rotas para o Oriente.'},
             {t:'✔ Controlar as rotas para o Oriente e cobrar impostos', ok:true, r:'Com as especiarias mais caras, portugueses e espanhóis buscam um caminho <b>pelo mar</b> — começam as Grandes Navegações!'}],
     after:{A:{eco:'+30', app:'+10'}}},
    {title:'Pergunta para a turma',
     quiz:{q:'Por que a queda de Constantinopla (1453) é usada para marcar o início da Idade Moderna?', o:['Porque foi a primeira cidade a usar eletricidade', 'Porque acabou o Império Romano do Oriente e impulsionou as navegações europeias', 'Porque os bizantinos descobriram a América'], a:1,
       e:'Com o fim de Bizâncio e o controle otomano das rotas, os europeus buscaram novos caminhos marítimos.'}}
  ]},
// 12 ---------------------------------------------------------------
{ id:'mexico', year:'1521', date:'novembro de 1519', era:1500, world:'Império Asteca', icon:'🌋', title:'Tenochtitlán: o encontro de dois mundos',
  sub:'Astecas, tlaxcaltecas e espanhóis — e as epidemias que mudaram tudo',
  nat:{
    A:{name:'Império Asteca', short:'Astecas', flag:'Império Asteca', leader:'Huey tlatoani Moctezuma II', s:{eco:120, pop:6, app:55, stab:60, mil:100, sci:'Chinampas e calendário'}},
    B:{name:'Coroas de Castela e Aragão', short:'Espanhóis', flag:'Coroas de Castela e Aragão', leader:'Hernán Cortés (expedição)', s:{eco:5, pop:0.0005, app:50, stab:40, mil:8, sci:'Aço, cavalos, arcabuzes'}},
    C:{name:'Tlaxcala', short:'Tlaxcala', icon:'🏹', leader:'Conselho de Tlaxcala', s:{eco:30, pop:0.3, app:70, stab:65, mil:35, sci:'Guerreiros experientes'}}
  },
  steps:[
    {view:'A', cam:[-99.13, 19.43, 4.5], title:'A cidade sobre o lago',
     fx:F => { F.marker(-99.13, 19.43, '🏛️', 'Tenochtitlán'); },
     text:P('<b>Tenochtitlán</b> era uma das maiores cidades do mundo, com uns <b>200 mil</b> habitantes, construída numa ilha do lago Texcoco, com canais, mercados e jardins flutuantes (<i>chinampas</i>).') + P('Em 1519, cerca de <b>500 espanhóis</b> desembarcam no litoral. Eram muito poucos: o que mudaria a história seriam os aliados indígenas... e as doenças.'),
     task:{type:'ranking', stat:'mil', prompt:'Veja o ranking: qual povo tinha o maior exército?', doneText:'Os astecas eram muito mais numerosos. Os espanhóis só avançaram com milhares de aliados indígenas.'}},
    {view:'C', cam:[-98.24, 19.32, 4.5], title:'Os inimigos dos astecas',
     text:P('<b>Tlaxcala</b> nunca foi conquistada pelos astecas e vivia em guerra com eles. Vários povos pagavam pesados tributos a Tenochtitlán.'),
     diplo:{prompt:'Você é o conselho de Tlaxcala. Clique no acampamento espanhol, na costa.', lon:-96.13, lat:19.2, r:3, to:'B', from:'C', icon:'🤝', rel:-10, relTxt:'desconfiança (houve batalhas)',
       intro:'Depois de lutar contra os espanhóis, Tlaxcala precisa decidir.',
       opts:[{t:'Continuar lutando contra os espanhóis', ok:false, r:'Sem Tlaxcala, a pequena expedição espanhola dificilmente teria chegado a Tenochtitlán.'},
             {t:'✔ Aliar-se aos espanhóis contra os astecas', h:'Milhares de guerreiros tlaxcaltecas', ok:true, r:'Tlaxcala vê a chance de derrotar seu antigo inimigo — sem imaginar que a Espanha dominaria todos depois.'}]},
     after:{B:{mil:'+30'}, C:{mil:'-5'}}, afterText:'A "conquista" foi, em boa parte, uma guerra de povos indígenas contra o domínio asteca.'},
    {skip:{ago:'1 ano depois', date:'1520', view:'A', set:{A:{pop:'-2', stab:'-25', leader:'Cuitláhuac'}},
      fx:F => { F.circle(-99.13, 19.43, 3, '#6b5b2a', 'rgba(107,91,42,0.2)'); F.text(-99.13, 20.7, 'Varíola', '#6b5b2a'); },
      lines:['Moctezuma morre durante a ocupação espanhola da cidade.', 'Uma epidemia de <b>varíola</b>, doença trazida da Europa, mata uma enorme parte da população — inclusive o novo líder, <b>Cuitláhuac</b>.', 'Os indígenas não tinham nenhuma imunidade a essas doenças.']}},
    {view:'A', title:'A defesa de Tenochtitlán',
     text:P('O jovem <b>Cuauhtémoc</b> lidera a resistência. A cidade é cercada por terra e pelo lago, sem comida e sem água potável.'),
     task:{type:'recruit', nat:'A', need:5, per:4, stat:'mil', label:'Guerreiros águia e jaguar', icon:'🦅', prompt:'Organize a defesa: recrute 5 divisões de guerreiros.', doneText:'Os mexicas resistem por quase <b>80 dias</b> de cerco.'},
     after:{A:{leader:'Cuauhtémoc', stab:'+5'}}},
    {skip:{ago:'3 meses depois', date:'13 de agosto de 1521', set:{A:{pop:'-1', eco:'-80', stab:'-30'}, B:{eco:'+60'}},
      lines:['Tenochtitlán cai. Cuauhtémoc é capturado.', 'Sobre as ruínas, os espanhóis constroem a <b>Cidade do México</b>.', 'Em um século, a população indígena do México cai drasticamente, sobretudo pelas epidemias e pelo trabalho forçado.']}},
    {title:'Pergunta para a turma',
     quiz:{q:'Qual foi um dos fatores mais decisivos para a queda de Tenochtitlán?', o:['Os espanhóis tinham um exército maior que o asteca', 'As epidemias trazidas da Europa e a aliança com povos indígenas inimigos dos astecas', 'Os astecas não tinham cidades'], a:1,
       e:'A varíola e os aliados indígenas (como Tlaxcala) foram decisivos; os espanhóis eram poucas centenas.'}}
  ]},
// 13 ---------------------------------------------------------------
{ id:'eua', year:'1776', date:'dezembro de 1773', era:1700, world:'Treze Colônias', icon:'🗽', title:'A Independência dos Estados Unidos',
  sub:'"Sem tributação sem representação"',
  nat:{
    A:{name:'Treze Colônias', short:'Colonos', flag:'Treze Colônias', leader:'Congresso Continental', s:{eco:80, pop:2.5, app:55, stab:45, mil:15, sci:'Imprensa livre'}},
    B:{name:'Reino da Grã-Bretanha', short:'Grã-Bretanha', flag:'Reino da Inglaterra', leader:'Rei Jorge III', s:{eco:150, pop:8, app:60, stab:70, mil:120, sci:'Marinha Real'}},
    C:{name:'Reino da França', short:'França', flag:'Reino da França', leader:'Rei Luís XVI', s:{eco:110, pop:26, app:50, stab:55, mil:100, sci:'Iluminismo'}}
  },
  steps:[
    {view:'A', cam:[-71.06, 42.36, 4.5], title:'O chá de Boston',
     text:P('Depois da Guerra dos Sete Anos, a Grã-Bretanha tem dívidas e cria impostos para as colônias (Lei do Selo, Lei do Chá). Os colonos protestam: não têm deputados no Parlamento de Londres.'),
     act:{prompt:'Clique no porto de Boston.', lon:-71.06, lat:42.36, r:2, z:5, hint:'Boston fica no nordeste das colônias.',
       do:F => { F.marker(-71.06, 42.36, '📦', 'Chá no mar'); F.ring(-71.06, 42.36, '#7a5c2e', 20); }, wait:1500},
     after:{A:{app:'+10'}, B:{app:'-5'}}, afterText:'16/12/1773: colonos jogam 342 caixas de chá no mar. Londres responde fechando o porto de Boston.'},
    {skip:{ago:'2 anos e meio depois', date:'4 de julho de 1776', set:{A:{stab:'+10', mil:'+15', leader:'Congresso (com Thomas Jefferson)'}},
      lines:['Em 1775 começam os combates em Lexington e Concord. <b>George Washington</b> comanda o Exército Continental.', 'Na Filadélfia, o Congresso aprova a <b>Declaração de Independência</b>, escrita por <b>Thomas Jefferson</b>.']}},
    {view:'A', title:'Um exército novo',
     task:{type:'recruit', nat:'A', need:6, per:5, stat:'mil', label:'Milícias e Exército Continental', icon:'🎖️', prompt:'Ajude Washington: recrute 6 divisões.', doneText:'O exército passa o duro inverno de <b>Valley Forge</b> (1777–78) e sai mais treinado.'}},
    {view:'A', cam:[-30, 45, 1.6], title:'Procurando aliados',
     diplo:{prompt:'Benjamin Franklin vai a Paris. Clique na França.', lon:2.35, lat:48.86, r:4, to:'C', from:'A', icon:'🤝', rel:10, relTxt:'simpatia (a França é rival da Grã-Bretanha)',
       intro:'Franklin pede ajuda ao rei Luís XVI.',
       opts:[{t:'Pedir que a França fique neutra', ok:false, r:'Sem a marinha e o dinheiro franceses, os colonos teriam muita dificuldade.'},
             {t:'✔ Propor uma aliança militar contra a Grã-Bretanha', h:'Tratado de Aliança, 1778', ok:true, r:'Depois da vitória americana em Saratoga (1777), a França assina a aliança. Espanha e Holanda também entram contra os britânicos.'}]},
     after:{A:{mil:'+40'}, C:{eco:'-25'}}, afterText:'A ajuda custou caro à França — e as dívidas ajudariam a causar a Revolução Francesa.'},
    {skip:{ago:'3 anos depois', date:'19 de outubro de 1781', set:{B:{mil:'-30', app:'-10'}},
      fx:F => { F.marker(-76.51, 37.24, '🏳️', 'Yorktown'); F.ship([[-70, 34], [-76.2, 37]], 1800, '⛵'); },
      lines:['Em <b>Yorktown</b>, tropas americanas e francesas cercam o exército britânico, e a frota francesa bloqueia o mar.', 'O general Cornwallis se rende.']}},
    {view:'B', title:'O Tratado de Paris (1783)',
     diplo:{prompt:'Você é a Grã-Bretanha. Clique na Filadélfia para negociar.', lon:-75.16, lat:39.95, r:3, to:'A', from:'B', icon:'🖋️', rel:-30, relTxt:'guerra',
       opts:[{t:'Continuar a guerra por mais 10 anos', ok:false, r:'O Parlamento britânico já estava cansado da guerra cara e distante.'},
             {t:'✔ Reconhecer a independência dos Estados Unidos', ok:true, r:'O Tratado de Paris (1783) reconhece os <b>Estados Unidos da América</b>.'}]},
     after:{A:{name:'Estados Unidos', short:'EUA', leader:'George Washington (1789)', stab:'+20', app:'+15'}, B:{stab:'-5'}}},
    {title:'Pergunta para a turma',
     quiz:{q:'O que significava o lema "sem tributação sem representação"?', o:['Que os colonos não queriam pagar nenhum imposto nunca', 'Que não aceitavam impostos criados por um Parlamento onde não tinham representantes', 'Que queriam um rei americano'], a:1,
       e:'Os colonos não elegiam deputados para o Parlamento britânico, que mesmo assim criava impostos para eles.'}}
  ]},
// 14 ---------------------------------------------------------------
{ id:'revfrancesa', year:'1789', date:'5 de maio de 1789', era:1700, world:'Reino da França', icon:'🇫🇷', title:'A Revolução Francesa',
  sub:'"Liberdade, Igualdade, Fraternidade"',
  nat:{
    A:{name:'Reino da França', short:'Rei e nobreza', flag:'Reino da França', leader:'Rei Luís XVI', s:{eco:60, pop:28, app:30, stab:35, mil:100, sci:'Iluminismo'}},
    B:{name:'Terceiro Estado (o povo)', short:'Povo', icon:'🧑‍🌾', leader:'Deputados do Terceiro Estado', s:{eco:40, pop:27, app:70, stab:40, mil:5, sci:'Ideias de Rousseau e Montesquieu'}}
  },
  steps:[
    {view:'A', cam:[2.35, 48.86, 4], title:'Uma França endividada',
     text:P('A França está quebrada (guerras, inclusive a ajuda aos EUA) e o pão está caríssimo. A sociedade é dividida em três <b>Estados</b>: clero, nobreza (que quase não pagam impostos) e o <b>Terceiro Estado</b> — 97% da população.'),
     task:{type:'ranking', stat:'pop', prompt:'Veja o ranking de população: quem é a maioria?', doneText:'Mas, nos Estados Gerais, cada Estado tinha <b>1 voto</b> — o povo perdia por 2 a 1.'}},
    {view:'B', cam:[2.12, 48.8, 5], title:'Os Estados Gerais',
     task:{type:'law', nat:'B', prompt:'Proponha a regra de votação nos Estados Gerais:',
       opts:[{n:'Um voto por Estado', d:'Clero e nobreza somam 2 votos', ok:false, r:'Assim o Terceiro Estado sempre perde por 2 a 1.'},
             {n:'Um voto por cabeça (por deputado)', d:'Cada deputado vale 1 voto', ok:true, yes:578, no:561, r:'O rei recusa! Os deputados do povo se declaram <b>Assembleia Nacional</b> e juram, no salão do Jogo da Pela, só sair com uma Constituição.'}]},
     after:{B:{stab:'+10', app:'+10'}, A:{stab:'-10'}}},
    {view:'B', cam:[2.37, 48.85, 5.5], title:'14 de julho de 1789',
     text:P('Boatos dizem que o rei vai dissolver a Assembleia com tropas. O povo de Paris procura armas e pólvora.'),
     act:{prompt:'Clique na Bastilha, a prisão-fortaleza de Paris.', lon:2.37, lat:48.85, r:1.2, z:6, hint:'Fica no leste de Paris.',
       do:F => { F.boom(2.37, 48.853); F.text(2.37, 49.1, 'Tomada da Bastilha', '#1f4e8c'); }, wait:1600},
     after:{B:{mil:'+20', app:'+10'}, A:{stab:'-20', app:'-10'}}, afterText:'O 14 de julho virou a <b>festa nacional</b> da França.'},
    {view:'B', title:'Os direitos',
     task:{type:'law', nat:'B', prompt:'Aprove o documento mais famoso da Revolução:',
       opts:[{n:'Declaração dos Direitos do Homem e do Cidadão', d:'26 de agosto de 1789', ok:true, yes:900, no:100, r:'"Os homens nascem e permanecem livres e iguais em direitos." Os privilégios feudais são abolidos.'},
             {n:'Mais impostos só para os camponeses', d:'', ok:false, r:'Isso era justamente o que a Revolução queria acabar.'}]},
     after:{B:{stab:'+10'}, A:{eco:'-10'}}, afterText:'Atenção: a Declaração ainda deixou de fora as mulheres — <b>Olympe de Gouges</b> escreveu em 1791 a Declaração dos Direitos da Mulher.'},
    {skip:{ago:'3 anos depois', date:'setembro de 1792', set:{A:{leader:'(monarquia abolida)', stab:'-30'}, B:{name:'República Francesa', short:'República', leader:'Convenção Nacional'}},
      lines:['O rei tenta fugir do país e é preso em Varennes.', 'A França entra em guerra com a Áustria e a Prússia.', 'Em setembro de 1792, a monarquia acaba: nasce a <b>República</b>.', 'Depois viriam anos de violência política e, em 1799, o golpe de <b>Napoleão Bonaparte</b>.']}},
    {title:'Pergunta para a turma',
     quiz:{q:'Qual destas ideias se espalhou pelo mundo a partir da Revolução Francesa?', o:['O poder absoluto dos reis', 'Os direitos iguais dos cidadãos diante da lei', 'Os privilégios da nobreza'], a:1,
       e:'"Liberdade, Igualdade, Fraternidade" inspirou constituições e movimentos em todo o mundo, inclusive na América Latina.'}}
  ]},
// 15 ---------------------------------------------------------------
{ id:'abolicao', year:'1888', date:'setembro de 1850', era:1850, world:'Império do Brasil', icon:'✊🏿', title:'Da Lei Eusébio à Lei Áurea e à República',
  sub:'O longo caminho da abolição no Brasil (1850–1889)',
  nat:{
    A:{name:'Império do Brasil', short:'Governo imperial', flag:'Império do Brasil', leader:'Imperador Dom Pedro II', s:{eco:100, pop:7.2, app:60, stab:70, mil:40, sci:'Café e telégrafo'}},
    B:{name:'Movimento abolicionista', short:'Abolicionistas', icon:'✊🏿', leader:'Luís Gama, André Rebouças, José do Patrocínio', s:{eco:10, pop:0.05, app:30, stab:50, mil:0, sci:'Jornais e quilombos'}},
    C:{name:'Reino Unido', short:'Reino Unido', flag:'Reino Unido', leader:'Rainha Vitória', s:{eco:200, pop:27, app:60, stab:75, mil:160, sci:'Máquina a vapor'}}
  },
  steps:[
    {view:'A', cam:[-30, -5, 1.6], title:'O tráfico pelo Atlântico',
     fx:F => { F.arrow([13.2, -8.8], [-43.2, -22.9], '#8b1a1a'); F.arrow([3.4, 6.4], [-38.5, -12.97], '#8b1a1a'); },
     text:P('O Brasil foi o país que mais recebeu africanos escravizados: cerca de <b>4,8 milhões</b> de pessoas. Em 1850, o tráfico ainda continua, apesar de uma lei de 1831 que nunca foi cumprida ("lei para inglês ver").'),
     switchTo:'C', switchPrompt:'Clique na aba <b>Reino Unido</b>: veja quem está pressionando o Brasil.'},
    {view:'C', title:'A pressão inglesa',
     diplo:{prompt:'Você é o Reino Unido. Clique no Rio de Janeiro.', lon:-43.2, lat:-22.9, r:3, to:'A', from:'C', icon:'⚓', rel:-15, relTxt:'tensa (navios ingleses apreendem navios negreiros)',
       opts:[{t:'Ignorar o tráfico brasileiro', ok:false, r:'O Reino Unido havia abolido o tráfico em 1807 e queria acabar com ele no mundo — inclusive por interesses econômicos.'},
             {t:'✔ Exigir o fim do tráfico (Bill Aberdeen) e perseguir os navios', ok:true, r:'Navios britânicos passam a apreender navios negreiros até em águas brasileiras.'}]},
     after:{A:{stab:'-10'}}},
    {view:'A', title:'1850: Lei Eusébio de Queirós',
     task:{type:'law', nat:'A', prompt:'O Parlamento imperial vota:',
       opts:[{n:'Lei Eusébio de Queirós', d:'Proíbe o tráfico de africanos para o Brasil', ok:true, yes:70, no:30, r:'✅ Aprovada (4 de setembro de 1850). O tráfico atlântico acaba de fato — mas a escravidão continua.'},
             {n:'Manter o tráfico', d:'', ok:false, r:'Com a pressão inglesa, manter o tráfico levaria a um conflito com a maior potência naval do mundo.'}]},
     after:{A:{eco:'+10', sci:'Ferrovias (capital do tráfico vai para a indústria)'}}},
    {skip:{ago:'21 anos depois', date:'setembro de 1871', set:{A:{leader:'Princesa Isabel (regente)'}, B:{app:'+15'}},
      lines:['O Brasil luta na <b>Guerra do Paraguai</b> (1864–1870). Muitos escravizados lutam no exército, e muitos oficiais voltam contra a escravidão.', 'O Brasil é um dos últimos países escravistas das Américas.']}},
    {view:'A', title:'1871: Lei do Ventre Livre',
     task:{type:'law', nat:'A', prompt:'Vote a Lei Rio Branco:',
       opts:[{n:'Lei do Ventre Livre', d:'Filhos de escravizadas nascem livres', ok:true, yes:65, no:45, r:'✅ Aprovada. Na prática, as crianças podiam ficar com o senhor até os 21 anos.'}]}},
    {skip:{ago:'14 anos depois', date:'1885', set:{B:{app:'+20', mil:'+5'}, A:{stab:'-10'}},
      fx:F => { F.marker(-38.5, -3.7, '🕊️', 'Ceará livre (1884)'); },
      lines:['O abolicionismo cresce nas ruas: <b>Luís Gama</b> liberta centenas de pessoas nos tribunais, <b>José do Patrocínio</b> e <b>Joaquim Nabuco</b> discursam, jangadeiros do Ceará, liderados por <b>Francisco José do Nascimento</b> (o Dragão do Mar), se recusam a embarcar escravizados.', 'O Ceará e o Amazonas abolem a escravidão em 1884.']}},
    {view:'A', title:'1885: Lei dos Sexagenários',
     task:{type:'law', nat:'A', prompt:'Vote a Lei Saraiva-Cotegipe:',
       opts:[{n:'Lei dos Sexagenários', d:'Liberta os escravizados com mais de 60 anos', ok:true, yes:58, no:42, r:'✅ Aprovada — mas poucos chegavam aos 60, e ainda tinham que trabalhar mais 3 anos.'}]}},
    {view:'B', cam:[-46.6, -23.5, 4], title:'A resistência',
     text:P('Escravizados fogem em massa das fazendas de café, ajudados pelos <b>caifazes</b>, para quilombos como o do <b>Jabaquara</b>, em Santos. O Exército se recusa a caçar fugitivos.'),
     act:{prompt:'Clique em Santos, onde ficava o quilombo do Jabaquara.', lon:-46.33, lat:-23.96, r:1.5, z:5, hint:'Santos fica no litoral de São Paulo.',
       do:F => { F.arrow([-47.5, -22.4], [-46.33, -23.96], '#2d6a2d'); F.marker(-46.33, -23.96, '🏕️', 'Jabaquara'); }, wait:1600},
     after:{B:{app:'+15'}, A:{stab:'-10', eco:'-10'}}},
    {view:'A', title:'13 de maio de 1888',
     task:{type:'law', nat:'A', prompt:'A princesa Isabel envia o projeto. O Parlamento vota:',
       opts:[{n:'Lei Áurea', d:'"É declarada extinta a escravidão no Brasil."', ok:true, yes:83, no:9, r:'✅ <b>Lei Áurea</b> sancionada! Cerca de 700 mil pessoas são libertadas — mas sem terra, indenização ou educação, o que deixou marcas até hoje.'}]},
     after:{B:{app:'+20'}, A:{app:'-10', stab:'-15'}}},
    {skip:{ago:'1 ano e meio depois', date:'15 de novembro de 1889', set:{A:{name:'República dos Estados Unidos do Brasil', short:'República', leader:'Marechal Deodoro da Fonseca', stab:'-10'}},
      fx:F => { F.ring(-43.2, -22.9, '#2d6a2d', 26); },
      lines:['Fazendeiros descontentes, militares e republicanos se unem.', 'No Rio, o marechal <b>Deodoro da Fonseca</b> proclama a <b>República</b>. Dom Pedro II e a família partem para o exílio.']}},
    {title:'Pergunta para a turma',
     quiz:{q:'Qual a ordem correta das leis abolicionistas?', o:['Lei Áurea → Ventre Livre → Eusébio de Queirós', 'Eusébio de Queirós (1850) → Ventre Livre (1871) → Sexagenários (1885) → Lei Áurea (1888)', 'Sexagenários → Lei Áurea → Ventre Livre'], a:1,
       e:'Foram quase 40 anos de leis graduais, pressão externa, luta abolicionista e resistência dos escravizados.'}}
  ]},
// 16 ---------------------------------------------------------------
{ id:'revrussa', year:'1917', date:'fevereiro de 1917', era:1914, world:'Império Russo', icon:'☭', title:'A Revolução Russa',
  sub:'Do czar aos sovietes em um ano',
  nat:{
    A:{name:'Império Russo', short:'Rússia', flag:'Império Russo', leader:'Czar Nicolau II', s:{eco:50, pop:175, app:15, stab:20, mil:110, sci:'Agrícola'}},
    B:{name:'Império Alemão', short:'Alemanha', flag:'Império Alemão', leader:'Kaiser Guilherme II', s:{eco:80, pop:67, app:45, stab:55, mil:150, sci:'Química, aço, motores'}}
  },
  steps:[
    {view:'A', cam:[30.31, 59.94, 4], title:'Fome e guerra',
     text:P('A Rússia está na Primeira Guerra há quase 3 anos: milhões de mortos, falta pão nas cidades, os camponeses querem terra.') + P('Em Petrogrado, mulheres operárias saem às ruas no Dia da Mulher (8 de março). Logo há greve geral e os soldados se juntam ao povo.'),
     act:{prompt:'Clique em Petrogrado (São Petersburgo).', lon:30.31, lat:59.94, r:2, z:5, hint:'É a capital, no golfo da Finlândia.',
       do:F => { F.ring(30.31, 59.94, '#a3322a', 24); F.text(30.31, 60.6, 'Revolução de Fevereiro', '#a3322a'); }, wait:1600},
     after:{A:{leader:'Governo Provisório (Kerenski)', stab:'-10', app:'+15'}}, afterText:'Nicolau II abdica: acabam <b>300 anos</b> da dinastia Romanov.'},
    {view:'A', title:'Continuar na guerra?',
     choice:[{t:'Continuar a guerra ao lado dos Aliados', ok:true, r:'O Governo Provisório continua a guerra. Os soldados desertam e os bolcheviques, de <b>Lenin</b>, prometem "<b>Paz, terra e pão</b>".'},
             {t:'Fazer as eleições primeiro e depois decidir', ok:false, r:'Na verdade, o governo adiou as eleições e manteve a guerra — e perdeu o apoio popular.'}],
     after:{A:{app:'-20', mil:'-30'}}},
    {skip:{ago:'8 meses depois', date:'7 de novembro de 1917', set:{A:{name:'Rússia Soviética', short:'Rússia Soviética', leader:'Lenin (Conselho dos Comissários do Povo)', stab:'-10'}},
      fx:F => { F.marker(30.31, 59.94, '⭐', 'Palácio de Inverno'); },
      lines:['Os bolcheviques tomam o <b>Palácio de Inverno</b>: é a Revolução de Outubro (pelo calendário russo da época).', 'O novo governo distribui terras, nacionaliza bancos e fábricas.']}},
    {view:'A', cam:[23.7, 52.1, 3], title:'A paz separada',
     diplo:{prompt:'Negocie a paz: clique em Brest-Litovsk.', lon:23.7, lat:52.1, r:3, to:'B', from:'A', icon:'🖋️', rel:-40, relTxt:'guerra',
       opts:[{t:'Continuar lutando contra a Alemanha', ok:false, r:'O exército russo estava desmoronando; continuar significava perder ainda mais.'},
             {t:'✔ Assinar a paz, entregando muitos territórios', h:'Tratado de Brest-Litovsk, março de 1918', ok:true, r:'A Rússia perde Polônia, Bálticos, Finlândia e Ucrânia (que depois seriam disputados de novo).'}]},
     after:{A:{pop:'-50', eco:'-15'}, B:{eco:'+10'}}},
    {skip:{ago:'4 anos depois', date:'dezembro de 1922', set:{A:{name:'União Soviética', short:'URSS', eco:'-10', stab:'+20'}},
      lines:['Uma terrível <b>guerra civil</b> (1918–1921) opõe "vermelhos" e "brancos", com fome e milhões de mortos.', 'Em 1922 nasce a <b>URSS</b>: o primeiro Estado socialista do mundo, de partido único.']}},
    {title:'Pergunta para a turma',
     quiz:{q:'Qual era o lema dos bolcheviques em 1917?', o:['"Paz, terra e pão"', '"Ordem e progresso"', '"Independência ou morte"'], a:0,
       e:'Prometiam tirar a Rússia da guerra, dar terra aos camponeses e acabar com a fome.'}}
  ]},
// 17 ---------------------------------------------------------------
{ id:'crise29', year:'1929', date:'24 de outubro de 1929', era:1914, world:'Estados Unidos', icon:'📉', title:'A Crise de 1929',
  sub:'A quebra da Bolsa de Nova York e o café brasileiro',
  nat:{
    A:{name:'Estados Unidos', short:'EUA', flag:'Estados Unidos', leader:'Presidente Herbert Hoover', s:{eco:180, pop:122, app:70, stab:75, mil:60, sci:'Rádio, automóvel'}},
    B:{name:'Brasil', short:'Brasil', flag:'Brasil', leader:'Presidente Washington Luís', s:{eco:100, pop:37, app:55, stab:55, mil:30, sci:'Café (70% das exportações)'}}
  },
  steps:[
    {view:'A', cam:[-74.0, 40.71, 5], title:'Os "loucos anos 20"',
     text:P('Os EUA viveram anos de euforia: fábricas produzindo sem parar e milhões comprando ações a crédito. Mas a Europa comprava menos, e os estoques se acumulavam.'),
     act:{prompt:'Clique em Wall Street, Nova York.', lon:-74.0, lat:40.71, r:1.5, z:5, hint:'Nova York fica no nordeste dos EUA.',
       do:F => { F.text(-74, 41.4, '📉 Quinta-feira Negra', '#8b1a1a'); MapView.doShake && MapView.doShake(8, 700); }, wait:1600},
     after:{A:{eco:'-60', app:'-25', stab:'-20'}}, afterText:'Em poucos dias, as ações perdem bilhões de dólares. Bancos quebram e empresas fecham.'},
    {skip:{ago:'1 ano depois', date:'1930', view:'B', set:{B:{eco:'-40', stab:'-20'}, A:{eco:'-20'}},
      lines:['Os americanos param de comprar. O preço do <b>café</b> despenca.', 'No Brasil, fazendeiros quebram e o desemprego cresce.']}},
    {view:'B', switchTo:'A', switchPrompt:'Compare: clique na aba <b>EUA</b> e veja quanto a economia caiu lá.', title:'Uma crise mundial',
     text:P('A crise se espalha pelo mundo inteiro, porque muitos países dependiam do dinheiro e do mercado americano.')},
    {view:'B', title:'Salvar o café?',
     choice:[{t:'Deixar os fazendeiros quebrarem', ok:false, r:'Era o maior setor da economia brasileira — o desemprego explodiria.'},
             {t:'✔ O governo compra e queima o café excedente', ok:true, r:'Entre 1931 e 1944 foram destruídas cerca de <b>78 milhões de sacas</b> de café para segurar o preço.'}],
     after:{B:{eco:'+10'}}, afterText:'Com a crise, Getúlio Vargas chega ao poder na Revolução de 1930 e incentiva a <b>indústria</b>.'},
    {skip:{ago:'3 anos depois', date:'1933', view:'A', set:{A:{leader:'Presidente Franklin D. Roosevelt', eco:'+15', app:'+30'}},
      lines:['Nos EUA, um em cada quatro trabalhadores está desempregado.', 'O novo presidente, <b>Franklin Roosevelt</b>, lança o <b>New Deal</b>.']}},
    {view:'A', title:'O New Deal',
     task:{type:'law', nat:'A', prompt:'Aprove as medidas do New Deal:',
       opts:[{n:'Obras públicas e previdência social', d:'Estradas, represas, seguro-desemprego', ok:true, yes:310, no:120, r:'✅ O Estado passa a investir para criar empregos. A economia se recupera aos poucos.'},
             {n:'Cortar todos os gastos do governo', ok:false, d:'', r:'Hoover já tinha tentado isso e a crise piorou.'}]},
     after:{A:{eco:'+30', stab:'+20'}}},
    {title:'Pergunta para a turma',
     quiz:{q:'Por que a crise de 1929 atingiu tanto o Brasil?', o:['Porque o Brasil tinha a maior Bolsa do mundo', 'Porque a economia brasileira dependia da exportação de café para os EUA', 'Porque o Brasil estava em guerra com os EUA'], a:1,
       e:'Com a crise, os EUA compraram menos café e o preço despencou.'}}
  ]},
// 18 ---------------------------------------------------------------
{ id:'diad', year:'1944', date:'junho de 1944', era:1914, world:'Reino Unido', icon:'🪖', title:'O Dia D e a FEB na Itália',
  sub:'A libertação da Europa ocidental',
  nat:{
    A:{name:'Aliados', short:'Aliados', flag:'Reino Unido', leader:'Gen. Dwight Eisenhower (comando)', s:{eco:160, pop:180, app:70, stab:70, mil:150, sci:'Radar'}},
    B:{name:'Brasil', short:'Brasil', flag:'Brasil', leader:'Presidente Getúlio Vargas', s:{eco:70, pop:42, app:55, stab:55, mil:20, sci:'Siderurgia (Volta Redonda)'}},
    C:{name:'Alemanha nazista', short:'Alemanha', flag:'Império Alemão', leader:'(regime nazista)', s:{eco:90, pop:80, app:30, stab:35, mil:120, sci:'Foguetes'}}
  },
  steps:[
    {view:'A', cam:[-0.6, 49.5, 4.5], title:'A Operação Overlord',
     fx:F => { F.overlay(hsNationCells('França'), '#555', 'França ocupada', 0.3); },
     text:P('A Alemanha ocupa a França desde 1940. Os Aliados preparam a maior invasão pelo mar da história, partindo da Inglaterra.'),
     task:{type:'recruit', nat:'A', need:10, per:4, stat:'mil', label:'Divisões aliadas (EUA, Reino Unido, Canadá...)', icon:'🪖', prompt:'Reúna 10 divisões no sul da Inglaterra.', doneText:'Cerca de <b>156 mil soldados</b> e quase 7 mil navios estão prontos.'}},
    {view:'A', title:'6 de junho de 1944',
     act:{prompt:'Desembarque: clique nas praias da Normandia.', lon:-0.6, lat:49.35, r:1.5, z:5, hint:'Normandia fica no norte da França.',
       do:F => { F.ship([[-1.2, 50.7], [-0.7, 49.4]], 1500, '🚢'); F.ship([[-0.3, 50.8], [-0.3, 49.35]], 1600, '🚢'); setTimeout(() => F.boom(-0.6, 49.35), 1500); }, wait:2200},
     after:{A:{mil:'-10', stab:'+10'}, C:{mil:'-20', stab:'-10'}}, afterText:'As praias tinham nomes de código: Utah, Omaha, Gold, Juno e Sword.'},
    {skip:{ago:'2 meses depois', date:'25 de agosto de 1944', set:{C:{mil:'-20'}},
      fx:F => { hsFx().overlays = []; F.ring(2.35, 48.86, '#1f4e8c', 26); },
      lines:['Paris é libertada, com ajuda da Resistência francesa.']}},
    {switchTo:'B', switchPrompt:'Enquanto isso, na Itália... clique na aba <b>Brasil</b>.', title:'A FEB',
     text:P('O Brasil declarou guerra ao Eixo em 1942, depois que submarinos afundaram navios brasileiros. A <b>Força Expedicionária Brasileira</b> — uns <b>25 mil</b> soldados — chega à Itália em 1944.')},
    {view:'B', cam:[10.95, 44.2, 4.5], title:'Monte Castelo',
     act:{prompt:'Clique em Monte Castelo, nos Apeninos (Itália).', lon:10.95, lat:44.2, r:1.5, z:5, hint:'Fica nas montanhas entre Bolonha e Florença.',
       do:F => { F.marker(10.95, 44.2, '🐍', 'A cobra fumou!'); F.ring(10.95, 44.2, '#2d6a2d', 18); }, wait:1600},
     after:{B:{app:'+20', mil:'+10'}}, afterText:'Depois de várias tentativas no inverno, os pracinhas tomam Monte Castelo em <b>21/2/1945</b>.'},
    {skip:{ago:'3 meses depois', date:'8 de maio de 1945', set:{C:{mil:'-60', leader:'(rendição)'}, A:{app:'+20'}},
      lines:['Com os soviéticos no leste e os Aliados no oeste, a Alemanha se rende.', 'De volta, os pracinhas ajudam a derrubar a ditadura do Estado Novo: Vargas cai em outubro de 1945.']}},
    {title:'Pergunta para a turma',
     quiz:{q:'Qual o símbolo da FEB, criado porque diziam que "era mais fácil uma cobra fumar" do que o Brasil ir à guerra?', o:['Uma onça', 'Uma cobra fumando', 'Uma águia'], a:1, e:'Os pracinhas adotaram "a cobra vai fumar" como lema.'}}
  ]},
// 19 ---------------------------------------------------------------
{ id:'espaco', year:'1969', date:'4 de outubro de 1957', era:1960, world:'Estados Unidos', icon:'🌕', title:'A Corrida Espacial',
  sub:'Do Sputnik ao homem na Lua',
  nat:{
    A:{name:'União Soviética', short:'URSS', flag:'União Soviética', leader:'Nikita Kruschev', s:{eco:100, pop:200, app:60, stab:70, mil:150, sci:'Foguete R-7'}},
    B:{name:'Estados Unidos', short:'EUA', flag:'Estados Unidos', leader:'Presidente Dwight Eisenhower', s:{eco:180, pop:172, app:65, stab:75, mil:160, sci:'Foguetes Redstone'}}
  },
  steps:[
    {view:'A', cam:[63.3, 45.9, 3.5], title:'Bip... bip... bip...',
     task:{type:'research', nat:'A', prompt:'Na base de Baikonur, escolha o que lançar primeiro:',
       opts:[{n:'Sputnik 1', icon:'🛰️', d:'Primeiro satélite artificial', ok:true, r:'🛰️ <b>Sputnik</b> em órbita (4/10/1957)! Seu sinal de rádio é ouvido no mundo todo.'},
             {n:'Estação espacial', icon:'🏗️', d:'', ok:false, r:'Ainda era cedo demais — a primeira estação, a Salyut 1, só subiu em 1971.'}]},
     after:{A:{sci:'Satélites', app:'+10'}, B:{app:'-10', stab:'-5'}}},
    {view:'A', switchTo:'B', switchPrompt:'Como os americanos reagiram? Clique na aba <b>EUA</b>.', title:'O "choque do Sputnik"',
     text:P('Os americanos ficam assustados: se os soviéticos põem um satélite em órbita, também podem lançar mísseis a qualquer lugar.')},
    {view:'B', title:'A resposta americana',
     task:{type:'law', nat:'B', prompt:'O Congresso vota:',
       opts:[{n:'Criar a NASA', d:'Agência espacial civil (1958)', ok:true, yes:380, no:30, r:'✅ A <b>NASA</b> é criada, e o governo investe pesado em ciência nas escolas e universidades.'}]},
     after:{B:{sci:'NASA', eco:'-10'}}},
    {skip:{ago:'3 anos e meio depois', date:'12 de abril de 1961', view:'A', set:{A:{sci:'Voo tripulado', app:'+15'}},
      fx:F => { F.marker(63.3, 45.9, '🚀', 'Vostok 1'); },
      lines:['<b>Yuri Gagarin</b> é o primeiro ser humano no espaço: "A Terra é azul!".', 'Em 1963, <b>Valentina Tereshkova</b> é a primeira mulher no espaço.']}},
    {view:'B', title:'"Escolhemos ir à Lua"',
     text:P('O presidente <b>John Kennedy</b> promete levar um homem à Lua antes do fim da década.'),
     task:{type:'research', nat:'B', prompt:'Pesquise as tecnologias do Programa Apollo:',
       opts:[{n:'Foguete Saturno V', icon:'🚀', d:'110 metros de altura', ok:true, r:'🚀 O <b>Saturno V</b> é até hoje um dos foguetes mais potentes já construídos. O programa empregou 400 mil pessoas.'},
             {n:'Avião a hélice', icon:'✈️', ok:false, d:'', r:'No espaço não há ar para hélices funcionarem.'}]},
     after:{B:{sci:'Programa Apollo', eco:'-15'}}},
    {view:'B', cam:[-80.6, 28.5, 4.5], title:'16 de julho de 1969',
     act:{prompt:'Lance a Apollo 11: clique no Cabo Canaveral (Flórida).', lon:-80.6, lat:28.5, r:2, z:5, hint:'Fica na costa leste da Flórida.',
       do:F => { F.missile([-80.6, 28.5], [-40, 50]); F.text(-80.6, 29.5, 'Apollo 11', '#1f4e8c'); }, wait:2400},
     after:{B:{app:'+25', sci:'Homem na Lua'}}, afterText:'Em <b>20 de julho de 1969</b>, Neil Armstrong pisa na Lua: "Um pequeno passo para um homem, um salto gigante para a humanidade".'},
    {view:'B', title:'Placar da corrida',
     task:{type:'ranking', stat:'eco', prompt:'Veja o ranking de economia: quem tinha mais recursos para gastar na corrida?', doneText:'A corrida espacial era também uma disputa de propaganda na Guerra Fria. Em 1975, as naves Apollo e Soyuz se acoplaram no espaço — um sinal de aproximação.'}},
    {title:'Pergunta para a turma',
     quiz:{q:'Quem foi o primeiro ser humano a ir ao espaço?', o:['Neil Armstrong', 'Yuri Gagarin', 'Buzz Aldrin'], a:1, e:'Gagarin, em 1961. Armstrong foi o primeiro a pisar na Lua, em 1969.'}}
  ]},
// 20 ---------------------------------------------------------------
{ id:'redemocratizacao', year:'1988', date:'1º de abril de 1964', era:1960, world:'Brasil', icon:'🗳️', title:'Do golpe de 1964 à Constituição de 1988',
  sub:'Ditadura, Diretas Já e a "Constituição Cidadã"',
  nat:{
    A:{name:'Brasil', short:'Brasil', flag:'Brasil', leader:'Presidente João Goulart', s:{eco:100, pop:80, app:45, stab:30, mil:40, sci:'Petrobras'}}
  },
  steps:[
    {view:'A', cam:[-47.88, -15.79, 3.5], title:'1964',
     text:P('Em meio à Guerra Fria e a uma grave crise política, militares, com apoio de parte da sociedade e do governo dos EUA, derrubam o presidente <b>João Goulart</b>.') + P('Começa uma <b>ditadura militar</b> de 21 anos: eleições diretas para presidente acabam, partidos são fechados e há censura.')},
    {skip:{ago:'4 anos depois', date:'13 de dezembro de 1968', set:{A:{leader:'Gen. Costa e Silva', app:'-10', stab:'-10', sci:'(censura)'}},
      lines:['O <b>AI-5</b> fecha o Congresso e suspende direitos.', 'Opositores são presos, torturados, exilados ou mortos. Artistas como Chico Buarque, Caetano Veloso e Gilberto Gil sofrem censura ou exílio.']}},
    {view:'A', title:'O "milagre" e a conta',
     choice:[{t:'Crescer pegando empréstimos no exterior', ok:true, r:'A economia cresce mais de 10% ao ano (1968–73), mas a desigualdade aumenta e a <b>dívida externa</b> explode.'},
             {t:'Reduzir a desigualdade primeiro', ok:false, r:'O governo da época dizia que era preciso "crescer o bolo para depois dividir".'}],
     after:{A:{eco:'+40'}}},
    {skip:{ago:'11 anos depois', date:'1979', set:{A:{eco:'-25', leader:'Gen. João Figueiredo', stab:'+10'}},
      lines:['A crise do petróleo traz inflação e dívida.', 'Greves no ABC paulista. A <b>Lei da Anistia</b> permite a volta dos exilados.']}},
    {view:'A', cam:[-46.63, -23.55, 4.5], title:'Diretas Já!',
     text:P('Em 1984, milhões vão às ruas pedindo eleição direta para presidente.'),
     act:{prompt:'Clique na Praça da Sé, em São Paulo.', lon:-46.63, lat:-23.55, r:1.5, z:5, hint:'São Paulo, no Sudeste.',
       do:F => { F.ring(-46.63, -23.55, '#e0b240', 30); F.text(-46.63, -22.7, 'Diretas Já!', '#2d6a2d'); }, wait:1500},
     after:{A:{app:'+20'}}},
    {view:'A', title:'Emenda Dante de Oliveira',
     task:{type:'law', nat:'A', prompt:'O Congresso vota a emenda das eleições diretas (precisava de 320 votos):',
       opts:[{n:'Emenda Dante de Oliveira', d:'Eleições diretas para presidente', ok:true, yes:298, no:65, r:'❌ Faltaram <b>22 votos</b>. A emenda não passou. Em 1985, o colégio eleitoral escolhe <b>Tancredo Neves</b> — que adoece e morre; <b>José Sarney</b> assume. A ditadura acaba.'}]},
     after:{A:{leader:'Presidente José Sarney', stab:'+15'}}},
    {view:'A', cam:[-47.86, -15.8, 5], title:'A Constituinte',
     task:{type:'law', nat:'A', prompt:'Ulysses Guimarães preside a Assembleia Constituinte. Votem a nova Constituição:',
       opts:[{n:'Constituição de 1988', d:'Direitos sociais, SUS, voto aos 16, fim da censura', ok:true, yes:474, no:15, r:'✅ Promulgada em <b>5 de outubro de 1988</b>: a "Constituição Cidadã".'}]},
     after:{A:{app:'+20', stab:'+20', sci:'SUS e universalização do ensino'}}},
    {title:'Pergunta para a turma',
     quiz:{q:'O que foi o movimento Diretas Já?', o:['Uma campanha para fechar o Congresso', 'Uma campanha popular por eleições diretas para presidente', 'Um plano econômico'], a:1, e:'Em 1984, comícios gigantes pediram o direito de votar para presidente.'}}
  ]},
// 21 ---------------------------------------------------------------
{ id:'planoreal', year:'1994', date:'março de 1990', era:2000, world:'Brasil', icon:'💵', title:'O Plano Real',
  sub:'Como o Brasil venceu a hiperinflação',
  nat:{
    A:{name:'Brasil', short:'Brasil', flag:'Brasil', leader:'Presidente Fernando Collor', s:{eco:60, pop:147, app:50, stab:30, mil:40, sci:'Inflação de 80% ao mês'}}
  },
  steps:[
    {view:'A', cam:[-47.88, -15.79, 3.5], title:'Preços que mudam todo dia',
     text:P('No fim dos anos 80, a inflação chegava a mais de <b>80% ao mês</b>. No supermercado, funcionários remarcavam preços várias vezes ao dia. Quem recebia salário corria para gastar antes que o dinheiro perdesse valor.') + P('Vários planos fracassaram: Cruzado, Bresser, Verão... e o Plano Collor, que <b>confiscou a poupança</b> das pessoas.'),
     choice:[{t:'Congelar os preços por decreto', ok:false, r:'Já tinha sido tentado (Plano Cruzado, 1986): faltaram produtos e a inflação voltou mais forte.'},
             {t:'✔ Buscar um plano sem congelamento e sem confisco', ok:true, r:'Essa foi a ideia da equipe econômica de 1993.'}]},
    {skip:{ago:'3 anos depois', date:'1993', set:{A:{leader:'Presidente Itamar Franco (ministro da Fazenda: FHC)', stab:'+10'}},
      lines:['Collor sofre impeachment em 1992.', 'O presidente <b>Itamar Franco</b> nomeia <b>Fernando Henrique Cardoso</b> ministro da Fazenda, com economistas como Pedro Malan, Gustavo Franco, Pérsio Arida e André Lara Resende.']}},
    {view:'A', title:'Etapa 1: contas em ordem',
     task:{type:'law', nat:'A', prompt:'Aprove o ajuste das contas do governo:',
       opts:[{n:'Fundo Social de Emergência', d:'Cortes e reorganização do orçamento', ok:true, yes:360, no:120, r:'✅ O governo para de gastar mais do que arrecada — base do plano.'}]},
     after:{A:{stab:'+5'}}},
    {view:'A', title:'Etapa 2: a URV',
     task:{type:'research', nat:'A', prompt:'Escolha a "moeda de transição" (março de 1994):',
       opts:[{n:'URV — Unidade Real de Valor', icon:'📊', d:'Preços e salários em URV, que acompanhava o dólar', ok:true, r:'📊 Durante 4 meses, tudo tem preço em URV. As pessoas se acostumam com valores estáveis.'},
             {n:'Imprimir mais dinheiro', icon:'🖨️', d:'', ok:false, r:'Imprimir dinheiro sem lastro é justamente o que alimenta a inflação.'}]},
     after:{A:{sci:'URV'}}},
    {view:'A', cam:[-43.2, -22.9, 4.5], title:'1º de julho de 1994',
     act:{prompt:'Lance o Real: clique na Casa da Moeda, no Rio de Janeiro.', lon:-43.2, lat:-22.9, r:1.5, z:5, hint:'Rio de Janeiro.',
       do:F => { F.text(-43.2, -22, '💵 R$ 1,00 = 2.750 cruzeiros reais', '#2d6a2d'); F.ring(-43.2, -22.9, '#2d6a2d', 22); }, wait:1600},
     after:{A:{eco:'+40', app:'+30', stab:'+30', sci:'Real estável'}}, afterText:'A inflação cai de cerca de 47% ao mês (junho de 1994) para menos de 3% ao mês no fim do ano.'},
    {skip:{ago:'6 meses depois', date:'1º de janeiro de 1995', set:{A:{leader:'Presidente Fernando Henrique Cardoso'}},
      lines:['Com o sucesso do Real, FHC é eleito presidente.', 'Os mais pobres, que não tinham como se proteger da inflação, foram os que mais ganharam com o fim dela.']}},
    {title:'Pergunta para a turma',
     quiz:{q:'Qual foi a "moeda de transição" usada antes do Real?', o:['O Cruzado', 'A URV (Unidade Real de Valor)', 'O Dólar'], a:1, e:'A URV serviu de referência estável de março a junho de 1994.'}}
  ]},
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
  const TL_MATCH = {constantinopla:/Constantinopla/, mexico:/Tenochtitl/, eua:/Independência dos Estados Unidos/, revfrancesa:/Revolução Francesa/, abolicao:/Lei Áurea/, revrussa:/Revolução Russa/, crise29:/Bolsa de Nova York/, espaco:/pisa na Lua/, redemocratizacao:/Constituição brasileira/, planoreal:/Plano Real/, tordesilhas:/Tordesilhas/, vasco:/Vasco da Gama/, cabral:/Cabral/, familia_real:/família real/i, independencia:/Independência do Brasil/, sarajevo:/Primeira Guerra/, hiroshima:/Hiroshima/, cuba:/Mísseis/, chernobyl:/Chernobyl/, muro:/Muro de Berlim/};
  const tl = ENC_SECTIONS.find(s => s.id === 'historia');
  if (tl) tl.f = () => `<div class="enc-intro">Acontecimentos reais que moldaram o mundo do jogo. ▶ = dá para <b>jogar no mapa</b> (Modo História).</div>` +
    TIMELINE.slice().sort((a, b) => a[0] - b[0]).map(([y, t]) => { const sc = HIST_SCENES.find(x => +x.year === y && TL_MATCH[x.id] && TL_MATCH[x.id].test(t));
      return encItem(`${sc ? `<button class="btn xs green" data-story="${sc.id}" style="margin-right:6px">▶ Jogar</button>` : ''}${y}`, t); }).join('');
}
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-story]'); if (!b) return; e.preventDefault(); SFX.page && SFX.page(); hsStart(b.dataset.story, document.querySelector('#scr-page:not(.hidden)') ? 'ency' : 'menu'); });
// botão no menu principal
(function(){ const ency = document.getElementById('m-ency'); if (ency && !document.getElementById('m-story')){ ency.insertAdjacentHTML('afterend', `<button class="btn" id="m-story">🎬 Modo História (aulas)</button>`); document.getElementById('m-story').className = ency.className;
  document.getElementById('m-story').onclick = () => { SFX.init && SFX.init(); SFX.page(); showPage('🎬 Modo História', hsListHTML()); }; } })();
