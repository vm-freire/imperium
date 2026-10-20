// ============================================================
//  IMPERIUM — Expedições, projetos de cidade e sinergias de obras
// ============================================================
'use strict';

// ------------------------------------------------------------
//  Expedições para terras livres distantes
// ------------------------------------------------------------
const EXPED = {
  naval:{n:'Expedição naval', icon:'⛵', d:'Navios levam colonos pelo oceano. Só para terras no litoral.',
    can:(p, to)=> p.navy <= 0 ? 'Precisamos de navios (aba Militar).' : !isCoastal(to) ? 'O destino precisa estar no litoral.' : null,
    from:(p)=>{ const ports = (p.buildings||[]).filter(b=>b.t==='porto' && Grid.owner[b.c]===1).map(b=>b.c); return ports.length ? ports : coastalOwned(); },
    speed:()=>10 + (G.p.techs.includes('canais')?5:0) + (G.p.techs.includes('motor_diesel')?3:0) + (G.p.techs.includes('turbina_vapor')?2:0), risk:0.18, range:999, cost:90},
  dirigivel:{n:'Expedição por dirigível', icon:'🎈', d:'Um dirigível leva pioneiros por cima de montanhas e desertos.', tech:'dirigivel',
    can:()=>null, from:(p)=>[p.capCell], speed:()=>14, risk:0.28, range:40, cost:160},
  aerea:{n:'Ponte aérea', icon:'✈️', d:'Aviões levam tropas e engenheiros a partir de uma Base Aérea.', tech:'aviacao',
    can:(p)=> (p.buildings||[]).some(b=>b.t==='aeroporto' && Grid.owner[b.c]===1) ? null : 'É preciso ter uma Base Aérea (aba Obras).',
    from:(p)=>(p.buildings||[]).filter(b=>b.t==='aeroporto' && Grid.owner[b.c]===1).map(b=>b.c),
    speed:()=>40, risk:0.1, range:()=>28 + (G.p.techs.includes('jato')?35:0), cost:240}
};
function coastalOwned(){ const r = []; for (let i=0;i<NCELLS;i++) if (Grid.land[i] && Grid.owner[i]===1 && isCoastal(i)) r.push(i); return r; }
function expedPlan(type, to){
  const p = G.p, E = EXPED[type];
  if (E.tech && !p.techs.includes(E.tech)) return {ok:false, why:`Requer a tecnologia ${TECH[E.tech].n} (${TECH[E.tech].year}).`};
  const why = E.can(p, to); if (why) return {ok:false, why};
  const starts = E.from(p); if (!starts.length) return {ok:false, why:'Não há ponto de partida disponível.'};
  const from = starts.sort((a,b)=>cellDist(a,to)-cellDist(b,to))[0], d = cellDist(from, to);
  const range = typeof E.range === 'function' ? E.range() : E.range;
  if (d > range) return {ok:false, why:`Longe demais para ${E.n.toLowerCase()} (alcance ${range} regiões, distância ${Math.round(d)}).`};
  const months = Math.max(1, Math.ceil(d / E.speed()));
  const real = realClimateAt(cellCenter(to)[1]);
  let risk = E.risk + d/400 + (real==='frio'?0.12:real==='arido'?0.06:0) - (p.techs.includes('medicina')?0.04:0) - (p.techs.includes('radio')?0.04:0);
  risk = clamp(risk, 0.05, 0.75);
  const cost = (E.cost + d*4) * G.costScale + p.gdp*0.003;
  return {ok:true, type, from, to, months, risk, cost, dist:d};
}
function launchExpedition(type, to){
  const pl = expedPlan(type, to); if (!pl.ok) return pl;
  const p = G.p; if (p.treasury < pl.cost) return {ok:false, why:`Tesouro insuficiente (${fmtMoney(pl.cost)}).`};
  if ((p.expeds||[]).some(e=>e.to===to)) return {ok:false, why:'Já existe uma expedição indo para lá.'};
  p.treasury -= pl.cost; p.expeds = p.expeds || [];
  p.expeds.push({type, from:pl.from, to, start:G.turn, due:G.turn + pl.months, risk:pl.risk});
  addLog(`${EXPED[type].icon} ${EXPED[type].n} partiu rumo a terras distantes. Chegada em ~${pl.months} ${pl.months>1?'meses':'mês'}.`, 'info');
  return {ok:true, msg:`${EXPED[type].icon} Expedição a caminho! Chegada em ~${pl.months} ${pl.months>1?'meses':'mês'} (risco de ${Math.round(pl.risk*100)}%).`};
}
function expeditionsTurn(){
  const p = G.p; if (!p.expeds || !p.expeds.length) return;
  const keep = [];
  for (const e of p.expeds){
    if (G.turn < e.due){ keep.push(e); continue; }
    if (Grid.owner[e.to] !== 0){ addLog(`${EXPED[e.type].icon} Ao chegar, a expedição encontrou a terra já ocupada e voltou.`, 'bad'); continue; }
    if (Math.random() < e.risk){ addLog(`${EXPED[e.type].icon} Perdemos contato com a expedição... ninguém voltou.`, 'bad'); if (typeof onNegotiation==='function') onNegotiation('💀 Uma expedição desapareceu.', false); continue; }
    const cells = bfsCells(e.to, 0, e.type === 'aerea' ? 2 : 3);
    transferCells(cells, 0, 1);
    p.outposts = p.outposts || {}; for (const c of cells) p.outposts[c] = G.turn;
    G.stats.expeditions = (G.stats.expeditions||0) + 1; G.stats.colonized += cells.length;
    addLog(`${EXPED[e.type].icon} Expedição bem-sucedida! Fundamos um posto avançado com ${cells.length} regiões. Agora dá para colonizar ao redor.`, 'good');
    if (typeof onNegotiation==='function') onNegotiation(`🚩 Posto avançado fundado em terras distantes!`, true);
  }
  p.expeds = keep;
  // postos avançados precisam de suprimento até se integrarem (24 meses)
  if (p.outposts){ for (const k in p.outposts){ if (Grid.owner[k] !== 1 || G.turn - p.outposts[k] > 24) delete p.outposts[k]; } }
}
function outpostUpkeep(){ return Object.keys(G.p.outposts||{}).length * 2 * G.costScale; }

