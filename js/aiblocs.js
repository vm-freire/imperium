// ============================================================
//  IMPERIUM — Blocos econômicos da IA
//  • As nações da IA fundam blocos (mercados comuns ou pactos
//    econômico-militares) e convidam outras nações — inclusive você
//  • Membros não guerreiam entre si; blocos rivais se estranham
//  • No bloco militar, os membros defendem quem for atacado
//  • No online, só o anfitrião decide (e publica no mundo)
// ============================================================
'use strict';

const AIB_MAX = 4;
// [nome, gênero] — o adjetivo da região concorda com o nome
const AIB_BASES_OLD = [['Liga Comercial','f'], ['Liga Mercantil','f'], ['União Aduaneira','f'], ['Confederação Comercial','f']];
const AIB_BASES_NEW = [['Mercado Comum','m'], ['Comunidade Econômica','f'], ['União Econômica','f'], ['Zona de Livre Comércio','f'], ['Associação de Comércio','f']];
const AIB_MIL = [['Pacto de Defesa','m'], ['Pacto Militar','m'], ['Tratado de Segurança','m'], ['Aliança Defensiva','f']];
const AIB_ICONS = ['🔷', '🔶', '🟢', '🟣', '⭐', '🌀'];

function aiBlocs(){ return (G && G.aiBlocs) || []; }
function aiBlocOf(id){ return aiBlocs().find(b => b.members.includes(id)) || null; }
function aiBlocById(bid){ return aiBlocs().find(b => b.id === bid) || null; }
function playerAiBloc(){ return G && G.p && G.p.aiBloc ? aiBlocById(G.p.aiBloc) : null; }
const aibWorldAuth = () => !G.online || G.online.host;

// nome conforme a região do fundador e a época
function aibRegion(n){
  const c = n.cap >= 0 ? cellCenter(n.cap) : (n.seeds && n.seeds[0]) || [0, 0], lo = c[0], la = c[1];
  if (lo < -30) return la < 5 ? ['Sul-Americano', 'Sul-Americana'] : ['Americano', 'Americana'];
  if (lo > 110 && la < -10) return ['do Pacífico', 'do Pacífico'];
  if (la > 35 && lo < 45) return ['Europeu', 'Europeia'];
  if (la < 35 && lo < 55 && lo > -20 && la < 30) return ['Africano', 'Africana'];
  if (lo >= 25 && lo < 60 && la >= 12 && la < 42) return ['do Oriente Médio', 'do Oriente Médio'];
  return ['Asiático', 'Asiática'];
}
function aibName(founder, mil){
  const [base, g] = mil ? pick(AIB_MIL) : pick(curYear() < 1900 ? AIB_BASES_OLD : AIB_BASES_NEW);
  let name = `${base} ${aibRegion(founder)[g === 'f' ? 1 : 0]}`;
  if (aiBlocs().some(b => b.name === name)) name = `${base} de ${founder.capital || founder.name}`;
  return name;
}

