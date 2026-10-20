// ============================================================
//  IMPERIUM — Eventos e decisões
// ============================================================
'use strict';

function gdpF(f){ return G.p.gdp * f; }
function pay(f){ G.p.treasury -= gdpF(f); }
function gain(f){ G.p.treasury += gdpF(f); }
function app(v){ G.p.approval = clamp(G.p.approval + v, 0, 100); }
function stab(v){ G.p.stability = clamp(G.p.stability + v, 0, 100); }
function relAll(v){ for (let k=2;k<G.nations.length;k++){ const n=G.nations[k]; if (n.alive) changeRel(n, v); } }
function randState(){ return pick(G.p.stateNames.length ? G.p.stateNames : [G.p.capital]); }
function randNeighbor(){ const ns = neighborsOf(1).filter(id=>id>1 && G.nations[id].alive); return ns.length ? pick(ns) : null; }
function randNation(){ const a = G.nations.filter(n=>n && n.id>1 && n.alive); return pick(a).id; }
function isDem(){ return GOVS[G.p.gov].family === 'dem'; }
function mny(f){ return fmtMoney(gdpF(f)); }

const EVENTS = {
  // ---------------- aleatórios ----------------
  terremoto:{icon:'🌋', title:'Terremoto!', w:()=>disasterWeight('terremoto'),
    prep:d=>{d.s=randState(); return d;},
    text:d=>`Um terremoto de magnitude 7,8 devastou o estado de ${d.s}. Milhares estão desabrigados e as estradas foram destruídas.`,
    choices:d=>[
      {t:'Reconstrução total', h:`-${mny(0.015)}, +4 apoio`, f:()=>{pay(0.015); app(4);}},
      {t:'Ajuda básica', h:`-${mny(0.004)}, -2 apoio`, f:()=>{pay(0.004); app(-2);}},
      {t:'Deixar a região se virar', h:'-8 apoio, -5 estabilidade, mortes', f:()=>{app(-8); stab(-5); G.p.pop*=0.998;}}
    ]},
  tsunami:{icon:'🌊', title:'Tsunami!', w:()=>disasterWeight('tsunami'),
    prep:d=>{d.s=randState(); return d;},
    text:d=>`Um maremoto no oceano gerou ondas gigantes que atingiram o litoral de ${d.s}. Portos e vilas costeiras foram arrasados.`,
    choices:()=>[
      {t:'Reconstruir o litoral', h:`-${mny(0.02)}, +4 apoio`, f:()=>{pay(0.02); app(4); G.p.pop*=0.999;}},
      {t:'Sistema de alerta e evacuação', h:`-${mny(0.008)}, menos vítimas no futuro`, f:()=>{pay(0.008); G.p.pop*=0.999; addTemp({stability:1},36,'Alerta de tsunami');}},
      {t:'Socorro mínimo', h:'-7 apoio, muitas vítimas', f:()=>{app(-7); G.p.pop*=0.996;}}
    ]},
  vulcao:{icon:'🌋', title:'Erupção Vulcânica', w:()=>disasterWeight('vulcao'),
    text:()=>`Um vulcão entrou em erupção! Cinzas cobrem o céu e lava ameaça cidades próximas.`,
    choices:()=>[
      {t:'Evacuar a região', h:`-${mny(0.01)}, vidas salvas`, f:()=>{pay(0.01); app(2);}},
      {t:'Esperar para ver', h:'Arriscado: pode haver muitas vítimas', f:()=>{ if (chance(0.5)){ G.p.pop*=0.995; app(-8); addLog('A erupção destruiu vilarejos inteiros.','bad'); } else addLog('A erupção perdeu força. Sorte!','good'); }}
    ]},
  furacao:{icon:'🌀', title:'Furacão!', w:()=>disasterWeight('furacao'),
    prep:d=>{d.s=randState(); return d;},
    text:d=>`Um furacão de categoria 5 atingiu ${d.s} com ventos de 250 km/h. Telhados voaram e o litoral está alagado.`,
    choices:()=>[
      {t:'Reconstrução completa', h:`-${mny(0.015)}, +3 apoio`, f:()=>{pay(0.015); app(3);}},
      {t:'Ajuda emergencial', h:`-${mny(0.005)}, -2% crescimento por 6 meses`, f:()=>{pay(0.005); addTemp({growth:-2},6,'Furacão');}}
    ]},
  nevasca:{icon:'❄️', title:'Inverno Rigoroso', w:()=>disasterWeight('nevasca'),
    text:()=>`Uma nevasca histórica isolou cidades inteiras. Estradas e ferrovias estão bloqueadas.`,
    choices:()=>[
      {t:'Distribuir carvão e alimentos', h:`-${mny(0.006)}, +2 apoio`, f:()=>{pay(0.006); app(2);}},
      {t:'Cada um por si', h:'-5 apoio, mortes pelo frio', f:()=>{app(-5); G.p.pop*=0.998;}}
    ]},
  incendio:{icon:'🔥', title:'Incêndio Florestal', w:()=>disasterWeight('incendio'),
    text:()=>`Um incêndio gigantesco consome nossas florestas. A fumaça chega às cidades.`,
    choices:()=>[
      {t:'Mobilizar bombeiros e exército', h:`-${mny(0.006)}, +2 apoio`, f:()=>{pay(0.006); app(2);}},
      {t:'Deixar queimar', h:'-4 apoio, -1% crescimento por 1 ano', f:()=>{app(-4); addTemp({growth:-1},12,'Florestas destruídas');}}
    ]},
  gafanhotos:{icon:'🦗', title:'Praga de Gafanhotos', w:()=>disasterWeight('gafanhotos'),
    text:()=>`Nuvens de gafanhotos devoram as plantações. A fome ameaça o interior.`,
    choices:()=>[
      {t:'Importar alimentos', h:`-${mny(0.008)}`, f:()=>{pay(0.008);}},
      {t:'Pulverizar as lavouras', h:`-${mny(0.004)}, -1 apoio`, f:()=>{pay(0.004); app(-1);}},
      {t:'Racionar comida', h:'-6 apoio, -3 estabilidade', f:()=>{app(-6); stab(-3);}}
    ]},
  petroleo:{icon:'🛢️', title:'Petróleo descoberto!', w:()=>G.p.resources.includes('petroleo')?0:(G.p.climate==='arido'||G.p.terrain==='desertico'?0.9:0.3),
    text:()=>`Geólogos encontraram enormes reservas de petróleo em nosso território! Companhias estrangeiras já batem à porta.`,
    choices:()=>[
      {t:'Estatizar as reservas', h:'+Petróleo, +3 apoio, -5 relações com capitalistas', f:()=>{G.p.resources.push('petroleo'); app(3); for (let k=2;k<G.nations.length;k++){const n=G.nations[k]; if(n.alive && GOVS[n.gov] && GOVS[n.gov].family==='dem') changeRel(n,-5);} }},
      {t:'Leiloar para estrangeiros', h:`+Petróleo, +${mny(0.02)}, +corrupção`, f:()=>{G.p.resources.push('petroleo'); gain(0.02); G.p.corruption+=0.02; relAll(3);}},
      {t:'Construir refinarias e industrializar', h:G.p.techs.includes('refinaria') ? `+Petróleo industrializado em 12 meses (custa ${fmtMoney(industrializeCost())}): mais riqueza e empregos` : '🔒 Exige a tecnologia Refino de Petróleo — o petróleo será exportado bruto por enquanto', f:()=>{G.p.resources.push('petroleo'); if (G.p.techs.includes('refinaria')){ const r = setResMode('petroleo','industrializar'); if (!r.ok) addLog(r.why,'bad'); } }}
    ]},
  ouro:{icon:'🪙', title:'Corrida do Ouro!', w:()=>G.p.resources.includes('ouro')?0:0.25,
    text:()=>`Pepitas de ouro foram encontradas nos rios do interior. Aventureiros chegam aos milhares.`,
    choices:()=>[
      {t:'Controlar a mineração', h:'+Ouro, +2 estabilidade', f:()=>{G.p.resources.push('ouro'); stab(2);}},
      {t:'Deixar o povo garimpar', h:'+Ouro, +5 apoio, +imigração', f:()=>{G.p.resources.push('ouro'); app(5); G.p.pop*=1.005; stab(-3);}}
    ]},
  greve:{icon:'✊', title:'Greve Geral', w:()=>G.p.unemployment>10?1.4:0.7,
    text:()=>`Sindicatos paralisaram fábricas e portos exigindo melhores salários. A produção está parada.`,
    choices:()=>[
      {t:'Negociar aumento', h:`-${mny(0.005)}, +3 apoio`, f:()=>{pay(0.005); app(3);}},
      {t:'Reprimir com a polícia', h:`+3 estabilidade, ${isDem()?'-12':'-7'} apoio`, f:()=>{stab(3); app(isDem()?-12:-7);}},
      {t:'Esperar a greve acabar', h:'-1,5% crescimento por 6 meses, -3 apoio', f:()=>{addTemp({growth:-1.5},6,'Greve'); app(-3);}}
    ]},
  epidemia:{icon:'🦠', title:'Epidemia', w:()=>0.6*(G.p.climate==='tropical'?2:1)*(G.p.techs.includes('antibioticos')?0.4:1),
    text:()=>`Uma doença misteriosa se espalha pelas cidades. Hospitais estão lotados.`,
    choices:()=>[
      {t:'Quarentena rígida', h:'-1,5% crescimento por 6 meses, -2 apoio', f:()=>{addTemp({growth:-1.5},6,'Quarentena'); app(-2);}},
      {t:'Campanha de saúde pública', h:`-${mny(0.01)}, +3 apoio`, f:()=>{pay(0.01); app(3);}},
      {t:'Minimizar o problema', h:'-2% população, -8 apoio', f:()=>{G.p.pop*=0.98; app(-8);}}
    ]},
  pandemia:{icon:'😷', title:'Pandemia Global', w:()=>G.turn>150?0.1:0,
    text:()=>`Um vírus altamente contagioso se espalha pelo mundo inteiro. Economias param.`,
    choices:()=>[
      {t:'Lockdown nacional', h:'-3% crescimento por 12 meses, vidas salvas', f:()=>{addTemp({growth:-3},12,'Lockdown'); app(2);}},
      {t:'Manter a economia aberta', h:'-3% população, -10 apoio', f:()=>{G.p.pop*=0.97; app(-10);}}
    ]},
  escandalo:{icon:'📰', title:'Escândalo de Corrupção', w:()=>G.p.corruption*6,
    text:()=>`Jornalistas revelaram que ministros desviaram fundos públicos para contas no exterior.`,
    choices:()=>[
      {t:'Investigação independente', h:'-6 estabilidade, -corrupção, +2 apoio', f:()=>{stab(-6); G.p.corruption=Math.max(0.01,G.p.corruption-0.05); app(2);}},
      {t:'Abafar o caso', h:'+corrupção, risco de piorar', f:()=>{G.p.corruption+=0.03; if (chance(0.4)){ app(-10); addLog('O caso abafado vazou! -10 apoio.','bad'); }}},
      {t:'Culpar a oposição', h:'-3 estabilidade', f:()=>{stab(-3); if (isDem()) app(-3);}}
    ]},
  investimento:{icon:'💼', title:'Investimento Estrangeiro', w:()=>0.6,
    prep:d=>{d.n=randNation(); return d;},
    text:d=>`Conglomerados de ${G.nations[d.n].name} querem investir pesadamente em nossa indústria em troca de concessões.`,
    choices:d=>[
      {t:'Aceitar o capital', h:'+3% PIB per capita, -3 estabilidade, +10 relações', f:()=>{G.p.basePc*=1.03; stab(-3); changeRel(G.nations[d.n],10);}},
      {t:'Recusar — soberania!', h:'+2 apoio, -5 relações', f:()=>{app(2); changeRel(G.nations[d.n],-5);}}
    ]},
  seca:{icon:'☀️', title:'Grande Seca', w:()=>disasterWeight('seca'),
    text:()=>`Meses sem chuva arruinaram as colheitas. O preço dos alimentos disparou.`,
    choices:()=>[
      {t:'Importar alimentos', h:`-${mny(0.008)}`, f:()=>{pay(0.008);}},
      {t:'Racionamento', h:'-6 apoio, -3 estabilidade', f:()=>{app(-6); stab(-3);}}
    ]},
  inundacao:{icon:'🌊', title:'Inundações', w:()=>disasterWeight('inundacao'),
    prep:d=>{d.s=randState(); return d;},
    text:d=>`Chuvas torrenciais inundaram ${d.s}. Pontes e plantações foram levadas pelas águas.`,
    choices:()=>[
      {t:'Obras de contenção', h:`-${mny(0.01)}, +2 apoio, +0,3% crescimento por 1 ano`, f:()=>{pay(0.01); app(2); addTemp({growth:0.3},12,'Obras');}},
      {t:'Socorro emergencial', h:`-${mny(0.003)}`, f:()=>{pay(0.003);}},
      {t:'Nada a fazer', h:'-5 apoio', f:()=>{app(-5);}}
    ]},
  inventor:{icon:'💡', title:'Inventor Genial', w:()=>0.5,
    prep:d=>{d.who=genPersonName(); return d;},
    text:d=>`${d.who}, um jovem inventor, afirma ter criado algo revolucionário. Precisa de financiamento.`,
    choices:d=>[
      {t:'Financiar a pesquisa', h:`-${mny(0.004)}, grande avanço científico`, f:()=>{pay(0.004); if (G.p.researching) G.p.rp += techCost(G.p.researching)*0.45;}},
      {t:'Não temos dinheiro para sonhos', h:'nada acontece', f:()=>{}}
    ]},
  refugiados:{icon:'🧳', title:'Crise de Refugiados', w:()=>G.aiWars.length?0.7:0,
    prep:d=>{const w=pick(G.aiWars); d.n = w? w.b : randNation(); return d;},
    text:d=>`A guerra em ${G.nations[d.n].name} empurrou milhares de refugiados para nossas fronteiras.`,
    choices:d=>[
      {t:'Acolher os refugiados', h:'+0,5% população, -3 estabilidade, +10 relações', f:()=>{G.stats.refugees = (G.stats.refugees||0) + 1; G.p.pop*=1.005; stab(-3); changeRel(G.nations[d.n],10); relAll(2);}},
      {t:'Fechar as fronteiras', h:'+1 apoio, -5 relações', f:()=>{app(1); changeRel(G.nations[d.n],-5);}}
    ]},
  separatismo:{icon:'🏴', title:'Movimento Separatista', w:()=>G.p.states>6 && G.p.stability<50 ? 1 : 0,
    prep:d=>{d.s=randState(); return d;},
    text:d=>`Líderes do estado de ${d.s} exigem independência e convocam protestos massivos.`,
    choices:d=>[
      {t:'Conceder autonomia', h:'+5 estabilidade, -5% arrecadação por 2 anos', f:()=>{stab(5); addTemp({taxEff:-0.05},24,'Autonomia regional');}},
      {t:'Reprimir os separatistas', h:'+3 estabilidade, -6 apoio, cansaço de guerra', f:()=>{stab(3); app(-6); G.p.warWeary+=5;}},
      {t:'Convocar referendo', h:'Arriscado: podemos perder o estado', f:()=>{
        if (chance(0.55 + G.p.approval/300)){ app(6); stab(4); addLog(`O referendo em ${d.s} rejeitou a independência!`, 'good'); }
        else { const own=[]; for (let i=0;i<NCELLS;i++) if (Grid.owner[i]===1 && Grid.land[i] && i!==G.p.capCell) own.push(i);
          const lose = own.length>3 ? bfsCells(pick(own),1,Math.max(1,Math.round(own.length*0.08))).filter(c=>c!==G.p.capCell) : [];
          transferCells(lose, 1, 0); G.p.states = Math.max(1, G.p.states-1); stab(5); addLog(`${d.s} declarou independência! Perdemos ${lose.length} regiões.`, 'bad'); }
      }}
    ]},
  olimpiadas:{icon:'🏅', title:'Grande Exposição Mundial', w:()=>0.35,
    text:()=>`Fomos convidados a sediar um grande evento internacional. Seria uma vitrine para o mundo.`,
    choices:()=>[
      {t:'Sediar o evento', h:`-${mny(0.015)}, +6 apoio, +5 relações com todos`, f:()=>{pay(0.015); app(6); relAll(5);}},
      {t:'Recusar educadamente', h:'nada acontece', f:()=>{}}
    ]},
  crise_global:{icon:'📉', title:'Crise Financeira Mundial', w:()=>0.3,
    text:()=>`Bolsas despencam no mundo inteiro. Bancos quebram e o crédito secou.`,
    choices:()=>[
      {t:'Austeridade fiscal', h:`-6 apoio, -2% crescimento por 1 ano, +${mny(0.01)}`, f:()=>{app(-6); addTemp({growth:-2},12,'Austeridade'); gain(0.01);}},
      {t:'Pacote de estímulo', h:`+${mny(0.03)} em dívida, inflação +2`, f:()=>{G.p.debt+=gdpF(0.03); gain(0.03); G.p.printBoost+=2; addTemp({growth:-0.5},12,'Crise');}},
      {t:'Não fazer nada', h:'-3% crescimento por 1 ano', f:()=>{addTemp({growth:-3},12,'Crise mundial');}}
    ]},
  incidente:{icon:'🚩', title:'Incidente de Fronteira', w:()=>neighborsOf(1).some(id=>id>1)?0.7:0,
    prep:d=>{d.n=randNeighbor(); return d.n?d:null;},
    text:d=>`Soldados de ${G.nations[d.n].name} cruzaram nossa fronteira e trocaram tiros com uma patrulha.`,
    choices:d=>[
      {t:'Exigir desculpas formais', h:'-10 relações, +3 apoio', f:()=>{changeRel(G.nations[d.n],-10); app(3);}},
      {t:'Abafar o incidente', h:'+3 relações, -2 apoio', f:()=>{changeRel(G.nations[d.n],3); app(-2);}},
      {t:'Mobilizar tropas na fronteira', h:'-20 relações, +moral', f:()=>{changeRel(G.nations[d.n],-20); G.p.morale=Math.min(1.3,G.p.morale+0.05); app(2);}}
    ]},
  espiao:{icon:'🕵️', title:'Espião Capturado', w:()=>0.4,
    prep:d=>{d.n=randNation(); return d;},
    text:d=>`Nossa contra-inteligência prendeu um agente de ${G.nations[d.n].name} fotografando instalações militares.`,
    choices:d=>[
      {t:'Expulsá-lo discretamente', h:'-5 relações', f:()=>{changeRel(G.nations[d.n],-5);}},
      {t:'Julgamento público', h:'-20 relações, +3 apoio', f:()=>{changeRel(G.nations[d.n],-20); app(3);}},
      {t:'Interrogar e trocar', h:'+pesquisa, +3 relações', f:()=>{changeRel(G.nations[d.n],3); G.p.rp+=30;}}
    ]},
  colheita:{icon:'🌾', title:'Colheita Recorde', w:()=>G.p.resources.includes('terras')||G.p.focus==='agricultura'?0.9:0.3,
    text:()=>`Os celeiros transbordam! A melhor safra em décadas.`,
    choices:()=>[
      {t:'Exportar o excedente', h:`+${mny(0.008)}`, f:()=>{gain(0.008);}},
      {t:'Estocar para o futuro', h:'+4 estabilidade', f:()=>{stab(4);}},
      {t:'Distribuir aos pobres', h:'+5 apoio', f:()=>{app(5);}}
    ]},
  protestos:{icon:'📣', title:'Protestos nas Ruas', w:()=>G.p.approval<45?1.3:0.25,
    text:()=>`Multidões tomaram as praças de ${G.p.capital} exigindo mudanças no governo.`,
    choices:()=>[
      {t:'Abrir diálogo', h:'+4 apoio, -1 estabilidade', f:()=>{app(4); stab(-1);}},
      {t:'Dispersar à força', h:`+4 estabilidade, ${isDem()?'-12':'-6'} apoio`, f:()=>{stab(4); app(isDem()?-12:-6);}},
      {t:'Anunciar reformas', h:`-${mny(0.006)}, +6 apoio`, f:()=>{pay(0.006); app(6);}}
    ]},
  religioso:{icon:'⛪', title:'Fervor Religioso', w:()=>0.35,
    text:()=>`Um movimento religioso ganha milhões de seguidores e exige influência no governo.`,
    choices:()=>[
      {t:'Apoiar o movimento', h:'+4 estabilidade, -10% pesquisa por 2 anos', f:()=>{stab(4); addTemp({research:-0.1},24,'Fervor religioso');}},
      {t:'Manter o Estado neutro', h:'-2 estabilidade', f:()=>{stab(-2);}},
      {t:'Reprimir', h:'-5 apoio, +2 estabilidade', f:()=>{app(-5); stab(2);}}
    ]},
  fuga_cerebros:{icon:'🧠', title:'Fuga de Cérebros', w:()=>G.p.spend.research<1.5?0.6:0.15,
    text:()=>`Nossos melhores cientistas estão emigrando em busca de melhores salários no exterior.`,
    choices:()=>[
      {t:'Aumentar verbas de ciência', h:'+0,5% PIB em C&T (permanente)', f:()=>{G.p.spend.research=Math.min(6,G.p.spend.research+0.5);}},
      {t:'Deixá-los partir', h:'-30% do progresso de pesquisa', f:()=>{G.p.rp*=0.7;}}
    ]},
  arqueologia:{icon:'🏺', title:'Descoberta Arqueológica', w:()=>0.25,
    text:()=>`Ruínas de uma civilização perdida foram encontradas perto de ${G.p.capital}!`,
    choices:()=>[
      {t:'Construir um museu nacional', h:`-${mny(0.002)}, +3 apoio, turismo`, f:()=>{pay(0.002); app(3); addTemp({gdpMult:0.01},36,'Turismo');}},
      {t:'Vender os artefatos', h:`+${mny(0.003)}, -2 apoio`, f:()=>{gain(0.003); app(-2);}}
    ]},
  motim:{icon:'💢', title:'Motim no Exército', w:()=>G.p.warWeary>40?1:0,
    text:()=>`Soldados exaustos se recusam a voltar ao front. O moral das tropas está em colapso.`,
    choices:()=>[
      {t:'Pagar bônus às tropas', h:`-${mny(0.006)}, +moral`, f:()=>{pay(0.006); G.p.warWeary-=10;}},
      {t:'Executar os líderes do motim', h:'+3 estabilidade, -6 apoio', f:()=>{stab(3); app(-6);}},
      {t:'Dispensar veteranos', h:'-10% infantaria, -15 cansaço', f:()=>{G.p.units.inf=Math.floor((G.p.units.inf||0)*0.9); G.p.warWeary-=15;}}
    ]},
  programa_nuclear:{icon:'☢️', title:'A Bomba', w:()=>G.p.techs.includes('fissao') && !(G.p.units.nuke>0) ? 0.4 : 0,
    text:()=>`Nossos físicos afirmam que podem construir uma arma atômica em poucos meses.`,
    choices:()=>[
      {t:'Construir a bomba', h:'+1 ogiva nuclear, -10 relações com todos', f:()=>{G.p.units.nuke=(G.p.units.nuke||0)+1; relAll(-10); addNews(`${G.p.name} testa sua primeira bomba atômica!`);}},
      {t:'Renunciar às armas nucleares', h:'+5 relações com todos, +2 apoio', f:()=>{relAll(5); app(2);}}
    ]},
  revolta_ocupados:{icon:'🔥', title:'Revolta nos Territórios Ocupados', w:()=>G.p.occupied>8?1.2:0,
    text:()=>`A população dos territórios conquistados se rebela contra nossa administração.`,
    choices:()=>[
      {t:'Investir na integração', h:`-${mny(0.008)}, -ocupação`, f:()=>{pay(0.008); G.p.occupied*=0.6;}},
      {t:'Lei marcial local', h:'-5 apoio, ocupação reduz', f:()=>{app(-5); G.p.occupied*=0.75; stab(2);}},
      {t:'Ignorar', h:'-6 estabilidade', f:()=>{stab(-6);}}
    ]},
  boom:{icon:'📈', title:'Boom Econômico', w:()=>G.p.growth>3.5?0.7:0.1,
    text:()=>`A economia cresce como nunca! Empresários pedem incentivos para expandir ainda mais.`,
    choices:()=>[
      {t:'Incentivos fiscais', h:`-${mny(0.005)}, +1,5% crescimento por 1 ano`, f:()=>{pay(0.005); addTemp({growth:1.5},12,'Boom');}},
      {t:'Guardar os lucros', h:`+${mny(0.006)}`, f:()=>{gain(0.006);}}
    ]},
  pedido_emprestimo:{icon:'🤝', title:'Pedido de Ajuda', w:()=>0.3,
    prep:d=>{const fr=G.nations.filter(n=>n&&n.id>1&&n.alive&&n.rel>10); if(!fr.length) return null; d.n=pick(fr).id; return d;},
    text:d=>`${G.nations[d.n].name} enfrenta dificuldades e pede um empréstimo de emergência.`,
    choices:d=>[
      {t:'Emprestar', h:`-${mny(0.006)}, +15 relações, será pago em tributos`, f:()=>{const a=gdpF(0.006); G.p.treasury-=a; changeRel(G.nations[d.n],15); G.p.tributes.push({from:d.n, amt:a*1.25/24, until:G.turn+24});}},
      {t:'Recusar', h:'-5 relações', f:()=>{changeRel(G.nations[d.n],-5);}}
    ]},
  imigrantes:{icon:'🎓', title:'Imigrantes Qualificados', w:()=>G.p.stability>55?0.3:0.05,
    text:()=>`Engenheiros e médicos estrangeiros desejam viver em nosso próspero país.`,
    choices:()=>[
      {t:'Dar boas-vindas', h:'+0,3% população, +pesquisa', f:()=>{G.p.pop*=1.003; G.p.rp+=25;}},
      {t:'Priorizar os nacionais', h:'+2 apoio', f:()=>{app(2);}}
    ]},
  recurso_novo:{icon:'💎', title:'Nova Jazida', w:()=>0.25,
    prep:d=>{const opts=['diamantes','uranio','ferro','carvao'].filter(r=>!G.p.resources.includes(r)); if(!opts.length) return null; d.r=pick(opts); return d;},
    text:d=>`Prospectores encontraram jazidas de ${RESOURCES[d.r].name.toLowerCase()} em nossas montanhas.`,
    choices:d=>[
      {t:'Explorar a jazida', h:`+${RESOURCES[d.r].name}: ${RESOURCES[d.r].desc}`, f:()=>{G.p.resources.push(d.r);}},
      {t:'Preservar a natureza', h:'+3 apoio', f:()=>{app(3);}}
    ]},

  // ---------------- especiais (enfileirados) ----------------
  ultimato:{icon:'📜', title:'Ultimato!', special:true,
    prep:d=>{const n=G.nations[d.n]; d.amt = n.pop*n.pc*0.01 + G.p.gdp*0.01; return d;},
    text:d=>`${G.nations[d.n].name} exige o pagamento de ${fmtMoney(d.amt)} em "reparações históricas". Caso contrário, haverá guerra.`,
    choices:d=>[
      {t:'Pagar o tributo', h:`-${fmtMoney(d.amt)}, -5 apoio, +15 relações`, f:()=>{G.p.treasury-=d.amt; app(-5); changeRel(G.nations[d.n],15); G.nations[d.n].truce=G.turn+12;}},
      {t:'Recusar — que venham!', h:'GUERRA', f:()=>{declareWar(d.n, true); if (typeof onWarDeclared==='function') onWarDeclared(G.nations[d.n]); app(3);}}
    ]},
  proposta_alianca:{icon:'🤝', title:'Proposta de Aliança', special:true,
    text:d=>`${G.nations[d.n].name} propõe uma aliança militar defensiva com ${G.p.name}.`,
    choices:d=>[
      {t:'Aceitar a aliança', h:'Eles lutarão ao nosso lado', f:()=>{const n=G.nations[d.n]; n.alliance=true; n.pact=true; changeRel(n,10); addLog(`Aliança formada com ${n.name}!`,'dip');}},
      {t:'Recusar', h:'-5 relações', f:()=>{changeRel(G.nations[d.n],-5);}}
    ]},
  proposta_comercio:{icon:'⚓', title:'Proposta Comercial', special:true,
    text:d=>`Mercadores de ${G.nations[d.n].name} propõem um acordo comercial entre nossas nações.`,
    choices:d=>[
      {t:'Assinar Redução de Tarifas', h:'+renda comercial mensal por 10 anos', f:()=>{const n=G.nations[d.n]; n.deals=n.deals||{}; n.deals.tarifas={since:G.turn, until:G.turn+120}; syncTrade(n); changeRel(n,5); addLog(`Acordo de Redução de Tarifas com ${n.name}.`,'dip');}},
      {t:'Recusar', h:'-3 relações', f:()=>{changeRel(G.nations[d.n],-3);}}
    ]},
  paz_ia:{icon:'🕊️', title:'Proposta de Paz', special:true,
    prep:d=>{ if (!getWar(d.n)) return null; const n=G.nations[d.n]; d.amt=n.pop*n.pc*0.03; return d; },
    text:d=>{ const n=G.nations[d.n];
      if (d.win===true) return `${n.name} está perdendo a guerra e oferece paz, pagando ${fmtMoney(d.amt)} em reparações.`;
      if (d.win===false) return `${n.name} está vencendo a guerra e exige que cedamos territórios ou paguemos indenização para encerrar o conflito.`;
      return `Após anos de conflito sem vencedor, ${n.name} propõe uma paz branca.`; },
    choices:d=>{ const n=G.nations[d.n];
      if (d.win===true) return [
        {t:'Aceitar paz e reparações', h:`+${fmtMoney(d.amt)}`, f:()=>{G.p.treasury+=d.amt; endWar(d.n,'reparacoes'); app(4);}},
        {t:'Pedir mais (contraproposta)', h:'Abre a mesa de paz', f:()=>{ setTimeout(()=>openPeaceTable(d.n, d.amt), 350); }},
        {t:'Lutar até o fim', h:'A guerra continua', f:()=>{}}];
      if (d.win===false) return [
        {t:'Ceder territórios', h:'Perdemos regiões de fronteira', f:()=>{makePeace(d.n,'ceder');}},
        {t:'Pagar indenização', h:`-${mny(0.05)}, -8 apoio`, f:()=>{makePeace(d.n,'render');}},
        {t:'Negociar o valor', h:'Abre a mesa de paz', f:()=>{ setTimeout(()=>openPeaceTable(d.n, -Math.min(G.p.gdp*0.05, Math.max(0, G.p.treasury))), 350); }},
        {t:'Jamais! Continuar lutando', h:'+2 apoio', f:()=>{app(2);}}];
      return [
        {t:'Aceitar paz branca', h:'Fim da guerra', f:()=>{endWar(d.n,'branca'); app(3);}},
        {t:'Exigir reparações', h:'Abre a mesa de paz', f:()=>{ setTimeout(()=>openPeaceTable(d.n, 0), 350); }},
        {t:'Recusar', h:'A guerra continua', f:()=>{}}];
    }},
  campanha:{icon:'🗳️', title:'Campanha Eleitoral', special:true,
    text:()=>`As eleições acontecem em 2 meses. Apoio atual: ${Math.round(G.p.approval)}%. Qual será a estratégia de ${G.p.leader}?`,
    choices:()=>[
      {t:'Prometer cortar impostos', h:'Imposto -3 pontos, grande impulso', f:()=>{G.p.tax=Math.max(0,G.p.tax-0.03); G.p.campaign=8;}},
      {t:'Prometer gastos sociais', h:'+1,5% PIB em bem-estar, impulso', f:()=>{G.p.spend.social=Math.min(15,G.p.spend.social+1.5); G.p.campaign=6;}},
      {t:'Campanha patriótica', h:G.wars.length?'Forte em tempos de guerra':'Fraca em tempos de paz', f:()=>{G.p.campaign=G.wars.length?10:2;}},
      {t:'Campanha cara de marketing', h:`-${mny(0.004)}, impulso moderado`, f:()=>{pay(0.004); G.p.campaign=5;}}
    ]},
  eleicao:{icon:'🗳️', title:'Dia de Eleição', special:true,
    prep:d=>{ const pr = 1/(1+Math.exp(-((G.p.approval + (G.p.campaign||0)) - 46)/5)); d.pr = pr; d.win = chance(pr); G.p.campaign = 0; G.p.nextElection = G.turn + electionInterval(); d.limit = termLimitReached(); return d; },
    text:d=>d.win ? (d.limit ? `As urnas foram apuradas: o partido de ${G.p.leader} venceu! Pela Constituição, ${G.p.leader} não pode continuar e passará o cargo a um sucessor.` : `As urnas foram apuradas: ${G.p.leader} foi reeleito(a) com ${Math.round(50 + d.pr*20)}% dos votos! (chance era ${Math.round(d.pr*100)}%)`)
                  : `As urnas foram apuradas: a oposição venceu com ${Math.round(52 + (1-d.pr)*15)}% dos votos. ${G.p.leader} perdeu o poder. (chance de vitória era ${Math.round(d.pr*100)}%)`,
    choices:d=> d.win ? [{t: d.limit ? 'Celebrar e passar a faixa ao sucessor' : 'Celebrar a vitória!', h: d.limit ? 'O limite de mandatos foi atingido: o partido escolherá o próximo líder' : '+5 apoio', f:()=>{app(5); if (d.limit){ addLog(`🗳️ O partido do governo venceu as eleições! ${G.p.leader} cumpre o limite constitucional de mandatos.`,'good'); G.p.terms = 1; queueEvent('sucessao', {party:true}); } else { G.p.terms = (G.p.terms||1) + 1; addLog(`🗳️ ${G.p.leader} venceu as eleições!`,'good'); } G.stats.electionsWon = (G.stats.electionsWon||0) + 1; }}]
      : [{t:'Aceitar a derrota democraticamente', h:'FIM DE JOGO', f:()=>{gameOver(`${G.p.leader} perdeu as eleições e deixou o poder pacificamente.`, 'eleicao');}},
         {t:'Ignorar o resultado (autogolpe)', h:'Vira ditadura: -25 estabilidade, -20 apoio, mundo democrático furioso', f:()=>{
            G.stats.autogolpe = 1; G.p.gov='ditadura'; G.p.title='General'; G.p.nextElection=-1; stab(-25); app(-20);
            for (let k=2;k<G.nations.length;k++){const n=G.nations[k]; if(n.alive && GOVS[n.gov] && GOVS[n.gov].family==='dem') changeRel(n,-30);}
            addLog(`${G.p.leader} anulou as eleições e assumiu poderes ditatoriais!`,'bad'); addNews(`Golpe em ${G.p.name}: eleições anuladas.`);}}]
  },
  sucessao:{icon:'⚱️', title:'Morte do Líder', special:true,
    prep:d=>{ d.c = [0,1,2].map(()=>({name:genPersonName(), trait:pick(Object.keys(TRAITS)), age:Math.round(rand(32,58))})); return d; },
    text:d=> d.party ? `O mandato de ${G.p.title} ${G.p.leader} chegou ao fim. O partido do governo precisa indicar quem assumirá o cargo.` : `${G.p.title} ${G.p.leader} faleceu aos ${G.p.age} anos. A nação está de luto. ${GOVS[G.p.gov].succession?'Quem herdará o trono?':'Quem assumirá o governo?'}`,
    choices:d=> d.c.map(c=>({t:`${c.name} (${c.age} anos)`, h:`${TRAITS[c.trait].name}: ${TRAITS[c.trait].desc}`, f:()=>{
      addLog(d.party ? `${G.p.leader} deixa o cargo. ${c.name} assume o governo.` : `${G.p.title} ${G.p.leader} morreu. ${c.name} assume o poder.`,'info'); G.p.leader=c.name; G.p.trait=c.trait; G.p.age=c.age; stab(d.party?0:(GOVS[G.p.gov].succession?-5:-8)); presentNewLeader(c.name);}})).concat([{t:'Escolher outra pessoa', h:'Crie o nome e o visual do novo líder', f:()=>{
      const sex = Math.random()<0.5?'m':'f', nm = genNameBySex(G.p.cult||'luso', sex); addLog(d.party ? `${G.p.leader} deixa o cargo. ${nm} assume o governo.` : `${G.p.title} ${G.p.leader} morreu. ${nm} assume o poder.`,'info');
      G.p.leader = nm; G.p.age = Math.round(rand(35,60)); G.p.avatar = randomAvatar(sex, null, G.p.gov); stab(d.party?0:(GOVS[G.p.gov].succession?-5:-8)); setTimeout(()=>openLeaderEditor(), 350); }}])
  },
  golpe:{icon:'🪖', title:'Tentativa de Golpe!', special:true,
    text:()=>`Generais descontentes cercaram o palácio em ${G.p.capital}! Tanques nas ruas. Estabilidade: ${Math.round(G.p.stability)}.`,
    choices:()=>[
      {t:'Resistir com a guarda leal', h:`Chance de sucesso: ${Math.round(clamp(0.45+G.p.stability/150+G.p.spend.police*0.04,0.1,0.95)*100)}%`, f:()=>{
        if (chance(clamp(0.45+G.p.stability/150+G.p.spend.police*0.04,0.1,0.95))){ stab(12); applyUnitLosses(0.15,'land'); addLog('O golpe foi esmagado! Os conspiradores foram presos.','good'); }
        else gameOver(`${G.p.leader} foi deposto por um golpe militar.`, 'golpe'); }},
      {t:'Negociar com os generais', h:`-${mny(0.03)}, -5 apoio, militares ganham poder`, f:()=>{pay(0.03); app(-5); stab(8); addTemp({military:0.1, approval:-3},24,'Junta militar');}},
      {t:'Fugir do país', h:'FIM DE JOGO', f:()=>{gameOver(`${G.p.leader} fugiu para o exílio durante um golpe militar.`, 'golpe');}}
    ]},
  revolucao:{icon:'🔥', title:'REVOLUÇÃO!', special:true,
    text:()=>`O povo tomou as ruas de todas as cidades. Prédios do governo estão em chamas. É o fim do regime?`,
    choices:()=>[
      {t:'Esmagar a revolução', h:`Chance: ${Math.round(clamp(0.3+G.p.atk/Math.max(1,G.p.pop*3)*0.2+G.p.spend.police*0.04,0.1,0.8)*100)}%. Brutal.`, f:()=>{
        if (chance(clamp(0.3+G.p.atk/Math.max(1,G.p.pop*3)*0.2+G.p.spend.police*0.04,0.1,0.8))){ G.stats.repressed = (G.stats.repressed||0) + 1; stab(25); app(-20); G.p.pop*=0.99; addLog('A revolução foi esmagada a ferro e fogo.','bad'); }
        else gameOver('O regime foi derrubado por uma revolução popular.', 'revolucao'); }},
      {t:'Reformas radicais', h:`-${mny(0.05)}, +20 apoio, +20 estabilidade`, f:()=>{pay(0.05); app(20); stab(20); G.p.corruption*=0.6; addLog('Reformas radicais acalmaram as ruas.','good');}},
      {t:'Abdicar do poder', h:'FIM DE JOGO', f:()=>{gameOver(`${G.p.leader} abdicou diante da revolução.`, 'revolucao');}}
    ]},
  hiperinflacao:{icon:'💸', title:'Inflação Descontrolada', special:true,
    text:()=>`A inflação chegou a ${fmtPct(G.p.inflation)} ao ano. Os preços mudam de manhã para a tarde.`,
    choices:()=>[
      {t:'Choque de juros', h:'-2% crescimento por 1 ano, inflação despenca', f:()=>{addTemp({growth:-2},12,'Juros altos'); G.p.inflation*=0.5; G.p.printBoost=0;}},
      {t:'Congelar preços', h:'+3 apoio, efeito temporário', f:()=>{app(3); G.p.inflation*=0.75; addTemp({growth:-1},12,'Preços congelados');}},
      {t:'Lançar nova moeda', h:'-5 apoio, -5 estabilidade, inflação zerada', f:()=>{app(-5); stab(-5); G.p.inflation=4; G.p.printBoost=0; G.p.currency='Novo '+G.p.currency.replace(/^Novo /,'');}}
    ]},
  crise_divida:{icon:'🏦', title:'Crise da Dívida', special:true,
    text:()=>`Credores internacionais duvidam da nossa capacidade de pagar ${fmtMoney(G.p.debt)} (${fmtPct(G.p.debt/G.p.gdp*100,0)} do PIB).`,
    choices:()=>[
      {t:'Austeridade severa', h:'Gastos -20%, -8 apoio', f:()=>{for (const k in G.p.spend) G.p.spend[k]*=0.8; app(-8);}},
      {t:'Renegociar a dívida', h:'50%: dívida -15%; senão rating cai', f:()=>{ if (chance(0.5)){ G.p.debt*=0.85; addLog('Dívida renegociada com sucesso!','good'); } else { G.p.defaults+=0.5; addLog('A renegociação fracassou. Nosso crédito piorou.','bad'); } }},
      {t:'Declarar moratória', h:'Dívida -60%, crédito destruído', f:()=>{ const r = ECON_ACTIONS.default(); addLog(r.ok?r.msg:r.why, r.ok?'bad':'info'); }}
    ]}
};

