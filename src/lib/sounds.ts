// Rich Web Audio API sound effects — no external files needed
const audioCtx = () => {
  if (!(window as any).__gameAudioCtx) {
    (window as any).__gameAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  const ctx = (window as any).__gameAudioCtx as AudioContext;
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
};

function playTone(frequency: number, duration: number, type: OscillatorType = "sine", volume = 0.5, delay = 0) {
  const ctx = audioCtx();
  const startTime = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

function playNoise(duration: number, volume: number = 0.05, delay: number = 0) {
  const ctx = audioCtx();
  const startTime = ctx.currentTime + delay;
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * volume;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  
  // High-pass filter for a "swoosh" sound
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.setValueAtTime(2000, startTime);
  
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(startTime);
  source.stop(startTime + duration);
}

// Track flip count for variety
let flipCounter = 0;

export function playFlipSound() {
  flipCounter++;
  const variant = flipCounter % 5;
  const ctx = audioCtx();
  console.log("[SFX] playFlipSound called, ctx.state:", ctx.state, "variant:", variant);
  switch (variant) {
    case 0:
      // Classic soft pop
      playTone(600, 0.1, "sine", 0.18);
      playNoise(0.06, 0.03);
      break;
    case 1:
      // Higher sparkle flip
      playTone(880, 0.08, "sine", 0.15);
      playTone(1100, 0.06, "sine", 0.1, 0.04);
      break;
    case 2:
      // Soft click with swoosh
      playTone(500, 0.05, "square", 0.08);
      playNoise(0.08, 0.04);
      playTone(700, 0.08, "sine", 0.12, 0.03);
      break;
    case 3:
      // Gentle chime
      playTone(1200, 0.12, "sine", 0.12);
      playTone(900, 0.08, "sine", 0.08, 0.02);
      break;
    case 4:
      // Bubble pop
      playTone(400, 0.04, "sine", 0.2);
      playTone(800, 0.08, "sine", 0.15, 0.03);
      break;
  }
}

let matchCounter = 0;

export function playMatchSound() {
  matchCounter++;
  const variant = matchCounter % 4;
  
  switch (variant) {
    case 0:
      // Happy ascending chime
      playTone(523, 0.15, "sine", 0.22);
      playTone(659, 0.15, "sine", 0.22, 0.1);
      playTone(784, 0.2, "sine", 0.25, 0.2);
      playTone(1047, 0.3, "sine", 0.18, 0.3);
      break;
    case 1:
      // Sparkle bells
      playTone(880, 0.2, "sine", 0.2);
      playTone(1100, 0.15, "sine", 0.18, 0.08);
      playTone(1320, 0.2, "sine", 0.2, 0.15);
      playTone(880, 0.1, "sine", 0.1, 0.25);
      playTone(1320, 0.25, "sine", 0.15, 0.3);
      break;
    case 2:
      // Xylophone hit
      playTone(698, 0.12, "triangle", 0.2);
      playTone(880, 0.12, "triangle", 0.2, 0.08);
      playTone(1047, 0.2, "triangle", 0.25, 0.16);
      break;
    case 3:
      // Magic wand
      playTone(600, 0.1, "sine", 0.15);
      playTone(800, 0.1, "sine", 0.18, 0.06);
      playTone(1000, 0.1, "sine", 0.2, 0.12);
      playTone(1200, 0.15, "sine", 0.22, 0.18);
      playTone(1400, 0.2, "sine", 0.15, 0.24);
      break;
  }
}

export function playMismatchSound() {
  const variant = Math.random() > 0.5 ? 0 : 1;
  if (variant === 0) {
    // Gentle descending
    playTone(350, 0.15, "triangle", 0.12);
    playTone(280, 0.2, "triangle", 0.1, 0.1);
  } else {
    // Soft wobble
    playTone(300, 0.1, "sine", 0.1);
    playTone(280, 0.1, "sine", 0.1, 0.08);
    playTone(300, 0.15, "sine", 0.08, 0.16);
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
  melody.forEach(({ f, d, t }) => {
    playTone(f, d, "sine", 0.2, t);
  });
  // Harmony layer
  setTimeout(() => {
    playTone(523, 0.5, "triangle", 0.08);
    playTone(659, 0.5, "triangle", 0.08, 0.05);
    playTone(784, 0.5, "triangle", 0.08, 0.1);
  }, 860);
  // Shimmer effect
  for (let i = 0; i < 6; i++) {
    playTone(1200 + i * 200, 0.08, "sine", 0.05, 1.0 + i * 0.06);
  }
}

export function playStarSound() {
  // Quick sparkle for earning a star
  playTone(1200, 0.08, "sine", 0.12);
  playTone(1500, 0.1, "sine", 0.15, 0.06);
  playTone(1800, 0.12, "sine", 0.1, 0.12);
}
