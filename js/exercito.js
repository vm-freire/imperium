// ============================================================
//  IMPERIUM — Recrutar nas bases e juntar exércitos
//  • Exércitos podem ser formados na capital OU em qualquer Base
//    Militar / Fortaleza: escolha o local e a quantidade de cada tropa
//  • Clique numa base no mapa → "Recrutar aqui"
//  • Juntar exércitos: os que estão perto se fundem na hora; os
//    distantes marcham até o exército escolhido e se juntam ao chegar
// ============================================================
'use strict';

const MIL_BASES = ['base', 'fortaleza'];
function isMilBase(b){ return b && MIL_BASES.includes(b.t) && bOk(b); }

// nome do lugar: estado real; senão, a cidade nossa mais próxima
function placeName(cell){
  const cs = typeof cellStates === 'function' ? cellStates() : null;
  if (cs && cs[cell] >= 0 && typeof stateName === 'function' && stateName(cs[cell])) return stateName(cs[cell]);
  const p = G.p; let best = -1, bd = 1e9;
  (p.cityCells||[]).forEach((c, i) => { const d = cellDist(c, cell); if (d < bd){ bd = d; best = i; } });
  return best >= 0 ? `perto de ${p.cityNames[best]}` : 'interior';
}
// locais onde se pode formar exército
function recruitSites(){
  const p = G.p, out = [];
  if (p.capCell >= 0 && Grid.owner[p.capCell] === 1) out.push({cell:p.capCell, icon:'⭐', name:`Capital — ${p.capital}`});
  for (const b of (p.buildings||[])) if (isMilBase(b)) out.push({cell:b.c, icon:BUILDINGS[b.t].icon, name:`${buildingLevelName(b).replace(/^\S+\s/, '')} — ${placeName(b.c)}`});
  return out;
}

// coloca tropas da reserva num exército no local (junta ao que já estiver lá ou forma um novo)
function deployFromReserve(cell, take){
  const p = G.p; let n = 0; const units = {};
  for (const u of LAND_UNITS){ const k = Math.min(p.units[u]||0, take[u]||0); if (k > 0){ units[u] = k; p.units[u] -= k; n += k; } }
  if (!n) return null;
  let k = corpsAt(cell);
  if (k){ for (const u in units) k.units[u] = (k.units[u]||0) + units[u]; }
  else { p.corps = p.corps || []; p.corpsSeq = (p.corpsSeq||0) + 1;
    k = {id:p.corpsSeq, name:CORPS_NAMES[(p.corpsSeq-1) % CORPS_NAMES.length], cell, prev:cell, units, morale:1, xp:0, path:[], naval:0, lastAttack:-1}; p.corps.push(k); }
  return {corps:k, n};
}

