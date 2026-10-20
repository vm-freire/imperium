// ============================================================
//  IMPERIUM — Criação do país (assistente) e posicionamento
// ============================================================
'use strict';

const MOTTOS = ['Ordem e Progresso','Unidos Venceremos','Pela Glória e pela Pátria','Força na União','Liberdade ou Morte','Do Mar às Montanhas','Fé, Trabalho e Coragem','Sempre Avante','A Terra é de Quem a Trabalha','Paz pela Força'];
const AREA_REF = [[20000,'El Salvador'],[30000,'Bélgica'],[92000,'Portugal'],[132000,'Grécia'],[243000,'Reino Unido'],[357000,'Alemanha'],[550000,'França'],[783000,'Turquia'],[1.22e6,'África do Sul'],[1.96e6,'México'],[2.78e6,'Argentina'],[3.29e6,'Índia'],[7.7e6,'Austrália'],[8.5e6,'Brasil'],[9.8e6,'EUA'],[17.1e6,'Rússia']];

const C = { step:0, cfg:null, shapePts:[], drawing:false, titleEdited:false, mode:'new' };
const STEP_DEF = {
  nation:{n:'Nação', r:()=>stepNation(), b:x=>bindNation(x)},
  ident:{n:'Identidade', r:()=>stepIdent(), b:x=>bindIdent(x)},
  land:{n:'Terra e Povo', r:()=>stepLand(), b:x=>bindLand(x)},
  flag:{n:'Bandeira', r:()=>stepFlag(), b:x=>bindFlag(x)},
  const:{n:'Constituição', r:()=>stepConst(), b:x=>bindConst(x)},
  shape:{n:'Território', r:()=>stepShape(), b:x=>bindShape(x)},
  summary:{n:'Resumo', r:()=>stepSummary(), b:x=>bindSummary(x)}
};
function stepList(){
  const l = [];
  if (C.mode === 'existing') l.push('nation');
  l.push('ident', 'land', 'flag');
  if (hasConstitution(C.cfg.gov)) l.push('const');
  if (C.mode !== 'existing') l.push('shape');
  l.push('summary');
  return l;
}
const CURRENCIES = {'Estados Unidos':['Dólar','US$'],'Canadá':['Dólar canadense','C$'],'México':['Peso','MX$'],'Cuba':['Peso cubano','₱'],'Colômbia':['Peso','COL$'],'Venezuela':['Bolívar','Bs'],'Peru':['Sol','S/'],'Brasil':['Real','R$'],'Argentina':['Peso','AR$'],'Reino Unido':['Libra','£'],'França':['Franco','₣'],'Espanha':['Peseta','₧'],'Alemanha':['Marco','ℳ'],'Itália':['Lira','₤'],'Polônia':['Zloty','zł'],'Escandinávia':['Coroa','kr'],'Ucrânia':['Hryvnia','₴'],'Turquia':['Lira turca','₺'],'Rússia':['Rublo','₽'],'Egito':['Libra egípcia','E£'],'Índia':['Rupia','₹'],'Paquistão':['Rupia','₨'],'China':['Yuan','¥'],'Japão':['Iene','¥'],'Coreia':['Won','₩'],'Tailândia':['Baht','฿'],'Filipinas':['Peso','₱'],'Indonésia':['Rupia','Rp'],'Austrália':['Dólar australiano','A$'],'Nova Zelândia':['Dólar','NZ$'],'Arábia Saudita':['Rial','﷼'],'Irã':['Rial','﷼'],'África do Sul':['Rand','R'],'Nigéria':['Naira','₦']};
const LANGS = {anglo:'Inglês', hisp:'Espanhol', luso:'Português', fr:'Francês', de:'Alemão', it:'Italiano', slav:'Russo', nord:'Sueco', arab:'Árabe', pers:'Persa', turk:'Turco', ind:'Hindi', chn:'Mandarim', jpn:'Japonês', kor:'Coreano', afr:'Suaíli', sea:'Malaio', mong:'Mongol'};
const LANG_OVR = {'Polônia':'Polonês','Ucrânia':'Ucraniano','Cazaquistão':'Cazaque','Paquistão':'Urdu','Nigéria':'Inglês','Etiópia':'Amárico','Congo':'Francês','África do Sul':'Inglês','Mali':'Francês','Tailândia':'Tailandês','Indonésia':'Indonésio','Filipinas':'Filipino','Argélia':'Árabe','Brasil':'Português'};

const logMap = (v, a, b) => a * Math.pow(b/a, v/1000);
const logInv = (x, a, b) => Math.round(Math.log(x/a)/Math.log(b/a)*1000);

function defaultCfg(){
  const f = randomFlag();
  return {name:'', official:'', leader:genPersonName(), title:GOVS.republica.title, age:45, trait:'carismatico', gov:'republica', econ:'misto',
    religion:'catolico', capital:'', currency:'Coroa', currencySym:'₵', language:'Português', motto:pick(MOTTOS), era:1914,
    area:450000, pop:18, states:6, cities:45, climate:'temperado', terrain:'planicie', resources:['ferro','terras'], focus:'industria',
    flag:f, color:f.c1, colorAuto:true, constitution:defaultConstitution()};
}

