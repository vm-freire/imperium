// ============================================================
//  IMPERIUM — Mundo real (Natural Earth, domínio público)
//  • Contorno real da terra e dos lagos
//  • Cada célula do mapa pertence ao país real
//  • As épocas juntam países atuais em impérios e colônias
//  • Capitais de cada época, estados e cidades reais
// ============================================================
'use strict';

// ---------------- Terra e lagos reais ----------------
for (const k of Object.keys(CONTINENTS)) delete CONTINENTS[k];
GEO.land.forEach((p, i) => { CONTINENTS['t' + i] = p; });
LAKES.length = 0; GEO.lakes.forEach(p => LAKES.push(p));

const GEO_IDX = {};                                  // a3 -> índice em GEO.countries
GEO.countries.forEach((c, i) => { GEO_IDX[c.a3] = i; });
const cellA3 = i => { const ch = GEO.cc.charCodeAt(i); return ch === 32 ? null : GEO.countries[ch - 0x101].a3; };

const _buildLandOld = Grid.buildLand;
Grid.buildLand = function(extraPolys){
  for (let i = 0; i < NCELLS; i++) this.land[i] = GEO.cc.charCodeAt(i) === 32 ? 0 : 1;
  for (const p of (extraPolys||[])) for (let i = 0; i < NCELLS; i++){ if (!this.land[i]){ const [lo, la] = cellCenter(i); if (pointInPoly(lo, la, p)) this.land[i] = 1; } }
};

// ---------------- Nomes em português do Brasil ----------------
const GEO_NAME = {YEM:'Iêmen', MUS:'Maurício', IRN:'Irã', VNM:'Vietnã', CZE:'Tchéquia', NLD:'Holanda', IRL:'Irlanda', SWZ:'Essuatíni', COD:'RD Congo', COG:'Congo-Brazzaville', BIH:'Bósnia', ARE:'Emirados Árabes',
  CAF:'República Centro-Africana', DOM:'República Dominicana', KEN:'Quênia', SWE:'Suécia', KOR:'Coreia do Sul', MDG:'Madagascar', TWN:'Taiwan', SDS:'Sudão do Sul', MKD:'Macedônia do Norte', GNQ:'Guiné Equatorial',
  ZWE:'Zimbábue', SLB:'Ilhas Salomão', PNG:'Papua-Nova Guiné', LVA:'Letônia', EST:'Estônia', ARM:'Armênia', CMR:'Camarões', BEN:'Benin', KGZ:'Quirguistão', TKM:'Turcomenistão', UZB:'Uzbequistão', TJK:'Tajiquistão'};
// países que já tinham dados no jogo (líderes, partidos, bandeiras, história)
const LEGACY_A3 = {USA:'Estados Unidos', CAN:'Canadá', MEX:'México', CUB:'Cuba', COL:'Colômbia', VEN:'Venezuela', PER:'Peru', BRA:'Brasil', ARG:'Argentina', GBR:'Reino Unido', FRA:'França', ESP:'Espanha',
  DEU:'Alemanha', ITA:'Itália', POL:'Polônia', SWE:'Escandinávia', UKR:'Ucrânia', TUR:'Turquia', RUS:'Rússia', EGY:'Egito', DZA:'Argélia', NGA:'Nigéria', ETH:'Etiópia', COD:'Congo', ZAF:'África do Sul',
  SAU:'Arábia Saudita', IRN:'Irã', KAZ:'Cazaquistão', IND:'Índia', PAK:'Paquistão', CHN:'China', MNG:'Mongólia', JPN:'Japão', KOR:'Coreia', THA:'Tailândia', PHL:'Filipinas', IDN:'Indonésia', AUS:'Austrália',
  NZL:'Nova Zelândia', MLI:'Mali', SDN:'Sudão', AGO:'Angola', KEN:'África Oriental', AUT:'Áustria'};
const LEGACY_BY_KEY = {}; AI_NATIONS.forEach(d => { LEGACY_BY_KEY[d.name] = d; });

// regime, religião e cultura para os países novos
const GOV_A3 = {monarquia_const:'NLD BEL NOR DNK LUX MYS KHM MAR LSO BTN JOR', monarquia_abs:'OMN QAT ARE KWT SWZ BRN', comunismo:'VNM LAO PRK', ditadura:'ERI TKM BLR SYR MMR TCD',
  teocracia:'AFG', democracia:'ISR IRL GRC CZE HUN SVK SVN HRV EST LVA LTU FIN ISL BGD NPL'};
const REL_A3 = {ortodoxo:'GRC SRB MNE MKD ROU BGR BLR MDA GEO ARM CYP', catolico:'POL HUN CZE SVK SVN HRV IRL PRT AUT BEL LTU PHL TLS AGO COD COG RWA BDI MOZ GNQ GAB', protestante:'NLD CHE EST LVA',
  islamico:'ALB BIH KOS AZE IDN MYS BRN SOM DJI SDN SDS TCD NER SEN GIN MRT GMB', judaico:'ISR', hindu:'IND NPL', budista:'LKA BTN THA MMR KHM LAO MNG', ateu:'CHN VNM PRK CUB'};
const CULT_A3 = {anglo:'GBR IRL USA CAN AUS NZL JAM BHS', luso:'BRA PRT AGO MOZ GNB TLS CPV', fr:'FRA BEL CHE HTI MDG SEN CIV GIN MLI BFA NER TCD CMR GAB COG CAF BEN TGO', de:'DEU AUT NLD',
  it:'ITA', nord:'SWE NOR DNK FIN ISL', slav:'RUS UKR BLR POL CZE SVK SVN HRV SRB MNE MKD BIH BGR', turk:'TUR AZE TKM UZB KAZ KGZ', pers:'IRN AFG TJK', jpn:'JPN', kor:'KOR PRK', chn:'CHN TWN', mong:'MNG'};
const lookupA3 = (tbl, a3) => { for (const k in tbl) if (tbl[k].split(' ').includes(a3)) return k; return null; };
const SUB_REL = {'South America':'catolico', 'Central America':'catolico', 'Caribbean':'catolico', 'Northern Europe':'protestante', 'Western Europe':'catolico', 'Southern Europe':'catolico', 'Eastern Europe':'ortodoxo',
  'Northern Africa':'islamico', 'Western Asia':'islamico', 'Central Asia':'islamico', 'Southern Asia':'islamico', 'South-Eastern Asia':'budista', 'Eastern Asia':'budista', 'Western Africa':'islamico',
  'Middle Africa':'catolico', 'Eastern Africa':'protestante', 'Southern Africa':'protestante', 'Melanesia':'protestante', 'Polynesia':'protestante', 'Australia and New Zealand':'protestante', 'Northern America':'protestante'};
const SUB_CULT = {'South America':'hisp', 'Central America':'hisp', 'Caribbean':'hisp', 'Northern Europe':'nord', 'Western Europe':'fr', 'Southern Europe':'it', 'Eastern Europe':'slav', 'Northern Africa':'arab',
  'Western Asia':'arab', 'Central Asia':'turk', 'Southern Asia':'ind', 'South-Eastern Asia':'sea', 'Eastern Asia':'chn', 'Western Africa':'afr', 'Middle Africa':'afr', 'Eastern Africa':'afr', 'Southern Africa':'afr',
  'Melanesia':'sea', 'Polynesia':'sea', 'Australia and New Zealand':'anglo', 'Northern America':'anglo'};

