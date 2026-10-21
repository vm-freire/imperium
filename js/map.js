// ============================================================
//  IMPERIUM — Mapa-múndi estilo antigo (grade, render, câmera)
// ============================================================
'use strict';

const MW = 2160, MH = 900, DEG = 6, LAT0 = 85, CW = 360, CH = 150, NCELLS = CW*CH;
const SEA_COLOR = '#cfc4a0';

function proj(lon, lat){ return [(lon+180)*DEG, (LAT0-lat)*DEG]; }
function unproj(x, y){ return [x/DEG-180, LAT0-y/DEG]; }
function cellOf(lon, lat){
  const cx = Math.floor(lon+180), cy = Math.floor(LAT0-lat);
  if (cx < 0 || cx >= CW || cy < 0 || cy >= CH) return -1;
  return cy*CW+cx;
}
function cellCenter(i){ return [(i%CW)-180+0.5, LAT0-Math.floor(i/CW)-0.5]; }
function cellXY(i){ return [((i%CW)+0.5)*DEG, (Math.floor(i/CW)+0.5)*DEG]; }
function cellArea(i){ const lat = LAT0-Math.floor(i/CW)-0.5; return 12308.6*Math.cos(lat*Math.PI/180); }
function neighbors4(i){
  const x = i%CW, y = (i/CW)|0, r = [];
  if (x>0) r.push(i-1); if (x<CW-1) r.push(i+1); if (y>0) r.push(i-CW); if (y<CH-1) r.push(i+CW);
  return r;
}
function pointInPoly(lon, lat, poly){
  let inside = false;
  for (let i=0, j=poly.length-1; i<poly.length; j=i++){
    const xi=poly[i][0], yi=poly[i][1], xj=poly[j][0], yj=poly[j][1];
    if (((yi>lat)!==(yj>lat)) && (lon < (xj-xi)*(lat-yi)/(yj-yi)+xi)) inside = !inside;
  }
  return inside;
}
function polyAreaKm2(poly){
  // área aproximada (lon/lat) em km²
  let a = 0;
  for (let i=0, j=poly.length-1; i<poly.length; j=i++){
    const x1 = poly[j][0]*111.32*Math.cos(poly[j][1]*Math.PI/180), y1 = poly[j][1]*110.57;
    const x2 = poly[i][0]*111.32*Math.cos(poly[i][1]*Math.PI/180), y2 = poly[i][1]*110.57;
    a += x1*y2 - x2*y1;
  }
  return Math.abs(a/2);
}

const Grid = {
  land: new Uint8Array(NCELLS),
  owner: new Int16Array(NCELLS),
  buildLand(extraPolys){
    const c = document.createElement('canvas'); c.width = CW; c.height = CH;
    const x = c.getContext('2d');
    x.fillStyle = '#000';
    const polys = Object.values(CONTINENTS).concat(extraPolys||[]);
    for (const p of polys){ x.beginPath(); p.forEach(([lo,la],k)=> k ? x.lineTo(lo+180, LAT0-la) : x.moveTo(lo+180, LAT0-la)); x.closePath(); x.fill(); }
    x.globalCompositeOperation = 'destination-out';
    for (const p of LAKES){ x.beginPath(); p.forEach(([lo,la],k)=> k ? x.lineTo(lo+180, LAT0-la) : x.moveTo(lo+180, LAT0-la)); x.closePath(); x.fill(); }
    const d = x.getImageData(0,0,CW,CH).data;
    for (let i=0;i<NCELLS;i++) this.land[i] = d[i*4+3] > 70 ? 1 : 0;
    // terras do jogador sempre são terra
    for (const p of (extraPolys||[])) for (let i=0;i<NCELLS;i++){ if (!this.land[i]){ const [lo,la]=cellCenter(i); if (pointInPoly(lo,la,p)) this.land[i]=1; } }
  },
  encode(arr){ let s=''; for (let i=0;i<arr.length;i++) s += String.fromCharCode(arr[i]+64); return s; },
  decode(str, arr){ for (let i=0;i<arr.length;i++) arr[i] = str.charCodeAt(i)-64; }
};

