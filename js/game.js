// ============================================================
//  IMPERIUM — Motor do jogo: regras, economia, guerra, IA
// ============================================================
'use strict';

let G = null;
const SAVE_KEY = 'imperium_save_v2', HIST_KEY = 'imperium_history_v1', SET_KEY = 'imperium_settings_v1';
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MONTHS_S = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

// ------------------------------------------------------------
//  Definições
// ------------------------------------------------------------
const ERAS = {
  1500:{name:'Era dos Descobrimentos', year:1500, popF:0.07, pcF:0.04, desc:'Caravelas, impérios nativos e reinos feudais. O Novo Mundo ainda não foi dividido.'},
  1700:{name:'Era das Monarquias', year:1700, popF:0.1, pcF:0.05, desc:'Reis absolutos, impérios coloniais e o começo do Iluminismo.'},
  1850:{name:'Era Industrial', year:1850, popF:0.22, pcF:0.08, desc:'Vapor, ferrovias e canhões. Quase tudo está por ser inventado.'},
  1914:{name:'Era das Grandes Guerras', year:1914, popF:0.35, pcF:0.16, desc:'Motores, encouraçados e impérios em tensão.'},
  1960:{name:'Era Atômica', year:1960, popF:0.55, pcF:0.35, desc:'Guerra Fria, corrida espacial e a sombra da bomba.'},
  2000:{name:'Era da Informação', year:2000, popF:0.85, pcF:0.7, desc:'Internet, globalização e novas potências.'},
  2050:{name:'Era Futurista', year:2050, popF:1.0, pcF:1.15, desc:'Época fictícia: inteligência artificial, colônias espaciais e megacidades. O futuro ainda não escrito.', fictional:true}
};

const GOVS = {
  democracia:{name:'Democracia Parlamentar', title:'Primeiro-Ministro', prefix:'República Democrática de', elections:true, family:'dem',
    mods:{taxEff:-0.05, growth:0.4, research:0.1, military:-0.1, approval:6, corruption:0.04, warWeary:0.5}, desc:'Eleições a cada 4 anos. Alto apoio e pesquisa, mas guerras cansam o povo rapidamente.'},
  republica:{name:'República Presidencialista', title:'Presidente', prefix:'República de', elections:true, family:'dem',
    mods:{growth:0.3, research:0.05, stability:2, approval:4, corruption:0.07, warWeary:0.25}, desc:'Equilibrada. Eleições a cada 4 anos.'},
  federacao:{name:'República Federativa', title:'Presidente', prefix:'República Federativa de', elections:true, family:'dem',
    mods:{taxEff:-0.05, growth:0.3, research:0.05, stability:4, approval:4, corruption:0.07, warWeary:0.25, admin:0.1}, desc:'Estados autônomos: administração eficiente em países grandes. Eleições a cada 4 anos.'},
  monarquia_const:{name:'Monarquia Constitucional', title:'Rei', prefix:'Reino de', family:'mon', succession:true,
    mods:{growth:0.3, stability:8, approval:3, corruption:0.05, warWeary:0.2}, desc:'Estável e tradicional. Sucessão dinástica, sem eleições para o chefe de Estado.'},
  monarquia_abs:{name:'Monarquia Absoluta', title:'Rei', prefix:'Reino de', family:'mon', succession:true, coup:true,
    mods:{taxEff:0.05, research:-0.1, military:0.1, stability:5, approval:-3, corruption:0.12, warWeary:-0.2}, desc:'O monarca decide tudo. Arrecadação alta, corrupção elevada, risco de conspirações.'},
  imperio:{name:'Império', title:'Imperador', prefix:'Império de', family:'mon', succession:true, coup:true,
    mods:{taxEff:0.05, research:-0.05, military:0.25, stability:3, approval:-2, corruption:0.1, warWeary:-0.4}, desc:'Nascido para conquistar: exército forte, povo tolera guerras.'},
  ditadura:{name:'Ditadura Militar', title:'General', prefix:'Estado de', family:'aut', coup:true,
    mods:{taxEff:0.1, growth:-0.2, research:-0.15, military:0.3, stability:10, approval:-10, corruption:0.15, warWeary:-0.4}, desc:'Força bruta e ordem. Exército poderoso, mas golpes são constantes.'},
  comunismo:{name:'Estado Comunista', title:'Secretário-Geral', prefix:'República Popular de', family:'com', coup:true,
    mods:{taxEff:0.2, growth:0.1, research:0.05, military:0.15, stability:8, approval:-4, corruption:0.12, warWeary:-0.3, unemployment:-4}, desc:'O partido controla a economia. Baixo desemprego, alta arrecadação.'},
  teocracia:{name:'Teocracia', title:'Sumo Sacerdote', prefix:'Santa Teocracia de', family:'teo',
    mods:{taxEff:-0.05, growth:-0.2, research:-0.25, military:0.05, stability:12, approval:2, corruption:0.08, warWeary:-0.2}, desc:'A fé governa. Estabilidade enorme, ciência lenta.'},
  tecnocracia:{name:'Tecnocracia', title:'Diretor Supremo', prefix:'Comunidade Técnica de', family:'tec',
    mods:{taxEff:0.05, growth:0.6, research:0.35, military:-0.05, approval:-2, corruption:0.03, warWeary:0.1}, desc:'Governada por especialistas. Ciência e crescimento acelerados.'}
};

const ECONS = {
  capitalismo:{name:'Capitalismo de Livre Mercado', mods:{growth:0.8, taxEff:-0.05, unemployment:2, approval:-1, gdpMult:0.05}, desc:'Cresce rápido, mas gera desigualdade e desemprego.'},
  misto:{name:'Economia Mista', mods:{growth:0.3, stability:2}, desc:'Equilíbrio entre Estado e mercado.'},
  planificada:{name:'Economia Planificada', mods:{growth:-0.2, taxEff:0.15, unemployment:-4, stability:3, gdpMult:-0.05}, desc:'O Estado planeja tudo: estável, mas pouco eficiente.'},
  mercantilismo:{name:'Mercantilismo', mods:{tradeMult:0.4, growth:0.2, relations:-5}, desc:'Comércio exterior agressivo e acúmulo de riquezas.'}
};

const TRAITS = {
  carismatico:{name:'Carismático', mods:{approval:8, relations:5}, desc:'+8 apoio popular, +5 relações'},
  militarista:{name:'Militarista', mods:{military:0.15, defense:0.1, approval:-2}, desc:'+15% ataque, +10% defesa'},
  economista:{name:'Economista', mods:{growth:0.6, taxEff:0.05}, desc:'+0,6% crescimento, +5% arrecadação'},
  diplomata:{name:'Diplomata', mods:{relations:15}, desc:'+15 relações com todos'},
  cientista:{name:'Cientista', mods:{research:0.25}, desc:'+25% pesquisa'},
  reformista:{name:'Reformista', mods:{approval:4, stability:-3, corruption:-0.04}, desc:'Menos corrupção, mais apoio'},
  tirano:{name:'Mão de Ferro', mods:{stability:8, approval:-8, coup:-0.3}, desc:'+8 estabilidade, -8 apoio'},
  populista:{name:'Populista', mods:{approval:10, inflation:2, growth:-0.2}, desc:'+10 apoio, mais inflação'}
};

const RELIGIONS = {
  catolico:'Catolicismo', protestante:'Protestantismo', ortodoxo:'Cristianismo Ortodoxo', evangelico:'Evangelicalismo', cristao:'Cristianismo (não denominacional)', espirita:'Espiritismo',
  islamico:'Islamismo Sunita', xiita:'Islamismo Xiita', sufi:'Sufismo', judaico:'Judaísmo', bahai:'Fé Bahá\'í', zoroastrismo:'Zoroastrismo',
  hindu:'Hinduísmo', budista:'Budismo', sikh:'Siquismo', jainismo:'Jainismo', xintoismo:'Xintoísmo', taoismo:'Taoísmo', confucionismo:'Confucionismo',
  afro:'Religiões Afro-brasileiras (Candomblé/Umbanda)', tradicional_africana:'Religiões Tradicionais Africanas', indigena:'Espiritualidade Indígena',
  ancestral:'Fé Ancestral / Paganismo', nordico:'Paganismo Nórdico', helenico:'Religião Greco-Romana', culto_imperial:'Culto ao Imperador',
  laico:'Estado Laico (liberdade religiosa)', ateu:'Ateísmo de Estado'
};
const RELIGION_FAMILY = {catolico:'crist', protestante:'crist', ortodoxo:'crist', evangelico:'crist', cristao:'crist', espirita:'crist',
  islamico:'isl', xiita:'isl', sufi:'isl', judaico:'abr', bahai:'abr', zoroastrismo:'abr',
  hindu:'dharma', budista:'dharma', sikh:'dharma', jainismo:'dharma', xintoismo:'asia', taoismo:'asia', confucionismo:'asia',
  afro:'trad', tradicional_africana:'trad', indigena:'trad', ancestral:'trad', nordico:'trad', helenico:'trad', culto_imperial:'trad', laico:'sec', ateu:'sec'};
function relFam(r){ return RELIGION_FAMILY[r] || r; }

const CLIMATES = {
  tropical:{name:'Tropical', mods:{popGrowth:0.4, gdpMult:-0.03}, desc:'População cresce rápido; epidemias mais comuns.'},
  temperado:{name:'Temperado', mods:{growth:0.2}, desc:'Equilibrado, bom para a economia.'},
  arido:{name:'Árido', mods:{popGrowth:-0.3, defense:0.05}, desc:'Secas frequentes; petróleo mais provável.'},
  frio:{name:'Frio / Ártico', mods:{popGrowth:-0.4, defense:0.15}, desc:'Invasores sofrem com o inverno (+defesa).'},
  mediterraneo:{name:'Mediterrâneo', mods:{approval:3, gdpMult:0.03}, desc:'Turismo e qualidade de vida.'}
};
const TERRAINS = {
  planicie:{name:'Planícies', mods:{popGrowth:0.2, defense:-0.1, growth:0.1}, desc:'Fértil, mas difícil de defender.'},
  montanhoso:{name:'Montanhoso', mods:{defense:0.3, growth:-0.2}, desc:'Fortaleza natural: +30% defesa.'},
  florestal:{name:'Florestal', mods:{defense:0.1, growth:0.1}, desc:'Madeira e esconderijos.'},
  costeiro:{name:'Costeiro', mods:{tradeMult:0.2, navy:0.2}, desc:'Portos e comércio marítimo.'},
  desertico:{name:'Desértico', mods:{defense:0.1, popGrowth:-0.3}, desc:'Hostil para invasores e habitantes.'},
  arquipelago:{name:'Arquipélago', mods:{navy:0.4, defense:0.15, tradeMult:0.2}, desc:'Ilhas: marinha forte é essencial.'}
};
const FOCI = {
  agricultura:{name:'Agricultura', mods:{popGrowth:0.3, stability:3}, desc:'Comida farta, povo estável.'},
  industria:{name:'Indústria', mods:{growth:0.5, unitCost:-0.1}, desc:'Fábricas e produção militar barata.'},
  comercio:{name:'Comércio', mods:{tradeMult:0.4, gdpMult:0.05}, desc:'Rotas comerciais lucrativas.'},
  militar:{name:'Militarismo', mods:{military:0.15, manpower:0.3}, desc:'Exército inicial 50% maior.'},
  ciencia:{name:'Ciência', mods:{research:0.25}, desc:'Universidades e inovação.'}
};
const RESOURCES = {
  petroleo:{name:'Petróleo', icon:'🛢️', mods:{gdpMult:0.08}, desc:'+8% PIB (dobra com Motor a Combustão)'},
  ouro:{name:'Ouro', icon:'🪙', mods:{gdpMult:0.04}, desc:'+4% PIB e renda extra mensal'},
  ferro:{name:'Ferro', icon:'⛏️', mods:{unitCost:-0.15, growth:0.3}, desc:'Unidades 15% mais baratas'},
  carvao:{name:'Carvão', icon:'⚫', mods:{growth:0.4, gdpMult:0.03}, desc:'Indústria acelerada'},
  madeira:{name:'Madeira', icon:'🌲', mods:{growth:0.2, navy:0.1}, desc:'Construção e navios'},
  terras:{name:'Terras Férteis', icon:'🌾', mods:{popGrowth:0.4, stability:3}, desc:'Comida farta'},
  pesca:{name:'Pesca', icon:'🐟', mods:{popGrowth:0.2, gdpMult:0.02}, desc:'Alimento e comércio costeiro'},
  uranio:{name:'Urânio', icon:'☢️', mods:{research:0.05}, desc:'Ogivas nucleares 50% mais baratas'},
  diamantes:{name:'Diamantes', icon:'💎', mods:{gdpMult:0.05, corruption:0.03}, desc:'Riqueza... e corrupção'},
  especiarias:{name:'Café & Especiarias', icon:'☕', mods:{tradeMult:0.3, gdpMult:0.03}, desc:'Exportações valiosas'},
  agua:{name:'Recursos Hídricos', icon:'💧', mods:{growth:0.2, popGrowth:0.1}, desc:'Rios e água doce: hidrelétricas com Eletricidade (+4% PIB)'}
};

