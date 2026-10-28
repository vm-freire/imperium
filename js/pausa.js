// ============================================================
//  IMPERIUM — Pausa justa e fim dos "restinhos" de país
//  • Jogo pausado: o tempo para e nenhum ataque começa (nem por
//    janelas abertas antes). Abas, obras e o resto do mapa funcionam
//  • Restos de país: quem fica com quase nada se rende e some do
//    mapa (com a capital). Clicar perto de um pedacinho inimigo no
//    mar acerta o alvo, e a aba Militar ataca por setores (estados)
// ============================================================
'use strict';

function mapLocked(){ return !!(G && !G.over && !G.online && !G.story && UI.speed === 0); }

// aviso sobre o mapa enquanto estiver pausado
(function(){
  const box = document.createElement('div'); box.id = 'pause-banner';
  box.innerHTML = '⏸ <b>Jogo pausado</b> — o tempo parou. Construa e use os menus à vontade; <b>ataques só com o tempo correndo</b> (▶).';
  box.style.cssText = 'position:fixed;left:50%;top:78px;transform:translateX(-50%);z-index:40;background:rgba(36,23,11,.92);color:#f3e6c4;border:1px solid #c9a13b;border-radius:8px;padding:6px 14px;font-size:13.5px;box-shadow:0 4px 14px rgba(0,0,0,.35);pointer-events:none;display:none;max-width:90vw;text-align:center';
  document.body.appendChild(box);
  setInterval(() => { const on = mapLocked() && document.body.classList.contains('ingame') && !UI.modalOpen; if ((box.style.display !== 'none') !== on) box.style.display = on ? '' : 'none'; }, 400);
})();

// inimigo em guerra mais próximo de uma região (para os pedacinhos difíceis de clicar)
function nearestEnemyCell(c, r){
  const cx = c % CW, cy = (c / CW) | 0; let best = -1, bd = 1e9;
  for (let dy=-r; dy<=r; dy++) for (let dx=-r; dx<=r; dx++){
    const x = cx+dx, y = cy+dy; if (x<0||y<0||x>=CW||y>=CH) continue; const j = y*CW+x, o = Grid.owner[j];
    if (!Grid.land[j] || o < 2 || !G.nations[o] || !G.nations[o].atWar) continue;
    const d = dx*dx + dy*dy; if (d < bd){ bd = d; best = j; }
  }
  return best;
}

const _pzClick = onMapClick;
onMapClick = function(c, x, y){
  // clicou no mar ou em terra sem dono ao lado de um pedacinho inimigo: mira nele
  if (G && c >= 0 && !MapView.buildMode && (!Grid.land[c] || Grid.owner[c] === 0) && G.wars.length){ const e = nearestEnemyCell(c, 2); if (e >= 0) c = e; }
  return _pzClick(c, x, y);
};
MapView.onClick = onMapClick;

// ---------- rendição dos restos ----------
const _pzEnd = endTurn;
endTurn = function(){
  _pzEnd.apply(this, arguments);
  if (!G || G.over || G.story) return;
  for (let id = 2; id < G.nations.length; id++){
    const n = G.nations[id]; if (!n || !n.alive || n.human || n.empty) continue;
    if (n.cells0 == null || n.cells > n.cells0) n.cells0 = n.cells;   // maior tamanho que já teve
    const tiny = n.cells <= 3 || n.cells < n.cells0*0.06;
    if (!tiny) continue;
    if (n.atWar && getWar(id)){
      addLog(`🏳️ ${n.name} ficou só com ${n.cells} região(ões) e se rendeu: o restante do país e a capital passam para nós.`, 'good');
      if (typeof onNegotiation === 'function') onNegotiation(`🏳️ ${n.name} se rendeu e foi anexada!`, true);
      makePeace(id, 'anexar');
      continue;
    }
    // pedacinho em guerra com outra nação da IA: o vizinho em guerra fica com ele
    const w = G.aiWars.find(x => x.a === id || x.b === id);
    if (w && (!G.online || G.online.host)){
      const by = w.a === id ? w.b : w.a, cells = [];
      for (let i=0;i<NCELLS;i++) if (Grid.land[i] && Grid.owner[i] === id) cells.push(i);
      if (G.nations[by] && G.nations[by].alive){ transferCells(cells, id, by); addNews(`${n.name} se rende a ${G.nations[by].name} e desaparece do mapa.`); }
    }
  }
};