function chooseMode(){
  const m = openModal(`<div class="m-icon">🏰</div><div class="m-title">Novo Jogo</div><div class="m-text">Como você quer começar a sua história?</div>
    <div class="mode-cards">
      <div class="mode-card" id="md-new"><div class="ic">✒️</div><b>Criar uma nova nação</b><span>Invente tudo: nome, bandeira, regime e desenhe as fronteiras no mapa.</span></div>
      <div class="mode-card" id="md-ex"><div class="ic">🌍</div><b>Governar um país existente</b><span>Assuma o Brasil, os EUA, o Japão... e mude o que quiser antes de começar.</span></div>
    </div><div class="m-actions"><button class="btn" id="md-x">Cancelar</button></div>`, {wide:true});
  m.querySelector('#md-new').onclick = ()=>{ SFX.page(); closeModal(); C.mode = 'new'; chooseGameMode(); };
  m.querySelector('#md-ex').onclick = ()=>{ SFX.page(); closeModal(); C.mode = 'existing'; chooseGameMode(); };
  m.querySelector('#md-x').onclick = ()=>{ SFX.click(); closeModal(); };
}
function chooseGameMode(){
  const m = openModal(`<div class="m-icon">🎯</div><div class="m-title">Modo de jogo</div><div class="m-text">Você quer seguir uma campanha com metas ou governar livremente?</div>
    <div class="mode-cards">
      <div class="mode-card" id="gm-obj"><div class="ic">🎯</div><b>Com objetivos</b><span>Uma campanha em 4 capítulos (Fundação, Ascensão, Potência e Legado), com metas a atingir e recompensas. Cumprir todas é uma vitória.</span></div>
      <div class="mode-card" id="gm-free"><div class="ic">🕊️</div><b>Modo livre</b><span>Sem metas definidas. Construa a história que quiser.</span></div>
    </div><div class="m-actions"><button class="btn" id="gm-x">Voltar</button></div>`, {wide:true});
  m.querySelector('#gm-obj').onclick = ()=>{ SFX.page(); closeModal(); C.gameMode = 'objetivos'; openCreate(false); };
  m.querySelector('#gm-free').onclick = ()=>{ SFX.page(); closeModal(); C.gameMode = 'livre'; openCreate(false); };
  m.querySelector('#gm-x').onclick = ()=>{ SFX.click(); closeModal(); chooseMode(); };
}
function openCreate(keep){
  if (!keep || !C.cfg){ C.cfg = defaultCfg(); C.shapePts = []; C.step = 0; C.titleEdited = false; if (C.mode === 'existing'){ C.cfg.existing = null; } }
  C.cfg.gameMode = C.gameMode || 'livre';
  hideAllScreens(); $('#scr-create').classList.remove('hidden');
  MapView.placement = null; MapView.menuMode = true; MapView.onClick = null;
  renderStep();
}
function renderStep(){
  const L = stepList(); C.step = Math.min(C.step, L.length-1);
  $('#steps').innerHTML = L.map((s,i)=>`<span class="step ${i===C.step?'active':i<C.step?'done':''}">${i+1}. ${STEP_DEF[s].n}</span>`).join('');
  $('#c-back').textContent = C.step === 0 ? '← Menu' : '← Voltar';
  $('#c-next').textContent = C.step === L.length-1 ? (C.mode==='existing' ? '👑 Assumir o governo →' : '🗺️ Escolher local no mapa →') : 'Avançar →';
  $('#c-hint').textContent = '';
  const body = $('#create-body');
  body.innerHTML = STEP_DEF[L[C.step]].r();
  body.scrollTop = 0;
  STEP_DEF[L[C.step]].b(body);
}
$('#c-back').onclick = ()=>{ SFX.page(); if (C.step === 0){ if (C.onlineRoom){ const code = C.onlineRoom; C.onlineRoom = null; showMenu(); openLobby(code); } else showMenu(); } else { C.step--; renderStep(); } };
$('#c-next').onclick = ()=>{
  const err = validateStep(); if (err){ SFX.error(); $('#c-hint').textContent = err; return; }
  SFX.page();
  if (C.step < stepList().length-1){ C.step++; renderStep(); } else if (C.mode === 'existing') startExisting(); else enterPlacement();
};
function validateStep(){
  const c = C.cfg, cur = stepList()[C.step];
  if (cur === 'nation' && !c.existing) return 'Escolha uma nação para governar.';
  if (cur === 'ident'){
    if (!c.name.trim()) return 'Dê um nome ao seu país.';
    if (!c.leader.trim()) return 'Quem governará? Informe o nome do líder.';
    if (!c.capital.trim()) return 'Toda nação precisa de uma capital.';
  }
  if (cur === 'shape' && C.shapePts.length < 8) return 'Desenhe o contorno do país (segure o botão do mouse e arraste).';
  return null;
}

// ---------------- passo: escolher nação existente ----------------
function stepNation(){
  const c = C.cfg, e = ERAS[c.era];
  return `<div class="section-title" ${C.onlineRoom?'style="display:none"':''}>Época</div>
    <div class="cards" ${C.onlineRoom?'style="display:none"':''}>${Object.entries(ERAS).map(([k,x])=>`<div class="card ${+k===+c.era?'sel':''}" data-era2="${k}"><b>${x.year} — ${x.name}</b><span>${x.desc}</span></div>`).join('')}</div>
    <div class="section-title">Escolha a nação que você vai governar <button class="btn sm" id="pick-rand" style="margin-left:10px">🎲 Sortear uma nação</button></div>
    <div class="muted">Depois você pode mudar nome, líder, regime, bandeira, religião e o que mais quiser.</div>
    <div class="nation-pick">${eraNations(c.era).filter(d=>!C.onlineRoom || !takenNations().includes(d.name)).map(d=>{ const H = d.hist || (HIST[d.key] && HIST[d.key][c.era]); return `<div class="npick ${c.existing===d.name?'sel':''}" data-pick="${esc(d.name)}"><canvas width="42" height="28" data-pf="${esc(d.name)}"></canvas>
      <div><b>${esc(d.name)}</b><small>${fmtPop(H ? H[0] : d.pop*e.popF)} hab. · ${GOVS[d.gov].name}</small><small>${RELIGIONS[d.rel]||''}</small></div></div>`; }).join('')}</div>`;
}
function bindNation(b){
  const L = eraNations(C.cfg.era);
  b.querySelectorAll('[data-pf]').forEach(cv=>{ const d = L.find(x=>x.name===cv.dataset.pf); drawFlag(cv.getContext('2d'), (d && eraNationFlag(d)) || randomFlag(makeRng(cv.dataset.pf.length*977)), 0, 0, 42, 28); });
  b.querySelectorAll('[data-era2]').forEach(x=>x.onclick=()=>{ SFX.click(); C.cfg.era = +x.dataset.era2; if (C.cfg.existing && !eraNations(C.cfg.era).some(d=>d.name===C.cfg.existing)) C.cfg.existing = null; if (C.cfg.existing) applyExisting(C.cfg.existing); renderStep(); });
  b.querySelectorAll('[data-pick]').forEach(x=>x.onclick=()=>{ SFX.click(); applyExisting(x.dataset.pick); C.cfg.randomPick = false; renderStep(); });
  b.querySelector('#pick-rand').onclick = ()=>{ SFX.bell(); const L = eraNations(C.cfg.era); applyExisting(pick(L).name); C.cfg.randomPick = true; renderStep(); };
}
function applyExisting(name){
  const c = C.cfg, e = ERAS[c.era], d = eraNations(c.era).find(x=>x.name===name), pr = PROFILES[d.key] || {cult:'luso', res:[]};
  const H = d.hist || (HIST[d.key] && HIST[d.key][c.era]);
  const lat = d.seeds[0][1];
  const f = eraNationFlag(d) || randomFlag();
  const cur = CURRENCIES[d.key] || ['Moeda nacional','$'];
  Object.assign(c, {existing:name, name, official:'', leader:genLeaderName(pr.cult), gov:d.gov, title:GOVS[d.gov].title, religion:d.rel,
    capital:d.capital||CAPITALS[d.key]||genPlaceName(), currency:cur[0], currencySym:cur[1], language:LANG_OVR[d.key]||LANGS[pr.cult]||'Português',
    pop:+(H ? H[0] : d.pop*e.popF).toFixed(2), states:clamp(Math.round(d.w*12),3,60), cities:clamp(Math.round((H ? H[0] : d.pop*e.popF)*1.6),5,600),
    climate: Math.abs(lat)<23 ? 'tropical' : Math.abs(lat)>52 ? 'frio' : (lat>30 && lat<45 && d.seeds[0][0]>-10 && d.seeds[0][0]<40) ? 'mediterraneo' : 'temperado',
    terrain:'planicie', resources:(pr.res||[]).slice(0,3), focus:d.pc>30?'comercio':d.ag>0.6?'militar':'industria',
    flag:f, color:flagMapColor(f), colorAuto:true, constitution:defaultConstitution(), statesAuto:true});
  C.titleEdited = false;
}
function startExisting(){
  const c = C.cfg;
  if (C.onlineRoom){ c.official = c.official.trim() || (GOVS[c.gov].prefix + ' ' + c.name.trim()); c.name = c.name.trim(); saveOnlineCfg(Object.assign({}, c, {homePoly:null, center:[0,0]})); return; }
  c.official = c.official.trim() || (GOVS[c.gov].prefix + ' ' + c.name.trim());
  c.name = c.name.trim();
  const cfg = Object.assign({}, c, {homePoly:null, center:[0,0], flag:Object.assign({}, c.flag)});
  $('#curtain').classList.remove('hidden'); setTimeout(()=>$('#curtain').classList.add('hidden'), 1700);
  setTimeout(()=>startNewGame(cfg), 500);
}

