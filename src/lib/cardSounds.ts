// Card-specific sound effects synthesized via Web Audio API
// Each card ID maps to a unique fun sound

const audioCtx = () => {
  if (!(window as any).__gameAudioCtx) {
    (window as any).__gameAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return (window as any).__gameAudioCtx as AudioContext;
};

interface SoundDef {
  notes: [number, number, OscillatorType, number][]; // [freq, duration, type, delay]
}

// Animal sounds - synthesized approximations
const CARD_SOUNDS: Record<string, SoundDef> = {
  // Girl animals
  bunny:      { notes: [[800,0.08,"sine",0],[900,0.08,"sine",0.1],[1000,0.06,"sine",0.2]] },
  butterfly:  { notes: [[1200,0.15,"sine",0],[1400,0.15,"sine",0.12],[1600,0.1,"sine",0.24]] },
  cat:        { notes: [[700,0.3,"sawtooth",0],[600,0.3,"sawtooth",0.15]] },
  unicorn:    { notes: [[523,0.15,"sine",0],[659,0.15,"sine",0.12],[784,0.15,"sine",0.24],[1047,0.2,"sine",0.36]] },
  dolphin:    { notes: [[1200,0.1,"sine",0],[800,0.1,"sine",0.1],[1400,0.1,"sine",0.2],[900,0.1,"sine",0.3]] },
  flamingo:   { notes: [[500,0.2,"square",0],[450,0.15,"square",0.15]] },
  panda:      { notes: [[300,0.2,"sine",0],[350,0.15,"sine",0.15]] },
  owl:        { notes: [[400,0.3,"sine",0],[300,0.4,"sine",0.35]] },
  koala:      { notes: [[250,0.25,"triangle",0],[200,0.3,"triangle",0.2]] },
  penguin:    { notes: [[600,0.1,"square",0],[700,0.1,"square",0.12],[600,0.1,"square",0.24]] },
  deer:       { notes: [[500,0.15,"sine",0],[600,0.1,"sine",0.12]] },
  swan:       { notes: [[800,0.2,"sine",0],[700,0.25,"sine",0.15]] },
  hedgehog:   { notes: [[900,0.05,"sine",0],[1000,0.05,"sine",0.08],[900,0.05,"sine",0.16]] },
  parrot:     { notes: [[1000,0.1,"sawtooth",0],[1200,0.1,"sawtooth",0.08],[800,0.15,"sawtooth",0.16]] },
  ladybug:    { notes: [[1100,0.06,"sine",0],[1200,0.06,"sine",0.08],[1100,0.06,"sine",0.16]] },
  snail:      { notes: [[200,0.4,"sine",0],[180,0.3,"sine",0.3]] },

  // Boy animals
  lion:       { notes: [[150,0.4,"sawtooth",0],[120,0.5,"sawtooth",0.2]] },
  dinosaur:   { notes: [[100,0.5,"sawtooth",0],[80,0.6,"sawtooth",0.3]] },
  shark:      { notes: [[200,0.3,"triangle",0],[150,0.3,"triangle",0.2],[100,0.4,"triangle",0.4]] },
  bear:       { notes: [[180,0.4,"sawtooth",0],[150,0.35,"sawtooth",0.25]] },
  dragon:     { notes: [[120,0.3,"sawtooth",0],[200,0.2,"sawtooth",0.15],[300,0.2,"sawtooth",0.25],[150,0.4,"sawtooth",0.35]] },
  eagle:      { notes: [[900,0.15,"sine",0],[1100,0.15,"sine",0.1],[800,0.2,"sine",0.2]] },
  wolf:       { notes: [[300,0.3,"sawtooth",0],[350,0.2,"sawtooth",0.2],[400,0.3,"sawtooth",0.35]] },
  octopus:    { notes: [[400,0.1,"sine",0],[350,0.1,"sine",0.1],[300,0.1,"sine",0.2],[250,0.15,"sine",0.3]] },
  gorilla:    { notes: [[120,0.15,"square",0],[120,0.15,"square",0.2],[120,0.15,"square",0.4]] },
  crocodile:  { notes: [[200,0.2,"sawtooth",0],[150,0.3,"sawtooth",0.15]] },
  whale:      { notes: [[200,0.5,"sine",0],[180,0.5,"sine",0.4],[160,0.6,"sine",0.8]] },
  scorpion:   { notes: [[800,0.05,"square",0],[900,0.05,"square",0.06],[1000,0.05,"square",0.12]] },
  bat:        { notes: [[2000,0.05,"sine",0],[2500,0.05,"sine",0.06],[2000,0.05,"sine",0.12]] },
  rhino:      { notes: [[100,0.4,"sawtooth",0],[130,0.3,"sawtooth",0.3]] },
  trex:       { notes: [[80,0.6,"sawtooth",0],[60,0.5,"sawtooth",0.4]] },
  snake:      { notes: [[2000,0.2,"sine",0],[2500,0.15,"sine",0.1],[3000,0.1,"sine",0.2]] },

  // Fruits - fun pops and plops
  apple:      { notes: [[800,0.08,"sine",0],[600,0.1,"sine",0.05]] },
  banana:     { notes: [[500,0.1,"sine",0],[700,0.1,"sine",0.08],[900,0.08,"sine",0.16]] },
  grapes:     { notes: [[600,0.05,"sine",0],[650,0.05,"sine",0.06],[700,0.05,"sine",0.12],[750,0.05,"sine",0.18]] },
  strawberry: { notes: [[1000,0.08,"sine",0],[800,0.1,"sine",0.06]] },
  watermelon: { notes: [[300,0.15,"triangle",0],[400,0.1,"triangle",0.1]] },
  cherry:     { notes: [[900,0.06,"sine",0],[1100,0.06,"sine",0.08]] },
  peach:      { notes: [[600,0.12,"sine",0],[500,0.1,"sine",0.08]] },
  pineapple:  { notes: [[400,0.1,"triangle",0],[500,0.1,"triangle",0.08],[600,0.1,"triangle",0.16]] },
  mango:      { notes: [[700,0.1,"sine",0],[800,0.08,"sine",0.08]] },
  kiwi:       { notes: [[1000,0.05,"sine",0],[1200,0.05,"sine",0.06]] },
  lemon:      { notes: [[1100,0.08,"sine",0],[900,0.1,"sine",0.06]] },
  coconut:    { notes: [[300,0.1,"triangle",0],[250,0.12,"triangle",0.08]] },
  avocado:    { notes: [[400,0.15,"sine",0],[350,0.12,"sine",0.1]] },
  tomato:     { notes: [[700,0.08,"sine",0],[500,0.1,"sine",0.06]] },
  corn:       { notes: [[800,0.06,"sine",0],[900,0.06,"sine",0.06],[800,0.06,"sine",0.12]] },
  carrot:     { notes: [[600,0.08,"sine",0],[700,0.06,"sine",0.06]] },

  // Vehicles - engine/horn sounds
  car:        { notes: [[300,0.2,"sawtooth",0],[350,0.15,"sawtooth",0.15]] },
  truck:      { notes: [[150,0.3,"sawtooth",0],[180,0.2,"sawtooth",0.2]] },
  bus:        { notes: [[200,0.25,"square",0],[250,0.2,"square",0.2]] },
  train:      { notes: [[400,0.3,"square",0],[400,0.3,"square",0.4]] },
  airplane:   { notes: [[200,0.2,"sawtooth",0],[250,0.2,"sawtooth",0.1],[300,0.3,"sawtooth",0.2]] },
  rocket:     { notes: [[150,0.15,"sawtooth",0],[200,0.15,"sawtooth",0.1],[300,0.15,"sawtooth",0.2],[500,0.2,"sawtooth",0.3]] },
  helicopter: { notes: [[250,0.08,"square",0],[250,0.08,"square",0.1],[250,0.08,"square",0.2],[250,0.08,"square",0.3]] },
  ship:       { notes: [[200,0.5,"sine",0],[180,0.4,"sine",0.3]] },
  motorcycle: { notes: [[200,0.1,"sawtooth",0],[250,0.1,"sawtooth",0.08],[300,0.1,"sawtooth",0.16],[350,0.15,"sawtooth",0.24]] },
  bicycle:    { notes: [[800,0.06,"sine",0],[1000,0.06,"sine",0.1]] },
  tractor:    { notes: [[100,0.15,"square",0],[120,0.15,"square",0.15],[100,0.15,"square",0.3]] },
  ambulance:  { notes: [[800,0.2,"sine",0],[600,0.2,"sine",0.2],[800,0.2,"sine",0.4]] },
  firetruck:  { notes: [[700,0.15,"square",0],[900,0.15,"square",0.15],[700,0.15,"square",0.3]] },
  police:     { notes: [[800,0.15,"sine",0],[1000,0.15,"sine",0.15],[800,0.15,"sine",0.3]] },
  taxi:       { notes: [[500,0.12,"square",0],[600,0.12,"square",0.12]] },
  sailboat:   { notes: [[400,0.2,"sine",0],[500,0.15,"sine",0.15]] },

  // Hebrew letters - musical notes
  alef:   { notes: [[262,0.2,"sine",0]] },
  bet:    { notes: [[294,0.2,"sine",0]] },
  gimel:  { notes: [[330,0.2,"sine",0]] },
  dalet:  { notes: [[349,0.2,"sine",0]] },
  he:     { notes: [[392,0.2,"sine",0]] },
  vav:    { notes: [[440,0.2,"sine",0]] },
  zayin:  { notes: [[494,0.2,"sine",0]] },
  chet:   { notes: [[523,0.2,"sine",0]] },
  tet:    { notes: [[587,0.2,"sine",0]] },
  yod:    { notes: [[659,0.2,"sine",0]] },
  kaf:    { notes: [[698,0.2,"sine",0]] },
  lamed:  { notes: [[784,0.2,"sine",0]] },
  mem:    { notes: [[880,0.2,"sine",0]] },
  nun:    { notes: [[988,0.2,"sine",0]] },
  samekh: { notes: [[1047,0.2,"sine",0]] },
  ayin:   { notes: [[1175,0.2,"sine",0]] },
};

export function playCardSound(cardId: string) {
  const def = CARD_SOUNDS[cardId];
  if (!def) return;

  const ctx = audioCtx();
  if (ctx.state === "suspended") ctx.resume();

  def.notes.forEach(([freq, dur, type, delay]) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    gain.gain.setValueAtTime(0.2, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + dur);
  });
}
