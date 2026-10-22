// ============================================================
//  IMPERIUM — Blocos econômicos entre jogadores (online)
//  • Quem fundou o bloco convida outros jogadores pelo painel 👥
//  • O convidado aceita ou recusa; o fundador mantém a lista e
//    a envia a todos os sócios (mensagem "blocSync")
//  • Sócios humanos ganham renda, comércio e crescimento como os
//    da IA; no bloco militar, um sócio atacado pede ajuda aos outros
// ============================================================
'use strict';

const myUid = () => NET.user && NET.user.uid;
function hbBusy(){ return !!(ecoBloc() || G.hBloc || G.p.aiBloc); }   // já estamos em algum bloco

// o fundador envia a composição atual a todos os sócios humanos
function hbBroadcast(){
  const b = ecoBloc(); if (!b || !G.online) return;
  b.humans = b.humans || [];
  const bloc = {name:b.name, icon:b.icon, mil:b.mil, founder:myUid(), founderName:G.p.name, uids:[myUid()].concat(b.humans), ai:b.members.slice()};
  b._sig = JSON.stringify([bloc.uids, bloc.ai, bloc.name, bloc.mil]);
  for (const u of b.humans) sendMail(u, 'blocSync', {bloc});
}

const HB = {
  invite(uid){
    const b = ecoBloc(), n = humanByUid(uid);
    if (!b) return {ok:false, why:'Funde um bloco primeiro (aba Diplomacia).'};
    if (!n) return {ok:false, why:'Jogador não encontrado.'};
    b.humans = b.humans || []; b.humanInvites = b.humanInvites || [];
    if (b.humans.includes(uid)) return {ok:false, why:`${n.name} já é sócio.`};
    if (b.humanInvites.includes(uid)) return {ok:false, why:'Convite já enviado. Aguarde a resposta.'};
    if (n.atWar) return {ok:false, why:'Estamos em guerra com esse jogador.'};
    if (b.members.length + b.humans.length >= 12) return {ok:false, why:'O bloco já tem o máximo de 12 membros.'};
    b.humanInvites.push(uid);
    sendMail(uid, 'blocInvite', {bloc:{name:b.name, icon:b.icon, mil:b.mil, size:b.members.length + b.humans.length + 1}});
    return {ok:true, msg:`Convite para o bloco "${b.name}" enviado a ${n.name}.`};
  },
  kick(uid){
    const b = ecoBloc(); if (!b) return {ok:false, why:'Não lideramos um bloco.'};
    const n = humanByUid(uid); b.humans = (b.humans||[]).filter(u => u !== uid);
    sendMail(uid, 'blocSync', {kicked:true, name:b.name}); hbBroadcast();
    return {ok:true, msg:`${n ? n.name : 'O jogador'} foi expulso do bloco "${b.name}".`};
  },
  leave(){
    const h = G.hBloc; if (!h) return {ok:false, why:'Não estamos no bloco de outro jogador.'};
    G.hBloc = null; sendMail(h.founder, 'blocLeave', {});
    return {ok:true, msg:`Saímos do bloco "${h.name}".`};
  }
};

// fundar o bloco já com um jogador para convidar
const _hbFound = ECOBLOC.found;
ECOBLOC.found = function(){
  const r = _hbFound.apply(this, arguments);
  if (r.ok && UI.hbInviteAfter){ const u = UI.hbInviteAfter; UI.hbInviteAfter = null; const r2 = HB.invite(u); if (r2.ok) r.msg += ' ' + r2.msg; }
  return r;
};
// dissolver avisa os sócios humanos
const _hbDissolve = ECOBLOC.dissolve;
ECOBLOC.dissolve = function(){
  const b = ecoBloc(), humans = b ? (b.humans||[]).slice() : [];
  const r = _hbDissolve.apply(this, arguments);
  if (r.ok && G.online) for (const u of humans) sendMail(u, 'blocSync', {dissolved:true, name:b.name});
  return r;
};

