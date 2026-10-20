// ============================================================
//  IMPERIUM — Conquistas (para platinar o jogo)
//  Ficam salvas para sempre, em todas as partidas.
// ============================================================
'use strict';

const TROPHY_KEY = 'imperium_trophies_v1';
const ACH_CATS = {guerra:'🗡️ Guerra', territorio:'🌍 Território', economia:'💰 Economia', ciencia:'🔬 Ciência', diplomacia:'🤝 Diplomacia', bem:'😇 Lado do Bem', mal:'😈 Lado Sombrio', equilibrio:'⚖️ Equilíbrio', desafio:'🎲 Desafios', politica:'🏛️ Política'};
const S_ = () => G.stats, P_ = () => G.p;
const isFam = f => GOVS[G.p.gov].family === f;
const relSec = () => ['laico','ateu'].includes(G.p.religion);
const worldShare = () => { let t = 0; for (let i=0;i<NCELLS;i++) if (Grid.land[i] && Grid.owner[i]>0) t++; return G.nations[1].cells / Math.max(1,t); };
const nDeals = () => G.nations.filter(n=>n&&n.id>1).reduce((s,n)=>s+dealCount(n),0);
const yearsPlayed = () => G.turn/12;

const ACH_EXTRA = {
  // ---- guerra ----
  primeiro_territorio:{cat:'guerra', icon:'🚩', n:'Primeiro território conquistado', d:'Conquiste sua primeira região inimiga', check:()=>S_().cellsConquered >= 1},
  dez_vitorias:{cat:'guerra', icon:'⚔️', n:'Veterano', d:'Vença 10 batalhas', check:()=>S_().battlesWon >= 10},
  cem_vitorias:{cat:'guerra', icon:'🏆', n:'Lenda militar', d:'Vença 100 batalhas', check:()=>S_().battlesWon >= 100},
  capital_inimiga:{cat:'guerra', icon:'🏰', n:'Coração do inimigo', d:'Capture uma capital inimiga', check:()=>(S_().capitalsTaken||0) >= 1},
  tres_capitais:{cat:'guerra', icon:'👑', n:'Coleção de coroas', d:'Capture 3 capitais inimigas', check:()=>(S_().capitalsTaken||0) >= 3},
  imperador_mundo:{cat:'guerra', icon:'🌐', n:'Imperador do mundo', d:'Anexe 5 nações inteiras', check:()=>S_().annexed >= 5},
  muralha:{cat:'guerra', icon:'🛡️', n:'Muralha viva', d:'Repila 10 invasões inimigas', check:()=>(S_().repelled||0) >= 10},
  invicto:{cat:'guerra', icon:'💪', n:'Invicto', d:'Vença 20 batalhas sem perder nenhuma', check:()=>S_().battlesWon >= 20 && S_().battlesLost === 0},
  guerra_mundial:{cat:'guerra', icon:'🔥', n:'Contra o mundo', d:'Esteja em guerra com 4 nações ao mesmo tempo e sobreviva 1 ano', check:()=>G.wars.length >= 4 && G.wars.every(w=>G.turn - w.start >= 12)},
  reparacoes:{cat:'guerra', icon:'💰', n:'Os vencidos pagam', d:'Receba reparações de guerra', check:()=>(S_().reparations||0) >= 1},
  // ---- território ----
  colonizador:null, imperio:null, gigante:null, hegemonia:null,
  dois_continentes:{cat:'territorio', icon:'🗺️', n:'Além-mar', d:'Domine regiões a mais de 60° de distância da sua capital', check:()=>{ const [cx,cy] = cellCenter(P_().capCell); for (let i=0;i<NCELLS;i++) if (Grid.owner[i]===1){ const [x,y] = cellCenter(i); if (Math.hypot(x-cx,y-cy) > 60) return true; } return false; }},
  dez_porcento:{cat:'territorio', icon:'🌍', n:'Potência continental', d:'Controle 10% das terras do mundo', check:()=>worldShare() >= 0.1},
  cinquenta_estados:{cat:'territorio', icon:'🧩', n:'Federação gigante', d:'Tenha 50 estados', check:()=>P_().states >= 50},
  cem_cidades:{cat:'territorio', icon:'🏙️', n:'Terra de cidades', d:'Tenha 100 cidades', check:()=>P_().cities >= 100},
  // ---- economia ----
  rico:null, superpotencia:null, sem_dividas:null,
  maior_economia:{cat:'economia', icon:'🥇', n:'A maior economia', d:'Seja o PIB nº 1 do mundo', check:()=>G.turn % 6 === 0 && rankings().gdp === 1},
  cofre_cheio:{cat:'economia', icon:'🏦', n:'Tio Patinhas', d:'Tenha no tesouro o equivalente a 50% do PIB', check:()=>P_().treasury >= P_().gdp*0.5},
  industrializado:{cat:'economia', icon:'🏭', n:'Revolução industrial', d:'Industrialize 3 recursos naturais', check:()=>P_().resources.filter(r=>resMode(r)==='industrializar').length >= 3},
  comerciante:{cat:'economia', icon:'⚓', n:'Rota da seda', d:'Tenha 8 acordos comerciais em vigor', check:()=>nDeals() >= 8},
  livre_mercado:{cat:'economia', icon:'🤝', n:'Mercado comum', d:'Tenha 3 tratados de livre comércio', check:()=>G.nations.filter(n=>n&&n.id>1&&n.deals&&n.deals.livre_comercio).length >= 3},
  construtor:{cat:'economia', icon:'🏗️', n:'Mestre de obras', d:'Tenha 25 construções', check:()=>(P_().buildings||[]).length >= 25},
  obra_maxima:{cat:'economia', icon:'⭐', n:'Obra-prima', d:'Evolua uma construção até o último nível', check:()=>(P_().buildings||[]).some(b=>b.path && b.path.length && nextOptions(b).length === 0)},
  // ---- ciência ----
  atomico:null, espacial:null, abundancia:null,
  vanguarda:{cat:'ciencia', icon:'🚀', n:'Vanguarda', d:'Tenha 8 tecnologias a mais que a média mundial', check:()=>{ const a = G.nations.filter(n=>n&&n.id>1&&n.alive).reduce((s,n,_,x)=>s+n.tech/x.length,0); return P_().techs.length - a >= 8; }},
  internet:{cat:'ciencia', icon:'🌐', n:'Conectados', d:'Descubra a Internet', check:()=>P_().techs.includes('internet')},
  ia:{cat:'ciencia', icon:'🧠', n:'Mente artificial', d:'Descubra a Inteligência Artificial', check:()=>P_().techs.includes('ia')},
  antes_do_tempo:{cat:'ciencia', icon:'⚡', n:'À frente do seu tempo', d:'Descubra uma tecnologia 10 anos antes da época histórica', check:()=>(S_().earlyTech||0) >= 1},
  // ---- diplomacia ----
  pacifista:null,
  tres_aliancas:{cat:'diplomacia', icon:'🤝', n:'Rede de alianças', d:'Tenha 3 alianças militares ao mesmo tempo', check:()=>G.nations.filter(n=>n&&n.id>1&&n.alive&&n.alliance).length >= 3},
  amigo_de_todos:{cat:'diplomacia', icon:'🕊️', n:'Amigo de todos', d:'Tenha relação acima de +40 com 15 nações', check:()=>G.nations.filter(n=>n&&n.id>1&&n.alive&&n.rel>40).length >= 15},
  pragmatico:{cat:'diplomacia', icon:'🧭', n:'Pragmático', d:'Tenha acordos com uma democracia e com um país comunista ao mesmo tempo', check:()=>{ const L = G.nations.filter(n=>n&&n.id>1&&n.alive&&dealCount(n)); return L.some(n=>govFam(n.gov)==='dem') && L.some(n=>govFam(n.gov)==='com'); }},
  espiao_mestre:{cat:'diplomacia', icon:'🕵️', n:'Rede de espiões', d:'Descubra as instalações secretas de 5 nações', check:()=>G.nations.filter(n=>n&&n.id>1&&n.sites&&n.sites.length&&n.sites.every(s=>s.known)).length >= 5},
  // ---- lado do bem ----
  idh_800:{cat:'bem', icon:'🌟', n:'País desenvolvido', d:'Alcance IDH 0,800', check:()=>socialIndex(1).idh >= 0.8},
  idh_900:{cat:'bem', icon:'✨', n:'Exemplo para o mundo', d:'Alcance IDH 0,900', check:()=>socialIndex(1).idh >= 0.9},
  bem_estar:{cat:'bem', icon:'🤲', n:'Estado de bem-estar', d:'Tenha Saúde Universal, Educação Universal e 6% do PIB em bem-estar', check:()=>P_().policies.saude && P_().policies.educacao && P_().spend.social >= 6},
  povo_feliz:{cat:'bem', icon:'😄', n:'O povo te ama', d:'Alcance 90% de apoio popular', check:()=>P_().approval >= 90},
  democracia_exemplar:{cat:'bem', icon:'🗳️', n:'Democracia exemplar', d:'Seja uma democracia com imprensa livre e 20 anos sem guerras', check:()=>isFam('dem') && (P_().constitution||{}).imprensa === 'plena' && P_().peaceMonths >= 240},
  acolhedor:{cat:'bem', icon:'🧳', n:'Braços abertos', d:'Acolha refugiados de guerra 3 vezes', check:()=>(S_().refugees||0) >= 3},
  verde:{cat:'bem', icon:'🌳', n:'Planeta verde', d:'Tenha Proteção Ambiental e Energia Renovável', check:()=>P_().policies.ambiental && P_().techs.includes('renovaveis')},
  // ---- lado sombrio ----
  destruidor:{cat:'mal', icon:'☢️', n:'Destruidor de mundos', d:'Use uma arma nuclear', check:()=>S_().nukesUsed >= 1},
  grande_irmao:{cat:'mal', icon:'👁️', n:'Grande Irmão', d:'Tenha Censura, Lei Marcial e Polícia Secreta ao mesmo tempo', check:()=>P_().policies.censura && P_().policies.lei_marcial && P_().policies.policia_secreta},
  tirano_impopular:{cat:'mal', icon:'🦹', n:'Tirano odiado', d:'Governe com menos de 15% de apoio por 2 anos e continue no poder', check:()=>{ const h = G.hist.slice(-24); return h.length >= 24 && h.every(x=>x.app < 15); }},
  autogolpe:{cat:'mal', icon:'🎭', n:'O poder não se entrega', d:'Anule o resultado de uma eleição', check:()=>(S_().autogolpe||0) >= 1},
  caloteiro:{cat:'mal', icon:'💸', n:'Caloteiro', d:'Declare moratória da dívida', check:()=>P_().defaults >= 1},
  punho_de_ferro:{cat:'mal', icon:'✊', n:'Punho de ferro', d:'Esmague uma revolução', check:()=>(S_().repressed||0) >= 1},
  senhor_da_guerra:{cat:'mal', icon:'🗡️', n:'Senhor da guerra', d:'Declare guerra a 5 nações diferentes', check:()=>(S_().playerWars||0) >= 5},
  traidor:{cat:'mal', icon:'🐍', n:'Traidor', d:'Quebre um pacto de não-agressão', check:()=>(S_().betrayals||0) >= 1},
  // ---- equilíbrio ----
  centenario:null,
  pao_e_circo:{cat:'equilibrio', icon:'🎪', n:'Pão e circo', d:'Tenha apoio e estabilidade acima de 70% durante uma guerra', check:()=>G.wars.length && P_().approval > 70 && P_().stability > 70},
  ordem_e_progresso:{cat:'equilibrio', icon:'📈', n:'Ordem e progresso', d:'Cresça mais de 5% ao ano com estabilidade acima de 70%', check:()=>P_().growth > 5 && P_().stability > 70},
  cinquenta_anos:{cat:'equilibrio', icon:'⌛', n:'Meio século', d:'Governe por 50 anos', check:()=>yearsPlayed() >= 50},
  reformador:{cat:'politica', icon:'🏛️', n:'Reformador', d:'Mude o regime do país', check:()=>(S_().reforms||0) >= 1},
  constituinte:{cat:'politica', icon:'📜', n:'Constituinte', d:'Aprove 3 emendas constitucionais', check:()=>(S_().amendments||0) >= 3},
  reeleito:{cat:'politica', icon:'🗳️', n:'Reeleito', d:'Vença 3 eleições', check:()=>(S_().electionsWon||0) >= 3},
  nova_capital:{cat:'politica', icon:'🏙️', n:'Nova capital', d:'Transfira a capital do país', check:()=>(S_().capitalMoves||0) >= 1},
  // ---- desafios ----
  teocrata_conquistador:{cat:'desafio', icon:'⛪', n:'Guerra santa', d:'Como Teocracia, anexe uma nação inteira', check:()=>P_().gov === 'teocracia' && S_().annexed >= 1},
  ilha_imperial:{cat:'desafio', icon:'🏝️', n:'Ilha imperial', d:'Comece como ilha no oceano e chegue a 2 milhões de km²', check:()=>P_().isIsland && P_().area >= 2e6},
  comunismo_rico:{cat:'desafio', icon:'☭', n:'Paraíso socialista', d:'Como Estado Comunista, esteja entre as 3 maiores economias', check:()=>govFam(P_().gov) === 'com' && G.turn % 6 === 0 && rankings().gdp <= 3},
  pequeno_gigante:{cat:'desafio', icon:'🐜', n:'Pequeno gigante', d:'Comece com menos de 100 mil km² e esteja entre as 10 maiores economias', check:()=>P_().baseArea < 100000 && !P_().existing && G.turn % 6 === 0 && rankings().gdp <= 10},
  clima_errado:{cat:'desafio', icon:'🥶', n:'Contra a natureza', d:'Sobreviva 50 anos com um clima totalmente incompatível', check:()=>climateMismatch(P_().climate, P_().realClimate) >= 2 && yearsPlayed() >= 50},
  dinastia:{cat:'desafio', icon:'👑', n:'Dinastia milenar', d:'Seja uma monarquia por 100 anos', check:()=>isFam('mon') && yearsPlayed() >= 100},
  brasil_potencia:{cat:'desafio', icon:'🇧🇷', n:'O gigante acordou', d:'Jogando com o Brasil, esteja entre as 3 maiores economias', check:()=>/Brasil/.test(P_().existing||'') && G.turn % 6 === 0 && rankings().gdp <= 3},
  sorteado:{cat:'desafio', icon:'🎲', n:'Sorte grande', d:'Jogue com uma nação sorteada e sobreviva 20 anos', check:()=>P_().randomPick && yearsPlayed() >= 20},
  razao:{cat:'desafio', icon:'⚛️', n:'Império da razão', d:'Com Estado Laico ou Ateu, descubra a Fusão Nuclear', check:()=>relSec() && P_().techs.includes('fusao')},
  fe_e_espada:{cat:'desafio', icon:'🙏', n:'Fé e espada', d:'Com uma religião oficial (não laica), anexe 3 nações', check:()=>!relSec() && S_().annexed >= 3},
  da_vapor_ao_atomo:{cat:'desafio', icon:'♨️', n:'Do vapor ao átomo', d:'Comece em 1850 e chegue a 1950', check:()=>G.era == 1850 && curYear() >= 1950},
  campanha_completa:{cat:'desafio', icon:'🎯', n:'Missão cumprida', d:'Vença o Modo com Objetivos', check:()=>G.objMode === 'objetivos' && G.victory},
  livre_100:{cat:'desafio', icon:'🕊️', n:'Cem anos de liberdade', d:'No Modo Livre, governe por 100 anos', check:()=>G.objMode !== 'objetivos' && yearsPlayed() >= 100}
};
// categorias das conquistas antigas
const ACH_OLD_CAT = {primeira_vitoria:'guerra', conquistador:'guerra', imperio:'territorio', gigante:'territorio', rico:'economia', superpotencia:'economia', atomico:'ciencia', espacial:'ciencia', abundancia:'ciencia', hegemonia:'territorio', centenario:'equilibrio', pacifista:'diplomacia', sem_dividas:'economia', colonizador:'territorio'};
for (const k in ACH_OLD_CAT) if (ACHIEVEMENTS[k]) ACHIEVEMENTS[k].cat = ACH_OLD_CAT[k];
for (const k in ACH_EXTRA) if (ACH_EXTRA[k]) ACHIEVEMENTS[k] = ACH_EXTRA[k];

function getTrophies(){ try { return JSON.parse(localStorage.getItem(TROPHY_KEY)) || {}; } catch(e){ return {}; } }
function saveTrophy(id){ try { const t = getTrophies(), nation = G && G.p ? G.p.name : ''; if (!t[id]) t[id] = {at:Date.now(), nation, count:1}; else { t[id].count = (t[id].count||1) + 1; t[id].last = Date.now(); t[id].lastNation = nation; } localStorage.setItem(TROPHY_KEY, JSON.stringify(t)); } catch(e){} }
function checkTrophies(){
  for (const id in ACH_EXTRA){
    const a = ACH_EXTRA[id]; if (!a || !a.check || G.achievements.includes(id)) continue;
    try { if (a.check()) unlock(id); } catch(e){}
  }
}
function trophyCount(){ const t = getTrophies(); return {have: Object.keys(ACHIEVEMENTS).filter(k=>t[k]).length, total: Object.keys(ACHIEVEMENTS).length}; }
