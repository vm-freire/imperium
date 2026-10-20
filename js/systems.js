// ============================================================
//  IMPERIUM — Sistemas: gostos das nações, acordos comerciais,
//  negociações demoradas, constituição, reformas de regime
// ============================================================
'use strict';

function govFam(g){ return GOVS[g] ? GOVS[g].family : 'aut'; }
function hasConstitution(gov){ return govFam(gov) === 'dem' || gov === 'monarquia_const'; }
function randInt(a, b){ return a + Math.floor(Math.random()*(b-a+1)); }

// ------------------------------------------------------------
//  Gostos e desgostos das nações
// ------------------------------------------------------------
const PREFS = {
  comercio:{n:'Comércio aberto', icon:'⚓', v:8, test:n=>dealCount(n)>0, hint:'Ter acordos comerciais com eles'},
  democracia:{n:'Democracias', icon:'🗳️', v:10, test:()=>govFam(G.p.gov)==='dem', hint:'Ser uma democracia'},
  autoritarismo:{n:'Governos fortes', icon:'🦅', v:8, test:()=>['aut','com'].includes(govFam(G.p.gov)) || ['monarquia_abs','imperio'].includes(G.p.gov), hint:'Ter um governo autoritário'},
  fe:{n:'Mesma fé', icon:'🙏', v:10, test:n=>relFam(n.relig)===relFam(G.p.religion), hint:'Compartilhar a mesma família religiosa'},
  paz:{n:'Nações pacíficas', icon:'🕊️', v:8, test:()=>G.wars.length===0 && G.stats.cellsConquered<10, hint:'Não estar em guerra nem conquistar terras'},
  forca:{n:'Força militar', icon:'⚔️', v:8, test:n=>G.p.atk>=n.power, hint:'Ter exército maior que o deles'},
  ciencia:{n:'Ciência', icon:'🔬', v:6, test:n=>G.p.techs.length>=n.tech, hint:'Estar à frente deles em tecnologia'},
  riqueza:{n:'Prosperidade', icon:'💰', v:6, test:n=>G.p.gdpPc>=n.pc, hint:'Ter PIB per capita maior que o deles'}
};
const DISLIKES = {
  expansao:{n:'Expansionismo', icon:'🗺️', v:-12, test:()=>G.stats.cellsConquered>=10 || G.stats.annexed>0, hint:'Conquistar territórios'},
  comunismo:{n:'Comunismo', icon:'☭', v:-15, test:()=>govFam(G.p.gov)==='com', hint:'Ser um Estado comunista'},
  democracia_d:{n:'Democracias', icon:'🗳️', v:-10, test:()=>govFam(G.p.gov)==='dem', hint:'Ser uma democracia'},
  monarquia:{n:'Monarquias', icon:'👑', v:-8, test:()=>govFam(G.p.gov)==='mon', hint:'Ser uma monarquia'},
  fe_diferente:{n:'Outras religiões', icon:'⛪', v:-10, test:n=>relFam(n.relig)!==relFam(G.p.religion), hint:'Ter religião de outra família'},
  militarismo:{n:'Militarismo', icon:'🎖️', v:-8, test:n=>G.p.atk>n.power*1.5 || !!G.p.policies.conscricao, hint:'Exército muito grande ou conscrição'},
  nuclear:{n:'Armas nucleares', icon:'☢️', v:-12, test:()=>(G.p.units.nuke||0)>0, hint:'Possuir ogivas nucleares'}
};
function prefScore(n){
  let s = 0;
  for (const k of (n.likes||[])) if (PREFS[k] && PREFS[k].test(n)) s += PREFS[k].v;
  for (const k of (n.dislikes||[])) if (DISLIKES[k] && DISLIKES[k].test(n)) s += DISLIKES[k].v;
  return s;
}