// ---------- mensagens entre jogadores ----------
const _hbMail = handleMail;
handleMail = function(ev){
  if (!/^bloc/.test(ev.type)) return _hbMail(ev);
  const n = humanByUid(ev.from), who = n ? n.name : (ev.fromName || 'Outro jogador');
  if (ev.type === 'blocInvite'){
    const B = ev.bloc || {}; SFX.event();
    if (hbBusy()){
      const why = ecoBloc() ? 'já lideramos o nosso próprio bloco' : 'já fazemos parte de outro bloco';
      const m = openModal(`<div class="m-icon">${esc(B.icon||'🌐')}</div><div class="m-title">Convite de ${esc(who)}</div><div class="m-text">${esc(who)} nos convida para o bloco "<b>${esc(B.name)}</b>", mas ${why}. Para aceitar, saia do bloco atual primeiro.</div><div class="m-actions"><button class="btn" id="hb-no">Recusar</button></div>`);
      m.querySelector('#hb-no').onclick = () => { closeModal(); sendMail(ev.from, 'blocReply', {ok:false}); };
      return;
    }
    const m = openModal(`<div class="m-icon">${esc(B.icon||'🌐')}</div><div class="m-title">Convite para um bloco</div>
      <div class="m-text"><b>${esc(who)}</b> convida ${esc(G.p.name)} para o bloco "<b>${esc(B.name)}</b>" (${B.size||1} membro${(B.size||1) === 1 ? '' : 's'}).
      ${B.mil ? 'É um bloco <b>econômico e militar</b>: os sócios pedem ajuda uns aos outros quando são atacados.' : 'É um <b>mercado comum</b>: comércio sem barreiras entre os sócios.'}<br><br>
      Ganhamos renda do mercado comum, +comércio e +crescimento por sócio.</div>
      <div class="m-actions"><button class="btn" id="hb-no">Recusar</button><button class="btn green" id="hb-yes">Entrar no bloco</button></div>`);
    m.querySelector('#hb-no').onclick = () => { SFX.click(); closeModal(); sendMail(ev.from, 'blocReply', {ok:false}); };
    m.querySelector('#hb-yes').onclick = () => {
      SFX.fanfare(); closeModal();
      if (hbBusy()){ toast('Já estamos em um bloco.', 'bad'); sendMail(ev.from, 'blocReply', {ok:false}); return; }
      // entra já com a composição conhecida; o fundador confirma em seguida (blocSync)
      G.hBloc = {name:B.name, icon:B.icon||'🌐', mil:!!B.mil, founder:ev.from, founderName:who, uids:[ev.from, myUid()], ai:[]};
      sendMail(ev.from, 'blocReply', {ok:true}); addLog(`${B.icon||'🌐'} Entramos no bloco "${B.name}" de ${who}.`, 'dip'); refreshAll();
    };
    return;
  }
  if (ev.type === 'blocReply'){
    const b = ecoBloc(); if (!b) return;
    b.humanInvites = (b.humanInvites||[]).filter(u => u !== ev.from);
    if (ev.ok && !(b.humans||[]).includes(ev.from)){ b.humans = (b.humans||[]).concat([ev.from]); SFX.bell(); toast(`${esc(b.icon)} ${esc(who)} entrou no bloco "${esc(b.name)}"!`, 'good'); addLog(`${b.icon} ${who} entrou no bloco "${b.name}".`, 'dip'); hbBroadcast(); }
    else if (!ev.ok){ SFX.error(); toast(`${esc(who)} recusou o convite para o bloco.`, 'bad'); }
    refreshAll(); return;
  }
  if (ev.type === 'blocLeave'){
    const b = ecoBloc(); if (!b) return;
    b.humans = (b.humans||[]).filter(u => u !== ev.from); toast(`${esc(who)} saiu do bloco "${esc(b.name)}".`, 'bad'); addLog(`${who} saiu do bloco "${b.name}".`, 'dip'); hbBroadcast(); refreshAll(); return;
  }
  if (ev.type === 'blocSync'){
    if (ecoBloc()) return;   // somos fundadores de outro bloco: ignora
    if (ev.dissolved || ev.kicked){
      if (G.hBloc && G.hBloc.founder === ev.from){ G.hBloc = null; toast(ev.dissolved ? `O bloco "${esc(ev.name)}" foi dissolvido por ${esc(who)}.` : `Fomos expulsos do bloco "${esc(ev.name)}".`, 'bad'); addLog(ev.dissolved ? `O bloco "${ev.name}" foi dissolvido.` : `Fomos expulsos do bloco "${ev.name}".`, 'dip'); refreshAll(); }
      return;
    }
    const B = ev.bloc; if (!B || !B.uids.includes(myUid())) return;
    if (G.hBloc && G.hBloc.founder !== ev.from) return;   // de outro bloco
    G.hBloc = {name:B.name, icon:B.icon, mil:!!B.mil, founder:B.founder, founderName:B.founderName || who, uids:B.uids.slice(), ai:(B.ai||[]).slice()};
    refreshAll(); return;
  }
  if (ev.type === 'blocWar'){
    const e = G.nations[ev.enemy], info = blocInfo();
    if (!e || !e.alive || e.atWar || !info || !info.mil) return;
    SFX.alarm();
    const m = openModal(`<div class="m-icon">🛡️</div><div class="m-title">${esc(who)} pede ajuda</div>
      <div class="m-text">${esc(e.name)} atacou ${esc(who)}, nosso sócio no bloco "<b>${esc(info.name)}</b>". Pelo pacto de defesa, ele pede que entremos na guerra.</div>
      <div class="m-actions"><button class="btn" id="hw-no">Ficar de fora</button><button class="btn primary" id="hw-yes">Declarar guerra a ${esc(e.name)}</button></div>`);
    m.querySelector('#hw-no').onclick = () => { SFX.click(); closeModal(); sendMail(ev.from, 'msg', {text:`Não vamos entrar na guerra contra ${e.name} agora.`}); };
    m.querySelector('#hw-yes').onclick = () => { closeModal(); declareWar(e.id, false); SFX.warDeclared(); bigBanner('GUERRA!', `${esc(G.p.name)} × ${esc(e.name)}`); sendMail(ev.from, 'msg', {text:`Entramos na guerra contra ${e.name} ao seu lado!`}); refreshAll(); publishPlayer(); };
    return;
  }
};

