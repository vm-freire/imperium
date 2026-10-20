// ============================================================
//  IMPERIUM — Multiplayer online
//  Login · salas com código · lobby · turnos sincronizados (sem pausa)
//  O anfitrião (host) é a autoridade do mundo: ele avança os meses,
//  move a IA e publica o mapa. Cada jogador simula a própria nação.
// ============================================================
'use strict';

const SPEEDS = {20:'Relâmpago (20 s por mês)', 45:'Rápida (45 s por mês)', 60:'Normal (1 min por mês)', 120:'Calma (2 min por mês)', 300:'Estratégica (5 min por mês)'};
const ON = { room:null, players:{}, subs:[], timer:null, hbTimer:null, pending:[], evSeen:new Set(), snapPower:{}, applying:false, inGame:false, lastSave:-1 };

// ------------------------------------------------------------
//  Login e cadastro
// ------------------------------------------------------------
async function openOnline(){
  SFX.init(); await NET.init();
  if (!NET.user) return openLogin();
  openOnlineHub();
}
function openLogin(tab){
  tab = tab || 'entrar';
  const m = openModal(`<div class="m-icon">🌐</div><div class="m-title">Imperium Online</div>
    ${NET.isLocal() ? '<div class="tip">🧪 <b>Modo de teste local</b>: o Supabase ainda não foi configurado (veja COMO_PUBLICAR.md). Contas e salas funcionam só entre abas deste navegador.</div>' : ''}
    <div class="seg" style="margin:8px 0"><button data-lt="entrar" class="${tab==='entrar'?'active':''}">Entrar</button><button data-lt="criar" class="${tab==='criar'?'active':''}">Criar conta</button></div>
    ${tab==='criar' ? `<div class="field"><label>Nome</label><input type="text" id="lg-name" maxlength="24" placeholder="Como os outros jogadores vão te ver"></div>` : ''}
    <div class="field"><label>E-mail</label><input type="text" id="lg-email" autocomplete="email" placeholder="voce@email.com"></div>
    <div class="field"><label>Senha</label><input type="password" id="lg-pass" autocomplete="${tab==='criar'?'new-password':'current-password'}" placeholder="mínimo de 8 caracteres"></div>
    ${tab==='criar' ? `<div class="field"><label>Confirmar senha</label><input type="password" id="lg-pass2" autocomplete="new-password"></div>` : ''}
    <div class="c-hint" id="lg-err" style="text-align:left"></div>
    <div class="m-actions"><button class="btn" id="lg-x">Voltar</button><button class="btn green" id="lg-ok">${tab==='criar'?'Criar conta':'Entrar'}</button></div>`);
  m.querySelectorAll('[data-lt]').forEach(b=> b.onclick = ()=>{ SFX.click(); openLogin(b.dataset.lt); });
  m.querySelector('#lg-x').onclick = ()=>{ SFX.click(); closeModal(); };
  const go = async ()=>{
    const err = m.querySelector('#lg-err'); err.textContent = '';
    const email = m.querySelector('#lg-email').value, pass = m.querySelector('#lg-pass').value;
    try {
      if (tab === 'criar'){
        const name = m.querySelector('#lg-name').value.trim();
        if (!name) throw new Error('Informe seu nome.');
        if (pass.length < 8) throw new Error('A senha precisa ter pelo menos 8 caracteres.');
        if (pass !== m.querySelector('#lg-pass2').value) throw new Error('As senhas não conferem.');
        NET.user = await NET.be.signUp(name, email, pass);
      } else NET.user = await NET.be.signIn(email, pass);
      SFX.fanfare(); closeModal(); await syncTrophiesFromProfile(); openOnlineHub();
    } catch(e){ SFX.error(); err.textContent = e.message; }
  };
  m.querySelector('#lg-ok').onclick = go;
  m.querySelectorAll('input').forEach(i=> i.onkeydown = e=>{ if (e.key === 'Enter') go(); });
}
async function syncTrophiesFromProfile(){
  try { const prof = await NET.be.getProfile(NET.user.uid); const t = Object.assign({}, prof.trophies||{}, getTrophies()); localStorage.setItem(TROPHY_KEY, JSON.stringify(t)); await NET.be.saveTrophies(NET.user.uid, t); } catch(e){ console.warn(e); }
}

