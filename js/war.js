// ============================================================
//  IMPERIUM — Exércitos no mapa, batalhas, ocupação,
//  instalações estratégicas e ferrovias
// ============================================================
'use strict';

const LAND_UNITS = ['inf','cav','art','tanque'];
const AIR_UNITS = ['aviao','drone','missil'];
const CORPS_NAMES = ['1º Exército','2º Exército','3º Exército','4º Exército','5º Exército','6º Exército','7º Exército','8º Exército','Exército do Norte','Exército do Sul','Exército do Leste','Exército do Oeste','Guarda Nacional','Legião Estrangeira'];

// ------------------------------------------------------------
//  Exércitos (corpos)
// ------------------------------------------------------------
function corpsUnitsCount(c){ return LAND_UNITS.reduce((s,u)=>s+(c.units[u]||0),0); }
function corpsPower(c, kind){
  const p = G.p, m = p.mods || calcMods(); let s = 0;
  for (const u of LAND_UNITS){ const U = UNIT[u]; s += (c.units[u]||0) * (kind==='def' ? U.def : U.atk); }
  return s * (1 + m.military + (kind==='def'?m.defense:0)) * p.morale * (c.morale||1) * (1 + (c.xp||0)*0.05);
}
function reserveLand(){ return LAND_UNITS.reduce((s,u)=>s+(G.p.units[u]||0),0); }
function newCorps(cell, frac, name){
  const p = G.p; p.corps = p.corps || []; p.corpsSeq = (p.corpsSeq||0) + 1;
  const units = {};
  for (const u of LAND_UNITS){ const k = Math.floor((p.units[u]||0) * frac); if (k > 0){ units[u] = k; p.units[u] -= k; } }
  if (!Object.keys(units).length) return {ok:false, why:'Não há tropas terrestres na reserva. Recrute na lista abaixo.'};
  const c = {id:p.corpsSeq, name: name || CORPS_NAMES[(p.corpsSeq-1) % CORPS_NAMES.length], cell, prev:cell, units, morale:1, xp:0, path:[], naval:0, lastAttack:-1};
  p.corps.push(c);
  return {ok:true, corps:c, msg:`${c.name} formado com ${corpsUnitsCount(c)} divisões.`};
}
function reinforceCorps(c, frac){
  const p = G.p; let n = 0;
  for (const u of LAND_UNITS){ const k = Math.floor((p.units[u]||0)*frac); if (k>0){ c.units[u] = (c.units[u]||0) + k; p.units[u] -= k; n += k; } }
  return n ? {ok:true, msg:`${c.name} recebeu ${n} divisões da reserva.`} : {ok:false, why:'A reserva está vazia.'};
}
function disbandCorps(c){
  const p = G.p; for (const u in c.units) p.units[u] = (p.units[u]||0) + c.units[u];
  p.corps = p.corps.filter(x=>x!==c); return {ok:true, msg:`${c.name} foi desmobilizado e as tropas voltaram para a reserva.`};
}
function corpsSpeed(){ const t = G.p.techs; return 3 + (t.includes('ferrovias')?3:0) + (t.includes('motor')?2:0) + (t.includes('trem_bala')?3:0) + (t.includes('helicoptero')?2:0); }
function corpsAt(cell){ return (G.p.corps||[]).find(c=>c.cell===cell); }
function corpsNear(cell, r){ return (G.p.corps||[]).filter(c=>cellDist(c.cell, cell) <= r); }
// caminho por terra (território próprio ou neutro)
function landPath(from, to){
  if (from === to) return [];
  const prev = new Map([[from, -1]]), q = [from];
  const ok = i => Grid.land[i] && (Grid.owner[i] === 1 || Grid.owner[i] === 0);
  while (q.length){
    const c = q.shift(); if (c === to) break;
    for (const nb of neighbors4(c)){ if (!prev.has(nb) && ok(nb)){ prev.set(nb, c); q.push(nb); } }
    if (prev.size > 20000) break;
  }
  if (!prev.has(to)) return null;
  const path = []; let c = to; while (c !== from){ path.unshift(c); c = prev.get(c); }
  return path;
}
function orderMove(c, dest){
  const p = G.p;
  if (!Grid.land[dest] || (Grid.owner[dest] !== 1 && Grid.owner[dest] !== 0)) return {ok:false, why:'Exércitos só marcham pelo próprio território ou terras livres. Para entrar no território inimigo, ataque.'};
  const path = landPath(c.cell, dest);
  if (path){ c.path = path; c.naval = 0; const m = Math.ceil(path.length / corpsSpeed()); return {ok:true, msg:`${c.name} marcha para o destino (${path.length} regiões, ~${m} ${m>1?'meses':'mês'}).`}; }
  if (p.navy > 0 && isCoastal(c.cell) && isCoastal(dest)){ const d = cellDist(c.cell, dest); c.path = [dest]; c.naval = Math.max(1, Math.ceil(d / 12)); return {ok:true, msg:`${c.name} embarca na frota (${c.naval} ${c.naval>1?'meses':'mês'} de viagem).`}; }
  return {ok:false, why:'Não há caminho por terra. Para atravessar o mar, o exército precisa estar no litoral, o destino também, e você precisa de navios.'};
}
function moveCorpsTurn(){
  const p = G.p, sp = corpsSpeed();
  for (const c of (p.corps||[])){
    c.prev = c.cell;
    if (c.naval > 0){ c.naval--; if (c.naval === 0 && c.path.length){ c.cell = c.path[0]; c.path = []; } continue; }
    if (c.path && c.path.length){
      let k = 0;
      while (k < sp && c.path.length){ const nx = c.path[0]; if (Grid.owner[nx] !== 1 && Grid.owner[nx] !== 0){ c.path = []; break; } c.cell = c.path.shift(); k++; }
    }
    // tropas fora do próprio território perdem moral lentamente
    if (Grid.owner[c.cell] !== 1) c.morale = Math.max(0.5, (c.morale||1) - 0.01); else c.morale = Math.min(1.1, (c.morale||1) + 0.02);
    // exército isolado em território perdido recua
    if (Grid.owner[c.cell] > 1){ const nc = nearestOwned(1, c.cell); if (nc >= 0){ c.cell = nc; c.path = []; } }
  }
  p.corps = (p.corps||[]).filter(c=>corpsUnitsCount(c) > 0);
}
function lossesToCorps(c, frac){
  let lost = 0;
  for (const u of LAND_UNITS){ const k = c.units[u]||0; let l = k*frac; l = Math.floor(l) + (Math.random() < l%1 ? 1 : 0); l = Math.min(k, l); c.units[u] = k - l; lost += l; }
  return lost;
}
function airSupport(cell){
  const p = G.p, m = p.mods || calcMods(); let s = 0;
  for (const u of AIR_UNITS) s += (p.units[u]||0) * UNIT[u].atk;
  if (!s) return 0;
  const base = nearestAirbase(cell), d = base >= 0 ? cellDist(base, cell) : cellDist(p.capCell, cell);
  const range = 10 + (p.techs.includes('jato')?8:0) + (base>=0?6:0);
  return d <= range ? s * 0.5 * (1 + m.military) : 0;
}
function corpsReach(){ const t = G.p.techs; return 2 + (t.includes('ferrovias')?1:0) + (t.includes('blindados')?1:0) + (t.includes('paraquedistas')?2:0) + ((G.p.mods && G.p.mods._airReach)||0); }

