// ============================================================
//  IMPERIUM — Blocos econômicos criados pelo jogador
//  • Fundado na aba Diplomacia: só econômico (mercado comum) ou
//    econômico e militar (defesa mútua, como uma aliança coletiva)
//  • Convites pela janela de cada nação; a resposta leva 2–4 meses
//  • Membros: renda do mercado comum, +comércio, +crescimento e
//    melhores relações; no bloco militar, entram nas nossas guerras
// ============================================================
'use strict';

const ECOBLOC_NAMES = ['Mercado Comum', 'União Econômica', 'Liga Comercial', 'Comunidade de Nações', 'Aliança do Comércio', 'Zona de Livre Comércio'];
const ECOBLOC_ICONS = ['🌐', '⚓', '🤝', '🏛️', '🌟', '🕊️', '🦅', '⚖️'];

function ecoBloc(){ return G && G.myBloc || null; }
function ecoMembers(){ const b = ecoBloc(); return b ? b.members.map(id => G.nations[id]).filter(n => n && n.alive) : []; }
function blocMember(id){ const b = ecoBloc(); return !!(b && b.members.includes(id)); }
function ecoInviting(id){ const b = ecoBloc(); return !!(b && b.invites.some(x => x.n === id)); }

const ECOBLOC = {
  foundCost(){ return G.p.gdp*0.004 + 20*G.costScale; },
  found(name, icon, mil){
    const p = G.p; if (ecoBloc()) return {ok:false, why:'Já lideramos um bloco.'};
    if (p.aiBloc) return {ok:false, why:'Saia do bloco do qual fazemos parte antes de fundar o seu.'};
    name = String(name || '').trim().slice(0, 40); if (name.length < 3) return {ok:false, why:'Dê um nome ao bloco (mínimo 3 letras).'};
    const c = this.foundCost(); if (p.treasury < c) return {ok:false, why:'Tesouro insuficiente.'};
    p.treasury -= c;
    G.myBloc = {name, icon: icon || '🌐', mil: !!mil, members: [], invites: [], since: G.turn};
    G.stats.blocs = (G.stats.blocs||0) + 1;
    return {ok:true, msg:`${icon||'🌐'} Fundamos o bloco "${name}"${mil ? ' (econômico e militar)' : ''}. Convide nações pela janela de diplomacia de cada uma.`};
  },
  inviteBlock(n){
    const b = ecoBloc(); if (!b) return 'Funde um bloco primeiro.';
    if (n.atWar) return 'Estamos em guerra.';
    if (blocMember(n.id)) return 'Já é membro.';
    if (ecoInviting(n.id)) return 'Convite em análise.';
    if (b.members.length >= 12) return 'O bloco já tem o máximo de 12 membros.';
    if (b.mil && !n.alliance && n.rel < 50) return 'Bloco militar: precisa ser aliado militar ou ter relações ≥ 50.';
    if (n.rel < 25) return 'Relações insuficientes (mínimo 25).';
    return '';
  },
  chance(n){
    const b = ecoBloc(), p = G.p;
    let c = 0.35 + (n.rel - 25)/90 + (n.alliance ? 0.2 : 0) + Math.min(0.15, dealCount(n)*0.05);
    if (n.bloc && n.bloc !== p.bloc) c -= 0.25;
    if (typeof aiBlocOf === 'function' && aiBlocOf(n.id)) c -= 0.3;   // já está em outro bloco
    if (b && b.mil && !n.alliance) c -= 0.15;
    if (b && b.mil && n.ag < 0.25) c -= 0.1;   // nações pacíficas relutam em entrar num pacto militar
    return clamp(c, 0.05, 0.92);
  },
  invite(n){
    const why = this.inviteBlock(n); if (why) return {ok:false, why};
    ecoBloc().invites.push({n:n.id, due: G.turn + randInt(2, 4)});
    return {ok:true, msg:`Convite enviado a ${n.name} para entrar no bloco "${ecoBloc().name}". Resposta em alguns meses.`};
  },
  kick(n){
    const b = ecoBloc(); if (!b || !blocMember(n.id)) return {ok:false, why:'Não é membro.'};
    b.members = b.members.filter(x => x !== n.id); changeRel(n, -20);
    return {ok:true, msg:`${n.name} foi expulso do bloco "${b.name}".`};
  },
  dissolve(){
    const b = ecoBloc(); if (!b) return {ok:false, why:'Não há bloco.'};
    ecoMembers().forEach(n => changeRel(n, -10)); G.myBloc = null; G.p.stability -= 2;
    return {ok:true, msg:`O bloco "${b.name}" foi dissolvido.`};
  },
  // renda mensal do mercado comum (cada sócio rende conforme o tamanho da economia dele)
  income(){
    const p = G.p; let s = 0;
    for (const n of ecoMembers()) if (!n.atWar) s += Math.min(p.gdp, n.pop*n.pc)/12 * 0.006;
    return s;
  }
};

