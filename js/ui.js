// ============================================================
//  IMPERIUM — Interface do jogo (HUD, painéis, modais, relatórios)
// ============================================================
'use strict';

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);

// ---------- balões de ajuda (hover) ----------
function tip(title, body, extra){ return ` data-tip="${esc(`<b>${title}</b>${body?`<div>${body}</div>`:''}${extra?`<div class='tip-extra'>${extra}</div>`:''}`)}"`; }
function fxList(fx){ return fx ? Object.entries(fx).map(([k,v])=>fxLabel(k,v)).join(' · ') : ''; }
(function(){
  let cur = null;
  const box = () => document.getElementById('helptip');
  const place = (e)=>{ const b = box(); const w = b.offsetWidth, h = b.offsetHeight; let x = e.clientX + 18, y = e.clientY + 18; if (x + w > innerWidth - 8) x = e.clientX - w - 14; if (y + h > innerHeight - 8) y = e.clientY - h - 14; b.style.left = Math.max(6,x) + 'px'; b.style.top = Math.max(6,y) + 'px'; };
  document.addEventListener('mouseover', e=>{
    let el = e.target.closest('[data-tip],[title]'); if (!el || el.id === 'map') return;
    if (el.hasAttribute('title')){ const t = el.getAttribute('title'); el.removeAttribute('title'); if (t && !el.dataset.tip) el.dataset.tip = esc(t); }
    if (!el.dataset.tip) return;
    cur = el; const b = box(); b.innerHTML = el.dataset.tip; b.classList.remove('hidden'); place(e);
  });
  document.addEventListener('mousemove', e=>{ if (cur) place(e); });
  document.addEventListener('mouseout', e=>{ if (cur && !cur.contains(e.relatedTarget)){ cur = null; box().classList.add('hidden'); } });
  document.addEventListener('mousedown', ()=>{ cur = null; const b = box(); if (b) b.classList.add('hidden'); });
})();
const UI = { tab:'geral', logFilter:'all', speed:0, busy:false, turnLogs:null, fxQueue:[], diploSort:'rel', autoTimer:null, lastStats:{}, commit:0.5 };

// ------------------------------------------------------------
//  Configurações
// ------------------------------------------------------------
function loadSettings(){
  try { const s = JSON.parse(localStorage.getItem(SET_KEY)) || {}; SFX.volume = s.volume ?? 0.7; SFX.sfxOn = s.sfx ?? true; SFX.musicOn = s.music ?? true; MapView.worldFx = s.worldFx ?? true; } catch(e){}
}
function saveSettings(){ try { localStorage.setItem(SET_KEY, JSON.stringify({volume:SFX.volume, sfx:SFX.sfxOn, music:SFX.musicOn, worldFx:MapView.worldFx})); } catch(e){} }

// ------------------------------------------------------------
//  Toasts, modal, popover, tooltip
// ------------------------------------------------------------
function toast(text, kind){
  const t = document.createElement('div'); t.className = 'toast ' + (kind||''); t.innerHTML = text;
  $('#toasts').appendChild(t); setTimeout(()=>t.remove(), 5200);
  while ($('#toasts').children.length > 6) $('#toasts').firstChild.remove();
}
function openModal(html, opts){
  opts = opts || {};
  const m = $('#modal'); m.className = opts.wide ? 'wide' : ''; m.innerHTML = html;
  $('#modal-wrap').classList.remove('hidden'); UI.modalOpen = true;
  void m.offsetWidth; m.style.animation = 'none'; void m.offsetWidth; m.style.animation = '';
  return m;
}
function closeModal(){ $('#modal-wrap').classList.add('hidden'); UI.modalOpen = false; $('#modal').innerHTML = ''; }
function confirmModal(icon, title, text, okLabel, onOk, danger){
  const m = openModal(`<div class="m-icon">${icon}</div><div class="m-title">${title}</div><div class="m-text">${text}</div>
    <div class="m-actions"><button class="btn" id="cm-no">Cancelar</button><button class="btn ${danger?'primary':'green'}" id="cm-ok">${okLabel}</button></div>`);
  m.querySelector('#cm-no').onclick = ()=>{ SFX.click(); closeModal(); };
  m.querySelector('#cm-ok').onclick = ()=>{ SFX.click(); closeModal(); onOk(); };
}
function showPopover(html, x, y){
  const p = $('#popover'); p.innerHTML = `<button class="x" onclick="closePopover()">✕</button>` + html; p.classList.remove('hidden');
  const r = p.getBoundingClientRect();
  p.style.left = Math.min(window.innerWidth - r.width - 10, x + 12) + 'px';
  p.style.top = Math.min(window.innerHeight - r.height - 44, Math.max(64, y - 20)) + 'px';
  return p;
}
function closePopover(){ $('#popover').classList.add('hidden'); MapView.selCell = -1; }
function showTip(html, x, y){ const t = $('#tooltip'); t.innerHTML = html; t.classList.remove('hidden'); t.style.left = Math.min(window.innerWidth-270, x+16)+'px'; t.style.top = (y+16)+'px'; }
function hideTip(){ $('#tooltip').classList.add('hidden'); }
// Avisos de metas e conquistas: um de cada vez, no canto inferior direito
const NOTIF = {q:[], busy:false};
function notify(icon, title, text, kind){ NOTIF.q.push({icon, title, text, kind}); if (!NOTIF.busy) nextNotif(); }
function nextNotif(){
  const it = NOTIF.q.shift(); if (!it){ NOTIF.busy = false; return; }
  NOTIF.busy = true;
  const el = document.createElement('div'); el.className = 'notif ' + (it.kind||'');
  el.innerHTML = `<div class="ni">${it.icon}</div><div><div class="nt">${it.title}</div><div class="nd">${it.text||''}</div></div>`;
  el.onclick = ()=>{ el.classList.add('out'); };
  $('#app').appendChild(el); SFX.fanfare();
  setTimeout(()=>el.classList.add('out'), 4200);
  setTimeout(()=>{ el.remove(); setTimeout(nextNotif, 500); }, 4700);
}
function bigBanner(t1, t2){ const b = document.createElement('div'); b.className='big-banner'; b.innerHTML = `<div class="b1">${t1}</div><div class="b2">${t2||''}</div>`; $('#app').appendChild(b); setTimeout(()=>b.remove(), 3300); }

// ------------------------------------------------------------
//  Bandeiras de nações IA
// ------------------------------------------------------------
const flagCache = {};
function nationFlag(n){ if (!n.flag) n.flag = randomFlag(makeRng(n.id*7919 + n.name.length*131)); return n.flag; }
function flagImg(n, w, h){
  const key = n.id + ':' + w;
  if (!flagCache[key]){ const f = n.id===1 ? G.p.flag : nationFlag(n); flagCache[key] = flagCanvas(f, w*2, h*2).toDataURL(); }
  return `<img src="${flagCache[key]}" width="${w}" height="${h}" style="border:1px solid rgba(0,0,0,.4);vertical-align:middle">`;
}

// ------------------------------------------------------------
//  Telas
// ------------------------------------------------------------
function hideAllScreens(){ ['#scr-login','#scr-menu','#scr-create','#scr-page','#place-banner'].forEach(s=>$(s).classList.add('hidden')); }
function showMenu(){
  stopAuto(); closeModal(); closePopover(); hideTip();
  hideAllScreens(); $('#scr-menu').classList.remove('hidden'); $('#hud').classList.add('hidden');
  document.body.classList.remove('ingame');
  G = null; MapView.placement = null; MapView.menuMode = true;
  Grid.buildLand([]); MapView.buildPaths([]); MapView.buildBase([]);
  setTimeout(()=>{ MapView.resize(); MapView.cam.z = Math.max(MapView.minZ*1.6, MapView.ch/MH*1.25); MapView.cam.y = (MH - MapView.ch/MapView.cam.z)/2; }, 50);
  $('#m-continue').disabled = !hasSave();
  const h = getHistory();
  $('#m-foot').textContent = h.length ? `${h.length} nação(ões) registrada(s) nas crônicas` : 'Nenhuma nação registrada ainda';
  const used = listSlots().filter(x=>x.meta).length;
  $('#m-continue').innerHTML = `📜 Continuar Jogo <small style="font-weight:400">(${used}/${MAX_SLOTS} partidas salvas)</small>`;
  const acc = $('#m-account');
  if (acc){ acc.innerHTML = NET.user ? `👤 <b>${esc(NET.user.name)}</b> · <a href="#" id="m-logout">Sair</a>${typeof CLOUD !== 'undefined' && CLOUD.ok === false && !NET.isLocal() ? '<div class="cloud-warn">⚠️ A nuvem não respondeu: seus jogos estão salvos só neste aparelho. (No Supabase, rode de novo o arquivo supabase/setup.sql.)</div>' : ''}` : ''; const lo = $('#m-logout'); if (lo) lo.onclick = e=>{ e.preventDefault(); SFX.click(); logout(); }; }
}
function showHUD(){
  hideAllScreens(); $('#hud').classList.remove('hidden');
  document.body.classList.add('ingame'); MapView.menuMode = false; MapView.placement = null;
  MapView.resize(); MapView.clampCam();
  setTimeout(()=>{ MapView.resize(); MapView.clampCam(); }, 60);
  MapView.onClick = onMapClick; MapView.onHover = onMapHover;
  refreshAll();
}
function showPage(title, html, onRender){
  $('#page-title').innerHTML = title; $('#page-body').innerHTML = html; $('#scr-page').classList.remove('hidden');
  $('#page-body').scrollTop = 0;
  if (onRender) setTimeout(onRender, 30);
}
$('#page-close').onclick = ()=>{ SFX.page(); $('#scr-page').classList.add('hidden'); if (UI.pageBack){ const f = UI.pageBack; UI.pageBack = null; f(); } };

// ------------------------------------------------------------
//  Barra superior
// ------------------------------------------------------------
function statBox(id, label, val, sub, bar, tip){
  return `<div class="st" id="st-${id}" title="${esc(tip||'')}"><span class="l">${label}</span><span class="v">${val}</span>${bar!==undefined?`<span class="bar"><i style="width:${clamp(bar,0,100)}%;background:${bar>60?'#7fbf5a':bar>35?'#e0b240':'#d9533f'}"></i></span>`:''}${sub?`<span class="d">${sub}</span>`:''}</div>`;
}
function updateTopbar(){
  if (!G) return;
  const p = G.p, b = p.lastBudget || budget();
  const fc = $('#tb-flag').getContext('2d'); drawFlag(fc, p.flag, 0, 0, 54, 36);
  $('#tb-name').textContent = p.name; $('#tb-sub').textContent = `${p.title} ${p.leader}`; $('#tb-sub').title = `${p.title} ${p.leader}`;
  $('#tb-date').textContent = MONTHS[curMonth()]; $('#tb-year').textContent = `Ano ${curYear()} · Mês ${G.turn+1}`;
  const bal = b.bal;
  const html =
    statBox('tre', '💰 Tesouro', fmtMoney(p.treasury), `<span class="${bal>=0?'up':'down'}">${bal>=0?'+':''}${fmtMoney(bal)}/mês</span>`, undefined, 'Dinheiro em caixa e saldo mensal') +
    statBox('gdp', '📈 PIB', fmtMoney(p.gdp), `<span class="${p.growth>=0?'up':'down'}">${p.growth>=0?'▲':'▼'} ${fmtPct(p.growth)}/ano</span>`, undefined, 'Produto Interno Bruto anual') +
    statBox('pop', '👥 Pop.', fmtPop(p.pop), `<span class="${p.popGrowth>=0?'up':'down'}">${fmtPct(p.popGrowth)}/ano</span>`) +
    statBox('area', '🗺️ Área', fmtArea(p.area), `${G.nations[1].cells} regiões`) +
    statBox('app', '😊 Apoio', Math.round(p.approval)+'%', undefined, p.approval, 'Clique para ouvir o povo') +
    statBox('stab', '⚖️ Estab.', Math.round(p.stability)+'%', undefined, p.stability, 'Estabilidade política. Abaixo de 10% há risco de revolução!') +
    statBox('rp', '🔬 Ciência', fmtNum(p.rpEff||p.rpRate||researchRate(),1)+'/mês', p.researching ? `<span>${TECH[p.researching].icon} ${Math.round(p.rp/techCost(p.researching)*100)}%</span>` : '—') +
    statBox('mil', '⚔️ Força', fmtNum(p.atk,0), G.wars.length ? `<span class="down">${G.wars.length} guerra(s)</span>` : '<span class="up">Em paz</span>', undefined, 'Poder de ataque');
  $('#tb-stats').innerHTML = html;
  // flash de variação
  const cur = {tre:p.treasury, gdp:p.gdp, pop:p.pop, area:p.area, app:p.approval, stab:p.stability};
  for (const k in cur){ const prev = UI.lastStats[k]; if (prev !== undefined && Math.abs(cur[k]-prev) > Math.abs(prev)*0.0005 + 0.05){ const el = $('#st-'+k); if (el) el.classList.add(cur[k]>prev?'flash-up':'flash-down'); } }
  UI.lastStats = cur;
  $$('#speed button').forEach(b=>b.classList.toggle('active', +b.dataset.s === UI.speed));
  $$('.map-tools .chip[data-mode]').forEach(c=>c.classList.toggle('active', c.dataset.mode === MapView.mode));
  const wb = $('#btn-wars'); if (wb){ const n = G.aiWars.length + G.wars.length; wb.innerHTML = `${MapView.worldFx?'💥':'🔇'} Guerras (${n})`; wb.classList.toggle('active', MapView.worldFx); }
  $('#btn-sound').textContent = SFX.sfxOn || SFX.musicOn ? '🔊' : '🔇';
  $('#ticker-text').textContent = G.news.length ? G.news.join('   ✦   ') : 'Sem notícias do mundo.';
}

function refreshAll(){ if (!G) return; derive(); updateTopbar(); renderPanel(); }

// ------------------------------------------------------------
//  Painéis laterais
// ------------------------------------------------------------
// recolher/mostrar o painel lateral: clicar de novo na aba aberta recolhe; clicar numa aba com o painel recolhido abre
function setSidebar(open){
  const was = !document.body.classList.contains('sb-collapsed'); if (was === open) return;
  document.body.classList.toggle('sb-collapsed', !open);
  setTimeout(()=>{ MapView.resize(); MapView.clampCam && MapView.clampCam(); }, 30);
}
$$('#tabs button').forEach(b=> b.onclick = ()=>{
  const collapsed = document.body.classList.contains('sb-collapsed');
  if (!collapsed && UI.tab === b.dataset.tab){ SFX.click(); setSidebar(false); return; }
  SFX.page(); UI.tab = b.dataset.tab; $$('#tabs button').forEach(x=>x.classList.toggle('active', x===b)); setSidebar(true); renderPanel();
});
function meter(v, max, color){ return `<div class="meter"><i style="width:${clamp(v/max*100,0,100)}%;background:${color||(v/max>0.6?'#5a8f3c':v/max>0.35?'#c9a13b':'#b3261e')}"></i></div>`; }
function row(k, v, cls){ return `<div class="row"><span class="k">${k}</span><span class="v ${cls||''}">${v}</span></div>`; }

function renderPanel(){
  if (!G) return;
  const el = $('#panel'); const st = el.scrollTop;
  const f = {geral:panelGeral, metas:panelMetas, povo:panelPovo, ranking:panelRanking, obras:panelObras, economia:panelEconomia, militar:panelMilitar, diplomacia:panelDiplomacia, tecnologia:panelTecnologia, leis:panelLeis, registro:panelRegistro}[UI.tab];
  el.innerHTML = f();
  bindPanel(el);
  el.scrollTop = st;
}

function panelGeral(){
  const p = G.p, r = rankings(), m = p.mods || calcMods();
  const temps = p.temp.map(t=>`<div class="row"><span class="k">⏳ ${esc(t.label)}</span><span class="v">${t.until-G.turn} meses</span></div>`).join('');
  return `
  <div style="text-align:center"><canvas id="pg-flag" width="180" height="120" style="border:2px solid var(--ink2);box-shadow:3px 4px 10px rgba(0,0,0,.3)"></canvas></div>
  <div class="ph" style="justify-content:center;text-align:center;margin-top:8px">${esc(p.official)}</div>
  <div class="muted" style="text-align:center">“${esc(p.motto||'')}”</div>
  <div class="box leader-card"><div class="lc-img">${avatarSVG(playerAvatar(), p.party && (p.avatar.extras||[]).includes('broche') ? emblemOf(p.party) : null, 84)}</div>
    <div><div class="lc-name">${esc(p.title)} ${esc(p.leader)}</div><div class="muted">${p.age} anos · ${p.avatar.height} cm${p.party ? ' · ' + esc(p.party.abbr || p.party.name) : ''}</div>
    <button class="btn xs" id="btn-avatar">🎨 Visual do líder</button></div>${p.party ? `<div class="lc-emb" title="${esc(p.party.name)}">${emblemSVG(emblemOf(p.party), 40)}</div>` : ''}</div>
  <div class="box">
    ${row('Chefe de Estado', `${esc(p.title)} ${esc(p.leader)}`)}
    ${row('Idade · Perfil', `${p.age} anos · ${TRAITS[p.trait].name}`)}
    ${row('Regime', GOVS[p.gov].name)}${row('Economia', ECONS[p.econ].name)}${row('Religião', RELIGIONS[p.religion])}
    ${row('Capital', `⭐ ${esc(p.capital)}`)}${row('Moeda', `${esc(p.currency)} (${esc(p.currencySym)})`)}${row('Idioma', esc(p.language))}
    ${GOVS[p.gov].elections && p.nextElection>0 ? row('Próxima eleição', `em ${p.nextElection-G.turn} meses`) : ''}
  </div>
  <div class="sub">Posição mundial</div>
  <div class="btn-grid" style="grid-template-columns:repeat(3,1fr);text-align:center">
    <div class="box">💰<br><b>#${r.gdp}</b><br><small>PIB</small></div><div class="box">🗺️<br><b>#${r.area}</b><br><small>Área</small></div><div class="box">⚔️<br><b>#${r.power}</b><br><small>Militar</small></div>
  </div>
  <div class="sub">Indicadores</div>
  <div class="row"><span class="k">😊 Apoio popular</span><span class="v">${fmtPct(p.approval,0)}</span></div>${meter(p.approval,100)}
  <div class="row"><span class="k">⚖️ Estabilidade</span><span class="v">${fmtPct(p.stability,0)}</span></div>${meter(p.stability,100)}
  <div class="row"><span class="k">🎖️ Moral das tropas</span><span class="v">${fmtPct(p.morale*100,0)}</span></div>${meter(p.morale,1.3)}
  <div class="row"><span class="k">🏛️ Eficiência administrativa</span><span class="v">${fmtPct(p.admin*100,0)}</span></div>${meter(p.admin,1.1)}
  <div class="row"><span class="k">💀 Corrupção</span><span class="v">${fmtPct(p.corruption*100,0)}</span></div>${meter(p.corruption,0.5,'#8b1a1a')}
  <div class="row"><span class="k">😩 Cansaço de guerra</span><span class="v">${fmtPct(p.warWeary,0)}</span></div>${meter(p.warWeary,100,'#8b1a1a')}
  <div class="sub">Nação <button class="btn xs" id="btn-names" style="float:right">✏️ Editar nomes</button></div>
  ${row(POWER_KINDS[powerKind(p.gov)].icon + ' ' + POWER_KINDS[powerKind(p.gov)].label, p.party && p.party.kind === powerKind(p.gov) ? partyLabel(p.party) : '<a href="#" id="lnk-party">escolher</a>')}
  ${row('População', fmtPop(p.pop))}${row('Crescimento populacional', fmtPct(p.popGrowth)+'/ano')}
  ${row('Área', fmtArea(p.area))}${row('Densidade', fmtNum(p.pop*1e6/Math.max(1,p.area),1)+' hab/km²')}
  ${row('Estados', p.states + ` <small class="muted">(ideal ≈ ${Math.round(clamp(p.area/150000,2,80))})</small>`)}${row('Cidades', p.cities)}${row('Urbanização', fmtPct(p.urb*100,0))}
  ${row('Clima · Terreno', `${CLIMATES[p.climate].name} · ${TERRAINS[p.terrain].name}`)}
  ${row('Recursos', p.resources.map(r=>RESOURCES[r].icon+' '+RESOURCES[r].name).join(', ') || '—')}
  ${row('PIB per capita', fmtPc(p.gdpPc))}
  ${temps ? `<div class="sub">Efeitos temporários</div>${temps}` : ''}
  <div class="sub">Conquistas (${G.achievements.length}/${Object.keys(ACHIEVEMENTS).length})</div>
  <div>${G.achievements.map(a=>`<span class="ach" title="${esc(ACHIEVEMENTS[a].d)}">${ACHIEVEMENTS[a].icon} ${ACHIEVEMENTS[a].n}</span>`).join('') || '<span class="muted">Nenhuma ainda.</span>'}</div>
  <div style="margin-top:12px;display:flex;gap:6px"><button class="btn sm" data-act="report">📊 Relatório completo</button><button class="btn sm" data-act="home">🏠 Ver capital</button><button class="btn sm" data-act="capital">🏛️ Mudar capital</button></div>`;
}
function fmtPc(v){ return `${G.p.currencySym} ${fmtNum(v,0)}`; }

