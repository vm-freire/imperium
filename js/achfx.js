// ============================================================
//  IMPERIUM — Conquistas com consequências
//  • Aviso no canto inferior esquerdo, com som próprio
//  • Conquistas repetidas contam 2x, 3x...
//  • As conquistas importantes mudam o rumo do jogo (bom ou ruim)
// ============================================================
'use strict';

// ---------------- Som ----------------
SFX.trophy = function(tier){
  if (tier === 'lenda'){
    this.tone(130.8, 2.4, 'sine', 0.12, null, 0, null, 0.4);
    this.tone(196, 2.2, 'triangle', 0.06, null, 0.05, null, 0.4);
    [523, 659, 784, 1046, 1318, 1568].forEach((f, i)=>this.tone(f, 1.2, 'sine', 0.07, null, i*0.11, null, 0.02));
    [2093, 2637].forEach((f, i)=>this.tone(f, 0.9, 'sine', 0.03, null, 0.75 + i*0.12));
    this.noise(0.6, 0.04, 6000, 0.7, 0.5, 'highpass');
  } else if (tier === 'repete'){
    [784, 1046].forEach((f, i)=>this.tone(f, 0.6, 'sine', 0.07, null, i*0.12, null, 0.02));
    this.tone(1568, 0.5, 'sine', 0.03, null, 0.24);
  } else {
    [659, 880, 1109, 1318].forEach((f, i)=>this.tone(f, 0.8, 'sine', 0.065, null, i*0.09, null, 0.02));
    this.tone(2637, 0.6, 'sine', 0.025, null, 0.36);
    this.noise(0.3, 0.03, 7000, 0.3, 0.5, 'highpass');
    if (tier === 'importante') this.tone(220, 1.2, 'triangle', 0.06, null, 0, null, 0.2);
  }
};

// ---------------- Rumos do mundo (bandeiras com prazo) ----------------
const achFlag = k => G && G.achFlags && (G.achFlags[k]||0) > G.turn;
function setAchFlag(k, months){ G.achFlags = G.achFlags || {}; G.achFlags[k] = Math.max(G.achFlags[k]||0, G.turn + months); }
// multiplicador da chance de uma IA declarar guerra a nós
function achWarMult(n){
  let m = 1;
  if (achFlag('medo')) m *= 1.7;               // o mundo nos teme e se arma
  if (achFlag('dissuasao')) m *= 0.45;         // ninguém ousa atacar
  if (achFlag('paria')) m *= 1.3;
  if (achFlag('admiracao')) m *= 0.8;
  if (achFlag('ideologia') && n && GOVS[n.gov] && GOVS[n.gov].family === 'dem') m *= 1.4;
  return m;
}
// multiplicador de propostas de acordos e alianças vindas da IA
function achDipMult(){ let m = 1; if (achFlag('admiracao')) m *= 3; if (achFlag('paria')) m *= 0.3; if (achFlag('medo')) m *= 0.7; return m; }

const fxAIs = () => G.nations.filter(n=>n && n.id > 1 && n.alive && !n.human);
const fxRelAll = (v, filt) => fxAIs().filter(filt || (()=>true)).forEach(n=>changeRel(n, v));
const fxStrongest = (k) => fxAIs().sort((a,b)=>b.power-a.power).slice(0, k);
const fxIsDem = n => GOVS[n.gov] && GOVS[n.gov].family === 'dem';
const fxNeighbors = () => fxAIs().filter(n=>adjacent(1, n.id));

