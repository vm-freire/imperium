// ============================================================
//  IMPERIUM — Cidades (nome, vocação, informações) e capital
// ============================================================
'use strict';

const CITY_VOC = {
  comercial:{n:'Comercial', icon:'🏬', fx:{gdpMult:0.006, tradeMult:0.02}, d:'Lojas, mercados e bancos: mais comércio e riqueza.'},
  industrial:{n:'Industrial', icon:'🏭', fx:{gdpMult:0.008, unemployment:-0.15}, d:'Fábricas e operários: mais produção e empregos.'},
  portuaria:{n:'Portuária', icon:'⚓', fx:{tradeMult:0.03, navy:0.02}, coastal:true, d:'Porto movimentado (só no litoral): comércio exterior e marinha.'},
  universitaria:{n:'Universitária', icon:'🎓', fx:{research:0.02}, d:'Estudantes e cientistas: pesquisa mais rápida.'},
  turistica:{n:'Turística', icon:'🏖️', fx:{approval:0.3, gdpMult:0.004}, d:'Visitantes do mundo todo: riqueza e orgulho.'},
  agricola:{n:'Agrícola', icon:'🌾', fx:{popGrowth:0.03, stability:0.2}, d:'Centro rural: comida farta e estabilidade.'},
  militar:{n:'Militar', icon:'🎖️', fx:{manpower:0.03, defense:0.01}, d:'Quartéis e academias: mais reservas e defesa.'},
  administrativa:{n:'Administrativa', icon:'🏛️', fx:{admin:0.01}, d:'Sede de órgãos públicos: governo mais eficiente.'}
};
function cityInfo(cell){
  const p = G.p; p.cityInfo = p.cityInfo || {};
  if (!p.cityInfo[cell]){
    const i = p.cityCells.indexOf(cell), rnd = makeRng(cell*13 + 7);
    const keys = Object.keys(CITY_VOC).filter(k=>!CITY_VOC[k].coastal || isCoastal(cell));
    p.cityInfo[cell] = {name: cell === p.capCell ? p.capital : (p.cityNames[i] || genPlaceName()), founded:null, voc: cell === p.capCell ? 'administrativa' : keys[Math.floor(rnd()*keys.length)]};
  }
  return p.cityInfo[cell];
}
function cityPopulation(cell){
  const p = G.p, n = Math.max(1, (p.cityCells||[]).filter(c=>Grid.owner[c]===1).length);
  const urbanPop = p.pop * (p.urb || 0.3);
  const w = cell === p.capCell ? 3.5 : 0.6 + (makeRng(cell*31)()*0.9);
  return urbanPop / (n + 3) * w;
}
function cityMods(m){
  const p = G.p; if (!p.cityInfo) return;
  for (const k in p.cityInfo){ const c = +k; if (Grid.owner[c] !== 1) continue; const v = CITY_VOC[p.cityInfo[k].voc]; if (v) addMods(m, v.fx); }
}
function foundCity(cell, name, voc){
  const p = G.p, why = canBuildAt('cidade', cell); if (why) return {ok:false, why};
  if (CITY_VOC[voc].coastal && !isCoastal(cell)) return {ok:false, why:'Uma cidade portuária precisa ficar no litoral.'};
  const cost = buildCost('cidade'); if (p.treasury < cost) return {ok:false, why:`Tesouro insuficiente (${fmtMoney(cost)}).`};
  p.treasury -= cost; p.cities++; p.cityCells.push(cell); p.cityNames.push(name); p.approval += 1;
  p.buildings = p.buildings || []; p.buildings.push({t:'cidade', c:cell, at:G.turn});
  p.cityInfo = p.cityInfo || {}; p.cityInfo[cell] = {name, founded:G.turn, voc};
  addLog(`🏙️ Fundada a cidade de ${name} (${CITY_VOC[voc].n}).`, 'good'); derive();
  return {ok:true, msg:`🏙️ ${name} foi fundada! Vocação: ${CITY_VOC[voc].icon} ${CITY_VOC[voc].n}.`};
}
function renameCity(cell, name){
  const p = G.p, info = cityInfo(cell); const old = info.name; info.name = name;
  const i = p.cityCells.indexOf(cell); if (i >= 0) p.cityNames[i] = name;
  if (cell === p.capCell) p.capital = name;
  addLog(`🏙️ ${old} agora se chama ${name}.`, 'info');
}
function changeVocation(cell, voc){
  const p = G.p, cost = p.gdp*0.003 + 20*G.costScale; if (p.treasury < cost) return {ok:false, why:`Tesouro insuficiente (${fmtMoney(cost)}).`};
  if (CITY_VOC[voc].coastal && !isCoastal(cell)) return {ok:false, why:'Uma cidade portuária precisa ficar no litoral.'};
  p.treasury -= cost; cityInfo(cell).voc = voc; derive();
  return {ok:true, msg:`Nova vocação: ${CITY_VOC[voc].icon} ${CITY_VOC[voc].n}.`};
}
function capitalCost(){ return G.p.gdp*0.02 + 60*G.costScale; }
function changeCapital(cell){
  const p = G.p;
  if (Grid.owner[cell] !== 1) return {ok:false, why:'A nova capital precisa ficar no nosso território.'};
  if (cell === p.capCell) return {ok:false, why:'Esta já é a capital.'};
  const cost = capitalCost(); if (p.treasury < cost) return {ok:false, why:`Tesouro insuficiente (${fmtMoney(cost)}).`};
  p.treasury -= cost; G.stats.capitalMoves = (G.stats.capitalMoves||0) + 1;
  const old = p.capital, oldCell = p.capCell;
  if (!p.cityCells.includes(oldCell)){ p.cityCells.push(oldCell); p.cityNames.push(old); }
  const info = cityInfo(cell);
  p.capCell = G.nations[1].cap = cell; p.capital = info.name;
  p.capLat = cellCenter(cell)[1]; p.realClimate = realClimateAt(p.capLat);
  p.stability -= 4; addTemp({admin:-0.03}, 12, 'Mudança da capital');
  addLog(`🏛️ A capital foi transferida de ${old} para ${p.capital}.`, 'good'); addNews(`${p.name} transfere sua capital para ${p.capital}.`);
  derive();
  return {ok:true, msg:`Nova capital: ${p.capital}!`};
}
