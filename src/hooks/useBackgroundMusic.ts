import { useRef, useState, useCallback, useEffect } from "react";

// Gentle pentatonic melody loop using Web Audio API
const MELODY_NOTES = [
  [392, 0.4, 0], [440, 0.4, 0.5], [523, 0.6, 1.0], [440, 0.4, 1.7],
  [392, 0.6, 2.2], [330, 0.4, 2.9], [392, 0.8, 3.4], [440, 0.4, 4.3],
  [523, 0.4, 4.8], [587, 0.6, 5.3], [523, 0.4, 6.0], [440, 0.6, 6.5],
  [392, 0.8, 7.2],
] as const;

const LOOP_DURATION = 8.5;

export function useBackgroundMusic(customMusicUrl?: string) {
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const audioElRef = useRef<HTMLAudioElement | null>(null);
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

  const startBuiltIn = useCallback(() => {
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
  }, [scheduleLoop]);

  const startCustom = useCallback(() => {
    if (!customMusicUrl) return;
    const audio = new Audio(customMusicUrl);
    audio.loop = true;
    audio.volume = 0.5;
    audio.play().catch(() => {});
    audioElRef.current = audio;
  }, [customMusicUrl]);

  const start = useCallback(() => {
    if (customMusicUrl) {
      startCustom();
    } else {
      startBuiltIn();
    }
    setIsPlaying(true);
  }, [customMusicUrl, startCustom, startBuiltIn]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
    if (gainRef.current && ctxRef.current) {
      gainRef.current.gain.linearRampToValueAtTime(0.001, ctxRef.current.currentTime + 0.3);
    }
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.currentTime = 0;
      audioElRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) stop();
    else start();
  }, [isPlaying, start, stop]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (audioElRef.current) {
        audioElRef.current.pause();
        audioElRef.current = null;
      }
      if (ctxRef.current) {
        ctxRef.current.close().catch(() => {});
        ctxRef.current = null;
        gainRef.current = null;
      }
    };
  }, []);

  return { isPlaying, toggle, stop };
}