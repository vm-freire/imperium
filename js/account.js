// ============================================================
//  IMPERIUM — Conta do jogador
//  • Tela de entrada (login / cadastro) antes do menu
//  • Salvamentos, histórico e conquistas guardados na conta,
//    para continuar a partida em qualquer aparelho
// ============================================================
'use strict';

// Chaves do navegador que acompanham a conta
const CLOUD_KEYS = () => [...Array.from({length:MAX_SLOTS}, (_,i)=>[slotKey(i), slotMetaKey(i)]).flat(), HIST_KEY, TROPHY_KEY];
const OWNER_KEY = 'imperium_owner';

const CLOUD = {
  pushed:{}, busy:false, again:false, timer:null, warned:false,
  // Traz os dados da conta para este navegador (e envia o que só existe aqui)
  async pull(uid){
    let rows = {};
    try { rows = await NET.be.getUserData(uid); }
    catch(e){ console.warn('cloud pull', e); this.warn(); rows = null; }
    const owner = localStorage.getItem(OWNER_KEY);
    if (owner && owner !== uid) this.wipeLocal();
    if (!rows){ localStorage.setItem(OWNER_KEY, uid); return; }
    const get = k => localStorage.getItem(k), set = (k, v) => { try { localStorage.setItem(k, v); } catch(e){ console.warn(e); } };
    const parse = v => { try { return JSON.parse(v); } catch(e){ return null; } };
    for (let i = 0; i < MAX_SLOTS; i++){
      const lm = parse(get(slotMetaKey(i))), cm = parse(rows[slotMetaKey(i)]);
      if (cm && rows[slotKey(i)] && (!lm || (cm.savedAt||0) > (lm.savedAt||0))){ set(slotKey(i), rows[slotKey(i)]); set(slotMetaKey(i), rows[slotMetaKey(i)]); }
    }
    const lh = parse(get(HIST_KEY)) || [], ch = parse(rows[HIST_KEY]) || [];
    if (ch.length){ const seen = new Set(), h = []; for (const r of ch.concat(lh)) if (r && !seen.has(r.id)){ seen.add(r.id); h.push(r); } set(HIST_KEY, JSON.stringify(h.slice(0, 40))); }
    const ct = parse(rows[TROPHY_KEY]);
    if (ct) set(TROPHY_KEY, JSON.stringify(Object.assign({}, ct, parse(get(TROPHY_KEY)) || {})));
    this.pushed = Object.assign({}, rows);
    localStorage.setItem(OWNER_KEY, uid);
    await this.sync();
  },
  wipeLocal(){ for (const k of CLOUD_KEYS()) localStorage.removeItem(k); localStorage.removeItem(OWNER_KEY); this.pushed = {}; },
  // Envia para a conta só o que mudou desde o último envio
  async sync(){
    if (!NET.user || !NET.be) return;
    if (this.busy){ this.again = true; return; }
    this.busy = true;
    try {
      for (const k of CLOUD_KEYS()){
        const v = localStorage.getItem(k);
        if (v === (this.pushed[k] ?? null)) continue;
        if (v === null) await NET.be.delUserData(NET.user.uid, k);
        else await NET.be.setUserData(NET.user.uid, k, v);
        if (v === null) delete this.pushed[k]; else this.pushed[k] = v;
      }
    } catch(e){ console.warn('cloud sync', e); this.warn(); }
    this.busy = false;
    if (this.again){ this.again = false; this.soon(); }
  },
  soon(ms){ clearTimeout(this.timer); this.timer = setTimeout(()=>this.sync(), ms ?? 2500); },
  warn(){ if (this.warned || NET.isLocal()) return; this.warned = true; if (typeof toast === 'function') toast('⚠️ Não consegui salvar na sua conta agora. O jogo continua salvo neste aparelho.', 'bad'); }
};

// Toda gravação local também vai para a conta
for (const fn of ['saveGame', 'deleteSlot', 'archiveGame', 'saveTrophy']){
  const orig = window[fn];
  window[fn] = function(){ const r = orig.apply(this, arguments); if (!(G && G.online)) CLOUD.soon(); return r; };
}
setInterval(()=>CLOUD.sync(), 60000);
document.addEventListener('visibilitychange', ()=>{ if (document.visibilityState === 'hidden') CLOUD.sync(); });

