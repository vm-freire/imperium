// ============================================================
//  IMPERIUM — Avatar do líder e escudo do partido
//  Desenho em SVG: rosto, olhos, cabelo, barba, marcas,
//  acessórios, roupa, altura e o escudo no peito.
// ============================================================
'use strict';

// ---------------- Opções ----------------
const AV = {
  skin:{n:'Tom de pele', o:{s1:'#fbe3cf', s2:'#f1c7a5', s3:'#dfa77f', s4:'#c08259', s5:'#8f5a3a', s6:'#5e3a25'}},
  face:{n:'Formato do rosto', o:{oval:'Oval', redondo:'Redondo', quadrado:'Quadrado', fino:'Fino', coracao:'Coração'}},
  eyes:{n:'Olhos', o:{normal:'Normais', amendoado:'Amendoados', sonolento:'Sonolentos', arregalado:'Arregalados', fechado:'Sorridentes'}},
  eyeColor:{n:'Cor dos olhos', o:{castanho:'#5b3a1e', preto:'#1c1410', azul:'#3d78b5', verde:'#4c8a4a', mel:'#a8752b', cinza:'#7d8a92'}},
  brows:{n:'Sobrancelhas', o:{normal:'Normais', grossa:'Grossas', fina:'Finas', arqueada:'Arqueadas', franzida:'Franzidas'}},
  nose:{n:'Nariz', o:{medio:'Médio', pequeno:'Pequeno', largo:'Largo', aquilino:'Aquilino'}},
  mouth:{n:'Boca', o:{sorriso:'Sorriso', serio:'Sério', largo:'Sorriso largo', bravo:'Bravo', labios:'Lábios marcados'}},
  hair:{n:'Cabelo', o:{careca:'Careca', raspado:'Raspado', curto:'Curto', topete:'Topete', lateral:'Repartido', calvo:'Calvície', cacheado:'Cacheado', crespo:'Black power', medio:'Médio', longo:'Longo liso', rabo:'Rabo de cavalo', coque:'Coque', trancas:'Tranças', chanel:'Chanel', moicano:'Moicano'}},
  hairColor:{n:'Cor do cabelo', o:{preto:'#1d1612', castanho:'#4a2e1b', claro:'#7b5530', loiro:'#d9b56b', ruivo:'#a8481f', grisalho:'#8d8a85', branco:'#e8e4dc', azul:'#2f5fa8', rosa:'#c9558f'}},
  beard:{n:'Barba e bigode', o:{nenhuma:'Nenhuma', bigode:'Bigode', imperial:'Bigode imperial', cavanhaque:'Cavanhaque', curta:'Barba curta', cheia:'Barba cheia', costeletas:'Costeletas', longa:'Barba longa'}},
  marks:{n:'Marcas', multi:true, o:{sardas:'Sardas', cicatriz:'Cicatriz', pinta:'Pinta', rugas:'Rugas', olheiras:'Olheiras', tapaolho:'Tapa-olho', bochechas:'Bochechas coradas'}},
  glasses:{n:'Óculos', o:{nenhum:'Nenhum', redondo:'Redondos', quadrado:'Quadrados', sol:'De sol', monoculo:'Monóculo'}},
  hat:{n:'Na cabeça', o:{nenhum:'Nada', coroa:'Coroa', tiara:'Tiara', quepe:'Quepe militar', cartola:'Cartola', boina:'Boina', turbante:'Turbante', mitra:'Mitra', capacete:'Capacete', fone:'Fone futurista'}},
  extras:{n:'Acessórios', multi:true, o:{brincos:'Brincos', colar:'Colar', medalhas:'Medalhas', faixa:'Faixa de governante', gravata:'Gravata', laco:'Gravata-borboleta', broche:'Escudo do partido no peito'}},
  outfit:{n:'Roupa', o:{terno:'Terno', uniforme:'Uniforme militar', manto:'Manto real', batina:'Traje religioso', jaleco:'Jaleco técnico', casual:'Camisa casual', vestido:'Vestido formal', tunica:'Túnica', futurista:'Traje futurista'}},
  outfitColor:{n:'Cor da roupa', o:{grafite:'#2f3540', marinho:'#1f3358', vinho:'#6e1f2a', verde:'#2f5233', bege:'#bfa77a', branco:'#ece6d6', preto:'#151515', roxo:'#4f2d6b', dourado:'#b48a2c'}},
  bg:{n:'Fundo', o:{pergaminho:'#e9d9b0', ceu:'#bcd3e6', vinho:'#d8b7b0', verde:'#c4d8bd', noite:'#3a3550', ouro:'#e3c46e'}}
};
const AV_TABS = {rosto:['skin','face','eyes','eyeColor','brows','nose','mouth'], cabelo:['hair','hairColor','beard'], marcas:['marks','glasses','hat','extras'], roupa:['outfit','outfitColor','bg']};
const AV_TAB_N = {rosto:'🙂 Rosto', cabelo:'💇 Cabelo e barba', marcas:'🕶️ Marcas e acessórios', roupa:'👔 Roupa e altura', escudo:'🛡️ Escudo do partido'};

// ---------------- Nomes por sexo ----------------
const FEM_NAMES = new Set(['Beatriz','Diana','Flávia','Helena','Júlia','Marta','Olívia','Quitéria','Sofia','Vitória','Isabel','Leonor','Catarina','Matilde','Amélia','Mary','Elizabeth','Margaret','María','Luisa','Elena','Marie','Claire','Greta','Ingrid','Giulia','Francesca','Anna','Olga','Astrid','Karin','Fatima','Shirin','Ayşe','Zeynep','Priya','Lakshmi','Indira','Mei','Lian','Yuki','Sakura','Naoko','Seo-yeon','Hye-jin','Amara','Ama','Siti','Dewi','Ploy','Saran',
  'Ana','Maria','Clara','Lúcia','Teresa','Joana','Camila','Fernanda','Luíza','Alice','Cecília','Rosa','Inês','Emma','Charlotte','Alice','Carmen','Lucía','Sophie','Hanna','Elsa','Chiara','Natalia','Irina','Layla','Noor','Aiko','Ji-woo','Nia','Zola','Maya','Ingeborg']);
const FEM_EXTRA = {anglo:['Mary','Elizabeth','Margaret','Charlotte','Emma'], hisp:['Isabel','María','Luisa','Elena','Carmen','Lucía'], luso:['Beatriz','Helena','Isabel','Leonor','Catarina','Ana','Clara','Joana'], fr:['Marie','Claire','Sophie','Louise'], de:['Greta','Ingrid','Hanna','Elsa'],
  it:['Giulia','Francesca','Chiara'], slav:['Anna','Olga','Natalia','Irina'], nord:['Ingrid','Astrid','Karin','Ingeborg'], arab:['Fatima','Layla','Noor'], pers:['Shirin'], turk:['Ayşe','Zeynep'], ind:['Priya','Lakshmi','Indira'], chn:['Mei','Lian'],
  jpn:['Yuki','Sakura','Naoko','Aiko'], kor:['Seo-yeon','Hye-jin','Ji-woo'], afr:['Amara','Ama','Nia','Zola'], sea:['Siti','Dewi','Ploy'], mong:['Saran']};