// ---------------- passo: constituição ----------------
function stepConst(){
  const c = C.cfg; c.constitution = c.constitution || defaultConstitution();
  const arts = Object.entries(CONSTITUTION).filter(([k,A])=>!A.elections || GOVS[c.gov].elections);
  return `<div class="tip">📜 Regimes democráticos e monarquias constitucionais são regidos por uma <b>Constituição</b>. Ela define mandatos, direitos e limites do poder — e afeta o jogo. Depois, só é possível mudá-la por <b>emendas</b> aprovadas pelo Congresso.</div>
    <div class="grid2">${arts.map(([k,A])=>`<div><div class="section-title">${A.n}</div><div class="cards">${Object.entries(A.opts).map(([v,o])=>`<div class="card ${c.constitution[k]===v?'sel':''}" data-art="${k}" data-v="${v}"><b>${o.n}</b><span>${o.fx?Object.entries(o.fx).map(([a,b])=>fxLabel(a,b)).join(', '):'Sem efeitos especiais'}</span></div>`).join('')}</div></div>`).join('')}</div>`;
}
function bindConst(b){ b.querySelectorAll('[data-art]').forEach(x=>x.onclick=()=>{ SFX.click(); C.cfg.constitution[x.dataset.art] = x.dataset.v; renderStep(); }); }

const cards = (obj, sel, key, extra) => `<div class="cards">${Object.entries(obj).map(([k,v])=>`<div class="card ${k===sel?'sel':''}" data-${key}="${k}"><b>${v.name}</b><span>${v.desc||''}</span>${extra?extra(k,v):''}</div>`).join('')}</div>`;

// ---------------- passo 1: identidade ----------------
function stepIdent(){
  const c = C.cfg;
  return `<div class="grid2">
   <div>
    <div class="field"><label>Nome do país</label><input type="text" id="f-name" maxlength="28" value="${esc(c.name)}" placeholder="Ex.: Valdória"></div>
    <div class="field"><label>Nome oficial</label><input type="text" id="f-official" maxlength="60" value="${esc(c.official)}" placeholder="${esc(GOVS[c.gov].prefix+' '+(c.name||'...'))}"><span class="help">Deixe vazio para gerar automaticamente pelo regime.</span></div>
    <div class="grid2" style="gap:10px">
      <div class="field"><label>Nome do líder</label><input type="text" id="f-leader" maxlength="22" value="${esc(c.leader)}"></div>
      <div class="field"><label>Título</label><input type="text" id="f-title" maxlength="24" value="${esc(c.title)}"></div>
    </div>
    <div class="field"><label>Idade do líder: <span class="valbox" id="v-age">${c.age} anos</span></label><input type="range" id="f-age" min="25" max="80" value="${c.age}"><span class="help">Líderes idosos podem morrer, gerando crises de sucessão.</span></div>
    <div class="grid2" style="gap:10px">
      <div class="field"><label>Capital</label><input type="text" id="f-capital" maxlength="28" value="${esc(c.capital)}" placeholder="Ex.: Porto Real"></div>
      <div class="field"><label>Idioma</label><input type="text" id="f-language" maxlength="24" value="${esc(c.language)}"></div>
      <div class="field"><label>Moeda</label><input type="text" id="f-currency" maxlength="20" value="${esc(c.currency)}"></div>
      <div class="field"><label>Símbolo</label><input type="text" id="f-sym" maxlength="4" value="${esc(c.currencySym)}"></div>
    </div>
    <div class="field"><label>Lema nacional</label><input type="text" id="f-motto" maxlength="50" value="${esc(c.motto)}"></div>
    <div class="field"><label>Religião oficial</label><select id="f-religion">${Object.entries(RELIGIONS).map(([k,v])=>`<option value="${k}" ${k===c.religion?'selected':''}>${v}</option>`).join('')}</select><span class="help">Nações da mesma fé tendem a ser amigáveis.</span></div>
   </div>
   <div>
    <div class="section-title">Regime político</div>${cards(GOVS, c.gov, 'gov')}
    <div class="section-title">Sistema econômico</div>${cards(ECONS, c.econ, 'econ')}
    <div class="section-title">Perfil do líder</div>${cards(TRAITS, c.trait, 'trait')}
   </div></div>`;
}
function bindIdent(b){
  const c = C.cfg;
  const map = {name:'f-name', official:'f-official', leader:'f-leader', capital:'f-capital', language:'f-language', currency:'f-currency', currencySym:'f-sym', motto:'f-motto'};
  for (const k in map) b.querySelector('#'+map[k]).oninput = e=>{ c[k] = e.target.value; if (k==='name') b.querySelector('#f-official').placeholder = GOVS[c.gov].prefix+' '+(c.name||'...'); };
  b.querySelector('#f-title').oninput = e=>{ c.title = e.target.value; C.titleEdited = true; };
  b.querySelector('#f-age').oninput = e=>{ c.age = +e.target.value; b.querySelector('#v-age').textContent = c.age+' anos'; };
  b.querySelector('#f-religion').onchange = e=>{ c.religion = e.target.value; };
  b.querySelectorAll('[data-gov]').forEach(x=>x.onclick=()=>{ SFX.click(); c.gov = x.dataset.gov; if (!C.titleEdited) c.title = GOVS[c.gov].title; renderStep(); });
  b.querySelectorAll('[data-econ]').forEach(x=>x.onclick=()=>{ SFX.click(); c.econ = x.dataset.econ; renderStep(); });
  b.querySelectorAll('[data-trait]').forEach(x=>x.onclick=()=>{ SFX.click(); c.trait = x.dataset.trait; renderStep(); });
}