// ---------- efeitos na economia ----------
const _ebBudget = budget;
budget = function(m){
  const r = _ebBudget(m);
  if (ecoBloc() && ecoMembers().length){ const v = ECOBLOC.income(); r.inc.bloco = v; r.tIn += v; r.bal += v; }
  return r;
};
const _ebMods = calcMods;
calcMods = function(){
  const m = _ebMods(); const k = ecoMembers().length;
  if (k){ m.tradeMult += Math.min(0.3, k*0.04); m.growth += Math.min(0.5, k*0.08); if (ecoBloc().mil) m.defense += Math.min(0.2, k*0.025); }
  return m;
};
const _ebRelBase = relBase;
relBase = function(n){ return _ebRelBase(n) + (blocMember(n.id) ? (ecoBloc().mil ? 18 : 12) : 0); };

// ---------- guerra: traição e defesa coletiva ----------
const _ebDeclare = declareWar;
declareWar = function(id, byAI){
  const b = ecoBloc(), n = G.nations[id];
  if (b && blocMember(id) && !n.atWar){
    b.members = b.members.filter(x => x !== id);
    if (!byAI){ ecoMembers().forEach(o => changeRel(o, -20)); G.p.stability -= 5; addLog(`Atacamos ${n.name}, membro do nosso próprio bloco — os outros sócios estão revoltados.`, 'bad'); }
    else addLog(`${n.name} traiu o bloco "${b.name}" e foi expulso.`, 'dip');
  }
  const was = n.atWar;
  _ebDeclare(id, byAI);
  if (!b || !b.mil || was || !n.atWar) return;
  for (const o of ecoMembers()){
    if (o.id === id || o.atWar || o.alliance) continue;   // aliados já entram pela aliança
    if (chance(o.rel >= 30 ? 0.8 : 0.4)){ startAIWar(o.id, id); addLog(`${b.icon} ${o.name} cumpre o pacto do bloco "${b.name}" e entra na guerra contra ${n.name}!`, 'good'); }
    else { changeRel(o, -5); addLog(`${o.name} se recusou a lutar ao nosso lado, apesar do bloco.`, 'dip'); }
  }
};

// ---------- passagem do mês ----------
const _ebEnd = endTurn;
endTurn = function(){
  _ebEnd.apply(this, arguments);
  const b = ecoBloc(); if (!b || !G.p) return;
  b.members = b.members.filter(id => G.nations[id] && G.nations[id].alive);
  for (const iv of b.invites.slice()){
    if (iv.due > G.turn) continue;
    b.invites = b.invites.filter(x => x !== iv);
    const n = G.nations[iv.n]; if (!n || !n.alive || n.atWar) continue;
    if (chance(ECOBLOC.chance(n))){
      b.members.push(n.id); changeRel(n, 8);
      const old = typeof aiBlocOf === 'function' && aiBlocOf(n.id); if (old){ old.members = old.members.filter(x => x !== n.id); addLog(`${n.name} trocou o "${old.name}" pelo nosso bloco.`, 'dip'); }
      const msg = `${b.icon} ${n.name} aceitou entrar no bloco "${b.name}"!`; addLog(msg, 'dip'); addNews(`${n.name} adere ao bloco "${b.name}"`);
      if (typeof onNegotiation === 'function') onNegotiation(msg, true);
    } else {
      changeRel(n, -3); const msg = `${n.name} recusou o convite para o bloco "${b.name}".`; addLog(msg, 'dip');
      if (typeof onNegotiation === 'function') onNegotiation(msg, false);
    }
  }
  for (const n of ecoMembers()){
    if (n.rel < 5 && chance(0.08)){ b.members = b.members.filter(x => x !== n.id); addLog(`${n.name} deixou o bloco "${b.name}" — as relações azedaram.`, 'dip'); }
  }
};