const AIBLOC = {
  // força do bloco: soma dos PIBs
  gdp(b){ return b.members.reduce((s, id) => { const n = G.nations[id]; return s + (n && n.alive ? n.pop*n.pc : 0); }, 0) + (playerAiBloc() === b ? G.p.gdp : 0); },
  // nações livres para entrar (fora de blocos de IA e do bloco do jogador)
  free(n){ return n && n.alive && !n.human && !n.empty && n.id > 1 && !aiBlocOf(n.id) && !(typeof blocMember === 'function' && blocMember(n.id)); },
  found(){
    const year = curYear(); if (aiBlocs().length >= AIB_MAX) return;
    const cands = G.nations.filter(n => this.free(n) && n.pop*n.pc > 0).sort((a, b) => b.pop*b.pc - a.pop*a.pc).slice(0, 25);
    if (!cands.length) return;
    const f = pick(cands);
    const mil = year >= 1900 && chance(f.ag > 0.5 ? 0.45 : 0.2);
    G.aiBlocs = aiBlocs().concat([{id:'ab' + G.turn + '_' + f.id, name:aibName(f, mil), icon:AIB_ICONS[(G.aiBlocSeq = (G.aiBlocSeq||0) + 1) % AIB_ICONS.length], mil, founder:f.id, members:[f.id], since:G.turn}]);
    addNews(`${f.name} funda o bloco "${aiBlocs()[aiBlocs().length-1].name}".`);
    addLog(`📰 ${f.name} fundou o bloco "${aiBlocs()[aiBlocs().length-1].name}".`, 'info');
  },
  // a IA convida quem se dá bem com o fundador
  growAI(b){
    const f = G.nations[b.founder]; if (!f || !f.alive) return;
    const cands = G.nations.filter(n => this.free(n) && aiRelation(b.founder, n.id) > (b.mil ? 15 : 5));
    if (!cands.length) return;
    const n = pick(cands);
    if (chance(0.5 + aiRelation(b.founder, n.id)/200)){ b.members.push(n.id); addNews(`${n.name} entra no bloco "${b.name}".`); }
  },
  // convite ao jogador (só no jogo solo)
  maybeInvitePlayer(b){
    if (G.online || G.p.aiBloc || (typeof ecoBloc === 'function' && ecoBloc())) return;
    if (G.p._aibAsked && G.turn - G.p._aibAsked < 24) return;
    const f = G.nations[b.founder]; if (!f || !f.alive || f.atWar) return;
    const avgRel = b.members.reduce((s, id) => s + (G.nations[id].rel||0), 0) / b.members.length;
    if (avgRel < (b.mil ? 40 : 25)) return;
    if (G.wars.some(w => b.members.includes(w.e))) return;
    G.p._aibAsked = G.turn;
    queueOnce('proposta_bloco', {b:b.id});
  },
  join(b){
    G.p.aiBloc = b.id;
    for (const id of b.members) changeRel(G.nations[id], 8);
    addLog(`${b.icon} Entramos no bloco "${b.name}".`, 'dip'); addNews(`${G.p.name} entra no bloco "${b.name}".`);
  },
  leave(){
    const b = playerAiBloc(); if (!b) return {ok:false, why:'Não estamos em nenhum bloco.'};
    G.p.aiBloc = null; for (const id of b.members) if (G.nations[id]) changeRel(G.nations[id], -12);
    return {ok:true, msg:`Saímos do bloco "${b.name}".`};
  },
  income(){
    const b = playerAiBloc(); if (!b) return 0; const p = G.p; let s = 0;
    for (const id of b.members){ const n = G.nations[id]; if (n && n.alive && !n.atWar) s += Math.min(p.gdp, n.pop*n.pc)/12 * 0.005; }
    return s;
  },
  monthly(){
    const bl = aiBlocs();
    // membros mortos ou em guerra com o fundador saem; blocos sem sócios acabam
    for (const b of bl){
      b.members = b.members.filter(id => { const n = G.nations[id]; return n && n.alive && !n.human && !(id !== b.founder && aiAtWarWith(id, b.founder)); });
      if (!G.nations[b.founder] || !G.nations[b.founder].alive) b.founder = b.members[0];
    }
    G.aiBlocs = bl.filter(b => b.founder && (b.members.length > 1 || G.turn - b.since < 36));
    if (G.p.aiBloc && !playerAiBloc()){ G.p.aiBloc = null; addLog('O bloco do qual fazíamos parte foi dissolvido.', 'dip'); }
    if (!aibWorldAuth()) return;
    const year = curYear();
    if (aiBlocs().length < AIB_MAX && chance(year < 1850 ? 0.004 : year < 1945 ? 0.008 : 0.015)) this.found();
    for (const b of aiBlocs()){
      if (b.members.length < 10 && chance(0.12)) this.growAI(b);
      if (chance(0.03)) this.maybeInvitePlayer(b);
    }
  }
};

