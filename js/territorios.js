// ============================================================
//  IMPERIUM — Negociação de territórios
//  • Na janela de cada nação: comprar, vender ou trocar regiões
//    (estados reais quando existem), com dinheiro — da fronteira ou
//    longe dela (uma colônia, um território do outro lado do mar)
//  • Eles aceitam conforme o preço, as relações e a força de cada um
//  • Capitais não entram; ninguém vende mais de 1/3 do país
//  • Também aqui: o risco de derramamento nas plataformas de petróleo
// ============================================================
'use strict';

const LAND_NEG_COOLDOWN = 6;   // meses entre propostas para a mesma nação

// regiões de "owner" que encostam em "other" (agrupadas por estado real; sem estado, blocos de fronteira)
function borderRegions(owner, other, all){
  const cs = typeof cellStates === 'function' ? cellStates() : null;
  const capCell = owner === 1 ? G.p.capCell : G.nations[owner].cap;
  const total = owner === 1 ? G.nations[1].cells : G.nations[owner].cells;
  const border = [];
  for (let i = 0; i < NCELLS; i++) if (Grid.land[i] && Grid.owner[i] === owner && neighbors4(i).some(nb => Grid.land[nb] && Grid.owner[nb] === other)) border.push(i);
  const regs = new Map(), used = new Set();
  // longe da fronteira também: o resto do país, depois das regiões de fronteira
  if (all){ const bs = new Set(border); for (let i = 0; i < NCELLS; i++) if (Grid.land[i] && Grid.owner[i] === owner && !bs.has(i)) border.push(i); }
  const nb0 = new Set(border.filter(i => neighbors4(i).some(nb => Grid.land[nb] && Grid.owner[nb] === other)));
  for (const c of border){
    if (used.has(c)) continue;
    const si = cs ? cs[c] : -1;
    let key, cells, name;
    if (si >= 0 && typeof stateName === 'function' && stateName(si)){
      key = 's' + si; if (regs.has(key)) continue;
      cells = []; for (let i = 0; i < NCELLS; i++) if (cs[i] === si && Grid.land[i] && Grid.owner[i] === owner) cells.push(i);
      name = stateName(si);
    } else {
      cells = bfsCells(c, owner, 6); key = 'b' + c; name = '';
    }
    cells.forEach(x => used.add(x));
    if (!cells.length || cells.includes(capCell) || cells.length > total/3) continue;
    regs.set(key, {key, cells, name, far: !cells.some(x => nb0.has(x))});
  }
  let k = 0, kf = 0;
  const list = [...regs.values()].sort((a, b) => (a.far - b.far) || a.cells.length - b.cells.length).slice(0, all ? 40 : 14);
  for (const r of list) if (!r.name) r.name = r.far ? `Região ${String.fromCharCode(65 + kf++)}` : `Fronteira ${String.fromCharCode(65 + k++)}`;
  for (const r of list) if (r.far) r.name += ' (longe)';
  return list;
}

// valor de uma região para quem a possui (≈ 1,5 ano da produção dela, mais se tiver cidades)
function regionValue(owner, reg){
  const n = owner === 1 ? null : G.nations[owner];
  const gdp = owner === 1 ? G.p.gdp : n.pop*n.pc, cells = owner === 1 ? G.nations[1].cells : n.cells;
  let v = gdp * reg.cells.length / Math.max(1, cells) * 1.5;
  if (typeof cityAt === 'function') for (const c of reg.cells){ const ct = cityAt(c); if (ct) v *= 1 + Math.min(0.5, (ct.pop||0)/2000); }
  return v;
}

