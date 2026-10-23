// ============================================================
//  IMPERIUM — Frotas de porta-aviões no mapa
//  • Forme uma frota com os porta-aviões da reserva (aba Militar):
//    ela aparece no mar, perto de um porto ou da costa
//  • Clique na frota e depois no mar para navegar (~10 regiões/mês)
//  • Apoio aéreo: batalhas a até 9 regiões da frota ganham a força
//    dos aviões embarcados
//  • Os porta-aviões continuam contando na marinha; perdas reduzem a frota
// ============================================================
'use strict';

const FLEET_RANGE = 9, FLEET_SPEED = 10;
const FLEET_NAMES = ['1ª Frota', '2ª Frota', '3ª Frota', 'Frota do Atlântico', 'Frota do Pacífico', 'Frota do Índico', 'Frota do Norte', 'Frota do Sul'];
function fleets(){ return (G.p.fleets = G.p.fleets || []); }
function carriersFree(){ return Math.max(0, (G.p.units.porta||0) - fleets().reduce((s, f) => s + f.n, 0)); }
function fleetAt(c){ return fleets().find(f => cellDist(f.cell, c) <= 1.2) || null; }
function fleetSel(){ return fleets().find(f => f.id === UI.selFleet) || null; }

// mar mais próximo de uma região
function seaNear(cell, maxR){
  const seen = new Set([cell]), q = [cell];
  while (q.length && seen.size < 5000){
    const c = q.shift(); if (!Grid.land[c]) return c;
    for (const nb of neighbors4(c)) if (!seen.has(nb) && cellDist(nb, cell) <= (maxR||30)){ seen.add(nb); q.push(nb); }
  }
  return -1;
}
// rota só pelo mar
function seaPath(from, to){
  if (from === to) return [];
  const prev = new Map([[from, -1]]), q = [from];
  while (q.length){
    const c = q.shift(); if (c === to) break;
    for (const nb of neighbors4(c)) if (!prev.has(nb) && !Grid.land[nb]){ prev.set(nb, c); q.push(nb); }
    if (prev.size > 40000) break;
  }
  if (!prev.has(to)) return null;
  const path = []; let c = to; while (c !== from){ path.unshift(c); c = prev.get(c); }
  return path;
}

function formFleet(n){
  const p = G.p; n = Math.min(n, carriersFree());
  if (n <= 0) return {ok:false, why:'Não há porta-aviões livres na reserva. Recrute na aba Militar.'};
  const ports = (p.buildings||[]).filter(b => b.t === 'porto' && bOk(b)).map(b => b.c);
  let cell = -1;
  for (const c of ports.concat([p.capCell])){ cell = seaNear(c, 30); if (cell >= 0) break; }
  if (cell < 0){ const coast = []; for (let i=0;i<NCELLS && !coast.length;i++) if (Grid.owner[i] === 1 && isCoastal(i)) coast.push(i); if (coast.length) cell = seaNear(coast[0], 5); }
  if (cell < 0) return {ok:false, why:'Não encontramos mar perto do nosso território.'};
  p.fleetSeq = (p.fleetSeq||0) + 1;
  const f = {id:p.fleetSeq, name:FLEET_NAMES[(p.fleetSeq-1) % FLEET_NAMES.length], cell, n, path:[]};
  fleets().push(f);
  return {ok:true, fleet:f, msg:`🛳️ ${f.name} formada com ${n} porta-aviões.`};
}
function orderFleet(f, dest){
  if (Grid.land[dest]) return {ok:false, why:'Frotas navegam só pelo mar. Clique na água.'};
  const path = seaPath(f.cell, dest);
  if (!path) return {ok:false, why:'Não há rota por mar até lá.'};
  f.path = path; const m = Math.max(1, Math.ceil(path.length / FLEET_SPEED));
  return {ok:true, msg:`🛳️ ${f.name} navega para o destino (~${m} ${m > 1 ? 'meses' : 'mês'}).`};
}

// ---------- passagem do mês: navegar e ajustar às perdas ----------
const _flMove = moveCorpsTurn;
moveCorpsTurn = function(){
  _flMove.apply(this, arguments);
  const fl = fleets(); if (!fl.length) return;
  // perdas na guerra: a frota encolhe se sobrar menos porta-aviões
  let extra = fl.reduce((s, f) => s + f.n, 0) - (G.p.units.porta||0);
  for (let i = fl.length - 1; i >= 0 && extra > 0; i--){ const k = Math.min(extra, fl[i].n); fl[i].n -= k; extra -= k; }
  G.p.fleets = fl.filter(f => f.n > 0);
  for (const f of G.p.fleets) for (let k = 0; k < FLEET_SPEED && f.path && f.path.length; k++) f.cell = f.path.shift();
};

// ---------- apoio aéreo dos porta-aviões ----------
const _flAir = airSupport;
airSupport = function(cell){
  const m = G.p.mods || calcMods(); let s = _flAir(cell);
  for (const f of fleets()) if (cellDist(f.cell, cell) <= FLEET_RANGE) s += f.n * UNIT.porta.atk * 0.5 * (1 + m.military);
  return s;
};

