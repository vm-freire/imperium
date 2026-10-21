// ============================================================
//  IMPERIUM — Eleições com campanha
//  • 3 meses antes: campanha com um candidato da oposição,
//    promessas (que serão cobradas na eleição seguinte) e um
//    debate na TV com perguntas sobre a situação real do país
//  • Dia da eleição: apuração estado por estado num mapa do país
// ============================================================
'use strict';

const OPP_PARTIES = ['Aliança Liberal', 'Frente Popular', 'Partido Conservador', 'Movimento Renovação', 'União Democrática', 'Partido Trabalhista', 'Partido Republicano', 'Coalizão Cívica'];
const PROMISES = {
  impostos: {n:'Cortar impostos', icon:'🧾', pts:5, d:'Imposto menor que hoje na próxima eleição', base:p => p.tax, kept:(p, b) => p.tax < b - 0.005},
  saude:    {n:'Mais saúde', icon:'🏥', pts:4, d:'Gasto com saúde maior que hoje', base:p => p.spend.health, kept:(p, b) => p.spend.health > b + 0.2},
  educacao: {n:'Mais educação', icon:'🎓', pts:4, d:'Gasto com educação maior que hoje', base:p => p.spend.edu, kept:(p, b) => p.spend.edu > b + 0.2},
  obras:    {n:'Grandes obras', icon:'🏗️', pts:4, d:'Gasto com infraestrutura maior que hoje', base:p => p.spend.infra, kept:(p, b) => p.spend.infra > b + 0.2},
  emprego:  {n:'Gerar empregos', icon:'👷', pts:5, d:'Desemprego menor que hoje', base:p => p.unemployment, kept:(p, b) => p.unemployment < b - 0.3},
  precos:   {n:'Controlar os preços', icon:'🛒', pts:5, d:'Inflação menor que hoje', base:p => p.inflation, kept:(p, b) => p.inflation < b - 0.3},
  corrupcao:{n:'Acabar com a corrupção', icon:'⚖️', pts:4, d:'Corrupção menor que hoje', base:p => p.corruption, kept:(p, b) => p.corruption < b - 0.005},
  paz:      {n:'Paz e nenhuma guerra nova', icon:'🕊️', pts:3, d:'Não declarar guerras até a próxima eleição', base:() => (G.stats.playerWars||0), kept:(p, b) => (G.stats.playerWars||0) <= b}
};

function oppCandidate(){
  const p = G.p, rnd = seededRng(p.name + (p.nextElection||0));
  const name = genLeaderName(p.cult || 'luso', rnd), party = OPP_PARTIES[Math.floor(rnd()*OPP_PARTIES.length)];
  return {name, party, av:randomAvatar(guessSex(name), rnd, p.gov)};
}

