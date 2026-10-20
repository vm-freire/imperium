// ============================================================
//  IMPERIUM — Enciclopédia
//  Explica cada sistema do jogo e conta a história real por trás
//  dele, para o jogador aprender enquanto joga.
//  As listas (regimes, pesquisas, obras...) vêm dos próprios dados
//  do jogo; os textos históricos ficam aqui.
// ============================================================
'use strict';

const HIST_GOV = {
  democracia:'Na democracia parlamentar, o povo elege o Parlamento e dele sai o primeiro-ministro, que pode cair por um voto de desconfiança. O modelo nasceu na Inglaterra depois da Revolução Gloriosa (1688) e se espalhou pela Europa nos séculos XIX e XX. Exemplos: Reino Unido, Alemanha, Índia, Japão.',
  republica:'Na república presidencialista, o presidente é eleito e chefia o Estado e o governo ao mesmo tempo, com mandato fixo. Os Estados Unidos criaram o modelo em 1787 e quase toda a América Latina o adotou, inclusive o Brasil desde 1889.',
  federacao:'Uma federação divide o poder entre o governo central e estados com autonomia própria (leis, impostos, polícia). Funciona bem em países enormes ou diversos. Exemplos: Estados Unidos (1787), Brasil (1891), Alemanha, Índia e Austrália.',
  monarquia_const:'Na monarquia constitucional, o rei reina mas não governa: uma Constituição limita seus poderes e o governo fica com o Parlamento. O Reino Unido é o exemplo clássico; também Espanha, Japão, Suécia, Holanda e o Império do Brasil (1824–1889).',
  monarquia_abs:'Na monarquia absoluta, o rei concentra todos os poderes, muitas vezes justificados pelo "direito divino". Foi o modelo dominante na Europa dos séculos XVI a XVIII — Luís XIV da França disse "o Estado sou eu". Hoje sobrevive em poucos países, como Arábia Saudita e Omã.',
  imperio:'Um império reúne muitos povos e territórios sob um soberano, geralmente formado por conquista. Romanos, mongóis, otomanos, britânicos e o Brasil imperial são exemplos. No jogo, impérios têm exército forte e o povo tolera melhor as guerras.',
  ditadura:'Na ditadura militar, as Forças Armadas tomam o poder, suspendem eleições e governam pela força. Foi comum na América Latina, África e Ásia no século XX (Brasil 1964–1985, Argentina, Chile). Garante ordem a curto prazo, mas reprime o povo e sofre golpes internos.',
  comunismo:'No Estado comunista, um partido único controla o governo e a economia, que é planificada pelo Estado em nome da classe trabalhadora. Começou com a Revolução Russa (1917) e se espalhou por China (1949), Leste Europeu, Cuba, Vietnã e Coreia do Norte. Reduz o desemprego, mas limita liberdades.',
  teocracia:'Na teocracia, líderes religiosos governam e a lei religiosa é a lei do Estado. Exemplos históricos: o Vaticano, o Tibete dos Dalai-Lamas e o Irã desde a Revolução de 1979. Dá muita estabilidade, mas costuma frear a ciência.',
  tecnocracia:'A tecnocracia é o governo de especialistas (cientistas, engenheiros, economistas) escolhidos pela competência, e não por eleição ou herança. É mais uma ideia do que um regime real — aparece em gabinetes "técnicos" e em visões de futuro. No jogo, acelera a ciência e a economia.'
};
const HIST_ECON = {
  capitalismo:'O capitalismo de livre mercado deixa a produção e os preços para empresas privadas e a concorrência. Adam Smith o descreveu em "A Riqueza das Nações" (1776). Gera crescimento rápido, mas também desigualdade e crises (como a de 1929).',
  misto:'A economia mista combina mercado e Estado: empresas privadas convivem com estatais, regulação e bem-estar social. Virou o modelo da maioria dos países depois da Grande Depressão e da Segunda Guerra (as ideias de Keynes).',
  planificada:'Na economia planificada, o Estado decide o que produzir, quanto e a que preço, por meio de planos (os "planos quinquenais" soviéticos a partir de 1928). Industrializa rápido e acaba com o desemprego, mas tende a faltar produtos e eficiência.',
  mercantilismo:'O mercantilismo dominou os séculos XVI a XVIII: o objetivo era acumular ouro e prata, exportar mais do que importar e usar colônias como fonte de riqueza. Explica as grandes navegações e os monopólios das companhias de comércio.'
};
const HIST_ERA = {
  1500:'O mundo de 1500 vivia a Era dos Descobrimentos. Portugal chegara à Índia (1498) e ao Brasil (1500); a Espanha, à América (1492). Na América existiam os impérios Asteca e Inca; na África, os impérios Songai e do Congo; na Ásia, a China Ming e o Sultanato de Délhi. A imprensa de Gutenberg (1450) espalhava ideias.',
  1700:'Em 1700 reinavam as monarquias absolutas: Luís XIV na França, Pedro, o Grande, na Rússia, Kangxi na China. Os impérios coloniais de Espanha, Portugal, Inglaterra, França e Holanda dividiam a América e o comércio do mundo. Começava o Iluminismo, que questionaria o poder dos reis.',
  1850:'A Era Industrial: máquinas a vapor, ferrovias e fábricas transformavam a Europa e os Estados Unidos. O Brasil era um império com Dom Pedro II; a Índia era governada por uma companhia britânica; a China Qing enfrentava as Guerras do Ópio. A escravidão ainda existia em vários países.',
  1914:'Às vésperas da Primeira Guerra Mundial, impérios dividiam o mundo: Britânico, Russo, Alemão, Austro-Húngaro e Otomano. A África estava quase toda colonizada. Carros, aviões, rádio e eletricidade eram novidades. Em agosto de 1914 começaria a "Grande Guerra".',
  1960:'O auge da Guerra Fria: Estados Unidos e União Soviética disputavam o mundo com armas nucleares e a corrida espacial. A Alemanha e o Vietnã estavam divididos, e 17 países africanos conquistaram a independência só em 1960. O Brasil inaugurou Brasília.',
  2000:'A Era da Informação: internet, celulares e globalização. A União Soviética havia acabado (1991), a União Europeia crescia e a China se tornava a "fábrica do mundo". O Brasil estabilizara a economia com o Plano Real (1994).',
  2050:'Uma época imaginada: inteligência artificial, energia limpa, colônias espaciais e megacidades. Nada disso aconteceu ainda — é um futuro possível para você escrever.'
};
// acontecimentos históricos reais (ano, fato)
const TIMELINE = [
  [1450,'Gutenberg cria a imprensa de tipos móveis na Europa.'],[1453,'Os otomanos tomam Constantinopla; fim do Império Bizantino.'],[1492,'Colombo chega à América a serviço da Espanha.'],
  [1494,'Tratado de Tordesilhas divide o mundo entre Portugal e Espanha.'],[1498,'Vasco da Gama chega à Índia pelo mar.'],[1500,'Pedro Álvares Cabral chega ao Brasil.'],
  [1517,'Lutero publica suas 95 teses: começa a Reforma Protestante.'],[1521,'Os espanhóis conquistam Tenochtitlán, capital asteca.'],[1532,'Pizarro inicia a conquista do Império Inca.'],
  [1543,'Copérnico propõe que a Terra gira em torno do Sol.'],[1600,'Fundada a Companhia Britânica das Índias Orientais.'],[1602,'Fundada a Companhia Holandesa das Índias Orientais, primeira empresa com ações.'],
  [1618,'Começa a Guerra dos Trinta Anos na Europa.'],[1644,'A dinastia Qing toma o poder na China.'],[1648,'Paz de Vestfália: nasce a ideia moderna de Estado soberano.'],
  [1687,'Newton publica as leis do movimento e da gravidade.'],[1688,'Revolução Gloriosa na Inglaterra: o Parlamento limita o rei.'],[1694,'Fundado o Banco da Inglaterra.'],
  [1703,'Pedro, o Grande, funda São Petersburgo.'],[1751,'Começa a publicação da Enciclopédia de Diderot.'],[1763,'Rio de Janeiro vira capital do Brasil colonial.'],
  [1769,'James Watt aperfeiçoa a máquina a vapor.'],[1776,'Independência dos Estados Unidos; Adam Smith publica "A Riqueza das Nações".'],[1789,'Revolução Francesa: "Liberdade, Igualdade, Fraternidade".'],
  [1804,'Haiti se torna a primeira república negra independente.'],[1808,'A família real portuguesa chega ao Brasil.'],[1815,'Derrota de Napoleão em Waterloo.'],
  [1822,'Independência do Brasil.'],[1830,'Primeira ferrovia de passageiros entre cidades (Liverpool–Manchester).'],[1839,'Começa a Primeira Guerra do Ópio na China.'],
  [1848,'Revoluções na Europa; Marx e Engels publicam o Manifesto Comunista.'],[1861,'Começa a Guerra Civil Americana; a Rússia abole a servidão.'],[1868,'Restauração Meiji: o Japão se moderniza.'],
  [1869,'Inaugurado o Canal de Suez.'],[1871,'Unificação da Alemanha e da Itália.'],[1876,'Graham Bell patenteia o telefone.'],[1884,'Conferência de Berlim divide a África entre potências europeias.'],
  [1888,'Lei Áurea: o Brasil abole a escravidão.'],[1889,'Proclamação da República no Brasil.'],[1903,'Primeiro voo motorizado dos irmãos Wright; Santos-Dumont voa em 1906.'],
  [1914,'Começa a Primeira Guerra Mundial.'],[1917,'Revolução Russa.'],[1918,'Fim da Primeira Guerra; queda dos impérios Alemão, Austro-Húngaro, Russo e Otomano.'],
  [1929,'Quebra da Bolsa de Nova York e Grande Depressão.'],[1939,'Começa a Segunda Guerra Mundial.'],[1944,'Acordo de Bretton Woods cria o FMI e o Banco Mundial.'],
  [1945,'Fim da Segunda Guerra; bombas atômicas em Hiroshima e Nagasaki; criação da ONU.'],[1947,'Independência da Índia e do Paquistão.'],[1949,'Revolução Chinesa; criação da OTAN.'],
  [1957,'A União Soviética lança o Sputnik.'],[1960,'Ano da África: 17 independências. Inauguração de Brasília.'],[1961,'Construção do Muro de Berlim; Gagarin vai ao espaço.'],
  [1962,'Crise dos Mísseis em Cuba.'],[1969,'O ser humano pisa na Lua.'],[1971,'Fim do padrão-ouro do dólar.'],[1973,'Primeira crise do petróleo.'],
  [1989,'Queda do Muro de Berlim; nasce a World Wide Web.'],[1991,'Fim da União Soviética.'],[1994,'Plano Real no Brasil; fim do apartheid na África do Sul.'],
  [2001,'Ataques de 11 de setembro nos Estados Unidos.'],[2007,'Lançamento do iPhone; começa a era dos smartphones.'],[2008,'Crise financeira mundial.'],
  [2020,'Pandemia de covid-19; vacinas de RNA em tempo recorde.'],[2022,'Inteligência artificial generativa se populariza.']
];
const HIST_RELIG = {catolico:'Igreja cristã liderada pelo papa em Roma; a maior do mundo.', protestante:'Surgiu com a Reforma de Lutero (1517); forte no norte da Europa e nos EUA.',
  ortodoxo:'Ramo cristão separado de Roma em 1054; forte na Rússia, Grécia e Bálcãs.', evangelico:'Movimentos protestantes que cresceram muito nas Américas no século XX.', cristao:'Cristianismo sem igreja específica.',
  espirita:'Doutrina codificada por Allan Kardec (1857); muito forte no Brasil.', islamico:'O Islã sunita, maior ramo do Islamismo, fundado por Maomé no século VII.', xiita:'Ramo do Islã majoritário no Irã e no Iraque.',
  sufi:'Vertente mística do Islã.', judaico:'A mais antiga das religiões abraâmicas; Israel é o único Estado judeu.', bahai:'Fé surgida na Pérsia (1863) que prega a unidade de todas as religiões.',
  zoroastrismo:'Antiga religião persa, uma das primeiras monoteístas.', hindu:'Religião majoritária da Índia, com milhares de anos.', budista:'Fundado por Sidarta Gautama (século V a.C.); forte no Sudeste e Leste da Ásia.',
  sikh:'Fundado no Punjab (século XV).', jainismo:'Religião indiana da não violência absoluta.', xintoismo:'Religião tradicional do Japão, ligada à natureza e ao imperador.', taoismo:'Filosofia e religião chinesa do equilíbrio (Tao).',
  confucionismo:'Ética chinesa de Confúcio: ordem, hierarquia e estudo. Guiou a China e a Coreia por séculos.', afro:'Candomblé e Umbanda, nascidos da fé de africanos escravizados no Brasil.',
  tradicional_africana:'Crenças nos ancestrais e espíritos da natureza, anteriores ao cristianismo e ao Islã na África.', indigena:'A espiritualidade dos povos originários das Américas.', ancestral:'Cultos antigos aos ancestrais e à natureza.',
  nordico:'Os deuses vikings (Odin, Thor).', helenico:'Os deuses da Grécia e de Roma antigas.', culto_imperial:'O governante adorado como divino (como no Japão até 1945).', laico:'O Estado não tem religião oficial e garante a liberdade de crença.',
  ateu:'O Estado promove o ateísmo, como na União Soviética e na China maoista.'};