// ---------------- passo 2: terra e povo ----------------
function areaRef(a){ let best = AREA_REF[0]; for (const r of AREA_REF) if (Math.abs(Math.log(r[0]/a)) < Math.abs(Math.log(best[0]/a))) best = r; return best[1]; }
function landNotes(){
  const c = C.cfg, n = [];
  const ideal = clamp(c.area/150000, 2, 80);
  const eff = clamp(1 - 0.11*Math.abs(Math.log(c.states/ideal)) + (c.gov==='federacao'?0.1:0), 0.55, 1.1);
  const urb = clamp(c.cities*0.15/c.pop, 0.06, 0.92);
  const dens = c.pop*1e6/c.area;
  n.push(`🏛️ Eficiência administrativa: <b>${Math.round(eff*100)}%</b> (ideal ≈ ${Math.round(ideal)} estados)`);
  n.push(`🏙️ Urbanização: <b>${Math.round(urb*100)}%</b> (média de ${fmtNum(c.pop*1000/c.cities,0)} mil hab. por cidade)`);
  n.push(`👥 Densidade: <b>${fmtNum(dens,1)}</b> hab/km²`);
  if (dens > 400) n.push('⚠️ Densidade altíssima: pressão social e pouca terra.');
  if (dens < 2) n.push('⚠️ País quase vazio: difícil de defender e de desenvolver.');
  if (urb < 0.15) n.push('⚠️ Poucas cidades: economia rural e pesquisa lenta.');
  if (eff < 0.8) n.push('⚠️ Número de estados inadequado: arrecadação e estabilidade sofrem.');
  return n.map(x=>`<div>${x}</div>`).join('');
}
function stepLand(){
  const c = C.cfg;
  return `<div class="grid2">
  <div>
    ${c.existing || C.onlineRoom ? '' : `<div class="section-title">Época de fundação</div>`}
    <div class="cards" ${c.existing || C.onlineRoom?'style="display:none"':''}>${Object.entries(ERAS).map(([k,e])=>`<div class="card ${+k===+c.era?'sel':''}" data-era="${k}"><b>${e.year} — ${e.name}</b><span>${e.desc}</span></div>`).join('')}</div>
    <div class="section-title">Dimensões</div>
    ${c.existing ? `<div class="tip">🌍 A área e a população vêm do território atual de <b>${esc(c.existing)}</b> (${fmtPop(c.pop)} habitantes).</div>` : `
    <div class="field"><label>Área territorial: <span class="valbox" id="v-area">${fmtArea(c.area)}</span></label><input type="range" id="f-area" min="0" max="1000" value="${logInv(c.area,20000,17e6)}"><span class="help" id="h-area">≈ tamanho de ${areaRef(c.area)}</span></div>
    <div class="field"><label>População: <span class="valbox" id="v-pop">${fmtPop(c.pop)}</span></label><input type="range" id="f-pop" min="0" max="1000" value="${logInv(c.pop,0.1,1500)}"></div>`}
    <div class="field"><label>Estados / províncias: <span class="valbox" id="v-states">${c.states}</span></label><input type="range" id="f-states" min="1" max="80" value="${c.states}"></div>
    <div class="field"><label>Cidades: <span class="valbox" id="v-cities">${c.cities}</span></label><input type="range" id="f-cities" min="1" max="600" value="${c.cities}"></div>
    <div class="box" id="land-notes">${landNotes()}</div>
  </div>
  <div>
    <div class="section-title">Clima</div>${cards(CLIMATES, c.climate, 'climate')}
    <div class="section-title">Terreno predominante</div>${cards(TERRAINS, c.terrain, 'terrain')}
    <div class="section-title">Recursos naturais <span class="muted">(escolha até 3)</span></div>
    <div class="cards">${Object.entries(RESOURCES).map(([k,r])=>`<div class="card ${c.resources.includes(k)?'sel':''}" data-res="${k}"><b>${r.icon} ${r.name}</b><span>${r.desc}</span></div>`).join('')}</div>
    <div class="section-title">Vocação nacional</div>${cards(FOCI, c.focus, 'focus')}
  </div></div>`;
}
function bindLand(b){
  const c = C.cfg;
  const upd = ()=>{ b.querySelector('#land-notes').innerHTML = landNotes(); };
  if (!C.cfg.existing) b.querySelector('#f-area').oninput = e=>{ c.area = Math.round(logMap(+e.target.value,20000,17e6)/1000)*1000; b.querySelector('#v-area').textContent = fmtArea(c.area); b.querySelector('#h-area').textContent = '≈ tamanho de '+areaRef(c.area); upd(); };
  if (!C.cfg.existing) b.querySelector('#f-pop').oninput = e=>{ c.pop = +logMap(+e.target.value,0.1,1500).toFixed(2); b.querySelector('#v-pop').textContent = fmtPop(c.pop); upd(); };
  b.querySelector('#f-states').oninput = e=>{ c.statesAuto = false; c.states = +e.target.value; b.querySelector('#v-states').textContent = c.states; upd(); };
  b.querySelector('#f-cities').oninput = e=>{ c.cities = +e.target.value; b.querySelector('#v-cities').textContent = c.cities; upd(); };
  b.querySelectorAll('[data-era]').forEach(x=>x.onclick=()=>{ SFX.click(); c.era = +x.dataset.era; renderStep(); });
  b.querySelectorAll('[data-climate]').forEach(x=>x.onclick=()=>{ SFX.click(); c.climate = x.dataset.climate; renderStep(); });
  b.querySelectorAll('[data-terrain]').forEach(x=>x.onclick=()=>{ SFX.click(); c.terrain = x.dataset.terrain; renderStep(); });
  b.querySelectorAll('[data-focus]').forEach(x=>x.onclick=()=>{ SFX.click(); c.focus = x.dataset.focus; renderStep(); });
  b.querySelectorAll('[data-res]').forEach(x=>x.onclick=()=>{
    const k = x.dataset.res; const i = c.resources.indexOf(k);
    if (i >= 0) c.resources.splice(i,1); else { if (c.resources.length >= 3){ SFX.error(); $('#c-hint').textContent = 'Máximo de 3 recursos.'; return; } c.resources.push(k); }
    SFX.click(); renderStep();
  });
}

