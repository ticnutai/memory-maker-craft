import React from "react";

export type BgThemeId = "default" | "clouds" | "stars" | "princess" | "ocean" | "candy" | "forest" | "bubbles";

export interface BgThemeDef {
  id: BgThemeId;
  label: string;
  emoji: string;
  bg: string;
  pattern: React.CSSProperties;
  overlay?: string;
}

const THEMES: BgThemeDef[] = [
  {
    id: "default",
    label: "רגיל",
    emoji: "🎨",
    bg: "transparent",
    pattern: {},
  },
  {
    id: "clouds",
    label: "עננים",
    emoji: "☁️",
    bg: "linear-gradient(180deg, #a8c8f0 0%, #c7ddf7 40%, #e8f0fc 100%)",
    pattern: {},
    overlay: "clouds",
  },
  {
    id: "stars",
    label: "כוכבים",
    emoji: "⭐",
    bg: "linear-gradient(180deg, #1a1a3e 0%, #2d2b55 50%, #3b2d6e 100%)",
    pattern: {},
    overlay: "stars",
  },
  {
    id: "princess",
    label: "נסיכות",
    emoji: "👑",
    bg: "linear-gradient(135deg, #fce4ec 0%, #f8bbd0 30%, #f48fb1 60%, #f8bbd0 100%)",
    pattern: {},
    overlay: "sparkles",
  },
  {
    id: "ocean",
    label: "ים",
    emoji: "🐠",
    bg: "linear-gradient(180deg, #e0f7fa 0%, #80deea 40%, #4dd0e1 70%, #26c6da 100%)",
    pattern: {},
    overlay: "waves",
  },
  {
    id: "candy",
    label: "ממתקים",
    emoji: "🍭",
    bg: "linear-gradient(135deg, #fff9c4 0%, #ffe0b2 25%, #ffccbc 50%, #f8bbd0 75%, #e1bee7 100%)",
    pattern: {},
    overlay: "confetti-dots",
  },
  {
    id: "forest",
    label: "יער",
    emoji: "🌿",
    bg: "linear-gradient(180deg, #e8f5e9 0%, #c8e6c9 40%, #a5d6a7 70%, #81c784 100%)",
    pattern: {},
    overlay: "leaves",
  },
  {
    id: "bubbles",
    label: "בועות",
    emoji: "🫧",
    bg: "linear-gradient(180deg, #ede7f6 0%, #d1c4e9 50%, #b39ddb 100%)",
    pattern: {},
    overlay: "bubbles",
  },
];

export function getBgThemes(): BgThemeDef[] {
  return THEMES;
}

export function getBgTheme(id: BgThemeId): BgThemeDef {
  return THEMES.find(t => t.id === id) || THEMES[0];
}

// Floating elements for overlays
const FLOAT_ITEMS: Record<string, string[]> = {
  clouds: ["☁️", "🌤️", "☁️", "💭", "☁️", "🌥️"],
  stars: ["⭐", "✨", "🌟", "💫", "⭐", "✨", "🌙", "💫"],
  sparkles: ["👑", "💎", "🦋", "🌸", "💖", "✨", "🎀", "🌺"],
  waves: ["🐠", "🐚", "🌊", "🐙", "🐬", "🐡", "⭐", "🦀"],
  "confetti-dots": ["🍬", "🍭", "🧁", "🍩", "🍪", "🎂", "🍰", "🍡"],
  leaves: ["🌿", "🍀", "🌻", "🐛", "🦋", "🌼", "🍄", "🐞"],
  bubbles: ["🫧", "🔮", "💜", "🦄", "🫧", "💫", "🔮", "💜"],
};

interface ThemeBackgroundProps {
  themeId: BgThemeId;
  children: React.ReactNode;
  className?: string;
  girlTheme?: boolean;
}

export default function ThemeBackground({ themeId, children, className = "", girlTheme }: ThemeBackgroundProps) {
  const theme = getBgTheme(themeId);

  if (themeId === "default") {
    const bgClass = girlTheme !== undefined
      ? girlTheme
        ? "from-game-pink/10 to-background"
        : "from-game-blue/10 to-background"
      : "";
    return (
      <div className={`min-h-screen ${bgClass ? `bg-gradient-to-b ${bgClass}` : ""} ${className}`}>
        {children}
      </div>
    );
  }

  const floatItems = theme.overlay ? FLOAT_ITEMS[theme.overlay] || [] : [];

  return (
    <div
      className={`min-h-screen relative overflow-hidden ${className}`}
      style={{ background: theme.bg }}
    >
      {/* Floating decorations */}
      {floatItems.length > 0 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {floatItems.map((item, i) => {
            const size = 16 + (i % 3) * 8;
            const left = (i * 13.7) % 95;
            const top = (i * 17.3 + 5) % 90;
            const delay = i * 1.2;
            const duration = 8 + (i % 4) * 3;
            return (
              <span
                key={i}
                className="absolute select-none"
                style={{
                  fontSize: `${size}px`,
                  left: `${left}%`,
                  top: `${top}%`,
                  opacity: 0.2 + (i % 3) * 0.1,
                  animation: `floatBg ${duration}s ease-in-out ${delay}s infinite alternate`,
                }}
              >
                {item}
              </span>
            );
          })}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