const HIST_UNIT = {inf:'Soldados a pé: a base de todo exército, de lanceiros a fuzileiros.', cav:'Tropas a cavalo, rápidas e fortes no ataque; dominaram até a Primeira Guerra.',
  art:'Canhões e obuses que destroem defesas de longe. Napoleão era artilheiro.', tanque:'Tanques: veículos blindados com canhão, estreados em 1916; decisivos na Segunda Guerra.',
  aviao:'Aviões de caça e bombardeio, usados em guerra desde 1914.', missil:'Foguetes guiados de longo alcance, desenvolvidos a partir de 1944.', drone:'Aeronaves sem piloto, comuns nas guerras do século XXI.',
  frag:'Navio de guerra rápido para escolta e patrulha.', encour:'Navios gigantes e muito armados, reis dos mares entre 1906 e 1945.', porta:'Navio que leva aviões; dominou a guerra naval desde a Segunda Guerra.',
  nuke:'A arma mais destrutiva já criada, usada só duas vezes (1945). Seu uso traz consequências mundiais.'};
const GLOSSARIO = [
  ['PIB','Produto Interno Bruto: o valor de tudo o que o país produz em um ano. Mede o tamanho da economia.'],['PIB per capita','O PIB dividido pela população: indica a riqueza média de cada habitante.'],
  ['IDH','Índice de Desenvolvimento Humano (de 0 a 1): combina renda, educação e saúde.'],['Inflação','Aumento geral dos preços; o dinheiro perde valor.'],
  ['Déficit','Quando o governo gasta mais do que arrecada no mês.'],['Dívida pública','O que o governo deve; cobra juros todo mês. Acima de 300% do PIB sem dinheiro, o país quebra.'],
  ['Estabilidade','Quanto o país está em ordem. Abaixo de 10% por muito tempo leva a revoluções.'],['Apoio popular','Quanto o povo aprova o governo. Em democracias, decide eleições.'],
  ['Corrupção','Dinheiro desviado. Polícia e educação ajudam a reduzir.'],['Cansaço de guerra','O povo se cansa de guerras longas; o apoio cai.'],
  ['Divisão','Unidade militar (infantaria, blindados...). Um exército é formado por várias divisões.'],['Exército (corpo)','Grupo de divisões que se move pelo mapa e ataca.'],
  ['Moral','Ânimo das tropas: vitórias sobem, derrotas descem.'],['Placar de guerra','Quem está ganhando a guerra; decide os termos de paz.'],
  ['Tecnocracia','Governo de especialistas.'],['Mercantilismo','Política econômica de acumular ouro e exportar mais do que importar.'],
  ['Padrão-ouro','Sistema em que a moeda vale uma quantidade fixa de ouro (comum de 1870 a 1971).'],['Banco central','Instituição que emite a moeda e controla os juros (o primeiro moderno: Banco da Inglaterra, 1694).']
];
const MONEY_TEXT = `<p><b>Moeda.</b> Cada nação tem sua moeda (real, dólar, libra…). No jogo, o símbolo é só identidade; o que importa é o PIB, o tesouro e a dívida.</p>
<p><b>Como o dinheiro funcionou na história.</b> Até o século XVIII as moedas eram de ouro e prata (o mercantilismo queria acumular metais). Bancos e letras de câmbio surgiram na Itália (século XV) e os bancos centrais no século XVII. De 1870 a 1914 vigorou o <b>padrão-ouro</b>; em 1944, <b>Bretton Woods</b> ligou as moedas ao dólar, e o dólar ao ouro; em 1971 os EUA acabaram com essa ligação e hoje as moedas são <b>fiduciárias</b> (valem pela confiança no governo).</p>
<p><b>No jogo.</b> Impostos enchem o tesouro, mas impostos altos derrubam o apoio. Gastos (educação, saúde, infraestrutura, bem-estar, ciência, polícia) melhoram o país, mas podem gerar déficit. Empréstimos viram dívida com juros mensais. Inflação alta corrói a economia e irrita o povo. O comércio com outras nações (acordos) traz renda todo mês.</p>`;
const WAR_TEXT = `<p><b>Exércitos e divisões.</b> Suas tropas ficam em exércitos no mapa, cada um com várias divisões. Para atacar, o exército precisa estar perto da fronteira (ferrovias, motores e paraquedistas aumentam o alcance; com navios, dá para atacar pelo litoral).</p>
<p><b>O ataque.</b> Clique numa região inimiga e escolha: quanto das tropas empenhar, a tática (frontal, cerco ou relâmpago), o apoio aéreo, os mísseis e a barragem de artilharia. A barra mostra as chances de cada resultado:</p>
<ul><li><b>Vitória decisiva</b> — toma de 2 a 7 regiões, com poucas perdas.</li><li><b>Vitória parcial</b> — toma 1 ou 2 regiões.</li><li><b>Empate</b> — ninguém avança e os dois lados perdem tropas.</li><li><b>Derrota</b> — perde muitas tropas; numa derrota feia, o inimigo contra-ataca.</li></ul>
<p><b>Cidades e capitais</b> defendem melhor (defesa urbana). Conquistar uma cidade a coloca na sua lista e rende saque; tomar um estado inteiro o anexa.</p>
<p><b>Arma nuclear.</b> Só é usada se você escolher, e o mundo inteiro reage.</p>
<p><b>Paz.</b> Na mesa de paz você propõe valores (pagar ou receber) e a outra nação aceita ou faz uma contraproposta.</p>`;
const SPY_TEXT = `<p><b>Espionagem</b> (na janela de cada nação) revela as instalações estratégicas: bases militares, usinas, hidrelétricas, abastecimento de água, polos industriais e portos.</p>
<p><b>Operações secretas.</b> Com uma instalação descoberta, você pode sabotá-la: agentes infiltrados, comando de explosivos, ataque cibernético e, em guerra, bombardeio aéreo ou míssil. A chance depende da sua tecnologia, do regime do alvo (ditaduras vigiam mais), de o alvo ser a capital e de quantas tentativas ele já sofreu (fica em alerta).</p>
<p>Se der certo, a instalação fica fora do ar e o alvo perde exército, economia, população ou marinha. Se falhar e for descoberta, as relações despencam — e um país agressivo pode declarar guerra.</p>
<p><b>Na história:</b> a sabotagem foi muito usada nas duas guerras mundiais (como a resistência francesa contra ferrovias nazistas) e na Guerra Fria; hoje inclui ataques cibernéticos, como o vírus Stuxnet (2010).</p>`;
const PARTY_TEXT = `<p>Nas <b>democracias</b> e <b>monarquias constitucionais</b>, o governo pertence a um <b>partido</b>. Você pode escolher um partido real da época (como PSDB e PT no Brasil de 2000, ou Liberais e Conservadores no século XIX) ou criar o seu, com nome, sigla e ideologia.</p>
<ul><li><b>Esquerda</b> — prioriza igualdade e direitos sociais; mais apoio popular, menos crescimento.</li><li><b>Centro-esquerda</b> — social-democracia: mercado com proteção social.</li>
<li><b>Centro</b> — busca o equilíbrio; mais estabilidade.</li><li><b>Centro-direita</b> — mercado e responsabilidade fiscal; mais crescimento e comércio.</li><li><b>Direita</b> — ordem, mercado livre e tradição; cresce mais, mas o apoio pode cair.</li></ul>
<p>Em outros regimes, o poder é de outro grupo: uma <b>dinastia</b> (monarquias), uma <b>junta militar</b> (ditaduras), um <b>partido único</b> (comunismo), uma <b>ordem religiosa</b> (teocracia) ou um <b>conselho técnico</b> (tecnocracia). Grupos históricos reais dão um pouco mais de força.</p>
<p>A palavra "esquerda" e "direita" vem da Revolução Francesa: na Assembleia de 1789, os defensores de mudanças sentavam à esquerda e os do rei, à direita.</p>`;