// Cada efeito: tom (bom/ruim/misto), título, texto e aplicação (k = força: 1 na primeira vez, 0,6 nas repetições)
const ACH_FX = {
  // ---- guerra ----
  capital_inimiga:{tone:'misto', t:'Medo nas capitais', d:'Moral das tropas em alta, mas os vizinhos passam a desconfiar e se armar.', f:k=>{ addTemp({military:0.05*k}, 12, 'Capital inimiga tomada'); fxNeighbors().forEach(n=>changeRel(n, -5*k)); setAchFlag('medo', 12); }},
  tres_capitais:{tone:'ruim', t:'Coalizão em formação', d:'As nações rivais se aproximam contra nós. Mais chance de guerra pelos próximos 2 anos.', f:k=>{ fxRelAll(-8*k, n=>n.rel < 20); addTemp({military:0.08*k}, 24, 'Máquina de guerra'); setAchFlag('medo', 24); }},
  imperador_mundo:{tone:'ruim', t:'O mundo se une contra você', d:'As duas maiores potências viram inimigas declaradas. O povo, porém, se orgulha.', f:k=>{ fxStrongest(2).forEach(n=>changeRel(n, -25*k)); addTemp({stability:5*k}, 24, 'Orgulho imperial'); setAchFlag('medo', 36); addNews(`Potências mundiais discutem conter ${G.p.name}.`); }},
  invicto:{tone:'bom', t:'Exército lendário', d:'+10% de força militar e +3 de apoio por 2 anos.', f:k=>addTemp({military:0.1*k, approval:3*k}, 24, 'Exército invicto')},
  guerra_mundial:{tone:'misto', t:'Nação endurecida', d:'O povo aguenta melhor a guerra (+4 estabilidade), mas a economia cresce menos por 1 ano.', f:k=>{ addTemp({stability:4*k, warWeary:-0.3*k}, 24, 'Calejados pela guerra'); addTemp({growth:-0.2*k}, 12, 'Economia de guerra'); }},
  muralha:{tone:'bom', t:'Fortaleza inexpugnável', d:'+10% de defesa por 3 anos. Os inimigos pensam duas vezes antes de atacar.', f:k=>{ addTemp({defense:0.1*k}, 36, 'Muralha viva'); setAchFlag('dissuasao', 24); }},
  cem_vitorias:{tone:'misto', t:'Militarismo', d:'+10% de força, mas o mundo nos vê como ameaça e o povo cansa da farda (−2 apoio).', f:k=>{ addTemp({military:0.1*k, approval:-2*k}, 36, 'Militarismo'); setAchFlag('medo', 24); }},
  reparacoes:{tone:'bom', t:'Vencedor respeitado', d:'+2 de estabilidade por 1 ano.', f:k=>addTemp({stability:2*k}, 12, 'Reparações recebidas')},
  // ---- território ----
  dez_porcento:{tone:'misto', t:'Potência regional', d:'+5% de comércio por 2 anos, mas os vizinhos ficam alertas.', f:k=>{ addTemp({tradeMult:0.05*k}, 24, 'Potência regional'); fxNeighbors().forEach(n=>changeRel(n, -4*k)); setAchFlag('medo', 12); }},
  hegemonia:{tone:'ruim', t:'Hegemon mundial', d:'Todas as nações desconfiam de nós (−10 de relação) e o risco de guerra sobe por 4 anos.', f:k=>{ fxRelAll(-10*k); setAchFlag('medo', 48); }},
  metade_mundo:{tone:'misto', t:'Senhor de meio mundo', d:'Arrecadação maior (+8%), mas administrar tanto território abala a estabilidade (−6).', f:k=>{ addTemp({taxEff:0.08*k, stability:-6*k}, 60, 'Império gigantesco'); setAchFlag('medo', 60); }},
  cinquenta_estados:{tone:'misto', t:'Federação gigante', d:'+5% de administração, mas a corrupção cresce (+3%).', f:k=>addTemp({admin:0.05*k, corruption:0.03*k}, 36, 'Federação gigante')},
  // ---- economia ----
  maior_economia:{tone:'misto', t:'Inveja global', d:'Investidores chegam (+6% comércio e mais propostas de acordo), mas as outras potências ficam enciumadas.', f:k=>{ addTemp({tradeMult:0.06*k}, 24, 'Maior economia do mundo'); fxStrongest(3).forEach(n=>changeRel(n, -5*k)); setAchFlag('admiracao', 24); }},
  superpotencia:{tone:'misto', t:'Superpotência', d:'Admiração e medo ao mesmo tempo: mais acordos e mais rivais.', f:k=>{ setAchFlag('admiracao', 36); setAchFlag('medo', 24); addTemp({tradeMult:0.06*k, research:0.04*k}, 36, 'Superpotência'); }},
  cofre_cheio:{tone:'misto', t:'Credor do mundo', d:'+4% de comércio, mas o povo cobra mais gastos sociais (−2 apoio).', f:k=>addTemp({tradeMult:0.04*k, approval:-2*k}, 24, 'Cofre cheio')},
  caloteiro:{tone:'ruim', t:'Calote internacional', d:'−10% de comércio por 3 anos e −10 de relação com todos. Ninguém quer nos emprestar.', f:k=>{ addTemp({tradeMult:-0.1*k}, 36, 'Fama de caloteiro'); fxRelAll(-10*k); setAchFlag('paria', 24); }},
  metade_riqueza:{tone:'misto', t:'Hiperpotência', d:'O mundo depende de nós: muitos acordos, mas também muitos rivais.', f:k=>{ setAchFlag('admiracao', 48); setAchFlag('medo', 36); addTemp({gdpMult:0.04*k}, 48, 'Hiperpotência'); }},
  industrializado:{tone:'misto', t:'Chaminés por toda parte', d:'+3% de PIB, mas a poluição custa saúde (−0,05 de crescimento populacional).', f:k=>addTemp({gdpMult:0.03*k, popGrowth:-0.05*k}, 36, 'Industrialização')},
  // ---- ciência ----
  atomico:{tone:'misto', t:'Dissuasão nuclear', d:'Quase ninguém ousa nos atacar por 5 anos, mas o mundo nos olha com receio (−8 de relação).', f:k=>{ setAchFlag('dissuasao', 60); fxRelAll(-8*k); }},
  espacial:{tone:'bom', t:'Corrida espacial', d:'+8% de pesquisa e +4 de apoio por 3 anos.', f:k=>addTemp({research:0.08*k, approval:4*k}, 36, 'Glória espacial')},
  ia:{tone:'misto', t:'Automação', d:'+4% de PIB, mas o desemprego sobe (+2%).', f:k=>addTemp({gdpMult:0.04*k, unemployment:2*k}, 24, 'Automação')},
  internet:{tone:'bom', t:'Nação conectada', d:'+4% de pesquisa por 2 anos.', f:k=>addTemp({research:0.04*k}, 24, 'Internet')},
  todas_tecnologias:{tone:'bom', t:'Farol da ciência', d:'Cientistas do mundo inteiro vêm para cá: +10% de pesquisa e mais acordos.', f:k=>{ addTemp({research:0.1*k}, 60, 'Farol da ciência'); setAchFlag('admiracao', 36); }},
  // ---- diplomacia e bem ----
  pacifista:{tone:'bom', t:'Nação da paz', d:'+8 de relação com todos e mais propostas de acordos, mas o exército relaxa (−5%).', f:k=>{ fxRelAll(8*k); setAchFlag('admiracao', 36); addTemp({military:-0.05*k}, 24, 'Tradição pacífica'); }},
  seculo_paz:{tone:'bom', t:'Século de paz', d:'Respeito mundial: +10 de relação com todos e +5 de estabilidade.', f:k=>{ fxRelAll(10*k); setAchFlag('admiracao', 60); addTemp({stability:5*k}, 60, 'Século de paz'); }},
  amigo_de_todos:{tone:'bom', t:'Amigo de todos', d:'+8% de comércio e muito mais propostas por 4 anos.', f:k=>{ setAchFlag('admiracao', 48); addTemp({tradeMult:0.08*k}, 48, 'Amigo de todos'); }},
  amado_por_todos:{tone:'bom', t:'Amado pelo mundo', d:'Ninguém quer guerra conosco e todos querem negociar.', f:k=>{ setAchFlag('admiracao', 60); setAchFlag('dissuasao', 36); }},
  tres_aliancas:{tone:'misto', t:'Bloco de aliados', d:'Mais segurança, mas os rivais dos nossos aliados viram nossos rivais (−6).', f:k=>{ fxRelAll(-6*k, n=>!n.alliance && n.rel < 10); setAchFlag('dissuasao', 18); }},
  oito_aliancas:{tone:'misto', t:'Liga das nações', d:'Quase intocáveis, mas quem ficou de fora se sente cercado.', f:k=>{ setAchFlag('dissuasao', 48); fxRelAll(-10*k, n=>!n.alliance); }},
  traidor:{tone:'ruim', t:'Traidor', d:'Ninguém confia em nós: −15 de relação com todos e quase nenhuma proposta por 4 anos.', f:k=>{ fxRelAll(-15*k); setAchFlag('paria', 48); }},
  espiao_mestre:{tone:'misto', t:'Rede de espiões', d:'+3% de pesquisa, mas as nações ficam paranoicas (−4).', f:k=>{ addTemp({research:0.03*k}, 24, 'Espionagem'); fxRelAll(-4*k); }},
  idh_900:{tone:'bom', t:'Destino de imigrantes', d:'Gente do mundo todo quer viver aqui: +0,1 de crescimento populacional e +2 de estabilidade.', f:k=>addTemp({popGrowth:0.1*k, stability:2*k}, 36, 'Ímã de imigrantes')},
  bem_estar:{tone:'bom', t:'Estado de bem-estar', d:'+3 de apoio por 2 anos.', f:k=>addTemp({approval:3*k}, 24, 'Bem-estar')},
  democracia_exemplar:{tone:'bom', t:'Democracia modelo', d:'As democracias nos admiram (+10) e mandam mais propostas.', f:k=>{ fxRelAll(10*k, fxIsDem); setAchFlag('admiracao', 36); }},
  verde:{tone:'bom', t:'Créditos de carbono', d:'+5% de comércio e +2 de apoio por 3 anos.', f:k=>addTemp({tradeMult:0.05*k, approval:2*k}, 36, 'Nação verde')},
  idh_950:{tone:'bom', t:'Paraíso na Terra', d:'+5 de estabilidade, +4 de apoio e admiração mundial.', f:k=>{ addTemp({stability:5*k, approval:4*k}, 60, 'Paraíso na Terra'); setAchFlag('admiracao', 48); }},
  // ---- lado sombrio ----
  destruidor:{tone:'ruim', t:'Pária internacional', d:'−12 de relação com todos e −6% de comércio por 3 anos.', f:k=>{ fxRelAll(-12*k); addTemp({tradeMult:-0.06*k}, 36, 'Pária'); setAchFlag('paria', 36); }},
  grande_irmao:{tone:'misto', t:'Estado vigilante', d:'+5 de estabilidade, mas −4 de apoio e as democracias se afastam (−10).', f:k=>{ addTemp({stability:5*k, approval:-4*k}, 36, 'Vigilância'); fxRelAll(-10*k, fxIsDem); setAchFlag('ideologia', 36); }},
  tirano_impopular:{tone:'ruim', t:'Ódio nas ruas', d:'−6 de estabilidade por 2 anos: risco de revolta.', f:k=>addTemp({stability:-6*k}, 24, 'Tirania')},
  autogolpe:{tone:'ruim', t:'Sanções internacionais', d:'−8% de comércio por 3 anos e as democracias ficam mais dispostas a nos atacar.', f:k=>{ addTemp({tradeMult:-0.08*k}, 36, 'Sanções'); setAchFlag('ideologia', 48); setAchFlag('paria', 24); }},
  punho_de_ferro:{tone:'misto', t:'Ordem pela força', d:'+6 de estabilidade, mas −5 de apoio.', f:k=>addTemp({stability:6*k, approval:-5*k}, 24, 'Punho de ferro')},
  senhor_da_guerra:{tone:'misto', t:'Senhor da guerra', d:'+8% de força militar, mas o mundo nos teme por 3 anos.', f:k=>{ addTemp({military:0.08*k}, 36, 'Senhor da guerra'); setAchFlag('medo', 36); }},
  // ---- política ----
  reeleito:{tone:'bom', t:'Mandato renovado', d:'+3 de apoio por 2 anos.', f:k=>addTemp({approval:3*k}, 24, 'Reeleição')},
  reformador:{tone:'bom', t:'Espírito reformista', d:'+0,2 de crescimento econômico por 2 anos.', f:k=>addTemp({growth:0.2*k}, 24, 'Reformas')},
  // ---- lendárias ----
  deus_da_guerra:{tone:'misto', t:'Deus da guerra', d:'+15% de força para sempre, mas todos tremem e se armam.', f:k=>{ addTemp({military:0.15*k}, 120, 'Deus da guerra'); setAchFlag('medo', 60); fxRelAll(-6*k); }},
  dez_anexacoes:{tone:'ruim', t:'Coalizão mundial', d:'As três maiores potências viram inimigas mortais. Prepare-se.', f:k=>{ fxStrongest(3).forEach(n=>changeRel(n, -30*k)); setAchFlag('medo', 60); addNews(`Coalizão mundial se forma contra ${G.p.name}!`); }},
  bilhao:{tone:'misto', t:'Gigante populacional', d:'+0,3 de crescimento econômico, mas superlotação (−4 de estabilidade).', f:k=>addTemp({growth:0.3*k, stability:-4*k}, 48, 'Um bilhão')},
  duzentos_anos:{tone:'bom', t:'Nação milenar', d:'+8 de estabilidade por 10 anos.', f:k=>addTemp({stability:8*k}, 120, 'Tradição de séculos')},
  fenix:{tone:'bom', t:'Renascida das cinzas', d:'+10% de moral militar e +5 de apoio por 3 anos.', f:k=>addTemp({military:0.1*k, approval:5*k}, 36, 'Fênix')},
  comunismo_global:{tone:'ruim', t:'Guerra Fria', d:'As democracias se unem contra nós (−25 de relação) e o risco de guerra com elas sobe.', f:k=>{ fxRelAll(-25*k, fxIsDem); setAchFlag('ideologia', 60); }},
  todas_maravilhas:{tone:'bom', t:'Turismo mundial', d:'+8% de comércio e +3 de apoio por 5 anos.', f:k=>addTemp({tradeMult:0.08*k, approval:3*k}, 60, 'Maravilhas do mundo')}
};

