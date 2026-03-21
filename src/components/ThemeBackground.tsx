import React, { useState, useEffect } from "react";

export type BgThemeId = "default" | "clouds" | "stars" | "princess" | "ocean" | "candy" | "forest" | "bubbles" 
  | "rainbow" | "dolls" | "safari" | "space" | "flowers" | "dinosaurs" | "ice-cream" | "balloons" | "farm" | "circus" | "butterflies" | "trains"
  | "hearts" | "unicorn-land" | "mermaid" | "fairy-garden" | "baby-pink" | "lollipop" | "teddy-bears" | "magical-night" | "cupcakes" | "sparkle-party";

export interface BgThemeDef {
  id: BgThemeId;
  label: string;
  emoji: string;
  bg: string;
  pattern: React.CSSProperties;
  overlay?: string;
  animated?: boolean; // has extra animations
}

const THEMES: BgThemeDef[] = [
  { id: "default", label: "רגיל", emoji: "🎨", bg: "transparent", pattern: {} },
  {
    id: "hearts", label: "לבבות", emoji: "💖",
    bg: "linear-gradient(135deg, #fce4ec 0%, #f8bbd0 25%, #ff80ab 50%, #f8bbd0 75%, #fce4ec 100%)",
    pattern: {}, overlay: "hearts", animated: true,
  },
  {
    id: "unicorn-land", label: "חד קרן", emoji: "🦄",
    bg: "linear-gradient(135deg, #f3e5f5 0%, #e1bee7 20%, #f8bbd0 40%, #bbdefb 60%, #b2dfdb 80%, #fff9c4 100%)",
    pattern: {}, overlay: "unicorn-land", animated: true,
  },
  {
    id: "princess", label: "נסיכות", emoji: "👑",
    bg: "linear-gradient(135deg, #fce4ec 0%, #f8bbd0 30%, #f48fb1 60%, #f8bbd0 100%)",
    pattern: {}, overlay: "sparkles", animated: true,
  },
  {
    id: "mermaid", label: "בת ים", emoji: "🧜‍♀️",
    bg: "linear-gradient(135deg, #e0f7fa 0%, #80deea 25%, #b2ebf2 50%, #e1bee7 75%, #f8bbd0 100%)",
    pattern: {}, overlay: "mermaid", animated: true,
  },
  {
    id: "fairy-garden", label: "גן פיות", emoji: "🧚",
    bg: "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 20%, #f3e5f5 50%, #fce4ec 80%, #fff9c4 100%)",
    pattern: {}, overlay: "fairy-garden", animated: true,
  },
  {
    id: "baby-pink", label: "ורוד בייבי", emoji: "🎀",
    bg: "linear-gradient(180deg, #fce4ec 0%, #f8bbd0 30%, #f48fb1 60%, #f8bbd0 85%, #fce4ec 100%)",
    pattern: {}, overlay: "baby-pink", animated: true,
  },
  {
    id: "sparkle-party", label: "מסיבת נצנוץ", emoji: "🪩",
    bg: "linear-gradient(135deg, #f3e5f5 0%, #e8eaf6 25%, #ede7f6 50%, #fce4ec 75%, #fff8e1 100%)",
    pattern: {}, overlay: "sparkle-party", animated: true,
  },
  {
    id: "cupcakes", label: "קאפקייקס", emoji: "🧁",
    bg: "linear-gradient(135deg, #fce4ec 0%, #fff3e0 30%, #f8bbd0 60%, #fff9c4 100%)",
    pattern: {}, overlay: "cupcakes", animated: true,
  },
  {
    id: "teddy-bears", label: "דובונים", emoji: "🧸",
    bg: "linear-gradient(135deg, #fff3e0 0%, #ffe0b2 30%, #ffccbc 60%, #fce4ec 100%)",
    pattern: {}, overlay: "teddy-bears", animated: true,
  },
  {
    id: "lollipop", label: "סוכריה", emoji: "🍭",
    bg: "linear-gradient(135deg, #ff80ab 0%, #ffab91 20%, #fff176 40%, #aed581 60%, #81d4fa 80%, #ce93d8 100%)",
    pattern: {}, overlay: "lollipop", animated: true,
  },
  {
    id: "magical-night", label: "לילה קסום", emoji: "🌙",
    bg: "linear-gradient(180deg, #1a1a3e 0%, #2d2b55 30%, #4a3f8a 60%, #6c5ce7 85%, #a29bfe 100%)",
    pattern: {}, overlay: "magical-night", animated: true,
  },
  { id: "clouds", label: "עננים", emoji: "☁️", bg: "linear-gradient(180deg, #a8c8f0 0%, #c7ddf7 40%, #e8f0fc 100%)", pattern: {}, overlay: "clouds" },
  { id: "stars", label: "כוכבים", emoji: "⭐", bg: "linear-gradient(180deg, #1a1a3e 0%, #2d2b55 50%, #3b2d6e 100%)", pattern: {}, overlay: "stars", animated: true },
  { id: "ocean", label: "ים", emoji: "🐠", bg: "linear-gradient(180deg, #e0f7fa 0%, #80deea 40%, #4dd0e1 70%, #26c6da 100%)", pattern: {}, overlay: "waves" },
  { id: "candy", label: "ממתקים", emoji: "🍭", bg: "linear-gradient(135deg, #fff9c4 0%, #ffe0b2 25%, #ffccbc 50%, #f8bbd0 75%, #e1bee7 100%)", pattern: {}, overlay: "confetti-dots" },
  { id: "forest", label: "יער", emoji: "🌿", bg: "linear-gradient(180deg, #e8f5e9 0%, #c8e6c9 40%, #a5d6a7 70%, #81c784 100%)", pattern: {}, overlay: "leaves" },
  { id: "bubbles", label: "בועות", emoji: "🫧", bg: "linear-gradient(180deg, #ede7f6 0%, #d1c4e9 50%, #b39ddb 100%)", pattern: {}, overlay: "bubbles", animated: true },
  { id: "rainbow", label: "קשת", emoji: "🌈", bg: "linear-gradient(135deg, #ffcdd2 0%, #ffe0b2 17%, #fff9c4 33%, #c8e6c9 50%, #b3e5fc 67%, #d1c4e9 83%, #f8bbd0 100%)", pattern: {}, overlay: "rainbow", animated: true },
  { id: "dolls", label: "בובות", emoji: "🧸", bg: "linear-gradient(135deg, #fce4ec 0%, #fff3e0 40%, #fce4ec 70%, #f3e5f5 100%)", pattern: {}, overlay: "dolls" },
  { id: "safari", label: "ספארי", emoji: "🦁", bg: "linear-gradient(180deg, #fff8e1 0%, #ffecb3 30%, #ffe082 60%, #f9d976 100%)", pattern: {}, overlay: "safari" },
  { id: "space", label: "חלל", emoji: "🚀", bg: "linear-gradient(180deg, #0d1b2a 0%, #1b2838 40%, #233145 70%, #2a3a52 100%)", pattern: {}, overlay: "space", animated: true },
  { id: "flowers", label: "פרחים", emoji: "🌸", bg: "linear-gradient(135deg, #fce4ec 0%, #f8bbd0 25%, #f3e5f5 50%, #e8f5e9 75%, #fff9c4 100%)", pattern: {}, overlay: "flowers", animated: true },
  { id: "dinosaurs", label: "דינוזאורים", emoji: "🦕", bg: "linear-gradient(180deg, #e8f5e9 0%, #c8e6c9 35%, #a5d6a7 65%, #dcedc8 100%)", pattern: {}, overlay: "dinosaurs" },
  { id: "ice-cream", label: "גלידה", emoji: "🍦", bg: "linear-gradient(135deg, #fce4ec 0%, #f8bbd0 20%, #fff9c4 40%, #b3e5fc 60%, #c8e6c9 80%, #e1bee7 100%)", pattern: {}, overlay: "ice-cream" },
  { id: "balloons", label: "בלונים", emoji: "🎈", bg: "linear-gradient(180deg, #e3f2fd 0%, #bbdefb 40%, #e8eaf6 70%, #f3e5f5 100%)", pattern: {}, overlay: "balloons", animated: true },
  { id: "farm", label: "חווה", emoji: "🐄", bg: "linear-gradient(180deg, #e3f2fd 0%, #c8e6c9 40%, #a5d6a7 70%, #8bc34a33 100%)", pattern: {}, overlay: "farm" },
  { id: "circus", label: "קרקס", emoji: "🎪", bg: "linear-gradient(135deg, #ffcdd2 0%, #fff9c4 25%, #b3e5fc 50%, #c8e6c9 75%, #e1bee7 100%)", pattern: {}, overlay: "circus" },
  { id: "butterflies", label: "פרפרים", emoji: "🦋", bg: "linear-gradient(135deg, #f3e5f5 0%, #e1bee7 30%, #f8bbd0 60%, #fce4ec 100%)", pattern: {}, overlay: "butterflies", animated: true },
  { id: "trains", label: "רכבות", emoji: "🚂", bg: "linear-gradient(180deg, #e3f2fd 0%, #bbdefb 35%, #90caf9 65%, #e8eaf6 100%)", pattern: {}, overlay: "trains" },
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
  sparkles: ["👑", "💎", "🦋", "🌸", "💖", "✨", "🎀", "🌺", "💗", "👸"],
  waves: ["🐠", "🐚", "🌊", "🐙", "🐬", "🐡", "⭐", "🦀"],
  "confetti-dots": ["🍬", "🍭", "🧁", "🍩", "🍪", "🎂", "🍰", "🍡"],
  leaves: ["🌿", "🍀", "🌻", "🐛", "🦋", "🌼", "🍄", "🐞"],
  bubbles: ["🫧", "🔮", "💜", "🦄", "🫧", "💫", "🔮", "💜"],
  rainbow: ["🌈", "⭐", "☁️", "🦄", "💖", "🌟", "🎀", "✨", "💫", "🌸"],
  dolls: ["🧸", "🎀", "👶", "🍼", "🧩", "🎁", "💝", "🪆", "🐻", "👗"],
  safari: ["🦁", "🐘", "🦒", "🐵", "🦓", "🐆", "🌴", "🦜", "🐾", "🌺"],
  space: ["🚀", "🌍", "🌙", "⭐", "🛸", "👽", "🪐", "💫", "☄️", "🌟"],
  flowers: ["🌸", "🌺", "🌻", "🌹", "🌷", "💐", "🌼", "🦋", "🐝", "🌿"],
  dinosaurs: ["🦕", "🦖", "🌋", "🥚", "🌿", "🦴", "🐾", "☄️", "🌴", "🪨"],
  "ice-cream": ["🍦", "🍧", "🍨", "🧁", "🍰", "🎂", "🍬", "🍭", "🌈", "⭐"],
  balloons: ["🎈", "🎉", "🎊", "🎁", "🎀", "🎈", "💖", "⭐", "🎈", "✨"],
  farm: ["🐄", "🐔", "🐷", "🐴", "🐑", "🐓", "🌾", "🌻", "🚜", "🐶"],
  circus: ["🎪", "🤡", "🎭", "🎈", "🎉", "🎠", "🦁", "🐘", "⭐", "🎩"],
  butterflies: ["🦋", "🌸", "💜", "💖", "🌺", "✨", "🦋", "🌷", "💫", "🌿"],
  trains: ["🚂", "🚃", "🚄", "🛤️", "🚦", "🏔️", "🌳", "🏠", "⭐", "💨"],
  // New overlays
  hearts: ["💖", "💗", "💕", "❤️", "💜", "💙", "🩷", "💝", "❣️", "🤍", "💖", "💗", "❤️", "💕"],
  "unicorn-land": ["🦄", "🌈", "⭐", "💖", "✨", "🌸", "💫", "🎀", "🌟", "🦋", "💜", "🍬"],
  mermaid: ["🧜‍♀️", "🐚", "🌊", "✨", "🐠", "💜", "⭐", "🦀", "💎", "🫧", "🐬", "💗"],
  "fairy-garden": ["🧚", "🌸", "🦋", "✨", "🌺", "🍄", "💫", "🌿", "💖", "🌼", "🐞", "⭐"],
  "baby-pink": ["🎀", "💗", "🌸", "👶", "🍼", "🧸", "💕", "🩷", "✨", "💖", "🌷", "🎀"],
  "sparkle-party": ["✨", "🪩", "💫", "⭐", "🌟", "💎", "🎉", "💖", "🎊", "✨", "💗", "⭐"],
  cupcakes: ["🧁", "🎂", "🍰", "🍬", "🍭", "🎀", "💖", "✨", "🌸", "🍩", "🍪", "💗"],
  "teddy-bears": ["🧸", "🐻", "🎀", "💝", "🍼", "👶", "💖", "🌟", "🐾", "✨", "🧸", "💗"],
  lollipop: ["🍭", "🍬", "🌈", "⭐", "💖", "✨", "🍡", "🎀", "💗", "🌟", "🍭", "💫"],
  "magical-night": ["🌙", "⭐", "✨", "🌟", "💫", "🦉", "🔮", "💜", "🌠", "🪄", "🧚", "💎"],
};