function openRecruitAt(cell){
  const p = G.p, m = p.mods || calcMods(), site = recruitSites().find(s => s.cell === cell) || {icon:'🎖️', name:placeName(cell)};
  const avail = LAND_UNITS.filter(u => UNIT[u] && !(UNIT[u].req && !p.techs.includes(UNIT[u].req)));
  const here = corpsAt(cell);
  const q = {}, fromRes = {};
  const md = openModal(`<div class="m-icon">${site.icon}</div><div class="m-title">Recrutar em ${esc(site.name)}</div>
    <div class="muted" style="text-align:center">${here ? `Aqui já está o <b>${esc(here.name)}</b> (${corpsUnitsCount(here)} divisões): as tropas novas reforçam ele.` : 'As tropas formam um novo exército neste local.'}</div>
    <div class="sub">🆕 Recrutar tropas novas</div>
    ${avail.map(u => { const U = UNIT[u]; return `<div class="unit"><span class="ic">${U.icon}</span><span class="nm"><b>${U.n}</b><small>${fmtMoney(unitCost(u, m))} cada · ⚔${U.atk} 🛡${U.def} · ${U.man} mil soldados</small></span>
      <span class="ct"><button class="btn xs" data-rq="${u}" data-d="-5">−5</button><button class="btn xs" data-rq="${u}" data-d="-1">−</button><input type="number" min="0" max="999" value="0" data-rqn="${u}" style="width:52px;text-align:center"><button class="btn xs" data-rq="${u}" data-d="1">+</button><button class="btn xs" data-rq="${u}" data-d="5">+5</button></span></div>`; }).join('')}
    <div class="sub">📦 Trazer da reserva <small class="muted">(${reserveLand()} divisões paradas)</small></div>
    ${LAND_UNITS.filter(u => p.units[u]).map(u => `<div class="row"><span class="k">${UNIT[u].icon} ${UNIT[u].n} <small class="muted">(${p.units[u]} na reserva)</small></span><span class="v"><input type="range" min="0" max="${p.units[u]}" value="0" data-rs="${u}" style="width:120px"> <b data-rsv="${u}">0</b></span></div>`).join('') || '<div class="muted">A reserva está vazia.</div>'}
    <div class="box" id="ra-sum" style="margin-top:8px"></div>
    <div class="m-actions"><button class="btn" id="ra-x">Cancelar</button><button class="btn green" id="ra-ok">⚔️ Recrutar e posicionar aqui</button></div>`, {wide:true});
  const sum = () => {
    let cost = 0, man = 0, n = 0, r = 0;
    for (const u in q){ cost += unitCost(u, m)*q[u]; man += UNIT[u].man*q[u]; n += q[u]; }
    for (const u in fromRes) r += fromRes[u];
    const okMoney = cost <= p.treasury, okMan = man <= p.manpower;
    md.querySelector('#ra-sum').innerHTML = `${row('Tropas novas', `${n} divisões`)}${row('Custo', `<span class="${okMoney ? '' : 'down'}">${fmtMoney(cost)}</span> <small class="muted">(tesouro ${fmtMoney(p.treasury)})</small>`)}
      ${row('Soldados', `<span class="${okMan ? '' : 'down'}">${fmtNum(man, 0)} mil</span> <small class="muted">(reservas ${fmtNum(p.manpower, 0)} mil)</small>`)}${row('Da reserva', `${r} divisões`)}${row('Total no local', `<b>${n + r + (here ? corpsUnitsCount(here) : 0)} divisões</b>`)}`;
    md.querySelector('#ra-ok').disabled = !(n + r) || !okMoney || !okMan;
  };
  const setQ = (u, v) => { q[u] = clamp(Math.round(v)||0, 0, 999); md.querySelector(`[data-rqn="${u}"]`).value = q[u]; sum(); };
  md.querySelectorAll('[data-rq]').forEach(b => b.onclick = () => { SFX.click(); setQ(b.dataset.rq, (q[b.dataset.rq]||0) + (+b.dataset.d)); });
  md.querySelectorAll('[data-rqn]').forEach(i => i.oninput = () => setQ(i.dataset.rqn, +i.value));
  md.querySelectorAll('[data-rs]').forEach(i => i.oninput = () => { fromRes[i.dataset.rs] = +i.value; md.querySelector(`[data-rsv="${i.dataset.rs}"]`).textContent = i.value; sum(); });
  md.querySelector('#ra-x').onclick = () => { SFX.click(); closeModal(); };
  md.querySelector('#ra-ok').onclick = () => {
    const take = Object.assign({}, fromRes);
    for (const u in q){ if (!q[u]) continue; const r = recruit(u, q[u]); if (!r.ok){ SFX.error(); toast(esc(r.why), 'bad'); refreshAll(); return; } take[u] = (take[u]||0) + q[u]; }
    const d = deployFromReserve(cell, take);
    closeModal();
    if (!d){ SFX.error(); toast('Nenhuma tropa escolhida.', 'bad'); return; }
    SFX.march(); const [x, y] = cellXY(cell); MapView.ring(x, y, '#2c4f73', 18); MapView.floatText(x, y, `+${d.n} divisões`, '#2c4f73');
    const msg = `⚔️ ${d.n} divisões posicionadas em ${site.name} — ${d.corps.name} agora tem ${corpsUnitsCount(d.corps)}.`; toast(esc(msg), 'good'); addLog(msg, 'war');
    refreshAll(); saveGame();
  };
  sum();
}
function openRecruitPicker(){
  const sites = recruitSites();
  const md = openModal(`<div class="m-icon">⚔️</div><div class="m-title">Onde formar o exército?</div>
    <div class="muted" style="text-align:center">Na capital ou em qualquer Base Militar / Fortaleza (construa mais na aba Obras).</div>
    ${sites.map(s => { const k = corpsAt(s.cell); return `<button class="choice" data-site="${s.cell}"><b>${s.icon} ${esc(s.name)}</b><span>${k ? `🎖️ ${esc(k.name)} está aqui (${corpsUnitsCount(k)} div.) — reforçar` : 'Formar um novo exército aqui'}</span></button>`; }).join('')}
    <div class="m-actions"><button class="btn" id="rp-x">Fechar</button></div>`);
  md.querySelector('#rp-x').onclick = () => { SFX.click(); closeModal(); };
  md.querySelectorAll('[data-site]').forEach(b => b.onclick = () => { SFX.page(); closeModal(); openRecruitAt(+b.dataset.site); });
}

