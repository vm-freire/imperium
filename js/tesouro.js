// ============================================================
//  IMPERIUM — Detalhes do Tesouro (clique em 💰 no topo)
//  Caixa, saldo do mês, receitas e despesas uma a uma, dívida,
//  juros, nota de crédito e a evolução dos últimos anos
// ============================================================
'use strict';

function openTreasury(){
  if (!G || !G.p) return;
  const p = G.p, b = budget(), m = p.mods || calcMods();
  const debtR = p.debt / Math.max(1, p.gdp), rate = interestRate(), rating = creditRating();
  const months = b.bal < 0 && p.treasury > 0 ? Math.floor(p.treasury / -b.bal) : null;
  const top = (o) => Object.entries(o).filter(([,v]) => v > 0.01).sort((a, c) => c[1] - a[1]);
  const tIn = b.tIn || 1, tOut = b.tOut || 1;
  const bar = (v, t, col) => `<i style="display:inline-block;height:8px;width:${Math.max(2, v/t*100)}%;background:${col};border-radius:2px"></i>`;
  const incN = {impostos:'🏛️ Impostos', comercio:'⚓ Comércio exterior', recursos:'⛏️ Recursos naturais', tributos:'👑 Tributos recebidos', bloco:'🌐 Mercado comum (bloco)', blocoIA:'🌍 Bloco econômico (sócio)'};
  const expN = {edu:'📚 Educação', health:'⚕️ Saúde', infra:'🏗️ Infraestrutura', social:'🤲 Bem-estar', research:'🔬 Ciência', police:'👮 Segurança', leis:'📜 Leis e programas', administracao:'🏛️ Administração', militar:'⚔️ Manutenção militar', juros:'🏦 Juros da dívida', obras:'🏗️ Manutenção das obras', importacoes:'🛒 Importações'};
  const rows = (o, names, t, col, sign) => top(o).map(([k, v]) => `<div class="row"><span class="k">${names[k] || k}<br>${bar(v, t, col)}</span><span class="v ${sign > 0 ? 'up' : 'down'}">${sign > 0 ? '+' : '−'}${fmtMoney(v)} <small class="muted">${Math.round(v/t*100)}%</small></span></div>`).join('');
  const md = openModal(`<div class="m-icon">💰</div><div class="m-title">Tesouro Nacional</div>
    <div class="grid2" style="gap:10px;text-align:center">
      <div class="box"><div class="lbl">Em caixa</div><div style="font-size:24px;font-weight:900" class="${p.treasury >= 0 ? '' : 'down'}">${fmtMoney(p.treasury)}</div></div>
      <div class="box"><div class="lbl">Saldo do mês</div><div style="font-size:24px;font-weight:900" class="${b.bal >= 0 ? 'up' : 'down'}">${b.bal >= 0 ? '+' : ''}${fmtMoney(b.bal)}</div><small class="muted">${months != null ? `o caixa dura ~${months} mês(es) neste ritmo` : b.bal >= 0 ? 'superávit' : 'caixa negativo: empréstimos emergenciais'}</small></div>
    </div>
    <canvas id="tr-chart" width="560" height="150" style="width:100%;margin:8px 0"></canvas>
    <div class="grid2" style="gap:16px">
      <div><div class="sub" style="color:var(--green)">Receitas · +${fmtMoney(b.tIn)}/mês</div>${rows(b.inc, incN, tIn, '#3d7a3a', 1)}</div>
      <div><div class="sub" style="color:var(--red)">Despesas · −${fmtMoney(b.tOut)}/mês</div>${rows(b.exp, expN, tOut, '#a3322a', -1)}</div>
    </div>
    <div class="sub">🏦 Dívida e crédito</div>
    ${row('Dívida pública', `${fmtMoney(p.debt)} <small class="muted">(${Math.round(debtR*100)}% do PIB)</small>`, debtR > 1 ? 'down' : '')}
    ${row('Juros', `${fmtPct(rate)} ao ano · −${fmtMoney(b.exp.juros || 0)}/mês`)}${row('Nota de crédito', `<b>${rating}</b>`)}
    ${row('Imposto', `${Math.round(p.tax*100)}% · arrecadação ${m.taxEff >= 0 ? '+' : ''}${Math.round(m.taxEff*100)}% · corrupção desvia ${Math.round(p.corruption*100)}%`)}
    ${row('Inflação', fmtPct(p.inflation), p.inflation > 10 ? 'down' : '')}
    <div class="m-actions"><button class="btn" id="tr-eco">💼 Abrir aba Economia</button><button class="btn green" id="tr-x">Fechar</button></div>`, {wide:true});
  // evolução do caixa e da dívida (últimos 10 anos)
  const h = (G.hist || []).slice(-120);
  if (h.length > 1 && typeof drawLineChart === 'function') drawLineChart(md.querySelector('#tr-chart'), [{data:h.map(x => [x.t, x.tre]), color:'#3f6b2a', label:'Tesouro'}, {data:h.map(x => [x.t, x.debt||0]), color:'#8b1a1a', label:'Dívida'}], {startYear:G.startYear, startMonth:G.startMonth||0, wars:(G.warHistory||[]).map(w=>[w.start,w.end])});
  else md.querySelector('#tr-chart').remove();
  md.querySelector('#tr-x').onclick = () => { SFX.click(); closeModal(); };
  md.querySelector('#tr-eco').onclick = () => { SFX.click(); closeModal(); UI.tab = 'economia'; $$('#tabs button').forEach(x => x.classList.toggle('active', x.dataset.tab === 'economia')); if (typeof setSidebar === 'function') setSidebar(true); renderPanel(); };
}
document.addEventListener('click', e => { if (G && e.target.closest && e.target.closest('#st-tre')){ SFX.page(); openTreasury(); } });