// ---------- relações e guerras entre IAs ----------
const _aibRel = aiRelation;
aiRelation = function(a, b){
  let r = _aibRel(a, b); if (r <= -90) return r;
  const A = aiBlocOf(a), B = aiBlocOf(b);
  if (A && A === B) r += A.mil ? 30 : 20; else if (A && B) r -= (A.mil || B.mil) ? 15 : 8;
  return clamp(r, -100, 100);
};
const _aibStart = startAIWar;
let _aibDepth = 0;
startAIWar = function(a, b){
  const A = aiBlocOf(a), B = aiBlocOf(b);
  if (A && A === B) return;   // sócios do mesmo bloco não se atacam
  const had = G.aiWars.length;
  _aibStart(a, b);
  if (G.aiWars.length === had || _aibDepth || !aibWorldAuth()) return;
  // defesa coletiva: o bloco militar de quem foi atacado reage
  _aibDepth++;
  try {
    if (B && B.mil){
      for (const id of B.members){ if (id === b || id === a || aiAtWarWith(id, a) || !G.nations[id].alive) continue; if (chance(0.6)){ startAIWar(id, a); addNews(`${G.nations[id].name} cumpre o "${B.name}" e ataca ${G.nations[a].name}.`); } }
      // o jogador é sócio: o bloco pede ajuda
      if (G.p && G.p.aiBloc === B.id && !G.online && G.nations[a] && !G.nations[a].atWar && !G.nations[a].human) queueOnce('bloco_pede_ajuda', {b:B.id, enemy:a, victim:b});
    }
  } finally { _aibDepth--; }
};

// relação do jogador: sócios gostam de nós; blocos rivais desconfiam
const _aibRelBase = relBase;
relBase = function(n){
  let r = _aibRelBase(n); const pb = playerAiBloc(), nb = aiBlocOf(n.id);
  if (pb && nb === pb) r += pb.mil ? 15 : 10;
  else if (nb && (pb || (typeof ecoBloc === 'function' && ecoBloc()))) r -= nb.mil ? 6 : 3;
  return r;
};

// economia do jogador no bloco da IA
const _aibBudget = budget;
budget = function(m){
  const r = _aibBudget(m);
  if (playerAiBloc()){ const v = AIBLOC.income(); r.inc.blocoIA = v; r.tIn += v; r.bal += v; }
  return r;
};
const _aibMods = calcMods;
calcMods = function(){
  const m = _aibMods(), b = playerAiBloc();
  if (b){ const k = b.members.length; m.tradeMult += Math.min(0.25, k*0.035); m.growth += Math.min(0.4, k*0.06); if (b.mil) m.defense += Math.min(0.15, k*0.02); }
  return m;
};

// ser atacado estando num bloco militar da IA: os sócios entram
const _aibDeclare = declareWar;
declareWar = function(id, byAI){
  const b = playerAiBloc(), n = G.nations[id], was = n.atWar;
  if (b && b.members.includes(id) && !byAI){
    // atacar um sócio = expulsão e revolta
    G.p.aiBloc = null; for (const k of b.members) if (k !== id) changeRel(G.nations[k], -25);
    addLog(`Atacamos ${n.name}, sócio do "${b.name}". Fomos expulsos do bloco.`, 'bad');
  }
  _aibDeclare(id, byAI);
  if (!b || !b.mil || was || !n.atWar || !G.p.aiBloc) return;
  for (const k of b.members){ const o = G.nations[k]; if (k === id || !o.alive || o.atWar || o.alliance) continue;
    if (chance(o.rel >= 30 ? 0.75 : 0.35)){ startAIWar(k, id); addLog(`${b.icon} ${o.name} honra o "${b.name}" e entra na guerra contra ${n.name}!`, 'good'); } }
};

// ---------- eventos ----------
EVENTS.proposta_bloco = {icon:'🌐', title:'Convite para um Bloco', special:true,
  text:d => { const b = aiBlocById(d.b); if (!b) return 'O convite expirou.';
    return `Os membros do bloco "${b.name}" (${b.members.map(id => G.nations[id].name).slice(0, 6).join(', ')}${b.members.length > 6 ? '…' : ''}) convidam ${G.p.name} a entrar. ${b.mil ? 'É um pacto econômico e militar: seremos defendidos — e chamados a defender.' : 'É um mercado comum: comércio sem barreiras entre os sócios.'}`; },
  choices:d => { const b = aiBlocById(d.b);
    if (!b) return [{t:'Ok', h:'', f:()=>{}}];
    return [
      {t:'Entrar no bloco', h:`Renda do mercado comum, +comércio, +crescimento${b.mil ? ', defesa mútua' : ''} · blocos rivais desconfiarão`, f:()=>{ if (typeof ecoBloc === 'function' && ecoBloc()){ addLog('Não podemos entrar: já lideramos nosso próprio bloco.', 'bad'); return; } AIBLOC.join(b); }},
      {t:'Recusar', h:'-4 relações com os membros', f:()=>{ for (const id of b.members) changeRel(G.nations[id], -4); }}
    ]; }};
