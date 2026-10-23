// ============================================================
//  IMPERIUM — ONU / Conselho Mundial (a partir de 1945)
//  • Uma sessão por ano: sanções, missões de paz, proibição de
//    armas nucleares, fundo de desenvolvimento, acordos do clima
//  • Você vota (e pode fazer campanha); as nações que gostam de
//    você tendem a seguir o seu voto — suas relações decidem
//  • Conselho de Segurança: as 5 maiores potências têm veto
// ============================================================
'use strict';

const UN_YEAR = 1945;
function unActive(){ return G && G.p && curYear() >= UN_YEAR; }
function unState(){ if (!G.un) G.un = {next: G.turn + randInt(3, 8), history: [], nukeBan: false, nukeSeen: G.stats.nukesUsed || 0, proposed: -99, out: G.p && G.p.unMember === false, leftAt: -99}; return G.un; }
// estamos fora da ONU? (não votamos, não vetamos, não fazemos propostas)
function unOut(){ return !!(G && G.un && G.un.out); }
function sanctioned(){ return G && G.p && (G.p.sanctionUntil||0) > G.turn; }

// as 5 maiores potências (poder militar) formam o Conselho de Segurança
function unCouncil(){
  const list = G.nations.filter(n => n && n.id > 1 && n.alive && !n.empty).map(n => ({id:n.id, pow:n.power||0}));
  if (!unOut()) list.push({id:1, pow:G.p.atk||0});
  return list.sort((a, b) => b.pow - a.pow).slice(0, 5).map(x => x.id);
}

const UN_TYPES = {
  sancao: {icon:'🚫', n:'Sanções', d:t => `Sanções econômicas contra ${t.name}: embargo comercial por 2 anos.`},
  paz:    {icon:'🕊️', n:'Missão de paz', d:(t, u) => `Enviar capacetes azuis para encerrar a guerra entre ${t.name} e ${u.name}.`},
  nuclear:{icon:'☢️', n:'Tratado de não proliferação', d:() => 'Proibir o uso de armas nucleares. Quem usar sofrerá sanções automáticas de todo o mundo.'},
  fundo:  {icon:'🤲', n:'Fundo de desenvolvimento', d:() => 'Os países ricos contribuem para ajudar os mais pobres (custa 0,5% do PIB a quem votar a favor).'},
  clima:  {icon:'🌱', n:'Acordo do clima', d:() => 'Metas para reduzir a poluição: um pouco menos de crescimento, mais apoio e relações melhores.'}
};

// escolhe a pauta do ano
function unPickResolution(){
  const un = unState(), year = curYear(), N = G.nations, p = G.p;
  const opts = [];
  // sanções: o maior agressor (pode ser você!)
  let worst = null, ws = 0;
  for (const n of N){ if (!n || n.id < 2 || !n.alive || n.empty) continue; const s = G.aiWars.filter(w => w.a === n.id).length*2 + (n.ag||0); if (s > ws){ ws = s; worst = n; } }
  const myScore = G.wars.filter(w => !w.byAI).length*2 + (G.stats.playerWars||0)*0.4 + (un.nukeBan && G.stats.nukesUsed > un.nukeSeen ? 10 : 0);
  if (myScore >= 3 && myScore >= ws) opts.push({type:'sancao', target:1, w:3});
  else if (worst && ws >= 2.5) opts.push({type:'sancao', target:worst.id, w:2});
  if (G.aiWars.length){ const w = pick(G.aiWars); opts.push({type:'paz', target:w.a, other:w.b, w:2}); }
  if (!un.nukeBan && year >= 1960) opts.push({type:'nuclear', w:1.5});
  opts.push({type:'fundo', w:1});
  if (year >= 1990) opts.push({type:'clima', w:1.2});
  // evita repetir a pauta das últimas sessões
  const recent = un.history.slice(0, 2).map(h => h.type);
  for (const o of opts) if (recent.includes(o.type)) o.w *= 0.25;
  let tot = opts.reduce((s, o) => s + o.w, 0), r = Math.random()*tot;
  for (const o of opts){ r -= o.w; if (r <= 0) return o; }
  return opts[0];
}