// ---------------- passo 3: bandeira ----------------
function stepFlag(){
  const f = C.cfg.flag;
  const sw = (key) => `<div class="swatches">${FLAG_COLORS.map(col=>`<span class="sw ${f[key]===col?'sel':''}" style="background:${col}" data-sw="${key}" data-col="${col}"></span>`).join('')}<input type="color" value="${f[key]}" data-cp="${key}"></div>`;
  return `<div class="flag-wrap">
    <div class="flag-preview">
      <canvas id="flag-big" width="360" height="240"></canvas>
      <div class="flex"><button class="btn" id="fl-rand">🎲 Bandeira aleatória</button></div>
      <div class="field" style="width:100%"><label>Usar bandeira de um país real</label><select id="fl-preset"><option value="">— escolha —</option>${Object.keys(FLAG_PRESETS).sort((a,b)=>a.localeCompare(b)).map(k=>`<option ${C.cfg.flagPreset===k?'selected':''}>${esc(k)}</option>`).join('')}</select>
      ${f.real ? '<span class="help">Bandeira oficial selecionada. Editar layout, cores ou emblema cria uma versão personalizada.</span>' : ''}</div>
      <div class="section-title" style="width:100%">Cor do país no mapa</div>
      <div class="swatches" style="max-width:360px">${['auto'].concat(FLAG_COLORS.filter(c=>!['#ffffff','#f5f0e1','#111111'].includes(c))).map(col=>col==='auto'?`<span class="chip ${C.cfg.colorAuto?'active':''}" style="color:var(--ink);border-color:var(--ink3)" data-mc="auto">Igual à bandeira</span>`:`<span class="sw ${!C.cfg.colorAuto&&C.cfg.color===col?'sel':''}" style="background:${col}" data-mc="${col}"></span>`).join('')}</div>
    </div>
    <div class="flag-opts">
      <div class="section-title">Layout</div>
      <div class="mini-grid">${FLAG_LAYOUTS.map(l=>`<div class="mini ${f.layout===l.id?'sel':''}" data-layout="${l.id}" title="${l.name}"><canvas width="66" height="44" data-lp="${l.id}"></canvas></div>`).join('')}</div>
      <div class="section-title">Cores</div>
      <div class="lbl">Cor 1</div>${sw('c1')}<div class="lbl" style="margin-top:6px">Cor 2</div>${sw('c2')}<div class="lbl" style="margin-top:6px">Cor 3</div>${sw('c3')}
      <div class="section-title">Emblema</div>
      <div class="mini-grid">${FLAG_EMBLEMS.map(e=>`<div class="mini ${f.emblem===e.id?'sel':''}" data-emblem="${e.id}" title="${e.name}"><canvas width="66" height="44" data-ep="${e.id}"></canvas></div>`).join('')}</div>
      <div class="grid2" style="margin-top:8px;gap:10px">
        <div><div class="lbl">Cor do emblema</div>${sw('ec')}</div>
        <div>
          <div class="lbl">Posição</div><div class="seg">${[['centro','Centro'],['cantao','Cantão'],['mastro','Mastro']].map(([k,l])=>`<button class="${f.epos===k?'active':''}" data-epos="${k}">${l}</button>`).join('')}</div>
          <div class="lbl">Tamanho</div><input type="range" min="0.3" max="1.2" step="0.05" value="${f.esize}" id="fl-size">
          ${f.emblem==='estrelas'?`<div class="lbl">Número de estrelas: <span id="v-stars">${f.stars}</span></div><input type="range" min="3" max="20" value="${f.stars}" id="fl-stars">`:''}
        </div>
      </div>
    </div></div>`;
}
function bindFlag(b){
  const c = C.cfg, f = c.flag;
  const redraw = ()=>{
    drawFlag(b.querySelector('#flag-big').getContext('2d'), f, 0, 0, 360, 240);
    b.querySelectorAll('[data-lp]').forEach(cv=>drawFlag(cv.getContext('2d'), Object.assign({}, f, {real:null, layout:cv.dataset.lp, emblem:'nenhum'}), 0, 0, 66, 44));
    b.querySelectorAll('[data-ep]').forEach(cv=>drawFlag(cv.getContext('2d'), Object.assign({}, f, {real:null, layout:'solido', emblem:cv.dataset.ep, epos:'centro', esize:0.8, ec: f.ec === f.c1 ? f.c2 : f.ec}), 0, 0, 66, 44));
    if (c.colorAuto) c.color = flagMapColor(f);
  };
  redraw();
  b.querySelector('#fl-rand').onclick = ()=>{ SFX.click(); c.flag = randomFlag(); c.flagPreset = ''; renderStep(); };
  b.querySelector('#fl-preset').onchange = e=>{ const k = e.target.value; if (!k) return; SFX.click(); c.flag = presetFlag(k); c.flagPreset = k; if (c.colorAuto) c.color = flagMapColor(c.flag); renderStep(); };
  const unreal = ()=>{ if (f.real){ delete f.real; c.flagPreset = ''; } };
  b.querySelectorAll('[data-layout]').forEach(x=>x.onclick=()=>{ SFX.click(); unreal(); f.layout = x.dataset.layout; renderStep(); });
  b.querySelectorAll('[data-emblem]').forEach(x=>x.onclick=()=>{ SFX.click(); unreal(); f.emblem = x.dataset.emblem; renderStep(); });
  b.querySelectorAll('[data-sw]').forEach(x=>x.onclick=()=>{ SFX.click(); unreal(); f[x.dataset.sw] = x.dataset.col; renderStep(); });
  b.querySelectorAll('[data-cp]').forEach(x=>x.onchange=()=>{ unreal(); f[x.dataset.cp] = x.value; renderStep(); });
  b.querySelectorAll('[data-epos]').forEach(x=>x.onclick=()=>{ SFX.click(); unreal(); f.epos = x.dataset.epos; renderStep(); });
  b.querySelectorAll('[data-mc]').forEach(x=>x.onclick=()=>{ SFX.click(); if (x.dataset.mc==='auto'){ c.colorAuto = true; c.color = f.c1; } else { c.colorAuto = false; c.color = x.dataset.mc; } renderStep(); });
  b.querySelector('#fl-size').oninput = e=>{ unreal(); f.esize = +e.target.value; redraw(); };
  const st = b.querySelector('#fl-stars'); if (st) st.oninput = e=>{ f.stars = +e.target.value; b.querySelector('#v-stars').textContent = f.stars; redraw(); };
}