// ------------------------------------------------------------
//  Central online: salas
// ------------------------------------------------------------
async function openOnlineHub(){
  const rooms = (await NET.be.listMyRooms(NET.user.uid)).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
  const st = {lobby:'🟡 Montando a sala', running:'🟢 Em andamento', stopped:'⏸ Sessão encerrada'};
  showPage('🌐 Imperium Online', `
    <div class="flex" style="justify-content:space-between;flex-wrap:wrap;gap:10px">
      <div style="font-size:17px">Olá, <b>${esc(NET.user.name)}</b> <span class="muted">(${esc(NET.user.email)})</span>${NET.isLocal()?' <span class="badge ab">TESTE LOCAL</span>':''}</div>
      <div class="flex"><button class="btn green" id="oh-new">➕ Criar sala</button><button class="btn" id="oh-code">🔑 Entrar com código</button><button class="btn" id="oh-out">Sair da conta</button></div></div>
    <div class="section-title">Minhas salas</div>
    ${rooms.length ? `<div class="hist-list">${rooms.map(r=>`<div class="hist-card" data-room="${r.code}" style="grid-template-columns:1fr">
      <div><div class="nm">${esc(r.name)} <span class="muted" style="font-size:13px">#${r.code}</span></div>
      <div class="meta">${st[r.status]||r.status} · ${Object.keys(r.members||{}).length}/${r.maxPlayers} jogadores · ${r.mode==='objetivos'?'🎯 Com objetivos':'🕊️ Modo livre'} · ${ERAS[r.era].year}<br>
      Anfitrião: ${esc((r.members[r.host]||{}).name||'?')} ${r.turn?`· mês ${r.turn}`:''}<br>${Object.values(r.members||{}).map(x=>esc(x.name)).join(', ')}</div></div></div>`).join('')}</div>`
      : '<div class="muted" style="padding:20px 0">Você ainda não participa de nenhuma sala. Crie uma ou entre com o código que um amigo te passou.</div>'}
    <div class="section-title">Como funciona</div>
    <div class="help-sec"><section><p>Até <b>5 jogadores</b> no mesmo mapa. O <b>anfitrião</b> cria a sala e compartilha o código. A sala fica guardada com os mesmos jogadores: na próxima vez, o anfitrião só começa quando todos estiverem presentes — ou decide começar sem os que faltam.</p>
    <p>No online <b>não há pausa</b>: o mês avança sozinho no ritmo escolhido pelo anfitrião. Cada jogador toma suas decisões, pode se aliar, negociar ou guerrear com os outros. Regimes diferentes atrapalham os acordos (comércio rende menos entre regimes opostos).</p></section></div>`);
  $('#oh-new').onclick = ()=>{ SFX.page(); openCreateRoom(); };
  $('#oh-code').onclick = ()=>{ SFX.page(); openJoinRoom(); };
  $('#oh-out').onclick = async ()=>{ await NET.be.signOut(); NET.user = null; SFX.click(); $('#scr-page').classList.add('hidden'); toast('Você saiu da conta.'); };
  $$('[data-room]').forEach(c=> c.onclick = ()=>{ SFX.page(); openLobby(c.dataset.room); });
}
function openCreateRoom(){
  const m = openModal(`<div class="m-icon">➕</div><div class="m-title">Criar sala</div>
    <div class="field"><label>Nome da sala</label><input type="text" id="cr-name" maxlength="30" value="Mundo de ${esc(NET.user.name)}"></div>
    <div class="grid2" style="gap:10px">
      <div class="field"><label>Jogadores</label><select id="cr-max">${[2,3,4,5].map(n=>`<option ${n===4?'selected':''}>${n}</option>`).join('')}</select></div>
      <div class="field"><label>Época</label><select id="cr-era">${Object.entries(ERAS).map(([k,e])=>`<option value="${k}" ${k==='1914'?'selected':''}>${e.year} — ${e.name}</option>`).join('')}</select></div>
      <div class="field"><label>Modo</label><select id="cr-mode"><option value="objetivos">🎯 Com objetivos</option><option value="livre">🕊️ Livre</option></select></div>
      <div class="field"><label>Velocidade</label><select id="cr-speed">${Object.entries(SPEEDS).map(([k,v])=>`<option value="${k}" ${k==='60'?'selected':''}>${v}</option>`).join('')}</select></div>
    </div>
    <div class="m-actions"><button class="btn" id="cr-x">Cancelar</button><button class="btn green" id="cr-ok">Criar sala</button></div>`);
  m.querySelector('#cr-x').onclick = ()=>{ SFX.click(); closeModal(); };
  m.querySelector('#cr-ok').onclick = async ()=>{
    const u = NET.user;
    const room = {name: m.querySelector('#cr-name').value.trim() || 'Sala', host:u.uid, maxPlayers:+m.querySelector('#cr-max').value, era:+m.querySelector('#cr-era').value,
      mode:m.querySelector('#cr-mode').value, speed:+m.querySelector('#cr-speed').value, status:'lobby', turn:0, createdAt:Date.now(), updatedAt:Date.now(),
      members:{[u.uid]:{name:u.name, slot:0, joinedAt:Date.now()}}, memberUids:[u.uid]};
    const code = await NET.be.createRoom(room);
    closeModal(); SFX.fanfare(); openLobby(code);
  };
}
function openJoinRoom(){
  const m = openModal(`<div class="m-icon">🔑</div><div class="m-title">Entrar com código</div>
    <div class="field"><label>Código da sala</label><input type="text" id="jr-code" maxlength="6" style="text-transform:uppercase;font-size:24px;letter-spacing:6px;text-align:center" placeholder="ABC123"></div>
    <div class="c-hint" id="jr-err" style="text-align:left"></div>
    <div class="m-actions"><button class="btn" id="jr-x">Cancelar</button><button class="btn green" id="jr-ok">Entrar</button></div>`);
  m.querySelector('#jr-x').onclick = ()=>{ SFX.click(); closeModal(); };
  m.querySelector('#jr-ok').onclick = async ()=>{
    const code = m.querySelector('#jr-code').value.trim().toUpperCase(), err = m.querySelector('#jr-err');
    const r = await NET.be.getRoom(code); const u = NET.user;
    if (!r){ err.textContent = 'Sala não encontrada.'; SFX.error(); return; }
    if (!r.members[u.uid]){
      if (r.status !== 'lobby'){ err.textContent = 'Esta partida já começou e só aceita os jogadores originais.'; SFX.error(); return; }
      const used = Object.values(r.members).map(x=>x.slot);
      if (used.length >= r.maxPlayers){ err.textContent = 'A sala está cheia.'; SFX.error(); return; }
      let slot = 0; while (used.includes(slot)) slot++;
      await NET.be.updateRoom(code, {members:{[u.uid]:{name:u.name, slot, joinedAt:Date.now()}}, memberUids:r.memberUids.concat([u.uid]), updatedAt:Date.now()});
    }
    closeModal(); SFX.fanfare(); openLobby(code);
  };
}

