// ============================================================
//  IMPERIUM — Partidos e grupos de poder
//  Democracias e monarquias constitucionais: partido no governo.
//  Outros regimes: dinastia, junta, partido único, ordem ou conselho.
//  Pode-se usar um grupo real da época ou criar um novo.
// ============================================================
'use strict';

const IDEOS = {
  esq:{n:'Esquerda', fx:{approval:2, unemployment:-0.5, growth:-0.1}},
  cesq:{n:'Centro-esquerda', fx:{approval:1, stability:1}},
  cen:{n:'Centro', fx:{stability:2}},
  cdir:{n:'Centro-direita', fx:{growth:0.1, tradeMult:0.02}},
  dir:{n:'Direita', fx:{growth:0.15, approval:-1, military:0.02}}
};
const POWER_KINDS = {
  partido:{label:'Partido no governo', icon:'🗳️', noun:'partido', fx:null},
  dinastia:{label:'Casa real (dinastia)', icon:'👑', noun:'dinastia', fx:{stability:2}},
  junta:{label:'Junta / movimento no poder', icon:'🎖️', noun:'movimento', fx:{military:0.05}},
  partido_unico:{label:'Partido único', icon:'☭', noun:'partido', fx:{stability:2}},
  ordem:{label:'Ordem religiosa no poder', icon:'⛪', noun:'ordem', fx:{approval:1}},
  conselho:{label:'Conselho técnico', icon:'🧪', noun:'conselho', fx:{research:0.03}}
};
function powerKind(gov){
  const g = GOVS[gov] || {}, f = g.family;
  if (f === 'dem' || gov === 'monarquia_const') return 'partido';
  if (f === 'mon') return 'dinastia';
  if (gov === 'ditadura') return 'junta';
  if (f === 'com') return 'partido_unico';
  if (f === 'teo') return 'ordem';
  return 'conselho';
}