// chance de a IA aceitar: give = região nossa que damos, take = região deles que pedimos, money > 0 = pagamos
function landDealChance(n, give, take, money){
  if (n.atWar) return 0;
  if (n.rel < -30) return 0.02;
  const vTake = take ? regionValue(n.id, take) : 0, vGive = give ? regionValue(1, give) : 0;
  const gain = vGive + money, loss = vTake;
  if (loss <= 0) return clamp(0.5 + gain/Math.max(1, G.p.gdp*0.01)*0.1 + n.rel/200, 0.05, 0.97);   // só ganham: quase sempre aceitam
  const ratio = gain / loss;
  let c = (ratio - 1)*1.1 + 0.3 + n.rel/180;
  if (G.p.atk > n.power*2) c += 0.12;                  // pressão do vizinho mais forte
  c -= (n.ag||0.3)*0.25;                                // nacionalistas não gostam de vender terra
  if (take && take.cells.length > n.cells*0.15) c -= 0.15;
  if (take && take.far) c -= 0.05;                     // terra longe da nossa fronteira: um pouco mais difícil
  return clamp(c, 0.02, 0.93);
}

function proposeLandDeal(n, give, take, money){
  const p = G.p;
  if (!give && !take) return {ok:false, why:'Escolha ao menos uma região.'};
  if (money > 0 && p.treasury < money) return {ok:false, why:'Tesouro insuficiente para pagar esse valor.'};
  if (money < 0 && -money > n.pop*n.pc*0.06) return {ok:false, why:`${n.name} não tem como pagar tanto.`};
  if ((n._landNeg||-99) + LAND_NEG_COOLDOWN > G.turn) return {ok:false, why:`Já negociamos terras com ${n.name} há pouco. Aguarde ${n._landNeg + LAND_NEG_COOLDOWN - G.turn} mês(es).`};
  n._landNeg = G.turn;
  const ch = landDealChance(n, give, take, money);
  if (!chance(ch)){ changeRel(n, -3); return {ok:true, accepted:false, msg:`${n.name} recusou a proposta de território.`}; }
  // pagamento
  p.treasury -= money; if (money < 0 && (!G.online || G.online.host)) n.pc *= 1 + money/(n.pop*n.pc);   // eles pagam do PIB deles
  // transferências (compras não contam como ocupação militar)
  const occ0 = p.occupied;
  if (take){ transferCells(take.cells, n.id, 1); p.occupied = occ0 + take.cells.length*0.05; }
  if (give) transferCells(give.cells, 1, n.id);
  changeRel(n, take && !give ? 2 : 6);
  G.stats.landDeals = (G.stats.landDeals||0) + 1;
  recount(); computeAdjacency(); derive(); MapView.dirty = true; if (typeof computeRails === 'function') MapView.rails = computeRails();
  const parts = [take ? `recebemos ${take.name}` : '', give ? `cedemos ${give.name}` : '', money > 0 ? `pagamos ${fmtMoney(money)}` : money < 0 ? `recebemos ${fmtMoney(-money)}` : ''].filter(Boolean).join(', ');
  addNews(`${p.name} e ${n.name} assinam tratado de fronteiras.`);
  return {ok:true, accepted:true, msg:`🗺️ Tratado com ${n.name}: ${parts}.`};
}