// ---------- sermos atacados num bloco militar: pedimos ajuda aos sócios humanos ----------
const _hbDeclare = declareWar;
declareWar = function(id, byAI){
  const n = G.nations[id], was = n && n.atWar;
  _hbDeclare(id, byAI);
  const info = blocInfo();
  if (!G.online || !byAI || was || !n || !n.atWar || n.human || !info || !info.mil) return;
  for (const h of blocHumanNations()) sendMail(h.uid, 'blocWar', {enemy:id});
};

// ---------- passagem do mês: o fundador reenvia a lista se os sócios da IA mudarem ----------
const _hbEnd = endTurn;
endTurn = function(){
  _hbEnd.apply(this, arguments);
  const b = ecoBloc(); if (!G || !G.online || !b || !(b.humans||[]).length) return;
  const sig = JSON.stringify([[myUid()].concat(b.humans), b.members, b.name, b.mil]);
  if (sig !== b._sig) hbBroadcast();
};

// ---------- interface ----------
function hBlocMemberHTML(){
  const h = G.hBloc, me = myUid(), ai = blocAINations(), hum = blocHumanNations(), k = ai.length + hum.length;
  return `<div class="sub">${esc(h.icon)} ${esc(h.name)} <small class="muted">${h.mil ? 'econômico e militar' : 'econômico'} · bloco de ${esc(h.founderName || 'outro jogador')}</small></div><div class="box">
    ${hum.map(n => `<div class="row"><span class="k">${flagImg(n,18,12)} ${esc(n.name)} <small class="badge">jogador</small>${n.uid === h.founder ? ' 👑' : ''}</span><span class="v"></span></div>`).join('')}
    ${ai.map(n => `<div class="row"><span class="k">${flagImg(n,18,12)} ${esc(n.name)}</span><span class="v">${n.rel>0?'+':''}${n.rel}</span></div>`).join('')}
    ${k ? `<div class="row"><span class="k">💰 Renda do mercado comum</span><span class="v up">+${fmtMoney(ECOBLOC.income())}/mês</span></div>
    <div class="row"><span class="k">📈 Efeitos</span><span class="v">+${Math.round(Math.min(0.3,k*0.04)*100)}% comércio · +${fmtNum(Math.min(0.5,k*0.08),2)} pp crescimento${h.mil?` · +${Math.round(Math.min(0.2,k*0.025)*100)}% defesa`:''}</span></div>` : ''}
    <button class="btn xs" style="margin-top:6px" data-hbloc="leave">Sair do bloco</button></div>`;
}

