// Simple Web Audio API sound effects — no external files needed
const audioCtx = () => {
  if (!(window as any).__gameAudioCtx) {
    (window as any).__gameAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return (window as any).__gameAudioCtx as AudioContext;
};

function playTone(frequency: number, duration: number, type: OscillatorType = "sine", volume = 0.3) {
  const ctx = audioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export function playFlipSound() {
  playTone(600, 0.1, "sine", 0.2);
}

export function playMatchSound() {
  // Happy ascending two-tone
  playTone(523, 0.15, "sine", 0.25);
  setTimeout(() => playTone(784, 0.2, "sine", 0.25), 100);
}

export function playMismatchSound() {
  // Gentle low buzz
  playTone(200, 0.2, "triangle", 0.15);
}

export function playWinSound() {
  // Celebratory ascending scale
  const notes = [523, 587, 659, 784, 880, 1047];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.3, "sine", 0.2), i * 120);
  });
}