// ---------------- passo 4: território ----------------
function stepShape(){
  return `<div class="draw-wrap">
    <canvas id="draw-canvas" width="480" height="480"></canvas>
    <div class="draw-side">
      <div class="section-title">Desenhe as fronteiras</div>
      <div class="tip">🖱️ <b>Segure o botão do mouse e desenhe</b> o contorno do seu país. Ao soltar, a forma fecha automaticamente.</div>
      <div class="tip">📏 O tamanho do desenho não importa: ele será escalado para <b>${fmtArea(C.cfg.area)}</b> no mapa.</div>
      <div class="tip">🌊 Se você posicionar o país no oceano, ele vira uma ilha nova. Sobre outra nação, você toma terras dela (e ganha um inimigo).</div>
      <div class="btn-grid">
        <button class="btn" id="sh-clear">🧽 Limpar</button><button class="btn" id="sh-rand">🎲 Forma aleatória</button>
        <button class="btn" id="sh-smooth">〰️ Suavizar bordas</button><button class="btn" id="sh-rough">⛰️ Bordas irregulares</button>
      </div>
      <div class="box" id="sh-info"></div>
    </div></div>`;
}
function bindShape(b){
  const cv = b.querySelector('#draw-canvas'), ctx = cv.getContext('2d');
  const draw = (live)=>{
    ctx.fillStyle = '#efe0b8'; ctx.fillRect(0,0,480,480);
    ctx.strokeStyle = 'rgba(110,75,40,0.15)'; ctx.lineWidth = 1;
    for (let k=0;k<=480;k+=40){ ctx.beginPath(); ctx.moveTo(k,0); ctx.lineTo(k,480); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0,k); ctx.lineTo(480,k); ctx.stroke(); }
    MapView.drawCompass(ctx, 430, 430, 30);
    const pts = C.shapePts; if (!pts.length) { ctx.fillStyle='rgba(90,61,30,.5)'; ctx.font='italic 20px "IM Fell English", Georgia'; ctx.textAlign='center'; ctx.fillText('Desenhe aqui o seu país', 240, 240); return; }
    ctx.beginPath(); pts.forEach(([x,y],i)=> i?ctx.lineTo(x,y):ctx.moveTo(x,y)); if (!live) ctx.closePath();
    if (!live){ ctx.fillStyle = hexA(C.cfg.color, 0.55); ctx.fill();
      ctx.save(); ctx.clip(); ctx.strokeStyle = hexA(C.cfg.color, 0.6); for (let k=-480;k<480;k+=7){ ctx.beginPath(); ctx.moveTo(k,0); ctx.lineTo(k+480,480); ctx.stroke(); } ctx.restore(); }
    ctx.strokeStyle = '#3d2812'; ctx.lineWidth = 2.5; ctx.lineJoin='round'; ctx.stroke();
    if (!live){
      const [cx, cy] = centroid(pts);
      ctx.fillStyle = '#8b1a1a'; starPath(ctx, cx, cy, 9, 5, 0.45); ctx.fill();
      ctx.font = 'bold 16px Cinzel, Georgia'; ctx.textAlign = 'center'; ctx.fillStyle = '#3d2812'; ctx.fillText((C.cfg.name||'').toUpperCase(), cx, cy + 26);
    }
    const info = b.querySelector('#sh-info');
    if (info) info.innerHTML = `Pontos do contorno: <b>${pts.length}</b><br>Área no mapa: <b>${fmtArea(C.cfg.area)}</b>`;
  };
  const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX-r.left)*480/r.width, (e.clientY-r.top)*480/r.height]; };
  cv.onpointerdown = e=>{ cv.setPointerCapture(e.pointerId); C.drawing = true; C.shapePts = [pos(e)]; SFX.click(); draw(true); };
  cv.onpointermove = e=>{ if (!C.drawing) return; const p = pos(e), l = C.shapePts[C.shapePts.length-1]; if (Math.hypot(p[0]-l[0], p[1]-l[1]) > 4){ C.shapePts.push(p); draw(true); } };
  cv.onpointerup = ()=>{ if (!C.drawing) return; C.drawing = false;
    if (C.shapePts.length < 8 || Math.abs(polyArea(C.shapePts)) < 1500){ C.shapePts = []; $('#c-hint').textContent = 'Forma muito pequena — desenhe um contorno maior.'; SFX.error(); }
    else { C.shapePts = simplify(C.shapePts, 140); SFX.build(); $('#c-hint').textContent = ''; }
    draw(); };
  b.querySelector('#sh-clear').onclick = ()=>{ C.shapePts = []; SFX.click(); draw(); };
  b.querySelector('#sh-rand').onclick = ()=>{ C.shapePts = randomShape(); SFX.click(); draw(); };
  b.querySelector('#sh-smooth').onclick = ()=>{ if (C.shapePts.length){ C.shapePts = simplify(chaikin(C.shapePts), 160); SFX.click(); draw(); } };
  b.querySelector('#sh-rough').onclick = ()=>{ if (C.shapePts.length){ C.shapePts = roughen(C.shapePts); SFX.click(); draw(); } };
  draw();
}
function polyArea(pts){ let a = 0; for (let i=0,j=pts.length-1;i<pts.length;j=i++) a += pts[j][0]*pts[i][1] - pts[i][0]*pts[j][1]; return a/2; }
function centroid(pts){ let x=0,y=0,a=0; for (let i=0,j=pts.length-1;i<pts.length;j=i++){ const f = pts[j][0]*pts[i][1]-pts[i][0]*pts[j][1]; x += (pts[j][0]+pts[i][0])*f; y += (pts[j][1]+pts[i][1])*f; a += f; } if (Math.abs(a)<1e-6){ const s = pts.reduce((s,p)=>[s[0]+p[0],s[1]+p[1]],[0,0]); return [s[0]/pts.length, s[1]/pts.length]; } return [x/(3*a), y/(3*a)]; }
function simplify(pts, max){ if (pts.length <= max) return pts; const k = pts.length/max; const out = []; for (let i=0;i<max;i++) out.push(pts[Math.floor(i*k)]); return out; }
function chaikin(pts){ const out = []; for (let i=0;i<pts.length;i++){ const a = pts[i], b = pts[(i+1)%pts.length]; out.push([a[0]*0.75+b[0]*0.25, a[1]*0.75+b[1]*0.25], [a[0]*0.25+b[0]*0.75, a[1]*0.25+b[1]*0.75]); } return out; }
function roughen(pts){ const [cx, cy] = centroid(pts); return pts.map(([x,y])=>{ const d = rand(-0.06, 0.06); return [x + (x-cx)*d + rand(-3,3), y + (y-cy)*d + rand(-3,3)]; }); }
function randomShape(){
  const n = 90, h = [1, rand(0.08,0.2), rand(0.05,0.15), rand(0.03,0.1), rand(0.02,0.06)], ph = h.map(()=>rand(0,Math.PI*2));
  const sx = rand(0.7,1.2), sy = rand(0.7,1.2);
  const pts = [];
  for (let i=0;i<n;i++){
    const a = i/n*Math.PI*2; let r = 1;
    for (let k=1;k<h.length;k++) r += h[k]*Math.sin(a*(k+1) + ph[k]);
    r += rand(-0.03,0.03);
    pts.push([240 + Math.cos(a)*r*150*sx, 240 + Math.sin(a)*r*150*sy]);
  }
  return pts;
}
function normalizeShape(pts){
  const A = Math.abs(polyArea(pts)); const [cx, cy] = centroid(pts); const s = Math.sqrt(A);
  return {pts: pts.map(([x,y])=>[(x-cx)/s, (y-cy)/s]), area:1};
}

