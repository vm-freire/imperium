// ============================================================
//  IMPERIUM — Modo com objetivos (metas a atingir)
// ============================================================
'use strict';

// cada objetivo: o que atingir (sem dizer como), progresso 0..1 e recompensa
// a = valores do início da partida (G.objBase)
const OBJECTIVES = [
  // ---- Capítulo I: Fundação ----
  {id:'pop15', ch:1, icon:'👥', n:'Uma nação que cresce', d:a=>`Alcançar ${fmtPop(a.pop*1.25)} habitantes.`, prog:a=>G.p.pop/(a.pop*1.25), rw:{money:0.02, approval:3}},
  {id:'tech5', ch:1, icon:'🔬', n:'Mentes brilhantes', d:a=>`Dominar ${a.techs+4} tecnologias.`, prog:a=>G.p.techs.length/(a.techs+4), rw:{rp:0.5}},
  {id:'deals3', ch:1, icon:'⚓', n:'Portas abertas', d:()=>'Manter acordos comerciais com 3 nações ao mesmo tempo.', prog:()=>G.nations.filter(n=>n&&n.id>1&&n.alive&&dealCount(n)).length/3, rw:{money:0.03}},
  {id:'build5', ch:1, icon:'🏗️', n:'Construtores', d:()=>'Ter 5 construções em funcionamento no território.', prog:()=>(G.p.buildings||[]).filter(b=>Grid.owner[b.c]===1).length/5, rw:{stability:4}},
  {id:'stab24', ch:1, icon:'⚖️', n:'Ordem e paz interna', d:()=>'Manter a estabilidade acima de 65% por 24 meses seguidos.', prog:()=>(G.objStreak||0)/24, rw:{approval:4}},
  // ---- Capítulo II: Ascensão ----
  {id:'gdp10', ch:2, icon:'💰', n:'Entre os grandes', d:()=>'Estar entre as 10 maiores economias do mundo.', prog:()=>{ const r = rankings(); return r.gdp <= 10 ? 1 : 10/r.gdp; }, rw:{money:0.04}},
  {id:'army5', ch:2, icon:'⚔️', n:'Respeito militar', d:()=>'Ter um dos 5 exércitos mais poderosos do mundo.', prog:()=>{ const r = rankings(); return r.power <= 5 ? 1 : 5/r.power; }, rw:{stability:5}},
  {id:'area15', ch:2, icon:'🗺️', n:'Fronteiras ampliadas', d:a=>`Controlar ${fmtArea(a.area*1.5)} de território.`, prog:a=>G.p.area/(a.area*1.5), rw:{money:0.03, approval:3}},
  {id:'ally2', ch:2, icon:'🤝', n:'Amigos poderosos', d:()=>'Ter alianças militares com 2 nações.', prog:()=>G.nations.filter(n=>n&&n.id>1&&n.alive&&n.alliance).length/2, rw:{stability:4}},
  {id:'reserve', ch:2, icon:'🏦', n:'Cofres cheios', d:()=>'Acumular no tesouro o equivalente a 15% do PIB, sem dívida maior que 30% do PIB.', prog:()=>Math.min(G.p.treasury/(G.p.gdp*0.15), G.p.debt <= G.p.gdp*0.3 ? 1 : 0.5), rw:{approval:5}},
  {id:'idh650', ch:2, icon:'🌟', n:'Qualidade de vida', d:a=>`Alcançar IDH ${(Math.min(0.95, a.idh+0.1)).toFixed(3).replace('.',',')}.`, prog:a=>socialIndex(1).idh/Math.min(0.95, a.idh+0.1), rw:{approval:5}},
  // ---- Capítulo III: Potência ----
  {id:'capital', ch:3, icon:'👑', n:'A queda de uma capital', d:()=>'Capturar a capital de uma nação inimiga.', prog:()=>G.stats.capitalsTaken ? 1 : 0, rw:{money:0.05, stability:5}},
  {id:'gdp3', ch:3, icon:'💎', n:'Gigante econômico', d:()=>'Estar entre as 3 maiores economias do mundo.', prog:()=>{ const r = rankings(); return r.gdp <= 3 ? 1 : 3/r.gdp; }, rw:{money:0.05}},
  {id:'techlead', ch:3, icon:'🚀', n:'Vanguarda científica', d:()=>'Ter 5 tecnologias a mais que a média mundial.', prog:()=>{ const avg = G.nations.filter(n=>n&&n.id>1&&n.alive).reduce((s,n,_,x)=>s+n.tech/x.length,0); return (G.p.techs.length - avg)/5; }, rw:{rp:1}},
  {id:'deals8', ch:3, icon:'🌐', n:'Centro do comércio mundial', d:()=>'Somar 8 acordos comerciais em vigor.', prog:()=>G.nations.filter(n=>n&&n.id>1).reduce((s,n)=>s+dealCount(n),0)/8, rw:{money:0.05}},
  {id:'idh800', ch:3, icon:'🏙️', n:'Nação desenvolvida', d:()=>'Alcançar IDH 0,800.', prog:()=>socialIndex(1).idh/0.8, rw:{approval:6}},
  // ---- Capítulo IV: Legado ----
  {id:'gdp1', ch:4, icon:'🦅', n:'A maior economia do mundo', d:()=>'Ser a economia número 1 do planeta.', prog:()=>{ const r = rankings(); return 1/r.gdp; }, rw:{approval:8}},
  {id:'land15', ch:4, icon:'🌍', n:'Senhor dos continentes', d:()=>'Controlar 15% das terras do mundo.', prog:()=>{ let t=0; for (let i=0;i<NCELLS;i++) if (Grid.land[i] && Grid.owner[i]>0) t++; return (G.nations[1].cells/t)/0.15; }, rw:{stability:8}},
  {id:'idh900', ch:4, icon:'✨', n:'Exemplo para a humanidade', d:()=>'Alcançar IDH 0,900.', prog:()=>socialIndex(1).idh/0.9, rw:{approval:8}}
];
const OBJ = Object.fromEntries(OBJECTIVES.map(o=>[o.id,o]));
const OBJ_CHAPTERS = {1:'Fundação', 2:'Ascensão', 3:'Potência', 4:'Legado'};

