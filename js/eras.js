// ============================================================
//  IMPERIUM — O mapa político de cada época
//  (impérios, uniões, países divididos, nomes e capitais da época)
// ============================================================
'use strict';

const F_ = (layout, c1, c2, c3, emblem, ec, epos, esize) => ({layout, c1, c2:c2||'#ffffff', c3:c3||'#000000', emblem:emblem||'nenhum', ec:ec||'#ffffff', epos:epos||'centro', esize:esize||0.5, stars:8});
const AUSTRIA_FLAG = F_('bicolor_h', '#111111', '#f4c430', null, 'aguia', '#111111', 'centro', 0.45);

const ERA_OPS = {
  1850:{
    merge:{'Ucrânia':'Rússia', 'Cazaquistão':'Rússia', 'Polônia':'Rússia', 'Mongólia':'China', 'Paquistão':'Índia', 'Arábia Saudita':'Turquia'},
    rename:{
      'Rússia':{name:'Império Russo', gov:'monarquia_abs', capital:'São Petersburgo'},
      'Alemanha':{name:'Reino da Prússia', gov:'monarquia_abs', flag:F_('bicolor_h','#ffffff','#111111',null,'aguia','#111111','centro',0.5)},
      'Turquia':{name:'Império Otomano', gov:'monarquia_abs', capital:'Constantinopla', w:0.75},
      'China':{name:'Império Qing', gov:'monarquia_abs', flag:F_('solido','#f4c430',null,null,'aguia','#1f4e9e','centro',0.6)},
      'Japão':{name:'Xogunato Tokugawa', gov:'monarquia_abs', capital:'Edo'},
      'Índia':{name:'Índia (Companhia Britânica)', gov:'monarquia_abs', capital:'Calcutá', flag:F_('solido','#c8102e',null,null,'escudo','#012169','cantao',0.7)},
      'Coreia':{name:'Reino Joseon', gov:'monarquia_abs', flag:F_('solido','#ffffff',null,null,'circulo','#cd2e3a','centro',0.55)},
      'Indonésia':{name:'Índias Orientais Holandesas', gov:'monarquia_abs', capital:'Batávia', flag:F_('tricolor_h','#ae1c28','#ffffff','#21468b')},
      'Brasil':{name:'Império do Brasil', gov:'monarquia_const', flag:F_('losango','#009c3b','#ffdf00',null,'coroa','#002776','centro',0.55)},
      'Itália':{name:'Reino da Sardenha', gov:'monarquia_const', capital:'Turim'},
      'Escandinávia':{name:'Suécia-Noruega'},
      'Canadá':{name:'América do Norte Britânica', capital:'Montreal'},
      'Austrália':{name:'Colônias Australianas', capital:'Sydney'},
      'Etiópia':{name:'Império Etíope', gov:'monarquia_abs'},
      'Irã':{name:'Pérsia', gov:'monarquia_abs', flag:F_('tricolor_h','#239f40','#ffffff','#da0000','sol','#c9a13b','centro',0.4)},
      'Tailândia':{name:'Reino do Sião'},
      'Filipinas':{name:'Filipinas Espanholas', flag:F_('faixa_central','#aa151b','#f1bf00')},
      'Cuba':{name:'Cuba Espanhola', gov:'monarquia_const', flag:F_('faixa_central','#aa151b','#f1bf00')},
      'Egito':{name:'Egito (Quedivato)', gov:'monarquia_abs'},
      'África do Sul':{name:'Colônia do Cabo', capital:'Cidade do Cabo'},
      'Nigéria':{name:'Califado de Sokoto', gov:'teocracia', rel:'islamico', capital:'Sokoto'},
      'Mali':{name:'Império Tucolor', gov:'teocracia'},
      'Venezuela':{gov:'republica'}
    },
    add:[{name:'Império Austríaco', key:'Áustria', seeds:[[16,48],[19,47.5],[24,46]], w:0.5, gov:'monarquia_abs', rel:'catolico', ag:0.5, hist:[36,1250,1.3], capital:'Viena', flag:AUSTRIA_FLAG}]
  },
  1914:{
    merge:{'Ucrânia':'Rússia', 'Cazaquistão':'Rússia', 'Polônia':'Rússia', 'Paquistão':'Índia', 'Coreia':'Japão', 'Arábia Saudita':'Turquia'},
    rename:{
      'Rússia':{name:'Império Russo', gov:'monarquia_abs', capital:'São Petersburgo'},
      'Alemanha':{name:'Império Alemão', gov:'imperio', w:0.6, flag:F_('tricolor_h','#111111','#ffffff','#dd0000')},
      'Turquia':{name:'Império Otomano', gov:'monarquia_abs', capital:'Constantinopla', w:0.72},
      'Índia':{name:'Índia Britânica', gov:'monarquia_abs', capital:'Délhi', flag:F_('solido','#c8102e',null,null,'escudo','#012169','cantao',0.7)},
      'China':{name:'República da China', gov:'republica', flag:F_('listras','#de2910','#ffde00')},
      'Japão':{name:'Império do Japão', gov:'imperio'},
      'Indonésia':{name:'Índias Orientais Holandesas', gov:'monarquia_abs', capital:'Batávia', flag:F_('tricolor_h','#ae1c28','#ffffff','#21468b')},
      'Filipinas':{name:'Filipinas (EUA)'},
      'Itália':{name:'Reino da Itália', gov:'monarquia_const'},
      'Escandinávia':{name:'Suécia'},
      'Irã':{name:'Pérsia', gov:'monarquia_abs'},
      'Tailândia':{name:'Reino do Sião'},
      'Etiópia':{name:'Império Etíope', gov:'monarquia_abs'},
      'Egito':{name:'Sultanato do Egito'},
      'África do Sul':{name:'União Sul-Africana'},
      'Congo':{name:'Congo Belga', flag:F_('tricolor_v','#111111','#fdda24','#ef3340')},
      'Angola':{name:'Angola Portuguesa', flag:presetFlagSafe('Portugal')},
      'Argélia':{name:'Argélia Francesa', flag:F_('tricolor_v','#0055a4','#ffffff','#ef4135')}
    },
    add:[{name:'Áustria-Hungria', key:'Áustria', seeds:[[16,48],[19,47.5],[24,46.5],[17.5,44.5]], w:0.55, gov:'imperio', rel:'catolico', ag:0.6, hist:[52,2900,1.3], capital:'Viena', flag:AUSTRIA_FLAG, bloc:null}]
  },
  1960:{
    merge:{'Ucrânia':'Rússia', 'Cazaquistão':'Rússia'},
    rename:{
      'Rússia':{name:'União Soviética', gov:'comunismo', rel:'ateu', capital:'Moscou', flag:F_('solido','#cc0000',null,null,'estrela','#ffd700','cantao',0.6)},
      'China':{name:'República Popular da China'},
      'Polônia':{gov:'comunismo', bloc:'ori'},
      'Etiópia':{name:'Império Etíope', gov:'monarquia_abs'},
      'Irã':{gov:'monarquia_abs'}
    },
    split:{
      'Alemanha':[
        {name:'Alemanha Ocidental', key:'Alemanha', seeds:[[8,51]], w:0.45, gov:'democracia', capital:'Bonn', hist:[55,7700,0.8], bloc:'atl'},
        {name:'Alemanha Oriental', key:'Alemanha Oriental', seeds:[[13,52.5]], w:0.3, gov:'comunismo', rel:'ateu', capital:'Berlim Oriental', bloc:'ori', hist:[17,4500,0.6], flag:F_('tricolor_h','#111111','#dd0000','#ffce00','engrenagem','#ffce00','centro',0.45)}],
      'Coreia':[
        {name:'Coreia do Sul', key:'Coreia', seeds:[[127.8,36.3]], w:0.25, capital:'Seul', hist:[25,1100,0.8], bloc:'atl'},
        {name:'Coreia do Norte', key:'Coreia do Norte', seeds:[[126.8,40]], w:0.28, gov:'comunismo', rel:'ateu', capital:'Pyongyang', bloc:'ori', hist:[11,1100,0.9], flag:F_('faixa_central','#024fa2','#ed1c27',null,'estrela','#ed1c27','mastro',0.5)}]
    }
  },
  2000:{},
  2050:{
    rename:{
      'Escandinávia':{name:'União Nórdica'}, 'África Oriental':{name:'Federação da África Oriental'}, 'Coreia':{name:'Coreia Unificada'}
    }
  }
};
function presetFlagSafe(n){ return (typeof FLAG_PRESETS !== 'undefined' && FLAG_PRESETS[n]) ? Object.assign({layout:'solido', c1:'#888', c2:'#fff', c3:'#000', emblem:'nenhum', ec:'#fff', epos:'centro', esize:0.6, stars:8}, FLAG_PRESETS[n]) : null; }