// ------------------------------------------------------------
//  Seções
// ------------------------------------------------------------
const encFx = fx => (typeof fxList === 'function' && fx) ? `<div class="enc-fx">Efeitos no jogo: ${fxList(fx)}</div>` : '';
const encNorm = t => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const encItem = (title, body, extra) => `<div class="enc-item" data-text="${esc(encNorm(title + ' ' + body.replace(/<[^>]+>/g, ' ')))}"><h4>${title}</h4><div>${body}</div>${extra||''}</div>`;
const ENC_SECTIONS = [
  {id:'inicio', n:'🏁 Como começar', f:()=>encItem('O que é o Imperium', 'Você governa uma nação mês a mês: economia, leis, ciência, diplomacia e guerra. Pode criar um país novo (desenhando o território) ou governar um país real em qualquer época, de 1500 a 2050. O mapa, as capitais, os governantes e as cidades seguem a história real de cada época.')
    + encItem('O primeiro ano', '1) Ajuste impostos e gastos na aba Economia. 2) Escolha uma pesquisa na aba Ciência. 3) Faça acordos comerciais na Diplomacia. 4) Construa obras clicando no mapa (aba Obras). 5) Observe o apoio popular e a estabilidade: se caírem muito, o governo cai.')
    + encItem('Modos de jogo', 'Modo livre: sem vitória, governe o quanto quiser (mas dá para perder). Modo com objetivos: 4 capítulos de metas e um objetivo final difícil, que é a única vitória.')
    + encItem('Configuração do mundo', 'Antes de criar o país você escolhe a dificuldade: quantidade de países, agressividade da IA, cofre inicial, velocidade da pesquisa, humor do povo, eventos e desastres.')},
  {id:'epocas', n:'⏳ Épocas', f:()=>Object.entries(ERAS).map(([k,e])=>encItem(`${e.year} — ${e.name}`, HIST_ERA[k] || e.desc)).join('')},
  {id:'historia', n:'📜 Linha do tempo', f:()=>`<div class="enc-intro">Acontecimentos reais que moldaram o mundo do jogo.</div>` + TIMELINE.map(([y,t])=>encItem(`${y}`, t)).join('')},
  {id:'regimes', n:'🏛️ Regimes políticos', f:()=>Object.entries(GOVS).map(([k,g])=>encItem(`${g.name} <small>(título: ${g.title})</small>`, `${HIST_GOV[k]||''}<p><b>No jogo:</b> ${g.desc||''}${g.elections?' Tem eleições.':''}${g.coup?' Corre risco de golpe.':''}${typeof GOV_FROM !== 'undefined' && GOV_FROM[k] ? ` Disponível a partir de ${GOV_FROM[k]}.` : ''}</p>`, encFx(g.mods))).join('')},
  {id:'partidos', n:'🗳️ Partidos e grupos de poder', f:()=>encItem('Partidos, dinastias e juntas', PARTY_TEXT)},
  {id:'economia', n:'💰 Economia e moeda', f:()=>encItem('Dinheiro, impostos e dívida', MONEY_TEXT) + Object.entries(ECONS).map(([k,e])=>encItem(e.name, `${HIST_ECON[k]||''}<p><b>No jogo:</b> ${e.desc||''}${typeof ECON_FROM !== 'undefined' && ECON_FROM[k] ? ` Disponível a partir de ${ECON_FROM[k]}.` : ''}</p>`, encFx(e.mods))).join('')},
  {id:'leis', n:'📋 Leis e Constituição', f:()=>POLICIES.map(pl=>encItem(`${pl.icon||''} ${pl.n}`, pl.d||'', encFx(pl.fx))).join('')
    + (typeof CONSTITUTION !== 'undefined' ? Object.values(CONSTITUTION).map(c=>encItem(`📜 ${c.n}`, 'Opções: ' + Object.values(c.opts).map(o=>o.n).join(' · ') + '. A Constituição existe nas democracias e monarquias constitucionais; mudar exige emendas que levam meses.')).join('') : '')},
  {id:'diplomacia', n:'🤝 Diplomacia e acordos', f:()=>encItem('Relações entre nações', 'Cada nação gosta ou não de você conforme religião, regime, acordos, guerras e suas atitudes. Presentes melhoram relações; insultos e espionagem descoberta pioram. Alianças fazem aliados entrarem nas suas guerras.')
    + (typeof DEALS !== 'undefined' ? Object.values(DEALS).map(d=>encItem(`${d.icon} ${d.n}`, `${d.d} <i>(exige relação ${d.minRel||0}+, negociação de ${d.months[0]}–${d.months[1]} meses, dura ${d.years} anos)</i>`)).join('') : '')},
  {id:'guerra', n:'⚔️ Guerra e exércitos', f:()=>encItem('Como a guerra funciona', WAR_TEXT) + UNITS.map(u=>encItem(`${u.icon} ${u.n}`, `${HIST_UNIT[u.id]||''} <i>Ataque ${u.atk}, defesa ${u.def}${u.nav?`, naval ${u.nav}`:''}.</i>`)).join('')},
  {id:'espionagem', n:'🕵️ Espionagem e sabotagem', f:()=>encItem('Espiões e operações secretas', SPY_TEXT) + Object.entries(SITES).map(([k,s])=>encItem(`${s.icon} ${s.n}`, `Se for capturada ou sabotada: ${s.d}.`)).join('')},
  {id:'ciencia', n:'🔬 Pesquisas', f:()=>`<div class="enc-intro">Cada pesquisa só fica disponível perto do ano em que foi inventada de verdade.</div>` + Object.values(TECH_CATS).map(cat=>`<div class="enc-cat">${cat.icon} ${cat.n}</div>` + cat.ids.map(id=>TECH[id]).filter(Boolean).sort((a,b)=>a.year-b.year).map(t=>encItem(`${t.icon} ${t.n} <small>(${t.year})</small>`, t.d||'', encFx(t.fx))).join('')).join('')},
  {id:'obras', n:'🏗️ Obras', f:()=>Object.entries(BUILDINGS).map(([k,b])=>encItem(`${b.icon} ${b.n}`, (typeof BUILD_TIPS !== 'undefined' && BUILD_TIPS[k]) || b.d, (b.req && TECH[b.req] ? `<div class="enc-fx">Requer: ${TECH[b.req].n}</div>` : '') + encFx(b.fx))).join('')
    + encItem('🏙️ Obras em cidades grandes', 'Construir dentro de uma cidade grande rende mais: +10% em cidades médias, +20% acima de 200 mil habitantes e +35% acima de 1 milhão.')},
  {id:'territorio', n:'🗺️ Território, estados e cidades', f:()=>encItem('Estados', 'Ao governar um país real, você começa com os estados e províncias reais dele. Conquistar um estado estrangeiro inteiro o anexa; perder todas as regiões de um estado seu o remove.')
    + encItem('Cidades', 'Cidades reais aparecem no mapa conforme o zoom e a época (Brasília só existe a partir de 1960, por exemplo), com os nomes da época (Constantinopla, Batávia, Leningrado...). Cidades dão defesa nos ataques, saque ao serem conquistadas e bônus para obras.')
    + encItem('Capital', 'A capital é o coração do país: perdê-la abala tudo. Você pode transferi-la para outra cidade sua (custa dinheiro e estabilidade).')
    + encItem('Colonização e expedições', 'Terras sem dono (como a África de 1850 ou a América de 1500) podem ser colonizadas perto da sua fronteira ou pelo mar. Expedições navais, de dirigível ou aéreas fundam postos avançados longe de casa.')},
  {id:'geografia', n:'🌦️ Clima, terreno e recursos', f:()=>Object.values(CLIMATES).map(c=>encItem(`🌡️ ${c.name}`, c.desc, encFx(c.mods))).join('') + Object.values(TERRAINS).map(c=>encItem(`⛰️ ${c.name}`, c.desc, encFx(c.mods))).join('') + Object.values(RESOURCES).map(r=>encItem(`${r.icon} ${r.name}`, r.desc, encFx(r.mods))).join('')},
  {id:'lider', n:'👤 Líderes e perfis', f:()=>encItem('Governantes reais', 'As outras nações usam governantes reais da época (até 2030): reis, imperadores, sultões, xoguns, presidentes e primeiros-ministros. Ficam de fora governantes lembrados por genocídios e grandes crimes. Depois de 2030, o futuro é inventado.')
    + Object.values(TRAITS).map(t=>encItem(`Perfil: ${t.name}`, t.desc, encFx(t.mods))).join('')},
  {id:'religioes', n:'⛪ Religiões', f:()=>`<div class="enc-intro">Nações da mesma fé tendem a ser amigas. Algumas religiões só existem a partir de certa época.</div>` + Object.entries(RELIGIONS).map(([k,v])=>encItem(v, HIST_RELIG[k]||'')).join('')},
  {id:'conquistas', n:'🏅 Conquistas', f:()=>encItem('Conquistas com consequências', 'Mais de 150 conquistas. As importantes mudam o rumo do jogo: tomar capitais deixa o mundo com medo (mais guerras), ser pacífico atrai acordos, dar calote afasta todos. Conquistas repetidas contam 2x, 3x...')},
  {id:'glossario', n:'📚 Glossário', f:()=>GLOSSARIO.map(([t,d])=>encItem(t, d)).join('')}
];

