// ============================================================
//  IMPERIUM — Abas "País" e "Líder" da criação
//  • País: época (nação nova), nome, capital, moeda, religião, ONU,
//    regime político, partido real (de acordo com a época) e economia.
//    Nada do líder aqui.
//  • Líder: nome, título, idade, perfil e avatar — e as pessoas reais
//    do partido escolhido (presidentes e políticos conhecidos daquela
//    época), com um visual parecido
// ============================================================
'use strict';

STEP_DEF.pais = {n:'País', r:()=>stepPais(), b:x=>bindPais(x)};
STEP_DEF.lider = {n:'Líder', r:()=>stepLider(), b:x=>bindLider(x)};

stepList = function(){
  const l = [];
  if (C.mode === 'existing') l.push('nation');
  l.push('pais', 'lider', 'land', 'flag');
  if (hasConstitution(C.cfg.gov)) l.push('const');
  if (C.mode !== 'existing') l.push('shape');
  l.push('summary');
  return l;
};
validateStep = function(){
  const c = C.cfg, cur = stepList()[C.step];
  if (cur === 'nation' && !c.existing) return 'Escolha uma nação para governar.';
  if (cur === 'pais'){
    if (!c.name.trim()) return 'Dê um nome ao seu país.';
    if (!c.capital.trim()) return 'Toda nação precisa de uma capital.';
  }
  if (cur === 'lider' && !c.leader.trim()) return 'Quem governará? Informe o nome do líder.';
  if (cur === 'shape' && C.shapePts.length < 8) return 'Desenhe o contorno do país (segure o botão do mouse e arraste).';
  return null;
};

// de qual país vêm os partidos reais: o próprio (país existente) ou o escolhido (nação nova; padrão Brasil)
function partyKeyCfg(){ const c = C.cfg; return c.existing ? createKey() : (c.partyCountry || 'Brasil'); }
const PARTY_COUNTRIES = () => Object.keys(PARTIES).sort((a, b) => a === 'Brasil' ? -1 : b === 'Brasil' ? 1 : a.localeCompare(b));
const yearOf = c => ERAS[c.era].year;