// ------------------------------------------------------------
//  Projetos de cidade
// ------------------------------------------------------------
const CITY_PROJ = {
  festival:{n:'Festival Cultural', icon:'🎭', months:3, cost:0.002, d:'Música e festa: +3 de apoio e alegria por um ano.', done:()=>{ G.p.approval += 3; addTemp({approval:1}, 12, 'Festival'); }, repeat:true},
  feira:{n:'Feira Industrial', icon:'🎪', months:6, cost:0.004, d:'Empresas exibem inovações: +0,3% de crescimento por 2 anos.', done:()=>addTemp({growth:0.3}, 24, 'Feira industrial'), repeat:true},
  saneamento_c:{n:'Saneamento Urbano', icon:'🚰', months:8, cost:0.005, tech:'saneamento', d:'Esgoto e água tratada: a cidade cresce saudável.', fx:{popGrowth:0.03}},
  expansao:{n:'Expansão Urbana', icon:'🏘️', months:12, cost:0.008, d:'Novos bairros: +2 cidades-satélite (mais urbanização).', done:()=>{ G.p.cities += 2; }, repeat:true},
  campus:{n:'Campus Universitário', icon:'🎓', months:12, cost:0.006, d:'Pesquisa e jovens talentos.', fx:{research:0.02}},
  arranha_ceus:{n:'Arranha-céus', icon:'🏙️', months:14, cost:0.009, tech:'elevador', d:'Centro financeiro vertical.', fx:{gdpMult:0.01}},
  metro_c:{n:'Metrô', icon:'🚇', months:18, cost:0.012, tech:'metro', d:'Transporte rápido: mais produtividade e apoio.', fx:{gdpMult:0.01, approval:0.5}},
  porto_franco:{n:'Zona Portuária Franca', icon:'⚓', months:10, cost:0.006, coastal:true, d:'Impostos reduzidos no porto (só no litoral).', fx:{tradeMult:0.03}},
  inteligente:{n:'Cidade Inteligente', icon:'📡', months:16, cost:0.01, tech:'internet', d:'Sensores e dados em tudo.', fx:{gdpMult:0.015, research:0.01}},
  olimpiadas:{n:'Jogos Olímpicos', icon:'🏅', months:24, cost:0.03, year:1896, unique:true, d:'O mundo inteiro assiste: +8 de apoio e +5 de relações com todos.', done:()=>{ G.p.approval += 8; relAll(5); G.stats.olympics = (G.stats.olympics||0) + 1; addNews(`${G.p.name} sedia os Jogos Olímpicos!`); }}
};
function projBlocked(cell, id){
  const P = CITY_PROJ[id], p = G.p, ci = cityInfo(cell);
  if (ci.proj) return 'A cidade já tem um projeto em andamento.';
  if (P.tech && !p.techs.includes(P.tech)) return `Requer ${TECH[P.tech].n}.`;
  if (P.year && curYear() < P.year) return `Disponível a partir de ${P.year}.`;
  if (P.coastal && !isCoastal(cell)) return 'Só para cidades no litoral.';
  if (!P.repeat && (ci.done||[]).includes(id)) return 'Já concluído nesta cidade.';
  if (P.unique && (G.stats.olympicsAt||[]).length && G.turn - G.stats.olympicsAt[G.stats.olympicsAt.length-1] < 96) return 'Só a cada 8 anos.';
  return null;
}
function projCost(id){ return G.p.gdp * CITY_PROJ[id].cost + 15*G.costScale; }
function startCityProject(cell, id){
  const why = projBlocked(cell, id); if (why) return {ok:false, why};
  const cost = projCost(id), p = G.p; if (p.treasury < cost) return {ok:false, why:`Tesouro insuficiente (${fmtMoney(cost)}).`};
  p.treasury -= cost; const ci = cityInfo(cell); ci.proj = {id, due:G.turn + CITY_PROJ[id].months};
  if (CITY_PROJ[id].unique){ G.stats.olympicsAt = (G.stats.olympicsAt||[]).concat([G.turn]); }
  addLog(`🏗️ ${ci.name} começou o projeto ${CITY_PROJ[id].icon} ${CITY_PROJ[id].n} (${CITY_PROJ[id].months} meses).`, 'info');
  return {ok:true, msg:`${CITY_PROJ[id].icon} ${CITY_PROJ[id].n} iniciado em ${ci.name}.`};
}
function cityProjectsTurn(){
  const p = G.p; if (!p.cityInfo) return;
  for (const k in p.cityInfo){
    const ci = p.cityInfo[k]; if (!ci.proj || G.turn < ci.proj.due) continue;
    const P = CITY_PROJ[ci.proj.id]; ci.done = (ci.done||[]).concat([ci.proj.id]); ci.proj = null;
    if (Grid.owner[+k] !== 1) continue;
    if (P.done) P.done();
    G.stats.cityProjects = (G.stats.cityProjects||0) + 1;
    addLog(`🏙️ ${ci.name} concluiu: ${P.icon} ${P.n}!`, 'good');
    if (typeof onNegotiation==='function') onNegotiation(`🏙️ ${ci.name}: ${P.n} concluído!`, true);
  }
}
function cityProjectMods(m){
  const p = G.p; if (!p.cityInfo) return;
  for (const k in p.cityInfo){ if (Grid.owner[+k] !== 1) continue; for (const id of (p.cityInfo[k].done||[])){ const P = CITY_PROJ[id]; if (P && P.fx) addMods(m, P.fx); } }
}

