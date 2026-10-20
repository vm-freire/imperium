// ============================================================
//  IMPERIUM — Sons sintetizados (Web Audio API)
// ============================================================
'use strict';

const SFX = {
  ctx: null, master: null, sfxGain: null, musicGain: null,
  sfxOn: true, musicOn: true, volume: 0.7, musicTimer: null, musicStep: 0,

  init(){
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain(); this.master.gain.value = this.volume; this.master.connect(this.ctx.destination);
      this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = this.sfxOn ? 1 : 0; this.sfxGain.connect(this.master);
      this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = this.musicOn ? 0.22 : 0; this.musicGain.connect(this.master);
      // reverb simples (delay com feedback) para ambiência
      this.delay = this.ctx.createDelay(); this.delay.delayTime.value = 0.28;
      this.fb = this.ctx.createGain(); this.fb.gain.value = 0.28;
      this.wet = this.ctx.createGain(); this.wet.gain.value = 0.35;
      this.delay.connect(this.fb); this.fb.connect(this.delay); this.delay.connect(this.wet); this.wet.connect(this.master);
    } catch(e){ this.ctx = null; }
  },
  setVolume(v){ this.volume = v; if (this.master) this.master.gain.value = v; },
  setSfx(on){ this.sfxOn = on; if (this.sfxGain) this.sfxGain.gain.value = on ? 1 : 0; },
  setMusic(on){ this.musicOn = on; if (this.musicGain) this.musicGain.gain.value = on ? 0.22 : 0; if (on) this.startMusic(); },

  tone(freq, dur, type, vol, slide, delay, dest, attack){
    if (!this.ctx || (!this.sfxOn && !dest)) return;
    const t = this.ctx.currentTime + (delay||0);
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
    const a = attack || 0.01;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol||0.2, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.sfxGain);
    if (!dest && this.delay) { const s = this.ctx.createGain(); s.gain.value = 0.25; g.connect(s); s.connect(this.delay); }
    o.start(t); o.stop(t + dur + 0.05);
  },
  noise(dur, vol, freq, delay, q, type){
    if (!this.ctx || !this.sfxOn) return;
    const t = this.ctx.currentTime + (delay||0);
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = buf.getChannelData(0);
    for (let i=0;i<len;i++) d[i] = (Math.random()*2-1) * Math.pow(1 - i/len, 2);
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const f = this.ctx.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.value = freq || 1000; f.Q.value = q || 1;
    const g = this.ctx.createGain(); g.gain.value = vol || 0.3;
    src.connect(f); f.connect(g); g.connect(this.sfxGain); src.start(t);
  },

  click(){ this.tone(880, 0.05, 'square', 0.05); this.tone(1320, 0.04, 'sine', 0.04, null, 0.02); },
  hover(){ this.tone(1500, 0.025, 'sine', 0.015); },
  page(){ this.noise(0.18, 0.12, 3000, 0, 0.7, 'bandpass'); },
  coin(){ this.tone(988, 0.09, 'square', 0.07); this.tone(1319, 0.25, 'square', 0.07, null, 0.08); },
  error(){ this.tone(180, 0.18, 'sawtooth', 0.12); this.tone(140, 0.25, 'sawtooth', 0.12, null, 0.12); },
  bell(){ [523, 1046, 1568].forEach((f,i)=>this.tone(f, 1.2 - i*0.3, 'sine', 0.08/(i+1))); },
  research(){ [523,659,784,1046].forEach((f,i)=>this.tone(f, 0.35, 'triangle', 0.09, null, i*0.08)); },
  build(){ this.noise(0.08, 0.25, 600, 0, 2); this.noise(0.08, 0.25, 500, 0.12, 2); this.tone(220,0.1,'square',0.05,null,0.05); },
  drum(delay){ this.tone(110, 0.3, 'sine', 0.35, 45, delay); this.noise(0.12, 0.15, 400, delay); },
  march(){ for (let i=0;i<4;i++) this.drum(i*0.22); this.tone(196,0.6,'sawtooth',0.06,null,0.9,null,0.05); },
  cannon(delay){ this.tone(90, 0.5, 'sine', 0.5, 30, delay); this.noise(0.6, 0.5, 700, delay); },
  explosion(delay){ this.noise(1.2, 0.6, 400, delay); this.tone(60, 0.9, 'sine', 0.5, 25, delay); },
  nuke(){ this.noise(3.5, 0.8, 200); this.tone(40, 3.5, 'sine', 0.7, 18); this.tone(80, 2.5, 'sawtooth', 0.15, 20); },
  horn(){ this.tone(147, 1.2, 'sawtooth', 0.12, null, 0, null, 0.15); this.tone(220, 1.0, 'sawtooth', 0.08, null, 0.15, null, 0.15); },
  alarm(){ for (let i=0;i<3;i++){ this.tone(660, 0.18, 'square', 0.08, null, i*0.4); this.tone(440, 0.18, 'square', 0.08, null, i*0.4+0.2); } },
  fanfare(){
    const n = [392,523,659,784,659,784,1046];
    const d = [0,0.15,0.3,0.45,0.7,0.85,1.0];
    n.forEach((f,i)=>{ this.tone(f, i===n.length-1?1.0:0.25, 'sawtooth', 0.07, null, d[i], null, 0.02); this.tone(f/2, 0.25, 'triangle', 0.06, null, d[i]); });
    this.drum(0); this.drum(0.45); this.drum(1.0);
  },
  victory(){ this.fanfare(); [523,659,784,1046].forEach((f)=>this.tone(f, 2.2, 'triangle', 0.06, null, 1.4, null, 0.1)); },
  defeat(){ [392, 370, 311, 262, 196].forEach((f,i)=>this.tone(f, 0.9, 'triangle', 0.1, null, i*0.45, null, 0.05)); this.tone(98, 3, 'sine', 0.15, null, 1.8, null, 0.3); },
  turn(){ this.tone(659, 0.3, 'sine', 0.05); this.tone(988, 0.5, 'sine', 0.035, null, 0.07); this.noise(0.1, 0.05, 4000, 0, 0.5, 'highpass'); },
  event(){ this.tone(330, 0.5, 'triangle', 0.08); this.tone(440, 0.6, 'triangle', 0.07, null, 0.12); this.tone(554, 0.8, 'triangle', 0.06, null, 0.24); },
  warDeclared(){ this.horn(); this.march(); },

  // ---------------- música procedural (modo dórico) ----------------
  startMusic(){
    if (!this.ctx || this.musicTimer) return;
    const scale = [146.83, 164.81, 174.61, 196.0, 220.0, 246.94, 261.63, 293.66, 329.63, 349.23, 392.0];
    const chords = [[0,2,4],[3,5,7],[4,6,8],[2,4,6]];
    let mel = 7, beat = 0;
    const tick = () => {
      if (!this.musicOn || !this.ctx) return;
      const chord = chords[Math.floor(beat/8) % chords.length];
      if (beat % 8 === 0){
        chord.forEach((n,i)=> this.tone(scale[n]/2, 3.6, 'sine', 0.05, null, i*0.02, this.musicGain, 0.4));
        this.tone(scale[chord[0]]/4, 3.8, 'triangle', 0.06, null, 0, this.musicGain, 0.6);
      }
      if (Math.random() < 0.7){
        mel += Math.floor(Math.random()*5) - 2; mel = Math.max(2, Math.min(scale.length-1, mel));
        if (Math.random()<0.3) mel = chord[Math.floor(Math.random()*3)] + 3;
        mel = Math.max(0, Math.min(scale.length-1, mel));
        this.tone(scale[mel]*2, 0.55, 'triangle', 0.045, null, 0, this.musicGain, 0.02);
        if (Math.random()<0.25) this.tone(scale[mel]*3, 0.4, 'sine', 0.015, null, 0.02, this.musicGain);
      }
      beat++;
    };
    this.musicTimer = setInterval(tick, 460);
  },
  stopMusic(){ clearInterval(this.musicTimer); this.musicTimer = null; }
};
