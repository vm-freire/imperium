// ============================================================
//  IMPERIUM — Camada de rede (contas, salas, sincronização)
//  • SupabaseBackend: online de verdade (preencha supabase-config.js)
//  • LocalBackend: teste entre abas do mesmo navegador (sem internet)
// ============================================================
'use strict';

const genCode = () => Array.from({length:6}, ()=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random()*32)]).join('');
async function sha256(t){ const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)); return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join(''); }
const authErr = (code) => ({
  'auth/email-already-in-use':'Este e-mail já tem cadastro.', 'auth/invalid-email':'E-mail inválido.', 'auth/weak-password':'A senha precisa ter pelo menos 8 caracteres.',
  'auth/user-not-found':'E-mail ou senha incorretos.', 'auth/wrong-password':'E-mail ou senha incorretos.', 'auth/invalid-credential':'E-mail ou senha incorretos.',
  'auth/too-many-requests':'Muitas tentativas. Aguarde um pouco.', 'auth/network-request-failed':'Sem conexão com a internet.'
})[code] || 'Não foi possível concluir. Tente de novo.';

// ------------------------------------------------------------
//  Backend local (localStorage + eventos entre abas)
// ------------------------------------------------------------
class LocalBackend {
  constructor(){ this.kind = 'local'; this.subs = []; window.addEventListener('storage', e=>this._fire(e.key)); }
  _get(k, d){ try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch(e){ return d; } }
  _set(k, v){ localStorage.setItem(k, JSON.stringify(v)); this._fire(k); }
  _fire(k){ for (const s of this.subs) if (s.key === k || (s.prefix && k && k.startsWith(s.prefix))) setTimeout(()=>s.cb(), 0); }
  _sub(o){ this.subs.push(o); setTimeout(()=>o.cb(), 0); return ()=>{ this.subs = this.subs.filter(x=>x!==o); }; }
  async signUp(name, email, pass){
    email = email.trim().toLowerCase(); const users = this._get('mp_users', {});
    if (pass.length < 8) throw new Error(authErr('auth/weak-password'));
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error(authErr('auth/invalid-email'));
    if (users[email]) throw new Error(authErr('auth/email-already-in-use'));
    const uid = 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
    users[email] = {uid, name, email, hash: await sha256(pass)}; this._set('mp_users', users);
    this._set('mp_profile_' + uid, {name, email, trophies:{}});
    sessionStorage.setItem('mp_session', JSON.stringify({uid, name, email})); return {uid, name, email};
  }
  async signIn(email, pass){
    email = email.trim().toLowerCase(); const u = this._get('mp_users', {})[email];
    if (!u || u.hash !== await sha256(pass)) throw new Error(authErr('auth/wrong-password'));
    const s = {uid:u.uid, name:u.name, email}; sessionStorage.setItem('mp_session', JSON.stringify(s)); return s;
  }
  async signOut(){ sessionStorage.removeItem('mp_session'); }
  async restore(){ try { return JSON.parse(sessionStorage.getItem('mp_session')); } catch(e){ return null; } }
  async getProfile(uid){ return this._get('mp_profile_' + uid, {}); }
  async saveTrophies(uid, trophies){ const p = this._get('mp_profile_' + uid, {}); p.trophies = Object.assign({}, p.trophies||{}, trophies); this._set('mp_profile_' + uid, p); }
  async createRoom(room){ let code; do { code = genCode(); } while (this._get('mp_room_' + code)); room.code = code; this._set('mp_room_' + code, room); return code; }
  async getRoom(code){ return this._get('mp_room_' + code, null); }
  async updateRoom(code, patch){ const r = this._get('mp_room_' + code, null); if (!r) throw new Error('Sala não encontrada.'); this._set('mp_room_' + code, deepMerge(r, patch)); }
  watchRoom(code, cb){ return this._sub({key:'mp_room_' + code, cb:()=>cb(this._get('mp_room_' + code, null))}); }
  async listMyRooms(uid){ const out = []; for (let i=0;i<localStorage.length;i++){ const k = localStorage.key(i); if (k.startsWith('mp_room_')){ const r = this._get(k); if (r && r.memberUids && r.memberUids.includes(uid)) out.push(r); } } return out; }
  async setPlayer(code, uid, data){ const k = 'mp_players_' + code, m = this._get(k, {}); m[uid] = Object.assign(m[uid]||{}, data); this._set(k, m); }
  watchPlayers(code, cb){ return this._sub({key:'mp_players_' + code, cb:()=>cb(this._get('mp_players_' + code, {}))}); }
  async setWorld(code, w){ this._set('mp_world_' + code, w); }
  async getWorld(code){ return this._get('mp_world_' + code, null); }
  watchWorld(code, cb){ return this._sub({key:'mp_world_' + code, cb:()=>{ const w = this._get('mp_world_' + code, null); if (w) cb(w); }}); }
  async setSave(code, uid, json){ try { localStorage.setItem('mp_save_' + code + '_' + uid, json); } catch(e){ console.warn('save', e); } }
  async getSave(code, uid){ return localStorage.getItem('mp_save_' + code + '_' + uid); }
  async getUserData(uid){ return this._get('mp_ud_' + uid, {}); }
  async setUserData(uid, key, value){ const k = 'mp_ud_' + uid, m = this._get(k, {}); m[key] = value; localStorage.setItem(k, JSON.stringify(m)); }
  async delUserData(uid, key){ const k = 'mp_ud_' + uid, m = this._get(k, {}); delete m[key]; localStorage.setItem(k, JSON.stringify(m)); }
  async pushEvent(code, ev){ const k = 'mp_events_' + code, a = this._get(k, []); ev.id = Date.now().toString(36) + Math.random().toString(36).slice(2,7); ev.ts = Date.now(); a.push(ev); this._set(k, a.slice(-300)); }
  watchEvents(code, cb){ return this._sub({key:'mp_events_' + code, cb:()=>cb(this._get('mp_events_' + code, []))}); }
}
function deepMerge(a, b){ const o = Array.isArray(a) ? a.slice() : Object.assign({}, a); for (const k in b){ if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a && typeof a[k] === 'object' && a[k]) o[k] = deepMerge(a[k], b[k]); else o[k] = b[k]; } return o; }

