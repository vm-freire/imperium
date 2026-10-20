// ============================================================
//  IMPERIUM — Pesquisa ligada a obras e leis (sinergias)
// ============================================================
'use strict';

const TECH_CATS = {
  med:{n:'Medicina', icon:'⚕️', ids:['pasteurizacao','insulina','vacina_polio','contraceptivos','saneamento','medicina','anestesia','vacinas','raio_x','antibioticos','dna','transplantes','biotec','genoma','vacinas_rna','edicao_genetica']},
  ind:{n:'Indústria', icon:'🏭', ids:['elevador','turbina_vapor','motor_diesel','nanotecnologia','grafeno','supercondutores','maquina_vapor','metalurgia','concreto','dinamite','quimica','producao_massa','plasticos','refinaria','fertilizantes','robotica','impressao3d']},
  mil:{n:'Militar', icon:'⚔️', ids:['criptografia','paraquedistas','exoesqueleto','fuzis','metralhadora','blindados','jato','foguetes','gps','drones','defesa_missil','fissao']},
  nav:{n:'Naval e comércio', icon:'⚓', ids:['canais','submarino','sonar','blockchain','navios_vapor','encouracados','porta_avioes','conteineres']},
  air:{n:'Aviação e espaço', icon:'✈️', ids:['aviacao','satelites','dirigivel','helicoptero','satelite_espiao','base_lunar']},
  ene:{n:'Energia', icon:'⚡', ids:['lampada','painel_solar','led','eolica','baterias_litio','carro_eletrico','eletricidade','usinas_nucleares','renovaveis','fusao','refrigeracao']},
  com:{n:'Comunicações', icon:'📡', ids:['imprensa_rotativa','realidade_virtual','telegrafo','telefone','radio','televisao','cinema','fotografia','celulares','internet','smartphones','redes_5g','fibra_otica']},
  comp:{n:'Computação', icon:'🖥️', ids:['computacao','transistor','microprocessador','laser','ia','quantica']},
  tra:{n:'Transportes', icon:'🚂', ids:['ferrovias','motor','trem_bala','metro']},
  soc:{n:'Sociedade', icon:'🏛️', ids:['previdencia','keynesianismo']},
  agr:{n:'Agricultura', icon:'🌾', ids:['rev_verde']}
};
const TECH_CAT_OF = {};
for (const k in TECH_CATS) for (const id of TECH_CATS[k].ids) TECH_CAT_OF[id] = k;

// quais obras e leis ajudam cada área
const CAT_HELPERS = {
  med:{b:{hospital:0.12, universidade:0.05}, laws:{saude:0.15, educacao:0.05}},
  ind:{b:{fabrica:0.1, mina:0.05, universidade:0.04}, laws:{subsidios:0.12}},
  mil:{b:{base:0.1, fortaleza:0.05, universidade:0.03}, laws:{conscricao:0.1}},
  nav:{b:{porto:0.12}, laws:{livre_comercio:0.08}},
  air:{b:{aeroporto:0.15, universidade:0.05}, laws:{programa_espacial:0.25}},
  ene:{b:{usina:0.12, universidade:0.05}, laws:{ambiental:0.06}},
  com:{b:{universidade:0.08}, laws:{censura:-0.25, propaganda:0.05}},
  comp:{b:{universidade:0.12, fabrica:0.03}, laws:{educacao:0.1}},
  tra:{b:{fabrica:0.06, mina:0.06}, laws:{subsidios:0.06}},
  agr:{b:{fazenda:0.15}, laws:{reforma_agraria:0.1}},
  soc:{b:{universidade:0.08, monumento:0.05}, laws:{educacao:0.1, propaganda:0.05}}
};
function techCat(id){ return TECH_CAT_OF[id] || 'ind'; }
function researchBreakdown(id){
  const p = G.p, cat = techCat(id), H = CAT_HELPERS[cat], parts = [];
  for (const [bt, v] of Object.entries(H.b)){ const n = (p.buildings||[]).filter(b=>b.t===bt && Grid.owner[b.c]===1).length; if (n){ parts.push({label:`${BUILDINGS[bt].icon} ${n} ${BUILDINGS[bt].n.toLowerCase()}${n>1?'s':''}`, v: Math.min(0.45, v*Math.sqrt(n))}); } }
  for (const [law, v] of Object.entries(H.laws)) if (p.policies[law]) parts.push({label:`📜 ${POLICY[law].n}`, v});
  const uniCity = Object.values(p.cityInfo||{}).filter(ci=>ci.voc==='universitaria').length; if (uniCity) parts.push({label:`🎓 ${uniCity} cidade(s) universitária(s)`, v:Math.min(0.15, uniCity*0.05)});
  if (p.stability < 30) parts.push({label:'🔥 Instabilidade política', v:-0.2});
  if (G.wars.length && cat !== 'mil') parts.push({label:'⚔️ Esforço de guerra desvia cientistas', v:-0.1});
  if (G.wars.length && cat === 'mil') parts.push({label:'⚔️ Esforço de guerra', v:0.15});
  if (p.rLuck) parts.push({label: p.rLuck > 0 ? '💡 Descobertas recentes' : '🧪 Experimentos fracassados', v:p.rLuck});
  return {cat, parts, mult: Math.max(0.3, 1 + parts.reduce((s,x)=>s+x.v, 0))};
}
function techSpeed(id){ return researchBreakdown(id).mult; }
function helpersText(id){
  const H = CAT_HELPERS[techCat(id)];
  return [...Object.keys(H.b).map(b=>BUILDINGS[b].icon+' '+BUILDINGS[b].n), ...Object.entries(H.laws).filter(([l,v])=>v>0).map(([l])=>'📜 '+POLICY[l].n)].join(', ');
}
// sorte na pesquisa: oscila mês a mês
function researchLuckTurn(){
  const p = G.p; p.rLuck = p.rLuck || 0;
  p.rLuck = clamp(p.rLuck*0.7 + (Math.random()<0.12 ? rand(-0.25, 0.3) : 0), -0.3, 0.35);
  if (Math.abs(p.rLuck) < 0.02) p.rLuck = 0;
}
