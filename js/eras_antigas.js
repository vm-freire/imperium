// ============================================================
//  IMPERIUM — Épocas antigas (1500 e 1700)
//  Mapa da época, capitais, governantes reais e o que se pode
//  escolher no cadastro em cada ano.
// ============================================================
'use strict';

// ---------------- O mapa de 1500 e 1700 ----------------
Object.assign(ERA_GEO, {
  1500:{
    into:{AUT:'DEU', CZE:'DEU', NLD:'DEU', BEL:'DEU', SVN:'DEU', SVK:'HUN', HRV:'HUN', LTU:'POL', BLR:'POL', UKR:'POL',
      SWE:'DNK', NOR:'DNK', FIN:'DNK', ISL:'DNK', EST:'G:livonia', LVA:'G:livonia', KAZ:'G:cazaques',
      GRC:'TUR', BGR:'TUR', SRB:'TUR', BIH:'TUR', MKD:'TUR', ALB:'TUR', MNE:'TUR', KOS:'TUR', ROU:'TUR', MDA:'TUR', CYP:'ITA', CYN:'ITA', IRL:'GBR',
      SYR:'EGY', LBN:'EGY', ISR:'EGY', JOR:'EGY', SAU:'EGY', IRQ:'IRN', AZE:'IRN', ARM:'IRN',
      UZB:'G:timuridas', TJK:'G:timuridas', TKM:'G:timuridas', KGZ:'G:timuridas', AFG:'G:timuridas', PAK:'IND', BGD:'IND', PRK:'KOR', TLS:'IDN',
      LBY:'TUN', ERI:'ETH', NER:'MLI', COG:'AGO', TZA:'G:quiloa', KEN:'G:quiloa', DJI:'SOM', SOL:'SOM', ARE:'OMN', QAT:'OMN', KWT:'OMN',
      PER:'G:inca', ECU:'G:inca', BOL:'G:inca', GTM:'G:maia', BLZ:'G:maia', DOM:'ESP', HTI:'ESP'},
    absent:'TTO MUS GNB USA CAN MEX BRA ARG CHL COL VEN GUY SUR PRY URY CUB JAM BHS PAN CRI NIC HND SLV AUS NZL PNG FJI SLB VUT NCL PHL TWN ZAF NAM BWA ZMB MWI MOZ LSO SWZ MDG COD CAF CMR GAB GNQ TCD SDS UGA RWA BDI SEN MRT GIN GMB SLE LBR CIV BFA GHA TGO BEN SAH GRL',
    groups:{livonia:{name:'Confederação Livônia', gov:'teocracia', rel:'catolico', cap:['Riga',24.1,56.95], ag:0.2, cult:'de'},
      cazaques:{name:'Canato Cazaque', gov:'monarquia_abs', rel:'islamico', cap:['Turquestão',68.25,43.3], ag:0.5, cult:'turk'},
      timuridas:{name:'Império Timúrida', gov:'monarquia_abs', rel:'islamico', cap:['Herat',62.2,34.35], ag:0.5, cult:'pers'},
      quiloa:{name:'Sultanato de Quíloa', gov:'monarquia_abs', rel:'islamico', cap:['Quíloa',39.5,-8.96], ag:0.2, cult:'afr'},
      vijayanagara:{name:'Império Vijayanagara', gov:'imperio', rel:'hindu', cap:['Vijayanagara',76.47,15.33], ag:0.45, cult:'ind'},
      asteca:{name:'Império Asteca', gov:'imperio', rel:'indigena', cap:['Tenochtitlán',-99.13,19.43], ag:0.7, cult:'hisp'},
      maia:{name:'Cidades-Estado Maias', gov:'teocracia', rel:'indigena', cap:['Utatlán',-91.15,15.02], ag:0.3, cult:'hisp'},
      inca:{name:'Império Inca', gov:'imperio', rel:'indigena', cap:['Cusco',-71.97,-13.53], ag:0.6, cult:'hisp'}},
    boxes:[{from:'RUS', to:'ABSENT', box:[60,0,180,90]}, {from:'RUS', to:'ABSENT', box:[30,40,60,51]},
      {from:'IND', to:'G:vijayanagara', box:[70,5,90,16.5]}, {from:'CHN', to:'ABSENT', box:[70,0,98,60]}, {from:'CHN', to:'ABSENT', box:[119,41.5,140,60]},
      {from:'MEX', to:'G:asteca', box:[-104,15,-94,22]}, {from:'MEX', to:'G:maia', box:[-92.5,14,-86,22]},
      {from:'CHL', to:'G:inca', box:[-76,-35,-66,-17]}, {from:'ARG', to:'G:inca', box:[-70,-33,-64,-21]}],
    rename:{'Espanha':{name:'Coroas de Castela e Aragão', gov:'monarquia_abs'}, 'Portugal':{name:'Reino de Portugal', gov:'monarquia_abs'}, 'França':{name:'Reino da França', gov:'monarquia_abs'},
      'Reino Unido':{name:'Reino da Inglaterra', gov:'monarquia_abs'}, 'Alemanha':{name:'Sacro Império Romano-Germânico', gov:'imperio', rel:'catolico'}, 'Itália':{name:'Estados Italianos', gov:'monarquia_abs', rel:'catolico'},
      'Hungria':{name:'Reino da Hungria', gov:'monarquia_abs'}, 'Polônia':{name:'Polônia-Lituânia', gov:'monarquia_abs', rel:'catolico'}, 'Rússia':{name:'Grão-Ducado de Moscou', gov:'monarquia_abs'},
      'Dinamarca':{name:'União de Kalmar', gov:'monarquia_abs', rel:'catolico'}, 'Turquia':{name:'Império Otomano', gov:'imperio'}, 'Egito':{name:'Sultanato Mameluco', gov:'monarquia_abs'},
      'Irã':{name:'Pérsia', gov:'monarquia_abs', rel:'xiita'}, 'Índia':{name:'Sultanato de Délhi', gov:'monarquia_abs', rel:'islamico'}, 'China':{name:'Dinastia Ming', gov:'imperio', rel:'confucionismo'},
      'Mongólia':{name:'Yuan do Norte', gov:'monarquia_abs'}, 'Japão':{name:'Xogunato Ashikaga', gov:'monarquia_abs'}, 'Coreia':{name:'Reino Joseon', gov:'monarquia_abs', rel:'confucionismo'},
      'Tailândia':{name:'Reino de Ayutthaya', gov:'monarquia_abs'}, 'Vietnã':{name:'Đại Việt', gov:'monarquia_abs'}, 'Camboja':{name:'Império Khmer', gov:'monarquia_abs'}, 'Laos':{name:'Lan Xang', gov:'monarquia_abs'},
      'Myanmar':{name:'Reino de Ava', gov:'monarquia_abs'}, 'Malásia':{name:'Sultanato de Malaca', gov:'monarquia_abs'}, 'Indonésia':{name:'Império Majapahit', gov:'imperio', rel:'hindu'},
      'Sri Lanka':{name:'Reino de Kotte', gov:'monarquia_abs'}, 'Nepal':{gov:'monarquia_abs'}, 'Geórgia':{name:'Reino da Geórgia', gov:'monarquia_abs'},
      'Marrocos':{name:'Sultanato Wattasida', gov:'monarquia_abs'}, 'Argélia':{name:'Reino de Tlemcen', gov:'monarquia_abs'}, 'Tunísia':{name:'Sultanato Hafsida', gov:'monarquia_abs'},
      'Sudão':{name:'Sultanato de Sennar', gov:'monarquia_abs', rel:'islamico'}, 'Etiópia':{name:'Império Etíope', gov:'monarquia_abs'}, 'Mali':{name:'Império Songai', gov:'imperio', rel:'islamico'},
      'Nigéria':{name:'Reino do Benin e Estados Hauçás', gov:'monarquia_abs'}, 'Chade':{name:'Império Kanem-Bornu', gov:'monarquia_abs'}, 'Angola':{name:'Reino do Congo', gov:'monarquia_abs', rel:'catolico'},
      'Zimbábue':{name:'Reino de Mutapa', gov:'monarquia_abs', rel:'tradicional_africana'}, 'Somália':{name:'Sultanato de Adal', gov:'monarquia_abs'}, 'Omã':{name:'Imamato de Omã', gov:'teocracia'}, 'Iêmen':{name:'Sultanato Tahirida', gov:'monarquia_abs'},
      'Suíça':{name:'Confederação Suíça', gov:'republica'}}
  },
  1700:{
    into:{LTU:'POL', BLR:'POL', UKR:'POL', FIN:'SWE', EST:'SWE', LVA:'SWE', NOR:'DNK', ISL:'DNK', GRL:'DNK', KAZ:'G:cazaques',
      UZB:'G:asia_central', TJK:'G:asia_central', TKM:'G:asia_central', KGZ:'G:asia_central',
      CZE:'AUT', HUN:'AUT', SVK:'AUT', SVN:'AUT', HRV:'AUT', BEL:'ESP', IRL:'GBR',
      GRC:'TUR', BGR:'TUR', ROU:'TUR', SRB:'TUR', BIH:'TUR', MKD:'TUR', ALB:'TUR', MNE:'TUR', KOS:'TUR', MDA:'TUR', CYP:'TUR', CYN:'TUR', SYR:'TUR', IRQ:'TUR', LBN:'TUR', ISR:'TUR', JOR:'TUR',
      EGY:'TUR', LBY:'TUR', TUN:'TUR', DZA:'TUR', SAU:'TUR', GEO:'IRN', ARM:'IRN', AZE:'IRN', AFG:'IRN', PAK:'IND', BGD:'IND', MNG:'CHN', TWN:'CHN', PRK:'KOR', PHL:'ESP', TLS:'PRT',
      ERI:'ETH', NER:'TCD', KEN:'OMN', TZA:'OMN', ARE:'OMN', QAT:'OMN', KWT:'OMN', GHA:'G:ashanti', AGO:'PRT', MOZ:'PRT', GNB:'PRT',
      MEX:'ESP', GTM:'ESP', BLZ:'ESP', HND:'ESP', SLV:'ESP', NIC:'ESP', CRI:'ESP', PAN:'ESP', CUB:'ESP', DOM:'ESP', HTI:'FRA', JAM:'GBR',
      TTO:'ESP', VEN:'ESP', COL:'ESP', ECU:'ESP', PER:'ESP', BOL:'ESP', CHL:'ESP', ARG:'ESP', PRY:'ESP', URY:'ESP', BRA:'PRT', GUY:'NLD', SUR:'NLD'},
    absent:'MUS USA CAN AUS NZL PNG FJI SLB VUT NCL ZAF NAM BWA ZMB MWI LSO SWZ MDG CAF CMR GAB GNQ COG SDS SEN MRT GIN GMB SLE LBR CIV BFA TGO SAH SOM SOL DJI BHS',
    groups:{cazaques:{name:'Canato Cazaque', gov:'monarquia_abs', rel:'islamico', cap:['Turquestão',68.25,43.3], ag:0.5, cult:'turk'},
      asia_central:{name:'Canatos de Bucara e Khiva', gov:'monarquia_abs', rel:'islamico', cap:['Bucara',64.42,39.77], ag:0.45, cult:'turk'},
      ashanti:{name:'Império Axânti', gov:'monarquia_abs', rel:'tradicional_africana', cap:['Kumasi',-1.62,6.69], ag:0.5, cult:'afr'},
      colonias:{name:'Treze Colônias', gov:'monarquia_const', rel:'protestante', cap:['Boston',-71.06,42.36], ag:0.3, cult:'anglo', flag:presetFlagSafe('Reino Unido')},
      nova_franca:{name:'Nova França', gov:'monarquia_abs', rel:'catolico', cap:['Quebec',-71.21,46.81], ag:0.3, cult:'fr'}},
    boxes:[{from:'USA', to:'G:colonias', box:[-82,31,-66,46]}, {from:'USA', to:'ESP', box:[-88,24.5,-79.8,31]}, {from:'PRI', to:'ESP', box:[-68,17,-65,19]},
      {from:'CAN', to:'G:nova_franca', box:[-80,44,-60,50]}, {from:'ARG', to:'ABSENT', box:[-75,-60,-50,-38]}, {from:'CHL', to:'ABSENT', box:[-80,-60,-60,-38]},
      {from:'ZAF', to:'NLD', box:[17,-35,21,-32]}, {from:'IDN', to:'NLD', box:[94,-11,142,6]}],
    rename:{'Espanha':{name:'Império Espanhol', gov:'monarquia_abs'}, 'Portugal':{name:'Império Português', gov:'monarquia_abs'}, 'França':{name:'Reino da França', gov:'monarquia_abs'},
      'Reino Unido':{name:'Reino da Inglaterra', gov:'monarquia_const'}, 'Holanda':{name:'Províncias Unidas', gov:'republica'}, 'Alemanha':{name:'Brandemburgo-Prússia', gov:'monarquia_abs'},
      'Áustria':{name:'Monarquia de Habsburgo', gov:'monarquia_abs', flag:AUSTRIA_FLAG}, 'Itália':{name:'Estados Italianos', gov:'monarquia_abs'}, 'Escandinávia':{name:'Império Sueco', gov:'monarquia_abs'},
      'Dinamarca':{name:'Dinamarca-Noruega', gov:'monarquia_abs'}, 'Polônia':{name:'República das Duas Nações', gov:'monarquia_const', rel:'catolico'}, 'Rússia':{name:'Czarado da Rússia', gov:'monarquia_abs'},
      'Turquia':{name:'Império Otomano', gov:'imperio'}, 'Irã':{name:'Pérsia Safávida', gov:'monarquia_abs', rel:'xiita'}, 'Índia':{name:'Império Mogol', gov:'imperio', rel:'islamico'},
      'China':{name:'Império Qing', gov:'imperio', rel:'confucionismo'}, 'Japão':{name:'Xogunato Tokugawa', gov:'monarquia_abs'}, 'Coreia':{name:'Reino Joseon', gov:'monarquia_abs', rel:'confucionismo'},
      'Tailândia':{name:'Reino de Ayutthaya', gov:'monarquia_abs'}, 'Myanmar':{name:'Reino de Toungoo', gov:'monarquia_abs'}, 'Vietnã':{name:'Đại Việt', gov:'monarquia_abs'}, 'Camboja':{name:'Reino do Camboja', gov:'monarquia_abs'},
      'Laos':{name:'Lan Xang', gov:'monarquia_abs'}, 'Malásia':{name:'Sultanato de Johor', gov:'monarquia_abs'}, 'Indonésia':{name:'Sultanatos de Java e Sumatra', gov:'monarquia_abs'},
      'Sri Lanka':{name:'Reino de Kandy', gov:'monarquia_abs'}, 'Nepal':{gov:'monarquia_abs'}, 'Marrocos':{name:'Sultanato de Marrocos', gov:'monarquia_abs'}, 'Etiópia':{name:'Império Etíope', gov:'monarquia_abs'},
      'Sudão':{name:'Sultanato de Sennar', gov:'monarquia_abs', rel:'islamico'}, 'Chade':{name:'Império Kanem-Bornu', gov:'monarquia_abs'}, 'Nigéria':{name:'Império Oió', gov:'monarquia_abs', rel:'tradicional_africana'},
      'Mali':{name:'Império Bambara', gov:'monarquia_abs', rel:'tradicional_africana'}, 'Benin':{name:'Reino do Daomé', gov:'monarquia_abs', rel:'tradicional_africana'}, 'Congo':{name:'Reinos Luba e Lunda', gov:'monarquia_abs', rel:'tradicional_africana'},
      'Zimbábue':{name:'Império Rozvi', gov:'monarquia_abs', rel:'tradicional_africana'}, 'Uganda':{name:'Reino de Buganda', gov:'monarquia_abs', rel:'tradicional_africana'}, 'Ruanda':{name:'Reino de Ruanda', gov:'monarquia_abs', rel:'tradicional_africana'},
      'Burundi':{name:'Reino do Burundi', gov:'monarquia_abs', rel:'tradicional_africana'}, 'Omã':{name:'Imamato de Omã', gov:'teocracia'}, 'Iêmen':{name:'Imamato do Iêmen', gov:'teocracia'}, 'Suíça':{name:'Confederação Suíça', gov:'republica'}}
  }
});
Object.assign(ERA_CAPS, {
  1500:{ESP:['Toledo',-4.02,39.86], DEU:['Viena',16.37,48.21], HUN:['Buda',19.04,47.5], POL:['Cracóvia',19.94,50.06], RUS:['Moscou',37.62,55.75], DNK:['Copenhague',12.57,55.68], TUR:['Constantinopla',28.98,41.01],
    EGY:['Cairo',31.24,30.04], IRN:['Tabriz',46.29,38.08], IND:['Délhi',77.21,28.61], CHN:['Pequim',116.39,39.91], JPN:['Quioto',135.77,35.01], KOR:['Hanseong',126.98,37.57], MLI:['Gao',-0.04,16.27],
    NGA:['Benin',5.62,6.34], ETH:['Debre Berhan',39.53,9.68], MAR:['Fez',-5.0,34.03], TUN:['Túnis',10.18,36.81], DZA:['Tlemcen',-1.31,34.88], ZWE:['Mutapa',31.0,-16.5], AGO:['Mbanza Kongo',14.25,-6.27],
    SOM:['Harar',42.12,9.31], VNM:['Thăng Long',105.85,21.03], THA:['Ayutthaya',100.57,14.35], MMR:['Ava',95.98,21.85], MYS:['Malaca',102.25,2.19], IDN:['Trowulan',112.38,-7.56], MNG:['Karakorum',102.84,47.2],
    LAO:['Luang Prabang',102.13,19.89], KHM:['Angkor',103.87,13.41], LKA:['Kotte',79.9,6.89], GBR:['Londres',-0.13,51.51], FRA:['Paris',2.35,48.86], PRT:['Lisboa',-9.14,38.72], ITA:['Roma',12.5,41.9],
    TCD:['Ngazargamu',13.58,13.12], SDN:['Sennar',33.6,13.55], YEM:['Zabid',43.32,14.2], OMN:['Nizwa',57.53,22.93]},
  1700:{ESP:['Madri',-3.7,40.42], DEU:['Berlim',13.4,52.52], AUT:['Viena',16.37,48.21], NLD:['Haia',4.3,52.08], SWE:['Estocolmo',18.07,59.33], DNK:['Copenhague',12.57,55.68], RUS:['Moscou',37.62,55.75],
    POL:['Varsóvia',21.01,52.23], TUR:['Constantinopla',28.98,41.01], IRN:['Isfahan',51.67,32.65], IND:['Délhi',77.21,28.61], CHN:['Pequim',116.39,39.91], JPN:['Edo',139.69,35.69], KOR:['Hanseong',126.98,37.57],
    THA:['Ayutthaya',100.57,14.35], MMR:['Ava',95.98,21.85], VNM:['Thăng Long',105.85,21.03], MAR:['Meknès',-5.55,33.9], ETH:['Gondar',37.47,12.6], NGA:['Oió',4.08,8.94], MLI:['Ségou',-6.26,13.44],
    SDN:['Sennar',33.6,13.55], OMN:['Mascate',58.59,23.61], YEM:['Saná',44.21,15.35], COD:['Musumba',22.5,-8.5], BEN:['Abomé',1.99,7.18], ZWE:['Danangombe',29.36,-19.6], UGA:['Mengo',32.56,0.3],
    LKA:['Kandy',80.64,7.29], MYS:['Johor',103.94,1.6], IDN:['Mataram',110.4,-7.8], LAO:['Vientiane',102.6,17.97], KHM:['Oudong',104.75,11.82], TCD:['Ngazargamu',13.58,13.12], GBR:['Londres',-0.13,51.51],
    FRA:['Versalhes',2.13,48.8], PRT:['Lisboa',-9.14,38.72], ITA:['Roma',12.5,41.9], CHE:['Berna',7.45,46.95]}
});

