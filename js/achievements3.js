// ============================================================
//  IMPERIUM — Conquistas do multiplayer, por dificuldade
//  Fáceis · Médias · Difíceis · Lendárias
// ============================================================
'use strict';

// As conquistas online passam a ser agrupadas por dificuldade
delete ACH_CATS.online;
Object.assign(ACH_CATS, {on_facil:'🌐 Online · Fáceis', on_media:'🌐 Online · Médias', on_dificil:'🌐 Online · Difíceis', on_lenda:'🌐 Online · Lendárias'});
const ON_TIER_OLD = {online_primeira:'on_facil', online_alianca:'on_facil', online_comercio:'on_facil', online_guerra:'on_facil',
  online_cinco:'on_media', online_conquista:'on_media', online_veterano:'on_media', online_eliminar:'on_dificil', online_vencer:'on_lenda'};
for (const k in ON_TIER_OLD) if (ACHIEVEMENTS[k]) ACHIEVEMENTS[k].cat = ON_TIER_OLD[k];

// ---- ajudantes ----
const onYears = () => G.online ? yearsPlayed() : 0;
const onRivals = () => G.nations.filter(n=>n && n.human && !n.empty);                  // outros jogadores (no mapa)
const onPubs = () => Object.values(ON.players||{}).filter(pl=>pl && pl.uid !== NET.user.uid && pl.canon);
const onSeats = () => (G.online && G.online.humans || []).length;
const onBorders = () => onRivals().filter(n=>n.alive && G.adj && G.adj['1,' + n.id]).length;
const onMine = {area:()=>P_().area, gdp:()=>P_().gdp, power:()=>P_().atk||0, tech:()=>P_().techs.length, score:()=>score()};
const onTheirs = {area:pl=>pl.area||0, gdp:pl=>(pl.pop||0)*(pl.pc||0), power:pl=>pl.power||0, tech:pl=>pl.tech||0, score:pl=>pl.score||0};
// sou o primeiro da mesa nesta métrica? (precisa de pelo menos `min` jogadores na sala)
function onTop(metric, min){
  if (!G.online || onSeats() < (min||2)) return false;
  const rivals = onPubs().filter(pl=>pl.alive !== false); if (!rivals.length) return false;
  const me = onMine[metric](); return rivals.every(pl=>me > onTheirs[metric](pl));
}
const onSt = k => (G.stats[k]||0);