function panelEconomia(){
  const p = G.p, b = budget(), m = p.mods;
  const dr = p.debt/Math.max(1,p.gdp)*100;
  const sl = (key, label, val, max, step, help, fmtv) => `<div class="slider-row"><div class="top"><span>${label}</span><b id="sv-${key}">${fmtv(val)}</b></div>
    <input type="range" min="0" max="${max}" step="${step}" value="${val}" data-slider="${key}"><div class="help">${help}</div></div>`;
  const incNames = {impostos:'🏛️ Impostos', comercio:'⚓ Comércio exterior', recursos:'⛏️ Recursos naturais', tributos:'👑 Tributos recebidos', bloco:'🌐 Mercado comum (bloco)'};
  const expNames = {edu:'📚 Educação', health:'⚕️ Saúde', infra:'🏗️ Infraestrutura', social:'🤲 Bem-estar', research:'🔬 Ciência', police:'👮 Segurança', leis:'📜 Leis e programas', administracao:'🏛️ Administração', militar:'⚔️ Manutenção militar', juros:'🏦 Juros da dívida'};
  const partners = G.nations.filter(n=>n && n.id>1 && n.alive && dealCount(n));
  return `
  <div class="ph">Tesouro Nacional <span class="muted">${esc(p.currency)}</span></div>
  <div class="box">
    ${row('💰 Em caixa', fmtMoney(p.treasury), p.treasury<0?'down':'')}
    ${row('📊 Saldo mensal', (b.bal>=0?'+':'')+fmtMoney(b.bal), b.bal>=0?'up':'down')}
    ${row('🏦 Dívida pública', `${fmtMoney(p.debt)} (${fmtPct(dr,0)} do PIB)`, dr>100?'down':'')}
    ${row('⭐ Rating de crédito', `${creditRating()} · juros ${fmtPct(interestRate())}/ano`)}
    ${row('📈 PIB', fmtMoney(p.gdp))}${row('👤 PIB per capita', fmtPc(p.gdpPc))}
    ${row('📉 Inflação', fmtPct(p.inflation), p.inflation>10?'down':'')}${row('🏚️ Desemprego', fmtPct(p.unemployment), p.unemployment>12?'down':'')}
  </div>
  <div class="sub">Impostos</div>
  ${sl('tax','🏛️ Carga tributária', Math.round(p.tax*100), 60, 1, 'Mais impostos = mais receita, menos apoio e crescimento', v=>v+'%')}
  <div class="sub">Gastos públicos (% do PIB)</div>
  ${Object.entries(SPEND_INFO).map(([k,s])=>sl(k, `${s.icon} ${s.n}`, p.spend[k], s.max, 0.5, s.d, v=>(+v).toFixed(1)+'%')).join('')}
  <div class="sub">Orçamento mensal</div>
  <div class="box" id="budget-box">${budgetHTML(b, incNames, expNames)}</div>
  <div class="sub">⛏️ Recursos naturais</div>
  <div class="muted" style="margin-bottom:4px">Exportar a matéria-prima rende dinheiro já, mas depois importamos o produto pronto. Industrializar custa caro e leva 12 meses, porém gera empregos e muito mais riqueza.</div>
  ${p.resources.map(r=>{ const md = resMode(r), I = RES_INDUSTRY[r]||{}; const lock = I.tech && !p.techs.includes(I.tech);
    return `<div class="box"><div class="row"><b>${RESOURCES[r].icon} ${RESOURCES[r].name}</b><span class="v">${md==='exportar'?'📦 Exportando':md==='montando'?`🏗️ Industrializando (${(p.resSetup||{})[r]-G.turn} m)`:'🏭 Industrializado'}</span></div>
      <small>${md==='exportar'?`Renda: +${fmtMoney(p.gdp/12*resExportRate(r))}/mês · importações: −${fmtMoney(p.gdp/12*0.0015)}/mês`:md==='industrializar'?`${I.n}: +3,5% PIB, menos desemprego`:'Obras em andamento'}</small>
      <div class="flex" style="margin-top:4px">${md==='exportar'?`<button class="btn xs green" data-resmode="${r}:industrializar" ${lock?'disabled':''}>🏭 Industrializar (${fmtMoney(industrializeCost())})</button>${lock?`<small style="color:var(--red2)">🔒 ${TECH[I.tech].n}</small>`:''}`:md==='industrializar'?`<button class="btn xs" data-resmode="${r}:exportar">📦 Voltar a exportar bruto</button>`:''}</div></div>`; }).join('') || '<div class="muted">Nenhum recurso natural.</div>'}
  <div class="sub">Finanças</div>
  <div class="btn-grid">
    <button class="btn sm" data-econ="loan" data-f="0.05">🏦 Empréstimo 5% PIB</button><button class="btn sm" data-econ="loan" data-f="0.15">🏦 Empréstimo 15% PIB</button>
    <button class="btn sm" data-econ="repay" data-f="0.25">💵 Pagar 25% dívida</button><button class="btn sm" data-econ="repay" data-f="1">💵 Quitar dívida</button>
    <button class="btn sm" data-econ="print" ${p.policies.banco_central?'disabled':''} title="+${fmtMoney(p.gdp*0.03)} no tesouro · inflação +${fmtNum(printInflJump(),1)} pp na hora e mais nos meses seguintes">🖨️ Imprimir dinheiro <small>(+${fmtNum(printInflJump(),1)} pp inflação)</small></button><button class="btn sm" data-econ="default" ${dr<60?'disabled':''}>⚠️ Moratória</button>
  </div>
  <div class="sub">Desenvolvimento</div>
  <div class="btn-grid">
    <button class="btn sm" data-econ="city">🏙️ Fundar cidade<br><small>${fmtMoney(ECON_ACTIONS.cityCost())}</small></button>
    <button class="btn sm" data-econ="addState">🗺️ Criar estado<br><small>${fmtMoney(0.004*p.gdp)}</small></button>
    <button class="btn sm" data-econ="mergeState">🔗 Fundir estados<br><small>-2 estabilidade</small></button>
    <div class="box" style="margin:0;font-size:12px">Estados: <b>${p.states}</b> (ideal ≈ ${Math.round(clamp(p.area/150000,2,80))})<br>Eficiência: <b>${fmtPct(p.admin*100,0)}</b></div>
  </div>
  <div class="sub">Parceiros comerciais (${partners.length})</div>
  ${partners.length ? partners.map(n=>`<div class="row" data-nation="${n.id}" style="cursor:pointer"><span class="k">${flagImg(n,18,12)} ${esc(n.name)} <small>${Object.keys(n.deals).map(t=>DEALS[t].icon).join(' ')}</small></span><span class="v up">+${fmtMoney(Object.keys(n.deals).reduce((s,t)=>s+dealIncome(n,t),0)*(1+m.tradeMult))}</span></div>`).join('') : '<div class="muted">Nenhum acordo. Negocie na aba Diplomacia (leva alguns meses).</div>'}`;
}
function budgetHTML(b, incNames, expNames){
  incNames = incNames || {impostos:'🏛️ Impostos', comercio:'⚓ Comércio exterior', recursos:'⛏️ Recursos naturais', tributos:'👑 Tributos recebidos', bloco:'🌐 Mercado comum (bloco)'};
  expNames = expNames || {edu:'📚 Educação', health:'⚕️ Saúde', infra:'🏗️ Infraestrutura', social:'🤲 Bem-estar', research:'🔬 Ciência', police:'👮 Segurança', leis:'📜 Leis e programas', administracao:'🏛️ Administração', militar:'⚔️ Manutenção militar', juros:'🏦 Juros da dívida'};
  return `<div class="lbl" style="color:var(--green)">Receitas</div>` +
    Object.entries(b.inc).filter(([k,v])=>v>0.01).map(([k,v])=>row(incNames[k]||k, '+'+fmtMoney(v), 'up')).join('') +
    `<div class="lbl" style="color:var(--red);margin-top:6px">Despesas</div>` +
    Object.entries(b.exp).filter(([k,v])=>v>0.01).map(([k,v])=>row(expNames[k]||k, '-'+fmtMoney(v), 'down')).join('') +
    `<hr style="border:none;border-top:1px solid var(--ink3)">` + row('<b>Saldo</b>', `<b>${b.bal>=0?'+':''}${fmtMoney(b.bal)}</b>`, b.bal>=0?'up':'down');
}

function panelMilitar(){
  const p = G.p, m = p.mods;
  const wars = G.wars.map(w=>{ const n = G.nations[w.e];
    return `<div class="box"><div class="row"><b>${flagImg(n,22,15)} ${esc(n.name)}</b><span class="tag war">GUERRA</span></div>
      ${row('Duração', `${G.turn-w.start} meses`)}${row('Placar de guerra', `<span class="${w.score>=0?'up':'down'}">${w.score>0?'+':''}${w.score}</span>`)}
      ${row('Batalhas', `${w.won} vitórias · ${w.lost} derrotas`)}${row('Regiões', `+${w.taken} / -${w.lostCells}`)}
      ${row('Poder inimigo', `${fmtNum(n.power,0)} <small class="muted">(nosso: ${fmtNum(p.atk,0)})</small>`)}
      <div class="flex" style="margin-top:4px"><button class="btn xs" data-nation="${n.id}">🕊️ Negociar paz</button><button class="btn xs" data-fly="${n.id}">🎯 Ver frente</button></div></div>`; }).join('');
  const corps = (p.corps||[]).map(k=>`<div class="box corps-box ${UI.selCorps===k.id?'sel':''}">
      <div class="row"><b>🎖️ ${esc(k.name)}</b><span class="v">${corpsUnitsCount(k)} div.</span></div>
      <small>${k.naval?`⛴️ embarcado (${k.naval} m)`:k.path&&k.path.length?`🥾 marchando (${Math.ceil(k.path.length/corpsSpeed())} m)`:'🏕️ acampado'}${Grid.owner[k.cell]!==1?' · em território estrangeiro':''} · ⚔ ${fmtNum(corpsPower(k,'atk'),0)} · 🛡 ${fmtNum(corpsPower(k,'def'),0)} · moral ${Math.round((k.morale||1)*100)}%${k.lastAttack===G.turn?' · já atacou este mês':''}</small>
      <div class="flex" style="margin-top:4px"><button class="btn xs" data-corps="${k.id}">🎯 Selecionar</button><button class="btn xs" data-creinf="${k.id}">➕ Reforçar 25%</button></div></div>`).join('');
  const units = UNITS.map(u=>{
    const locked = u.req && !p.techs.includes(u.req);
    const c = p.units[u.id]||0;
    return `<div class="unit ${locked?'locked':''}"${tip(`${u.icon} ${u.n}`, UNIT_TIPS[u.id]||'', locked?`🔒 Requer ${TECH[u.req].n} (${TECH[u.req].year})`:`Ataque ${u.atk} · Defesa ${u.def}${u.nav?` · Naval ${u.nav}`:''} · usa ${u.man} mil soldados`)}><span class="ic">${u.icon}</span>
      <span class="nm"><b>${u.n}</b><small>${locked?`🔒 Requer ${TECH[u.req].n}`:`${fmtMoney(unitCost(u.id,m))} · manut. ${fmtMoney(unitUpkeep(u.id,m))}/mês · ${u.id==='nuke'?'arma estratégica':`⚔${u.atk} 🛡${u.def}${u.nav?' ⚓'+u.nav:''}`}`}</small></span>
      <span class="ct">${locked?'':`<button class="btn xs" data-dis="${u.id}" ${c?'':'disabled'}>−</button><span class="cnt">${c}</span><button class="btn xs" data-rec="${u.id}" data-q="1">+1</button>${u.id!=='nuke'?`<button class="btn xs" data-rec="${u.id}" data-q="5">+5</button>`:''}`}</span></div>`;
  }).join('');
  return `
  <div class="ph">Forças Armadas</div>
  <div class="btn-grid" style="grid-template-columns:repeat(3,1fr);text-align:center">
    <div class="box">⚔️<br><b>${fmtNum(p.atk,0)}</b><br><small>Ataque</small></div><div class="box">🛡️<br><b>${fmtNum(p.def,0)}</b><br><small>Defesa</small></div><div class="box">⚓<br><b>${fmtNum(p.navy,0)}</b><br><small>Marinha</small></div>
  </div>
  ${row('🎖️ Moral nacional', fmtPct(p.morale*100,0))}${row('👥 Reservas humanas', `${fmtNum(p.manpower,0)} mil / ${fmtNum(p.maxMan,0)} mil`)}
  ${row('🥾 Marcha', `${corpsSpeed()} regiões/mês`)}${row('📏 Alcance de ataque', corpsReach()+' regiões')}
  ${row('🔥 Regiões ocupadas', occupiedCount())}${row('😩 Cansaço de guerra', fmtPct(p.warWeary,0))}
  <div class="sub">Exércitos em campo (${(p.corps||[]).length})</div>
  <div class="tip">Clique num exército no mapa (escudo com o número de divisões) e depois clique no destino para <b>marchar</b>, ou numa região inimiga próxima para <b>atacar</b>. Regiões sem tropas por perto ficam vulneráveis, e terras conquistadas sem guarnição podem se revoltar.</div>
  ${corps || '<div class="muted">Nenhum exército em campo — todas as tropas estão na reserva.</div>'}
  <button class="btn sm green" style="width:100%" data-newcorps="1">➕ Formar exército na capital (50% da reserva)</button>
  <div class="sub">Guerras (${G.wars.length})</div>
  ${wars || '<div class="muted">Estamos em paz. Para declarar guerra, abra uma nação na aba Diplomacia ou clique nela no mapa.</div>'}
  <div class="sub">Reserva e recrutamento</div>
  <div class="muted">Novas tropas vão para a reserva (defende o país com 35% da força). Envie-as para exércitos em campo.</div>
  ${units}`;
}

function panelDiplomacia(){
  const list = G.nations.filter(n=>n && n.id>1 && n.alive);
  const s = UI.diploSort;
  list.sort((a,b)=> s==='rel' ? b.rel-a.rel : s==='power' ? b.power-a.power : s==='gdp' ? b.pop*b.pc-a.pop*a.pc : a.name.localeCompare(b.name));
  const negs = G.negs.map(x=>{ const n = G.nations[x.n]; return `<div class="row"><span class="k">${negIcon(x)} ${esc(negName(x))} — ${esc(n.name)}</span><span class="v">${Math.max(0,x.due-G.turn)} m</span></div>`; }).join('');
  return `
  <div class="ph">Nações do Mundo <span class="muted">${list.length}</span></div>
  ${negs ? `<div class="sub">✉️ Negociações em andamento (${G.negs.length})</div><div class="box">${negs}</div>` : ''}
  <div class="filters">${[['rel','Relação'],['power','Poder'],['gdp','PIB'],['name','Nome']].map(([k,l])=>`<button data-sort="${k}" class="${s===k?'active':''}">${l}</button>`).join('')}</div>
  ${list.map(n=>`<div class="nation-row" data-nation="${n.id}">${flagImg(n,30,20)}
    <span class="nm"><b>${esc(n.name)}</b>${nationTags(n)}<small>👤 ${esc(n.leader||'')} · ${GOVS[n.gov]?GOVS[n.gov].name:''}</small><small>⚔ ${fmtNum(n.power,0)} · 💰 ${fmtMoney(n.pop*n.pc)}${adjacent(1,n.id)?' · 🧱 vizinho':''}</small></span>
    <span><div class="relbar"><i style="left:${(n.rel+100)/2}%"></i></div><small style="font-size:11.5px">${relLabel(n.rel)} (${n.rel>0?'+':''}${n.rel})</small></span></div>`).join('')}`;
}
function nationTags(n){
  return (n.atWar?'<span class="tag war">GUERRA</span>':'') + (n.alliance?'<span class="tag ally">ALIADO</span>':'') + (n.pact&&!n.alliance?'<span class="tag pact">PACTO</span>':'') +
    (dealCount(n)?`<span class="tag trade">${dealCount(n)} ACORDO${dealCount(n)>1?'S':''}</span>`:'') + (n.truce>G.turn&&!n.atWar?'<span class="tag truce">TRÉGUA</span>':'');
}
const BLOC_NAMES = {atl:'Liga Atlântica', ori:'Pacto Oriental'};

function panelTecnologia(){
  const p = G.p;
  const cur = p.researching ? TECH[p.researching] : null;
  const rate = p.rpRate || researchRate();
  const tiers = {};
  TECHS.forEach(t=> (tiers[t.tier] = tiers[t.tier] || []).push(t));
  const names = ['I — Velas e Pólvora (até 1600)','II — Razão e Luzes (1600–1760)','III — Vapor (1760–1870)','IV — Eletricidade (1870–1910)','V — Guerras Mundiais (1910–1945)','VI — Atômica (1945–1975)','VII — Informação (1975–2005)','VIII — Automação (2005–2040)','IX — Alvorada da Fusão (2040–2050)','X — Horizonte Estelar (depois de 2050)'];
  const y = curYear();
  const waiting = !cur && TECHS.some(t=>!p.techs.includes(t.id) && t.req.every(r=>p.techs.includes(r)));
  let curBox = '';
  if (cur){
    const br = researchBreakdown(cur.id), eff = rate*br.mult, cost = techCost(cur.id), months = Math.max(1, Math.ceil((cost-p.rp)/Math.max(0.1,eff)));
    const trend = p.rpPrevEff ? eff - p.rpPrevEff : 0;
    curBox = `<div class="row"><b>${cur.icon} ${cur.n} <small class="muted">(${cur.year} · ${TECH_CATS[br.cat].icon} ${TECH_CATS[br.cat].n})</small></b><span>${Math.round(p.rp)} / ${cost}</span></div>${meter(p.rp, cost, '#2c4f73')}
      <div class="row"><span class="k">Progresso</span><span class="v">${Math.round(p.rp/cost*100)}% · faltam ~${months} ${months>1?'meses':'mês'}</span></div>
      <div class="row"><span class="k">Velocidade</span><span class="v">${fmtNum(eff,1)} pts/mês <span class="${trend>0.05?'up':trend<-0.05?'down':''}">${trend>0.05?'▲ subindo':trend<-0.05?'▼ caindo':'● estável'}</span></span></div>
      <div class="lbl" style="margin-top:6px">O que influencia esta pesquisa</div>
      <div class="row"><span class="k">🔬 Base (educação, ciência, cidades)</span><span class="v">${fmtNum(rate,1)}</span></div>
      ${br.parts.map(x=>`<div class="row"><span class="k">${x.label}</span><span class="v ${x.v>=0?'up':'down'}">${x.v>=0?'+':''}${Math.round(x.v*100)}%</span></div>`).join('') || '<div class="muted">Nenhuma obra ou lei ajudando esta área ainda.</div>'}
      <div class="muted">💡 Ajudam ${TECH_CATS[br.cat].n.toLowerCase()}: ${helpersText(cur.id)}.</div>
      ${techGap(cur.id) > 0 ? `<div class="muted">⚡ Pesquisa à frente do seu tempo: +${Math.round(techGap(cur.id)*12)}% de custo.</div>` : ''}`;
  }
  return `
  <div class="ph">Pesquisa Científica <span class="muted">Ano ${y}</span></div>
  <div class="box">
    ${cur ? curBox : waiting ? '<div class="muted">⏳ Nenhuma descoberta é possível ainda — o mundo precisa avançar. Novas pesquisas são liberadas com o passar dos anos.</div>' : '<div class="muted">Nenhuma pesquisa disponível.</div>'}
    ${row('Tecnologias conhecidas', `${p.techs.length} / ${TECHS.length}`)}
    ${row('Média mundial', fmtNum(G.nations.filter(n=>n&&n.id>1&&n.alive).reduce((s,n,_,a)=>s+n.tech/a.length,0),1))}
  </div>
  <div class="tip">Cada tecnologia tem sua <b>época histórica</b> e uma <b>área</b> (medicina, indústria, militar...). Obras e leis daquela área aceleram a pesquisa — passe o mouse sobre uma tecnologia para ver o que ajuda.</div>
  <div class="tech-tiers">
  ${Object.keys(tiers).map(k=>`<div class="tier"><div class="tier-lbl">ERA ${names[k]}</div>${tiers[k].map(t=>{
    const done = p.techs.includes(t.id), reqOk = t.req.every(r=>p.techs.includes(r)), timeOk = techTimeOk(t.id);
    const avail = reqOk && timeOk, cls = done?'done':(p.researching===t.id?'cur':(avail?'':'lock'));
    const status = done ? '✔ Conhecida' : !timeOk ? `🔒 Disponível a partir de ${t.year - TECH_LEAD}` : !reqOk ? '🔒 Requer: ' + t.req.filter(r=>!p.techs.includes(r)).map(r=>TECH[r].n).join(', ') : `${techCost(t.id)} pts${techGap(t.id)>0?' ⚡':techGap(t.id)<-10?' (difundida)':''}`;
    const cat = TECH_CATS[techCat(t.id)];
    const unl = (t.unlock||[]).map(u=>UNIT[u]?UNIT[u].icon+' '+UNIT[u].n:'').concat(Object.entries(BUILDINGS).filter(([k,B])=>B.req===t.id).map(([k,B])=>B.icon+' '+B.n)).filter(Boolean);
    return `<div class="tech ${cls}" data-tech="${t.id}"${tip(`${t.icon} ${t.n} (${t.year})`, `${t.d}.<br>Área: ${cat.icon} ${cat.n}.`, `Efeito: ${fxList(t.fx)||'—'}${unl.length?'<br>Libera: '+unl.join(', '):''}<br>Acelerada por: ${helpersText(t.id)}${t.req.length?'<br>Requer: '+t.req.map(r=>TECH[r].n).join(', '):''}`)}><b>${t.icon} ${t.n}</b><small>📅 ${t.year} · ${status}</small><small>${t.d}</small></div>`;
  }).join('')}</div>`).join('')}
  </div>`;
}

function panelLeis(){
  const p = G.p;
  const ref = p.reform ? `<div class="box">🏛️ <b>Transição em andamento:</b> ${p.reform.kind==='gov'?GOVS[p.reform.to].name:ECONS[p.reform.to].name}<br>${meter(G.turn-p.reform.start, p.reform.due-p.reform.start,'#2c4f73')}<small>Conclusão em ${p.reform.due-G.turn} meses</small></div>` : '';
  let consti = '';
  if (hasConstitution(p.gov) && p.constitution){
    consti = `<div class="sub">📜 Constituição</div>
    ${p.amend ? `<div class="box">📜 Emenda em votação: <b>${CONSTITUTION[p.amend.art].n}</b> → ${CONSTITUTION[p.amend.art].opts[p.amend.val].n}<br><small>Votação em ${Math.max(0,p.amend.due-G.turn)} meses · precisa de ${amendThreshold()}% de apoio (atual ${Math.round(p.approval)}%)</small></div>` : ''}
    ${Object.entries(CONSTITUTION).filter(([k,A])=>!A.elections || GOVS[p.gov].elections).map(([k,A])=>`<div class="const-art"><div class="lbl">${A.n}</div>
      <div class="flex"><select data-art="${k}" ${p.amend?'disabled':''}>${Object.entries(A.opts).map(([v,o])=>`<option value="${v}" ${p.constitution[k]===v?'selected':''}>${o.n}</option>`).join('')}</select>
      <button class="btn xs" data-amend="${k}" ${p.amend?'disabled':''}>Emendar</button></div>
      <small class="muted">${(A.opts[p.constitution[k]]||{}).fx ? Object.entries(A.opts[p.constitution[k]].fx).map(([a,b])=>fxLabel(a,b)).join(', ') : 'Sem efeitos especiais'}</small></div>`).join('')}
    ${p.constitution.direitos==='garantidos' && (p.spend.health<3||p.spend.edu<3) ? '<div class="tip" style="border-color:#b3261e">⚠️ A Constituição garante saúde e educação (mín. 3% do PIB cada). O governo está descumprindo: −7 de apoio.</div>' : ''}`;
  }
  return `<div class="ph">Governo e Leis</div>
  <div class="box">${row('Regime', GOVS[p.gov].name)}${row('Economia', ECONS[p.econ].name)}${GOVS[p.gov].elections ? row('Mandatos cumpridos', p.terms||1) + row('Próxima eleição', `em ${p.nextElection-G.turn} meses`) : ''}
    <div class="btn-grid"><button class="btn sm" data-reform="gov" ${p.reform?'disabled':''}>🏛️ Mudar regime</button><button class="btn sm" data-reform="econ" ${p.reform?'disabled':''}>💱 Mudar economia</button></div></div>
  ${ref}${consti}
  <div class="sub">Leis e políticas</div>
  <div class="muted" style="margin-bottom:6px">Leis têm efeitos permanentes enquanto ativas. Algumas custam uma fração do PIB por ano.</div>
  ${typeof lawProcess === 'function' ? `<div class="box">🏛️ <b>Como as leis são aprovadas no seu regime:</b> ${lawProcess(p.gov).n}</div>` : ''}
  ${(p.bills||[]).length ? `<div class="box">🗳️ <b>Em votação:</b> ${p.bills.map(b=>`${POLICY[b.id].icon} ${POLICY[b.id].n} (${b.enact?'aprovar':'revogar'} · ${Math.round(b.chance*100)}% · ${Math.max(0,b.due-G.turn)} mês(es))`).join(' · ')}</div>` : ''}
  ${POLICIES.slice().sort((a,b)=>(!!(typeof lawLock==='function'&&lawLock(a)) - !!(typeof lawLock==='function'&&lawLock(b))) || (a.from||0)-(b.from||0)).map(P=>{
    const cb = !p.policies[P.id] ? constBlocks(P.id) : null, lk = !p.policies[P.id] && typeof lawLock === 'function' ? lawLock(P) : null;
    const voting = (p.bills||[]).some(b=>b.id===P.id);
    const blocked = (P.block && P.block.includes(p.gov)) || (P.req && !p.techs.includes(P.req)) || !!cb || !!lk;
    const fx = Object.entries(P.fx).map(([k,v])=>fxLabel(k,v)).join(', ');
    return `<div class="policy"${tip(`${P.icon} ${P.n}`, P.d, fx + (P.cost?` · custa ${P.cost}% do PIB por ano`:''))}><span class="ic">${P.icon}</span><span class="nm"><b>${P.n}</b><small>${P.d}</small><small style="color:var(--ink2)">${fx}${P.cost?` · custo ${P.cost}% PIB/ano`:''}${P.from ? ` · desde ${P.from}` : ''}${P.lean && typeof LEAN_N !== 'undefined' ? ` · lei ${LEAN_N[P.lean]}` : ''}${voting ? ' · 🗳️ em votação' : ''}${blocked?` · 🔒 ${lk || cb || (P.req && !p.techs.includes(P.req) ? 'requer '+TECH[P.req].n : 'proibido pelo regime')}`:''}</small></span>
      <span class="switch ${p.policies[P.id]?'on':''} ${blocked?'dis':''}" data-pol="${P.id}"></span></div>`;
  }).join('')}`;
}
function openReformModal(kind){
  const p = G.p, list = kind === 'gov' ? GOVS : ECONS, cur = kind === 'gov' ? p.gov : p.econ;
  const m = openModal(`<div class="m-icon">🏛️</div><div class="m-title">${kind==='gov'?'Mudança de regime':'Reforma econômica'}</div>
    <div class="m-text">${kind==='gov'?'A transição leva de 8 a 14 meses, custa 2% do PIB e derruba a estabilidade (−10). Regimes democráticos recebem uma Constituição.':'A reforma leva de 4 a 8 meses e custa 1% do PIB.'}</div>
    <div class="cards">${Object.entries(list).filter(([k])=>typeof govOk !== 'function' || (kind === 'gov' ? govOk(k, curYear()) : econOk(k, curYear()))).map(([k,v])=>`<div class="card ${k===cur?'sel':''}" data-to="${k}"><b>${v.name}</b><span>${v.desc||''}</span></div>`).join('')}</div>
    <div class="m-actions"><button class="btn" id="rf-close">Cancelar</button></div>`, {wide:true});
  m.querySelector('#rf-close').onclick = ()=>{ SFX.click(); closeModal(); };
  m.querySelectorAll('[data-to]').forEach(c=>c.onclick = ()=>{ const r = startReform(kind, c.dataset.to); closeModal(); if (r.ok){ SFX.bell(); toast(r.msg,'good'); } else { SFX.error(); toast(r.why,'bad'); } refreshAll(); });
}