// perguntas do debate: dependem da situação do país
function debateQuestions(){
  const p = G.p, m = p.mods || calcMods(), Q = [];
  const g = p.growth || 0;
  Q.push({q:'Como está a economia do país?', a:[
    {t:'"Os números falam por si: crescemos!"', s: g > 2 ? 6 : g > 0 ? 1 : -5},
    {t:'"Herdamos uma crise, mas estamos arrumando a casa."', s: g < 1 ? 3 : -1},
    {t:'"Vou baixar impostos e destravar as empresas."', s: p.tax > 0.25 ? 4 : 1}]});
  if (p.inflation > 6) Q.push({q:`A inflação está em ${fmtPct(p.inflation)}. O que o senhor fará?`, a:[
    {t:'"Banco Central independente e contas em dia."', s:4},
    {t:'"Vou congelar os preços."', s:2},
    {t:'"A inflação é culpa do mercado internacional."', s:-3}]});
  if (p.unemployment > 9) Q.push({q:`São ${fmtPct(p.unemployment)} de desempregados. Onde estão os empregos?`, a:[
    {t:'"Grandes obras vão empregar milhões."', s:4},
    {t:'"Vamos treinar os trabalhadores com escolas técnicas."', s:3},
    {t:'"O desemprego já está caindo."', s: p.unemployment > 13 ? -4 : 0}]});
  if (G.wars.length) Q.push({q:'E a guerra? Quando nossos soldados voltam para casa?', a:[
    {t:'"Lutaremos até a vitória!"', s: (G.wars[0].score||0) > 0 ? 5 : -3},
    {t:'"Buscaremos a paz com honra."', s: p.warWeary > 20 ? 5 : 2},
    {t:'"Não vou comentar assuntos militares."', s:-2}]});
  if (p.corruption > 0.12) Q.push({q:'Os jornais falam em escândalos de corrupção no governo...', a:[
    {t:'"Quem errou vai pagar. Criaremos uma Controladoria."', s:4},
    {t:'"Isso é perseguição da imprensa!"', s:-4},
    {t:'"Meu adversário também tem os seus escândalos."', s:1}]});
  Q.push({q:'Qual é a sua prioridade número um?', a:[
    {t:'"Saúde e educação para todos."', s: p.spend.health + p.spend.edu < 8 ? 4 : 2},
    {t:'"Segurança nas ruas."', s: p.stability < 45 ? 4 : 1},
    {t:'"Uma nação forte e respeitada no mundo."', s: G.wars.length ? 3 : 1}]});
  Q.push({q:'Considerações finais: por que votar no senhor?', a:[
    {t:'"Porque cumpro o que prometo."', s: (p.promisesKept||0) > (p.promisesBroken||0) ? 5 : (p.promisesBroken ? -4 : 1)},
    {t:'"Porque o outro lado já mostrou o que faz."', s:2},
    {t:'"Porque juntos vamos construir o futuro."', s:2}]});
  // 3 perguntas: as mais "quentes" primeiro, a final sempre por último
  const last = Q.pop(); return Q.slice(0, 2).concat([last]);
}

// cobra as promessas da campanha anterior
function settlePromises(){
  const p = G.p, out = []; let pts = 0;
  for (const pr of (p.promises||[])){ const P = PROMISES[pr.id]; if (!P) continue; const ok = P.kept(p, pr.base);
    if (ok){ pts += 3; p.promisesKept = (p.promisesKept||0) + 1; } else { pts -= 5; p.approval -= 2; p.promisesBroken = (p.promisesBroken||0) + 1; }
    out.push({P, ok}); }
  p.promises = []; return {pts, out};
}