// como cada nação vota (sem contar a influência do jogador)
function unBaseVote(n, res){
  const ag = n.ag || 0.3, rnd = (((n.id*31 + G.turn*7) % 17) - 8) / 40;
  let v;
  if (res.type === 'sancao'){
    if (res.target === n.id) return -1;
    v = res.target === 1 ? (-(n.rel||0)/60 + 0.15) : (-aiRelation(n.id, res.target)/60 + 0.1);
  } else if (res.type === 'paz'){ if (n.id === res.target) return -1; if (n.id === res.other) return 1; v = 0.45 - ag*0.5; }
  else if (res.type === 'nuclear'){ v = 0.5 - ag*0.6 - (n.tech > 30 ? 0.2 : 0); }
  else if (res.type === 'fundo'){ v = n.pc < 6000*G.costScale ? 0.7 : 0.05; }
  else v = 0.25 - (n.gov === 'ditadura' || n.gov === 'comunismo' ? 0.2 : 0) + (n.pc > 20000*G.costScale ? 0.15 : 0);
  v += rnd;
  return v > 0.12 ? 1 : v < -0.12 ? -1 : 0;
}

// apuração: myVote 1 (sim), -1 (não), 0 (abstenção); campaign = gastou para convencer
function unTally(res, myVote, campaign){
  const council = unCouncil(), votes = {}, N = G.nations;
  let yes = 0, no = 0, abs = 0, veto = null;
  for (const n of N){
    if (!n || n.id < 2 || !n.alive || n.empty) continue;
    let v = unBaseVote(n, res);
    // amigos seguem o nosso voto; inimigos fazem o contrário
    if (myVote !== 0 && !(res.type === 'sancao' && res.target === n.id)){
      const rel = n.rel || 0, pull = (campaign ? 0.35 : 0) + (rel >= 50 ? 0.7 : rel >= 25 ? 0.4 : rel <= -40 ? -0.4 : 0);
      if (pull > 0 && Math.random() < pull) v = myVote;
      else if (pull < 0 && Math.random() < -pull) v = -myVote;
    }
    votes[n.id] = v; if (v > 0) yes++; else if (v < 0) no++; else abs++;
    if (v < 0 && council.includes(n.id) && res.type !== 'fundo' && res.type !== 'clima' && !veto) veto = n.id;
  }
  if (!unOut()){ if (myVote > 0) yes++; else if (myVote < 0) no++; else abs++; }
  if (myVote < 0 && council.includes(1) && res.type !== 'fundo' && res.type !== 'clima' && !veto) veto = 1;
  const passed = yes > no && !veto;
  return {votes, yes, no, abs, veto, passed, council};
}

function unApply(res, t, myVote){
  const p = G.p, N = G.nations, un = unState();
  if (!t.passed) return;
  if (res.type === 'sancao'){
    if (res.target === 1){ p.sanctionUntil = G.turn + 24; p.stability -= 4; p.approval -= 3; addLog('🚫 A ONU aprovou sanções contra nós por 2 anos: o comércio despencou.', 'bad'); }
    else { const n = N[res.target]; n.sanctionUntil = G.turn + 24; if (!G.online || G.online.host){ n.pc *= 0.96; n.power *= 0.92; } if (myVote > 0 && n.deals && Object.keys(n.deals).length){ n.deals = {}; syncTrade(n); } addNews(`ONU impõe sanções a ${n.name}.`); }
  }
  if (res.type === 'paz'){
    const before = G.aiWars.length; G.aiWars = G.aiWars.filter(w => !((w.a === res.target && w.b === res.other) || (w.a === res.other && w.b === res.target)));
    if (G.aiWars.length < before) addNews(`Capacetes azuis encerram a guerra entre ${N[res.target].name} e ${N[res.other].name}.`);
    if (myVote > 0) p.treasury -= p.gdp*0.001;
  }
  if (res.type === 'nuclear'){ un.nukeBan = true; un.nukeSeen = G.stats.nukesUsed || 0; addNews('Tratado mundial proíbe o uso de armas nucleares.'); }
  if (res.type === 'fundo' && myVote > 0){ p.treasury -= p.gdp*0.005; for (const n of N) if (n && n.id > 1 && n.alive && n.pc < 6000*G.costScale) changeRel(n, 5); }
  if (res.type === 'clima' && myVote > 0){ addTemp({growth:-0.15, approval:2, relations:3}, 60, 'Acordo do clima'); }
}

