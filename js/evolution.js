// ============================================================
//  IMPERIUM — Clima x localização, recursos (exportar/industrializar)
//  e árvores de evolução das construções
// ============================================================
'use strict';

// ------------------------------------------------------------
//  Clima real x clima escolhido (a localização importa)
// ------------------------------------------------------------
function realClimateAt(lat){ const a = Math.abs(lat); return a <= 23.5 ? 'tropical' : a <= 35 ? 'arido' : a <= 55 ? 'temperado' : 'frio'; }
const CLIMATE_BAND = {tropical:0, arido:1, mediterraneo:1.5, temperado:2, frio:3};
function climateMismatch(chosen, real){ return Math.abs((CLIMATE_BAND[chosen] ?? 2) - (CLIMATE_BAND[real] ?? 2)); }
function climateMods(m){
  const p = G.p; if (!p.realClimate) return;
  const s = climateMismatch(p.climate, p.realClimate);
  if (s >= 1){ m.growth -= 0.45*s; m.popGrowth -= 0.35*s; m.stability -= 3*s; m.approval -= 2*s; }
  if (p.capLat !== undefined && Math.abs(p.capLat) > 62 && p.climate !== 'frio'){ m.growth -= 0.6; m.popGrowth -= 0.4; }
}
function climateVerdict(chosen, lat){
  const real = realClimateAt(lat), s = climateMismatch(chosen, real);
  return {real, s, text: s < 1 ? `✔ Clima compatível (${CLIMATES[real].name}).`
    : s < 2 ? `⚠️ Clima pouco compatível: o local é ${CLIMATES[real].name}, mas seu povo é de clima ${CLIMATES[chosen].name}. O progresso será mais lento.`
    : `⛔ Clima incompatível: o local é ${CLIMATES[real].name} e seu povo é de clima ${CLIMATES[chosen].name}. Crescimento, população e estabilidade sofrerão muito.`};
}

// ------------------------------------------------------------
//  Recursos naturais: exportar matéria-prima ou industrializar
// ------------------------------------------------------------
const RES_INDUSTRY = {
  petroleo:{tech:'refinaria', n:'Refinarias e petroquímica'}, ferro:{tech:'metalurgia', n:'Siderurgia'}, carvao:{tech:'maquina_vapor', n:'Termelétricas e coque'},
  madeira:{tech:'maquina_vapor', n:'Serrarias e celulose'}, terras:{tech:'fertilizantes', n:'Agroindústria'}, pesca:{tech:'refrigeracao', n:'Frigoríficos e conservas'},
  ouro:{tech:'eletricidade', n:'Joalheria e componentes'}, diamantes:{tech:'producao_massa', n:'Lapidação'}, uranio:{tech:'usinas_nucleares', n:'Combustível nuclear'},
  especiarias:{tech:'refrigeracao', n:'Indústria alimentícia'}, agua:{tech:'eletricidade', n:'Hidrelétricas'}
};
function resMode(r){ return (G.p.resMode||{})[r] || 'exportar'; }
function resExportRate(r){ let k = 0.004; if (r==='petroleo' && G.p.techs.includes('motor')) k = 0.007; if (r==='ouro' || r==='diamantes') k = 0.005; return k; }
function industrializeCost(){ return G.p.gdp*0.015 + 50*G.costScale; }
function setResMode(r, mode){
  const p = G.p; p.resMode = p.resMode || {}; p.resSetup = p.resSetup || {};
  if (mode === 'industrializar'){
    const I = RES_INDUSTRY[r]; if (I && I.tech && !p.techs.includes(I.tech)) return {ok:false, why:`É preciso dominar ${TECH[I.tech].n} para industrializar.`};
    const cost = industrializeCost(); if (p.treasury < cost) return {ok:false, why:`Tesouro insuficiente (${fmtMoney(cost)}).`};
    p.treasury -= cost; p.resMode[r] = 'montando'; p.resSetup[r] = G.turn + 12;
    addLog(`🏗️ Início da industrialização: ${RESOURCES[r].name} → ${I.n}. Fica pronta em 12 meses.`, 'info');
    return {ok:true, msg:`Construindo ${I.n}. Em 12 meses deixaremos de exportar ${RESOURCES[r].name.toLowerCase()} bruto.`};
  }
  p.resMode[r] = 'exportar'; delete (p.resSetup||{})[r];
  return {ok:true, msg:`${RESOURCES[r].name}: voltamos a exportar a matéria-prima.`};
}
function processResourceSetup(){
  const p = G.p; if (!p.resSetup) return;
  for (const r in p.resSetup) if (G.turn >= p.resSetup[r]){
    p.resMode[r] = 'industrializar'; delete p.resSetup[r];
    addLog(`🏭 ${RES_INDUSTRY[r].n} em operação! Agora transformamos ${RESOURCES[r].name.toLowerCase()} em produtos de maior valor.`, 'good');
    if (typeof onNegotiation === 'function') onNegotiation(`🏭 ${RES_INDUSTRY[r].n} pronta!`, true);
  }
}
function resourceModeMods(m){
  for (const r of G.p.resources) if (resMode(r) === 'industrializar'){ m.gdpMult += 0.035; m.unemployment -= 0.4; m.growth += 0.15; }
}