const TECHS = [
  // Era 0 — Descobrimentos e Iluminismo
  {id:'caravela', n:'Caravela', icon:'⛵', year:1440, req:[], fx:{navy:0.05, tradeMult:0.03}, d:'Navios leves que enfrentam o oceano'},
  {id:'imprensa', n:'Imprensa de Tipos Móveis', icon:'📜', year:1450, req:[], fx:{research:0.04, approval:1}, d:'Livros baratos espalham o conhecimento'},
  {id:'polvora', n:'Arcabuz e Pólvora', icon:'💥', year:1450, req:[], fx:{military:0.05}, d:'As primeiras armas de fogo portáteis'},
  {id:'astrolabio', n:'Astrolábio Náutico', icon:'🧭', year:1480, req:['caravela'], fx:{navy:0.04, tradeMult:0.03}, d:'Navegar pelas estrelas em alto-mar'},
  {id:'bancos', n:'Bancos e Letras de Câmbio', icon:'🏦', year:1490, req:[], fx:{gdpMult:0.03, taxEff:0.02}, d:'Crédito e comércio à distância'},
  {id:'navegacao_oceanica', n:'Navegação Oceânica', icon:'🌊', year:1495, req:['astrolabio'], fx:{tradeMult:0.06, navy:0.05}, d:'Rotas pelo Atlântico e pelo Índico'},
  {id:'cartografia', n:'Cartografia Moderna', icon:'🗺️', year:1507, req:['navegacao_oceanica'], fx:{research:0.03, tradeMult:0.02}, d:'Mapas do mundo inteiro'},
  {id:'fortaleza_estrela', n:'Fortificação Abaluartada', icon:'🏰', year:1530, req:['polvora'], fx:{defense:0.08}, d:'Fortalezas em forma de estrela resistem aos canhões'},
  {id:'galeao', n:'Galeão', icon:'🚢', year:1550, req:['navegacao_oceanica'], fx:{navy:0.08, tradeMult:0.03}, d:'Grandes navios de carga e de guerra'},
  {id:'mosquete', n:'Mosquete', icon:'🔫', year:1560, req:['polvora'], fx:{military:0.06}, d:'Infantaria armada com mosquetes'},
  {id:'companhias', n:'Companhias de Comércio', icon:'⚖️', year:1602, req:['bancos','galeao'], fx:{tradeMult:0.07, gdpMult:0.02}, d:'Empresas com ações financiam as viagens'},
  {id:'telescopio', n:'Telescópio', icon:'🔭', year:1608, req:['imprensa'], fx:{research:0.04, navy:0.02}, d:'Ver longe, no céu e no mar'},
  {id:'bolsa', n:'Bolsa de Valores', icon:'📈', year:1610, req:['companhias'], fx:{gdpMult:0.03}, d:'O mercado de ações'},
  {id:'metodo_cientifico', n:'Método Científico', icon:'⚗️', year:1630, req:['telescopio'], fx:{research:0.08}, d:'Experimentos guiam o conhecimento'},
  {id:'exercito_permanente', n:'Exército Permanente', icon:'🎖️', year:1650, req:['mosquete'], fx:{military:0.06, manpower:0.05}, d:'Soldados profissionais o ano inteiro'},
  {id:'calculo', n:'Cálculo e Física Newtoniana', icon:'📐', year:1687, req:['metodo_cientifico'], fx:{research:0.07}, d:'As leis do movimento'},
  {id:'baioneta', n:'Baioneta', icon:'🗡️', year:1690, req:['exercito_permanente'], fx:{military:0.05, defense:0.03}, d:'O mosquete vira lança'},
  {id:'rotacao_culturas', n:'Rotação de Culturas', icon:'🌱', year:1730, req:[], fx:{popGrowth:0.08, growth:0.1}, d:'Mais comida na mesma terra'},
  {id:'iluminismo', n:'Iluminismo', icon:'💡', year:1740, req:['calculo','imprensa'], fx:{research:0.05, approval:2}, d:'Razão, liberdade e ciência'},
  {id:'enciclopedia', n:'Enciclopédia', icon:'📚', year:1751, req:['iluminismo'], fx:{research:0.05}, d:'Todo o saber num só livro'},
  {id:'para_raios', n:'Para-raios', icon:'⚡', year:1752, req:['metodo_cientifico'], fx:{stability:1}, d:'Proteção contra os raios'},
  {id:'fiacao', n:'Máquina de Fiar', icon:'🧶', year:1765, req:['rotacao_culturas'], fx:{gdpMult:0.03, unemployment:-0.3}, d:'O começo das fábricas'},
  {id:'balao', n:'Balão de Ar Quente', icon:'🎈', year:1783, req:['iluminismo'], fx:{research:0.02, approval:1}, d:'O primeiro voo humano'},
  {id:'imprensa_jornal', n:'Jornais', icon:'📰', year:1605, req:['imprensa'], fx:{approval:1, research:0.02}, d:'Notícias impressas toda semana'},
  {id:'microscopio', n:'Microscópio', icon:'🔬', year:1590, req:['imprensa'], fx:{research:0.03, popGrowth:0.02}, d:'O mundo invisível dos micróbios'},
  {id:'relogio_pendulo', n:'Relógio de Pêndulo', icon:'🕰️', year:1656, req:['metodo_cientifico'], fx:{research:0.03, gdpMult:0.01}, d:'Medir o tempo com precisão'},
  {id:'banco_central_antigo', n:'Banco Nacional e Dívida Pública', icon:'🏛️', year:1694, req:['bolsa'], fx:{taxEff:0.04, gdpMult:0.02}, d:'O Estado toma empréstimos com juros baixos'},
  {id:'semeadeira', n:'Semeadeira Mecânica', icon:'🌾', year:1701, req:[], fx:{popGrowth:0.05, growth:0.08}, d:'Plantio em linhas, colheitas maiores'},
  {id:'coque', n:'Fundição com Coque', icon:'🔥', year:1709, req:[], fx:{gdpMult:0.02, military:0.02}, d:'Ferro barato e em grande quantidade'},
  {id:'motor_newcomen', n:'Bomba a Vapor de Newcomen', icon:'⚙️', year:1712, req:['coque'], fx:{gdpMult:0.02}, d:'O vapor tira a água das minas'},
  {id:'termometro', n:'Termômetro', icon:'🌡️', year:1714, req:['metodo_cientifico'], fx:{research:0.02, popGrowth:0.02}, d:'Medir a temperatura e a febre'},
  {id:'cronometro', n:'Cronômetro Marítimo', icon:'⏱️', year:1735, req:['relogio_pendulo'], fx:{navy:0.06, tradeMult:0.04}, d:'Saber a longitude no meio do oceano'},
  {id:'canais_navegaveis', n:'Canais Navegáveis', icon:'🛶', year:1761, req:['rotacao_culturas'], fx:{tradeMult:0.05, growth:0.1}, d:'Barcos levam carvão e grãos pelo interior'},
  {id:'engenho_acucar', n:'Engenho de Açúcar', icon:'🍬', year:1520, req:[], fx:{gdpMult:0.03, tradeMult:0.03}, d:'Moendas movidas a água ou animais: o açúcar vira o ouro das colônias'},
  {id:'heliocentrismo', n:'Heliocentrismo', icon:'☀️', year:1543, req:['imprensa'], fx:{research:0.04, stability:-1}, d:'Copérnico: a Terra gira em torno do Sol'},
  {id:'anatomia', n:'Anatomia Moderna', icon:'🫀', year:1543, req:['imprensa'], fx:{popGrowth:0.03, research:0.02}, d:'Vesálio descreve o corpo humano por dissecação'},
  {id:'logaritmos', n:'Logaritmos', icon:'🔢', year:1614, req:['imprensa'], fx:{research:0.04, navy:0.02}, d:'Napier simplifica os cálculos de navegação e astronomia'},
  {id:'circulacao_sangue', n:'Circulação do Sangue', icon:'🩸', year:1628, req:['anatomia'], fx:{popGrowth:0.04}, d:'Harvey descobre que o coração bombeia o sangue'},
  {id:'barometro', n:'Barômetro', icon:'🌡️', year:1643, req:['metodo_cientifico'], fx:{research:0.02, navy:0.02}, d:'Torricelli mede a pressão do ar e prevê o tempo'},
  {id:'variolizacao', n:'Vacina da Varíola', icon:'💉', year:1796, req:['iluminismo'], fx:{popGrowth:0.06, approval:1}, d:'A primeira vacina da história'},
  // Era I — Vapor
  {id:'maquina_vapor', n:'Máquina a Vapor', icon:'♨️', year:1800, req:[], fx:{gdpMult:0.04, growth:0.2}, d:'+4% PIB, base da industrialização'},
  {id:'ferrovias', n:'Ferrovias', icon:'🚂', year:1830, req:['maquina_vapor'], fx:{gdpMult:0.05, growth:0.2}, d:'+5% PIB, +alcance de ataque terrestre'},
  {id:'navios_vapor', n:'Navios a Vapor', icon:'⛴️', year:1835, req:['maquina_vapor'], fx:{navy:0.15, tradeMult:0.1}, d:'+15% marinha, +10% comércio'},
  {id:'telegrafo', n:'Telégrafo', icon:'📡', year:1844, req:[], fx:{research:0.06, admin:0.04}, d:'+6% pesquisa, +4% administração'},
  {id:'fuzis', n:'Fuzis de Retrocarga', icon:'🔫', year:1850, req:[], fx:{military:0.08}, d:'+8% ataque'},
  {id:'metalurgia', n:'Aço Bessemer', icon:'⚒️', year:1856, req:['maquina_vapor'], fx:{military:0.08, growth:0.1}, unlock:['art'], d:'Libera Artilharia moderna'},
  {id:'saneamento', n:'Saneamento Básico', icon:'🚰', year:1860, req:[], fx:{popGrowth:0.2, approval:1}, d:'Cidades mais saudáveis'},
  {id:'medicina', n:'Teoria dos Germes', icon:'🔬', year:1865, req:['saneamento'], fx:{popGrowth:0.25}, d:'Medicina moderna'},
  {id:'dinamite', n:'Dinamite', icon:'🧨', year:1867, req:[], fx:{military:0.05, growth:0.1}, d:'Mineração e engenharia'},
  // Era II — Eletricidade
  {id:'telefone', n:'Telefone', icon:'☎️', year:1876, req:['telegrafo'], fx:{research:0.05, admin:0.03}, d:'Comunicação instantânea'},
  {id:'eletricidade', n:'Eletricidade', icon:'💡', year:1880, req:['telegrafo'], fx:{gdpMult:0.07, research:0.04}, d:'+7% PIB'},
  {id:'metralhadora', n:'Metralhadora', icon:'💥', year:1884, req:['fuzis','metalurgia'], fx:{defense:0.15}, d:'+15% defesa'},
  {id:'vacinas', n:'Vacinas', icon:'💉', year:1885, req:['medicina'], fx:{popGrowth:0.2, approval:1}, d:'Menos epidemias'},
  {id:'motor', n:'Motor a Combustão', icon:'⚙️', year:1886, req:['ferrovias'], fx:{gdpMult:0.05, growth:0.2}, d:'+5% PIB, petróleo vale o dobro'},
  {id:'quimica', n:'Química Industrial', icon:'⚗️', year:1890, req:['eletricidade'], fx:{gdpMult:0.05, popGrowth:0.1}, d:'Fertilizantes e indústria'},
  {id:'encouracados', n:'Encouraçados', icon:'🚢', year:1895, req:['metalurgia','navios_vapor'], fx:{navy:0.2}, unlock:['encour'], d:'Libera Encouraçados'},
  // Era III — Guerras mundiais
  {id:'aviacao', n:'Aviação', icon:'✈️', year:1910, req:['motor'], fx:{military:0.05}, unlock:['aviao'], d:'Libera Força Aérea'},
  {id:'producao_massa', n:'Produção em Massa', icon:'🏭', year:1913, req:['eletricidade','motor'], fx:{gdpMult:0.08, unitCost:-0.1}, d:'+8% PIB, unidades mais baratas'},
  {id:'blindados', n:'Blindados', icon:'🛡️', year:1916, req:['motor','metralhadora'], fx:{military:0.08}, unlock:['tanque'], d:'Libera Divisões Blindadas'},
  {id:'radio', n:'Rádio', icon:'📻', year:1920, req:['eletricidade'], fx:{research:0.08, approval:1}, d:'+8% pesquisa, propaganda'},
  {id:'porta_avioes', n:'Porta-aviões', icon:'🛳️', year:1925, req:['aviacao','encouracados'], fx:{navy:0.2}, unlock:['porta'], d:'Libera Porta-aviões'},
  {id:'plasticos', n:'Plásticos', icon:'🧴', year:1935, req:['quimica'], fx:{gdpMult:0.04}, d:'+4% PIB'},
  {id:'radar', n:'Radar', icon:'📶', year:1938, req:['radio'], fx:{defense:0.12, navy:0.1}, d:'+12% defesa'},
  {id:'antibioticos', n:'Antibióticos', icon:'💊', year:1940, req:['vacinas','quimica'], fx:{popGrowth:0.3, approval:1}, d:'Menos baixas e epidemias'},
  {id:'jato', n:'Motor a Jato', icon:'🛩️', year:1944, req:['aviacao'], fx:{military:0.08}, d:'+8% ataque'},
  {id:'foguetes', n:'Foguetes', icon:'🚀', year:1944, req:['aviacao','quimica'], fx:{military:0.06}, unlock:['missil'], d:'Libera Mísseis'},
  // Era IV — Atômica
  {id:'fissao', n:'Fissão Nuclear', icon:'☢️', year:1945, req:['quimica','radio'], fx:{gdpMult:0.02}, unlock:['nuke'], d:'Libera Ogivas Nucleares'},
  {id:'computacao', n:'Computação', icon:'🖥️', year:1946, req:['radio','producao_massa'], fx:{research:0.12, admin:0.04}, d:'+12% pesquisa'},
  {id:'transistor', n:'Transistor', icon:'🔌', year:1950, req:['computacao'], fx:{research:0.08, gdpMult:0.03}, d:'Eletrônica moderna'},
  {id:'televisao', n:'Televisão', icon:'📺', year:1950, req:['radio'], fx:{approval:2, stability:2}, d:'Cultura de massa'},
  {id:'usinas_nucleares', n:'Usinas Nucleares', icon:'⚛️', year:1956, req:['fissao'], fx:{gdpMult:0.06}, d:'+6% PIB'},
  {id:'satelites', n:'Satélites e Espaço', icon:'🛰️', year:1957, req:['foguetes','computacao'], fx:{research:0.08, military:0.04}, d:'Corrida espacial'},
  {id:'conteineres', n:'Comércio em Contêineres', icon:'📦', year:1960, req:['producao_massa'], fx:{tradeMult:0.3, growth:0.2}, d:'+30% comércio'},
  {id:'rev_verde', n:'Revolução Verde', icon:'🌱', year:1962, req:['quimica'], fx:{popGrowth:0.2, stability:3, gdpMult:0.03}, d:'Fim da fome'},
  // Era V — Informação
  {id:'microprocessador', n:'Computador Pessoal', icon:'💻', year:1975, req:['transistor'], fx:{gdpMult:0.06, research:0.1}, d:'+6% PIB, +10% pesquisa'},
  {id:'biotec', n:'Biotecnologia', icon:'🧫', year:1980, req:['antibioticos','computacao'], fx:{popGrowth:0.1, approval:1, gdpMult:0.03}, d:'Saúde avançada'},
  {id:'celulares', n:'Telefonia Móvel', icon:'📱', year:1985, req:['microprocessador'], fx:{gdpMult:0.04, admin:0.04}, d:'+4% PIB'},
  {id:'defesa_missil', n:'Escudo Antimísseis', icon:'🛡️', year:1985, req:['satelites','radar'], fx:{defense:0.2}, d:'+20% defesa, intercepta 70% das ogivas'},
  {id:'internet', n:'Internet', icon:'🌐', year:1991, req:['microprocessador'], fx:{gdpMult:0.1, research:0.12, growth:0.3}, d:'+10% PIB, +12% pesquisa'},
  {id:'renovaveis', n:'Energia Renovável', icon:'🔆', year:1995, req:['microprocessador'], fx:{gdpMult:0.04, stability:3, approval:1}, d:'Energia limpa'},
  {id:'gps', n:'GPS e Armas Guiadas', icon:'🎯', year:1995, req:['satelites','microprocessador'], fx:{military:0.12}, d:'+12% ataque'},
  // Era VI — Automação
  {id:'drones', n:'Drones de Combate', icon:'🛸', year:2005, req:['gps'], fx:{military:0.1}, unlock:['drone'], d:'Libera Drones'},
  {id:'smartphones', n:'Smartphones', icon:'📲', year:2007, req:['celulares','internet'], fx:{gdpMult:0.05, approval:1}, d:'+5% PIB'},
  {id:'robotica', n:'Robótica', icon:'🤖', year:2010, req:['internet'], fx:{gdpMult:0.1, unitCost:-0.1, unemployment:2}, d:'+10% PIB, automação'},
  {id:'ia', n:'Inteligência Artificial', icon:'🧠', year:2020, req:['internet','robotica'], fx:{research:0.3, gdpMult:0.08}, d:'+30% pesquisa'},
  {id:'edicao_genetica', n:'Edição Genética', icon:'🧬', year:2025, req:['biotec'], fx:{popGrowth:0.1, approval:2}, d:'Fim de doenças hereditárias'},
  {id:'quantica', n:'Computação Quântica', icon:'🔮', year:2035, req:['ia'], fx:{research:0.25}, d:'+25% pesquisa'},
  // ---- marcos adicionais da história ----
  {id:'fotografia', n:'Fotografia', icon:'📷', year:1839, req:[], fx:{research:0.02, approval:1}, d:'Registro do mundo; imprensa ilustrada'},
  {id:'anestesia', n:'Anestesia', icon:'💤', year:1846, req:[], fx:{popGrowth:0.1}, d:'Cirurgias seguras'},
  {id:'refinaria', n:'Refino de Petróleo', icon:'🛢️', year:1859, req:['maquina_vapor'], fx:{gdpMult:0.02}, d:'Permite industrializar o petróleo'},
  {id:'concreto', n:'Concreto Armado', icon:'🧱', year:1867, req:['metalurgia'], fx:{growth:0.15}, d:'Pontes, portos e cidades maiores'},
  {id:'refrigeracao', n:'Refrigeração', icon:'🧊', year:1876, req:['maquina_vapor'], fx:{popGrowth:0.1, tradeMult:0.05}, d:'Conserva alimentos; industrializa a pesca'},
  {id:'raio_x', n:'Raio-X', icon:'🩻', year:1895, req:['eletricidade'], fx:{popGrowth:0.05, research:0.02}, d:'Diagnóstico médico'},
  {id:'cinema', n:'Cinema', icon:'🎬', year:1895, req:['fotografia','eletricidade'], fx:{approval:2}, d:'Cultura e propaganda'},
  {id:'fertilizantes', n:'Fertilizantes Sintéticos', icon:'🧪', year:1909, req:['quimica'], fx:{popGrowth:0.15, gdpMult:0.02}, d:'Agroindústria (industrializa as terras férteis)'},
  {id:'dna', n:'Estrutura do DNA', icon:'🧬', year:1953, req:['antibioticos'], fx:{research:0.05}, d:'Nasce a genética moderna'},
  {id:'laser', n:'Laser', icon:'🔦', year:1960, req:['transistor'], fx:{research:0.03, military:0.02}, d:'Indústria e medicina de precisão'},
  {id:'transplantes', n:'Transplantes de Órgãos', icon:'🫀', year:1967, req:['antibioticos'], fx:{popGrowth:0.05, approval:1}, d:'Medicina avançada'},
  {id:'trem_bala', n:'Trem de Alta Velocidade', icon:'🚄', year:1964, req:['eletricidade','computacao'], fx:{growth:0.15, admin:0.03}, d:'Exércitos e cargas mais rápidos'},
  {id:'fibra_otica', n:'Fibra Óptica', icon:'💠', year:1977, req:['laser'], fx:{research:0.04, gdpMult:0.02}, d:'Comunicações em massa'},
  {id:'impressao3d', n:'Impressão 3D', icon:'🖨️', year:2010, req:['robotica'], fx:{unitCost:-0.05, gdpMult:0.02}, d:'Fabricação sob demanda'},
  {id:'genoma', n:'Genoma Humano', icon:'🧫', year:2003, req:['biotec','computacao'], fx:{popGrowth:0.05, research:0.03}, d:'Medicina personalizada'},
  {id:'vacinas_rna', n:'Vacinas de RNA', icon:'💉', year:2020, req:['genoma'], fx:{popGrowth:0.05, approval:1}, d:'Pandemias controladas'},
  {id:'redes_5g', n:'Redes 5G', icon:'📶', year:2019, req:['smartphones'], fx:{gdpMult:0.03}, d:'Tudo conectado'},
  // ---- ciência ampliada (atualização 3) ----
  {id:'imprensa_rotativa', n:'Imprensa Rotativa', icon:'🗞️', year:1843, req:[], fx:{research:0.02, approval:1}, d:'Jornais baratos: povo informado'},
  {id:'elevador', n:'Elevador de Segurança', icon:'🛗', year:1857, req:['metalurgia'], fx:{growth:0.1}, d:'Prédios altos: cidades crescem para cima'},
  {id:'metro', n:'Metrô', icon:'🚇', year:1863, req:['ferrovias'], fx:{gdpMult:0.015, approval:1}, d:'Libera o projeto de cidade “Metrô”'},
  {id:'pasteurizacao', n:'Pasteurização', icon:'🥛', year:1864, req:['medicina'], fx:{popGrowth:0.1}, d:'Alimentos seguros'},
  {id:'canais', n:'Canais Interoceânicos', icon:'🌊', year:1869, req:['dinamite'], fx:{tradeMult:0.15}, d:'Rotas marítimas mais curtas: +15% comércio, expedições navais mais rápidas'},
  {id:'lampada', n:'Lâmpada Elétrica', icon:'💡', year:1879, req:['telegrafo'], fx:{research:0.02, approval:1}, d:'Noites iluminadas: mais estudo e segurança'},
  {id:'turbina_vapor', n:'Turbina a Vapor', icon:'🌀', year:1884, req:['maquina_vapor'], fx:{gdpMult:0.02, navy:0.05}, d:'Usinas e navios mais potentes'},
  {id:'previdencia', n:'Previdência Social', icon:'👴', year:1889, req:[], fx:{approval:2, stability:2}, d:'Aposentadorias e seguro: menos revoltas'},
  {id:'motor_diesel', n:'Motor a Diesel', icon:'⛽', year:1893, req:['motor'], fx:{gdpMult:0.01, navy:0.05}, d:'Navios e caminhões mais eficientes'},
  {id:'dirigivel', n:'Dirigível', icon:'🎈', year:1900, req:['motor'], fx:{military:0.02}, d:'Libera expedições aéreas por dirigível'},
  {id:'submarino', n:'Submarino', icon:'🐋', year:1900, req:['navios_vapor','motor'], fx:{navy:0.1}, d:'Invasões anfíbias mais fortes'},
  {id:'sonar', n:'Sonar', icon:'🔊', year:1915, req:['eletricidade'], fx:{navy:0.05, defense:0.02}, d:'Detecta frotas inimigas'},
  {id:'criptografia', n:'Criptografia Militar', icon:'🔐', year:1918, req:['telegrafo'], fx:{military:0.02}, d:'Espionagem +15% de sucesso'},
  {id:'insulina', n:'Insulina', icon:'💉', year:1921, req:['medicina'], fx:{popGrowth:0.05}, d:'Diabetes tratável'},
  {id:'keynesianismo', n:'Economia Moderna', icon:'📊', year:1936, req:[], fx:{stability:2, growth:0.2}, d:'Governos sabem combater crises'},
  {id:'paraquedistas', n:'Paraquedistas', icon:'🪂', year:1936, req:['aviacao'], fx:{military:0.03}, d:'Exércitos atacam até 2 regiões mais longe'},
  {id:'helicoptero', n:'Helicóptero', icon:'🚁', year:1939, req:['aviacao'], fx:{military:0.03}, d:'Exércitos marcham 2 regiões a mais por mês'},
  {id:'painel_solar', n:'Célula Solar', icon:'☀️', year:1954, req:['transistor'], fx:{gdpMult:0.01, stability:1}, d:'Energia do sol'},
  {id:'vacina_polio', n:'Vacina da Pólio', icon:'🧒', year:1955, req:['vacinas'], fx:{popGrowth:0.08, approval:1}, d:'Fim da paralisia infantil'},
  {id:'satelite_espiao', n:'Satélites Espiões', icon:'🛰️', year:1960, req:['satelites'], fx:{military:0.03}, d:'Revela automaticamente as instalações de quem está em guerra conosco'},
  {id:'contraceptivos', n:'Planejamento Familiar', icon:'👪', year:1960, req:['quimica'], fx:{popGrowth:-0.3, gdpMult:0.02, approval:1}, d:'Famílias menores e mais ricas'},
  {id:'led', n:'LED', icon:'🔆', year:1962, req:['transistor'], fx:{gdpMult:0.01}, d:'Iluminação eficiente'},
  {id:'eolica', n:'Energia Eólica', icon:'🌬️', year:1980, req:['eletricidade'], fx:{gdpMult:0.015, stability:1}, d:'Energia dos ventos'},
  {id:'baterias_litio', n:'Baterias de Lítio', icon:'🔋', year:1991, req:['microprocessador'], fx:{gdpMult:0.02, military:0.02}, d:'Energia portátil'},
  {id:'nanotecnologia', n:'Nanotecnologia', icon:'🔬', year:2000, req:['microprocessador'], fx:{research:0.05}, d:'Materiais em escala atômica'},
  {id:'grafeno', n:'Grafeno', icon:'⬡', year:2004, req:['nanotecnologia'], fx:{gdpMult:0.03}, d:'O material do futuro'},
  {id:'carro_eletrico', n:'Carro Elétrico', icon:'🚙', year:2008, req:['baterias_litio'], fx:{gdpMult:0.02, approval:1}, d:'Cidades limpas'},
  {id:'blockchain', n:'Blockchain', icon:'⛓️', year:2009, req:['internet'], fx:{tradeMult:0.05, corruption:-0.02}, d:'Transações transparentes'},
  {id:'realidade_virtual', n:'Realidade Virtual', icon:'🥽', year:2016, req:['smartphones'], fx:{approval:1, research:0.02}, d:'Novos mundos digitais'},
  {id:'supercondutores', n:'Supercondutores', icon:'🧲', year:2030, req:['grafeno'], fx:{gdpMult:0.04}, d:'Energia sem perdas'},
  {id:'exoesqueleto', n:'Exoesqueletos', icon:'🦾', year:2030, req:['robotica'], fx:{military:0.08}, d:'Super-soldados'},
  {id:'base_lunar', n:'Base Lunar', icon:'🌕', year:2045, req:['satelites','ia'], fx:{research:0.1, approval:3}, d:'A humanidade além da Terra'},
  // Era VII — Futuro
  {id:'fusao', n:'Fusão Nuclear', icon:'🌟', year:2050, req:['renovaveis','quantica','usinas_nucleares'], fx:{gdpMult:0.25, growth:1}, d:'Energia ilimitada — VITÓRIA CIENTÍFICA'},
  // Era VIII — Futurista (fictícia)
  {id:'cidades_inteligentes', n:'Cidades Inteligentes', icon:'🌆', year:2052, req:['ia','redes_5g'], fx:{gdpMult:0.04, approval:1}, d:'Trânsito, energia e serviços guiados por dados'},
  {id:'drones_autonomos', n:'Enxames de Drones', icon:'🛸', year:2054, req:['ia','drones'], fx:{military:0.12}, d:'Milhares de drones coordenados por IA'},
  {id:'neurointerface', n:'Interface Cérebro-Máquina', icon:'🧠', year:2056, req:['ia','edicao_genetica'], fx:{research:0.12}, d:'Pensar direto no computador'},
  {id:'agua_atmosferica', n:'Água do Ar', icon:'💧', year:2058, req:['renovaveis','nanotecnologia'], fx:{popGrowth:0.05, stability:1}, d:'Captura de água da atmosfera: fim das secas'},
  {id:'energia_orbital', n:'Energia Solar Orbital', icon:'🛰️', year:2060, req:['satelites','supercondutores'], fx:{gdpMult:0.08}, d:'Usinas solares em órbita enviam energia por micro-ondas'},
  {id:'nanomedicina', n:'Nanomedicina', icon:'🩺', year:2060, req:['edicao_genetica','nanotecnologia'], fx:{popGrowth:0.1, approval:2}, d:'Nanorrobôs curam doenças por dentro do corpo'},
  {id:'escudo_laser', n:'Escudo de Lasers', icon:'🔆', year:2062, req:['supercondutores','defesa_missil'], fx:{defense:0.1}, d:'Lasers derrubam mísseis e aviões'},
  {id:'ia_geral', n:'Inteligência Artificial Geral', icon:'🤖', year:2065, req:['quantica','neurointerface'], fx:{research:0.3, gdpMult:0.1, unemployment:2}, d:'Máquinas tão inteligentes quanto pessoas — e o emprego muda para sempre'},
  {id:'renda_basica', n:'Renda Básica Algorítmica', icon:'💳', year:2066, req:['ia_geral','blockchain'], fx:{approval:4, unemployment:-3, taxEff:-0.03}, d:'Os ganhos da automação divididos com todos'},
  {id:'mineracao_asteroides', n:'Mineração de Asteroides', icon:'☄️', year:2068, req:['base_lunar','robotica'], fx:{gdpMult:0.08, tradeMult:0.05}, d:'Metais raros vindos do espaço'},
  {id:'hyperloop', n:'Hyperloop Continental', icon:'🚄', year:2070, req:['supercondutores','trem_bala'], fx:{tradeMult:0.08, growth:0.3}, d:'Cápsulas a 1.000 km/h ligam o continente'},
  {id:'geoengenharia', n:'Geoengenharia Climática', icon:'🌍', year:2072, req:['energia_orbital'], fx:{stability:2, popGrowth:0.05}, d:'Controle do clima e do aquecimento global'},
  {id:'colonia_marte', n:'Colônia em Marte', icon:'🔴', year:2075, req:['base_lunar','fusao'], fx:{research:0.1, approval:4}, d:'A primeira cidade em outro planeta'},
  {id:'longevidade', n:'Longevidade Radical', icon:'⏳', year:2080, req:['nanomedicina'], fx:{popGrowth:0.1, approval:3}, d:'Viver com saúde até os 150 anos'},
  {id:'elevador_espacial', n:'Elevador Espacial', icon:'🗼', year:2085, req:['grafeno','mineracao_asteroides'], fx:{tradeMult:0.1, gdpMult:0.06}, d:'Um cabo de grafeno até a órbita'},
  {id:'antimateria', n:'Propulsão de Antimatéria', icon:'⚛️', year:2090, req:['fusao','colonia_marte'], fx:{military:0.1, navy:0.1}, d:'Naves e armas de energia extrema'},
  {id:'consciencia_digital', n:'Consciência Digital', icon:'💠', year:2100, req:['ia_geral','longevidade'], fx:{research:0.2, approval:2}, d:'Mentes humanas preservadas em computadores'},
  {id:'dyson', n:'Enxame de Dyson', icon:'☀️', year:2120, req:['energia_orbital','antimateria'], fx:{gdpMult:0.3}, d:'Captar a energia do próprio Sol — o auge da civilização'}
];
TECHS.forEach(t=>{ t.cost = t.year < 1800 ? Math.round(90 + (t.year-1440)*0.45) : Math.round(250 + (t.year-1800)*5); t.tier = t.year<1600?0:t.year<1760?1:t.year<1870?2:t.year<1910?3:t.year<1945?4:t.year<1975?5:t.year<2005?6:t.year<2040?7:t.year<2051?8:9; });
for (const k in ERAS) ERAS[k].techs = TECHS.filter(t=>t.year <= ERAS[k].year - 5).map(t=>t.id);
const TECH = Object.fromEntries(TECHS.map(t=>[t.id,t]));