function campaignModal(done){
  const p = G.p, opp = oppCandidate(); G.p.opp = {name:opp.name, party:opp.party};
  const settled = settlePromises();
  let pts = settled.pts, chosen = [];
  const head = `<div class="flex" style="gap:14px;align-items:center;justify-content:center">
      <div style="text-align:center">${avatarSVG(playerAvatar(), null, 70)}<div><b>${esc(p.leader)}</b></div><small class="muted">${esc(p.party ? (p.party.abbr || p.party.name) : 'Governo')}</small></div>
      <div style="font-family:var(--title);font-size:26px">×</div>
      <div style="text-align:center">${avatarSVG(opp.av, null, 70)}<div><b>${esc(opp.name)}</b></div><small class="muted">${esc(opp.party)}</small></div></div>`;
  // passo 1: promessas
  const step1 = () => {
    const m = openModal(`<div class="m-icon">🗳️</div><div class="m-title">Campanha Eleitoral</div>${head}
      ${settled.out.length ? `<div class="sub">📋 Promessas da última campanha</div>${settled.out.map(x => `<div class="row"><span class="k">${x.P.icon} ${x.P.n}</span><span class="v ${x.ok ? 'up' : 'down'}">${x.ok ? 'cumprida (+3)' : 'quebrada (−5)'}</span></div>`).join('')}` : ''}
      <div class="sub">🤝 Escolha até 2 promessas</div><div class="muted">Elas rendem votos agora — e serão cobradas na próxima eleição.</div>
      <div class="deal-list">${Object.entries(PROMISES).map(([k, P]) => `<label class="deal-opt"><div><b>${P.icon} ${P.n}</b> <small class="up">+${P.pts} pontos</small><small>${P.d}</small></div><input type="checkbox" data-prom="${k}"></label>`).join('')}</div>
      <div class="m-actions"><button class="btn green" id="cp-next">Ir para o debate ➜</button></div>`, {wide:true});
    m.querySelectorAll('[data-prom]').forEach(c => c.onchange = () => { const on = [...m.querySelectorAll('[data-prom]:checked')]; if (on.length > 2){ c.checked = false; SFX.error(); toast('No máximo 2 promessas.', 'bad'); } else SFX.click(); });
    m.querySelector('#cp-next').onclick = () => {
      chosen = [...m.querySelectorAll('[data-prom]:checked')].map(c => c.dataset.prom);
      p.promises = chosen.map(id => ({id, base:PROMISES[id].base(p), turn:G.turn}));
      pts += chosen.reduce((s, id) => s + PROMISES[id].pts, 0);
      SFX.page(); debate(0, debateQuestions());
    };
  };
  // passo 2: debate (3 perguntas)
  const debate = (i, qs) => {
    if (i >= qs.length) return finish();
    const q = qs[i];
    const m = openModal(`<div class="m-icon">📺</div><div class="m-title">Debate na TV — pergunta ${i+1} de ${qs.length}</div>${head}
      <div style="text-align:center;font-size:19px;margin:12px 0 10px;font-style:italic">“${esc(q.q)}”</div>
      ${q.a.map((a, k) => `<button class="choice" data-ans="${k}"><b>${esc(a.t)}</b></button>`).join('')}`, {wide:true});
    m.querySelectorAll('[data-ans]').forEach(b => b.onclick = () => {
      const a = q.a[+b.dataset.ans]; pts += a.s;
      const r = a.s >= 4 ? ['👏 A plateia aplaude de pé!', 'good'] : a.s >= 1 ? ['🙂 Resposta segura.', 'info'] : a.s >= -1 ? ['😐 A plateia não se convenceu.', 'info'] : ['😬 Vaias! O adversário aproveitou.', 'bad'];
      a.s >= 4 ? SFX.coin() : a.s < 0 ? SFX.error() : SFX.click(); toast(r[0], r[1]);
      debate(i + 1, qs);
    });
  };
  const finish = () => {
    p.campaign = clamp(pts, -15, 20);
    addLog(`🗳️ Campanha encerrada: ${p.campaign >= 0 ? '+' : ''}${p.campaign} pontos contra ${opp.name} (${opp.party}).`, p.campaign >= 0 ? 'good' : 'bad');
    const m = openModal(`<div class="m-icon">🗳️</div><div class="m-title">Fim da campanha</div>${head}
      <div style="text-align:center;font-size:16px;margin:12px 0">Saldo da campanha: <b class="${p.campaign >= 0 ? 'up' : 'down'}">${p.campaign >= 0 ? '+' : ''}${p.campaign} pontos</b><br>Intenção de votos: <b>${Math.round(electionShare(0))}%</b> × ${Math.round(100 - electionShare(0))}%</div>
      <div class="m-actions"><button class="btn green" id="cp-ok">Aguardar a eleição</button></div>`, {wide:true});
    m.querySelector('#cp-ok').onclick = () => { SFX.click(); closeModal(); done(); };
  };
  step1();
}

// % nacional do governo (sem a variação do dia)
function electionShare(swing){ const p = G.p; return clamp(50 + ((p.approval + (p.campaign||0)) - 46)*0.55 + (swing||0), 15, 85); }

// distritos: estados reais do mapa; se não houver, faixas do território
function electionDistricts(){
  const p = G.p, cs = typeof cellStates === 'function' ? cellStates() : null, D = {};
  const cells = []; for (let i = 0; i < NCELLS; i++) if (Grid.owner[i] === 1) cells.push(i);
  const nameOf = k => typeof stateName === 'function' && cs && k >= 0 ? stateName(k) : '';
  // sem estados reais: divide o território em faixas, com os nomes dos estados do jogador
  const fallbackN = Math.max(1, Math.min(p.states || 4, p.stateNames.length || 4, 12));
  const sorted = cells.slice().sort((a, b) => cellCenter(a)[0] - cellCenter(b)[0] || cellCenter(a)[1] - cellCenter(b)[1]);
  const band = new Map(); sorted.forEach((c, i) => band.set(c, Math.floor(i * fallbackN / sorted.length)));
  for (const c of cells){
    const k = cs && cs[c] >= 0 && nameOf(cs[c]) ? 's' + cs[c] : 'f' + band.get(c);
    if (!D[k]) D[k] = {k, name: k[0] === 's' ? nameOf(+k.slice(1)) : (p.stateNames[+k.slice(1)] || `Região ${+k.slice(1) + 1}`), cells:[]};
    D[k].cells.push(c);
  }
  return Object.values(D).sort((a, b) => b.cells.length - a.cells.length);
}

