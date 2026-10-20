// ============================================================
//  IMPERIUM — Operações secretas contra instalações descobertas
//  Sabotar bases, usinas, água, indústria e portos inimigos.
//  Nem sempre dá certo: depende da estratégia, da tecnologia,
//  do regime do alvo e de quanto ele já está em alerta.
// ============================================================
'use strict';

const SAB_METHODS = {
  agentes:{n:'Agentes infiltrados', icon:'🕵️', months:[2,3], base:0.35, detect:0.7, power:1.0, cost:0.004, d:'Espiões entram disfarçados e danificam a instalação por dentro. Discreto, mas demorado.'},
  explosivos:{n:'Comando de explosivos', icon:'💣', months:[1,2], base:0.42, detect:0.9, power:1.3, cost:0.006, tech:'dinamite', d:'Forças especiais explodem o alvo. Efeito forte, mas se falhar quase sempre são descobertas.'},
  ciber:{n:'Ataque cibernético', icon:'💻', months:[1,1], base:0.36, detect:0.25, power:0.7, cost:0.005, tech:'internet', d:'Hackers derrubam os sistemas. Raramente é descoberto, mas o dano dura menos.'},
  aereo:{n:'Bombardeio aéreo', icon:'✈️', months:[0,0], base:0.5, detect:1, power:1.2, cost:0, war:true, needs:'aviao', d:'Só em guerra. Aviões atacam o alvo agora; alguns podem ser abatidos.'},
  missil:{n:'Míssil de precisão', icon:'🚀', months:[0,0], base:0.7, detect:1, power:1.4, cost:0, war:true, needs:'missil', d:'Só em guerra. Gasta 1 míssil; defesas antimíssil atrapalham.'}
};
// o que acontece com a nação quando cada tipo de instalação é atingido (k = força do golpe)
const SAB_FX = {
  base:{t:'exército', f:(n,k)=>{ n.power *= 1 - 0.15*k; }},
  usina:{t:'economia', f:(n,k)=>{ n.pc *= 1 - 0.04*k; }},
  hidreletrica:{t:'economia', f:(n,k)=>{ n.pc *= 1 - 0.05*k; }},
  agua:{t:'população', f:(n,k)=>{ n.pop *= 1 - 0.015*k; n.pc *= 1 - 0.01*k; }},
  industria:{t:'economia e exército', f:(n,k)=>{ n.pc *= 1 - 0.05*k; n.power *= 1 - 0.04*k; }},
  porto:{t:'marinha', f:(n,k)=>{ n.navy *= 1 - 0.3*k; }}
};

function sabAvailable(key, n){
  const M = SAB_METHODS[key], p = G.p;
  if (M.tech && !p.techs.includes(M.tech)) return `Requer ${TECH[M.tech] ? TECH[M.tech].n : M.tech}`;
  if (M.war && !n.atWar) return 'Só durante uma guerra';
  if (M.needs && !(p.units[M.needs] > 0)) return M.needs === 'missil' ? 'Sem mísseis' : 'Sem aviões';
  if (M.cost && p.treasury < sabCost(key)) return 'Tesouro insuficiente';
  return null;
}
const sabCost = key => Math.round(SAB_METHODS[key].cost * G.p.gdp + 20*G.costScale);
function sabChance(key, n, site){
  const M = SAB_METHODS[key], p = G.p, t = p.techs;
  let c = M.base;
  c += (t.includes('criptografia') ? 0.08 : 0) + (t.includes('satelite_espiao') ? 0.08 : 0) + (t.includes('computacao') && key === 'ciber' ? 0.08 : 0) + (t.includes('ia') && key === 'ciber' ? 0.1 : 0);
  c -= Math.max(0, (n.tech||0) - t.length) * 0.02;                        // alvo mais avançado se defende melhor
  if (['ditadura','comunismo'].includes(n.gov)) c -= 0.1;                  // regimes fechados vigiam mais
  if (site.capital) c -= 0.2;
  c -= Math.min(0.3, (n.alert||0) * 0.08);                                 // alvo em alerta depois de outras tentativas
  if (key === 'aereo') c += clamp(((p.units.aviao||0) * 3 / Math.max(1, n.power*0.05)) - 1, -0.3, 0.12);
  if (key === 'missil' && (n.tech||0) >= techCountAt(1990)) c -= 0.15;     // escudo antimíssil
  return clamp(c, 0.05, 0.92);
}