const UNITS = [
  {id:'inf', n:'Infantaria', icon:'🪖', cost:40, up:2.2, atk:1, def:1.3, nav:0, man:10},
  {id:'cav', n:'Cavalaria', icon:'🐎', cost:55, up:3, atk:1.6, def:0.8, nav:0, man:5},
  {id:'art', n:'Artilharia', icon:'💣', cost:85, up:4.5, atk:2.2, def:1.8, nav:0, man:6, req:'metalurgia'},
  {id:'tanque', n:'Divisão Blindada', icon:'🛡️', cost:240, up:11, atk:5, def:3.5, nav:0, man:8, req:'blindados'},
  {id:'aviao', n:'Esquadrilha Aérea', icon:'✈️', cost:280, up:13, atk:4.5, def:4, nav:0.5, man:2, req:'aviacao'},
  {id:'missil', n:'Bateria de Mísseis', icon:'🚀', cost:650, up:22, atk:10, def:3, nav:1, man:2, req:'foguetes'},
  {id:'drone', n:'Esquadrão de Drones', icon:'🛸', cost:420, up:12, atk:9, def:6, nav:1, man:1, req:'drones'},
  {id:'frag', n:'Fragata', icon:'⛵', cost:120, up:6, atk:0.4, def:0.5, nav:2, man:2},
  {id:'encour', n:'Encouraçado', icon:'🚢', cost:480, up:20, atk:1.2, def:1, nav:7, man:3, req:'encouracados'},
  {id:'porta', n:'Porta-aviões', icon:'🛳️', cost:1300, up:45, atk:4, def:2, nav:16, man:5, req:'porta_avioes'},
  {id:'nuke', n:'Ogiva Nuclear', icon:'☢️', cost:2600, up:35, atk:0, def:0, nav:0, man:0, req:'fissao'}
];
const UNIT = Object.fromEntries(UNITS.map(u=>[u.id,u]));

const POLICIES = [
  {id:'conscricao', n:'Serviço Militar Obrigatório', icon:'🎖️', cost:0, fx:{manpower:1.5, military:0.05, approval:-6, growth:-0.2}, d:'Reservas militares x2,5. Impopular.'},
  {id:'livre_comercio', n:'Livre Comércio', icon:'⚓', cost:0, fx:{tradeMult:0.35, growth:0.4, unemployment:1.5, relations:5}, excl:'protecionismo', d:'Mais comércio e crescimento, mais desemprego.'},
  {id:'protecionismo', n:'Protecionismo', icon:'🧱', cost:0, fx:{tradeMult:-0.3, growth:-0.2, unemployment:-1.5, approval:2, relations:-5}, excl:'livre_comercio', d:'Protege empregos, isola o país.'},
  {id:'censura', n:'Censura da Imprensa', icon:'🗞️', cost:0, fx:{stability:6, approval:-5, research:-0.1, corruption:0.03}, d:'Ordem acima da liberdade.'},
  {id:'educacao', n:'Educação Pública Universal', icon:'🎓', cost:1.0, fx:{research:0.2, approval:3, growth:0.2}, d:'Custa 1% do PIB/ano.'},
  {id:'saude', n:'Saúde Universal', icon:'🏥', cost:1.5, fx:{popGrowth:0.3, approval:6}, d:'Custa 1,5% do PIB/ano.'},
  {id:'subsidios', n:'Subsídios Industriais', icon:'🏭', cost:1.0, fx:{growth:0.6, unemployment:-1}, d:'Custa 1% do PIB/ano.'},
  {id:'ambiental', n:'Proteção Ambiental', icon:'🌳', cost:0.5, fx:{growth:-0.2, approval:3, stability:2}, d:'Custa 0,5% do PIB/ano.'},
  {id:'lei_marcial', n:'Lei Marcial', icon:'🚨', cost:0, fx:{stability:15, approval:-15, growth:-0.5, corruption:0.02}, d:'Tropas nas ruas. Medida extrema.'},
  {id:'policia_secreta', n:'Polícia Secreta', icon:'🕵️', cost:0.3, fx:{stability:5, approval:-5, coup:-0.6}, block:['democracia','republica','federacao'], d:'Reduz muito o risco de golpe.'},
  {id:'propaganda', n:'Propaganda Estatal', icon:'📢', cost:0.3, fx:{approval:5, stability:2}, d:'O povo ama seu líder.'},
  {id:'imigracao', n:'Imigração Aberta', icon:'🧳', cost:0, fx:{popGrowth:0.6, stability:-4, unemployment:1, growth:0.2}, d:'Mais gente, mais tensão.'},
  {id:'banco_central', n:'Banco Central Independente', icon:'🏦', cost:0, fx:{inflation:-2.5, growth:-0.1}, d:'Inflação controlada; impede imprimir dinheiro.'},
  {id:'reforma_agraria', n:'Reforma Agrária', icon:'🚜', cost:0, fx:{approval:6, growth:-0.3, stability:-3, popGrowth:0.2}, d:'Terra para os camponeses.'},
  {id:'programa_espacial', n:'Programa Espacial', icon:'🛰️', cost:1.0, req:'satelites', fx:{research:0.15, approval:3, relations:3}, d:'Custa 1% do PIB/ano. Prestígio mundial.'}
];
const POLICY = Object.fromEntries(POLICIES.map(p=>[p.id,p]));

const SPEND_INFO = {
  edu:{n:'Educação', icon:'📚', max:10, d:'Pesquisa, crescimento de longo prazo'},
  health:{n:'Saúde', icon:'⚕️', max:10, d:'População e apoio popular'},
  infra:{n:'Infraestrutura', icon:'🏗️', max:10, d:'Crescimento econômico, emprego'},
  social:{n:'Bem-estar Social', icon:'🤲', max:15, d:'Apoio popular'},
  research:{n:'Ciência & Tecnologia', icon:'🔬', max:6, d:'Pesquisa acelerada'},
  police:{n:'Segurança & Polícia', icon:'👮', max:6, d:'Estabilidade, menos corrupção'}
};

const ACHIEVEMENTS = {
  primeira_vitoria:{n:'Primeiro Sangue', d:'Vença sua primeira batalha', icon:'⚔️'},
  conquistador:{n:'Conquistador', d:'Anexe uma nação inteira', icon:'👑'},
  imperio:{n:'Império', d:'Alcance 5 milhões de km²', icon:'🗺️'},
  gigante:{n:'Colosso', d:'Alcance 10 milhões de km²', icon:'🌍'},
  rico:{n:'Potência Econômica', d:'Esteja entre as 5 maiores economias', icon:'💰'},
  superpotencia:{n:'Superpotência', d:'Maior PIB e maior exército do mundo', icon:'🦅'},
  atomico:{n:'Era Atômica', d:'Pesquise Fissão Nuclear', icon:'☢️'},
  espacial:{n:'Rumo às Estrelas', d:'Pesquise Satélites', icon:'🛰️'},
  abundancia:{n:'Era da Abundância', d:'Pesquise Fusão Nuclear', icon:'🌟'},
  hegemonia:{n:'Hegemonia', d:'Controle 25% das terras do mundo', icon:'🏛️'},
  centenario:{n:'Centenário', d:'Sobreviva 100 anos', icon:'🎂'},
  pacifista:{n:'Pomba da Paz', d:'30 anos sem guerras', icon:'🕊️'},
  sem_dividas:{n:'Contas em Dia', d:'Dívida zero após 10 anos de jogo', icon:'📒'},
  colonizador:{n:'Desbravador', d:'Colonize 20 regiões neutras', icon:'⛺'}
};