// ------------------------------------------------------------
//  Backend Supabase (Auth com e-mail/senha + Postgres + Realtime)
// ------------------------------------------------------------
const supaErr = (m) => {
  m = String(m || '');
  if (/already registered|already exists/i.test(m)) return 'Este e-mail já tem cadastro.';
  if (/invalid login|invalid credentials/i.test(m)) return 'E-mail ou senha incorretos.';
  if (/password/i.test(m) && /least|short|characters/i.test(m)) return 'A senha precisa ter pelo menos 8 caracteres.';
  if (/email.*invalid|invalid.*email|unable to validate email/i.test(m)) return 'E-mail inválido.';
  if (/not confirmed/i.test(m)) return 'E-mail ainda não confirmado. Desative "Confirm email" no Supabase (veja o guia).';
  if (/rate limit|too many/i.test(m)) return 'Muitas tentativas. Aguarde um pouco.';
  if (/fetch|network/i.test(m)) return 'Sem conexão com a internet.';
  return m || 'Não foi possível concluir. Tente de novo.';
};
class SupabaseBackend {
  constructor(cfg){
    this.kind = 'supabase';
    this.sb = supabase.createClient(cfg.url, cfg.anonKey, {auth:{persistSession:true, autoRefreshToken:true}});
    this.chan = 0;
  }
  async _uid(){ const {data} = await this.sb.auth.getSession(); return data.session ? data.session.user.id : null; }
  _chk(r){ if (r.error) throw new Error(supaErr(r.error.message)); return r.data; }
  async signUp(name, email, pass){
    if (pass.length < 8) throw new Error(supaErr('password at least'));
    const r = await this.sb.auth.signUp({email:email.trim(), password:pass, options:{data:{name}}});
    if (r.error) throw new Error(supaErr(r.error.message));
    if (!r.data.session) throw new Error('Conta criada, mas o Supabase pediu confirmação de e-mail. No painel do Supabase, desative "Confirm email" (Authentication → Sign In / Providers → Email) e entre de novo.');
    const uid = r.data.user.id;
    await this.sb.from('profiles').upsert({id:uid, name, email:email.trim(), trophies:{}});
    return {uid, name, email};
  }
  async signIn(email, pass){
    const r = await this.sb.auth.signInWithPassword({email:email.trim(), password:pass});
    if (r.error) throw new Error(supaErr(r.error.message));
    const u = r.data.user, prof = await this.getProfile(u.id);
    if (!prof.name) await this.sb.from('profiles').upsert({id:u.id, name:(u.user_metadata||{}).name || email, email:u.email});
    return {uid:u.id, name: prof.name || (u.user_metadata||{}).name || email, email:u.email};
  }
  async signOut(){ await this.sb.auth.signOut(); }
  async restore(){
    const {data} = await this.sb.auth.getSession(); const s = data.session; if (!s) return null;
    const prof = await this.getProfile(s.user.id);
    return {uid:s.user.id, name: prof.name || (s.user.user_metadata||{}).name || s.user.email, email:s.user.email};
  }
  async getProfile(uid){ const r = await this.sb.from('profiles').select('*').eq('id', uid).maybeSingle(); return (r.data) || {}; }
  async saveTrophies(uid, trophies){ await this.sb.from('profiles').update({trophies}).eq('id', uid); }
  // ---- salas (os campos da sala ficam num JSON) ----
  async createRoom(room){
    for (let i=0;i<10;i++){
      const code = genCode(); room.code = code;
      const r = await this.sb.from('rooms').insert({code, host:room.host, member_uids:room.memberUids, data:room, updated_at:new Date().toISOString()});
      if (!r.error) return code;
      if (!/duplicate/i.test(r.error.message)) throw new Error(supaErr(r.error.message));
    }
    throw new Error('Tente de novo.');
  }
  async getRoom(code){ const r = await this.sb.from('rooms').select('data').eq('code', code).maybeSingle(); return r.data ? r.data.data : null; }
  async updateRoom(code, patch){
    const cur = await this.getRoom(code); if (!cur) throw new Error('Sala não encontrada.');
    const next = deepMerge(cur, patch);
    this._chk(await this.sb.from('rooms').update({data:next, member_uids:next.memberUids, updated_at:new Date().toISOString()}).eq('code', code));
  }
  _watch(table, filter, fetcher, cb){
    const ch = this.sb.channel(`${table}-${filter}-${++this.chan}`)
      .on('postgres_changes', {event:'*', schema:'public', table, filter}, ()=>fetcher().then(cb))
      .subscribe();
    fetcher().then(cb);
    return ()=>{ this.sb.removeChannel(ch); };
  }
  watchRoom(code, cb){ return this._watch('rooms', `code=eq.${code}`, ()=>this.getRoom(code), cb); }
  async listMyRooms(uid){ const r = await this.sb.from('rooms').select('data').contains('member_uids', [uid]); return (r.data||[]).map(x=>x.data); }
  async setPlayer(code, uid, data){
    const cur = await this.sb.from('room_players').select('data').eq('code', code).eq('uid', uid).maybeSingle();
    const next = Object.assign({}, cur.data ? cur.data.data : {}, data);
    await this.sb.from('room_players').upsert({code, uid, data:next});
  }
  async _players(code){ const r = await this.sb.from('room_players').select('uid,data').eq('code', code); const m = {}; for (const x of (r.data||[])) m[x.uid] = x.data; return m; }
  watchPlayers(code, cb){ return this._watch('room_players', `code=eq.${code}`, ()=>this._players(code), cb); }
  async setWorld(code, w){ this._chk(await this.sb.from('room_world').upsert({code, data:w, turn:w.turn})); }
  async getWorld(code){ const r = await this.sb.from('room_world').select('data').eq('code', code).maybeSingle(); return r.data ? r.data.data : null; }
  watchWorld(code, cb){ return this._watch('room_world', `code=eq.${code}`, ()=>this.getWorld(code), w=>{ if (w) cb(w); }); }
  async setSave(code, uid, json){ await this.sb.from('room_saves').upsert({code, uid, json, saved_at:new Date().toISOString()}); }
  async getSave(code, uid){ const r = await this.sb.from('room_saves').select('json').eq('code', code).eq('uid', uid).maybeSingle(); return r.data ? r.data.json : null; }
  // ---- dados da conta (salvamentos solo, histórico, conquistas) ----
  async getUserData(uid){ const r = await this.sb.from('user_saves').select('key,value').eq('uid', uid); if (r.error) throw new Error(r.error.message); const m = {}; for (const x of r.data) m[x.key] = x.value; return m; }
  async setUserData(uid, key, value){ this._chk(await this.sb.from('user_saves').upsert({uid, key, value, updated_at:new Date().toISOString()})); }
  async delUserData(uid, key){ this._chk(await this.sb.from('user_saves').delete().eq('uid', uid).eq('key', key)); }
  async pushEvent(code, ev){ ev.ts = Date.now(); const r = await this.sb.from('room_events').insert({code, ts:ev.ts, from_uid:ev.from, data:ev}).select('id').single(); return r.data && r.data.id; }
  async _events(code){ const r = await this.sb.from('room_events').select('id,data').eq('code', code).gt('ts', Date.now() - 7*24*3600*1000).order('id'); return (r.data||[]).map(x=>Object.assign({}, x.data, {id:String(x.id)})); }
  watchEvents(code, cb){ return this._watch('room_events', `code=eq.${code}`, ()=>this._events(code), cb); }
}

// ------------------------------------------------------------
//  Fachada
// ------------------------------------------------------------
const NET = {
  be:null, user:null,
  async init(){
    if (this.be) return this.be;
    const cfg = window.SUPABASE_CONFIG;
    if (cfg && cfg.url && /^https:/.test(cfg.url) && cfg.anonKey && !/COLE_AQUI/.test(cfg.anonKey) && window.supabase){ try { this.be = new SupabaseBackend(cfg); } catch(e){ console.warn(e); this.be = new LocalBackend(); } }
    else this.be = new LocalBackend();
    this.user = await this.be.restore();
    return this.be;
  },
  isLocal(){ return !this.be || this.be.kind === 'local'; }
};