// ------------------------------------------------------------
//  Tela de entrada
// ------------------------------------------------------------
function showLogin(tab){
  tab = tab || 'entrar';
  stopAuto(); closeModal(); closePopover(); hideTip();
  hideAllScreens(); $('#hud').classList.add('hidden'); document.body.classList.remove('ingame');
  MapView.menuMode = true;
  const box = $('#scr-login'); box.classList.remove('hidden');
  const criar = tab === 'criar';
  $('#lg-box').innerHTML = `
    <div class="lg-brand"><img src="favicon.svg" alt=""><div><div class="lg-title">IMPERIUM</div><div class="lg-sub">Crônicas das Nações</div></div></div>
    <div class="lg-tabs"><button data-lt="entrar" class="${criar?'':'on'}">Entrar</button><button data-lt="criar" class="${criar?'on':''}">Criar conta</button></div>
    <form id="lg-form" autocomplete="on" novalidate>
      ${criar ? `<label class="lg-f"><span>Nome</span><input id="lg-name" maxlength="24" autocomplete="nickname" placeholder="Como os outros vão te ver"></label>` : ''}
      <label class="lg-f"><span>E-mail</span><input id="lg-email" type="email" autocomplete="email" placeholder="voce@email.com"></label>
      <label class="lg-f"><span>Senha</span><input id="lg-pass" type="password" autocomplete="${criar?'new-password':'current-password'}" placeholder="Mínimo de 8 caracteres"></label>
      ${criar ? `<label class="lg-f"><span>Confirmar senha</span><input id="lg-pass2" type="password" autocomplete="new-password"></label>` : ''}
      <div class="lg-err" id="lg-err"></div>
      <button class="lg-go" type="submit">${criar ? 'Criar conta e jogar' : 'Entrar'}</button>
    </form>
    <div class="lg-note">${criar ? 'Suas partidas, conquistas e histórico ficam salvos na conta.' : 'Ainda não tem conta? <a href="#" data-lt="criar">Crie em segundos</a>.'}</div>
    ${NET.isLocal() ? '<div class="lg-note lg-local">🧪 Modo de teste local: contas só neste navegador.</div>' : ''}`;
  box.querySelectorAll('[data-lt]').forEach(b=> b.onclick = e=>{ e.preventDefault(); SFX.init(); SFX.click(); showLogin(b.dataset.lt); });
  const first = $(criar ? '#lg-name' : '#lg-email'); setTimeout(()=>first && first.focus(), 50);
  $('#lg-form').onsubmit = async e=>{
    e.preventDefault(); SFX.init();
    const err = $('#lg-err'), btn = box.querySelector('.lg-go'); err.textContent = '';
    const email = $('#lg-email').value.trim(), pass = $('#lg-pass').value;
    try {
      if (!email) throw new Error('Informe seu e-mail.');
      if (criar){
        const name = $('#lg-name').value.trim();
        if (!name) throw new Error('Informe seu nome.');
        if (pass.length < 8) throw new Error('A senha precisa ter pelo menos 8 caracteres.');
        if (pass !== $('#lg-pass2').value) throw new Error('As senhas não conferem.');
        btn.disabled = true; btn.textContent = 'Criando…';
        NET.user = await NET.be.signUp(name, email, pass);
      } else {
        if (!pass) throw new Error('Informe sua senha.');
        btn.disabled = true; btn.textContent = 'Entrando…';
        NET.user = await NET.be.signIn(email, pass);
      }
      await enterAccount(true);
    } catch(ex){ SFX.error(); err.textContent = ex.message; btn.disabled = false; btn.textContent = criar ? 'Criar conta e jogar' : 'Entrar'; }
  };
}
async function enterAccount(fresh){
  $('#lg-box').innerHTML = '<div class="lg-loading">Carregando suas crônicas…</div>';
  await CLOUD.pull(NET.user.uid);
  if (typeof syncTrophiesFromProfile === 'function') syncTrophiesFromProfile();
  if (fresh) SFX.fanfare();
  showMenu();
}
async function logout(){
  await CLOUD.sync();
  try { await NET.be.signOut(); } catch(e){}
  NET.user = null; CLOUD.wipeLocal();
  showMenu(); showLogin();
  toast('Você saiu da conta.');
}
async function startAccount(){
  $('#scr-login').classList.remove('hidden');
  $('#lg-box').innerHTML = '<div class="lg-loading">Abrindo os arquivos do império…</div>';
  try { await NET.init(); } catch(e){ console.warn(e); NET.be = NET.be || new LocalBackend(); }
  if (NET.user) await enterAccount(false); else showLogin();
}