function electionCount(){
  const p = G.p, swing = (Math.random() + Math.random() - 1) * 6, nat = electionShare(swing);
  const ds = electionDistricts(), capCell = p.capCell;
  let tot = 0, gov = 0;
  for (const d of ds){
    const h = (d.name.length * 37 + d.cells[0] * 13) % 100 / 100;   // tendência fixa de cada estado
    let s = nat + (h - 0.5) * 18 + (Math.random() - 0.5) * 6 + (d.cells.includes(capCell) ? 3 : 0);
    d.share = clamp(s, 5, 95); const w = d.cells.length; tot += w; gov += w * d.share / 100;
  }
  const share = tot ? gov / tot * 100 : nat;
  return {ds, share, win: share > 50, pr: clamp((electionShare(0) - 35) / 30, 0.02, 0.98)};
}

// apuração animada
function countModal(d, done){
  const p = G.p, opp = p.opp || oppCandidate();
  const cells = d.ds.flatMap(x => x.cells); if (!cells.length){ done(); return; }
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const c of cells){ const cx = c % CW, cy = (c / CW) | 0; x0 = Math.min(x0, cx); x1 = Math.max(x1, cx); y0 = Math.min(y0, cy); y1 = Math.max(y1, cy); }
  const W = 360, H = 240, sc = Math.min(W / (x1 - x0 + 1), H / (y1 - y0 + 1)), ox = (W - (x1 - x0 + 1) * sc) / 2, oy = (H - (y1 - y0 + 1) * sc) / 2;
  const govC = G.nations[1].color || '#3d7a3a', oppC = '#8a8f98';
  const m = openModal(`<div class="m-icon">🗳️</div><div class="m-title">Apuração — ${dateStr()}</div>
    <div class="flex" style="gap:14px;align-items:flex-start;flex-wrap:wrap;justify-content:center">
      <canvas id="el-map" width="${W}" height="${H}" style="background:#efe4c8;border:2px solid var(--ink2);max-width:100%"></canvas>
      <div style="min-width:220px;flex:1">
        <div class="lbl">Urnas apuradas: <b id="el-pct">0%</b></div>
        <div style="display:flex;height:22px;border:1px solid var(--ink2);margin:6px 0"><i id="el-g" style="background:${govC};width:50%"></i><i id="el-o" style="background:${oppC};width:50%"></i></div>
        <div class="row"><span class="k"><b>${esc(p.leader)}</b></span><span class="v" id="el-gv">—</span></div>
        <div class="row"><span class="k">${esc(opp.name)} <small class="muted">(${esc(opp.party)})</small></span><span class="v" id="el-ov">—</span></div>
        <div id="el-list" style="max-height:150px;overflow:auto;margin-top:6px"></div>
      </div></div>
    <div class="m-actions"><button class="btn" id="el-skip">Pular apuração</button></div>`, {wide:true});
  const ctx = m.querySelector('#el-map').getContext('2d');
  const paint = (cs, col) => { ctx.fillStyle = col; for (const c of cs){ const cx = c % CW, cy = (c / CW) | 0; ctx.fillRect(ox + (cx - x0) * sc, oy + (cy - y0) * sc, Math.ceil(sc), Math.ceil(sc)); } };
  paint(cells, '#cfc3a3');
  const order = d.ds.slice().sort(() => Math.random() - 0.5);
  let i = 0, gw = 0, tw = 0, timer = null;
  const step = () => {
    if (i >= order.length){ clearInterval(timer); end(); return; }
    const x = order[i++], w = x.cells.length; tw += w; gw += w * x.share / 100;
    paint(x.cells, x.share > 50 ? govC : oppC);
    const total = d.ds.reduce((s, y) => s + y.cells.length, 0), g = gw / tw * 100;
    m.querySelector('#el-pct').textContent = Math.round(tw / total * 100) + '%';
    m.querySelector('#el-g').style.width = g + '%'; m.querySelector('#el-o').style.width = (100 - g) + '%';
    m.querySelector('#el-gv').textContent = g.toFixed(1).replace('.', ',') + '%'; m.querySelector('#el-ov').textContent = (100 - g).toFixed(1).replace('.', ',') + '%';
    m.querySelector('#el-list').insertAdjacentHTML('afterbegin', `<div class="row"><span class="k">${esc(x.name)}</span><span class="v ${x.share > 50 ? 'up' : 'down'}">${Math.round(x.share)}% ${x.share > 50 ? '✔' : '✖'}</span></div>`);
    SFX.tone && SFX.tone(600 + (x.share > 50 ? 200 : -150), 0.06, 'sine', 0.04);
  };
  const end = () => { const b = m.querySelector('#el-skip'); b.textContent = 'Ver o resultado'; b.className = 'btn green'; b.onclick = () => { SFX.click(); closeModal(); done(); }; };
  const speed = Math.max(90, Math.min(450, 4500 / order.length));
  timer = setInterval(step, speed);
  m.querySelector('#el-skip').onclick = () => { clearInterval(timer); while (i < order.length) step(); end(); };
}

