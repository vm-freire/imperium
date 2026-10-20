// ============================================================
//  IMPERIUM — Mesa de paz
//  Proposta com valor em dinheiro (deslizante), resposta na hora
//  e contrapropostas dos dois lados.
// ============================================================
'use strict';

// Quanto a nação aceitaria pagar (positivo) ou exige receber (negativo) pela paz
function peaceFairValue(id){
  const n = G.nations[id], w = getWar(id), p = G.p; if (!n || !w) return 0;
  const theirGdp = n.pop*n.pc, dur = G.turn - w.start;
  const ratio = clamp((p.atk||0) / Math.max(1, n.power), 0.2, 3);
  let s = w.score/30 + (ratio - 1)*0.3 + (n.capLost ? 0.3 : 0) + Math.min(dur, 48)*0.004;
  s = clamp(s, -1, 1);
  return s >= 0 ? s * 0.12 * theirGdp : s * 0.12 * p.gdp;
}
function peaceLimits(id){
  const n = G.nations[id], p = G.p;
  return {theyMax: Math.max(0, n.pop*n.pc*0.15), weMax: Math.max(0, Math.min(p.gdp*0.15, p.treasury))};
}
// Responde a uma proposta (valor > 0: eles nos pagam; < 0: nós pagamos)
function judgePeace(id, amt){
  const w = getWar(id); if (!w) return {ok:false, gone:true};
  const n = G.nations[id], fair = peaceFairValue(id), theirGdp = n.pop*n.pc;
  // margem de tolerância proporcional a quem paga
  const base = Math.max(Math.abs(fair), 0.02 * (amt > 0 ? theirGdp : G.p.gdp));
  const slack = base * (0.08 + Math.random()*0.12);
  if (amt <= fair + slack) return {ok:true};
  w.talks = (w.talks||0) + 1;
  // contraproposta: o valor que consideram justo, arredondado
  const L = peaceLimits(id);
  const unit = Math.max(1, Math.min(G.p.gdp, theirGdp) * 0.001);
  let counter = Math.round(fair / unit) * unit;
  counter = clamp(counter, -G.p.gdp*0.15, L.theyMax);
  return {ok:false, counter, walkout: w.talks >= 4};
}
function signPeaceDeal(id, amt){
  const n = G.nations[id], p = G.p;
  if (amt > 0){ p.treasury += amt; G.stats.reparations = (G.stats.reparations||0) + 1; p.approval = clamp(p.approval + 3, 0, 100); addLog(`${n.name} pagará ${fmtMoney(amt)} em reparações.`, 'good'); endWar(id, 'reparacoes'); }
  else if (amt < 0){ p.treasury -= -amt; p.approval = clamp(p.approval - Math.min(8, 2 + (-amt)/Math.max(1,p.gdp)*80), 0, 100); addLog(`Pagamos ${fmtMoney(-amt)} a ${n.name} pela paz.`, 'bad'); endWar(id, 'render'); }
  else endWar(id, 'branca');
}

