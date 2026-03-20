import { useRef, useState, useCallback, useEffect } from "react";

// Gentle pentatonic melody loop using Web Audio API
const MELODY_NOTES = [
  // freq, duration, delay
  [392, 0.4, 0],     // G4
  [440, 0.4, 0.5],   // A4
  [523, 0.6, 1.0],   // C5
  [440, 0.4, 1.7],   // A4
  [392, 0.6, 2.2],   // G4
  [330, 0.4, 2.9],   // E4
  [392, 0.8, 3.4],   // G4
  [440, 0.4, 4.3],   // A4
  [523, 0.4, 4.8],   // C5
  [587, 0.6, 5.3],   // D5
  [523, 0.4, 6.0],   // C5
  [440, 0.6, 6.5],   // A4
  [392, 0.8, 7.2],   // G4
] as const;

const LOOP_DURATION = 8.5; // seconds per loop cycle

export function useBackgroundMusic() {
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const [isPlaying, setIsPlaying] = useState(false);

  const scheduleLoop = useCallback(() => {
    const ctx = ctxRef.current;
    const gain = gainRef.current;
    if (!ctx || !gain) return;

    MELODY_NOTES.forEach(([freq, dur, delay]) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

      noteGain.gain.setValueAtTime(0, ctx.currentTime + delay);
      noteGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + delay + 0.05);
      noteGain.gain.setValueAtTime(0.12, ctx.currentTime + delay + dur * 0.6);
      noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);

      osc.connect(noteGain);
      noteGain.connect(gain);

      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + dur);
    });
  }, []);

  const start = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") ctx.resume();

    if (!gainRef.current) {
      gainRef.current = ctx.createGain();
      gainRef.current.gain.setValueAtTime(0.5, ctx.currentTime);
      gainRef.current.connect(ctx.destination);
    }

    scheduleLoop();
    intervalRef.current = setInterval(scheduleLoop, LOOP_DURATION * 1000);
    setIsPlaying(true);
  }, [scheduleLoop]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
    if (gainRef.current) {
      gainRef.current.gain.linearRampToValueAtTime(0.001, (ctxRef.current?.currentTime ?? 0) + 0.3);
    }
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) stop();
    else start();
  }, [isPlaying, start, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (ctxRef.current) {
        ctxRef.current.close().catch(() => {});
        ctxRef.current = null;
        gainRef.current = null;
      }
    };
  }, []);

  return { isPlaying, toggle, stop };
}