function unResultHTML(res, t, myVote){
  const T = UN_TYPES[res.type], N = G.nations, tot = t.yes + t.no + t.abs;
  const bar = (v, c) => `<i style="display:inline-block;height:14px;width:${v/tot*100}%;background:${c}"></i>`;
  return `<div class="m-icon">🏛️</div><div class="m-title">${t.passed ? 'Resolução aprovada' : 'Resolução rejeitada'}</div>
    <div class="m-text"><b>${T.icon} ${T.n}.</b> ${T.d(N[res.target] || {}, N[res.other] || {})}</div>
    <div style="display:flex;border:1px solid var(--ink2);margin:8px 0">${bar(t.yes,'#3d7a3a')}${bar(t.abs,'#b9a77a')}${bar(t.no,'#a3322a')}</div>
    <div class="row"><span class="k">✅ A favor</span><span class="v">${t.yes}</span></div><div class="row"><span class="k">⚪ Abstenções</span><span class="v">${t.abs}</span></div><div class="row"><span class="k">❌ Contra</span><span class="v">${t.no}</span></div>
    ${t.veto ? `<div class="tip">🛑 <b>Veto</b> de ${t.veto === 1 ? 'nossa nação' : esc(N[t.veto].name)} no Conselho de Segurança.</div>` : ''}
    <div class="muted" style="margin-top:6px">Nosso voto: ${myVote > 0 ? 'a favor' : myVote < 0 ? 'contra' : 'abstenção'}.</div>
    <div class="m-actions"><button class="btn green" id="un-ok">Continuar</button></div>`;
}

function unVote(res, myVote, campaign){
  const p = G.p;
  if (campaign){ const c = p.gdp*0.004; p.treasury -= c; }
  const t = unTally(res, myVote, campaign);
  unApply(res, t, myVote);
  // quem votou como nós gosta um pouco mais; quem votou contra, um pouco menos
  if (myVote !== 0) for (const id in t.votes){ const n = G.nations[id]; if (t.votes[id] === myVote) changeRel(n, 1); else if (t.votes[id] === -myVote) changeRel(n, -1); }
  const un = unState(); un.history.unshift({turn:G.turn, type:res.type, target:res.target||null, passed:t.passed, yes:t.yes, no:t.no, veto:t.veto||null}); un.history = un.history.slice(0, 20);
  const T = UN_TYPES[res.type];
  addLog(`🏛️ ONU — ${T.n}${res.target ? ' (' + (res.target === 1 ? p.name : G.nations[res.target].name) + ')' : ''}: ${t.passed ? 'aprovada' : t.veto ? 'vetada' : 'rejeitada'} (${t.yes} × ${t.no}).`, t.passed ? 'dip' : 'info');
  setTimeout(() => { if (UI.modalOpen){ toast(`🏛️ Resolução ${t.passed ? 'aprovada' : 'rejeitada'}: ${T.n}`, 'dip'); return; }
    const m = openModal(unResultHTML(res, t, myVote)); SFX[t.passed ? 'bell' : 'page'](); m.querySelector('#un-ok').onclick = () => { SFX.click(); closeModal(); if (G.pendingEvents.length) setTimeout(showNextEvent, 200); else resumeAuto(); }; }, 300);
}

EVENTS.onu_sessao = {icon:'🏛️', title:'Assembleia Geral da ONU', special:true,
  text:d => { const res = d.res, T = UN_TYPES[res.type], N = G.nations;
    const council = unCouncil().map(id => id === 1 ? `<b>${esc(G.p.name)}</b>` : esc(N[id].name)).join(', ');
    const prev = unTally(res, 0, false);
    return `<b>${T.icon} ${T.n}.</b> ${T.d(N[res.target] || {}, N[res.other] || {})}${res.target === 1 ? ' <b>Somos o alvo!</b>' : ''}<br><br>
      <small>Conselho de Segurança (veto): ${council}.<br>Tendência sem a nossa influência: ✅ ${prev.yes} × ❌ ${prev.no}${prev.veto ? ' · veto provável' : ''}. Nações amigas tendem a seguir o nosso voto.</small>`; },
  choices:d => { const res = d.res, c = fmtMoney(G.p.gdp*0.004);
    return [
      {t:'✅ Votar a favor', h:'Amigos seguem o nosso voto', f:()=>unVote(res, 1, false)},
      {t:'❌ Votar contra', h:unCouncil().includes(1) ? 'Somos do Conselho: nosso "não" é veto!' : 'Amigos seguem o nosso voto', f:()=>unVote(res, -1, false)},
      {t:'⚪ Abster-se', h:'Sem compromisso', f:()=>unVote(res, 0, false)},
      {t:'📣 Votar a favor + campanha', h:`Diplomatas convencem indecisos (${c})`, f:()=>unVote(res, 1, true)},
      {t:'📣 Votar contra + campanha', h:`Diplomatas convencem indecisos (${c})`, f:()=>unVote(res, -1, true)}
    ]; }};