// ---------- integra com os eventos existentes ----------
const _origEleicao = EVENTS.eleicao;
EVENTS.campanha = {icon:'🗳️', title:'Começa a Campanha Eleitoral', special:true,
  text:() => `Faltam poucos meses para a eleição. A oposição lançou ${esc(oppCandidate().name)} como candidato. Hora de ir às ruas, fazer promessas e enfrentar o debate na TV.`,
  choices:() => [{t:'Começar a campanha', h:'Promessas + debate (3 perguntas)', f:() => queueFlow(campaignModal)}]};
EVENTS.eleicao = {icon:'🗳️', title:'Dia de Eleição', special:true,
  prep:d => { const r = electionCount(); Object.assign(d, {win:r.win, pr:r.pr, share:r.share, ds:r.ds.map(x => ({name:x.name, share:x.share, cells:x.cells}))}); G.p.campaign = 0; G.p.nextElection = G.turn + electionInterval(); d.limit = termLimitReached(); return d; },
  text:d => d.counted ? (d.win ? `${esc(G.p.leader)} venceu com <b>${d.share.toFixed(1).replace('.', ',')}%</b> dos votos válidos, levando ${d.ds.filter(x => x.share > 50).length} de ${d.ds.length} estados.${d.limit ? ' Pela Constituição, porém, não pode continuar: o partido escolherá um sucessor.' : ''}`
                                   : `A oposição venceu com <b>${(100 - d.share).toFixed(1).replace('.', ',')}%</b> dos votos, levando ${d.ds.filter(x => x.share <= 50).length} de ${d.ds.length} estados. ${esc(G.p.leader)} perdeu o poder.`)
                     : 'As urnas fecharam. A contagem dos votos vai começar, estado por estado.',
  choices:d => d.counted ? _origEleicao.choices(d) : [{t:'Acompanhar a apuração', h:'Mapa estado por estado', f:() => {
    // a apuração roda e o resultado volta como um novo evento
    queueFlow(done => countModal(d, () => { d.counted = true; G.pendingEvents.unshift({id:'eleicao', d, prepped:true}); done(); }));
  }}]};

// fluxos com várias telas entre eventos
function queueFlow(fn){
  UI.flow = fn; UI.flowHold = true;   // segura o avanço automático até a tela abrir
  setTimeout(() => { UI.flowHold = false; if (UI.flow === fn && !UI.modalOpen){ UI.flow = null; fn(() => { if (G.pendingEvents.length) showNextEvent(); else resumeAuto(); }); } }, 300);
}
const _elNextTurn = typeof nextTurn === 'function' ? nextTurn : null;
if (_elNextTurn) nextTurn = function(){ if (UI.flowHold || UI.flow) return; return _elNextTurn.apply(this, arguments); };
const _elShowNext = showNextEvent;
showNextEvent = function(){
  if (UI.flow){ const f = UI.flow; UI.flow = null; f(() => { if (G.pendingEvents.length) showNextEvent(); else resumeAuto(); }); return; }
  _elShowNext();
};