// ------------------------------------------------------------
//  Ataque do jogador com um exército
// ------------------------------------------------------------
function attackCandidates(cell){
  const p = G.p, R = corpsReach();
  return (p.corps||[]).filter(c=>c.lastAttack !== G.turn && corpsUnitsCount(c) > 0 && !c.naval && (cellDist(c.cell, cell) <= R + 0.5 || (isCoastal(c.cell) && isCoastal(cell) && p.navy > 0 && cellDist(c.cell, cell) <= 18)));
}
function planAttack(cell, commit, corpsId){
  const p = G.p, e = Grid.owner[cell], n = G.nations[e];
  if (!n || !n.atWar) return {ok:false, why:'Não estamos em guerra com esta nação.'};
  const cands = attackCandidates(cell);
  if (!cands.length) return {ok:false, why:`Nenhum exército ao alcance (até ${corpsReach()} regiões, ou pelo litoral com navios). Clique num exército seu e depois no destino para movê-lo para perto da frente.`, noCorps:true};
  const c = cands.find(x=>x.id===corpsId) || cands.sort((a,b)=>cellDist(a.cell,cell)-cellDist(b.cell,cell))[0];
  const naval = cellDist(c.cell, cell) > corpsReach() + 0.5;
  let force = corpsPower(c, 'atk') * commit + airSupport(cell) * commit;
  if (naval) force *= clamp(0.35 + (p.navy/Math.max(1,n.navy))*0.35 + (p.techs.includes('submarino')?0.1:0), 0.35, 0.95);
  const capD = n.cap >= 0 ? cellDist(cell, n.cap) : 20;
  const isCap = cell === n.cap, site = (n.sites||[]).find(s=>cellDist(s.c, cell) <= 1);
  let share = 0.14 + 0.28/(1 + capD/8);
  let def = n.power * share * (isCap ? 1.6 : 1) * (site ? 1.35 : 1) * (1 + Math.max(0, n.tech - p.techs.length)*0.02);
  return {ok:true, corps:c, cands, naval, force, def, odds:battleOdds(force, def), isCap, site, e};
}
function playerAttack(cell, commit, corpsId){
  const plan = planAttack(cell, commit, corpsId); if (!plan.ok) return plan;
  const p = G.p, n = G.nations[plan.e], w = getWar(plan.e), c = plan.corps;
  c.lastAttack = G.turn;
  const win = Math.random() < plan.odds;
  const ratio = plan.force/(plan.force+plan.def);
  const med = p.techs.includes('antibioticos') ? 0.85 : 1;
  // perdas: só as tropas empenhadas estão em risco — e uma derrota é cara
  const lossFrac = commit * (win ? rand(0.08, 0.22)*(1.3-ratio) : rand(0.35, 0.65)) * med;
  const lost = lossesToCorps(c, lossFrac);
  c.morale = clamp((c.morale||1) + (win ? 0.05 : -0.15), 0.4, 1.2);
  c.xp = (c.xp||0) + (win ? 0.3 : 0.1);
  n.power *= 1 - (win ? rand(0.07, 0.14) : rand(0.02, 0.05)) * commit;
  p.warWeary += 1 + lossFrac*25;
  let captured = [];
  if (win){
    const nCap = clamp(Math.round(1 + 4*ratio*commit + rand(0, 1.2)) - (plan.naval?1:0), 1, 6);
    captured = bfsCells(cell, plan.e, nCap);
    p.occ = p.occ || {};
    for (const x of captured) p.occ[x] = {t:G.turn, from:plan.e};
    transferCells(captured, plan.e, 1);
    if (Grid.owner[cell] === 1){ c.prev = c.cell; c.cell = cell; c.path = []; }
    revealSitesNear(cell, 4, plan.e);
    w.score += captured.length + (plan.isCap?15:0); w.won++; w.taken += captured.length;
    G.stats.battlesWon++; G.stats.cellsConquered += captured.length;
    unlock('primeira_vitoria');
    addLog(`🗡️ ${c.name} venceu em ${n.name}: +${captured.length} regiões (perdemos ${lost} divisões).`, 'good');
    p.approval += GOVS[p.gov].family==='dem' ? 0.5 : 1.5;
  } else {
    w.score -= 3; w.lost++; G.stats.battlesLost++;
    addLog(`💀 ${c.name} foi derrotado em ${n.name}! Perdemos ${lost} divisões (${Math.round(lossFrac*100)}% das tropas).`, 'bad');
    p.approval -= 2;
  }
  p.corps = p.corps.filter(x=>corpsUnitsCount(x) > 0);
  derive();
  return {ok:true, win, captured, lost, plan, lossFrac, corpsDead: !p.corps.includes(c)};
}