EVENTS.onu_fundacao = {icon:'🏛️', title:'Nasce a ONU', special:true,
  text:() => 'Depois da Segunda Guerra, as nações criam a Organização das Nações Unidas (1945) para evitar novas guerras. Todo ano haverá uma Assembleia: sanções, missões de paz e tratados. As 5 maiores potências formam o Conselho de Segurança e podem vetar resoluções.',
  choices:() => [{t:'Entrar na ONU', h:'+3 relações com todos', f:()=>{ unState().out = false; for (const n of G.nations) if (n && n.id > 1 && n.alive) changeRel(n, 3); }},
    {t:'Ficar de fora', h:'Sem votos nem compromissos · −3 relações com todos', f:()=>{ const un = unState(); un.out = true; un.leftAt = G.turn; for (const n of G.nations) if (n && n.id > 1 && n.alive) changeRel(n, -3); addLog('🏛️ Decidimos não entrar na ONU.', 'dip'); }}]};

// ---------- efeitos das sanções sobre nós ----------
const _unMods = calcMods;
calcMods = function(){ const m = _unMods(); if (sanctioned()){ m.tradeMult -= 0.5; m.growth -= 0.5; } return m; };
const _unBudget = budget;
budget = function(m){ const r = _unBudget(m); if (sanctioned() && r.inc.comercio){ const cut = r.inc.comercio*0.5; r.inc.comercio -= cut; r.tIn -= cut; r.bal -= cut; } return r; };
const _unRelBase = relBase;
relBase = function(n){ return _unRelBase(n) - (sanctioned() ? 6 : 0); };

// ---------- passagem do mês ----------
const _unEnd = endTurn;
endTurn = function(){
  _unEnd.apply(this, arguments);
  if (!G || G.over || !unActive()) return;
  const un = unState();
  if (!un.welcomed){ un.welcomed = true; if (G.startYear < UN_YEAR && !un.out) queueEvent('onu_fundacao'); }
  // usar bomba com o tratado em vigor = sanções automáticas
  if (un.nukeBan && (G.stats.nukesUsed||0) > un.nukeSeen){ un.nukeSeen = G.stats.nukesUsed; G.p.sanctionUntil = G.turn + 36; for (const n of G.nations) if (n && n.id > 1 && n.alive) changeRel(n, -20); addLog('☢️ Violamos o tratado nuclear: o mundo inteiro impõe sanções por 3 anos.', 'bad'); }
  if (G.turn >= un.next){ un.next = G.turn + randInt(11, 13); if (un.out) unSilentSession(); else queueEvent('onu_sessao', {res:unPickResolution()}); }
};

// fora da ONU: a assembleia acontece sem o nosso voto (e ainda pode nos sancionar)
function unSilentSession(){
  const res = unPickResolution(), t = unTally(res, 0, false); unApply(res, t, 0);
  const un = unState(), T = UN_TYPES[res.type];
  un.history.unshift({turn:G.turn, type:res.type, target:res.target||null, passed:t.passed, yes:t.yes, no:t.no, veto:t.veto||null}); un.history = un.history.slice(0, 20);
  addLog(`🏛️ ONU (sem a nossa participação) — ${T.n}${res.target ? ' (' + (res.target === 1 ? G.p.name : G.nations[res.target].name) + ')' : ''}: ${t.passed ? 'aprovada' : t.veto ? 'vetada' : 'rejeitada'}.`, res.target === 1 && t.passed ? 'bad' : 'info');
}
function unLeave(){
  const un = unState(); if (un.out) return {ok:false, why:'Já estamos fora da ONU.'};
  un.out = true; un.leftAt = G.turn;
  for (const n of G.nations) if (n && n.id > 1 && n.alive) changeRel(n, GOVS[n.gov] && GOVS[n.gov].family === 'dem' ? -8 : -3);
  if (GOVS[G.p.gov].family === 'dem') G.p.approval -= 2; else G.p.stability += 1;
  return {ok:true, msg:'🚪 Saímos da ONU. Não votamos mais nas assembleias — mas elas continuam decidindo sobre o mundo.'};
}
function unJoin(){
  const un = unState(); if (!un.out) return {ok:false, why:'Já fazemos parte da ONU.'};
  if (G.turn - un.leftAt < 12) return {ok:false, why:`Saímos há pouco tempo. Podemos pedir para voltar em ${12 - (G.turn - un.leftAt)} mês(es).`};
  un.out = false; for (const n of G.nations) if (n && n.id > 1 && n.alive) changeRel(n, 4);
  return {ok:true, msg:'🤝 Voltamos a fazer parte da ONU.'};
}