// ---------- juntar exércitos ----------
function mergeInto(target, k){
  const a = corpsUnitsCount(target), b = corpsUnitsCount(k), t = Math.max(1, a + b);
  for (const u in k.units) target.units[u] = (target.units[u]||0) + k.units[u];
  target.morale = ((target.morale||1)*a + (k.morale||1)*b) / t;
  target.xp = ((target.xp||0)*a + (k.xp||0)*b) / t;
  G.p.corps = G.p.corps.filter(x => x !== k);
  if (UI.selCorps === k.id){ UI.selCorps = target.id; MapView.selCorps = target.id; }
}
function orderMerge(target, list){
  let now = 0, later = 0; const fails = [];
  for (const k of list){
    if (k === target || !G.p.corps.includes(k)) continue;
    if (cellDist(k.cell, target.cell) <= 1.5 && !k.naval){ mergeInto(target, k); now++; continue; }
    const r = orderMove(k, target.cell);
    if (r.ok){ k.mergeInto = target.id; later++; } else fails.push(k.name);
  }
  return {now, later, fails};
}
function openMergeModal(targetId){
  const p = G.p, target = (p.corps||[]).find(k => k.id === targetId); if (!target) return;
  const others = p.corps.filter(k => k !== target);
  if (!others.length){ toast('Não há outros exércitos para juntar.', 'bad'); return; }
  const eta = k => { if (cellDist(k.cell, target.cell) <= 1.5) return 'junta na hora'; const path = landPath(k.cell, target.cell); return path ? `marcha ~${Math.max(1, Math.ceil(path.length / corpsSpeed()))} mês(es)` : (p.navy > 0 && isCoastal(k.cell) && isCoastal(target.cell) ? 'vai por mar' : 'sem caminho'); };
  const md = openModal(`<div class="m-icon">🔗</div><div class="m-title">Juntar exércitos no ${esc(target.name)}</div>
    <div class="muted" style="text-align:center">${esc(target.name)} tem ${corpsUnitsCount(target)} divisões. Escolha quem vai se juntar a ele: os próximos se fundem agora, os distantes marcham até ele.</div>
    ${others.map(k => `<label class="deal-opt"><div><b>🎖️ ${esc(k.name)}</b> <small>${corpsUnitsCount(k)} divisões · ⚔ ${fmtNum(corpsPower(k, 'atk'), 0)}</small><small class="muted">${eta(k)}${k.mergeInto === target.id ? ' · já a caminho' : ''}</small></div><input type="checkbox" data-mg="${k.id}" checked></label>`).join('')}
    <div class="m-actions"><button class="btn" id="mg-x">Cancelar</button><button class="btn green" id="mg-ok">🔗 Juntar</button></div>`, {wide:true});
  md.querySelector('#mg-x').onclick = () => { SFX.click(); closeModal(); };
  md.querySelector('#mg-ok').onclick = () => {
    const list = [...md.querySelectorAll('[data-mg]:checked')].map(c => p.corps.find(k => k.id === +c.dataset.mg)).filter(Boolean);
    closeModal(); if (!list.length) return;
    const r = orderMerge(target, list);
    SFX.march(); const [x, y] = cellXY(target.cell); MapView.ring(x, y, '#2c4f73', 20);
    const msg = `🔗 ${target.name}: ${r.now ? `${r.now} exército(s) unido(s) agora (${corpsUnitsCount(target)} divisões)` : ''}${r.now && r.later ? '; ' : ''}${r.later ? `${r.later} a caminho para se juntar` : ''}${r.fails.length ? ` · sem caminho: ${r.fails.join(', ')}` : ''}.`;
    toast(esc(msg), r.now || r.later ? 'good' : 'bad'); addLog(msg, 'war'); refreshAll(); saveGame();
  };
}