// ------------------------------------------------------------
//  Tela de operações contra uma instalação
// ------------------------------------------------------------
function openSabotageModal(nid, cell){
  const n = G.nations[nid], site = (n.sites||[]).find(s => s.c === cell && s.known); if (!n || !site) return;
  const S = SITES[site.t], down = site.down > G.turn;
  const m = openModal(`<div class="m-icon">🎯</div><div class="m-title">Operação contra ${esc(n.name)}</div>
    <div class="m-date">${S.icon} ${site.capital ? 'Capital e quartel-general' : S.n} · se der certo: ${SAB_FX[site.t] ? SAB_FX[site.t].t : ''} do alvo enfraquece</div>
    ${down ? `<div class="tip">⚠️ Esta instalação já está fora do ar por mais ${site.down - G.turn} mês(es).</div>` : ''}
    ${(n.alert||0) > 0 ? `<div class="tip">🚨 ${esc(n.name)} está em alerta (${n.alert} tentativa(s) recente(s)): fica mais difícil.</div>` : ''}
    <div class="sab-list">${Object.entries(SAB_METHODS).map(([k, M]) => { const no = sabAvailable(k, n), ch = sabChance(k, n, site);
      return `<div class="sab ${no ? 'off' : ''}"><div class="si">${M.icon}</div><div style="flex:1"><b>${M.n}</b><small>${M.d}</small>
        <small>${no ? '🔒 ' + no : `Chance: <b>${Math.round(ch*100)}%</b> · ${M.months[1] ? `${M.months[0]}–${M.months[1]} meses` : 'imediato'} · ${M.cost ? 'custo ' + fmtMoney(sabCost(k)) : 'sem custo em dinheiro'} · risco de ser descoberto: ${Math.round(M.detect*100)}% se falhar`}</small></div>
        <button class="btn sm ${no ? '' : 'primary'}" data-sab="${k}" ${no ? 'disabled' : ''}>Executar</button></div>`; }).join('')}</div>
    <div class="m-actions"><button class="btn" id="sab-x">Fechar</button></div>`, {wide:true});
  m.querySelector('#sab-x').onclick = () => { SFX.click(); closeModal(); };
  m.querySelectorAll('[data-sab]').forEach(b => b.onclick = () => { const r = startSabotage(b.dataset.sab, nid, cell); closeModal(); if (r.ok){ SFX.page(); toast(r.msg, 'dip'); } else { SFX.error(); toast(r.why, 'bad'); } refreshAll(); saveGame(); });
}
function startSabotage(key, nid, cell){
  const n = G.nations[nid], site = (n.sites||[]).find(s => s.c === cell), M = SAB_METHODS[key], p = G.p;
  if (!site) return {ok:false, why:'Instalação não encontrada.'};
  const no = sabAvailable(key, n); if (no) return {ok:false, why:no};
  if (M.cost) p.treasury -= sabCost(key);
  const chanceNow = sabChance(key, n, site);
  n.alert = (n.alert||0) + 1; n.alertUntil = G.turn + 12;
  if (!M.months[1]){                                                          // ataques imediatos (em guerra)
    if (key === 'missil'){ p.units.missil--; const [x,y] = cellXY(cell); MapView.addAnim({type:'missile', from:cellXY(p.capCell), to:[x,y], dur:1300, sound:true}); }
    if (key === 'aereo'){ const [x,y] = cellXY(cell), ab = nearestAirbase(cell), o = ab >= 0 ? cellXY(ab) : cellXY(p.capCell); for (let k=0;k<3;k++) setTimeout(()=>MapView.addAnim({type:'plane', from:o, to:[x+rand(-4,4), y+rand(-4,4)], dur:1500}), k*150); }
    setTimeout(()=>{ resolveSabotage({key, nid, cell, chance:chanceNow}); refreshAll(); }, 1400);
    return {ok:true, msg:`${M.icon} ${M.n} a caminho de ${SITES[site.t].n} em ${n.name}...`};
  }
  p.ops = p.ops || [];
  p.ops.push({key, nid, cell, chance:chanceNow, due:G.turn + randInt(M.months[0], M.months[1])});
  addLog(`${M.icon} Operação "${M.n}" iniciada contra ${SITES[site.t].n} de ${n.name}.`, 'info');
  return {ok:true, msg:`${M.icon} Operação iniciada. Resultado em até ${M.months[1]} mês(es).`};
}
function resolveSabotage(op){
  const n = G.nations[op.nid], M = SAB_METHODS[op.key], p = G.p; if (!n || !n.alive) return;
  const site = (n.sites||[]).find(s => s.c === op.cell);
  if (!site || Grid.owner[op.cell] !== op.nid){ addLog(`A operação contra ${n.name} foi cancelada: o alvo não existe mais.`, 'info'); return; }
  const S = SITES[site.t], [x, y] = cellXY(op.cell);
  if (chance(op.chance)){
    const k = M.power * (site.capital ? 0.7 : 1);
    if (SAB_FX[site.t]) SAB_FX[site.t].f(n, k);
    site.down = Math.max(site.down||0, G.turn) + Math.round(12 * k);
    G.stats.sabotages = (G.stats.sabotages||0) + 1;
    MapView.boom(x, y); MapView.floatText(x, y, '💥 SABOTADO', '#8b1a1a'); SFX.explosion && SFX.explosion(0);
    const caught = chance(M.detect * 0.3) && op.key !== 'ciber';
    addLog(`💥 Sucesso! ${M.icon} ${M.n} atingiu ${S.n} de ${n.name}: ${SAB_FX[site.t] ? SAB_FX[site.t].t : ''} enfraquecido(a) por ${Math.round(12*k)} meses.${caught ? ' Mas eles descobriram quem foi.' : ''}`, 'good');
    toast(`💥 ${S.icon} ${S.n} de ${esc(n.name)} foi sabotado(a)!`, 'good');
    if (caught && !n.atWar) changeRel(n, -12);
  } else {
    const caught = chance(M.detect);
    if (op.key === 'aereo' && (p.units.aviao||0) > 0){ const lost = Math.max(1, Math.round(p.units.aviao * rand(0.03, 0.08))); p.units.aviao -= lost; addLog(`✈️ ${lost} avião(ões) abatido(s) sobre ${n.name}.`, 'bad'); }
    if (caught){
      if (!n.atWar){
        changeRel(n, -20);
        addLog(`🚨 Nossa operação contra ${n.name} falhou e foi descoberta! Escândalo internacional (−20 de relação).`, 'bad');
        if ((n.ag||0) >= 0.5 && n.power > G.p.def * 0.7 && chance(0.25)){ declareWar(n.id, true); if (typeof onWarDeclared === 'function') onWarDeclared(n); }
      } else addLog(`🚨 A operação contra ${n.name} falhou: o alvo estava protegido.`, 'bad');
      toast(`🚨 Operação descoberta por ${esc(n.name)}!`, 'bad');
    } else { addLog(`🤫 A operação contra ${n.name} falhou, mas ninguém descobriu quem foi.`, 'info'); toast('A operação falhou, mas não fomos descobertos.'); }
  }
}
// operações em andamento: resolvem no mês marcado; o alerta do alvo vai baixando
const _endTurnSab = endTurn;
endTurn = function(){
  _endTurnSab.apply(this, arguments);
  if (!G || !G.p) return;
  const p = G.p; p.ops = p.ops || [];
  const due = p.ops.filter(o => G.turn >= o.due); p.ops = p.ops.filter(o => G.turn < o.due);
  for (const o of due) resolveSabotage(o);
  for (const n of G.nations) if (n && n.alert && G.turn > (n.alertUntil||0)) n.alert = Math.max(0, n.alert - 1);
};