const NATION_COLORS = ['#b5654a','#6f8f5a','#c49a45','#5f7f9e','#9c5f7d','#7e9c8c','#b07a3a','#8a6db0','#5c9a9a','#a8584f','#86a058','#c08a6a','#5a7fb5','#a3794f','#6a9a6a','#b36b8c','#8c8c4f','#4f8ca3','#c4763f','#7a6aa0','#9aa56a','#a05a5a','#5f9f7f','#b59a5a','#6b7fa3','#a36b4f','#7fa35f','#9f6fa3','#5a8a73','#c08f4f','#7a8fa8','#a8705a','#6fa38a','#a39a6b','#8f5f8f','#5f8fa8','#b0805f','#6a9f5a','#a35f6f','#7f7fa8','#9a8a5f','#5fa3a3','#a37f6a'];

// ------------------------------------------------------------
//  Utilidades
// ------------------------------------------------------------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random()*(b-a);
const pick = a => a[Math.floor(Math.random()*a.length)];
const chance = p => Math.random() < p;

function fmtNum(v, d){ return Number(v).toLocaleString('pt-BR', {minimumFractionDigits:d||0, maximumFractionDigits:d||0}); }
function fmtMoney(m, sym){
  sym = sym || (G && G.p ? G.p.currencySym : '$');
  const s = m < 0 ? '-' : ''; const a = Math.abs(m);
  if (a >= 1e6) return `${s}${sym} ${fmtNum(a/1e6, 2)} tri`;
  if (a >= 1000) return `${s}${sym} ${fmtNum(a/1000, a>=1e5?0:1)} bi`;
  return `${s}${sym} ${fmtNum(a, a<10?1:0)} mi`;
}
function fmtPop(m){
  if (m >= 1000) return fmtNum(m/1000, 2) + ' bi';
  if (m >= 1) return fmtNum(m, m<10?2:1) + ' mi';
  return fmtNum(m*1000, 0) + ' mil';
}
function fmtArea(k){ return k >= 1e6 ? fmtNum(k/1e6, 2) + ' mi km²' : fmtNum(k, 0) + ' km²'; }
function fmtPct(v, d){ return fmtNum(v, d===undefined?1:d) + '%'; }
function dateStr(t){ t = t===undefined ? G.turn : t; const m = (G.startMonth + t) % 12, y = G.startYear + Math.floor((G.startMonth + t)/12); return `${MONTHS[m]} de ${y}`; }
function dateShort(t){ const m = (G.startMonth + t) % 12, y = G.startYear + Math.floor((G.startMonth + t)/12); return `${MONTHS_S[m]}/${y}`; }
function curYear(){ return G.startYear + Math.floor((G.startMonth + G.turn)/12); }
function curMonth(){ return (G.startMonth + G.turn) % 12; }

function blankMods(){ return {taxEff:0, growth:0, research:0, military:0, defense:0, navy:0, stability:0, approval:0, corruption:0, warWeary:0, popGrowth:0, unemployment:0, inflation:0, tradeMult:0, unitCost:0, manpower:0, gdpMult:0, admin:0, relations:0, coup:0}; }
function addMods(m, fx, k){ if (!fx) return; k = k===undefined?1:k; for (const key in fx) if (m[key] !== undefined) m[key] += fx[key]*k; }

// ------------------------------------------------------------
//  Criação do mundo e do país
// ------------------------------------------------------------
function newGame(cfg){
  // no multiplayer todos os jogadores geram o mesmo mundo (mesma semente)
  const _rnd = Math.random; if (cfg.online) Math.random = makeRng(cfg.online.seed);
  try { const r = newGameInner(cfg); if (typeof applyRealLeader === 'function') G.nations.forEach(n=>applyRealLeader(n, G.startYear, false)); afterGeoSetup(cfg); return r; } finally { Math.random = _rnd; }
}
function newGameInner(cfg){
  const era = ERAS[cfg.era];
  const ON = cfg.online, humans = ON ? ON.humans.slice().sort((a,b)=>a.slot-b.slot) : null;
  G = {
    v:1, id: 'g'+Date.now(), created: Date.now(), turn:0, startYear: era.year, startMonth:0, era: cfg.era,
    costScale: era.pcF/0.35, p:null, nations:[null], wars:[], aiWars:[], hist:[], log:[], news:[], adj:{},
    stats:{battlesWon:0, battlesLost:0, cellsConquered:0, cellsLost:0, annexed:0, colonized:0, wars:0, eventsSeen:0, peakGdp:0, peakArea:0, peakPop:0, monthsAtWar:0, lastWarTurn:0, nukesUsed:0, loansTaken:0},
    achievements:[], over:false, victory:false, warHistory:[], pendingEvents:[], speed:0, negs:[], slot:freeSlot(), rankHist:{}, world: cfg.world || (typeof defaultWorld === 'function' ? defaultWorld() : null)
  };
  // terra (inclui ilha do jogador se no mar)
  Grid.buildLand(ON ? humans.map(h=>h.cfg.homePoly).filter(Boolean) : [cfg.homePoly].filter(Boolean));
  Grid.owner.fill(0);
  // nação do jogador (id 1)
  G.nations.push({id:1, name:cfg.name, color:cfg.color, alive:true, cells:0, cap:-1});
  // nações IA
  G.eraList = typeof limitNations === 'function' ? limitNations(eraNations(cfg.era), cfg) : eraNations(cfg.era);
  G.eraList.forEach((d, k)=>{
    const pr = PROFILES[d.key] || {cult:'luso', res:[], exp:[], likes:['comercio'], dislikes:['expansao']};
    const H = d.hist || (HIST[d.key] && HIST[d.key][cfg.era]);
    G.nations.push({id:k+2, name:d.name, cult:pr.cult, key:d.key, res:(HIST_RES[d.key] || pr.res).slice(), histMil: H ? H[2] : 1, exp:pr.exp.slice(), likes:pr.likes.slice(), dislikes:pr.dislikes.slice(),
      leader:genLeaderName(pr.cult), leaderAge:randInt(38,68), deals:{}, flag: eraNationFlag(d) || randomFlag(makeRng((k+2)*7919 + d.name.length*131)), color:NATION_COLORS[k % NATION_COLORS.length], gov:d.gov, relig:d.rel, seeds:d.seeds, w:d.w, a3:d.a3, isos:d.isos,
      pop: H ? H[0]*rand(0.95,1.05) : d.pop*era.popF*rand(0.9,1.1), pc: H ? H[1]*rand(0.92,1.08) : d.pc*1000*era.pcF*rand(0.85,1.15), ag:d.ag, bloc:d.bloc||null, alive:true, cells:0, area:0, cap:-1,
      capital: d.capital || CAPITALS[d.key] || genPlaceName(), relMod:0, rel:0, atWar:false, pact:false, alliance:false, trade:false, truce:-1, claim:0,
      tech: era.techs.length + (d.pc>30?2:d.pc<5?-3:0) + rand(-1,1), techOff:(d.pc>30?2:d.pc>10?0:d.pc<3?-4:-2) + rand(-1,1), treasury:0, power:0, navy:0, lastWar:-99});
  });
  // vagas para jogadores humanos com nações novas (sempre 5, iguais em todos os computadores)
  if (ON){
    G.humanBase = G.nations.length;
    for (let s2=0; s2<5; s2++) G.nations.push({id:G.humanBase+s2, name:'—', key:'humano'+s2, cult:'luso', res:[], exp:[], likes:[], dislikes:[], leader:'', leaderAge:40, deals:{}, flag:randomFlag(), color:'#888888', gov:'republica', relig:'laico', seeds:[[0,0,1]], w:1, pop:1, pc:1000, ag:0, bloc:null, alive:false, cells:0, area:0, cap:-1, capital:'', relMod:0, rel:0, atWar:false, pact:false, alliance:false, trade:false, truce:-1, claim:0, tech:0, techOff:0, treasury:0, power:0, navy:0, lastWar:-99, histMil:1, human:true, empty:true});
  }
  // terras reais (Natural Earth); sem os dados, Voronoi ponderado
  const N = G.nations;
  if (typeof assignGeoTerritories === 'function') assignGeoTerritories(N, cfg);
  else for (let i=0;i<NCELLS;i++){
    if (!Grid.land[i]) continue;
    const [lo, la] = cellCenter(i);
    let best = 0, bd = 17;
    for (let id=2; id<N.length; id++){
      const n = N[id]; if (n.empty) continue;
      for (const s of n.seeds){
        let dl = Math.abs(lo - s[0]); if (dl > 180) dl = 360 - dl;
        const d = Math.hypot(dl*Math.cos((la+s[1])/2*Math.PI/180), la - s[1]) / (s[2] || n.w);
        if (d < bd){ bd = d; best = id; }
      }
    }
    Grid.owner[i] = best;
  }
  // contagem antes do jogador (para saber quanto foi perdido)
  const before = {}; for (let i=0;i<NCELLS;i++) if (Grid.land[i] && Grid.owner[i]>1) before[Grid.owner[i]] = (before[Grid.owner[i]]||0)+1;
  // células do jogador
  const home = [];
  const displaced = {};
  let exN = null;
  if (ON){
    // aplica os territórios de todos os humanos, na ordem das vagas
    G.online = {code:ON.code, slot:ON.slot, host:ON.host, humans:humans.map(h=>({slot:h.slot, uid:h.uid, name:h.name})), canon:{}};
    for (const h of humans){
      const me = h.slot === ON.slot, hc = h.cfg;
      let id;
      if (hc.existing){ const ex = N.find(n=>n && n.id>1 && !n.empty && n.name === hc.existing); id = ex.id;
        if (me){ exN = ex; } else { Object.assign(ex, {human:true, slot:h.slot, uid:h.uid, name:hc.name, color:hc.color, flag:hc.flag, gov:hc.gov, relig:hc.religion, capital:hc.capital, leader:hc.leader}); } }
      else { id = G.humanBase + h.slot; const hn = N[id];
        if (!me) Object.assign(hn, {alive:true, empty:false, slot:h.slot, uid:h.uid, name:hc.name, color:hc.color, flag:hc.flag, gov:hc.gov, relig:hc.religion, capital:hc.capital, leader:hc.leader, pop:hc.pop, seeds:[[hc.center[0], hc.center[1], 0.5]]});
        for (let i=0;i<NCELLS;i++){ if (!Grid.land[i]) continue; const [lo,la]=cellCenter(i); if (pointInPoly(lo,la,hc.homePoly)) Grid.owner[i] = me ? 1 : id; }
        if (me){ let any = false; for (let i=0;i<NCELLS;i++) if (Grid.owner[i]===1){ any = true; break; } if (!any){ const c = cellOf(hc.center[0], hc.center[1]); Grid.land[c] = 1; Grid.owner[c] = 1; } } }
      G.online.canon[h.slot] = id;
    }
    if (exN){ for (let i=0;i<NCELLS;i++) if (Grid.land[i] && Grid.owner[i] === exN.id) Grid.owner[i] = 1;
      exN.alive = false; exN.playerOrigin = true; cfg.pop = exN.pop; }
    for (let i=0;i<NCELLS;i++) if (Grid.land[i] && Grid.owner[i] === 1) home.push(i);
    G.online.myCanon = G.online.canon[ON.slot];
    if (!cfg.existing) cfg.area = cfg.area || home.reduce((s,c)=>s+cellArea(c),0);
    if (exN){ const sc = cellOf(exN.seeds[0][0], exN.seeds[0][1]); cfg.center = (sc>=0 && Grid.owner[sc]===1) ? exN.seeds[0] : cellCenter(home[0]); cfg.area = home.reduce((s,c)=>s+cellArea(c),0); if (cfg.statesAuto) cfg.states = clamp(Math.round(cfg.area/180000), 3, 70); }
  } else if (cfg.existing){
    exN = N.find(n=>n && n.id > 1 && n.name === cfg.existing);
    for (let i=0;i<NCELLS;i++) if (Grid.land[i] && Grid.owner[i] === exN.id){ home.push(i); Grid.owner[i] = 1; }
    const sc = cellOf(exN.seeds[0][0], exN.seeds[0][1]);
    cfg.center = (sc>=0 && Grid.owner[sc]===1) ? exN.seeds[0] : cellCenter(home[0]);
    cfg.area = home.reduce((s,c)=>s+cellArea(c),0);
    exN.alive = false; exN.playerOrigin = true;
    cfg.pop = exN.pop;
    if (cfg.statesAuto) cfg.states = clamp(Math.round(cfg.area/180000), 3, 70);
  } else {
    for (let i=0;i<NCELLS;i++){ if (!Grid.land[i]) continue; const [lo,la]=cellCenter(i); if (pointInPoly(lo,la,cfg.homePoly)) home.push(i); }
    if (!home.length){ const c = cellOf(cfg.center[0], cfg.center[1]); Grid.land[c]=1; home.push(c); }
    for (const c of home){ const o = Grid.owner[c]; if (o>1) displaced[o] = (displaced[o]||0)+1; Grid.owner[c] = 1; }
  }
  recount();
  // IA: ajusta população pelas terras perdidas, capitais, poder
  for (let id=2; id<N.length; id++){
    const n = N[id];
    if (n.empty) continue;
    if (!n.cells || n.playerOrigin){ n.alive = false; n.cells = 0; continue; }
    if (n.human){ n.cap = nearestOwned(id, cellOf(n.seeds[0][0], n.seeds[0][1]) >= 0 ? cellOf(n.seeds[0][0], n.seeds[0][1]) : 0); n.sites = []; continue; }
    if (before[id]) n.pop *= n.cells / before[id];
    const sc = cellOf(n.seeds[0][0], n.seeds[0][1]);
    n.cap = (sc>=0 && Grid.owner[sc]===id) ? sc : nearestOwned(id, sc>=0?sc:0);
    n.power = aiPowerTarget(n); n.navy = n.power*0.35; n.treasury = n.pop*n.pc*0.05;
    if (displaced[id]){ n.relMod -= 25 + displaced[id]*2; n.claim = displaced[id]; }
  }
  // jogador
  const homeArea = home.reduce((s,c)=>s+cellArea(c),0);
  const m0 = blankMods();
  [GOVS[cfg.gov].mods, ECONS[cfg.econ].mods, TRAITS[cfg.trait].mods, CLIMATES[cfg.climate].mods, TERRAINS[cfg.terrain].mods, FOCI[cfg.focus].mods].forEach(f=>addMods(m0,f));
  cfg.resources.forEach(r=>addMods(m0, RESOURCES[r].mods));
  let basePc = 10000*era.pcF * (1 + m0.gdpMult) * rand(0.95,1.05);
  if (exN) basePc = exN.pc / ((1 + m0.gdpMult) * (0.65 + clamp(cfg.cities*0.15/cfg.pop,0.06,0.92)*0.8) * 1.0);
  const rnd = makeRng(Date.now() & 0xffff);
  const p = G.p = {
    avatar: cfg.avatar ? JSON.parse(JSON.stringify(cfg.avatar)) : null, cult: cfg.cult || 'luso',
    name:cfg.name, official:cfg.official, leader:cfg.leader, title:cfg.title, age:cfg.age, trait:cfg.trait, gov:cfg.gov, econ:cfg.econ,
    religion:cfg.religion, capital:cfg.capital, currency:cfg.currency, currencySym:cfg.currencySym||'$', language:cfg.language, motto:cfg.motto,
    flag:cfg.flag, color:cfg.color, climate:cfg.climate, terrain:cfg.terrain, focus:cfg.focus, resources:cfg.resources.slice(),
    baseArea:cfg.area, homeCells:home, homeTotal:home.length, homeArea, homePoly:cfg.homePoly, shape:cfg.shape,
    pop:cfg.pop, basePc, gdpPc:basePc, gdp:cfg.pop*basePc, treasury:0, debt:0,
    tax:0.22, spend:{edu:3, health:3, infra:3, social:3, research:1, police:1.5},
    inflation:3, unemployment:7, approval:58, stability:62, corruption:0.08, warWeary:0, morale:1, occupied:0,
    rp:0, researching:null, techs:era.techs.slice(), units:{}, manpower:0, policies:{},
    states:cfg.states, cities:cfg.cities, defaults:0, nextElection: -1, revolt:0, collapse:0,
    party: cfg.party && cfg.party.kind === powerKind(cfg.gov) ? Object.assign({}, cfg.party) : null,
    constitution: hasConstitution(cfg.gov) ? Object.assign(defaultConstitution(), cfg.constitution||{}) : (cfg.constitution||null), terms:1,
    bloc: exN ? exN.bloc : null, buildings:[], randomPick: !!cfg.randomPick, isIsland: !!cfg.isIsland, existing: cfg.existing || null, customTitle: cfg.title !== GOVS[cfg.gov].title, reform:null, amend:null,
    temp:[], printBoost:0, tributes:[], lastBudget:null, growth:2, rpRate:0, campaign:0,
    stateNames: Array.from({length:Math.min(cfg.states,80)}, ()=>genPlaceName(rnd)),
    cityNames: [], cityCells: [], colonized:0, peaceMonths:0, initPop:cfg.pop
  };
  // forças iniciais
  const baseInf = Math.round(Math.pow(p.pop, 0.55) * 7 * (cfg.focus==='militar'?1.5:1));
  p.units = {inf:Math.max(4,baseInf), cav: cfg.era<=1850?Math.round(baseInf*0.25):Math.round(baseInf*0.08), art: cfg.era>=1914?Math.round(baseInf*0.15):0, frag: Math.max(1,Math.round(baseInf*0.08))};
  if (cfg.era>=1960){ p.units.tanque = Math.round(baseInf*0.08); p.units.aviao = Math.round(baseInf*0.06); }
  if (cfg.era>=2000){ p.units.missil = Math.round(baseInf*0.03); p.units.encour = Math.round(baseInf*0.03); }
  if (cfg.era>=2050){ p.units.missil = Math.round(baseInf*0.06); p.units.aviao = Math.round(baseInf*0.1); }
  if (cfg.terrain==='arquipelago' || cfg.terrain==='costeiro') p.units.frag += 2;
  if (GOVS[p.gov].elections) p.nextElection = electionInterval();
  if (exN){ const pw = aiPowerTarget(Object.assign({}, exN, {pop:p.pop, atWar:false})); const k = pw / Math.max(1, Object.entries(p.units).reduce((s,[u,c])=>s+c*UNIT[u].atk,0)); if (k > 1) for (const u in p.units) p.units[u] = Math.round(p.units[u]*Math.min(k, 3)); }
  const mods = calcMods();
  p.manpower = maxManpower(mods)*0.7;
  // cidades no mapa
  placeCities();
  p.capCell = G.nations[1].cap = home[nearestIdx(home, cfg.center)];
  p.capLat = cellCenter(p.capCell)[1]; p.realClimate = realClimateAt(p.capLat);
  p.occ = {}; p.resMode = {}; p.corps = [];
  newCorps(p.capCell, 0.7, '1º Exército');
  if (p.pop > 40){ const r = newCorps(home[Math.floor(home.length*0.7)] || p.capCell, 0.4, '2º Exército'); }
  for (let id=2; id<N.length; id++) if (N[id].alive && !N[id].human) N[id].sites = genSites(N[id]);
  for (let id=2; id<N.length; id++) if (N[id].alive && !N[id].human && N[id].cap >= 0) N[id].sites.unshift({t:'base', c:N[id].cap, known:true, capital:true});
  // derivados iniciais
  derive();
  p.treasury = p.gdp*0.08;
  p.researching = availableTechs()[0] ? availableTechs()[0].id : null;
  // relações
  recount();
  computeAdjacency();
  derive();
  for (let id=2; id<N.length; id++) updateRelation(N[id]);
  recordHistory(); snapshotRanks(); initObjectives(cfg.gameMode || 'livre');
  if (ON){ G.slot = null; G.id = 'online_' + ON.code; }
  if (exN) addLog(`${p.title} ${p.leader} assume o governo de ${p.official} em ${p.capital}.`, 'good');
  else addLog(`Fundação de ${p.official}! ${p.title} ${p.leader} assume o poder em ${p.capital}.`, 'good');
  for (const id in displaced) addLog(`${N[id].name} perdeu ${displaced[id]} regiões com a fundação de ${p.name} e reivindica o território!`, 'bad');
  addNews(exN ? `${p.leader} assume o comando de ${p.name}.` : `Nasce uma nova nação: ${p.official}. O mundo observa com curiosidade.`);
  MapView.dirty = true;
  return G;
}