function guessSex(name){
  const parts = String(name||'').trim().split(/\s+/); if (!parts[0]) return 'm';
  for (const p of parts.slice(0, 2)) if (FEM_NAMES.has(p)) return 'f';
  const f = parts[0].toLowerCase();
  if (/(a|ia|na|ra|ne|ie|ette|elle|ine)$/.test(f) && !/(luca|andrea|nicola|costa|garcia|vasco)$/.test(f)) return 'f';
  return 'm';
}
function genNameBySex(cult, sex, rnd){
  rnd = rnd || Math.random; const c = CULTURES[cult] || CULTURES.luso;
  const fem = (FEM_EXTRA[cult] || FEM_EXTRA.luso);
  const pool = sex === 'f' ? fem : c.f.filter(n=>!FEM_NAMES.has(n));
  const f = pool[Math.floor(rnd()*pool.length)] || 'Ana', l = c.l[Math.floor(rnd()*c.l.length)];
  return c.rev ? `${l} ${f}` : `${f} ${l}`;
}

// ---------------- Avatar aleatório ----------------
function seededRng(str){ let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return makeRng((h >>> 0) || 7); }
function randomAvatar(sex, rnd, gov){
  rnd = rnd || Math.random; const pk = (k, list) => { const ks = list || Object.keys(AV[k].o); return ks[Math.floor(rnd()*ks.length)]; };
  const f = sex === 'f';
  const hairM = ['careca','raspado','curto','topete','lateral','calvo','cacheado','crespo','medio'], hairF = ['longo','rabo','coque','trancas','chanel','cacheado','crespo','medio','curto'];
  const fam = gov && GOVS[gov] ? GOVS[gov].family : null;
  const outfit = gov === 'ditadura' ? 'uniforme' : fam === 'mon' && rnd() < 0.6 ? 'manto' : fam === 'teo' ? 'batina' : fam === 'tec' ? 'jaleco' : (f && rnd() < 0.5 ? 'vestido' : 'terno');
  const marks = []; if (rnd() < 0.15) marks.push('sardas'); if (rnd() < 0.1) marks.push('pinta'); if (rnd() < 0.25) marks.push('rugas'); if (rnd() < 0.06) marks.push('cicatriz');
  const extras = []; if (outfit === 'terno' && !f) extras.push(rnd() < 0.85 ? 'gravata' : 'laco'); if (f && rnd() < 0.6) extras.push('brincos'); if (f && rnd() < 0.3) extras.push('colar');
  if (outfit === 'uniforme') extras.push('medalhas'); if (rnd() < 0.35) extras.push('faixa'); if (rnd() < 0.4) extras.push('broche');
  return {sex:f?'f':'m', skin:pk('skin'), face:pk('face'), eyes:pk('eyes', ['normal','amendoado','sonolento','arregalado','normal']), eyeColor:pk('eyeColor'), brows:pk('brows'), nose:pk('nose'), mouth:pk('mouth', ['sorriso','serio','largo','sorriso','labios']),
    hair:pk('hair', f ? hairF : hairM), hairColor:pk('hairColor', ['preto','castanho','claro','loiro','ruivo','grisalho','preto','castanho']),
    beard: f ? 'nenhuma' : pk('beard', ['nenhuma','nenhuma','bigode','imperial','cavanhaque','curta','cheia','costeletas']),
    marks, glasses: rnd() < 0.25 ? pk('glasses', ['redondo','quadrado','redondo','monoculo']) : 'nenhum',
    hat: fam === 'mon' && rnd() < 0.5 ? (f ? 'tiara' : 'coroa') : gov === 'ditadura' && rnd() < 0.6 ? 'quepe' : fam === 'teo' && rnd() < 0.5 ? (rnd() < 0.5 ? 'mitra' : 'turbante') : 'nenhum',
    extras, outfit, outfitColor:pk('outfitColor', ['grafite','marinho','vinho','verde','preto','marinho']), bg:pk('bg'), height: Math.round(f ? 155 + rnd()*22 : 165 + rnd()*25)};
}

// ---------------- Escudo do partido ----------------
const EMB_SHAPES = {escudo:'Escudo', circulo:'Círculo', estrela:'Estrela', losango:'Losango', bandeira:'Flâmula', hexagono:'Hexágono'};
const EMB_SYMS = ['★','🌹','✊','🕊️','🔥','⚙️','🌿','👑','📖','☀️','⚖️','🦅','🌾','⚓','🔬','🤝','🦁','🌐','✝️','☪️','🗽','🐻'];
function defaultEmblem(pt){
  const r = seededRng((pt && pt.name) || 'partido'), cols = ['#b3261e','#1f4e8c','#2d6a2d','#d4a017','#5b2a86','#e07020','#111111','#0f7c8a'];
  const ideo = pt && pt.ideo, c1 = ideo === 'esq' ? '#b3261e' : ideo === 'dir' ? '#1f3f8c' : cols[Math.floor(r()*cols.length)];
  return {shape:['escudo','circulo','estrela','losango','hexagono'][Math.floor(r()*5)], c1, c2: r() < 0.5 ? '#ffffff' : '#f2d36b', sym: EMB_SYMS[Math.floor(r()*EMB_SYMS.length)]};
}
function emblemOf(pt){ if (!pt) return null; if (!pt.emblem) pt.emblem = defaultEmblem(pt); return pt.emblem; }
function emblemPath(shape){
  return {escudo:'M10 8 H90 V48 C90 74 70 88 50 96 C30 88 10 74 10 48 Z', circulo:'M50 6 A44 44 0 1 1 49.9 6 Z', losango:'M50 4 L94 50 L50 96 L6 50 Z', bandeira:'M12 8 H88 V70 L50 94 L12 70 Z',
    hexagono:'M50 4 L92 27 L92 73 L50 96 L8 73 L8 27 Z', estrela:'M50 4 L62 36 L96 37 L69 58 L79 92 L50 72 L21 92 L31 58 L4 37 L38 36 Z'}[shape] || 'M10 8 H90 V48 C90 74 70 88 50 96 C30 88 10 74 10 48 Z';
}
function emblemSVG(em, size){
  if (!em) return ''; size = size || 60;
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><path d="${emblemPath(em.shape)}" fill="${em.c1}" stroke="${em.c2}" stroke-width="5"/><path d="${emblemPath(em.shape)}" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1.5"/><text x="50" y="${em.shape==='escudo'||em.shape==='bandeira'?52:56}" text-anchor="middle" dominant-baseline="middle" font-size="40" fill="${em.c2}">${em.sym}</text></svg>`;
}

