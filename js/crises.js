// ============================================================
//  IMPERIUM — Crises econômicas globais
//  • Históricas: Pânico de 1873, Grande Depressão (1929),
//    Crise do Petróleo (1973) e Crise Financeira (2008)
//  • Fora dessas datas, pânicos financeiros raros e aleatórios
//  • Atingem todo o mundo; quem tem dívida alta, inflação alta
//    ou depende de comércio sofre mais. Exportadores de petróleo
//    ganham na crise do petróleo.
// ============================================================
'use strict';

const CRISES = {
  panico1873: {year:1873, month:4, icon:'📉', n:'Pânico de 1873', months:36, depth:1.0,
    d:'A bolsa de Viena desaba e o pânico atravessa o oceano: bancos quebram em cadeia e começa a "Longa Depressão".',
    resp:[
      {t:'Socorrer os bancos', h:'+dívida, a crise passa mais rápido', f:v => { G.p.debt += G.p.gdp*0.03*v; return {growth:0.5}; }},
      {t:'Padrão-ouro e austeridade', h:'-apoio, +estabilidade, dívida protegida', f:() => { G.p.approval -= 4; G.p.stability += 3; return {}; }},
      {t:'Tarifas protecionistas', h:'+apoio, -comércio por 3 anos', f:() => { G.p.approval += 3; addTemp({tradeMult:-0.2}, 36, 'Protecionismo'); return {}; }}
    ]},
  depressao1929: {year:1929, month:9, icon:'🏚️', n:'Grande Depressão', months:48, depth:1.8,
    d:'A Bolsa de Nova York quebra em outubro de 1929. Fábricas fecham, o desemprego explode e o comércio mundial cai pela metade.',
    resp:[
      {t:'Obras públicas e estímulo (como o New Deal)', h:'+dívida, bem menos desemprego e recuperação mais rápida', f:v => { G.p.debt += G.p.gdp*0.06*v; addTemp({unemployment:-3}, 36, 'Obras públicas'); return {growth:0.8}; }},
      {t:'Austeridade: cortar gastos', h:'-apoio, -estabilidade, dívida protegida', f:() => { G.p.approval -= 6; G.p.stability -= 4; return {}; }},
      {t:'Comprar e queimar o excedente (como o café em 1931)', h:'Protege os produtores: +apoio, custo no tesouro', f:() => { G.p.treasury -= G.p.gdp*0.01; G.p.approval += 4; return {growth:0.3}; }}
    ]},
  petroleo1973: {year:1973, month:9, icon:'🛢️', n:'Crise do Petróleo', months:30, depth:1.2, oil:true,
    d:'Os países exportadores cortam a produção e o preço do barril quadruplica. Inflação e recessão ao mesmo tempo ("estagflação").',
    resp:[
      {t:'Combustível nacional (como o Proálcool)', h:'Custa caro agora, protege no futuro', f:() => { G.p.treasury -= G.p.gdp*0.015; addTemp({growth:0.3}, 120, 'Combustível nacional'); return {growth:0.2}; }},
      {t:'Racionamento e horário de verão', h:'-apoio, a inflação sobe menos', f:() => { G.p.approval -= 3; return {inflation:-2}; }},
      {t:'Pegar empréstimos e seguir crescendo', h:'+dívida (os juros podem cobrar a conta depois)', f:v => { G.p.debt += G.p.gdp*0.05*v; return {growth:0.6}; }}
    ]},
  financeira2008: {year:2008, month:8, icon:'🏦', n:'Crise Financeira de 2008', months:30, depth:1.4,
    d:'O banco Lehman Brothers quebra e o crédito congela no mundo inteiro. As bolsas despencam e o comércio internacional encolhe.',
    resp:[
      {t:'Socorrer os bancos', h:'+dívida, evita o colapso do crédito', f:v => { G.p.debt += G.p.gdp*0.05*v; G.p.approval -= 2; return {growth:0.6}; }},
      {t:'Estímulo ao consumo e juros baixos', h:'+apoio, +inflação', f:() => { G.p.approval += 3; G.p.printBoost = (G.p.printBoost||0) + 4; return {growth:0.4}; }},
      {t:'Deixar o mercado se ajustar', h:'Recessão mais funda, dívida protegida', f:() => ({growth:-0.3})}
    ]}
};
const CRISIS_RANDOM = {icon:'💥', n:'Pânico financeiro mundial', months:18, depth:0.8,
  d:'Uma bolha especulativa estoura num grande centro financeiro e o medo se espalha pelos mercados do mundo.',
  resp:[
    {t:'Socorrer os bancos', h:'+dívida, a crise passa mais rápido', f:v => { G.p.debt += G.p.gdp*0.03*v; return {growth:0.4}; }},
    {t:'Austeridade', h:'-apoio, dívida protegida', f:() => { G.p.approval -= 4; return {}; }},
    {t:'Esperar passar', h:'Sem custo imediato', f:() => ({})}
  ]};