EVENTS.bloco_pede_ajuda = {icon:'🛡️', title:'O Bloco Pede Ajuda', special:true,
  text:d => { const b = aiBlocById(d.b), e = G.nations[d.enemy], v = G.nations[d.victim]; return b && e && v ? `${e.name} atacou ${v.name}, nosso sócio no "${b.name}". O bloco espera que entremos na guerra.` : 'A situação mudou.'; },
  choices:d => { const b = aiBlocById(d.b), e = G.nations[d.enemy];
    if (!b || !e || !e.alive || e.atWar) return [{t:'Ok', h:'', f:()=>{}}];
    return [
      {t:'Declarar guerra', h:`Guerra contra ${e.name} ao lado do bloco`, f:()=>{ declareWar(e.id, false); }},
      {t:'Ficar de fora', h:'-10 relações com os sócios; podem nos expulsar', f:()=>{ for (const id of b.members) changeRel(G.nations[id], -10); if (chance(0.3)){ G.p.aiBloc = null; addLog(`Fomos expulsos do "${b.name}" por não ajudar.`, 'bad'); } }}
    ]; }};

// ---------- passagem do mês ----------
const _aibEnd = endTurn;
endTurn = function(){ _aibEnd.apply(this, arguments); if (G && !G.over) AIBLOC.monthly(); };

// ---------- interface ----------
const _aibTags = nationTags;
nationTags = function(n){ const b = aiBlocOf(n.id); return _aibTags(n) + (b ? `<span class="tag" style="background:#5a4a7a;color:#fff" title="${esc(b.name)}">${b.icon} ${esc(b.name.split(' ')[0].toUpperCase())}</span>` : ''); };

function aiBlocsPanelHTML(){
  const bl = aiBlocs(); if (!bl.length && !playerAiBloc()) return '';
  const pb = playerAiBloc();
  return `<div class="sub">🌍 Blocos do mundo (${bl.length})</div><div class="box">
    ${bl.map(b => `<div class="row"><span class="k">${b.icon} <b>${esc(b.name)}</b>${b === pb ? ' <span class="tag ally">NÓS</span>' : ''}<br><small class="muted">${b.mil ? '🛡️ econômico e militar' : '⚓ econômico'} · ${b.members.map(id => esc(G.nations[id].name)).slice(0, 5).join(', ')}${b.members.length > 5 ? '…' : ''}</small></span><span class="v">${(k => `${k} membro${k === 1 ? '' : 's'}`)(b.members.length + (b === pb ? 1 : 0))}<br><small>${fmtMoney(AIBLOC.gdp(b))}</small></span></div>`).join('')}
    ${pb ? `<div class="row"><span class="k">💰 Nossa renda no bloco</span><span class="v up">+${fmtMoney(AIBLOC.income())}/mês</span></div><button class="btn xs" style="margin-top:6px" data-aibact="leave">Sair do bloco "${esc(pb.name)}"</button>` : ''}
  </div>`;
}
const _aibPanel = panelDiplomacia;
panelDiplomacia = function(){
  const h = _aibPanel(), i = h.indexOf('<div class="filters">');
  return i < 0 ? h + aiBlocsPanelHTML() : h.slice(0, i) + aiBlocsPanelHTML() + h.slice(i);
};
// janela da nação: mostra o bloco dela
const _aibOpen = openNation;
openNation = function(id){
  _aibOpen(id);
  const b = aiBlocOf(id), m = $('#modal'); if (!b || !m) return;
  const tags = m.querySelector('.m-title'); if (tags) tags.insertAdjacentHTML('afterend', `<div class="muted">${b.icon} Membro do bloco <b>${esc(b.name)}</b>${b.mil ? ' (econômico e militar)' : ''}</div>`);
};
document.addEventListener('click', e => {
  const btn = e.target.closest && e.target.closest('[data-aibact]'); if (!btn || !G) return;
  if (btn.dataset.aibact === 'leave') confirmModal('🌍', 'Sair do bloco?', 'Perdemos a renda do mercado comum e os sócios ficam desapontados (−12 relação).', 'Sair', () => { const r = AIBLOC.leave(); toast(esc(r.ok ? r.msg : r.why), r.ok ? 'dip' : 'bad'); if (r.ok) addLog(r.msg, 'dip'); refreshAll(); }, true);
});