// ------------------------------------------------------------
const MAP_NB8 = [1,0, -1,0, 0,1, 0,-1, 1,1, -1,-1, 1,-1, -1,1];
const MapView = {
  canvas:null, ctx:null, dpr:1, cw:0, ch:0,
  cam:{x:0, y:0, z:1}, minZ:0.5, maxZ:30,
  base:null, cellCanvas:null, landPath:null, lakePath:null, borderPath:null, playerBorder:null, hoverPath:null,
  dirty:true, anims:[], mode:'politico', hoverCell:-1, hoverOwner:-1, selCell:-1,
  placement:null, shake:null, ships:[], t:0, rails:[], selCorps:null, moveStart:0, worldFx:true, fronts:[], buildMode:null, _lastAmb:0,
  onClick:null, onHover:null, interactive:true, menuMode:false,

  init(canvas){
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.cellCanvas = document.createElement('canvas'); this.cellCanvas.width = CW; this.cellCanvas.height = CH;
    this.buildPaths([]); this.buildBase([]);
    this.ships = SHIP_ROUTES.map((r,i)=>({route:r, p:Math.random(), speed:0.006+Math.random()*0.006, dir:i%2?1:-1}));
    this.bindEvents();
    window.addEventListener('resize', ()=>this.resize());
    this.resize(); this.fit();
    // o relógio das animações de fundo para quando o jogo está pausado
    let last = 0; this.t = 0;
    // pausado e sem nada mudando, o quadro é idêntico ao anterior: não redesenha
    this.kick = 30; let lastSig = '', lastDraw = 0;
    const kick = ()=>{ this.kick = 30; };
    ['pointerdown','pointermove','pointerup','wheel','keydown','touchstart','touchmove'].forEach(ev=>window.addEventListener(ev, kick, {passive:true}));
    window.addEventListener('resize', kick);
    const loop = (ts)=>{
      const dt = last ? Math.min(0.1, (ts - last)/1000) : 0; last = ts; this.paused = this.isPaused(); if (!this.paused) this.t += dt;
      const sig = this.cam.x + ',' + this.cam.y + ',' + this.cam.z + ',' + this.hoverCell + ',' + this.hoverOwner + ',' + this.selCell + ',' + this.mode + ',' + this.canvas.width + 'x' + this.canvas.height + ',' + (typeof G !== 'undefined' && G ? G.turn : -1);
      const busy = !this.paused || this.menuMode || this.dirty || this.anims.length || this.shake || this.placement || this.buildMode || this.kick > 0 || sig !== lastSig || ts - lastDraw > 500;
      if (busy){ this.frame(); lastSig = sig; lastDraw = ts; if (this.kick > 0) this.kick--; }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  },

  resize(){
    const r = this.canvas.getBoundingClientRect();
    this.dpr = window.devicePixelRatio || 1;
    this.cw = Math.max(50, r.width); this.ch = Math.max(50, r.height);
    this.canvas.width = Math.round(this.cw*this.dpr); this.canvas.height = Math.round(this.ch*this.dpr);
    this.minZ = Math.min(this.cw/MW, this.ch/MH);
    this.clampCam();
  },
  fit(){ this.cam.z = Math.max(this.minZ, this.cw/MW); this.cam.x = 0; this.cam.y = (MH - this.ch/this.cam.z)/2; this.clampCam(); },
  clampCam(){
    const c = this.cam; c.z = Math.max(this.minZ, Math.min(this.maxZ, c.z));
    const vw = this.cw/c.z, vh = this.ch/c.z;
    c.x = vw >= MW ? (MW-vw)/2 : Math.max(0, Math.min(MW-vw, c.x));
    c.y = vh >= MH ? (MH-vh)/2 : Math.max(0, Math.min(MH-vh, c.y));
  },
  toWorld(sx, sy){ return [sx/this.cam.z + this.cam.x, sy/this.cam.z + this.cam.y]; },
  toScreen(wx, wy){ return [(wx-this.cam.x)*this.cam.z, (wy-this.cam.y)*this.cam.z]; },
  zoomAt(sx, sy, f){
    const [wx, wy] = this.toWorld(sx, sy);
    this.cam.z *= f; this.clampCam();
    this.cam.x = wx - sx/this.cam.z; this.cam.y = wy - sy/this.cam.z; this.clampCam();
  },
  flyTo(lon, lat, z){
    const [wx, wy] = proj(lon, lat);
    const start = {...this.cam}, tz = z || Math.max(this.cam.z, 2.2), t0 = performance.now(), dur = 900;
    const step = ()=>{
      const k = Math.min(1, (performance.now()-t0)/dur), e = k<0.5 ? 2*k*k : 1-Math.pow(-2*k+2,2)/2;
      this.cam.z = start.z + (tz-start.z)*e;
      const tx = wx - this.cw/2/this.cam.z, ty = wy - this.ch/2/this.cam.z;
      this.cam.x = start.x + (tx-start.x)*e; this.cam.y = start.y + (ty-start.y)*e;
      this.clampCam(); if (k<1) requestAnimationFrame(step);
    };
    step();
  },

  bindEvents(){
    const cv = this.canvas; let down = null, moved = false;
    cv.addEventListener('mousedown', e=>{ down = {x:e.clientX, y:e.clientY, cx:this.cam.x, cy:this.cam.y}; moved = false; });
    window.addEventListener('mousemove', e=>{
      const r = cv.getBoundingClientRect(); const sx = e.clientX-r.left, sy = e.clientY-r.top;
      if (down){
        const dx = e.clientX-down.x, dy = e.clientY-down.y;
        if (Math.abs(dx)+Math.abs(dy) > 4) moved = true;
        if (moved && !this.menuMode){ this.cam.x = down.cx - dx/this.cam.z; this.cam.y = down.cy - dy/this.cam.z; this.clampCam(); cv.style.cursor='grabbing'; }
      }
      if (e.target !== cv) return;
      const [wx, wy] = this.toWorld(sx, sy); const [lon, lat] = unproj(wx, wy);
      this.mouseLonLat = [lon, lat];
      const c = cellOf(lon, lat);
      if (c !== this.hoverCell){
        this.hoverCell = c;
        const o = (c>=0 && Grid.land[c]) ? Grid.owner[c] : -1;
        if (o !== this.hoverOwner){ this.hoverOwner = o; this.hoverPath = o > 0 ? this.nationPath(o) : null; }
        if (this.onHover) this.onHover(c, e.clientX, e.clientY);
      } else if (this.onHover) this.onHover(c, e.clientX, e.clientY, true);
    });
    window.addEventListener('mouseup', e=>{
      if (down && !moved && e.target === cv && this.onClick){
        const r = cv.getBoundingClientRect(); const sx = e.clientX-r.left, sy = e.clientY-r.top;
        const [wx, wy] = this.toWorld(sx, sy); const [lon, lat] = unproj(wx, wy);
        this.onClick(cellOf(lon, lat), e.clientX, e.clientY, lon, lat);
      }
      down = null; cv.style.cursor = '';
    });
    cv.addEventListener('mouseleave', ()=>{ this.hoverCell = -1; this.hoverOwner = -1; this.hoverPath = null; if (this.onHover) this.onHover(-1); });
    cv.addEventListener('wheel', e=>{
      e.preventDefault(); if (this.menuMode) return;
      if (this.placement && (e.shiftKey || e.altKey)){ this.placement.rot += (e.deltaY>0?1:-1)*0.08; return; }
      const r = cv.getBoundingClientRect(); this.zoomAt(e.clientX-r.left, e.clientY-r.top, e.deltaY < 0 ? 1.18 : 1/1.18);
    }, {passive:false});
  },

  // ---------------- construção de caminhos e base ----------------
  polyPath(p, path){
    p.forEach(([lo,la],k)=>{ const [x,y]=proj(lo,la); k ? path.lineTo(x,y) : path.moveTo(x,y); }); path.closePath();
  },
  buildPaths(extra){
    this.landPath = new Path2D();
    for (const p of Object.values(CONTINENTS)) this.polyPath(p, this.landPath);
    for (const p of extra) this.polyPath(p, this.landPath);
    this.lakePath = new Path2D(); for (const p of LAKES) this.polyPath(p, this.lakePath);
    this.mtnPath = new Path2D();
    const rnd = makeRng(777);
    for (const line of MOUNTAINS){
      for (let k=0;k<line.length-1;k++){
        const [a,b]=[line[k],line[k+1]]; const len = Math.hypot(b[0]-a[0], b[1]-a[1]); const n = Math.max(1, Math.round(len/1.6));
        for (let s=0;s<n;s++){
          const t = s/n; const lo = a[0]+(b[0]-a[0])*t + (rnd()-0.5)*1.5, la = a[1]+(b[1]-a[1])*t + (rnd()-0.5)*1.5;
          const [x,y] = proj(lo,la); const h = 4+rnd()*4, w = 3.5+rnd()*2.5;
          this.mtnPath.moveTo(x-w, y+h*0.4); this.mtnPath.lineTo(x, y-h*0.6); this.mtnPath.lineTo(x+w, y+h*0.4);
          this.mtnPath.moveTo(x-w*0.1, y-h*0.45); this.mtnPath.lineTo(x+w*0.35, y+h*0.1);
        }
      }
    }
    this.treePath = new Path2D();
    for (const [lo0,la0,r] of FORESTS){
      const n = Math.round(r*r*0.9);
      for (let s=0;s<n;s++){
        const a = rnd()*Math.PI*2, d = Math.sqrt(rnd())*r; const lo = lo0+Math.cos(a)*d, la = la0+Math.sin(a)*d*0.8;
        const c = cellOf(lo,la); if (c<0) continue;
        if (!pointInLand(lo,la)) continue;
        const [x,y]=proj(lo,la);
        this.treePath.moveTo(x, y-3.2); this.treePath.lineTo(x+2, y+1); this.treePath.lineTo(x-2, y+1); this.treePath.closePath();
        this.treePath.moveTo(x, y+1); this.treePath.lineTo(x, y+2.5);
      }
    }
    function pointInLand(lo,la){ for (const p of Object.values(CONTINENTS)) if (pointInPoly(lo,la,p)) return true; return false; }
  },

  buildBase(extra){
    const c = document.createElement('canvas'); c.width = MW; c.height = MH;
    const x = c.getContext('2d');
    // pergaminho
    const g = x.createLinearGradient(0,0,MW,MH); g.addColorStop(0,'#e9d8ac'); g.addColorStop(0.5,'#e4d3a8'); g.addColorStop(1,'#dcc697');
    x.fillStyle = g; x.fillRect(0,0,MW,MH);
    const rnd = makeRng(42);
    for (let i=0;i<26;i++){ // manchas
      const sx = rnd()*MW, sy = rnd()*MH, r = 40+rnd()*160;
      const rg = x.createRadialGradient(sx,sy,0,sx,sy,r); rg.addColorStop(0,`rgba(140,95,40,${0.04+rnd()*0.07})`); rg.addColorStop(1,'rgba(140,95,40,0)');
      x.fillStyle = rg; x.fillRect(sx-r,sy-r,r*2,r*2);
    }
    // ruído
    const id = x.getImageData(0,0,MW,MH), d = id.data;
    for (let i=0;i<d.length;i+=4){ const n = (rnd()-0.5)*14; d[i]+=n; d[i+1]+=n; d[i+2]+=n*0.8; }
    x.putImageData(id,0,0);
    // tom do mar
    x.fillStyle = 'rgba(95,120,120,0.16)'; x.fillRect(0,0,MW,MH);
    // linhas d'água concêntricas ao redor da costa
    x.lineJoin = 'round';
    const lp = this.landPath;
    [[30,0.035],[22,0.05],[15,0.07],[9,0.09],[4,0.12]].forEach(([w,a])=>{ x.strokeStyle=`rgba(60,80,90,${a})`; x.lineWidth=w; x.stroke(lp); });
    for (let k=1;k<=4;k++){ x.save(); x.setLineDash([2,3+k]); x.strokeStyle=`rgba(60,80,90,${0.22-k*0.04})`; x.lineWidth=0.8;
      x.translate(0,0); x.lineWidth = 0.8 + k*5; x.globalCompositeOperation='multiply'; x.restore(); }
    // terra
    x.save(); x.fillStyle = '#ecdcb0'; x.fill(lp);
    x.clip(lp);
    for (let i=0;i<60;i++){ const sx=rnd()*MW, sy=rnd()*MH, r=30+rnd()*90; const rg=x.createRadialGradient(sx,sy,0,sx,sy,r); rg.addColorStop(0,`rgba(160,120,60,${0.05+rnd()*0.06})`); rg.addColorStop(1,'rgba(160,120,60,0)'); x.fillStyle=rg; x.fillRect(sx-r,sy-r,2*r,2*r); }
    x.strokeStyle='rgba(120,80,30,0.18)'; x.lineWidth=8; x.stroke(lp);
    x.strokeStyle='rgba(120,80,30,0.12)'; x.lineWidth=16; x.stroke(lp);
    // hachura leve
    x.strokeStyle='rgba(120,85,40,0.06)'; x.lineWidth=1;
    for (let k=-MH;k<MW;k+=7){ x.beginPath(); x.moveTo(k,0); x.lineTo(k+MH,MH); x.stroke(); }
    x.restore();
    // lagos
    x.fillStyle = SEA_COLOR; x.fill(this.lakePath);
    // gratícula
    x.save(); x.strokeStyle='rgba(110,75,40,0.22)'; x.lineWidth=0.7;
    for (let lo=-180; lo<=180; lo+=15){ const [px]=proj(lo,0); x.beginPath(); x.moveTo(px,0); x.lineTo(px,MH); x.stroke(); }
    for (let la=-60; la<=80; la+=15){ const [,py]=proj(0,la); x.beginPath(); x.moveTo(0,py); x.lineTo(MW,py); x.stroke(); }
    x.setLineDash([10,6]); x.strokeStyle='rgba(150,50,30,0.4)'; x.lineWidth=1.1;
    [[0,'AEQVATOR'],[23.44,'TROPICVS CANCRI'],[-23.44,'TROPICVS CAPRICORNI'],[66.56,'CIRCVLVS ARCTICVS']].forEach(([la,t])=>{
      const [,py]=proj(0,la); x.beginPath(); x.moveTo(0,py); x.lineTo(MW,py); x.stroke();
      x.font='italic 9px "IM Fell English", Georgia, serif'; x.fillStyle='rgba(130,45,25,0.7)'; x.fillText(t, 1260, py-3); x.fillText(t, 300, py-3);
    });
    x.restore();
    // rótulos de oceano
    x.save(); x.fillStyle='rgba(70,55,40,0.55)';
    for (const o of OCEAN_LABELS){
      const [px,py]=proj(o.lon,o.lat); x.save(); x.translate(px,py); x.rotate(o.r);
      x.font=`italic ${o.s}px "IM Fell English", Georgia, serif`; x.letterSpacing = (o.s*0.35)+'px'; x.textAlign='center'; x.fillText(o.t,0,0); x.restore();
    }
    x.restore();
    this.drawCompass(x, ...proj(-28,-42), 62);
    this.drawCompass(x, ...proj(-125,-38), 34);
    this.drawCartouche(x, ...proj(-150,32));
    this.drawMonster(x, ...proj(-110,-15));
    this.drawMonster(x, ...proj(68,-42), true);
    // vinheta
    const vg = x.createRadialGradient(MW/2,MH/2,MH*0.4,MW/2,MH/2,MW*0.62);
    vg.addColorStop(0,'rgba(80,50,20,0)'); vg.addColorStop(1,'rgba(80,50,20,0.35)');
    x.fillStyle = vg; x.fillRect(0,0,MW,MH);
    // moldura com graus
    x.strokeStyle='#5a3d1e'; x.lineWidth=3; x.strokeRect(1.5,1.5,MW-3,MH-3);
    x.lineWidth=1; x.strokeRect(7,7,MW-14,MH-14);
    for (let lo=-180; lo<180; lo+=5){ const [px]=proj(lo,0); x.fillStyle = (lo/5)%2 ? '#5a3d1e' : '#e9d8ac'; x.fillRect(px,1.5,30,5.5); x.fillRect(px,MH-7,30,5.5); }
    this.base = c;
  },
  drawCompass(x, cx, cy, r){
    x.save(); x.translate(cx,cy);
    x.strokeStyle='rgba(90,60,30,0.7)'; x.lineWidth=1;
    x.beginPath(); x.arc(0,0,r,0,Math.PI*2); x.stroke(); x.beginPath(); x.arc(0,0,r*0.82,0,Math.PI*2); x.stroke();
    for (let i=0;i<32;i++){ const a=i*Math.PI/16; x.beginPath(); x.moveTo(Math.cos(a)*r*0.82,Math.sin(a)*r*0.82); x.lineTo(Math.cos(a)*r*(i%4?0.9:0.98),Math.sin(a)*r*(i%4?0.9:0.98)); x.stroke(); }
    x.globalAlpha = 0.18; x.beginPath();
    for (let i=0;i<16;i++){ const a=i*Math.PI/8; x.moveTo(0,0); x.lineTo(Math.cos(a)*r*2.6,Math.sin(a)*r*2.6); } x.stroke(); x.globalAlpha=1;
    for (let i=0;i<8;i++){
      const a = i*Math.PI/4 - Math.PI/2, len = i%2 ? r*0.55 : r*0.95, wdt = i%2 ? r*0.09 : r*0.14;
      x.save(); x.rotate(a);
      x.fillStyle = i===0 ? '#8b2a1a' : '#5a3d1e'; x.beginPath(); x.moveTo(len,0); x.lineTo(0,wdt); x.lineTo(0,0); x.fill();
      x.fillStyle = '#efe0b8'; x.beginPath(); x.moveTo(len,0); x.lineTo(0,-wdt); x.lineTo(0,0); x.fill();
      x.strokeStyle='#5a3d1e'; x.beginPath(); x.moveTo(len,0); x.lineTo(0,wdt); x.lineTo(0,-wdt); x.closePath(); x.stroke();
      x.restore();
    }
    x.fillStyle='#5a3d1e'; x.font=`bold ${Math.round(r*0.28)}px "Cinzel", Georgia, serif`; x.textAlign='center'; x.textBaseline='middle';
    x.fillText('N',0,-r*1.13); x.fillText('S',0,r*1.13); x.fillText('L',r*1.13,0); x.fillText('O',-r*1.13,0);
    x.beginPath(); x.arc(0,0,r*0.07,0,Math.PI*2); x.fill();
    x.restore();
  },
  drawCartouche(x, cx, cy){
    x.save(); x.translate(cx,cy);
    const w=190,h=74;
    x.fillStyle='rgba(239,224,184,0.92)'; x.strokeStyle='#5a3d1e'; x.lineWidth=2;
    x.beginPath(); x.moveTo(-w/2+14,-h/2); x.lineTo(w/2-14,-h/2); x.quadraticCurveTo(w/2,-h/2,w/2+10,-h/2-10); x.quadraticCurveTo(w/2,0,w/2+10,h/2+10);
    x.quadraticCurveTo(w/2,h/2,w/2-14,h/2); x.lineTo(-w/2+14,h/2); x.quadraticCurveTo(-w/2,h/2,-w/2-10,h/2+10); x.quadraticCurveTo(-w/2,0,-w/2-10,-h/2-10); x.quadraticCurveTo(-w/2,-h/2,-w/2+14,-h/2);
    x.fill(); x.stroke(); x.lineWidth=0.8; x.strokeRect(-w/2+8,-h/2+6,w-16,h-12);
    x.fillStyle='#3d2812'; x.textAlign='center';
    x.font='700 22px "Cinzel", Georgia, serif'; x.fillText('MAPA MUNDI',0,-4);
    x.font='italic 11px Georgia, serif'; x.fillText('O mundo inteiro numa só carta',0,16);
    x.restore();
  },
  drawMonster(x, cx, cy, flip){
    x.save(); x.translate(cx,cy); if (flip) x.scale(-1,1);
    x.strokeStyle='rgba(70,60,50,0.55)'; x.fillStyle='rgba(90,110,100,0.25)'; x.lineWidth=1.3;
    for (let k=0;k<3;k++){ x.beginPath(); x.arc(-30+k*22,0,9,Math.PI,0); x.fill(); x.stroke(); }
    x.beginPath(); x.moveTo(26,0); x.quadraticCurveTo(34,-22,46,-16); x.quadraticCurveTo(52,-12,44,-8); x.quadraticCurveTo(38,-6,36,0); x.fill(); x.stroke();
    x.beginPath(); x.arc(44,-14,1.4,0,Math.PI*2); x.fillStyle='rgba(70,60,50,0.8)'; x.fill();
    x.beginPath(); x.moveTo(-40,0); x.quadraticCurveTo(-52,-12,-58,-4); x.moveTo(-40,0); x.quadraticCurveTo(-50,8,-58,2); x.stroke();
    x.beginPath(); for (let k=-60;k<60;k+=8){ x.moveTo(k,3); x.quadraticCurveTo(k+4,0,k+8,3); } x.stroke();
    x.restore();
  },

  // ---------------- territórios ----------------
  rebuildTerritory(){
    const img = this.cellCanvas.getContext('2d').createImageData(CW, CH), d = img.data;
    const cols = {};
    const colorOf = (o)=>{
      if (cols[o] !== undefined) return cols[o];
      let c = null;
      if (o > 0 && G && G.nations[o] && G.nations[o].alive){
        if (this.mode === 'relacoes'){
          if (o === 1) c = [212,160,23];
          else { const r = G.nations[o].rel; const t = (r+100)/200; c = [Math.round(200*(1-t)+40*t), Math.round(50*(1-t)+150*t), 50]; if (G.nations[o].atWar) c=[150,10,10]; }
        } else c = hexToRgb(G.nations[o].color);
      }
      cols[o] = c; return c;
    };
    const lands = Grid.land, own = Grid.owner, NB = MAP_NB8;
    for (let i=0;i<NCELLS;i++){
      let o = lands[i] ? own[i] : -1;
      if (o < 0){ // dilatação: herda cor de vizinho terrestre
        const x = i%CW, y = (i/CW)|0;
        for (let k=0;k<16;k+=2){
          const nx=x+NB[k], ny=y+NB[k+1]; if (nx<0||ny<0||nx>=CW||ny>=CH) continue; const j=ny*CW+nx;
          if (lands[j]){ o = own[j]; break; }
        }
      }
      const c = o > 0 ? colorOf(o) : null;
      if (c){ d[i*4]=c[0]; d[i*4+1]=c[1]; d[i*4+2]=c[2]; d[i*4+3]=255; }
    }
    this.cellCanvas.getContext('2d').putImageData(img,0,0);
    const atWar = new Uint8Array(G.nations.length); G.nations.forEach((n, k)=>{ if (n && n.atWar) atWar[k] = 1; });
    [this.borderPath, this.playerBorder, this.warBorder] = this.marchingMulti([
      (a,b)=> a!==b,
      (a,b)=> (a===1)!==(b===1),
      (a,b)=> a!==b && ((a===1 && atWar[b]===1) || (b===1 && atWar[a]===1))]);
    this.hoverCache = new Map();
    this.hoverPath = this.hoverOwner > 0 ? this.nationPath(this.hoverOwner) : null;
    this.dirty = false;
  },
  // fronteiras suavizadas via marching squares multi-rótulo
  marching(diff){
    const p = new Path2D(), L = Grid.land, O = Grid.owner;
    const lab = i => L[i] ? O[i] : -9;
    const act = (a,b)=> a!==-9 && b!==-9 && diff(a,b);
    for (let y=0;y<CH-1;y++) for (let x=0;x<CW-1;x++){
      const i=y*CW+x; const tl=lab(i), tr=lab(i+1), bl=lab(i+CW), br=lab(i+CW+1);
      const e = [];
      const X=(x+1)*DEG, Y=(y+1)*DEG, h=DEG/2;
      if (act(tl,tr)) e.push([X, Y-h]);
      if (act(tr,br)) e.push([X+h, Y]);
      if (act(br,bl)) e.push([X, Y+h]);
      if (act(bl,tl)) e.push([X-h, Y]);
      if (e.length === 2){ p.moveTo(e[0][0],e[0][1]); p.lineTo(e[1][0],e[1][1]); }
      else if (e.length){ for (const q of e){ p.moveTo(q[0],q[1]); p.lineTo(X,Y); } }
    }
    return p;
  },
  // mesmo traçado de marching(), mas várias fronteiras numa única varredura do mapa
  marchingMulti(diffs){
    const ps = diffs.map(()=>new Path2D()), L = Grid.land, O = Grid.owner, h = DEG/2;
    for (let y=0;y<CH-1;y++) for (let x=0;x<CW-1;x++){
      const i=y*CW+x;
      const tl = L[i] ? O[i] : -9, tr = L[i+1] ? O[i+1] : -9, bl = L[i+CW] ? O[i+CW] : -9, br = L[i+CW+1] ? O[i+CW+1] : -9;
      if (tl === tr && tr === br && br === bl) continue;   // nenhuma fronteira passa aqui
      const X=(x+1)*DEG, Y=(y+1)*DEG;
      for (let k=0;k<diffs.length;k++){
        const diff = diffs[k], act = (a,b)=> a!==-9 && b!==-9 && diff(a,b), e = [];
        if (act(tl,tr)) e.push([X, Y-h]);
        if (act(tr,br)) e.push([X+h, Y]);
        if (act(br,bl)) e.push([X, Y+h]);
        if (act(bl,tl)) e.push([X-h, Y]);
        const p = ps[k];
        if (e.length === 2){ p.moveTo(e[0][0],e[0][1]); p.lineTo(e[1][0],e[1][1]); }
        else if (e.length){ for (const q of e){ p.moveTo(q[0],q[1]); p.lineTo(X,Y); } }
      }
    }
    return ps;
  },
  nationPath(o){
    // contorno de passar o mouse: guardado até o mapa mudar
    if (!this.hoverCache) this.hoverCache = new Map();
    let p = this.hoverCache.get(o); if (!p){ p = this.marchingOwner(o); this.hoverCache.set(o, p); if (this.hoverCache.size > 40) this.hoverCache.delete(this.hoverCache.keys().next().value); }
    return p;
  },
  marchingOwner(o){
    const p = new Path2D(), L = Grid.land, O = Grid.owner;
    const isO = i => L[i] && O[i]===o;
    for (let y=0;y<CH-1;y++) for (let x=0;x<CW-1;x++){
      const i=y*CW+x; const a=isO(i), b=isO(i+1), c=isO(i+CW+1), d=isO(i+CW);
      if (a===b && b===c && c===d) continue;
      const X=(x+1)*DEG, Y=(y+1)*DEG, h=DEG/2, e=[];
      if (a!==b) e.push([X,Y-h]); if (b!==c) e.push([X+h,Y]); if (c!==d) e.push([X,Y+h]); if (d!==a) e.push([X-h,Y]);
      if (e.length===2){ p.moveTo(e[0][0],e[0][1]); p.lineTo(e[1][0],e[1][1]); } else for (const q of e){ p.moveTo(q[0],q[1]); p.lineTo(X,Y); }
    }
    return p;
  },

  // ---------------- animações ----------------
  addAnim(a){ a.t0 = performance.now(); this.anims.push(a); return a; },
  boom(wx, wy, big){
    const parts = []; const n = big ? 60 : 26;
    for (let i=0;i<n;i++){ const a=Math.random()*Math.PI*2, s=(0.5+Math.random())*(big?40:16); parts.push({vx:Math.cos(a)*s, vy:Math.sin(a)*s, r:1+Math.random()*(big?5:2.5), c: Math.random()<0.5?'#ffb43a':'#e04b1a'}); }
    this.addAnim({type:'boom', x:wx, y:wy, parts, dur: big?2200:1100, big});
  },
  floatText(wx, wy, text, color){ this.addAnim({type:'text', x:wx, y:wy, text, color:color||'#3d2812', dur:1800}); },
  ring(wx, wy, color, r){ this.addAnim({type:'ring', x:wx, y:wy, color:color||'#8b1a1a', r:r||30, dur:1200}); },
  arrow(from, to, color){ this.addAnim({type:'arrow', from, to, color:color||'#8b1a1a', dur:1400}); },
  flashCells(cells, color){ this.addAnim({type:'flash', cells, color:color||'#ffd34d', dur:1800}); },
  doShake(mag, dur){ this.shake = {t0:performance.now(), mag:mag||8, dur:dur||600}; },

  // ---------------- quadro ----------------
  frame(){
    const ctx = this.ctx; if (!ctx) return;
    if (this.dirty && G) this.rebuildTerritory();
    const now = performance.now();
    ctx.setTransform(1,0,0,1,0,0);
    ctx.fillStyle = '#2a1c10'; ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    let sx = 0, sy = 0;
    if (this.shake){ const k = (now-this.shake.t0)/this.shake.dur; if (k>=1) this.shake=null; else { const m=this.shake.mag*(1-k); sx=(Math.random()-0.5)*m; sy=(Math.random()-0.5)*m; } }
    if (this.menuMode){ this.cam.x += 0.12; if (this.cam.x > MW - this.cw/this.cam.z) this.cam.x = 0; }
    const z = this.cam.z;
    ctx.setTransform(this.dpr*z, 0, 0, this.dpr*z, this.dpr*(-this.cam.x*z+sx), this.dpr*(-this.cam.y*z+sy));
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.base, 0, 0);

    if (G && G.nations){
      // territórios
      ctx.save(); ctx.clip(this.landPath);
      ctx.globalAlpha = this.mode === 'relacoes' ? 0.6 : 0.5;
      ctx.drawImage(this.cellCanvas, 0, 0, MW, MH);
      ctx.globalAlpha = 1;
      // hachura do jogador
      if (G.p && G.p.homePoly && G.nations[1].alive){
        ctx.save(); const hp = new Path2D(); this.polyPath(G.p.homePoly, hp); ctx.clip(hp);
        ctx.strokeStyle = hexA(G.nations[1].color, 0.35); ctx.lineWidth = 1/z*1.2;
        const [ax, ay] = proj(G.p.homePoly[0][0], G.p.homePoly[0][1]);
        for (let k=-300;k<300;k+=4) { ctx.beginPath(); ctx.moveTo(ax+k-150, ay-150); ctx.lineTo(ax+k+150, ay+150); ctx.stroke(); }
        ctx.restore();
      }
      ctx.restore();
      ctx.fillStyle = SEA_COLOR; ctx.fill(this.lakePath);
    }
    // relevo
    ctx.strokeStyle = 'rgba(80,55,25,0.55)'; ctx.lineWidth = 0.8; ctx.stroke(this.mtnPath);
    ctx.strokeStyle = 'rgba(60,85,40,0.45)'; ctx.lineWidth = 0.7; ctx.stroke(this.treePath);
    // costa
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#4a3218'; ctx.lineWidth = Math.max(0.6, 1.3/z); ctx.stroke(this.landPath); ctx.stroke(this.lakePath);

    if (G && G.nations){
      if (this.borderPath){
        ctx.save(); ctx.setLineDash([3/z*1.6+1, 2/z*1.6+0.6]);
        ctx.strokeStyle = 'rgba(70,35,15,0.75)'; ctx.lineWidth = Math.max(0.5, 1.2/z); ctx.stroke(this.borderPath); ctx.restore();
        ctx.strokeStyle = 'rgba(255,240,200,0.5)'; ctx.lineWidth = Math.max(1.6, 4/z); ctx.stroke(this.playerBorder);
        ctx.strokeStyle = G.nations[1].color; ctx.lineWidth = Math.max(1, 2.2/z); ctx.stroke(this.playerBorder);
        if (this.warBorder){ const pulse = 0.5+0.5*Math.sin(this.t*5); ctx.strokeStyle = `rgba(200,20,10,${0.4+pulse*0.5})`; ctx.lineWidth = Math.max(1.5, 3.2/z); ctx.stroke(this.warBorder); }
      }
      if (this.hoverPath && !this.placement){ ctx.strokeStyle = 'rgba(255,250,220,0.9)'; ctx.lineWidth = Math.max(1, 2.5/z); ctx.stroke(this.hoverPath); ctx.strokeStyle='rgba(60,30,10,0.9)'; ctx.lineWidth=Math.max(0.5,1/z); ctx.stroke(this.hoverPath); }
      this._boxes = [];
      if (this.drawGeoStates) this.drawGeoStates(ctx, z);
      this.drawShips(ctx, z);
      this.drawLabels(ctx, z);
      this.drawRails(ctx, z);
      this.drawSynergies(ctx, z);
      this.drawSites(ctx, z);
      this.drawBuildings(ctx, z);
      this.drawCities(ctx, z);
      if (this.drawGeoLayers) this.drawGeoLayers(ctx, z);
      this.drawCorps(ctx, z);
      this.drawExpeditions(ctx, z);
      if (this.worldFx && !this.menuMode && !this.paused) this.ambientWar(now);
    } else this.drawShips(ctx, z);

    if (this.selCell >= 0){ const [x,y]=cellXY(this.selCell); const r = 5 + Math.sin(this.t*6)*1.5; ctx.strokeStyle='#8b1a1a'; ctx.lineWidth=1.5/z+0.3; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x-r-3,y); ctx.lineTo(x-r+2,y); ctx.moveTo(x+r-2,y); ctx.lineTo(x+r+3,y); ctx.moveTo(x,y-r-3); ctx.lineTo(x,y-r+2); ctx.moveTo(x,y+r-2); ctx.lineTo(x,y+r+3); ctx.stroke(); }
    if (this.placement) this.drawPlacement(ctx, z);
    if (this.buildMode && this.hoverCell >= 0) this.drawBuildGhost(ctx, z);
    this.drawAnims(ctx, z, now);
  },

  isPaused(){ return !!(typeof G !== 'undefined' && G && !G.over && !G.online && !this.menuMode && typeof UI !== 'undefined' && UI.speed === 0 && !UI.busy); },
  drawShips(ctx, z){
    for (const s of this.ships){
      if (!this.paused){ s.p += s.speed/60*s.dir; if (s.p>1) s.p-=1; if (s.p<0) s.p+=1; }
      const r = s.route, seg = (r.length-1)*s.p, k = Math.floor(seg), f = seg-k;
      const a = r[k], b = r[Math.min(k+1,r.length-1)];
      const lo = a[0]+(b[0]-a[0])*f, la = a[1]+(b[1]-a[1])*f; const [x,y]=proj(lo,la);
      const dir = ((b[0]-a[0])*s.dir) >= 0 ? 1 : -1;
      ctx.save(); ctx.translate(x, y + Math.sin(this.t*2+s.p*20)*0.8); ctx.scale(dir,1);
      ctx.fillStyle='#5a3d1e'; ctx.beginPath(); ctx.moveTo(-6,0); ctx.lineTo(6,0); ctx.lineTo(4,3); ctx.lineTo(-4,3); ctx.fill();
      ctx.fillStyle='#f3e6c4'; ctx.strokeStyle='#5a3d1e'; ctx.lineWidth=0.5;
      ctx.beginPath(); ctx.moveTo(0,-9); ctx.quadraticCurveTo(4,-5,0,-1); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-1,-7); ctx.quadraticCurveTo(-5,-4,-1,-1); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,-10); ctx.lineTo(0,0); ctx.stroke();
      ctx.strokeStyle='rgba(60,80,90,0.4)'; ctx.beginPath(); ctx.moveTo(-8*1,4); ctx.lineTo(-16,4.5); ctx.stroke();
      ctx.restore();
    }
  },

  drawLabels(ctx, z){
    ctx.save(); ctx.textAlign='center'; ctx.textBaseline='middle';
    for (let id=2; id<G.nations.length; id++){
      const n = G.nations[id]; if (!n.alive || !n.cells) continue;
      const fs = n.labelSize; if (fs*z < 6.5) continue;
      ctx.font = `600 ${fs}px "Cinzel", Georgia, serif`; ctx.letterSpacing = (fs*0.18)+'px';
      ctx.lineWidth = fs*0.22; ctx.strokeStyle='rgba(240,228,195,0.75)'; ctx.fillStyle='rgba(55,35,15,0.85)';
      const t = n.name.toUpperCase();
      ctx.strokeText(t, n.lx, n.ly); ctx.fillText(t, n.lx, n.ly);
      if (n.atWar){ ctx.font = `${fs*0.9}px serif`; ctx.letterSpacing='0px'; ctx.fillText('⚔', n.lx, n.ly - fs*1.1); }
    }
    // capitais IA
    for (let id=2; id<G.nations.length; id++){
      const n = G.nations[id]; if (!n.alive || n.cap < 0) continue;
      const [x,y] = cellXY(n.cap); const r = Math.max(1.4, 2.2/Math.sqrt(z));
      ctx.fillStyle = '#3d2812'; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#3d2812'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(x,y,r*1.9,0,Math.PI*2); ctx.stroke();
      if (z > 2.4){ ctx.font = `italic ${Math.max(3.4, 9/z)}px "IM Fell English", Georgia, serif`; ctx.letterSpacing='0px'; ctx.fillStyle='rgba(50,30,10,0.9)'; ctx.fillText(n.capital, x, y + r*2 + 9/z); }
    }
    ctx.restore();
  },

  drawCities(ctx, z){
    const p = G.p; if (!p || !G.nations[1].alive) return;
    ctx.save(); ctx.textAlign='center';
    const n1 = G.nations[1];
    // nome do país do jogador
    if (n1.cells){
      const fs = Math.max(n1.labelSize, 7);
      ctx.font = `700 ${fs}px "Cinzel", Georgia, serif`; ctx.letterSpacing = (fs*0.2)+'px';
      ctx.lineWidth = fs*0.28; ctx.strokeStyle='rgba(255,245,215,0.9)'; ctx.fillStyle = darken(n1.color, 0.45);
      ctx.strokeText(p.name.toUpperCase(), n1.lx, n1.ly + fs*1.4); ctx.fillText(p.name.toUpperCase(), n1.lx, n1.ly + fs*1.4);
    }
    ctx.letterSpacing='0px';
    if (z > 1.6 && p.cityCells){
      // nossas cidades: na posição real (quando é cidade real) e com nomes que não se sobrepõem
      const fs = 12/z, boxes = this._boxes || (this._boxes = []);
      ctx.font = `italic 600 ${fs}px "IM Fell English", Georgia, serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      p.cityCells.forEach((c, k)=>{
        if (Grid.owner[c] !== 1 || c === p.capCell) return;
        const pos = p.cityPos && p.cityPos[c]; let x, y;
        if (pos) [x, y] = proj(pos[0], pos[1]); else { [x, y] = cellXY(c); x += ((k*37)%5-2)*0.6; y += ((k*53)%5-2)*0.6; }
        const r = Math.max(0.7, 2.6/z);
        ctx.fillStyle='#3d2812'; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
        if (z > 2.6){
          const nm = p.cityNames[k] || '', w = ctx.measureText(nm).width, bx = [x - r, y - fs*0.6, x + r*2 + w, y + fs*0.6];
          if (boxes.some(b => bx[0] < b[2] && bx[2] > b[0] && bx[1] < b[3] && bx[3] > b[1])) return;
          boxes.push(bx);
          ctx.lineWidth = 3/z; ctx.strokeStyle = 'rgba(244,232,200,0.9)'; ctx.strokeText(nm, x + r*1.6, y); ctx.fillText(nm, x + r*1.6, y);
        }
      });
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    }
    // capital + bandeira tremulando
    if (n1.cap >= 0){
      const [x,y] = cellXY(n1.cap);
      const s = Math.max(2.6, 5/Math.sqrt(z));
      ctx.fillStyle='#8b1a1a'; starPath(ctx, x, y, s, 5, 0.45); ctx.fill(); ctx.strokeStyle='#fff3d0'; ctx.lineWidth=0.6/z+0.2; ctx.stroke();
      const pulse = (this.t % 2)/2; ctx.strokeStyle = `rgba(139,26,26,${1-pulse})`; ctx.lineWidth = 1/z+0.3; ctx.beginPath(); ctx.arc(x,y,s+pulse*14,0,Math.PI*2); ctx.stroke();
      if (p.flagCanvas){
        const fh = Math.max(6, 16/Math.sqrt(z)), fw = fh*1.5, px = x + s*0.4, py = y - s*0.4 - fh*1.6;
        ctx.strokeStyle='#3d2812'; ctx.lineWidth = Math.max(0.4, 1/z+0.2); ctx.beginPath(); ctx.moveTo(px, y-s*0.3); ctx.lineTo(px, py-1); ctx.stroke();
        const strips = 14, sw = fw/strips, src = p.flagCanvas;
        for (let k=0;k<strips;k++){
          const off = Math.sin(this.t*4 - k*0.55)*fh*0.08*(k/strips);
          ctx.drawImage(src, k*src.width/strips, 0, src.width/strips+0.5, src.height, px + k*sw, py + off, sw+0.3, fh);
        }
      }
      if (z > 1.2){ ctx.font = `600 ${Math.max(3.6, 10/z)}px "IM Fell English", Georgia, serif`; ctx.fillStyle='#3d2812'; ctx.lineWidth=2/z; ctx.strokeStyle='rgba(255,245,215,0.85)'; ctx.strokeText(p.capital, x, y + s + 10/z); ctx.fillText(p.capital, x, y + s + 10/z); }
    }
    ctx.restore();
  },

  drawPlacement(ctx, z){
    const pl = this.placement; if (!this.mouseLonLat) return;
    const poly = placementPoly(pl.shape, this.mouseLonLat[0], this.mouseLonLat[1], pl.area, pl.rot);
    pl.current = poly;
    const p = new Path2D(); this.polyPath(poly, p);
    ctx.fillStyle = hexA(pl.color, 0.45 + 0.1*Math.sin(this.t*4)); ctx.fill(p);
    ctx.save(); ctx.setLineDash([4/z+1, 3/z+1]); ctx.lineDashOffset = -this.t*20; ctx.strokeStyle='#3d2812'; ctx.lineWidth = 2/z+0.3; ctx.stroke(p); ctx.restore();
    const [x,y] = proj(this.mouseLonLat[0], this.mouseLonLat[1]);
    ctx.fillStyle='#8b1a1a'; starPath(ctx,x,y,4,5,0.45); ctx.fill();
  },

  drawBuildings(ctx, z){
    const bs = G.p && G.p.buildings; if (!bs || !bs.length) return;
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const s = Math.max(4, 11/Math.sqrt(z));
    for (const b of bs){
      if (!bOk(b)) continue;
      const [x,y] = cellXY(b.c); const B = BUILDINGS[b.t];
      ctx.fillStyle = 'rgba(245,232,200,0.9)'; ctx.strokeStyle = '#5a3d1e'; ctx.lineWidth = Math.max(0.3, 0.8/z);
      ctx.beginPath(); ctx.arc(x, y, s*0.62, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.font = `${s*0.8}px serif`; ctx.fillText(B.icon, x, y + s*0.04);
      const L = buildingLocal(b);
      if (L && (this.buildMode || this.hoverCell === b.c)){ ctx.strokeStyle = 'rgba(44,79,115,0.6)'; ctx.setLineDash([3/z+1,2/z+1]); ctx.beginPath(); ctx.arc(x, y, L.r*DEG, 0, Math.PI*2); ctx.stroke(); ctx.setLineDash([]); }
      if (b.path && b.path.length){ ctx.fillStyle = '#c9a13b'; ctx.font = `bold ${s*0.45}px serif`; ctx.fillText('★'.repeat(b.path.length), x, y + s*0.85); }
      if (b.up){ ctx.font = `${s*0.5}px serif`; ctx.fillText('🏗️', x + s*0.6, y - s*0.5); }
    }
    ctx.restore();
  },
  drawRails(ctx, z){
    const r = this.rails; if (!r || !r.length) return;
    ctx.save(); ctx.lineCap = 'round';
    for (const [a,b] of r){
      const [x1,y1] = cellXY(a), [x2,y2] = cellXY(b);
      ctx.strokeStyle = 'rgba(45,30,15,0.75)'; ctx.lineWidth = Math.max(0.8, 2.2/z); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
      ctx.strokeStyle = 'rgba(240,225,190,0.9)'; ctx.lineWidth = Math.max(0.3, 0.8/z); ctx.setLineDash([Math.max(1,2.5/z), Math.max(1,2.5/z)]); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.restore();
  },
  drawSites(ctx, z){
    if (z < 1.3) return;
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const s = Math.max(3.5, 9/Math.sqrt(z));
    for (let id=2; id<G.nations.length; id++){
      const n = G.nations[id]; if (!n.alive || !n.sites) continue;
      for (const st of n.sites){
        if (!st.known || st.capital || Grid.owner[st.c] !== id) continue;
        const [x,y] = cellXY(st.c);
        ctx.fillStyle = 'rgba(255,240,215,0.85)'; ctx.strokeStyle = n.atWar ? '#b3261e' : '#5a3d1e'; ctx.lineWidth = Math.max(0.4, 1.2/z);
        ctx.beginPath(); ctx.rect(x - s*0.55, y - s*0.55, s*1.1, s*1.1); ctx.fill(); ctx.stroke();
        ctx.font = `${s*0.75}px serif`; ctx.fillText(SITES[st.t].icon, x, y + s*0.05);
        if (st.down > G.turn){ ctx.strokeStyle = '#c0392b'; ctx.lineWidth = Math.max(0.6, 2/z); ctx.beginPath(); ctx.moveTo(x - s*0.6, y - s*0.6); ctx.lineTo(x + s*0.6, y + s*0.6); ctx.moveTo(x + s*0.6, y - s*0.6); ctx.lineTo(x - s*0.6, y + s*0.6); ctx.stroke(); }
      }
    }
    ctx.restore();
  },
  drawCorps(ctx, z){
    const cs = G.p && G.p.corps; if (!cs || !cs.length) return;
    const k = Math.min(1, (performance.now() - (this.moveStart||0)) / 1400), e = k<0.5 ? 2*k*k : 1-Math.pow(-2*k+2,2)/2;
    const s = Math.max(5, 13/Math.sqrt(z)), col = G.nations[1].color;
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const c of cs){
      const [x0,y0] = cellXY(c.prev ?? c.cell), [x1,y1] = cellXY(c.cell);
      const x = x0 + (x1-x0)*e, y = y0 + (y1-y0)*e - (k<1 ? Math.abs(Math.sin(k*Math.PI*6))*1.5 : 0);
      const sel = this.selCorps === c.id;
      if (sel){
        const R = corpsReach()*DEG; ctx.strokeStyle = 'rgba(179,38,30,0.55)'; ctx.setLineDash([4/z+1, 3/z+1]); ctx.lineWidth = 1.2/z+0.3; ctx.beginPath(); ctx.arc(x1, y1, R, 0, Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = `rgba(255,215,90,${0.6+0.4*Math.sin(this.t*6)})`; ctx.lineWidth = 3/z+0.5; ctx.beginPath(); ctx.arc(x, y, s*0.95, 0, Math.PI*2); ctx.stroke();
      }
      if (c.path && c.path.length){
        ctx.strokeStyle = 'rgba(44,79,115,0.8)'; ctx.lineWidth = 1.6/z+0.3; ctx.setLineDash([3/z+1, 2/z+1]); ctx.lineDashOffset = -this.t*10;
        ctx.beginPath(); ctx.moveTo(x1, y1); for (const q of c.path){ const [px,py] = cellXY(q); ctx.lineTo(px, py); } ctx.stroke(); ctx.setLineDash([]);
        const [dx,dy] = cellXY(c.path[c.path.length-1]); ctx.fillStyle = 'rgba(44,79,115,0.9)'; ctx.font = `${s*0.7}px serif`; ctx.fillText('🚩', dx, dy - s*0.3);
      }
      // escudo
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(x+1, y+s*0.75, s*0.6, s*0.18, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x - s*0.55, y - s*0.6); ctx.lineTo(x + s*0.55, y - s*0.6); ctx.lineTo(x + s*0.55, y + s*0.1);
      ctx.quadraticCurveTo(x + s*0.5, y + s*0.55, x, y + s*0.75); ctx.quadraticCurveTo(x - s*0.5, y + s*0.55, x - s*0.55, y + s*0.1); ctx.closePath();
      ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = '#fff3d0'; ctx.lineWidth = Math.max(0.5, 1.4/z); ctx.stroke();
      ctx.strokeStyle = '#2a1a0a'; ctx.lineWidth = Math.max(0.3, 0.6/z); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = `bold ${s*0.5}px Cinzel, serif`; ctx.fillText(String(corpsUnitsCount(c)), x, y - s*0.08);
      ctx.font = `${s*0.38}px serif`; ctx.fillText(c.naval ? '⛴' : '⚔', x, y + s*0.38);
      if (z > 2.2){ ctx.fillStyle = '#2a1a0a'; ctx.font = `italic ${Math.max(3, 8/z)}px "IM Fell English", serif`; ctx.fillText(c.name, x, y - s*0.95); }
    }
    ctx.restore();
  },
  drawExpeditions(ctx, z){
    const ex = G.p && G.p.expeds; if (!ex || !ex.length) return;
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const e of ex){
      const [x1,y1] = cellXY(e.from), [x2,y2] = cellXY(e.to);
      const k = clamp((G.turn - e.start + Math.min(1, (performance.now()-(this.moveStart||0))/1400)) / Math.max(1, e.due - e.start), 0, 1);
      ctx.strokeStyle = 'rgba(44,79,115,0.5)'; ctx.lineWidth = 1.2/z+0.3; ctx.setLineDash([3/z+1, 3/z+1]); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); ctx.setLineDash([]);
      const x = x1 + (x2-x1)*k, y = y1 + (y2-y1)*k + Math.sin(this.t*3)*1.2;
      ctx.font = `${Math.max(6, 14/Math.sqrt(z))}px serif`; ctx.fillText(EXPED[e.type].icon, x, y);
      ctx.font = `${Math.max(5, 11/Math.sqrt(z))}px serif`; ctx.fillText('🚩', x2, y2);
    }
    ctx.restore();
  },
  drawSynergies(ctx, z){
    if (z < 1.6 || !G.p || !G.p.buildings || G.p.buildings.length < 2) return;
    const syn = activeSynergies(); if (!syn.length) return;
    ctx.save(); ctx.strokeStyle = 'rgba(201,161,59,0.85)'; ctx.lineWidth = 1.4/z+0.3; ctx.setLineDash([2/z+0.8, 2/z+0.8]);
    for (const {a, b} of syn){ const [x1,y1] = cellXY(a.c), [x2,y2] = cellXY(b.c); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); }
    ctx.setLineDash([]); ctx.restore();
  },
  drawBuildGhost(ctx, z){
    const c = this.hoverCell, t = this.buildMode, ok = !canBuildAt(t, c);
    const [x,y] = cellXY(c), s = Math.max(5, 13/Math.sqrt(z));
    ctx.save(); ctx.globalAlpha = 0.6 + 0.3*Math.sin(this.t*6);
    ctx.fillStyle = ok ? 'rgba(90,160,60,0.45)' : 'rgba(200,40,30,0.45)'; ctx.fillRect(x-DEG/2, y-DEG/2, DEG, DEG);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `${s}px serif`; ctx.fillText(BUILDINGS[t].icon, x, y - s*0.9);
    const L = BUILDINGS[t].local; if (L && ok){ ctx.strokeStyle = 'rgba(44,79,115,0.8)'; ctx.lineWidth = 1/z+0.3; ctx.beginPath(); ctx.arc(x, y, L.r*DEG, 0, Math.PI*2); ctx.stroke(); }
    ctx.restore();
  },
  // efeitos contínuos nas frentes de guerra (inclusive entre outras nações)
  ambientWar(now){
    if (!this.fronts.length || now - this._lastAmb < 700) return;
    this._lastAmb = now;
    const f = this.fronts[Math.floor(Math.random()*this.fronts.length)];
    if (!f.cells.length) return;
    const c = f.cells[Math.floor(Math.random()*f.cells.length)]; const [x,y] = cellXY(c);
    // só anima o que está visível
    const [sx, sy] = this.toScreen(x, y); if (sx < -50 || sy < -50 || sx > this.cw+50 || sy > this.ch+50) return;
    const yr = curYear(), r = Math.random();
    const att = G.nations[f.a];
    const from = att && att.cap >= 0 ? cellXY(att.cap) : [x-60, y-30];
    if (yr >= 1915 && r < 0.3){ const d = Math.hypot(from[0]-x, from[1]-y) || 1; const o = [x - (x-from[0])/d*80, y - (y-from[1])/d*80]; this.addAnim({type:'plane', from:o, to:[x+rand(-4,4), y+rand(-4,4)], dur:2600, color:f.player?'#5a1a10':'#3d3326'}); }
    else if (yr >= 1945 && r < 0.42){ this.addAnim({type:'missile', from:[x+rand(-40,40), y+rand(-30,30)], to:[x,y], dur:1400}); }
    else { this.boom(x+rand(-3,3), y+rand(-3,3)); if (Math.random()<0.4) this.ring(x, y, '#8b1a1a', 14); }
  },
  drawAnims(ctx, z, now){
    this.anims = this.anims.filter(a => now - a.t0 < a.dur);
    for (const a of this.anims){
      const k = (now - a.t0)/a.dur;
      ctx.save();
      if (a.type === 'boom'){
        const e = 1-Math.pow(1-k,3);
        ctx.globalAlpha = 1-k;
        const rg = ctx.createRadialGradient(a.x,a.y,0,a.x,a.y,(a.big?60:18)*e+1);
        rg.addColorStop(0,'rgba(255,240,180,0.9)'); rg.addColorStop(0.4,'rgba(255,140,40,0.6)'); rg.addColorStop(1,'rgba(120,40,10,0)');
        ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(a.x,a.y,(a.big?60:18)*e+1,0,Math.PI*2); ctx.fill();
        for (const p of a.parts){ ctx.fillStyle = k>0.5 ? 'rgba(70,60,50,0.7)' : p.c; ctx.beginPath(); ctx.arc(a.x+p.vx*e, a.y+p.vy*e - k*k*8, p.r*(1-k*0.5), 0, Math.PI*2); ctx.fill(); }
      } else if (a.type === 'text'){
        ctx.globalAlpha = k < 0.8 ? 1 : (1-k)*5;
        ctx.font = `bold ${Math.max(5, 13/z)}px "Cinzel", Georgia, serif`; ctx.textAlign='center';
        ctx.lineWidth = 3/z; ctx.strokeStyle='rgba(255,245,215,0.9)'; ctx.fillStyle=a.color;
        ctx.strokeText(a.text, a.x, a.y - k*30/z*2); ctx.fillText(a.text, a.x, a.y - k*30/z*2);
      } else if (a.type === 'ring'){
        ctx.globalAlpha = 1-k; ctx.strokeStyle = a.color; ctx.lineWidth = 2.5/z+0.5; ctx.beginPath(); ctx.arc(a.x,a.y,a.r*k+2,0,Math.PI*2); ctx.stroke();
      } else if (a.type === 'arrow'){
        const [x1,y1]=a.from, [x2,y2]=a.to; const mx=(x1+x2)/2, my=(y1+y2)/2 - Math.hypot(x2-x1,y2-y1)*0.3;
        const e = Math.min(1, k*1.6);
        ctx.globalAlpha = k > 0.8 ? (1-k)*5 : 1;
        ctx.strokeStyle = a.color; ctx.lineWidth = 3.2/z+0.6; ctx.lineCap='round';
        ctx.setLineDash([6/z+2, 4/z+1]); ctx.lineDashOffset = -now/30;
        ctx.beginPath(); let px=x1, py=y1; ctx.moveTo(x1,y1);
        const N = 30; for (let i=1;i<=N*e;i++){ const t=i/N; px=(1-t)*(1-t)*x1+2*(1-t)*t*mx+t*t*x2; py=(1-t)*(1-t)*y1+2*(1-t)*t*my+t*t*y2; ctx.lineTo(px,py); }
        ctx.stroke(); ctx.setLineDash([]);
        const t2 = Math.max(0.01, e - 0.03), qx=(1-t2)*(1-t2)*x1+2*(1-t2)*t2*mx+t2*t2*x2, qy=(1-t2)*(1-t2)*y1+2*(1-t2)*t2*my+t2*t2*y2;
        const ang = Math.atan2(py-qy, px-qx), hs = 8/z+2;
        ctx.fillStyle = a.color; ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px-Math.cos(ang-0.5)*hs, py-Math.sin(ang-0.5)*hs); ctx.lineTo(px-Math.cos(ang+0.5)*hs, py-Math.sin(ang+0.5)*hs); ctx.fill();
      } else if (a.type === 'flash'){
        ctx.globalAlpha = (1-k)*(0.5+0.5*Math.sin(k*30));
        ctx.fillStyle = a.color; for (const c of a.cells){ const [x,y]=cellXY(c); ctx.fillRect(x-DEG/2,y-DEG/2,DEG,DEG); }
      } else if (a.type === 'found'){
        ctx.strokeStyle = a.color; ctx.lineWidth = 3/z+1; const len = 4000; ctx.setLineDash([len*k, len]); ctx.stroke(a.path);
        ctx.globalAlpha = 1-k; ctx.lineWidth = 12/z; ctx.strokeStyle = 'rgba(255,220,120,0.7)'; ctx.setLineDash([]); ctx.stroke(a.path);
      } else if (a.type === 'plane'){
        const [x1,y1]=a.from, [x2,y2]=a.to, t = k*1.3;
        const x = x1 + (x2-x1)*t, y = y1 + (y2-y1)*t - Math.sin(Math.min(1,t)*Math.PI)*12;
        const ang = Math.atan2(y2-y1, x2-x1), sc = Math.max(0.5, 1.4/Math.sqrt(z));
        if (!a.bombed && t >= 0.95){ a.bombed = true; for (let i=0;i<3;i++) setTimeout(()=>this.boom(x2+rand(-5,5), y2+rand(-5,5)), i*130); if (a.sound) SFX.explosion(); }
        ctx.globalAlpha = t > 1.15 ? Math.max(0, (1.3-t)/0.15) : 1;
        ctx.fillStyle = 'rgba(40,30,20,0.18)'; ctx.beginPath(); ctx.ellipse(x+6, y+10, 6*sc, 2*sc, ang, 0, Math.PI*2); ctx.fill();
        ctx.translate(x, y); ctx.rotate(ang); ctx.scale(sc, sc);
        ctx.fillStyle = a.color || '#3d3326'; ctx.strokeStyle = '#1e160c'; ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(8,0); ctx.lineTo(-7,-1.3); ctx.lineTo(-7,1.3); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(2,0); ctx.lineTo(-2,-8); ctx.lineTo(-4,-8); ctx.lineTo(-2,0); ctx.lineTo(-4,8); ctx.lineTo(-2,8); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-6,0); ctx.lineTo(-9,-3.5); ctx.lineTo(-9,3.5); ctx.closePath(); ctx.fill();
        if (t > 0.75 && t < 0.98){ ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(-2 - (t-0.75)*30, 3 + (t-0.75)*40, 1.2, 0, Math.PI*2); ctx.fill(); }
      } else if (a.type === 'missile'){
        const [x1,y1]=a.from, [x2,y2]=a.to, mx=(x1+x2)/2, my=(y1+y2)/2 - Math.hypot(x2-x1,y2-y1)*0.45;
        const P = t=>[(1-t)*(1-t)*x1+2*(1-t)*t*mx+t*t*x2, (1-t)*(1-t)*y1+2*(1-t)*t*my+t*t*y2];
        const e = Math.min(1, k*1.25);
        if (!a.hit && e >= 1){ a.hit = true; this.boom(x2, y2); if (a.sound) SFX.explosion(); }
        ctx.strokeStyle = 'rgba(120,110,100,0.5)'; ctx.lineWidth = 2/z + 0.5; ctx.beginPath();
        for (let i=0;i<=20;i++){ const t = Math.max(0, e - 0.35) + i/20*Math.min(0.35, e); const [px,py] = P(t); i ? ctx.lineTo(px,py) : ctx.moveTo(px,py); } ctx.stroke();
        if (e < 1){ const [px,py] = P(e); ctx.fillStyle = '#ffb43a'; ctx.beginPath(); ctx.arc(px, py, 2/z+1, 0, Math.PI*2); ctx.fill(); }
      } else if (a.type === 'nuke'){
        const e = 1-Math.pow(1-k,2);
        ctx.globalAlpha = 1-k;
        const rg = ctx.createRadialGradient(a.x,a.y,0,a.x,a.y,120*e+1); rg.addColorStop(0,'rgba(255,255,230,1)'); rg.addColorStop(0.3,'rgba(255,180,60,0.8)'); rg.addColorStop(1,'rgba(120,30,10,0)');
        ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(a.x,a.y,120*e+1,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='rgba(90,80,70,0.8)'; ctx.beginPath(); ctx.ellipse(a.x, a.y - 50*e, 26*e+1, 14*e+1, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillRect(a.x-5*e, a.y-50*e, 10*e, 50*e);
        ctx.strokeStyle='rgba(255,255,255,0.8)'; ctx.lineWidth=2/z; ctx.beginPath(); ctx.arc(a.x,a.y,200*e,0,Math.PI*2); ctx.stroke();
      }
      ctx.restore();
    }
  }
};

function placementPoly(shape, lon0, lat0, areaKm2, rot){
  // shape: pontos normalizados (centrados, área unitária em "unidades")
  const k = Math.sqrt(areaKm2 / (shape.area * 12308.6));
  const c = Math.cos(rot||0), s = Math.sin(rot||0);
  const cl = Math.max(0.15, Math.cos(lat0*Math.PI/180));
  return shape.pts.map(([u,v])=>{
    const ru = u*c - v*s, rv = u*s + v*c;
    return [lon0 + ru*k/cl, lat0 - rv*k];
  });
}

function hexToRgb(h){ h = h.replace('#',''); if (h.length===3) h = h.split('').map(c=>c+c).join(''); const n = parseInt(h,16); return [(n>>16)&255,(n>>8)&255,n&255]; }
function hexA(h, a){ const [r,g,b] = hexToRgb(h); return `rgba(${r},${g},${b},${a})`; }
function darken(h, f){ const [r,g,b] = hexToRgb(h); return `rgb(${Math.round(r*(1-f))},${Math.round(g*(1-f))},${Math.round(b*(1-f))})`; }