function openLandDeal(id){
  const n = G.nations[id], p = G.p; if (!n || !n.alive) return;
  const theirs = borderRegions(id, 1, true), ours = borderRegions(1, id, true);
  if (!theirs.length && !ours.length){ toast(`Não há regiões negociáveis com ${esc(n.name)}.`, 'bad'); return; }
  let give = null, take = null, money = 0;
  // faixa do dinheiro: passos inteiros que passam pelo zero (o controle não "pula" para o lado errado)
  const maxPay0 = Math.max(0, Math.min(p.treasury, p.gdp*0.5)), maxGet0 = n.pop*n.pc*0.06;
  const step = Math.max(1, Math.round((maxPay0 + maxGet0)/400)), maxPay = Math.floor(maxPay0/step)*step, maxGet = Math.floor(maxGet0/step)*step;
  const opt = (list, side) => `<option value="">— nenhuma —</option>` + list.map((r, i) => `<option value="${i}">${esc(r.name)} · ${r.cells.length} região(ões) · vale ~${fmtMoney(regionValue(side === 'them' ? id : 1, r))}</option>`).join('');
  const m = openModal(`<div class="m-icon">🗺️</div><div class="m-title">Negociar territórios com ${esc(n.name)}</div>
    <div class="tip">Compre, venda ou troque regiões — da fronteira ou longe dela. Capitais não entram.${adjacent(1, id) ? '' : ` Não temos fronteira com ${esc(n.name)}: as regiões compradas ficam separadas do nosso país.`} ${esc(n.name)} aceita conforme o preço, as relações (${n.rel > 0 ? '+' : ''}${n.rel}) e a nossa força.</div>
    <div class="grid2" style="gap:12px">
      <div class="field"><label>📥 Pedimos deles</label><select id="ld-take">${opt(theirs, 'them')}</select></div>
      <div class="field"><label>📤 Damos a eles</label><select id="ld-give">${opt(ours, 'us')}</select></div>
    </div>
    <div class="field"><label>💰 Dinheiro: <b id="ld-mv">nada</b></label><input type="range" id="ld-money" min="${-maxGet}" max="${maxPay}" step="${step}" value="0" style="width:100%">
      <div class="flex" style="justify-content:space-between"><small class="muted">← eles pagam</small><small class="muted">nós pagamos →</small></div></div>
    <canvas id="ld-map" width="420" height="200" style="width:100%;background:#efe4c8;border:2px solid var(--ink2)"></canvas>
    <div class="box" id="ld-sum"></div>
    <div class="m-actions"><button class="btn" id="ld-x">Cancelar</button><button class="btn" id="ld-fair">⚖️ Preço justo</button><button class="btn green" id="ld-ok">Propor tratado</button></div>`, {wide:true});
  const $m = s => m.querySelector(s);
  // mini mapa: nós, eles e as regiões escolhidas
  const draw = () => {
    const cv = $m('#ld-map'), x = cv.getContext('2d'), cells = [];
    for (let i = 0; i < NCELLS; i++) if (Grid.land[i] && (Grid.owner[i] === 1 || Grid.owner[i] === id)) cells.push(i);
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const c of cells){ const cx = c % CW, cy = (c / CW) | 0; x0 = Math.min(x0, cx); x1 = Math.max(x1, cx); y0 = Math.min(y0, cy); y1 = Math.max(y1, cy); }
    const sc = Math.min(cv.width/(x1 - x0 + 1), cv.height/(y1 - y0 + 1)), ox = (cv.width - (x1 - x0 + 1)*sc)/2, oy = (cv.height - (y1 - y0 + 1)*sc)/2;
    x.clearRect(0, 0, cv.width, cv.height);
    const tk = new Set(take ? take.cells : []), gv = new Set(give ? give.cells : []);
    for (const c of cells){ const cx = c % CW, cy = (c / CW) | 0;
      x.fillStyle = tk.has(c) ? '#d4a017' : gv.has(c) ? '#b3261e' : Grid.owner[c] === 1 ? (G.nations[1].color || '#3d7a3a') : (n.color || '#888');
      x.globalAlpha = tk.has(c) || gv.has(c) ? 1 : 0.55; x.fillRect(ox + (cx - x0)*sc, oy + (cy - y0)*sc, Math.ceil(sc), Math.ceil(sc)); }
    x.globalAlpha = 1;
  };
  const update = () => {
    take = $m('#ld-take').value === '' ? null : theirs[+$m('#ld-take').value];
    give = $m('#ld-give').value === '' ? null : ours[+$m('#ld-give').value];
    money = +$m('#ld-money').value;
    $m('#ld-mv').textContent = money > 0 ? `pagamos ${fmtMoney(money)}` : money < 0 ? `eles pagam ${fmtMoney(-money)}` : 'nada';
    const vT = take ? regionValue(id, take) : 0, vG = give ? regionValue(1, give) : 0, ch = (give || take) ? landDealChance(n, give, take, money) : 0;
    const lostB = give ? (p.buildings||[]).filter(b => give.cells.includes(b.c)).length : 0;
    $m('#ld-sum').innerHTML = `${row('Recebemos', take ? `${esc(take.name)} (vale ~${fmtMoney(vT)})` : '—')}${row('Cedemos', give ? `${esc(give.name)} (vale ~${fmtMoney(vG)})` : '—')}
      ${lostB ? row('⚠️ Obras perdidas', `${lostB} construção(ões) na região cedida`, 'down') : ''}
      ${row('Chance de aceitarem', give || take ? `<b class="${ch >= 0.5 ? 'up' : 'down'}">${Math.round(ch*100)}%</b>` : '—')}`;
    $m('#ld-ok').disabled = !give && !take;
    draw();
  };
  $m('#ld-take').onchange = update; $m('#ld-give').onchange = update; $m('#ld-money').oninput = update;
  // preço justo: o dinheiro que equilibra a troca (+10% para convencer)
  $m('#ld-fair').onclick = () => { SFX.click(); const vT = take ? regionValue(id, take) : 0, vG = give ? regionValue(1, give) : 0; const v = clamp(Math.round((vT - vG)*1.1/step)*step, -maxGet, maxPay); $m('#ld-money').value = v; update(); };
  $m('#ld-x').onclick = () => { SFX.click(); closeModal(); openNation(id); };
  $m('#ld-ok').onclick = () => {
    const r = proposeLandDeal(n, give, take, money);
    if (!r.ok){ SFX.error(); toast(esc(r.why), 'bad'); return; }
    closeModal();
    if (r.accepted){ SFX.fanfare(); toast(esc(r.msg), 'good'); addLog(r.msg, 'dip'); const c = (take || give).cells[0]; const [lo, la] = cellCenter(c); MapView.flyTo(lo, la, 3); if (take) MapView.flashCells(take.cells, '#d4a017'); }
    else { SFX.error(); toast(esc(r.msg), 'bad'); addLog(r.msg, 'dip'); }
    refreshAll(); saveGame();
  };
  update();
}

