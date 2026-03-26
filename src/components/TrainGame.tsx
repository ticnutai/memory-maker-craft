import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Plus, Settings, X, Sparkles, Trophy, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import trainLocomotiveImg from "@/assets/train-locomotive.png";
import trainWagonImg from "@/assets/train-wagon.png";
import trainBgImg from "@/assets/train-bg.jpg";
import { type AgeGroup, type TrainQuestion, getQuestionsForAge } from "@/lib/trainQuestions";

interface TrainGameProps {
  onHome: () => void;
}

// ── Audio helpers ──
const playCorrectSound = () => {
  try {
    const ctx = new AudioContext();
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.15, now + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.4);
      osc.connect(g).connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.4);
    });
  } catch {}
};

const playWrongSound = () => {
  try {
    const ctx = new AudioContext();
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.linearRampToValueAtTime(120, now + 0.3);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.1, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(g).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  } catch {}
};

const playHornSound = () => {
  try {
    const ctx = new AudioContext();
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator(); osc1.type = "sawtooth"; osc1.frequency.setValueAtTime(220, now); osc1.frequency.linearRampToValueAtTime(280, now + 0.1);
    const osc2 = ctx.createOscillator(); osc2.type = "sawtooth"; osc2.frequency.setValueAtTime(277, now); osc2.frequency.linearRampToValueAtTime(350, now + 0.1);
    const gain = ctx.createGain(); gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.25, now + 0.05); gain.gain.setValueAtTime(0.25, now + 0.6); gain.gain.linearRampToValueAtTime(0, now + 1);
    const filter = ctx.createBiquadFilter(); filter.type = "lowpass"; filter.frequency.value = 800;
    osc1.connect(filter); osc2.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    osc1.start(now); osc2.start(now); osc1.stop(now + 1); osc2.stop(now + 1);
  } catch {}
};

const playChugSound = (ctx: AudioContext) => {
  const now = ctx.currentTime;
  const bufferSize = ctx.sampleRate * 0.12;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
  const source = ctx.createBufferSource(); source.buffer = buffer;
  const gain = ctx.createGain(); gain.gain.value = 0.06;
  const filter = ctx.createBiquadFilter(); filter.type = "lowpass"; filter.frequency.value = 300;
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start(now);
};

type GamePhase = "age-select" | "playing" | "victory";

const AGE_OPTIONS: { age: AgeGroup; emoji: string; label: string; color: string }[] = [
  { age: 3, emoji: "👶", label: "גיל 3", color: "from-pink-400 to-rose-400" },
  { age: 4, emoji: "🧒", label: "גיל 4", color: "from-orange-400 to-amber-400" },
  { age: 5, emoji: "👧", label: "גיל 5", color: "from-emerald-400 to-green-400" },
  { age: 6, emoji: "🧒", label: "גיל 6", color: "from-blue-400 to-indigo-400" },
];

const STATIONS = ["🏠 בית", "🌳 הפארק", "🎡 לונה פארק", "🏖️ חוף הים", "🏰 הטירה", "🎪 הקרקס", "🌈 ארץ הקשת"];