// ---------- mapa: desenho, seleção e ordens ----------
const _flCorps = MapView.drawCorps;
MapView.drawCorps = function(ctx, z){
  _flCorps.call(this, ctx, z);
  if (!G || !G.p || !G.p.fleets || !G.p.fleets.length) return;
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const r = Math.max(3.2, 9/Math.sqrt(z));
  for (const f of G.p.fleets){
    const [x, y] = cellXY(f.cell), sel = UI.selFleet === f.id;
    if (f.path && f.path.length){ const [tx, ty] = cellXY(f.path[f.path.length-1]); ctx.setLineDash([4/z+1, 3/z+1]); ctx.strokeStyle = 'rgba(44,79,115,0.8)'; ctx.lineWidth = 1.5/z+0.4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke(); ctx.setLineDash([]); }
    if (sel){ ctx.strokeStyle = 'rgba(44,79,115,0.35)'; ctx.lineWidth = 1/z+0.3; ctx.beginPath(); ctx.arc(x, y, FLEET_RANGE*DEG, 0, Math.PI*2); ctx.stroke(); }
    ctx.fillStyle = sel ? '#ffe9a8' : 'rgba(225,236,245,0.95)'; ctx.strokeStyle = '#1f3a5a'; ctx.lineWidth = Math.max(0.5, 1.4/z);
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.font = `${r*1.15}px serif`; ctx.fillText('🛳️', x, y + r*0.05);
    ctx.font = `bold ${r*0.7}px Georgia, serif`; ctx.fillStyle = '#1f3a5a'; ctx.fillText(String(f.n), x + r*0.95, y - r*0.8);
  }
  ctx.restore();
};
function showFleetPopover(f, x, y){
  const pop = showPopover(`<h4>🛳️ ${esc(f.name)}</h4>
    <div class="muted">${f.path && f.path.length ? `⚓ navegando (${Math.ceil(f.path.length / FLEET_SPEED)} m)` : '⚓ ancorada'}</div>
    ${row('Porta-aviões', f.n)}${row('Apoio aéreo', `batalhas a até ${FLEET_RANGE} regiões`)}
    <div class="tip" style="margin:6px 0">👉 Agora <b>clique no mar</b> para navegar até lá.</div>
    <div class="btn-grid">${carriersFree() ? '<button class="btn xs" id="fl-add">➕ Juntar porta-aviões livres</button>' : ''}<button class="btn xs danger" id="fl-dis">Voltar para a reserva</button></div>
    <button class="btn xs" style="width:100%" id="fl-x">Cancelar seleção</button>`, x, y);
  const add = pop.querySelector('#fl-add'); if (add) add.onclick = () => { f.n += carriersFree(); SFX.build(); refreshAll(); showFleetPopover(f, x, y); };
  pop.querySelector('#fl-dis').onclick = () => { G.p.fleets = fleets().filter(k => k !== f); UI.selFleet = null; closePopover(); SFX.click(); toast(`${f.name} desfeita: os porta-aviões voltaram para a reserva.`); refreshAll(); };
  pop.querySelector('#fl-x').onclick = () => { UI.selFleet = null; closePopover(); };
}
const _flClick = onMapClick;
onMapClick = function(c, x, y){
  if (!G || G.over || UI.modalOpen || MapView.buildMode || c < 0) return _flClick(c, x, y);
  const here = fleetAt(c), sel = fleetSel();
  if (here && (!sel || here !== sel || !Grid.land[c])){ UI.selFleet = here.id; UI.selCorps = null; MapView.selCorps = null; SFX.click(); showFleetPopover(here, x, y); return; }
  if (sel){
    const r = orderFleet(sel, c);
    if (r.ok){ SFX.march(); toast(r.msg, 'good'); MapView.ring(...cellXY(c), '#2c4f73', 16); UI.selFleet = null; closePopover(); refreshAll(); saveGame(); }
    else { SFX.error(); toast(r.why, 'bad'); }
    return;
  }
  return _flClick(c, x, y);
};
MapView.onClick = onMapClick;

// ---------- painel Militar ----------
const _flPanel = panelMilitar;
panelMilitar = function(){
  const h = _flPanel(), p = G.p, fl = fleets(), free = carriersFree();
  if (!fl.length && !(p.units.porta > 0)) return h;
  const box = `<div class="sub">🛳️ Frotas de porta-aviões (${fl.length})</div>
    <div class="tip">Clique numa frota no mar e depois no destino para <b>navegar</b>. Batalhas a até ${FLEET_RANGE} regiões dela ganham <b>apoio aéreo</b>.</div>
    ${fl.map(f => `<div class="box"><div class="row"><b>🛳️ ${esc(f.name)}</b><span class="v">${f.n} porta-aviões</span></div><small>${f.path && f.path.length ? `navegando (${Math.ceil(f.path.length / FLEET_SPEED)} m)` : 'ancorada'}</small>
      <div class="flex" style="margin-top:4px"><button class="btn xs" data-flsel="${f.id}">🎯 Selecionar</button></div></div>`).join('')}
    ${free ? `<button class="btn sm green" style="width:100%" data-flnew="1">🛳️ Formar frota com ${free} porta-aviões livres</button>` : ''}`;
  const i = h.indexOf('<div class="sub">Guerras');
  return i < 0 ? h + box : h.slice(0, i) + box + h.slice(i);
};
document.addEventListener('click', e => {
  if (!G || !G.p) return;
  const nb = e.target.closest && e.target.closest('[data-flnew]');
  if (nb){ const r = formFleet(carriersFree()); if (r.ok){ SFX.march(); toast(r.msg, 'good'); addLog(r.msg, 'war'); const [lo, la] = cellCenter(r.fleet.cell); MapView.flyTo(lo, la, 3); UI.selFleet = r.fleet.id; } else { SFX.error(); toast(r.why, 'bad'); } refreshAll(); return; }
  const sb = e.target.closest && e.target.closest('[data-flsel]');
  if (sb){ const f = fleets().find(k => k.id === +sb.dataset.flsel); if (!f) return; UI.selFleet = f.id; const [lo, la] = cellCenter(f.cell); MapView.flyTo(lo, la, 3.2); SFX.click(); toast(`🛳️ ${f.name} selecionada: clique no mar para navegar.`); refreshAll(); }
});