// botão na janela da nação (vizinhos em paz)
const _ldOpen = openNation;
openNation = function(id){
  _ldOpen(id);
  const n = G.nations[id]; if (!n || n.human || n.atWar || !n.alive) return;
  const grid = $('#modal') && $('#modal').querySelector('.btn-grid'); if (!grid) return;
  const wait = (n._landNeg||-99) + LAND_NEG_COOLDOWN - G.turn;
  grid.insertAdjacentHTML('afterbegin', `<button class="btn sm" data-ldeal="${id}" ${wait > 0 ? 'disabled' : ''} title="${wait > 0 ? `Aguarde ${wait} mês(es)` : 'Comprar, vender ou trocar regiões (perto ou longe)'}">🗺️ Negociar territórios</button>`);
};
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-ldeal]'); if (!b || b.disabled || !G) return; SFX.page(); openLandDeal(+b.dataset.ldeal); });

// ---------- derramamento de óleo nas plataformas ----------
EVENTS.derramamento = {icon:'🛢️', title:'Derramamento de Óleo', w:() => (G.p.buildings||[]).filter(b => b.t === 'plataforma' && bOk(b)).length * 0.25,
  text:() => 'Um vazamento numa das nossas plataformas de petróleo espalha uma mancha de óleo pelo mar. Pescadores e ambientalistas protestam.',
  choices:() => [
    {t:'Limpeza completa', h:`-${fmtMoney(G.p.gdp*0.004)}, imagem preservada`, f:() => { G.p.treasury -= G.p.gdp*0.004; G.p.approval += 1; }},
    {t:'Limpeza mínima', h:'-4 apoio, -relações com vizinhos', f:() => { G.p.approval -= 4; for (const n of G.nations) if (n && n.id > 1 && n.alive && adjacent(1, n.id)) changeRel(n, -4); }}
  ]};