function nearestIdx(cells, ll){ let b=0, bd=1e9; cells.forEach((c,k)=>{ const [lo,la]=cellCenter(c); const d=(lo-ll[0])**2+(la-ll[1])**2; if (d<bd){bd=d;b=k;} }); return b; }
function nearestOwned(id, from){
  const [fx, fy] = [from%CW, (from/CW)|0]; let best=-1, bd=1e9;
  for (let i=0;i<NCELLS;i++) if (Grid.land[i] && Grid.owner[i]===id){ const d=(i%CW-fx)**2+(((i/CW)|0)-fy)**2; if (d<bd){bd=d;best=i;} }
  return best;
}
// ajustes depois de criar o mundo: cofre, estados reais
function afterGeoSetup(cfg){
  const p = G.p; if (!p) return;
  if (typeof worldVal === 'function') p.treasury *= worldVal('money');
  const ex = G.nations.find(x=>x && x.playerOrigin && x.isos);
  if (ex && typeof realStatesFor === 'function'){
    const rs = realStatesFor(ex.isos);
    if (rs.length){ const ideal = clamp(p.area/150000, 2, 80); p.stateNames = rs; p.states = Math.round(clamp(rs.length, ideal*0.5, Math.max(ideal*2, 3))); }
  }
}
function placeCities(){
  const p = G.p; const rnd = makeRng(p.cities*31 + p.homeCells.length);
  const n = Math.min(p.cities, Math.max(3, p.homeCells.length*2), 40);
  p.cityCells = []; p.cityNames = []; p.cityPos = {};
  // país real: usa as cidades reais (com o nome da época)
  const ex = G.nations.find(x=>x && x.playerOrigin && x.isos);
  if (ex && typeof realCitiesFor === 'function') for (const c of realCitiesFor(ex.isos, G.startYear, 80)){ if (p.cityCells.length >= n) break; const cell = cellOf(c.lon, c.lat); if (cell >= 0 && Grid.owner[cell] === 1 && cell !== p.capCell && !p.cityCells.includes(cell) && c.name !== p.capital){ p.cityCells.push(cell); p.cityNames.push(c.name); p.cityPos[cell] = [c.lon, c.lat]; } }
  const realN = p.cityCells.length;
  for (let k=p.cityCells.length;k<(ex && realN >= 3 ? realN : n);k++){ p.cityCells.push(p.homeCells[Math.floor(rnd()*p.homeCells.length)]); p.cityNames.push(genPlaceName(rnd)); }
}

function aiPowerTarget(n){
  const pcRel = Math.max(0.2, n.pc / (2000*G.costScale));
  return 8 * Math.pow(Math.max(0.1,n.pop), 0.55) * Math.pow(pcRel, 0.35) * (0.7 + n.ag*0.6) * (1 + Math.max(0,n.tech)*0.03) * (n.atWar?1.2:1) * (n.histMil||1);
}

// ------------------------------------------------------------
//  Contagem de território / rótulos
// ------------------------------------------------------------
function recount(){
  const N = G.nations;
  for (const n of N){ if (!n) continue; n.cells = 0; n.area = 0; n._sx = 0; n._sy = 0; }
  for (let i=0;i<NCELLS;i++){
    if (!Grid.land[i]) continue; const o = Grid.owner[i]; if (o<=0) continue;
    const n = N[o]; n.cells++; n.area += cellArea(i); n._sx += i%CW; n._sy += (i/CW)|0;
  }
  // rótulo no maior bloco contínuo de terras (a metrópole, não as colônias)
  const comp = new Int32Array(NCELLS).fill(-1), big = {}, stack = [];
  for (let i=0;i<NCELLS;i++){
    if (comp[i] >= 0 || !Grid.land[i]) continue; const o = Grid.owner[i]; if (o<=0) continue;
    let cnt = 0, sx = 0, sy = 0; comp[i] = i; stack.push(i);
    while (stack.length){ const c = stack.pop(); cnt++; sx += c%CW; sy += (c/CW)|0;
      const x = c%CW, y = (c/CW)|0;
      for (let dy=-1; dy<=1; dy++) for (let dx=-1; dx<=1; dx++){ if (!dx && !dy) continue; const nx = (x+dx+CW)%CW, ny = y+dy; if (ny<0 || ny>=CH) continue; const j = ny*CW+nx; if (comp[j] < 0 && Grid.land[j] && Grid.owner[j] === o){ comp[j] = i; stack.push(j); } } }
    if (!big[o] || cnt > big[o].cnt) big[o] = {cnt, sx, sy, root:i};
  }
  const best = {}, bd = {};
  for (let i=0;i<NCELLS;i++){
    const o = Grid.owner[i]; if (o<=0 || !big[o] || comp[i] !== big[o].root) continue;
    const b = big[o], d = (i%CW - b.sx/b.cnt)**2 + (((i/CW)|0) - b.sy/b.cnt)**2;
    if (bd[o]===undefined || d < bd[o]){ bd[o]=d; best[o]=i; }
  }
  for (const n of N){
    if (!n) continue;
    if (n.cells){
      const [x,y] = cellXY(best[n.id]); n.lx = x; n.ly = y;
      const mc = big[n.id] ? big[n.id].cnt : n.cells, span = Math.sqrt(mc)*DEG*1.5; n.labelSize = clamp(Math.min(Math.sqrt(mc)*0.8, span/(n.name.length*0.78)), 2.5, 24);
    }
  }
  if (G.p){
    const homeOwned = G.p.homeCells.filter(c=>Grid.owner[c]===1).length;
    const homeArea = G.p.homeCells.reduce((s,c)=>s+(Grid.owner[c]===1?cellArea(c):0),0);
    const n1 = N[1];
    n1.area = (n1.area - homeArea) + G.p.baseArea * (homeOwned / G.p.homeTotal);
    G.p.area = n1.area;
  }
}

function computeAdjacency(){
  const adj = {};
  for (let i=0;i<NCELLS;i++){
    if (!Grid.land[i]) continue; const a = Grid.owner[i]; if (a<=0) continue;
    const x = i%CW;
    const js = []; if (x<CW-1) js.push(i+1); if (i+CW<NCELLS) js.push(i+CW);
    // vizinhança de 2 células atravessa estreitos
    if (x<CW-2) js.push(i+2); if (i+2*CW<NCELLS) js.push(i+2*CW);
    for (const j of js){ if (!Grid.land[j]) continue; const b = Grid.owner[j]; if (b>0 && b!==a){ adj[Math.min(a,b)+','+Math.max(a,b)] = 1; } }
  }
  G.adj = adj;
}
function capDist(n){ const [a,b] = cellCenter(n.cap), [c,d] = cellCenter(G.p.capCell); let dl = Math.abs(a-c); if (dl>180) dl = 360-dl; return Math.hypot(dl, b-d); }
function adjacent(a, b){ return !!G.adj[Math.min(a,b)+','+Math.max(a,b)]; }
function neighborsOf(id){ const r=[]; for (const k in G.adj){ const [a,b]=k.split(',').map(Number); if (a===id) r.push(b); else if (b===id) r.push(a); } return r; }

// ------------------------------------------------------------
//  Modificadores e derivados
// ------------------------------------------------------------
function calcMods(){
  const p = G.p, m = blankMods();
  addMods(m, GOVS[p.gov].mods); addMods(m, ECONS[p.econ].mods); addMods(m, TRAITS[p.trait].mods);
  addMods(m, CLIMATES[p.climate].mods); addMods(m, TERRAINS[p.terrain].mods); addMods(m, FOCI[p.focus].mods);
  for (const r of p.resources){ addMods(m, RESOURCES[r].mods); if (r==='petroleo' && p.techs.includes('motor')) m.gdpMult += 0.08; if (r==='agua' && p.techs.includes('eletricidade')) m.gdpMult += 0.04; }
  resourceModeMods(m); climateMods(m);
  for (const id in p.policies) if (p.policies[id]){
    addMods(m, POLICY[id].fx);
    if (GOVS[p.gov].family==='dem'){ if (id==='censura') m.approval -= 6; if (id==='lei_marcial') m.approval -= 10; }
    if (id==='conscricao' && GOVS[p.gov].family==='dem') m.approval -= 3;
  }
  for (const t of p.techs) if (TECH[t]) addMods(m, TECH[t].fx);
  for (const t of p.temp) addMods(m, t.fx);
  dealsMods(m); constitutionMods(m); if (typeof partyMods === 'function') partyMods(m); if (typeof worldMods === 'function') worldMods(m); buildingsMods(m); cityMods(m); cityProjectMods(m); synergyMods(m);
  if (p.religion==='laico' || p.religion==='ateu') m.research += 0.05;
  if (p.gov==='teocracia' && p.religion!=='laico' && p.religion!=='ateu') m.stability += 4;
  return m;
}
function adminEff(m){
  const p = G.p; const ideal = clamp((p.area||p.baseArea)/150000, 2, 80);
  return clamp(1 - 0.11*Math.abs(Math.log(p.states/ideal)) + (m?m.admin:0), 0.55, 1.1);
}
function urbanization(){ const p = G.p; return clamp(p.cities*0.15/Math.max(0.05,p.pop), 0.06, 0.92); }
function maxManpower(m){ return G.p.pop*1000*0.03*(1+(m?m.manpower:0)); }
function unitCost(u, m){
  let c = UNIT[u].cost*G.costScale*(1+(m?m.unitCost:0));
  if (u==='nuke' && G.p.resources.includes('uranio')) c *= 0.5;
  return c;
}
function unitUpkeep(u, m){ return UNIT[u].up*G.costScale*(1+(m?m.unitCost:0)*0.5); }
function militaryPower(m, kind){
  const p = G.p; m = m || calcMods(); let s = 0;
  for (const u in p.units){ const U = UNIT[u]; if (!U) continue; s += p.units[u] * (kind==='def'?U.def:kind==='nav'?U.nav:U.atk); }
  for (const c of (p.corps||[])) for (const u in c.units){ const U = UNIT[u]; if (U) s += c.units[u] * (kind==='def'?U.def:kind==='nav'?U.nav:U.atk); }
  if (kind==='nav') return s*(1+m.navy);
  const mult = 1 + m.military + (kind==='def'?m.defense:0);
  return s * mult * p.morale;
}
function creditScore(){
  const p = G.p; const dr = p.debt/Math.max(1,p.gdp);
  return clamp(100 - dr*35 - Math.max(0,50-p.stability)*0.6 - p.defaults*25 - Math.max(0,p.inflation-5)*1.5, 0, 100);
}
function creditRating(){ const s = creditScore(); return s>88?'AAA':s>78?'AA':s>68?'A':s>58?'BBB':s>48?'BB':s>36?'B':s>20?'CCC':'D'; }
function interestRate(){ return 2.5 + (100-creditScore())*0.13; }

function derive(){
  const p = G.p, m = calcMods();
  p.mods = m;
  p.admin = adminEff(m); p.urb = urbanization();
  const war = G.wars.length ? 0.97 : 1;
  p.gdpPc = p.basePc * (1 + m.gdpMult) * (0.65 + p.urb*0.8) * (0.85 + p.stability/100*0.25) * war;
  p.gdp = p.pop * p.gdpPc;
  p.atk = militaryPower(m,'atk'); p.def = militaryPower(m,'def') * (p.terrain==='montanhoso'?1:1); p.navy = militaryPower(m,'nav');
  p.maxMan = maxManpower(m);
  return m;
}

function budget(m){
  const p = G.p; m = m || p.mods || calcMods();
  const gdpM = p.gdp/12;
  const inc = {}, exp = {};
  inc.impostos = gdpM * p.tax * (1+m.taxEff) * p.admin * (1 - p.corruption);
  let trade = 0;
  for (let id=2; id<G.nations.length; id++){ const n = G.nations[id]; if (n.alive && !n.atWar && n.deals) for (const t in n.deals) trade += dealIncome(n, t); }
  inc.comercio = trade * (1 + m.tradeMult);
  let res = 0, imp = 0;
  for (const r of p.resources){ if (resMode(r) === 'exportar'){ res += gdpM*resExportRate(r); imp += gdpM*0.0015; } }
  exp.importacoes = imp;
  inc.recursos = res;
  inc.tributos = p.tributes.reduce((s,t)=>s+t.amt,0);
  for (const k in SPEND_INFO) exp[k] = gdpM * p.spend[k]/100;
  let pol = 0; for (const id in p.policies) if (p.policies[id]) pol += gdpM*POLICY[id].cost/100;
  exp.leis = pol;
  exp.administracao = (p.states*3 + p.cities*0.5) * G.costScale;
  let mil = 0; for (const u in p.units) mil += p.units[u]*unitUpkeep(u, m);
  for (const c of (p.corps||[])) for (const u in c.units) mil += c.units[u]*unitUpkeep(u, m);
  exp.militar = mil;
  exp.obras = buildUpkeep() + outpostUpkeep();
  exp.juros = p.debt * interestRate()/100/12;
  const tIn = Object.values(inc).reduce((a,b)=>a+b,0), tOut = Object.values(exp).reduce((a,b)=>a+b,0);
  return {inc, exp, tIn, tOut, bal: tIn - tOut};
}

function researchRate(m){
  const p = G.p; m = m || p.mods;
  return (2 + p.spend.edu*1.3 + p.spend.research*4.5) * (0.6 + p.urb) * (1 + m.research) * (0.7 + 0.3*Math.log10(p.pop+1)) * (p.stability<25?0.7:1);
}
// a tecnologia só pode ser pesquisada até 12 anos antes de sua época histórica (e custa mais quanto mais cedo)
const TECH_LEAD = 12;
function techCountAt(year){ return TECHS.filter(t=>t.year <= year).length; }
function techGap(id){ return TECH[id].year - curYear(); }
function techTimeOk(id){ return techGap(id) <= TECH_LEAD; }
function techCost(id){ const t = TECH[id], gap = t.year - curYear(); let c = t.cost; if (gap > 0) c *= 1 + gap*0.12; else if (gap < -10) c *= 0.7; return Math.round(c); }
function availableTechs(){ return TECHS.filter(t => !G.p.techs.includes(t.id) && t.req.every(r=>G.p.techs.includes(r)) && techTimeOk(t.id)); }

// ------------------------------------------------------------
//  Registro / notícias
// ------------------------------------------------------------
function addLog(txt, kind){ G.log.push({t:G.turn, txt, k:kind||'info'}); if (G.log.length > 600) G.log.shift(); if (typeof onLog === 'function') onLog(txt, kind); }
function addNews(txt){ G.news.unshift(txt); if (G.news.length > 14) G.news.pop(); }
function addTemp(fx, months, label){ G.p.temp.push({fx, until:G.turn+months, label}); }

