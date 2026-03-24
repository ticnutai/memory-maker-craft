import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Play, Pause, Plus, Minus } from "lucide-react";
import trainLocomotiveImg from "@/assets/train-locomotive.png";
import trainWagonImg from "@/assets/train-wagon.png";
import trainBgImg from "@/assets/train-bg.jpg";

interface TrainGameProps {
  onHome: () => void;
}

const playHornSound = () => {
  const ctx = new AudioContext();
  if (ctx.state === "suspended") ctx.resume();
  const now = ctx.currentTime;

  // Main horn tone
  const osc1 = ctx.createOscillator();
  osc1.type = "sawtooth";
  osc1.frequency.setValueAtTime(220, now);
  osc1.frequency.linearRampToValueAtTime(280, now + 0.1);
  osc1.frequency.setValueAtTime(280, now + 0.1);

  const osc2 = ctx.createOscillator();
  osc2.type = "sawtooth";
  osc2.frequency.setValueAtTime(277, now);
  osc2.frequency.linearRampToValueAtTime(350, now + 0.1);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
  gain.gain.setValueAtTime(0.3, now + 0.8);
  gain.gain.linearRampToValueAtTime(0, now + 1.2);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(800, now);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 1.2);
  osc2.stop(now + 1.2);
};

const playChugSound = (ctx: AudioContext) => {
  const now = ctx.currentTime;
  const bufferSize = ctx.sampleRate * 0.15;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.08, now);
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(300, now);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(now);
};