// ---------------- Cidades: nomes em português e nomes de época ----------------
const PT_CITY = {'Moscow':'Moscou', 'Beijing':'Pequim', 'Tokyo':'Tóquio', 'London':'Londres', 'Washington, D.C.':'Washington', 'Mexico City':'Cidade do México', 'Rome':'Roma', 'Vienna':'Viena', 'Warsaw':'Varsóvia',
  'Brussels':'Bruxelas', 'Lisbon':'Lisboa', 'Athens':'Atenas', 'Cairo':'Cairo', 'Tehran':'Teerã', 'Baghdad':'Bagdá', 'Kabul':'Cabul', 'New Delhi':'Nova Délhi', 'Delhi':'Délhi', 'Bangkok':'Bangcoc', 'Hanoi':'Hanói',
  'Seoul':'Seul', 'Taipei':'Taipé', 'Jakarta':'Jacarta', 'Bogota':'Bogotá', 'Bogotá':'Bogotá', 'Brasilia':'Brasília', 'Asuncion':'Assunção', 'Asunción':'Assunção', 'Algiers':'Argel', 'Tunis':'Túnis', 'Tripoli':'Trípoli',
  'Addis Ababa':'Adis Abeba', 'Nairobi':'Nairóbi', 'Pretoria':'Pretória', 'Cape Town':'Cidade do Cabo', 'Riyadh':'Riad', 'Ankara':'Ancara', 'Istanbul':'Istambul', 'Berlin':'Berlim', 'Madrid':'Madri',
  'Stockholm':'Estocolmo', 'Copenhagen':'Copenhague', 'Kiev':'Kiev', 'Kyiv':'Kiev', 'Bucharest':'Bucareste', 'Belgrade':'Belgrado', 'Budapest':'Budapeste', 'Prague':'Praga', 'Bern':'Berna', 'Amsterdam':'Amsterdã',
  'Dublin':'Dublin', 'Edinburgh':'Edimburgo', 'New York':'Nova York', 'Los Angeles':'Los Angeles', 'Philadelphia':'Filadélfia', 'New Orleans':'Nova Orleans', 'Sao Paulo':'São Paulo', 'São Paulo':'São Paulo',
  'Rio de Janeiro':'Rio de Janeiro', 'Havana':'Havana', 'Panama City':'Cidade do Panamá', 'Guatemala City':'Cidade da Guatemala', 'Kuwait City':'Kuwait', 'Singapore':'Singapura', 'Kuala Lumpur':'Kuala Lumpur',
  'Manila':'Manila', 'Saint Petersburg':'São Petersburgo', 'St. Petersburg':'São Petersburgo', 'Munich':'Munique', 'Cologne':'Colônia', 'Hamburg':'Hamburgo', 'Milan':'Milão', 'Naples':'Nápoles', 'Turin':'Turim',
  'Florence':'Florença', 'Venice':'Veneza', 'Genoa':'Gênova', 'Seville':'Sevilha', 'Barcelona':'Barcelona', 'Marseille':'Marselha', 'Lyon':'Lyon', 'Geneva':'Genebra', 'Zurich':'Zurique', 'The Hague':'Haia',
  'Antwerp':'Antuérpia', 'Mumbai':'Mumbai', 'Kolkata':'Calcutá', 'Calcutta':'Calcutá', 'Chennai':'Chennai', 'Shanghai':'Xangai', 'Guangzhou':'Cantão', 'Nanjing':'Nanquim', 'Hong Kong':'Hong Kong', 'Mecca':'Meca',
  'Jerusalem':'Jerusalém', 'Damascus':'Damasco', 'Beirut':'Beirute', 'Amman':'Amã', 'Baku':'Baku', 'Tbilisi':'Tbilisi', 'Yerevan':'Erevan', 'Tashkent':'Tashkent', 'Bishkek':'Bishkek', 'Dushanbe':'Duchambé',
  'Ashgabat':'Asgabate', 'Ulaanbaatar':'Ulan Bator', 'Pyongyang':'Pyongyang', 'Kathmandu':'Katmandu', 'Dhaka':'Daca', 'Colombo':'Colombo', 'Yangon':'Rangum', 'Rangoon':'Rangum', 'Phnom Penh':'Phnom Penh',
  'Vientiane':'Vientiane', 'Ho Chi Minh City':'Cidade de Ho Chi Minh', 'Canberra':'Camberra', 'Wellington':'Wellington', 'Ottawa':'Ottawa', 'Montreal':'Montreal', 'Quebec':'Quebec', 'Lima':'Lima', 'Santiago':'Santiago',
  'Buenos Aires':'Buenos Aires', 'Montevideo':'Montevidéu', 'La Paz':'La Paz', 'Quito':'Quito', 'Caracas':'Caracas', 'Rabat':'Rabat', 'Dakar':'Dacar', 'Abuja':'Abuja', 'Accra':'Acra', 'Kinshasa':'Kinshasa',
  'Luanda':'Luanda', 'Maputo':'Maputo', 'Khartoum':'Cartum', 'Mogadishu':'Mogadíscio', 'Dar es Salaam':'Dar es Salaam', 'Kampala':'Kampala', 'Harare':'Harare', 'Lusaka':'Lusaka', 'Antananarivo':'Antananarivo',
  'Helsinki':'Helsinque', 'Oslo':'Oslo', 'Reykjavik':'Reykjavík', 'Minsk':'Minsk', 'Vilnius':'Vilnius', 'Riga':'Riga', 'Tallinn':'Tallinn', 'Sofia':'Sófia', 'Skopje':'Escópia', 'Tirana':'Tirana', 'Zagreb':'Zagreb',
  'Ljubljana':'Liubliana', 'Bratislava':'Bratislava', 'Chisinau':'Chisinau', 'Nicosia':'Nicósia', 'Valletta':'Valeta', 'Warszawa':'Varsóvia', 'Krakow':'Cracóvia', 'Kraków':'Cracóvia', 'Astana':'Astana', 'Nur-Sultan':'Astana', 'Washington, D.C.':'Washington', 'København':'Copenhague', 'Sanaa':'Saná', 'Port-au-Prince':'Porto Príncipe', 'Yaoundé':'Iaundê', 'Conakry':'Conacri',
  "N'Djamena":'Jamena', 'Djibouti':'Djibuti', 'Niamey':'Niamei', 'Muscat':'Mascate', 'Chișinău':'Chisinau', 'Abu Dhabi':'Abu Dabi', 'Port-of-Spain':'Porto de Espanha', 'Dili':'Díli', 'Luxembourg':'Luxemburgo',
  'Thimphu':'Timbu', 'Monaco':'Mônaco', 'Vatican City':'Vaticano', 'Bandar Seri Begawan':'Bandar Seri Begawan', 'Ouagadougou':'Uagadugu', 'Hargeisa':'Hargeisa', 'Pristina':'Pristina', 'Sucre':'Sucre'};
// [nome atual, até o ano, nome antigo] — nomes da época
const CITY_OLD = [['Cidade do México',1521,'Tenochtitlán'],['Nova York',1664,'Nova Amsterdã'],['Jacarta',1619,'Jayakarta'],['Istambul',1930,'Constantinopla'],['São Petersburgo',1915,'São Petersburgo'],['São Petersburgo',1924,'Petrogrado'],['São Petersburgo',1991,'Leningrado'],['Volgograd',1925,'Tsaritsyn'],['Volgograd',1961,'Stalingrado'],
  ['Cidade de Ho Chi Minh',1976,'Saigon'],['Mumbai',1995,'Bombaim'],['Chennai',1996,'Madras'],['Kinshasa',1966,'Léopoldville'],['Harare',1982,'Salisbury'],['Jacarta',1942,'Batávia'],['Oslo',1877,'Christiania'],['Oslo',1925,'Kristiania'],
  ['Ulan Bator',1924,'Urga'],['Almaty',1921,'Verny'],['Gdańsk',1945,'Danzig'],['Wrocław',1945,'Breslau'],['Kaliningrad',1946,'Königsberg'],['Lviv',1918,'Lemberg'],['Bratislava',1919,'Pressburg'],['Liubliana',1918,'Laibach'],
  ['Tóquio',1868,'Edo'],['Maputo',1976,'Lourenço Marques'],['Lubumbashi',1966,'Elisabethville'],['Nizhny Novgorod',1932,'Nizhny Novgorod'],['Nizhny Novgorod',1990,'Gorki'],['Yekaterinburg',1924,'Ekaterimburgo'],['Yekaterinburg',1991,'Sverdlovsk'],
  ['Samara',1935,'Samara'],['Samara',1991,'Kuibyshev'],['Donetsk',1924,'Yuzovka'],['Donetsk',1961,'Stalino'],['Tbilisi',1936,'Tíflis'],['Duchambé',1929,'Duchambé'],['Duchambé',1961,'Stalinabad'],['Bishkek',1926,'Pishpek'],['Bishkek',1991,'Frunze'],
  ['Astana',1961,'Akmolinsk'],['Astana',1992,'Tselinogrado'],['Astana',1998,'Akmola'],['Kisangani',1966,'Stanleyville'],['Chongqing',1900,'Chungking'],['Daca',1982,'Dacca'],['Kolkata',2001,'Calcutá']];