function initObjectives(mode){
  G.objMode = mode;
  if (mode !== 'objetivos') return;
  G.objBase = {pop:G.p.pop, techs:G.p.techs.length, area:G.p.area, idh:socialIndex(1).idh};
  G.objDone = []; G.objStreak = 0; G.finalStreak = 0;
  const multi = G.online && (G.online.humans||[]).length > 1;
  const opts = Object.keys(FINAL_OBJ).filter(k=>(!FINAL_OBJ[k].minEra || G.era >= FINAL_OBJ[k].minEra) && (!FINAL_OBJ[k].online || multi));
  G.finalObj = opts[Math.floor(Math.random()*opts.length)];
}
// objetivos finais: difíceis de propósito
const FINAL_OBJ = {
  superpotencia:{icon:'🦅', n:'Superpotência absoluta', d:'Ter ao mesmo tempo a maior economia, o maior exército e IDH acima de 0,850 — e manter isso por 5 anos seguidos.', months:60,
    met:()=>{ const r = rankings(); return r.gdp === 1 && r.power === 1 && socialIndex(1).idh >= 0.85; }, prog:()=>{ const r = rankings(); return (1/r.gdp + 1/r.power + Math.min(1, socialIndex(1).idh/0.85))/3; }},
  hegemonia:{icon:'🌍', n:'Hegemonia mundial', d:'Controlar 30% de todas as terras do mundo com estabilidade acima de 60% — por 3 anos seguidos.', months:36,
    met:()=>worldShare() >= 0.3 && G.p.stability > 60, prog:()=>Math.min(1, worldShare()/0.3)},
  utopia:{icon:'✨', n:'Utopia', d:'IDH acima de 0,920, apoio acima de 80%, nenhuma guerra e economia entre as 3 maiores — por 10 anos seguidos.', months:120,
    met:()=>socialIndex(1).idh >= 0.92 && G.p.approval > 80 && !G.wars.length && rankings().gdp <= 3, prog:()=>(Math.min(1, socialIndex(1).idh/0.92) + Math.min(1, G.p.approval/80) + (rankings().gdp<=3?1:0))/3},
  pacto_jogadores:{icon:'🤝', online:true, n:'Pacto entre os povos', d:'Ser aliado de TODOS os outros jogadores humanos e, juntos, controlar 40% das terras do mundo — por 3 anos seguidos.', months:36,
    met:()=>{ const hs = G.nations.filter(n=>n&&n.human&&!n.empty&&n.alive); if (!hs.length || !hs.every(n=>n.alliance)) return false; let t=0, mine=G.nations[1].cells; for (let i=0;i<NCELLS;i++) if (Grid.land[i]&&Grid.owner[i]>0) t++; for (const n of hs) mine += n.cells; return mine/t >= 0.4; },
    prog:()=>{ const hs = G.nations.filter(n=>n&&n.human&&!n.empty&&n.alive); return hs.length ? hs.filter(n=>n.alliance).length/hs.length*0.5 + Math.min(0.5, worldShare()) : 0; }},
  ultimo_de_pe:{icon:'⚔️', online:true, n:'Último de pé', d:'Ser o único jogador humano ainda vivo e ter a maior economia do mundo — por 1 ano.', months:12,
    met:()=>!G.nations.some(n=>n&&n.human&&!n.empty&&n.alive) && rankings().gdp === 1,
    prog:()=>{ const hs = G.nations.filter(n=>n&&n.human&&!n.empty); return hs.length ? hs.filter(n=>!n.alive).length/hs.length*0.8 + (rankings().gdp===1?0.2:0) : 0; }},
  abundancia:{icon:'🌟', n:'Era da Abundância', d:'Dominar a Fusão Nuclear e a Computação Quântica sendo a economia nº 1 do mundo — por 2 anos seguidos.', months:24, minEra:1914,
    met:()=>G.p.techs.includes('fusao') && G.p.techs.includes('quantica') && rankings().gdp === 1, prog:()=>(G.p.techs.includes('quantica')?0.4:0) + (G.p.techs.includes('fusao')?0.4:0) + (rankings().gdp===1?0.2:0)}
};
function activeObjectives(){
  if (G.objMode !== 'objetivos') return [];
  const done = new Set(G.objDone||[]);
  const ch = currentChapter();
  return OBJECTIVES.filter(o=>o.ch === ch && !done.has(o.id));
}
function currentChapter(){
  const done = new Set(G.objDone||[]);
  for (const c of [1,2,3,4]) if (OBJECTIVES.some(o=>o.ch===c && !done.has(o.id))) return c;
  return 5;
}
function objProgress(o){ try { return clamp(o.prog(G.objBase), 0, 1); } catch(e){ return 0; } }
function giveReward(rw){
  const p = G.p, parts = [];
  if (rw.money){ const v = p.gdp*rw.money; p.treasury += v; parts.push(`+${fmtMoney(v)}`); }
  if (rw.approval){ p.approval = clamp(p.approval + rw.approval, 0, 100); parts.push(`+${rw.approval} apoio`); }
  if (rw.stability){ p.stability = clamp(p.stability + rw.stability, 0, 100); parts.push(`+${rw.stability} estabilidade`); }
  if (rw.rp && p.researching){ const v = techCost(p.researching)*rw.rp; p.rp += v; parts.push(`+${Math.round(v)} pesquisa`); }
  return parts.join(', ');
}
function rwText(rw){ const t = []; if (rw.money) t.push(`💰 ${Math.round(rw.money*100)}% do PIB`); if (rw.approval) t.push(`😊 +${rw.approval} apoio`); if (rw.stability) t.push(`⚖️ +${rw.stability} estabilidade`); if (rw.rp) t.push(`🔬 pesquisa`); return t.join(' · '); }
function checkObjectives(){
  if (G.objMode !== 'objetivos') return;
  G.objStreak = G.p.stability > 65 ? (G.objStreak||0) + 1 : 0;
  const chBefore = currentChapter();
  for (const o of activeObjectives()){
    if (objProgress(o) >= 1){
      G.objDone.push(o.id);
      const r = giveReward(o.rw);
      addLog(`🎯 Objetivo cumprido: ${o.n}! Recompensa: ${r}.`, 'good');
      if (typeof onObjective === 'function') onObjective(o, r);
    }
  }
  const chAfter = currentChapter();
  if (chAfter !== chBefore){
    if (chAfter === 5){ addLog(`🏁 Os quatro capítulos foram concluídos! Resta o OBJETIVO FINAL: ${FINAL_OBJ[G.finalObj].n}.`, 'good'); if (typeof onChapter === 'function') onChapter(5); }
    else { addLog(`📖 Novo capítulo: ${OBJ_CHAPTERS[chAfter]}. Novos objetivos foram revelados.`, 'good'); if (typeof onChapter === 'function') onChapter(chAfter); }
  }
  // objetivo final (difícil): só conta depois dos 4 capítulos
  const F = FINAL_OBJ[G.finalObj];
  if (F){ const ok = F.met(); G.finalStreak = ok ? (G.finalStreak||0) + 1 : 0;
    if (chAfter === 5 && G.finalStreak >= F.months && !G.victory){ addLog('🏆 OBJETIVO FINAL CUMPRIDO!', 'good'); triggerVictory(`${F.n} — ${F.d}`, true); } }
}