const TrainGame = ({ onHome }: TrainGameProps) => {
  const [isMoving, setIsMoving] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [trainX, setTrainX] = useState(0);
  const [wagonCount, setWagonCount] = useState(2);
  const [smokeParticles, setSmokeParticles] = useState<{ id: number; x: number; y: number; opacity: number; size: number }[]>([]);
  const animRef = useRef<number>();
  const chugRef = useRef<ReturnType<typeof setInterval>>();
  const audioCtxRef = useRef<AudioContext>();
  const smokeIdRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const trainWidth = 140;
  const wagonWidth = 100;
  const wagonGap = 4;
  const totalTrainWidth = trainWidth + wagonCount * (wagonWidth + wagonGap);

  // Animation loop
  useEffect(() => {
    if (!isMoving) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (chugRef.current) clearInterval(chugRef.current);
      return;
    }

    const containerWidth = containerRef.current?.offsetWidth || 800;

    const animate = () => {
      setTrainX(prev => {
        const next = prev + speed;
        if (next > containerWidth + 50) return -totalTrainWidth - 50;
        return next;
      });
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);

    // Chug sound
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    const chugInterval = Math.max(150, 400 - speed * 50);
    chugRef.current = setInterval(() => {
      if (audioCtxRef.current) playChugSound(audioCtxRef.current);
    }, chugInterval);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (chugRef.current) clearInterval(chugRef.current);
    };
  }, [isMoving, speed, totalTrainWidth]);

  // Smoke effect
  useEffect(() => {
    if (!isMoving) return;
    const interval = setInterval(() => {
      smokeIdRef.current++;
      setSmokeParticles(prev => [
        ...prev.slice(-15),
        {
          id: smokeIdRef.current,
          x: trainX + trainWidth - 30,
          y: 0,
          opacity: 0.7,
          size: 12 + Math.random() * 16,
        },
      ]);
    }, 120);
    return () => clearInterval(interval);
  }, [isMoving, trainX]);

  // Fade smoke
  useEffect(() => {
    if (smokeParticles.length === 0) return;
    const timeout = setTimeout(() => {
      setSmokeParticles(prev =>
        prev
          .map(p => ({ ...p, y: p.y - 3, opacity: p.opacity - 0.05, size: p.size + 1.5 }))
          .filter(p => p.opacity > 0)
      );
    }, 60);
    return () => clearTimeout(timeout);
  }, [smokeParticles]);

  const handleHorn = useCallback(() => {
    playHornSound();
  }, []);

  const trackY = 320;

  return (
    <div className="relative w-full h-screen overflow-hidden select-none" ref={containerRef}>
      {/* Background */}
      <img
        src={trainBgImg}
        alt="רקע"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Back button */}
      <button
        onClick={onHome}
        className="absolute top-3 right-3 z-30 w-10 h-10 rounded-full bg-white/80 backdrop-blur shadow-lg flex items-center justify-center hover:bg-white transition-all active:scale-90"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Title */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20">
        <h1 className="text-2xl font-bold text-white drop-shadow-lg" style={{ textShadow: "2px 2px 6px rgba(0,0,0,0.5)" }}>
          🚂 משחק הרכבת
        </h1>
      </div>

      {/* Smoke particles */}
      {smokeParticles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: p.x,
            top: trackY - 80 + p.y,
            width: p.size,
            height: p.size,
            background: `rgba(200, 200, 200, ${p.opacity})`,
            transition: "all 0.06s linear",
          }}
        />
      ))}

      {/* Train */}
      <div
        className="absolute flex items-end cursor-pointer"
        style={{
          left: trainX,
          top: trackY - 70,
          transition: isMoving ? "none" : "left 0.3s ease",
        }}
        onClick={handleHorn}
      >
        {/* Wagons (behind locomotive) - rendered first so locomotive overlaps */}
        <div className="flex items-end" style={{ direction: "ltr" }}>
          {Array.from({ length: wagonCount }).map((_, i) => (
            <img
              key={i}
              src={trainWagonImg}
              alt={`קרון ${i + 1}`}
              className="h-[65px] object-contain"
              style={{ marginRight: wagonGap }}
              draggable={false}
            />
          ))}
          {/* Locomotive */}
          <img
            src={trainLocomotiveImg}
            alt="קטר"
            className="h-[80px] object-contain relative z-10"
            draggable={false}
          />
        </div>
      </div>

      {/* Rails */}
      <div
        className="absolute left-0 right-0 h-3"
        style={{
          top: trackY,
          background: "linear-gradient(to bottom, #8B7355 0%, #6B5B3E 40%, #4a3f2b 100%)",
          boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
        }}
      >
        {/* Rail ties */}
        <div className="absolute inset-0 flex items-center">
          {Array.from({ length: 60 }).map((_, i) => (
            <div
              key={i}
              className="h-4 w-1.5 bg-amber-900/60 flex-shrink-0"
              style={{ marginLeft: i === 0 ? 0 : 18 }}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
        {/* Play/Pause */}
        <button
          onClick={() => setIsMoving(prev => !prev)}
          className="w-14 h-14 rounded-full bg-green-500 text-white shadow-xl flex items-center justify-center hover:bg-green-600 active:scale-90 transition-all"
        >
          {isMoving ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
        </button>

        {/* Horn */}
        <button
          onClick={handleHorn}
          className="w-14 h-14 rounded-full bg-yellow-400 text-yellow-900 shadow-xl flex items-center justify-center hover:bg-yellow-500 active:scale-90 transition-all text-2xl"
        >
          📯
        </button>

        {/* Speed controls */}
        <div className="flex items-center gap-1 bg-white/80 backdrop-blur rounded-full px-3 py-2 shadow-lg">
          <button
            onClick={() => setSpeed(s => Math.max(1, s - 1))}
            className="w-8 h-8 rounded-full bg-red-400 text-white flex items-center justify-center active:scale-90"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold px-2 min-w-[30px] text-center">{speed}x</span>
          <button
            onClick={() => setSpeed(s => Math.min(8, s + 1))}
            className="w-8 h-8 rounded-full bg-blue-400 text-white flex items-center justify-center active:scale-90"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Wagon controls */}
        <div className="flex items-center gap-1 bg-white/80 backdrop-blur rounded-full px-3 py-2 shadow-lg">
          <button
            onClick={() => setWagonCount(c => Math.max(0, c - 1))}
            className="w-8 h-8 rounded-full bg-orange-400 text-white flex items-center justify-center active:scale-90"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold px-1">🚃 {wagonCount}</span>
          <button
            onClick={() => setWagonCount(c => Math.min(6, c + 1))}
            className="w-8 h-8 rounded-full bg-orange-400 text-white flex items-center justify-center active:scale-90"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrainGame;