// cidades fundadas (ou criadas como cidade) depois de certo ano
const CITY_FOUNDED = {'Brasília':1960.3, 'Belo Horizonte':1897, 'Goiânia':1933, 'Palmas':1989, 'Islamabad':1961, 'Abuja':1976, 'Camberra':1913, 'Tel Aviv-Yafo':1909, 'Tel Aviv':1909, 'Johannesburg':1886, 'Nairóbi':1899,
  'Kinshasa':1881, 'Harare':1890, 'Lusaka':1905, 'Windhoek':1890, 'Gaborone':1964, 'Lilongwe':1947, 'Las Vegas':1905, 'Miami':1896, 'Seattle':1851, 'Vancouver':1886, 'Calgary':1875, 'Winnipeg':1873, 'Denver':1858,
  'Phoenix':1868, 'Shenzhen':1979, 'Chandigarh':1952, 'Naypyidaw':2005, 'Putrajaya':1995, 'Novosibirsk':1893, 'Dodoma':1907, 'Yamoussoukro':1983, 'Campo Grande':1899, 'Boa Vista':1890, 'Londrina':1934, 'Maringá':1947,
  'Anchorage':1914, 'Oklahoma City':1889, 'Tulsa':1898, 'Dubai':1900, 'Abu Dhabi':1900, 'Doha':1900, 'Haifa':1900, 'Port Harcourt':1912, 'Kaduna':1913, 'Lubumbashi':1910, 'Kisangani':1883, 'Bulawayo':1894,
  'São Petersburgo':1703, 'Rio de Janeiro':1565, 'São Paulo':1554, 'Salvador':1549, 'Recife':1537, 'Olinda':1535, 'Belém':1616, 'São Luís':1612, 'Fortaleza':1726, 'Natal':1599, 'João Pessoa':1585, 'Vitória':1551, 'Porto Alegre':1772, 'Curitiba':1693, 'Florianópolis':1673,
  'Manaus':1669, 'Cuiabá':1719, 'Goiás':1727, 'Ouro Preto':1711, 'Campinas':1774, 'Santos':1546, 'Buenos Aires':1580, 'Lima':1535, 'Bogotá':1538, 'Santiago':1541, 'Caracas':1567, 'Quito':1534, 'Montevidéu':1724, 'Assunção':1537, 'La Paz':1548,
  'Havana':1519, 'Cidade do Panamá':1519, 'Cartagena':1533, 'Córdoba':1573, 'Rosario':1793, 'Valparaíso':1544, 'Guayaquil':1538, 'Medellín':1616, 'Cali':1536, 'Santo Domingo':1496, 'San Juan':1521, 'Cidade da Guatemala':1776,
  'Nova York':1625, 'Boston':1630, 'Filadélfia':1682, 'Charleston':1670, 'Baltimore':1729, 'Nova Orleans':1718, 'Washington':1790, 'Los Angeles':1781, 'San Francisco':1776, 'San Diego':1769, 'Chicago':1833, 'Detroit':1701, 'Pittsburgh':1758,
  'Houston':1836, 'Dallas':1841, 'Atlanta':1837, 'Toronto':1793, 'Montreal':1642, 'Quebec':1608, 'Halifax':1749, 'Ottawa':1826, 'Sydney':1788, 'Melbourne':1835, 'Brisbane':1825, 'Perth':1829, 'Adelaide':1836, 'Auckland':1840, 'Wellington':1840,
  'Cidade do Cabo':1652, 'Luanda':1576, 'Maputo':1781, 'Durban':1835, 'Pretória':1855, 'Singapura':1819, 'Hong Kong':1841, 'Calcutá':1690, 'Kolkata':1690, 'Chennai':1639, 'Mumbai':1507, 'Jacarta':1527, 'Manila':1571, 'Macau':1557, 'Yokohama':1859};
// regiões colonizadas mais tarde (as cidades surgem aos poucos)
const NEW_WORLD = new Set(['North America','South America','Oceania']);
function cityNameAt(name, year){
  name = String(name).replace(/\s+/g, ' ');
  let n = PT_CITY[name] || name;
  for (const [cur, until, old] of CITY_OLD) if (cur === n && year < until){ n = old; break; }
  return n;
}
// a cidade existia neste ano? (data de fundação conhecida, senão regra por região e tamanho atual)
const CITY_NATIVE = new Set(['Cidade do México', 'Cusco', 'Quito', 'Cajamarca', 'Tenochtitlán']);
function cityExists(name, year, a3, popK, lon, loose){
  const nm = PT_CITY[String(name).replace(/\s+/g, ' ')] || name, f = CITY_FOUNDED[nm];
  if (f) return year >= f;
  if (year >= 1960 || a3 === undefined) return true;
  const c = GEO.countries[GEO_IDX[a3]] || {}, isNew = NEW_WORLD.has(c.cont) || (a3 === 'RUS' && lon > 60) || (c.cont === 'Africa' && !/Northern Africa/.test(c.sub||''));
  if (year < 1600 && isNew) return CITY_NATIVE.has(nm) || (c.cont === 'Africa' && popK >= 1500);
  if (loose) return !isNew || year >= 1800 || popK >= 300;
  const min = isNew ? (year < 1800 ? 2500 : year < 1900 ? 300 : 60) : (year < 1600 ? 300 : year < 1800 ? 150 : year < 1900 ? 40 : 0);
  return popK >= min;
}

// ---------------- Nações-base (todos os países reais) ----------------
function geoBaseNations(){
  const out = [], byA3 = {};
  for (const c of GEO.countries){
    if (!c.cells || c.a3 === 'ATA' || (c.sov !== c.a3 && GEO_IDX[c.sov] !== undefined)) continue;   // dependências vão para o país dono
    const key = LEGACY_A3[c.a3] || GEO_NAME[c.a3] || c.pt;
    const L = LEGACY_BY_KEY[key];
    const pop = Math.max(0.05, c.pop / 1e6), pc = c.pop ? Math.max(0.3, c.gdp / c.pop * 1000) : 1;
    const d = L ? Object.assign({}, L) : {pop:+pop.toFixed(2), pc:+pc.toFixed(1), gov: lookupA3(GOV_A3, c.a3) || 'republica', rel: lookupA3(REL_A3, c.a3) || SUB_REL[c.sub] || 'catolico', ag:0.3};
    d.key = key; d.a3 = c.a3; d.isos = [c.a3]; d.sub = c.sub;
    d.name = {Escandinávia:'Suécia', Coreia:'Coreia do Sul', 'África Oriental':'Quênia', Congo:'RD Congo'}[key] || (L ? L.name : (GEO_NAME[c.a3] || c.pt));
    d.label = [c.lx, c.ly];
    if (!PROFILES[key]) PROFILES[key] = {cult: lookupA3(CULT_A3, c.a3) || SUB_CULT[c.sub] || 'luso', res:[], exp:[], likes:['comercio'], dislikes:['expansao']};
    byA3[c.a3] = d; out.push(d);
  }
  // dependências entram no país dono (Groenlândia → Dinamarca, Porto Rico → EUA...)
  for (const c of GEO.countries){
    if (!c.cells || c.a3 === 'ATA' || c.sov === c.a3) continue;
    const owner = byA3[c.sov]; if (owner) owner.isos.push(c.a3);
  }
  return {list:out, byA3};
}