// quem marcha para se juntar: funde ao chegar (e segue o alvo se ele se mover)
const _exMove = moveCorpsTurn;
moveCorpsTurn = function(){
  _exMove.apply(this, arguments);
  const p = G.p;
  for (const k of (p.corps||[]).slice()){
    if (!k.mergeInto) continue;
    const t = p.corps.find(x => x.id === k.mergeInto);
    if (!t){ k.mergeInto = null; continue; }
    if (cellDist(k.cell, t.cell) <= 1.5 && !k.naval){ mergeInto(t, k); addLog(`🔗 ${k.name} se juntou ao ${t.name} (${corpsUnitsCount(t)} divisões).`, 'war'); continue; }
    if (!k.naval && !(k.path && k.path.length)){ const r = orderMove(k, t.cell); if (!r.ok) k.mergeInto = null; }
  }
};

// ---------- botões ----------
// painel Militar: formar em qualquer base + juntar todos
const _exPanel = panelMilitar;
panelMilitar = function(){
  let h = _exPanel();
  h = h.replace('➕ Formar exército na capital (50% da reserva)', '⚔️ Formar / reforçar exército (capital ou bases)');
  const cs = G.p.corps || [];
  if (cs.length >= 2){
    const big = cs.slice().sort((a, b) => corpsUnitsCount(b) - corpsUnitsCount(a))[0];
    h = h.replace('<button class="btn sm green" style="width:100%" data-newcorps="1">', `<button class="btn sm" style="width:100%;margin-bottom:6px" data-exmerge="${big.id}">🔗 Agrupar exércitos no ${esc(big.name)} (o maior)</button><button class="btn sm green" style="width:100%" data-newcorps="1">`);
  }
  // botão "Juntar" em cada exército
  h = h.replace(/<button class="btn xs" data-creinf="(\d+)">➕ Reforçar 25%<\/button>/g, (s, id) => s + `<button class="btn xs" data-exmerge="${id}">🔗 Juntar outros aqui</button>`);
  return h;
};
document.addEventListener('click', e => {
  if (!G || !G.p) return;
  const nc = e.target.closest && e.target.closest('[data-newcorps]');
  if (nc){ e.stopImmediatePropagation(); e.preventDefault(); SFX.page(); openRecruitPicker(); return; }
  const mg = e.target.closest && e.target.closest('[data-exmerge]');
  if (mg){ SFX.page(); closePopover(); openMergeModal(+mg.dataset.exmerge); return; }
  const rb = e.target.closest && e.target.closest('[data-exrec]');
  if (rb){ SFX.page(); closePopover(); openRecruitAt(+rb.dataset.exrec); }
}, true);

// popover do exército: botão "Juntar outros aqui"
const _exCorpsPop = showCorpsPopover;
showCorpsPopover = function(k, x, y){
  _exCorpsPop(k, x, y);
  const pop = $('#popover'), grid = pop && pop.querySelector('.btn-grid');
  if (grid && (G.p.corps||[]).length > 1) grid.insertAdjacentHTML('beforeend', `<button class="btn xs" data-exmerge="${k.id}">🔗 Juntar outros aqui</button>`);
};
// clicar numa base no mapa: "Recrutar aqui"
const _exClick = onMapClick;
onMapClick = function(c, x, y){
  _exClick(c, x, y);
  if (!G || MapView.buildMode || UI.selCorps) return;
  const b = (G.p.buildings||[]).find(bb => bb.c === c);
  if (!isMilBase(b) && c !== G.p.capCell) return;
  const pop = $('#popover'); if (!pop || pop.classList.contains('hidden')) return;
  pop.insertAdjacentHTML('beforeend', `<button class="btn sm green" style="width:100%;margin-top:6px" data-exrec="${c}">⚔️ Recrutar e formar exército aqui</button>`);
};
MapView.onClick = onMapClick;