function fxLabel(k, v){
  const n = {taxEff:'arrecadação', growth:'crescimento', research:'pesquisa', military:'ataque', defense:'defesa', navy:'marinha', stability:'estabilidade', approval:'apoio', corruption:'corrupção', warWeary:'cansaço de guerra', popGrowth:'cresc. pop.', unemployment:'desemprego', inflation:'inflação', tradeMult:'comércio', unitCost:'custo militar', manpower:'reservas', gdpMult:'PIB', admin:'administração', relations:'relações', coup:'risco de golpe'}[k] || k;
  const pctKeys = ['taxEff','research','military','defense','navy','corruption','tradeMult','unitCost','manpower','gdpMult','admin','coup','warWeary'];
  const val = pctKeys.includes(k) ? `${v>0?'+':''}${Math.round(v*100)}%` : `${v>0?'+':''}${v}${['growth','popGrowth','unemployment','inflation'].includes(k)?' pp':''}`;
  return `${val} ${n}`;
}

function panelRegistro(){
  const f = UI.logFilter;
  const items = G.log.filter(l=> f==='all' || l.k===f || (f==='good'&&l.k==='good') ).slice(-250).reverse();
  return `<div class="ph">Crônica da Nação</div>
  <div class="filters">${[['all','Tudo'],['war','Guerra'],['good','Conquistas'],['bad','Crises'],['dip','Diplomacia'],['evt','Decisões'],['info','Mundo']].map(([k,l])=>`<button data-filter="${k}" class="${f===k?'active':''}">${l}</button>`).join('')}</div>
  ${items.map(l=>`<div class="log-entry ${l.k}"><span class="t">${dateStr(l.t)}</span>${esc(l.txt)}</div>`).join('') || '<div class="muted">Nada registrado.</div>'}`;
}

function openCityFounding(cell){
  const p = G.p, nm = genPlaceName(), coastal = isCoastal(cell);
  const m = openModal(`<div class="m-icon">🏙️</div><div class="m-title">Fundar uma nova cidade</div>
    <div class="m-date">Custo: ${fmtMoney(buildCost('cidade'))}</div>
    <div class="field"><label>Nome da cidade</label><input type="text" id="cf-name" maxlength="28" value="${esc(nm)}"></div>
    <div class="lbl">Vocação da cidade</div>
    <div class="cards">${Object.entries(CITY_VOC).map(([k,v])=>`<div class="card ${k==='comercial'?'sel':''} ${v.coastal&&!coastal?'dis':''}" data-voc="${k}"${tip(`${v.icon} ${v.n}`, v.d, fxList(v.fx))}><b>${v.icon} ${v.n}</b><span>${v.d}</span></div>`).join('')}</div>
    <div class="m-actions"><button class="btn" id="cf-x">Cancelar</button><button class="btn green" id="cf-ok">🏙️ Fundar cidade</button></div>`, {wide:true});
  let voc = 'comercial';
  m.querySelectorAll('[data-voc]').forEach(c=> c.onclick = ()=>{ voc = c.dataset.voc; SFX.click(); m.querySelectorAll('[data-voc]').forEach(x=>x.classList.toggle('sel', x===c)); });
  m.querySelector('#cf-x').onclick = ()=>{ SFX.click(); closeModal(); };
  m.querySelector('#cf-ok').onclick = ()=>{ const name = m.querySelector('#cf-name').value.trim() || nm; const r = foundCity(cell, name, voc);
    closeModal(); if (r.ok){ SFX.build(); SFX.coin(); const [wx,wy] = cellXY(cell); MapView.ring(wx, wy, '#2d5a19', 24); MapView.floatText(wx, wy, '🏙️ ' + name, '#2d5a19'); toast(r.msg, 'good'); MapView.buildMode = null; refreshAll(); saveGame(); } else { SFX.error(); toast(r.why, 'bad'); } };
}
function cityPopSection(cell){
  const p = G.p, isCity = cell === p.capCell || p.cityCells.includes(cell);
  if (!isCity) return '';
  const ci = cityInfo(cell), v = CITY_VOC[ci.voc];
  const near = (p.buildings||[]).filter(b=>b.t!=='cidade' && Grid.owner[b.c]===1 && cellDist(b.c, cell) <= 2).map(b=>buildingLevelName(b));
  return `<div class="box" style="margin:6px 0">
    <div style="font-family:var(--title);font-weight:700;font-size:16px">${cell===p.capCell?'⭐':'🏙️'} ${esc(ci.name)}${cell===p.capCell?' <small class="muted">(capital)</small>':''}</div>
    ${row('👥 População', '~' + fmtPop(cityPopulation(cell)))}
    ${row('Vocação', v ? `${v.icon} ${v.n}` : '—')}
    ${row('Fundada em', ci.founded !== null && ci.founded !== undefined ? dateStr(ci.founded) : 'antes da nação')}
    ${row('Obras próximas', near.length ? near.join(', ') : 'nenhuma')}
    ${ci.proj ? row('🏗️ Projeto', `${CITY_PROJ[ci.proj.id].icon} ${CITY_PROJ[ci.proj.id].n} — ${ci.proj.due-G.turn} meses`) : ''}
    ${(ci.done||[]).length ? row('✔ Concluídos', [...new Set(ci.done)].map(id=>CITY_PROJ[id].icon).join(' ')) : ''}
    <button class="btn xs green" id="ct-proj" style="width:100%;margin:4px 0">🏗️ Projetos da cidade</button>
    <div class="btn-grid"><button class="btn xs" id="ct-ren">✏️ Renomear</button><button class="btn xs" id="ct-voc">🔁 Mudar vocação</button>
      ${cell!==p.capCell?`<button class="btn xs" id="ct-cap" style="grid-column:span 2">🏛️ Tornar capital (${fmtMoney(capitalCost())})</button>`:''}</div></div>`;
}
function bindCityPop(pop, cell, x, y){
  const ren = pop.querySelector('#ct-ren'); if (!ren) return;
  ren.onclick = ()=>{ const ci = cityInfo(cell); closePopover();
    const m = openModal(`<div class="m-icon">✏️</div><div class="m-title">Renomear cidade</div><div class="field"><label>Novo nome</label><input type="text" id="rn-name" maxlength="28" value="${esc(ci.name)}"></div>
      <div class="m-actions"><button class="btn" id="rn-x">Cancelar</button><button class="btn green" id="rn-ok">Salvar</button></div>`);
    const inp = m.querySelector('#rn-name'); inp.focus(); inp.select();
    m.querySelector('#rn-x').onclick = ()=>{ SFX.click(); closeModal(); };
    m.querySelector('#rn-ok').onclick = ()=>{ const nm = inp.value.trim(); closeModal(); if (nm){ renameCity(cell, nm); SFX.click(); toast(`🏙️ Agora a cidade se chama ${esc(nm)}.`, 'good'); refreshAll(); saveGame(); } }; };
  pop.querySelector('#ct-voc').onclick = ()=>{ closePopover(); openVocation(cell); };
  pop.querySelector('#ct-proj').onclick = ()=>{ closePopover(); openCityProjects(cell); };
  const cap = pop.querySelector('#ct-cap'); if (cap) cap.onclick = ()=>{ closePopover(); confirmModal('🏛️', `Transferir a capital para ${esc(cityInfo(cell).name)}?`, `Custa ${fmtMoney(capitalCost())}, abala a estabilidade (−4) e a administração por 12 meses. O clima da nova capital passa a valer para o país.`, 'Transferir capital', ()=>{ const r = changeCapital(cell); if (r.ok){ SFX.fanfare(); toast(r.msg,'good'); bigBanner('🏛️ Nova capital', esc(G.p.capital)); } else { SFX.error(); toast(r.why,'bad'); } refreshAll(); saveGame(); }); };
}
function openCityProjects(cell){
  const ci = cityInfo(cell);
  const m = openModal(`<div class="m-icon">🏗️</div><div class="m-title">Projetos de ${esc(ci.name)}</div>
    <div class="m-date">${ci.proj ? `Em andamento: ${CITY_PROJ[ci.proj.id].icon} ${CITY_PROJ[ci.proj.id].n} (${ci.proj.due-G.turn} meses)` : 'Escolha um projeto para a cidade'}</div>
    <div class="cards">${Object.entries(CITY_PROJ).map(([id,P])=>{ const bl = projBlocked(cell, id); return `<div class="card ${bl?'dis':''}" data-proj="${id}"${tip(`${P.icon} ${P.n}`, P.d, `${P.months} meses · custa ${fmtMoney(projCost(id))}${P.fx?'<br>Efeito permanente: '+fxList(P.fx):''}${bl?'<br>🔒 '+bl:''}`)}><b>${P.icon} ${P.n}</b><span>${P.d}</span><span class="muted">${P.months} meses · ${fmtMoney(projCost(id))}${bl?' · 🔒 '+bl:''}</span></div>`; }).join('')}</div>
    <div class="m-actions"><button class="btn" id="pj-x">Fechar</button></div>`, {wide:true});
  m.querySelector('#pj-x').onclick = ()=>{ SFX.click(); closeModal(); };
  m.querySelectorAll('[data-proj]').forEach(c=> c.onclick = ()=>{ if (c.classList.contains('dis')) return; const r = startCityProject(cell, c.dataset.proj); closeModal(); if (r.ok){ SFX.build(); toast(r.msg,'good'); } else { SFX.error(); toast(r.why,'bad'); } refreshAll(); saveGame(); });
}
function openVocation(cell){
  const ci = cityInfo(cell), coastal = isCoastal(cell);
  const m = openModal(`<div class="m-icon">🔁</div><div class="m-title">Vocação de ${esc(ci.name)}</div><div class="m-date">Custo: ${fmtMoney(G.p.gdp*0.003 + 20*G.costScale)}</div>
    <div class="cards">${Object.entries(CITY_VOC).map(([k,v])=>`<div class="card ${k===ci.voc?'sel':''} ${v.coastal&&!coastal?'dis':''}" data-voc="${k}"><b>${v.icon} ${v.n}</b><span>${v.d}</span></div>`).join('')}</div>
    <div class="m-actions"><button class="btn" id="vo-x">Fechar</button></div>`, {wide:true});
  m.querySelector('#vo-x').onclick = ()=>{ SFX.click(); closeModal(); };
  m.querySelectorAll('[data-voc]').forEach(c=> c.onclick = ()=>{ if (c.dataset.voc === ci.voc) return; const r = changeVocation(cell, c.dataset.voc); closeModal(); if (r.ok){ SFX.build(); toast(r.msg,'good'); } else { SFX.error(); toast(r.why,'bad'); } refreshAll(); saveGame(); });
}
function openCapitalModal(){
  const p = G.p, cities = p.cityCells.filter(c=>Grid.owner[c]===1 && c!==p.capCell);
  const m = openModal(`<div class="m-icon">🏛️</div><div class="m-title">Mudar a capital</div>
    <div class="m-text">Escolha a cidade que será a nova capital. Custa ${fmtMoney(capitalCost())}, abala a estabilidade e a administração por um tempo. Você também pode clicar numa cidade no mapa.</div>
    ${cities.length ? cities.map(c=>{ const ci = cityInfo(c); return `<div class="row"><span class="k">🏙️ ${esc(ci.name)} <small class="muted">~${fmtPop(cityPopulation(c))} · ${CITY_VOC[ci.voc].icon} ${CITY_VOC[ci.voc].n}</small></span><span class="v"><button class="btn xs" data-cap="${c}">Escolher</button></span></div>`; }).join('') : '<div class="muted">Não há outras cidades. Funde uma na aba Obras.</div>'}
    <div class="m-actions"><button class="btn" id="cm-x">Fechar</button></div>`);
  m.querySelector('#cm-x').onclick = ()=>{ SFX.click(); closeModal(); };
  m.querySelectorAll('[data-cap]').forEach(b=> b.onclick = ()=>{ const r = changeCapital(+b.dataset.cap); closeModal(); if (r.ok){ SFX.fanfare(); toast(r.msg,'good'); bigBanner('🏛️ Nova capital', esc(G.p.capital)); goHome(); } else { SFX.error(); toast(r.why,'bad'); } refreshAll(); saveGame(); });
}


function openTrophies(){
  const t = getTrophies(), tc = trophyCount(), plat = tc.have === tc.total;
  const byCat = {};
  for (const [id, a] of Object.entries(ACHIEVEMENTS)) (byCat[a.cat||'equilibrio'] = byCat[a.cat||'equilibrio'] || []).push([id, a]);
  showPage('🏅 Conquistas', `
    <div class="box" style="text-align:center"><div style="font-size:46px">${plat?'🏆':'🏅'}</div>
      <div style="font-family:var(--title);font-size:24px;font-weight:900;color:var(--red)">${tc.have} / ${tc.total} conquistas</div>
      ${meter(tc.have, tc.total, '#c9a13b')}<div class="muted">${plat ? 'PLATINADO! Você conquistou absolutamente tudo.' : 'Desbloqueie todas para platinar o jogo. As conquistas valem para todas as partidas.'}</div></div>
    ${Object.entries(ACH_CATS).map(([c, cn])=> byCat[c] ? `<div class="section-title">${cn} <span class="muted">(${byCat[c].filter(([id])=>t[id]).length}/${byCat[c].length})</span></div>
      <div class="trophy-grid">${byCat[c].map(([id, a])=>`<div class="trophy ${t[id]?'got':''}"${tip(`${a.icon} ${a.n}`, a.d + (typeof ACH_FX !== 'undefined' && ACH_FX[id] ? `<br><b>Consequência:</b> ${ACH_FX[id].t} — ${ACH_FX[id].d}` : ''), t[id] ? `Conquistada com ${esc(t[id].nation||'')} em ${new Date(t[id].at).toLocaleDateString('pt-BR')}${(t[id].count||1) > 1 ? ` · feita ${t[id].count} vezes` : ''}` : 'Ainda bloqueada')}><span class="ti">${t[id]?a.icon:'🔒'}</span>${t[id] && (t[id].count||1) > 1 ? `<span class="tcount">${t[id].count}x</span>` : ''}${typeof ACH_FX !== 'undefined' && ACH_FX[id] ? `<span class="tfx ${ACH_FX[id].tone}" title="Tem consequência no jogo">${{bom:'✅',ruim:'⚠️',misto:'⚖️'}[ACH_FX[id].tone]}</span>` : ''}<b>${a.n}</b><small>${a.d}</small></div>`).join('')}</div>` : '').join('')}`);
}


function panelMetas(){
  if (G.objMode !== 'objetivos') return `<div class="ph">Objetivos</div><div class="box">🕊️ Você está no <b>Modo Livre</b>: não há vitória — governe pelo tempo que quiser. Mas cuidado: ainda é possível <b>perder</b> (conquista, revolução, golpe, eleição perdida ou falência). Ao fim, você verá sua pontuação e o relatório completo.<br><br>As conquistas continuam valendo (botão 🏅 Conquistas no menu).</div>`;
  const ch = currentChapter(), act = activeObjectives(), done = (G.objDone||[]).map(id=>OBJ[id]);
  const F = FINAL_OBJ[G.finalObj], fp = F ? clamp(F.prog(), 0, 1) : 0;
  return `<div class="ph">Objetivos</div>
  <div class="box final-obj ${ch>4?'open':''}"><div class="lbl">🏁 Objetivo final ${ch>4?'— LIBERADO':'(liberado após os 4 capítulos)'}</div>
    <div style="font-family:var(--title);font-size:17px;font-weight:900;color:var(--red)">${F.icon} ${F.n}</div><div class="obj-d">${F.d}</div>
    ${meter(fp, 1, '#b3261e')}<small>${Math.round(fp*100)}%${ch>4 && G.finalStreak ? ` · mantido há ${G.finalStreak} de ${F.months} meses` : ''}</small></div>
  <div class="box" style="text-align:center"><div class="lbl">Capítulo atual</div><div style="font-family:var(--title);font-size:22px;font-weight:900;color:var(--red)">${ch>4?'🏁 Objetivo final':`${['','I','II','III','IV'][ch]} — ${OBJ_CHAPTERS[ch]}`}</div>
    ${meter((G.objDone||[]).length, OBJECTIVES.length, '#c9a13b')}<small>${(G.objDone||[]).length} de ${OBJECTIVES.length} objetivos cumpridos</small></div>
  ${act.map(o=>{ const pr = objProgress(o); return `<div class="obj"><div class="row"><b>${o.icon} ${o.n}</b><span class="v">${Math.round(pr*100)}%</span></div>
    <div class="obj-d">${o.d(G.objBase)}</div>${meter(pr,1,'#2c4f73')}<small class="muted">Recompensa: ${rwText(o.rw)}</small></div>`; }).join('')}
  ${done.length ? `<div class="sub">Cumpridos</div>${done.map(o=>`<div class="row"><span class="k">✔ ${o.icon} ${o.n}</span><span class="v muted">cap. ${o.ch}</span></div>`).join('')}` : ''}
  ${ch <= 4 ? `<div class="muted" style="margin-top:8px">Os próximos capítulos são revelados quando todos os objetivos do atual forem cumpridos. A vitória só vem com o objetivo final.</div>` : ''}`;
}
function onObjective(o, r){ notify('🎯', `Meta cumprida: ${esc(o.n)}`, r, 'obj'); }
function onChapter(ch){ if (ch > 4) notify('🏁', 'Objetivo final liberado', FINAL_OBJ[G.finalObj].n, 'obj'); else notify('📖', `Capítulo ${['','I','II','III','IV'][ch]}`, OBJ_CHAPTERS[ch], 'obj'); }


function openEvolve(b){
  const p = G.p, opts = nextOptions(b);
  const renderTree = (list, path, depth) => `<div class="tree-level">${list.map(nd=>{
    const onPath = path[depth] === nd.id, chosen = path.length > depth, blocked = chosen && !onPath;
    const isNext = path.length === depth && !b.up, lock = nd.tech && !p.techs.includes(nd.tech);
    const building = b.up && b.up.id === nd.id && path.length === depth;
    return `<div class="tree-node ${onPath?'done':''} ${blocked?'blocked':''} ${isNext?'next':''}">
      <div class="tn-card"><b>${nd.icon} ${nd.n}</b><small>${Object.entries(nd.fx).map(([k,v])=>fxLabel(k, v)).join(', ')}${nd.local?` · defesa local +${Math.round((nd.local.def-1)*100)}% (raio ${nd.local.r})`:''}</small>
        ${lock?`<small style="color:var(--red2)">🔒 ${TECH[nd.tech].n} (${TECH[nd.tech].year})</small>`:''}
        ${building?`<small>🏗️ em obras — ${b.up.due-G.turn} meses</small>`:''}
        ${isNext && !lock ? `<button class="btn xs green" data-evo="${nd.id}">Escolher (${fmtMoney(upgradeCost(b))} · ${upgradeMonths(b)} meses)</button>` : ''}
        ${blocked?'<small>✖ caminho não escolhido</small>':''}</div>
      ${nd.ch && nd.ch.length && !blocked ? renderTree(nd.ch, path, depth+1) : ''}</div>`; }).join('')}</div>`;
  const m = openModal(`<div class="m-icon">${BUILDINGS[b.t].icon}</div><div class="m-title">Evolução: ${BUILDINGS[b.t].n}</div>
    <div class="m-date">Nível atual: ${buildingLevelName(b)}</div>
    <div class="tip">Cada evolução é um caminho sem volta: ao escolher um ramo, os outros ficam bloqueados para esta construção.</div>
    ${opts.length || b.up ? renderTree(BTREE[b.t]||[], b.path||[], 0) : '<div class="muted">Esta construção já está no nível máximo.</div>'}
    <div class="m-actions"><button class="btn" id="evo-x">Fechar</button></div>`, {wide:true});
  m.querySelector('#evo-x').onclick = ()=>{ SFX.click(); closeModal(); };
  m.querySelectorAll('[data-evo]').forEach(x=> x.onclick = ()=>{ const r = startUpgrade(b, x.dataset.evo); if (r.ok){ SFX.build(); toast(r.msg, 'good'); closeModal(); refreshAll(); saveGame(); } else { SFX.error(); toast(r.why, 'bad'); } });
}

