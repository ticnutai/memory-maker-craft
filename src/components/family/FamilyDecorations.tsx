import { useEffect, useState } from "react";

interface DecorationProps {
  type: "hearts" | "stars" | "leaves" | "confetti" | "dots" | "none";
}

const EMOJIS: Record<string, string[]> = {
  hearts: ["💕", "💗", "💖", "❤️", "🌸"],
  stars: ["⭐", "✨", "🌟", "💫"],
  leaves: ["🌿", "🍃", "🌱", "🌷"],
  confetti: ["🎉", "🎊", "✨", "🎈"],
  dots: ["•", "◦", "●"],
};

export default function FamilyDecorations({ type }: DecorationProps) {
  const [items, setItems] = useState<{ id: number; x: number; y: number; emoji: string; size: number; delay: number }[]>([]);

  useEffect(() => {
    if (type === "none") { setItems([]); return; }
    const pool = EMOJIS[type] ?? [];
    const count = type === "dots" ? 30 : 18;
    const generated = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      emoji: pool[i % pool.length],
      size: type === "dots" ? 8 + Math.random() * 8 : 14 + Math.random() * 14,
      delay: Math.random() * 4,
    }));
    setItems(generated);
  }, [type]);

  if (type === "none") return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {items.map((it) => (
        <span
          key={it.id}
          className="absolute opacity-30 animate-float"
          style={{
            left: `${it.x}%`,
            top: `${it.y}%`,
            fontSize: `${it.size}px`,
            animationDelay: `${it.delay}s`,
            animationDuration: `${6 + (it.id % 4)}s`,
          }}
        >
          {it.emoji}
        </span>
      ))}
    </div>
  );
}