// [ano inicial, ano final (exclusivo), nome, sigla, ideologia]
const PARTIES = {
  'Brasil':[[1850,1890,'Partido Liberal','PL','cesq'],[1850,1890,'Partido Conservador','PC','dir'],[1873,1930,'Partido Republicano Paulista','PRP','cdir'],[1889,1930,'Partido Republicano Mineiro','PRM','cdir'],
    [1945,1966,'Partido Social Democrático','PSD','cen'],[1945,1966,'União Democrática Nacional','UDN','cdir'],[1945,1966,'Partido Trabalhista Brasileiro','PTB','cesq'],
    [1980,2100,'Partido dos Trabalhadores','PT','esq'],[1980,2100,'Movimento Democrático Brasileiro','MDB','cen'],[1980,2100,'Partido Democrático Trabalhista','PDT','cesq'],[1985,2100,'Partido Socialista Brasileiro','PSB','cesq'],
    [1988,2100,'Partido da Social Democracia Brasileira','PSDB','cdir'],[1985,2022,'Democratas (ex-PFL)','DEM','dir'],[2004,2100,'Partido Socialismo e Liberdade','PSOL','esq'],[2006,2100,'Partido Liberal','PL','dir'],[2011,2100,'Partido Novo','NOVO','dir'],[2022,2100,'União Brasil','UNIÃO','cdir']],
  'Estados Unidos':[[1850,1856,'Partido Whig','Whig','cdir'],[1850,2100,'Partido Democrata','D','cesq'],[1854,2100,'Partido Republicano','R','cdir']],
  'Reino Unido':[[1850,1859,'Whigs','Whig','cen'],[1859,2100,'Partido Liberal','Lib','cen'],[1850,2100,'Partido Conservador','Con','cdir'],[1900,2100,'Partido Trabalhista','Lab','cesq'],[1988,2100,'Liberal Democratas','LD','cen']],
  'França':[[1850,1852,'Partido da Ordem','PO','dir'],[1901,2100,'Partido Radical','PR','cen'],[1905,1969,'Seção Francesa da Internacional Operária','SFIO','esq'],[1920,2100,'Partido Comunista Francês','PCF','esq'],
    [1958,1976,'União pela Nova República (gaullista)','UNR','cdir'],[1976,2002,'Reunião pela República','RPR','cdir'],[2002,2015,'União por um Movimento Popular','UMP','cdir'],[2015,2100,'Os Republicanos','LR','cdir'],[1969,2100,'Partido Socialista','PS','cesq'],[2016,2100,'Renascimento','RE','cen']],
  'Alemanha':[[1867,1918,'Partido Nacional-Liberal','NLP','cdir'],[1870,1933,'Partido do Centro','Zentrum','cen'],[1875,1933,'Partido Social-Democrata','SPD','cesq'],
    [1945,2100,'União Democrata-Cristã','CDU','cdir'],[1945,2100,'Partido Social-Democrata','SPD','cesq'],[1948,2100,'Partido Democrático Liberal','FDP','cen'],[1980,2100,'Os Verdes','Grüne','cesq']],
  'Itália':[[1892,1994,'Partido Socialista Italiano','PSI','cesq'],[1943,1994,'Democracia Cristã','DC','cen'],[1921,1926,'Partido Comunista Italiano','PCI','esq'],[1944,1991,'Partido Comunista Italiano','PCI','esq'],
    [1994,2100,'Forza Italia','FI','cdir'],[2007,2100,'Partido Democrático','PD','cesq'],[2009,2100,'Movimento 5 Estrelas','M5S','cen'],[2012,2100,'Irmãos de Itália','FdI','dir']],
  'Espanha':[[1879,2100,'Partido Socialista Operário Espanhol','PSOE','cesq'],[1977,1983,'União de Centro Democrático','UCD','cen'],[1989,2100,'Partido Popular','PP','cdir'],[2006,2100,'Cidadãos','Cs','cen'],[2014,2100,'Podemos','Podemos','esq']],
  'Japão':[[1900,1940,'Rikken Seiyūkai','Seiyūkai','cdir'],[1927,1940,'Rikken Minseitō','Minseitō','cen'],[1955,2100,'Partido Liberal Democrata','PLD','cdir'],[1945,1996,'Partido Socialista do Japão','PSJ','esq'],[1964,2100,'Komeito','Komeito','cen'],[2017,2100,'Partido Democrático Constitucional','PDC','cesq']],
  'Canadá':[[1867,2100,'Partido Liberal','LPC','cen'],[1867,2100,'Partido Conservador','CPC','cdir'],[1961,2100,'Novo Partido Democrático','NDP','cesq']],
  'Austrália':[[1901,2100,'Partido Trabalhista Australiano','ALP','cesq'],[1945,2100,'Partido Liberal','LPA','cdir'],[1920,2100,'Partido Nacional','NPA','dir'],[1992,2100,'Os Verdes','Greens','esq']],
  'Nova Zelândia':[[1916,2100,'Partido Trabalhista','Labour','cesq'],[1936,2100,'Partido Nacional','National','cdir']],
  'Índia':[[1947,2100,'Congresso Nacional Indiano','INC','cen'],[1977,1988,'Partido Janata','JP','cen'],[1980,2100,'Bharatiya Janata Party','BJP','dir'],[1964,2100,'Partido Comunista da Índia (Marxista)','CPI(M)','esq']],
  'México':[[1850,1876,'Partido Liberal','PL','cesq'],[1850,1867,'Partido Conservador','PC','dir'],[1929,2100,'Partido Revolucionário Institucional','PRI','cen'],[1939,2100,'Partido Ação Nacional','PAN','cdir'],[1989,2024,'Partido da Revolução Democrática','PRD','esq'],[2014,2100,'Morena','MORENA','esq']],
  'Argentina':[[1874,1916,'Partido Autonomista Nacional','PAN','cdir'],[1891,2100,'União Cívica Radical','UCR','cen'],[1946,2100,'Partido Justicialista','PJ','cesq'],[2005,2100,'Proposta Republicana','PRO','cdir'],[2021,2100,'A Liberdade Avança','LLA','dir']],
  'Rússia':[[1905,1917,'Partido Constitucional Democrático','KD','cen'],[1993,2100,'Partido Comunista da Federação Russa','PCFR','esq'],[1993,2100,'Yabloko','Yabloko','cen'],[2001,2100,'Rússia Unida','RU','dir']],
  'Turquia':[[1923,2100,'Partido Republicano do Povo','CHP','cesq'],[1946,1960,'Partido Democrata','DP','cdir'],[1983,2009,'Partido da Mãe Pátria','ANAP','cdir'],[2001,2100,'Partido da Justiça e Desenvolvimento','AKP','dir']],
  'África do Sul':[[1911,1934,'Partido Sul-Africano','SAP','cen'],[1934,1948,'Partido Unido','UP','cen'],[1994,2100,'Congresso Nacional Africano','ANC','cesq'],[2000,2100,'Aliança Democrática','DA','cen']],
  'Coreia':[[1997,2012,'Grande Partido Nacional','GNP','cdir'],[2012,2020,'Partido Saenuri','Saenuri','cdir'],[2020,2100,'Partido do Poder Popular','PPP','cdir'],[2014,2100,'Partido Democrático','Minjoo','cesq']],
  'Escandinávia':[[1889,2100,'Partido Social-Democrata','S','cesq'],[1904,2100,'Partido Moderado','M','cdir'],[1902,2100,'Partido Liberal','L','cen'],[1913,2100,'Partido do Centro','C','cen']],
  'Polônia':[[1991,2100,'Aliança da Esquerda Democrática','SLD','cesq'],[2001,2100,'Plataforma Cívica','PO','cdir'],[2001,2100,'Lei e Justiça','PiS','dir']]
};
// [ano inicial, ano final, nome]
const DYNASTIES = {
  'Brasil':[[1822,1889,'Casa de Bragança']], 'Reino Unido':[[1714,1901,'Casa de Hanôver'],[1901,1917,'Casa de Saxe-Coburgo-Gota'],[1917,2100,'Casa de Windsor']],
  'Rússia':[[1613,1917,'Casa Romanov']], 'China':[[1644,1912,'Dinastia Qing (Aisin-Gioro)']], 'Japão':[[1850,2100,'Casa Imperial do Japão']],
  'Áustria':[[1850,1918,'Casa de Habsburgo-Lorena']], 'Alemanha':[[1850,1918,'Casa de Hohenzollern']], 'Espanha':[[1850,1931,'Casa de Bourbon'],[1975,2100,'Casa de Bourbon']],
  'Itália':[[1850,1946,'Casa de Saboia']], 'Turquia':[[1850,1922,'Dinastia Otomana']], 'Escandinávia':[[1818,2100,'Casa de Bernadotte']], 'Etiópia':[[1850,1974,'Dinastia Salomônica']],
  'Irã':[[1789,1925,'Dinastia Qajar'],[1925,1979,'Dinastia Pahlavi']], 'Egito':[[1805,1953,'Dinastia de Muhammad Ali']], 'Arábia Saudita':[[1932,2100,'Casa de Saud']],
  'Tailândia':[[1782,2100,'Dinastia Chakri']], 'Coreia':[[1850,1910,'Dinastia Joseon (Yi)']], 'França':[[1852,1870,'Casa Bonaparte']], 'México':[[1864,1867,'Casa de Habsburgo']]
};
const SINGLE_PARTIES = {
  'Rússia':[[1917,1992,'Partido Comunista da União Soviética','PCUS']], 'China':[[1921,2100,'Partido Comunista da China','PCC']], 'Cuba':[[1965,2100,'Partido Comunista de Cuba','PCC']]
};
const GENERIC_GROUPS = {
  partido:[['Partido Liberal','PL','cen',1800],['Partido Conservador','PC','dir',1800],['Partido Republicano','PR','cdir',1800],['Partido Social-Democrata','PSD','cesq',1870],['Partido Trabalhista','PT','cesq',1890],['Partido Democrata-Cristão','PDC','cdir',1890],['Partido Socialista','PS','esq',1880],['Partido Verde','PV','cesq',1975],['Partido Pirata Digital','PPD','cen',2006],['Movimento Pós-Humanista','MPH','cen',2045]],
  dinastia:[['Casa Real Nova'],['Dinastia dos Fundadores']], junta:[['Junta de Salvação Nacional'],['Conselho Militar Supremo'],['Movimento da Ordem']],
  partido_unico:[['Partido Comunista','PC'],['Partido Revolucionário do Povo','PRP'],['Frente Popular Unida','FPU']],
  ordem:[['Conselho dos Sábios'],['Santa Ordem do Estado'],['Assembleia da Fé']], conselho:[['Conselho de Especialistas'],['Instituto Nacional de Planejamento'],['Comitê Algorítmico Central']]
};