// ------------------------------------------------------------
//  Lobby
// ------------------------------------------------------------
function unsubAll(){ ON.subs.forEach(f=>{ try { f(); } catch(e){} }); ON.subs = []; clearInterval(ON.timer); clearInterval(ON.hbTimer); ON.timer = ON.hbTimer = null; }
const isOnlineNow = pl => pl && Date.now() - (pl.lastSeen||0) < 40000;
function heartbeat(code){ const u = NET.user; NET.be.setPlayer(code, u.uid, {uid:u.uid, name:u.name, lastSeen:Date.now()}); }
async function openLobby(code){
  unsubAll(); ON.inGame = false;
  ON.room = await NET.be.getRoom(code); if (!ON.room){ toast('Sala não encontrada.', 'bad'); return; }
  heartbeat(code); ON.hbTimer = setInterval(()=>heartbeat(code), 15000);
  const render = ()=>{ if (!ON.inGame && !$('#scr-page').classList.contains('hidden') && $('#page-title').textContent.includes('Sala')) renderLobby(); };
  ON.subs.push(NET.be.watchRoom(code, r=>{ ON.room = r; if (!r) return; render(); maybeEnterGame(); }));
  ON.subs.push(NET.be.watchPlayers(code, pl=>{ ON.players = pl; if (ON.inGame) syncHumans(); render(); }));
  renderLobby();
}
function renderLobby(){
  const r = ON.room, u = NET.user, isHost = r.host === u.uid;
  const members = Object.entries(r.members).sort((a,b)=>a[1].slot-b[1].slot);
  const missing = members.filter(([uid])=>!isOnlineNow(ON.players[uid]));
  const me = ON.players[u.uid] || {};
  showPage(`🌐 Sala: ${esc(r.name)}`, `
    <div class="flex" style="justify-content:space-between;flex-wrap:wrap;gap:12px">
      <div><div class="lbl">Código para convidar</div><div class="room-code">${r.code}</div><button class="btn xs" id="lb-copy">📋 Copiar código</button></div>
      <div class="box" style="min-width:260px">${row('Status', r.status==='lobby'?'🟡 Montando':r.status==='running'?'🟢 Em andamento':'⏸ Encerrada')}${row('Modo', r.mode==='objetivos'?'🎯 Com objetivos':'🕊️ Livre')}${row('Época', ERAS[r.era].year + ' — ' + ERAS[r.era].name)}${row('Velocidade', SPEEDS[r.speed])}${r.turn?row('Mês', r.turn):''}</div>
    </div>
    <div class="section-title">Jogadores (${members.length}/${r.maxPlayers})</div>
    ${members.map(([uid, mb])=>{ const pl = ON.players[uid] || {}, c = pl.cfg;
      return `<div class="slot"><canvas width="66" height="44" data-lf="${uid}"></canvas><div class="slot-info"><b>${esc(mb.name)} ${uid===r.host?'👑':''}${uid===u.uid?' (você)':''}</b>
        <small>${c ? `${esc(c.name)} · ${GOVS[c.gov].name}${c.existing?' · país existente':' · nação nova'}` : '⏳ ainda escolhendo a nação'}</small></div>
        <span class="${isOnlineNow(pl)?'up':'down'}" style="font-weight:bold">${isOnlineNow(pl)?'● online':'○ offline'}</span></div>`; }).join('')}
    ${Array.from({length:r.maxPlayers-members.length}, ()=>`<div class="slot empty"><span class="slot-n">+</span><div class="slot-info"><b>Vaga livre</b><small>Passe o código ${r.code} para um amigo</small></div></div>`).join('')}
    <div class="m-actions" style="justify-content:flex-start;margin-top:14px">
      ${r.status==='lobby' ? `<button class="btn green" id="lb-nation">${me.cfg?'✏️ Mudar minha nação':'🏰 Escolher minha nação'}</button>` : ''}
      ${isHost ? `<button class="btn primary" id="lb-start">${r.status==='lobby'?'▶ Iniciar partida':'▶ Retomar partida'}</button>` : `<span class="muted">${r.status==='lobby'?'Aguardando o anfitrião iniciar...':r.status==='running'?'Partida em andamento — entrando...':'Aguardando o anfitrião retomar a partida.'}</span>`}
      ${r.status!=='lobby' && r.status==='running' ? `<button class="btn green" id="lb-enter">🌍 Entrar no mundo</button>` : ''}
      <button class="btn" id="lb-back">← Minhas salas</button>
    </div>
    ${missing.length && r.status!=='lobby' ? `<div class="tip">Faltam ${missing.length} jogador(es) online: ${missing.map(([,mb])=>esc(mb.name)).join(', ')}.</div>` : ''}`);
  $$('[data-lf]').forEach(cv=>{ const c = (ON.players[cv.dataset.lf]||{}).cfg; if (c) drawFlag(cv.getContext('2d'), c.flag, 0, 0, 66, 44); });
  $('#lb-copy').onclick = ()=>{ navigator.clipboard && navigator.clipboard.writeText(r.code); toast('Código copiado: ' + r.code, 'good'); };
  const nb = $('#lb-nation'); if (nb) nb.onclick = ()=>{ SFX.page(); chooseOnlineNation(); };
  const sb = $('#lb-start'); if (sb) sb.onclick = ()=>hostStart();
  const eb = $('#lb-enter'); if (eb) eb.onclick = ()=>maybeEnterGame(true);
  $('#lb-back').onclick = ()=>{ unsubAll(); SFX.click(); openOnlineHub(); };
}
function takenNations(){ return Object.entries(ON.players).filter(([uid, pl])=>uid !== NET.user.uid && pl.cfg && pl.cfg.existing).map(([,pl])=>pl.cfg.existing); }
function chooseOnlineNation(){
  const m = openModal(`<div class="m-icon">🏰</div><div class="m-title">Sua nação nesta sala</div>
    <div class="mode-cards"><div class="mode-card" id="on-new"><div class="ic">✒️</div><b>Criar uma nova nação</b><span>Desenhe as fronteiras e escolha onde fica no mapa.</span></div>
    <div class="mode-card" id="on-ex"><div class="ic">🌍</div><b>Governar um país existente</b><span>Países já escolhidos por outros jogadores ficam bloqueados.</span></div></div>
    <div class="m-actions"><button class="btn" id="on-x">Voltar</button></div>`, {wide:true});
  const start = (mode)=>{ closeModal(); C.mode = mode; C.gameMode = ON.room.mode; C.onlineRoom = ON.room.code; openCreate(false); C.cfg.era = ON.room.era; C.cfg.gameMode = ON.room.mode; renderStep(); };
  m.querySelector('#on-new').onclick = ()=>start('new');
  m.querySelector('#on-ex').onclick = ()=>start('existing');
  m.querySelector('#on-x').onclick = ()=>{ SFX.click(); closeModal(); };
}
// chamada pelo assistente de criação ao terminar
async function saveOnlineCfg(cfg){
  const code = C.onlineRoom; C.onlineRoom = null;
  const clean = JSON.parse(JSON.stringify(cfg)); delete clean.online;
  await NET.be.setPlayer(code, NET.user.uid, {cfg:clean, ready:true, lastSeen:Date.now(), name:NET.user.name});
  MapView.placement = null; hideAllScreens(); $('#scr-menu').classList.remove('hidden');
  toast('Nação registrada na sala!', 'good'); openLobby(code);
}
async function hostStart(){
  const r = ON.room, members = Object.entries(r.members);
  const noCfg = members.filter(([uid])=>!(ON.players[uid]||{}).cfg);
  if (r.status === 'lobby' && noCfg.length){
    if (noCfg.some(([uid])=>uid===r.host)){ SFX.error(); toast('Escolha sua nação antes de iniciar.', 'bad'); return; }
    confirmModal('⚠️', 'Jogadores sem nação', `${noCfg.map(([,mb])=>esc(mb.name)).join(', ')} ainda não escolheu(eram) a nação e ficarão de fora desta partida. Iniciar mesmo assim?`, 'Iniciar sem eles', ()=>doHostStart(noCfg.map(([uid])=>uid)), true);
    return;
  }
  const missing = members.filter(([uid])=>uid !== r.host && !isOnlineNow(ON.players[uid]));
  if (missing.length){ confirmModal('⚠️', 'A sala não está completa', `Faltam ${missing.length} jogador(es): ${missing.map(([,mb])=>esc(mb.name)).join(', ')}. Sem eles, as nações deles ficam paradas enquanto o mundo avança. Tem certeza que quer ${r.status==='lobby'?'iniciar':'retomar'}?`, 'Sim, jogar mesmo assim', ()=>doHostStart([]), true); return; }
  doHostStart([]);
}
async function doHostStart(exclude){
  const r = ON.room;
  if (r.status === 'lobby'){
    const humans = Object.entries(r.members).filter(([uid])=>!exclude.includes(uid) && (ON.players[uid]||{}).cfg).map(([uid, mb])=>({uid, name:mb.name, slot:mb.slot}));
    await NET.be.updateRoom(r.code, {status:'running', seed:(Date.now() % 2147483647) || 77, turn:0, humans, startedAt:Date.now(), nextTick:Date.now() + r.speed*1000 + 8000, updatedAt:Date.now()});
  } else await NET.be.updateRoom(r.code, {status:'running', nextTick:Date.now() + r.speed*1000 + 5000, updatedAt:Date.now()});
  SFX.fanfare();
}