const crisisDef = id => CRISES[id] || CRISIS_RANDOM;

// quão exposta está a nossa economia
function crisisExposure(c){
  const p = G.p, m = p.mods || calcMods();
  const debtR = p.debt / Math.max(1, p.gdp);
  let v = 0.7 + Math.min(1.2, debtR*0.6) + Math.max(0, p.inflation - 5)*0.03 + Math.max(0, m.tradeMult)*0.3;
  if (c.oil) v += p.resources.includes('petroleo') ? -0.9 : 0.3;
  return clamp(v, 0.2, 2.6);
}
const exposureLabel = v => v >= 1.6 ? 'muito alta' : v >= 1.15 ? 'alta' : v >= 0.75 ? 'média' : 'baixa';

function crisisStart(id){
  const c = crisisDef(id), p = G.p;
  G.crisis = {id, until:G.turn + c.months, start:G.turn};
  (G.crisesDone = G.crisesDone || {})[id] = G.turn;
  const v = crisisExposure(c);
  // impacto imediato no nosso país
  p.basePc *= 1 - (c.oil && p.resources.includes('petroleo') ? -0.03 : 0.035*c.depth*v);
  addTemp({growth:-1.4*c.depth*v, unemployment:2*c.depth*v, taxEff:-0.06*c.depth}, c.months, c.n);
  if (c.oil) addTemp({inflation:4}, c.months, c.n + ' (preços)');
  p.approval -= 3*c.depth; p.stability -= 2*c.depth;
  // resto do mundo (no online, só o anfitrião)
  if (!G.online || G.online.host) for (const n of G.nations){ if (!n || n.id < 2 || !n.alive || n.human) continue;
    const oilX = c.oil && (n.res||[]).includes('petroleo'); n.pc *= oilX ? 1.06 : 1 - 0.05*c.depth*(0.6 + Math.random()*0.8); }
  addNews(`${c.icon} ${c.n}: economias do mundo inteiro em queda!`);
  addLog(`${c.icon} Começa a ${c.n}. Nossa exposição: ${exposureLabel(v)}.`, 'bad');
  queueEvent('crise_global', {id, v});
}

EVENTS.crise_global = {icon:'📉', title:'Crise Mundial', special:true,
  text:d => { const c = crisisDef(d.id), p = G.p;
    return `<b>${c.icon} ${c.n}.</b> ${c.d}<br><br><small>Nossa exposição: <b>${exposureLabel(d.v)}</b> — dívida ${Math.round(p.debt/Math.max(1,p.gdp)*100)}% do PIB, inflação ${fmtPct(p.inflation)}${c.oil ? (p.resources.includes('petroleo') ? ', e <b>exportamos petróleo</b> (vamos lucrar!)' : ', e dependemos de petróleo importado') : ''}. Duração esperada: ${Math.round(c.months/12*10)/10} anos.</small>`; },
  choices:d => crisisDef(d.id).resp.map(r => ({t:r.t, h:r.h, f:() => { const fx = r.f(d.v) || {}; if (fx.growth || fx.inflation) addTemp({growth:fx.growth||0, inflation:fx.inflation||0}, Math.round(crisisDef(d.id).months*0.8), 'Resposta à crise'); }}))};

const _crEnd = endTurn;
endTurn = function(){
  _crEnd.apply(this, arguments);
  if (!G || G.over || !G.p) return;
  const y = curYear(), mo = curMonth(), done = G.crisesDone = G.crisesDone || {};
  if (G.crisis && G.turn >= G.crisis.until){ addLog(`📈 A ${crisisDef(G.crisis.id).n} chegou ao fim: a economia mundial volta a crescer.`, 'good'); addNews('A economia mundial se recupera.'); G.crisis = null; }
  if (G.crisis) return;
  for (const id in CRISES){ const c = CRISES[id]; if (!done[id] && y === c.year && mo >= c.month && G.startYear <= c.year){ crisisStart(id); return; } }
  // pânicos aleatórios: raros, longe das crises históricas
  const last = Math.max(-999, ...Object.values(done));
  const nearHist = Object.values(CRISES).some(c => Math.abs(c.year - y) <= 6);
  if (!nearHist && G.turn - last > 15*12 && G.turn > 36 && chance(0.0025)) crisisStart('aleatoria_' + G.turn);
};
