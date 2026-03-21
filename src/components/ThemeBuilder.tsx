import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getBgThemes, BgThemeDef } from "@/components/ThemeBackground";
import { Copy, Edit3, Plus, Trash2, Save, X, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

// Theme config interface
export interface CustomThemeConfig {
  bgType: "gradient" | "solid";
  bgColor1: string;
  bgColor2: string;
  bgColor3: string;
  gradientAngle: number;
  floatingEmojis: string[];
  emojiCount: number;
  emojiMinSize: number;
  emojiMaxSize: number;
  emojiOpacity: number;
  animationStyle: "float" | "rise" | "drift" | "pulse-float" | "spiral" | "sway";
  animationSpeed: number; // multiplier
  animated: boolean;
  shimmer: boolean;
  shimmerOpacity: number;
}

const DEFAULT_CONFIG: CustomThemeConfig = {
  bgType: "gradient",
  bgColor1: "#fce4ec",
  bgColor2: "#f8bbd0",
  bgColor3: "#f3e5f5",
  gradientAngle: 135,
  floatingEmojis: ["⭐", "✨", "💖"],
  emojiCount: 12,
  emojiMinSize: 14,
  emojiMaxSize: 36,
  emojiOpacity: 0.3,
  animationStyle: "float",
  animationSpeed: 1,
  animated: true,
  shimmer: true,
  shimmerOpacity: 0.08,
};

interface CustomThemeRow {
  id: string;
  device_id: string;
  name: string;
  emoji: string;
  config: CustomThemeConfig;
  created_at: string;
  updated_at: string;
}

const EMOJI_PALETTE = [
  "⭐", "✨", "💖", "💗", "💕", "🌸", "🌺", "🦋", "🎀", "🌈",
  "🦄", "🧚", "🐚", "🫧", "🔮", "💎", "🌟", "💫", "🧸", "🎈",
  "🍭", "🧁", "🌙", "☁️", "🐠", "🌻", "🌿", "🦁", "🚀", "🎪",
  "❤️", "💜", "💙", "🩷", "🤍", "🌷", "🍬", "🎂", "🐾", "🪩",
];

const ANIM_STYLES: { id: CustomThemeConfig["animationStyle"]; label: string; emoji: string }[] = [
  { id: "float", label: "ציפה", emoji: "🪶" },
  { id: "rise", label: "עלייה", emoji: "🎈" },
  { id: "drift", label: "סחיפה", emoji: "🍃" },
  { id: "pulse-float", label: "פעימה", emoji: "💓" },
  { id: "spiral", label: "ספירלה", emoji: "🌀" },
  { id: "sway", label: "נדנוד", emoji: "🎐" },
];

function getDeviceId(): string {
  const key = "memory-game-device-id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

function configToBg(config: CustomThemeConfig): string {
  if (config.bgType === "solid") return config.bgColor1;
  return `linear-gradient(${config.gradientAngle}deg, ${config.bgColor1} 0%, ${config.bgColor2} 50%, ${config.bgColor3} 100%)`;
}

interface ThemeBuilderProps {
  selectedThemeId: string;
  onSelectTheme: (id: string) => void;
}

export default function ThemeBuilder({ selectedThemeId, onSelectTheme }: ThemeBuilderProps) {
  const [customThemes, setCustomThemes] = useState<CustomThemeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmoji, setEditEmoji] = useState("🎨");
  const [editConfig, setEditConfig] = useState<CustomThemeConfig>({ ...DEFAULT_CONFIG });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string>("background");
  const deviceId = getDeviceId();

  const builtinThemes = getBgThemes();

  const loadThemes = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("custom_bg_themes")
      .select("*")
      .eq("device_id", deviceId)
      .order("created_at", { ascending: false });
    setCustomThemes((data || []) as unknown as CustomThemeRow[]);
    setLoading(false);
  }, [deviceId]);

  useEffect(() => { loadThemes(); }, [loadThemes]);

  const openEditor = (theme?: CustomThemeRow) => {
    if (theme) {
      setEditingId(theme.id);
      setEditName(theme.name);
      setEditEmoji(theme.emoji);
      setEditConfig({ ...DEFAULT_CONFIG, ...(theme.config as CustomThemeConfig) });
    } else {
      setEditingId(null);
      setEditName("ערכה חדשה");
      setEditEmoji("🎨");
      setEditConfig({ ...DEFAULT_CONFIG });
    }
    setEditorOpen(true);
  };

  const duplicateBuiltin = (bt: BgThemeDef) => {
    // Parse the builtin theme into our config format
    const config: CustomThemeConfig = { ...DEFAULT_CONFIG };
    // Try to extract colors from the gradient
    const colorMatches = bt.bg.match(/#[0-9a-fA-F]{6}/g);
    if (colorMatches) {
      config.bgColor1 = colorMatches[0] || "#fce4ec";
      config.bgColor2 = colorMatches[Math.floor(colorMatches.length / 2)] || "#f8bbd0";
      config.bgColor3 = colorMatches[colorMatches.length - 1] || "#f3e5f5";
    }
    const angleMatch = bt.bg.match(/(\d+)deg/);
    if (angleMatch) config.gradientAngle = parseInt(angleMatch[1]);
    config.animated = !!bt.animated;
    
    setEditingId(null);
    setEditName(`${bt.label} (עותק)`);
    setEditEmoji(bt.emoji);
    setEditConfig(config);
    setEditorOpen(true);
  };

  const duplicateCustom = (theme: CustomThemeRow) => {
    setEditingId(null);
    setEditName(`${theme.name} (עותק)`);
    setEditEmoji(theme.emoji);
    setEditConfig({ ...DEFAULT_CONFIG, ...(theme.config as CustomThemeConfig) });
    setEditorOpen(true);
  };

  const saveTheme = async () => {
    if (editingId) {
      await supabase.from("custom_bg_themes").update({
        name: editName,
        emoji: editEmoji,
        config: editConfig as any,
        updated_at: new Date().toISOString(),
      }).eq("id", editingId);
    } else {
      await supabase.from("custom_bg_themes").insert({
        device_id: deviceId,
        name: editName,
        emoji: editEmoji,
        config: editConfig as any,
      });
    }
    setEditorOpen(false);
    loadThemes();
  };

  const deleteTheme = async (id: string) => {
    await supabase.from("custom_bg_themes").delete().eq("id", id);
    if (selectedThemeId === `custom:${id}`) {
      onSelectTheme("default");
    }
    loadThemes();
  };

  const updateConfig = <K extends keyof CustomThemeConfig>(key: K, val: CustomThemeConfig[K]) => {
    setEditConfig(prev => ({ ...prev, [key]: val }));
  };

  const toggleFloatingEmoji = (emoji: string) => {
    setEditConfig(prev => {
      const has = prev.floatingEmojis.includes(emoji);
      return {
        ...prev,
        floatingEmojis: has
          ? prev.floatingEmojis.filter(e => e !== emoji)
          : [...prev.floatingEmojis, emoji],
      };
    });
  };

  const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
    <div className="border border-muted rounded-xl overflow-hidden">
      <button
        onClick={() => setExpandedSection(expandedSection === id ? "" : id)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-sm font-bold"
      >
        {title}
        {expandedSection === id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {expandedSection === id && <div className="px-4 py-3 space-y-3">{children}</div>}
    </div>
  );

  // Preview mini component
  const ThemePreview = ({ config, size = "sm" }: { config: CustomThemeConfig; size?: "sm" | "lg" }) => {
    const bg = configToBg(config);
    const h = size === "lg" ? "h-40" : "h-20";
    return (
      <div className={`${h} w-full rounded-xl relative overflow-hidden border border-muted`} style={{ background: bg }}>
        {config.floatingEmojis.length > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            {config.floatingEmojis.slice(0, Math.min(6, config.emojiCount)).map((em, i) => (
              <span
                key={i}
                className="absolute select-none"
                style={{
                  fontSize: `${config.emojiMinSize + (i % 3) * 4}px`,
                  left: `${(i * 18) % 85}%`,
                  top: `${(i * 22 + 10) % 80}%`,
                  opacity: config.emojiOpacity,
                  animation: config.animated ? `floatBg 4s ease-in-out ${i * 0.5}s infinite alternate` : undefined,
                }}
              >
                {em}
              </span>
            ))}
          </div>
        )}
        {config.shimmer && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(45deg, transparent 40%, rgba(255,255,255,${config.shimmerOpacity}) 50%, transparent 60%)`,
              backgroundSize: "200% 200%",
              animation: "shimmerOverlay 6s ease-in-out infinite",
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <p className="font-bold text-lg text-center">🎨 ערכות נושא</p>

      {/* ── Built-in themes ── */}
      <div>
        <p className="font-bold text-sm mb-2">ערכות מובנות</p>
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-1">
          {builtinThemes.map((bg) => (
            <button
              key={bg.id}
              onClick={() => onSelectTheme(bg.id)}
              className={`relative h-16 rounded-xl text-xs font-bold transition-all active:scale-95 flex flex-col items-center justify-center gap-0.5 group ${
                selectedThemeId === bg.id
                  ? "bg-game-pink text-primary-foreground shadow-md ring-2 ring-game-pink ring-offset-1"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <span className="text-lg">{bg.emoji}</span>
              <span className="text-[10px]">{bg.label}</span>
              {bg.animated && (
                <span className="absolute top-0.5 left-0.5 text-[8px] bg-game-orange text-primary-foreground rounded px-1 font-black">✨</span>
              )}
              {/* Duplicate button */}
              <button
                onClick={(e) => { e.stopPropagation(); duplicateBuiltin(bg); }}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-accent-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                title="שכפול"
              >
                <Copy className="w-3 h-3" />
              </button>
            </button>
          ))}
        </div>
      </div>

      {/* ── Custom themes ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="font-bold text-sm">ערכות מותאמות אישית</p>
          <Button size="sm" variant="outline" onClick={() => openEditor()} className="h-8 text-xs gap-1">
            <Plus className="w-3.5 h-3.5" /> חדש
          </Button>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground text-sm py-4">טוען...</div>
        ) : customThemes.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-6 bg-muted/30 rounded-xl">
            <p>אין ערכות מותאמות עדיין</p>
            <p className="text-[10px] mt-1">לחצו על "חדש" או שכפלו ערכה מובנית</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {customThemes.map((ct) => {
              const cfg = { ...DEFAULT_CONFIG, ...(ct.config as CustomThemeConfig) };
              const isSelected = selectedThemeId === `custom:${ct.id}`;
              return (
                <div
                  key={ct.id}
                  className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${
                    isSelected ? "ring-2 ring-game-pink bg-game-pink/10" : "bg-muted/30 hover:bg-muted/50"
                  }`}
                  onClick={() => onSelectTheme(`custom:${ct.id}`)}
                >
                  <div
                    className="w-12 h-12 rounded-lg shrink-0 overflow-hidden relative"
                    style={{ background: configToBg(cfg) }}
                  >
                    <span className="absolute inset-0 flex items-center justify-center text-lg">{ct.emoji}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{ct.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {cfg.floatingEmojis.slice(0, 5).join(" ")} • {cfg.animated ? "מונפש" : "סטטי"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); openEditor(ct); }}
                      className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); duplicateCustom(ct); }}
                      className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteTheme(ct.id); }}
                      className="w-7 h-7 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════ EDITOR ══════════ */}
      {editorOpen && (
        <div className="fixed inset-0 z-[70] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
          <div className="bg-card w-full max-w-lg max-h-[85vh] rounded-2xl shadow-2xl border-2 border-muted flex flex-col overflow-hidden">
            {/* Editor header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-muted">
              <h3 className="font-black text-base flex items-center gap-2">
                🎨 {editingId ? "עריכת ערכה" : "ערכה חדשה"}
              </h3>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={saveTheme} className="h-8 text-xs gap-1 bg-accent text-accent-foreground hover:bg-accent/90">
                  <Save className="w-3.5 h-3.5" /> שמור
                </Button>
                <button onClick={() => setEditorOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {/* Name & emoji */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center text-2xl hover:bg-muted/80 transition-colors shrink-0"
                >
                  {editEmoji}
                </button>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 h-14 rounded-xl bg-muted px-4 text-sm font-bold border-none outline-none"
                  placeholder="שם הערכה"
                />
              </div>
              {showEmojiPicker && (
                <div className="grid grid-cols-10 gap-1 p-2 bg-muted/50 rounded-xl">
                  {EMOJI_PALETTE.map((em) => (
                    <button key={em} onClick={() => { setEditEmoji(em); setShowEmojiPicker(false); }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted text-lg">
                      {em}
                    </button>
                  ))}
                </div>
              )}

              {/* Live preview */}
              <div>
                <p className="text-xs font-bold text-muted-foreground mb-1 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> תצוגה מקדימה
                </p>
                <ThemePreview config={editConfig} size="lg" />
              </div>

              {/* ── Background section ── */}
              <Section id="background" title="🖼️ רקע">
                <div className="flex gap-2">
                  {(["gradient", "solid"] as const).map((t) => (
                    <button key={t} onClick={() => updateConfig("bgType", t)}
                      className={`flex-1 h-9 rounded-lg text-xs font-bold transition-all ${
                        editConfig.bgType === t ? "bg-game-pink text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {t === "gradient" ? "🌈 גרדיאנט" : "🎨 צבע אחיד"}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold">
                    צבע 1
                    <input type="color" value={editConfig.bgColor1} onChange={(e) => updateConfig("bgColor1", e.target.value)}
                      className="w-8 h-8 rounded-lg border-0 cursor-pointer" />
                    <span className="text-muted-foreground font-mono text-[10px]">{editConfig.bgColor1}</span>
                  </label>
                  {editConfig.bgType === "gradient" && (
                    <>
                      <label className="flex items-center gap-2 text-xs font-bold">
                        צבע 2
                        <input type="color" value={editConfig.bgColor2} onChange={(e) => updateConfig("bgColor2", e.target.value)}
                          className="w-8 h-8 rounded-lg border-0 cursor-pointer" />
                        <span className="text-muted-foreground font-mono text-[10px]">{editConfig.bgColor2}</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-bold">
                        צבע 3
                        <input type="color" value={editConfig.bgColor3} onChange={(e) => updateConfig("bgColor3", e.target.value)}
                          className="w-8 h-8 rounded-lg border-0 cursor-pointer" />
                        <span className="text-muted-foreground font-mono text-[10px]">{editConfig.bgColor3}</span>
                      </label>
                      <div>
                        <div className="flex justify-between text-xs">
                          <span className="font-bold">זווית</span>
                          <span className="text-muted-foreground">{editConfig.gradientAngle}°</span>
                        </div>
                        <input type="range" min={0} max={360} step={5} value={editConfig.gradientAngle}
                          onChange={(e) => updateConfig("gradientAngle", Number(e.target.value))}
                          className="w-full h-2 rounded-full cursor-pointer accent-[hsl(var(--game-pink))]" />
                      </div>
                    </>
                  )}
                </div>
              </Section>

              {/* ── Floating elements ── */}
              <Section id="floating" title="✨ אלמנטים צפים">
                <div>
                  <p className="text-xs font-bold mb-1">בחרו אימוג׳ים</p>
                  <div className="grid grid-cols-10 gap-1">
                    {EMOJI_PALETTE.map((em) => (
                      <button key={em} onClick={() => toggleFloatingEmoji(em)}
                        className={`w-7 h-7 rounded-md flex items-center justify-center text-sm transition-all ${
                          editConfig.floatingEmojis.includes(em) ? "bg-game-pink text-primary-foreground shadow" : "bg-muted/50 hover:bg-muted"
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    נבחרו: {editConfig.floatingEmojis.length} • {editConfig.floatingEmojis.join(" ")}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-xs">
                      <span className="font-bold">כמות</span>
                      <span className="text-muted-foreground">{editConfig.emojiCount}</span>
                    </div>
                    <input type="range" min={4} max={30} value={editConfig.emojiCount}
                      onChange={(e) => updateConfig("emojiCount", Number(e.target.value))}
                      className="w-full h-2 rounded-full cursor-pointer accent-[hsl(var(--game-pink))]" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs">
                      <span className="font-bold">שקיפות</span>
                      <span className="text-muted-foreground">{(editConfig.emojiOpacity * 100).toFixed(0)}%</span>
                    </div>
                    <input type="range" min={0.05} max={0.8} step={0.05} value={editConfig.emojiOpacity}
                      onChange={(e) => updateConfig("emojiOpacity", Number(e.target.value))}
                      className="w-full h-2 rounded-full cursor-pointer accent-[hsl(var(--game-pink))]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-xs">
                      <span className="font-bold">גודל מינימלי</span>
                      <span className="text-muted-foreground">{editConfig.emojiMinSize}px</span>
                    </div>
                    <input type="range" min={8} max={40} value={editConfig.emojiMinSize}
                      onChange={(e) => updateConfig("emojiMinSize", Number(e.target.value))}
                      className="w-full h-2 rounded-full cursor-pointer accent-[hsl(var(--game-pink))]" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs">
                      <span className="font-bold">גודל מקסימלי</span>
                      <span className="text-muted-foreground">{editConfig.emojiMaxSize}px</span>
                    </div>
                    <input type="range" min={16} max={64} value={editConfig.emojiMaxSize}
                      onChange={(e) => updateConfig("emojiMaxSize", Number(e.target.value))}
                      className="w-full h-2 rounded-full cursor-pointer accent-[hsl(var(--game-pink))]" />
                  </div>
                </div>
              </Section>

              {/* ── Animation ── */}
              <Section id="animation" title="🎬 אנימציה">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">הפעל אנימציות</span>
                  <button
                    onClick={() => updateConfig("animated", !editConfig.animated)}
                    className={`w-11 h-6 rounded-full transition-all relative ${editConfig.animated ? "bg-accent" : "bg-muted-foreground/30"}`}
                  >
                    <div className={`w-4.5 h-4.5 rounded-full bg-white shadow absolute top-[3px] transition-all ${editConfig.animated ? "right-[3px]" : "left-[3px]"}`} />
                  </button>
                </div>

                {editConfig.animated && (
                  <>
                    <div>
                      <p className="text-xs font-bold mb-1">סגנון תנועה</p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {ANIM_STYLES.map((a) => (
                          <button key={a.id} onClick={() => updateConfig("animationStyle", a.id)}
                            className={`h-9 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                              editConfig.animationStyle === a.id ? "bg-game-pink text-primary-foreground" : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {a.emoji} {a.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs">
                        <span className="font-bold">מהירות</span>
                        <span className="text-muted-foreground">×{editConfig.animationSpeed.toFixed(1)}</span>
                      </div>
                      <input type="range" min={0.3} max={3} step={0.1} value={editConfig.animationSpeed}
                        onChange={(e) => updateConfig("animationSpeed", Number(e.target.value))}
                        className="w-full h-2 rounded-full cursor-pointer accent-[hsl(var(--game-pink))]" />
                      <div className="flex justify-between text-[10px] text-muted-foreground"><span>איטי</span><span>מהיר</span></div>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">אפקט נצנוץ (שימר)</span>
                  <button
                    onClick={() => updateConfig("shimmer", !editConfig.shimmer)}
                    className={`w-11 h-6 rounded-full transition-all relative ${editConfig.shimmer ? "bg-accent" : "bg-muted-foreground/30"}`}
                  >
                    <div className={`w-4.5 h-4.5 rounded-full bg-white shadow absolute top-[3px] transition-all ${editConfig.shimmer ? "right-[3px]" : "left-[3px]"}`} />
                  </button>
                </div>
                {editConfig.shimmer && (
                  <div>
                    <div className="flex justify-between text-xs">
                      <span className="font-bold">עוצמת נצנוץ</span>
                      <span className="text-muted-foreground">{(editConfig.shimmerOpacity * 100).toFixed(0)}%</span>
                    </div>
                    <input type="range" min={0.02} max={0.2} step={0.01} value={editConfig.shimmerOpacity}
                      onChange={(e) => updateConfig("shimmerOpacity", Number(e.target.value))}
                      className="w-full h-2 rounded-full cursor-pointer accent-[hsl(var(--game-pink))]" />
                  </div>
                )}
              </Section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export helper to resolve a theme ID (builtin or custom)
export function resolveThemeId(id: string, customThemes: CustomThemeRow[]): { bg: string; config?: CustomThemeConfig } | null {
  if (id.startsWith("custom:")) {
    const cid = id.replace("custom:", "");
    const ct = customThemes.find(t => t.id === cid);
    if (ct) {
      const cfg = { ...DEFAULT_CONFIG, ...(ct.config as CustomThemeConfig) };
      return { bg: configToBg(cfg), config: cfg };
    }
    return null;
  }
  const bt = getBgThemes().find(t => t.id === id);
  if (bt) return { bg: bt.bg };
  return null;
}

export { configToBg, DEFAULT_CONFIG };
export type { CustomThemeRow };