// ------------------------------------------------------------
//  Árvores de evolução das construções (escolha um caminho!)
// ------------------------------------------------------------
const N_ = (id, n, icon, fx, extra, ch) => Object.assign({id, n, icon, fx, ch: ch || []}, extra || {});
const BTREE = {
  fabrica:[
    N_('pesada','Indústria Pesada','⚙️',{gdpMult:0.015, unitCost:-0.03},null,[
      N_('siderurgica','Siderúrgica','🔥',{gdpMult:0.02, unitCost:-0.04},null,[N_('armamentos','Complexo de Armamentos','💣',{unitCost:-0.06, military:0.04},{tech:'producao_massa'}), N_('estaleiro','Estaleiro Naval','🚢',{navy:0.12, tradeMult:0.04})]),
      N_('automotiva','Indústria Automotiva','🚗',{gdpMult:0.03, unemployment:-0.3},{tech:'motor'},[N_('aeronautica','Indústria Aeronáutica','✈️',{gdpMult:0.03, military:0.03},{tech:'aviacao'}), N_('robotizada','Fábrica Robotizada','🤖',{gdpMult:0.05},{tech:'robotica'}), N_('veiculos_mil','Veículos Militares','🛡️',{military:0.05},{tech:'blindados'})])]),
    N_('leve','Indústria Leve','🧵',{gdpMult:0.01, unemployment:-0.4, approval:0.5},null,[
      N_('textil','Polo Têxtil','👕',{unemployment:-0.5, tradeMult:0.03},null,[N_('moda','Moda e Design','👗',{tradeMult:0.05, approval:1},{tech:'televisao'}), N_('calcados','Calçados e Couro','👞',{gdpMult:0.015})]),
      N_('alimentos','Indústria Alimentícia','🥫',{popGrowth:0.05, gdpMult:0.01},null,[N_('bebidas','Bebidas','🍺',{gdpMult:0.015, approval:0.5}), N_('exportadora','Polo Exportador','📦',{tradeMult:0.08},{tech:'conteineres'}), N_('eletronicos','Eletrônicos','📺',{gdpMult:0.04, research:0.02},{tech:'transistor'})])])],
  universidade:[
    N_('exatas','Ciências Exatas','📐',{research:0.04},null,[
      N_('engenharia','Escola de Engenharia','🏗️',{growth:0.1, research:0.02},null,[N_('politecnica','Politécnica Nacional','⚙️',{growth:0.15, unitCost:-0.03}), N_('aeroespacial','Instituto Aeroespacial','🚀',{research:0.05, military:0.03},{tech:'foguetes'})]),
      N_('fisica','Instituto de Física','⚛️',{research:0.05},null,[N_('nuclear','Centro de Pesquisa Nuclear','☢️',{research:0.06},{tech:'fissao'}), N_('computacao_c','Centro de Computação','🖥️',{research:0.08},{tech:'computacao'})])]),
    N_('humanas','Humanidades','📜',{approval:0.6, stability:0.5},null,[
      N_('direito','Faculdade de Direito','⚖️',{corruption:-0.02, admin:0.02},null,[N_('diplomatica','Academia Diplomática','🤝',{relations:3}), N_('administracao','Escola de Governo','🏛️',{admin:0.04, taxEff:0.02})]),
      N_('medicina_f','Faculdade de Medicina','🩺',{popGrowth:0.05},null,[N_('pesquisa_med','Instituto de Pesquisa Médica','🔬',{popGrowth:0.05, research:0.03}), N_('saude_pub','Escola de Saúde Pública','🏥',{approval:1, popGrowth:0.04})])])],
  hospital:[
    N_('geral','Hospital Geral','🏥',{popGrowth:0.05, approval:0.5},null,[
      N_('emergencia','Centro de Emergência','🚑',{approval:0.8},null,[N_('trauma','Centro de Trauma Militar','🎖️',{manpower:0.05}), N_('rede','Rede Regional de Saúde','🌐',{popGrowth:0.06, approval:0.8})]),
      N_('maternidade','Maternidade','👶',{popGrowth:0.08},null,[N_('pediatria','Hospital Infantil','🧸',{popGrowth:0.05, approval:0.6}), N_('natalidade','Programa de Natalidade','👪',{popGrowth:0.1})])]),
    N_('pesquisa','Hospital Universitário','🧪',{research:0.02, popGrowth:0.03},null,[
      N_('vacinas_c','Instituto de Vacinas','💉',{popGrowth:0.06},{tech:'vacinas'},[N_('epidemias','Centro de Controle de Epidemias','🦠',{stability:1, popGrowth:0.05})]),
      N_('oncologia','Centro de Oncologia','🎗️',{approval:0.8, research:0.02},{tech:'raio_x'})])],
  porto:[
    N_('comercial','Porto Comercial','🛳️',{tradeMult:0.05},null,[
      N_('conteiner_p','Terminal de Contêineres','📦',{tradeMult:0.08},{tech:'conteineres'},[N_('zona_franca','Zona Franca','💰',{tradeMult:0.06, gdpMult:0.015}), N_('hub','Hub Logístico Mundial','🌍',{tradeMult:0.1})]),
      N_('pesqueiro','Porto Pesqueiro','🐟',{popGrowth:0.05, gdpMult:0.01},null,[N_('frigorifico','Frigorífico Naval','🧊',{gdpMult:0.015},{tech:'refrigeracao'})])]),
    N_('militar','Base Naval','⚓',{navy:0.08},null,[
      N_('arsenal','Arsenal da Marinha','🔧',{navy:0.1, unitCost:-0.02},null,[N_('submarinos','Base de Submarinos','🌊',{navy:0.12})]),
      N_('desembarque','Escola de Fuzileiros','🎖️',{navy:0.05, military:0.03})])],
  base:[
    N_('quartel','Quartel de Infantaria','🪖',{manpower:0.08},null,[
      N_('academia','Academia Militar','🎓',{military:0.04},null,[N_('estado_maior','Estado-Maior','⭐',{military:0.05, defense:0.03}), N_('forcas_especiais','Forças Especiais','🗡️',{military:0.06})]),
      N_('reservistas','Centro de Reservistas','👥',{manpower:0.15},null,[N_('milicia','Milícia Nacional','🛡️',{defense:0.05, manpower:0.1})])]),
    N_('blindada','Base Blindada','🛡️',{military:0.04},{tech:'blindados', local:{r:5, def:1.35}},[
      N_('artilharia_p','Artilharia Pesada','💣',{military:0.04, defense:0.03},null,[N_('misseis_b','Bateria de Mísseis','🚀',{defense:0.06},{tech:'foguetes', local:{r:6, def:1.5}})]),
      N_('logistica','Centro Logístico','🚚',{admin:0.02, military:0.03})])],
  fortaleza:[
    N_('muralhas','Muralhas Reforçadas','🧱',{defense:0.02},{local:{r:3, def:1.8}},[
      N_('bunkers','Rede de Bunkers','🕳️',{defense:0.03},{tech:'concreto', local:{r:4, def:2.0}},[N_('linha','Linha Fortificada','🏰',{defense:0.04},{local:{r:6, def:1.9}})]),
      N_('torres','Torres de Vigia','🗼',{defense:0.02},{local:{r:5, def:1.7}})]),
    N_('antiaerea','Defesa Antiaérea','🎯',{defense:0.03},{tech:'aviacao', local:{r:4, def:1.7}},[
      N_('radar_f','Estação de Radar','📡',{defense:0.04},{tech:'radar', local:{r:6, def:1.75}},[N_('escudo','Escudo Antimísseis','🛡️',{defense:0.06},{tech:'defesa_missil', local:{r:8, def:2.0}})])])],
  usina:[
    N_('termica','Termelétrica','🏭',{gdpMult:0.015},null,[N_('carvao_u','Usina a Carvão','⚫',{gdpMult:0.02, approval:-0.5}), N_('gas','Usina a Gás','🔥',{gdpMult:0.025},{tech:'plasticos'})]),
    N_('hidro','Hidrelétrica','🌊',{gdpMult:0.02, popGrowth:0.03},null,[N_('barragem','Grande Barragem','🏞️',{gdpMult:0.03},null,[N_('irrigacao','Sistema de Irrigação','💧',{popGrowth:0.06})])]),
    N_('nuclear_u','Usina Nuclear','☢️',{gdpMult:0.04},{tech:'usinas_nucleares'},[N_('reator','Reator Avançado','⚛️',{gdpMult:0.04, research:0.02}), N_('fusao_u','Reator de Fusão','🌟',{gdpMult:0.1},{tech:'fusao'})])],
  fazenda:[
    N_('graos','Grãos','🌾',{popGrowth:0.05},null,[N_('mecanizada','Agricultura Mecanizada','🚜',{gdpMult:0.01, popGrowth:0.04},{tech:'motor'},[N_('agronegocio','Agronegócio Exportador','📦',{tradeMult:0.05, gdpMult:0.015}), N_('organica','Agricultura Orgânica','🥬',{approval:0.8, popGrowth:0.03})])]),
    N_('pecuaria','Pecuária','🐄',{gdpMult:0.01},null,[N_('frigorificos','Frigoríficos','🥩',{gdpMult:0.015, tradeMult:0.03},{tech:'refrigeracao'}), N_('laticinios','Laticínios','🧀',{popGrowth:0.04, approval:0.5})])],
  mina:[
    N_('subterranea','Mineração Subterrânea','⛏️',{gdpMult:0.012},null,[N_('carvao_m','Mina de Carvão','⚫',{growth:0.15},null,[N_('coqueria','Coqueria','🔥',{gdpMult:0.015})]), N_('metais','Metais Preciosos','🪙',{gdpMult:0.02, corruption:0.01})]),
    N_('ceu_aberto','Mineração a Céu Aberto','🏜️',{gdpMult:0.015, approval:-0.3},{tech:'dinamite'},[N_('minerio','Minério de Ferro','🟫',{unitCost:-0.03, gdpMult:0.01}), N_('terras_raras','Terras Raras','💠',{research:0.03, gdpMult:0.02},{tech:'microprocessador'})])],
  aeroporto:[
    N_('caca','Base de Caças','🛩️',{military:0.03},null,[N_('interceptores','Esquadrão de Interceptação','🎯',{defense:0.04},{tech:'jato'}), N_('bombardeiros','Base de Bombardeiros','💣',{military:0.05})]),
    N_('transporte','Aeroporto de Transporte','🛫',{tradeMult:0.03, admin:0.02},null,[N_('internacional','Aeroporto Internacional','🌍',{tradeMult:0.05, approval:0.5},{tech:'jato'}), N_('lancamento','Centro de Lançamento','🚀',{research:0.04},{tech:'satelites'})])],
  cidade:[
    N_('comercial_c','Centro Comercial','🏬',{gdpMult:0.01, tradeMult:0.02},null,[N_('financeiro','Centro Financeiro','🏦',{gdpMult:0.025, taxEff:0.01},{tech:'telefone'},[N_('bolsa','Bolsa de Valores','📈',{gdpMult:0.03}), N_('sede_bancos','Sede de Bancos Internacionais','💼',{tradeMult:0.04, gdpMult:0.01})])]),
    N_('cultural','Capital Cultural','🎭',{approval:0.8},null,[N_('turistica','Cidade Turística','🏖️',{gdpMult:0.015, approval:0.5},null,[N_('patrimonio','Patrimônio da Humanidade','🏛️',{approval:1, relations:2})]), N_('universitaria','Cidade Universitária','🎓',{research:0.03})]),
    N_('industrial_c','Distrito Industrial','🏭',{gdpMult:0.015, unemployment:-0.3},null,[N_('metropole','Metrópole','🌆',{gdpMult:0.03, popGrowth:0.03},{tech:'eletricidade'})])],
  monumento:[N_('praca','Praça Cívica','⛲',{approval:0.6},null,[N_('museu','Museu Nacional','🖼️',{approval:0.8, research:0.01},null,[N_('memorial','Memorial da Pátria','🗿',{stability:1.5, approval:0.5})]), N_('estadio','Grande Estádio','🏟️',{approval:1.2})])]
};
function treeNode(t, path){
  let list = BTREE[t] || [], node = null;
  for (const id of (path||[])){ node = list.find(x=>x.id===id); if (!node) return null; list = node.ch; }
  return node;
}
function nextOptions(b){ const node = treeNode(b.t, b.path); return node ? node.ch : (BTREE[b.t] || []); }
function upgradeCost(b){ const lvl = (b.path||[]).length + 1; return (BUILDINGS[b.t].cost || 150) * G.costScale * (0.6 + lvl*0.5) + G.p.gdp*0.002; }
function upgradeMonths(b){ return 2 + (b.path||[]).length*2; }
function startUpgrade(b, id){
  const opt = nextOptions(b).find(x=>x.id===id); if (!opt) return {ok:false, why:'Opção inválida.'};
  if (b.up) return {ok:false, why:'Esta construção já está em obras.'};
  if (opt.tech && !G.p.techs.includes(opt.tech)) return {ok:false, why:`Requer ${TECH[opt.tech].n}.`};
  const cost = upgradeCost(b); if (G.p.treasury < cost) return {ok:false, why:`Tesouro insuficiente (${fmtMoney(cost)}).`};
  G.p.treasury -= cost; b.up = {id, due:G.turn + upgradeMonths(b)};
  addLog(`🏗️ Obras iniciadas: ${BUILDINGS[b.t].n} → ${opt.n} (${upgradeMonths(b)} meses).`, 'info');
  return {ok:true, msg:`Evolução para ${opt.icon} ${opt.n} iniciada. Pronta em ${upgradeMonths(b)} meses.`};
}
function processBuildUpgrades(){
  for (const b of (G.p.buildings||[])){
    if (!b.up || G.turn < b.up.due) continue;
    b.path = (b.path||[]).concat([b.up.id]); const node = treeNode(b.t, b.path); b.up = null;
    addLog(`🏗️ Evolução concluída: ${node.icon} ${node.n}.`, 'good');
    if (typeof onNegotiation === 'function') onNegotiation(`🏗️ ${node.icon} ${node.n} concluída!`, true);
  }
}
function buildingLevelName(b){ const node = treeNode(b.t, b.path); return node ? `${node.icon} ${node.n}` : `${BUILDINGS[b.t].icon} ${BUILDINGS[b.t].n}`; }
function buildingLocal(b){
  let L = BUILDINGS[b.t].local || null, list = BTREE[b.t] || [];
  for (const id of (b.path||[])){ const nd = list.find(x=>x.id===id); if (!nd) break; if (nd.local) L = nd.local; list = nd.ch; }
  return L;
}