// ------------------------------------------------------------
//  Entrar no mundo
// ------------------------------------------------------------
async function maybeEnterGame(force){
  const r = ON.room; if (!r || r.status !== 'running' || ON.inGame) return;
  if (!(r.humans||[]).some(h=>h.uid === NET.user.uid)){ if (force) toast('Você não faz parte desta partida.', 'bad'); return; }
  ON.inGame = true;
  const code = r.code, uid = NET.user.uid;
  let loaded = false;
  const save = await NET.be.getSave(code, uid);
  if (save){
    try { const data = JSON.parse(save); G = data; G.pendingEvents = G.pendingEvents || []; loaded = true; } catch(e){ console.warn(e); }
  }
  if (!loaded){
    const humans = r.humans.map(h=>({uid:h.uid, name:h.name, slot:h.slot, cfg:(ON.players[h.uid]||{}).cfg})).filter(h=>h.cfg);
    const me = humans.find(h=>h.uid === uid);
    const cfg = Object.assign({}, JSON.parse(JSON.stringify(me.cfg)), {online:{code, slot:me.slot, host:r.host===uid, humans, seed:r.seed}});
    newGame(cfg);
  } else {
    // reconstrói o mapa base (terras dos jogadores) a partir das configurações
    const polys = r.humans.map(h=>((ON.players[h.uid]||{}).cfg||{}).homePoly).filter(Boolean);
    Grid.buildLand(polys);
  }
  G.online.host = r.host === uid; G.online.code = code; G.online.uid = uid;
  if (!G.online.lastEvTs) G.online.lastEvTs = r.startedAt || Date.now();
  const p = G.p;
  p.flagCanvas = flagCanvas(p.flag, 120, 80);
  Object.keys(flagCache).forEach(k=>delete flagCache[k]);
  const extra = [p.homePoly].concat(r.humans.map(h=>((ON.players[h.uid]||{}).cfg||{}).homePoly)).filter(Boolean);
  MapView.buildPaths(extra); MapView.buildBase(extra);
  const w = await NET.be.getWorld(code);
  if (w){ applyWorld(w, true); if (!G.online.host && w.turn > G.turn) setTimeout(()=>onWorld(w), 600); } else { recount(); computeAdjacency(); }
  if (G.online.host && !w) await publishWorld();
  derive(); MapView.dirty = true; MapView.rails = computeRails(); computeFronts();
  UI.speed = 0; showHUD(); document.body.classList.add('online');
  ON.subs.push(NET.be.watchWorld(code, wd=>onWorld(wd)));
  ON.subs.push(NET.be.watchEvents(code, evs=>onEvents(evs)));
  clearInterval(ON.timer); ON.timer = setInterval(onlineTick, 1000);
  syncHumans(); publishPlayer(); unlock('online_primeira');
  setTimeout(()=>{ goHome(); toast(`🌐 Você entrou no mundo da sala ${code}.`, 'good'); }, 500);
}
function leaveOnline(){
  if (G && G.online) onlineSave(true);
  unsubAll(); ON.inGame = false; document.body.classList.remove('online');
  showMenu(); setTimeout(()=>openOnlineHub(), 100);
}