// ---------------- aba País ----------------
function stepPais(){
  const c = C.cfg; if (typeof fixCfgForEra === 'function') fixCfgForEra(c);
  const year = yearOf(c), key = partyKeyCfg(), kind = powerKind(c.gov);
  const showEra = !c.existing && !C.onlineRoom;
  return `<div class="grid2">
   <div>
    ${showEra ? `<div class="section-title">Época de fundação</div><div class="cards">${Object.entries(ERAS).map(([k,e])=>`<div class="card ${+k===+c.era?'sel':''}" data-pera="${k}"><b>${e.year} — ${e.name}</b><span>${e.desc}</span></div>`).join('')}</div>` : ''}
    <div class="section-title">O país</div>
    <div class="field"><label>Nome do país</label><input type="text" id="f-name" maxlength="28" value="${esc(c.name)}" placeholder="Ex.: Valdória"></div>
    <div class="field"><label>Nome oficial</label><input type="text" id="f-official" maxlength="60" value="${esc(c.official)}" placeholder="${esc(autoOfficial(c.gov, c.name||'...'))}"><span class="help">Deixe vazio para gerar automaticamente pelo regime.</span></div>
    <div class="grid2" style="gap:10px">
      <div class="field"><label>Capital</label><input type="text" id="f-capital" maxlength="28" value="${esc(c.capital)}" placeholder="Ex.: Porto Real"></div>
      <div class="field"><label>Idioma</label><input type="text" id="f-language" maxlength="24" value="${esc(c.language)}"></div>
      <div class="field"><label>Moeda</label><input type="text" id="f-currency" maxlength="20" value="${esc(c.currency)}"></div>
      <div class="field"><label>Símbolo</label><input type="text" id="f-sym" maxlength="4" value="${esc(c.currencySym)}"></div>
    </div>
    <div class="field"><label>Lema nacional</label><input type="text" id="f-motto" maxlength="50" value="${esc(c.motto)}"></div>
    <div class="field"><label>Religião oficial</label><select id="f-religion">${Object.entries(RELIGIONS).filter(([k])=>typeof relOk !== 'function' || relOk(k, year)).map(([k,v])=>`<option value="${k}" ${k===c.religion?'selected':''}>${v}</option>`).join('')}</select><span class="help">Nações da mesma fé tendem a ser amigáveis.</span></div>
    <div class="section-title">🏛️ Nações Unidas</div>
    <div class="cards">
      <div class="card ${c.unMember !== false ? 'sel' : ''}" data-un="1"><b>Fazer parte da ONU</b><span>${year >= 1945 ? 'Votamos nas assembleias e podemos vetar se formos potência.' : 'Quando a ONU for criada (1945), entramos nela.'}</span></div>
      <div class="card ${c.unMember === false ? 'sel' : ''}" data-un="0"><b>Ficar de fora</b><span>Sem votos nem compromissos. As resoluções acontecem sem a nossa voz.</span></div>
    </div>
    <div class="help">Dá para sair ou voltar durante o jogo, na aba Diplomacia.</div>
   </div>
   <div>
    <div class="section-title">Regime político</div>${cards(typeof filterByYear === 'function' ? filterByYear(GOVS, govOk, year) : GOVS, c.gov, 'pgov')}
    ${kind === 'partido' && !c.existing ? `<div class="field" style="margin-top:8px"><label>Partidos reais de</label><select id="f-pcountry">${PARTY_COUNTRIES().map(k=>`<option ${k===key?'selected':''}>${esc(k)}</option>`).join('')}</select><span class="help">Use os partidos de verdade de um país (da época escolhida) ou crie o seu.</span></div>` : ''}
    <div id="pg-root">${partyPickerHTML(c, key, year, c.gov, {noPols:true})}</div>
    <div class="section-title">Sistema econômico</div>${cards(typeof filterByYear === 'function' ? filterByYear(ECONS, econOk, year) : ECONS, c.econ, 'pecon')}
   </div></div>`;
}
function bindPais(b){
  const c = C.cfg, keep = () => { const y = b.scrollTop; renderStep(); $('#create-body').scrollTop = y; };
  const map = {name:'f-name', official:'f-official', capital:'f-capital', language:'f-language', currency:'f-currency', currencySym:'f-sym', motto:'f-motto'};
  for (const k in map) b.querySelector('#'+map[k]).oninput = e=>{ c[k] = e.target.value; if (k==='name') b.querySelector('#f-official').placeholder = autoOfficial(c.gov, c.name||'...'); };
  b.querySelector('#f-religion').onchange = e=>{ c.religion = e.target.value; };
  b.querySelectorAll('[data-pera]').forEach(x=>x.onclick=()=>{ SFX.click(); c.era = +x.dataset.pera; keep(); });
  b.querySelectorAll('[data-un]').forEach(x=>x.onclick=()=>{ SFX.click(); c.unMember = x.dataset.un === '1'; keep(); });
  b.querySelectorAll('[data-pgov]').forEach(x=>x.onclick=()=>{ SFX.click(); c.gov = x.dataset.pgov; if (!C.titleEdited) c.title = GOVS[c.gov].title; if (c.party && c.party.kind !== powerKind(c.gov)) c.party = null; keep(); });
  b.querySelectorAll('[data-pecon]').forEach(x=>x.onclick=()=>{ SFX.click(); c.econ = x.dataset.pecon; keep(); });
  const pc = b.querySelector('#f-pcountry'); if (pc) pc.onchange = ()=>{ SFX.click(); c.partyCountry = pc.value; c.party = null; keep(); };
  const pg = b.querySelector('#pg-root'); if (pg) bindPartyPicker(pg, c, partyKeyCfg(), yearOf(c), c.gov, keep);
}