// Partido que governava no início de cada época (fica em primeiro na lista)
const RULING = {
  'Brasil':{1850:'PC',1914:'PRM',1960:'PSD',2000:'PSDB'}, 'Estados Unidos':{1850:'Whig',1914:'D',1960:'R',2000:'D'}, 'Reino Unido':{1850:'Whig',1914:'Lib',1960:'Con',2000:'Lab'},
  'França':{1960:'UNR',2000:'RPR'}, 'Alemanha':{1960:'CDU',2000:'SPD'}, 'Itália':{1960:'DC'}, 'Espanha':{2000:'PP'}, 'Japão':{1914:'Seiyūkai',1960:'PLD',2000:'PLD'},
  'Canadá':{1914:'CPC',1960:'CPC',2000:'LPC'}, 'Austrália':{1960:'LPA',2000:'LPA'}, 'Índia':{1960:'INC',2000:'BJP'}, 'México':{1960:'PRI',2000:'PRI'},
  'Argentina':{1914:'PAN',2000:'UCR'}, 'Escandinávia':{1960:'S',2000:'S'}, 'África do Sul':{2000:'ANC'}, 'Polônia':{2000:'SLD'}, 'Nova Zelândia':{1960:'Labour',2000:'Labour'}
};
// Grupos reais de um país num ano, para o regime dado
function realGroups(key, year, gov){
  const kind = powerKind(gov), out = [];
  if (kind === 'partido') for (const e of (PARTIES[key]||[])) if (year >= e[0] && year < e[1]) out.push({name:e[2], abbr:e[3], ideo:e[4], kind, real:true});
  const rul = (RULING[key]||{})[year]; if (rul) out.sort((x,y)=>(y.abbr===rul)-(x.abbr===rul));
  if (kind === 'dinastia') for (const e of (DYNASTIES[key]||[])) if (year >= e[0] && year < e[1]) out.push({name:e[2], kind, real:true});
  if (kind === 'partido_unico') for (const e of (SINGLE_PARTIES[key]||[])) if (year >= e[0] && year < e[1]) out.push({name:e[2], abbr:e[3], ideo:'esq', kind, real:true});
  return out;
}
function genericGroups(year, gov){
  const kind = powerKind(gov);
  return (GENERIC_GROUPS[kind]||[]).filter(g=>!g[3] || g[3] <= year).map(g=>({name:g[0], abbr:g[1]||'', ideo:g[2]||(kind==='partido_unico'?'esq':null), kind}));
}
function partyLabel(pt){ if (!pt) return '—'; return `${esc(pt.name)}${pt.abbr?` (${esc(pt.abbr)})`:''}${pt.ideo && IDEOS[pt.ideo] ? ` · ${IDEOS[pt.ideo].n}` : ''}`; }
function partyMods(m){
  const pt = G.p && G.p.party; if (!pt) return;
  if (pt.kind !== powerKind(G.p.gov)) return;     // depois de uma reforma de regime o grupo antigo perde a força
  const K = POWER_KINDS[pt.kind];
  if (K && K.fx) addMods(m, K.fx, pt.real ? 1 : 0.6);
  if (pt.ideo && IDEOS[pt.ideo] && pt.kind === 'partido') addMods(m, IDEOS[pt.ideo].fx);
}

