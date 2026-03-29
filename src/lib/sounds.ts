// Rich Web Audio API sound effects — stereo spatial audio
const audioCtx = () => {
  if (!(window as any).__gameAudioCtx) {
    (window as any).__gameAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  const ctx = (window as any).__gameAudioCtx as AudioContext;
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
};

// Stereo master output with compressor for quality
const getStereoMaster = () => {
  if (!(window as any).__stereoMaster) {
    const ctx = audioCtx();
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-24, ctx.currentTime);
    compressor.knee.setValueAtTime(30, ctx.currentTime);
    compressor.ratio.setValueAtTime(4, ctx.currentTime);
    compressor.attack.setValueAtTime(0.003, ctx.currentTime);
    compressor.release.setValueAtTime(0.25, ctx.currentTime);
    compressor.connect(ctx.destination);
    (window as any).__stereoMaster = compressor;
  }
  return (window as any).__stereoMaster as DynamicsCompressorNode;
};

// Global sound volume multiplier (0-1)
let _soundVolumeMultiplier = 0.7;
export function setSoundVolumeMultiplier(v: number) { _soundVolumeMultiplier = Math.max(0, Math.min(1, v)); }
export function getSoundVolumeMultiplier() { return _soundVolumeMultiplier; }

function playTone(frequency: number, duration: number, type: OscillatorType = "sine", volume = 0.3, delay = 0, pan = 0) {
  volume = Math.min(volume * 1.5, 1);
  const ctx = audioCtx();
  const effectiveVolume = volume * _soundVolumeMultiplier;
  const startTime = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const panner = ctx.createStereoPanner();
  panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), startTime);
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(effectiveVolume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gain);
  gain.connect(panner);
  panner.connect(getStereoMaster());
  osc.start(startTime);
  osc.stop(startTime + duration);
}

function playNoise(duration: number, volume: number = 0.05, delay: number = 0, pan = 0) {
  const ctx = audioCtx();
  const effectiveVolume = volume * _soundVolumeMultiplier;
  const startTime = ctx.currentTime + delay;
  const bufferSize = ctx.sampleRate * duration;
  // Stereo noise buffer
  const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
  const dataL = buffer.getChannelData(0);
  const dataR = buffer.getChannelData(1);
  for (let i = 0; i < bufferSize; i++) {
    dataL[i] = (Math.random() * 2 - 1) * effectiveVolume;
    dataR[i] = (Math.random() * 2 - 1) * effectiveVolume;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(effectiveVolume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  const panner = ctx.createStereoPanner();
  panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), startTime);
  
  // High-pass filter for a "swoosh" sound
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.setValueAtTime(2000, startTime);
  
  source.connect(filter);
  filter.connect(gain);
  gain.connect(panner);
  panner.connect(getStereoMaster());
  source.start(startTime);
  source.stop(startTime + duration);
}

// Track flip count for variety
let flipCounter = 0;

export function playFlipSound() {
  flipCounter++;
  const variant = flipCounter % 5;
  // Alternate pan for spatial variety
  const pan = (flipCounter % 2 === 0) ? -0.3 : 0.3;
  
  switch (variant) {
    case 0:
      playTone(600, 0.1, "sine", 0.18, 0, pan);
      playNoise(0.06, 0.03, 0, -pan);
      break;
    case 1:
      playTone(880, 0.08, "sine", 0.15, 0, pan);
      playTone(1100, 0.06, "sine", 0.1, 0.04, -pan);
      break;
    case 2:
      playTone(500, 0.05, "square", 0.08, 0, pan);
      playNoise(0.08, 0.04, 0, 0);
      playTone(700, 0.08, "sine", 0.12, 0.03, -pan);
      break;
    case 3:
      playTone(1200, 0.12, "sine", 0.12, 0, -0.2);
      playTone(900, 0.08, "sine", 0.08, 0.02, 0.2);
      break;
    case 4:
      playTone(400, 0.04, "sine", 0.2, 0, pan);
      playTone(800, 0.08, "sine", 0.15, 0.03, -pan);
      break;
  }
}

let matchCounter = 0;

export function playMatchSound() {
  matchCounter++;
  const variant = matchCounter % 4;
  
  switch (variant) {
    case 0:
      // Happy ascending chime — sweeps left to right
      playTone(523, 0.15, "sine", 0.22, 0, -0.6);
      playTone(659, 0.15, "sine", 0.22, 0.1, -0.2);
      playTone(784, 0.2, "sine", 0.25, 0.2, 0.2);
      playTone(1047, 0.3, "sine", 0.18, 0.3, 0.6);
      break;
    case 1:
      // Sparkle bells — ping-pong stereo
      playTone(880, 0.2, "sine", 0.2, 0, -0.5);
      playTone(1100, 0.15, "sine", 0.18, 0.08, 0.5);
      playTone(1320, 0.2, "sine", 0.2, 0.15, -0.3);
      playTone(880, 0.1, "sine", 0.1, 0.25, 0.3);
      playTone(1320, 0.25, "sine", 0.15, 0.3, 0);
      break;
    case 2:
      // Xylophone hit — center to wide
      playTone(698, 0.12, "triangle", 0.2, 0, 0);
      playTone(880, 0.12, "triangle", 0.2, 0.08, -0.4);
      playTone(1047, 0.2, "triangle", 0.25, 0.16, 0.4);
      break;
    case 3:
      // Magic wand — sweeps right to left
      playTone(600, 0.1, "sine", 0.15, 0, 0.6);
      playTone(800, 0.1, "sine", 0.18, 0.06, 0.3);
      playTone(1000, 0.1, "sine", 0.2, 0.12, 0);
      playTone(1200, 0.15, "sine", 0.22, 0.18, -0.3);
      playTone(1400, 0.2, "sine", 0.15, 0.24, -0.6);
      break;
  }
}