// ------------------------------------------------------------
//  Relações
// ------------------------------------------------------------
function relBase(n){
  const p = G.p; let b = 0;
  if (n.relig === p.religion) b += 12; else if (relFam(n.relig) === relFam(p.religion)) b += 6; else if (relFam(n.relig)==='sec' || relFam(p.religion)==='sec') b -= 2; else b -= 5;
  const f1 = govFam(p.gov), f2 = govFam(n.gov);
  if (f1 === f2) b += 10; else if ((f1==='dem' && (f2==='com'||f2==='aut')) || (f2==='dem' && (f1==='com'||f1==='aut'))) b -= 10;
  if (p.bloc && n.bloc === p.bloc) b += 15;
  if (adjacent(1, n.id)) b -= 5;
  if (n.claim) b -= Math.min(30, n.claim*0.6);
  b += Math.min(16, dealCount(n)*4); if (n.pact) b += 8; if (n.alliance) b += 20;
  b += prefScore(n);
  b += (p.mods ? p.mods.relations : 0);
  return b;
}
function updateRelation(n){ n.rel = clamp(Math.round(relBase(n) + n.relMod), -100, 100); if (n.atWar) n.rel = Math.min(n.rel, -60); }
function changeRel(n, v){ n.relMod += v; updateRelation(n); }
function relLabel(r){ return r>=70?'Aliado próximo':r>=40?'Amigável':r>=15?'Cordial':r>-15?'Neutro':r>-40?'Frio':r>-70?'Hostil':'Inimigo mortal'; }

// ------------------------------------------------------------
//  Transferência de territórios
// ------------------------------------------------------------
function bfsCells(start, owner, max, limitFn){
  const seen = new Set([start]), q = [start], out = [];
  while (q.length && out.length < max){
    const c = q.shift();
    if (Grid.owner[c] === owner && Grid.land[c]) out.push(c); else if (c !== start) continue;
    for (const nb of neighbors4(c)){ if (!seen.has(nb) && Grid.land[nb] && Grid.owner[nb]===owner && (!limitFn || limitFn(nb))){ seen.add(nb); q.push(nb); } }
  }
  return out;
}
function transferCells(cells, from, to){
  if (!cells.length) return;
  const N = G.nations, p = G.p;
  const fromN = N[from], toN = N[to];
  const fromCells = fromN ? fromN.cells : 0;
  const frac = fromCells ? cells.length/fromCells : 0;
  let moved = 0, movedPc = 0;
  if (from === 1){ moved = p.pop*frac*0.9; p.pop -= moved; movedPc = p.gdpPc; }
  else if (from > 1){ moved = fromN.pop*frac; fromN.pop -= moved; fromN.power *= (1 - frac*0.5); fromN.navy *= (1-frac*0.3); movedPc = fromN.pc; }
  else { moved = cells.length*0.02; movedPc = 600*G.costScale; }
  sitesCaptured(cells, from, to);
  if (from === 1){ railCut(cells); if (p.occ) for (const c of cells) delete p.occ[c]; }
  for (const c of cells) Grid.owner[c] = to;
  if (from === 1 && p.buildings){ const lost = p.buildings.filter(b=>cells.includes(b.c)); if (lost.length){ p.buildings = p.buildings.filter(b=>!cells.includes(b.c)); addLog(`Perdemos ${lost.length} construção(ões) no território invadido.`, 'bad'); } }
  if (to === 1){
    const add = moved*0.85;
    p.basePc = (p.pop*p.basePc + add*Math.min(movedPc, p.basePc*1.3)*0.7) / (p.pop + add);
    p.pop += add; p.cities += Math.max(0, Math.round(cells.length*0.35)); p.occupied += from>1 ? cells.length*0.6 : cells.length*0.15;
    if (Math.sqrt(p.states*4) < cells.length/4) {}
  } else if (to > 1){ toN.pop += moved*0.85; }
  // capitais
  for (const id of [from]){
    const n = N[id]; if (!n || id<=0) continue;
    if (n.cap >= 0 && Grid.owner[n.cap] !== id){
      const nc = nearestOwned(id, n.cap);
      if (id === 1){
        if (nc >= 0){ p.capCell = n.cap = nc; const opts = p.cityNames.filter(x=>x!==p.capital); const nm = opts.length ? pick(opts) : genPlaceName(); G.stats.capitalLost = (G.stats.capitalLost||0) + 1; addLog(`A capital ${p.capital} caiu! O governo foge para ${nm}.`, 'bad'); p.capital = nm; p.stability -= 15; p.approval -= 10; }
      } else if (nc >= 0){
        if (to === 1){ G.stats.capitalsTaken = (G.stats.capitalsTaken||0) + 1; addLog(`Capturamos ${n.capital}, a capital de ${n.name}!`, 'good'); n.power *= 0.7; n.capLost = true; }
        n.cap = nc; n.capital = genPlaceName();
      }
    }
  }
  recount();
  for (const id of [from, to]){ const n = N[id]; if (n && id>0 && n.cells === 0 && n.alive) eliminate(id, to); }
  computeAdjacency();
  MapView.dirty = true;
}
function eliminate(id, by){
  const n = G.nations[id]; n.alive = false; n.atWar = false;
  if (id === 1) return;
  if (by === 1){ G.stats.annexed++; addLog(`🏴 ${n.name} foi completamente anexada ao nosso território!`, 'good'); unlock('conquistador'); G.p.approval += 5; }
  else addLog(`${n.name} deixou de existir, anexada por ${G.nations[by] ? G.nations[by].name : 'rebeldes'}.`, 'info');
  addNews(`${n.name} desaparece do mapa.`);
  G.wars = G.wars.filter(w=>w.e!==id);
  G.aiWars = G.aiWars.filter(w=>w.a!==id && w.b!==id);
}

// ------------------------------------------------------------
//  Guerra
// ------------------------------------------------------------
function getWar(id){ return G.wars.find(w=>w.e===id); }
function playerCellsNear(c, depth){
  // procura células do jogador por terra a partir de c (BFS por qualquer terra)
  const seen = new Set([c]); let frontier = [c];
  for (let d=0; d<depth; d++){
    const nx = [];
    for (const x of frontier) for (const nb of neighbors4(x)){ if (seen.has(nb) || !Grid.land[nb]) continue; if (Grid.owner[nb]===1) return nb; seen.add(nb); nx.push(nb); }
    frontier = nx;
  }
  return -1;
}
function isCoastal(c){ return neighbors4(c).some(nb=>!Grid.land[nb]); }
function maxAttacks(){ const t = G.p.techs; return 2 + (t.includes('ferrovias')?1:0) + (t.includes('aviacao')?1:0) + (t.includes('blindados')?1:0); }
function attackReach(){ return 3 + ((G.p.mods && G.p.mods._airReach)||0) + (G.p.techs.includes('ferrovias')?1:0) + (G.p.techs.includes('motor')?1:0) + (G.p.techs.includes('aviacao')?1:0); }

function declareWar(id, byAI){
  const n = G.nations[id], p = G.p;
  if (n.atWar) return;
  n.atWar = true; n.deals = {}; syncTrade(n); n.lastWar = G.turn;
  G.negs = G.negs.filter(x=>x.n !== id || x.kind === 'peace');
  G.wars.push({e:id, start:G.turn, score:0, won:0, lost:0, taken:0, lostCells:0, byAI:!!byAI});
  G.stats.wars++;
  if (!byAI){
    G.stats.playerWars = (G.stats.playerWars||0) + 1; if (n.pact) G.stats.betrayals = (G.stats.betrayals||0) + 1;
    if (n.pact){ p.stability -= 8; p.approval -= 5; for (let k=2;k<G.nations.length;k++) if (G.nations[k].alive) changeRel(G.nations[k], -8); addLog(`Rompemos o pacto de não-agressão com ${n.name}. O mundo nos vê como traidores.`, 'bad'); }
    if (n.alliance){ p.stability -= 15; p.approval -= 10; }
    if (n.truce > G.turn){ p.stability -= 8; addLog('Quebramos a trégua — a reputação internacional desaba.', 'bad'); }
    const fam = GOVS[p.gov].family;
    const just = n.rel < -40 || n.claim;
    if (fam === 'dem' && !just) { p.approval -= 8; addLog('O povo não entende o motivo desta guerra (-8 apoio).', 'bad'); }
    if (p.gov === 'imperio' || p.gov === 'ditadura') p.approval += 3;
    addLog(`⚔️ Declaramos guerra a ${n.name}!`, 'war');
  } else addLog(`⚔️ ${n.name} declarou guerra contra ${p.name}!`, 'war');
  n.pact = false; n.alliance = false; changeRel(n, -40);
  addNews(byAI ? `${n.name} invade ${p.name}!` : `${p.name} declara guerra a ${n.name}!`);
  // alianças
  let joined = 0;
  for (let k=2;k<G.nations.length;k++){
    const a = G.nations[k]; if (!a.alive || k===id) continue;
    if (a.alliance && !a.atWar){ startAIWar(k, id); addLog(`Nosso aliado ${a.name} entra na guerra contra ${n.name}!`, 'good'); }
    else if (joined < 2 && n.bloc && a.bloc === n.bloc && !a.atWar && !a.alliance && !a.pact && (adjacent(1,k) || a.navy > p.navy*1.5) && chance(byAI?0.12:0.3)){
      joined++;
      a.atWar = true; a.lastWar = G.turn; changeRel(a, -30);
      G.wars.push({e:k, start:G.turn, score:0, won:0, lost:0, taken:0, lostCells:0, byAI:true});
      addLog(`${a.name} honra sua aliança com ${n.name} e declara guerra contra nós!`, 'war');
    }
  }
  MapView.dirty = true;
}
function startAIWar(a, b){
  if (G.aiWars.some(w=>(w.a===a&&w.b===b)||(w.a===b&&w.b===a))) return;
  G.aiWars.push({a, b, start:G.turn, until:G.turn + Math.round(rand(8, 36))});
}

function battleOdds(att, def){ const a = Math.pow(Math.max(0.01,att),1.25), d = Math.pow(Math.max(0.01,def),1.25); return a/(a+d); }

function applyUnitLosses(frac, kind){
  const p = G.p; let lost = 0;
  for (const u in p.units){
    const U = UNIT[u]; if (!U || u==='nuke') continue;
    if (kind==='land' && U.nav > 1.5) continue;
    const c = p.units[u]; let l = c*frac; l = Math.floor(l) + (Math.random() < l%1 ? 1 : 0);
    l = Math.min(c, l); p.units[u] -= l; lost += l;
  }
  return lost;
}

function aiAttack(n, w){
  const p = G.p;
  const front = [];
  for (let i=0;i<NCELLS;i++){
    if (!Grid.land[i] || Grid.owner[i]!==1) continue;
    for (const nb of neighbors4(i)) if (Grid.land[nb] && Grid.owner[nb]===n.id){ front.push(i); break; }
  }
  let target, naval = false;
  if (front.length){
    // a IA prefere atacar onde há menos tropas nossas
    const sample = Array.from({length:Math.min(6, front.length)}, ()=>pick(front));
    target = sample.sort((a,b)=>playerLocalDefense(a)-playerLocalDefense(b))[0];
  } else {
    if (n.navy < p.navy*0.8) return null;
    const coast = []; for (let i=0;i<NCELLS;i++) if (Grid.land[i] && Grid.owner[i]===1 && isCoastal(i)) coast.push(i);
    if (!coast.length) return null; target = pick(coast); naval = true;
  }
  const force = n.power * rand(0.2, 0.35) * (naval?0.6:1);
  let def = playerLocalDefense(target) * rand(0.85, 1.15) * (p.homeCells.includes(target) ? 1.4 : 1.0) * localDefense(target);
  for (let k=2;k<G.nations.length;k++){ const a=G.nations[k]; if (a.alive && a.alliance) def += a.power*0.05; }
  if (p.climate === 'frio' && [11,0,1].includes(curMonth())) def *= 1.2;
  const odds = battleOdds(force, def), win = Math.random() < odds;
  const ratio = force/(force+def);
  let lost = 0;
  for (const c of corpsNear(target, 4)) lost += lossesToCorps(c, win ? rand(0.15, 0.35) : rand(0.04, 0.12));
  lost += applyUnitLosses((win?0.04:0.015), 'land');
  n.power *= 1 - (win ? rand(0.03,0.06) : rand(0.08,0.15));
  p.warWeary += win ? 3 : 1;
  let captured = [];
  if (win){
    captured = bfsCells(target, 1, clamp(Math.round(1 + 3*ratio + rand(0,1)), 1, 4));
    transferCells(captured, 1, n.id);
    w.score -= captured.length; w.lostCells += captured.length; G.stats.cellsLost += captured.length;
    p.approval -= 3; p.stability -= 2;
    addLog(`🔥 ${n.name} invadiu nosso território e tomou ${captured.length} regiões! (perdemos ${lost} divisões)`, 'bad');
  } else {
    w.score += 3; G.stats.battlesWon++; G.stats.repelled = (G.stats.repelled||0) + 1;
    addLog(`🛡️ Repelimos um ataque de ${n.name}${naval?' vindo do mar':''}! (perdemos ${lost} divisões)`, 'good');
    p.approval += 1;
  }
  p.corps = (p.corps||[]).filter(c=>corpsUnitsCount(c) > 0);
  derive();
  return {win, target, captured, naval, n};
}
function peaceChance(id, terms){
  const n = G.nations[id], w = getWar(id), p = G.p; if (!w) return 0;
  const dur = G.turn - w.start;
  let c = 0.2 + w.score*0.02 + clamp((p.atk/Math.max(1,n.power)) - 1, -1, 2)*0.15 + dur*0.008 + (n.capLost?0.15:0);
  if (terms === 'reparacoes') c -= 0.2;
  if (terms === 'anexar') c = w.score > n.cells*0.7 && n.cells < 60 ? 0.3 + (w.score/n.cells)*0.2 : 0;
  if (terms === 'render') c = 1;
  return clamp(c, 0, 0.97);
}
function makePeace(id, terms){
  const n = G.nations[id], p = G.p, w = getWar(id);
  if (terms === 'reparacoes'){ G.stats.reparations = (G.stats.reparations||0) + 1; const amt = n.pop*n.pc*0.04; p.treasury += amt; addLog(`${n.name} pagará reparações de ${fmtMoney(amt)}.`, 'good'); }
  if (terms === 'anexar'){ const cells=[]; for (let i=0;i<NCELLS;i++) if (Grid.owner[i]===id && Grid.land[i]) cells.push(i); transferCells(cells, id, 1); MapView.flashCells(cells.slice(0,300)); return endWar(id, 'anexação'); }
  if (terms === 'render'){ const amt = p.gdp*0.05; p.treasury -= amt; p.approval -= 8; addLog(`Pagamos ${fmtMoney(amt)} em indenizações a ${n.name}.`, 'bad'); }
  if (terms === 'ceder'){ const front=[]; for (let i=0;i<NCELLS;i++) if (Grid.owner[i]===1 && Grid.land[i] && neighbors4(i).some(nb=>Grid.owner[nb]===id)) front.push(i); const cells = front.length? bfsCells(pick(front),1,clamp(Math.round(G.nations[1].cells*0.12),2,20)) : []; transferCells(cells, 1, id); p.approval -= 10; addLog(`Cedemos ${cells.length} regiões a ${n.name} pela paz.`, 'bad'); }
  endWar(id, terms);
}
function endWar(id, terms){
  const n = G.nations[id], w = getWar(id);
  if (!n) return;
  n.atWar = false; n.truce = G.turn + 24; n.capLost = false; n.relMod = Math.max(n.relMod, -40) + 10;
  if (w) G.warHistory.push({e:n.name, start:w.start, end:G.turn, score:w.score, won:w.won, lost:w.lost, taken:w.taken, lostCells:w.lostCells, result: terms});
  G.wars = G.wars.filter(x=>x.e!==id);
  G.stats.lastWarTurn = G.turn;
  if (n.alive) addLog(`🕊️ Paz assinada com ${n.name} (${({branca:'paz branca', reparacoes:'com reparações', render:'pagamos indenização', ceder:'cedemos territórios', ai:'proposta aceita', anexação:'anexação total'})[terms]||terms}).`, 'dip');
  addNews(`Paz entre ${G.p.name} e ${n.name}.`);
  MapView.dirty = true;
}

function nukeStrike(cell){
  const p = G.p, e = Grid.owner[cell], n = G.nations[e];
  if (!p.units.nuke || !n || !n.atWar) return null;
  p.units.nuke--; G.stats.nukesUsed++;
  const cells = bfsCells(cell, e, 6);
  n.pop *= 0.82; n.power *= 0.55; n.pc *= 0.85;
  const waste = cells.slice(0, 4); transferCells(waste, e, 0);
  const w = getWar(e); if (w) w.score += 25;
  for (let k=2;k<G.nations.length;k++){ const a=G.nations[k]; if (a.alive) changeRel(a, -35); }
  const fam = GOVS[p.gov].family; p.approval += fam==='dem' ? -15 : 2; p.stability -= 5;
  addLog(`☢️ Ataque nuclear contra ${n.name}! O mundo assiste horrorizado.`, 'war');
  addNews(`APOCALIPSE: ${p.name} usa armas nucleares contra ${n.name}!`);
  let retaliation = false;
  if (n.tech >= techCountAt(1946) && chance(0.6)){
    if (p.techs.includes('defesa_missil') && chance(0.7)) addLog('🛡️ Nosso escudo antimísseis interceptou a retaliação nuclear!', 'good');
    else { retaliation = true; p.pop *= 0.85; p.basePc *= 0.88; p.stability -= 25; p.approval -= 15; applyUnitLosses(0.2,'all'); addLog(`☢️ ${n.name} retaliou com armas nucleares! Milhões morreram.`, 'bad'); }
  }
  derive();
  return {cells, retaliation, n};
}

