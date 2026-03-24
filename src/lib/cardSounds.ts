// Card-specific sound effects synthesized via Web Audio API
// Enhanced with noise, filters, and modulation for realistic sounds

const audioCtx = () => {
  if (!(window as any).__gameAudioCtx) {
    (window as any).__gameAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  const ctx = (window as any).__gameAudioCtx as AudioContext;
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
};

// Master gain for all card sounds - boost volume
const getMasterGain = () => {
  const ctx = audioCtx();
  if (!(window as any).__cardMasterGain) {
    const master = ctx.createGain();
    master.gain.value = 2.5;
    master.connect(ctx.destination);
    (window as any).__cardMasterGain = master;
  }
  return (window as any).__cardMasterGain as GainNode;
};

// Create white noise buffer for animal/vehicle sounds
function createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

type SoundFn = (ctx: AudioContext, time: number) => void;

// Volume multiplier for all card sounds
const VOL = 2.5;

function makeOsc(ctx: AudioContext, freq: number, type: OscillatorType, start: number, dur: number, vol: number, dest: AudioNode) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(Math.min(vol * VOL, 1), start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(start);
  osc.stop(start + dur);
}

// ── Animal sounds ──

const animalSounds: Record<string, SoundFn> = {
  // Cat - meow with frequency sweep
  cat: (ctx, t) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(700, t);
    osc.frequency.linearRampToValueAtTime(500, t + 0.15);
    osc.frequency.linearRampToValueAtTime(800, t + 0.3);
    osc.frequency.linearRampToValueAtTime(400, t + 0.5);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.15, t + 0.05);
    gain.gain.setValueAtTime(0.15, t + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.5);
  },

  // Lion - deep roar
  lion: (ctx, t) => {
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth"; osc2.type = "sawtooth";
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.linearRampToValueAtTime(150, t + 0.2);
    osc.frequency.linearRampToValueAtTime(80, t + 0.6);
    osc2.frequency.setValueAtTime(103, t);
    osc2.frequency.linearRampToValueAtTime(153, t + 0.2);
    osc2.frequency.linearRampToValueAtTime(83, t + 0.6);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc.connect(gain); osc2.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.6); osc2.start(t); osc2.stop(t + 0.6);
  },

  // Dog/Wolf - howl
  wolf: (ctx, t) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(250, t);
    osc.frequency.linearRampToValueAtTime(400, t + 0.3);
    osc.frequency.setValueAtTime(400, t + 0.5);
    osc.frequency.linearRampToValueAtTime(350, t + 0.8);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.15, t + 0.1);
    gain.gain.setValueAtTime(0.12, t + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.8);
  },

  // Bunny - soft quick hops
  bunny: (ctx, t) => {
    [0, 0.12, 0.24].forEach((d, i) => {
      makeOsc(ctx, 800 + i * 100, "sine", t + d, 0.08, 0.12, ctx.destination);
    });
  },

  // Butterfly - gentle flutter
  butterfly: (ctx, t) => {
    for (let i = 0; i < 6; i++) {
      makeOsc(ctx, 1200 + Math.sin(i) * 400, "sine", t + i * 0.06, 0.05, 0.06, ctx.destination);
    }
  },

  // Unicorn - magical ascending arpeggio
  unicorn: (ctx, t) => {
    [523, 659, 784, 1047].forEach((f, i) => {
      makeOsc(ctx, f, "sine", t + i * 0.12, 0.15, 0.12, ctx.destination);
    });
  },

  // Dolphin - chirps
  dolphin: (ctx, t) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.linearRampToValueAtTime(600, t + 0.08);
    osc.frequency.linearRampToValueAtTime(1500, t + 0.16);
    osc.frequency.linearRampToValueAtTime(800, t + 0.25);
    osc.frequency.linearRampToValueAtTime(1800, t + 0.35);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.4);
  },

  // Bird / Parrot - chirpy whistle
  parrot: (ctx, t) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1800, t);
    osc.frequency.linearRampToValueAtTime(2200, t + 0.05);
    osc.frequency.linearRampToValueAtTime(1600, t + 0.12);
    osc.frequency.linearRampToValueAtTime(2400, t + 0.2);
    osc.frequency.linearRampToValueAtTime(1800, t + 0.3);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.35);
  },

  // Owl - hoo hoo
  owl: (ctx, t) => {
    makeOsc(ctx, 380, "sine", t, 0.25, 0.15, ctx.destination);
    makeOsc(ctx, 300, "sine", t + 0.35, 0.35, 0.15, ctx.destination);
  },

  // Bear - growl with noise
  bear: (ctx, t) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.linearRampToValueAtTime(90, t + 0.5);
    filter.type = "lowpass"; filter.frequency.setValueAtTime(300, t);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.5);
  },

  // Dinosaur - deep rumble
  dinosaur: (ctx, t) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(60, t);
    osc.frequency.linearRampToValueAtTime(100, t + 0.2);
    osc.frequency.linearRampToValueAtTime(50, t + 0.7);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.7);
  },

  // Shark - underwater swoosh
  shark: (ctx, t) => {
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 0.4);
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    filter.type = "bandpass"; filter.frequency.setValueAtTime(400, t);
    filter.frequency.linearRampToValueAtTime(200, t + 0.4);
    filter.Q.setValueAtTime(5, t);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    noise.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    noise.start(t); noise.stop(t + 0.4);
  },

  // Dragon - roar + fire crackle
  dragon: (ctx, t) => {
    // Deep roar
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.linearRampToValueAtTime(200, t + 0.2);
    osc.frequency.linearRampToValueAtTime(60, t + 0.5);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.5);
    // Fire crackle noise
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 0.4);
    const filter = ctx.createBiquadFilter();
    const ng = ctx.createGain();
    filter.type = "highpass"; filter.frequency.setValueAtTime(2000, t + 0.1);
    ng.gain.setValueAtTime(0.08, t + 0.15);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    noise.connect(filter); filter.connect(ng); ng.connect(ctx.destination);
    noise.start(t + 0.15); noise.stop(t + 0.5);
  },

  // Eagle - screech
  eagle: (ctx, t) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(1500, t);
    osc.frequency.linearRampToValueAtTime(2000, t + 0.1);
    osc.frequency.linearRampToValueAtTime(1200, t + 0.3);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.35);
  },

  // Flamingo - nasal honk
  flamingo: (ctx, t) => {
    makeOsc(ctx, 500, "square", t, 0.15, 0.1, ctx.destination);
    makeOsc(ctx, 450, "square", t + 0.18, 0.12, 0.08, ctx.destination);
  },

  panda: (ctx, t) => {
    makeOsc(ctx, 350, "sine", t, 0.2, 0.12, ctx.destination);
    makeOsc(ctx, 400, "sine", t + 0.15, 0.15, 0.1, ctx.destination);
  },

  koala: (ctx, t) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.linearRampToValueAtTime(250, t + 0.15);
    osc.frequency.linearRampToValueAtTime(150, t + 0.4);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.4);
  },

  penguin: (ctx, t) => {
    [600, 700, 650].forEach((f, i) => {
      makeOsc(ctx, f, "square", t + i * 0.1, 0.08, 0.1, ctx.destination);
    });
  },

  deer: (ctx, t) => {
    makeOsc(ctx, 500, "sine", t, 0.12, 0.12, ctx.destination);
    makeOsc(ctx, 600, "sine", t + 0.15, 0.1, 0.1, ctx.destination);
  },

  swan: (ctx, t) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.linearRampToValueAtTime(600, t + 0.3);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.3);
  },

  hedgehog: (ctx, t) => {
    for (let i = 0; i < 4; i++) {
      makeOsc(ctx, 900 + i * 50, "sine", t + i * 0.06, 0.04, 0.1, ctx.destination);
    }
  },

  ladybug: (ctx, t) => {
    for (let i = 0; i < 3; i++) {
      makeOsc(ctx, 1100 + i * 80, "sine", t + i * 0.07, 0.05, 0.08, ctx.destination);
    }
  },

  snail: (ctx, t) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(250, t);
    osc.frequency.linearRampToValueAtTime(180, t + 0.5);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.5);
  },

  octopus: (ctx, t) => {
    [400, 350, 300, 250].forEach((f, i) => {
      makeOsc(ctx, f, "sine", t + i * 0.1, 0.1, 0.1, ctx.destination);
    });
  },

  gorilla: (ctx, t) => {
    [0, 0.15, 0.3].forEach((d) => {
      makeOsc(ctx, 120, "square", t + d, 0.1, 0.15, ctx.destination);
    });
  },

  crocodile: (ctx, t) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.linearRampToValueAtTime(100, t + 0.3);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.35);
  },

  whale: (ctx, t) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.linearRampToValueAtTime(150, t + 0.4);
    osc.frequency.linearRampToValueAtTime(220, t + 0.8);
    osc.frequency.linearRampToValueAtTime(140, t + 1.2);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 1.2);
  },

  scorpion: (ctx, t) => {
    for (let i = 0; i < 4; i++) {
      makeOsc(ctx, 800 + i * 150, "square", t + i * 0.05, 0.04, 0.08, ctx.destination);
    }
  },

  bat: (ctx, t) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(3000, t);
    osc.frequency.linearRampToValueAtTime(1500, t + 0.05);
    osc.frequency.linearRampToValueAtTime(3500, t + 0.1);
    osc.frequency.linearRampToValueAtTime(2000, t + 0.15);
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.2);
  },

  rhino: (ctx, t) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.linearRampToValueAtTime(130, t + 0.15);
    osc.frequency.linearRampToValueAtTime(70, t + 0.5);
    filter.type = "lowpass"; filter.frequency.setValueAtTime(400, t);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.5);
  },

  trex: (ctx, t) => {
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth"; osc2.type = "square";
    osc.frequency.setValueAtTime(50, t);
    osc.frequency.linearRampToValueAtTime(120, t + 0.2);
    osc.frequency.linearRampToValueAtTime(40, t + 0.7);
    osc2.frequency.setValueAtTime(53, t);
    osc2.frequency.linearRampToValueAtTime(123, t + 0.2);
    osc2.frequency.linearRampToValueAtTime(43, t + 0.7);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    osc.connect(gain); osc2.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.7); osc2.start(t); osc2.stop(t + 0.7);
  },

  snake: (ctx, t) => {
    // Hiss - filtered noise
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 0.5);
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    filter.type = "highpass"; filter.frequency.setValueAtTime(4000, t);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    noise.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    noise.start(t); noise.stop(t + 0.5);
  },

  // Horse - neigh
  horse: (ctx, t) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.linearRampToValueAtTime(600, t + 0.15);
    osc.frequency.linearRampToValueAtTime(500, t + 0.3);
    osc.frequency.linearRampToValueAtTime(350, t + 0.5);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.15, t + 0.05);
    gain.gain.setValueAtTime(0.12, t + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.55);
  },

  // Elephant - trumpet
  elephant: (ctx, t) => {
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth"; osc2.type = "square";
    osc.frequency.setValueAtTime(250, t);
    osc.frequency.linearRampToValueAtTime(500, t + 0.15);
    osc.frequency.linearRampToValueAtTime(400, t + 0.5);
    osc2.frequency.setValueAtTime(253, t);
    osc2.frequency.linearRampToValueAtTime(503, t + 0.15);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    osc.connect(gain); osc2.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.55); osc2.start(t); osc2.stop(t + 0.55);
  },

  // Monkey - ooh ooh aah
  monkey: (ctx, t) => {
    [0, 0.12, 0.24].forEach((d, i) => {
      const freq = i < 2 ? 600 : 800;
      makeOsc(ctx, freq, "sawtooth", t + d, 0.1, 0.12, ctx.destination);
    });
  },

  // Cow - moo
  cow: (ctx, t) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.linearRampToValueAtTime(180, t + 0.2);
    osc.frequency.linearRampToValueAtTime(140, t + 0.6);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.65);
  },

  // Sheep - baa
  sheep: (ctx, t) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(350, t);
    osc.frequency.linearRampToValueAtTime(300, t + 0.15);
    osc.frequency.linearRampToValueAtTime(380, t + 0.3);
    osc.frequency.linearRampToValueAtTime(280, t + 0.45);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.5);
  },

  // Goat - meh
  goat: (ctx, t) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.linearRampToValueAtTime(350, t + 0.1);
    osc.frequency.linearRampToValueAtTime(420, t + 0.25);
    osc.frequency.linearRampToValueAtTime(320, t + 0.4);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.45);
  },

  // Donkey - hee-haw
  donkey: (ctx, t) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(250, t);
    osc.frequency.linearRampToValueAtTime(500, t + 0.15);
    osc.frequency.linearRampToValueAtTime(200, t + 0.35);
    osc.frequency.linearRampToValueAtTime(450, t + 0.5);
    osc.frequency.linearRampToValueAtTime(180, t + 0.7);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.7);
  },

  // Rooster - cock-a-doodle-doo
  rooster: (ctx, t) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(500, t);
    osc.frequency.linearRampToValueAtTime(800, t + 0.08);
    osc.frequency.setValueAtTime(600, t + 0.15);
    osc.frequency.linearRampToValueAtTime(1000, t + 0.25);
    osc.frequency.linearRampToValueAtTime(700, t + 0.45);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.5);
  },
};

