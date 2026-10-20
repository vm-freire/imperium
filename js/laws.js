// ============================================================
//  IMPERIUM — Leis de todas as épocas e como são aprovadas
//  • Cada lei existe a partir de um ano (e algumas só até certo ano)
//  • Democracias: o Parlamento vota (leva 1–2 meses, pode rejeitar)
//  • Monarquias absolutas, ditaduras, comunismo e teocracia: decreto
//    imediato, mas algumas leis são proibidas e outras abalam o regime
// ============================================================
'use strict';

// leis novas
const NEW_LAWS = [
  {id:'direito_divino', n:'Direito Divino dos Reis', icon:'👑', cost:0, from:1500, to:1820, only:['monarquia_abs','imperio','monarquia_const'], lean:'aut', fx:{stability:4, approval:-1, coup:-0.3}, d:'O rei governa por vontade de Deus. Mais estabilidade e menos conspirações.'},
  {id:'tribunal_religioso', n:'Tribunal Religioso', icon:'⛪', cost:0.1, from:1500, to:1834, only:['monarquia_abs','imperio','teocracia'], lean:'aut', excl:'liberdade_religiosa', fx:{stability:3, research:-0.1, approval:-2}, d:'Tribunais da fé perseguem os "hereges". Ordem à força, mas freia a ciência.'},
  {id:'monopolio_colonial', n:'Monopólio Comercial Colonial', icon:'⚓', cost:0, from:1500, to:1850, lean:'dir', fx:{tradeMult:0.08, relations:-3}, d:'Só a metrópole pode comerciar com as colônias (o "pacto colonial").'},
  {id:'liberdade_religiosa', n:'Liberdade Religiosa', icon:'🕊️', cost:0, from:1598, block:['teocracia'], lean:'esq', excl:'tribunal_religioso', fx:{relations:3, stability:1, research:0.02}, d:'Cada um pode seguir sua fé (como o Édito de Nantes, 1598).'},
  {id:'patentes', n:'Lei de Patentes', icon:'📐', cost:0, from:1624, lean:'cen', fx:{research:0.05, gdpMult:0.01}, d:'Inventores ganham direitos sobre suas invenções (Inglaterra, 1624).'},
  {id:'liberdade_imprensa', n:'Liberdade de Imprensa', icon:'📰', cost:0, from:1766, block:['ditadura','comunismo','teocracia'], lean:'esq', excl:'censura', fx:{approval:3, research:0.03, corruption:-0.02, stability:-1}, d:'Jornais publicam sem censura (Suécia, 1766). O povo fica mais informado e crítico.'},
  {id:'codigo_civil', n:'Código Civil', icon:'⚖️', cost:0, from:1804, lean:'cen', fx:{admin:0.05, stability:2, corruption:-0.02}, d:'Leis escritas e iguais para todos (Código Napoleônico, 1804).'},
  {id:'sufragio_universal', n:'Sufrágio Universal Masculino', icon:'🗳️', cost:0, from:1848, only:['democracia','republica','federacao','monarquia_const'], lean:'esq', fx:{approval:4, stability:2, corruption:-0.02}, d:'Todo homem adulto vota, rico ou pobre (França, 1848).'},
  {id:'servico_publico', n:'Concurso Público', icon:'📋', cost:0, from:1855, lean:'cen', fx:{corruption:-0.03, admin:0.03}, d:'Cargos públicos por mérito, não por amizade (Reino Unido, 1855).'},
  {id:'sindicatos', n:'Sindicatos Livres', icon:'✊', cost:0, from:1871, block:['ditadura'], lean:'esq', fx:{approval:2, unemployment:-0.3, growth:-0.05}, d:'Trabalhadores podem se organizar e fazer greve.'},
  {id:'previdencia_social', n:'Previdência Social', icon:'👴', cost:0.8, from:1889, lean:'esq', fx:{approval:4, stability:2}, d:'Aposentadoria e seguro para os trabalhadores (Bismarck, Alemanha, 1889).'},
  {id:'antitruste', n:'Lei Antitruste', icon:'🧩', cost:0, from:1890, lean:'cen', fx:{growth:0.1, corruption:-0.02}, d:'Proíbe monopólios e cartéis (EUA, 1890).'},
  {id:'voto_feminino', n:'Voto Feminino', icon:'👩', cost:0, from:1893, only:['democracia','republica','federacao','monarquia_const'], lean:'esq', fx:{approval:3, research:0.02, stability:1}, d:'Mulheres votam (Nova Zelândia, 1893; Brasil, 1932).'},
  {id:'salario_minimo', n:'Salário Mínimo', icon:'💵', cost:0, from:1894, lean:'esq', fx:{approval:3, unemployment:0.5, growth:-0.05}, d:'Ninguém pode ganhar menos que o mínimo (Nova Zelândia, 1894).'},
  {id:'imposto_progressivo', n:'Imposto de Renda Progressivo', icon:'🧾', cost:0, from:1842, lean:'esq', fx:{taxEff:0.05, approval:1, growth:-0.05}, d:'Quem ganha mais paga uma porcentagem maior.'},
  {id:'jornada_8h', n:'Jornada de 8 Horas', icon:'⏰', cost:0, from:1919, lean:'esq', fx:{approval:4, growth:-0.1, unemployment:-0.5}, d:'Oito horas de trabalho, oito de descanso, oito de lazer.'},
  {id:'estatizacao', n:'Estatização de Setores Estratégicos', icon:'🏭', cost:0, from:1917, block:['monarquia_abs'], lean:'esq', excl:'privatizacao', fx:{stability:2, growth:-0.2, taxEff:0.05}, d:'O Estado assume petróleo, energia e bancos (México, 1938; Brasil, 1953).'},
  {id:'direitos_civis', n:'Direitos Civis e Igualdade', icon:'🤝', cost:0, from:1964, block:['ditadura'], lean:'esq', fx:{approval:3, stability:2, relations:3}, d:'Proíbe a discriminação por raça, sexo ou religião (EUA, 1964).'},
  {id:'privatizacao', n:'Privatizações', icon:'🏷️', cost:0, from:1979, block:['comunismo'], lean:'dir', excl:'estatizacao', fx:{growth:0.3, approval:-2, taxEff:-0.03}, d:'Vende empresas estatais para o setor privado (Reino Unido, anos 1980).'},
  {id:'protecao_dados', n:'Proteção de Dados', icon:'🔐', cost:0, from:2016, req:'internet', lean:'cen', fx:{approval:1, research:-0.01, stability:1}, d:'As pessoas controlam seus dados pessoais (Europa, 2016; Brasil, 2018).'}
];
for (const L of NEW_LAWS){ if (!POLICY[L.id]){ POLICIES.push(L); POLICY[L.id] = L; } }
// ano de origem e inclinação das leis que já existiam
const OLD_LAW_INFO = {conscricao:[1793,'dir'], livre_comercio:[1776,'dir'], protecionismo:[1500,'esq'], censura:[1500,'aut'], educacao:[1763,'esq'], saude:[1946,'esq'], subsidios:[1650,'cen'],
  ambiental:[1970,'esq'], lei_marcial:[1500,'aut'], policia_secreta:[1789,'aut'], propaganda:[1914,'aut'], imigracao:[1500,'esq'], banco_central:[1977,'dir'], reforma_agraria:[1789,'esq'], programa_espacial:[1957,'cen']};