export function playMismatchSound() {
  const variant = Math.random() > 0.5 ? 0 : 1;
  if (variant === 0) {
    playTone(350, 0.15, "triangle", 0.12, 0, -0.2);
    playTone(280, 0.2, "triangle", 0.1, 0.1, 0.2);
  } else {
    playTone(300, 0.1, "sine", 0.1, 0, -0.3);
    playTone(280, 0.1, "sine", 0.1, 0.08, 0.3);
    playTone(300, 0.15, "sine", 0.08, 0.16, 0);
  }
}

export function playWinSound() {
  // Epic celebratory fanfare
  const melody = [
    { f: 523, d: 0.15, t: 0 },
    { f: 587, d: 0.15, t: 0.12 },
    { f: 659, d: 0.15, t: 0.24 },
    { f: 784, d: 0.2, t: 0.36 },
    { f: 880, d: 0.15, t: 0.5 },
    { f: 784, d: 0.15, t: 0.62 },
    { f: 880, d: 0.15, t: 0.74 },
    { f: 1047, d: 0.4, t: 0.86 },
  ];
  melody.forEach(({ f, d, t }, i) => {
    // Sweep melody across stereo field
    const pan = -0.6 + (i / melody.length) * 1.2;
    playTone(f, d, "sine", 0.2, t, pan);
  });
  // Harmony layer — wide stereo
  setTimeout(() => {
    playTone(523, 0.5, "triangle", 0.08, 0, -0.7);
    playTone(659, 0.5, "triangle", 0.08, 0.05, 0);
    playTone(784, 0.5, "triangle", 0.08, 0.1, 0.7);
  }, 860);
  // Shimmer effect — alternating pan
  for (let i = 0; i < 6; i++) {
    playTone(1200 + i * 200, 0.08, "sine", 0.05, 1.0 + i * 0.06, i % 2 === 0 ? -0.5 : 0.5);
  }
}

export function playStarSound() {
  // Quick sparkle — stereo spread
  playTone(1200, 0.08, "sine", 0.12, 0, -0.4);
  playTone(1500, 0.1, "sine", 0.15, 0.06, 0);
  playTone(1800, 0.12, "sine", 0.1, 0.12, 0.4);
}

// ── Fire Station (Fireman Sam) sound effects ──

export function playFireCrackle() {
  const ctx = audioCtx();
  const now = ctx.currentTime;
  const eff = _soundVolumeMultiplier;

  // Brown-noise burst — fire texture
  const bufSize = Math.floor(ctx.sampleRate * 0.13);
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < bufSize; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + 0.02 * w) / 1.02;
    data[i] = last * 8;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const bpf = ctx.createBiquadFilter();
  bpf.type = "bandpass";
  bpf.frequency.setValueAtTime(700, now);
  bpf.frequency.exponentialRampToValueAtTime(200, now + 0.12);
  bpf.Q.setValueAtTime(0.8, now);
  const gainN = ctx.createGain();
  gainN.gain.setValueAtTime(0.4 * eff, now);
  gainN.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
  const master = getStereoMaster();
  src.connect(bpf); bpf.connect(gainN); gainN.connect(master);
  src.start(now); src.stop(now + 0.15);

  // Crackle pops — spread across stereo field
  [0, 0.03, 0.08].forEach((delay, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const p = ctx.createStereoPanner();
    p.pan.setValueAtTime([-0.6, 0.3, -0.3][i], now + delay);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(80 + Math.random() * 140, now + delay);
    g.gain.setValueAtTime(0.15 * eff, now + delay);
    g.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.022);
    osc.connect(g); g.connect(p); p.connect(master);
    osc.start(now + delay); osc.stop(now + delay + 0.025);
  });
}

export function playSirenMatch() {
  const ctx = audioCtx();
  const now = ctx.currentTime;
  const eff = 0.22 * _soundVolumeMultiplier;
  const master = getStereoMaster();

  // Two quick wee-woo sweeps — left then right
  [0, 0.3].forEach((offset, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const p = ctx.createStereoPanner();
    p.pan.setValueAtTime(i === 0 ? -0.5 : 0.5, now + offset);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(350, now + offset);
    osc.frequency.exponentialRampToValueAtTime(780, now + offset + 0.22);
    g.gain.setValueAtTime(eff, now + offset);
    g.gain.setValueAtTime(eff, now + offset + 0.19);
    g.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.28);
    osc.connect(g); g.connect(p); p.connect(master);
    osc.start(now + offset); osc.stop(now + offset + 0.3);
  });
  // Upper harmony — center
  const h = ctx.createOscillator();
  const gh = ctx.createGain();
  h.type = "square";
  h.frequency.setValueAtTime(530, now);
  h.frequency.exponentialRampToValueAtTime(1100, now + 0.55);
  gh.gain.setValueAtTime(eff * 0.35, now);
  gh.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
  h.connect(gh); gh.connect(master);
  h.start(now); h.stop(now + 0.6);
}