// ------------------------------------------------------------
//  Seletor (usado na criação do país e durante o jogo)
//  obj.party é lido e escrito; onChange() redesenha
// ------------------------------------------------------------
function partyPickerHTML(obj, key, year, gov){
  const kind = powerKind(gov), K = POWER_KINDS[kind], cur = obj.party && obj.party.kind === kind ? obj.party : null;
  const reals = key ? realGroups(key, year, gov) : [], gens = genericGroups(year, gov);
  const opt = (g, i, src) => { const on = cur && cur.name === g.name; return `<div class="card ${on?'sel':''}" data-pg="${src}:${i}"><b>${esc(g.name)}${g.abbr?` <small>(${esc(g.abbr)})</small>`:''}</b><span>${g.real?'🏛️ Existiu de verdade nesta época':'Sugestão'}${g.ideo&&IDEOS[g.ideo]&&kind==='partido'?' · '+IDEOS[g.ideo].n:''}</span></div>`; };
  const custom = cur && !cur.real && !gens.some(g=>g.name===cur.name);
  return `<div class="section-title">${K.icon} ${K.label}</div>
    ${reals.length ? `<div class="lbl">Da época (${year})</div><div class="cards">${reals.map((g,i)=>opt(g,i,'r')).join('')}</div>` : ''}
    <div class="lbl">${reals.length ? 'Ou use uma sugestão' : 'Sugestões'}</div><div class="cards">${gens.map((g,i)=>opt(g,i,'g')).join('')}</div>
    <div class="lbl" style="margin-top:6px">Ou crie ${kind==='dinastia'||kind==='ordem'?'uma nova':'um novo'}</div>
    <div class="grid2" style="gap:8px;grid-template-columns:2fr 1fr${kind==='partido'?' 1.2fr':''}">
      <input type="text" id="pg-name" maxlength="40" placeholder="Nome ${kind==='partido'?'do partido':'da '+K.noun}" value="${custom?esc(cur.name):''}">
      <input type="text" id="pg-abbr" maxlength="8" placeholder="Sigla" value="${custom?esc(cur.abbr||''):''}">
      ${kind==='partido' ? `<select id="pg-ideo">${Object.entries(IDEOS).map(([k,v])=>`<option value="${k}" ${(custom?cur.ideo:'cen')===k?'selected':''}>${v.n}</option>`).join('')}</select>` : ''}
    </div>
    <button class="btn sm" id="pg-new" style="margin-top:6px">✔ Usar ${kind==='partido'?'este partido':'este nome'}</button>
    <div class="help">${kind==='partido' ? 'A ideologia do partido dá pequenos bônus (apoio, estabilidade ou crescimento).' : 'Grupos históricos reais dão um pouco mais de força que os inventados.'}</div>`;
}
function bindPartyPicker(root, obj, key, year, gov, onChange){
  const kind = powerKind(gov), reals = key ? realGroups(key, year, gov) : [], gens = genericGroups(year, gov);
  root.querySelectorAll('[data-pg]').forEach(x=>x.onclick = ()=>{ SFX.click(); const [src, i] = x.dataset.pg.split(':'); obj.party = Object.assign({}, (src==='r'?reals:gens)[+i]); onChange(); });
  const nb = root.querySelector('#pg-new');
  if (nb) nb.onclick = ()=>{
    const name = root.querySelector('#pg-name').value.trim(); if (!name){ SFX.error(); toast('Escreva um nome.', 'bad'); return; }
    const ide = root.querySelector('#pg-ideo');
    obj.party = {name, abbr:root.querySelector('#pg-abbr').value.trim(), ideo: ide ? ide.value : (kind==='partido_unico'?'esq':null), kind, real:false};
    SFX.click(); onChange();
  };
}