for (const [id, [from, lean]] of Object.entries(OLD_LAW_INFO)) if (POLICY[id]){ POLICY[id].from = POLICY[id].from || from; POLICY[id].lean = POLICY[id].lean || lean; }
const LEAN_N = {esq:'progressista', dir:'conservadora/liberal', cen:'de centro', aut:'autoritária'};

// como cada regime aprova as leis
function lawProcess(gov){
  const f = (GOVS[gov]||{}).family;
  if (f === 'dem' || gov === 'monarquia_const') return {k:'parlamento', n:'O Parlamento vota cada lei (1–2 meses). Leis autoritárias são difíceis de passar; leis alinhadas ao partido no poder passam mais fácil.'};
  if (gov === 'tecnocracia') return {k:'conselho', n:'Um conselho técnico analisa a lei por 1 mês e quase sempre aprova o que é eficiente.'};
  if (gov === 'comunismo') return {k:'decreto', n:'O Partido decreta as leis na hora. Leis liberais são proibidas.'};
  if (gov === 'teocracia') return {k:'decreto', n:'O clero decreta as leis na hora, de acordo com a fé.'};
  if (gov === 'ditadura') return {k:'decreto', n:'A junta decreta as leis na hora. Liberdades são proibidas.'};
  return {k:'decreto', n:'O soberano decreta as leis na hora. Leis progressistas abalam o poder da coroa (−3 de estabilidade).'};
}
// por que uma lei está bloqueada (ou null)
function lawLock(P){
  const p = G.p, y = curYear();
  if (P.from && y < P.from) return `só existe a partir de ${P.from}`;
  if (P.to && y >= P.to) return `abolida desde ${P.to}`;
  if (P.only && !P.only.includes(p.gov)) return 'incompatível com o regime';
  if (P.block && P.block.includes(p.gov)) return 'proibida pelo regime';
  if (P.req && !p.techs.includes(P.req)) return 'requer ' + (TECH[P.req] ? TECH[P.req].n : P.req);
  return null;
}
function lawChance(P, enact){
  const p = G.p, ideo = p.party && p.party.ideo;
  let c = 0.45 + (p.approval - 50)/120 + (p.stability - 50)/250;
  const left = ['esq','cesq'].includes(ideo), right = ['dir','cdir'].includes(ideo);
  const lean = P.lean;
  if (lean === 'aut') c -= 0.25;
  if ((lean === 'esq' && left) || (lean === 'dir' && right)) c += 0.15;
  if ((lean === 'esq' && right) || (lean === 'dir' && left)) c -= 0.15;
  if (lean === 'cen') c += 0.05;
  if (!enact) c += 0.1;                                                   // revogar é mais fácil
  if (p.gov === 'tecnocracia') c = 0.8;
  return clamp(c, 0.08, 0.95);
}