function achTier(id){ const a = ACHIEVEMENTS[id] || {}; if (a.cat === 'lendario' || a.cat === 'on_lenda') return 'lenda'; if (ACH_FX[id] || a.cat === 'on_dificil' || a.cat === 'desafio') return 'importante'; return 'normal'; }

// ---------------- Aviso no canto inferior esquerdo ----------------
const ACHQ = {q:[], busy:false};
function achToast(id, count, fx, repeat){ ACHQ.q.push({id, count, fx, repeat}); if (!ACHQ.busy) nextAchToast(); }
function nextAchToast(){
  const it = ACHQ.q.shift(); if (!it){ ACHQ.busy = false; return; }
  ACHQ.busy = true;
  const a = ACHIEVEMENTS[it.id] || {n:it.id, d:'', icon:'🏅'}, tier = achTier(it.id);
  const el = document.createElement('div'); el.className = `ach-toast ${tier}`;
  const sb = document.querySelector('#sidebar'), r = sb && !document.querySelector('#hud').classList.contains('hidden') ? sb.getBoundingClientRect() : null;
  el.style.left = (r && r.width ? r.right + 14 : 16) + 'px';
  el.innerHTML = `<div class="at-ic">${a.icon || '🏅'}</div><div class="at-tx">
    <div class="at-k">${it.repeat ? `🔁 Conquista feita de novo · ${it.count}x` : tier === 'lenda' ? '👑 Conquista LENDÁRIA' : '🏅 Conquista desbloqueada'}${!it.repeat && it.count > 1 ? ` · ${it.count}x` : ''}</div>
    <div class="at-n">${esc(a.n)}</div><div class="at-d">${esc(a.d)}</div>
    ${it.fx ? `<div class="at-fx ${it.fx.tone}"><b>${{bom:'✅',ruim:'⚠️',misto:'⚖️'}[it.fx.tone]} ${esc(it.fx.t)}</b> — ${esc(it.fx.d)}</div>` : ''}</div>`;
  el.onclick = () => el.classList.add('out');
  $('#app').appendChild(el);
  SFX.trophy(it.repeat ? 'repete' : tier);
  const stay = it.fx ? 7000 : 4500;
  setTimeout(()=>el.classList.add('out'), stay);
  setTimeout(()=>{ el.remove(); setTimeout(nextAchToast, 450); }, stay + 450);
}