// ---------------- passo 5: resumo ----------------
function stepSummary(){
  const c = C.cfg, e = ERAS[c.era];
  const m = blankMods();
  [GOVS[c.gov].mods, ECONS[c.econ].mods, TRAITS[c.trait].mods, CLIMATES[c.climate].mods, TERRAINS[c.terrain].mods, FOCI[c.focus].mods].forEach(f=>addMods(m,f));
  c.resources.forEach(r=>addMods(m, RESOURCES[r].mods));
  const urb = clamp(c.cities*0.15/c.pop, 0.06, 0.92);
  const pc = 10000*e.pcF*(1+m.gdpMult)*(0.65+urb*0.8)*(0.85+0.62*0.25);
  const gdp = c.pop*pc;
  const inf = Math.max(4, Math.round(Math.pow(c.pop,0.55)*6*(c.focus==='militar'?1.5:1)));
  const official = c.official.trim() || (GOVS[c.gov].prefix + ' ' + c.name);
  const fx = Object.entries(m).filter(([k,v])=>Math.abs(v)>0.001).map(([k,v])=>fxLabel(k, +v.toFixed(2)));
  return `<div class="summary">
    <div style="text-align:center"><canvas id="sum-flag" width="300" height="200" style="border:2px solid var(--ink2);box-shadow:4px 6px 14px rgba(0,0,0,.35)"></canvas>
      ${c.existing ? `<div class="tip" style="text-align:left">🌍 Você governará <b>${esc(c.existing)}</b> em seu território atual.</div>` : '<canvas id="sum-shape" width="200" height="200" style="margin-top:12px"></canvas>'}</div>
    <div>
      <div class="m-title" style="text-align:left">${esc(official)}</div>
      <div class="muted">“${esc(c.motto)}”</div>
      <div class="kv" style="margin-top:10px">
        <div>Líder</div><div>${esc(c.title)} ${esc(c.leader)}, ${c.age} anos (${TRAITS[c.trait].name})</div>
        <div>Regime</div><div>${GOVS[c.gov].name}</div><div>Economia</div><div>${ECONS[c.econ].name}</div>
        <div>Religião</div><div>${RELIGIONS[c.religion]}</div><div>Capital</div><div>${esc(c.capital)}</div>
        <div>Moeda · Idioma</div><div>${esc(c.currency)} (${esc(c.currencySym)}) · ${esc(c.language)}</div>
        <div>Época</div><div>${e.year} — ${e.name}</div>
        <div>Área · População</div><div>${c.existing ? 'Território atual' : fmtArea(c.area)} · ${fmtPop(c.pop)}</div>
        ${hasConstitution(c.gov) ? `<div>Constituição</div><div>${Object.entries(c.constitution||{}).filter(([k])=>!CONSTITUTION[k].elections||GOVS[c.gov].elections).map(([k,v])=>CONSTITUTION[k].opts[v].n).slice(0,4).join(' · ')}…</div>` : ''}
        <div>Estados · Cidades</div><div>${c.states} estados · ${c.cities} cidades</div>
        <div>Clima · Terreno</div><div>${CLIMATES[c.climate].name} · ${TERRAINS[c.terrain].name}</div>
        <div>Recursos</div><div>${c.resources.map(r=>RESOURCES[r].icon+' '+RESOURCES[r].name).join(', ')||'Nenhum'}</div>
        <div>Vocação</div><div>${FOCI[c.focus].name}</div>
      </div>
      <div class="section-title">Previsão inicial</div>
      <div class="stat-grid">
        <div class="stat"><div class="l">PIB estimado</div><div class="v">${fmtMoney(gdp, c.currencySym)}</div></div>
        <div class="stat"><div class="l">PIB per capita</div><div class="v">${c.currencySym} ${fmtNum(pc,0)}</div></div>
        <div class="stat"><div class="l">Divisões de infantaria</div><div class="v">${inf}</div></div>
        <div class="stat"><div class="l">Tecnologias iniciais</div><div class="v">${e.techs.length}</div></div>
      </div>
      <div class="box">${landNotes()}</div>
      <div class="section-title">Modificadores nacionais</div>
      <div class="muted" style="font-style:normal">${fx.join(' · ') || '—'}</div>
    </div></div>`;
}
function bindSummary(b){
  drawFlag(b.querySelector('#sum-flag').getContext('2d'), C.cfg.flag, 0, 0, 300, 200);
  const cv = b.querySelector('#sum-shape'); if (!cv) return; const ctx = cv.getContext('2d');
  const sh = normalizeShape(C.shapePts);
  const mx = Math.max(...sh.pts.map(p=>Math.max(Math.abs(p[0]),Math.abs(p[1])))); const s = 90/mx;
  ctx.beginPath(); sh.pts.forEach(([x,y],i)=> i?ctx.lineTo(100+x*s,100+y*s):ctx.moveTo(100+x*s,100+y*s)); ctx.closePath();
  ctx.fillStyle = hexA(C.cfg.color,0.6); ctx.fill(); ctx.strokeStyle='#3d2812'; ctx.lineWidth=2; ctx.stroke();
}

