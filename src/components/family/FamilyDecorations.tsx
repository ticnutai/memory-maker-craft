import { useEffect, useState } from "react";
import { HEARTS_CONFIG_UPDATED_EVENT, loadHeartsConfig } from "@/lib/heartsDisplayConfig";

interface DecorationProps {
  type: "hearts" | "stars" | "leaves" | "confetti" | "dots" | "bubbles" | "butterflies" | "snow" | "petals" | "none";
}

const EMOJIS: Record<string, string[]> = {
  hearts: ["💕", "💗", "💖", "❤️", "🌸"],
  stars: ["⭐", "✨", "🌟", "💫"],
  leaves: ["🌿", "🍃", "🌱", "🌷"],
  confetti: ["🎉", "🎊", "✨", "🎈"],
  dots: ["•", "◦", "●"],
  bubbles: ["🫧", "💧", "🔵", "⚪"],
  butterflies: ["🦋", "✨", "🌼", "🍀"],
  snow: ["❄️", "☃️", "✨", "🌨️"],
  petals: ["🌸", "🌺", "🌷", "🍃"],
};

export default function FamilyDecorations({ type }: DecorationProps) {
  const [items, setItems] = useState<{ id: number; x: number; y: number; emoji: string; size: number; delay: number }[]>([]);
  const [animCfg, setAnimCfg] = useState(() => loadHeartsConfig());

  useEffect(() => {
    const sync = () => setAnimCfg(loadHeartsConfig());
    sync();
    window.addEventListener(HEARTS_CONFIG_UPDATED_EVENT, sync);
    return () => window.removeEventListener(HEARTS_CONFIG_UPDATED_EVENT, sync);
  }, []);

  useEffect(() => {
    const profile = animCfg.floatEnvironment === "theme" ? type : animCfg.floatEnvironment;
    if (profile === "none" || type === "none") { setItems([]); return; }

    const pool = EMOJIS[profile] ?? [];
    const densityScale = Math.min(2.5, Math.max(0.4, animCfg.floatDensityScale || 1));
    const sizeScale = Math.min(2, Math.max(0.5, animCfg.floatSizeScale || 1));
    const countBase = profile === "dots" ? 30 : 18;
    const count = Math.max(8, Math.round(countBase * densityScale));

    const generated = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      emoji: pool[i % pool.length],
      size: (profile === "dots" ? 8 + Math.random() * 8 : 14 + Math.random() * 14) * sizeScale,
      delay: Math.random() * 4,
    }));
    setItems(generated);
  }, [type, animCfg.floatEnvironment, animCfg.floatDensityScale, animCfg.floatSizeScale]);

  if (type === "none") return null;

  const reduceMotion = animCfg.reducedMotion;
  const speedScale = Math.min(2.5, Math.max(0.4, animCfg.floatSpeedScale || 1));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {items.map((it) => (
        <span
          key={it.id}
          className={`absolute opacity-30 ${reduceMotion ? "" : "animate-float"}`}
          style={{
            left: `${it.x}%`,
            top: `${it.y}%`,
            fontSize: `${it.size}px`,
            animationDelay: `${it.delay}s`,
            animationDuration: `${(6 + (it.id % 4)) / speedScale}s`,
          }}
        >
          {it.emoji}
        </span>
      ))}
    </div>
  );
}