// ── Vehicle sounds ──

const vehicleSounds: Record<string, SoundFn> = {
  car: (ctx, t) => {
    // Engine idle
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.linearRampToValueAtTime(120, t + 0.2);
    osc.frequency.linearRampToValueAtTime(150, t + 0.4);
    filter.type = "lowpass"; filter.frequency.setValueAtTime(500, t);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.5);
  },

  truck: (ctx, t) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(50, t);
    osc.frequency.linearRampToValueAtTime(70, t + 0.3);
    filter.type = "lowpass"; filter.frequency.setValueAtTime(300, t);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.6);
  },

  bus: (ctx, t) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(60, t);
    osc.frequency.linearRampToValueAtTime(80, t + 0.2);
    // Horn
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.5);
    makeOsc(ctx, 350, "square", t + 0.2, 0.3, 0.12, ctx.destination);
  },

  train: (ctx, t) => {
    // Choo choo - steam whistle
    makeOsc(ctx, 500, "sine", t, 0.3, 0.15, ctx.destination);
    makeOsc(ctx, 500, "sine", t + 0.4, 0.3, 0.15, ctx.destination);
    // Chug noise
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 0.8);
    const filter = ctx.createBiquadFilter();
    const ng = ctx.createGain();
    filter.type = "lowpass"; filter.frequency.setValueAtTime(200, t);
    ng.gain.setValueAtTime(0.06, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    noise.connect(filter); filter.connect(ng); ng.connect(ctx.destination);
    noise.start(t); noise.stop(t + 0.8);
  },

  airplane: (ctx, t) => {
    // Jet engine roar
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 0.7);
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    filter.type = "bandpass"; filter.frequency.setValueAtTime(800, t);
    filter.frequency.linearRampToValueAtTime(1500, t + 0.3);
    filter.Q.setValueAtTime(2, t);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    noise.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    noise.start(t); noise.stop(t + 0.7);
  },

  rocket: (ctx, t) => {
    // Ascending roar
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 0.8);
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(300, t);
    filter.frequency.linearRampToValueAtTime(2000, t + 0.6);
    filter.Q.setValueAtTime(1, t);
    gain.gain.setValueAtTime(0.05, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    noise.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    noise.start(t); noise.stop(t + 0.8);
  },

  helicopter: (ctx, t) => {
    // Chopper blades - rhythmic pulses
    for (let i = 0; i < 8; i++) {
      makeOsc(ctx, 100, "square", t + i * 0.06, 0.03, 0.12, ctx.destination);
    }
  },

  ship: (ctx, t) => {
    // Deep foghorn
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, t);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.setValueAtTime(0.18, t + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.8);
  },

  motorcycle: (ctx, t) => {
    // Rev engine
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.linearRampToValueAtTime(300, t + 0.2);
    osc.frequency.linearRampToValueAtTime(400, t + 0.35);
    osc.frequency.linearRampToValueAtTime(200, t + 0.5);
    filter.type = "lowpass"; filter.frequency.setValueAtTime(800, t);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.5);
  },

  bicycle: (ctx, t) => {
    // Bell ring
    makeOsc(ctx, 2000, "sine", t, 0.15, 0.1, ctx.destination);
    makeOsc(ctx, 2500, "sine", t + 0.02, 0.12, 0.08, ctx.destination);
  },

  tractor: (ctx, t) => {
    // Diesel chug
    for (let i = 0; i < 4; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(60 + i * 5, t + i * 0.12);
      gain.gain.setValueAtTime(0.12, t + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.08);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(t + i * 0.12); osc.stop(t + i * 0.12 + 0.08);
    }
  },

  ambulance: (ctx, t) => {
    // Siren - alternating tones
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.linearRampToValueAtTime(600, t + 0.25);
    osc.frequency.linearRampToValueAtTime(900, t + 0.5);
    osc.frequency.linearRampToValueAtTime(600, t + 0.75);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.8);
  },

  firetruck: (ctx, t) => {
    // Wail siren
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.linearRampToValueAtTime(1000, t + 0.3);
    osc.frequency.linearRampToValueAtTime(600, t + 0.6);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.7);
  },

  police: (ctx, t) => {
    // European siren - wee-woo
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.linearRampToValueAtTime(1200, t + 0.15);
    osc.frequency.setValueAtTime(1200, t + 0.2);
    osc.frequency.linearRampToValueAtTime(800, t + 0.35);
    osc.frequency.setValueAtTime(800, t + 0.4);
    osc.frequency.linearRampToValueAtTime(1200, t + 0.55);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.6);
  },

  taxi: (ctx, t) => {
    // Car horn beep beep
    makeOsc(ctx, 480, "square", t, 0.12, 0.15, ctx.destination);
    makeOsc(ctx, 520, "square", t + 0.18, 0.12, 0.15, ctx.destination);
  },

  sailboat: (ctx, t) => {
    // Wind + creak
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 0.5);
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    filter.type = "bandpass"; filter.frequency.setValueAtTime(1000, t); filter.Q.setValueAtTime(3, t);
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    noise.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    noise.start(t); noise.stop(t + 0.5);
  },
};