const _togglePolicyBase = togglePolicy;
togglePolicy = function(id){
  const p = G.p, P = POLICY[id]; if (!P) return {ok:false, why:'Lei desconhecida.'};
  const enact = !p.policies[id];
  if (enact){ const lk = lawLock(P); if (lk) return {ok:false, why:`${P.n}: ${lk}.`}; }
  p.bills = p.bills || [];
  if (p.bills.some(b => b.id === id)) return {ok:false, why:'Esta lei já está em votação.'};
  const proc = lawProcess(p.gov);
  if (proc.k === 'parlamento' || proc.k === 'conselho'){
    const ch = lawChance(P, enact), months = proc.k === 'conselho' ? 1 : randInt(1, 2);
    p.bills.push({id, enact, chance:ch, due:G.turn + months});
    addLog(`🗳️ ${enact ? 'Projeto de lei' : 'Revogação'} enviado(a) ${proc.k === 'conselho' ? 'ao conselho técnico' : 'ao Parlamento'}: ${P.n} (chance de aprovação ${Math.round(ch*100)}%).`, 'info');
    return {ok:true, msg:`🗳️ ${P.n} foi para votação. Resultado em ${months} mês(es) — chance de ${Math.round(ch*100)}%.`};
  }
  // decreto
  const r = _togglePolicyBase(id); if (!r.ok) return r;
  if (enact && P.lean === 'esq' && ['monarquia_abs','imperio','ditadura'].includes(p.gov)){ p.stability = Math.max(0, p.stability - 3); addLog(`👑 O decreto "${P.n}" desagradou os aliados do regime (−3 de estabilidade).`, 'bad'); }
  return {ok:true, msg:`📜 ${enact ? 'Decretado' : 'Revogado'}: ${P.n}.`};
};
// votações: resolvem no mês marcado
const _endTurnLaws = endTurn;
endTurn = function(){
  _endTurnLaws.apply(this, arguments);
  if (!G || !G.p) return;
  const p = G.p; p.bills = p.bills || [];
  const due = p.bills.filter(b => G.turn >= b.due); p.bills = p.bills.filter(b => G.turn < b.due);
  for (const b of due){
    const P = POLICY[b.id]; if (!P) continue;
    if (b.enact === !!p.policies[b.id]) continue;
    if (chance(b.chance)){
      _togglePolicyBase(b.id);
      const votes = Math.round(50 + b.chance*30 + rand(-5, 5));
      addLog(`✅ Aprovada${b.enact ? '' : ' a revogação de'}: ${P.n} (${votes}% dos votos).`, 'good');
      if (typeof toast === 'function') toast(`✅ ${b.enact ? 'Lei aprovada' : 'Revogação aprovada'}: ${P.n}`, 'good');
    } else {
      p.approval = Math.max(0, p.approval - 1);
      addLog(`❌ Rejeitada: ${P.n}. O governo saiu enfraquecido (−1 de apoio).`, 'bad');
      if (typeof toast === 'function') toast(`❌ O Parlamento rejeitou: ${P.n}`, 'bad');
    }
  }
};