// ------------------------------------------------------------
//  Sinergias entre obras próximas
// ------------------------------------------------------------
const SYNERGIES = [
  {a:'fabrica', b:'mina', r:3, n:'Complexo minero-industrial', icon:'⚒️', fx:{gdpMult:0.01, unitCost:-0.02}},
  {a:'universidade', b:'hospital', r:3, n:'Polo de medicina', icon:'🩺', fx:{popGrowth:0.04, research:0.02}},
  {a:'porto', b:'fabrica', r:3, n:'Polo exportador', icon:'📦', fx:{tradeMult:0.04}},
  {a:'usina', b:'fabrica', r:3, n:'Parque industrial energizado', icon:'⚡', fx:{gdpMult:0.012}},
  {a:'base', b:'fortaleza', r:4, n:'Linha de defesa', icon:'🛡️', fx:{defense:0.04}},
  {a:'aeroporto', b:'base', r:4, n:'Base conjunta', icon:'🎖️', fx:{military:0.03}},
  {a:'fazenda', b:'porto', r:4, n:'Corredor agroexportador', icon:'🌾', fx:{tradeMult:0.03, popGrowth:0.02}},
  {a:'universidade', b:'fabrica', r:3, n:'Parque tecnológico', icon:'🔬', fx:{research:0.03, gdpMult:0.005}},
  {a:'monumento', b:'cidade', r:2, n:'Centro histórico', icon:'🏛️', fx:{approval:0.5}},
  {a:'usina', b:'mina', r:3, n:'Polo energético-mineral', icon:'🔋', fx:{gdpMult:0.008}},
  {a:'fazenda', b:'usina', r:3, n:'Irrigação mecanizada', icon:'💧', fx:{popGrowth:0.03}},
  {a:'hospital', b:'base', r:3, n:'Hospital militar', icon:'🚑', fx:{manpower:0.05}}
];
function activeSynergies(){
  const p = G.p, bs = (p.buildings||[]).filter(b=>Grid.owner[b.c]===1), out = [], used = new Set();
  for (const S of SYNERGIES){
    for (const a of bs.filter(b=>b.t===S.a)){
      const b = bs.find(x=>x.t===S.b && x !== a && cellDist(x.c, a.c) <= S.r && !used.has(S.n+':'+x.c));
      if (b){ out.push({S, a, b}); used.add(S.n+':'+b.c); }
    }
  }
  return out;
}
function synergyMods(m){
  const cnt = {};
  for (const {S} of activeSynergies()){ const k = cnt[S.n] = (cnt[S.n]||0) + 1; addMods(m, S.fx, 1/(1 + 0.3*(k-1))); }
}
function potentialSynergies(t, cell){
  const bs = (G.p.buildings||[]).filter(b=>Grid.owner[b.c]===1);
  return SYNERGIES.filter(S=>(S.a===t && bs.some(b=>b.t===S.b && cellDist(b.c, cell) <= S.r)) || (S.b===t && bs.some(b=>b.t===S.a && cellDist(b.c, cell) <= S.r)));
}