function approvalFactors(){
  const p = G.p, m = p.mods || calcMods(), debtR = p.debt/Math.max(1,p.gdp);
  const f = [
    ['🏛️ Regime, líder, leis e tecnologias', m.approval],
    ['🤲 Bem-estar social', (p.spend.social-3)*2.2], ['⚕️ Saúde pública', (p.spend.health-3)*1.6], ['📚 Educação', (p.spend.edu-3)*0.8],
    ['🏛️ Carga de impostos', -(p.tax*100-20)*0.9], ['🏚️ Desemprego', -(p.unemployment-6)*1.1], ['📉 Inflação', -Math.max(0,p.inflation-4)*1.0],
    ['😩 Cansaço de guerra', -p.warWeary*0.35], ['📈 Crescimento econômico', clamp(p.growth,-5,5)*0.8], ['💀 Corrupção', -p.corruption*30],
    ['🏦 Dívida pública', -Math.max(0, debtR-0.8)*6], ['💸 Cofres vazios', p.treasury<0?-5:0]
  ];
  return f.filter(x=>Math.abs(x[1]) >= 0.4).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1]));
}
function socialGroups(){
  const p = G.p, pol = p.policies, c = p.constitution||{};
  const g = [
    {n:'Trabalhadores', icon:'👷', v:55 - (p.unemployment-6)*3 - Math.max(0,p.inflation-4)*2 + (p.spend.social-3)*4 + (pol.reforma_agraria?4:0) - (p.econ==='capitalismo'?6:0) + (p.econ==='planificada'?6:0)},
    {n:'Empresários', icon:'💼', v:55 - (p.tax*100-20)*2 + p.growth*4 + (pol.subsidios?8:0) + (pol.livre_comercio?5:0) + (p.econ==='capitalismo'?10:0) - (p.econ==='planificada'?18:0) - (pol.reforma_agraria?6:0)},
    {n:'Militares', icon:'🎖️', v:45 + (p.morale-1)*40 - p.warWeary*0.3 + (['ditadura','imperio'].includes(p.gov)?18:0) + (pol.conscricao?6:0) + (c.militares==='autonomas'?6:0) + clamp(p.atk/Math.max(1,p.pop*3),0,3)*5},
    {n:'Religiosos', icon:'⛪', v:50 + (relFam(p.religion)!=='sec'?10:-10) + (p.gov==='teocracia'?20:0) + (c.religiao==='oficial'?6:c.religiao==='laico'?-4:0) - (p.religion==='ateu'?15:0)},
    {n:'Intelectuais e estudantes', icon:'🎓', v:50 + (p.spend.edu-3)*5 + (p.spend.research-1)*5 - (pol.censura?20:0) + (c.imprensa==='plena'?8:0) - (['ditadura'].includes(p.gov)?10:0)},
    {n:'Camponeses', icon:'🌾', v:55 + (p.resources.includes('terras')?6:0) + (pol.reforma_agraria?15:0) - (p.tax*100-20) + (p.spend.infra-3)*3 - (pol.conscricao?5:0)}
  ];
  g.forEach(x=>x.v = clamp(Math.round(x.v*0.7 + p.approval*0.3), 0, 100));
  return g;
}
function peopleVoices(){
  const p = G.p, out = [];
  const rnd = makeRng(G.turn*97 + 13);
  const who = (prof)=> `${pick2(rnd, FIRST_NAMES)}, ${prof} de ${pick2(rnd, p.cityNames.length?p.cityNames:[p.capital])}`;
  const S = (k,v)=>()=>{ p.spend[k] = clamp(p.spend[k]+v, 0, SPEND_INFO[k].max); };
  const add = (sev, prof, txt, sug, label, fn) => out.push({sev, who:who(prof), txt, sug, label, fn});
  if (p.tax > 0.28) add(p.tax*100-28, 'comerciante', 'Os impostos estão sufocando a gente! Metade do que eu ganho vai para o governo.', 'Reduzir a carga tributária.', 'Reduzir impostos em 2%', ()=>{ p.tax = Math.max(0, p.tax-0.02); });
  if (p.unemployment > 9) add((p.unemployment-9)*2, 'operário desempregado', 'Faz meses que procuro trabalho e não encontro nada. As fábricas estão fechando.', 'Investir em obras públicas para gerar empregos.', '+1% PIB em Infraestrutura', S('infra',1));
  if (p.inflation > 7) add(p.inflation-7, 'dona de casa', 'O pão custa o dobro do mês passado! Meu salário não dá para nada.', 'Controlar a inflação com um Banco Central independente.', p.policies.banco_central ? 'Cortar Bem-estar em 1%' : 'Criar Banco Central', ()=>{ if (!p.policies.banco_central) togglePolicy('banco_central'); else S('social',-1)(); });
  if (p.spend.health < 3) add((3-p.spend.health)*4, 'enfermeira', 'Os hospitais estão lotados e faltam remédios. Pessoas morrem nas filas.', 'Aumentar o orçamento da saúde.', '+1% PIB em Saúde', S('health',1));
  if (p.spend.edu < 3) add((3-p.spend.edu)*3, 'professora', 'Nossas escolas estão caindo aos pedaços e os professores não recebem.', 'Investir em educação.', '+1% PIB em Educação', S('edu',1));
  if (p.spend.social < 3) add((3-p.spend.social)*4, 'trabalhador rural', 'Os mais pobres foram abandonados pelo governo.', 'Ampliar programas sociais.', '+1% PIB em Bem-estar', S('social',1));
  if (p.warWeary > 25) add(p.warWeary/4, 'mãe de soldado', 'Tragam nossos filhos de volta da guerra! Quantos mais precisam morrer?', 'Buscar a paz pela diplomacia.', 'Abrir aba Militar', ()=>{ UI.tab='militar'; });
  if (p.corruption > 0.15) add(p.corruption*40, 'jornalista', 'Os políticos roubam à luz do dia e ninguém é punido.', 'Fortalecer a polícia e a fiscalização.', '+1% PIB em Segurança', S('police',1));
  if (p.stability < 40) add((40-p.stability)/2, 'lojista', 'Há tumultos e saques nas ruas. Fechei minha loja de medo.', 'Restaurar a ordem.', '+1% PIB em Segurança', S('police',1));
  if (p.debt > p.gdp) add((p.debt/p.gdp-1)*8, 'economista', 'O governo gasta o que não tem. Nossos netos vão pagar essa dívida.', 'Reduzir a dívida pública.', 'Pagar 25% da dívida', ()=>{ const r = ECON_ACTIONS.repay(0.25); if (!r.ok) toast(r.why,'bad'); });
  if (p.policies.censura) add(8, 'escritor', 'Não podemos dizer o que pensamos. Meus livros foram queimados.', 'Restaurar a liberdade de imprensa.', 'Revogar a censura', ()=>togglePolicy('censura'));
  if (p.policies.conscricao) add(5, 'estudante', 'Não quero passar dois anos no quartel em vez de estudar!', 'Acabar com o serviço obrigatório.', 'Revogar a conscrição', ()=>togglePolicy('conscricao'));
  if (p.policies.lei_marcial) add(10, 'advogado', 'Soldados nas esquinas, toque de recolher... isso não é vida.', 'Encerrar a lei marcial.', 'Revogar lei marcial', ()=>togglePolicy('lei_marcial'));
  if (p.growth < 0) add(-p.growth*3+3, 'pequeno empresário', 'A crise está acabando com o meu negócio. Ninguém compra nada.', 'Estimular a indústria.', p.policies.subsidios ? '+1% PIB em Infraestrutura' : 'Ativar Subsídios Industriais', ()=>{ if (!p.policies.subsidios) togglePolicy('subsidios'); else S('infra',1)(); });
  const worldTech = G.nations.filter(n=>n&&n.id>1&&n.alive).reduce((s,n,_,a)=>s+n.tech/a.length,0);
  if (p.techs.length < worldTech - 2) add(4, 'engenheiro', 'Estamos ficando para trás! Outros países já têm tecnologias que nem sonhamos.', 'Investir em ciência.', '+0,5% PIB em Ciência', S('research',0.5));
  if (p.constitution && p.constitution.direitos==='garantidos' && (p.spend.health<3||p.spend.edu<3)) add(9, 'juíza', 'O governo está descumprindo a Constituição! Saúde e educação são direitos garantidos.', 'Cumprir o mínimo constitucional (3% em cada).', 'Ajustar Saúde e Educação para 3%', ()=>{ p.spend.health=Math.max(3,p.spend.health); p.spend.edu=Math.max(3,p.spend.edu); });
  // vozes positivas
  const good = [];
  if (p.growth > 3) good.push([who('empresária'), 'Os negócios nunca foram tão bons! Abri mais duas filiais este ano.']);
  if (!G.wars.length && G.turn > 12) good.push([who('agricultor'), 'Vivemos em paz. Meus filhos crescem sem medo da guerra.']);
  if (p.spend.health >= 5) good.push([who('médico'), 'Nosso sistema de saúde é exemplo para o mundo.']);
  if (p.spend.edu >= 5) good.push([who('estudante'), 'Consegui entrar na universidade pública. Um sonho!']);
  if (p.approval > 65) good.push([who('aposentado'), `Que orgulho de ser deste país! Viva ${p.leader}!`]);
  if (p.unemployment < 5) good.push([who('jovem'), 'Arrumei emprego na primeira semana depois de me formar.']);
  if (G.stats.battlesWon > 0 && G.wars.length) good.push([who('veterano'), 'Nossas tropas estão vencendo! A nação está unida.']);
  out.sort((a,b)=>b.sev-a.sev);
  return {bad:out.slice(0,6), good:good.slice(0,3)};
}
function pick2(rnd, a){ return a[Math.floor(rnd()*a.length)]; }
function panelRanking(){
  const met = UI.rankMetric || 'gdp', col = RANK_COLS.indexOf(met) + 1, M = RANK_METRICS[met];
  const years = Object.keys(G.rankHist||{}).map(Number).sort((a,b)=>b-a);
  const sel = UI.rankYear || 'atual';
  const rows = (sel === 'atual' ? rankRows() : (G.rankHist[sel] || rankRows())).slice().sort((a,b)=>b[col]-a[col]);
  // posição anterior (ano anterior disponível)
  const prevYear = sel === 'atual' ? years[0] : years.find(y=>y < +sel);
  const prevRows = prevYear ? G.rankHist[prevYear].slice().sort((a,b)=>b[col]-a[col]) : null;
  const max = rows.length ? Math.max(1, rows[0][col]) : 1;
  const myPos = rows.findIndex(r=>r[0]===1) + 1;
  return `<div class="ph">Ranking Mundial</div>
  <div class="filters">${Object.entries(RANK_METRICS).map(([k,m])=>`<button data-rmet="${k}" class="${k===met?'active':''}">${m.icon} ${m.n}</button>`).join('')}</div>
  <div class="flex" style="margin:6px 0"><span class="lbl">Ano:</span><select id="rank-year" style="flex:1">
    <option value="atual" ${sel==='atual'?'selected':''}>Agora (${MONTHS_S[curMonth()]}/${curYear()})</option>
    ${years.map(y=>`<option value="${y}" ${String(sel)===String(y)?'selected':''}>Janeiro de ${y}</option>`).join('')}</select></div>
  ${myPos ? `<div class="box" style="text-align:center"><div class="lbl">${M.icon} ${M.n} — ${esc(G.p.name)}</div><div style="font-family:var(--title);font-size:30px;font-weight:900;color:var(--red)">${myPos}º <small style="font-size:15px;color:var(--ink2)">de ${rows.length}</small></div></div>` : ''}
  ${met==='idh' ? '<div class="muted" style="margin-bottom:6px">IDH = Índice de Desenvolvimento Humano: combina renda, saúde e educação (0 a 1).</div>' : ''}
  ${rows.map((r,i)=>{ const id = r[0], n = G.nations[id], prev = prevRows ? prevRows.findIndex(x=>x[0]===id) : -1, mv = prev >= 0 ? prev - i : 0;
    return `<div class="rank-row ${id===1?'me':''}" ${n && n.alive && id>1 ? `data-nation="${id}"` : ''}>
      <span class="rk">${i+1}º</span>${n ? flagImg(n, 26, 17) : ''}
      <span class="rn"><b>${esc(rankName(id))}</b><span class="rbar"><i style="width:${Math.max(2, r[col]/max*100)}%;background:${id===1?'#b3261e':(n?n.color:'#888')}"></i></span></span>
      <span class="rv">${M.f(r[col])}<small class="${mv>0?'up':mv<0?'down':''}">${mv>0?'▲'+mv:mv<0?'▼'+(-mv):''}</small></span></div>`; }).join('')}`;
}
function panelObras(){
  const p = G.p, bs = p.buildings || [];
  return `<div class="ph">Obras e Construções</div>
  <div class="tip">Escolha uma obra e depois <b>clique no mapa, dentro do seu território,</b> onde quer construí-la. <kbd>Esc</kbd> cancela.</div>
  ${MapView.buildMode ? `<div class="box" style="border-color:var(--red)">🏗️ Construindo: <b>${BUILDINGS[MapView.buildMode].icon} ${BUILDINGS[MapView.buildMode].n}</b> — clique no mapa. <button class="btn xs" data-bcancel="1">Cancelar</button></div>` : ''}
  ${Object.entries(BUILDINGS).map(([k,B])=>{ const lock = B.req && !p.techs.includes(B.req);
    return `<div class="unit ${lock?'locked':''}"${tip(`${B.icon} ${B.n}`, BUILD_TIPS[k]||B.d, (B.fx?'Efeito: '+fxList(B.fx)+'<br>':'') + (BTREE[k]?'Pode evoluir para: '+BTREE[k].map(n=>n.icon+' '+n.n).join(' ou '):'') + (B.req?`<br>Requer ${TECH[B.req].n}`:''))}><span class="ic">${B.icon}</span><span class="nm"><b>${B.n}</b> <small style="display:inline">(${k==='cidade'?p.cities:buildCount(k)})</small><small>${B.d}</small><small>${lock?`🔒 Requer ${TECH[B.req].n}`:`Custo ${fmtMoney(buildCost(k))}${k!=='cidade'?` · manut. ${fmtMoney(B.cost*G.costScale*0.008)}/mês`:''}`}</small></span>
      <span class="ct"><button class="btn xs ${MapView.buildMode===k?'primary':''}" data-build="${k}" ${lock?'disabled':''}>Construir</button></span></div>`; }).join('')}
  <div class="sub">✨ Sinergias ativas (${activeSynergies().length})</div>
  ${activeSynergies().map(({S})=>`<div class="row"${tip(`${S.icon} ${S.n}`, `Combina ${BUILDINGS[S.a].n} e ${BUILDINGS[S.b].n} a até ${S.r} regiões de distância.`, fxList(S.fx))}><span class="k">${S.icon} ${S.n}</span><span class="v muted">${fxList(S.fx)}</span></div>`).join('') || '<div class="muted">Construa obras complementares perto umas das outras (ex.: Fábrica + Mina, Universidade + Hospital) para ganhar bônus extras.</div>'}
  <div class="sub">Construções existentes (${bs.length})</div>
  ${bs.length ? bs.map(b=>`<div class="row"><span class="k">${buildingLevelName(b)} <small class="muted">${b.up?'🏗️ evoluindo ('+(b.up.due-G.turn)+'m)':dateShort(b.at)}</small></span><span class="v"><button class="btn xs green" data-bevo="${b.c}" title="Evoluir">⬆️</button> <button class="btn xs" data-bfly="${b.c}">🎯</button> <button class="btn xs" data-bdem="${b.c}">🗑️</button></span></div>`).join('') : '<div class="muted">Nenhuma ainda.</div>'}
  <div class="tip">⬆️ Cada construção pode <b>evoluir</b> por uma árvore de caminhos: escolha um ramo, depois ele se abre em novas opções — até o nível máximo. Clique na construção no mapa ou no botão ⬆️.</div>`;
}
function startBuild(t){ MapView.buildMode = t; closePopover(); SFX.click(); toast(`🏗️ Clique no seu território para construir: ${BUILDINGS[t].icon} ${BUILDINGS[t].n}`); renderPanel(); }
function cancelBuild(){ if (!MapView.buildMode) return; MapView.buildMode = null; renderPanel(); }
function computeFronts(){
  const map = {};
  const key = (a,b)=> a<b ? a+','+b : b+','+a;
  const warSet = new Set(G.aiWars.map(w=>key(w.a,w.b)).concat(G.wars.map(w=>key(1,w.e))));
  if (!warSet.size){ MapView.fronts = []; return; }
  for (let i=0;i<NCELLS;i++){
    if (!Grid.land[i]) continue; const a = Grid.owner[i]; if (a <= 0) continue;
    const x = i%CW; const js = []; if (x<CW-1) js.push(i+1); if (i+CW<NCELLS) js.push(i+CW);
    for (const j of js){ const b = Grid.owner[j]; if (b <= 0 || b === a || !Grid.land[j]) continue; const k = key(a,b); if (warSet.has(k)) (map[k] = map[k] || []).push(i, j); }
  }
  MapView.fronts = Object.entries(map).map(([k,cells])=>{ const [a,b] = k.split(',').map(Number); return {a, b, cells, player: a===1||b===1}; });
}
function openWorldWars(){
  const wars = G.aiWars.map(w=>({a:w.a, b:w.b, since:w.start})).concat(G.wars.map(w=>({a:1, b:w.e, since:w.start})));
  const m = openModal(`<div class="m-icon">🌍</div><div class="m-title">Guerras no mundo</div>
    <div class="policy"><span class="ic">💥</span><span class="nm"><b>Mostrar animações de guerra no mapa</b><small>Aviões, bombardeios e explosões nas frentes de batalha de todas as nações</small></span><span class="switch ${MapView.worldFx?'on':''}" id="ww-fx"></span></div>
    ${wars.length ? wars.map((w,i)=>`<div class="row"><span class="k">${flagImg(G.nations[w.a],22,15)} <b>${esc(rankName(w.a))}</b> ⚔️ ${flagImg(G.nations[w.b],22,15)} <b>${esc(rankName(w.b))}</b> <small class="muted">desde ${dateShort(w.since)}</small></span><span class="v"><button class="btn xs" data-ww="${i}">🎯 Ver</button></span></div>`).join('') : '<div class="muted" style="margin:10px 0">O mundo está em paz. Por enquanto.</div>'}
    <div class="m-actions"><button class="btn" id="ww-close">Fechar</button></div>`, {wide:true});
  m.querySelector('#ww-close').onclick = ()=>{ SFX.click(); closeModal(); };
  m.querySelector('#ww-fx').onclick = e=>{ setWorldFx(!MapView.worldFx); e.target.classList.toggle('on', MapView.worldFx); };
  m.querySelectorAll('[data-ww]').forEach(b=> b.onclick = ()=>{ const w = wars[+b.dataset.ww]; closeModal(); computeFronts();
    const f = MapView.fronts.find(f=>(f.a===w.a&&f.b===w.b)||(f.a===w.b&&f.b===w.a));
    const c = f && f.cells.length ? f.cells[Math.floor(f.cells.length/2)] : G.nations[w.b].cap; const [lo,la] = cellCenter(c); MapView.flyTo(lo, la, 3.2); });
}
function setWorldFx(on){ MapView.worldFx = on; UI.worldFx = on; saveSettings(); SFX.click(); updateTopbar(); }
function onWorldBattle(a, b, cells){
  if (!MapView.worldFx || !UI.turnLogs || UI.worldBattles >= 3) return;
  UI.worldBattles = (UI.worldBattles||0) + 1;
  UI.fxQueue.push(()=>{ const A = G.nations[a]; if (!cells.length || !A) return; const [tx,ty] = cellXY(cells[0]);
    MapView.arrow(cellXY(A.cap), [tx,ty], darken(A.color, 0.3));
    setTimeout(()=>{ MapView.boom(tx,ty); if (curYear()>=1915) MapView.addAnim({type:'plane', from:cellXY(A.cap), to:[tx,ty], dur:2200}); MapView.flashCells(cells, A.color); }, 800); });
}

function panelPovo(){
  const p = G.p, h = G.hist, prev = h.length > 6 ? h[h.length-7].app : h[0].app, d = p.approval - prev;
  const fac = approvalFactors(), groups = socialGroups(), voices = peopleVoices();
  const mood = p.approval>70?'😄':p.approval>55?'🙂':p.approval>40?'😐':p.approval>25?'😠':'🤬';
  UI._voices = voices.bad;
  return `<div class="ph">A Voz do Povo</div>
  <div class="box" style="text-align:center"><div style="font-size:42px;line-height:1">${mood}</div>
    <div style="font-family:var(--title);font-size:26px;font-weight:900">${Math.round(p.approval)}% de aprovação</div>
    <div class="${d>=0?'up':'down'}" style="font-size:15px;font-weight:bold">${d>=0?'▲':'▼'} ${fmtNum(Math.abs(d),1)} pontos nos últimos 6 meses</div></div>
  <div class="sub">🗣️ O que dizem nas ruas</div>
  ${voices.bad.length ? voices.bad.map((v,i)=>`<div class="voice"><div class="q">“${v.txt}”</div><div class="who">— ${esc(v.who)}</div>
     <div class="sug">💡 ${v.sug}</div><button class="btn xs green" data-voice="${i}">✔ ${v.label}</button></div>`).join('') : '<div class="muted">Ninguém está reclamando de nada grave. Raro!</div>'}
  ${voices.good.map(([w,t])=>`<div class="voice good"><div class="q">“${t}”</div><div class="who">— ${esc(w)}</div></div>`).join('')}
  <div class="sub">📊 Por que o povo pensa assim</div>
  ${fac.map(([l,v])=>`<div class="factor"><span>${l}</span><span class="fbar"><i class="${v>=0?'pos':'neg'}" style="width:${Math.min(50,Math.abs(v)*2.5)}%;${v>=0?'left:50%':'right:50%'}"></i></span><b class="${v>=0?'up':'down'}">${v>=0?'+':''}${fmtNum(v,1)}</b></div>`).join('')}
  <div class="sub">👥 Grupos sociais</div>
  ${groups.map(g=>`<div class="row"><span class="k">${g.icon} ${g.n}</span><span class="v">${g.v}% ${g.v>65?'😄':g.v>45?'🙂':g.v>30?'😠':'🤬'}</span></div>${meter(g.v,100)}`).join('')}`;
}