// ---------------- As épocas ----------------
// into: país atual → país (ou grupo) que o controlava; absent: terras sem Estado (colonizáveis)
// groups: nações que não existem mais; boxes: parte de um país que pertencia a outro
const ERA_GEO = {
  1850:{
    into:{TTO:'GBR', MUS:'GBR', UKR:'RUS', BLR:'RUS', EST:'RUS', LVA:'RUS', LTU:'RUS', FIN:'RUS', MDA:'RUS', GEO:'RUS', ARM:'RUS', AZE:'RUS', KAZ:'RUS', POL:'RUS',
      UZB:'G:asia_central', TJK:'G:asia_central', TKM:'G:asia_central', KGZ:'G:asia_central',
      HUN:'AUT', CZE:'AUT', SVK:'AUT', SVN:'AUT', HRV:'AUT',
      SYR:'TUR', IRQ:'TUR', LBN:'TUR', ISR:'TUR', JOR:'TUR', CYP:'TUR', CYN:'TUR', BGR:'TUR', MKD:'TUR', ALB:'TUR', BIH:'TUR', SRB:'TUR', MNE:'TUR', KOS:'TUR', ROU:'TUR', LBY:'TUR', TUN:'TUR', SAU:'TUR', YEM:'TUR', KWT:'TUR',
      ARE:'OMN', QAT:'OMN', IRL:'GBR', GUY:'GBR', PAK:'IND', BGD:'IND', LKA:'IND', SUR:'NLD', NOR:'SWE', ISL:'DNK', MNG:'CHN', TWN:'CHN', PRK:'KOR', LAO:'THA', KHM:'THA', PAN:'COL',
      ERI:'ETH', MOZ:'PRT', GNB:'PRT', TLS:'PRT', GNQ:'ESP', TZA:'KEN', SDS:'SDN', GHA:'G:ashanti'},
    absent:'MRT SEN GIN GMB SLE CIV BFA NER TCD CMR CAF GAB COG BEN TGO NAM BWA ZMB ZWE MWI LSO SWZ RWA BDI UGA SOM SOL DJI SAH PNG NCL FJI SLB VUT MYS LBR',
    groups:{asia_central:{name:'Canatos da Ásia Central', gov:'monarquia_abs', rel:'islamico', cap:['Bucara',64.42,39.77], ag:0.45, cult:'turk'},
      ashanti:{name:'Império Axânti', gov:'monarquia_abs', rel:'protestante', cap:['Kumasi',-1.62,6.69], ag:0.5, cult:'afr'}},
    boxes:[{from:'USA', to:'RUS', box:[-180,51,-140,72]}],                       // Alasca russo
    rename:{'Áustria':{name:'Império Austríaco', gov:'monarquia_abs', flag:AUSTRIA_FLAG}, 'Vietnã':{name:'Império Đại Nam', gov:'monarquia_abs'}, 'Myanmar':{name:'Reino da Birmânia', gov:'monarquia_abs'},
      'Madagascar':{name:'Reino de Madagascar', gov:'monarquia_abs'}, 'Afeganistão':{name:'Emirado do Afeganistão', gov:'monarquia_abs'}, 'Marrocos':{name:'Sultanato de Marrocos', gov:'monarquia_abs'},
      'Omã':{name:'Sultanato de Omã', gov:'monarquia_abs'}, 'África Oriental':{name:'Sultanato de Zanzibar', gov:'monarquia_abs', rel:'islamico'}, 'Congo':{name:'Reino do Congo', gov:'monarquia_abs'},
      'Holanda':{name:'Reino dos Países Baixos'}, 'Grécia':{name:'Reino da Grécia', gov:'monarquia_const'}, 'Portugal':{name:'Reino de Portugal', gov:'monarquia_const'}, 'Dinamarca':{gov:'monarquia_const'},
      'Nepal':{gov:'monarquia_abs'}, 'Haiti':{name:'Império do Haiti', gov:'imperio'}, 'Colômbia':{name:'República de Nova Granada'}, 'Argentina':{name:'Confederação Argentina'}, 'Bélgica':{name:'Reino da Bélgica'},
      'Espanha':{name:'Reino da Espanha', gov:'monarquia_const'}, 'França':{name:'Segunda República Francesa'}, 'Butão':{gov:'monarquia_abs'}, 'Nova Zelândia':{name:'Colônia da Nova Zelândia'},
      'Etiópia':{name:'Império Etíope', gov:'monarquia_abs'}, 'Sudão':{name:'Sudão Egípcio'}, 'Angola':{name:'Angola Portuguesa', flag:presetFlagSafe('Portugal')}, 'Argélia':{name:'Argélia Francesa', flag:F_('tricolor_v','#0055a4','#ffffff','#ef4135')}}
  },
  1914:{
    into:{TTO:'GBR', MUS:'GBR', UKR:'RUS', BLR:'RUS', EST:'RUS', LVA:'RUS', LTU:'RUS', FIN:'RUS', MDA:'RUS', GEO:'RUS', ARM:'RUS', AZE:'RUS', KAZ:'RUS', UZB:'RUS', TKM:'RUS', KGZ:'RUS', TJK:'RUS', POL:'RUS',
      HUN:'AUT', CZE:'AUT', SVK:'AUT', SVN:'AUT', HRV:'AUT', BIH:'AUT',
      SYR:'TUR', IRQ:'TUR', LBN:'TUR', ISR:'TUR', JOR:'TUR', SAU:'TUR', YEM:'TUR',
      KWT:'OMN', QAT:'OMN', ARE:'OMN', CYP:'GBR', CYN:'GBR', IRL:'GBR', GUY:'GBR', FJI:'GBR', SLB:'GBR', VUT:'GBR',
      PAK:'IND', BGD:'IND', MMR:'IND', LKA:'IND', ISL:'DNK', TWN:'JPN', KOR:'JPN', PRK:'JPN',
      LAO:'G:indochina', KHM:'G:indochina', VNM:'G:indochina', MYS:'G:malasia',
      MAR:'DZA', TUN:'DZA', SEN:'MLI', MRT:'MLI', GIN:'MLI', CIV:'MLI', BFA:'MLI', NER:'MLI', BEN:'MLI',
      GAB:'G:aef', COG:'G:aef', CAF:'G:aef', TCD:'G:aef', MDG:'FRA', DJI:'FRA', NCL:'FRA',
      GHA:'NGA', SLE:'NGA', GMB:'NGA', UGA:'KEN', ZMB:'G:rodesia', ZWE:'G:rodesia', MWI:'G:rodesia', BWA:'ZAF', LSO:'ZAF', SWZ:'ZAF',
      NAM:'DEU', TZA:'DEU', RWA:'DEU', BDI:'DEU', CMR:'DEU', TGO:'DEU', SDS:'SDN',
      LBY:'ITA', ERI:'ITA', SOM:'ITA', SOL:'ITA', SAH:'ESP', GNQ:'ESP', MOZ:'PRT', GNB:'PRT', TLS:'PRT', SUR:'NLD', PNG:'AUS', MKD:'SRB', KOS:'SRB'},
    absent:'',
    groups:{indochina:{name:'Indochina Francesa', gov:'monarquia_abs', rel:'budista', cap:['Hanói',105.85,21.03], ag:0.2, cult:'sea', flag:F_('tricolor_v','#0055a4','#ffffff','#ef4135')},
      malasia:{name:'Malásia Britânica', gov:'monarquia_abs', rel:'islamico', cap:['Kuala Lumpur',101.69,3.14], ag:0.15, cult:'sea'},
      aef:{name:'África Equatorial Francesa', gov:'monarquia_abs', rel:'catolico', cap:['Brazzaville',15.28,-4.27], ag:0.2, cult:'fr', flag:F_('tricolor_v','#0055a4','#ffffff','#ef4135')},
      rodesia:{name:'Rodésia e Niassalândia', gov:'monarquia_abs', rel:'protestante', cap:['Salisbury',31.05,-17.83], ag:0.2, cult:'anglo'}},
    rename:{'Áustria':{name:'Áustria-Hungria', gov:'imperio', flag:AUSTRIA_FLAG}, 'Argélia':{name:'África do Norte Francesa', flag:F_('tricolor_v','#0055a4','#ffffff','#ef4135')},
      'Mali':{name:'África Ocidental Francesa', flag:F_('tricolor_v','#0055a4','#ffffff','#ef4135')}, 'Nigéria':{name:'África Ocidental Britânica', gov:'monarquia_abs'}, 'África Oriental':{name:'África Oriental Britânica', gov:'monarquia_abs'},
      'Sérvia':{name:'Reino da Sérvia', gov:'monarquia_const'}, 'Bulgária':{name:'Reino da Bulgária', gov:'monarquia_const'}, 'Romênia':{name:'Reino da Romênia', gov:'monarquia_const'}, 'Grécia':{name:'Reino da Grécia', gov:'monarquia_const'},
      'Montenegro':{name:'Reino de Montenegro', gov:'monarquia_const'}, 'Noruega':{name:'Reino da Noruega', gov:'monarquia_const'}, 'Holanda':{gov:'monarquia_const'}, 'Mongólia':{name:'Canato da Mongólia', gov:'teocracia'},
      'Afeganistão':{name:'Emirado do Afeganistão', gov:'monarquia_abs'}, 'Omã':{name:'Sultanato de Omã', gov:'monarquia_abs'}, 'Nepal':{gov:'monarquia_abs'}, 'Sudão':{name:'Sudão Anglo-Egípcio'},
      'Congo':{name:'Congo Belga', flag:F_('tricolor_v','#111111','#fdda24','#ef3340')}, 'Angola':{name:'Angola Portuguesa', flag:presetFlagSafe('Portugal')}}
  },
  1960:{
    into:{UKR:'RUS', BLR:'RUS', EST:'RUS', LVA:'RUS', LTU:'RUS', MDA:'RUS', GEO:'RUS', ARM:'RUS', AZE:'RUS', KAZ:'RUS', UZB:'RUS', TKM:'RUS', KGZ:'RUS', TJK:'RUS',
      CZE:'G:tchecoslovaquia', SVK:'G:tchecoslovaquia', SRB:'G:iugoslavia', HRV:'G:iugoslavia', SVN:'G:iugoslavia', BIH:'G:iugoslavia', MNE:'G:iugoslavia', MKD:'G:iugoslavia', KOS:'G:iugoslavia',
      BGD:'PAK', ERI:'ETH', SOL:'SOM', SAH:'ESP', GNQ:'ESP', NAM:'ZAF', LSO:'ZAF', BWA:'ZAF', SWZ:'ZAF', PNG:'AUS', CYN:'CYP', SDS:'SDN', MOZ:'PRT', GNB:'PRT', TLS:'PRT', SUR:'NLD', GUY:'GBR'},
    absent:'',
    groups:{tchecoslovaquia:{name:'Tchecoslováquia', gov:'comunismo', rel:'ateu', cap:['Praga',14.42,50.08], ag:0.3, cult:'slav', bloc:'ori', flag:F_('triangulo','#ffffff','#11457e','#d7141a')},
      iugoslavia:{name:'Iugoslávia', gov:'comunismo', rel:'ateu', cap:['Belgrado',20.46,44.82], ag:0.35, cult:'slav', flag:F_('tricolor_h','#0c4076','#ffffff','#c6363c','estrela','#c6363c','centro',0.5)},
      vietnorte:{name:'Vietnã do Norte', gov:'comunismo', rel:'ateu', cap:['Hanói',105.85,21.03], ag:0.6, cult:'sea', bloc:'ori', hist:[16,600,0.9], flag:F_('solido','#da251d',null,null,'estrela','#ffcd00','centro',0.6)},
      alemanha_or:{name:'Alemanha Oriental', key:'Alemanha Oriental', gov:'comunismo', rel:'ateu', cap:['Berlim Oriental',13.4,52.52], ag:0.4, cult:'de', bloc:'ori', hist:[17,4500,0.6], flag:F_('tricolor_h','#111111','#dd0000','#ffce00','engrenagem','#ffce00','centro',0.45)}},
    boxes:[{from:'VNM', to:'G:vietnorte', box:[100,17.1,110,24]}, {from:'DEU', to:'G:alemanha_or', box:[10.6,50.2,15.2,54.8]}],
    rename:{'Alemanha':{name:'Alemanha Ocidental', gov:'democracia', bloc:'atl'}, 'Vietnã':{name:'Vietnã do Sul', gov:'ditadura', bloc:'atl'}, 'Taiwan':{name:'República da China', gov:'ditadura'},
      'Paquistão':{gov:'ditadura'}, 'Polônia':{gov:'comunismo', bloc:'ori'}, 'Hungria':{gov:'comunismo', bloc:'ori'}, 'Romênia':{gov:'comunismo', bloc:'ori'}, 'Bulgária':{gov:'comunismo', bloc:'ori'},
      'Albânia':{gov:'comunismo'}, 'Coreia do Norte':{gov:'comunismo', bloc:'ori'}, 'Angola':{name:'Angola Portuguesa', flag:presetFlagSafe('Portugal')}, 'Argélia':{name:'Argélia Francesa', flag:F_('tricolor_v','#0055a4','#ffffff','#ef4135')},
      'Congo':{name:'Congo Belga', flag:F_('tricolor_v','#111111','#fdda24','#ef3340')}}
  },
  2000:{into:{SDS:'SDN', KOS:'SRB', MNE:'SRB', SAH:'MAR', TLS:'IDN', SOL:'SOM', CYN:'CYP'}, absent:'', groups:{}, rename:{'Sérvia':{name:'Sérvia e Montenegro'}}},
  2050:{into:{SAH:'MAR', SOL:'SOM', CYN:'CYP'}, absent:'', groups:{}, rename:{}}
};
// capitais de cada época [nome, lon, lat]
const ERA_CAPS = {
  1850:{RUS:['São Petersburgo',30.32,59.94], TUR:['Constantinopla',28.98,41.01], JPN:['Edo',139.69,35.69], IND:['Calcutá',88.36,22.57], IDN:['Batávia',106.85,-6.21], ITA:['Turim',7.68,45.07], CAN:['Montreal',-73.57,45.5],
    AUS:['Sydney',151.21,-33.87], ZAF:['Cidade do Cabo',18.42,-33.92], NGA:['Sokoto',5.24,13.06], MLI:['Ségou',-6.26,13.44], BRA:['Rio de Janeiro',-43.2,-22.91], KOR:['Hanseong',126.98,37.57], VNM:['Huế',107.58,16.46],
    MMR:['Amarapura',96.05,21.9], MAR:['Fez',-5.0,34.03], KEN:['Zanzibar',39.19,-6.16], COD:['Boma',13.05,-5.85], ETH:['Gondar',37.47,12.6], NZL:['Auckland',174.76,-36.85], DEU:['Berlim',13.4,52.52], CHN:['Pequim',116.39,39.91],
    PAK:null, USA:['Washington',-77.04,38.9], SWE:['Estocolmo',18.07,59.33], AUT:['Viena',16.37,48.21], PHL:['Manila',120.98,14.6], CUB:['Havana',-82.37,23.13], SDN:['Cartum',32.53,15.59], AGO:['Luanda',13.23,-8.84]},
  1914:{RUS:['São Petersburgo',30.32,59.94], TUR:['Constantinopla',28.98,41.01], IND:['Délhi',77.21,28.61], AUS:['Melbourne',144.96,-37.81], CAN:['Ottawa',-75.7,45.42], ZAF:['Pretória',28.19,-25.75], NGA:['Lagos',3.39,6.45],
    MLI:['Dacar',-17.45,14.69], DZA:['Argel',3.06,36.75], COD:['Boma',13.05,-5.85], IDN:['Batávia',106.85,-6.21], MNG:['Urga',106.92,47.92], KEN:['Nairóbi',36.82,-1.29], NOR:['Kristiania',10.75,59.91],
    BRA:['Rio de Janeiro',-43.2,-22.91], NZL:['Wellington',174.78,-41.29], ETH:['Adis Abeba',38.75,9.03], JPN:['Tóquio',139.69,35.69], CHN:['Pequim',116.39,39.91], DEU:['Berlim',13.4,52.52], AUT:['Viena',16.37,48.21], ITA:['Roma',12.5,41.9]},
  1960:{RUS:['Moscou',37.62,55.75], DEU:['Bonn',7.1,50.73], BRA:['Rio de Janeiro',-43.2,-22.91], PAK:['Karachi',67.01,24.86], NGA:['Lagos',3.39,6.45], AUS:['Camberra',149.13,-35.28], COD:['Léopoldville',15.31,-4.32],
    VNM:['Saigon',106.66,10.76], TWN:['Taipé',121.56,25.04], TUR:['Ancara',32.85,39.93], IND:['Nova Délhi',77.21,28.61], MMR:['Rangum',96.16,16.87], IDN:['Jacarta',106.85,-6.21], ZAF:['Pretória',28.19,-25.75], NOR:['Oslo',10.75,59.91]},
  2000:{PAK:['Islamabad',73.05,33.68], NGA:['Abuja',7.49,9.06], KAZ:['Astana',71.43,51.13], MMR:['Rangum',96.16,16.87], TZA:['Dodoma',35.74,-6.17], CIV:['Yamoussoukro',-5.28,6.82], BRA:['Brasília',-47.88,-15.79], DEU:['Berlim',13.4,52.52],
    RUS:['Moscou',37.62,55.75], AUS:['Camberra',149.13,-35.28], BOL:['La Paz',-68.15,-16.5], LKA:['Colombo',79.86,6.93], ZAF:['Pretória',28.19,-25.75], NLD:['Amsterdã',4.9,52.37]},
  2050:{MMR:['Naypyidaw',96.13,19.76], IDN:['Nusantara',116.7,-0.98], KAZ:['Astana',71.43,51.13], PAK:['Islamabad',73.05,33.68], NGA:['Abuja',7.49,9.06], BRA:['Brasília',-47.88,-15.79], TZA:['Dodoma',35.74,-6.17], AUS:['Camberra',149.13,-35.28]}
};
function modernCapital(a3){
  const c = GEO.cities.find(x => x[4] === a3 && (x[5] & 1));
  return c ? [cityNameAt(c[0], 2100), c[1], c[2]] : null;
}
function eraCapital(a3, era){ const e = ERA_CAPS[era] || {}; if (e[a3]) return e[a3]; const ord = [2050, 2000, 1960, 1914, 1850]; if (+era >= 1960 && ERA_CAPS[2000][a3]) return +era >= 2000 ? ERA_CAPS[2000][a3] : modernCapital(a3); return modernCapital(a3); }