// ------------------------------------------------------------
//  Relações entre nações da IA (para mostrar ao jogador)
// ------------------------------------------------------------
function aiAtWarWith(a, b){ return G.aiWars.some(w=>(w.a===a&&w.b===b)||(w.a===b&&w.b===a)); }
function aiRelation(a, b){
  const A = G.nations[a], B = G.nations[b];
  if (aiAtWarWith(a, b)) return -90;
  let r = 0;
  if (A.bloc && A.bloc === B.bloc) r += 35; else if (A.bloc && B.bloc) r -= 30;
  if (A.relig === B.relig) r += 12; else if (relFam(A.relig) === relFam(B.relig)) r += 6; else r -= 4;
  const f1 = govFam(A.gov), f2 = govFam(B.gov);
  if (A.gov === B.gov) r += 15; else if (f1 === f2) r += 8; else if ((f1==='dem' && (f2==='com'||f2==='aut')) || (f2==='dem' && (f1==='com'||f1==='aut'))) r -= 12;
  if (adjacent(a, b)) r -= 6;
  r += ((a*7 + b*13) % 11) - 5;  // rivalidades históricas aleatórias, mas estáveis
  return clamp(r, -100, 100);
}
function aiForeignView(id){
  const out = [];
  for (let k=2;k<G.nations.length;k++){ if (k===id || !G.nations[k].alive) continue; out.push({id:k, rel:aiRelation(id,k), war:aiAtWarWith(id,k)}); }
  out.sort((a,b)=>b.rel-a.rel);
  return out;
}
function exportsOf(n){ const y = curYear(); return (n.exp||[]).map(e=>e.split('@')).filter(x=>!x[1] || +x[1] <= y).map(x=>x[0]); }
function importsOf(n){ return Object.keys(RESOURCES).filter(r=>!(n.res||[]).includes(r)).slice(0, 4); }

// ------------------------------------------------------------
//  Acordos comerciais
// ------------------------------------------------------------
const DEALS = {
  tarifas:{n:'Redução de Tarifas', icon:'📉', minRel:5, months:[2,4], years:10, inc:0.004, fx:{growth:0.1}, d:'Corta impostos de importação dos dois lados. Renda comercial modesta e +0,1% de crescimento.'},
  commodities:{n:'Acordo de Commodities', icon:'📦', minRel:10, months:[3,5], years:8, inc:0.005, d:'Exportamos nossos recursos naturais para eles. Rende mais se eles não produzem o mesmo.',
    req:()=>G.p.resources.length ? null : 'Não temos recursos naturais para exportar.', bonus:n=>G.p.resources.filter(r=>!(n.res||[]).includes(r)).length*0.002},
  energia:{n:'Acordo Energético', icon:'🛢️', minRel:15, months:[3,6], years:12, inc:0.001, fx:{gdpMult:0.02}, d:'Fornecimento garantido de petróleo e energia: +2% PIB.',
    req:n=>((n.res||[]).includes('petroleo') || G.p.resources.includes('petroleo')) ? null : 'Nenhum dos dois países produz petróleo.'},
  turismo:{n:'Turismo e Livre Circulação', icon:'🧳', minRel:20, months:[2,4], years:10, inc:0.001, fx:{approval:1, gdpMult:0.01}, d:'Vistos facilitados e intercâmbio cultural: +1 apoio, +1% PIB.'},
  tecnologia:{n:'Parceria Científica', icon:'🔬', minRel:25, months:[4,7], years:10, inc:-0.0005, fx:{research:0.05}, d:'Universidades cooperam: +5% pesquisa (até +15% se eles forem mais avançados). Tem custo.'},
  armas:{n:'Cooperação Militar', icon:'🛡️', minRel:35, months:[4,7], years:10, inc:0, fx:{unitCost:-0.08}, d:'Compras conjuntas de armamentos: unidades 8% mais baratas.'},
  livre_comercio:{n:'Tratado de Livre Comércio', icon:'🤝', minRel:35, months:[6,10], years:15, inc:0.012, fx:{growth:0.3, unemployment:0.3}, needs:'tarifas', d:'Integração econômica total: grande renda e crescimento, mas mais desemprego. Exige Redução de Tarifas.'}
};
function dealCount(n){ return Object.keys(n.deals||{}).length; }
function syncTrade(n){ n.trade = dealCount(n) > 0; }
function dealIncome(n, type){
  const D = DEALS[type], p = G.p;
  let f = D.inc + (D.bonus ? D.bonus(n) : 0);
  return Math.sqrt(Math.max(1, p.gdp) * Math.max(1, n.pop*n.pc)) * f / 12 * (n.alliance ? 1.4 : 1) * (n.human && typeof regimeFriction === 'function' ? regimeFriction(n) : 1);
}
function dealChance(n, type){
  const D = DEALS[type];
  let c = 0.35 + (n.rel - D.minRel)/80 + (n.alliance?0.2:0) + (govFam(n.gov)===govFam(G.p.gov)?0.1:0) + ((n.likes||[]).includes('comercio') ? 0.15 : 0) + (G.p.policies.livre_comercio ? 0.05 : 0) - (G.p.policies.protecionismo ? 0.1 : 0);
  if (type === 'tecnologia' && G.p.techs.length < n.tech - 4) c -= 0.15;
  if (type === 'armas' && !(n.alliance || n.pact)) c -= 0.15;
  return clamp(c, 0.05, 0.95);
}
function dealBlocked(n, type){
  const D = DEALS[type];
  if (n.atWar) return 'Estamos em guerra com eles.';
  if (n.embargo > G.turn) return 'Há um embargo em vigor.';
  if ((n.deals||{})[type]) return 'Acordo já em vigor.';
  if (G.negs.some(x=>x.n===n.id && x.kind==='deal' && x.type===type)) return 'Negociação já em andamento.';
  if (n.rel < D.minRel) return `Relações insuficientes (mínimo ${D.minRel}).`;
  if (D.needs && !(n.deals||{})[D.needs]) return `Exige antes: ${DEALS[D.needs].n}.`;
  if (D.req){ const r = D.req(n); if (r) return r; }
  return null;
}
// efeitos somados de todos os acordos, com teto (retornos decrescentes)
const DEAL_CAPS = {growth:0.6, gdpMult:0.06, research:0.15, approval:3, unitCost:-0.15, unemployment:1.5};
function dealsMods(m){
  const t0 = blankMods();
  for (let k=2;k<G.nations.length;k++){
    const n = G.nations[k]; if (!n.alive || n.atWar || !n.deals) continue;
    for (const t in n.deals){
      addMods(t0, DEALS[t].fx);
      if (t === 'tecnologia') t0.research += clamp((n.tech - G.p.techs.length)*0.02, 0, 0.1);
    }
  }
  for (const k in DEAL_CAPS){ const cap = DEAL_CAPS[k]; t0[k] = cap < 0 ? Math.max(cap, t0[k]) : Math.min(cap, t0[k]); }
  addMods(m, t0);
}

