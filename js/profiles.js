// ============================================================
//  IMPERIUM — Perfis das nações: cultura, recursos, exportações, gostos
// ============================================================
'use strict';

const CULTURES = {
  anglo:{f:['James','William','John','George','Thomas','Edward','Mary','Elizabeth','Margaret','Henry','Charles','Arthur'], l:['Smith','Johnson','Wilson','Taylor','Clarke','Harrison','Hughes','Bennett','Walker','Mitchell']},
  hisp:{f:['Carlos','José','Juan','Miguel','Fernando','Isabel','María','Rafael','Alejandro','Luisa','Manuel','Elena'], l:['García','Fernández','López','Martínez','Herrera','Morales','Rivera','Castillo','Vargas','Ortega']},
  luso:{f:FIRST_NAMES, l:LAST_NAMES},
  fr:{f:['Louis','Pierre','Jean','Charles','Marie','Jacques','Henri','Claire','Émile','Georges'], l:['Dubois','Martin','Bernard','Lefebvre','Moreau','Laurent','Girard','Fontaine','Mercier','Durand']},
  de:{f:['Friedrich','Wilhelm','Otto','Karl','Hans','Helmut','Konrad','Greta','Ludwig','Ingrid'], l:['Müller','Schmidt','Schneider','Fischer','Weber','Becker','Hoffmann','Wagner','Richter','Bauer']},
  it:{f:['Giuseppe','Giovanni','Vittorio','Alessandro','Marco','Giulia','Francesca','Luigi','Sergio','Matteo'], l:['Rossi','Bianchi','Romano','Colombo','Ricci','Marino','Greco','Conti','De Luca','Ferrari']},
  slav:{f:['Ivan','Dmitri','Nikolai','Vladimir','Sergei','Mikhail','Anna','Olga','Pavel','Yuri','Jan','Tomasz'], l:['Ivanov','Petrov','Volkov','Sokolov','Kuznetsov','Popov','Morozov','Novak','Kowalski','Shevchenko']},
  nord:{f:['Erik','Lars','Olaf','Gustav','Ingrid','Astrid','Magnus','Sven','Karin','Nils'], l:['Andersson','Johansson','Larsen','Nilsson','Berg','Lindqvist','Hansen','Olsen','Dahl','Strand']},
  arab:{f:['Ahmed','Mohammed','Omar','Faisal','Abdullah','Hassan','Khalid','Fatima','Youssef','Ali'], l:['Al-Sayed','Hussein','Nasser','Al-Rashid','Mansour','Haddad','Saleh','Farouk','Aziz','Karim']},
  pers:{f:['Reza','Ali','Mohammad','Hossein','Mahmoud','Dariush','Kourosh','Shirin','Abbas','Mehdi'], l:['Rahimi','Tehrani','Hosseini','Ahmadi','Karimi','Rostami','Jafari','Moradi','Najafi','Sadeghi']},
  turk:{f:['Mehmet','Mustafa','Ahmet','İsmet','Kemal','Ayşe','Osman','Selim','Murat','Zeynep'], l:['Yılmaz','Kaya','Demir','Şahin','Çelik','Öztürk','Aydın','Arslan','Erdem','Koç']},
  ind:{f:['Rajesh','Arjun','Vikram','Priya','Sanjay','Ravi','Anil','Lakshmi','Indira','Imran'], l:['Sharma','Patel','Singh','Kumar','Rao','Iyer','Desai','Bose','Khan','Chaudhry']},
  chn:{f:['Wei','Ming','Jian','Hua','Zhen','Xiao','Jun','Mei','Lian','Bo'], l:['Wang','Li','Zhang','Liu','Chen','Yang','Zhao','Huang','Zhou','Wu'], rev:true},
  jpn:{f:['Hiroshi','Takeshi','Kenji','Akira','Haruki','Yuki','Sakura','Ichiro','Taro','Naoko'], l:['Tanaka','Suzuki','Takahashi','Watanabe','Yamamoto','Nakamura','Kobayashi','Sato','Ito','Kato'], rev:true},
  kor:{f:['Min-jun','Ji-hoon','Seo-yeon','Dong-hyun','Hye-jin','Jae-in','Sung-min','Young-ho'], l:['Kim','Lee','Park','Choi','Jung','Kang','Yoon','Han'], rev:true},
  afr:{f:['Kwame','Jomo','Amara','Chinua','Thabo','Kofi','Nnamdi','Ama','Sekou','Abebe'], l:['Mensah','Okafor','Nkosi','Diallo','Touré','Abubakar','Keita','Ochieng','Bekele','Dlamini']},
  sea:{f:['Somchai','Budi','Ahmad','Siti','Joko','Dewi','Anan','Ploy','Rizal','Hendra'], l:['Santoso','Wijaya','Hidayat','Pratama','Srisai','Chanthara','Wongsakul','Siregar']},
  mong:{f:['Batu','Temür','Bold','Ganbaatar','Saran','Altan'], l:['Bat-Erdene','Enkhbayar','Dorj','Sükhbaatar','Tsedenbal']}
};
function genLeaderName(cult, rnd){
  rnd = rnd || Math.random; const c = CULTURES[cult] || CULTURES.luso;
  const f = c.f[Math.floor(rnd()*c.f.length)], l = c.l[Math.floor(rnd()*c.l.length)];
  return c.rev ? `${l} ${f}` : `${f} ${l}`;
}

