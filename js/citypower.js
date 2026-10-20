// ============================================================
//  IMPERIUM — Cidades e estados reais valem no jogo
//  • Atacar uma cidade grande é mais difícil (defesa urbana)
//  • Conquistar uma cidade a coloca na sua lista (e rende saque)
//  • Tomar um estado inteiro o anexa; perder um estado o remove
//  • Obras em cidades grandes rendem mais
//  • Exércitos parados numa cidade defendem melhor
// ============================================================
'use strict';

// ---------------- Cidade mais importante de cada célula (na época atual) ----------------
const CITYPOWER = {year:null, at:null, cellState:null, stateCells:null};
function cityAt(cell){
  if (!G || cell < 0) return null;
  const y = curYear();
  if (CITYPOWER.year !== y){
    CITYPOWER.year = y; CITYPOWER.at = new Map();
    for (const c of geoCitiesFor(y)){ const o = CITYPOWER.at.get(c.cell); if (!o || c.pop > o.pop) CITYPOWER.at.set(c.cell, c); }
  }
  return CITYPOWER.at.get(cell) || null;
}
const cityImportance = c => c ? Math.log10((c.pop || 0) + 1) : 0;            // 0 (vila) … 4,5 (megacidade)
function cityDefMult(cell){
  const c = cityAt(cell); if (!c) return 1;
  return 1 + Math.min(0.45, cityImportance(c) * 0.08) + ((c.cap & 1) ? 0.15 : 0) + ((c.cap & 2) ? 0.05 : 0);
}
function cityBuildMult(cell){
  const c = cityAt(cell); if (!c) return 1;
  return c.pop >= 1000 ? 1.35 : c.pop >= 200 ? 1.2 : c.pop >= 50 ? 1.1 : 1;
}

// ---------------- Estado de cada célula ----------------
function cellStates(){
  if (CITYPOWER.cellState) return CITYPOWER.cellState;
  const S = typeof geoStatesReady === 'function' ? geoStatesReady() : null; if (!S) return null;
  const cs = new Int16Array(NCELLS).fill(-1), cnt = new Int32Array(S.length);
  const ctx = document.createElement('canvas').getContext('2d');
  S.forEach((s, si) => {
    const [x0, y0, x1, y1] = s.box;
    for (let cy = Math.max(0, Math.floor(y0/DEG)); cy <= Math.min(CH-1, Math.floor(y1/DEG)); cy++)
      for (let cx = Math.max(0, Math.floor(x0/DEG)); cx <= Math.min(CW-1, Math.floor(x1/DEG)); cx++){
        const i = cy*CW + cx; if (!Grid.land[i] || cs[i] >= 0) continue;
        const [x, y] = cellXY(i); if (ctx.isPointInPath(s.path, x, y)){ cs[i] = si; cnt[si]++; }
      }
  });
  CITYPOWER.cellState = cs; CITYPOWER.stateCells = cnt;
  return cs;
}
const stateName = si => (geoStatesReady() || [])[si] ? geoStatesReady()[si].name : '';

// ---------------- Ataques ----------------
const _planAttackCity = planAttack;
planAttack = function(cell, commit, corpsId){
  const r = _planAttackCity(cell, commit, corpsId);
  if (r && r.ok){
    const c = cityAt(cell), mult = cityDefMult(cell);
    if (mult > 1){ r.def *= mult; r.city = c; r.cityMult = mult; if (typeof planOutcomes === 'function') planOutcomes(r); else r.odds = battleOdds(r.force, r.def); }
    const cs = cellStates(); if (cs && cs[cell] >= 0) r.state = stateName(cs[cell]);
  }
  return r;
};
// defesa das nossas cidades quando a IA ataca
const _localDefenseCity = localDefense;
localDefense = function(cell){ return _localDefenseCity(cell) * cityDefMult(cell); };
// exércitos parados numa cidade defendem melhor
const _corpsPowerCity = corpsPower;
corpsPower = function(c, kind){ const v = _corpsPowerCity(c, kind); return kind === 'def' && c && c.cell >= 0 ? v * (1 + (cityDefMult(c.cell) - 1) * 0.5) : v; };

// ---------------- Conquista e perda de cidades e estados ----------------
const _transferCellsCity = transferCells;
transferCells = function(cells, from, to){
  _transferCellsCity(cells, from, to);
  if (!G || !G.p || !cells || !cells.length || (to !== 1 && from !== 1)) return;
  const p = G.p; p.cityPos = p.cityPos || {};
  for (const cell of cells){
    const c = cityAt(cell); if (!c || c.pop < 20) continue;
    if (to === 1 && !p.cityCells.includes(cell)){
      p.cityCells.push(cell); p.cityNames.push(c.name); p.cityPos[cell] = [unproj(c.x, c.y)[0], unproj(c.x, c.y)[1]]; p.cities++;
      const loot = p.gdp * 0.0015 * cityImportance(c);
      p.treasury += loot; G.stats.citiesTaken = (G.stats.citiesTaken||0) + 1;
      addLog(`🏙️ Tomamos a cidade de ${c.name}${(c.cap & 1) ? ' (capital!)' : ''}. Saque de ${fmtMoney(loot)}.`, 'good');
      if (typeof MapView !== 'undefined' && MapView.floatText){ MapView.floatText(c.x, c.y, '🏙️ ' + c.name, '#2d5a19'); }
    } else if (from === 1 && cell !== p.capCell){
      const k = p.cityCells.indexOf(cell);
      if (k >= 0){ const nm = p.cityNames[k]; p.cityCells.splice(k, 1); p.cityNames.splice(k, 1); delete p.cityPos[cell]; p.cities = Math.max(1, p.cities - 1); addLog(`🏚️ Perdemos a cidade de ${nm}.`, 'bad'); }
    }
  }
  // estados inteiros
  const cs = cellStates(); if (!cs) return;
  const touched = new Set(); for (const c of cells) if (cs[c] >= 0) touched.add(cs[c]);
  const S = geoStatesReady(); p.annexedStates = p.annexedStates || [];
  for (const si of touched){
    const st = S[si]; if (!st || !st.name) continue;
    let mine = 0; for (let i = 0; i < NCELLS; i++) if (cs[i] === si && Grid.owner[i] === 1) mine++;
    const total = CITYPOWER.stateCells[si];
    if (to === 1 && mine === total && !p.stateNames.includes(st.name)){
      p.stateNames.push(st.name); p.annexedStates.push(st.name); p.states++; p.stability = Math.min(100, p.stability + 1);
      addLog(`🗺️ O estado de ${st.name} agora é inteiramente nosso e foi anexado.`, 'good');
    }
    if (from === 1 && mine === 0 && p.stateNames.includes(st.name) && p.states > 1){
      p.stateNames = p.stateNames.filter(n => n !== st.name); p.states--; p.stability = Math.max(0, p.stability - 3);
      addLog(`⚠️ Perdemos todo o estado de ${st.name}.`, 'bad');
    }
  }
};

// ---------------- Obras: mais rendimento em cidades grandes ----------------
function cityBuildNote(cell){
  const c = cityAt(cell), m = cityBuildMult(cell);
  return c && m > 1 ? `🏙️ Em ${esc(c.name)}: +${Math.round((m - 1) * 100)}% de efeito` : '';
}