// ---------------- Bandeiras dos países que não tinham ----------------
const FP_ = (layout, c1, c2, c3, emblem, ec, epos, esize, stars) => ({layout, c1, c2, c3:c3||'#000000', emblem:emblem||'nenhum', ec:ec||'#ffffff', epos:epos||'centro', esize:esize||0.5, stars:stars||8});
Object.assign(FLAG_PRESETS, {
  'Chile':FP_('bicolor_h','#ffffff','#d52b1e',null,'estrela','#0039a6','cantao',0.45), 'Uruguai':FP_('listras','#ffffff','#0038a8',null,'sol','#fcd116','cantao',0.5), 'Grécia':FP_('listras','#0d5eaf','#ffffff',null,'cruz','#ffffff','cantao',0.5),
  'Suíça':FP_('solido','#d52b1e','#d52b1e',null,'cruz','#ffffff','centro',0.6), 'Islândia':FP_('cruz_nordica','#02529c','#ffffff','#dc1e35'), 'Suécia':FP_('cruz_nordica','#006aa7','#fecc00','#fecc00'),
  'Romênia':FP_('tricolor_v','#002b7f','#fcd116','#ce1126'), 'Bulgária':FP_('tricolor_h','#ffffff','#00966e','#d62612'), 'Sérvia':FP_('tricolor_h','#c6363c','#0c4076','#ffffff','escudo','#c6363c','mastro',0.4),
  'Croácia':FP_('tricolor_h','#ff0000','#ffffff','#171796','escudo','#ff0000','centro',0.4), 'Eslovênia':FP_('tricolor_h','#ffffff','#0000ff','#ff0000','escudo','#0000ff','mastro',0.35), 'Eslováquia':FP_('tricolor_h','#ffffff','#0b4ea2','#ee1c25','escudo','#ee1c25','mastro',0.45),
  'Tchéquia':FP_('triangulo','#ffffff','#11457e','#d7141a'), 'Bielorrússia':FP_('bicolor_h','#c8313e','#4aa657'), 'Lituânia':FP_('tricolor_h','#fdb913','#006a44','#c1272d'), 'Letônia':FP_('tricolor_h','#9e3039','#ffffff','#9e3039'),
  'Estônia':FP_('tricolor_h','#0072ce','#000000','#ffffff'), 'Moldávia':FP_('tricolor_v','#003da5','#ffd200','#cc092f','aguia','#8b5a2b','centro',0.4), 'Geórgia':FP_('cruz','#ffffff','#ff0000'), 'Armênia':FP_('tricolor_h','#d90012','#0033a0','#f2a800'),
  'Azerbaijão':FP_('tricolor_h','#0092bc','#e4002b','#00af66','lua','#ffffff','centro',0.4), 'Albânia':FP_('solido','#e41e20','#e41e20',null,'aguia','#000000','centro',0.6), 'Macedônia do Norte':FP_('solido','#d20000','#d20000',null,'sol','#ffe600','centro',0.6),
  'Montenegro':FP_('borda','#c40308','#d3ae3b',null,'aguia','#d3ae3b','centro',0.5), 'Bósnia':FP_('diagonal','#002395','#fecb00','#ffffff'), 'Kosovo':FP_('solido','#244aa5','#244aa5',null,'estrelas','#ffffff','centro',0.5),
  'Chipre':FP_('solido','#ffffff','#ffffff',null,'folha','#d57800','centro',0.5), 'Vietnã':FP_('solido','#da251d','#da251d',null,'estrela','#ffcd00','centro',0.6), 'Laos':FP_('tricolor_h','#ce1126','#002868','#ce1126','circulo','#ffffff','centro',0.4),
  'Camboja':FP_('tricolor_h','#032ea1','#e00025','#032ea1'), 'Myanmar':FP_('tricolor_h','#fecb00','#34b233','#ea2839','estrela','#ffffff','centro',0.6), 'Malásia':FP_('listras','#cc0001','#ffffff',null,'lua','#ffcc00','cantao',0.5),
  'Nepal':FP_('solido','#dc143c','#dc143c',null,'sol','#ffffff','centro',0.5), 'Sri Lanka':FP_('borda','#8d2029','#ffbe29',null,'roda','#ffbe29','centro',0.5), 'Afeganistão':FP_('tricolor_v','#000000','#d32011','#007a36','escudo','#ffffff','centro',0.4),
  'Iraque':FP_('tricolor_h','#ce1126','#ffffff','#000000','estrelas','#007a3d','centro',0.4), 'Síria':FP_('tricolor_h','#ce1126','#ffffff','#000000','estrelas','#007a3d','centro',0.4), 'Jordânia':FP_('tricolor_h','#000000','#ffffff','#007a3d','triangulo','#ce1126','mastro',0.5),
  'Israel':FP_('faixa_central','#ffffff','#ffffff',null,'estrela6','#0038b8','centro',0.5), 'Líbano':FP_('tricolor_h','#ed1c24','#ffffff','#ed1c24','arvore','#00a651','centro',0.5), 'Iêmen':FP_('tricolor_h','#ce1126','#ffffff','#000000'),
  'Omã':FP_('tricolor_h','#ffffff','#db161b','#008000','espadas','#db161b','mastro',0.4), 'Emirados Árabes':FP_('tricolor_h','#00732f','#ffffff','#000000'), 'Catar':FP_('bicolor_v','#ffffff','#8a1538'), 'Kuwait':FP_('tricolor_h','#007a3d','#ffffff','#ce1126'),
  'Uzbequistão':FP_('tricolor_h','#0099b5','#ffffff','#1eb53a','lua','#ffffff','cantao',0.4), 'Turcomenistão':FP_('solido','#00843d','#00843d',null,'lua','#ffffff','cantao',0.5), 'Quirguistão':FP_('solido','#e8112d','#e8112d',null,'sol','#ffef00','centro',0.6),
  'Tajiquistão':FP_('tricolor_h','#cc0000','#ffffff','#006600','coroa','#f8c300','centro',0.4), 'Coreia do Norte':FP_('faixa_central','#024fa2','#ed1c27',null,'estrela','#ed1c27','mastro',0.5), 'Taiwan':FP_('solido','#fe0000','#fe0000',null,'sol','#ffffff','cantao',0.5),
  'Butão':FP_('diagonal','#ffd520','#ff4e12','#ff4e12'), 'Timor-Leste':FP_('triangulo','#dc241f','#000000','#dc241f','estrela','#ffffff','mastro',0.3), 'Tanzânia':FP_('diagonal','#1eb53a','#00a3dd','#000000'),
  'Uganda':FP_('listras','#000000','#fcdc04',null,'circulo','#ffffff','centro',0.4), 'Somália':FP_('solido','#4189dd','#4189dd',null,'estrela','#ffffff','centro',0.6), 'Tunísia':FP_('solido','#e70013','#e70013',null,'lua','#ffffff','centro',0.6),
  'Líbia':FP_('tricolor_h','#e70013','#000000','#239e46','lua','#ffffff','centro',0.4), 'Chade':FP_('tricolor_v','#002664','#fecb00','#c60c30'), 'Níger':FP_('tricolor_h','#e05206','#ffffff','#0db02b','circulo','#e05206','centro',0.35),
  'Senegal':FP_('tricolor_v','#00853f','#fdef42','#e31b23','estrela','#00853f','centro',0.4), 'Costa do Marfim':FP_('tricolor_v','#f77f00','#ffffff','#009e60'), 'Guiné':FP_('tricolor_v','#ce1126','#fcd116','#009460'),
  'Burkina Faso':FP_('bicolor_h','#ef2b2d','#009e49',null,'estrela','#fcd116','centro',0.4), 'Camarões':FP_('tricolor_v','#007a5e','#ce1126','#fcd116','estrela','#fcd116','centro',0.35), 'Gabão':FP_('tricolor_h','#009e60','#fcd116','#3a75c4'),
  'Congo-Brazzaville':FP_('diagonal','#009543','#dc241f','#fbde4a'), 'Zâmbia':FP_('solido','#198a00','#198a00',null,'aguia','#ef7d00','cantao',0.4), 'Zimbábue':FP_('listras','#006400','#ffd200',null,'triangulo','#ffffff','mastro',0.4),
  'Moçambique':FP_('tricolor_h','#007168','#000000','#fce100','triangulo','#d21034','mastro',0.5), 'Namíbia':FP_('diagonal','#003580','#009543','#d21034'), 'Botsuana':FP_('faixa_central','#75aadb','#000000'),
  'Malawi':FP_('tricolor_h','#000000','#ce1126','#339e35','sol','#ce1126','centro',0.4), 'Libéria':FP_('listras','#bf0a30','#ffffff',null,'estrela','#ffffff','cantao',0.4), 'Serra Leoa':FP_('tricolor_h','#1eb53a','#ffffff','#0072c6'),
  'Benin':FP_('bicolor_h','#fcd116','#e8112d'), 'Togo':FP_('listras','#006a4e','#ffce00',null,'estrela','#ffffff','cantao',0.4), 'Mauritânia':FP_('solido','#006233','#006233',null,'lua','#ffc400','centro',0.6),
  'Eritreia':FP_('triangulo','#12ad2b','#ea0437','#4189dd'), 'Sudão do Sul':FP_('tricolor_h','#000000','#da121a','#078930','triangulo','#0f47af','mastro',0.5), 'Madagascar':FP_('bicolor_h','#fc3d32','#007e3a'),
  'República Centro-Africana':FP_('tricolor_h','#003082','#ffffff','#289728','estrela','#ffce00','cantao',0.3), 'Ruanda':FP_('tricolor_h','#00a1de','#fad201','#20603d'), 'Burundi':FP_('aspa','#ce1126','#ffffff','#1eb53a'),
  'Panamá':FP_('quartelado','#ffffff','#d21034'), 'Costa Rica':FP_('listras','#002b7f','#ffffff'), 'Nicarágua':FP_('tricolor_h','#0067c6','#ffffff','#0067c6'), 'Honduras':FP_('tricolor_h','#0073cf','#ffffff','#0073cf','estrelas','#0073cf','centro',0.4),
  'El Salvador':FP_('tricolor_h','#0047ab','#ffffff','#0047ab'), 'Guatemala':FP_('tricolor_v','#4997d0','#ffffff','#4997d0'), 'Haiti':FP_('bicolor_h','#00209f','#d21034'), 'República Dominicana':FP_('quartelado','#002d62','#ce1126',null,'cruz','#ffffff','centro',0.6),
  'Jamaica':FP_('aspa','#009b3a','#fed100'), 'Guiana':FP_('triangulo','#009e49','#fcd116','#009e49'), 'Suriname':FP_('tricolor_h','#377e3f','#b40a2d','#377e3f','estrela','#ecc81d','centro',0.4),
  'Papua-Nova Guiné':FP_('diagonal','#000000','#ce1126','#ce1126'), 'Holanda':FLAG_PRESETS['Holanda'], 'Turquia':FLAG_PRESETS['Turquia']
});

