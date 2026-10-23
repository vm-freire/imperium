// ============================================================
//  IMPERIUM — Desastres mais raros, variados e com prevenção
//  • Menos frequentes: pausa de 1 ano entre desastres e o
//    mesmo tipo raramente se repete em menos de 5 anos
//  • Cada desastre tem intensidade (leve, forte ou catastrófico)
//  • Prevenção: escolher obras de contenção, alertas, normas etc.
//    cria PROTEÇÃO permanente contra aquele tipo. Ela — junto com
//    o gasto em infraestrutura — diminui a chance e os estragos
//    dos próximos desastres
//  • Novo: deslizamentos de terra (relevo + chuva)
// ============================================================
'use strict';

const DISASTERS = {
  terremoto:{prot:'Normas antissísmicas', icon:'🏗️', choice:{t:'Reconstruir com normas antissísmicas', h:'+ proteção permanente contra terremotos', cost:0.02, app:3}},
  tsunami:{prot:'Sistema de alerta de tsunami', icon:'📡', grant:1},
  vulcao:{prot:'Monitoramento vulcânico', icon:'🛰️', choice:{t:'Monitoramento vulcânico e rotas de fuga', h:'+ proteção permanente contra erupções', cost:0.012, app:2}},
  furacao:{prot:'Diques e abrigos', icon:'🧱', choice:{t:'Diques, abrigos e casas reforçadas', h:'+ proteção permanente contra furacões', cost:0.018, app:3}},
  nevasca:{prot:'Plano de inverno', icon:'🔥', choice:{t:'Plano de inverno: aquecimento e estradas', h:'+ proteção permanente contra nevascas', cost:0.01, app:2}},
  incendio:{prot:'Brigadas e aceiros', icon:'🚒', choice:{t:'Brigadas permanentes e aceiros', h:'+ proteção permanente contra incêndios', cost:0.01, app:2}},
  gafanhotos:{prot:'Vigilância agrícola', icon:'🔎', choice:{t:'Vigilância agrícola permanente', h:'+ proteção permanente contra pragas', cost:0.006, app:1}},
  seca:{prot:'Açudes e cisternas', icon:'💧', choice:{t:'Construir açudes e cisternas', h:'+ proteção permanente contra secas', cost:0.015, app:2}},
  inundacao:{prot:'Obras de contenção', icon:'🌊', grant:0},
  deslizamento:{prot:'Contenção de encostas', icon:'⛰️', grant:0}
};
const SEV = [{n:'leve', k:0.6}, {n:'forte', k:1}, {n:'catastrófico', k:1.6}];

// proteção: nível de cada tipo + o gasto em infraestrutura (% do PIB)
function disProt(kind){ return (G.p.resil && G.p.resil[kind]) || 0; }
function disShield(kind){ return 1 + disProt(kind)*0.35 + Math.max(0, (G.p.spend.infra||0) - 2)*0.05 + (G.p.techs.includes('computador') ? 0.1 : 0); }
function disMult(d){ return (SEV[d.sev != null ? d.sev : 1].k) / disShield(d.kind); }

// chance: bem menor, com pausa entre desastres e proteção diminuindo o risco
function disAdjust(kind, w){
  const p = G.p; if (!w) return 0;
  if (G.turn - (p.lastDisaster == null ? -999 : p.lastDisaster) < 12) return 0;
  const lk = (p.lastKind || {})[kind]; if (lk != null && G.turn - lk < 60) w *= 0.25;
  return w * 0.9 / disShield(kind);
}
const _dwBase = disasterWeight;
disasterWeight = function(kind){ return disAdjust(kind, _dwBase(kind)); };
EVENTS.deslizamento = {icon:'⛰️', title:'Deslizamentos de Terra', w:()=>{
    const p = G.p, g = typeof geoProfile === 'function' ? geoProfile() : {};
    const base = (p.terrain === 'montanhoso' ? 0.5 : 0.1) + ((p.realClimate || p.climate) === 'tropical' ? 0.3 : 0) + (g.forest||0)*0.2;
    return disAdjust('deslizamento', base) * (typeof worldVal === 'function' ? worldVal('disasters') : 1); },
  prep:d=>{d.s=randState(); return d;},
  text:d=>`Chuvas fortes fizeram encostas desabarem em ${d.s}. Casas foram soterradas e estradas ficaram bloqueadas.`,
  choices:()=>[
    {t:'Contenção de encostas e drenagem', h:`-${mny(0.012)}, +2 apoio`, f:()=>{ pay(0.012); app(2); }},
    {t:'Remover famílias das áreas de risco', h:`-${mny(0.006)}, -2 apoio`, f:()=>{ pay(0.006); app(-2); }},
    {t:'Só o resgate', h:'-5 apoio, vítimas', f:()=>{ app(-5); G.p.pop *= 0.999; }}
  ]};

