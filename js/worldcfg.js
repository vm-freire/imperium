// ============================================================
//  IMPERIUM — Configuração do mundo
//  Aparece depois de escolher o modo de jogo. Facilita ou dificulta
//  a partida e define quantos países existem.
// ============================================================
'use strict';

const WORLD_OPTS = {
  countries:{n:'🌍 Países no mundo', d:'Quantos países a IA controla. Menos países deixa o jogo mais leve e o mapa mais simples.', o:{
    principais:{n:'Principais (~45)', v:45}, muitos:{n:'Muitos (~90)', v:90}, todos:{n:'Todos os reais', v:999}}},
  absent:{n:'🗺️ Terras dos países que ficaram de fora', d:'Quando você escolhe menos países, o que acontece com as terras dos que ficaram de fora.', o:{
    vizinhos:{n:'Divididas entre os vizinhos', v:'vizinhos'}, livre:{n:'Ficam livres para colonizar', v:'livre'}}},
  aggression:{n:'⚔️ Agressividade da IA', d:'Com que frequência as outras nações declaram guerra e atacam.', o:{
    pacifica:{n:'Pacífica', v:0.5}, normal:{n:'Normal', v:1}, agressiva:{n:'Agressiva', v:1.5}, brutal:{n:'Brutal', v:2.2}}},
  money:{n:'💰 Cofre inicial', d:'Quanto dinheiro você tem no começo.', o:{
    pobre:{n:'Pobre (metade)', v:0.5}, normal:{n:'Normal', v:1}, rico:{n:'Rico (dobro)', v:2}, muito:{n:'Muito rico (5x)', v:5}}},
  research:{n:'🔬 Velocidade da pesquisa', d:'Quanto tempo as tecnologias levam para ficar prontas.', o:{
    lenta:{n:'Lenta', v:0.65}, normal:{n:'Normal', v:1}, rapida:{n:'Rápida', v:1.5}, muito:{n:'Muito rápida', v:2.2}}},
  people:{n:'😊 Humor do povo', d:'Povo exigente reclama mais; povo paciente aceita mais sacrifícios.', o:{
    exigente:{n:'Exigente', v:-8}, normal:{n:'Normal', v:0}, paciente:{n:'Paciente', v:8}}},
  events:{n:'🎲 Frequência de eventos', d:'Crises, oportunidades e surpresas a cada mês.', o:{
    raros:{n:'Raros', v:0.5}, normais:{n:'Normais', v:1}, frequentes:{n:'Frequentes', v:1.8}}},
  disasters:{n:'🌋 Desastres naturais', d:'Terremotos, furacões, secas e outros, conforme a geografia.', o:{
    desligados:{n:'Desligados', v:0}, raros:{n:'Raros', v:0.5}, normais:{n:'Normais', v:1}, fortes:{n:'Frequentes', v:2}}},
  leaders:{n:'👤 Líderes históricos', d:'As outras nações usam governantes reais da época (até 2030).', o:{
    sim:{n:'Sim', v:true}, nao:{n:'Não, inventar nomes', v:false}}}
};
const WORLD_PRESETS = {
  facil:{n:'🙂 Fácil', d:'IA calma, cofre cheio, pesquisa rápida e povo paciente.', s:{countries:'muitos', absent:'vizinhos', aggression:'pacifica', money:'rico', research:'rapida', people:'paciente', events:'raros', disasters:'raros', leaders:'sim'}},
  normal:{n:'⚖️ Normal', d:'O equilíbrio pensado para o jogo.', s:{countries:'todos', absent:'vizinhos', aggression:'normal', money:'normal', research:'normal', people:'normal', events:'normais', disasters:'normais', leaders:'sim'}},
  dificil:{n:'🔥 Difícil', d:'IA agressiva, pouco dinheiro, pesquisa lenta e povo exigente.', s:{countries:'todos', absent:'vizinhos', aggression:'agressiva', money:'pobre', research:'lenta', people:'exigente', events:'frequentes', disasters:'fortes', leaders:'sim'}},
  brutal:{n:'💀 Brutal', d:'Para quem quer sofrer: tudo contra você.', s:{countries:'todos', absent:'vizinhos', aggression:'brutal', money:'pobre', research:'lenta', people:'exigente', events:'frequentes', disasters:'fortes', leaders:'sim'}}
};
function defaultWorld(){ return Object.assign({}, WORLD_PRESETS.normal.s); }
// valor numérico de uma opção na partida atual
function worldVal(k){
  const w = (G && G.world) || defaultWorld(), O = WORLD_OPTS[k];
  const o = O && (O.o[w[k]] || O.o[defaultWorld()[k]]);
  return o ? o.v : 1;
}
function worldMods(m){ const v = worldVal('people'); if (v){ m.approval += v; m.stability += v / 2; } }

// ------------------------------------------------------------
//  Tela
// ------------------------------------------------------------
function openWorldConfig(next, back){
  C.world = C.world || defaultWorld();
  const w = C.world;
  const preset = Object.keys(WORLD_PRESETS).find(k=>Object.entries(WORLD_PRESETS[k].s).every(([a,b])=>w[a]===b)) || 'personalizado';
  const m = openModal(`<div class="m-icon">🌐</div><div class="m-title">Configuração do mundo</div>
    <div class="m-text">Escolha uma dificuldade pronta ou ajuste cada detalhe.</div>
    <div class="wc-presets">${Object.entries(WORLD_PRESETS).map(([k,p])=>`<div class="mode-card ${preset===k?'sel':''}" data-wp="${k}"><b>${p.n}</b><span>${p.d}</span></div>`).join('')}</div>
    <div class="wc-grid">${Object.entries(WORLD_OPTS).map(([k,O])=>`<div class="wc-opt"><div class="lbl">${O.n}</div><div class="help">${O.d}</div>
      <div class="av-opts">${Object.entries(O.o).map(([v,o])=>`<button class="av-op ${w[k]===v?'on':''}" data-wk="${k}" data-wv="${v}">${o.n}</button>`).join('')}</div></div>`).join('')}</div>
    <div class="m-actions"><button class="btn" id="wc-x">Voltar</button><button class="btn green" id="wc-ok">Continuar ➜</button></div>`, {wide:true});
  m.querySelectorAll('[data-wp]').forEach(b=> b.onclick = ()=>{ SFX.click(); C.world = Object.assign({}, WORLD_PRESETS[b.dataset.wp].s); openWorldConfig(next, back); });
  m.querySelectorAll('[data-wk]').forEach(b=> b.onclick = ()=>{ SFX.click(); w[b.dataset.wk] = b.dataset.wv; openWorldConfig(next, back); });
  m.querySelector('#wc-x').onclick = ()=>{ SFX.click(); closeModal(); if (back) back(); };
  m.querySelector('#wc-ok').onclick = ()=>{ SFX.page(); closeModal(); next(); };
}

// ------------------------------------------------------------
//  Ganchos nas regras do jogo
// ------------------------------------------------------------
if (typeof disasterWeight === 'function'){ const _dw = disasterWeight; disasterWeight = function(k){ return _dw(k) * worldVal('disasters'); }; }
if (typeof techSpeed === 'function'){ const _ts = techSpeed; techSpeed = function(id){ return _ts(id) * worldVal('research'); }; }
if (typeof realLeaderAt === 'function'){ const _rl = realLeaderAt; realLeaderAt = function(key, year){ return worldVal('leaders') === false ? null : _rl(key, year); }; }