function bindPanel(el){
  el.querySelectorAll('[data-slider]').forEach(s=>{
    s.oninput = ()=>{
      const k = s.dataset.slider, v = +s.value;
      if (k==='tax'){ G.p.tax = v/100; $('#sv-tax').textContent = v+'%'; } else { G.p.spend[k] = v; $('#sv-'+k).textContent = v.toFixed(1)+'%'; }
      derive(); const b = budget(); $('#budget-box').innerHTML = budgetHTML(b); G.p.lastBudget = b; updateTopbar();
    };
    s.onchange = ()=>{ SFX.click(); };
  });
  el.querySelectorAll('[data-econ]').forEach(b=> b.onclick = ()=>{
    const a = b.dataset.econ; const r = ECON_ACTIONS[a](+b.dataset.f || undefined);
    if (r.ok){ (a==='loan'||a==='print')?SFX.coin():SFX.build(); toast(r.msg, 'good'); addLog(r.msg, a==='default'?'bad':'info'); } else { SFX.error(); toast(r.why, 'bad'); }
    refreshAll();
  });
  el.querySelectorAll('[data-rec]').forEach(b=> b.onclick = ()=>{
    const r = recruit(b.dataset.rec, +b.dataset.q);
    if (r.ok){ SFX.build(); toast(r.msg); } else { SFX.error(); toast(r.why,'bad'); }
    refreshAll();
  });
  el.querySelectorAll('[data-dis]').forEach(b=> b.onclick = ()=>{ const r = disband(b.dataset.dis, 1); if (r.ok){ SFX.click(); } refreshAll(); });
  el.querySelectorAll('[data-nation]').forEach(b=> b.onclick = ()=>{ SFX.page(); openNation(+b.dataset.nation); });
  el.querySelectorAll('[data-fly]').forEach(b=> b.onclick = ()=>{ const n = G.nations[+b.dataset.fly]; const [lo,la] = cellCenter(n.cap); MapView.flyTo(lo,la,3); });
  el.querySelectorAll('[data-sort]').forEach(b=> b.onclick = ()=>{ UI.diploSort = b.dataset.sort; renderPanel(); });
  el.querySelectorAll('[data-filter]').forEach(b=> b.onclick = ()=>{ UI.logFilter = b.dataset.filter; renderPanel(); });
  el.querySelectorAll('[data-tech]').forEach(b=> b.onclick = ()=>{
    const t = TECH[b.dataset.tech]; if (G.p.techs.includes(t.id)) return;
    if (!t.req.every(r=>G.p.techs.includes(r))){ SFX.error(); toast('Requer: ' + t.req.map(r=>TECH[r].n).join(', '), 'bad'); return; }
    G.p.researching = t.id; SFX.click(); toast(`Pesquisando: ${t.icon} ${t.n}`); refreshAll();
  });
  el.querySelectorAll('[data-pol]').forEach(b=> b.onclick = ()=>{ const r = togglePolicy(b.dataset.pol); if (r.ok){ SFX.click(); if (r.msg) toast(r.msg, 'dip'); } else { SFX.error(); toast(r.why,'bad'); } refreshAll(); });
  el.querySelectorAll('[data-voice]').forEach(b=> b.onclick = ()=>{ const v = UI._voices[+b.dataset.voice]; if (!v) return; v.fn(); SFX.coin(); toast('✔ Medida tomada: ' + v.label, 'good'); addLog(`🗣️ Ouvindo o povo: ${v.label}.`, 'info'); if (UI.tab==='militar') $$('#tabs button').forEach(x=>x.classList.toggle('active', x.dataset.tab==='militar')); refreshAll(); });
  el.querySelectorAll('[data-corps]').forEach(b=> b.onclick = ()=>{ const k = G.p.corps.find(x=>x.id===+b.dataset.corps); if (!k) return; UI.selCorps = k.id; MapView.selCorps = k.id; const [lo,la] = cellCenter(k.cell); MapView.flyTo(lo, la, 3.2); SFX.click(); toast(`🎖️ ${k.name} selecionado: clique no destino ou num alvo inimigo.`); renderPanel(); });
  el.querySelectorAll('[data-creinf]').forEach(b=> b.onclick = ()=>{ const k = G.p.corps.find(x=>x.id===+b.dataset.creinf); const r = reinforceCorps(k, 0.25); if (r.ok){ SFX.build(); toast(r.msg,'good'); } else { SFX.error(); toast(r.why,'bad'); } refreshAll(); });
  el.querySelectorAll('[data-newcorps]').forEach(b=> b.onclick = ()=>{ const r = newCorps(G.p.capCell, 0.5); if (r.ok){ SFX.march(); toast(r.msg,'good'); } else { SFX.error(); toast(r.why,'bad'); } refreshAll(); saveGame(); });
  el.querySelectorAll('[data-bevo]').forEach(b=> b.onclick = ()=>{ const bb = G.p.buildings.find(x=>x.c===+b.dataset.bevo); if (bb){ SFX.page(); openEvolve(bb); } });
  el.querySelectorAll('[data-resmode]').forEach(b=> b.onclick = ()=>{ const [r, mode] = b.dataset.resmode.split(':'); const res = setResMode(r, mode); if (res.ok){ SFX.build(); toast(res.msg,'good'); } else { SFX.error(); toast(res.why,'bad'); } refreshAll(); });
  el.querySelectorAll('[data-rmet]').forEach(b=> b.onclick = ()=>{ SFX.click(); UI.rankMetric = b.dataset.rmet; renderPanel(); });
  const ry = el.querySelector('#rank-year'); if (ry) ry.onchange = ()=>{ SFX.page(); UI.rankYear = ry.value; renderPanel(); };
  el.querySelectorAll('[data-build]').forEach(b=> b.onclick = ()=>startBuild(b.dataset.build));
  el.querySelectorAll('[data-bcancel]').forEach(b=> b.onclick = ()=>{ SFX.click(); cancelBuild(); });
  el.querySelectorAll('[data-bfly]').forEach(b=> b.onclick = ()=>{ const [lo,la] = cellCenter(+b.dataset.bfly); MapView.flyTo(lo, la, 4); });
  el.querySelectorAll('[data-bdem]').forEach(b=> b.onclick = ()=>{ const c = +b.dataset.bdem; confirmModal('🗑️','Demolir construção?','O dinheiro gasto não será devolvido.','Demolir', ()=>{ demolish(c); SFX.build(); refreshAll(); }, true); });
  el.querySelectorAll('[data-reform]').forEach(b=> b.onclick = ()=>{ SFX.page(); openReformModal(b.dataset.reform); });
  el.querySelectorAll('[data-amend]').forEach(b=> b.onclick = ()=>{ const k = b.dataset.amend; const v = el.querySelector(`select[data-art="${k}"]`).value; const r = proposeAmendment(k, v); if (r.ok){ SFX.page(); toast(r.msg,'dip'); } else { SFX.error(); toast(r.why,'bad'); } refreshAll(); });
  el.querySelectorAll('[data-act]').forEach(b=> b.onclick = ()=>{ const a = b.dataset.act; if (a==='report') openLiveReport(); if (a==='home') goHome(); if (a==='capital') openCapitalModal(); });
  const fc = el.querySelector('#pg-flag'); if (fc) drawFlag(fc.getContext('2d'), G.p.flag, 0, 0, 180, 120);
}
function goHome(){ const [lo,la] = cellCenter(G.p.capCell); MapView.flyTo(lo, la, 3.2); }