// ---------- intensidade, proteção e escolhas de prevenção em cada desastre ----------
let DIS_ACTIVE = null;   // multiplicador enquanto um desastre está sendo resolvido
const _pay = pay, _app = app, _stab = stab, _mny = mny;
pay = function(f){ return _pay(DIS_ACTIVE ? f*DIS_ACTIVE : f); };
mny = function(f){ return _mny(DIS_ACTIVE ? f*DIS_ACTIVE : f); };
app = function(v){ return _app(DIS_ACTIVE && v < 0 ? v*DIS_ACTIVE : v); };
stab = function(v){ return _stab(DIS_ACTIVE && v < 0 ? v*DIS_ACTIVE : v); };

for (const kind of Object.keys(DISASTERS)){
  const E = EVENTS[kind]; if (!E) continue;
  const D = DISASTERS[kind];
  const prep0 = E.prep, text0 = E.text, choices0 = E.choices;
  E.prep = d => { d = prep0 ? prep0(d) : d; if (!d) return d; d.kind = kind; d.sev = Math.random() < 0.25 ? 0 : Math.random() < 0.8 ? 1 : 2;
    G.p.lastDisaster = G.turn; (G.p.lastKind = G.p.lastKind || {})[kind] = G.turn; return d; };
  E.text = d => {
    const t = text0(d), m = disMult(d), lv = disProt(kind), infra = G.p.spend.infra || 0;
    const prot = lv ? `${D.icon} ${D.prot} (nível ${lv})` : 'nenhuma proteção específica';
    return `${t}<br><br><small>Intensidade: <b>${SEV[d.sev].n}</b> · Proteção: ${prot}${infra > 2 ? `, infraestrutura (${fmtNum(infra,1)}% do PIB)` : ''} → ${m < 1 ? `estragos <b class="up">−${Math.round((1-m)*100)}%</b>` : m > 1 ? `estragos <b class="down">+${Math.round((m-1)*100)}%</b>` : 'estragos normais'}.</small>`;
  };
  E.choices = d => {
    DIS_ACTIVE = disMult(d);
    let list;
    try { list = choices0(d).slice(); if (D.choice) list.unshift({t:'🛡️ ' + D.choice.t, h:`-${mny(D.choice.cost)}, +${D.choice.app} apoio · ${D.choice.h}`, f:()=>{ pay(D.choice.cost); app(D.choice.app); }, protect:true}); }
    finally { DIS_ACTIVE = null; }
    const m = disMult(d), protIdx = D.choice ? 0 : D.grant;   // a escolha que cria proteção permanente
    return list.map((c, i) => Object.assign({}, c, {
      h: c.h + (!D.choice && i === protIdx ? ' · 🛡️ + proteção permanente' : ''),
      f: () => {
        DIS_ACTIVE = m;
        try { c.f(); } finally { DIS_ACTIVE = null; }
        const grants = i === protIdx;
        if (grants){ const r = G.p.resil = G.p.resil || {}; r[kind] = Math.min(4, (r[kind]||0) + 1); addLog(`${D.icon} ${D.prot}: proteção nível ${r[kind]} — os próximos desastres deste tipo serão mais raros e causarão menos estragos.`, 'good'); }
      }}));
  };
}

// ---------- painel Obras: proteção contra desastres ----------
const _disObras = panelObras;
panelObras = function(){
  const h = _disObras(), r = G.p.resil || {}, list = Object.entries(r).filter(([,v]) => v > 0), infra = G.p.spend.infra || 0;
  const box = `<div class="sub">🛡️ Proteção contra desastres</div><div class="box">
    ${list.map(([k, v]) => row(`${DISASTERS[k].icon} ${DISASTERS[k].prot}`, `nível ${v} · estragos −${Math.round((1 - 1/(1 + v*0.35))*100)}%`)).join('') || '<div class="muted">Nenhuma ainda. Quando um desastre acontecer, escolha a opção de prevenção (🛡️) para proteger o país dali em diante.</div>'}
    ${row('🏗️ Infraestrutura', `${fmtNum(infra,1)}% do PIB${infra > 2 ? ` · estragos −${Math.round((1 - 1/(1 + (infra-2)*0.05))*100)}%` : ' · acima de 2% reduz os estragos'}`)}</div>`;
  const i = h.indexOf('<div class="sub">Construções existentes');
  return i < 0 ? h + box : h.slice(0, i) + box + h.slice(i);
};