// ------------------------------------------------------------
//  Negociações (levam meses)
// ------------------------------------------------------------
const NEG_INFO = {
  deal:{months:null}, pact:{months:[2,4], n:'Pacto de não-agressão', icon:'📜'}, alliance:{months:[4,8], n:'Aliança militar', icon:'🤝'},
  tribute:{months:[1,2], n:'Exigência de tributo', icon:'👑'}, peace:{months:[1,2], n:'Tratado de paz', icon:'🕊️'}, spy:{months:[2,4], n:'Missão de espionagem', icon:'🕵️'}
};
function negName(x){ return x.kind === 'deal' ? DEALS[x.type].n : NEG_INFO[x.kind].n; }
function negIcon(x){ return x.kind === 'deal' ? DEALS[x.type].icon : NEG_INFO[x.kind].icon; }
function startNegotiation(kind, n, opts){
  opts = opts || {};
  if (G.negs.some(x=>x.n===n.id && x.kind===kind && x.type===opts.type)) return {ok:false, why:'Já existe uma negociação igual em andamento.'};
  const range = kind === 'deal' ? DEALS[opts.type].months : NEG_INFO[kind].months;
  const months = randInt(range[0], range[1]);
  const neg = Object.assign({kind, n:n.id, start:G.turn, due:G.turn + months}, opts);
  G.negs.push(neg);
  const what = negName(neg);
  addLog(`✉️ Diplomatas partiram para ${n.name}: ${what}. Resposta esperada em ~${months} ${months>1?'meses':'mês'}.`, 'dip');
  return {ok:true, msg:`Negociação iniciada com ${n.name}: ${what}. Resposta em cerca de ${months} ${months>1?'meses':'mês'}.`};
}
function processNegotiations(){
  const done = G.negs.filter(x=>G.turn >= x.due);
  G.negs = G.negs.filter(x=>G.turn < x.due);
  for (const x of done){
    const n = G.nations[x.n]; if (!n || !n.alive) continue;
    let ok = false, msg = '';
    if (x.kind === 'deal'){
      const bl = dealBlocked(n, x.type);
      if (!bl && chance(dealChance(n, x.type))){ n.deals = n.deals || {}; n.deals[x.type] = {since:G.turn, until:G.turn + DEALS[x.type].years*12}; syncTrade(n); changeRel(n, 4); ok = true; msg = `${DEALS[x.type].icon} ${n.name} assinou o acordo: ${DEALS[x.type].n} (válido por ${DEALS[x.type].years} anos).`; }
      else { changeRel(n, -2); msg = `${n.name} rejeitou a proposta de ${DEALS[x.type].n}${bl?' ('+bl+')':''}.`; }
    } else if (x.kind === 'pact'){
      if (!n.atWar && n.rel >= 5 && chance(0.45 + n.rel/120)){ n.pact = true; changeRel(n, 5); ok = true; msg = `📜 Pacto de não-agressão firmado com ${n.name}.`; }
      else { changeRel(n,-2); msg = `${n.name} recusou o pacto de não-agressão.`; }
    } else if (x.kind === 'alliance'){
      if (!n.atWar && n.rel >= 45 && chance(0.3 + (n.rel-45)/80 + (govFam(n.gov)===govFam(G.p.gov)?0.25:0))){ n.alliance = true; n.pact = true; changeRel(n, 10); ok = true; msg = `🤝 Aliança militar formada com ${n.name}!`; }
      else { changeRel(n,-4); msg = `${n.name} não quis se comprometer com uma aliança.`; }
    } else if (x.kind === 'tribute'){
      const r = DIPLO.tribute(n); ok = r.ok; msg = r.ok ? r.msg : r.why;
    } else if (x.kind === 'peace'){
      if (!getWar(x.n)){ continue; }
      if (chance(peaceChance(x.n, x.terms))){ makePeace(x.n, x.terms); ok = true; msg = `🕊️ ${n.name} aceitou nossa proposta de paz.`; }
      else { changeRel(n,-2); const w = getWar(x.n); if (w) w.score -= 1; msg = `${n.name} rejeitou nossa proposta de paz. A guerra continua.`; }
    } else if (x.kind === 'spy'){
      const r = DIPLO.spy(n, true); ok = r.ok; msg = r.ok ? r.msg : r.why;
    }
    addLog(msg, ok ? 'dip' : 'bad');
    if (typeof onNegotiation === 'function') onNegotiation(msg, ok);
  }
  // expiração de acordos
  for (let k=2;k<G.nations.length;k++){
    const n = G.nations[k]; if (!n.deals) continue;
    for (const t in n.deals){
      if (G.turn >= n.deals[t].until){ delete n.deals[t]; syncTrade(n); addLog(`⌛ O acordo "${DEALS[t].n}" com ${n.name} expirou. Negocie novamente para renová-lo.`, 'dip'); }
    }
  }
}
function cancelDeal(n, type){ if (n.deals && n.deals[type]){ delete n.deals[type]; syncTrade(n); changeRel(n, -8); return true; } return false; }