// ------------------------------------------------------------
//  Nações (modal de diplomacia)
// ------------------------------------------------------------
function openNation(id){
  const n = G.nations[id], p = G.p; if (!n || !n.alive) return;
  if (n.human){ openPlayersPanel(); return; }
  const w = getWar(id);
  const ratio = p.atk / Math.max(1, n.power);
  const rk = rankings(); const wealthRank = rk.list.slice().sort((a,b)=>b.gdp-a.gdp).findIndex(x=>x.id===id)+1;
  const act = (k, label, dis, hint) => `<button class="btn sm" data-dip="${k}" ${dis?'disabled':''} title="${esc(hint||'')}">${label}</button>`;
  const view = aiForeignView(id);
  const friends = view.slice(0,3), rivals = view.slice(-3).reverse();
  const wars = G.aiWars.filter(x=>x.a===id||x.b===id).map(x=>G.nations[x.a===id?x.b:x.a].name);
  const bloc = n.bloc ? G.nations.filter(o=>o&&o.id>1&&o.alive&&o.bloc===n.bloc&&o.id!==id).map(o=>o.name) : [];
  const negs = G.negs.filter(x=>x.n===id);
  const likes = (n.likes||[]).map(k=>{ const P = PREFS[k]; const ok = P.test(n); return `<div class="pref ${ok?'ok':'no'}">${ok?'✔':'✖'} ${P.icon} <b>${P.n}</b> <small>${P.hint}</small></div>`; }).join('');
  const dislikes = (n.dislikes||[]).map(k=>{ const P = DISLIKES[k]; const hit = P.test(n); return `<div class="pref ${hit?'no':'ok'}">${hit?'⚠️':'✔'} ${P.icon} <b>${P.n}</b> <small>${hit?'Estamos irritando: ':'Evitar: '}${P.hint.toLowerCase()}</small></div>`; }).join('');
  const deals = Object.entries(n.deals||{}).map(([t,d])=>`<div class="row"><span class="k">${DEALS[t].icon} ${DEALS[t].n}</span><span class="v">${dealIncome(n,t)>=0?'+':''}${fmtMoney(dealIncome(n,t))}/mês · ${Math.ceil((d.until-G.turn)/12)} anos <button class="btn xs" data-cancel="${t}">✖</button></span></div>`).join('');
  const dealOpts = Object.entries(DEALS).filter(([t])=>!(n.deals||{})[t]).map(([t,D])=>{ const bl = dealBlocked(n,t);
    return `<div class="deal-opt"${tip(`${D.icon} ${D.n}`, D.d, fxList(D.fx))}><div><b>${D.icon} ${D.n}</b><small>${D.d}</small><small class="muted">Negociação: ${D.months[0]}–${D.months[1]} meses · validade ${D.years} anos${bl?'':` · chance ${Math.round(dealChance(n,t)*100)}%`}</small>${bl?`<small style="color:var(--red2)">🔒 ${bl}</small>`:''}</div><button class="btn xs" data-deal="${t}" ${bl?'disabled':''}>Propor</button></div>`; }).join('');
  const pending = (k)=>negs.some(x=>x.kind===k);
  const html = `
    <div class="flex" style="gap:14px"><div style="display:flex;flex-direction:column;gap:6px;align-items:center">${flagImg(n,96,64)}${n.human ? '' : `<div class="ai-av">${avatarSVG(aiAvatar(n), null, 64)}</div>`}</div><div style="flex:1"><div class="m-title" style="text-align:left;margin:0">${esc(n.name)}</div>
      <div class="muted">${GOVS[n.gov]?GOVS[n.gov].name:''} · ${RELIGIONS[n.relig]||''} · Capital: ${esc(n.capital)}</div>
      <div>👤 <b>${esc(n.leaderTitle||(GOVS[n.gov]||{}).title||'Líder')} ${esc(n.leader||'')}</b>${n.realLeader?' <small class="badge" title="Personagem histórico real">histórico</small>':''} <small class="muted">(${n.leaderAge||'?'} anos)</small>${n.bloc?` · 🏳️ ${BLOC_NAMES[n.bloc]}`:''}</div>
      <div>${nationTags(n)}${n.claim?'<span class="tag war">REIVINDICA NOSSAS TERRAS</span>':''}</div></div>
      <div style="text-align:center;min-width:120px"><div class="lbl">Relação conosco</div><div style="font-family:var(--title);font-size:26px;font-weight:900" class="${n.rel>=0?'up':'down'}">${n.rel>0?'+':''}${n.rel}</div><div>${relLabel(n.rel)}</div></div></div>
    <div class="relbar" style="margin:8px 0 4px"><i style="left:${(n.rel+100)/2}%"></i></div>
    <div class="grid2" style="gap:6px 22px;margin-top:8px">
      <div>
        <div class="sub">💰 Economia e riquezas</div>
        ${row('👥 População', fmtPop(n.pop))}${row('📈 PIB', fmtMoney(n.pop*n.pc) + ` <small class="muted">(#${wealthRank} do mundo)</small>`)}
        ${row('👤 PIB per capita', `${p.currencySym} ${fmtNum(n.pc,0)}`)}${row('🗺️ Área', fmtArea(n.area))}
        ${row('⛏️ Riquezas naturais', (n.res||[]).map(r=>RESOURCES[r].icon+' '+RESOURCES[r].name).join(', ')||'—')}
        ${row('📦 Exporta', exportsOf(n).join(', ')||'—')}
        ${row('🛒 Precisa importar', importsOf(n).map(r=>RESOURCES[r].name).join(', ')||'—')}
        <div class="sub">❤️ O que eles valorizam</div>${likes||'<div class="muted">—</div>'}
        <div class="sub">💢 O que eles detestam</div>${dislikes||'<div class="muted">—</div>'}
      </div>
      <div>
        <div class="sub">⚔️ Poder</div>
        ${row('Exército', `${fmtNum(n.power,0)} <small class="${ratio>=1?'up':'down'}">(${ratio>=1?'somos':'eles são'} ${fmtNum(ratio>=1?ratio:1/ratio,1)}x mais fortes)</small>`)}
        ${row('⚓ Marinha', `${fmtNum(n.navy,0)} <small class="muted">(nós: ${fmtNum(p.navy,0)})</small>`)}
        ${row('🔬 Tecnologia', fmtNum(n.tech,1) + ` <small class="muted">(nós: ${p.techs.length})</small>`)}
        ${row('🧱 Fronteira', adjacent(1,id)?'Vizinho direto':'Sem fronteira terrestre')}${row('😠 Agressividade', n.ag>0.6?'Alta':n.ag>0.35?'Média':'Baixa')}
        <div class="sub">🌐 Relações internacionais</div>
        ${bloc.length?row('Bloco', `${BLOC_NAMES[n.bloc]}: ${bloc.slice(0,5).join(', ')}${bloc.length>5?'…':''}`):''}
        ${row('Em guerra com', wars.length?wars.join(', '):'Ninguém')}
        <div class="lbl" style="margin-top:4px">Melhores amigos</div>${friends.map(f=>`<div class="row"><span class="k">${flagImg(G.nations[f.id],18,12)} ${esc(G.nations[f.id].name)}</span><span class="v up">${f.rel>0?'+':''}${f.rel}</span></div>`).join('')}
        <div class="lbl" style="margin-top:4px">Maiores rivais</div>${rivals.map(f=>`<div class="row"><span class="k">${flagImg(G.nations[f.id],18,12)} ${esc(G.nations[f.id].name)}${f.war?' ⚔️':''}</span><span class="v down">${f.rel>0?'+':''}${f.rel}</span></div>`).join('')}
      </div>
    </div>
    ${negs.length ? `<div class="sub">✉️ Negociações em andamento</div>${negs.map(x=>row(`${negIcon(x)} ${negName(x)}`, `resposta em ~${Math.max(1,x.due-G.turn)} mês(es)`)).join('')}` : ''}
    ${w ? `<div class="sub">⚔️ Guerra — placar ${w.score>0?'+':''}${w.score}</div>
      <button class="btn green" style="width:100%;margin:6px 0" data-dip="peace_table">🕊️ Abrir mesa de paz — propor valores e negociar</button>
      <div class="btn-grid">
        ${act('peace_anexar', `👑 Anexação total (${Math.round(peaceChance(id,'anexar')*100)}%)`, pending('peace') || peaceChance(id,'anexar')===0, 'Exige placar de guerra alto e inimigo pequeno')}
        ${act('peace_render', `🏳️ Render-se já (pagar ${fmtMoney(p.gdp*0.05)})`)}
      </div>
      <div class="tip">Clique nas regiões de ${esc(n.name)} no mapa para lançar ofensivas.</div>` :
    `<div class="sub">⚓ Acordos comerciais em vigor (${dealCount(n)})</div>${deals || '<div class="muted">Nenhum acordo. Proponha um abaixo — a negociação leva alguns meses.</div>'}
     <div class="sub">📝 Propor novo acordo</div><div class="deal-list">${dealOpts}</div>
     <div class="sub">🤝 Diplomacia</div>
      <div class="btn-grid">
        ${act('gift', `🎁 Presente (${fmtMoney(DIPLO.giftCost())})`)}
        ${n.pact ? '' : act('pact', `📜 Pacto de não-agressão${pending('pact')?' (negociando)':''}`, n.rel<5 || pending('pact'), 'Requer relações ≥ 5 · 2–4 meses')}
        ${n.alliance ? act('breakAlliance','💔 Romper aliança') : act('alliance', `🤝 Propor aliança${pending('alliance')?' (negociando)':''}`, n.rel<45 || pending('alliance'), 'Requer relações ≥ 45 · 4–8 meses')}
        ${act('spy', `🕵️ Espionagem (${fmtMoney(DIPLO.spyCost())})`, pending('spy'), 'Missão de 2–4 meses')}
        ${(n.sites||[]).some(s=>s.known) ? act('ops', `🎯 Operações secretas (${(n.sites||[]).filter(s=>s.known).length} alvos)`) : ''}
        ${act('tribute', '👑 Exigir tributo', pending('tribute'), 'Precisa de exército 1,5x mais forte')}
        ${act('embargo', '🚫 Embargo econômico')}
        ${act('insult', '😤 Insultar publicamente')}
        ${dealCount(n) ? act('cancelTrade','❌ Cancelar todos os acordos') : ''}
      </div>
      <button class="btn primary" style="width:100%;margin-top:8px" data-dip="war">⚔️ DECLARAR GUERRA</button>`}
    <div class="m-actions"><button class="btn sm" data-dip="fly">🎯 Ver no mapa</button><button class="btn" data-dip="close">Fechar</button></div>`;
  const m = openModal(html, {wide:true});
  m.querySelectorAll('[data-deal]').forEach(b=> b.onclick = ()=>{ const r = startNegotiation('deal', n, {type:b.dataset.deal}); if (r.ok){ SFX.page(); toast(r.msg,'dip'); } else { SFX.error(); toast(r.why,'bad'); } refreshAll(); openNation(id); });
  m.querySelectorAll('[data-cancel]').forEach(b=> b.onclick = ()=>{ cancelDeal(n, b.dataset.cancel); SFX.click(); addLog(`Cancelamos o acordo "${DEALS[b.dataset.cancel].n}" com ${n.name}.`,'dip'); refreshAll(); openNation(id); });
  m.querySelectorAll('[data-dip]').forEach(b=> b.onclick = ()=>{
    const k = b.dataset.dip;
    if (k==='close'){ SFX.click(); closeModal(); return; }
    if (k==='fly'){ closeModal(); const [lo,la]=cellCenter(n.cap); MapView.flyTo(lo,la,3); return; }
    if (k==='war'){ closeModal(); confirmModal('⚔️', `Guerra contra ${esc(n.name)}?`, `${n.pact?'<b>Quebraremos um pacto de não-agressão!</b> ':''}${n.truce>G.turn?'<b>Quebraremos uma trégua!</b> ':''}${dealCount(n)?`Perderemos ${dealCount(n)} acordo(s) comercial(is). `:''}${GOVS[p.gov].family==='dem' && n.rel>-40 && !n.claim ? 'O povo não verá motivo para esta guerra (−8 apoio). ':''}Aliados de ${esc(n.name)} podem entrar no conflito. Exército deles: ${fmtNum(n.power,0)} · nosso: ${fmtNum(p.atk,0)}.`, 'Declarar guerra', ()=>{
        declareWar(id, false); SFX.warDeclared(); MapView.doShake(10, 700); bigBanner('GUERRA!', `${esc(p.name)} × ${esc(n.name)}`); refreshAll(); saveGame(); }, true); return; }
    if (k === 'peace_table'){ SFX.page(); closeModal(); openPeaceTable(id); return; }
    if (k==='ops'){ closeModal(); openOpsList(id); return; }
    if (k.startsWith('peace_')){
      const t = k.slice(6);
      if (t === 'render'){ makePeace(id, 'render'); SFX.bell(); closeModal(); refreshAll(); return; }
      const r = startNegotiation('peace', n, {terms:t}); toast(r.ok?r.msg:r.why, r.ok?'dip':'bad'); refreshAll(); openNation(id); return;
    }
    let r;
    if (k==='pact' || k==='alliance' || k==='tribute') r = startNegotiation(k, n);
    else if (k==='spy'){ const c = DIPLO.spyCost(); if (p.treasury < c) r = {ok:false, why:'Tesouro insuficiente.'}; else { p.treasury -= c; r = startNegotiation('spy', n); } }
    else r = DIPLO[k](n);
    if (r.ok){ k==='gift' ? SFX.coin() : SFX.page(); toast(r.msg, 'dip'); if (!['pact','alliance','tribute','spy'].includes(k)) addLog(r.msg, 'dip'); } else { SFX.error(); toast(r.why, 'bad'); }
    refreshAll(); openNation(id);
  });
}

function openOrganize(cells){
  const p = G.p, cost = 0.002*p.gdp + 10*G.costScale, nm = genPlaceName();
  const m = openModal(`<div class="m-icon">🗺️</div><div class="m-title">Organizar o novo território</div>
    <div class="m-text">Nossos colonos ocuparam ${cells.length} novas regiões. Como elas serão administradas?</div>
    <div class="box"><b>🏛️ Fundar um novo estado</b><div class="muted">Custo ${fmtMoney(cost)} · +1 estado, novas cidades, melhora a administração de territórios grandes.</div>
      <div class="flex" style="margin-top:6px"><input type="text" id="org-name" value="${esc(nm)}" maxlength="28" style="flex:1"><button class="btn sm green" id="org-new" ${p.treasury<cost?'disabled':''}>Fundar estado</button></div></div>
    <div class="box"><b>🔗 Incorporar a um estado existente</b><div class="muted">Sem custo.</div>
      <div class="flex" style="margin-top:6px"><select id="org-state" style="flex:1">${p.stateNames.map(s=>`<option>${esc(s)}</option>`).join('')}</select><button class="btn sm" id="org-inc">Incorporar</button></div></div>
    <div class="m-actions"><button class="btn" id="org-fed">Manter como território federal</button></div>`);
  const done = (r)=>{ closeModal(); if (r.ok){ SFX.build(); toast(r.msg,'good'); } else { SFX.error(); toast(r.why,'bad'); } refreshAll(); saveGame(); };
  m.querySelector('#org-new').onclick = ()=>done(organizeTerritory('novo', m.querySelector('#org-name').value.trim(), cells.length));
  m.querySelector('#org-inc').onclick = ()=>done(organizeTerritory('incorporar', m.querySelector('#org-state').value, cells.length));
  m.querySelector('#org-fed').onclick = ()=>done(organizeTerritory('federal', '', cells.length));
}
function onNegotiation(msg, ok){ (UI.turnLogs ? UI.negMsgs = (UI.negMsgs||[]).concat([[msg,ok]]) : toast(msg, ok?'dip':'bad')); }

// ------------------------------------------------------------
//  Mapa — hover e clique
// ------------------------------------------------------------
function onMapHover(c, x, y){
  if (!G || MapView.placement){ hideTip(); return; }
  if (MapView.buildMode){ const why = canBuildAt(MapView.buildMode, c); const syn = why ? [] : potentialSynergies(MapView.buildMode, c); showTip(why ? `<b>Não é possível</b><br>${why}` : `<b>${BUILDINGS[MapView.buildMode].icon} ${BUILDINGS[MapView.buildMode].n}</b><br>Clique para construir aqui (${fmtMoney(buildCost(MapView.buildMode))})${syn.length?'<br>✨ Sinergia: '+syn.map(S=>S.icon+' '+S.n+' ('+fxList(S.fx)+')').join('<br>'):''}`, x, y); return; }
  if (c < 0 || !Grid.land[c]){ hideTip(); return; }
  const o = Grid.owner[c]; const [lo, la] = cellCenter(c);
  const coord = `<span class="muted" style="color:#c9b38a">${Math.abs(la).toFixed(0)}°${la>=0?'N':'S'} ${Math.abs(lo).toFixed(0)}°${lo>=0?'L':'O'}</span>`;
  if (o === 1) showTip(`<b>${esc(G.p.name)}</b><br>Nosso território · ${coord}`, x, y);
  else if (o === 0) showTip(`<b>Terra livre</b><br>Clique para colonizar · ${coord}`, x, y);
  else { const n = G.nations[o]; showTip(`<b>${esc(n.name)}</b> ${n.atWar?'⚔️':''}<br>${relLabel(n.rel)} (${n.rel>0?'+':''}${n.rel}) · ⚔ ${fmtNum(n.power,0)}<br>${n.atWar?'Clique para atacar':'Clique para opções'} · ${coord}`, x, y); }
}

function onMapClick(c, x, y){
  if (!G || G.over || UI.modalOpen) return;
  hideTip();
  if (MapView.buildMode === 'cidade'){ const why = canBuildAt('cidade', c); if (why){ SFX.error(); toast(why,'bad'); return; } SFX.click(); openCityFounding(c); return; }
  if (MapView.buildMode){
    const t = MapView.buildMode, r = buildAt(t, c);
    if (r.ok){ SFX.build(); SFX.coin(); const [wx,wy] = cellXY(c); MapView.ring(wx, wy, '#2d5a19', 22); MapView.floatText(wx, wy, BUILDINGS[t].icon + ' ' + BUILDINGS[t].n, '#2d5a19'); toast(r.msg, 'good'); MapView.buildMode = null; refreshAll(); saveGame(); }
    else { SFX.error(); toast(r.why, 'bad'); }
    return;
  }
  if (c < 0 || !Grid.land[c]){ closePopover(); return; }
  const o = Grid.owner[c], p = G.p;
  const here = corpsAt(c);
  // ---- exército selecionado: mover ou atacar ----
  const sel = (p.corps||[]).find(k=>k.id===UI.selCorps);
  if (sel){
    if (here && here !== sel){ selectCorps(here, x, y); return; }
    if (here === sel){ showCorpsPopover(sel, x, y); return; }
    if (o === 1 || o === 0){
      const r = orderMove(sel, c);
      if (r.ok){ SFX.march(); toast(r.msg, 'good'); MapView.ring(...cellXY(c), '#2c4f73', 16); UI.selCorps = null; MapView.selCorps = null; closePopover(); refreshAll(); saveGame(); }
      else { SFX.error(); toast(r.why, 'bad'); }
      return;
    }
    const n = G.nations[o];
    if (!n.atWar){ SFX.error(); toast(`Não estamos em guerra com ${n.name}. Declare guerra na Diplomacia antes de atacar.`, 'bad'); return; }
    MapView.selCell = c; renderAttackPopover(c, x, y, sel.id); return;
  }
  if (here){ selectCorps(here, x, y); return; }
  MapView.selCell = c;
  SFX.click();
  if (o === 1){
    const ci = p.cityCells.indexOf(c), b = (p.buildings||[]).find(bb=>bb.c===c);
    const pop = showPopover(`<h4>${flagImg(G.nations[1],24,16)} ${esc(p.name)}</h4>
      ${cityPopSection(c)}
      ${b && b.t !== 'cidade' ? `<div class="box" style="margin:6px 0"><b>${buildingLevelName(b)}</b>${b.up?`<br><small>🏗️ Evoluindo para ${treeNode(b.t,(b.path||[]).concat([b.up.id])).n} — ${b.up.due-G.turn} meses</small>`:''}
        <button class="btn sm green" style="width:100%;margin-top:4px" id="pop-evo">⬆️ Evoluir construção</button></div>` : ''}
      ${p.occ && p.occ[c] ? '<div style="color:var(--red2)">🔥 Território ocupado: mantenha um exército a até 3 regiões para evitar revoltas.</div>' : ''}
      <div class="muted">${p.homeCells.includes(c)?'Território original':'Território conquistado'} · ~${fmtNum(cellArea(c),0)} km²</div>`, x, y);
    const eb = pop.querySelector('#pop-evo'); if (eb) eb.onclick = ()=>{ closePopover(); openEvolve(b); };
    bindCityPop(pop, c, x, y);
    return;
  }
  if (o === 0){
    const pl = colonizePlan(c);
    const exps = Object.keys(EXPED).map(t=>[t, expedPlan(t, c)]);
    const pop = showPopover(`<h4>⛺ Terra Livre</h4>${pl.ok ? `<div>Enviar colonos para <b>${pl.cells.length}</b> regiões${pl.overseas?' (ultramar)':''}.</div>
      <div class="row"><span class="k">Custo</span><span class="v">${fmtMoney(pl.cost)}</span></div>
      <button class="btn green" style="width:100%" id="pop-col" ${p.treasury<pl.cost?'disabled':''}>⛺ Colonizar</button>` : `<div class="muted">Longe demais para colonos a pé. Envie uma <b>expedição</b>:</div>
      ${exps.map(([t, e])=>`<div class="exp-opt"${tip(`${EXPED[t].icon} ${EXPED[t].n}`, EXPED[t].d, e.ok ? `Viagem de ~${e.months} meses · risco de ${Math.round(e.risk*100)}% de a expedição se perder · custa ${fmtMoney(e.cost)}` : e.why)}>
        <span>${EXPED[t].icon} <b>${EXPED[t].n}</b><small>${e.ok ? `${e.months} meses · risco ${Math.round(e.risk*100)}% · ${fmtMoney(e.cost)}` : e.why}</small></span>
        <button class="btn xs green" data-exp="${t}" ${e.ok && p.treasury >= e.cost ? '' : 'disabled'}>Enviar</button></div>`).join('')}`}`, x, y);
    pop.querySelectorAll('[data-exp]').forEach(bt=> bt.onclick = ()=>{ const r = launchExpedition(bt.dataset.exp, c); closePopover(); if (r.ok){ SFX.march(); toast(r.msg,'good'); MapView.moveStart = performance.now(); } else { SFX.error(); toast(r.why,'bad'); } refreshAll(); saveGame(); });
    const bb = pop.querySelector('#pop-col');
    if (bb) bb.onclick = ()=>{ const r = colonize(c); if (r.ok){ SFX.build(); SFX.coin(); MapView.flashCells(r.cells, '#7fd65a'); const [wx,wy]=cellXY(c); MapView.floatText(wx,wy,`+${r.cells.length} regiões`, '#2d5a19'); closePopover(); refreshAll(); openOrganize(r.cells); return; } else { SFX.error(); toast(r.why,'bad'); } closePopover(); refreshAll(); saveGame(); };
    return;
  }
  const n = G.nations[o];
  const site = (n.sites||[]).find(s=>s.known && s.c===c);
  if (!n.atWar){
    const pop = showPopover(`<h4>${flagImg(n,24,16)} ${esc(n.name)}</h4><div>${relLabel(n.rel)} (${n.rel>0?'+':''}${n.rel})</div>
      ${site ? `<div>${SITES[site.t].icon} <b>${site.capital?'Capital e quartel-general':SITES[site.t].n}</b>${site.down > G.turn ? ' <span class="down">(fora do ar)</span>' : ''}</div><button class="btn sm danger" style="width:100%;margin:4px 0" data-sabsite="${o}:${c}">🎯 Operação secreta contra este alvo</button>` : ''}
      <div class="muted">${GOVS[n.gov]?GOVS[n.gov].name:''} · ⚔ ${fmtNum(n.power,0)} · 👥 ${fmtPop(n.pop)}</div>
      <button class="btn sm" style="width:100%;margin-top:6px" id="pop-dip">🤝 Diplomacia</button>`, x, y);
    pop.querySelector('#pop-dip').onclick = ()=>{ closePopover(); openNation(o); };
    return;
  }
  renderAttackPopover(c, x, y);
}
function selectCorps(k, x, y){ UI.selCorps = k.id; MapView.selCorps = k.id; SFX.click(); showCorpsPopover(k, x, y); }
function showCorpsPopover(k, x, y){
  const p = G.p;
  const status = k.naval ? `⛴️ Embarcado (${k.naval} meses)` : k.path && k.path.length ? `🥾 Marchando (${Math.ceil(k.path.length/corpsSpeed())} meses)` : '🏕️ Acampado';
  const pop = showPopover(`<h4>🎖️ ${esc(k.name)}</h4>
    <div class="muted">${status}${Grid.owner[k.cell]!==1?' · em território estrangeiro':''}</div>
    ${LAND_UNITS.filter(u=>k.units[u]).map(u=>row(`${UNIT[u].icon} ${UNIT[u].n}`, k.units[u])).join('')}
    ${row('⚔️ Ataque · 🛡️ Defesa', `${fmtNum(corpsPower(k,'atk'),0)} · ${fmtNum(corpsPower(k,'def'),0)}`)}
    ${row('🎖️ Moral · ⭐ Experiência', `${Math.round((k.morale||1)*100)}% · ${fmtNum(k.xp||0,1)}`)}
    <div class="tip" style="margin:6px 0">👉 Agora <b>clique no mapa</b>: no seu território para <b>marchar</b>, ou numa região inimiga (em guerra) a até ${corpsReach()} regiões para <b>atacar</b>.</div>
    <div class="btn-grid"><button class="btn xs" id="cp-r25">➕ Reforçar 25%</button><button class="btn xs" id="cp-r100">➕ Toda a reserva</button>
      <button class="btn xs" id="cp-split">✂️ Dividir ao meio</button><button class="btn xs danger" id="cp-dis">Desmobilizar</button></div>
    <button class="btn xs" style="width:100%" id="cp-x">Cancelar seleção</button>`, x, y);
  const done = (r)=>{ if (r.ok){ SFX.build(); toast(r.msg,'good'); } else { SFX.error(); toast(r.why,'bad'); } refreshAll(); showCorpsPopover(k, x, y); };
  pop.querySelector('#cp-r25').onclick = ()=>done(reinforceCorps(k, 0.25));
  pop.querySelector('#cp-r100').onclick = ()=>done(reinforceCorps(k, 1));
  pop.querySelector('#cp-split').onclick = ()=>{ const half = {}; let n = 0; for (const u of LAND_UNITS){ const h = Math.floor((k.units[u]||0)/2); if (h){ half[u] = h; k.units[u] -= h; n += h; } }
    if (!n){ SFX.error(); toast('Tropas insuficientes para dividir.','bad'); return; }
    p.corpsSeq = (p.corpsSeq||0) + 1; p.corps.push({id:p.corpsSeq, name:CORPS_NAMES[(p.corpsSeq-1)%CORPS_NAMES.length], cell:k.cell, prev:k.cell, units:half, morale:k.morale, xp:k.xp, path:[], naval:0, lastAttack:-1});
    SFX.march(); toast(`Novo exército formado com ${n} divisões.`, 'good'); refreshAll(); closePopover(); };
  pop.querySelector('#cp-dis').onclick = ()=>{ disbandCorps(k); UI.selCorps = null; MapView.selCorps = null; closePopover(); SFX.click(); refreshAll(); };
  pop.querySelector('#cp-x').onclick = ()=>{ UI.selCorps = null; MapView.selCorps = null; closePopover(); };
}

function renderAttackPopover(c, x, y, corpsId){
  const p = G.p, o = Grid.owner[c], n = G.nations[o];
  UI.atkOpts = Object.assign({tactic:'frontal', air:true, missiles:0, art:true}, UI.atkOpts || {});
  const plan = planAttack(c, UI.commit, corpsId || UI.atkCorps), O = UI.atkOpts;
  const site = (n.sites||[]).find(s=>s.known && cellDist(s.c, c) <= 1);
  const hasAir = ((p.units.aviao||0) + (p.units.drone||0)) > 0, hasMis = (p.units.missil||0) > 0;
  const pc = v => Math.round(v*100);
  const bar = plan.ok ? `<div class="outbar">${[['decisiva','#2d6a2d','Vitória decisiva'],['parcial','#7fa83a','Vitória parcial'],['empate','#c9a13b','Empate'],['derrota','#b3261e','Derrota']].map(([k,col,lab])=>plan.outcomes[k] > 0.005 ? `<i style="width:${plan.outcomes[k]*100}%;background:${col}" title="${lab}: ${pc(plan.outcomes[k])}%"></i>` : '').join('')}</div>
    <div class="outlegend"><span><b style="color:#2d6a2d">■</b> Decisiva ${pc(plan.outcomes.decisiva)}%</span><span><b style="color:#7fa83a">■</b> Parcial ${pc(plan.outcomes.parcial)}%</span><span><b style="color:#c9a13b">■</b> Empate ${pc(plan.outcomes.empate)}%</span><span><b style="color:#b3261e">■</b> Derrota ${pc(plan.outcomes.derrota)}%</span></div>` : '';
  const pop = showPopover(`<h4>${flagImg(n,24,16)} Ofensiva contra ${esc(n.name)}</h4>
    ${plan.ok ? `<div class="muted">${plan.naval?'⚓ Invasão anfíbia (penalidade)':'🗡️ Ataque terrestre'}${plan.isCap?' · ⭐ CAPITAL (defesa +60%)':''}${plan.site?' · 🏭 instalação estratégica (defesa +35%)':''}</div>
    <div class="lbl" style="margin-top:6px">Exército</div>
    <div class="seg">${plan.cands.map(k=>`<button data-k="${k.id}" class="${plan.corps.id===k.id?'active':''}">${esc(k.name)}</button>`).join('')}</div>
    <div class="lbl">Tropas empenhadas</div>
    <div class="seg">${[0.25,0.5,0.75,1].map(f=>`<button data-c="${f}" class="${UI.commit===f?'active':''}">${f*100}%</button>`).join('')}</div>
    <div class="lbl">Tática</div>
    <div class="seg"><button data-t="frontal" class="${O.tactic==='frontal'?'active':''}" title="Equilibrada">⚔️ Frontal</button><button data-t="cerco" class="${O.tactic==='cerco'?'active':''}" title="−15% de força, 40% menos perdas, avanço de até 2 regiões">🛡️ Cerco</button>${plan.canBlitz ? `<button data-t="relampago" class="${O.tactic==='relampago'?'active':''}" title="+20% de força e avanço maior, mas mais arriscado">⚡ Relâmpago</button>` : ''}</div>
    <div class="atk-opts">
      ${hasAir ? `<label><input type="checkbox" data-o="air" ${O.air?'checked':''}> ✈️ Apoio aéreo ${plan.airUsed ? `(+${fmtNum(plan.airPower*UI.commit,0)})` : '(fora de alcance)'}</label>` : ''}
      ${(plan.corps.units.art||0) > 0 ? `<label><input type="checkbox" data-o="art" ${O.art?'checked':''}> 💥 Barragem de artilharia (defesa −10%)</label>` : ''}
      ${hasMis ? `<div>🚀 Mísseis (${p.units.missil} em estoque, −6% de defesa cada): <span class="seg" style="display:inline-flex">${[0,1,3,5].filter(v=>v<=p.units.missil).map(v=>`<button data-m="${v}" class="${Math.min(O.missiles,p.units.missil)===v?'active':''}">${v}</button>`).join('')}</span></div>` : ''}
    </div>
    <div class="row"><span class="k">Nossa força</span><span class="v">${fmtNum(plan.force,0)}</span></div>
    <div class="row"><span class="k">Defesa inimiga</span><span class="v">${fmtNum(plan.def,0)}</span></div>
    ${plan.city ? `<div class="row"><span class="k">🏙️ Cidade: ${esc(plan.city.name)}${(plan.city.cap & 1) ? ' (capital)' : ''}</span><span class="v down">defesa +${Math.round((plan.cityMult-1)*100)}%</span></div>` : ''}
    ${plan.state ? `<div class="row"><span class="k">🗺️ Estado</span><span class="v">${esc(plan.state)}</span></div>` : ''}
    <div class="lbl" style="margin-top:4px">Resultados possíveis</div>${bar}
    <div class="muted" style="font-size:12.5px">Decisiva: toma 2–7 regiões · Parcial: 1–2 · Empate: ninguém avança, os dois lados perdem tropas · Derrota: perde ~${Math.round(UI.commit*35)}–${Math.round(UI.commit*60)}% das tropas${plan.ratio < 0.4 ? ' e o inimigo pode contra-atacar' : ''}.</div>
    <button class="btn primary" style="width:100%;margin-top:6px" id="pop-atk">⚔️ ATACAR!</button>` : `<div class="muted">${plan.why}</div>`}
    ${site ? `<div class="muted">${SITES[site.t].icon} Alvo próximo: ${SITES[site.t].n} — se capturado: ${SITES[site.t].d}</div><button class="btn sm" style="width:100%;margin-top:4px" data-sabsite="${o}:${site.c}">🎯 Sabotar ${SITES[site.t].n} sem invadir</button>` : ''}
    ${p.units.nuke ? `<button class="btn dark" style="width:100%;margin-top:6px" id="pop-nuke">☢️ Ataque nuclear (${p.units.nuke}) — só se você quiser</button>` : ''}`, x, y);
  const re = () => renderAttackPopover(c, x, y, corpsId);
  pop.querySelectorAll('[data-c]').forEach(b=> b.onclick = ()=>{ UI.commit = +b.dataset.c; SFX.click(); re(); });
  pop.querySelectorAll('[data-k]').forEach(b=> b.onclick = ()=>{ UI.atkCorps = +b.dataset.k; SFX.click(); renderAttackPopover(c, x, y, +b.dataset.k); });
  pop.querySelectorAll('[data-t]').forEach(b=> b.onclick = ()=>{ UI.atkOpts.tactic = b.dataset.t; SFX.click(); re(); });
  pop.querySelectorAll('[data-m]').forEach(b=> b.onclick = ()=>{ UI.atkOpts.missiles = +b.dataset.m; SFX.click(); re(); });
  pop.querySelectorAll('[data-o]').forEach(b=> b.onchange = ()=>{ UI.atkOpts[b.dataset.o] = b.checked; SFX.click(); re(); });
  const ab = pop.querySelector('#pop-atk'); if (ab) ab.onclick = ()=>{ closePopover(); launchAttack(c, plan.corps.id); };
  const nb = pop.querySelector('#pop-nuke'); if (nb) nb.onclick = ()=>{ closePopover(); confirmModal('☢️', 'Usar arma nuclear?', `Isto devastará ${esc(n.name)}, mas o mundo inteiro se voltará contra nós. ${n.tech>=techCountAt(1946)?'<b>Eles podem ter armas nucleares e retaliar!</b>':''}`, 'Lançar ogiva', ()=>launchNuke(c), true); };
}

function launchAttack(c, corpsId){
  const p = G.p, plan = planAttack(c, UI.commit, corpsId); if (!plan.ok) return;
  const [tx, ty] = cellXY(c);
  let from = cellXY(plan.corps.cell);
  UI.busy = true;
  SFX.march(); MapView.arrow(from, [tx, ty], plan.naval ? '#2c4f73' : '#8b1a1a');
  // fase 1: preparação (só o que o jogador escolheu)
  if (plan.airUsed){ const air = (p.units.aviao||0) + (p.units.drone||0), ab = nearestAirbase(c); const o = ab >= 0 ? cellXY(ab) : cellXY(p.capCell);
    for (let k=0;k<Math.min(4, 1+Math.floor(air/5));k++) setTimeout(()=>MapView.addAnim({type:'plane', from:[o[0]+rand(-6,6), o[1]+rand(-6,6)], to:[tx+rand(-6,6), ty+rand(-6,6)], dur:1400}), k*160); }
  for (let k=0;k<Math.min(5, plan.missilesUsed);k++) setTimeout(()=>MapView.addAnim({type:'missile', from:cellXY(p.capCell), to:[tx+rand(-4,4),ty+rand(-4,4)], dur:1300, sound:k===0}), 250 + k*150);
  if (plan.artUsed) setTimeout(()=>{ SFX.cannon(0); SFX.cannon(0.2); }, 500);
  // fase 2: assalto
  setTimeout(()=>{ SFX.cannon(0); SFX.cannon(0.25); SFX.cannon(0.5); for (let k=0;k<4;k++) setTimeout(()=>MapView.boom(tx+rand(-8,8), ty+rand(-8,8)), k*180); }, 900);
  // fase 3: resultado
  setTimeout(()=>{
    const r = playerAttack(c, UI.commit, corpsId);
    UI.busy = false;
    if (!r.ok){ toast(r.why,'bad'); return; }
    const OUT = {decisiva:['VITÓRIA DECISIVA', '#2d5a19'], parcial:['VITÓRIA PARCIAL', '#4f7a1f'], empate:['IMPASSE', '#8a6a1c'], derrota:['DERROTA', '#8b1a1a']}[r.outcome];
    if (r.win){ SFX.fanfare(); MapView.flashCells(r.captured, '#ffd34d'); }
    else if (r.outcome === 'empate') SFX.bell(); else { SFX.defeat(); MapView.doShake(6, 400); }
    if (r.lostCells.length) MapView.flashCells(r.lostCells, '#c0392b');
    MapView.floatText(tx, ty, OUT[0] + (r.captured.length ? ` +${r.captured.length}` : ''), OUT[1]);
    UI.selCorps = null; MapView.selCorps = null;
    refreshAll(); saveGame(); checkGameOver();
    if (!UI.noBattleReport) showBattleReport(r, c);
    else toast(`${OUT[0]}: ${r.captured.length ? '+' + r.captured.length + ' regiões · ' : ''}perdemos ${r.lost} divisões`, r.win ? 'good' : r.outcome === 'empate' ? undefined : 'bad');
  }, 1900);
}

// relatório de batalha em três fases
function showBattleReport(r, cell){
  const p = G.p, n = G.nations[r.plan.e], pl = r.plan, O = pl.opts || {};
  const OUT = {decisiva:['🏆','Vitória decisiva','As linhas inimigas se romperam.'], parcial:['🗡️','Vitória parcial','Avançamos, mas o inimigo recuou em ordem.'],
    empate:['⚖️','Impasse','As duas linhas resistiram. Ninguém avançou.'], derrota:['💀','Derrota','Nosso ataque foi repelido.']}[r.outcome];
  const taken = r.captured.map(k => (typeof cityAt === 'function' && cityAt(k)) ? cityAt(k).name : null).filter(Boolean);
  const prep = [pl.artUsed ? '💥 Barragem de artilharia: defesa inimiga −10%' : null, pl.missilesUsed ? `🚀 ${pl.missilesUsed} míssil(eis) lançado(s): defesa −${Math.round(Math.min(0.4, pl.missilesUsed*0.06)*100)}%` : null,
    pl.airUsed ? `✈️ Apoio aéreo: +${fmtNum(pl.airPower*UI.commit,0)} de força${r.planesLost ? ` · ${r.planesLost} avião(ões) abatido(s)` : ''}` : null].filter(Boolean);
  const m = openModal(`<div class="m-icon">${OUT[0]}</div><div class="m-title">${OUT[1]}</div><div class="m-date">${esc(pl.corps.name)} × ${esc(n.name)}${pl.city ? ' · ' + esc(pl.city.name) : ''}${pl.state ? ' (' + esc(pl.state) + ')' : ''}</div>
    <div class="box"><div class="lbl">1. Preparação · tática ${({frontal:'frontal', cerco:'de cerco', relampago:'relâmpago'})[O.tactic] || 'frontal'}</div>${prep.length ? prep.map(t=>`<div>${t}</div>`).join('') : '<div class="muted">Sem bombardeio prévio.</div>'}</div>
    <div class="box"><div class="lbl">2. Assalto</div>
      <div class="row"><span class="k">Nossa força</span><span class="v">${fmtNum(pl.force,0)}</span></div>
      <div class="row"><span class="k">Defesa inimiga</span><span class="v">${fmtNum(pl.def,0)}</span></div>
      <div class="row"><span class="k">Relação de forças no combate</span><span class="v">${Math.round(r.re*100)}%</span></div></div>
    <div class="box"><div class="lbl">3. Resultado</div><div>${OUT[2]}</div>
      ${r.captured.length ? `<div class="row"><span class="k">Regiões tomadas</span><span class="v up">+${r.captured.length}</span></div>` : ''}
      ${taken.length ? `<div class="row"><span class="k">Cidades tomadas</span><span class="v up">${taken.map(esc).join(', ')}</span></div>` : ''}
      ${r.lostCells.length ? `<div class="row"><span class="k">Contra-ataque inimigo</span><span class="v down">−${r.lostCells.length} região</span></div>` : ''}
      <div class="row"><span class="k">Nossas perdas</span><span class="v down">${r.lost} de ${r.before} divisões (${Math.round(r.lossFrac*100)}%)</span></div>
      <div class="row"><span class="k">Perdas do inimigo</span><span class="v up">${Math.round(r.enemyLoss*100)}% do poder militar</span></div>
      ${r.corpsDead ? '<div class="down">O exército foi aniquilado.</div>' : ''}</div>
    <label class="av-check" style="font-size:13px"><input type="checkbox" id="br-off"> Não mostrar mais o relatório (só um aviso rápido)</label>
    <div class="m-actions"><button class="btn green" id="br-ok">Continuar</button></div>`);
  m.querySelector('#br-ok').onclick = ()=>{ if (m.querySelector('#br-off').checked) UI.noBattleReport = true; SFX.click(); closeModal(); };
}

function launchNuke(c){
  const [tx, ty] = cellXY(c);
  SFX.alarm();
  MapView.arrow(cellXY(G.p.capCell), [tx,ty], '#222');
  setTimeout(()=>{
    const r = nukeStrike(c); if (!r) return;
    SFX.nuke(); MapView.addAnim({type:'nuke', x:tx, y:ty, dur:3500}); MapView.doShake(18, 1500);
    bigBanner('☢️ ATAQUE NUCLEAR', `${esc(r.n.name)} foi devastada`);
    if (r.retaliation) setTimeout(()=>{ const [hx,hy]=cellXY(G.p.capCell); SFX.nuke(); MapView.addAnim({type:'nuke', x:hx, y:hy, dur:3500}); MapView.doShake(20, 1500); toast('☢️ RETALIAÇÃO NUCLEAR contra nossa nação!', 'bad'); }, 2500);
    refreshAll(); saveGame(); checkGameOver();
  }, 1400);
}

// ------------------------------------------------------------
//  Turnos
// ------------------------------------------------------------
function nextTurn(){
  if (!G || G.over || UI.busy || UI.modalOpen || G.online) return;
  if (G.pendingEvents.length){ showNextEvent(); return; }
  UI.busy = true; closePopover();
  UI.turnLogs = []; UI.fxQueue = []; UI.worldBattles = 0;
  const prevYear = curYear();
  endTurn();
  SFX.turn();
  const logs = UI.turnLogs; UI.turnLogs = null;
  // toasts dos principais acontecimentos
  logs.filter(l=>l.k==='war' || (l.k==='bad' && /invadiu|capital|independ/i.test(l.txt))).slice(-2).forEach((l,i)=>setTimeout(()=>toast(esc(l.txt), l.k), i*400));
  (UI.negMsgs||[]).slice(-3).forEach(([msg,ok],i)=>setTimeout(()=>toast(esc(msg), ok?'dip':'bad'), 300 + i*400)); UI.negMsgs = [];
  // efeitos visuais de ataques da IA
  UI.fxQueue.forEach((f,i)=>setTimeout(f, 300 + i*700));
  if (curYear() !== prevYear) toast(`📅 Começa o ano de ${curYear()}`);
  UI.busy = false;
  computeFronts(); MapView.rails = computeRails(); MapView.moveStart = performance.now();
  refreshAll();
  if (!G.over) saveGame();
  if (!G.over && G.pendingEvents.length) setTimeout(showNextEvent, 350 + UI.fxQueue.length*300);
}
function showNextEvent(){
  if (!G || G.over) return;
  const ev = nextEvent(); if (!ev){ refreshAll(); return; }
  stopAutoTemp();
  SFX.event();
  const m = openModal(`<div class="m-icon">${ev.def.icon}</div><div class="m-title">${ev.def.title}</div><div class="m-date">${dateStr()} · ${esc(G.p.name)}</div>
    <div class="m-text">${ev.text}</div>${ev.choices.map((c,i)=>`<button class="choice" data-i="${i}"><b>${c.t}</b><span>${c.h||''}</span></button>`).join('')}`);
  m.querySelectorAll('.choice').forEach(b=> b.onclick = ()=>{
    SFX.click(); closeModal(); resolveEvent(+b.dataset.i);
    refreshAll(); if (!G.over) saveGame();
    if (!G.over && G.pendingEvents.length) setTimeout(showNextEvent, 250); else resumeAuto();
  });
}

// auto-avanço
function setSpeed(s){ UI.speed = s; SFX.click(); stopAuto(); if (s>0) startAuto(); updateTopbar(); }
function startAuto(){ stopAuto(); const ms = UI.speed===2 ? 1800 : 4000; UI.autoTimer = setInterval(()=>{ if (!UI.modalOpen && !UI.busy && G && !G.over && $('#popover').classList.contains('hidden')) nextTurn(); }, ms); }
function stopAuto(){ clearInterval(UI.autoTimer); UI.autoTimer = null; }
function stopAutoTemp(){ /* o intervalo já espera modais fecharem */ }
function resumeAuto(){ if (UI.speed > 0 && !UI.autoTimer) startAuto(); }

// ------------------------------------------------------------
//  Ganchos chamados pelo motor
// ------------------------------------------------------------
function onLog(txt, kind){
  if (UI.turnLogs) UI.turnLogs.push({txt, k:kind});
  if (UI.tab === 'registro' && G && !UI.turnLogs) renderPanel();
}
function onTech(t){ setTimeout(()=>{ SFX.research(); bigBanner(`${t.icon} ${t.n}`, 'Nova tecnologia descoberta!'); }, 200); }
function onWarDeclared(n){ UI.fxQueue.push(()=>{ SFX.warDeclared(); MapView.doShake(12, 800); bigBanner('GUERRA!', `${esc(n.name)} nos declarou guerra!`); }); if (!UI.turnLogs){ SFX.warDeclared(); bigBanner('GUERRA!', `${esc(n.name)} nos declarou guerra!`); } }
function onAIAttack(r){
  const fx = ()=>{
    const [tx, ty] = cellXY(r.target);
    const from = r.naval ? [tx+40, ty-30] : cellXY(r.n.cap);
    MapView.arrow(from, [tx, ty], '#5a0e0e');
    if (r.n.tech >= techCountAt(1915)) MapView.addAnim({type:'plane', from:cellXY(r.n.cap), to:[tx,ty], dur:2000, color:'#5a1a10', sound:true});
    setTimeout(()=>{ SFX.cannon(); MapView.boom(tx, ty); if (r.win){ SFX.alarm(); MapView.doShake(9, 600); MapView.flashCells(r.captured, '#ff4a2a'); MapView.floatText(tx, ty, `−${r.captured.length} regiões`, '#8b1a1a'); } else MapView.floatText(tx, ty, 'Repelido!', '#2d5a19'); }, 900);
  };
  if (UI.turnLogs) UI.fxQueue.push(fx); else fx();
}
function onAchievement(id){ const a = ACHIEVEMENTS[id]; notify(a.icon || '🏅', `Conquista: ${esc(a.n)}`, esc(a.d), 'ach'); }
function onGameOver(reason, kind){
  stopAuto(); UI.speed = 0;
  setTimeout(()=>{
    SFX.defeat(); $('#curtain').classList.remove('hidden'); setTimeout(()=>$('#curtain').classList.add('hidden'), 1700);
    const rec = getHistory()[0];
    setTimeout(()=>{
      const m = openModal(`<div class="m-icon">⚰️</div><div class="m-title">FIM DE JOGO</div><div class="m-date">${dateStr()}</div>
        <div class="m-text">${esc(reason)}</div>
        <div class="stat-grid">${[['Anos de história', fmtNum(G.turn/12,1)],['PIB final', fmtMoney(G.p.gdp)],['Área máxima', fmtArea(G.stats.peakArea)],['Pontuação', fmtNum(rec?rec.score:score())]].map(([l,v])=>`<div class="stat"><div class="l">${l}</div><div class="v">${v}</div></div>`).join('')}</div>
        <div class="muted">A história de ${esc(G.p.name)} foi registrada no Histórico de Nações.</div>
        <div class="m-actions"><button class="btn" id="go-menu">Menu principal</button><button class="btn primary" id="go-rep">📊 Ver relatório completo</button></div>`);
      m.querySelector('#go-menu').onclick = ()=>{ closeModal(); showMenu(); };
      m.querySelector('#go-rep').onclick = ()=>{ closeModal(); const r = getHistory()[0]; showMenu(); UI.pageBack = null; openReport(r); };
    }, 900);
  }, 600);
}
function onVictory(reason){
  setTimeout(()=>{
    stopAuto(); UI.speed = 0; SFX.victory(); bigBanner('🏆 VITÓRIA!', esc(reason));
    setTimeout(()=>{
      const m = openModal(`<div class="m-icon">🏆</div><div class="m-title">VITÓRIA!</div><div class="m-date">${dateStr()}</div>
        <div class="m-text">${esc(reason)} O nome de ${esc(G.p.leader)} ficará para sempre nos livros de história.</div>
        <div class="m-actions"><button class="btn" id="v-end">Encerrar e registrar</button><button class="btn green" id="v-cont">Continuar governando</button></div>`);
      m.querySelector('#v-cont').onclick = ()=>{ closeModal(); refreshAll(); };
      m.querySelector('#v-end').onclick = ()=>{ closeModal(); G.endReason = reason; G.endKind = 'vitoria'; const rec = archiveGame(false); showMenu(); openReport(rec); };
    }, 2600);
  }, 500);
}

// ------------------------------------------------------------
//  Menu do jogo / opções
// ------------------------------------------------------------
function openGameMenu(){
  SFX.page();
  if (G.online){
    const isHost = G.online.host;
    const m = openModal(`<div class="m-icon">🌐</div><div class="m-title">${esc(G.p.name)}</div><div class="m-date">Sala #${G.online.code} · ${dateStr()}</div>
      <button class="choice" id="og-pl"><b>👥 Jogadores e diplomacia</b><span>Alianças, comércio, mensagens e guerra com os outros jogadores</span></button>
      <button class="choice" id="og-rep"><b>📊 Relatório completo</b><span>Gráficos, guerras, rankings e crônica</span></button>
      <button class="choice" id="og-tro"><b>🏅 Conquistas</b><span>Inclui as conquistas online</span></button>
      <button class="choice" id="og-opt"><b>⚙️ Opções de som</b><span>Volume, música e efeitos</span></button>
      <button class="choice" id="og-leave"><b>🚪 Sair para o menu</b><span>${isHost ? 'Como anfitrião, o mundo para de avançar enquanto você estiver fora' : 'Sua nação fica parada; o mundo continua'}</span></button>
      ${isHost ? '<button class="choice danger" id="og-stop"><b>⏹ Encerrar a sessão</b><span>Para o relógio para todos. Retome depois pelo lobby da sala.</span></button>' : ''}
      <div class="m-actions"><button class="btn" id="og-x">Voltar ao jogo</button></div>`);
    m.querySelector('#og-x').onclick = ()=>{ SFX.click(); closeModal(); };
    m.querySelector('#og-pl').onclick = ()=>{ closeModal(); openPlayersPanel(); };
    m.querySelector('#og-rep').onclick = ()=>{ closeModal(); openLiveReport(); };
    m.querySelector('#og-tro').onclick = ()=>{ closeModal(); openTrophies(); };
    m.querySelector('#og-opt').onclick = ()=>{ closeModal(); openOptions(); };
    m.querySelector('#og-leave').onclick = ()=>{ closeModal(); leaveOnline(); };
    const st = m.querySelector('#og-stop'); if (st) st.onclick = ()=>{ closeModal(); confirmModal('⏹', 'Encerrar a sessão?', 'O mundo para de avançar para todos os jogadores. A sala fica salva e você pode retomar pelo lobby.', 'Encerrar sessão', async ()=>{ await NET.be.updateRoom(G.online.code, {status:'stopped', updatedAt:Date.now()}); leaveOnline(); }, true); };
    return;
  }
  const m = openModal(`<div class="m-icon">📜</div><div class="m-title">${esc(G.p.name)}</div><div class="m-date">${dateStr()}</div>
    <button class="choice" id="gm-save"><b>💾 Salvar jogo</b><span>O jogo também é salvo automaticamente a cada mês</span></button>
    <button class="choice" id="gm-rep"><b>📊 Relatório completo</b><span>Gráficos, guerras, rankings e crônica</span></button>
    <button class="choice" id="gm-tro"><b>🏅 Conquistas</b><span>Todas as conquistas para platinar o jogo</span></button>
    <button class="choice" id="gm-ency"><b>📖 Enciclopédia e História</b><span>Cada regime, lei, pesquisa e unidade explicados, com a história real</span></button>
    <button class="choice" id="gm-help"><b>🧭 Instruções</b><span>Como jogar</span></button>
    <button class="choice" id="gm-opt"><b>⚙️ Opções de som</b><span>Volume, música e efeitos</span></button>
    <button class="choice" id="gm-menu"><b>🏰 Salvar e voltar ao menu</b><span>Continue depois de onde parou</span></button>
    <button class="choice danger" id="gm-quit"><b>⛔ Finalizar esta partida</b><span>Encerra o mundo de vez e registra a nação no histórico</span></button>
    <div class="m-actions"><button class="btn" id="gm-close">Voltar ao jogo</button></div>`);
  m.querySelector('#gm-close').onclick = ()=>{ SFX.click(); closeModal(); };
  m.querySelector('#gm-save').onclick = ()=>{ saveGame(); SFX.coin(); toast('💾 Jogo salvo!', 'good'); closeModal(); };
  m.querySelector('#gm-rep').onclick = ()=>{ closeModal(); openLiveReport(); };
  m.querySelector('#gm-tro').onclick = ()=>{ closeModal(); openTrophies(); };
  m.querySelector('#gm-help').onclick = ()=>{ closeModal(); openHelp(); };
  m.querySelector('#gm-ency').onclick = ()=>{ closeModal(); openEncyclopedia(); };
  m.querySelector('#gm-opt').onclick = ()=>{ closeModal(); openOptions(); };
  m.querySelector('#gm-menu').onclick = ()=>{ saveGame(); closeModal(); showMenu(); };
  m.querySelector('#gm-quit').onclick = ()=>{ SFX.error(); closeModal(); const q = openModal(`<div class="m-icon">⛔</div><div class="m-title" style="color:#b3261e">Finalizar o mundo?</div>
    <div class="m-text">Você está prestes a <b>encerrar para sempre</b> a partida de <b>${esc(G.p.name)}</b> (${dateStr()}). O mundo desta partida será apagado e a nação irá para o Histórico — <b>não será possível continuar jogando</b>.<br><br>Se você só quer sair, use <b>“Salvar e voltar ao menu”</b>.</div>
    <div class="m-actions"><button class="btn green" id="fq-no">Não, voltar ao jogo</button><button class="btn" id="fq-save">💾 Salvar e sair</button><button class="btn primary" id="fq-yes">⛔ Sim, finalizar o mundo</button></div>`);
    q.querySelector('#fq-no').onclick = ()=>{ SFX.click(); closeModal(); };
    q.querySelector('#fq-save').onclick = ()=>{ saveGame(); closeModal(); showMenu(); };
    q.querySelector('#fq-yes').onclick = ()=>{ closeModal(); G.over = true; const rec = archiveGame(true); SFX.defeat(); showMenu(); openReport(rec); }; };
}
function openOptions(){
  const m = openModal(`<div class="m-icon">⚙️</div><div class="m-title">Opções</div>
    <div class="field"><label>Volume geral</label><input type="range" min="0" max="1" step="0.05" value="${SFX.volume}" id="op-vol"></div>
    <div class="policy"><span class="ic">🔔</span><span class="nm"><b>Efeitos sonoros</b></span><span class="switch ${SFX.sfxOn?'on':''}" id="op-sfx"></span></div>
    <div class="policy"><span class="ic">🎵</span><span class="nm"><b>Música ambiente</b><small>Melodia procedural em modo dórico</small></span><span class="switch ${SFX.musicOn?'on':''}" id="op-mus"></span></div>
    <div class="policy"><span class="ic">⛶</span><span class="nm"><b>Tela cheia</b><small>Também pelo botão ⛶ no topo ou pela tecla F</small></span><span class="switch ${isFullscreen()?'on':''}" id="op-fs"></span></div>
    <div class="policy"><span class="ic">💥</span><span class="nm"><b>Animações de guerras no mapa</b><small>Aviões, mísseis e explosões nas guerras de todas as nações</small></span><span class="switch ${MapView.worldFx?'on':''}" id="op-wfx"></span></div>
    <div class="m-actions"><button class="btn" id="op-close">Fechar</button></div>`);
  m.querySelector('#op-fs').onclick = ()=>toggleFullscreen();
  m.querySelector('#op-wfx').onclick = e=>{ setWorldFx(!MapView.worldFx); e.target.classList.toggle('on', MapView.worldFx); };
  m.querySelector('#op-vol').oninput = e=>{ SFX.setVolume(+e.target.value); saveSettings(); };
  m.querySelector('#op-vol').onchange = ()=>SFX.click();
  m.querySelector('#op-sfx').onclick = e=>{ SFX.setSfx(!SFX.sfxOn); e.target.classList.toggle('on', SFX.sfxOn); saveSettings(); SFX.click(); };
  m.querySelector('#op-mus').onclick = e=>{ SFX.setMusic(!SFX.musicOn); e.target.classList.toggle('on', SFX.musicOn); saveSettings(); };
  m.querySelector('#op-close').onclick = ()=>{ closeModal(); if (G) updateTopbar(); };
}

// ------------------------------------------------------------
//  Relatórios
// ------------------------------------------------------------
function openLiveReport(){ const rec = buildRecord(false); openReport(rec, true); }
function openReport(rec, live){
  const sym = rec.currencySym || '$';
  const F = rec.final, S = rec.stats;
  const yrs = rec.months/12;
  const badge = rec.ongoing ? '<span class="badge win" style="background:#5f8f3f;color:#fff">EM ANDAMENTO</span>' : rec.victory ? '<span class="badge win">VITÓRIA</span>' : rec.kind==='abandono' ? '<span class="badge ab">ENCERRADA</span>' : '<span class="badge">DERROTA</span>';
  const st = (l, v) => `<div class="stat"><div class="l">${l}</div><div class="v">${v}</div></div>`;
  const wars = (rec.warHistory||[]);
  const html = `
  <div class="rep-head"><canvas id="rep-flag" width="150" height="100" style="border:2px solid var(--ink2);box-shadow:3px 4px 10px rgba(0,0,0,.3)"></canvas>
    <div><div class="big">${esc(rec.official)}</div><div>${esc(rec.title)} ${esc(rec.leader)} · ${GOVS[rec.gov]?GOVS[rec.gov].name:''} · ${ECONS[rec.econ]?ECONS[rec.econ].name:''}</div>
    <div class="muted">“${esc(rec.motto||'')}” · Capital: ${esc(rec.capital)} · ${ERAS[rec.era]?ERAS[rec.era].name:''}</div>
    <div style="margin-top:6px">${badge} <b>${rec.startYear}</b> → <b>${esc(rec.endDate)}</b> (${fmtNum(yrs,1)} anos) · Pontuação: <b>${fmtNum(rec.score)}</b></div></div></div>
  ${rec.reason || rec.victoryReason ? `<div class="rep-reason ${rec.victory?'win':''}">${rec.victory?'🏆 '+esc(rec.victoryReason)+'<br>':''}${esc(rec.reason||'')}</div>` : ''}
  <div class="stat-grid">
    ${st('PIB final', fmtMoney(F.gdp, sym))}${st('PIB máximo', fmtMoney(S.peakGdp, sym))}${st('PIB per capita', sym+' '+fmtNum(F.pc,0))}
    ${st('População', fmtPop(F.pop))}${st('Área final', fmtArea(F.area))}${st('Área máxima', fmtArea(S.peakArea))}
    ${st('Poder militar', fmtNum(F.power,0))}${st('Tecnologias', F.techs + '/' + TECHS.length)}${st('Tesouro · Dívida', `${fmtMoney(F.treasury,sym)}<br><small>${fmtMoney(F.debt,sym)}</small>`)}
    ${st('Apoio · Estabilidade', `${Math.round(F.approval)}% · ${Math.round(F.stability)}%`)}${st('Batalhas', `${S.battlesWon} V · ${S.battlesLost} D`)}${st('Regiões conquistadas', `+${S.cellsConquered} / −${S.cellsLost}`)}
    ${st('Nações anexadas', S.annexed)}${st('Regiões colonizadas', S.colonized)}${st('Guerras', `${S.wars} (${S.monthsAtWar} meses)`)}
    ${st('Decisões tomadas', S.eventsSeen)}${st('Empréstimos', S.loansTaken)}${st('Ranking final', rec.ranks.gdp ? `PIB #${rec.ranks.gdp} · Área #${rec.ranks.area} · Mil. #${rec.ranks.power}` : '—')}
  </div>
  <div class="section-title">Evolução</div>
  <div class="charts">
    ${['PIB','PIB per capita','População (milhões)','Tesouro e Dívida','Apoio e Estabilidade','Área (km²)','Poder militar','Inflação e Desemprego (%)'].map((t,i)=>`<div class="chart-box"><h5>${t}</h5><canvas id="ch${i}"></canvas></div>`).join('')}
  </div>
  <div class="section-title">Guerras</div>
  ${wars.length ? `<table class="tbl"><tr><th>Inimigo</th><th>Período</th><th>Batalhas</th><th>Regiões</th><th>Placar</th><th>Desfecho</th></tr>${wars.map(w=>`<tr><td>${esc(w.e)}</td><td>${dateShortR(rec,w.start)} – ${dateShortR(rec,w.end)}</td><td>${w.won}V · ${w.lost}D</td><td>+${w.taken} / −${w.lostCells}</td><td>${w.score}</td><td>${esc(w.result)}</td></tr>`).join('')}</table>` : '<div class="muted">Nenhuma guerra. Uma era de paz.</div>'}
  ${rec.top ? `<div class="section-title">Ranking mundial (PIB)</div><table class="tbl"><tr><th>#</th><th>Nação</th><th>PIB</th><th>População</th><th>Área</th><th>Poder</th></tr>${rec.top.map((x,i)=>`<tr class="${x.me?'me':''}"><td>${i+1}</td><td>${esc(x.name)}</td><td>${fmtMoney(x.gdp,sym)}</td><td>${fmtPop(x.pop)}</td><td>${fmtArea(x.area)}</td><td>${fmtNum(x.power,0)}</td></tr>`).join('')}</table>` : ''}
  <div class="section-title">Conquistas</div>
  <div>${Object.entries(ACHIEVEMENTS).map(([k,a])=>`<span class="ach ${rec.achievements.includes(k)?'':'off'}" title="${esc(a.d)}">${a.icon} ${a.n}</span>`).join('')}</div>
  <div class="section-title">Tecnologias</div>
  <div>${TECHS.map(t=>`<span class="ach ${rec.techs.includes(t.id)?'':'off'}">${t.icon} ${t.n}</span>`).join('')}</div>
  <div class="section-title">Crônica (últimos registros)</div>
  <div style="max-height:360px;overflow:auto">${rec.log.slice().reverse().map(l=>`<div class="log-entry ${l.k}"><span class="t">${dateShortR(rec,l.t)}</span>${esc(l.txt)}</div>`).join('')}</div>`;
  showPage(`📊 Relatório — ${esc(rec.name)}`, html, ()=>{
    const fc = $('#rep-flag'); if (fc) drawFlag(fc.getContext('2d'), rec.flag, 0, 0, 150, 100);
    const H = rec.hist, o = {startYear:rec.startYear, startMonth:rec.startMonth||0, wars:(rec.warHistory||[]).map(w=>[w.start,w.end])};
    const s = (k, f) => H.map(h=>[h.t, f ? f(h[k]) : h[k]]);
    drawLineChart($('#ch0'), [{data:s('gdp'), color:'#8b1a1a', fill:true, label:'PIB'}], o);
    drawLineChart($('#ch1'), [{data:s('pc'), color:'#c9a13b', fill:true, label:'PIB pc'}], o);
    drawLineChart($('#ch2'), [{data:s('pop'), color:'#2c4f73', fill:true, label:'Pop'}], o);
    drawLineChart($('#ch3'), [{data:s('tre'), color:'#3f6b2a', label:'Tesouro'}, {data:s('debt'), color:'#8b1a1a', label:'Dívida'}], o);
    drawLineChart($('#ch4'), [{data:s('app'), color:'#c9a13b', label:'Apoio'}, {data:s('stab'), color:'#2c4f73', label:'Estabilidade'}], Object.assign({min:0,max:100}, o));
    drawLineChart($('#ch5'), [{data:s('area'), color:'#6b4a2a', fill:true, label:'Área'}], o);
    drawLineChart($('#ch6'), [{data:s('pow'), color:'#5a0e0e', fill:true, label:'Poder'}], o);
    drawLineChart($('#ch7'), [{data:s('inf'), color:'#b3261e', label:'Inflação'}, {data:s('un'), color:'#5a3d1e', label:'Desemprego'}], o);
  });
}
function dateShortR(rec, t){ const sm = rec.startMonth||0; return `${MONTHS_S[(sm+t)%12]}/${rec.startYear + Math.floor((sm+t)/12)}`; }

function openHistory(){
  const h = getHistory();
  const html = h.length ? `<div class="hist-list">${h.map((r,i)=>`<div class="hist-card" data-h="${i}"><canvas width="84" height="56" data-hf="${i}" style="border:1px solid var(--ink2)"></canvas>
    <div><div class="nm">${esc(r.name)}</div><div class="meta">${esc(r.title)} ${esc(r.leader)} · ${GOVS[r.gov]?GOVS[r.gov].name:''}<br>${r.startYear} → ${esc(r.endDate)} (${fmtNum(r.months/12,1)} anos)<br>
    ${r.victory?'<span class="badge win">VITÓRIA</span>':r.kind==='abandono'?'<span class="badge ab">ENCERRADA</span>':'<span class="badge">DERROTA</span>'} Pontuação <b>${fmtNum(r.score)}</b><br><i>${esc((r.reason||'').slice(0,90))}</i></div><button class="btn xs danger h-del" data-hdel="${i}" title="Apagar esta partida do histórico">🗑️</button></div></div>`).join('')}</div>
    <div style="margin-top:16px;text-align:right"><button class="btn sm" id="h-clear">🗑️ Apagar histórico</button></div>`
    : '<div class="muted" style="text-align:center;padding:60px">Nenhuma nação foi registrada ainda. Funde a sua e escreva história!</div>';
  showPage('📚 Histórico de Nações', html, ()=>{
    $$('[data-hf]').forEach(c=>drawFlag(c.getContext('2d'), h[+c.dataset.hf].flag, 0, 0, 84, 56));
    $$('[data-h]').forEach(c=>c.onclick = ()=>{ SFX.page(); UI.pageBack = openHistory; openReport(h[+c.dataset.h]); });
    $$('[data-hdel]').forEach(b=>b.onclick = e=>{ e.stopPropagation(); const r = h[+b.dataset.hdel]; SFX.click();
      confirmModal('🗑️', 'Apagar esta partida do histórico?', `A nação <b>${esc(r.name)}</b> (${r.startYear} → ${esc(r.endDate)}) sai do histórico para sempre, com o relatório dela.`, 'Apagar', ()=>{
        try { localStorage.setItem(HIST_KEY, JSON.stringify(getHistory().filter(x=>x.id !== r.id))); } catch(err){}
        if (typeof CLOUD !== 'undefined') CLOUD.soon(500); SFX.error(); toast('Partida apagada do histórico.'); showMenu(); openHistory(); }, true); });
    const cl = $('#h-clear'); if (cl) cl.onclick = ()=>confirmModal('🗑️','Apagar todo o histórico?','Esta ação não pode ser desfeita.','Apagar', ()=>{ localStorage.removeItem(HIST_KEY); if (typeof CLOUD !== 'undefined') CLOUD.soon(500); showMenu(); openHistory(); }, true);
  });
}

function openHelp(){
  showPage('🧭 Instruções — Como governar', `<div class="help-sec">
  <section><h3>🏰 1. Funde sua nação</h3><p>Em <b>Novo Jogo</b>, defina nome, líder, regime político, sistema econômico, religião, capital e moeda. Ajuste <b>área</b> (km²) e <b>população</b>, número de <b>estados</b> e <b>cidades</b>, clima, terreno, recursos naturais e a vocação do país. Tudo isso altera a economia, o exército e os eventos ao longo do jogo.</p></section>
  <section><h3>🎨 2. Bandeira e território</h3><p>Monte a bandeira com layouts, cores e emblemas. Depois <b>desenhe o contorno</b> do país com o mouse (segure e arraste). O desenho é escalado automaticamente para a área escolhida.</p></section>
  <section><h3>🗺️ 3. Escolha o local</h3><p>Mova o país sobre o mapa-múndi, gire com <kbd>R</kbd> ou <kbd>Shift</kbd>+roda e clique para fundar. No oceano, ele surge como uma <b>ilha nova</b>. Sobre outra nação, você toma as terras dela — e ela <b>reivindicará o território</b>, tornando a guerra provável.</p></section>
  <section><h3>⏳ 4. O tempo</h3><p>Cada turno é <b>um mês</b>. Clique em <b>Próximo mês</b> (ou <kbd>Espaço</kbd>) ou use o avanço automático ▶ / ⏩. Eventos pausam o jogo até você decidir.</p></section>
  <section><h3>💰 5. Economia</h3><p>Ajuste impostos e gastos (educação, saúde, infraestrutura, bem-estar, ciência, polícia). Impostos altos derrubam o apoio; gastos altos geram déficit. Pegue empréstimos com cuidado: a <b>dívida</b> cobra juros conforme o seu <b>rating</b>. Imprimir dinheiro gera inflação. Funde cidades para urbanizar e ajuste o número de estados para a <b>eficiência administrativa</b> ideal (cerca de 1 estado a cada 150 mil km²).</p></section>
  <section><h3>⚔️ 6. Guerra</h3><p>Recrute unidades na aba Militar (tecnologias liberam tanques, aviões, navios, mísseis e ogivas nucleares). Declare guerra na aba Diplomacia. Em guerra, <b>clique em regiões inimigas</b> para atacar: escolha quantas forças empenhar e veja a chance de vitória. Alvos distantes exigem <b>marinha</b>. Conquiste a capital inimiga para enfraquecê-la; reduza o inimigo a zero para anexá-lo. A IA também ataca você!</p></section>
  <section><h3>🎖️ Exércitos no mapa</h3><p>Suas tropas ficam em <b>exércitos</b> (escudos com o número de divisões). Clique num exército e depois no destino para <b>marchar</b> (ferrovias e motores aceleram). Para atacar, o exército precisa estar perto da região inimiga. Escolha quantas tropas empenhar: <b>uma derrota custa caro</b>, até 65% das tropas usadas. Regiões sem tropas por perto ficam vulneráveis, e terras conquistadas sem guarnição podem se revoltar.</p></section>
  <section><h3>🏭 Instalações e ferrovias</h3><p>Com a tecnologia Ferrovias, seus trilhos aparecem no mapa. Se o inimigo tomar uma cidade da linha, a economia sofre. As outras nações têm bases, usinas, centrais de água, polos industriais e portos. Descubra-os com <b>espionagem</b> ou avançando perto deles, e capture-os para enfraquecer o inimigo.</p></section>
  <section><h3>⬆️ Evolução das construções</h3><p>Cada construção evolui por uma <b>árvore de caminhos</b>: escolha um ramo e os outros se fecham. Novas opções se abrem a cada nível, algumas dependendo da época tecnológica.</p></section>
  <section><h3>⛏️ Recursos e clima</h3><p>Cada país tem suas riquezas naturais. Você pode <b>exportar a matéria-prima</b> (dinheiro imediato, mas importa o produto pronto depois) ou <b>industrializar</b> (caro e demorado, porém muito mais rentável). O clima escolhido precisa combinar com o local no mapa: um povo tropical no Ártico progride muito devagar.</p></section>
  <section><h3>🌐 Multiplayer online</h3><p>Em <b>Jogar Online</b>, crie uma conta, crie uma sala (até 5 jogadores) e passe o código aos amigos. O anfitrião inicia e o mês avança sozinho, sem pausa. Pelo botão 👥, faça alianças, comércio, paz ou guerra com os outros jogadores. Regimes diferentes rendem menos no comércio. Para jogar pela internet, siga o guia COMO_PUBLICAR.md.</p></section>
  <section><h3>🧭 Expedições e projetos</h3><p>Terras livres distantes podem ser alcançadas por <b>expedições</b> (navio, dirigível ou ponte aérea), com risco de se perderem. Cada cidade pode tocar <b>projetos</b> (festival, metrô, Jogos Olímpicos...), e obras complementares próximas formam <b>sinergias</b> com bônus extras.</p></section>
  <section><h3>🎯 Modo com objetivos</h3><p>Ao começar, escolha entre o <b>Modo Livre</b> e o <b>Modo com Objetivos</b>: uma campanha em 4 capítulos com metas e recompensas (aba 🎯 Metas). Cumprir todas é uma vitória.</p></section>
  <section><h3>🤝 7. Diplomacia</h3><p>Presentes, acordos comerciais (renda mensal), pactos de não-agressão, alianças (aliados entram nas suas guerras), espionagem, tributos, embargos e insultos. Religião e regime semelhantes aproximam as nações.</p></section>
  <section><h3>🔬 8. Ciência e leis</h3><p>Escolha o que pesquisar na aba Ciência. Cada tecnologia dá bônus permanentes. Na aba Leis, ative políticas como saúde universal, conscrição, censura ou banco central — cada uma com prós e contras.</p></section>
  <section><h3>⛺ 9. Colonização</h3><p>Terras sem dono (Groenlândia, Antártida, partes da África e da Ásia) podem ser colonizadas clicando nelas no mapa, se estiverem perto da sua fronteira ou na costa (com frota).</p></section>
  <section><h3>⚰️ 10. Como perder</h3><ul><li>Ser totalmente conquistado.</li><li>Perder uma eleição (regimes democráticos) — ou anular o resultado e virar ditadura.</li><li>Golpe militar (regimes autoritários com baixa estabilidade).</li><li>Revolução (estabilidade abaixo de 10% por vários meses).</li><li>Colapso econômico (dívida acima de 300% do PIB sem dinheiro em caixa).</li></ul></section>
  <section><h3>🏆 11. Como vencer</h3><ul><li><b>Hegemonia:</b> controlar 25% das terras do mundo.</li><li><b>Superpotência:</b> maior PIB e maior exército ao mesmo tempo.</li><li><b>Era da Abundância:</b> pesquisar Fusão Nuclear.</li></ul><p>Após vencer, você pode continuar governando.</p></section>
  <section><h3>📚 12. Histórico e relatórios</h3><p>O jogo salva automaticamente todo mês (<b>Continuar Jogo</b>). Toda nação que termina — por derrota, vitória ou encerramento — vai para o <b>Histórico de Nações</b>, com relatório completo: gráficos, guerras, conquistas, rankings e a crônica do país.</p></section>
  <section><h3>⌨️ Atalhos</h3><ul><li><kbd>Espaço</kbd> próximo mês · <kbd>0</kbd> <kbd>1</kbd> <kbd>2</kbd> velocidade</li><li>Roda do mouse: zoom · arrastar: mover mapa</li><li><kbd>F</kbd> liga/desliga a tela cheia</li><li><kbd>Esc</kbd> fecha janelas · <kbd>H</kbd> vai para a capital</li></ul></section>
  </div>`);
}

// ------------------------------------------------------------
//  Início de partida
// ------------------------------------------------------------
function startNewGame(cfg){
  newGame(cfg);
  const p = G.p;
  p.flagCanvas = flagCanvas(p.flag, 120, 80);
  p.attacksLeft = maxAttacks();
  Object.keys(flagCache).forEach(k=>delete flagCache[k]);
  const extra = [p.homePoly].filter(Boolean); MapView.buildPaths(extra); MapView.buildBase(extra);
  MapView.dirty = true;
  MapView.rails = computeRails(); UI.selCorps = null; MapView.selCorps = null;
  showHUD();
  UI.speed = 0; UI.tab = 'geral'; $$('#tabs button').forEach(x=>x.classList.toggle('active', x.dataset.tab==='geral'));
  setTimeout(()=>{
    MapView.flyTo(cfg.center[0], cfg.center[1], 3);
    if (p.homePoly){ const path = new Path2D(); MapView.polyPath(p.homePoly, path); MapView.addAnim({type:'found', path, color:p.color, dur:2600}); }
    else MapView.flashCells(p.homeCells.slice(0, 400), p.color);
    SFX.fanfare(); bigBanner(esc(p.name), p.existing ? `${esc(p.title)} ${esc(p.leader)} assume o governo` : `Fundada em ${dateStr()}`);
  }, 600);
  saveGame();
}
function openSlots(overwrite){
  const slots = listSlots();
  const m = openModal(`<div class="m-icon">📜</div><div class="m-title">${overwrite ? 'Escolha a partida que será substituída' : 'Partidas salvas'}</div><div class="m-date">${overwrite ? 'O novo jogo vai ocupar a vaga escolhida e a partida antiga será apagada.' : `Até ${MAX_SLOTS} partidas ao mesmo tempo`}</div>
    <div class="slot-list">${slots.map(({i,meta})=> meta ? `<div class="slot"><canvas width="66" height="44" data-sf="${i}"></canvas>
      <div class="slot-info"><b>${esc(meta.name)}</b><small>${esc(meta.title||'')} ${esc(meta.leader||'')} · ${GOVS[meta.gov]?GOVS[meta.gov].name:''}</small><small>📅 ${esc(meta.date)} · salvo em ${new Date(meta.savedAt).toLocaleString('pt-BR')}</small></div>
      ${overwrite ? '' : `<button class="btn green sm" data-load="${i}">▶ Jogar</button>`}<button class="btn sm" data-over="${i}" title="Começar um novo jogo nesta vaga">♻️ ${overwrite ? 'Substituir esta' : 'Sobrescrever'}</button><button class="btn sm danger" data-del="${i}" title="Apagar">🗑️</button></div>`
      : `<div class="slot empty"><span class="slot-n">${i+1}</span><div class="slot-info"><b>Vaga livre</b><small>Use “Novo Jogo” para começar uma nação aqui.</small></div></div>`).join('')}</div>
    <div class="m-actions"><button class="btn" id="sl-close">Fechar</button></div>`, {wide:true});
  m.querySelectorAll('[data-sf]').forEach(c=>{ const mt = slotMeta(+c.dataset.sf); if (mt && mt.flag) drawFlag(c.getContext('2d'), mt.flag, 0, 0, 66, 44); });
  m.querySelector('#sl-close').onclick = ()=>{ SFX.click(); closeModal(); };
  m.querySelectorAll('[data-load]').forEach(b=> b.onclick = ()=>{ SFX.page(); closeModal(); continueGame(+b.dataset.load); });
  m.querySelectorAll('[data-over]').forEach(b=> b.onclick = ()=>{ const i = +b.dataset.over, mt = slotMeta(i); closeModal();
    confirmModal('♻️', 'Sobrescrever esta partida?', `Você vai começar um <b>novo jogo</b> na vaga de <b>${esc(mt.name)}</b> (${esc(mt.date)}). Quando a nova nação for fundada, a partida antiga será apagada para sempre (ela <b>não</b> vai para o histórico).`, 'Sobrescrever', ()=>{ C.overwriteSlot = i; SFX.page(); setTimeout(chooseMode, 50); }, true); });
  m.querySelectorAll('[data-del]').forEach(b=> b.onclick = ()=>{ const i = +b.dataset.del, mt = slotMeta(i); closeModal();
    confirmModal('🗑️', 'Apagar esta partida?', `A partida de <b>${esc(mt.name)}</b> (${esc(mt.date)}) será apagada para sempre. Ela <b>não</b> vai para o histórico.`, 'Apagar partida', ()=>{ deleteSlot(i); SFX.error(); showMenu(); setTimeout(openSlots, 60); }, true); });
}
function continueGame(slot){
  if (!loadGame(slot)){ toast('Não foi possível carregar o jogo salvo.', 'bad'); return; }
  const p = G.p;
  p.flagCanvas = flagCanvas(p.flag, 120, 80);
  if (p.attacksLeft === undefined) p.attacksLeft = maxAttacks();
  Object.keys(flagCache).forEach(k=>delete flagCache[k]);
  const extra = [p.homePoly].filter(Boolean); MapView.buildPaths(extra); MapView.buildBase(extra);
  MapView.dirty = true; UI.selCorps = null; MapView.selCorps = null;
  UI.speed = 0;
  showHUD();
  computeFronts(); MapView.rails = computeRails();
  setTimeout(()=>{ goHome(); toast(`Bem-vindo de volta, ${esc(p.title)} ${esc(p.leader)}.`); if (G.pendingEvents.length) setTimeout(showNextEvent, 800); }, 600);
}

// ------------------------------------------------------------
//  Ligações globais
// ------------------------------------------------------------
$('#tb-stats').addEventListener('click', e=>{ if (e.target.closest('#st-app')){ SFX.page(); UI.tab='povo'; $$('#tabs button').forEach(x=>x.classList.toggle('active', x.dataset.tab==='povo')); setSidebar(true); renderPanel(); } });
$('#btn-next').onclick = ()=>{ SFX.init(); nextTurn(); };
$$('#speed button').forEach(b=> b.onclick = ()=>setSpeed(+b.dataset.s));
$('#btn-gamemenu').onclick = openGameMenu;
$('#btn-players').onclick = ()=>{ SFX.page(); if (G && G.online) openPlayersPanel(); };
// ---------- tela cheia ----------
function isFullscreen(){ return !!(document.fullscreenElement || document.webkitFullscreenElement); }
function toggleFullscreen(){
  SFX.click();
  try {
    if (isFullscreen()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else { const el = document.documentElement; const r = (el.requestFullscreen || el.webkitRequestFullscreen).call(el); if (r && r.catch) r.catch(()=>toast('Seu navegador não permitiu a tela cheia.', 'bad')); }
  } catch(e){ toast('Tela cheia não suportada neste navegador.', 'bad'); }
}
function updateFsButtons(){
  const on = isFullscreen();
  $('#btn-fs').textContent = on ? '🗗' : '⛶'; $('#btn-fs').title = on ? 'Sair da tela cheia (F)' : 'Tela cheia (F)';
  const cf = $('#corner-fs'); cf.title = on ? 'Sair da tela cheia (F)' : 'Tela cheia (F)'; cf.classList.toggle('on', on);
  cf.innerHTML = on ? FS_ICON_OFF : FS_ICON_ON;
  const ob = document.querySelector('#op-fs'); if (ob) ob.classList.toggle('on', on);
  setTimeout(()=>MapView.resize(), 80);
}
$('#btn-fs').onclick = toggleFullscreen;
const FS_ICON_ON = $('#corner-fs').innerHTML, FS_ICON_OFF = FS_ICON_ON.replace(/<path d="[^"]*"/, '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"');
$('#corner-fs').onclick = ()=>{ SFX.init(); SFX.click(); toggleFullscreen(); };
document.addEventListener('fullscreenchange', updateFsButtons);
document.addEventListener('webkitfullscreenchange', updateFsButtons);
document.addEventListener('keydown', e=>{ if ((e.key === 'f' || e.key === 'F') && !['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)) toggleFullscreen(); });
$('#btn-sound').onclick = openOptions;
$('#tb-nation').onclick = ()=>{ UI.tab='geral'; $$('#tabs button').forEach(x=>x.classList.toggle('active', x.dataset.tab==='geral')); setSidebar(true); renderPanel(); };
$('#btn-wars').onclick = ()=>{ SFX.page(); if (G) openWorldWars(); };
$$('.map-tools .chip[data-mode]').forEach(c=> c.onclick = ()=>{ MapView.mode = c.dataset.mode; MapView.dirty = true; SFX.click(); updateTopbar(); });
$('#zoom-in').onclick = ()=>MapView.zoomAt(MapView.cw/2, MapView.ch/2, 1.4);
$('#zoom-out').onclick = ()=>MapView.zoomAt(MapView.cw/2, MapView.ch/2, 1/1.4);
$('#zoom-home').onclick = ()=>{ if (G) goHome(); };
$('#modal-wrap').addEventListener('mousedown', e=>{ if (e.target.id === 'modal-wrap' && !G?.pendingEvents?.length && !$('#modal .choice')) closeModal(); });
document.addEventListener('keydown', e=>{
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  if (e.key === 'Escape'){ closePopover(); if (G && UI.selCorps){ UI.selCorps = null; MapView.selCorps = null; } if (MapView.buildMode && G){ cancelBuild(); toast('Construção cancelada.'); } if (UI.modalOpen && !$('#modal .choice')) closeModal(); }
  if (!G || $('#hud').classList.contains('hidden')) return;
  if (e.code === 'Space'){ e.preventDefault(); nextTurn(); }
  if (e.key === '0') setSpeed(0); if (e.key === '1') setSpeed(1); if (e.key === '2') setSpeed(2);
  if (e.key === 'h' || e.key === 'H') goHome();
});
document.addEventListener('click', e=>{ if (e.target.closest('button')) SFX.init(); }, true);
document.addEventListener('pointerdown', ()=>{ SFX.init(); if (SFX.musicOn) SFX.startMusic(); }, {once:true});