// ---------------- posicionamento no mapa ----------------
function enterPlacement(){
  const c = C.cfg;
  c.official = c.official.trim() || (GOVS[c.gov].prefix + ' ' + c.name.trim());
  c.name = c.name.trim();
  c.shape = normalizeShape(C.shapePts);
  hideAllScreens();
  $('#place-banner').classList.remove('hidden'); $('#pb-name').textContent = c.name;
  drawFlag($('#pb-flag').getContext('2d'), c.flag, 0, 0, 60, 40);
  MapView.menuMode = false; G = null;
  MapView.buildPaths([]); MapView.buildBase([]);
  MapView.placement = {shape:c.shape, area:c.area, rot:0, color:c.color};
  MapView.onHover = (cell)=>{ if (!MapView.mouseLonLat) return; const v = climateVerdict(C.cfg.climate, MapView.mouseLonLat[1]); const el = $('#pb-climate'); if (el){ el.textContent = v.text; el.style.color = v.s < 1 ? '#2d5a19' : v.s < 2 ? '#8a5a00' : '#b3261e'; } };
  MapView.onClick = (cell, x, y, lon, lat)=>placementClick(lon, lat);
  MapView.resize(); MapView.fit();
  toast('Escolha um lugar no mapa para fundar sua nação.');
}
$('#pb-back').onclick = ()=>{ SFX.page(); MapView.placement = null; openCreate(true); };
document.addEventListener('keydown', e=>{ if (MapView.placement && (e.key==='r'||e.key==='R')) MapView.placement.rot += Math.PI/12; });

function placementClick(lon, lat){
  const pl = MapView.placement; if (!pl || !pl.current) return;
  const poly = pl.current;
  if (poly.some(([lo,la])=>la>82 || la<-64 || lo<-179 || lo>179)){ SFX.error(); toast('Muito perto da borda do mapa. Escolha outro lugar.', 'bad'); return; }
  // quanto do território cai sobre terra já existente
  let land = 0, tot = 0;
  for (let i=0;i<NCELLS;i++){ const [lo,la] = cellCenter(i); if (Math.abs(lo-lon)>40 || Math.abs(la-lat)>40) continue; if (pointInPoly(lo,la,poly)){ tot++; if (Grid.land[i]) land++; } }
  const pct = tot ? Math.round(land/tot*100) : 0;
  SFX.click();
  const msg = pct < 10 ? `Sua nação surgirá como uma <b>nova ilha</b> no oceano. Isolada e segura, mas dependente de uma marinha para expandir.`
    : pct > 85 ? `Sua nação ocupará <b>terras já habitadas</b> (${pct}%). As nações afetadas perderão território e <b>reivindicarão as terras</b> — prepare-se para conflitos!`
    : `Sua nação terá litoral e ocupará parcialmente terras existentes (${pct}% sobre continente). As nações afetadas ficarão hostis.`;
  confirmModal('🏰', `Fundar ${esc(C.cfg.name)} aqui?`, `${msg}<br><br><b>${climateVerdict(C.cfg.climate, lat).text}</b><br><br>Coordenadas: ${Math.abs(lat).toFixed(1)}°${lat>=0?'N':'S'}, ${Math.abs(lon).toFixed(1)}°${lon>=0?'L':'O'}.`, 'Fundar nação!', ()=>{
    const c = C.cfg;
    const cfg = Object.assign({}, c, {isIsland: pct < 10, homePoly: poly.map(p=>[+p[0].toFixed(3), +p[1].toFixed(3)]), center:[lon, lat], flag:Object.assign({}, c.flag)});
    MapView.placement = null;
    if (C.onlineRoom){ saveOnlineCfg(cfg); return; }
    $('#curtain').classList.remove('hidden'); setTimeout(()=>$('#curtain').classList.add('hidden'), 1700);
    setTimeout(()=>startNewGame(cfg), 500);
  });
}

// ---------------- menu e inicialização ----------------
$('#m-new').onclick = ()=>{ SFX.init(); SFX.page();
  if (freeSlot() < 0){ confirmModal('📜', 'Todas as vagas estão ocupadas', `Você já tem ${MAX_SLOTS} partidas salvas. Apague uma delas para começar um novo jogo.`, 'Ver partidas salvas', ()=>setTimeout(openSlots, 50)); return; }
  chooseMode(); };
$('#m-continue').onclick = ()=>{ SFX.init(); SFX.page(); openSlots(); };
$('#m-online').onclick = ()=>openOnline();
$('#m-trophies').onclick = ()=>{ SFX.init(); SFX.page(); UI.pageBack = null; openTrophies(); };
$('#m-history').onclick = ()=>{ SFX.init(); SFX.page(); UI.pageBack = null; openHistory(); };
$('#m-help').onclick = ()=>{ SFX.init(); SFX.page(); openHelp(); };
$('#m-options').onclick = ()=>{ SFX.init(); openOptions(); };


(function boot(){
  loadSettings();
  Grid.buildLand([]);
  MapView.init($('#map'));
  showMenu();
  startAccount();
})();