// ---------------- aba Líder ----------------
function stepLider(){
  const c = C.cfg, year = yearOf(c), key = partyKeyCfg();
  const pols = politiciansFor(key, c.party, year);
  const partyTxt = c.party ? partyLabel(c.party) : '<span class="muted">nenhum escolhido</span>';
  return `<div class="grid2">
   <div>
    <div class="section-title">Quem governa</div>
    <div class="av-mini"><div class="av-mini-img">${avatarSVG(ensureCfgAvatar(), c.party && (c.avatar.extras||[]).includes('broche') ? emblemOf(c.party) : null, 110)}</div>
      <div><b>Avatar do líder</b><div class="help">Rosto, cabelo, barba, roupa, altura, acessórios e o escudo do partido.</div><button class="btn sm" id="f-avatar">🎨 Personalizar avatar</button> <button class="btn sm" id="f-avrand">🎲 Aleatório</button></div></div>
    <div class="grid2" style="gap:10px">
      <div class="field"><label>Nome do líder</label><input type="text" id="f-leader" maxlength="26" value="${esc(c.leader)}"></div>
      <div class="field"><label>Título</label><input type="text" id="f-title" maxlength="24" value="${esc(c.title)}"></div>
    </div>
    <div class="field"><label>Idade do líder: <span class="valbox" id="v-age">${c.age} anos</span></label><input type="range" id="f-age" min="25" max="80" value="${c.age}"><span class="help">Líderes idosos podem morrer, gerando crises de sucessão.</span></div>
    <div class="section-title">Perfil do líder</div>${cards(TRAITS, c.trait, 'ltrait')}
   </div>
   <div>
    <div class="section-title">👤 Pessoas reais do partido</div>
    <div class="muted" style="margin-bottom:6px">Partido: <b>${partyTxt}</b> · época ${year}</div>
    ${pols.length ? `<div class="pol-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px">${pols.map((pl, i) => { const age = polAge(pl, year), on = c.leader === pl.name;
        return `<div class="card ${on ? 'sel' : ''}" data-lpol="${i}" style="text-align:center;cursor:pointer">${avatarSVG(polAvatar(pl, c.gov, year), null, 72)}
          <b style="display:block">${esc(pl.name)}</b><span>${esc(pl.note)}${age ? ` · ${age} anos` : ''}${pl.from > year ? ' · ⏩ fora de época' : ''}</span></div>`; }).join('')}</div>
      <button class="btn sm" id="f-invent" style="margin-top:8px">✍️ Inventar outro líder</button>`
      : `<div class="tip">${c.party && c.party.real ? 'Não temos políticos cadastrados deste partido nesta época.' : 'Escolha um <b>partido real</b> na aba <b>País</b> para ver presidentes e políticos conhecidos dele (de acordo com a época).'}</div>`}
   </div></div>`;
}
function bindLider(b){
  const c = C.cfg, year = yearOf(c), pols = politiciansFor(partyKeyCfg(), c.party, year);
  b.querySelector('#f-leader').oninput = e=>{ c.leader = e.target.value; c.realLeader = false; };
  b.querySelector('#f-title').oninput = e=>{ c.title = e.target.value; C.titleEdited = true; };
  b.querySelector('#f-age').oninput = e=>{ c.age = +e.target.value; b.querySelector('#v-age').textContent = c.age+' anos'; };
  b.querySelector('#f-avatar').onclick = ()=>{ SFX.page(); openAvatarEditor({avatar:ensureCfgAvatar(), name:c.leader, party:c.party, gov:c.gov, cult:c.cult,
    onSave:(av, name, party)=>{ c.avatar = av; if (name) c.leader = name; if (party && c.party) c.party.emblem = party.emblem; renderStep(); }}); };
  b.querySelector('#f-avrand').onclick = ()=>{ SFX.bell(); c.avatar = randomAvatar(guessSex(c.leader), null, c.gov); renderStep(); };
  b.querySelectorAll('[data-ltrait]').forEach(x=>x.onclick=()=>{ SFX.click(); c.trait = x.dataset.ltrait; renderStep(); });
  b.querySelectorAll('[data-lpol]').forEach(x=>x.onclick=()=>{
    const pl = pols[+x.dataset.lpol]; if (!pl) return; SFX.bell();
    c.leader = pl.name; c.realLeader = true;
    const age = polAge(pl, year); if (age) c.age = age;
    if (pl.ideo && c.party) c.party.ideo = pl.ideo;
    c.avatar = polAvatar(pl, c.gov, year);
    renderStep();
  });
  const inv = b.querySelector('#f-invent'); if (inv) inv.onclick = ()=>{ SFX.click(); c.leader = typeof genPersonName === 'function' ? genPersonName() : genLeaderName(c.cult || 'luso'); c.realLeader = false; c.avatar = randomAvatar(guessSex(c.leader), null, c.gov); renderStep(); };
}
