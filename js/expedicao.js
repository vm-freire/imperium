// ============================================================
//  IMPERIUM — Expedições militares pelo mar
//  Um exército parado num porto embarca, cruza o oceano e
//  desembarca atacando o litoral inimigo (ex.: Brasil → Portugal).
//  Precisa de navios e de um porto (⚓ Porto ou capital no litoral).
//  Vencendo, fica com a cabeça de praia e segue a guerra de lá;
//  perdendo, os sobreviventes voltam ao porto de origem.
// ============================================================
'use strict';

function ownPorts(){
  const p = G.p, out = (p.buildings||[]).filter(b => b.t === 'porto' && bOk(b)).map(b => b.c);
  if (p.capCell >= 0 && isCoastal(p.capCell)) out.push(p.capCell);
  return out;
}
function corpsPort(k){ return ownPorts().find(c => cellDist(c, k.cell) <= 2.5); }
// litoral inimigo mais perto do ponto clicado
function landingCell(c, e){
  if (Grid.land[c] && Grid.owner[c] === e && isCoastal(c)) return c;
  const cx = c % CW, cy = (c / CW) | 0; let best = -1, bd = 1e9;
  for (let dy=-8; dy<=8; dy++) for (let dx=-8; dx<=8; dx++){
    const x = cx+dx, y = cy+dy; if (x<0||y<0||x>=CW||y>=CH) continue; const j = y*CW+x;
    if (Grid.land[j] && Grid.owner[j] === e && isCoastal(j)){ const d = dx*dx + dy*dy; if (d < bd){ bd = d; best = j; } }
  }
  return best;
}
function expedMonths(k, c){ return Math.max(1, Math.ceil(cellDist(k.cell, c)/15)); }
function expedCheck(k, c, e){
  const p = G.p, n = G.nations[e];
  if (!n || !n.atWar) return 'Declare guerra primeiro: o desembarque é um ataque contra uma nação inimiga.';
  if (!(p.navy > 0)) return 'Precisamos de navios para levar as tropas: recrute unidades navais na aba Militar.';
  if (k.naval) return `${k.name} já está no mar.`;
  if (corpsUnitsCount(k) < 1) return 'Esse exército está vazio.';
  if (corpsPort(k) == null) return `${k.name} precisa estar num porto: leve-o até um ⚓ Porto no litoral (construa na aba Obras) ou até a capital, se ela for litorânea.`;
  if (landingCell(c, e) < 0) return `Não há litoral de ${n.name} perto desse ponto para desembarcar.`;
  return null;
}
function orderExpedition(k, c){
  const e = Grid.owner[c], why = expedCheck(k, c, e); if (why) return {ok:false, why};
  const n = G.nations[e], land = landingCell(c, e), m = expedMonths(k, land);
  k.exped = {to:land, e, from:k.cell, m}; k.naval = m; k.path = [];
  addLog(`⛴️ ${k.name} (${corpsUnitsCount(k)} divisões) embarcou rumo a ${n.name}. Desembarque em ~${m} ${m>1?'meses':'mês'}.`, 'war');
  return {ok:true, msg:`⛴️ ${k.name} embarcou rumo a ${n.name}: desembarque em ~${m} ${m>1?'meses':'mês'}.`};
}
// chegada: o exército ataca a praia a partir do mar
function expedLand(k){
  const x = k.exped, p = G.p, n = G.nations[x.e], o = Grid.owner[x.to]; k.exped = null;
  if (o === 1 || o === 0){ k.cell = x.to; addLog(`⛴️ ${k.name} desembarcou sem resistência.`, 'good'); return; }
  if (!n || !n.alive || !n.atWar || o !== x.e){ k.cell = x.from; addLog(`⛴️ ${k.name} voltou ao porto: o alvo da expedição não é mais inimigo.`, 'info'); return; }
  const sea = neighbors4(x.to).find(nb => !Grid.land[nb]);
  k.cell = sea != null ? sea : x.to; k.lastAttack = -1; k.morale = Math.max(0.6, (k.morale||1) - 0.05);   // a viagem cansa
  const r = playerAttack(x.to, 1, k.id);
  if (!r.ok){ k.cell = x.from; addLog(`⛴️ ${k.name} não conseguiu desembarcar e voltou ao porto. ${r.why || ''}`, 'bad'); return; }
  if (r.win){ addLog(`⛴️ Desembarque em ${n.name}: cabeça de praia conquistada! O exército pode avançar de lá.`, 'good'); if (typeof MapView !== 'undefined') MapView.flashCells(r.captured, '#ffd34d'); }
  else if (p.corps.includes(k)){ k.cell = x.from; addLog(`⛴️ O desembarque em ${n.name} falhou: os sobreviventes de ${k.name} voltaram ao porto.`, 'bad'); }
}
const _xpMove = moveCorpsTurn;
moveCorpsTurn = function(){
  _xpMove.apply(this, arguments);
  for (const k of (G.p.corps||[]).slice()) if (k.exped && !k.naval) expedLand(k);
  G.p.corps = (G.p.corps||[]).filter(k => corpsUnitsCount(k) > 0);
};