// ---------------- Lista de nações de uma época ----------------
let _geoBase = null;
eraNations = function(era){
  era = +era;
  if (!_geoBase) _geoBase = geoBaseNations();
  const E = ERA_GEO[era] || ERA_GEO[2000], OPS = (typeof ERA_OPS !== 'undefined' && ERA_OPS[era]) || {};
  const absent = new Set((E.absent||'').split(' ').filter(Boolean));
  const list = _geoBase.list.map(d => Object.assign({}, d, {isos:d.isos.slice()}));
  const byA3 = {}; list.forEach(d => { byA3[d.a3] = d; });
  const groups = {};
  for (const [gid, g] of Object.entries(E.groups||{})){
    const d = {key: g.key || g.name, name:g.name, a3:'G:' + gid, isos:[], gov:g.gov, rel:g.rel, ag:g.ag||0.3, bloc:g.bloc||null, pop:0, pc:0, capital:g.cap[0], capPos:[g.cap[1], g.cap[2]], flag:g.flag, sub:'', hist:g.hist, boxOnly:(E.boxes||[]).some(b => b.to === 'G:' + gid)};
    if (!PROFILES[d.key]) PROFILES[d.key] = {cult:g.cult||'luso', res:[], exp:[], likes:['comercio'], dislikes:['expansao']};
    groups['G:' + gid] = d; list.push(d);
  }
  const target = t => groups[t] || byA3[t];
  for (const [from, to] of Object.entries(E.into||{})){
    const a = byA3[from], b = target(to); if (!a || !b || a === b) continue;
    b.isos = b.isos.concat(a.isos); b.pop = (b.pop||0) + (a.pop||0); if (!b.pc) b.pc = a.pc; a.removed = true;
    b.absorbed = (b.absorbed||[]).concat(a.key);
  }
  for (const a3 of absent){ const a = byA3[a3]; if (a){ a.removed = true; a.absentLand = true; } }
  // nomes, regimes e bandeiras da época (regras antigas + novas)
  const ren = Object.assign({}, OPS.rename||{}, E.rename||{});
  for (const [key, ov] of Object.entries(ren)){ const d = list.find(x => x.key === key); if (d) Object.assign(d, ov); }
  const out = list.filter(d => !d.removed && (d.isos.length || d.boxOnly));
  for (const d of out){
    const cap = d.capPos ? [d.capital, d.capPos[0], d.capPos[1]] : eraCapital(d.a3, era);
    if (cap){ if (!(ren[d.key] && ren[d.key].capital)) d.capital = cap[0]; d.capPos = [cap[1], cap[2]]; }
    else if (!d.capital) d.capital = CAPITALS[d.key] || genPlaceName();
    const cells = d.isos.reduce((s, a) => s + ((GEO.countries[GEO_IDX[a]]||{}).cells||0), 0);
    d.w = +Math.max(0.2, Math.sqrt(cells) / 12).toFixed(2);
    const lbl = d.label || (d.capPos || [0, 0]);
    d.seeds = [[(d.capPos||lbl)[0], (d.capPos||lbl)[1], d.w], [lbl[0], lbl[1], d.w]];
    d.cellsEst = cells;
    if (!d.pc) d.pc = 2;
  }
  out._boxes = E.boxes || [];
  return out;
};