// Different animation types for variety
type AnimationType = "float" | "rise" | "drift" | "pulse-float" | "spiral" | "sway";

function getAnimationForTheme(overlay: string): AnimationType[] {
  const animatedOverlays: Record<string, AnimationType[]> = {
    hearts: ["rise", "sway", "pulse-float", "drift"],
    "unicorn-land": ["float", "spiral", "drift", "sway"],
    sparkles: ["pulse-float", "spiral", "float", "rise"],
    mermaid: ["drift", "sway", "float", "rise"],
    "fairy-garden": ["spiral", "float", "sway", "pulse-float"],
    "baby-pink": ["sway", "pulse-float", "float", "rise"],
    "sparkle-party": ["pulse-float", "spiral", "rise", "drift"],
    cupcakes: ["sway", "float", "drift", "rise"],
    "teddy-bears": ["float", "sway", "pulse-float", "drift"],
    lollipop: ["spiral", "sway", "drift", "rise"],
    "magical-night": ["rise", "pulse-float", "spiral", "float"],
    stars: ["pulse-float", "float", "spiral", "rise"],
    bubbles: ["rise", "sway", "float", "drift"],
    rainbow: ["drift", "sway", "float", "spiral"],
    flowers: ["sway", "float", "pulse-float", "drift"],
    balloons: ["rise", "sway", "float", "drift"],
    butterflies: ["spiral", "sway", "drift", "float"],
    space: ["float", "drift", "spiral", "pulse-float"],
  };
  return animatedOverlays[overlay] || ["float"];
}