// res: recursos (chaves de RESOURCES) · exp: exportações (@ano = só depois desse ano)
// likes / dislikes: chaves de PREFS / DISLIKES (game.js)
const PROFILES = {
  'Estados Unidos':{cult:'anglo', res:['petroleo','carvao','ferro','terras'], exp:['Algodão','Trigo','Aço@1880','Automóveis@1910','Aviões@1940','Software@1985'], likes:['democracia','comercio'], dislikes:['comunismo']},
  'Canadá':{cult:'anglo', res:['madeira','pesca','uranio'], exp:['Madeira','Trigo','Peles','Minérios','Petróleo@1950'], likes:['paz','democracia'], dislikes:['expansao']},
  'México':{cult:'hisp', res:['petroleo','ouro'], exp:['Prata','Milho','Petróleo@1910','Automóveis@1990'], likes:['comercio','fe'], dislikes:['expansao']},
  'Cuba':{cult:'hisp', res:['especiarias','pesca'], exp:['Açúcar','Tabaco','Rum'], likes:['autoritarismo'], dislikes:['democracia_d']},
  'Colômbia':{cult:'hisp', res:['especiarias','diamantes'], exp:['Café','Esmeraldas','Petróleo@1920','Flores@1970'], likes:['comercio','fe'], dislikes:['militarismo']},
  'Venezuela':{cult:'hisp', res:['petroleo'], exp:['Cacau','Café','Petróleo@1914'], likes:['forca','autoritarismo'], dislikes:['democracia_d']},
  'Peru':{cult:'hisp', res:['ouro','pesca'], exp:['Prata','Guano','Cobre@1900','Pescado'], likes:['comercio'], dislikes:['expansao']},
  'Brasil':{cult:'luso', res:['especiarias','ferro','madeira','terras'], exp:['Café','Açúcar','Borracha','Minério de ferro@1940','Soja@1970','Aviões@1990'], likes:['comercio','paz'], dislikes:['expansao']},
  'Argentina':{cult:'hisp', res:['terras','pesca'], exp:['Carne','Trigo','Couro','Vinho@1950'], likes:['comercio','fe'], dislikes:['expansao']},
  'Reino Unido':{cult:'anglo', res:['carvao','ferro','pesca'], exp:['Têxteis','Navios','Máquinas','Carvão','Serviços financeiros@1950'], likes:['comercio','democracia'], dislikes:['expansao']},
  'França':{cult:'fr', res:['terras','ferro'], exp:['Vinho','Artigos de luxo','Têxteis','Automóveis@1910','Aviões@1970'], likes:['democracia','ciencia'], dislikes:['expansao']},
  'Espanha':{cult:'hisp', res:['terras','pesca'], exp:['Azeite','Vinho','Frutas','Automóveis@1970'], likes:['fe','comercio'], dislikes:['comunismo']},
  'Alemanha':{cult:'de', res:['carvao','ferro'], exp:['Máquinas','Produtos químicos@1880','Aço@1870','Automóveis@1910'], likes:['ciencia','comercio'], dislikes:['militarismo']},
  'Itália':{cult:'it', res:['terras','pesca'], exp:['Azeite','Vinho','Moda@1950','Automóveis@1920'], likes:['fe','comercio'], dislikes:['comunismo']},
  'Polônia':{cult:'slav', res:['carvao','terras'], exp:['Carvão','Grãos','Aço@1950'], likes:['fe','democracia'], dislikes:['expansao']},
  'Escandinávia':{cult:'nord', res:['madeira','ferro','pesca'], exp:['Madeira','Aço','Pescado','Celulose@1900','Móveis@1960'], likes:['paz','democracia'], dislikes:['militarismo']},
  'Ucrânia':{cult:'slav', res:['terras','carvao'], exp:['Trigo','Aço@1900','Girassol'], likes:['fe','paz'], dislikes:['expansao']},
  'Turquia':{cult:'turk', res:['terras'], exp:['Tabaco','Têxteis','Frutas secas'], likes:['forca','fe'], dislikes:['fe_diferente']},
  'Rússia':{cult:'slav', res:['petroleo','madeira','uranio','ouro'], exp:['Grãos','Madeira','Peles','Petróleo@1900','Gás natural@1960','Armas@1950'], likes:['forca','autoritarismo'], dislikes:['democracia_d']},
  'Egito':{cult:'arab', res:['terras'], exp:['Algodão','Turismo@1950'], likes:['fe','paz'], dislikes:['expansao']},
  'Argélia':{cult:'arab', res:['petroleo'], exp:['Vinho','Petróleo@1960','Gás natural@1965'], likes:['fe','autoritarismo'], dislikes:['monarquia']},
  'Nigéria':{cult:'afr', res:['petroleo','terras'], exp:['Óleo de palma','Cacau','Amendoim','Petróleo@1960'], likes:['comercio','paz'], dislikes:['expansao']},
  'Etiópia':{cult:'afr', res:['especiarias'], exp:['Café','Couro'], likes:['fe','paz'], dislikes:['expansao']},
  'Congo':{cult:'afr', res:['diamantes','madeira','ouro'], exp:['Borracha','Marfim','Cobre@1910','Cobalto@1950','Diamantes'], likes:['riqueza'], dislikes:['expansao']},
  'África do Sul':{cult:'afr', res:['ouro','diamantes','carvao'], exp:['Ouro','Diamantes','Platina@1920','Vinho'], likes:['comercio','riqueza'], dislikes:['expansao']},
  'Arábia Saudita':{cult:'arab', res:['petroleo'], exp:['Tâmaras','Petróleo@1938'], likes:['fe','riqueza'], dislikes:['fe_diferente']},
  'Irã':{cult:'pers', res:['petroleo'], exp:['Tapetes','Pistache','Petróleo@1910'], likes:['fe','forca'], dislikes:['fe_diferente']},
  'Cazaquistão':{cult:'turk', res:['petroleo','uranio','terras'], exp:['Grãos','Urânio@1960','Petróleo@1990'], likes:['forca','comercio'], dislikes:['expansao']},
  'Índia':{cult:'ind', res:['especiarias','terras','carvao'], exp:['Chá','Têxteis','Especiarias','Software@1990'], likes:['paz','democracia'], dislikes:['militarismo']},
  'Paquistão':{cult:'ind', res:['terras'], exp:['Algodão','Têxteis'], likes:['fe','forca'], dislikes:['fe_diferente']},
  'China':{cult:'chn', res:['carvao','ferro','terras'], exp:['Seda','Porcelana','Chá','Aço@1960','Eletrônicos@1985'], likes:['comercio','forca'], dislikes:['democracia_d']},
  'Mongólia':{cult:'mong', res:['carvao','ouro'], exp:['Lã','Gado','Cobre@1970'], likes:['paz'], dislikes:['expansao']},
  'Japão':{cult:'jpn', res:['pesca'], exp:['Seda','Navios@1900','Eletrônicos@1960','Automóveis@1960'], likes:['ciencia','comercio'], dislikes:['nuclear']},
  'Coreia':{cult:'kor', res:['pesca'], exp:['Arroz','Navios@1970','Eletrônicos@1975','Aço@1970'], likes:['ciencia','democracia'], dislikes:['comunismo']},
  'Tailândia':{cult:'sea', res:['terras','especiarias'], exp:['Arroz','Borracha@1900','Teca'], likes:['fe','comercio'], dislikes:['expansao']},
  'Filipinas':{cult:'hisp', res:['pesca','especiarias'], exp:['Açúcar','Coco','Abacá','Eletrônicos@1980'], likes:['fe','democracia'], dislikes:['expansao']},
  'Indonésia':{cult:'sea', res:['especiarias','petroleo','madeira'], exp:['Especiarias','Borracha@1900','Petróleo@1910','Óleo de palma@1950'], likes:['fe','comercio'], dislikes:['expansao']},
  'Austrália':{cult:'anglo', res:['ouro','ferro','carvao','terras'], exp:['Lã','Ouro','Carvão','Minério de ferro@1960'], likes:['comercio','democracia'], dislikes:['expansao']},
  'Nova Zelândia':{cult:'anglo', res:['terras','pesca'], exp:['Lã','Laticínios','Carne'], likes:['paz','democracia'], dislikes:['nuclear']},
  'Mali':{cult:'afr', res:['ouro'], exp:['Algodão','Ouro','Sal'], likes:['fe'], dislikes:['expansao']},
  'Sudão':{cult:'arab', res:['terras','petroleo'], exp:['Algodão','Goma arábica','Petróleo@1999'], likes:['fe','forca'], dislikes:['fe_diferente']},
  'Angola':{cult:'luso', res:['petroleo','diamantes','especiarias'], exp:['Café','Diamantes','Petróleo@1960'], likes:['riqueza'], dislikes:['expansao']},
  'África Oriental':{cult:'afr', res:['especiarias','terras'], exp:['Café','Chá','Sisal','Turismo@1960'], likes:['paz','comercio'], dislikes:['militarismo']}
};