// janela de ataque: quando o alvo está longe, oferece a expedição pelo mar
const _xpPop = renderAttackPopover;
renderAttackPopover = function(c){
  const r = _xpPop.apply(this, arguments);
  try { expedPopover(c); } catch(e){}
  return r;
};
function expedPopover(c){
  const pop = $('#popover'); if (!pop || pop.classList.contains('hidden') || pop.querySelector('.exped-box')) return;
  const e = Grid.owner[c], n = G.nations[e]; if (!n || e < 2) return;
  const plan = planAttack(c, UI.commit, UI.selCorps); if (plan.ok && !plan.naval) return;   // já há exército perto
  const list = (G.p.corps||[]).filter(k => !k.naval && corpsUnitsCount(k) > 0), atPort = list.filter(k => corpsPort(k) != null);
  const land = landingCell(c, e);
  let h = `<div class="box exped-box" style="margin-top:8px"><b>⛴️ Expedição pelo mar</b><br>`;
  if (!atPort.length) h += `<small>${list.length ? 'Leve um exército até um <b>⚓ Porto</b> (aba Obras) ou até a capital litorânea; depois clique aqui de novo.' : 'Forme um exército na aba Militar e leve-o até um porto.'}</small>`;
  else h += atPort.map(k => { const why = expedCheck(k, c, e);
    return `<button class="btn xs ${why ? '' : 'green'}" style="margin:2px 0" data-exped="${k.id}:${c}" ${why ? `title="${esc(why)}"` : ''}>⛴️ ${esc(k.name)} · ${corpsUnitsCount(k)} div. · ~${land >= 0 ? expedMonths(k, land) : '?'} mês(es)</button>`; }).join('<br>')
    + `<br><small class="muted">O exército embarca, cruza o mar e desembarca atacando o litoral${n.atWar ? '' : ' (declare guerra antes)'}. Se perder, volta ao porto.</small>`;
  pop.insertAdjacentHTML('beforeend', h + '</div>');
}
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-exped]'); if (!b || !G) return;
  if (typeof pzBlocked === 'function' && pzBlocked()) return;
  const [kid, c] = b.dataset.exped.split(':').map(Number), k = (G.p.corps||[]).find(x => x.id === kid);
  const r = k ? orderExpedition(k, c) : {ok:false, why:'Exército não encontrado.'};
  if (!r.ok){ SFX.error(); toast(esc(r.why), 'bad'); return; }
  closePopover(); SFX.march(); toast(esc(r.msg), 'good'); refreshAll(); saveGame();
});

// no mapa: a frota com o exército atravessando o mar
const _xpDraw = MapView.drawCorps;
MapView.drawCorps = function(ctx, z){
  _xpDraw.call(this, ctx, z);
  if (!G || !G.p || G.story) return;
  for (const k of (G.p.corps||[])){
    if (!k.exped || !k.naval) continue;
    const a = cellXY(k.exped.from), b = cellXY(k.exped.to), f = clamp(1 - k.naval/(k.exped.m || 1), 0, 1) + 0.04;
    ctx.save(); ctx.setLineDash([4/z+1, 4/z+1]); ctx.strokeStyle = 'rgba(31,78,140,0.7)'; ctx.lineWidth = 1.4/z + 0.5;
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.setLineDash([]);
    const x = a[0] + (b[0]-a[0])*f, y = a[1] + (b[1]-a[1])*f, fs = Math.max(7, 18/Math.sqrt(z));
    ctx.font = `${fs}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('⛴️', x, y);
    ctx.font = `700 ${Math.max(4, 10/z)}px Georgia, serif`; ctx.fillStyle = '#1f4e8c'; ctx.fillText(`${corpsUnitsCount(k)} div. · ${k.naval} m`, x, y + fs*0.85);
    ctx.restore();
  }
};