function getAnimationCSS(type: AnimationType, duration: number, delay: number): string {
  switch (type) {
    case "float": return `floatBg ${duration}s ease-in-out ${delay}s infinite alternate`;
    case "rise": return `riseUp ${duration}s linear ${delay}s infinite`;
    case "drift": return `driftAcross ${duration}s ease-in-out ${delay}s infinite alternate`;
    case "pulse-float": return `pulseFloat ${duration}s ease-in-out ${delay}s infinite`;
    case "spiral": return `spiralFloat ${duration}s ease-in-out ${delay}s infinite alternate`;
    case "sway": return `swayFloat ${duration}s ease-in-out ${delay}s infinite alternate`;
  }
}

interface ThemeBackgroundProps {
  themeId: BgThemeId;
  children: React.ReactNode;
  className?: string;
  girlTheme?: boolean;
  animationsEnabled?: boolean;
}

export default function ThemeBackground({ themeId, children, className = "", girlTheme, animationsEnabled = true }: ThemeBackgroundProps) {
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
  const isAnimatedTheme = theme.animated && animationsEnabled;
  const animTypes: AnimationType[] = theme.overlay ? getAnimationForTheme(theme.overlay) : ["float" as AnimationType];

  // More items for animated themes
  const itemCount = isAnimatedTheme ? Math.min(floatItems.length * 2, 24) : floatItems.length;

  return (
    <div
      className={`min-h-screen relative overflow-hidden ${className}`}
      style={{ background: theme.bg }}
    >
      {/* Floating decorations */}
      {floatItems.length > 0 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {Array.from({ length: itemCount }).map((_, i) => {
            const item = floatItems[i % floatItems.length];
            const size = isAnimatedTheme ? (14 + (i % 5) * 8) : (16 + (i % 3) * 8);
            const left = (i * 13.7 + (i > floatItems.length ? 7 : 0)) % 95;
            const top = (i * 17.3 + 5 + (i > floatItems.length ? 12 : 0)) % 95;
            const delay = i * (isAnimatedTheme ? 0.8 : 1.2);
            const duration = isAnimatedTheme ? (6 + (i % 5) * 2) : (8 + (i % 4) * 3);
            const animType: AnimationType = animTypes[i % animTypes.length];
            const anim = isAnimatedTheme
              ? getAnimationCSS(animType, duration, delay)
              : `floatBg ${duration}s ease-in-out ${delay}s infinite alternate`;

            return (
              <span
                key={i}
                className="absolute select-none"
                style={{
                  fontSize: `${size}px`,
                  left: `${left}%`,
                  top: animType === "rise" && isAnimatedTheme ? "105%" : `${top}%`,
                  opacity: isAnimatedTheme ? (0.25 + (i % 4) * 0.1) : (0.2 + (i % 3) * 0.1),
                  animation: anim,
                  filter: isAnimatedTheme && i % 3 === 0 ? "drop-shadow(0 0 4px rgba(255,182,193,0.5))" : undefined,
                }}
              >
                {item}
              </span>
            );
          })}
        </div>
      )}

      {/* Gradient shimmer overlay for animated themes */}
      {isAnimatedTheme && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)",
            backgroundSize: "200% 200%",
            animation: "shimmerOverlay 6s ease-in-out infinite",
          }}
          aria-hidden="true"
        />
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
