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
  chin:{n:'Queixo', o:{normal:'Normal', furinho:'Com furinho', marcado:'Marcado'}},
  age:{n:'Idade aparente', o:{jovem:'Jovem', adulto:'Adulto', maduro:'Maduro', idoso:'Idoso'}},
  makeup:{n:'Maquiagem', o:{nenhuma:'Nenhuma', leve:'Leve', batom:'Batom', sombra:'Sombra nos olhos', completa:'Completa'}},
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
const AV_TABS = {rosto:['skin','age','face','chin','eyes','eyeColor','brows','nose','mouth','makeup'], cabelo:['hair','hairColor','beard'], marcas:['marks','glasses','hat','extras'], roupa:['outfit','outfitColor','bg']};
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
    chin: pk('chin', ['normal','normal','furinho','marcado']), age: pk('age', ['jovem','adulto','adulto','maduro','maduro','idoso']), makeup: f ? pk('makeup', ['nenhuma','leve','leve','batom','completa']) : 'nenhuma',
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
// Luz vinda do alto à esquerda: degradês na pele, cabelo e roupa; contornos finos.
const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); let r = n>>16, g = (n>>8)&255, b = n&255; const f = v => Math.max(0, Math.min(255, Math.round(v*k))); return '#' + ((1<<24) + (f(r)<<16) + (f(g)<<8) + f(b)).toString(16).slice(1); };
const mix = (a, b, t) => { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16); const ch = s => Math.round(((A>>s)&255)*(1-t) + ((B>>s)&255)*t); return '#' + ((1<<24) + (ch(16)<<16) + (ch(8)<<8) + ch(0)).toString(16).slice(1); };
let AV_SEQ = 0;
function avatarSVG(av, emblem, size){
  if (!av) return ''; size = size || 120;
  const id = 'av' + (++AV_SEQ), C = k => AV[k] && AV[k].o[av[k]] || Object.values(AV[k].o)[0];
  const has = (k, v) => (av[k]||[]).includes(v), f = av.sex === 'f';
  const skin = C('skin'), sL = shade(skin, 1.08), sD = shade(skin, 0.84), sDD = shade(skin, 0.68), ln = shade(skin, 0.52);
  const hc = C('hairColor'), hL = mix(hc, '#ffffff', 0.17), hD = shade(hc, 0.62);
  const oc = C('outfitColor'), oL = mix(oc, '#ffffff', 0.18), oD = shade(oc, 0.62), bg = C('bg');
  const age = av.age || 'adulto', mk = av.makeup || 'nenhuma';
  const H = clamp(((av.height||172) - 172) / 22, -1, 1);
  const cx = 100, cy = 98 - H*5, sh = 170 - H*3;
  const [tw, cw, jw, fh] = {oval:[34,37,26,45], redondo:[37,40,31,41], quadrado:[36,38,34,44], fino:[31,33,21,48], coracao:[38,37,18,46]}[av.face] || [34,37,26,45];
  const T = cy - fh;
  // ---- formato do rosto (lado direito espelhado) ----
  const R = (d) => cx + d, L = (d) => cx - d;
  const face = `M${cx} ${T} C${R(tw*0.62)} ${T} ${R(tw)} ${T+fh*0.28} ${R(tw)} ${cy-12} C${R(tw+0.5)} ${cy-2} ${R(cw)} ${cy+2} ${R(cw-1)} ${cy+12} C${R(cw-2)} ${cy+fh*0.45} ${R(jw+3)} ${cy+fh*0.7} ${R(jw*0.5)} ${cy+fh*0.92} Q${R(jw*0.2)} ${cy+fh+1} ${cx} ${cy+fh+1} `
    + `Q${L(jw*0.2)} ${cy+fh+1} ${L(jw*0.5)} ${cy+fh*0.92} C${L(jw+3)} ${cy+fh*0.7} ${L(cw-2)} ${cy+fh*0.45} ${L(cw-1)} ${cy+12} C${L(cw)} ${cy+2} ${L(tw+0.5)} ${cy-2} ${L(tw)} ${cy-12} C${L(tw)} ${T+fh*0.28} ${L(tw*0.62)} ${T} ${cx} ${T} Z`;
  let s = `<svg viewBox="0 0 200 220" width="${size}" height="${Math.round(size*1.1)}" xmlns="http://www.w3.org/2000/svg" style="display:block">
  <defs>
    <radialGradient id="${id}bg" cx="45%" cy="38%" r="75%"><stop offset="0" stop-color="${mix(bg,'#ffffff',0.25)}"/><stop offset="1" stop-color="${shade(bg,0.82)}"/></radialGradient>
    <radialGradient id="${id}sk" cx="40%" cy="36%" r="70%"><stop offset="0" stop-color="${sL}"/><stop offset=".62" stop-color="${skin}"/><stop offset="1" stop-color="${sD}"/></radialGradient>
    <linearGradient id="${id}nk" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${sDD}"/><stop offset="1" stop-color="${sD}"/></linearGradient>
    <linearGradient id="${id}hr" x1="0" x2=".35" y1="0" y2="1"><stop offset="0" stop-color="${hL}"/><stop offset=".45" stop-color="${hc}"/><stop offset="1" stop-color="${hD}"/></linearGradient>
    <linearGradient id="${id}cl" x1="0" x2=".6" y1="0" y2="1"><stop offset="0" stop-color="${oL}"/><stop offset=".5" stop-color="${oc}"/><stop offset="1" stop-color="${oD}"/></linearGradient>
    <radialGradient id="${id}ir" cx="50%" cy="45%" r="55%"><stop offset="0" stop-color="${mix(C('eyeColor'),'#ffffff',0.35)}"/><stop offset=".7" stop-color="${C('eyeColor')}"/><stop offset="1" stop-color="${shade(C('eyeColor'),0.45)}"/></radialGradient>
    <clipPath id="${id}fc"><path d="${face}"/></clipPath>
  </defs>
  <rect width="200" height="220" rx="18" fill="url(#${id}bg)"/><rect x="1" y="1" width="198" height="218" rx="17" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="2"/>`;
  const hairFill = `url(#${id}hr)`, hairStroke = `stroke="${hD}" stroke-width="1.1"`;
  // ---- cabelo de trás ----
  const backHair = {
    longo:`<path d="M${L(tw+7)} ${cy-12} C${L(tw+14)} ${cy+40} ${L(tw+12)} ${cy+70} ${L(tw-4)} ${cy+92} L${R(tw-4)} ${cy+92} C${R(tw+12)} ${cy+70} ${R(tw+14)} ${cy+40} ${R(tw+7)} ${cy-12} Z" fill="${hairFill}" ${hairStroke}/>`,
    trancas:`<path d="M${L(tw+3)} ${cy} q-9 42 2 84" stroke="${hc}" stroke-width="13" fill="none" stroke-linecap="round"/><path d="M${R(tw+3)} ${cy} q9 42 -2 84" stroke="${hc}" stroke-width="13" fill="none" stroke-linecap="round"/>${[0,1,2,3,4].map(i=>`<path d="M${L(tw+9)} ${cy+8+i*15} l10 6 M${R(tw+9)} ${cy+8+i*15} l-10 6" stroke="${hD}" stroke-width="1.5"/>`).join('')}`,
    crespo:`<path d="M${cx} ${T-30} C${R(tw+32)} ${T-28} ${R(tw+34)} ${cy+18} ${R(tw+12)} ${cy+22} L${L(tw+12)} ${cy+22} C${L(tw+34)} ${cy+18} ${L(tw+32)} ${T-28} ${cx} ${T-30} Z" fill="${hairFill}" ${hairStroke}/>`,
    cacheado:`<g fill="${hc}" stroke="${hD}" stroke-width="1">${[[-1.15,0.05],[1.15,0.05],[-1.2,0.4],[1.2,0.4],[-1.05,0.75],[1.05,0.75]].map(([t,v])=>`<circle cx="${cx+t*tw}" cy="${cy-fh*0.3+v*fh}" r="11"/>`).join('')}</g>`,
    chanel:`<path d="M${L(tw+9)} ${cy-14} V${cy+34} Q${cx} ${cy+38} ${R(tw+9)} ${cy+34} V${cy-14} Z" fill="${hairFill}" ${hairStroke}/>`,
    medio:`<path d="M${L(tw+7)} ${cy-14} C${L(tw+10)} ${cy+20} ${L(tw+6)} ${cy+36} ${L(tw-4)} ${cy+44} L${R(tw-4)} ${cy+44} C${R(tw+6)} ${cy+36} ${R(tw+10)} ${cy+20} ${R(tw+7)} ${cy-14} Z" fill="${hairFill}" ${hairStroke}/>`,
    rabo:`<path d="M${R(tw-6)} ${T+8} C${R(tw+30)} ${T+20} ${R(tw+24)} ${cy+40} ${R(tw+12)} ${cy+62}" stroke="${hc}" stroke-width="15" fill="none" stroke-linecap="round"/>`
  }[av.hair] || '';
  s += backHair;
  // ---- corpo ----
  const shoulders = `M${cx-72} 220 C${cx-72} ${sh+4} ${cx-60} ${sh-13} ${cx-30} ${sh-17} L${cx+30} ${sh-17} C${cx+60} ${sh-13} ${cx+72} ${sh+4} ${cx+72} 220 Z`;
  // pescoço com sombra do queixo
  s += `<path d="M${cx-14} ${cy+fh-18} L${cx-15} ${sh-10} Q${cx} ${sh-1} ${cx+15} ${sh-10} L${cx+14} ${cy+fh-18} Z" fill="url(#${id}nk)" stroke="${ln}" stroke-width=".8"/>`;
  if (!f && (age === 'maduro' || age === 'idoso')) s += `<path d="M${cx-5} ${cy+fh+6} q5 6 10 0" stroke="${sDD}" stroke-width="1.2" fill="none"/>`;
  const O = av.outfit, clothes = `url(#${id}cl)`;
  const body = (fill, extra) => `<path d="${shoulders}" fill="${fill}" stroke="${oD}" stroke-width="1.2"/>${extra||''}`;
  const fold = (x1, y1, x2, y2) => `<path d="M${x1} ${y1} Q${(x1+x2)/2+4} ${(y1+y2)/2} ${x2} ${y2}" stroke="${oD}" stroke-width="1.4" fill="none" opacity=".55"/>`;
  const shirt = (c) => `<path d="M${cx-19} ${sh-16} L${cx} ${sh+30} L${cx+19} ${sh-16} Z" fill="${c||'#f6f3ec'}"/><path d="M${cx-19} ${sh-16} L${cx-6} ${sh-2} L${cx-1} ${sh-14} Z M${cx+19} ${sh-16} L${cx+6} ${sh-2} L${cx+1} ${sh-14} Z" fill="#ffffff" stroke="#c9c2b4" stroke-width=".8"/>`;
  if (O === 'terno') s += body(clothes, shirt() + `<path d="M${cx-30} ${sh-17} L${cx-7} ${sh+44} L${cx-24} ${sh+26} L${cx-34} ${sh+4} Z" fill="${oD}" opacity=".9"/><path d="M${cx+30} ${sh-17} L${cx+7} ${sh+44} L${cx+24} ${sh+26} L${cx+34} ${sh+4} Z" fill="${shade(oc,0.8)}"/><path d="M${cx-34} ${sh+4} l6 3 M${cx+34} ${sh+4} l-6 3" stroke="${oD}" stroke-width="1.5"/><circle cx="${cx-4}" cy="${sh+50}" r="2.2" fill="${oD}"/>` + fold(cx-56, sh+8, cx-50, 214) + fold(cx+56, sh+8, cx+50, 214) + `<path d="M${cx-46} ${sh+30} h12" stroke="${oL}" stroke-width="2.5" opacity=".7"/>`);
  else if (O === 'uniforme') s += body(clothes, `<path d="M${cx-17} ${sh-18} H${cx+17} V${sh-6} Q${cx} ${sh+2} ${cx-17} ${sh-6} Z" fill="${oD}"/><path d="M${cx-15} ${sh-12} h6 M${cx+9} ${sh-12} h6" stroke="#d8b24a" stroke-width="2"/><path d="M${cx} ${sh-4} V218" stroke="${oD}" stroke-width="1.5"/>${[0,1,2,3].map(i=>`<circle cx="${cx+5}" cy="${sh+8+i*14}" r="3.2" fill="#d8b24a" stroke="#8c6a1a" stroke-width=".8"/><circle cx="${cx+4}" cy="${sh+7+i*14}" r="1" fill="#fff6c8"/>`).join('')}<path d="M${cx-62} ${sh-12} Q${cx-48} ${sh-20} ${cx-34} ${sh-14} L${cx-36} ${sh-4} Q${cx-50} ${sh-10} ${cx-64} ${sh-2} Z M${cx+62} ${sh-12} Q${cx+48} ${sh-20} ${cx+34} ${sh-14} L${cx+36} ${sh-4} Q${cx+50} ${sh-10} ${cx+64} ${sh-2} Z" fill="#d8b24a" stroke="#8c6a1a" stroke-width=".8"/>${[0,1,2,3,4].map(i=>`<path d="M${cx-60+i*5} ${sh-4} v7 M${cx+40+i*5} ${sh-4} v7" stroke="#c9a13b" stroke-width="1.2"/>`).join('')}` + fold(cx-54, sh+12, cx-48, 214) + fold(cx+54, sh+12, cx+48, 214));
  else if (O === 'manto') s += body(clothes, `<path d="M${cx-64} 220 C${cx-60} ${sh+4} ${cx-46} ${sh-10} ${cx-22} ${sh-15} L${cx-12} 220 Z M${cx+64} 220 C${cx+60} ${sh+4} ${cx+46} ${sh-10} ${cx+22} ${sh-15} L${cx+12} 220 Z" fill="#f7f4ee" stroke="#d6d0c4" stroke-width="1"/><g fill="#1c1c1c">${[0,1,2,3,4].map(i=>`<path d="M${cx-44+i*5} ${sh+6+i*12} l1.5 -3 l1.5 3 l-1.5 2 Z"/><path d="M${cx+41-i*5} ${sh+6+i*12} l1.5 -3 l1.5 3 l-1.5 2 Z"/>`).join('')}</g><path d="M${cx-26} ${sh-12} Q${cx} ${sh+10} ${cx+26} ${sh-12}" stroke="#d8b24a" stroke-width="3" fill="none" stroke-dasharray="4 2"/><circle cx="${cx}" cy="${sh+2}" r="5" fill="#b3261e" stroke="#d8b24a" stroke-width="2"/>`);
  else if (O === 'batina') s += body(clothes, `<path d="M${cx-11} ${sh-18} H${cx+11} V${sh-9} H${cx-11} Z" fill="${oD}"/><rect x="${cx-4}" y="${sh-17}" width="8" height="6" fill="#ffffff"/><path d="M${cx-3.5} ${sh+12} h7 v13 h10 v7 h-10 v26 h-7 v-26 h-10 v-7 h10 Z" fill="#d8b24a" stroke="#8c6a1a" stroke-width=".8"/>` + fold(cx-50, sh+10, cx-44, 214) + fold(cx+50, sh+10, cx+44, 214));
  else if (O === 'jaleco') s += body('#f4f4f1', shirt(oc) + `<path d="M${cx-4} ${sh-12} H${cx+4} L${cx+6} ${sh+30} L${cx} ${sh+38} L${cx-6} ${sh+30} Z" fill="${shade(oc,0.75)}"/><path d="M${cx-30} ${sh-17} L${cx-8} ${sh+46} L${cx-26} ${sh+24} Z M${cx+30} ${sh-17} L${cx+8} ${sh+46} L${cx+26} ${sh+24} Z" fill="#e3e3de" stroke="#c9c9c2" stroke-width=".8"/><rect x="${cx+28}" y="${sh+22}" width="18" height="15" rx="2" fill="#ebebe6" stroke="#c9c9c2"/><rect x="${cx+32}" y="${sh+14}" width="2.5" height="13" rx="1" fill="#3d78b5"/><rect x="${cx+37}" y="${sh+16}" width="2.5" height="11" rx="1" fill="#b3261e"/>`);
  else if (O === 'casual') s += body(clothes, `<path d="M${cx-18} ${sh-16} L${cx} ${sh+10} L${cx+18} ${sh-16}" fill="url(#${id}nk)"/><path d="M${cx-20} ${sh-18} L${cx-4} ${sh+10} L${cx-12} ${sh-2} Z M${cx+20} ${sh-18} L${cx+4} ${sh+10} L${cx+12} ${sh-2} Z" fill="${oL}" stroke="${oD}" stroke-width=".8"/><path d="M${cx} ${sh+10} V218" stroke="${oD}" stroke-width="1"/>${[0,1,2].map(i=>`<circle cx="${cx+3}" cy="${sh+24+i*16}" r="1.8" fill="#eee"/>`).join('')}` + fold(cx-54, sh+10, cx-46, 214));
  else if (O === 'vestido') s += body(clothes, `<path d="M${cx-30} ${sh-15} C${cx-20} ${sh+18} ${cx+20} ${sh+18} ${cx+30} ${sh-15} Z" fill="url(#${id}nk)"/><path d="M${cx-30} ${sh-15} C${cx-20} ${sh+18} ${cx+20} ${sh+18} ${cx+30} ${sh-15}" stroke="${oD}" stroke-width="2" fill="none"/>` + fold(cx-40, sh+20, cx-30, 214) + fold(cx+40, sh+20, cx+30, 214) + fold(cx-8, sh+30, cx-2, 214));
  else if (O === 'tunica') s += body(clothes, `<path d="M${cx-26} ${sh-16} Q${cx} ${sh+12} ${cx+26} ${sh-16}" stroke="#d8b24a" stroke-width="4" fill="none"/><path d="M${cx-26} ${sh-16} Q${cx} ${sh+12} ${cx+26} ${sh-16}" stroke="#8c6a1a" stroke-width="1" fill="none" stroke-dasharray="2 3"/><path d="M${cx-70} 212 H${cx+70}" stroke="#d8b24a" stroke-width="5"/>` + fold(cx-30, sh+20, cx-24, 210) + fold(cx+30, sh+20, cx+24, 210));
  else if (O === 'futurista') s += body(clothes, `<path d="M${cx-30} ${sh-17} H${cx+30} L${cx+22} ${sh-6} H${cx-22} Z" fill="${oD}"/><path d="M${cx-54} ${sh+2} L${cx} ${sh+30} L${cx+54} ${sh+2}" stroke="#5ff0ff" stroke-width="2.5" fill="none"/><path d="M${cx-54} ${sh+2} L${cx} ${sh+30} L${cx+54} ${sh+2}" stroke="#5ff0ff" stroke-width="7" fill="none" opacity=".2"/><circle cx="${cx}" cy="${sh+30}" r="6" fill="#5ff0ff"/><circle cx="${cx}" cy="${sh+30}" r="11" fill="#5ff0ff" opacity=".2"/><path d="M${cx-60} ${sh+40} H${cx-30} M${cx+30} ${sh+40} H${cx+60}" stroke="#5ff0ff" stroke-width="1.5" opacity=".7"/>`);
  else s += body(clothes);
  if (has('extras','gravata') && ['terno','jaleco','casual'].includes(O)) s += `<path d="M${cx-5} ${sh-13} H${cx+5} L${cx+4} ${sh-7} H${cx-4} Z" fill="#6e1414"/><path d="M${cx-4} ${sh-7} H${cx+4} L${cx+7} ${sh+30} L${cx} ${sh+39} L${cx-7} ${sh+30} Z" fill="#8a1c1c"/><path d="M${cx-3} ${sh+2} l6 6 M${cx-4} ${sh+14} l7 7" stroke="#a83232" stroke-width="2"/>`;
  if (has('extras','laco')) s += `<path d="M${cx} ${sh-11} C${cx-6} ${sh-18} ${cx-14} ${sh-16} ${cx-14} ${sh-10} C${cx-14} ${sh-4} ${cx-6} ${sh-4} ${cx} ${sh-11} C${cx+6} ${sh-18} ${cx+14} ${sh-16} ${cx+14} ${sh-10} C${cx+14} ${sh-4} ${cx+6} ${sh-4} ${cx} ${sh-11} Z" fill="#151515"/><rect x="${cx-2.5}" y="${sh-14}" width="5" height="6" rx="1.5" fill="#2a2a2a"/>`;
  if (has('extras','faixa')) s += `<path d="M${cx-54} ${sh-6} L${cx+40} 220 L${cx+58} 220 L${cx-38} ${sh-12} Z" fill="#2f7d32"/><path d="M${cx-49} ${sh-8} L${cx+47} 220" stroke="#e6c13a" stroke-width="5"/><path d="M${cx-54} ${sh-6} L${cx+40} 220 M${cx-38} ${sh-12} L${cx+58} 220" stroke="rgba(0,0,0,.25)" stroke-width="1"/><circle cx="${cx+14}" cy="${sh+62}" r="7" fill="#e6c13a" stroke="#8c6a1a"/>`;
  if (has('extras','medalhas')) s += `<g>${[0,1,2].map(i=>`<rect x="${cx-50+i*10}" y="${sh+8}" width="8" height="10" fill="${['#b3261e','#1f4e8c','#2d6a2d'][i]}" stroke="rgba(0,0,0,.3)" stroke-width=".6"/><path d="M${cx-50+i*10} ${sh+11} h8" stroke="#f4f1ea" stroke-width="1.2"/><circle cx="${cx-46+i*10}" cy="${sh+24}" r="4.5" fill="#d8b24a" stroke="#8c6a1a" stroke-width=".8"/><circle cx="${cx-47+i*10}" cy="${sh+23}" r="1.2" fill="#fff6c8"/>`).join('')}</g>`;
  if (has('extras','colar')) s += `<path d="M${cx-22} ${sh-14} Q${cx} ${sh+14} ${cx+22} ${sh-14}" stroke="#f1e6c2" stroke-width="3.2" fill="none" stroke-dasharray=".1 4.2" stroke-linecap="round"/><circle cx="${cx}" cy="${sh+2}" r="3" fill="#f1e6c2"/>`;
  if (has('extras','broche') && emblem) s += `<g transform="translate(${cx+28} ${sh+6}) scale(0.24)"><path d="${emblemPath(emblem.shape)}" fill="${emblem.c1}" stroke="${emblem.c2}" stroke-width="6"/><text x="50" y="56" text-anchor="middle" dominant-baseline="middle" font-size="44" fill="${emblem.c2}">${emblem.sym}</text></g>`;
  // ---- orelhas ----
  const ear = (sgn) => { const x = cx + sgn*(tw+0.5); return `<path d="M${x} ${cy-9} C${x+sgn*9} ${cy-13} ${x+sgn*11} ${cy+9} ${x+sgn*2} ${cy+16} Z" fill="${sD}" stroke="${ln}" stroke-width=".9"/><path d="M${x+sgn*2} ${cy-5} C${x+sgn*7} ${cy-6} ${x+sgn*7} ${cy+7} ${x+sgn*2} ${cy+10}" stroke="${sDD}" stroke-width="1.3" fill="none"/>`; };
  s += ear(-1) + ear(1);
  if (has('extras','brincos')) s += `<circle cx="${L(tw+3)}" cy="${cy+16}" r="3.2" fill="#e6c13a" stroke="#8c6a1a" stroke-width=".7"/><circle cx="${R(tw+3)}" cy="${cy+16}" r="3.2" fill="#e6c13a" stroke="#8c6a1a" stroke-width=".7"/>`;
  // ---- rosto ----
  s += `<path d="${face}" fill="url(#${id}sk)" stroke="${ln}" stroke-width="1.1"/>`;
  s += `<g clip-path="url(#${id}fc)">`;
  // sombra do cabelo na testa e da mandíbula
  if (!['careca','raspado','calvo','moicano'].includes(av.hair)) s += `<path d="M${L(tw)} ${T+fh*0.32} Q${cx} ${T+fh*0.18} ${R(tw)} ${T+fh*0.32} L${R(tw)} ${T} L${L(tw)} ${T} Z" fill="${sDD}" opacity=".35"/>`;
  s += `<path d="M${R(cw-6)} ${cy+8} C${R(cw-6)} ${cy+fh*0.6} ${R(jw)} ${cy+fh*0.8} ${cx} ${cy+fh+2} L${R(cw+4)} ${cy+fh+4} Z" fill="${sD}" opacity=".45"/>`;
  // maçãs do rosto
  s += `<ellipse cx="${L(cw*0.55)}" cy="${cy+12}" rx="9" ry="5" fill="${sL}" opacity=".45"/><ellipse cx="${R(cw*0.55)}" cy="${cy+12}" rx="9" ry="5" fill="${sL}" opacity=".25"/>`;
  if (f || has('marks','bochechas') || mk === 'leve' || mk === 'completa') s += `<ellipse cx="${L(cw*0.55)}" cy="${cy+15}" rx="8" ry="5" fill="#e0606a" opacity="${has('marks','bochechas')?0.42:0.18}"/><ellipse cx="${R(cw*0.55)}" cy="${cy+15}" rx="8" ry="5" fill="#e0606a" opacity="${has('marks','bochechas')?0.42:0.18}"/>`;
  // idade e marcas
  const wr = (op) => `<path d="M${cx-13} ${T+fh*0.36} q13 -3 26 0 M${cx-10} ${T+fh*0.42} q10 -2 20 0" stroke="${sDD}" stroke-width="1" fill="none" opacity="${op}"/><path d="M${L(cw*0.45)} ${cy+10} q-3 10 2 18 M${R(cw*0.45)} ${cy+10} q3 10 -2 18" stroke="${sDD}" stroke-width="1.1" fill="none" opacity="${op}"/><path d="M${L(23)} ${cy-1} l-5 -2 M${L(23)} ${cy+2} l-5 1 M${R(23)} ${cy-1} l5 -2 M${R(23)} ${cy+2} l5 1" stroke="${sDD}" stroke-width=".9" opacity="${op}"/>`;
  if (age === 'maduro') s += wr(0.45);
  if (age === 'idoso' || has('marks','rugas')) s += wr(0.85) + `<path d="M${L(jw*0.6)} ${cy+fh*0.75} q4 6 10 7 M${R(jw*0.6)} ${cy+fh*0.75} q-4 6 -10 7" stroke="${sDD}" stroke-width="1" fill="none" opacity=".6"/>`;
  if (has('marks','sardas')) s += `<g fill="${shade(skin,0.62)}" opacity=".85">${[[-25,9],[-20,13],[-15,8],[-22,5],[-17,16],[15,8],[20,13],[25,9],[22,5],[17,16],[-5,10],[5,10],[0,8]].map(([x,y])=>`<circle cx="${cx+x}" cy="${cy+y}" r="${1+((x*7+y)&1)*0.4}"/>`).join('')}</g>`;
  if (has('marks','pinta')) s += `<circle cx="${cx+17}" cy="${cy+fh*0.55}" r="1.9" fill="#3b2418"/>`;
  s += `</g>`;
  // ---- olhos ----
  const ey = cy - 2, ew = 8;
  const up = {amendoado:4.2, sonolento:3.8, arregalado:6.8, fechado:4}[av.eyes] || 5.4, lo = up * 0.55;
  const eyePath = (x) => `M${x-ew} ${ey} C${x-ew*0.5} ${ey-up*1.28} ${x+ew*0.5} ${ey-up*1.28} ${x+ew} ${ey-0.6} C${x+ew*0.5} ${ey+lo*1.35} ${x-ew*0.5} ${ey+lo*1.35} ${x-ew} ${ey} Z`;
  const eyeDraw = (x, k) => {
    if (av.eyes === 'fechado') return `<path d="M${x-ew} ${ey+1} Q${x} ${ey-6} ${x+ew} ${ey+1}" stroke="${shade(ln,0.6)}" stroke-width="2.3" fill="none" stroke-linecap="round"/><path d="M${x-ew+1} ${ey+4} Q${x} ${ey+1} ${x+ew-1} ${ey+4}" stroke="${sDD}" stroke-width=".9" fill="none" opacity=".7"/>`;
    const ir = Math.min(up*0.92, 4.6);
    let e = '';
    if (mk === 'sombra' || mk === 'completa') e += `<path d="M${x-ew-1} ${ey-1} C${x-ew*0.5} ${ey-up*2.2} ${x+ew*0.5} ${ey-up*2.2} ${x+ew+1} ${ey-1}" fill="#7a4f86" opacity=".32"/>`;
    e += `<clipPath id="${id}e${k}"><path d="${eyePath(x)}"/></clipPath><path d="${eyePath(x)}" fill="#f6f2ea"/>`;
    e += `<g clip-path="url(#${id}e${k})"><circle cx="${x+0.5}" cy="${ey+0.3}" r="${ir}" fill="url(#${id}ir)" stroke="${shade(C('eyeColor'),0.4)}" stroke-width=".7"/><circle cx="${x+0.5}" cy="${ey+0.3}" r="${ir*0.42}" fill="#0c0806"/><circle cx="${x+1.9}" cy="${ey-1.4}" r="1.15" fill="#ffffff"/><circle cx="${x-0.9}" cy="${ey+1.6}" r=".55" fill="#ffffff" opacity=".8"/><path d="M${x-ew} ${ey-up} H${x+ew} V${ey-up*0.35} H${x-ew} Z" fill="${sDD}" opacity=".18"/></g>`;
    e += `<path d="M${x-ew} ${ey} C${x-ew*0.5} ${ey-up*1.28} ${x+ew*0.5} ${ey-up*1.28} ${x+ew} ${ey-0.6}" stroke="#1d130e" stroke-width="${f||mk!=='nenhuma'?2.3:1.7}" fill="none" stroke-linecap="round"/>`;
    e += `<path d="M${x-ew+1} ${ey+0.6} C${x-ew*0.4} ${ey+lo*1.3} ${x+ew*0.4} ${ey+lo*1.3} ${x+ew-0.5} ${ey}" stroke="${sDD}" stroke-width=".8" fill="none" opacity=".7"/>`;
    e += `<path d="M${x-ew+1} ${ey-up-2.4} Q${x} ${ey-up*1.75-2.6} ${x+ew-0.5} ${ey-up-1.8}" stroke="${sDD}" stroke-width=".9" fill="none" opacity=".6"/>`;
    if (av.eyes === 'sonolento') e += `<path d="M${x-ew} ${ey} C${x-ew*0.5} ${ey-up*1.28} ${x+ew*0.5} ${ey-up*1.28} ${x+ew} ${ey-0.6} L${x+ew} ${ey-0.2} C${x+ew*0.4} ${ey-up*0.35} ${x-ew*0.4} ${ey-up*0.35} ${x-ew} ${ey+0.4} Z" fill="${sD}" stroke="#1d130e" stroke-width="1.2"/>`;
    if (f || mk === 'completa' || mk === 'leve'){ const o = k === 'L' ? -1 : 1; e += [0,1,2].map(i=>`<path d="M${x+o*(ew-1-i*2.2)} ${ey-up*0.95+i*0.4} l${o*1.8} -2.3" stroke="#1d130e" stroke-width="1" stroke-linecap="round"/>`).join(''); }
    return e;
  };
  if (age === 'idoso' || has('marks','olheiras')) s += `<path d="M${L(14+ew)} ${ey+3} Q${L(14)} ${ey+9} ${L(14-ew)} ${ey+3} M${R(14-ew)} ${ey+3} Q${R(14)} ${ey+9} ${R(14+ew)} ${ey+3}" stroke="${shade(skin,0.66)}" stroke-width="1.6" fill="none" opacity=".7"/>`;
  s += eyeDraw(cx-14, 'L') + (has('marks','tapaolho') ? '' : eyeDraw(cx+14, 'R'));
  // ---- sobrancelhas afinando nas pontas ----
  const bcol = av.hair === 'careca' && av.beard === 'nenhuma' ? shade(skin, 0.45) : (['grisalho','branco'].includes(av.hairColor) ? shade(hc, 0.82) : hD);
  const [tI, tO, arch, drop] = {grossa:[5,2.6,2.6,0], fina:[2,0.9,3,0], arqueada:[3.1,1.2,6,0], franzida:[3.6,1.6,1,3], normal:[3.3,1.4,3,0]}[av.brows] || [3.3,1.4,3,0];
  const brow = (x, sgn) => { const xi = x - sgn*8, xo = x + sgn*9, by = ey - up - 5.5, mid = x + sgn*1.5;
    return `<path d="M${xi} ${by+drop} Q${mid} ${by-arch} ${xo} ${by+1.5} Q${mid} ${by-arch+(tI+tO)/2} ${xi} ${by+drop+tI} Z" fill="${bcol}" stroke="${shade(bcol,0.8)}" stroke-width=".4"/>`; };
  s += brow(cx-14, -1) + brow(cx+14, 1);
  // ---- nariz com sombra ----
  const ny = cy + 14, nw = {pequeno:3, largo:5.6}[av.nose] || 4.2;
  s += av.nose === 'aquilino' ? `<path d="M${cx+2} ${ey+2} Q${cx+8} ${ny-6} ${cx+3} ${ny+2}" stroke="${sDD}" stroke-width="1.6" fill="none" opacity=".75"/>` : `<path d="M${cx+3} ${ey+3} Q${cx+5} ${ny-5} ${cx+5} ${ny}" stroke="${sDD}" stroke-width="1.4" fill="none" opacity=".55"/>`;
  s += `<path d="M${cx-1.5} ${ey+5} Q${cx-2.5} ${ny-4} ${cx-1} ${ny-1}" stroke="${sL}" stroke-width="2" fill="none" opacity=".6"/>`;
  s += `<ellipse cx="${cx}" cy="${ny+2}" rx="${nw+0.5}" ry="3.6" fill="${sD}" opacity=".35"/><ellipse cx="${cx-0.8}" cy="${ny+0.8}" rx="2.4" ry="1.6" fill="${sL}" opacity=".7"/>`;
  s += `<path d="M${cx-nw-2} ${ny+1.5} Q${cx-nw-3} ${ny+5.5} ${cx-nw+0.5} ${ny+5.2} M${cx+nw+2} ${ny+1.5} Q${cx+nw+3} ${ny+5.5} ${cx+nw-0.5} ${ny+5.2}" stroke="${ln}" stroke-width="1.1" fill="none"/>`;
  s += `<ellipse cx="${cx-nw*0.55}" cy="${ny+5}" rx="1.7" ry="1" fill="${shade(skin,0.4)}"/><ellipse cx="${cx+nw*0.55}" cy="${ny+5}" rx="1.7" ry="1" fill="${shade(skin,0.4)}"/>`;
  // ---- boca ----
  const my = cy + Math.round(fh*0.56), mw = av.mouth === 'largo' ? 13 : av.mouth === 'serio' ? 9.5 : 11;
  const lipBase = mk === 'batom' || mk === 'completa' ? '#a51d34' : f ? mix(skin, '#b8505a', 0.55) : mix(skin, '#9c4a45', 0.32);
  const lipU = shade(lipBase, 0.82), lipLine = shade(lipBase, 0.5), full = av.mouth === 'labios' ? 1.5 : f ? 1.2 : 0.85;
  s += `<path d="M${cx-2} ${ny+7} Q${cx} ${my-4} ${cx+2} ${ny+7}" stroke="${sD}" stroke-width="1" fill="none" opacity=".5"/>`;
  if (av.mouth === 'largo') s += `<path d="M${cx-mw} ${my-1.5} Q${cx} ${my+2} ${cx+mw} ${my-1.5} Q${cx} ${my+12} ${cx-mw} ${my-1.5} Z" fill="#4a1616" stroke="${lipLine}" stroke-width="1.2"/><path d="M${cx-mw+2} ${my-0.6} Q${cx} ${my+2} ${cx+mw-2} ${my-0.6} L${cx+mw-3.5} ${my+2.6} Q${cx} ${my+4.5} ${cx-mw+3.5} ${my+2.6} Z" fill="#fbf8f0"/><path d="M${cx-mw+4} ${my+8} Q${cx} ${my+11} ${cx+mw-4} ${my+8}" stroke="${lipBase}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M${L(mw+3)} ${my-6} q-3 5 0 9 M${R(mw+3)} ${my-6} q3 5 0 9" stroke="${sDD}" stroke-width="1" fill="none" opacity=".6"/>`;
  else {
    const cY = av.mouth === 'sorriso' ? -1.8 : av.mouth === 'bravo' ? 2.2 : 0;
    s += `<path d="M${cx-mw} ${my+cY} Q${cx-mw*0.5} ${my-3.2*full} ${cx} ${my-1.6*full} Q${cx+mw*0.5} ${my-3.2*full} ${cx+mw} ${my+cY} Q${cx} ${my+1} ${cx-mw} ${my+cY} Z" fill="${lipU}"/>`;
    s += `<path d="M${cx-mw} ${my+cY} Q${cx} ${my+1} ${cx+mw} ${my+cY} Q${cx+mw*0.55} ${my+5.6*full} ${cx} ${my+6*full} Q${cx-mw*0.55} ${my+5.6*full} ${cx-mw} ${my+cY} Z" fill="${lipBase}"/>`;
    s += `<path d="M${cx-mw-1} ${my+cY-0.3} Q${cx} ${my+(av.mouth==='bravo'?-1:2.4)} ${cx+mw+1} ${my+cY-0.3}" stroke="${lipLine}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`;
    s += `<ellipse cx="${cx-2}" cy="${my+3.2*full}" rx="${mw*0.32}" ry="1.1" fill="#ffffff" opacity=".28"/>`;
    if (av.mouth === 'sorriso') s += `<path d="M${L(mw+2)} ${my-5} q-2.5 4 0 7 M${R(mw+2)} ${my-5} q2.5 4 0 7" stroke="${sDD}" stroke-width=".9" fill="none" opacity=".55"/>`;
  }
  // ---- queixo ----
  if (av.chin === 'furinho') s += `<path d="M${cx} ${cy+fh-6} v4" stroke="${sDD}" stroke-width="1.3" stroke-linecap="round" opacity=".8"/>`;
  if (av.chin === 'marcado') s += `<path d="M${cx-8} ${my+10} Q${cx} ${my+13} ${cx+8} ${my+10}" stroke="${sDD}" stroke-width="1.2" fill="none" opacity=".6"/><ellipse cx="${cx-2}" cy="${cy+fh-4}" rx="6" ry="2.5" fill="${sL}" opacity=".55"/>`;
  if (has('marks','cicatriz')) s += `<path d="M${cx+21} ${ey-15} L${cx+11} ${ey+13}" stroke="#a35a4a" stroke-width="2.2" stroke-linecap="round"/><path d="M${cx+20} ${ey-9} l-5 -1 M${cx+17} ${ey-2} l-5 -1 M${cx+14} ${ey+5} l-5 -1" stroke="#a35a4a" stroke-width="1.2"/>`;
  // ---- barba ----
  const B = av.beard, bF = hairFill;
  const stache = (h) => `<path d="M${cx} ${my-4} C${cx-5} ${my-8-h} ${cx-12} ${my-7-h} ${cx-14} ${my-2} C${cx-10} ${my-4} ${cx-5} ${my-4} ${cx} ${my-3} C${cx+5} ${my-4} ${cx+10} ${my-4} ${cx+14} ${my-2} C${cx+12} ${my-7-h} ${cx+5} ${my-8-h} ${cx} ${my-4} Z" fill="${bF}" stroke="${hD}" stroke-width=".8"/>`;
  if (B === 'bigode') s += stache(1);
  if (B === 'imperial') s += `<path d="M${cx} ${my-5} C${cx-8} ${my-11} ${cx-18} ${my-5} ${cx-27} ${my-15} C${cx-22} ${my-1} ${cx-9} ${my-2} ${cx} ${my-3} C${cx+9} ${my-2} ${cx+22} ${my-1} ${cx+27} ${my-15} C${cx+18} ${my-5} ${cx+8} ${my-11} ${cx} ${my-5} Z" fill="${bF}" stroke="${hD}" stroke-width=".8"/>`;
  if (B === 'cavanhaque') s += stache(0) + `<path d="M${cx-9} ${my+6} Q${cx} ${my+4} ${cx+9} ${my+6} Q${cx+6} ${cy+fh+6} ${cx} ${cy+fh+8} Q${cx-6} ${cy+fh+6} ${cx-9} ${my+6} Z" fill="${bF}" stroke="${hD}" stroke-width=".8"/>`;
  if (B === 'curta' || B === 'cheia' || B === 'longa'){
    const d = B === 'curta' ? 4 : B === 'cheia' ? 12 : 30;
    s += `<path d="M${L(cw-1)} ${cy+8} C${L(cw-1)} ${cy+fh*0.6} ${L(jw+4)} ${cy+fh*0.8+d*0.5} ${cx} ${cy+fh+d} C${R(jw+4)} ${cy+fh*0.8+d*0.5} ${R(cw-1)} ${cy+fh*0.6} ${R(cw-1)} ${cy+8} C${R(cw-6)} ${cy+20} ${R(mw+5)} ${my-2} ${R(mw)} ${my+4} Q${cx} ${my+9} ${L(mw)} ${my+4} C${L(mw+5)} ${my-2} ${L(cw-6)} ${cy+20} ${L(cw-1)} ${cy+8} Z" fill="${bF}" opacity="${B==='curta'?0.62:0.97}" stroke="${B==='curta'?'none':hD}" stroke-width=".8"/>` + stache(B === 'curta' ? 0 : 1);
    if (B !== 'curta') s += [...Array(9)].map((_,i)=>`<path d="M${cx-20+i*5} ${cy+fh-4+(i%2)*3} q1 5 0 ${6+d*0.3}" stroke="${hL}" stroke-width=".8" fill="none" opacity=".5"/>`).join('');
    else s += `<g fill="${hD}" opacity=".5">${[...Array(26)].map((_,i)=>`<circle cx="${cx-22+(i*7)%44}" cy="${cy+fh-12+((i*13)%14)}" r=".7"/>`).join('')}</g>`;
  }
  if (B === 'costeletas') s += `<path d="M${L(tw-1)} ${cy-10} V${cy+24} Q${L(tw-8)} ${cy+30} ${L(tw-10)} ${cy+20} V${cy-10} Z M${R(tw-1)} ${cy-10} V${cy+24} Q${R(tw-8)} ${cy+30} ${R(tw-10)} ${cy+20} V${cy-10} Z" fill="${bF}" stroke="${hD}" stroke-width=".8"/>`;
  // ---- cabelo da frente (com mechas) ----
  const top = T;
  const strands = (pts) => pts.map(([x1,y1,x2,y2])=>`<path d="M${x1} ${y1+5} Q${(x1+x2)/2+3} ${(y1+y2)/2+4} ${x2} ${y2+5}" stroke="${hL}" stroke-width="1" fill="none" opacity=".55"/>`).join('');
  const front = {
    raspado:`<path d="M${L(tw)} ${cy-8} C${L(tw)} ${top-2} ${R(tw)} ${top-2} ${R(tw)} ${cy-8} Q${cx} ${top+12} ${L(tw)} ${cy-8} Z" fill="${hc}" opacity=".5"/>`,
    curto:`<path d="M${L(tw+2)} ${cy-4} C${L(tw+4)} ${top-27} ${R(tw+4)} ${top-27} ${R(tw+2)} ${cy-4} Q${R(tw-4)} ${top+8} ${R(8)} ${top+11} Q${cx} ${top+7} ${L(8)} ${top+11} Q${L(tw-4)} ${top+8} ${L(tw+2)} ${cy-4} Z" fill="${hairFill}" ${hairStroke}/>` + strands([[cx-20,top,cx-8,top+8],[cx-4,top-4,cx+6,top+7],[cx+10,top-2,cx+20,top+8]]),
    topete:`<path d="M${L(tw+2)} ${cy-4} C${L(tw+4)} ${top-6} ${L(14)} ${top-14} ${L(4)} ${top-16} C${R(14)} ${top-26} ${R(tw+6)} ${top-8} ${R(tw+2)} ${cy-4} Q${R(tw-4)} ${top+10} ${cx} ${top+12} Q${L(tw-4)} ${top+10} ${L(tw+2)} ${cy-4} Z" fill="${hairFill}" ${hairStroke}/>` + strands([[cx-14,top-8,cx+14,top-14],[cx-8,top-2,cx+18,top-6],[cx-20,top+4,cx+4,top]]),
    lateral:`<path d="M${L(tw+2)} ${cy-4} C${L(tw+4)} ${top-27} ${R(tw+6)} ${top-27} ${R(tw+2)} ${cy-8} Q${R(tw-4)} ${top+6} ${L(8)} ${top+16} L${L(12)} ${top+4} Q${L(tw-4)} ${top+12} ${L(tw+2)} ${cy-4} Z" fill="${hairFill}" ${hairStroke}/>` + strands([[cx-6,top-4,cx+24,top+4],[cx-4,top+2,cx+20,top+10]]),
    calvo:`<path d="M${L(tw+2)} ${cy+4} C${L(tw+4)} ${cy-20} ${L(tw-6)} ${cy-30} ${L(tw-12)} ${cy-30} L${L(tw-12)} ${cy-14} Z M${R(tw+2)} ${cy+4} C${R(tw+4)} ${cy-20} ${R(tw-6)} ${cy-30} ${R(tw-12)} ${cy-30} L${R(tw-12)} ${cy-14} Z" fill="${hairFill}" ${hairStroke}/>`,
    cacheado:`<g fill="${hairFill}" ${hairStroke}>${[-0.85,-0.45,0,0.45,0.85].map(t=>`<circle cx="${cx+t*tw}" cy="${top+3-Math.cos(t)*5}" r="12"/>`).join('')}</g><g fill="none" stroke="${hL}" stroke-width="1" opacity=".55">${[-0.85,-0.45,0,0.45,0.85].map(t=>`<path d="M${cx+t*tw-5} ${top+1} q5 -6 9 0"/>`).join('')}</g>`,
    crespo:`<path d="M${L(tw+2)} ${cy-10} Q${cx} ${top+16} ${R(tw+2)} ${cy-10} Q${R(tw+4)} ${top-4} ${cx} ${top-8} Q${L(tw+4)} ${top-4} ${L(tw+2)} ${cy-10} Z" fill="${hairFill}"/><g fill="none" stroke="${hL}" stroke-width=".9" opacity=".35">${[-16,-6,4,14].map(x=>`<path d="M${cx+x} ${top+2} q3 -3 6 0"/>`).join('')}</g>`,
    medio:`<path d="M${L(tw+7)} ${cy+8} C${L(tw+8)} ${top-27} ${R(tw+8)} ${top-27} ${R(tw+7)} ${cy+8} Q${R(tw-3)} ${top+8} ${R(2)} ${top+14} Q${L(tw-2)} ${top+10} ${L(tw+7)} ${cy+8} Z" fill="${hairFill}" ${hairStroke}/>` + strands([[cx-24,top+4,cx-30,cy],[cx+24,top+4,cx+30,cy],[cx-6,top-4,cx+16,top+8]]),
    longo:`<path d="M${L(tw+7)} ${cy+12} C${L(tw+8)} ${top-27} ${R(tw+8)} ${top-27} ${R(tw+7)} ${cy+12} Q${R(tw-2)} ${top+12} ${R(4)} ${top+12} Q${L(10)} ${top+22} ${L(tw+7)} ${cy+12} Z" fill="${hairFill}" ${hairStroke}/>` + strands([[cx-26,top+8,cx-34,cy+30],[cx+26,top+8,cx+34,cy+30],[cx-8,top-4,cx+14,top+8]]),
    rabo:`<path d="M${L(tw+3)} ${cy-4} C${L(tw+4)} ${top-27} ${R(tw+4)} ${top-27} ${R(tw+3)} ${cy-4} Q${cx} ${top+9} ${L(tw+3)} ${cy-4} Z" fill="${hairFill}" ${hairStroke}/>` + strands([[cx-20,top+2,cx+10,top-4],[cx-10,top+6,cx+20,top]]),
    coque:`<circle cx="${cx}" cy="${top-12}" r="15" fill="${hairFill}" ${hairStroke}/><path d="M${cx-10} ${top-16} q10 -6 20 0" stroke="${hL}" stroke-width="1.2" fill="none" opacity=".6"/><path d="M${L(tw+3)} ${cy-4} C${L(tw+4)} ${top-27} ${R(tw+4)} ${top-27} ${R(tw+3)} ${cy-4} Q${cx} ${top+9} ${L(tw+3)} ${cy-4} Z" fill="${hairFill}" ${hairStroke}/>` + strands([[cx-20,top+2,cx-2,top-6],[cx+20,top+2,cx+2,top-6]]),
    trancas:`<path d="M${L(tw+3)} ${cy-4} C${L(tw+4)} ${top-27} ${R(tw+4)} ${top-27} ${R(tw+3)} ${cy-4} Q${cx} ${top+9} ${L(tw+3)} ${cy-4} Z" fill="${hairFill}" ${hairStroke}/><path d="M${cx} ${top-6} V${top+8}" stroke="${hD}" stroke-width="1.2"/>`,
    chanel:`<path d="M${L(tw+9)} ${cy+32} V${cy-6} C${L(tw+8)} ${top-27} ${R(tw+8)} ${top-27} ${R(tw+9)} ${cy-6} V${cy+32} H${R(tw-1)} V${cy-6} Q${cx} ${top+18} ${L(tw-1)} ${cy-6} V${cy+32} Z" fill="${hairFill}" ${hairStroke}/><path d="M${L(tw-1)} ${cy-4} Q${cx} ${top+16} ${R(tw-1)} ${cy-4}" stroke="${hD}" stroke-width="1" fill="none"/>` + strands([[cx-30,top+6,cx-34,cy+24],[cx+30,top+6,cx+34,cy+24]]),
    moicano:`<path d="M${cx-9} ${cy-22} C${cx-11} ${top-14} ${cx-6} ${top-30} ${cx} ${top-32} C${cx+6} ${top-30} ${cx+11} ${top-14} ${cx+9} ${cy-22} Z" fill="${hairFill}" ${hairStroke}/><path d="M${L(tw)} ${cy-6} C${L(tw)} ${top+4} ${cx-12} ${top} ${cx-10} ${top+4} M${R(tw)} ${cy-6} C${R(tw)} ${top+4} ${cx+12} ${top} ${cx+10} ${top+4}" stroke="${hc}" stroke-width="3" fill="none" opacity=".35"/>`
  }[av.hair] || '';
  s += front;
  // ---- óculos ----
  const G2 = av.glasses;
  const lens = 'rgba(220,235,245,.18)';
  if (G2 === 'redondo') s += `<g stroke="#2b2420" stroke-width="2" fill="${lens}"><circle cx="${cx-14}" cy="${ey}" r="9.5"/><circle cx="${cx+14}" cy="${ey}" r="9.5"/><path d="M${cx-4.5} ${ey-1} Q${cx} ${ey-4} ${cx+4.5} ${ey-1}" fill="none"/><path d="M${L(23.5)} ${ey-2} L${L(tw+1)} ${ey-4} M${R(23.5)} ${ey-2} L${R(tw+1)} ${ey-4}" fill="none"/></g><path d="M${cx-19} ${ey-5} l4 -2 M${cx+9} ${ey-5} l4 -2" stroke="#fff" stroke-width="1.2" opacity=".7"/>`;
  if (G2 === 'quadrado') s += `<g stroke="#1e1a17" stroke-width="2.4" fill="${lens}"><rect x="${cx-25}" y="${ey-7.5}" width="20" height="15" rx="3"/><rect x="${cx+5}" y="${ey-7.5}" width="20" height="15" rx="3"/><path d="M${cx-5} ${ey-2} H${cx+5} M${L(25)} ${ey-3} L${L(tw+1)} ${ey-5} M${R(25)} ${ey-3} L${R(tw+1)} ${ey-5}" fill="none"/></g><path d="M${cx-21} ${ey-4} l5 -2 M${cx+9} ${ey-4} l5 -2" stroke="#fff" stroke-width="1.2" opacity=".6"/>`;
  if (G2 === 'sol') s += `<g><path d="M${cx-26} ${ey-7} H${cx-4} Q${cx-4} ${ey+8} ${cx-15} ${ey+8} Q${cx-26} ${ey+8} ${cx-26} ${ey-7} Z M${cx+26} ${ey-7} H${cx+4} Q${cx+4} ${ey+8} ${cx+15} ${ey+8} Q${cx+26} ${ey+8} ${cx+26} ${ey-7} Z" fill="#141414" stroke="#000" stroke-width="1.2"/><path d="M${cx-4} ${ey-5} H${cx+4} M${L(26)} ${ey-6} L${L(tw+1)} ${ey-7} M${R(26)} ${ey-6} L${R(tw+1)} ${ey-7}" stroke="#000" stroke-width="2"/><path d="M${cx-22} ${ey-4} l7 0 M${cx+8} ${ey-4} l7 0" stroke="#fff" stroke-width="1.4" opacity=".35"/></g>`;
  if (G2 === 'monoculo') s += `<circle cx="${cx+14}" cy="${ey}" r="9.5" stroke="#c9a13b" stroke-width="2.2" fill="${lens}"/><path d="M${cx+9} ${ey-5} l4 -2" stroke="#fff" stroke-width="1.2" opacity=".7"/><path d="M${cx+22} ${ey+5} q9 22 -4 44" stroke="#c9a13b" stroke-width="1.1" fill="none"/>`;
  if (has('marks','tapaolho')) s += `<path d="M${L(tw)} ${ey-19} L${R(tw)} ${ey+11}" stroke="#151515" stroke-width="2.4"/><path d="M${cx+4} ${ey-7} Q${cx+14} ${ey-11} ${cx+24} ${ey-5} Q${cx+25} ${ey+7} ${cx+14} ${ey+9} Q${cx+4} ${ey+7} ${cx+4} ${ey-7} Z" fill="#151515"/>`;
  // ---- na cabeça ----
  const Ht = av.hat, ht = top - 2;
  const gold = `fill="#e2b53b" stroke="#8c6a1a" stroke-width="1.4"`;
  if (Ht === 'coroa') s += `<path d="M${cx-29} ${ht+5} L${cx-31} ${ht-22} L${cx-16} ${ht-9} L${cx} ${ht-30} L${cx+16} ${ht-9} L${cx+31} ${ht-22} L${cx+29} ${ht+5} Z" ${gold}/><path d="M${cx-29} ${ht+5} H${cx+29} V${ht-2} H${cx-29} Z" fill="#c9a13b" stroke="#8c6a1a" stroke-width="1"/><circle cx="${cx}" cy="${ht+1.5}" r="3.4" fill="#b3261e"/><circle cx="${cx-17}" cy="${ht+1.5}" r="2.6" fill="#1f4e8c"/><circle cx="${cx+17}" cy="${ht+1.5}" r="2.6" fill="#2d6a2d"/>${[[-31,-22],[0,-30],[31,-22]].map(([x,y])=>`<circle cx="${cx+x}" cy="${ht+y}" r="2.6" fill="#f4f1ea" stroke="#8c6a1a" stroke-width=".6"/>`).join('')}<path d="M${cx-24} ${ht-4} L${cx-25} ${ht-16}" stroke="#fff3b0" stroke-width="1.2" opacity=".7"/>`;
  if (Ht === 'tiara') s += `<path d="M${cx-27} ${ht+9} Q${cx} ${ht-15} ${cx+27} ${ht+9}" stroke="#ece2bf" stroke-width="3.6" fill="none"/><path d="M${cx-9} ${ht-1} L${cx} ${ht-15} L${cx+9} ${ht-1} Z" fill="#ece2bf" stroke="#b9ab80" stroke-width=".8"/><circle cx="${cx}" cy="${ht-5}" r="2.8" fill="#3d78b5"/>${[-18,18].map(x=>`<circle cx="${cx+x}" cy="${ht+1}" r="1.8" fill="#ffffff"/>`).join('')}`;
  if (Ht === 'quepe') s += `<path d="M${cx-35} ${ht+11} C${cx-38} ${ht-14} ${cx-20} ${ht-26} ${cx} ${ht-26} C${cx+20} ${ht-26} ${cx+38} ${ht-14} ${cx+35} ${ht+11} Z" fill="url(#${id}cl)" stroke="${oD}" stroke-width="1.2"/><rect x="${cx-35}" y="${ht+5}" width="70" height="9" fill="#151515"/><path d="M${cx-34} ${ht+9} H${cx+34}" stroke="#d8b24a" stroke-width="1.6"/><path d="M${cx-30} ${ht+14} Q${cx} ${ht+26} ${cx+30} ${ht+14} Z" fill="#1d1d1d" stroke="#000" stroke-width=".8"/><path d="M${cx-22} ${ht+17} Q${cx} ${ht+22} ${cx+12} ${ht+18}" stroke="#555" stroke-width="1" fill="none"/><circle cx="${cx}" cy="${ht-4}" r="5.5" fill="#d8b24a" stroke="#8c6a1a"/><path d="M${cx} ${ht-8} l1.3 2.7 3 .4 -2.2 2 .6 3 -2.7 -1.5 -2.7 1.5 .6 -3 -2.2 -2 3 -.4 Z" fill="#8c6a1a"/>`;
  if (Ht === 'cartola') s += `<path d="M${cx-22} ${ht+3} L${cx-20} ${ht-40} Q${cx} ${ht-44} ${cx+20} ${ht-40} L${cx+22} ${ht+3} Z" fill="#161616" stroke="#000"/><rect x="${cx-22}" y="${ht-7}" width="44" height="7" fill="#7a1b1b"/><path d="M${cx-36} ${ht+4} Q${cx} ${ht+12} ${cx+36} ${ht+4} Q${cx} ${ht} ${cx-36} ${ht+4} Z" fill="#111" stroke="#000"/><path d="M${cx-14} ${ht-36} V${ht-10}" stroke="#444" stroke-width="2" opacity=".6"/>`;
  if (Ht === 'boina') s += `<path d="M${cx-36} ${ht+6} C${cx-40} ${ht-16} ${cx+30} ${ht-24} ${cx+44} ${ht} C${cx+30} ${ht+8} ${cx-20} ${ht+12} ${cx-36} ${ht+6} Z" fill="url(#${id}cl)" stroke="${oD}" stroke-width="1"/><circle cx="${cx+4}" cy="${ht-14}" r="2.6" fill="${oD}"/>`;
  if (Ht === 'turbante') s += `<path d="M${cx-37} ${ht+12} C${cx-40} ${ht-24} ${cx+40} ${ht-24} ${cx+37} ${ht+12} Q${cx} ${ht+2} ${cx-37} ${ht+12} Z" fill="#f2ede0" stroke="#c9bfa3" stroke-width="1.2"/>${[0,1,2].map(i=>`<path d="M${cx-34+i*6} ${ht+8-i*8} Q${cx} ${ht-4-i*8} ${cx+34-i*6} ${ht+8-i*8}" stroke="#d6ccb1" stroke-width="1.4" fill="none"/>`).join('')}<path d="M${cx} ${ht-14} l4 6 -4 6 -4 -6 Z" fill="#2d6a2d" stroke="#d8b24a"/>`;
  if (Ht === 'mitra') s += `<path d="M${cx-24} ${ht+8} L${cx-20} ${ht-30} Q${cx} ${ht-54} ${cx+20} ${ht-30} L${cx+24} ${ht+8} Z" fill="#f2ede0" stroke="#d8b24a" stroke-width="2.4"/><path d="M${cx} ${ht-44} V${ht+6} M${cx-11} ${ht-18} H${cx+11}" stroke="#d8b24a" stroke-width="4"/><path d="M${cx-24} ${ht+8} H${cx+24}" stroke="#d8b24a" stroke-width="4"/>`;
  if (Ht === 'capacete') s += `<path d="M${cx-39} ${ht+14} C${cx-40} ${ht-26} ${cx+40} ${ht-26} ${cx+39} ${ht+14} Z" fill="#56643f" stroke="#2e3622" stroke-width="1.2"/><path d="M${cx-24} ${ht-12} Q${cx} ${ht-20} ${cx+14} ${ht-14}" stroke="#7d8c62" stroke-width="2" fill="none"/><rect x="${cx-42}" y="${ht+10}" width="84" height="6" rx="3" fill="#3a462c"/>`;
  if (Ht === 'fone') s += `<path d="M${L(tw+4)} ${cy} C${L(tw+4)} ${top-16} ${R(tw+4)} ${top-16} ${R(tw+4)} ${cy}" stroke="#2a2f3a" stroke-width="5" fill="none"/><rect x="${L(tw+11)}" y="${cy-9}" width="11" height="22" rx="4.5" fill="#2a2f3a"/><rect x="${R(tw)}" y="${cy-9}" width="11" height="22" rx="4.5" fill="#2a2f3a"/><path d="M${R(tw+4)} ${cy+11} q-6 16 -22 18" stroke="#5ff0ff" stroke-width="2" fill="none"/><circle cx="${R(tw-18)}" cy="${cy+29}" r="2.2" fill="#5ff0ff"/>`;
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