// ------------------------------------------------------------
//  Constituição
// ------------------------------------------------------------
const CONSTITUTION = {
  mandato:{n:'Mandato do chefe de governo', elections:true, def:'4', opts:{'4':{n:'4 anos'}, '5':{n:'5 anos'}, '6':{n:'6 anos', fx:{stability:2, approval:-1}}}},
  reeleicao:{n:'Reeleição', elections:true, def:'uma', opts:{livre:{n:'Ilimitada', fx:{corruption:0.02}}, uma:{n:'Apenas uma reeleição'}, nenhuma:{n:'Proibida', fx:{corruption:-0.02, stability:-1}}}},
  legislativo:{n:'Poder Legislativo', def:'bicameral', opts:{unicameral:{n:'Unicameral (reformas mais rápidas)', fx:{growth:0.1}}, bicameral:{n:'Bicameral — Senado e Câmara', fx:{stability:3}}}},
  imprensa:{n:'Liberdade de imprensa', def:'plena', opts:{plena:{n:'Plena (proíbe censura)', fx:{approval:3, research:0.05, corruption:-0.02}}, limitada:{n:'Limitada em crises', fx:{stability:2}}}},
  religiao:{n:'Estado e religião', def:'laico', opts:{laico:{n:'Separação total', fx:{research:0.03}}, oficial:{n:'Religião oficial do Estado', fx:{stability:2, research:-0.02}}}},
  voto:{n:'Voto', def:'obrigatorio', opts:{obrigatorio:{n:'Obrigatório', fx:{stability:2}}, facultativo:{n:'Facultativo', fx:{approval:1}}}},
  direitos:{n:'Direitos sociais', def:'garantidos', opts:{garantidos:{n:'Saúde e educação garantidas (mín. 3% do PIB cada)', fx:{approval:4}}, civis:{n:'Apenas direitos civis'}}},
  militares:{n:'Forças Armadas', def:'subordinadas', opts:{subordinadas:{n:'Subordinadas ao poder civil', fx:{military:-0.05, coup:-0.8}}, autonomas:{n:'Autônomas', fx:{military:0.05}}}},
  federalismo:{n:'Organização do Estado', def:'unitario', opts:{unitario:{n:'Unitário', fx:{taxEff:0.03}}, federal:{n:'Federal (estados autônomos)', fx:{admin:0.05, taxEff:-0.03}}}},
  emendas:{n:'Emendas constitucionais', def:'qualificada', opts:{simples:{n:'Maioria simples (55% de apoio)'}, qualificada:{n:'Maioria qualificada (65% de apoio)', fx:{stability:2}}}}
};
function defaultConstitution(){ const c = {}; for (const k in CONSTITUTION) c[k] = CONSTITUTION[k].def; return c; }
function constitutionMods(m){
  const p = G.p; if (!p.constitution || !hasConstitution(p.gov)) return;
  for (const k in p.constitution){ const A = CONSTITUTION[k]; if (!A) continue; if (A.elections && !GOVS[p.gov].elections) continue; const o = A.opts[p.constitution[k]]; if (o && o.fx) addMods(m, o.fx); }
  if (p.constitution.direitos === 'garantidos' && (p.spend.health < 3 || p.spend.edu < 3)) m.approval -= 7;
}
function constBlocks(policyId){
  const p = G.p; if (!p.constitution || !hasConstitution(p.gov)) return null;
  if (policyId === 'censura' && p.constitution.imprensa === 'plena') return 'A Constituição garante liberdade de imprensa plena.';
  if (policyId === 'policia_secreta') return 'Inconstitucional.';
  return null;
}
function electionInterval(){ const p = G.p; return 12 * (+((p.constitution||{}).mandato) || 4); }
function termLimitReached(){
  const p = G.p, r = (p.constitution||{}).reeleicao || 'uma';
  return r === 'nenhuma' ? p.terms >= 1 : r === 'uma' ? p.terms >= 2 : false;
}
function amendThreshold(){ return ((G.p.constitution||{}).emendas === 'simples') ? 55 : 65; }
function proposeAmendment(art, val){
  const p = G.p;
  if (p.amend) return {ok:false, why:'Já existe uma emenda em votação.'};
  if (p.constitution[art] === val) return {ok:false, why:'Este já é o texto atual.'};
  const months = p.constitution.legislativo === 'unicameral' ? randInt(2,4) : randInt(4,7);
  p.amend = {art, val, due:G.turn + months};
  addLog(`📜 Proposta de emenda enviada ao Congresso: ${CONSTITUTION[art].n} → ${CONSTITUTION[art].opts[val].n}. Votação em ~${months} meses.`, 'info');
  return {ok:true, msg:`Emenda em tramitação. Votação em cerca de ${months} meses (precisa de ${amendThreshold()}% de apoio).`};
}
function processAmendment(){
  const p = G.p; if (!p.amend || G.turn < p.amend.due) return;
  const a = p.amend; p.amend = null;
  const need = amendThreshold(), c = clamp(0.5 + (p.approval - need)/30, 0.05, 0.95);
  const A = CONSTITUTION[a.art];
  if (chance(c)){ G.stats.amendments = (G.stats.amendments||0) + 1; p.constitution[a.art] = a.val; if (a.art==='imprensa' && a.val==='plena') p.policies.censura = false; addLog(`📜 Emenda aprovada! ${A.n}: ${A.opts[a.val].n}.`, 'good'); if (typeof onNegotiation==='function') onNegotiation(`📜 Emenda constitucional aprovada: ${A.n}.`, true); }
  else { p.stability -= 2; addLog(`📜 O Congresso rejeitou a emenda sobre ${A.n}.`, 'bad'); if (typeof onNegotiation==='function') onNegotiation(`📜 Emenda rejeitada pelo Congresso.`, false); }
}

