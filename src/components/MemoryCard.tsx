import { ThemeType, CardStyle } from "@/lib/gameData";
import { useState } from "react";

function isHexColor(s: string): boolean {
  return /^#[0-9a-fA-F]{6,8}$/.test(s);
}

interface MemoryCardProps {
  emoji: string;
  label?: string;
  image?: string;
  isFlipped: boolean;
  isMatched: boolean;
  theme: ThemeType;
  emojiScale: number;
  cardStyle: CardStyle;
  onClick: () => void;
}

export default function MemoryCard({ emoji, label, image, isFlipped, isMatched, theme, emojiScale, cardStyle, onClick }: MemoryCardProps) {
  const [justMatched, setJustMatched] = useState(false);

  // Detect match transition
  const prevMatchedRef = { current: isMatched };
  if (isMatched && !justMatched) {
    setJustMatched(true);
    setTimeout(() => setJustMatched(false), 800);
  }

  // Resolve border color
  const BORDER_PRESETS: Record<string, string> = {
    white: "#ffffff", black: "#1a1a2e", gold: "#d4a574",
    pink: "hsl(var(--game-pink))", blue: "hsl(var(--game-blue))", green: "#22c55e",
  };
  const borderColor = cardStyle.borderColor === "default"
    ? "hsl(var(--background))"
    : isHexColor(cardStyle.borderColor)
      ? cardStyle.borderColor
      : BORDER_PRESETS[cardStyle.borderColor] || "hsl(var(--background))";

  // Resolve back color (supports gradient)
  const getBackStyle = (): React.CSSProperties => {
    const c1 = cardStyle.backColor;
    const c2 = cardStyle.backColor2;

    if (c1 === "default" || !c1) {
      return {
        background: theme === "girl"
          ? "linear-gradient(135deg, hsl(var(--game-pink)), hsl(var(--primary)))"
          : "linear-gradient(135deg, hsl(var(--game-blue)), hsl(var(--secondary)))",
      };
    }

    if (isHexColor(c1)) {
      if (c2 && isHexColor(c2)) {
        return { background: `linear-gradient(135deg, ${c1}, ${c2})` };
      }
      return { backgroundColor: c1 };
    }

    return {};
  };

  const BACK_PRESET_MAP: Record<string, string> = {
    red: "from-red-400 to-rose-500",
    green: "from-emerald-400 to-green-500",
    purple: "from-purple-400 to-violet-500",
    orange: "from-orange-400 to-amber-500",
    cyan: "from-cyan-400 to-sky-500",
    gold: "from-yellow-400 to-amber-500",
  };

  const backStyle = getBackStyle();
  const hasInlineBack = Object.keys(backStyle).length > 0;
  const backColorClass = !hasInlineBack && cardStyle.backColor !== "default"
    ? `bg-gradient-to-br ${BACK_PRESET_MAP[cardStyle.backColor] || ""}`
    : "";

  const isLetter = emoji.length === 1 && /[\u0590-\u05FF]/.test(emoji);
  const baseFontSize = 3;
  const fontSize = baseFontSize * emojiScale;

  const borderStyle: React.CSSProperties = {
    borderRadius: `${cardStyle.borderRadius}px`,
    borderWidth: `${cardStyle.borderWidth}px`,
    borderStyle: "solid",
    borderColor: isMatched ? "hsl(var(--accent))" : borderColor,
  };

  return (
    <button
      onClick={onClick}
      disabled={isFlipped || isMatched}
      className={`card-flip w-full aspect-square group ${isMatched ? "matched-card" : ""} ${justMatched ? "sparkle-burst" : ""}`}
      aria-label={isFlipped ? (label || emoji) : "קלף הפוך"}
    >
      <div className={`card-flip-inner w-full h-full relative ${isFlipped ? "flipped" : ""}`}>
        {/* Front (back of card) */}
        <div
          className={`card-face ${backColorClass} flex items-center justify-center shadow-lg cursor-pointer card-hover-effect`}
          style={{ ...borderStyle, borderColor: borderColor, ...backStyle }}
        >
          <span className="text-2xl sm:text-3xl md:text-4xl opacity-80 drop-shadow-sm back-icon-pulse">{cardStyle.backIcon}</span>
        </div>
        {/* Back (card face with emoji) */}
        <div
          className={`card-face card-face-back bg-card flex flex-col items-center justify-center shadow-lg transition-colors duration-300 ${isMatched ? "bg-accent/5 matched-glow" : ""}`}
          style={borderStyle}
        >
          {image ? (
            <div className={`w-full h-full relative overflow-hidden ${isFlipped && !isMatched ? "image-reveal" : ""} ${isMatched ? "image-matched" : ""}`} style={{ borderRadius: `${Math.max(0, cardStyle.borderRadius - cardStyle.borderWidth)}px` }}>
              <img src={image} alt={label || ""} className="w-full h-full object-cover" loading="lazy" />
              {isMatched && <div className="gold-frame-overlay" style={{ borderRadius: `${Math.max(0, cardStyle.borderRadius - cardStyle.borderWidth)}px` }} />}
            </div>
          ) : isLetter ? (
            <div className="flex flex-col items-center gap-0.5">
              <span className={`select-none font-black ${isFlipped && !isMatched ? "emoji-reveal" : ""}`} style={{ fontSize: `${fontSize}rem`, lineHeight: 1.1 }}>
                {emoji}
              </span>
              {label && <span className="text-xs sm:text-sm text-muted-foreground font-medium">{label}</span>}
            </div>
          ) : (
            <span className={`select-none drop-shadow-sm ${isFlipped && !isMatched ? "emoji-reveal" : ""}`} style={{ fontSize: `${fontSize}rem`, lineHeight: 1.1 }}>
              {emoji}
            </span>
          )}
          {isMatched && (
            <span className="absolute bottom-1 left-1 text-lg opacity-60 pointer-events-none match-checkmark">✓</span>
          )}
          {/* Sparkle particles on match */}
          {justMatched && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ borderRadius: `${cardStyle.borderRadius}px` }}>
              {[...Array(8)].map((_, i) => (
                <span
                  key={i}
                  className="absolute sparkle-particle"
                  style={{
                    left: `${10 + (i * 11) % 80}%`,
                    top: `${10 + (i * 13) % 80}%`,
                    animationDelay: `${i * 0.06}s`,
                    fontSize: `${10 + (i % 3) * 4}px`,
                  }}
                >
                  {["✨", "⭐", "💫", "🌟"][i % 4]}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