// ── Fruit sounds - fun pops/plops ──

const fruitSounds: Record<string, SoundFn> = {
  apple: (ctx, t) => { makeOsc(ctx, 800, "sine", t, 0.06, 0.15, ctx.destination); makeOsc(ctx, 600, "sine", t + 0.04, 0.08, 0.12, ctx.destination); },
  banana: (ctx, t) => { [500,700,900].forEach((f,i) => makeOsc(ctx, f, "sine", t+i*0.07, 0.08, 0.1, ctx.destination)); },
  grapes: (ctx, t) => { [600,650,700,750,800].forEach((f,i) => makeOsc(ctx, f, "sine", t+i*0.05, 0.04, 0.08, ctx.destination)); },
  strawberry: (ctx, t) => { makeOsc(ctx, 1000, "sine", t, 0.06, 0.12, ctx.destination); makeOsc(ctx, 800, "sine", t+0.05, 0.08, 0.1, ctx.destination); },
  watermelon: (ctx, t) => { makeOsc(ctx, 300, "triangle", t, 0.12, 0.15, ctx.destination); makeOsc(ctx, 400, "triangle", t+0.08, 0.1, 0.12, ctx.destination); },
  cherry: (ctx, t) => { makeOsc(ctx, 900, "sine", t, 0.05, 0.12, ctx.destination); makeOsc(ctx, 1100, "sine", t+0.06, 0.05, 0.1, ctx.destination); },
  peach: (ctx, t) => { makeOsc(ctx, 600, "sine", t, 0.1, 0.12, ctx.destination); makeOsc(ctx, 500, "sine", t+0.07, 0.08, 0.1, ctx.destination); },
  pineapple: (ctx, t) => { [400,500,600].forEach((f,i) => makeOsc(ctx, f, "triangle", t+i*0.07, 0.08, 0.1, ctx.destination)); },
  mango: (ctx, t) => { makeOsc(ctx, 700, "sine", t, 0.08, 0.12, ctx.destination); makeOsc(ctx, 800, "sine", t+0.06, 0.06, 0.1, ctx.destination); },
  kiwi: (ctx, t) => { makeOsc(ctx, 1000, "sine", t, 0.04, 0.1, ctx.destination); makeOsc(ctx, 1200, "sine", t+0.05, 0.04, 0.08, ctx.destination); },
  lemon: (ctx, t) => { makeOsc(ctx, 1100, "sine", t, 0.06, 0.12, ctx.destination); makeOsc(ctx, 900, "sine", t+0.05, 0.08, 0.1, ctx.destination); },
  coconut: (ctx, t) => { makeOsc(ctx, 250, "triangle", t, 0.1, 0.15, ctx.destination); makeOsc(ctx, 200, "triangle", t+0.08, 0.1, 0.12, ctx.destination); },
  avocado: (ctx, t) => { makeOsc(ctx, 400, "sine", t, 0.12, 0.1, ctx.destination); makeOsc(ctx, 350, "sine", t+0.08, 0.1, 0.08, ctx.destination); },
  tomato: (ctx, t) => { makeOsc(ctx, 700, "sine", t, 0.06, 0.12, ctx.destination); makeOsc(ctx, 500, "sine", t+0.05, 0.08, 0.1, ctx.destination); },
  corn: (ctx, t) => { [800,900,800].forEach((f,i) => makeOsc(ctx, f, "sine", t+i*0.06, 0.05, 0.08, ctx.destination)); },
  carrot: (ctx, t) => { makeOsc(ctx, 600, "sine", t, 0.06, 0.1, ctx.destination); makeOsc(ctx, 700, "sine", t+0.05, 0.05, 0.08, ctx.destination); },
};