// ------------------------------------------------------------
//  Relógio: o anfitrião avança os meses
// ------------------------------------------------------------
function onlineTick(){
  const r = ON.room; if (!G || !G.online || !r) return;
  updateOnlineBar();
  if (r.status !== 'running') return;
  if (G.online.host && Date.now() >= (r.nextTick||0) && !UI.busy){
    hostTurn();
  }
}
async function hostTurn(){
  UI.busy = true;
  try {
    const r = ON.room;
    ON.room = Object.assign({}, r, {nextTick: Date.now() + r.speed*1000});
    await NET.be.updateRoom(r.code, {nextTick: ON.room.nextTick, turn: G.turn + 1, updatedAt:Date.now()});
    runLocalTurn();
    await publishWorld();
  } finally { UI.busy = false; }
}
function runLocalTurn(){
  UI.turnLogs = []; UI.fxQueue = []; UI.worldBattles = 0;
  const prevYear = curYear();
  endTurn(); SFX.turn();
  const logs = UI.turnLogs; UI.turnLogs = null;
  logs.filter(l=>l.k==='war' || (l.k==='bad' && /invadiu|capital|independ/i.test(l.txt))).slice(-2).forEach((l,i)=>setTimeout(()=>toast(esc(l.txt), l.k), i*400));
  (UI.negMsgs||[]).slice(-3).forEach(([msg,ok],i)=>setTimeout(()=>toast(esc(msg), ok?'dip':'bad'), 300 + i*400)); UI.negMsgs = [];
  UI.fxQueue.forEach((f,i)=>setTimeout(f, 300 + i*700));
  if (curYear() !== prevYear) toast(`📅 Começa o ano de ${curYear()}`);
  computeFronts(); MapView.rails = computeRails(); MapView.moveStart = performance.now();
  refreshAll(); publishPlayer(); onlineSave();
  if (!G.over && G.pendingEvents.length && !UI.modalOpen) setTimeout(showNextEvent, 400);
}