function openEncyclopedia(section){
  section = section || 'inicio';
  const S = ENC_SECTIONS.find(s => s.id === section) || ENC_SECTIONS[0];
  showPage('📖 Enciclopédia — aprenda a jogar e a história do mundo', `<div class="enc">
    <div class="enc-nav"><input type="text" id="enc-q" placeholder="🔎 Buscar (ex.: inflação, Napoleão, tanque)">${ENC_SECTIONS.map(s=>`<button data-enc="${s.id}" class="${s.id===S.id?'on':''}">${s.n}</button>`).join('')}</div>
    <div class="enc-body" id="enc-body"><h3 class="enc-h">${S.n}</h3>${S.f()}</div></div>`, ()=>{
    $$('[data-enc]').forEach(b=> b.onclick = ()=>{ SFX.page(); openEncyclopedia(b.dataset.enc); });
    const q = $('#enc-q');
    q.oninput = ()=>{
      const t = encNorm(q.value.trim()), body = $('#enc-body');
      if (t.length < 2){ body.innerHTML = `<h3 class="enc-h">${S.n}</h3>${S.f()}`; return; }
      const all = ENC_SECTIONS.map(s=>({s, html:s.f()}));
      const tmp = document.createElement('div'); let out = '';
      for (const {s, html} of all){ tmp.innerHTML = html; const hits = [...tmp.querySelectorAll('.enc-item')].filter(e => e.dataset.text.includes(t)); if (hits.length) out += `<div class="enc-cat">${s.n}</div>` + hits.map(h=>h.outerHTML).join(''); }
      body.innerHTML = `<h3 class="enc-h">Resultados para "${esc(q.value)}"</h3>` + (out || '<div class="muted">Nada encontrado.</div>');
    };
  });
}