// ── Hebrew letters - musical scale notes ──

const hebrewSounds: Record<string, SoundFn> = {};
const hebrewNotes = [
  ["alef",262],["bet",294],["gimel",330],["dalet",349],["he",392],["vav",440],
  ["zayin",494],["chet",523],["tet",587],["yod",659],["kaf",698],["lamed",784],
  ["mem",880],["nun",988],["samekh",1047],["ayin",1175]
] as const;
hebrewNotes.forEach(([id, freq]) => {
  hebrewSounds[id] = (ctx, t) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.25);
  };
});

// ── Dinosaur sounds (for image-based dinos) ──

const dinoSounds: Record<string, SoundFn> = {
  triceratops: (ctx, t) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.linearRampToValueAtTime(160, t + 0.15);
    osc.frequency.linearRampToValueAtTime(70, t + 0.5);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.55);
  },
  brachiosaurus: (ctx, t) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.linearRampToValueAtTime(120, t + 0.3);
    osc.frequency.linearRampToValueAtTime(60, t + 0.8);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.9);
  },
  stegosaurus: (ctx, t) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.linearRampToValueAtTime(130, t + 0.2);
    osc.frequency.linearRampToValueAtTime(75, t + 0.5);
    gain.gain.setValueAtTime(0.16, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.55);
  },
  velociraptor: (ctx, t) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.linearRampToValueAtTime(800, t + 0.1);
    osc.frequency.linearRampToValueAtTime(300, t + 0.25);
    osc.frequency.linearRampToValueAtTime(600, t + 0.35);
    gain.gain.setValueAtTime(0.14, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.4);
  },
  pterodactyl: (ctx, t) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.linearRampToValueAtTime(1200, t + 0.1);
    osc.frequency.linearRampToValueAtTime(500, t + 0.3);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.35);
  },
  spinosaurus: (ctx, t) => {
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth"; osc2.type = "square";
    osc.frequency.setValueAtTime(55, t);
    osc.frequency.linearRampToValueAtTime(130, t + 0.25);
    osc.frequency.linearRampToValueAtTime(45, t + 0.7);
    osc2.frequency.setValueAtTime(58, t);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    osc.connect(gain); osc2.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.7); osc2.start(t); osc2.stop(t + 0.7);
  },
  ankylosaurus: (ctx, t) => {
    // Heavy stomp + rumble
    makeOsc(ctx, 70, "square", t, 0.15, 0.2, ctx.destination);
    makeOsc(ctx, 60, "sawtooth", t + 0.1, 0.3, 0.15, ctx.destination);
    makeOsc(ctx, 80, "square", t + 0.25, 0.12, 0.18, ctx.destination);
  },
};

