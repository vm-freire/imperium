// ============================================================
//  IMPERIUM — Políticos reais de cada partido
//  • Ao escolher um partido real (criação do país ou "Nomes da
//    nação"), aparecem políticos dele daquela época; escolher um
//    define o nome do líder, a idade, um avatar e a ideologia
//  • Partidos fundados até 30 anos depois do início também podem
//    ser escolhidos (marcados como "fora de época")
//  • Entradas: [nome, sexo, nascimento (ou null), atuação de, até,
//    nota, ideologia própria (opcional)]
// ============================================================
'use strict';

// partidos que faltavam (somados à lista de parties.js)
(PARTIES['Brasil'] = PARTIES['Brasil'] || []).push(
  [1995,2100,'Progressistas','PP','cdir'], [2005,2100,'Republicanos','REP','cdir'], [2011,2100,'Partido Social Democrático','PSD','cen'], [2024,2100,'Missão','MISSÃO','dir']);

const POLITICOS = {
  'Brasil':{
    'Partido Liberal':[['Zacarias de Góis','m',1815,1850,1877,'Chefe de gabinetes liberais no Império'],['Teófilo Otoni','m',1807,1850,1869,'Líder liberal mineiro'],['Visconde de Ouro Preto','m',1836,1870,1889,'Último chefe de governo do Império'],
      ['Jair Bolsonaro','m',1955,2021,2100,'Presidente da República (2019–2022)'],['Valdemar Costa Neto','m',1949,2006,2100,'Presidente nacional do partido'],['Michelle Bolsonaro','f',1982,2022,2100,'Ex-primeira-dama'],['Nikolas Ferreira','m',1996,2022,2100,'Deputado federal (MG)']],
    'Partido Conservador':[['Duque de Caxias','m',1803,1850,1880,'Chefe do Conselho de Ministros'],['Visconde do Rio Branco','m',1819,1850,1880,'Governo da Lei do Ventre Livre (1871)'],['Barão de Cotegipe','m',1815,1850,1889,'Chefe do Conselho de Ministros'],['João Alfredo','m',1835,1870,1889,'Governo da Lei Áurea (1888)']],
    'Partido Republicano Paulista':[['Prudente de Morais','m',1841,1873,1902,'Presidente (1894–1898)'],['Campos Sales','m',1841,1873,1913,'Presidente (1898–1902)'],['Rodrigues Alves','m',1848,1880,1919,'Presidente (1902–1906)'],['Washington Luís','m',1869,1900,1930,'Presidente (1926–1930)'],['Júlio Prestes','m',1882,1910,1930,'Governador de São Paulo']],
    'Partido Republicano Mineiro':[['Afonso Pena','m',1847,1889,1909,'Presidente (1906–1909)'],['Venceslau Brás','m',1868,1889,1930,'Presidente (1914–1918)'],['Artur Bernardes','m',1875,1905,1930,'Presidente (1922–1926)'],['Antônio Carlos de Andrada','m',1870,1900,1930,'Governador de Minas Gerais']],
    'Partido Social Democrático':[['Eurico Gaspar Dutra','m',1883,1945,1966,'Presidente (1946–1951)'],['Juscelino Kubitschek','m',1902,1945,1966,'Presidente (1956–1961), construiu Brasília'],['Tancredo Neves','m',1910,1945,1966,'Primeiro-ministro (1961–1962)'],['Ulysses Guimarães','m',1916,1950,1966,'Deputado federal (SP)'],
      ['Gilberto Kassab','m',1960,2011,2100,'Fundador e presidente do partido'],['Eduardo Paes','m',1969,2021,2100,'Prefeito do Rio de Janeiro'],['Ratinho Júnior','m',1981,2011,2100,'Governador do Paraná']],
    'União Democrática Nacional':[['Carlos Lacerda','m',1914,1945,1966,'Governador da Guanabara'],['Eduardo Gomes','m',1896,1945,1966,'Brigadeiro, candidato a presidente'],['Afonso Arinos','m',1905,1945,1966,'Autor da lei contra o racismo (1951)'],['Juracy Magalhães','m',1905,1945,1966,'Governador da Bahia']],
    'Partido Trabalhista Brasileiro':[['Getúlio Vargas','m',1882,1945,1954,'Presidente (1951–1954)'],['João Goulart','m',1918,1945,1966,'Presidente (1961–1964)'],['Leonel Brizola','m',1922,1950,1966,'Governador do Rio Grande do Sul']],
    'Partido dos Trabalhadores':[['Luiz Inácio Lula da Silva','m',1945,1980,2100,'Presidente (2003–2010 e desde 2023)'],['Dilma Rousseff','f',1947,2001,2100,'Presidenta (2011–2016)'],['Fernando Haddad','m',1963,2001,2100,'Ministro da Fazenda'],['Gleisi Hoffmann','f',1965,2000,2100,'Ex-presidente nacional do partido'],['Eduardo Suplicy','m',1941,1980,2100,'Senador por São Paulo']],
    'Movimento Democrático Brasileiro':[['Ulysses Guimarães','m',1916,1980,1992,'Presidente da Constituinte (1987–1988)'],['José Sarney','m',1930,1985,2100,'Presidente (1985–1990)'],['Michel Temer','m',1940,1980,2100,'Presidente (2016–2018)'],['Renan Calheiros','m',1955,1980,2100,'Senador por Alagoas'],['Simone Tebet','f',1970,2010,2100,'Ministra do Planejamento']],
    'Partido Democrático Trabalhista':[['Leonel Brizola','m',1922,1980,2004,'Governador do Rio de Janeiro'],['Ciro Gomes','m',1957,2015,2100,'Ex-governador do Ceará'],['Carlos Lupi','m',1957,1980,2100,'Presidente nacional do partido']],
    'Partido Socialista Brasileiro':[['Miguel Arraes','m',1916,1985,2005,'Governador de Pernambuco'],['Eduardo Campos','m',1965,1990,2014,'Governador de Pernambuco'],['Geraldo Alckmin','m',1952,2022,2100,'Vice-presidente da República','cen'],['João Campos','m',1993,2016,2100,'Prefeito do Recife'],['Tabata Amaral','f',1993,2021,2100,'Deputada federal (SP)']],
    'Partido da Social Democracia Brasileira':[['Fernando Henrique Cardoso','m',1931,1988,2100,'Presidente (1995–2002), Plano Real'],['Mário Covas','m',1930,1988,2001,'Governador de São Paulo'],['José Serra','m',1942,1988,2100,'Ex-governador de São Paulo'],['Geraldo Alckmin','m',1952,1988,2021,'Ex-governador de São Paulo'],['Aécio Neves','m',1960,1988,2100,'Ex-governador de Minas Gerais'],['Eduardo Leite','m',1985,2010,2100,'Governador do Rio Grande do Sul']],
    'Democratas (ex-PFL)':[['Antônio Carlos Magalhães','m',1927,1985,2007,'Senador pela Bahia'],['Marco Maciel','m',1940,1985,2015,'Vice-presidente (1995–2002)'],['Rodrigo Maia','m',1970,1998,2020,'Presidente da Câmara (2016–2021)'],['ACM Neto','m',1979,2004,2022,'Prefeito de Salvador']],
    'Partido Socialismo e Liberdade':[['Heloísa Helena','f',1962,2004,2100,'Fundadora do partido'],['Marcelo Freixo','m',1967,2005,2021,'Ex-deputado (RJ)'],['Guilherme Boulos','m',1982,2018,2100,'Deputado federal (SP)'],['Erika Hilton','f',1992,2020,2100,'Deputada federal (SP)']],
    'Partido Novo':[['João Amoêdo','m',1962,2011,2022,'Fundador do partido'],['Romeu Zema','m',1964,2018,2100,'Governador de Minas Gerais'],['Marcel van Hattem','m',1985,2018,2100,'Deputado federal (RS)']],
    'União Brasil':[['Ronaldo Caiado','m',1949,2022,2100,'Governador de Goiás'],['Sergio Moro','m',1972,2022,2100,'Senador pelo Paraná'],['Luciano Bivar','m',1944,2022,2100,'Deputado federal (PE)']],
    'Progressistas':[['Paulo Maluf','m',1931,1995,2018,'Ex-prefeito de São Paulo'],['Arthur Lira','m',1969,2010,2100,'Presidente da Câmara (2021–2025)'],['Ciro Nogueira','m',1968,1995,2100,'Senador pelo Piauí']],
    'Republicanos':[['Tarcísio de Freitas','m',1975,2022,2100,'Governador de São Paulo']],
    'Missão':[['Renan Santos','m',null,2024,2100,'Fundador do Missão e coordenador do MBL'],['Kim Kataguiri','m',1996,2024,2100,'Deputado federal (SP), cofundador do MBL']]
  },
  'Estados Unidos':{
    'Partido Democrata':[['Woodrow Wilson','m',1856,1905,1921,'Presidente (1913–1921)'],['Franklin D. Roosevelt','m',1882,1910,1945,'Presidente (1933–1945), New Deal'],['John F. Kennedy','m',1917,1946,1963,'Presidente (1961–1963)'],['Lyndon B. Johnson','m',1908,1937,1969,'Presidente (1963–1969)'],['Jimmy Carter','m',1924,1962,1981,'Presidente (1977–1981)'],
      ['Bill Clinton','m',1946,1976,2001,'Presidente (1993–2001)'],['Barack Obama','m',1961,1997,2017,'Presidente (2009–2017)'],['Hillary Clinton','f',1947,2000,2016,'Secretária de Estado'],['Joe Biden','m',1942,1972,2025,'Presidente (2021–2025)'],['Kamala Harris','f',1964,2010,2100,'Vice-presidente (2021–2025)']],
    'Partido Republicano':[['Abraham Lincoln','m',1809,1854,1865,'Presidente (1861–1865), fim da escravidão'],['Theodore Roosevelt','m',1858,1898,1912,'Presidente (1901–1909)'],['Dwight D. Eisenhower','m',1890,1952,1961,'Presidente (1953–1961)'],['Richard Nixon','m',1913,1946,1974,'Presidente (1969–1974)'],['Ronald Reagan','m',1911,1966,1989,'Presidente (1981–1989)'],
      ['George W. Bush','m',1946,1994,2009,'Presidente (2001–2009)'],['John McCain','m',1936,1982,2018,'Senador pelo Arizona'],['Donald Trump','m',1946,2015,2100,'Presidente (2017–2021 e desde 2025)'],['JD Vance','m',1984,2022,2100,'Vice-presidente (desde 2025)']]
  },
  'Reino Unido':{
    'Partido Conservador':[['Benjamin Disraeli','m',1804,1850,1881,'Primeiro-ministro'],['Winston Churchill','m',1874,1924,1955,'Primeiro-ministro na 2ª Guerra'],['Margaret Thatcher','f',1925,1959,1992,'Primeira-ministra (1979–1990)'],['John Major','m',1943,1979,2001,'Primeiro-ministro (1990–1997)'],['David Cameron','m',1966,2001,2016,'Primeiro-ministro (2010–2016)'],['Boris Johnson','m',1964,2001,2023,'Primeiro-ministro (2019–2022)'],['Rishi Sunak','m',1980,2015,2100,'Primeiro-ministro (2022–2024)']],
    'Partido Trabalhista':[['Keir Hardie','m',1856,1900,1915,'Fundador do partido'],['Clement Attlee','m',1883,1922,1955,'Primeiro-ministro (1945–1951)'],['Harold Wilson','m',1916,1945,1976,'Primeiro-ministro'],['Tony Blair','m',1953,1983,2007,'Primeiro-ministro (1997–2007)'],['Gordon Brown','m',1951,1983,2015,'Primeiro-ministro (2007–2010)'],['Keir Starmer','m',1962,2015,2100,'Primeiro-ministro (desde 2024)']],
    'Partido Liberal':[['William Gladstone','m',1809,1859,1894,'Primeiro-ministro quatro vezes'],['David Lloyd George','m',1863,1890,1945,'Primeiro-ministro (1916–1922)']]
  },
  'França':{
    'União pela Nova República (gaullista)':[['Charles de Gaulle','m',1890,1958,1970,'Presidente (1959–1969)'],['Georges Pompidou','m',1911,1958,1974,'Presidente (1969–1974)']],
    'Reunião pela República':[['Jacques Chirac','m',1932,1976,2002,'Presidente (1995–2007)']],
    'União por um Movimento Popular':[['Nicolas Sarkozy','m',1955,2002,2015,'Presidente (2007–2012)']],
    'Partido Socialista':[['François Mitterrand','m',1916,1971,1995,'Presidente (1981–1995)'],['Lionel Jospin','m',1937,1971,2002,'Primeiro-ministro (1997–2002)'],['François Hollande','m',1954,1979,2017,'Presidente (2012–2017)']],
    'Renascimento':[['Emmanuel Macron','m',1977,2016,2100,'Presidente (desde 2017)'],['Gabriel Attal','m',1989,2016,2100,'Primeiro-ministro (2024)']]
  },
  'Alemanha':{
    'União Democrata-Cristã':[['Konrad Adenauer','m',1876,1945,1967,'Chanceler (1949–1963)'],['Helmut Kohl','m',1930,1959,2002,'Chanceler da reunificação'],['Angela Merkel','f',1954,1990,2021,'Chanceler (2005–2021)'],['Friedrich Merz','m',1955,1989,2100,'Chanceler (desde 2025)']],
    'Partido Social-Democrata':[['Friedrich Ebert','m',1871,1890,1925,'Presidente (1919–1925)'],['Willy Brandt','m',1913,1949,1992,'Chanceler (1969–1974)'],['Helmut Schmidt','m',1918,1953,1987,'Chanceler (1974–1982)'],['Gerhard Schröder','m',1944,1980,2005,'Chanceler (1998–2005)'],['Olaf Scholz','m',1958,1998,2100,'Chanceler (2021–2025)']],
    'Os Verdes':[['Joschka Fischer','m',1948,1983,2006,'Ministro das Relações Exteriores']]
  },
  'Argentina':{
    'União Cívica Radical':[['Hipólito Yrigoyen','m',1852,1891,1933,'Presidente (1916–1922 e 1928–1930)'],['Raúl Alfonsín','m',1927,1958,2009,'Presidente (1983–1989)']],
    'Partido Justicialista':[['Juan Domingo Perón','m',1895,1946,1974,'Presidente três vezes'],['Néstor Kirchner','m',1950,1987,2010,'Presidente (2003–2007)'],['Cristina Kirchner','f',1953,1989,2100,'Presidenta (2007–2015)']],
    'Proposta Republicana':[['Mauricio Macri','m',1959,2005,2100,'Presidente (2015–2019)']],
    'A Liberdade Avança':[['Javier Milei','m',1970,2021,2100,'Presidente (desde 2023)'],['Victoria Villarruel','f',1975,2021,2100,'Vice-presidenta (desde 2023)']]
  },
  'Canadá':{
    'Partido Liberal':[['Wilfrid Laurier','m',1841,1880,1919,'Primeiro-ministro (1896–1911)'],['Pierre Trudeau','m',1919,1965,1984,'Primeiro-ministro'],['Justin Trudeau','m',1971,2008,2025,'Primeiro-ministro (2015–2025)'],['Mark Carney','m',1965,2025,2100,'Primeiro-ministro (desde 2025)']],
    'Partido Conservador':[['John A. Macdonald','m',1815,1867,1891,'Primeiro primeiro-ministro'],['Stephen Harper','m',1959,2003,2016,'Primeiro-ministro (2006–2015)'],['Pierre Poilievre','m',1979,2004,2100,'Líder do partido']]
  },
  'México':{
    'Partido Revolucionário Institucional':[['Lázaro Cárdenas','m',1895,1929,1970,'Presidente (1934–1940)'],['Enrique Peña Nieto','m',1966,2005,2018,'Presidente (2012–2018)']],
    'Partido Ação Nacional':[['Vicente Fox','m',1942,1988,2006,'Presidente (2000–2006)'],['Felipe Calderón','m',1962,1988,2018,'Presidente (2006–2012)']],
    'Morena':[['Andrés Manuel López Obrador','m',1953,2014,2100,'Presidente (2018–2024)'],['Claudia Sheinbaum','f',1962,2014,2100,'Presidenta (desde 2024)']]
  },
  'Índia':{
    'Congresso Nacional Indiano':[['Jawaharlal Nehru','m',1889,1947,1964,'Primeiro-ministro (1947–1964)'],['Indira Gandhi','f',1917,1959,1984,'Primeira-ministra'],['Manmohan Singh','m',1932,1991,2014,'Primeiro-ministro (2004–2014)'],['Rahul Gandhi','m',1970,2004,2100,'Líder da oposição']],
    'Bharatiya Janata Party':[['Atal Bihari Vajpayee','m',1924,1980,2009,'Primeiro-ministro (1998–2004)'],['Narendra Modi','m',1950,1987,2100,'Primeiro-ministro (desde 2014)']]
  },
  'Japão':{ 'Partido Liberal Democrata':[['Junichirō Koizumi','m',1942,1972,2009,'Primeiro-ministro (2001–2006)'],['Shinzō Abe','m',1954,1993,2022,'Primeiro-ministro'],['Sanae Takaichi','f',1961,1996,2100,'Primeira-ministra (desde 2025)']] },
  'Itália':{
    'Democracia Cristã':[['Alcide De Gasperi','m',1881,1943,1954,'Primeiro-ministro (1945–1953)'],['Aldo Moro','m',1916,1948,1978,'Primeiro-ministro']],
    'Forza Italia':[['Silvio Berlusconi','m',1936,1994,2023,'Primeiro-ministro'],['Antonio Tajani','m',1953,1994,2100,'Ministro das Relações Exteriores']],
    'Partido Democrático':[['Matteo Renzi','m',1975,2007,2019,'Primeiro-ministro (2014–2016)'],['Elly Schlein','f',1985,2023,2100,'Secretária do partido']],
    'Irmãos de Itália':[['Giorgia Meloni','f',1977,2012,2100,'Primeira-ministra (desde 2022)']],
    'Movimento 5 Estrelas':[['Giuseppe Conte','m',1964,2021,2100,'Primeiro-ministro (2018–2021)']]
  },
  'Espanha':{
    'Partido Socialista Operário Espanhol':[['Felipe González','m',1942,1974,1997,'Presidente do Governo (1982–1996)'],['José Luis Zapatero','m',1960,2000,2012,'Presidente do Governo (2004–2011)'],['Pedro Sánchez','m',1972,2014,2100,'Presidente do Governo (desde 2018)']],
    'Partido Popular':[['José María Aznar','m',1953,1989,2004,'Presidente do Governo (1996–2004)'],['Mariano Rajoy','m',1955,1989,2018,'Presidente do Governo (2011–2018)'],['Alberto Núñez Feijóo','m',1961,2022,2100,'Líder do partido']]
  },
  'Austrália':{
    'Partido Trabalhista Australiano':[['Bob Hawke','m',1929,1980,1992,'Primeiro-ministro (1983–1991)'],['Julia Gillard','f',1961,1998,2013,'Primeira-ministra (2010–2013)'],['Anthony Albanese','m',1963,1996,2100,'Primeiro-ministro (desde 2022)']],
    'Partido Liberal':[['Robert Menzies','m',1894,1945,1966,'Primeiro-ministro (1949–1966)'],['John Howard','m',1939,1974,2007,'Primeiro-ministro (1996–2007)']]
  },
  'África do Sul':{ 'Congresso Nacional Africano':[['Nelson Mandela','m',1918,1994,1999,'Presidente (1994–1999)'],['Cyril Ramaphosa','m',1952,1994,2100,'Presidente (desde 2018)']] }
};