// limita a quantidade de países conforme a configuração do mundo
function limitNations(list, cfg){
  const w = cfg.world || (typeof defaultWorld === 'function' ? defaultWorld() : {}), O = (typeof WORLD_OPTS !== 'undefined') ? WORLD_OPTS.countries.o[w.countries] : null;
  const max = O ? O.v : 999; if (list.length <= max) return list;
  const keep = new Set((list._boxes||[]).map(b => b.to));
  const score = d => Math.sqrt(d.pop||1) * Math.pow((d.pc||1) + 1, 0.3) * Math.pow(d.cellsEst||1, 0.35) * (LEGACY_BY_KEY[d.key] ? 1.6 : 1);
  const sorted = list.slice().sort((a, b) => score(b) - score(a));
  const chosen = new Set(sorted.slice(0, max));
  // no online, os países de TODOS os jogadores entram (a lista precisa ser idêntica em todos os computadores)
  const humansEx = new Set(cfg.online ? cfg.online.humans.map(h => h.cfg && h.cfg.existing).filter(Boolean) : [cfg.existing]);
  for (const d of list) if (humansEx.has(d.name) || keep.has(d.a3)) chosen.add(d);
  const out = list.filter(d => chosen.has(d)); out._boxes = list._boxes; out._dropped = list.filter(d => !chosen.has(d));
  return out;
}

