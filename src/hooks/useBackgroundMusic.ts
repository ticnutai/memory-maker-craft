import { useRef, useState, useCallback, useEffect } from "react";
import { MelodyInfo } from "@/lib/melodies";

export function useBackgroundMusic(melody?: MelodyInfo, customMusicUrl?: string, volume: number = 0.5) {
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const volumeRef = useRef(volume);

  // Update volume live
  useEffect(() => {
    volumeRef.current = volume;
    if (gainRef.current && ctxRef.current) {
      gainRef.current.gain.setValueAtTime(volume, ctxRef.current.currentTime);
    }
    if (audioElRef.current) {
      audioElRef.current.volume = volume;
    }
  }, [volume]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }

    if (gainRef.current && ctxRef.current) {
      try {
        gainRef.current.gain.cancelScheduledValues(ctxRef.current.currentTime);
        gainRef.current.gain.setValueAtTime(gainRef.current.gain.value || 0.5, ctxRef.current.currentTime);
        gainRef.current.gain.linearRampToValueAtTime(0.001, ctxRef.current.currentTime + 0.2);
      } catch {
        // ignore audio timing errors
      }
    }

    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.currentTime = 0;
      audioElRef.current = null;
    }

    setTimeout(() => {
      gainRef.current = null;
    }, 250);

    setIsPlaying(false);
  }, []);

  const scheduleLoop = useCallback(() => {
    const ctx = ctxRef.current;
    const gain = gainRef.current;
    if (!ctx || !gain || !melody) return;

    melody.notes.forEach(([freq, dur, delay]) => {
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
  }, [melody]);

  const startBuiltIn = useCallback(() => {
    if (!melody) return;

    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = ctxRef.current;
    if (ctx.state === "suspended") ctx.resume();

    if (!gainRef.current) {
      gainRef.current = ctx.createGain();
      gainRef.current.gain.setValueAtTime(volumeRef.current, ctx.currentTime);
      gainRef.current.connect(ctx.destination);
    }

    scheduleLoop();
    intervalRef.current = setInterval(scheduleLoop, melody.loopDuration * 1000);
  }, [melody, scheduleLoop]);

  const startCustom = useCallback(() => {
    if (!customMusicUrl) return;

    const audio = new Audio(customMusicUrl);
    audio.loop = true;
    audio.volume = volumeRef.current;
    audio.play().catch(() => {});
    audioElRef.current = audio;
  }, [customMusicUrl]);

  const start = useCallback(() => {
    stop();

    if (customMusicUrl) {
      startCustom();
      setIsPlaying(true);
      return;
    }

    if (melody) {
      startBuiltIn();
      setIsPlaying(true);
      return;
    }

    setIsPlaying(false);
  }, [customMusicUrl, melody, startBuiltIn, startCustom, stop]);

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

  return { isPlaying, start, toggle, stop };
}