// tag nos jogadores sócios
const _hbTags = nationTags;
nationTags = function(n){
  const info = blocInfo();
  return _hbTags(n) + (n && n.human && info && blocHumanNations().includes(n) ? `<span class="tag ally" title="${esc(info.name)}">${esc(info.icon)} BLOCO</span>` : '');
};

// botões no painel 👥 de jogadores
const _hbPlayers = openPlayersPanel;
openPlayersPanel = function(){
  _hbPlayers();
  const m = $('#modal'); if (!m) return;
  const b = ecoBloc(), info = blocInfo(), partners = blocHumanNations();
  m.querySelectorAll('[data-hp="msg"][data-u]').forEach(btn => {
    const uid = btn.dataset.u, n = humanByUid(uid); if (!n) return;
    let html = '';
    if (b){
      if ((b.humans||[]).includes(uid)) html = `<button class="btn xs" data-hbloc="kick" data-u="${uid}">${esc(b.icon)} Expulsar do bloco</button>`;
      else if ((b.humanInvites||[]).includes(uid)) html = `<button class="btn xs" disabled>${esc(b.icon)} Convite enviado</button>`;
      else html = `<button class="btn xs green" data-hbloc="invite" data-u="${uid}" ${n.atWar ? 'disabled' : ''}>${esc(b.icon)} Convidar para o bloco</button>`;
    } else if (info && partners.includes(n)) html = `<button class="btn xs" disabled>${esc(info.icon)} Sócio do bloco</button>`;
    else if (!hbBusy()) html = `<button class="btn xs green" data-hbloc="found" data-u="${uid}" ${n.atWar ? 'disabled' : ''}>🌐 Criar bloco e convidar</button>`;
    btn.insertAdjacentHTML('beforebegin', html);
  });
};

document.addEventListener('click', e => {
  const btn = e.target.closest && e.target.closest('[data-hbloc]'); if (!btn || btn.disabled || !G || !G.online) return;
  const a = btn.dataset.hbloc, uid = btn.dataset.u;
  if (a === 'found'){ SFX.click(); UI.hbInviteAfter = uid; closeModal(); openFoundBloc(null); return; }
  if (a === 'leave'){ confirmModal('🌐', 'Sair do bloco?', 'Perdemos a renda do mercado comum e os bônus de comércio e crescimento.', 'Sair', () => { const r = HB.leave(); toast(esc(r.ok ? r.msg : r.why), r.ok ? 'dip' : 'bad'); if (r.ok) addLog(r.msg, 'dip'); refreshAll(); }, true); return; }
  const r = a === 'invite' ? HB.invite(uid) : a === 'kick' ? HB.kick(uid) : null; if (!r) return;
  if (r.ok){ SFX.page(); toast(esc(r.msg), 'dip'); addLog(r.msg, 'dip'); } else { SFX.error(); toast(esc(r.why), 'bad'); }
  refreshAll(); if (UI.modalOpen && $('#modal').querySelector('#pl-x')) openPlayersPanel();
});