// defesa de uma região do jogador (usada quando a IA ataca)
function playerLocalDefense(cell){
  const p = G.p; let d = 0;
  for (const c of corpsNear(cell, 4)) d += corpsPower(c, 'def') * (cellDist(c.cell, cell) <= 1 ? 1 : 0.7);
  let res = 0; const m = p.mods || calcMods();
  for (const u of LAND_UNITS) res += (p.units[u]||0) * UNIT[u].def;
  d += res * (1 + m.military + m.defense) * p.morale * 0.6;
  // tropas em campo também guarnecem o país todo, com eficiência menor quando longe
  for (const c of (p.corps||[])) if (cellDist(c.cell, cell) > 4) d += corpsPower(c, 'def') * 0.15;
  return d;
}

// ------------------------------------------------------------
//  Ocupação: territórios conquistados resistem
// ------------------------------------------------------------
function occupationTurn(){
  const p = G.p; if (!p.occ) return;
  const revolts = {};
  for (const k in p.occ){
    const cell = +k, o = p.occ[k];
    if (Grid.owner[cell] !== 1){ delete p.occ[k]; continue; }
    if (G.turn - o.t > 36){ delete p.occ[k]; continue; }   // integrado
    if (corpsNear(cell, 3).length) continue;                 // guarnecido
    if (Math.random() < 0.035 * (1.3 - p.stability/100)){
      const back = G.nations[o.from] && G.nations[o.from].alive ? o.from : 0;
      (revolts[back] = revolts[back] || []).push(cell); delete p.occ[k];
    }
  }
  for (const to in revolts){
    transferCells(revolts[to], 1, +to);
    addLog(`🔥 Rebeldes expulsaram nossas tropas de ${revolts[to].length} região(ões) ocupada(s)${+to ? ' e voltaram a ' + G.nations[to].name : ''}. Mantenha exércitos perto das terras conquistadas!`, 'bad');
  }
}
function occupiedCount(){ return Object.keys(G.p.occ||{}).length; }