const TrainGame = ({ onHome }: TrainGameProps) => {
  const [phase, setPhase] = useState<GamePhase>("age-select");
  const [selectedAge, setSelectedAge] = useState<AgeGroup>(4);
  const [questions, setQuestions] = useState<TrainQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [station, setStation] = useState(0);
  const [showFeedback, setShowFeedback] = useState<"correct" | "wrong" | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [trainMoving, setTrainMoving] = useState(false);
  const [trainX, setTrainX] = useState(0);
  const [wagonCount, setWagonCount] = useState(2);
  const [smokeParticles, setSmokeParticles] = useState<{ id: number; x: number; y: number; opacity: number; size: number }[]>([]);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [customQuestions, setCustomQuestions] = useState<TrainQuestion[]>([]);
  const [newQ, setNewQ] = useState({ question: "", opt1: "", opt2: "", opt3: "", correct: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>();
  const chugRef = useRef<ReturnType<typeof setInterval>>();
  const audioCtxRef = useRef<AudioContext>();
  const smokeIdRef = useRef(0);

  const trainWidth = 140;
  const wagonWidth = 100;
  const wagonGap = 4;
  const totalTrainWidth = trainWidth + wagonCount * (wagonWidth + wagonGap);
  const trackY = 280;
  const totalQuestions = questions.length;
  const questionsPerStation = Math.max(1, Math.floor(totalQuestions / (STATIONS.length - 1)));

  // Load custom questions from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("train-game-custom-questions");
      if (saved) setCustomQuestions(JSON.parse(saved));
    } catch {}
  }, []);

  const saveCustomQuestions = (qs: TrainQuestion[]) => {
    setCustomQuestions(qs);
    localStorage.setItem("train-game-custom-questions", JSON.stringify(qs));
  };

  // Start game
  const startGame = () => {
    const qs = getQuestionsForAge(selectedAge, customQuestions);
    if (qs.length === 0) { toast.error("אין שאלות לגיל הזה"); return; }
    setQuestions(qs);
    setCurrentQIndex(0);
    setScore(0);
    setStreak(0);
    setStation(0);
    setTrainX(0);
    setPhase("playing");
    playHornSound();
  };

  // Train animation
  useEffect(() => {
    if (!trainMoving) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (chugRef.current) clearInterval(chugRef.current);
      return;
    }
    const containerWidth = containerRef.current?.offsetWidth || 800;
    const targetX = ((station) / (STATIONS.length - 1)) * (containerWidth - totalTrainWidth - 40) + 20;
    const speed = 3;
    let done = false;

    const animate = () => {
      setTrainX(prev => {
        const diff = targetX - prev;
        if (Math.abs(diff) < speed) { done = true; return targetX; }
        return prev + Math.sign(diff) * speed;
      });
      if (!done) animRef.current = requestAnimationFrame(animate);
      else setTrainMoving(false);
    };
    animRef.current = requestAnimationFrame(animate);

    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    chugRef.current = setInterval(() => {
      if (audioCtxRef.current) playChugSound(audioCtxRef.current);
    }, 200);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (chugRef.current) clearInterval(chugRef.current);
    };
  }, [trainMoving, station, totalTrainWidth]);

  // Smoke
  useEffect(() => {
    if (!trainMoving) return;
    const interval = setInterval(() => {
      smokeIdRef.current++;
      setSmokeParticles(prev => [
        ...prev.slice(-12),
        { id: smokeIdRef.current, x: trainX + totalTrainWidth - 30, y: 0, opacity: 0.6, size: 10 + Math.random() * 14 },
      ]);
    }, 100);
    return () => clearInterval(interval);
  }, [trainMoving, trainX, totalTrainWidth]);

  useEffect(() => {
    if (smokeParticles.length === 0) return;
    const t = setTimeout(() => {
      setSmokeParticles(prev => prev.map(p => ({ ...p, y: p.y - 3, opacity: p.opacity - 0.05, size: p.size + 1.5 })).filter(p => p.opacity > 0));
    }, 50);
    return () => clearTimeout(t);
  }, [smokeParticles]);

  // Answer
  const handleAnswer = (optIdx: number) => {
    if (showFeedback || trainMoving) return;
    const q = questions[currentQIndex];
    if (!q) return;
    setSelectedOption(optIdx);

    if (optIdx === q.correctIndex) {
      setShowFeedback("correct");
      playCorrectSound();
      setScore(s => s + (streak >= 2 ? 15 : 10));
      setStreak(s => s + 1);
      // Check if we advance station
      const newQIndex = currentQIndex + 1;
      const newStation = Math.min(STATIONS.length - 1, Math.floor(newQIndex / questionsPerStation));
      setTimeout(() => {
        if (newStation > station) {
          setStation(newStation);
          setTrainMoving(true);
          setWagonCount(c => Math.min(6, c + 1));
          playHornSound();
        }
        setShowFeedback(null);
        setSelectedOption(null);
        if (newQIndex >= totalQuestions) {
          setPhase("victory");
        } else {
          setCurrentQIndex(newQIndex);
        }
      }, 1200);
    } else {
      setShowFeedback("wrong");
      playWrongSound();
      setStreak(0);
      setTimeout(() => { setShowFeedback(null); setSelectedOption(null); }, 1000);
    }
  };

  // Add custom question
  const addCustomQuestion = () => {
    if (!newQ.question.trim() || !newQ.opt1.trim() || !newQ.opt2.trim()) {
      toast.error("מלאו שאלה ולפחות 2 תשובות"); return;
    }
    const opts = [newQ.opt1, newQ.opt2, newQ.opt3].filter(Boolean).map(label => ({ label }));
    const q: TrainQuestion = {
      id: `custom-${Date.now()}`, type: "custom", question: newQ.question,
      options: opts, correctIndex: Math.min(newQ.correct, opts.length - 1),
      ageGroup: [3, 4, 5, 6], difficulty: 1,
    };
    saveCustomQuestions([...customQuestions, q]);
    setNewQ({ question: "", opt1: "", opt2: "", opt3: "", correct: 0 });
    toast.success("שאלה נוספה! 🎉");
  };

  const deleteCustomQuestion = (id: string) => {
    saveCustomQuestions(customQuestions.filter(q => q.id !== id));
    toast.success("שאלה נמחקה");
  };

  const currentQ = questions[currentQIndex];
  const progress = totalQuestions > 0 ? (currentQIndex / totalQuestions) * 100 : 0;

  // ══════════════ AGE SELECT ══════════════
  if (phase === "age-select") {
    return (
      <div className="relative w-full h-screen overflow-hidden select-none" dir="rtl" ref={containerRef}>
        <img src={trainBgImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/50" />

        <button onClick={onHome}
          className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-white/90 backdrop-blur shadow-lg flex items-center justify-center hover:bg-white transition-all active:scale-90">
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 gap-6">
          {/* Title */}
          <div className="text-center animate-bounce-slow">
            <div className="text-6xl mb-3">🚂</div>
            <h1 className="text-4xl sm:text-5xl font-black text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
              רכבת החכמולוג
            </h1>
            <p className="text-white/80 text-sm sm:text-base mt-2 drop-shadow">ענו על שאלות וקדמו את הרכבת לתחנה הבאה!</p>
          </div>

          {/* Age selection */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
            {AGE_OPTIONS.map(opt => (
              <button key={opt.age} onClick={() => setSelectedAge(opt.age)}
                className={`bg-gradient-to-br ${opt.color} rounded-2xl p-4 flex flex-col items-center gap-2 shadow-lg transition-all active:scale-95 border-4 ${
                  selectedAge === opt.age ? "border-white scale-105 shadow-2xl ring-4 ring-white/30" : "border-transparent hover:scale-[1.03]"
                }`}>
                <span className="text-4xl">{opt.emoji}</span>
                <span className="font-bold text-white text-lg drop-shadow">{opt.label}</span>
              </button>
            ))}
          </div>

          {/* Start + settings */}
          <div className="flex gap-3">
            <Button onClick={startGame} size="xl"
              className="bg-gradient-to-r from-green-400 to-emerald-500 text-white font-black text-xl rounded-2xl shadow-xl hover:shadow-2xl px-10 gap-2 border-2 border-white/30">
              🚂 יוצאים לדרך!
            </Button>
            <button onClick={() => setShowAddQuestion(true)}
              className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur border-2 border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all active:scale-90">
              <Settings className="w-6 h-6" />
            </button>
          </div>

          {/* Custom question count */}
          {customQuestions.length > 0 && (
            <p className="text-white/70 text-xs">📝 {customQuestions.length} שאלות מותאמות אישית</p>
          )}
        </div>

        {/* Add question modal */}
        {showAddQuestion && (
          <div className="absolute inset-0 z-40 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowAddQuestion(false)}>
            <div className="bg-card rounded-3xl p-5 w-full max-w-md shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto" dir="rtl"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className="font-black text-lg">📝 שאלות מותאמות אישית</h2>
                <button onClick={() => setShowAddQuestion(false)}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* New question form */}
              <div className="space-y-3 bg-muted/50 rounded-2xl p-4">
                <p className="font-bold text-sm">➕ הוספת שאלה חדשה</p>
                <input type="text" value={newQ.question} onChange={e => setNewQ(p => ({ ...p, question: e.target.value }))}
                  placeholder="השאלה..." className="w-full h-10 rounded-xl border-2 border-muted px-3 text-sm focus:outline-none focus:border-primary" />
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="space-y-1">
                      <input type="text" value={(newQ as any)[`opt${i}`]}
                        onChange={e => setNewQ(p => ({ ...p, [`opt${i}`]: e.target.value }))}
                        placeholder={`תשובה ${i}`}
                        className={`w-full h-9 rounded-lg border-2 px-2 text-xs focus:outline-none ${
                          newQ.correct === i - 1 ? "border-green-400 bg-green-50" : "border-muted"
                        }`} />
                      <button onClick={() => setNewQ(p => ({ ...p, correct: i - 1 }))}
                        className={`w-full text-[10px] rounded-md py-1 font-bold transition-all ${
                          newQ.correct === i - 1 ? "bg-green-400 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}>
                        {newQ.correct === i - 1 ? "✓ נכונה" : "סמן נכונה"}
                      </button>
                    </div>
                  ))}
                </div>
                <Button onClick={addCustomQuestion} className="w-full rounded-xl gap-1" variant="game-pink">
                  <Plus className="w-4 h-4" /> הוסף שאלה
                </Button>
              </div>

              {/* Existing custom questions */}
              {customQuestions.length > 0 && (
                <div className="space-y-2">
                  <p className="font-bold text-sm text-muted-foreground">שאלות שנוספו ({customQuestions.length})</p>
                  {customQuestions.map(q => (
                    <div key={q.id} className="flex items-center gap-2 bg-card rounded-xl p-2 border border-muted">
                      <span className="text-xs flex-1 truncate">{q.question}</span>
                      <button onClick={() => deleteCustomQuestion(q.id)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 active:scale-90">
                        <X className="w-3.5 h-3.5 text-destructive/60" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════ VICTORY ══════════════
  if (phase === "victory") {
    const stars = score >= totalQuestions * 12 ? 3 : score >= totalQuestions * 8 ? 2 : 1;
    return (
      <div className="relative w-full h-screen overflow-hidden select-none" dir="rtl" ref={containerRef}>
        <img src={trainBgImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/30 via-transparent to-amber-500/40" />

        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 gap-4">
          <div className="text-7xl animate-bounce">🏆</div>
          <h1 className="text-4xl sm:text-5xl font-black text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">כל הכבוד!</h1>
          <p className="text-white/90 text-lg drop-shadow">הגעתם לתחנה האחרונה!</p>

          <div className="flex gap-2 my-2">
            {[1, 2, 3].map(i => (
              <Star key={i} className={`w-12 h-12 transition-all duration-500 ${
                i <= stars ? "text-yellow-400 fill-yellow-400 drop-shadow-lg" : "text-white/30"
              }`} style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>

          <div className="bg-white/20 backdrop-blur rounded-2xl px-8 py-4 text-center">
            <p className="text-3xl font-black text-white">{score} נקודות</p>
            <p className="text-white/70 text-sm">{currentQIndex} שאלות • {station} תחנות</p>
          </div>

          <div className="flex gap-3 mt-4">
            <Button onClick={startGame} size="lg"
              className="bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold rounded-2xl shadow-xl gap-2">
              🔄 שחקו שוב
            </Button>
            <Button onClick={() => setPhase("age-select")} size="lg" variant="outline"
              className="bg-white/20 backdrop-blur text-white border-white/30 rounded-2xl font-bold">
              🏠 חזרה
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════ PLAYING ══════════════
  return (
    <div className="relative w-full h-screen overflow-hidden select-none flex flex-col" ref={containerRef}>
      {/* Background */}
      <img src={trainBgImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-sky-400/20 via-transparent to-green-900/40" />

      {/* Top bar */}
      <div className="relative z-20 flex items-center gap-3 px-4 pt-3 pb-2" dir="rtl">
        <button onClick={onHome}
          className="w-9 h-9 rounded-full bg-white/80 backdrop-blur shadow flex items-center justify-center hover:bg-white active:scale-90">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white drop-shadow">🚂 רכבת החכמולוג</span>
            <span className="text-xs bg-white/25 backdrop-blur rounded-full px-2 py-0.5 text-white font-bold">
              גיל {selectedAge}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {streak >= 2 && (
            <span className="text-xs bg-orange-400 text-white rounded-full px-2 py-0.5 font-bold animate-pulse flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> ×{streak}
            </span>
          )}
          <span className="text-sm font-black bg-yellow-400 text-yellow-900 rounded-full px-3 py-1 shadow">
            ⭐ {score}
          </span>
        </div>
      </div>

      {/* Progress / stations bar */}
      <div className="relative z-20 px-4 pb-2">
        <div className="relative h-8 bg-white/20 backdrop-blur rounded-full overflow-hidden">
          <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }} />
          <div className="absolute inset-0 flex items-center justify-between px-2">
            {STATIONS.map((s, i) => {
              const pos = i / (STATIONS.length - 1) * 100;
              return (
                <div key={i} className={`text-[10px] font-bold transition-all ${
                  i <= station ? "text-white drop-shadow scale-110" : "text-white/50"
                }`} style={{ position: "absolute", left: `${pos}%`, transform: "translateX(-50%)" }}>
                  {s.split(" ")[0]}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Train scene */}
      <div className="relative flex-1 min-h-0">
        {/* Smoke */}
        {smokeParticles.map(p => (
          <div key={p.id} className="absolute rounded-full pointer-events-none"
            style={{ left: p.x, top: trackY - 90 + p.y, width: p.size, height: p.size,
              background: `rgba(220,220,220,${p.opacity})` }} />
        ))}

        {/* Station markers on track */}
        {STATIONS.map((s, i) => {
          const containerWidth = containerRef.current?.offsetWidth || 800;
          const xPos = (i / (STATIONS.length - 1)) * (containerWidth - 80) + 40;
          return (
            <div key={i} className="absolute flex flex-col items-center" style={{ left: xPos, top: trackY - 50, transform: "translateX(-50%)" }}>
              <div className={`w-4 h-4 rounded-full border-2 transition-all ${
                i <= station ? "bg-green-400 border-green-600 shadow-lg shadow-green-400/50" : "bg-white/40 border-white/60"
              }`} />
              <div className="w-0.5 h-6 bg-white/30" />
            </div>
          );
        })}

        {/* Train */}
        <div className="absolute flex items-end" style={{ left: trainX, top: trackY - 75, transition: trainMoving ? "none" : "left 0.5s ease" }}
          onClick={() => playHornSound()}>
          <div className="flex items-end" style={{ direction: "ltr" }}>
            {Array.from({ length: wagonCount }).map((_, i) => (
              <img key={i} src={trainWagonImg} alt={`קרון ${i + 1}`}
                className="h-[60px] object-contain" style={{ marginRight: wagonGap }} draggable={false} />
            ))}
            <img src={trainLocomotiveImg} alt="קטר"
              className={`h-[75px] object-contain relative z-10 ${trainMoving ? "animate-pulse" : ""}`} draggable={false} />
          </div>
        </div>

        {/* Rails */}
        <div className="absolute left-0 right-0 h-3" style={{ top: trackY,
          background: "linear-gradient(to bottom, #8B7355 0%, #6B5B3E 40%, #4a3f2b 100%)", boxShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
          <div className="absolute inset-0 flex items-center">
            {Array.from({ length: 80 }).map((_, i) => (
              <div key={i} className="h-4 w-1.5 bg-amber-900/60 flex-shrink-0" style={{ marginLeft: i === 0 ? 0 : 14 }} />
            ))}
          </div>
        </div>

        {/* Ground */}
        <div className="absolute left-0 right-0 bottom-0" style={{ top: trackY + 3,
          background: "linear-gradient(to bottom, #4a7c3f 0%, #3d6b34 30%, #2d5227 100%)" }} />
      </div>

      {/* Question panel */}
      {currentQ && (
        <div className="relative z-20 bg-gradient-to-t from-white via-white to-white/95 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900/95 border-t-4 border-primary/20 px-4 pt-4 pb-6 space-y-3"
          dir="rtl">
          {/* Question */}
          <div className={`text-center transition-all duration-300 ${showFeedback ? "scale-95 opacity-70" : ""}`}>
            <p className="text-base sm:text-lg font-black text-foreground leading-relaxed">{currentQ.question}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              שאלה {currentQIndex + 1} מתוך {totalQuestions} • תחנה: {STATIONS[station]}
            </p>
          </div>

          {/* Options */}
          <div className={`grid gap-2 ${currentQ.options.length <= 2 ? "grid-cols-2" : "grid-cols-3"}`}>
            {currentQ.options.map((opt, i) => {
              const isSelected = selectedOption === i;
              const isCorrect = showFeedback && i === currentQ.correctIndex;
              const isWrong = showFeedback === "wrong" && isSelected;
              return (
                <button key={i} onClick={() => handleAnswer(i)}
                  disabled={!!showFeedback || trainMoving}
                  className={`rounded-2xl p-3 sm:p-4 flex flex-col items-center gap-1.5 font-bold text-sm transition-all active:scale-95 border-3 shadow-md ${
                    isCorrect ? "bg-green-100 border-green-400 scale-105 shadow-green-200 ring-4 ring-green-300/40 dark:bg-green-900/40" :
                    isWrong ? "bg-red-100 border-red-400 shake dark:bg-red-900/40" :
                    isSelected ? "border-primary bg-primary/10" :
                    "bg-card border-muted hover:border-primary/50 hover:shadow-lg hover:scale-[1.02]"
                  }`}
                  style={opt.color ? { backgroundColor: opt.color + "22", borderColor: opt.color } : {}}>
                  {opt.color && (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-inner border-2 border-white/50"
                      style={{ backgroundColor: opt.color }} />
                  )}
                  {opt.emoji && <span className="text-2xl sm:text-3xl">{opt.emoji}</span>}
                  <span className={`text-xs sm:text-sm ${opt.color ? "font-black" : ""}`}>{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Feedback overlay */}
          {showFeedback === "correct" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-6xl animate-bounce">✅</div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
        .shake { animation: shake 0.3s ease; }
      `}</style>
    </div>
  );
};

export default TrainGame;
