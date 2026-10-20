// ============================================================
//  IMPERIUM — Ranking mundial e construções no mapa
// ============================================================
'use strict';

// ------------------------------------------------------------
//  Indicadores sociais (IDH, saúde, educação)
// ------------------------------------------------------------
function incomeIndex(pc){ return clamp(Math.log(Math.max(1, pc/(100*G.costScale)))/Math.log(400), 0.05, 1); }
function socialIndex(id){
  const tr = id === 1 ? G.p.techs.length/TECHS.length : clamp(G.nations[id].tech/TECHS.length, 0, 1);
  if (id === 1){
    const p = G.p, inc = incomeIndex(p.gdpPc);
    const hosp = (p.buildings||[]).filter(b=>b.t==='hospital').length, uni = (p.buildings||[]).filter(b=>b.t==='universidade').length;
    const health = clamp(0.25 + p.spend.health*0.06 + tr*0.2 + inc*0.15 + (p.policies.saude?0.08:0) + Math.min(0.06, hosp*0.01), 0.1, 0.99);
    const edu = clamp(0.2 + p.spend.edu*0.06 + p.urb*0.15 + tr*0.15 + inc*0.1 + (p.policies.educacao?0.08:0) + Math.min(0.06, uni*0.01), 0.1, 0.99);
    return {inc, health, edu, idh: clamp(Math.cbrt(inc*health*edu), 0.1, 0.99)};
  }
  const n = G.nations[id], inc = incomeIndex(n.pc);
  const health = clamp(0.3 + inc*0.45 + tr*0.2 + ((n.likes||[]).includes('paz')?0.03:0), 0.1, 0.98);
  const edu = clamp(0.2 + inc*0.5 + tr*0.25 + ((n.likes||[]).includes('ciencia')?0.04:0), 0.1, 0.98);
  return {inc, health, edu, idh: clamp(Math.cbrt(inc*health*edu), 0.1, 0.98)};
}

// ------------------------------------------------------------
//  Ranking
// ------------------------------------------------------------
const RANK_METRICS = {
  area:{n:'Território', icon:'🗺️', f:v=>fmtArea(v*1000)},
  gdp:{n:'Economia (PIB)', icon:'💰', f:v=>fmtMoney(v)},
  pc:{n:'PIB per capita', icon:'👤', f:v=>`${G.p.currencySym} ${fmtNum(v,0)}`},
  pop:{n:'População', icon:'👥', f:v=>fmtPop(v)},
  power:{n:'Poder militar', icon:'⚔️', f:v=>fmtNum(v,0)},
  tech:{n:'Tecnologia', icon:'🔬', f:v=>fmtNum(v,1)},
  idh:{n:'IDH', icon:'🌟', f:v=>(v/1000).toFixed(3).replace('.',',')},
  saude:{n:'Saúde', icon:'⚕️', f:v=>v+' / 100'},
  edu:{n:'Educação', icon:'🎓', f:v=>v+' / 100'}
};
const RANK_COLS = ['area','gdp','pc','pop','power','tech','idh','saude','edu'];
function rankRows(){
  const rows = [];
  for (const n of G.nations){
    if (!n || !n.alive) continue;
    const s = socialIndex(n.id);
    if (n.id === 1){ const p = G.p; rows.push([1, Math.round(p.area/1000), Math.round(p.gdp), Math.round(p.gdpPc), +p.pop.toFixed(2), Math.round(p.atk), p.techs.length, Math.round(s.idh*1000), Math.round(s.health*100), Math.round(s.edu*100)]); }
    else rows.push([n.id, Math.round(n.area/1000), Math.round(n.pop*n.pc), Math.round(n.pc), +n.pop.toFixed(2), Math.round(n.power), +n.tech.toFixed(1), Math.round(s.idh*1000), Math.round(s.health*100), Math.round(s.edu*100)]);
  }
  return rows;
}
function snapshotRanks(){ G.rankHist = G.rankHist || {}; G.rankHist[curYear()] = rankRows(); }
function rankName(id){ return id === 1 ? G.p.name : (G.nations[id] ? G.nations[id].name : '?'); }

