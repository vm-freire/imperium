// ============================================================
//  IMPERIUM — Conquistas lendárias (muito difíceis) e online
// ============================================================
'use strict';

ACH_CATS.lendario = '👑 Lendárias';
ACH_CATS.online = '🌐 Online';
const worldGdp = () => { let s = 0; for (const n of G.nations) if (n && n.alive && n.id > 1 && !n.human) s += n.pop*n.pc; return s; };
const maxedBuildingTypes = () => new Set((G.p.buildings||[]).filter(b=>b.path && b.path.length && nextOptions(b).length === 0).map(b=>b.t)).size;

const ACH_HARD = {
  deus_da_guerra:{cat:'lendario', icon:'⚔️', n:'Deus da guerra', d:'Vença 300 batalhas', check:()=>S_().battlesWon >= 300},
  dez_anexacoes:{cat:'lendario', icon:'🌍', n:'Devorador de nações', d:'Anexe 10 nações inteiras', check:()=>S_().annexed >= 10},
  dez_capitais:{cat:'lendario', icon:'👑', n:'Coroa de capitais', d:'Capture 10 capitais inimigas', check:()=>(S_().capitalsTaken||0) >= 10},
  metade_mundo:{cat:'lendario', icon:'🌐', n:'Metade do mundo', d:'Controle 50% de todas as terras', check:()=>worldShare() >= 0.5},
  area_20m:{cat:'lendario', icon:'🗺️', n:'Vinte milhões', d:'Tenha 20 milhões de km²', check:()=>P_().area >= 2e7},
  bilhao:{cat:'lendario', icon:'👥', n:'Um bilhão', d:'Alcance 1 bilhão de habitantes', check:()=>P_().pop >= 1000},
  metade_riqueza:{cat:'lendario', icon:'💰', n:'Metade da riqueza do mundo', d:'Tenha um PIB maior que o de todas as outras nações juntas', check:()=>G.turn % 6 === 0 && P_().gdp >= worldGdp()},
  todas_tecnologias:{cat:'lendario', icon:'🔬', n:'Fim da ciência', d:'Descubra todas as tecnologias', check:()=>P_().techs.length >= TECHS.length},
  idh_950:{cat:'lendario', icon:'🌟', n:'Paraíso na Terra', d:'Alcance IDH 0,950', check:()=>socialIndex(1).idh >= 0.95},
  seculo_paz:{cat:'lendario', icon:'🕊️', n:'Século de paz', d:'Passe 100 anos sem nenhuma guerra', check:()=>P_().peaceMonths >= 1200},
  duzentos_anos:{cat:'lendario', icon:'⌛', n:'Bicentenário', d:'Governe a mesma nação por 200 anos', check:()=>yearsPlayed() >= 200},
  invicto_50:{cat:'lendario', icon:'🛡️', n:'Jamais derrotado', d:'Vença 50 batalhas sem perder nenhuma', check:()=>S_().battlesWon >= 50 && S_().battlesLost === 0},
  todas_maravilhas:{cat:'lendario', icon:'🏛️', n:'Maravilhas do mundo', d:'Leve 8 tipos diferentes de obra ao nível máximo', check:()=>maxedBuildingTypes() >= 8},
  amado_por_todos:{cat:'lendario', icon:'🤝', n:'Amado por todos', d:'Tenha relação acima de +50 com TODAS as nações vivas', check:()=>{ const L = G.nations.filter(n=>n&&n.id>1&&n.alive&&!n.human); return L.length > 5 && L.every(n=>n.rel > 50); }},
  oito_aliancas:{cat:'lendario', icon:'🎌', n:'Liga das nações', d:'Tenha 8 alianças militares ao mesmo tempo', check:()=>G.nations.filter(n=>n&&n.id>1&&n.alive&&n.alliance).length >= 8},
  dez_livre_comercio:{cat:'lendario', icon:'🌐', n:'Globalização', d:'Tenha 10 tratados de livre comércio', check:()=>G.nations.filter(n=>n&&n.id>1&&n.deals&&n.deals.livre_comercio).length >= 10},
  desarmado:{cat:'lendario', icon:'🕊️', n:'Nação desarmada', d:'Sobreviva 50 anos com menos de 10 divisões no total', check:()=>yearsPlayed() >= 50 && (S_().maxDivisions||0) < 10},
  fenix:{cat:'lendario', icon:'🔥', n:'Fênix', d:'Perca sua capital para o inimigo e depois capture 3 capitais', check:()=>(S_().capitalLost||0) >= 1 && (S_().capitalsTaken||0) >= 3},
  democracia_imperial:{cat:'lendario', icon:'🗳️', n:'Império da liberdade', d:'Como democracia, controle 20% das terras do mundo', check:()=>isFam('dem') && worldShare() >= 0.2},
  comunismo_global:{cat:'lendario', icon:'☭', n:'Revolução mundial', d:'Como Estado Comunista, anexe 5 nações', check:()=>govFam(P_().gov)==='com' && S_().annexed >= 5},
  teocracia_cientifica:{cat:'lendario', icon:'⛪', n:'Fé e razão', d:'Como Teocracia, descubra a Fusão Nuclear', check:()=>P_().gov==='teocracia' && P_().techs.includes('fusao')},
  artico_potencia:{cat:'lendario', icon:'🧊', n:'Gigante do gelo', d:'Com a capital no clima frio, esteja entre as 3 maiores economias', check:()=>P_().realClimate==='frio' && G.turn % 6 === 0 && rankings().gdp <= 3},
  tres_olimpiadas:{cat:'lendario', icon:'🏅', n:'Anfitrião olímpico', d:'Sedie 3 Jogos Olímpicos', check:()=>(S_().olympics||0) >= 3},
  dez_expedicoes:{cat:'lendario', icon:'🧭', n:'Grandes navegações', d:'Funde 10 postos avançados com expedições', check:()=>(S_().expeditions||0) >= 10},
  dez_sinergias:{cat:'lendario', icon:'✨', n:'Planejador mestre', d:'Tenha 10 sinergias de obras ativas', check:()=>activeSynergies().length >= 10},
  cidades_vivas:{cat:'lendario', icon:'🏙️', n:'Cidades vivas', d:'Conclua 25 projetos de cidade', check:()=>(S_().cityProjects||0) >= 25},
  campanha_1850:{cat:'lendario', icon:'♨️', n:'Da carroça às estrelas', d:'Vença o Modo com Objetivos começando em 1850', check:()=>G.objMode==='objetivos' && G.victory && G.era == 1850},
  campanha_ilha:{cat:'lendario', icon:'🏝️', n:'Ilha que virou império', d:'Vença o Modo com Objetivos começando como ilha nova', check:()=>G.objMode==='objetivos' && G.victory && P_().isIsland},
  // ---- online ----
  online_primeira:{cat:'online', icon:'🌐', n:'Mundo compartilhado', d:'Jogue uma partida online', check:()=>!!G.online},
  online_cinco:{cat:'online', icon:'👥', n:'Casa cheia', d:'Jogue uma sala online com 5 jogadores', check:()=>G.online && (G.online.humans||[]).length >= 5},
  online_alianca:{cat:'online', icon:'🤝', n:'Irmãos de armas', d:'Faça uma aliança com outro jogador humano', check:()=>G.nations.some(n=>n&&n.human&&n.alliance)},
  online_comercio:{cat:'online', icon:'⚓', n:'Comércio entre povos', d:'Tenha um acordo comercial com outro jogador', check:()=>G.nations.some(n=>n&&n.human&&dealCount(n))},
  online_guerra:{cat:'online', icon:'⚔️', n:'Rivalidade', d:'Declare guerra a outro jogador humano', check:()=>(S_().humanWars||0) >= 1},
  online_conquista:{cat:'online', icon:'🚩', n:'Território humano', d:'Conquiste 20 regiões de outros jogadores', check:()=>(S_().humanCells||0) >= 20},
  online_eliminar:{cat:'online', icon:'💀', n:'Último de pé', d:'Elimine outro jogador humano', check:()=>(S_().humanKills||0) >= 1},
  online_vencer:{cat:'online', icon:'🏆', n:'Campeão online', d:'Vença o Modo com Objetivos numa partida online', check:()=>G.online && G.objMode==='objetivos' && G.victory},
  online_veterano:{cat:'online', icon:'📅', n:'Veterano online', d:'Jogue 10 anos numa partida online', check:()=>G.online && yearsPlayed() >= 10}
};
function totalDivisions(){ const p = G.p; let s = 0; for (const u in p.units) if (UNIT[u] && UNIT[u].atk) s += p.units[u]; for (const c of (p.corps||[])) s += corpsUnitsCount(c); return s; }
for (const k in ACH_HARD){ ACH_EXTRA[k] = ACH_HARD[k]; ACHIEVEMENTS[k] = ACH_HARD[k]; }