// ------------------------------------------------------------
//  Mundo: publicar (anfitrião) e aplicar (todos)
// ------------------------------------------------------------
const toCanon = id => id === 1 ? G.online.myCanon : id;
const fromCanon = id => id === G.online.myCanon ? 1 : id;
function encodeCanon(){ let s = ''; for (let i=0;i<NCELLS;i++) s += String.fromCharCode(toCanon(Grid.owner[i]) + 64); return s; }
async function publishWorld(){
  const N = G.nations, nations = [];
  for (let id=2; id<N.length; id++){ const n = N[id]; if (!n || n.human || n.empty || n.playerOrigin) continue; nations.push([id, +n.pop.toFixed(3), Math.round(n.pc), +n.power.toFixed(1), +n.navy.toFixed(1), +n.tech.toFixed(2), n.alive?1:0, n.cap, n.capital, n.leader, n.leaderAge, +(n.histMil||1).toFixed(3)]); }
  const w = {turn:G.turn, owner:encodeCanon(), nations, aiWars:G.aiWars, news:G.news.slice(0,6), ts:Date.now()};
  ON.lastWorld = w;
  await NET.be.setWorld(G.online.code, w);
}
function onWorld(w){
  if (!G || !G.online || G.online.host) return;
  if (w.turn <= G.turn){ applyWorld(w); return; }
  const behind = Math.min(24, w.turn - G.turn);
  applyWorld(w);
  for (let k=0; k<behind && !G.over; k++){ if (k < behind-1){ UI.turnLogs = []; endTurn(); UI.turnLogs = null; } else runLocalTurn(); }
}
function applyWorld(w, initial){
  ON.applying = true;
  try {
    const myCanon = G.online.myCanon, now = G.turn;
    ON.pending = ON.pending.filter(pd=>now - pd.t <= 3);
    const pendingCells = new Set(); for (const pd of ON.pending) for (const c of pd.cells) pendingCells.add(c);
    const moves = {};
    for (let i=0;i<NCELLS;i++){
      if (!Grid.land[i] && w.owner.charCodeAt(i) - 64 <= 0) continue;
      const canon = w.owner.charCodeAt(i) - 64, local = canon === myCanon ? 1 : canon;
      const cur = Grid.owner[i]; if (cur === local) continue;
      if (pendingCells.has(i)) continue;
      if (!Grid.land[i] && local > 0) Grid.land[i] = 1;
      if (!initial && (cur === 1 || local === 1)){ const k = cur + '>' + local; (moves[k] = moves[k] || []).push(i); }
      else Grid.owner[i] = local;
    }
    for (const k in moves){ const [a, b] = k.split('>').map(Number); transferCells(moves[k], a, b); }
    // remove pendências já confirmadas
    ON.pending = ON.pending.filter(pd=>pd.cells.some(c=>{ const canon = w.owner.charCodeAt(c) - 64; return canon !== toCanon(pd.to); }));
    for (const row of w.nations){
      const [id, pop, pc, power, navy, tech, alive, cap, capital, leader, leaderAge, hm] = row, n = G.nations[id]; if (!n || n.human) continue;
      Object.assign(n, {pop, pc, power, navy, tech, alive:!!alive, cap, capital, leader, leaderAge, histMil:hm});
      ON.snapPower[id] = power;
    }
    G.aiWars = w.aiWars || [];
    if (w.news && w.news.length) G.news = w.news.slice();
    recount(); computeAdjacency(); MapView.dirty = true;
  } finally { ON.applying = false; }
}

// mudanças de território feitas por mim → avisa o anfitrião
const _transferCells = transferCells;
transferCells = function(cells, from, to){
  _transferCells(cells, from, to);
  if (!G || !G.online || ON.applying || !cells.length) return;
  if (G.online.host) return;   // o anfitrião é a própria autoridade
  if (from !== 1 && to !== 1) return;
  ON.pending.push({cells:cells.slice(), to, t:G.turn});
  NET.be.pushEvent(G.online.code, {type:'transfer', from:NET.user.uid, cells:cells.slice(), fromCanon:toCanon(from), toCanon:toCanon(to)});
};

// ------------------------------------------------------------
//  Eventos entre jogadores
// ------------------------------------------------------------
function onEvents(evs){
  if (!G || !G.online) return;
  for (const ev of evs){
    if (ON.evSeen.has(ev.id)) continue; ON.evSeen.add(ev.id);
    if (ev.ts <= (G.online.lastEvTs || 0)) continue;
    G.online.lastEvTs = ev.ts;
    if (ev.type === 'transfer' && G.online.host){
      if (ev.from === NET.user.uid) continue;
      ON.applying = true;
      try { const from = fromCanon(ev.fromCanon), to = fromCanon(ev.toCanon); const cells = ev.cells.filter(c=>Grid.owner[c] === from || from === 0); if (cells.length) _transferCells(cells, from, to); }
      finally { ON.applying = false; }
      MapView.dirty = true; continue;
    }
    if (ev.type === 'aiPower' && G.online.host){ for (const id in ev.f){ const n = G.nations[id]; if (n && !n.human) n.power *= ev.f[id]; } continue; }
    if (ev.to && ev.to !== NET.user.uid) continue;
    if (ev.from === NET.user.uid) continue;
    handleMail(ev);
  }
}
function humanByUid(uid){ return G.nations.find(n=>n && n.human && n.uid === uid); }
function sendMail(toUid, type, payload){ return NET.be.pushEvent(G.online.code, Object.assign({type, from:NET.user.uid, fromName:G.p.name, to:toUid}, payload||{})); }
function handleMail(ev){
  const n = humanByUid(ev.from); const who = n ? n.name : (ev.fromName || 'Outro jogador');
  if (ev.type === 'msg'){ SFX.bell(); toast(`💬 <b>${esc(who)}</b>: ${esc(ev.text)}`, 'dip'); addLog(`💬 ${who}: ${ev.text}`, 'dip'); return; }
  if (ev.type === 'war'){ if (n && !n.atWar){ declareWar(n.id, true); G.stats.humanWars = (G.stats.humanWars||0); SFX.warDeclared(); bigBanner('GUERRA!', `${esc(who)} declarou guerra contra você!`); } refreshAll(); return; }
  if (ev.type === 'attacked'){ const lost = applyUnitLosses(ev.loss || 0.05, 'land'); for (const c of (G.p.corps||[])) lossesToCorps(c, (ev.loss||0.05)*0.6); G.p.corps = (G.p.corps||[]).filter(c=>corpsUnitsCount(c)>0);
    MapView.doShake(8, 500); SFX.alarm(); toast(`🔥 ${esc(who)} atacou e tomou ${ev.cells} região(ões)! Perdemos ${lost} divisões.`, 'bad'); addLog(`🔥 ${who} invadiu nosso território (${ev.cells} regiões).`, 'bad'); derive(); refreshAll(); return; }
  if (ev.type === 'propose'){
    const K = {alliance:'uma aliança militar', trade:'um acordo comercial', pact:'um pacto de não-agressão', peace:'a paz'}[ev.kind];
    const fr = n ? regimeFriction(n) : 1;
    const m = openModal(`<div class="m-icon">✉️</div><div class="m-title">Proposta de ${esc(who)}</div><div class="m-text">${esc(who)} propõe ${K}.${ev.kind==='trade' && fr < 1 ? ` Por causa da diferença de regimes, o comércio renderá ${Math.round(fr*100)}% do normal.` : ''}</div>
      <div class="m-actions"><button class="btn" id="pp-no">Recusar</button><button class="btn green" id="pp-yes">Aceitar</button></div>`);
    SFX.event();
    m.querySelector('#pp-no').onclick = ()=>{ closeModal(); sendMail(ev.from, 'reply', {kind:ev.kind, ok:false}); };
    m.querySelector('#pp-yes').onclick = ()=>{ closeModal(); applyHumanDeal(n, ev.kind); sendMail(ev.from, 'reply', {kind:ev.kind, ok:true}); };
    return;
  }
  if (ev.type === 'reply'){ if (ev.ok && n) applyHumanDeal(n, ev.kind); SFX[ev.ok?'bell':'error'](); toast(`${esc(who)} ${ev.ok?'aceitou':'recusou'} a proposta.`, ev.ok?'good':'bad'); refreshAll(); return; }
}
function applyHumanDeal(n, kind){
  if (!n) return;
  if (kind === 'alliance'){ n.alliance = true; n.pact = true; addLog(`🤝 Aliança formada com o jogador ${n.name}.`, 'dip'); }
  if (kind === 'pact'){ n.pact = true; addLog(`📜 Pacto com o jogador ${n.name}.`, 'dip'); }
  if (kind === 'trade'){ n.deals = n.deals || {}; n.deals.livre_comercio = {since:G.turn, until:G.turn+240}; n.deals.tarifas = {since:G.turn, until:G.turn+240}; syncTrade(n); addLog(`⚓ Acordo comercial com o jogador ${n.name}.`, 'dip'); }
  if (kind === 'peace' && n.atWar){ endWar(n.id, 'branca'); }
  refreshAll(); publishPlayer();
}
// regimes diferentes "travam" os acordos
function regimeFriction(n){
  const a = govFam(G.p.gov), b = govFam(n.gov);
  if (a === b) return 1;
  if ((a==='dem' && (b==='com'||b==='aut')) || (b==='dem' && (a==='com'||a==='aut'))) return 0.5;
  return 0.75;
}