// ------------------------------------------------------------
//  Instalações estratégicas das outras nações
// ------------------------------------------------------------
const SITES = {
  base:{n:'Base militar', icon:'🎖️', fx:n=>{ n.power *= 0.8; }, d:'exército inimigo −20%'},
  usina:{n:'Usina de energia', icon:'⚡', fx:n=>{ n.pc *= 0.95; }, d:'economia inimiga −5%'},
  hidreletrica:{n:'Hidrelétrica', icon:'🌊', fx:n=>{ n.pc *= 0.94; }, d:'economia inimiga −6%'},
  agua:{n:'Central de abastecimento de água', icon:'💧', fx:n=>{ n.pop *= 0.98; }, d:'população inimiga sofre'},
  industria:{n:'Polo industrial', icon:'🏭', fx:n=>{ n.pc *= 0.93; n.power *= 0.95; }, d:'economia −7%, exército −5%'},
  porto:{n:'Porto naval', icon:'⚓', fx:n=>{ n.navy *= 0.6; }, d:'marinha inimiga −40%'}
};
function genSites(n){
  const cells = []; for (let i=0;i<NCELLS;i++) if (Grid.land[i] && Grid.owner[i]===n.id) cells.push(i);
  if (!cells.length) return [];
  const rnd = makeRng(n.id*313 + cells.length);
  const types = ['base', (n.res||[]).includes('agua') ? 'hidreletrica' : 'usina', 'agua', 'industria'];
  if (cells.length > 150) types.push('base', 'industria');
  const coast = cells.filter(isCoastal); if (coast.length) types.push('porto');
  const out = [], used = new Set([n.cap]);
  for (const t of types){
    const pool = t === 'porto' ? coast : cells;
    for (let tries=0; tries<20; tries++){ const c = pool[Math.floor(rnd()*pool.length)]; if (!used.has(c)){ used.add(c); out.push({t, c, known:false}); break; } }
  }
  return out;
}
function revealSites(id){ const n = G.nations[id]; let k = 0; for (const s of (n.sites||[])) if (!s.known){ s.known = true; k++; } return k; }
function revealSitesNear(cell, r, id){
  const n = G.nations[id]; if (!n || !n.sites) return;
  for (const s of n.sites) if (!s.known && cellDist(s.c, cell) <= r){ s.known = true; addLog(`🔎 Descobrimos uma instalação de ${n.name}: ${SITES[s.t].icon} ${SITES[s.t].n}.`, 'info'); }
}
function sitesCaptured(cells, from, to){
  const n = G.nations[from]; if (!n || !n.sites) return;
  const set = new Set(cells);
  const hit = n.sites.filter(s=>set.has(s.c));
  if (!hit.length) return;
  n.sites = n.sites.filter(s=>!set.has(s.c));
  for (const s of hit){
    SITES[s.t].fx(n);
    if (to === 1){ const w = getWar(from); if (w) w.score += 8; addLog(`💥 Capturamos ${SITES[s.t].n.toLowerCase()} de ${n.name}! (${SITES[s.t].d})`, 'good'); }
  }
}

// ------------------------------------------------------------
//  Ferrovias (visíveis no mapa — proteja-as!)
// ------------------------------------------------------------
function railNodes(){
  const p = G.p, nodes = new Set();
  if (p.capCell >= 0 && Grid.owner[p.capCell] === 1) nodes.add(p.capCell);
  (p.cityCells||[]).forEach(c=>{ if (Grid.owner[c] === 1) nodes.add(c); });
  (p.buildings||[]).forEach(b=>{ if (Grid.owner[b.c] === 1 && ['fabrica','porto','mina','usina','base'].includes(b.t)) nodes.add(b.c); });
  return [...nodes];
}
function computeRails(){
  if (!G || !G.p || !G.p.techs.includes('ferrovias')) return [];
  const nodes = railNodes(); if (nodes.length < 2) return [];
  const inT = new Set([nodes[0]]), edges = [];
  const rest = new Set(nodes.slice(1));
  while (rest.size){
    let best = null, bd = 1e9;
    for (const a of inT) for (const b of rest){ const d = cellDist(a, b); if (d < bd){ bd = d; best = [a, b]; } }
    if (!best || bd > 25) break;
    edges.push(best); inT.add(best[1]); rest.delete(best[1]);
  }
  return edges;
}
function railCut(lostCells){
  const p = G.p; if (!p.techs.includes('ferrovias')) return;
  const set = new Set(lostCells);
  const hit = (MapView.rails||[]).filter(([a,b])=>set.has(a)||set.has(b));
  if (hit.length){ addTemp({growth:-0.3, admin:-0.02}, 12, 'Ferrovias cortadas'); addLog(`🚂 O inimigo cortou ${hit.length} trecho(s) de ferrovia! A economia e a logística sofrem.`, 'bad'); }
}