// ---------- interface ----------
const _ebTags = nationTags;
nationTags = function(n){ return _ebTags(n) + (blocMember(n.id) ? `<span class="tag ally" title="${esc(ecoBloc().name)}">${ecoBloc().icon} BLOCO</span>` : ''); };

function ecoBlocPanelHTML(){
  const b = ecoBloc();
  if (!b && G.p.aiBloc) return '';   // já somos sócios de um bloco da IA (aparece em "Blocos do mundo")
  if (!b) return `<div class="sub">🌐 Bloco econômico</div><div class="box">
    <div class="muted">Una nações num mercado comum (como o Mercosul ou a União Europeia): comércio sem barreiras, mais crescimento e relações melhores. Pode ser também militar, com defesa mútua.</div>
    <button class="btn sm green" style="width:100%;margin-top:6px" data-blocact="found">🌐 Fundar um bloco (${fmtMoney(ECOBLOC.foundCost())})</button></div>`;
  const mem = ecoMembers();
  const k = mem.length;
  return `<div class="sub">${b.icon} ${esc(b.name)} <small class="muted">${b.mil ? 'econômico e militar' : 'econômico'} · ${k} membro${k===1?'':'s'}</small></div><div class="box">
    ${mem.map(n => `<div class="row"><span class="k">${flagImg(n,18,12)} ${esc(n.name)}</span><span class="v">${n.rel>0?'+':''}${n.rel} <button class="btn xs" data-blocact="kick" data-n="${n.id}" title="Expulsar">✖</button></span></div>`).join('') || '<div class="muted">Nenhum membro ainda. Abra a janela de uma nação e clique em “Convidar para o bloco”.</div>'}
    ${b.invites.map(x => `<div class="row"><span class="k">✉️ Convite — ${esc(G.nations[x.n].name)}</span><span class="v">${Math.max(1, x.due-G.turn)} m</span></div>`).join('')}
    ${k ? `<div class="row"><span class="k">💰 Renda do mercado comum</span><span class="v up">+${fmtMoney(ECOBLOC.income())}/mês</span></div>
    <div class="row"><span class="k">📈 Efeitos</span><span class="v">+${Math.round(Math.min(0.3,k*0.04)*100)}% comércio · +${fmtNum(Math.min(0.5,k*0.08),2)} pp crescimento${b.mil?` · +${Math.round(Math.min(0.2,k*0.025)*100)}% defesa`:''}</span></div>` : ''}
    <button class="btn xs" style="margin-top:6px" data-blocact="dissolve">Dissolver bloco</button></div>`;
}
const _ebPanel = panelDiplomacia;
panelDiplomacia = function(){
  const h = _ebPanel(), i = h.indexOf('<div class="filters">');
  return i < 0 ? ecoBlocPanelHTML() + h : h.slice(0, i) + ecoBlocPanelHTML() + h.slice(i);
};

// botões na janela de cada nação
const _ebOpen = openNation;
openNation = function(id){
  _ebOpen(id);
  const n = G.nations[id], b = ecoBloc(); if (!n || n.human || n.atWar) return;
  const m = $('#modal'), grid = m && m.querySelector('.btn-grid'); if (!grid) return;
  let html;
  if (!b) html = `<button class="btn sm" data-blocact="foundFrom" data-n="${id}" title="Funde um bloco para convidar esta nação">🌐 Criar bloco econômico</button>`;
  else if (blocMember(id)) html = `<button class="btn sm" data-blocact="kick" data-n="${id}">${b.icon} Expulsar do bloco</button>`;
  else { const why = ECOBLOC.inviteBlock(n);
    html = `<button class="btn sm" data-blocact="invite" data-n="${id}" ${why?'disabled':''} title="${esc(why || `Chance estimada: ${Math.round(ECOBLOC.chance(n)*100)}% · resposta em 2–4 meses`)}">${b.icon} Convidar para o bloco${ecoInviting(id)?' (em análise)':why?'':` (${Math.round(ECOBLOC.chance(n)*100)}%)`}</button>`; }
  grid.insertAdjacentHTML('beforeend', html);
};