// ------------------------------------------------------------
//  Dados públicos de cada jogador
// ------------------------------------------------------------
function publishPlayer(){
  if (!G || !G.online) return;
  const p = G.p;
  const pub = {uid:NET.user.uid, name:NET.user.name, lastSeen:Date.now(), canon:G.online.myCanon, nationName:p.name, color:G.nations[1].color, flag:p.flag, gov:p.gov, relig:p.religion,
    pop:+p.pop.toFixed(3), pc:Math.round(p.gdpPc), power:+(p.atk||0).toFixed(1), def:+(p.def||0).toFixed(1), navy:+(p.navy||0).toFixed(1), tech:p.techs.length, area:Math.round(p.area),
    capital:p.capital, cap:p.capCell, alive:!G.over && G.nations[1].cells > 0, turn:G.turn, score:score(), leader:p.leader};
  NET.be.setPlayer(G.online.code, NET.user.uid, pub);
  // perdas de poder que causei à IA → anfitrião
  if (!G.online.host){
    const f = {}; let any = false;
    for (const id in ON.snapPower){ const n = G.nations[id]; if (n && !n.human && ON.snapPower[id] > 0 && Math.abs(n.power/ON.snapPower[id] - 1) > 0.005){ f[id] = n.power/ON.snapPower[id]; ON.snapPower[id] = n.power; any = true; } }
    if (any) NET.be.pushEvent(G.online.code, {type:'aiPower', from:NET.user.uid, f});
  }
}
function syncHumans(){
  if (!G || !G.online) return;
  for (const [uid, pl] of Object.entries(ON.players)){
    if (uid === NET.user.uid || !pl.canon) continue;
    const n = G.nations[fromCanon(pl.canon)]; if (!n || !n.human) continue;
    Object.assign(n, {name:pl.nationName||n.name, color:pl.color||n.color, flag:pl.flag||n.flag, gov:pl.gov||n.gov, relig:pl.relig||n.relig, pop:pl.pop||n.pop, pc:pl.pc||n.pc, power:pl.power||0, navy:pl.navy||0, tech:pl.tech||0, capital:pl.capital||n.capital, leader:pl.leader||n.leader});
    if (pl.alive === false && n.alive && !n.cells){ n.alive = false; }
  }
}
async function onlineSave(force){
  if (!G || !G.online) return;
  if (!force && G.turn - ON.lastSave < 3) return;
  ON.lastSave = G.turn;
  const data = Object.assign({}, G); const p = Object.assign({}, G.p); delete p.flagCanvas; delete p.mods; data.p = p;
  data.hist = G.hist.slice(-600); data.log = G.log.slice(-200);
  try { await NET.be.setSave(G.online.code, NET.user.uid, JSON.stringify(data)); } catch(e){ console.warn('online save', e); }
  try { await NET.be.saveTrophies(NET.user.uid, getTrophies()); } catch(e){}
}