// botões nos painéis do mapa
document.addEventListener('click', e => {
  const b = e.target.closest('[data-sabsite]'); if (!b || !G) return;
  const [nid, cell] = b.dataset.sabsite.split(':').map(Number); closePopover(); SFX.page(); openSabotageModal(nid, cell);
});

// lista dos alvos conhecidos de uma nação (aberta pela janela da nação)
function openOpsList(nid){
  const n = G.nations[nid], list = (n.sites||[]).filter(s => s.known && Grid.owner[s.c] === nid);
  const m = openModal(`<div class="m-icon">🎯</div><div class="m-title">Operações secretas — ${esc(n.name)}</div>
    <div class="m-date">Instalações que nossos espiões já localizaram${(n.alert||0) ? ` · 🚨 alvo em alerta (${n.alert})` : ''}</div>
    <div class="sab-list">${list.map(s => `<div class="sab"><div class="si">${SITES[s.t].icon}</div><div style="flex:1"><b>${s.capital ? 'Capital e quartel-general' : SITES[s.t].n}</b><small>${SAB_FX[s.t] ? 'Atingir enfraquece: ' + SAB_FX[s.t].t : ''}${s.down > G.turn ? ` · <span class="down">fora do ar por ${s.down - G.turn} mês(es)</span>` : ''}</small></div>
      <button class="btn sm" data-fly="${s.c}">🎯 Ver</button><button class="btn sm primary" data-op="${s.c}">Planejar</button></div>`).join('') || '<div class="muted">Nenhuma instalação conhecida. Use a espionagem para descobrir.</div>'}</div>
    <div class="m-actions"><button class="btn" id="ol-x">Fechar</button></div>`, {wide:true});
  m.querySelector('#ol-x').onclick = () => { SFX.click(); closeModal(); };
  m.querySelectorAll('[data-op]').forEach(b => b.onclick = () => { closeModal(); openSabotageModal(nid, +b.dataset.op); });
  m.querySelectorAll('[data-fly]').forEach(b => b.onclick = () => { closeModal(); const [lo, la] = cellCenter(+b.dataset.fly); MapView.flyTo(lo, la, 3); });
}