// ------------------------------------------------------------
//  Construções
// ------------------------------------------------------------
const BUILDINGS = {
  cidade:{n:'Nova Cidade', icon:'🏙️', cost:0, d:'Funda uma cidade no local escolhido: +urbanização e +1 de apoio.'},
  fazenda:{n:'Fazenda Modelo', icon:'🌾', cost:120, fx:{popGrowth:0.06, stability:0.5}, d:'+crescimento populacional, +estabilidade'},
  mina:{n:'Mina', icon:'⛏️', cost:180, fx:{gdpMult:0.015, growth:0.05}, d:'+1,5% PIB'},
  fabrica:{n:'Fábrica', icon:'🏭', cost:300, req:'maquina_vapor', fx:{gdpMult:0.02, growth:0.1, unemployment:-0.3}, d:'+2% PIB, menos desemprego'},
  universidade:{n:'Universidade', icon:'🎓', cost:250, fx:{research:0.06, approval:0.3}, d:'+6% pesquisa, +educação'},
  hospital:{n:'Hospital', icon:'🏥', cost:200, fx:{popGrowth:0.08, approval:0.6}, d:'+saúde, +apoio'},
  porto:{n:'Porto', icon:'⚓', cost:250, coastal:true, fx:{tradeMult:0.06, navy:0.05}, d:'+6% comércio, +marinha (só no litoral)'},
  usina:{n:'Usina de Energia', icon:'⚡', cost:450, req:'eletricidade', fx:{gdpMult:0.025}, d:'+2,5% PIB'},
  base:{n:'Base Militar', icon:'🎖️', cost:300, fx:{manpower:0.1, defense:0.03}, local:{r:4, def:1.25}, d:'+reservas, +25% de defesa num raio de 4 regiões'},
  fortaleza:{n:'Fortaleza', icon:'🏰', cost:350, fx:{defense:0.02}, local:{r:3, def:1.6}, d:'+60% de defesa num raio de 3 regiões'},
  aeroporto:{n:'Base Aérea', icon:'🛫', cost:400, req:'aviacao', fx:{military:0.03}, d:'+alcance de ataque, aviões partem daqui'},
  monumento:{n:'Monumento Nacional', icon:'🗿', cost:300, fx:{approval:1.5, stability:1}, d:'+apoio e orgulho nacional'},
  datacenter:{n:'Centro de Dados', icon:'🗄️', cost:500, req:'internet', fx:{research:0.05, gdpMult:0.02}, d:'+5% pesquisa, +2% PIB'},
  lab_ia:{n:'Laboratório de IA', icon:'🧠', cost:650, req:'ia', fx:{research:0.08, gdpMult:0.015}, d:'+8% pesquisa'},
  fazenda_vertical:{n:'Fazenda Vertical', icon:'🥬', cost:400, req:'biotec', fx:{popGrowth:0.08, stability:0.6}, d:'Comida em prédios: +crescimento e estabilidade'},
  distrito_inteligente:{n:'Distrito Inteligente', icon:'🌆', cost:700, req:'cidades_inteligentes', fx:{gdpMult:0.03, approval:1, admin:0.02}, d:'+3% PIB, +apoio e administração'},
  escudo:{n:'Escudo de Lasers', icon:'🔆', cost:800, req:'escudo_laser', fx:{defense:0.04}, local:{r:5, def:1.8}, d:'+80% de defesa num raio de 5 regiões'},
  espacoporto:{n:'Espaçoporto', icon:'🚀', cost:1200, req:'base_lunar', fx:{research:0.06, tradeMult:0.05}, d:'Lançamentos espaciais: +pesquisa e +comércio'},
  usina_fusao:{n:'Usina de Fusão', icon:'🌟', cost:1500, req:'fusao', fx:{gdpMult:0.06, stability:0.5}, d:'+6% PIB com energia quase ilimitada'}
};
function buildCount(t){ return (G.p.buildings||[]).filter(b=>b.t===t).length; }
function buildCost(t){
  if (t === 'cidade') return ECON_ACTIONS.cityCost();
  return BUILDINGS[t].cost * G.costScale * (1 + 0.15*buildCount(t)) + G.p.gdp*0.002;
}
function buildUpkeep(){ return (G.p.buildings||[]).reduce((s,b)=>s + (BUILDINGS[b.t].cost*G.costScale*0.008), 0); }
function canBuildAt(t, cell){
  const B = BUILDINGS[t], p = G.p;
  if (cell < 0 || !Grid.land[cell] || Grid.owner[cell] !== 1) return 'Escolha uma região do seu território.';
  if ((p.buildings||[]).some(b=>b.c===cell)) return 'Já existe uma construção nesta região.';
  if (B.coastal && !isCoastal(cell)) return 'Portos só podem ser construídos no litoral.';
  if (B.req && !p.techs.includes(B.req)) return 'Requer ' + TECH[B.req].n + '.';
  return null;
}
function buildAt(t, cell){
  const p = G.p, why = canBuildAt(t, cell); if (why) return {ok:false, why};
  const cost = buildCost(t); if (p.treasury < cost) return {ok:false, why:`Tesouro insuficiente (${fmtMoney(cost)}).`};
  p.treasury -= cost;
  p.buildings = p.buildings || [];
  if (t === 'cidade'){ p.cities++; p.cityCells.push(cell); p.cityNames.push(genPlaceName()); p.approval += 1; }
  p.buildings.push({t, c:cell, at:G.turn});
  const msg = t === 'cidade' ? `🏙️ Fundada a cidade de ${p.cityNames[p.cityNames.length-1]}!` : `${BUILDINGS[t].icon} ${BUILDINGS[t].n} construída.`;
  addLog(msg, 'good'); derive();
  return {ok:true, msg};
}
function demolish(cell){ const p = G.p; const i = (p.buildings||[]).findIndex(b=>b.c===cell); if (i<0) return; const b = p.buildings.splice(i,1)[0]; addLog(`${BUILDINGS[b.t].icon} ${BUILDINGS[b.t].n} demolida.`, 'info'); derive(); }
function buildingsMods(m){
  const cnt = {};
  for (const b of (G.p.buildings||[])){
    if (Grid.owner[b.c] !== 1) continue;
    const B = BUILDINGS[b.t];
    const k = cnt[b.t] = (cnt[b.t]||0) + 1;
    if (B.fx) addMods(m, B.fx, 1/(1 + 0.25*(k-1)));   // retornos decrescentes
    let list = BTREE[b.t] || [];
    for (const id of (b.path||[])){ const nd = list.find(x=>x.id===id); if (!nd) break; addMods(m, nd.fx, 1/(1 + 0.15*(k-1))); list = nd.ch; }
  }
  const air = cnt.aeroporto || 0; m._airReach = Math.min(2, air);
}
function cellDist(a, b){ return Math.hypot(a%CW - b%CW, ((a/CW)|0) - ((b/CW)|0)); }
function localDefense(cell){
  let f = 1;
  for (const b of (G.p.buildings||[])){ if (Grid.owner[b.c]!==1) continue; const L = buildingLocal(b); if (L && cellDist(b.c, cell) <= L.r) f = Math.max(f, L.def); }
  return f;
}
function nearestAirbase(cell){
  let best = -1, bd = 1e9;
  for (const b of (G.p.buildings||[])) if (b.t==='aeroporto' && Grid.owner[b.c]===1){ const d = cellDist(b.c, cell); if (d < bd){ bd = d; best = b.c; } }
  return best;
}