// ------------------------------------------------------------
//  Colonização
// ------------------------------------------------------------
function colonizePlan(cell){
  const p = G.p;
  if (Grid.owner[cell] !== 0 || !Grid.land[cell]) return {ok:false, why:'Esta região não é terra livre.'};
  const near = playerCellsNear(cell, 4);
  if (near < 0 && (!isCoastal(cell) || p.navy <= 0)) return {ok:false, why:'Muito longe. Precisa estar a até 4 regiões da fronteira, ou ser costeira (com frota).'};
  const cells = bfsCells(cell, 0, 8);
  const cost = cells.length * 30 * G.costScale * (near<0?1.6:1) * (1 + G.stats.colonized*0.02);
  return {ok:true, cells, cost, overseas: near<0};
}
function colonize(cell){
  const pl = colonizePlan(cell); if (!pl.ok) return pl;
  if (G.p.treasury < pl.cost) return {ok:false, why:'Tesouro insuficiente.'};
  G.p.treasury -= pl.cost;
  transferCells(pl.cells, 0, 1);
  G.stats.colonized += pl.cells.length; G.p.colonized += pl.cells.length;
  if (G.stats.colonized >= 20) unlock('colonizador');
  addLog(`⛺ Colonos fundaram assentamentos em ${pl.cells.length} novas regiões.`, 'good');
  return {ok:true, cells:pl.cells};
}

// ------------------------------------------------------------
//  Diplomacia
// ------------------------------------------------------------
const DIPLO = {
  gift(n){ const cost = Math.max(20*G.costScale, G.p.gdp*0.003); if (G.p.treasury < cost) return {ok:false, why:'Tesouro insuficiente.'}; G.p.treasury -= cost; changeRel(n, 10 + Math.round(rand(0,5))); n.lastGift = G.turn; return {ok:true, msg:`Enviamos um presente de ${fmtMoney(cost)} a ${n.name}. Relações melhoraram.`}; },
  giftCost(){ return Math.max(20*G.costScale, G.p.gdp*0.003); },
  cancelTrade(n){ n.deals = {}; syncTrade(n); changeRel(n, -10); return {ok:true, msg:`Todos os acordos comerciais com ${n.name} foram encerrados.`}; },
  spyCost(){ return 40*G.costScale + G.p.gdp*0.001; },
  pact(n){ if (n.rel < 5) return {ok:false, why:'Relações insuficientes (mínimo 5).'}; if (chance(0.45 + n.rel/120)){ n.pact = true; changeRel(n, 5); return {ok:true, msg:`Pacto de não-agressão firmado com ${n.name}.`}; } changeRel(n,-2); return {ok:false, why:`${n.name} recusou o pacto.`}; },
  alliance(n){ if (n.rel < 45) return {ok:false, why:'Relações insuficientes (mínimo 45).'}; if (chance(0.3 + (n.rel-45)/80)){ n.alliance = true; n.pact = true; changeRel(n, 10); return {ok:true, msg:`Aliança militar formada com ${n.name}!`}; } changeRel(n,-4); return {ok:false, why:`${n.name} não quis se comprometer com uma aliança.`}; },
  breakAlliance(n){ n.alliance = false; changeRel(n, -25); G.p.stability -= 3; return {ok:true, msg:`Aliança com ${n.name} rompida.`}; },
  insult(n){ changeRel(n, -20); const fam = GOVS[G.p.gov].family; G.p.approval += (n.rel < -20 ? 2 : 0); return {ok:true, msg:`Insultamos publicamente ${n.name}. A imprensa local adora; ${n.name} não.`}; },
  tribute(n){
    const ratio = G.p.atk / Math.max(1, n.power);
    if (ratio < 1.5) { changeRel(n, -15); return {ok:false, why:`${n.name} riu da nossa exigência. (Precisamos de um exército 1,5x mais forte)`}; }
    if (chance(clamp((ratio-1.5)*0.35 + 0.15, 0, 0.85))){ const amt = n.pop*n.pc*0.0025; G.p.tributes.push({from:n.id, amt, until:G.turn+24}); changeRel(n, -25); return {ok:true, msg:`${n.name} aceitou pagar tributo de ${fmtMoney(amt)}/mês por 2 anos.`}; }
    changeRel(n, -25); return {ok:false, why:`${n.name} recusou o tributo e se prepara para a guerra.`};
  },
  spy(n){
    if (chance(0.5 + (G.p.techs.includes('criptografia')?0.15:0))){ const k = revealSites(n.id); if (k) return {ok:true, msg:`🕵️ Nossos espiões mapearam ${k} instalações estratégicas de ${n.name} (bases, usinas, água, indústria). Elas agora aparecem no mapa.`}; }
    if (chance(0.5 + (G.p.techs.includes('computacao')?0.1:0))){
      if (n.tech > G.p.techs.length - 2 && G.p.researching){ const g = techCost(G.p.researching)*0.4; G.p.rp += g; return {ok:true, msg:`Espiões roubaram segredos de ${n.name}: +${Math.round(g)} pontos de pesquisa.`}; }
      n.power *= 0.9; return {ok:true, msg:`Sabotagem bem-sucedida: o exército de ${n.name} foi enfraquecido em 10%.`};
    }
    changeRel(n, -25); return {ok:false, why:`Nossos espiões foram capturados em ${n.name}! Escândalo diplomático.`};
  },
  embargo(n){ n.deals = {}; syncTrade(n); n.embargo = G.turn + 24; n.pc *= 0.97; changeRel(n, -25); return {ok:true, msg:`Embargo econômico imposto a ${n.name}.`}; }
};

// ------------------------------------------------------------
//  Economia — ações
// ------------------------------------------------------------
const ECON_ACTIONS = {
  loan(f){ const p=G.p; if (creditRating()==='D') return {ok:false, why:'Nenhum credor aceita emprestar (rating D).'}; const amt = p.gdp*f; p.debt += amt; p.treasury += amt; G.stats.loansTaken++; return {ok:true, msg:`Empréstimo de ${fmtMoney(amt)} a ${fmtPct(interestRate())} ao ano.`}; },
  repay(f){ const p=G.p; const amt = Math.min(p.debt*f, p.treasury); if (amt <= 0) return {ok:false, why:'Sem recursos para pagar.'}; p.debt -= amt; p.treasury -= amt; return {ok:true, msg:`Pagamos ${fmtMoney(amt)} da dívida.`}; },
  print(){ const p=G.p; if (p.policies.banco_central) return {ok:false, why:'O Banco Central independente proíbe a emissão.'}; const amt = p.gdp*0.03; p.treasury += amt; p.printBoost += 5; p.approval -= 1; return {ok:true, msg:`Imprimimos ${fmtMoney(amt)}. A inflação vai subir...`}; },
  default(){ const p=G.p; if (p.debt < p.gdp*0.6) return {ok:false, why:'A dívida não é alta o bastante para justificar uma moratória.'}; const cut = p.debt*0.6; p.debt -= cut; p.defaults++; p.stability -= 15; p.approval -= 8; addTemp({growth:-2}, 24, 'Pós-calote'); for (let k=2;k<G.nations.length;k++){ const n=G.nations[k]; if (n.alive){ changeRel(n,-10); } } return {ok:true, msg:`Moratória declarada! ${fmtMoney(cut)} em dívidas canceladas. Credores furiosos.`}; },
  city(){ const p=G.p; const cost = 1.2*p.gdp/100 + 30*G.costScale; if (p.treasury < cost) return {ok:false, why:'Tesouro insuficiente.'}; p.treasury -= cost; p.cities++; const c = p.homeCells.concat([]).filter(x=>Grid.owner[x]===1); if (c.length){ p.cityCells.push(pick(c)); p.cityNames.push(genPlaceName()); } p.approval += 1; return {ok:true, msg:`Uma nova cidade foi fundada: ${p.cityNames[p.cityNames.length-1]}!`}; },
  cityCost(){ return 1.2*G.p.gdp/100 + 30*G.costScale; },
  addState(){ const p=G.p; const cost = 0.4*p.gdp/100; if (p.treasury < cost) return {ok:false, why:'Tesouro insuficiente.'}; p.treasury -= cost; p.states++; p.stateNames.push(genPlaceName()); return {ok:true, msg:`Novo estado criado: ${p.stateNames[p.stateNames.length-1]}.`}; },
  mergeState(){ const p=G.p; if (p.states <= 1) return {ok:false, why:'Mínimo de 1 estado.'}; p.states--; p.stability -= 2; p.stateNames.pop(); return {ok:true, msg:'Dois estados foram fundidos.'}; }
};

function recruit(u, qty){
  const p = G.p, m = p.mods || calcMods(), U = UNIT[u];
  if (U.req && !p.techs.includes(U.req)) return {ok:false, why:'Tecnologia necessária: ' + TECH[U.req].n};
  const cost = unitCost(u, m)*qty, man = U.man*qty;
  if (p.treasury < cost) return {ok:false, why:'Tesouro insuficiente.'};
  if (p.manpower < man) return {ok:false, why:'Reservas humanas insuficientes.'};
  p.treasury -= cost; p.manpower -= man; p.units[u] = (p.units[u]||0) + qty;
  derive();
  return {ok:true, msg:`${qty}x ${U.n} recrutado(s).`};
}
function disband(u, qty){ const p = G.p; qty = Math.min(qty, p.units[u]||0); if (!qty) return {ok:false}; p.units[u] -= qty; p.manpower += UNIT[u].man*qty*0.8; derive(); return {ok:true, msg:`${qty}x ${UNIT[u].n} desmobilizado(s).`}; }

function togglePolicy(id){
  const p = G.p, P = POLICY[id];
  if (P.block && P.block.includes(p.gov)) return {ok:false, why:'Proibido pelo seu regime político.'};
  if (P.req && !p.techs.includes(P.req)) return {ok:false, why:'Requer ' + TECH[P.req].n};
  if (!p.policies[id]){ const cb = constBlocks(id); if (cb) return {ok:false, why:cb}; }
  if (!p.policies[id] && P.excl && p.policies[P.excl]) p.policies[P.excl] = false;
  p.policies[id] = !p.policies[id];
  if (p.policies[id]){ if (id==='lei_marcial') p.approval -= 5; addLog(`Nova lei aprovada: ${P.n}.`, 'info'); }
  else addLog(`Lei revogada: ${P.n}.`, 'info');
  derive();
  return {ok:true};
}

// ------------------------------------------------------------
//  Turno mensal
// ------------------------------------------------------------
function endTurn(){
  const p = G.p, N = G.nations;
  let m = derive();
  // ---------- economia ----------
  const b = budget(m);
  p.lastBudget = b;
  p.treasury += b.bal;
  p.tributes = p.tributes.filter(t=>t.until > G.turn && N[t.from] && N[t.from].alive && !N[t.from].atWar);
  if (p.treasury < 0){
    if (creditRating() !== 'D'){ const amt = -p.treasury + p.gdp*0.01; p.debt += amt*1.05; p.treasury += amt; p.approval -= 0.5; if (!p._warnLoan || G.turn - p._warnLoan > 6){ addLog(`Tesouro negativo: empréstimo emergencial de ${fmtMoney(amt)}.`, 'bad'); p._warnLoan = G.turn; } }
    else { p.stability -= 3; p.approval -= 3; p.morale *= 0.95; }
  }
  const debtR = p.debt / Math.max(1, p.gdp);
  // crescimento
  const warN = G.wars.length;
  let g = m.growth*0.6 + p.spend.infra*0.2 + p.spend.edu*0.08 + p.spend.research*0.1
        - Math.max(0, p.tax*100-25)*0.12 - Math.max(0, p.inflation-6)*0.15 + (p.stability-50)*0.02
        - Math.max(0, debtR-1)*1.5 - warN*0.6 + rand(-0.8, 0.8)
        + Math.max(0, 2 - p.basePc/(4000*G.costScale))*0.25;
  if (p.treasury < 0) g -= 2;
  g = clamp(g, -10, 12); p.growth = g;
  p.basePc *= 1 + g/1200;
  let pg = 1.3 + m.popGrowth*0.6 + p.spend.health*0.08 - clamp(p.gdpPc/(6000*G.costScale), 0, 4)*0.4 - (p.stability<20?0.5:0);
  pg = clamp(pg, -3, 4.5); p.popGrowth = pg;
  p.pop *= 1 + pg/1200;
  // inflação, desemprego
  p.printBoost *= 0.85;
  const deficit = Math.max(0, -b.bal*12/Math.max(1,p.gdp));
  const infT = clamp(2.5 + m.inflation + p.printBoost + deficit*30 + (warN?1:0), -2, 200);
  p.inflation += (infT - p.inflation)*0.15;
  const unT = clamp(7 + m.unemployment - g*0.4 - p.spend.infra*0.3 - (warN?1:0), 1, 45);
  p.unemployment += (unT - p.unemployment)*0.1;
  // corrupção
  const corT = clamp(0.08 + m.corruption - p.spend.police*0.006 - p.spend.edu*0.004, 0.01, 0.6);
  p.corruption += (corT - p.corruption)*0.05;
  // ---------- política ----------
  p.occupied *= 0.96;
  if (warN) p.warWeary += warN*1.1*(1 + m.warWeary); else p.warWeary -= 2;
  p.warWeary = clamp(p.warWeary, 0, 100);
  const apT = clamp(43 + m.approval - Math.max(0, debtR-0.8)*6 + (p.spend.social-3)*2.2 + (p.spend.health-3)*1.6 + (p.spend.edu-3)*0.8
        - (p.tax*100-20)*0.9 - (p.unemployment-6)*1.1 - Math.max(0,p.inflation-4)*1.0 - p.warWeary*0.35
        + clamp(g,-5,5)*0.8 - p.corruption*30 + (p.treasury<0?-5:0), 0, 100);
  p.approval += (apT - p.approval)*0.12;
  const stT = clamp(45 + m.stability + (p.approval-50)*0.45 + p.spend.police*3 + (p.admin-0.85)*40
        - p.corruption*25 - p.warWeary*0.25 - p.occupied*0.6 - (p.inflation>20?(p.inflation-20)*0.3:0), 0, 100);
  p.stability += (stT - p.stability)*0.1;
  p.approval = clamp(p.approval, 0, 100); p.stability = clamp(p.stability, 0, 100);
  p.morale = clamp(0.5 + p.stability/200 + p.approval/400 - p.warWeary/250 + m.military*0.2, 0.3, 1.3);
  // ---------- pesquisa ----------
  researchLuckTurn();
  p.rpRate = researchRate(m);
  p.rpPrevEff = p.rpEff || 0;
  p.rpEff = p.researching ? p.rpRate * techSpeed(p.researching) : p.rpRate;
  if (p.researching){
    p.rp += p.rpEff;
    const c = techCost(p.researching);
    if (p.rp >= c){
      p.rp -= c; const t = TECH[p.researching]; p.techs.push(t.id); if (t.year - curYear() >= 10) G.stats.earlyTech = (G.stats.earlyTech||0) + 1;
      addLog(`🔬 Descoberta: ${t.n}! ${t.d}`, 'good');
      if (typeof onTech === 'function') onTech(t);
      if (t.id==='fissao') unlock('atomico'); if (t.id==='satelites') unlock('espacial');
      if (t.id==='fusao'){ unlock('abundancia'); triggerVictory('Era da Abundância — seu país dominou a fusão nuclear!'); }
      const av = availableTechs(); p.researching = av.length ? av.sort((a,b)=>a.cost-b.cost)[0].id : null;
    }
  } else { const av = availableTechs(); if (av.length) p.researching = av[0].id; }
  // ---------- militar ----------
  p.manpower = Math.min(p.maxMan, p.manpower + p.maxMan*0.03);
  p.attacksLeft = maxAttacks();
  // ---------- temporários ----------
  p.temp = p.temp.filter(t => t.until > G.turn);
  // ---------- IA ----------
  aiTurn();
  processNegotiations(); processAmendment(); processReform();
  if (p.techs.includes('satelite_espiao')) for (const w of G.wars) revealSites(w.e);
  moveCorpsTurn(); occupationTurn(); expeditionsTurn(); cityProjectsTurn(); processBuildUpgrades(); processResourceSetup();
  // ---------- guerra ----------
  if (G.wars.length){ G.stats.monthsAtWar++; p.peaceMonths = 0; } else p.peaceMonths++;
  // ---------- histórico, conquistas ----------
  G.turn++;
  if (curMonth() === 0){ p.age++; if (p.infra > 0) {} p.cities += Math.round(p.cities*p.spend.infra*0.002); }
  derive();
  if (curMonth() === 0) snapshotRanks();
  recordHistory();
  checkAchievements(); checkObjectives();
  // ---------- crises internas ----------
  politicalChecks();
  // ---------- eventos aleatórios ----------
  if (!G.over && !G.pendingEvents.length && chance(0.18*(typeof worldVal === 'function' ? worldVal('events') : 1))) rollEvent();
  checkGameOver();
  G.stats.eventsSeen = G.stats.eventsSeen;
}