// ------------------------------------------------------------
//  Tela da mesa de paz
//  from: 'nos' (nós propomos) ou 'eles' (resposta a uma oferta deles)
// ------------------------------------------------------------
function openPeaceTable(id, theirOffer){
  const n = G.nations[id], w = getWar(id); if (!n || !w) return;
  if ((w.talksBlock||0) > G.turn){ SFX.error(); toast(`${esc(n.name)} abandonou a mesa de paz. Tente de novo em ${w.talksBlock - G.turn} mês(es).`, 'bad'); return; }
  const L = peaceLimits(id), step = Math.max(1, (L.theyMax + L.weMax)/80);
  let val = theirOffer != null ? theirOffer : 0;
  const lastOffer = {v: theirOffer};
  const label = v => v > 0 ? `<span class="up">${esc(n.name)} nos paga ${fmtMoney(v)}</span>` : v < 0 ? `<span class="down">Nós pagamos ${fmtMoney(-v)} a ${esc(n.name)}</span>` : '<b>Paz branca</b> (ninguém paga nada)';
  const render = (msg) => {
    const m = openModal(`<div class="m-icon">🕊️</div><div class="m-title">Mesa de paz com ${esc(n.name)}</div>
      <div class="m-date">${flagImg(n, 26, 17)} ${esc(n.leaderTitle || (GOVS[n.gov]||{}).title || 'Líder')} ${esc(n.leader||'')} · placar da guerra ${w.score>0?'+':''}${w.score}</div>
      ${msg ? `<div class="peace-msg">${msg}</div>` : ''}
      ${lastOffer.v != null ? `<div class="box" style="text-align:center"><div class="lbl">Proposta na mesa</div><div style="font-size:17px">${label(lastOffer.v)}</div>
        <button class="btn green" id="pc-accept" style="margin-top:6px">✔ Aceitar esta proposta</button></div>` : ''}
      <div class="lbl" style="margin-top:6px">${lastOffer.v != null ? 'Ou faça uma contraproposta' : 'Sua proposta'}</div>
      <input type="range" id="pc-r" min="${-L.weMax}" max="${L.theyMax}" step="${step}" value="${val}" style="width:100%">
      <div class="flex muted" style="justify-content:space-between;font-size:13px"><span>◀ nós pagamos (até ${fmtMoney(L.weMax)})</span><span>eles pagam (até ${fmtMoney(L.theyMax)}) ▶</span></div>
      <div id="pc-v" style="text-align:center;font-size:18px;margin:8px 0">${label(val)}</div>
      <div class="muted" style="font-size:13px;text-align:center">Pedir demais faz a outra nação perder a paciência e abandonar a mesa.${L.weMax <= 0 ? ' Sem dinheiro em caixa, não temos como pagar.' : ''}</div>
      <div class="m-actions"><button class="btn" id="pc-x">Continuar a guerra</button><button class="btn" id="pc-zero">Paz branca</button><button class="btn primary" id="pc-send">📨 Enviar proposta</button></div>`, {wide:true});
    const r = m.querySelector('#pc-r');
    r.oninput = () => { val = Math.abs(+r.value) < step/2 ? 0 : +r.value; m.querySelector('#pc-v').innerHTML = label(val); };
    m.querySelector('#pc-x').onclick = () => { SFX.click(); closeModal(); };
    m.querySelector('#pc-zero').onclick = () => { r.value = 0; r.oninput(); send(); };
    m.querySelector('#pc-send').onclick = send;
    const acc = m.querySelector('#pc-accept');
    if (acc && lastOffer.v < 0 && -lastOffer.v > Math.max(0, G.p.treasury)){ acc.disabled = true; acc.textContent = '💸 Não temos esse valor em caixa'; }
    if (acc) acc.onclick = () => { closeModal(); signPeaceDeal(id, lastOffer.v); SFX.bell(); toast(`🕊️ Paz assinada com ${esc(n.name)}.`, 'good'); refreshAll(); saveGame(); };
  };
  const send = () => {
    const res = judgePeace(id, val);
    if (res.gone){ closeModal(); return; }
    if (res.ok){ closeModal(); signPeaceDeal(id, val); SFX.bell(); toast(`🕊️ ${esc(n.name)} aceitou: ${val > 0 ? 'recebemos ' + fmtMoney(val) : val < 0 ? 'pagamos ' + fmtMoney(-val) : 'paz branca'}.`, 'good'); refreshAll(); saveGame(); return; }
    SFX.error(); changeRel(n, -1);
    if (res.walkout){ w.talks = 0; w.talksBlock = G.turn + 3; closeModal(); toast(`😤 ${esc(n.name)} se irritou com as exigências e abandonou a mesa por 3 meses.`, 'bad'); addLog(`${n.name} abandonou as negociações de paz.`, 'bad'); refreshAll(); return; }
    lastOffer.v = res.counter; val = res.counter;
    render(`❌ ${esc(n.name)} recusou. <b>Contraproposta:</b> ${label(res.counter)}`);
  };
  render(theirOffer != null ? `✉️ ${esc(n.name)} fez uma oferta. Aceite ou mude o valor no deslizante e envie outra proposta.` : '');
}