// ---------------- Governantes reais de 1500 a 1850 ----------------
const EARLY_LEADERS = {
  'França':[[1498,'Luís XII','Rei',1462],[1515,'Francisco I','Rei',1494],[1547,'Henrique II','Rei',1519],[1559,'Francisco II','Rei',1544],[1560,'Carlos IX','Rei',1550],[1574,'Henrique III','Rei',1551],[1589,'Henrique IV','Rei',1553],
    [1610,'Luís XIII','Rei',1601],[1643,'Luís XIV','Rei',1638],[1715,'Luís XV','Rei',1710],[1774,'Luís XVI','Rei',1754],[1792,null],[1799,'Napoleão Bonaparte','Primeiro Cônsul',1769],[1804,'Napoleão I','Imperador',1769],
    [1814,'Luís XVIII','Rei',1755],[1824,'Carlos X','Rei',1757],[1830,'Luís Filipe I','Rei',1773],[1848,'Luís Napoleão Bonaparte','Presidente',1808]],
  'Espanha':[[1479,'Isabel I e Fernando II','Reis Católicos',1451],[1504,'Fernando II','Rei',1452],[1516,'Carlos I','Rei',1500],[1556,'Filipe II','Rei',1527],[1598,'Filipe III','Rei',1578],[1621,'Filipe IV','Rei',1605],
    [1665,'Carlos II','Rei',1661],[1701,'Filipe V','Rei',1683],[1746,'Fernando VI','Rei',1713],[1759,'Carlos III','Rei',1716],[1788,'Carlos IV','Rei',1748],[1808,'José Bonaparte','Rei',1768],[1813,'Fernando VII','Rei',1784],[1833,'Isabel II','Rainha',1830]],
  'Portugal':[[1495,'Manuel I','Rei',1469],[1521,'João III','Rei',1502],[1557,'Sebastião I','Rei',1554],[1578,'Henrique I','Rei',1512],[1580,'Filipe I','Rei',1527],[1598,'Filipe II','Rei',1578],[1621,'Filipe III','Rei',1605],
    [1640,'João IV','Rei',1604],[1656,'Afonso VI','Rei',1643],[1683,'Pedro II','Rei',1648],[1706,'João V','Rei',1689],[1750,'José I','Rei',1714],[1777,'Maria I','Rainha',1734],[1816,'João VI','Rei',1767],[1826,'Maria II','Rainha',1819],
    [1853,'Pedro V','Rei',1837],[1861,'Luís I','Rei',1838],[1889,'Carlos I','Rei',1863],[1908,'Manuel II','Rei',1889],[1910,null]],
  'Reino Unido':[[1485,'Henrique VII','Rei',1457],[1509,'Henrique VIII','Rei',1491],[1547,'Eduardo VI','Rei',1537],[1553,null],[1558,'Isabel I','Rainha',1533],[1603,'Jaime I','Rei',1566],[1625,'Carlos I','Rei',1600],
    [1649,null],[1660,'Carlos II','Rei',1630],[1685,'Jaime II','Rei',1633],[1689,'Guilherme III e Maria II','Reis',1650],[1702,'Ana','Rainha',1665],[1714,'Jorge I','Rei',1660],[1727,'Jorge II','Rei',1683],
    [1760,'Jorge III','Rei',1738],[1820,'Jorge IV','Rei',1762],[1830,'Guilherme IV','Rei',1765],[1837,'Vitória','Rainha',1819]],
  'Rússia':[[1462,'Ivan III','Grão-Príncipe',1440],[1505,'Vasili III','Grão-Príncipe',1479],[1533,null],[1584,'Fiódor I','Czar',1557],[1598,'Bóris Godunov','Czar',1552],[1605,null],[1613,'Miguel I','Czar',1596],
    [1645,'Aleixo I','Czar',1629],[1676,'Fiódor III','Czar',1661],[1682,'Pedro I','Czar',1672],[1725,'Catarina I','Imperatriz',1684],[1727,'Pedro II','Imperador',1715],[1730,'Ana','Imperatriz',1693],
    [1741,'Isabel','Imperatriz',1709],[1762,'Catarina II','Imperatriz',1729],[1796,'Paulo I','Imperador',1754],[1801,'Alexandre I','Imperador',1777],[1825,'Nicolau I','Czar',1796]],
  'Áustria':[[1493,'Maximiliano I','Imperador',1459],[1519,'Carlos V','Imperador',1500],[1556,'Fernando I','Imperador',1503],[1564,'Maximiliano II','Imperador',1527],[1576,'Rodolfo II','Imperador',1552],
    [1612,'Matias','Imperador',1557],[1619,'Fernando II','Imperador',1578],[1637,'Fernando III','Imperador',1608],[1657,'Leopoldo I','Imperador',1640],[1705,'José I','Imperador',1678],[1711,'Carlos VI','Imperador',1685],
    [1740,'Maria Teresa','Imperatriz',1717],[1780,'José II','Imperador',1741],[1790,'Leopoldo II','Imperador',1747],[1792,'Francisco I','Imperador',1768],[1835,'Fernando I','Imperador',1793],[1848,'Francisco José I','Imperador',1830]],
  'Alemanha':[[1493,'Maximiliano I','Imperador',1459],[1519,'Carlos V','Imperador',1500],[1556,'Fernando I','Imperador',1503],[1564,'Maximiliano II','Imperador',1527],[1576,'Rodolfo II','Imperador',1552],[1612,'Matias','Imperador',1557],
    [1619,'Fernando II','Imperador',1578],[1640,'Frederico Guilherme','Eleitor',1620],[1688,'Frederico I','Rei',1657],[1713,'Frederico Guilherme I','Rei',1688],[1740,'Frederico II, o Grande','Rei',1712],
    [1786,'Frederico Guilherme II','Rei',1744],[1797,'Frederico Guilherme III','Rei',1770],[1840,'Frederico Guilherme IV','Rei',1795]],
  'Turquia':[[1481,'Bayezid II','Sultão',1447],[1512,'Selim I','Sultão',1470],[1520,'Suleiman, o Magnífico','Sultão',1494],[1566,'Selim II','Sultão',1524],[1574,'Murad III','Sultão',1546],[1595,'Mehmed III','Sultão',1566],
    [1603,'Ahmed I','Sultão',1590],[1617,'Mustafa I','Sultão',1591],[1618,'Osman II','Sultão',1604],[1623,'Murad IV','Sultão',1612],[1640,'Ibrahim I','Sultão',1615],[1648,'Mehmed IV','Sultão',1642],[1687,'Suleiman II','Sultão',1642],
    [1691,'Ahmed II','Sultão',1643],[1695,'Mustafa II','Sultão',1664],[1703,'Ahmed III','Sultão',1673],[1730,'Mahmud I','Sultão',1696],[1754,'Osman III','Sultão',1699],[1757,'Mustafa III','Sultão',1717],
    [1774,'Abdul Hamid I','Sultão',1725],[1789,'Selim III','Sultão',1761],[1807,'Mustafa IV','Sultão',1779],[1808,'Mahmud II','Sultão',1785],[1839,'Abdulmecid I','Sultão',1823]],
  'China':[[1487,'Hongzhi','Imperador',1470],[1505,'Zhengde','Imperador',1491],[1521,'Jiajing','Imperador',1507],[1567,'Longqing','Imperador',1537],[1572,'Wanli','Imperador',1563],[1620,'Tianqi','Imperador',1605],
    [1627,'Chongzhen','Imperador',1611],[1644,'Shunzhi','Imperador',1638],[1661,'Kangxi','Imperador',1654],[1722,'Yongzheng','Imperador',1678],[1735,'Qianlong','Imperador',1711],[1796,'Jiaqing','Imperador',1760],[1820,'Daoguang','Imperador',1782]],
  'Japão':[[1495,'Ashikaga Yoshizumi','Xogum',1481],[1508,'Ashikaga Yoshitane','Xogum',1466],[1521,'Ashikaga Yoshiharu','Xogum',1511],[1546,'Ashikaga Yoshiteru','Xogum',1536],[1565,null],[1585,'Toyotomi Hideyoshi','Regente',1537],
    [1598,null],[1603,'Tokugawa Ieyasu','Xogum',1543],[1605,'Tokugawa Hidetada','Xogum',1579],[1623,'Tokugawa Iemitsu','Xogum',1604],[1651,'Tokugawa Ietsuna','Xogum',1641],[1680,'Tokugawa Tsunayoshi','Xogum',1646],
    [1709,'Tokugawa Ienobu','Xogum',1662],[1713,'Tokugawa Ietsugu','Xogum',1709],[1716,'Tokugawa Yoshimune','Xogum',1684],[1745,'Tokugawa Ieshige','Xogum',1712],[1760,'Tokugawa Ieharu','Xogum',1737],
    [1787,'Tokugawa Ienari','Xogum',1773],[1837,'Tokugawa Ieyoshi','Xogum',1793]],
  'Índia':[[1489,'Sikandar Lodi','Sultão',1458],[1517,'Ibrahim Lodi','Sultão',1480],[1526,'Babur','Imperador',1483],[1530,'Humayun','Imperador',1508],[1540,null],[1555,'Humayun','Imperador',1508],[1556,'Akbar','Imperador',1542],
    [1605,'Jahangir','Imperador',1569],[1627,'Shah Jahan','Imperador',1592],[1658,null],[1707,'Bahadur Shah I','Imperador',1643],[1712,null],[1774,'Warren Hastings','Governador-geral',1732],
    [1786,'Lorde Cornwallis','Governador-geral',1738],[1798,'Lorde Wellesley','Governador-geral',1760],[1805,null],[1828,'Lorde William Bentinck','Governador-geral',1774],[1835,null],[1848,'Lorde Dalhousie','Governador-geral',1812]],
  'Irã':[[1501,'Ismail I','Xá',1487],[1524,'Tahmasp I','Xá',1514],[1576,'Ismail II','Xá',1537],[1578,'Mohammad Khodabanda','Xá',1532],[1588,'Abbas, o Grande','Xá',1571],[1629,'Safi','Xá',1611],[1642,'Abbas II','Xá',1632],
    [1666,'Solimão I','Xá',1648],[1694,'Sultan Husayn','Xá',1668],[1722,null],[1751,'Karim Khan Zand','Regente',1705],[1779,null],[1797,'Fath Ali Xá','Xá',1772],[1834,'Mohammad Xá','Xá',1808]],
  'Brasil':[[1822,'Dom Pedro I','Imperador',1798],[1831,null],[1840,'Dom Pedro II','Imperador',1825]]
};
for (const [k, list] of Object.entries(EARLY_LEADERS)){
  const cur = REAL_LEADERS[k] || [], first = cur.length ? cur[0][0] : 9999;
  REAL_LEADERS[k] = list.filter(e => e[0] < first).concat(cur);
}

// ---------------- O que existe em cada época (cadastro e reformas) ----------------
const GOV_FROM = {democracia:1688, monarquia_const:1688, federacao:1787, ditadura:1799, comunismo:1917, tecnocracia:1990};
const ECON_FROM = {capitalismo:1776, misto:1914, planificada:1917};
const REL_FROM = {espirita:1857, bahai:1863, ateu:1917, evangelico:1730};
const govOk = (k, year) => year >= (GOV_FROM[k] || 0);
const econOk = (k, year) => year >= (ECON_FROM[k] || 0);
const relOk = (k, year) => year >= (REL_FROM[k] || 0);
const filterByYear = (obj, ok, year) => Object.fromEntries(Object.entries(obj).filter(([k]) => ok(k, year)));
function fixCfgForEra(c){
  const y = ERAS[c.era].year;
  if (!govOk(c.gov, y)) { c.gov = y < 1688 ? 'monarquia_abs' : 'monarquia_const'; c.title = GOVS[c.gov].title; }
  if (!econOk(c.econ, y)) c.econ = 'mercantilismo';
  if (!relOk(c.religion, y)) c.religion = 'catolico';
}