// ---------------- Desenho do avatar ----------------
const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); let r = n>>16, g = (n>>8)&255, b = n&255; const f = v => Math.max(0, Math.min(255, Math.round(v*k))); return '#' + ((1<<24) + (f(r)<<16) + (f(g)<<8) + f(b)).toString(16).slice(1); };
function avatarSVG(av, emblem, size){
  if (!av) return ''; size = size || 120;
  const C = k => AV[k].o[av[k]] || Object.values(AV[k].o)[0];
  const skin = C('skin'), skinD = shade(skin, 0.86), hc = C('hairColor'), hcD = shade(hc, 0.75), oc = C('outfitColor'), ocD = shade(oc, 0.78), bg = C('bg');
  const H = clamp(((av.height||172) - 172) / 22, -1, 1);           // altura: muda a posição da cabeça e dos ombros
  const cx = 100, cy = 92 - H*7, sh = 178 - H*3;
  const fw = {oval:36, redondo:40, quadrado:39, fino:32, coracao:37}[av.face] || 36, fh = {oval:44, redondo:41, quadrado:43, fino:47, coracao:44}[av.face] || 44;
  const jaw = av.face === 'quadrado' ? `M${cx-fw} ${cy} V${cy+fh*0.55} Q${cx-fw*0.75} ${cy+fh} ${cx} ${cy+fh} Q${cx+fw*0.75} ${cy+fh} ${cx+fw} ${cy+fh*0.55} V${cy} Z`
    : av.face === 'coracao' ? `M${cx-fw} ${cy-4} Q${cx-fw} ${cy+fh*0.6} ${cx} ${cy+fh} Q${cx+fw} ${cy+fh*0.6} ${cx+fw} ${cy-4} Z` : '';
  const has = (k, v) => (av[k]||[]).includes(v);
  const f = av.sex === 'f';
  let s = `<svg viewBox="0 0 200 220" width="${size}" height="${size*1.1}" xmlns="http://www.w3.org/2000/svg" style="display:block">`;
  s += `<rect width="200" height="220" rx="18" fill="${bg}"/><circle cx="100" cy="95" r="86" fill="${shade(bg,1.06)}"/>`;
  // cabelo de trás (longo)
  const backHair = {longo:`<path d="M${cx-fw-6} ${cy-10} Q${cx-fw-14} ${cy+60} ${cx-fw+2} ${cy+86} H${cx+fw-2} Q${cx+fw+14} ${cy+60} ${cx+fw+6} ${cy-10} Z" fill="${hc}"/>`,
    trancas:`<path d="M${cx-fw-2} ${cy} q-8 40 2 80" stroke="${hc}" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M${cx+fw+2} ${cy} q8 40 -2 80" stroke="${hc}" stroke-width="12" fill="none" stroke-linecap="round"/>`,
    crespo:`<circle cx="${cx}" cy="${cy-12}" r="${fw+20}" fill="${hc}"/>`, cacheado:`<g fill="${hc}">${[-1,-0.5,0,0.5,1].map(t=>`<circle cx="${cx+t*(fw+4)}" cy="${cy-fh*0.62+Math.abs(t)*14}" r="15"/>`).join('')}<circle cx="${cx-fw-4}" cy="${cy+4}" r="12"/><circle cx="${cx+fw+4}" cy="${cy+4}" r="12"/></g>`,
    chanel:`<path d="M${cx-fw-8} ${cy-14} V${cy+34} H${cx+fw+8} V${cy-14} Z" fill="${hc}"/>`, medio:`<path d="M${cx-fw-6} ${cy-14} Q${cx-fw-8} ${cy+30} ${cx-fw+4} ${cy+40} H${cx+fw-4} Q${cx+fw+8} ${cy+30} ${cx+fw+6} ${cy-14} Z" fill="${hc}"/>`,
    rabo:`<path d="M${cx+fw-6} ${cy-20} q34 18 14 74" stroke="${hc}" stroke-width="14" fill="none" stroke-linecap="round"/>`}[av.hair] || '';
  s += backHair;
  // corpo e roupa
  const body = (fill, extra) => `<path d="M${cx-62} 220 Q${cx-60} ${sh-6} ${cx-26} ${sh-16} H${cx+26} Q${cx+60} ${sh-6} ${cx+62} 220 Z" fill="${fill}"/>${extra||''}`;
  s += `<rect x="${cx-12}" y="${cy+fh-8}" width="24" height="${sh-cy-fh-2}" fill="${skinD}"/>`;          // pescoço
  const O = av.outfit;
  if (O === 'terno') s += body(oc, `<path d="M${cx-20} ${sh-16} L${cx} ${sh+26} L${cx+20} ${sh-16} Z" fill="#f4f1ea"/><path d="M${cx-26} ${sh-16} L${cx-6} ${sh+40} L${cx-30} ${sh+20} Z M${cx+26} ${sh-16} L${cx+6} ${sh+40} L${cx+30} ${sh+20} Z" fill="${ocD}"/>`);
  else if (O === 'uniforme') s += body(oc, `<rect x="${cx-62}" y="${sh-14}" width="124" height="6" fill="${shade(oc,1.2)}"/><path d="M${cx-14} ${sh-16} H${cx+14} L${cx} ${sh+6} Z" fill="${ocD}"/><g fill="#d8b24a">${[0,1,2].map(i=>`<circle cx="${cx}" cy="${sh+14+i*14}" r="3"/>`).join('')}</g><rect x="${cx-58}" y="${sh-10}" width="22" height="7" rx="2" fill="#d8b24a"/><rect x="${cx+36}" y="${sh-10}" width="22" height="7" rx="2" fill="#d8b24a"/>`);
  else if (O === 'manto') s += body(oc, `<path d="M${cx-62} 220 Q${cx-58} ${sh-4} ${cx-24} ${sh-14} L${cx-14} 220 Z M${cx+62} 220 Q${cx+58} ${sh-4} ${cx+24} ${sh-14} L${cx+14} 220 Z" fill="#f4f1ea"/><g fill="#222">${[0,1,2,3].map(i=>`<circle cx="${cx-40+i*4}" cy="${sh+10+i*12}" r="1.6"/><circle cx="${cx+40-i*4}" cy="${sh+10+i*12}" r="1.6"/>`).join('')}</g><rect x="${cx-26}" y="${sh-18}" width="52" height="10" rx="5" fill="#d8b24a"/>`);
  else if (O === 'batina') s += body(oc, `<rect x="${cx-10}" y="${sh-18}" width="20" height="8" fill="#f4f1ea"/><path d="M${cx-4} ${sh+10} h8 v14 h10 v8 h-10 v24 h-8 v-24 h-10 v-8 h10 Z" fill="#d8b24a"/>`);
  else if (O === 'jaleco') s += body('#f2f2f0', `<path d="M${cx-20} ${sh-16} L${cx} ${sh+30} L${cx+20} ${sh-16} Z" fill="${oc}"/><rect x="${cx+22}" y="${sh+18}" width="20" height="16" fill="#e3e3e0"/><rect x="${cx+28}" y="${sh+12}" width="3" height="12" fill="#3d78b5"/>`);
  else if (O === 'casual') s += body(oc, `<path d="M${cx-18} ${sh-16} L${cx} ${sh+4} L${cx+18} ${sh-16}" stroke="${ocD}" stroke-width="5" fill="none"/>`);
  else if (O === 'vestido') s += body(oc, `<path d="M${cx-30} ${sh-14} Q${cx} ${sh+22} ${cx+30} ${sh-14}" fill="${skinD}"/>`);
  else if (O === 'tunica') s += body(oc, `<path d="M${cx-26} ${sh-16} Q${cx} ${sh+10} ${cx+26} ${sh-16}" stroke="#d8b24a" stroke-width="4" fill="none"/><path d="M${cx-62} 214 H${cx+62}" stroke="#d8b24a" stroke-width="5"/>`);
  else if (O === 'futurista') s += body(oc, `<path d="M${cx-50} ${sh+4} L${cx} ${sh+30} L${cx+50} ${sh+4}" stroke="#5ff0ff" stroke-width="3" fill="none"/><circle cx="${cx}" cy="${sh+30}" r="6" fill="#5ff0ff"/><path d="M${cx-30} ${sh-16} H${cx+30} V${sh-8} H${cx-30} Z" fill="${ocD}"/>`);
  else s += body(oc);
  if (has('extras','gravata') && (O === 'terno' || O === 'jaleco' || O === 'casual')) s += `<path d="M${cx-5} ${sh-12} H${cx+5} L${cx+7} ${sh+30} L${cx} ${sh+38} L${cx-7} ${sh+30} Z" fill="#8a1c1c"/>`;
  if (has('extras','laco')) s += `<path d="M${cx} ${sh-10} l-12 -6 v12 Z M${cx} ${sh-10} l12 -6 v12 Z" fill="#151515"/>`;
  if (has('extras','faixa')) s += `<path d="M${cx-52} ${sh-4} L${cx+40} 220 L${cx+56} 220 L${cx-38} ${sh-10} Z" fill="#2f7d32"/><path d="M${cx-46} ${sh-6} L${cx+46} 220" stroke="#e6c13a" stroke-width="5"/>`;
  if (has('extras','medalhas')) s += `<g>${[0,1,2].map(i=>`<rect x="${cx-48+i*9}" y="${sh+10}" width="7" height="9" fill="${['#b3261e','#1f4e8c','#2d6a2d'][i]}"/><circle cx="${cx-44.5+i*9}" cy="${sh+24}" r="4" fill="#d8b24a"/>`).join('')}</g>`;
  if (has('extras','colar')) s += `<path d="M${cx-22} ${sh-14} Q${cx} ${sh+12} ${cx+22} ${sh-14}" stroke="#e8d8a0" stroke-width="3" fill="none" stroke-dasharray="1 4" stroke-linecap="round"/>`;
  if (has('extras','broche') && emblem) s += `<g transform="translate(${cx+30} ${sh+6}) scale(0.24)"><path d="${emblemPath(emblem.shape)}" fill="${emblem.c1}" stroke="${emblem.c2}" stroke-width="6"/><text x="50" y="56" text-anchor="middle" dominant-baseline="middle" font-size="44" fill="${emblem.c2}">${emblem.sym}</text></g>`;
  // orelhas e rosto
  s += `<ellipse cx="${cx-fw}" cy="${cy+4}" rx="7" ry="10" fill="${skinD}"/><ellipse cx="${cx+fw}" cy="${cy+4}" rx="7" ry="10" fill="${skinD}"/>`;
  if (has('extras','brincos')) s += `<circle cx="${cx-fw-1}" cy="${cy+15}" r="3.5" fill="#e6c13a"/><circle cx="${cx+fw+1}" cy="${cy+15}" r="3.5" fill="#e6c13a"/>`;
  s += jaw ? `<path d="${jaw}" fill="${skin}"/><ellipse cx="${cx}" cy="${cy}" rx="${fw}" ry="${fh*0.72}" fill="${skin}"/>` : `<ellipse cx="${cx}" cy="${cy+2}" rx="${fw}" ry="${fh}" fill="${skin}"/>`;
  // marcas
  if (has('marks','rugas')) s += `<path d="M${cx-14} ${cy-24} q14 -4 28 0 M${cx-12} ${cy-19} q12 -3 24 0" stroke="${skinD}" stroke-width="1.6" fill="none"/><path d="M${cx-26} ${cy+12} q4 8 2 14 M${cx+26} ${cy+12} q-4 8 -2 14" stroke="${skinD}" stroke-width="1.6" fill="none"/>`;
  if (has('marks','olheiras')) s += `<path d="M${cx-22} ${cy+3} q8 5 15 0 M${cx+7} ${cy+3} q8 5 15 0" stroke="${shade(skin,0.7)}" stroke-width="2" fill="none"/>`;
  if (has('marks','bochechas')) s += `<circle cx="${cx-22}" cy="${cy+14}" r="8" fill="#e46d6d" opacity=".35"/><circle cx="${cx+22}" cy="${cy+14}" r="8" fill="#e46d6d" opacity=".35"/>`;
  if (has('marks','sardas')) s += `<g fill="${shade(skin,0.62)}">${[[-24,10],[-19,14],[-14,9],[-21,6],[14,9],[19,14],[24,10],[21,6],[-4,12],[4,12]].map(([x,y])=>`<circle cx="${cx+x}" cy="${cy+y}" r="1.4"/>`).join('')}</g>`;
  if (has('marks','pinta')) s += `<circle cx="${cx+16}" cy="${cy+24}" r="2.2" fill="#3b2418"/>`;
  // olhos
  const ec = C('eyeColor'), ey = cy - 2;
  const eye = (x) => {
    if (av.eyes === 'fechado') return `<path d="M${x-7} ${ey+1} q7 -7 14 0" stroke="#2a1a12" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    const ry = {amendoado:3.6, sonolento:3, arregalado:6.5}[av.eyes] || 5, rx = av.eyes === 'amendoado' ? 7.5 : 6.5;
    let e = `<ellipse cx="${x}" cy="${ey}" rx="${rx}" ry="${ry}" fill="#fff"/><circle cx="${x}" cy="${ey}" r="${Math.min(ry, 4)}" fill="${ec}"/><circle cx="${x}" cy="${ey}" r="1.8" fill="#111"/><circle cx="${x+1.4}" cy="${ey-1.4}" r="0.9" fill="#fff"/>`;
    if (av.eyes === 'sonolento') e += `<path d="M${x-rx-1} ${ey-1} H${x+rx+1}" stroke="${skinD}" stroke-width="3"/>`;
    if (f) e += `<path d="M${x-rx} ${ey-ry+1} q${rx} -3 ${rx*2} 0" stroke="#1b1410" stroke-width="1.8" fill="none"/>`;
    return e;
  };
  s += eye(cx-14) + (has('marks','tapaolho') ? '' : eye(cx+14));
  // sobrancelhas
  const bw = {grossa:4.2, fina:1.6, normal:2.6, arqueada:2.4, franzida:3.2}[av.brows] || 2.6, bc = av.hairColor === 'careca' ? '#3a2a20' : (['grisalho','branco'].includes(av.hairColor) ? shade(hc, 0.85) : hcD);
  const brow = (x, d) => av.brows === 'arqueada' ? `<path d="M${x-9} ${ey-9} q9 -9 18 0" stroke="${bc}" stroke-width="${bw}" fill="none" stroke-linecap="round"/>`
    : av.brows === 'franzida' ? `<path d="M${x-9} ${ey-12+(d<0?0:4)} L${x+9} ${ey-12+(d<0?4:0)}" stroke="${bc}" stroke-width="${bw}" stroke-linecap="round"/>`
    : `<path d="M${x-9} ${ey-10} q9 -4 18 0" stroke="${bc}" stroke-width="${bw}" fill="none" stroke-linecap="round"/>`;
  s += brow(cx-14, -1) + brow(cx+14, 1);
  // nariz
  const ny = cy + 12;
  s += {pequeno:`<path d="M${cx} ${ny-6} q-3 6 1 7" stroke="${skinD}" stroke-width="2" fill="none" stroke-linecap="round"/>`, largo:`<path d="M${cx-2} ${ny-10} q-8 12 -3 13 q5 2 10 0 q5 -1 -3 -13" stroke="${skinD}" stroke-width="2.2" fill="none"/>`,
    aquilino:`<path d="M${cx-1} ${ny-14} q8 8 3 15 q-3 2 -7 0" stroke="${skinD}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`}[av.nose] || `<path d="M${cx} ${ny-10} q-6 9 -1 11 q3 1 6 0" stroke="${skinD}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
  // boca
  const my = cy + 26, lip = f || av.mouth === 'labios' ? '#b5484f' : shade(skin, 0.55);
  s += {serio:`<path d="M${cx-9} ${my} H${cx+9}" stroke="${lip}" stroke-width="3" stroke-linecap="round"/>`, largo:`<path d="M${cx-13} ${my-3} Q${cx} ${my+12} ${cx+13} ${my-3} Z" fill="#7a2b2b"/><path d="M${cx-10} ${my-1} H${cx+10}" stroke="#fff" stroke-width="3"/>`,
    bravo:`<path d="M${cx-10} ${my+3} Q${cx} ${my-5} ${cx+10} ${my+3}" stroke="${lip}" stroke-width="3" fill="none" stroke-linecap="round"/>`, labios:`<path d="M${cx-11} ${my} Q${cx-5} ${my-5} ${cx} ${my-2} Q${cx+5} ${my-5} ${cx+11} ${my} Q${cx} ${my+8} ${cx-11} ${my} Z" fill="${lip}"/>`}[av.mouth]
    || `<path d="M${cx-10} ${my-1} Q${cx} ${my+7} ${cx+10} ${my-1}" stroke="${lip}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  if (has('marks','cicatriz')) s += `<path d="M${cx+20} ${ey-14} L${cx+10} ${ey+12}" stroke="#a35a4a" stroke-width="2.4"/><path d="M${cx+19} ${ey-8} l-5 -1 M${cx+16} ${ey-1} l-5 -1 M${cx+13} ${ey+6} l-5 -1" stroke="#a35a4a" stroke-width="1.4"/>`;
  // barba
  const B = av.beard, bcol = hc;
  if (B === 'bigode') s += `<path d="M${cx-14} ${my-5} Q${cx} ${my-12} ${cx+14} ${my-5} Q${cx} ${my-7} ${cx-14} ${my-5} Z" fill="${bcol}" stroke="${bcol}" stroke-width="3"/>`;
  if (B === 'imperial') s += `<path d="M${cx} ${my-7} C${cx-10} ${my-12} ${cx-20} ${my-4} ${cx-26} ${my-14} C${cx-20} ${my} ${cx-8} ${my-2} ${cx} ${my-4} C${cx+8} ${my-2} ${cx+20} ${my} ${cx+26} ${my-14} C${cx+20} ${my-4} ${cx+10} ${my-12} ${cx} ${my-7} Z" fill="${bcol}"/>`;
  if (B === 'cavanhaque') s += `<path d="M${cx-12} ${my-5} Q${cx} ${my-11} ${cx+12} ${my-5}" stroke="${bcol}" stroke-width="4" fill="none"/><path d="M${cx-8} ${my+6} Q${cx} ${my+22} ${cx+8} ${my+6} Z" fill="${bcol}"/>`;
  if (B === 'curta' || B === 'cheia' || B === 'longa'){ const d = B === 'curta' ? 8 : B === 'cheia' ? 16 : 34;
    s += `<path d="M${cx-fw+2} ${cy+6} Q${cx-fw+2} ${cy+fh+d*0.6} ${cx} ${cy+fh+d} Q${cx+fw-2} ${cy+fh+d*0.6} ${cx+fw-2} ${cy+6} Q${cx+fw-8} ${cy+30} ${cx+10} ${my+4} Q${cx} ${my+8} ${cx-10} ${my+4} Q${cx-fw+8} ${cy+30} ${cx-fw+2} ${cy+6} Z" fill="${bcol}" opacity="${B==='curta'?0.75:1}"/><path d="M${cx-13} ${my-5} Q${cx} ${my-11} ${cx+13} ${my-5}" stroke="${bcol}" stroke-width="4" fill="none"/>`; }
  if (B === 'costeletas') s += `<path d="M${cx-fw+1} ${cy-8} V${cy+26} Q${cx-fw+8} ${cy+30} ${cx-fw+10} ${cy+20} V${cy-8} Z M${cx+fw-1} ${cy-8} V${cy+26} Q${cx+fw-8} ${cy+30} ${cx+fw-10} ${cy+20} V${cy-8} Z" fill="${bcol}"/>`;
  // cabelo da frente
  const top = cy - fh;
  s += {raspado:`<path d="M${cx-fw} ${cy-6} Q${cx-fw} ${top-2} ${cx} ${top-2} Q${cx+fw} ${top-2} ${cx+fw} ${cy-6} Q${cx} ${top+12} ${cx-fw} ${cy-6} Z" fill="${hc}" opacity=".55"/>`,
    curto:`<path d="M${cx-fw-2} ${cy-2} Q${cx-fw-4} ${top-8} ${cx} ${top-8} Q${cx+fw+4} ${top-8} ${cx+fw+2} ${cy-2} Q${cx+fw-6} ${top+10} ${cx} ${top+10} Q${cx-fw+6} ${top+10} ${cx-fw-2} ${cy-2} Z" fill="${hc}"/>`,
    topete:`<path d="M${cx-fw-2} ${cy-2} Q${cx-fw-4} ${top-6} ${cx-10} ${top-12} Q${cx+10} ${top-26} ${cx+fw+4} ${top-2} Q${cx+fw+4} ${cy-14} ${cx+fw+2} ${cy-2} Q${cx+fw-6} ${top+12} ${cx} ${top+12} Q${cx-fw+6} ${top+12} ${cx-fw-2} ${cy-2} Z" fill="${hc}"/>`,
    lateral:`<path d="M${cx-fw-2} ${cy-2} Q${cx-fw-4} ${top-8} ${cx-6} ${top-8} Q${cx+fw+6} ${top-8} ${cx+fw+2} ${cy-6} Q${cx+fw-4} ${top+6} ${cx-8} ${top+16} L${cx-12} ${top+4} Q${cx-fw+4} ${top+12} ${cx-fw-2} ${cy-2} Z" fill="${hc}"/>`,
    calvo:`<path d="M${cx-fw-2} ${cy+4} Q${cx-fw-4} ${cy-22} ${cx-fw+10} ${cy-28} L${cx-fw+12} ${cy-12} Z M${cx+fw+2} ${cy+4} Q${cx+fw+4} ${cy-22} ${cx+fw-10} ${cy-28} L${cx+fw-12} ${cy-12} Z" fill="${hc}"/>`,
    cacheado:`<g fill="${hc}">${[-0.8,-0.4,0,0.4,0.8].map(t=>`<circle cx="${cx+t*fw}" cy="${top+4-Math.cos(t)*4}" r="12"/>`).join('')}</g>`,
    crespo:`<path d="M${cx-fw} ${cy-10} Q${cx} ${top+16} ${cx+fw} ${cy-10}" fill="${hc}"/>`,
    medio:`<path d="M${cx-fw-6} ${cy+8} Q${cx-fw-6} ${top-8} ${cx} ${top-8} Q${cx+fw+6} ${top-8} ${cx+fw+6} ${cy+8} Q${cx+fw-4} ${top+8} ${cx-4} ${top+14} Q${cx-fw+2} ${top+10} ${cx-fw-6} ${cy+8} Z" fill="${hc}"/>`,
    longo:`<path d="M${cx-fw-6} ${cy+10} Q${cx-fw-6} ${top-8} ${cx} ${top-8} Q${cx+fw+6} ${top-8} ${cx+fw+6} ${cy+10} Q${cx+fw-2} ${top+12} ${cx+4} ${top+12} Q${cx-10} ${top+20} ${cx-fw-6} ${cy+10} Z" fill="${hc}"/>`,
    rabo:`<path d="M${cx-fw-3} ${cy-2} Q${cx-fw-4} ${top-8} ${cx} ${top-8} Q${cx+fw+4} ${top-8} ${cx+fw+3} ${cy-2} Q${cx} ${top+8} ${cx-fw-3} ${cy-2} Z" fill="${hc}"/>`,
    coque:`<circle cx="${cx}" cy="${top-12}" r="15" fill="${hc}"/><path d="M${cx-fw-3} ${cy-2} Q${cx-fw-4} ${top-8} ${cx} ${top-8} Q${cx+fw+4} ${top-8} ${cx+fw+3} ${cy-2} Q${cx} ${top+8} ${cx-fw-3} ${cy-2} Z" fill="${hc}"/>`,
    trancas:`<path d="M${cx-fw-3} ${cy-2} Q${cx-fw-4} ${top-8} ${cx} ${top-8} Q${cx+fw+4} ${top-8} ${cx+fw+3} ${cy-2} Q${cx} ${top+8} ${cx-fw-3} ${cy-2} Z" fill="${hc}"/>`,
    chanel:`<path d="M${cx-fw-8} ${cy+30} V${cy-6} Q${cx-fw-6} ${top-8} ${cx} ${top-8} Q${cx+fw+6} ${top-8} ${cx+fw+8} ${cy-6} V${cy+30} H${cx+fw-2} V${cy-6} Q${cx} ${top+16} ${cx-fw+2} ${cy-6} V${cy+30} Z" fill="${hc}"/>`,
    moicano:`<path d="M${cx-9} ${cy-20} Q${cx-10} ${top-26} ${cx} ${top-30} Q${cx+10} ${top-26} ${cx+9} ${cy-20} Z" fill="${hc}"/>`}[av.hair] || '';
  // óculos
  const G2 = av.glasses;
  if (G2 === 'redondo') s += `<g stroke="#2b2b2b" stroke-width="2.2" fill="rgba(255,255,255,.15)"><circle cx="${cx-14}" cy="${ey}" r="9"/><circle cx="${cx+14}" cy="${ey}" r="9"/><path d="M${cx-5} ${ey} H${cx+5}"/></g>`;
  if (G2 === 'quadrado') s += `<g stroke="#2b2b2b" stroke-width="2.4" fill="rgba(255,255,255,.15)"><rect x="${cx-24}" y="${ey-7}" width="19" height="14" rx="2"/><rect x="${cx+5}" y="${ey-7}" width="19" height="14" rx="2"/><path d="M${cx-5} ${ey} H${cx+5}"/></g>`;
  if (G2 === 'sol') s += `<g fill="#151515"><rect x="${cx-25}" y="${ey-7}" width="21" height="13" rx="4"/><rect x="${cx+4}" y="${ey-7}" width="21" height="13" rx="4"/><rect x="${cx-5}" y="${ey-3}" width="10" height="3"/></g>`;
  if (G2 === 'monoculo') s += `<circle cx="${cx+14}" cy="${ey}" r="9" stroke="#c9a13b" stroke-width="2.4" fill="rgba(255,255,255,.2)"/><path d="M${cx+22} ${ey+4} q8 20 -4 40" stroke="#c9a13b" stroke-width="1.2" fill="none"/>`;
  if (has('marks','tapaolho')) s += `<path d="M${cx-fw} ${ey-18} L${cx+fw} ${ey+10}" stroke="#151515" stroke-width="2.5"/><ellipse cx="${cx+14}" cy="${ey}" rx="10" ry="8" fill="#151515"/>`;
  // na cabeça
  const Ht = av.hat, ht = top - 2;
  if (Ht === 'coroa') s += `<path d="M${cx-28} ${ht+4} L${cx-30} ${ht-22} L${cx-15} ${ht-8} L${cx} ${ht-28} L${cx+15} ${ht-8} L${cx+30} ${ht-22} L${cx+28} ${ht+4} Z" fill="#e2b53b" stroke="#a67c1a" stroke-width="2"/><circle cx="${cx}" cy="${ht-6}" r="4" fill="#b3261e"/><circle cx="${cx-18}" cy="${ht-4}" r="3" fill="#1f4e8c"/><circle cx="${cx+18}" cy="${ht-4}" r="3" fill="#2d6a2d"/>`;
  if (Ht === 'tiara') s += `<path d="M${cx-26} ${ht+8} Q${cx} ${ht-16} ${cx+26} ${ht+8}" stroke="#e2d6b0" stroke-width="4" fill="none"/><path d="M${cx-8} ${ht-2} L${cx} ${ht-14} L${cx+8} ${ht-2} Z" fill="#e2d6b0"/><circle cx="${cx}" cy="${ht-5}" r="3" fill="#3d78b5"/>`;
  if (Ht === 'quepe') s += `<path d="M${cx-34} ${ht+10} Q${cx} ${ht-24} ${cx+34} ${ht+10} Z" fill="${oc}"/><rect x="${cx-34}" y="${ht+6}" width="68" height="8" fill="#151515"/><path d="M${cx-30} ${ht+14} Q${cx} ${ht+24} ${cx+30} ${ht+14}" fill="#151515"/><circle cx="${cx}" cy="${ht-2}" r="5" fill="#d8b24a"/>`;
  if (Ht === 'cartola') s += `<rect x="${cx-22}" y="${ht-40}" width="44" height="46" fill="#151515"/><rect x="${cx-34}" y="${ht+2}" width="68" height="7" rx="3" fill="#151515"/><rect x="${cx-22}" y="${ht-6}" width="44" height="6" fill="#8a1c1c"/>`;
  if (Ht === 'boina') s += `<ellipse cx="${cx+6}" cy="${ht}" rx="38" ry="14" fill="${oc}"/><circle cx="${cx+6}" cy="${ht-12}" r="3" fill="${ocD}"/>`;
  if (Ht === 'turbante') s += `<path d="M${cx-36} ${ht+12} Q${cx-38} ${ht-26} ${cx} ${ht-28} Q${cx+38} ${ht-26} ${cx+36} ${ht+12} Q${cx} ${ht} ${cx-36} ${ht+12} Z" fill="#ece6d6" stroke="#cfc6ae" stroke-width="2"/><circle cx="${cx}" cy="${ht-6}" r="5" fill="#2d6a2d"/>`;
  if (Ht === 'mitra') s += `<path d="M${cx-24} ${ht+8} L${cx-20} ${ht-30} Q${cx} ${ht-52} ${cx+20} ${ht-30} L${cx+24} ${ht+8} Z" fill="#ece6d6" stroke="#d8b24a" stroke-width="3"/><path d="M${cx} ${ht-40} V${ht+4} M${cx-10} ${ht-20} H${cx+10}" stroke="#d8b24a" stroke-width="4"/>`;
  if (Ht === 'capacete') s += `<path d="M${cx-38} ${ht+14} Q${cx-38} ${ht-26} ${cx} ${ht-26} Q${cx+38} ${ht-26} ${cx+38} ${ht+14} Z" fill="#4c5a3a"/><rect x="${cx-40}" y="${ht+10}" width="80" height="6" rx="3" fill="#3a462c"/>`;
  if (Ht === 'fone') s += `<path d="M${cx-fw-4} ${cy} Q${cx-fw-4} ${top-14} ${cx} ${top-14} Q${cx+fw+4} ${top-14} ${cx+fw+4} ${cy}" stroke="#2a2f3a" stroke-width="5" fill="none"/><rect x="${cx-fw-10}" y="${cy-8}" width="10" height="20" rx="4" fill="#2a2f3a"/><rect x="${cx+fw}" y="${cy-8}" width="10" height="20" rx="4" fill="#2a2f3a"/><path d="M${cx+fw+4} ${cy+10} q-6 16 -22 18" stroke="#5ff0ff" stroke-width="2" fill="none"/>`;
  s += `</svg>`;
  return s;
}

// ---------------- Editor ----------------
// opts: {avatar, name, title, party, cult, gov, allowName, heading, onSave(av, name, party)}
function openAvatarEditor(opts){
  const st = {av: JSON.parse(JSON.stringify(opts.avatar || randomAvatar(guessSex(opts.name), null, opts.gov))), name: opts.name || '', tab:'rosto', party: opts.party ? JSON.parse(JSON.stringify(opts.party)) : null};
  if (st.party) emblemOf(st.party);
  const render = () => {
    const av = st.av, opt = k => {
      const D = AV[k], cur = av[k];
      const isColor = Object.values(D.o)[0][0] === '#';
      return `<div class="av-group"><div class="lbl">${D.n}</div><div class="av-opts">${Object.entries(D.o).map(([v, lab])=>{
        const on = D.multi ? (cur||[]).includes(v) : cur === v;
        return isColor ? `<button class="av-sw ${on?'on':''}" data-k="${k}" data-v="${v}" title="${v}" style="background:${lab}"></button>` : `<button class="av-op ${on?'on':''}" data-k="${k}" data-v="${v}">${lab}</button>`; }).join('')}</div></div>`;
    };
    let body = '';
    if (st.tab === 'escudo'){
      if (!st.party) body = `<div class="muted" style="padding:14px">Escolha primeiro um partido ou organização (aba Nação → Editar nomes → grupo no poder).</div>`;
      else { const em = st.party.emblem;
        body = `<div class="lbl">Escudo de ${esc(st.party.name)}</div>
        <div class="av-group"><div class="lbl">Formato</div><div class="av-opts">${Object.entries(EMB_SHAPES).map(([k,v])=>`<button class="av-op ${em.shape===k?'on':''}" data-em="shape" data-v="${k}">${v}</button>`).join('')}</div></div>
        <div class="av-group"><div class="lbl">Símbolo</div><div class="av-opts">${EMB_SYMS.map(s=>`<button class="av-op ${em.sym===s?'on':''}" data-em="sym" data-v="${s}" style="font-size:20px;min-width:40px">${s}</button>`).join('')}</div></div>
        <div class="grid2" style="gap:10px"><label class="lbl">Cor principal <input type="color" data-emc="c1" value="${em.c1}"></label><label class="lbl">Cor do contorno e símbolo <input type="color" data-emc="c2" value="${em.c2}"></label></div>
        <label class="av-check"><input type="checkbox" id="av-pin" ${(av.extras||[]).includes('broche')?'checked':''}> Usar o escudo no peito do líder</label>`; }
    } else if (st.tab === 'roupa'){
      body = AV_TABS.roupa.map(opt).join('') + `<div class="av-group"><div class="lbl">Altura: <b id="av-hv">${av.height} cm</b></div><input type="range" id="av-h" min="145" max="205" value="${av.height}" style="width:100%"></div>`;
    } else body = AV_TABS[st.tab].map(opt).join('');
    const m = openModal(`<div class="m-title">${opts.heading || '🎨 Visual do líder'}</div>
      <div class="av-editor">
        <div class="av-left">
          <div class="av-prev">${avatarSVG(av, st.party && (av.extras||[]).includes('broche') ? st.party.emblem : null, 200)}</div>
          ${opts.allowName !== false ? `<input type="text" id="av-name" maxlength="22" value="${esc(st.name)}" placeholder="Nome do líder">` : `<div style="font-family:var(--title);font-weight:700;text-align:center">${esc(st.name)}</div>`}
          <div class="seg" style="margin:6px 0"><button data-sex="m" class="${av.sex==='m'?'active':''}">♂ Masculino</button><button data-sex="f" class="${av.sex==='f'?'active':''}">♀ Feminino</button></div>
          <button class="btn sm" id="av-rand" style="width:100%">🎲 Visual aleatório</button>
          ${opts.allowName !== false ? `<button class="btn sm" id="av-randname" style="width:100%;margin-top:4px">🎲 Nome e visual aleatórios</button>` : ''}
          ${st.party ? `<div class="av-party">${emblemSVG(st.party.emblem, 34)}<small>${esc(st.party.name)}</small></div>` : ''}
        </div>
        <div class="av-right">
          <div class="seg av-tabs">${Object.entries(AV_TAB_N).map(([k,v])=>`<button data-avt="${k}" class="${st.tab===k?'active':''}">${v}</button>`).join('')}</div>
          <div class="av-body">${body}</div>
        </div>
      </div>
      <div class="m-actions"><button class="btn" id="av-x">Cancelar</button><button class="btn green" id="av-ok">✔ Salvar</button></div>`, {wide:true});
    const nm = m.querySelector('#av-name'); if (nm) nm.oninput = e => { st.name = e.target.value; };
    m.querySelectorAll('[data-avt]').forEach(b=> b.onclick = ()=>{ SFX.click(); st.tab = b.dataset.avt; render(); });
    m.querySelectorAll('[data-k]').forEach(b=> b.onclick = ()=>{ const k = b.dataset.k, v = b.dataset.v; if (AV[k].multi){ const a = av[k] = av[k] || []; const i = a.indexOf(v); if (i >= 0) a.splice(i, 1); else a.push(v); } else av[k] = v; SFX.click(); render(); });
    m.querySelectorAll('[data-sex]').forEach(b=> b.onclick = ()=>{ av.sex = b.dataset.sex; SFX.click(); render(); });
    m.querySelector('#av-rand').onclick = ()=>{ const h = av.height; st.av = randomAvatar(av.sex, null, opts.gov); if (!st.av.extras.includes('broche') && (av.extras||[]).includes('broche')) st.av.extras.push('broche'); SFX.bell(); render(); };
    const rn = m.querySelector('#av-randname'); if (rn) rn.onclick = ()=>{ const sex = Math.random() < 0.5 ? 'm' : 'f'; st.name = genNameBySex(opts.cult || 'luso', sex); st.av = randomAvatar(sex, null, opts.gov); SFX.bell(); render(); };
    const hr = m.querySelector('#av-h'); if (hr) hr.oninput = e => { av.height = +e.target.value; m.querySelector('#av-hv').textContent = av.height + ' cm'; m.querySelector('.av-prev').innerHTML = avatarSVG(av, st.party && (av.extras||[]).includes('broche') ? st.party.emblem : null, 200); };
    m.querySelectorAll('[data-em]').forEach(b=> b.onclick = ()=>{ st.party.emblem[b.dataset.em] = b.dataset.v; SFX.click(); render(); });
    m.querySelectorAll('[data-emc]').forEach(inp=> inp.onchange = ()=>{ st.party.emblem[inp.dataset.emc] = inp.value; render(); });
    const pin = m.querySelector('#av-pin'); if (pin) pin.onchange = ()=>{ av.extras = (av.extras||[]).filter(x=>x!=='broche'); if (pin.checked) av.extras.push('broche'); render(); };
    m.querySelector('#av-x').onclick = ()=>{ SFX.click(); closeModal(); if (opts.onCancel) opts.onCancel(); };
    m.querySelector('#av-ok').onclick = ()=>{ const name = st.name.trim(); if (opts.allowName !== false && !name){ SFX.error(); toast('Escreva o nome do líder.', 'bad'); return; } SFX.fanfare(); closeModal(); opts.onSave(st.av, name, st.party); };
  };
  render();
}

// ---------------- Troca de líder (sucessão, eleição, morte) ----------------
// Mostra o novo líder com avatar aleatório pelo nome e deixa personalizar
function presentNewLeader(name){
  const p = G.p, sex = guessSex(name);
  p.avatar = randomAvatar(sex, null, p.gov);
  if (p.party && emblemOf(p.party) && Math.random() < 0.4) p.avatar.extras.push('broche');
  const show = () => {
    const m = openModal(`<div class="m-title">👤 Novo líder: ${esc(p.title)} ${esc(p.leader)}</div>
      <div style="display:flex;justify-content:center;margin:6px 0">${avatarSVG(p.avatar, p.avatar.extras.includes('broche') ? emblemOf(p.party) : null, 170)}</div>
      <div class="muted" style="text-align:center">Visual sorteado a partir do nome (${sex === 'f' ? 'feminino' : 'masculino'}). Você pode sortear de novo ou personalizar tudo, inclusive o nome.</div>
      <div class="m-actions"><button class="btn" id="nl-m">🎲 Aleatório ♂</button><button class="btn" id="nl-f">🎲 Aleatório ♀</button><button class="btn" id="nl-c">🎨 Personalizar</button><button class="btn green" id="nl-ok">✔ Confirmar</button></div>`, {wide:true});
    const reroll = sex2 => { p.avatar = randomAvatar(sex2, null, p.gov); if (guessSex(p.leader) !== sex2){ const old = p.leader; p.leader = genNameBySex(p.cult || 'luso', sex2); addLog(`👤 ${old} cedeu o lugar a ${p.leader}.`, 'info'); } SFX.bell(); show(); };
    m.querySelector('#nl-m').onclick = ()=>reroll('m');
    m.querySelector('#nl-f').onclick = ()=>reroll('f');
    m.querySelector('#nl-c').onclick = ()=>{ SFX.page(); openLeaderEditor(show); };
    m.querySelector('#nl-ok').onclick = ()=>{ SFX.click(); closeModal(); refreshAll(); saveGame(); };
  };
  setTimeout(show, 350);
}
function openLeaderEditor(after){
  const p = G.p;
  openAvatarEditor({avatar:p.avatar || randomAvatar(guessSex(p.leader), null, p.gov), name:p.leader, party:p.party, cult:p.cult, gov:p.gov,
    onSave:(av, name, party)=>{ p.avatar = av; if (name && name !== p.leader){ addLog(`👤 O líder agora se chama ${name}.`, 'info'); p.leader = name; } if (party && p.party) p.party.emblem = party.emblem; refreshAll(); saveGame(); if (after) after(); },
    onCancel: after});
}
function playerAvatar(){ const p = G.p; if (!p.avatar) p.avatar = randomAvatar(guessSex(p.leader), seededRng(p.leader), p.gov); if (!p.avatar.height) p.avatar.height = 172; return p.avatar; }
document.addEventListener('click', e=>{ if (G && G.p && e.target.closest('#btn-avatar')){ SFX.page(); openLeaderEditor(); } });
// avatar das nações da IA (sorteado de forma fixa pelo nome do líder)
function aiAvatar(n){ if (!n || !n.leader) return null; return randomAvatar(guessSex(n.leader), seededRng(n.leader), n.gov); }