// ------------------------------------------------------------
//  Reformas de regime e de economia
// ------------------------------------------------------------
function startReform(kind, to){
  const p = G.p;
  if (p.reform) return {ok:false, why:'Já existe uma reforma em andamento.'};
  if (kind === 'gov' && to === p.gov) return {ok:false, why:'Este já é o regime atual.'};
  if (kind === 'econ' && to === p.econ) return {ok:false, why:'Este já é o sistema atual.'};
  const months = kind === 'gov' ? randInt(8, 14) : randInt(4, 8);
  const cost = p.gdp * (kind === 'gov' ? 0.02 : 0.01);
  if (p.treasury < cost) return {ok:false, why:`Tesouro insuficiente (${fmtMoney(cost)}).`};
  p.treasury -= cost;
  p.reform = {kind, to, due:G.turn + months, start:G.turn};
  p.stability -= kind === 'gov' ? 10 : 4;
  addTemp({stability:-4, growth:-0.5}, months, kind === 'gov' ? 'Transição de regime' : 'Reforma econômica');
  const name = kind === 'gov' ? GOVS[to].name : ECONS[to].name;
  addLog(`🏛️ Início da transição para: ${name}. Conclusão prevista em ${months} meses.`, 'info');
  return {ok:true, msg:`Reforma iniciada: ${name}. Levará cerca de ${months} meses.`};
}
function processReform(){
  const p = G.p; if (!p.reform || G.turn < p.reform.due) return;
  const r = p.reform; p.reform = null;
  if (r.kind === 'gov'){
    G.stats.reforms = (G.stats.reforms||0) + 1;
    const old = GOVS[p.gov].name; p.gov = r.to;
    if (!p.customTitle) p.title = GOVS[r.to].title;
    if (hasConstitution(r.to) && !p.constitution) p.constitution = defaultConstitution();
    p.nextElection = GOVS[r.to].elections ? G.turn + electionInterval() : -1; p.terms = 1;
    p.official = GOVS[r.to].prefix + ' ' + p.name;
    addLog(`🏛️ Transição concluída: ${old} → ${GOVS[r.to].name}. Agora somos ${p.official}.`, 'good');
    addNews(`${p.name} adota novo regime: ${GOVS[r.to].name}.`);
    for (let k=2;k<G.nations.length;k++) if (G.nations[k].alive) updateRelation(G.nations[k]);
  } else {
    p.econ = r.to; addLog(`🏛️ Reforma econômica concluída: ${ECONS[r.to].name}.`, 'good');
  }
  if (typeof onNegotiation === 'function') onNegotiation(`🏛️ Reforma concluída!`, true);
}

// ------------------------------------------------------------
//  Organização de novos territórios
// ------------------------------------------------------------
function organizeTerritory(mode, name, cellsN){
  const p = G.p;
  if (mode === 'novo'){
    const cost = 0.002*p.gdp + 10*G.costScale;
    if (p.treasury < cost) return {ok:false, why:'Tesouro insuficiente.'};
    p.treasury -= cost; p.states++; p.stateNames.push(name || genPlaceName());
    p.cities += Math.max(1, Math.round(cellsN/3));
    addLog(`🗺️ Novo estado criado no território colonizado: ${p.stateNames[p.stateNames.length-1]}.`, 'good');
    return {ok:true, msg:`Estado de ${p.stateNames[p.stateNames.length-1]} fundado!`};
  }
  if (mode === 'incorporar'){ addLog(`🗺️ O novo território foi incorporado ao estado de ${name}.`, 'info'); return {ok:true, msg:`Território incorporado a ${name}.`}; }
  addLog('🗺️ O novo território será administrado como território federal.', 'info');
  return {ok:true, msg:'Território federal criado.'};
}