// ------------------------------------------------------------
//  Barra online e painel de jogadores
// ------------------------------------------------------------
function updateOnlineBar(){
  const bar = $('#online-bar'); if (!bar || !G || !G.online) return;
  const r = ON.room, secs = Math.max(0, Math.ceil(((r.nextTick||0) - Date.now())/1000));
  const humans = (r.humans||[]); const on = humans.filter(h=>isOnlineNow(ON.players[h.uid])).length;
  const hostOn = isOnlineNow(ON.players[r.host]);
  bar.innerHTML = `🌐 <b>#${r.code}</b> · ${r.status!=='running' ? '⏸ sessão encerrada' : !hostOn && !G.online.host ? '⏳ aguardando o anfitrião' : `⏱ próximo mês em <b>${secs}s</b>`} · 👥 ${on}/${humans.length} online`;
}
function openPlayersPanel(){
  syncHumans();
  const humans = G.nations.filter(n=>n && n.human && !n.empty);
  const m = openModal(`<div class="m-icon">👥</div><div class="m-title">Jogadores nesta partida</div>
    <div class="row"><span class="k">${flagImg(G.nations[1], 30, 20)} <b>${esc(G.p.name)}</b> — você</span><span class="v">⚔ ${fmtNum(G.p.atk,0)} · 💰 ${fmtMoney(G.p.gdp)}</span></div>
    ${humans.map(n=>{ const pl = Object.values(ON.players).find(x=>x.uid===n.uid) || {}; const fr = regimeFriction(n);
      return `<div class="box"><div class="row"><span class="k">${flagImg(n, 30, 20)} <b>${esc(n.name)}</b> <small class="muted">(${esc(pl.name||'')})</small> ${isOnlineNow(pl)?'<span class="up">● online</span>':'<span class="down">○ offline</span>'}</span>
        <span class="v">${nationTags(n)}</span></div>
        <small>${GOVS[n.gov]?GOVS[n.gov].name:''} · ⚔ ${fmtNum(n.power,0)} · 💰 ${fmtMoney(n.pop*n.pc)} · 🗺 ${fmtArea(n.area||0)}${fr<1?` · ⚠️ regimes diferentes: comércio a ${Math.round(fr*100)}%`:''}</small>
        <div class="flex" style="flex-wrap:wrap;margin-top:5px">
          ${n.atWar ? `<button class="btn xs" data-hp="peace" data-u="${n.uid}">🕊️ Propor paz</button>` : `<button class="btn xs" data-hp="trade" data-u="${n.uid}">⚓ Comércio</button><button class="btn xs" data-hp="pact" data-u="${n.uid}">📜 Pacto</button><button class="btn xs" data-hp="alliance" data-u="${n.uid}">🤝 Aliança</button><button class="btn xs danger" data-hp="war" data-u="${n.uid}">⚔️ Guerra</button>`}
          <button class="btn xs" data-hp="msg" data-u="${n.uid}">💬 Mensagem</button><button class="btn xs" data-hp="fly" data-u="${n.uid}">🎯 Ver</button></div></div>`; }).join('') || '<div class="muted">Nenhum outro jogador nesta partida.</div>'}
    <div class="m-actions"><button class="btn" id="pl-x">Fechar</button></div>`, {wide:true});
  m.querySelector('#pl-x').onclick = ()=>{ SFX.click(); closeModal(); };
  m.querySelectorAll('[data-hp]').forEach(b=> b.onclick = ()=>{
    const n = humanByUid(b.dataset.u), k = b.dataset.hp;
    if (k === 'fly'){ closeModal(); if (n.cap >= 0){ const [lo,la] = cellCenter(n.cap); MapView.flyTo(lo, la, 3); } return; }
    if (k === 'msg'){ closeModal(); const mm = openModal(`<div class="m-title">Mensagem para ${esc(n.name)}</div><div class="field"><input type="text" id="ms-t" maxlength="200" placeholder="Escreva..."></div><div class="m-actions"><button class="btn" id="ms-x">Cancelar</button><button class="btn green" id="ms-ok">Enviar</button></div>`);
      mm.querySelector('#ms-t').focus(); mm.querySelector('#ms-x').onclick = ()=>closeModal(); mm.querySelector('#ms-ok').onclick = ()=>{ const t = mm.querySelector('#ms-t').value.trim(); if (t) sendMail(n.uid, 'msg', {text:t}); closeModal(); toast('Mensagem enviada.', 'good'); }; return; }
    if (k === 'war'){ closeModal(); confirmModal('⚔️', `Declarar guerra a ${esc(n.name)}?`, 'Este é outro jogador humano. Ele será avisado imediatamente.', 'Declarar guerra', ()=>{ declareWar(n.id, false); G.stats.humanWars = (G.stats.humanWars||0) + 1; sendMail(n.uid, 'war'); SFX.warDeclared(); bigBanner('GUERRA!', `${esc(G.p.name)} × ${esc(n.name)}`); refreshAll(); publishPlayer(); }, true); return; }
    sendMail(n.uid, 'propose', {kind:k}); SFX.page(); toast(`Proposta enviada a ${esc(n.name)}.`, 'dip');
  });
}
// ataques contra humanos: avisar o defensor
const _playerAttack = playerAttack;
playerAttack = function(cell, commit, corpsId){
  const e = Grid.owner[cell], n = G.nations[e];
  const r = _playerAttack(cell, commit, corpsId);
  if (G.online && n && n.human && r && r.ok){
    if (r.win){ G.stats.humanCells = (G.stats.humanCells||0) + r.captured.length; if (!n.alive) G.stats.humanKills = (G.stats.humanKills||0) + 1; }
    sendMail(n.uid, 'attacked', {cells: r.win ? r.captured.length : 0, loss: r.win ? 0.06*commit : 0.02*commit});
    publishPlayer();
  }
  return r;
};
