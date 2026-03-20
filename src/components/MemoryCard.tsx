import { ThemeType, CardStyle } from "@/lib/gameData";

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

    // Fallback to preset Tailwind classes handled via className
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
    borderColor: borderColor,
  };

  return (
    <button
      onClick={onClick}
      disabled={isFlipped || isMatched}
      className={`card-flip w-full aspect-square ${isMatched ? "matched-card" : ""}`}
      aria-label={isFlipped ? (label || emoji) : "קלף הפוך"}
    >
      <div className={`card-flip-inner w-full h-full relative ${isFlipped ? "flipped" : ""}`}>
        <div
          className={`card-face ${backColorClass} flex items-center justify-center shadow-lg cursor-pointer hover:brightness-110 hover:scale-[1.03] transition-all duration-200`}
          style={{ ...borderStyle, ...backStyle }}
        >
          <span className="text-3xl sm:text-4xl opacity-80 drop-shadow-sm">{cardStyle.backIcon}</span>
        </div>
        <div
          className={`card-face card-face-back bg-card flex flex-col items-center justify-center shadow-lg transition-colors duration-300 ${isMatched ? "bg-accent/5" : ""}`}
          style={{
            ...borderStyle,
            borderColor: isMatched ? "hsl(var(--accent))" : borderColor,
          }}
        >
          {image ? (
            <img src={image} alt="" className="w-full h-full object-cover" style={{ borderRadius: `${Math.max(0, cardStyle.borderRadius - cardStyle.borderWidth)}px` }} />
          ) : isLetter ? (
            <div className="flex flex-col items-center gap-0.5">
              <span className="select-none font-black" style={{ fontSize: `${fontSize}rem`, lineHeight: 1.1 }}>
                {emoji}
              </span>
              {label && <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">{label}</span>}
            </div>
          ) : (
            <span className="select-none drop-shadow-sm" style={{ fontSize: `${fontSize}rem`, lineHeight: 1.1 }}>
              {emoji}
            </span>
          )}
          {isMatched && (
            <span className="absolute bottom-1 left-1 text-lg opacity-60 pointer-events-none">✓</span>
          )}
        </div>
      </div>
    </button>
  );
}