// ---------- aba Militar: atacar por setores ----------
function enemySectors(id){
  const cs = typeof cellStates === 'function' ? cellStates() : null, groups = new Map();
  const reach = typeof corpsReach === 'function' ? corpsReach() : 3;
  const corps = (G.p.corps||[]).filter(k => corpsUnitsCount(k) > 0);
  for (let i=0;i<NCELLS;i++){
    if (!Grid.land[i] || Grid.owner[i] !== id) continue;
    const front = neighbors4(i).some(nb => Grid.owner[nb] === 1) || corps.some(k => cellDist(k.cell, i) <= reach + 0.5);
    const si = cs ? cs[i] : -1, key = si >= 0 && typeof stateName === 'function' && stateName(si) ? 's' + si : 'r' + Math.floor((i % CW)/6) + '_' + Math.floor(((i / CW) | 0)/6);
    let g = groups.get(key); if (!g){ g = {key, name: key[0] === 's' ? stateName(si) : null, cells:[], front:[]}; groups.set(key, g); }
    g.cells.push(i); if (front) g.front.push(i);
  }
  let k = 0; const list = [...groups.values()].filter(g => g.front.length).sort((a, b) => b.front.length - a.front.length).slice(0, 10);
  for (const g of list) if (!g.name) g.name = `Setor ${String.fromCharCode(65 + k++)}`;
  return list;
}
const _pzPanel = panelMilitar;
panelMilitar = function(){
  let h = _pzPanel();
  for (const w of G.wars){
    const n = G.nations[w.e]; if (!n || !n.alive) continue;
    const secs = enemySectors(w.e);
    const html = `<div class="lbl" style="margin-top:6px">🎯 Atacar por setor ${mapLocked() ? '<small class="down">(despause para atacar)</small>' : ''}</div><div class="flex" style="flex-wrap:wrap;gap:4px">${secs.map((s, i) => `<button class="btn xs" data-sector="${w.e}:${s.front[Math.floor(s.front.length/2)]}" title="${s.cells.length} região(ões) · ${s.front.length} ao alcance">${esc(s.name)} <small>(${s.cells.length})</small></button>`).join('') || '<small class="muted">Nenhum setor ao alcance — aproxime um exército da fronteira.</small>'}</div>`;
    h = h.replace(`<button class="btn xs" data-fly="${n.id}">🎯 Ver frente</button></div></div>`, `<button class="btn xs" data-fly="${n.id}">🎯 Ver frente</button></div>${html}</div>`);
  }
  return h;
};
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-sector]'); if (!b || !G) return;
  if (mapLocked()){ SFX.error(); toast('⏸ Despause o jogo (▶) para atacar.', 'bad'); return; }
  const [, cell] = b.dataset.sector.split(':').map(Number);
  const [lo, la] = cellCenter(cell); MapView.flyTo(lo, la, 3.2); SFX.click();
  const r = MapView.canvas.getBoundingClientRect();
  setTimeout(() => { MapView.selCell = cell; renderAttackPopover(cell, r.left + r.width/2, r.top + r.height/2, UI.selCorps); }, 950);
});

// ---------- pausado: nenhum ataque começa, nem por janelas abertas antes da pausa ----------
function pzBlocked(){ if (!mapLocked()) return false; SFX.error(); toast('⏸ O jogo está pausado: ataques só com o tempo correndo (aperte ▶).', 'bad');
  const sp = $('#speed'); if (sp){ sp.style.transition = 'box-shadow .2s'; sp.style.boxShadow = '0 0 0 3px #e0b240'; setTimeout(() => sp.style.boxShadow = '', 900); } return true; }
const _pzAtk = launchAttack;
launchAttack = function(){ if (pzBlocked()) return; return _pzAtk.apply(this, arguments); };
const _pzNuke = launchNuke;
launchNuke = function(){ if (pzBlocked()) return; return _pzNuke.apply(this, arguments); };
// mísseis e ataques aéreos são imediatos; as operações secretas só se resolvem quando o mês passa
const _pzSab = startSabotage;
startSabotage = function(key){ const M = SAB_METHODS[key]; if (M && !M.months[1] && mapLocked()) return {ok:false, why:'⏸ Jogo pausado: ataques só com o tempo correndo (aperte ▶).'}; return _pzSab.apply(this, arguments); };
