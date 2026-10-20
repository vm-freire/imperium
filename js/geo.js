// ============================================================
//  IMPERIUM — Geografia dos desastres naturais
//  (placas tectônicas, vulcões, rotas de furacões...)
// ============================================================
'use strict';

const TECTONIC = [
  // Círculo de Fogo do Pacífico
  [[-74,-52],[-72,-35],[-71,-25],[-76,-12],[-80,-2],[-78,6],[-86,12],[-92,15],[-104,19],[-112,27],[-118,34],[-124,41],[-128,50],[-140,59],[-152,58],[-165,54],[-180,51]],
  [[180,51],[170,54],[160,52],[156,50],[150,46],[144,42],[141,37],[138,34],[132,32],[127,28],[122,24],[121,17],[124,10],[126,5],[127,0],[120,-8],[110,-9],[102,-6],[96,2],[94,8]],
  [[178,-38],[175,-30],[178,-20],[176,-15],[168,-15],[160,-8],[150,-6],[142,-4],[136,-3]],
  // Cinturão Alpino-Himalaio
  [[-10,36],[-2,36.5],[8,37],[15,38],[16,40],[20,40],[24,38],[28,37],[35,37],[42,39],[46,38],[52,34],[57,29],[62,30],[66,31],[70,35],[74,36],[80,30],[86,28],[92,27],[96,26],[98,22]],
  // Caribe, dorsal atlântica e Islândia, rifte africano
  [[-88,15],[-78,18],[-66,18],[-61,14]],
  [[-18,65],[-25,55],[-30,40],[-27,25],[-15,5],[-15,-15]],
  [[39,14],[40,9],[37,3],[35,-3],[33,-10],[34,-15]]
];
const VOLCANOES = [[14.4,40.8],[15,37.7],[-19,64],[139,35.4],[130.7,31.6],[121,14],[110.4,-7.5],[115.5,-8.3],[-98.6,19],[-122,46.2],[-155,19.4],[-78.4,-0.7],[-71.5,-16.3],[37.4,-3.1],[42,12],[176,-38.8],[160,56],[-61,16],[-90.9,14.4],[-86.2,12.4],[28,38],[25.4,36.4]];

function distToSeg(px, py, ax, ay, bx, by){
  const dx = bx-ax, dy = by-ay, l2 = dx*dx+dy*dy; let t = l2 ? ((px-ax)*dx + (py-ay)*dy)/l2 : 0; t = clamp(t, 0, 1);
  return Math.hypot(px - (ax+t*dx), py - (ay+t*dy));
}
function geoProfile(){
  const p = G.p;
  if (p.geo && G.turn - p.geo.t < 12 && p.geo.cells === G.nations[1].cells) return p.geo;
  const own = []; for (let i=0;i<NCELLS;i++) if (Grid.land[i] && Grid.owner[i]===1) own.push(i);
  const step = Math.max(1, Math.floor(own.length/250)), sample = own.filter((_,k)=>k%step===0);
  let seis = 99, volc = 99, coast = 0, tropCoast = 0, hurr = 0, forest = 0, arid = 0, cold = 0, locust = 0;
  for (const c of sample){
    const [lo, la] = cellCenter(c);
    for (const line of TECTONIC) for (let k=0;k<line.length-1;k++){ const d = distToSeg(lo, la, line[k][0], line[k][1], line[k+1][0], line[k+1][1]); if (d < seis) seis = d; }
    for (const v of VOLCANOES){ const d = Math.hypot(lo-v[0], la-v[1]); if (d < volc) volc = d; }
    const co = isCoastal(c); if (co) coast++;
    const a = Math.abs(la);
    if (co && a >= 8 && a <= 32){ tropCoast++; if ((lo > -100 && lo < -55 && la > 0) || (lo > 105 && lo < 150 && la > 0) || (lo > 80 && lo < 95 && la > 10) || (la < 0 && lo > 110 && lo < 160)) hurr++; }
    for (const [fl, fa, fr] of FORESTS) if (Math.hypot(lo-fl, la-fa) < fr){ forest++; break; }
    if (a > 15 && a < 35) arid++;
    if (a > 52) cold++;
    if (la > 0 && la < 35 && lo > -20 && lo < 80) locust++;
  }
  const n = Math.max(1, sample.length);
  p.geo = {t:G.turn, cells:G.nations[1].cells, seismic:seis, volcanic:volc, coast:coast/n, tropCoast:tropCoast/n, hurricane:hurr/n, forest:forest/n, arid:arid/n, cold:cold/n, locust:locust/n};
  return p.geo;
}
// peso dos desastres conforme a geografia real do país
function disasterWeight(kind){
  const g = geoProfile(), p = G.p;
  switch (kind){
    case 'terremoto': return g.seismic < 3 ? 1.0 : g.seismic < 7 ? 0.35 : 0;
    case 'tsunami': return g.seismic < 5 && g.coast > 0.15 ? 0.35 : 0;
    case 'vulcao': return g.volcanic < 3 ? 0.4 : g.volcanic < 6 ? 0.12 : 0;
    case 'furacao': return g.hurricane > 0.05 ? 0.8 : g.tropCoast > 0.1 ? 0.15 : 0;
    case 'seca': return (p.climate==='arido' || p.terrain==='desertico' ? 0.8 : 0) + g.arid*0.8 + (p.realClimate==='arido'?0.3:0);
    case 'inundacao': return (p.resources.includes('agua') ? 0.4 : 0) + (p.realClimate==='tropical' ? 0.4 : 0.1) + g.coast*0.2;
    case 'nevasca': return g.cold > 0.2 ? 0.8 : g.cold > 0.05 ? 0.3 : 0;
    case 'incendio': return g.forest > 0.15 && p.realClimate !== 'frio' ? 0.5 : g.forest > 0.05 ? 0.15 : 0;
    case 'gafanhotos': return g.locust > 0.3 && g.arid > 0.2 ? 0.5 : 0;
  }
  return 0;
}