// ---------------- Distribui as terras ----------------
function assignGeoTerritories(N, cfg){
  const byA3 = {}, era = G.eraList;
  for (let id = 2; id < N.length; id++){ const n = N[id]; if (!n || n.empty || !n.isos) continue; for (const a of n.isos) byA3[a] = id; byA3[n.a3] = id; }
  const absentRule = (cfg.world && cfg.world.absent) || 'vizinhos';
  for (let i = 0; i < NCELLS; i++){
    if (!Grid.land[i]) continue;
    const a3 = cellA3(i); Grid.owner[i] = a3 ? (byA3[a3] || 0) : 0;
  }
  for (const b of (era._boxes||[])){
    const to = b.to === 'ABSENT' ? 0 : N.findIndex(n => n && n.a3 === b.to); if (b.to !== 'ABSENT' && to < 2) continue;
    for (let i = 0; i < NCELLS; i++){ if (!Grid.land[i] || cellA3(i) !== b.from) continue; const [lo, la] = cellCenter(i); if (lo >= b.box[0] && la >= b.box[1] && lo <= b.box[2] && la <= b.box[3]) Grid.owner[i] = to; }
  }
  // países que ficaram de fora pela configuração: terras para os vizinhos (ou livres)
  if (absentRule === 'vizinhos' && era._dropped && era._dropped.length){
    const dropped = new Set(); for (const d of era._dropped) for (const a of d.isos) dropped.add(a);
    let frontier = [];
    for (let i = 0; i < NCELLS; i++) if (Grid.owner[i] > 1) frontier.push(i);
    const pending = c => Grid.land[c] && Grid.owner[c] === 0 && dropped.has(cellA3(c));
    for (let it = 0; it < 400 && frontier.length; it++){
      const next = [];
      for (const c of frontier) for (const nb of neighbors4(c)) if (pending(nb)){ Grid.owner[nb] = Grid.owner[c]; next.push(nb); }
      frontier = next;
    }
  }
}

// ---------------- Estados reais de um país ----------------
function realStatesFor(isos){
  if (typeof GEO_STATES === 'undefined') return [];
  const set = new Set(isos);
  return GEO_STATES.filter(s => set.has(s[1]) && s[0]).map(s => s[0]);
}
// cidades reais de um país (as maiores primeiro), com nomes da época
function realCitiesFor(isos, year, max){
  const set = new Set(isos), out = [];
  for (const c of GEO.cities){ if (!set.has(c[4]) || !cityExists(c[0], year, c[4], c[3], c[1], true)) continue; out.push({name:cityNameAt(c[0], year), lon:c[1], lat:c[2], pop:c[3], cap:c[5]}); if (out.length >= (max||40)) break; }
  return out;
}

// ---------------- Camadas do mapa: estados e cidades (conforme o zoom) ----------------
const GEO_LAYER = {states:null, cities:null, cityYear:null};
function geoStatesReady(){
  if (GEO_LAYER.states || typeof GEO_STATES === 'undefined') return GEO_LAYER.states;
  GEO_LAYER.states = GEO_STATES.map(s => {
    const path = new Path2D(); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const enc of s[4]){
      const v = enc.split(',').map(Number); let px = 0, py = 0;
      for (let k = 0; k < v.length; k += 2){
        px += v[k]; py += v[k+1];
        const [x, y] = proj(px/20, py/20);
        k ? path.lineTo(x, y) : path.moveTo(x, y);
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
      path.closePath();
    }
    const [lx, ly] = proj(s[2], s[3]);
    return {name:s[0], a3:s[1], path, box:[x0, y0, x1, y1], lx, ly};
  });
  return GEO_LAYER.states;
}
function geoCitiesFor(year){
  if (GEO_LAYER.cityYear === year) return GEO_LAYER.cities;
  GEO_LAYER.cityYear = year;
  GEO_LAYER.cities = GEO.cities.filter(c => cityExists(c[0], year, c[4], c[3], c[1])).map(c => { const [x, y] = proj(c[1], c[2]); return {name:cityNameAt(c[0], year), x, y, pop:c[3], cap:c[5], cell:cellOf(c[1], c[2])}; });
  return GEO_LAYER.cities;
}
// divisas dos estados (antes de tudo) — os nomes entram depois, junto com as cidades
MapView.drawGeoStates = function(ctx, z){
  this._visStates = [];
  if (this.menuMode || !G || !G.p || z < 2) return;
  const S = geoStatesReady(); if (!S) return;
  const vx0 = this.cam.x, vy0 = this.cam.y, vx1 = vx0 + this.cw / z, vy1 = vy0 + this.ch / z;
  ctx.save(); ctx.setLineDash([4/z, 3/z]); ctx.strokeStyle = 'rgba(70,45,20,0.45)'; ctx.lineWidth = Math.max(0.2, 1/z);
  for (const s of S){ const b = s.box; if (b[2] < vx0 || b[0] > vx1 || b[3] < vy0 || b[1] > vy1) continue; ctx.stroke(s.path); this._visStates.push(s); }
  ctx.restore();
};
const labelFits = (boxes, bx) => !boxes.some(b => bx[0] < b[2] && bx[2] > b[0] && bx[1] < b[3] && bx[3] > b[1]);
MapView.drawGeoLayers = function(ctx, z){
  if (this.menuMode || !G || !G.p) return;
  const boxes = this._boxes || (this._boxes = []);
  const vx0 = this.cam.x, vy0 = this.cam.y, vx1 = vx0 + this.cw / z, vy1 = vy0 + this.ch / z;
  const inView = (x, y, m) => x > vx0 - m && x < vx1 + m && y > vy0 - m && y < vy1 + m;
  // cidades do mundo (as maiores primeiro, para terem prioridade no espaço)
  if (z >= 1.2){
    const year = curYear(), list = geoCitiesFor(year);
    const minPop = z >= 14 ? 0 : z >= 9 ? 20 : z >= 6 ? 60 : z >= 4 ? 150 : z >= 2.8 ? 400 : z >= 1.8 ? 1500 : 1e9;
    const own = new Set(G.p.cityCells || []); own.add(G.p.capCell);
    const fs = 11 / z, r = 2.4 / z;
    ctx.save(); ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.font = `${fs}px Georgia, serif`;
    for (const c of list){
      if (!inView(c.x, c.y, 20)) continue;
      const isCap = c.cap & 1, isAdm = c.cap & 2;
      if (!(isCap || c.pop >= minPop || (isAdm && z >= 3.2))) continue;
      if (own.has(c.cell) && G.p.cityNames.includes(c.name)) continue;
      const w = ctx.measureText(c.name).width, bx = [c.x - r, c.y - fs*0.6, c.x + r*2 + w + 2/z, c.y + fs*0.6];
      ctx.fillStyle = isCap ? '#7a1b14' : '#3d2812';
      ctx.beginPath(); if (isCap) ctx.rect(c.x - r, c.y - r, r*2, r*2); else ctx.arc(c.x, c.y, r*0.75, 0, Math.PI*2); ctx.fill();
      if (!labelFits(boxes, bx)) continue;                 // o ponto aparece; o nome só se couber
      boxes.push(bx);
      ctx.lineWidth = 3/z; ctx.strokeStyle = 'rgba(244,232,200,0.85)'; ctx.strokeText(c.name, c.x + r*1.7, c.y); ctx.fillText(c.name, c.x + r*1.7, c.y);
    }
    ctx.restore();
  }
  // nomes dos estados (por último: só onde sobra espaço)
  if (z >= 3.2 && this._visStates){
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `italic ${11/z}px Georgia, serif`; ctx.fillStyle = 'rgba(60,38,15,0.7)';
    for (const s of this._visStates){
      const wpx = (s.box[2] - s.box[0]) * z; if (wpx < 34 || !s.name) continue;
      const w = ctx.measureText(s.name).width, bx = [s.lx - w/2, s.ly - 7/z, s.lx + w/2, s.ly + 7/z];
      if (!labelFits(boxes, bx)) continue; boxes.push(bx); ctx.fillText(s.name, s.lx, s.ly);
    }
    ctx.restore();
  }
};