// ------------------------------------------------------------
//  Editar nomes durante o jogo: capital, cidades, estados e grupo no poder
// ------------------------------------------------------------
function openNamesModal(tab){
  const p = G.p; tab = tab || 'cidades';
  const tabs = {cidades:'🏙️ Capital e cidades', estados:'🗺️ Estados', poder:`${POWER_KINDS[powerKind(p.gov)].icon} ${POWER_KINDS[powerKind(p.gov)].label}`};
  const key = p.existing ? ((G.eraList||[]).find(d=>d.name===p.existing)||{}).key || p.existing : null;
  let body = '';
  if (tab === 'cidades'){
    const cells = (p.cityCells||[]).slice(), names = cells.map((c,i)=>(p.cityNames||[])[i] || cityInfo(c).name);
    const order = cells.map((c,i)=>i).sort((a,b)=>(cells[b]===p.capCell)-(cells[a]===p.capCell));
    body = `<div class="field"><label>⭐ Capital</label><input type="text" maxlength="28" data-city="${p.capCell}" value="${esc(p.capital)}"></div>
      <div class="lbl">Outras cidades (${cells.length - (cells.includes(p.capCell)?1:0)})</div>
      <div class="names-grid">${order.filter(i=>cells[i]!==p.capCell).map(i=>`<input type="text" maxlength="28" data-city="${cells[i]}" value="${esc(names[i])}">`).join('') || '<div class="muted">Você ainda não fundou outras cidades. Use a aba Obras → Nova Cidade.</div>'}</div>`;
  } else if (tab === 'estados'){
    body = `<div class="lbl">Seus ${p.stateNames.length} estados</div><div class="names-grid">${p.stateNames.map((s,i)=>`<input type="text" maxlength="28" data-state="${i}" value="${esc(s)}">`).join('')}</div>`;
  } else body = `<div id="pg-root">${partyPickerHTML(p, key, curYear(), p.gov)}</div>${p.party ? `<div class="tip">Atual: <b>${partyLabel(p.party)}</b>${p.party.kind !== powerKind(p.gov) ? ' — não combina com o regime atual e não dá bônus. Escolha outro.' : ''}</div>` : ''}`;
  const m = openModal(`<div class="m-icon">✏️</div><div class="m-title">Nomes da nação</div>
    <div class="seg" style="margin:8px 0">${Object.entries(tabs).map(([k,v])=>`<button data-nt="${k}" class="${k===tab?'active':''}">${v}</button>`).join('')}</div>
    ${body}
    <div class="m-actions"><button class="btn" id="nm-x">Fechar</button>${tab!=='poder'?'<button class="btn green" id="nm-ok">Salvar nomes</button>':''}</div>`, {wide:true});
  m.querySelectorAll('[data-nt]').forEach(b=> b.onclick = ()=>{ SFX.click(); openNamesModal(b.dataset.nt); });
  m.querySelector('#nm-x').onclick = ()=>{ SFX.click(); closeModal(); };
  const ok = m.querySelector('#nm-ok');
  if (ok) ok.onclick = ()=>{
    let n = 0;
    m.querySelectorAll('[data-city]').forEach(inp=>{ const c = +inp.dataset.city, v = inp.value.trim(); const cur = c === p.capCell ? p.capital : cityInfo(c).name; if (v && v !== cur){ renameCity(c, v); if (c === p.capCell) p.capital = v; n++; } });
    m.querySelectorAll('[data-state]').forEach(inp=>{ const i = +inp.dataset.state, v = inp.value.trim(); if (v && v !== p.stateNames[i]){ addLog(`🗺️ O estado de ${p.stateNames[i]} agora se chama ${v}.`, 'info'); p.stateNames[i] = v; n++; } });
    SFX.click(); closeModal(); toast(n ? `✏️ ${n} nome(s) atualizado(s).` : 'Nenhum nome mudou.', n ? 'good' : undefined); refreshAll(); saveGame();
  };
  const root = m.querySelector('#pg-root');
  if (root) bindPartyPicker(root, p, key, curYear(), p.gov, ()=>{ addLog(`${POWER_KINDS[p.party.kind].icon} No poder: ${p.party.name}.`, 'info'); derive(); refreshAll(); saveGame(); openNamesModal('poder'); });
}

// botões do painel da nação
document.addEventListener('click', e=>{
  if (!G || !G.p) return;
  if (e.target.closest('#btn-names')){ SFX.page(); openNamesModal(); }
  else if (e.target.closest('#lnk-party')){ e.preventDefault(); SFX.page(); openNamesModal('poder'); }
});