const ACH_ONLINE = {
  // ---------------- Fáceis ----------------
  on_msg:{cat:'on_facil', icon:'💬', n:'Primeiro contato', d:'Envie uma mensagem a outro jogador', check:()=>onSt('onMsgs') >= 1},
  on_proposta:{cat:'on_facil', icon:'✉️', n:'Mesa de negociação', d:'Envie uma proposta diplomática a outro jogador', check:()=>onSt('onProposals') >= 1},
  on_anfitriao:{cat:'on_facil', icon:'🏠', n:'Anfitrião', d:'Comande uma partida online como anfitrião', check:()=>G.online && G.online.host && G.turn >= 1},
  on_ano:{cat:'on_facil', icon:'📆', n:'Primeiro ano online', d:'Jogue 1 ano numa partida online', check:()=>onYears() >= 1},
  on_vizinho:{cat:'on_facil', icon:'🧱', n:'Cerca com o vizinho', d:'Tenha fronteira com outro jogador humano', check:()=>onBorders() >= 1},
  on_pacto:{cat:'on_facil', icon:'📜', n:'Palavra dada', d:'Assine um pacto de não-agressão com outro jogador', check:()=>onRivals().some(n=>n.pact)},
  on_relampago:{cat:'on_facil', icon:'⚡', n:'Reflexos rápidos', d:'Jogue 6 meses numa sala Relâmpago (20 s por mês)', check:()=>onSt('onFastMonths') >= 6},
  on_obra:{cat:'on_facil', icon:'🏗️', n:'Mãos à obra', d:'Construa uma obra durante uma partida online', check:()=>G.online && (P_().buildings||[]).length >= 1},

  // ---------------- Médias ----------------
  on_dois_comercios:{cat:'on_media', icon:'⚓', n:'Rota dos jogadores', d:'Tenha acordo comercial com 2 jogadores ao mesmo tempo', check:()=>onRivals().filter(n=>dealCount(n)).length >= 2},
  on_dois_aliados:{cat:'on_media', icon:'🤝', n:'Bloco humano', d:'Tenha aliança com 2 jogadores ao mesmo tempo', check:()=>onRivals().filter(n=>n.alliance).length >= 2},
  on_paz:{cat:'on_media', icon:'🕊️', n:'Paz dos bravos', d:'Faça as pazes com um jogador depois de uma guerra', check:()=>onSt('onPeace') >= 1},
  on_repelir:{cat:'on_media', icon:'🛡️', n:'Fronteira de ferro', d:'Repila 3 ataques de outros jogadores', check:()=>onSt('humanRepelled') >= 3},
  on_maior_terra:{cat:'on_media', icon:'🗺️', n:'Dono do mapa', d:'Tenha o maior território entre os jogadores da sala', check:()=>onTop('area', 2)},
  on_mais_rico:{cat:'on_media', icon:'💰', n:'O mais rico da mesa', d:'Tenha o maior PIB entre os jogadores da sala', check:()=>onTop('gdp', 2)},
  on_vanguarda:{cat:'on_media', icon:'🔬', n:'Vanguarda', d:'Tenha mais tecnologias que todos os outros jogadores', check:()=>onTop('tech', 2)},
  on_maior_exercito:{cat:'on_media', icon:'🎖️', n:'Maior exército da mesa', d:'Tenha o exército mais forte entre os jogadores', check:()=>onTop('power', 2)},
  on_50_regioes:{cat:'on_media', icon:'🚩', n:'Avanço de fronteira', d:'Conquiste 50 regiões de outros jogadores', check:()=>onSt('humanCells') >= 50},
  on_estrategica:{cat:'on_media', icon:'🐢', n:'Paciência de estrategista', d:'Jogue 2 anos numa sala Estratégica (5 min por mês)', check:()=>onSt('onSlowMonths') >= 24},
  on_cinco_anos:{cat:'on_media', icon:'📅', n:'Cinco anos de mesa', d:'Jogue 5 anos numa partida online', check:()=>onYears() >= 5},

  // ---------------- Difíceis ----------------
  on_capital:{cat:'on_dificil', icon:'🏰', n:'Capital rival', d:'Capture a capital de outro jogador', check:()=>onSt('humanCapitals') >= 1},
  on_dois_eliminados:{cat:'on_dificil', icon:'💀', n:'Rivais a menos', d:'Elimine 2 jogadores humanos', check:()=>onSt('humanKills') >= 2},
  on_15pct:{cat:'on_dificil', icon:'🌍', n:'Potência continental', d:'Controle 15% das terras do mundo numa partida online', check:()=>G.online && worldShare() >= 0.15},
  on_lider_2anos:{cat:'on_dificil', icon:'📈', n:'Líder do placar', d:'Fique em 1º na pontuação entre os jogadores por 24 meses seguidos', check:()=>onSt('onLeadStreak') >= 24},
  on_tres_fronteiras:{cat:'on_dificil', icon:'🧭', n:'Encruzilhada', d:'Faça fronteira com 3 jogadores sem estar em guerra com nenhum', check:()=>onBorders() >= 3 && !onRivals().some(n=>n.atWar)},
  on_duas_frentes:{cat:'on_dificil', icon:'🔥', n:'Duas frentes', d:'Sobreviva 12 meses em guerra com 2 jogadores ao mesmo tempo', check:()=>onSt('onMultiWarMonths') >= 12},
  on_200_regioes:{cat:'on_dificil', icon:'⚔️', n:'Rolo compressor', d:'Conquiste 200 regiões de outros jogadores', check:()=>onSt('humanCells') >= 200},
  on_intocavel:{cat:'on_dificil', icon:'🧿', n:'Intocável', d:'Jogue 10 anos online sem perder nenhuma região para outro jogador', check:()=>onYears() >= 10 && onSt('humanCellsLost') === 0},
  on_ilha_rica:{cat:'on_dificil', icon:'🏝️', n:'Ilha de ouro', d:'Começando como ilha, tenha o maior PIB numa sala com 3+ jogadores', check:()=>P_().isIsland && onTop('gdp', 3)},
  on_vinte_anos:{cat:'on_dificil', icon:'⌛', n:'Geração online', d:'Jogue 20 anos numa partida online', check:()=>onYears() >= 20},

  // ---------------- Lendárias ----------------
  on_imperador:{cat:'on_lenda', icon:'👑', n:'Imperador dos jogadores', d:'Elimine 4 jogadores humanos', check:()=>onSt('humanKills') >= 4},
  on_30pct:{cat:'on_lenda', icon:'🌐', n:'Senhor do mundo', d:'Controle 30% das terras do mundo numa partida online', check:()=>G.online && worldShare() >= 0.30},
  on_lider_decada:{cat:'on_lenda', icon:'🏆', n:'Década de ouro', d:'Fique em 1º na pontuação entre os jogadores por 120 meses seguidos', check:()=>onSt('onLeadStreak') >= 120},
  on_tres_capitais:{cat:'on_lenda', icon:'🗡️', n:'Colecionador de tronos', d:'Capture as capitais de 3 jogadores', check:()=>onSt('humanCapitals') >= 3},
  on_pax:{cat:'on_lenda', icon:'🕊️', n:'Pax Imperium', d:'Numa sala com 5 jogadores, seja aliado de todos os outros 4', check:()=>onSeats() >= 5 && onRivals().filter(n=>n.alive && n.alliance).length >= 4},
  on_invicto:{cat:'on_lenda', icon:'💪', n:'Invicto entre humanos', d:'Vença 25 batalhas contra jogadores sem perder nenhuma', check:()=>onSt('humanWins') >= 25 && onSt('humanLosses') === 0},
  on_davi:{cat:'on_lenda', icon:'🪨', n:'Davi e Golias', d:'Capture a capital de um jogador com exército 50% maior que o seu', check:()=>onSt('onDavid') >= 1},
  on_relampago_campeao:{cat:'on_lenda', icon:'⚡', n:'Campeão relâmpago', d:'Vença o Modo com Objetivos numa sala Relâmpago com 3+ jogadores', check:()=>G.online && G.objMode==='objetivos' && G.victory && onSeats() >= 3 && ON.room && ON.room.speed === 20},
  on_meio_seculo:{cat:'on_lenda', icon:'📜', n:'Meio século de mesa', d:'Jogue 50 anos numa partida online', check:()=>onYears() >= 50}
};
for (const k in ACH_ONLINE){ ACH_EXTRA[k] = ACH_ONLINE[k]; ACHIEVEMENTS[k] = ACH_ONLINE[k]; }

// Contadores mensais das conquistas online (chamado a cada mês online)
function onlineAchTick(){
  if (!G || !G.online || G.over) return;
  const s = G.stats, sp = ON.room && ON.room.speed;
  if (sp === 20) s.onFastMonths = (s.onFastMonths||0) + 1;
  if (sp === 300) s.onSlowMonths = (s.onSlowMonths||0) + 1;
  s.onLeadStreak = onTop('score', 2) ? (s.onLeadStreak||0) + 1 : 0;
  s.onMultiWarMonths = onRivals().filter(n=>n.alive && n.atWar).length >= 2 ? (s.onMultiWarMonths||0) + 1 : 0;
}
