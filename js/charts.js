// ============================================================
//  IMPERIUM — Gráficos (canvas) para relatórios
// ============================================================
'use strict';

function drawLineChart(canvas, series, opts){
  opts = opts || {};
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.clientWidth || 360, H = canvas.clientHeight || 170;
  canvas.width = W*dpr; canvas.height = H*dpr;
  const ctx = canvas.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,W,H);
  const pad = {l:52, r:10, t:10, b:22};
  const all = series.flatMap(s=>s.data.map(d=>d[1])).filter(v=>isFinite(v));
  if (!all.length){ ctx.fillStyle='#8a6a45'; ctx.font='italic 13px Georgia'; ctx.fillText('Sem dados', W/2-30, H/2); return; }
  let min = opts.min !== undefined ? opts.min : Math.min(...all), max = opts.max !== undefined ? opts.max : Math.max(...all);
  if (min === max){ min -= 1; max += 1; }
  if (opts.min === undefined && min > 0 && min < max*0.4) min = 0;
  const xs = series.flatMap(s=>s.data.map(d=>d[0])); const x0 = Math.min(...xs), x1 = Math.max(...xs, x0+1);
  const X = x => pad.l + (x-x0)/(x1-x0)*(W-pad.l-pad.r);
  const Y = y => pad.t + (1-(y-min)/(max-min))*(H-pad.t-pad.b);
  // grade
  ctx.strokeStyle = 'rgba(90,61,30,0.18)'; ctx.lineWidth = 1; ctx.fillStyle = '#5a3d1e'; ctx.font = '10.5px Georgia';
  for (let k=0;k<=4;k++){
    const v = min + (max-min)*k/4, y = Y(v);
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W-pad.r, y); ctx.stroke();
    ctx.textAlign = 'right'; ctx.fillText((opts.fmt||fmtShort)(v), pad.l-5, y+3.5);
  }
  // eixo x (anos)
  ctx.textAlign = 'center';
  const yrs = Math.max(1, Math.round((x1-x0)/12/6));
  for (let t = Math.ceil(x0/12)*12; t <= x1; t += 12*yrs){
    const x = X(t); ctx.fillText(String((opts.startYear||0) + Math.floor(((opts.startMonth||0)+t)/12)), x, H-6);
    ctx.strokeStyle='rgba(90,61,30,0.1)'; ctx.beginPath(); ctx.moveTo(x,pad.t); ctx.lineTo(x,H-pad.b); ctx.stroke();
  }
  // guerras (faixas)
  if (opts.wars){ ctx.fillStyle='rgba(179,38,30,0.09)'; for (const [a,b] of opts.wars) ctx.fillRect(X(a), pad.t, Math.max(1,X(b)-X(a)), H-pad.t-pad.b); }
  // séries
  for (const s of series){
    if (!s.data.length) continue;
    if (s.fill){
      ctx.beginPath(); ctx.moveTo(X(s.data[0][0]), Y(Math.max(min,0)));
      s.data.forEach(([x,y])=>ctx.lineTo(X(x),Y(y))); ctx.lineTo(X(s.data[s.data.length-1][0]), Y(Math.max(min,0))); ctx.closePath();
      const g = ctx.createLinearGradient(0,pad.t,0,H-pad.b); g.addColorStop(0, s.color+'55'); g.addColorStop(1, s.color+'05'); ctx.fillStyle = g; ctx.fill();
    }
    ctx.strokeStyle = s.color; ctx.lineWidth = 2; ctx.lineJoin='round'; ctx.beginPath();
    s.data.forEach(([x,y],i)=> i ? ctx.lineTo(X(x),Y(y)) : ctx.moveTo(X(x),Y(y))); ctx.stroke();
  }
  // legenda
  if (series.length > 1){
    let lx = pad.l+6; ctx.textAlign='left'; ctx.font='bold 10.5px Georgia';
    for (const s of series){ ctx.fillStyle = s.color; ctx.fillRect(lx, pad.t+3, 10, 3); ctx.fillText(s.label, lx+13, pad.t+8); lx += ctx.measureText(s.label).width + 26; }
  }
}
function fmtShort(v){
  const a = Math.abs(v);
  if (a >= 1e6) return (v/1e6).toFixed(1)+'T';
  if (a >= 1e3) return (v/1e3).toFixed(a>=1e4?0:1)+'k';
  if (a >= 10) return v.toFixed(0);
  return v.toFixed(1);
}