function openFoundBloc(backTo){
  const p = G.p, mil0 = false;
  const name0 = `${pick(ECOBLOC_NAMES)} ${p.name.split(' ').pop()}`.slice(0, 40);
  const m = openModal(`<div class="m-icon">🌐</div><div class="m-title">Fundar bloco</div>
    <div class="m-text">Um bloco reúne nações que comerciam sem barreiras. Na versão militar, os membros também se defendem uns aos outros.</div>
    <label class="lbl">Nome do bloco</label><input type="text" id="eb-name" maxlength="40" value="${esc(name0)}" style="width:100%">
    <label class="lbl" style="margin-top:8px">Símbolo</label><div class="flex" id="eb-icons" style="gap:4px;flex-wrap:wrap">${ECOBLOC_ICONS.map((ic,i)=>`<button class="btn xs" data-ic="${ic}" style="font-size:18px;${i?'':'outline:3px solid var(--red2);'}">${ic}</button>`).join('')}</div>
    <label class="lbl" style="margin-top:8px">Tipo</label>
    <div class="deal-list">
      <label class="deal-opt"><div><b>⚓ Econômico</b><small>Mercado comum: renda extra, +comércio e +crescimento. Aceita nações com relação ≥ 25.</small></div><input type="radio" name="eb-type" value="eco" ${mil0?'':'checked'}></label>
      <label class="deal-opt"><div><b>🛡️ Econômico e militar</b><small>Tudo acima + defesa mútua: os membros entram nas nossas guerras e dão +defesa. Só aceita aliados militares ou relação ≥ 50, e é mais difícil de convencer.</small></div><input type="radio" name="eb-type" value="mil" ${mil0?'checked':''}></label>
    </div>
    <div class="m-actions"><button class="btn" id="eb-no">Cancelar</button><button class="btn green" id="eb-ok">Fundar (${fmtMoney(ECOBLOC.foundCost())})</button></div>`);
  let icon = ECOBLOC_ICONS[0];
  m.querySelectorAll('[data-ic]').forEach(b => b.onclick = () => { icon = b.dataset.ic; m.querySelectorAll('[data-ic]').forEach(x => x.style.outline = x === b ? '3px solid var(--red2)' : ''); SFX.click(); });
  m.querySelector('#eb-no').onclick = () => { SFX.click(); closeModal(); if (backTo) openNation(backTo); };
  m.querySelector('#eb-ok').onclick = () => {
    const mil = (m.querySelector('input[name="eb-type"]:checked')||{}).value === 'mil';
    const r = ECOBLOC.found(m.querySelector('#eb-name').value, icon, mil);
    if (!r.ok){ SFX.error(); toast(r.why, 'bad'); return; }
    SFX.fanfare(); toast(esc(r.msg), 'dip'); addLog(r.msg, 'dip'); closeModal(); refreshAll(); if (backTo) openNation(backTo);
  };
}

document.addEventListener('click', e => {
  const btn = e.target.closest && e.target.closest('[data-blocact]'); if (!btn || btn.disabled || !G) return;
  const a = btn.dataset.blocact, n = btn.dataset.n ? G.nations[+btn.dataset.n] : null;
  if (a === 'found'){ SFX.click(); openFoundBloc(null); return; }
  if (a === 'foundFrom'){ SFX.click(); openFoundBloc(n.id); return; }
  if (a === 'dissolve'){ confirmModal('🌐', 'Dissolver o bloco?', 'Todos os membros perdem os benefícios e ficam desapontados (−10 relação).', 'Dissolver', () => { const r = ECOBLOC.dissolve(); addLog(r.msg, 'dip'); toast(esc(r.msg), 'dip'); refreshAll(); }, true); return; }
  const r = a === 'invite' ? ECOBLOC.invite(n) : a === 'kick' ? ECOBLOC.kick(n) : null; if (!r) return;
  if (r.ok){ SFX.page(); toast(esc(r.msg), 'dip'); addLog(r.msg, 'dip'); } else { SFX.error(); toast(esc(r.why), 'bad'); }
  refreshAll(); if (UI.modalOpen && $('#modal').querySelector('[data-dip="close"]')) openNation(n.id);
});
