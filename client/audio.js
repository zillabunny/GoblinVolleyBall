// audio.js — synthesized sound effects using Web Audio API
// All sounds are generated procedurally — no audio files needed.

let ctx = null;

function ensureCtx() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function noise(duration) {
  const ac = ensureCtx();
  const len = ac.sampleRate * duration;
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function play(setup) {
  try {
    const ac = ensureCtx();
    setup(ac, ac.currentTime);
  } catch { /* ignore audio errors */ }
}

// ─── Sound Effects ───────────────────────────────────────────────────────────

export function sfxJump() {
  play((ac, t) => {
    // Goblin grunt: low rumble + noise burst
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.12);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.12);

    // Breathy noise layer
    const src = ac.createBufferSource();
    src.buffer = noise(0.08);
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 800;
    bp.Q.value = 2;
    const ng = ac.createGain();
    ng.gain.setValueAtTime(0.15, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    src.connect(bp).connect(ng).connect(ac.destination);
    src.start(t);
  });
}

export function sfxHit() {
  play((ac, t) => {
    // Punchy thwack: noise burst + tone
    const src = ac.createBufferSource();
    src.buffer = noise(0.06);
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1800;
    bp.Q.value = 1.5;
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    src.connect(bp).connect(gain).connect(ac.destination);
    src.start(t);

    // Impact tone
    const osc = ac.createOscillator();
    const og = ac.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.08);
    og.gain.setValueAtTime(0.3, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(og).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.08);
  });
}

export function sfxBounce() {
  play((ac, t) => {
    // Quick boing: sine sweep down
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.1);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.1);
  });
}

export function sfxNetHit() {
  play((ac, t) => {
    // Metallic twang
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.15);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  });
}

export function sfxScore() {
  play((ac, t) => {
    // Two-note chime: ding-ding!
    [0, 0.12].forEach((offset, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.value = i === 0 ? 660 : 880;
      gain.gain.setValueAtTime(0.3, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.25);
      osc.connect(gain).connect(ac.destination);
      osc.start(t + offset);
      osc.stop(t + offset + 0.25);
    });
  });
}

export function sfxGameOver() {
  play((ac, t) => {
    // Triumphant ascending arpeggio
    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'triangle';
      const start = t + i * 0.1;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.25, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
      osc.connect(gain).connect(ac.destination);
      osc.start(start);
      osc.stop(start + 0.3);
    });
  });
}

export function sfxServe() {
  play((ac, t) => {
    // Quick upward whistle
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.1);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  });
}