// políticos de um partido disponíveis num ano de início (quem atuou de 10 anos antes até 30 depois)
function politiciansFor(key, party, year){
  if (!key || !party || !party.real) return [];
  const list = ((POLITICOS[key] || {})[party.name]) || [];
  return list.filter(x => x[4] > year - 10 && x[3] <= year + 30)
    .map(x => ({name:x[0], sex:x[1], born:x[2], from:x[3], to:x[4], note:x[5], ideo:x[6] || party.ideo}));
}
// partidos fundados depois do início (até 30 anos): escolha "fora de época"
function upcomingParties(key, year, gov){
  if (!key || powerKind(gov) !== 'partido') return [];
  return (PARTIES[key] || []).filter(e => e[0] > year && e[0] <= year + 30).map(e => ({name:e[2], abbr:e[3], ideo:e[4], kind:'partido', real:true, future:e[0]}));
}
function polAge(pol, year){ if (!pol.born) return null; const a = year - pol.born; return a >= 25 ? clamp(a, 25, 80) : clamp(new Date().getFullYear() - pol.born, 25, 80); }

const _polHTML = partyPickerHTML;
partyPickerHTML = function(obj, key, year, gov){
  let h = _polHTML(obj, key, year, gov);
  const up = upcomingParties(key, year, gov);
  if (up.length){
    const cur = obj.party;
    h += `<div class="lbl" style="margin-top:6px">⏩ Partidos que surgem depois (escolha fora de época)</div><div class="cards">${up.map((g, i) => `<div class="card ${cur && cur.name === g.name ? 'sel' : ''}" data-pgu="${i}"><b>${esc(g.name)} <small>(${esc(g.abbr)})</small></b><span>Fundado em ${g.future} · ${IDEOS[g.ideo].n}</span></div>`).join('')}</div>`;
  }
  const pols = politiciansFor(key, obj.party, year);
  if (pols.length){
    h += `<div class="section-title" style="margin-top:8px">👤 Políticos do ${esc(obj.party.abbr || obj.party.name)} <small class="muted">(opcional: vira o seu líder)</small></div>
      <div class="cards">${pols.map((pl, i) => { const age = polAge(pl, year);
        return `<div class="card ${obj.leader === pl.name ? 'sel' : ''}" data-pol="${i}"><b>${esc(pl.name)}</b><span>${esc(pl.note)}${age ? ` · ${age} anos` : ''} · ${IDEOS[pl.ideo] ? IDEOS[pl.ideo].n : ''}${pl.from > year ? ' · ⏩ fora de época' : ''}</span></div>`; }).join('')}</div>`;
  }
  return h;
};
const _polBind = bindPartyPicker;
bindPartyPicker = function(root, obj, key, year, gov, onChange){
  _polBind(root, obj, key, year, gov, onChange);
  const up = upcomingParties(key, year, gov);
  root.querySelectorAll('[data-pgu]').forEach(x => x.onclick = () => { SFX.click(); const g = up[+x.dataset.pgu]; obj.party = {name:g.name, abbr:g.abbr, ideo:g.ideo, kind:g.kind, real:true, future:g.future}; onChange(); });
  const pols = politiciansFor(key, obj.party, year);
  root.querySelectorAll('[data-pol]').forEach(x => x.onclick = () => {
    const pl = pols[+x.dataset.pol]; if (!pl) return; SFX.bell();
    const old = obj.leader;
    obj.leader = pl.name; obj.realLeader = true;
    const age = polAge(pl, year); if (age) obj.age = age;
    if (pl.ideo && obj.party) obj.party.ideo = pl.ideo;
    obj.avatar = randomAvatar(pl.sex === 'f' ? 'f' : 'm', seededRng(pl.name), obj.gov);
    if (!obj.avatar.height) obj.avatar.height = pl.sex === 'f' ? 165 : 175;
    if (G && G.p === obj && old !== pl.name) addLog(`👤 ${pl.name} (${obj.party.abbr || obj.party.name}) assume a liderança da nação.`, 'info');
    onChange();
  });
};