// lista de nações da IA para uma época
function eraNations(era){
  const list = AI_NATIONS.map(d=>Object.assign({}, d, {key:d.name, seeds:d.seeds.map(s=>[s[0], s[1], d.w])}));
  const ops = ERA_OPS[era] || {};
  for (const [from, into] of Object.entries(ops.merge||{})){
    const a = list.find(x=>x.key===from), b = list.find(x=>x.key===into);
    if (a && b){ b.seeds = b.seeds.concat(a.seeds); b.absorbed = (b.absorbed||[]).concat(from); a.removed = true; }
  }
  for (const [key, ov] of Object.entries(ops.rename||{})){
    const d = list.find(x=>x.key===key); if (!d) continue;
    Object.assign(d, ov);
    if (ov.w) d.seeds = d.seeds.map(s=>[s[0], s[1], Math.max(s[2], ov.w)]);
  }
  for (const [key, parts] of Object.entries(ops.split||{})){
    const i = list.findIndex(x=>x.key===key); if (i < 0) continue;
    const base = list[i];
    list.splice(i, 1, ...parts.map(pp=>Object.assign({}, base, pp, {key: pp.key || base.key, seeds: pp.seeds.map(s=>[s[0], s[1], pp.w || base.w])})));
  }
  // 2050 (fictício): países em desenvolvimento crescem mais em população e renda
  if (+era === 2050) for (const d of list){ const rich = (d.pc||0) > 30; d.pop = +((d.pop||10) * (rich ? 0.88 : 1.15)).toFixed(1); d.pc = +((d.pc||10) * (rich ? 0.95 : 1.4)).toFixed(1); }
  for (const add of (ops.add||[])) list.push(Object.assign({key:add.key || add.name, pc:15, pop:10}, add, {seeds: add.seeds.map(s=>[s[0], s[1], add.w])}));
  return list.filter(x=>!x.removed);
}
function eraNationFlag(d){ return d.flag ? Object.assign({stars:8}, d.flag) : (presetFlag(d.key) || presetFlag(d.name)); }