function queueEvent(id, d){
  if (!G || G.over) return;
  G.pendingEvents.push({id, d: d || {}, prepped:false});
}
function queueOnce(id, d){ if (!G.pendingEvents.some(e=>e.id===id)) queueEvent(id, d); }
function rollEvent(){
  const list = [];
  for (const id in EVENTS){ const e = EVENTS[id]; if (e.special) continue; const w = e.w(); if (w > 0) list.push([id, w]); }
  let tot = list.reduce((s,x)=>s+x[1],0); let r = Math.random()*tot;
  for (const [id, w] of list){ r -= w; if (r <= 0){ queueEvent(id, {}); return; } }
}
// prepara o próximo evento pendente (retorna null se nenhum)
function nextEvent(){
  while (G.pendingEvents.length){
    const pe = G.pendingEvents[0];
    const def = EVENTS[pe.id];
    if (!pe.prepped){
      let d = pe.d;
      if (def.prep){ d = def.prep(d); if (!d){ G.pendingEvents.shift(); continue; } }
      if (d.n && (!G.nations[d.n] || !G.nations[d.n].alive)){ G.pendingEvents.shift(); continue; }
      pe.d = d; pe.prepped = true;
    }
    return {id:pe.id, def, d:pe.d, text:def.text(pe.d), choices:def.choices(pe.d)};
  }
  return null;
}
function resolveEvent(choiceIdx){
  const pe = G.pendingEvents[0]; if (!pe) return;
  const def = EVENTS[pe.id]; const ch = def.choices(pe.d)[choiceIdx];
  G.pendingEvents.shift();
  G.stats.eventsSeen++;
  addLog(`${def.icon} ${def.title}: ${ch.t}.`, 'evt');
  ch.f();
  if (!G.over){ derive(); checkGameOver(); }
}