// ---------- painel ----------
function unPanelHTML(){
  if (!unActive()) return '';
  const un = unState(), N = G.nations;
  if (un.out) return `<div class="sub">🏛️ Nações Unidas</div><div class="box">
    <div class="muted">🚪 Estamos <b>fora da ONU</b>. As assembleias continuam sem o nosso voto${un.history.length ? ' — a última: ' + UN_TYPES[un.history[0].type].n + ' (' + (un.history[0].passed ? 'aprovada' : 'rejeitada') + ')' : ''}.</div>
    ${sanctioned() ? row('🚫 Sanções contra nós', `${G.p.sanctionUntil - G.turn} meses`, 'down') : ''}
    <button class="btn xs green" style="margin-top:6px" data-unmb="join">🤝 Voltar para a ONU</button></div>`;
  const hist = un.history.slice(0, 4).map(h => `<div class="row"><span class="k">${UN_TYPES[h.type].icon} ${UN_TYPES[h.type].n}${h.target ? ' — ' + esc(h.target === 1 ? G.p.name : (N[h.target]||{}).name || '') : ''}</span><span class="v ${h.passed ? 'up' : 'down'}">${h.passed ? 'aprovada' : h.veto ? 'vetada' : 'rejeitada'}</span></div>`).join('');
  return `<div class="sub">🏛️ Nações Unidas</div><div class="box">
    ${row('Próxima Assembleia', `em ${Math.max(0, un.next - G.turn)} meses`)}
    ${row('Conselho de Segurança', unCouncil().map(id => id === 1 ? '<b>nós</b>' : esc(N[id].name)).join(', '))}
    ${un.nukeBan ? row('☢️ Tratado nuclear', 'em vigor') : ''}${sanctioned() ? row('🚫 Sanções contra nós', `${G.p.sanctionUntil - G.turn} meses`, 'down') : ''}
    ${hist}
    <button class="btn xs" style="margin-top:6px" data-unact="propose" ${G.turn - un.proposed < 12 ? 'disabled' : ''} title="Uma proposta por ano">🚫 Propor sanções contra…</button>
    <button class="btn xs" style="margin-top:6px" data-unmb="leave">🚪 Sair da ONU</button></div>`;
}
const _unPanel = panelDiplomacia;
panelDiplomacia = function(){
  const h = _unPanel(), i = h.indexOf('<div class="filters">');
  return i < 0 ? h + unPanelHTML() : h.slice(0, i) + unPanelHTML() + h.slice(i);
};
document.addEventListener('click', e => {
  const btn = e.target.closest && e.target.closest('[data-unact]'); if (!btn || btn.disabled || !G) return;
  const list = G.nations.filter(n => n && n.id > 1 && n.alive && !n.empty).sort((a, b) => (a.rel||0) - (b.rel||0)).slice(0, 12);
  const m = openModal(`<div class="m-icon">🏛️</div><div class="m-title">Propor sanções</div><div class="m-text">A proposta vai à votação na hora. Nações que gostam de nós tendem a apoiar; os membros do Conselho podem vetar.</div>
    ${list.map(n => `<button class="choice" data-sn="${n.id}"><b>${esc(n.name)}</b><span>Relação ${n.rel > 0 ? '+' : ''}${n.rel}${unCouncil().includes(n.id) ? ' · membro do Conselho (vai vetar)' : ''}</span></button>`).join('')}
    <div class="m-actions"><button class="btn" id="sn-x">Cancelar</button></div>`);
  m.querySelector('#sn-x').onclick = () => { SFX.click(); closeModal(); };
  m.querySelectorAll('[data-sn]').forEach(b => b.onclick = () => { SFX.click(); closeModal(); unState().proposed = G.turn; changeRel(G.nations[+b.dataset.sn], -15); unVote({type:'sancao', target:+b.dataset.sn}, 1, false); refreshAll(); });
});

document.addEventListener('click', e => {
  const btn = e.target.closest && e.target.closest('[data-unmb]'); if (!btn || !G) return;
  if (btn.dataset.unmb === 'leave') confirmModal('🚪', 'Sair da ONU?', 'Deixamos de votar e de poder vetar. As democracias não vão gostar (−8 relação; outras nações −3). A ONU ainda pode aprovar sanções contra nós. Dá para voltar depois de 1 ano.', 'Sair da ONU', () => { const r = unLeave(); toast(esc(r.ok ? r.msg : r.why), r.ok ? 'dip' : 'bad'); if (r.ok) addLog(r.msg, 'dip'); refreshAll(); }, true);
  else { const r = unJoin(); if (r.ok){ SFX.bell(); toast(esc(r.msg), 'good'); addLog(r.msg, 'dip'); } else { SFX.error(); toast(esc(r.why), 'bad'); } refreshAll(); }
});