function aiTurn(){
  const p = G.p, N = G.nations;
  if (G.turn % 3 === 0) computeAdjacency();
  const worldAuth = !G.online || G.online.host;
  for (let id=2; id<N.length; id++){
    const n = N[id]; if (!n.alive || n.human) continue;
    const war = n.atWar || G.aiWars.some(w=>w.a===id||w.b===id);
    if (worldAuth){
    n.pc *= 1 + (rand(0.3, 3.0) + (n.res||[]).length*0.15 + clamp(Math.log10(Math.max(1,n.area)/1e5),0,1.5)*0.2 - (war?1.2:0) - (n.embargo>G.turn?1:0))/1200;
    if (n.histMil) n.histMil += (1 - n.histMil)*0.002;
    n.pop *= 1 + rand(0.6, 1.8)/1200;
    n.tech += (techCountAt(curYear()) + n.techOff - n.tech)*0.02 + rand(-0.01, 0.02);
    const tgt = aiPowerTarget(n);
    n.power += (tgt - n.power)*(war?0.05:0.03);
    n.navy += (tgt*0.35 - n.navy)*0.03;
    }
    n.relMod *= 0.993;
    if (n.claim && G.turn % 12 === 0) n.claim = Math.max(0, n.claim-1);
    updateRelation(n);
    // cancelamentos
    if (n.trade && n.rel < -5 && chance(0.06)){ const t = pick(Object.keys(n.deals)); delete n.deals[t]; syncTrade(n); addLog(`${n.name} cancelou o acordo "${DEALS[t].n}" conosco.`, 'dip'); }
    if (worldAuth && curMonth() === 0 && typeof applyRealLeader === 'function' && (applyRealLeader(n, curYear(), true) || realLeaderAt(n.key, curYear()))){ /* líder real da época */ }
    else if (worldAuth && curMonth() === 0 && chance(0.07)){ const old = n.leader; n.leader = genLeaderName(n.cult); n.leaderAge = randInt(40,65); addNews(`${n.name}: ${old} deixa o poder; ${n.leader} assume.`); }
    if (worldAuth && curMonth() === 0) n.leaderAge = (n.leaderAge||50) + 1;
    if (n.alliance && n.rel < 25 && chance(0.1)){ n.alliance = false; addLog(`${n.name} desfez a aliança conosco.`, 'dip'); }
    // declarar guerra ao jogador
    if (!n.atWar && !n.pact && !n.alliance && G.turn > (n.claim ? 8 : 18) && n.truce < G.turn && N[1].alive && G.wars.length < 3){
      const adj = adjacent(1, id) || (n.navy > p.navy*1.2 && capDist(n) < 55);
      const opportunist = n.ag >= 0.55 && n.power > p.def*3 && n.rel < -5;
      if (adj && (n.rel < -25 || opportunist) && n.power > p.def*0.75){
        const pr = 0.01*(n.ag+0.3)*(1 + Math.max(0,-n.rel-25)/40)*(n.claim?1.6:1)*(n.power > p.def*2 ? 1.5 : 1)*(typeof achWarMult === 'function' ? achWarMult(n) : 1)*(typeof worldVal === 'function' ? worldVal('aggression') : 1);
        if (chance(pr)){
          if (chance(0.4) && !G.pendingEvents.some(e=>e.id==='ultimato')) queueEvent('ultimato', {n:id});
          else { declareWar(id, true); if (typeof onWarDeclared === 'function') onWarDeclared(n); }
        }
      }
    }
    // propostas
    const dm = typeof achDipMult === 'function' ? achDipMult() : 1;
    if (!n.atWar && n.rel > 55 && !n.alliance && chance(0.004*dm)) queueEvent('proposta_alianca', {n:id});
    if (!n.atWar && n.rel > 25 && !n.trade && chance(0.006*dm)) queueEvent('proposta_comercio', {n:id});
  }
  // guerras contra o jogador
  for (const w of G.wars.slice()){
    const n = N[w.e]; if (!n || !n.alive){ G.wars = G.wars.filter(x=>x!==w); continue; }
    if (n.human) continue;
    if (chance(Math.min(0.95, 0.42*(0.5+n.ag)*(typeof worldVal === 'function' ? worldVal('aggression') : 1)))){ const r = aiAttack(n, w); if (r && typeof onAIAttack === 'function') onAIAttack(r); }
    const dur = G.turn - w.start;
    if (dur > 4 && !G.pendingEvents.some(e=>e.id==='paz_ia' && e.d.n===w.e)){
      if (w.score > 12 && chance(0.08 + w.score*0.004)) queueEvent('paz_ia', {n:w.e, win:true});
      else if (w.score < -8 && chance(0.06 + (-w.score)/150 + (w.lostCells >= Math.max(6, G.nations[1].cells*0.4) ? 0.25 : 0))) queueEvent('paz_ia', {n:w.e, win:false});
      else if ((dur > 30 && chance(0.04)) || (dur > 8 && Math.abs(w.score) < 4 && !adjacent(1, w.e) && chance(0.1))) queueEvent('paz_ia', {n:w.e, win:null});
    }
  }
  if (!worldAuth) return;
  // guerras entre IAs
  for (const w of G.aiWars.slice()){
    const a = N[w.a], b = N[w.b];
    if (!a.alive || !b.alive || G.turn > w.until){ G.aiWars = G.aiWars.filter(x=>x!==w); if (a.alive && b.alive) addNews(`Paz entre ${a.name} e ${b.name}.`); continue; }
    if (!adjacent(w.a, w.b) || chance(0.4)) continue;
    const pa = battleOdds(a.power, b.power); const win = chance(pa) ? a : b, lose = win===a ? b : a;
    const front = []; for (let i=0;i<NCELLS;i++) if (Grid.land[i] && Grid.owner[i]===lose.id && neighbors4(i).some(nb=>Grid.owner[nb]===win.id)) front.push(i);
    if (front.length){ const cells = bfsCells(pick(front), lose.id, Math.round(rand(1,4))); transferCells(cells, lose.id, win.id); if (typeof onWorldBattle === 'function') onWorldBattle(win.id, lose.id, cells); win.power *= 0.97; lose.power *= 0.94; if (chance(0.3)) addNews(`${win.name} avança sobre ${lose.name}.`); }
  }
  if (chance(0.03)){
    // nova guerra entre IAs
    const keys = Object.keys(G.adj);
    if (keys.length){
      const [a, b] = pick(keys).split(',').map(Number);
      if (a>1 && b>1 && !N[a].human && !N[b].human){
        const A = N[a], B = N[b];
        const [att, def] = A.ag*A.power > B.ag*B.power ? [A,B] : [B,A];
        if (att.alive && def.alive && !(att.bloc && att.bloc===def.bloc) && att.power > def.power*1.15 && !def.alliance){
          startAIWar(att.id, def.id); addLog(`📰 ${att.name} declarou guerra contra ${def.name}.`, 'info'); addNews(`Guerra! ${att.name} ataca ${def.name}.`);
        }
      }
    }
  }
}

function politicalChecks(){
  const p = G.p, gov = GOVS[p.gov];
  // eleições
  if (gov.elections && p.nextElection > 0){
    if (G.turn === p.nextElection - 2) queueOnce('campanha');
    if (G.turn >= p.nextElection) queueOnce('eleicao');
  }
  // morte do líder
  if (p.age > 58 && chance((p.age-58)*0.0009)) queueOnce('sucessao');
  // golpe
  if (gov.coup && p.stability < 30){
    const pr = (30-p.stability)*0.0022*(1 + (p.mods?p.mods.coup:0)) * (p.morale<0.7?1.8:1);
    if (chance(pr)) queueOnce('golpe');
  }
  // revolução
  if (p.stability < 8) p.revolt++; else p.revolt = Math.max(0, p.revolt-1);
  if (p.revolt >= 3){ p.revolt = 0; queueOnce('revolucao'); }
  // colapso econômico
  if (p.debt > p.gdp*3 && p.treasury <= 0) p.collapse++; else p.collapse = Math.max(0, p.collapse-1);
  if (p.collapse === 3) addLog('⚠️ A economia está à beira do colapso! Reduza a dívida imediatamente.', 'bad');
  if (p.inflation > 25 && chance(0.1)) queueOnce('hiperinflacao');
  if (p.debt > p.gdp*1.2 && chance(0.05)) queueOnce('crise_divida');
}

function checkGameOver(){
  const p = G.p;
  if (G.over) return;
  if (!G.nations[1].alive || G.nations[1].cells <= 0) return gameOver(`${p.name} foi totalmente conquistado e riscado do mapa.`, 'conquista');
  if (p.collapse >= 6) return gameOver('Colapso econômico total: o Estado faliu e o governo se dissolveu.', 'falencia');
}

function gameOver(reason, kind){
  if (G.over) return;
  G.over = true; G.endReason = reason; G.endKind = kind;
  addLog('FIM: ' + reason, 'bad');
  archiveGame();
  if (typeof onGameOver === 'function') onGameOver(reason, kind);
}
// vitória só existe no Modo com Objetivos, ao cumprir o objetivo final
function triggerVictory(reason, isFinal){
  if (!isFinal || G.objMode !== 'objetivos') return;
  if (G.victory) return;
  G.victory = true; G.victoryReason = reason;
  addLog('🏆 VITÓRIA: ' + reason, 'good');
  if (typeof onVictory === 'function') onVictory(reason);
}

function rankings(){
  const list = [];
  for (const n of G.nations){
    if (!n || !n.alive) continue;
    if (n.id === 1) list.push({id:1, name:G.p.name, gdp:G.p.gdp, pop:G.p.pop, area:G.p.area, power:G.p.atk, color:n.color});
    else list.push({id:n.id, name:n.name, gdp:n.pop*n.pc, pop:n.pop, area:n.area, power:n.power, color:n.color});
  }
  const rank = (k)=>{ const s = list.slice().sort((a,b)=>b[k]-a[k]); return s.findIndex(x=>x.id===1)+1; };
  return {list, gdp:rank('gdp'), area:rank('area'), power:rank('power'), pop:rank('pop'), total:list.length};
}

function checkAchievements(){
  const p = G.p;
  if (p.area >= 5e6) unlock('imperio');
  if (p.area >= 1e7) unlock('gigante');
  if (G.turn % 3 === 0){
    const r = rankings();
    if (r.gdp <= 5) unlock('rico');
    if (r.gdp === 1 && r.power === 1){ unlock('superpotencia'); if (G.turn > 24) triggerVictory('Superpotência — maior economia e maior exército do planeta!'); }
    let total = 0; for (let i=0;i<NCELLS;i++) if (Grid.land[i] && Grid.owner[i]>0) total++;
    if (G.nations[1].cells/total >= 0.25){ unlock('hegemonia'); triggerVictory('Hegemonia — seu país controla um quarto das terras do mundo!'); }
  }
  if (G.turn >= 1200) unlock('centenario');
  if (p.peaceMonths >= 360) unlock('pacifista');
  if (G.turn >= 120 && p.debt <= 0.5) unlock('sem_dividas');
  G.stats.peakGdp = Math.max(G.stats.peakGdp, p.gdp); G.stats.peakArea = Math.max(G.stats.peakArea, p.area); G.stats.peakPop = Math.max(G.stats.peakPop, p.pop);
  if (typeof checkTrophies === 'function') checkTrophies();
}
function unlock(id){ if (G.achievements.includes(id)) return; G.achievements.push(id); if (typeof saveTrophy === 'function') saveTrophy(id); addLog(`🏅 Conquista desbloqueada: ${ACHIEVEMENTS[id].n} — ${ACHIEVEMENTS[id].d}`, 'good'); if (typeof onAchievement === 'function') onAchievement(id); }

function recordHistory(){
  const p = G.p;
  G.stats.peakGdp = Math.max(G.stats.peakGdp, p.gdp); G.stats.peakArea = Math.max(G.stats.peakArea, p.area); G.stats.peakPop = Math.max(G.stats.peakPop, p.pop);
  if (typeof totalDivisions === 'function') G.stats.maxDivisions = Math.max(G.stats.maxDivisions||0, totalDivisions());
  G.hist.push({t:G.turn, gdp:Math.round(p.gdp), pc:Math.round(p.gdpPc), pop:+p.pop.toFixed(3), tre:Math.round(p.treasury), debt:Math.round(p.debt),
    app:+p.approval.toFixed(1), stab:+p.stability.toFixed(1), area:Math.round(p.area), pow:Math.round(p.atk), inf:+p.inflation.toFixed(1), un:+p.unemployment.toFixed(1), tech:p.techs.length, war:G.wars.length});
}

function score(){
  const p = G.p, s = G.stats;
  return Math.round(p.gdp/(200*G.costScale) + p.area/5000 + p.techs.length*120 + s.battlesWon*25 + s.annexed*600 + G.turn*3 + G.achievements.length*300 + (G.victory?5000:0) + p.pop*2);
}

// ------------------------------------------------------------
//  Salvar / carregar / histórico
// ------------------------------------------------------------
const MAX_SLOTS = 5;
const slotKey = i => 'imperium_slot_' + i, slotMetaKey = i => 'imperium_slotmeta_' + i;
function saveGame(){
  if (!G || G.over) return;
  if (G.online){ if (typeof onlineSave === 'function') onlineSave(); return; }
  if (G.slot === undefined || G.slot === null) G.slot = freeSlot();
  if (G.slot < 0) return;
  try {
    const data = Object.assign({}, G, {landStr: Grid.encode(Grid.land), ownerStr: Grid.encode(Grid.owner)});
    const p = Object.assign({}, G.p); delete p.flagCanvas; delete p.mods; data.p = p;
    localStorage.setItem(slotKey(G.slot), JSON.stringify(data));
    localStorage.setItem(slotMetaKey(G.slot), JSON.stringify({name:G.p.name, leader:G.p.leader, title:G.p.title, gov:G.p.gov, flag:G.p.flag, date:dateStr(), turn:G.turn, savedAt:Date.now(), existing:G.p.existing||null}));
  } catch(e){ console.warn('save failed', e); if (typeof toast === 'function') toast('⚠️ Sem espaço para salvar. Apague uma partida antiga.', 'bad'); }
}
function slotMeta(i){ try { return JSON.parse(localStorage.getItem(slotMetaKey(i))); } catch(e){ return null; } }
function listSlots(){ return Array.from({length:MAX_SLOTS}, (_,i)=>({i, meta: slotMeta(i)})); }
function freeSlot(){ const l = listSlots().find(x=>!x.meta); return l ? l.i : -1; }
function hasSave(){ return listSlots().some(x=>x.meta); }
function loadGame(slot){
  try {
    const data = JSON.parse(localStorage.getItem(slotKey(slot))); if (!data) return false;
    Grid.decode(data.landStr, Grid.land); Grid.decode(data.ownerStr, Grid.owner);
    delete data.landStr; delete data.ownerStr;
    G = data; G.slot = slot; G.pendingEvents = G.pendingEvents || []; G.negs = G.negs || []; G.rankHist = G.rankHist || {};
    G.p.buildings = G.p.buildings || [];
    recount(); computeAdjacency(); derive();
    MapView.dirty = true;
    return true;
  } catch(e){ console.warn(e); return false; }
}
function deleteSlot(i){ try { localStorage.removeItem(slotKey(i)); localStorage.removeItem(slotMetaKey(i)); } catch(e){} }
function deleteSave(){ if (G && G.slot !== undefined && G.slot !== null && G.slot >= 0) deleteSlot(G.slot); }
function getHistory(){ try { return JSON.parse(localStorage.getItem(HIST_KEY)) || []; } catch(e){ return []; } }
function archiveGame(abandon){
  const rec = buildRecord(abandon);
  try {
    const h = getHistory().filter(x=>x.id!==rec.id); h.unshift(rec);
    localStorage.setItem(HIST_KEY, JSON.stringify(h.slice(0, 40)));
  } catch(e){ console.warn(e); }
  deleteSave();
  return rec;
}
function buildRecord(abandon){
  const p = G.p, s = G.stats, r = rankings();
  const sample = G.hist.length > 400 ? G.hist.filter((h,i)=>i % Math.ceil(G.hist.length/400) === 0 || i===G.hist.length-1) : G.hist;
  const rec = {
    id:G.id, name:p.name, official:p.official, leader:p.leader, title:p.title, gov:p.gov, econ:p.econ, religion:p.religion, capital:p.capital, motto:p.motto,
    flag:p.flag, color:p.color, era:G.era, startYear:G.startYear, endDate:dateStr(), months:G.turn,
    reason: abandon ? 'Partida encerrada pelo jogador.' : (G.endReason || ''), kind: abandon ? 'abandono' : (G.endKind || ''), victory:G.victory, victoryReason:G.victoryReason || '',
    score:score(), final:{gdp:p.gdp, pc:p.gdpPc, pop:p.pop, area:p.area, power:p.atk, techs:p.techs.length, treasury:p.treasury, debt:p.debt, approval:p.approval, stability:p.stability, states:p.states, cities:p.cities},
    stats:s, achievements:G.achievements, hist:sample, log:G.log.slice(-150), warHistory:G.warHistory.concat(G.wars.map(w=>({e:G.nations[w.e].name, start:w.start, end:G.turn, score:w.score, won:w.won, lost:w.lost, taken:w.taken, lostCells:w.lostCells, result:'em andamento'}))),
    ranks:{gdp:r.gdp, area:r.area, power:r.power, total:r.total}, techs:p.techs.slice(), startMonth:G.startMonth, savedAt:Date.now(),
    currencySym:p.currencySym, top: r.list.slice().sort((a,b)=>b.gdp-a.gdp).slice(0,15).map(x=>({name:x.name, gdp:x.gdp, area:x.area, power:x.power, pop:x.pop, me:x.id===1})),
    ongoing: !G.over && !abandon
  };
  return rec;
}