// aplica a consequência e registra no diário
function applyAchFx(id, k){
  const fx = ACH_FX[id]; if (!fx || !G || !G.p) return null;
  try { fx.f(k); } catch(e){ console.warn('achfx', id, e); }
  addLog(`${{bom:'✅',ruim:'⚠️',misto:'⚖️'}[fx.tone]} Consequência da conquista "${ACHIEVEMENTS[id].n}": ${fx.t}. ${fx.d}`, fx.tone === 'ruim' ? 'bad' : fx.tone === 'bom' ? 'good' : 'info');
  if (typeof derive === 'function') derive();
  return fx;
}

// substitui o aviso antigo (canto direito) por este
onAchievement = function(id){
  const t = getTrophies(), count = (t[id] && t[id].count) || 1;
  G.achPrev = G.achPrev || {}; G.achPrev[id] = true; G.achLastAt = G.achLastAt || {}; G.achLastAt[id] = G.turn;
  const fx = applyAchFx(id, 1);
  achToast(id, count, fx, false);
};

// ---------------- Repetições na mesma partida ----------------
// Quando a situação de uma conquista já feita deixa de valer e depois volta a acontecer
// (com pelo menos 1 ano de intervalo), ela conta de novo.
function achRepeatTick(){
  if (!G || G.over) return;
  G.achPrev = G.achPrev || {}; G.achLastAt = G.achLastAt || {}; G.achReps = G.achReps || {};
  for (const id of G.achievements){
    const a = ACHIEVEMENTS[id]; if (!a || !a.check) continue;
    let v = false; try { v = !!a.check(); } catch(e){ continue; }
    const prev = G.achPrev[id];
    if (v && prev === false && G.turn - (G.achLastAt[id]||0) >= 12){
      saveTrophy(id); G.achReps[id] = (G.achReps[id]||1) + 1; G.achLastAt[id] = G.turn;
      const count = (getTrophies()[id] || {}).count || 2;
      const fx = applyAchFx(id, 0.6);
      addLog(`🔁 Conquista repetida: ${a.n} (${count}x).`, 'good');
      achToast(id, count, fx, true);
    }
    G.achPrev[id] = v;
  }
}
const _checkTrophiesBase = checkTrophies;
checkTrophies = function(){ _checkTrophiesBase(); achRepeatTick(); };