// ── Combined lookup ──

const BASE_SOUNDS: Record<string, SoundFn> = {
  ...animalSounds,
  ...vehicleSounds,
  ...fruitSounds,
  ...hebrewSounds,
  ...dinoSounds,
};

// Build aliases: "real-dog" -> "dog", "real-cat" -> "cat", etc.
const ALL_SOUNDS: Record<string, SoundFn> = { ...BASE_SOUNDS };
Object.keys(BASE_SOUNDS).forEach((key) => {
  ALL_SOUNDS[`real-${key}`] = BASE_SOUNDS[key];
});

export function playCardSound(cardId: string) {
  const fn = ALL_SOUNDS[cardId];
  if (!fn) return;

  const ctx = audioCtx();
  if (ctx.state === "suspended") ctx.resume();

  // Route all sound through a boost gain node
  const boostGain = ctx.createGain();
  boostGain.gain.value = 3.0;
  boostGain.connect(ctx.destination);

  // Temporarily swap destination for the sound function
  const origDest = ctx.destination;
  const proxyCtx = Object.create(ctx, {
    destination: { get: () => boostGain }
  });

  try {
    fn(proxyCtx as AudioContext, ctx.currentTime);
  } catch {
    makeOsc(ctx, 440, "sine", ctx.currentTime, 0.15, 0.1, ctx.destination);
  }
}
