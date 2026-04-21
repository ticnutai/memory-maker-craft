import { useState, useMemo } from "react";
import { Palette, Plus, Check, KeyRound, Home as HomeIcon, Trash2, Users, Image as ImageIcon, Play, FolderOpen, Folder, ChevronLeft, Filter, Tag, CalendarDays, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  FAMILY_THEMES, FamilyTheme, loadCustomTheme, saveFamilyTheme,
  saveHomeCollageId, SlideshowConfig, SlideTransition,
} from "@/lib/familyThemes";
import { FamilyCollage } from "@/hooks/useFamilyCollages";
import { toast } from "sonner";

const CATEGORIES = [
  { id: "holidays", label: "🎉 חגים", emoji: "🎉" },
  { id: "trips", label: "✈️ טיולים", emoji: "✈️" },
  { id: "birthdays", label: "🎂 ימי הולדת", emoji: "🎂" },
  { id: "daily", label: "📷 יום-יום", emoji: "📷" },
  { id: "school", label: "🎓 בית ספר", emoji: "🎓" },
  { id: "events", label: "🎊 אירועים", emoji: "🎊" },
];

interface ThemePickerProps {
  current: FamilyTheme;
  onChange: (theme: FamilyTheme) => void;
  collages: FamilyCollage[];
  deviceId: string;
  homeCollageId: string | null;
  onSetHomeCollage: (id: string | null) => void;
  onOpenCollage: (id: string) => void;
  onCreateCollage: (partial?: Partial<FamilyCollage>) => Promise<FamilyCollage>;
  onDeleteCollage: (id: string) => void;
  onJoinByCode: (code: string) => Promise<FamilyCollage | null>;
  slideshow: SlideshowConfig;
  onSlideshowChange: (cfg: SlideshowConfig) => void;
  onResetSlideshow?: () => void;
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

export default function FamilyThemePicker({
  current, onChange,
  collages = [], deviceId, homeCollageId,
  onSetHomeCollage, onOpenCollage, onCreateCollage, onDeleteCollage, onJoinByCode,
  slideshow, onSlideshowChange,
  onResetSlideshow,
  externalOpen, onExternalOpenChange, hideTrigger,
}: ThemePickerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = (v: boolean) => {
    setInternalOpen(v);
    onExternalOpenChange?.(v);
  };
  const [tab, setTab] = useState<"collages" | "themes" | "slideshow">("collages");
  const [showCustom, setShowCustom] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);

  // Folder navigation
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterYear, setFilterYear] = useState<number | null>(null);
  const [filterFamily, setFilterFamily] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);

  const existing = loadCustomTheme();
  const [custom, setCustom] = useState<FamilyTheme>(existing ?? {
    id: "custom",
    name: "ערכה אישית",
    emoji: "🎨",
    background: "linear-gradient(135deg, #fce7f3 0%, #ddd6fe 100%)",
    cardBg: "rgba(255, 255, 255, 0.8)",
    accent: "#ec4899",
    textOnBg: "text-foreground",
    decoration: "hearts",
  });
  const [color1, setColor1] = useState("#fce7f3");
  const [color2, setColor2] = useState("#ddd6fe");

  // ─── Computed: folder tree, breadcrumb, filters ───
  const allThemes = existing ? [...FAMILY_THEMES, existing] : FAMILY_THEMES;
  const selectableCollages = useMemo(() => collages.filter((c) => !c.is_folder), [collages]);
  const hasHomeSource = !!homeCollageId && selectableCollages.some((c) => c.id === homeCollageId);
  const effectiveSlideshowSourceId = slideshow.collageId ?? (hasHomeSource ? homeCollageId : (selectableCollages[0]?.id ?? null));

  // Build breadcrumb path
  const breadcrumb = useMemo(() => {
    const path: FamilyCollage[] = [];
    let id = currentFolderId;
    while (id) {
      const folder = collages.find(c => c.id === id);
      if (!folder) break;
      path.unshift(folder);
      id = folder.parent_id;
    }
    return path;
  }, [currentFolderId, collages]);

  // Items in current folder with filters
  const visibleItems = useMemo(() => {
    let items = collages.filter(c => (c.parent_id ?? null) === currentFolderId);
    if (filterCategory) items = items.filter(c => c.category === filterCategory);
    if (filterYear) items = items.filter(c => c.year_tag === filterYear);
    if (filterFamily) items = items.filter(c => c.family_tag === filterFamily);
    // Sort: folders first, then by sort_order
    return items.sort((a, b) => {
      if (a.is_folder && !b.is_folder) return -1;
      if (!a.is_folder && b.is_folder) return 1;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    });
  }, [collages, currentFolderId, filterCategory, filterYear, filterFamily]);

  // Unique years and family tags for filter chips
  const availableYears = useMemo(() => [...new Set(collages.map(c => c.year_tag).filter(Boolean) as number[])].sort((a, b) => b - a), [collages]);
  const availableFamilies = useMemo(() => [...new Set(collages.map(c => c.family_tag).filter(Boolean) as string[])].sort(), [collages]);
  const hasActiveFilters = !!(filterCategory || filterYear || filterFamily);

  const selectTheme = (t: FamilyTheme) => {
    saveFamilyTheme(t);
    onChange(t);
  };

  const saveCustom = () => {
    const newCustom: FamilyTheme = {
      ...custom,
      id: "custom",
      background: `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`,
    };
    saveFamilyTheme(newCustom);
    onChange(newCustom);
    setShowCustom(false);
  };

  const setAsHome = (id: string) => {
    if (!selectableCollages.some((c) => c.id === id)) {
      toast.error("אפשר לבחור לדף הבית רק קולאז׳ים ולא תיקיות");
      return;
    }
    saveHomeCollageId(id);
    onSetHomeCollage(id);

    const next = { ...slideshow, enabled: true, autoStart: true, collageId: null };
    onSlideshowChange(next);

    toast.success("הקולאז׳ נקבע לדף הבית ומוצג עכשיו");
  };

  const clearHome = () => {
    saveHomeCollageId(null);
    onSetHomeCollage(null);
    toast.success("הוסר מדף הבית");
  };

  const handleCreate = async () => {
    await onCreateCollage({ parent_id: currentFolderId } as Partial<FamilyCollage>);
    setOpen(false);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await onCreateCollage({
        name: newFolderName.trim(),
        emoji: "📁",
        is_folder: true,
        parent_id: currentFolderId,
      } as Partial<FamilyCollage>);
      setNewFolderName("");
      setShowNewFolder(false);
      toast.success("תיקייה נוצרה! 📁");
    } catch {
      toast.error("שגיאה ביצירת תיקייה");
    }
  };

  const handleJoin = async () => {
    if (joinCode.trim().length < 4) return;
    setJoining(true);
    try {
      const c = await onJoinByCode(joinCode);
      if (c) {
        toast.success(`הצטרפת לקולאז׳ "${c.name}"`);
        setJoinCode("");
        setAsHome(c.id);
        setOpen(false);
      } else {
        toast.error("קוד לא נמצא");
      }
    } finally {
      setJoining(false);
    }
  };

  return (
    <>
      {!hideTrigger && (
        <button
          onClick={() => setOpen(true)}
          className="w-6 h-6 rounded-full flex items-center justify-center transition-all active:scale-90 text-foreground/40 hover:text-foreground/70"
          title="קולאז׳ים וערכות נושא"
          aria-label="קולאז׳ים וערכות נושא"
        >
          <Palette className="w-3.5 h-3.5" />
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>בית משפחת טננבאום 🏠</DialogTitle>
          </DialogHeader>

          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="collages" className="text-xs">📸 קולאז׳ים</TabsTrigger>
              <TabsTrigger value="slideshow" className="text-xs">▶️ Slideshow</TabsTrigger>
              <TabsTrigger value="themes" className="text-xs">🎨 ערכות</TabsTrigger>
            </TabsList>

            {/* Collages tab */}
            <TabsContent value="collages" className="space-y-3 mt-4">
              {/* Action buttons */}
              <div className="flex gap-2">
                <Button onClick={handleCreate} className="flex-1" size="sm" style={{ background: current.accent, color: "white" }}>
                  <Plus className="w-4 h-4 ml-1" /> קולאז׳ חדש
                </Button>
                <Button onClick={() => setShowNewFolder(v => !v)} variant="outline" size="sm">
                  <FolderOpen className="w-4 h-4 ml-1" /> תיקייה
                </Button>
                <Button onClick={() => setShowFilters(v => !v)} variant={hasActiveFilters ? "default" : "outline"} size="sm">
                  <Filter className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* New folder form */}
              {showNewFolder && (
                <div className="rounded-xl border p-3 bg-muted/30 flex gap-2">
                  <Input
                    placeholder="שם התיקייה..."
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                    className="h-8 text-sm"
                    dir="rtl"
                  />
                  <Button onClick={handleCreateFolder} size="sm" disabled={!newFolderName.trim()}>📁 צור</Button>
                </div>
              )}

              {/* Filters panel */}
              {showFilters && (
                <div className="rounded-xl border p-3 bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold flex items-center gap-1"><Tag className="w-3 h-3" /> סינון</Label>
                    {hasActiveFilters && (
                      <button onClick={() => { setFilterCategory(null); setFilterYear(null); setFilterFamily(null); }}
                        className="text-[10px] text-destructive hover:underline">נקה הכל</button>
                    )}
                  </div>
                  {/* Category chips */}
                  <div className="flex flex-wrap gap-1">
                    {CATEGORIES.map(cat => (
                      <button key={cat.id} onClick={() => setFilterCategory(filterCategory === cat.id ? null : cat.id)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                          filterCategory === cat.id ? "bg-primary text-primary-foreground border-primary" : "bg-background border-transparent hover:bg-muted"
                        }`}>{cat.label}</button>
                    ))}
                  </div>
                  {/* Year chips */}
                  {availableYears.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <CalendarDays className="w-3 h-3 text-muted-foreground mt-1" />
                      {availableYears.map(y => (
                        <button key={y} onClick={() => setFilterYear(filterYear === y ? null : y)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            filterYear === y ? "bg-primary text-primary-foreground border-primary" : "bg-background border-transparent hover:bg-muted"
                          }`}>{y}</button>
                      ))}
                    </div>
                  )}
                  {/* Family chips */}
                  {availableFamilies.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <User className="w-3 h-3 text-muted-foreground mt-1" />
                      {availableFamilies.map(f => (
                        <button key={f} onClick={() => setFilterFamily(filterFamily === f ? null : f)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            filterFamily === f ? "bg-primary text-primary-foreground border-primary" : "bg-background border-transparent hover:bg-muted"
                          }`}>{f}</button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Breadcrumb */}
              {currentFolderId && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
                  <button onClick={() => setCurrentFolderId(null)} className="hover:text-foreground font-bold">🏠 ראשי</button>
                  {breadcrumb.map((folder, i) => (
                    <span key={folder.id} className="flex items-center gap-1">
                      <ChevronLeft className="w-3 h-3" />
                      <button
                        onClick={() => setCurrentFolderId(i === breadcrumb.length - 1 ? folder.id : folder.id)}
                        className={`hover:text-foreground ${i === breadcrumb.length - 1 ? "font-bold text-foreground" : ""}`}
                      >
                        {folder.emoji ?? "📁"} {folder.name}
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Join by code */}
              <div className="rounded-xl border p-3 bg-muted/30">
                <Label className="text-xs flex items-center gap-1 mb-2">
                  <KeyRound className="w-3 h-3" /> הצטרף עם קוד שיתוף
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="קוד 8 תווים"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                    maxLength={8}
                    className="text-center font-mono tracking-widest uppercase h-9"
                  />
                  <Button onClick={handleJoin} disabled={joining || joinCode.trim().length < 4} size="sm">
                    {joining ? "..." : "הצטרף"}
                  </Button>
                </div>
              </div>

              {/* Items list (folders + collages) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">
                    {visibleItems.length === 0 ? "ריק" : `${visibleItems.filter(c => c.is_folder).length} תיקיות · ${visibleItems.filter(c => !c.is_folder).length} אלבומים`}
                  </Label>
                  {homeCollageId && !currentFolderId && (
                    <button onClick={clearHome} className="text-[10px] text-muted-foreground hover:text-foreground underline">
                      נקה דף בית
                    </button>
                  )}
                </div>

                {visibleItems.length === 0 && (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    {currentFolderId ? (
                      <>
                        <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        תיקייה ריקה — הוסף קולאז׳ חדש או תת-תיקייה
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        צור קולאז׳ חדש או הצטרף עם קוד 👆
                      </>
                    )}
                  </div>
                )}

                {visibleItems.map(c => {
                  const isShared = c.device_id !== deviceId;
                  const isHome = homeCollageId === c.id;
                  const childCount = c.is_folder ? collages.filter(x => x.parent_id === c.id).length : 0;
                  return (
                    <div
                      key={c.id}
                      className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                        isHome ? "bg-primary/10 border-primary" : c.is_folder ? "bg-muted/40 hover:bg-muted/60" : "bg-background hover:bg-muted/50"
                      }`}
                    >
                      <button
                        onClick={() => {
                          if (c.is_folder) {
                            setCurrentFolderId(c.id);
                          } else {
                            onOpenCollage(c.id);
                            setOpen(false);
                          }
                        }}
                        className="flex-1 flex items-center gap-2 text-right min-w-0"
                      >
                        <span className="text-2xl flex-shrink-0">
                          {c.is_folder ? (c.emoji ?? "📁") : (c.emoji ?? "📸")}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm truncate flex items-center gap-1">
                            {c.name}
                            {isHome && <HomeIcon className="w-3 h-3 text-primary flex-shrink-0" />}
                            {isShared && <Users className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
                          </div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                            {c.is_folder ? (
                              <span>{childCount} פריטים</span>
                            ) : (
                              <span>{isShared ? "משותף" : "שלי"} · קוד {c.share_code}</span>
                            )}
                            {c.category && <span className="px-1 py-0.5 rounded bg-muted text-[9px]">{CATEGORIES.find(cat => cat.id === c.category)?.emoji ?? "📋"} {c.category}</span>}
                            {c.year_tag && <span className="text-[9px]">📅{c.year_tag}</span>}
                            {c.family_tag && <span className="text-[9px]">👤{c.family_tag}</span>}
                          </div>
                        </div>
                      </button>
                      {!c.is_folder && (
                        <button
                          onClick={() => isHome ? clearHome() : setAsHome(c.id)}
                          className={`p-1.5 rounded-md transition-colors ${
                            isHome ? "text-primary bg-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                          title={isHome ? "הסר מדף הבית" : "קבע כדף הבית"}
                        >
                          <HomeIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const msg = c.is_folder ? `למחוק את התיקייה "${c.name}" וכל תוכנה?` : isShared ? `לעזוב את "${c.name}"?` : `למחוק את "${c.name}"?`;
                          if (confirm(msg)) {
                            if (homeCollageId === c.id) clearHome();
                            onDeleteCollage(c.id);
                          }
                        }}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="מחק"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {/* Slideshow tab */}
            <TabsContent value="slideshow" className="space-y-4 mt-4">
              {/* Enable toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/30">
                <div>
                  <Label className="text-sm font-bold flex items-center gap-1">
                    <Play className="w-3.5 h-3.5" /> הפעל Slideshow בדף הבית
                  </Label>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    התמונות יתחלפו אוטומטית עם אנימציה
                  </p>
                </div>
                <Switch
                  checked={slideshow.enabled}
                  onCheckedChange={(v) => {
                    const next = {
                      ...slideshow,
                      enabled: v,
                      collageId: v ? (effectiveSlideshowSourceId ?? null) : slideshow.collageId,
                    };
                    onSlideshowChange(next);
                  }}
                />
              </div>

              {/* Source collage */}
              <div className={slideshow.enabled ? "" : "opacity-50 pointer-events-none"}>
                <Label className="text-xs">קולאז׳ מקור</Label>
                <select
                  value={slideshow.collageId ?? "__home__"}
                  onChange={(e) => {
                    const v = e.target.value === "__home__" ? null : e.target.value;
                    const next = { ...slideshow, collageId: v };
                    onSlideshowChange(next);
                  }}
                  className="w-full h-10 px-3 rounded-md border bg-background text-sm mt-1"
                >
                  <option value="__home__">
                    {hasHomeSource ? "📍 השתמש בקולאז׳ של דף הבית" : "📍 אין קולאז׳ דף בית - בחר קולאז׳ ידני"}
                  </option>
                  {selectableCollages.map(c => (
                    <option key={c.id} value={c.id}>{c.emoji ?? "📸"} {c.name}</option>
                  ))}
                </select>
                {!hasHomeSource && (
                  <p className="text-[10px] text-amber-600 mt-1">אין כרגע קולאז׳ לדף הבית, לכן מומלץ לבחור מקור ידני מהרשימה.</p>
                )}
              </div>

              {/* Image duration */}
              <div className={slideshow.enabled ? "" : "opacity-50 pointer-events-none"}>
                <div className="flex justify-between items-baseline">
                  <Label className="text-xs">🖼️ משך תצוגת תמונה</Label>
                  <span className="text-xs font-mono text-muted-foreground">
                    {(slideshow.intervalMs / 1000).toFixed(1)}s
                  </span>
                </div>
                <Slider
                  value={[slideshow.intervalMs]}
                  min={1500}
                  max={30000}
                  step={500}
                  onValueChange={([v]) => {
                    const next = { ...slideshow, intervalMs: v };
                    onSlideshowChange(next);
                  }}
                  className="mt-2"
                />
              </div>

              {/* Video max duration */}
              <div className={slideshow.enabled ? "" : "opacity-50 pointer-events-none"}>
                <div className="flex justify-between items-baseline">
                  <Label className="text-xs">🎬 משך מקסימלי לסרטון</Label>
                  <span className="text-xs font-mono text-muted-foreground">
                    {slideshow.videoMaxMs === 0 ? "עד הסוף" : `${(slideshow.videoMaxMs / 1000).toFixed(0)}s`}
                  </span>
                </div>
                <Slider
                  value={[slideshow.videoMaxMs]}
                  min={0}
                  max={120000}
                  step={5000}
                  onValueChange={([v]) => {
                    const next = { ...slideshow, videoMaxMs: v };
                    onSlideshowChange(next);
                  }}
                  className="mt-2"
                />
                <p className="text-[10px] text-muted-foreground mt-1">0 = ניגון עד הסוף</p>
              </div>

              {/* Transition */}
              <div className={slideshow.enabled ? "" : "opacity-50 pointer-events-none"}>
                <Label className="text-xs">אפקט מעבר</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {([
                    { id: "fade", label: "🌅 דהייה" },
                    { id: "slide", label: "➡️ החלקה" },
                    { id: "zoom", label: "🔍 הגדלה" },
                    { id: "ken-burns", label: "🎬 Ken Burns" },
                  ] as { id: SlideTransition; label: string }[]).map(t => (
                    <button
                      key={t.id}
                      onClick={() => {
                        const next = { ...slideshow, transition: t.id };
                        onSlideshowChange(next);
                      }}
                      className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                        slideshow.transition === t.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className={`space-y-2 ${slideshow.enabled ? "" : "opacity-50 pointer-events-none"}`}>
                <div className="flex items-center justify-between p-2 rounded-lg border">
                  <Label className="text-xs cursor-pointer">הצג כיתוב מתחת לתמונה</Label>
                  <Switch
                    checked={slideshow.showCaption}
                    onCheckedChange={(v) => {
                      const next = { ...slideshow, showCaption: v };
                      onSlideshowChange(next);
                    }}
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg border">
                  <Label className="text-xs cursor-pointer">📝 כיתובים אוטומטיים (שם קובץ/תאריך)</Label>
                  <Switch
                    checked={slideshow.autoCaptions}
                    onCheckedChange={(v) => {
                      const next = { ...slideshow, autoCaptions: v };
                      onSlideshowChange(next);
                    }}
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg border">
                  <Label className="text-xs cursor-pointer">סדר אקראי (Shuffle)</Label>
                  <Switch
                    checked={slideshow.shuffle}
                    onCheckedChange={(v) => {
                      const next = { ...slideshow, shuffle: v };
                      onSlideshowChange(next);
                    }}
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg border">
                  <Label className="text-xs cursor-pointer">🔁 חזרה מההתחלה (לופ)</Label>
                  <Switch
                    checked={slideshow.loop}
                    onCheckedChange={(v) => {
                      const next = { ...slideshow, loop: v };
                      onSlideshowChange(next);
                    }}
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg border">
                  <Label className="text-xs cursor-pointer">🕐 הצג שעון</Label>
                  <Switch
                    checked={slideshow.showClock}
                    onCheckedChange={(v) => {
                      const next = { ...slideshow, showClock: v };
                      onSlideshowChange(next);
                    }}
                  />
                </div>
              </div>

              <div className="pt-1">
                <button
                  onClick={() => onResetSlideshow?.()}
                  className="w-full h-9 rounded-lg border border-destructive/30 text-destructive text-xs font-bold hover:bg-destructive/10 transition-colors"
                >
                  אפס העדפות סליידשואו
                </button>
              </div>

              {/* Background music volume */}
              <div className={slideshow.enabled ? "" : "opacity-50 pointer-events-none"}>
                <div className="flex justify-between items-baseline">
                  <Label className="text-xs">🎵 עוצמת מוזיקת רקע</Label>
                  <span className="text-xs font-mono text-muted-foreground">
                    {Math.round(slideshow.bgMusicVolume * 100)}%
                  </span>
                </div>
                <Slider
                  value={[slideshow.bgMusicVolume]}
                  min={0}
                  max={1}
                  step={0.05}
                  onValueChange={([v]) => {
                    const next = { ...slideshow, bgMusicVolume: v };
                    onSlideshowChange(next);
                  }}
                  className="mt-2"
                />
              </div>
            </TabsContent>

            {/* Themes tab */}
            <TabsContent value="themes" className="mt-4">
              <div className="grid grid-cols-2 gap-3">
                {allThemes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => selectTheme(t)}
                    className={`relative rounded-2xl overflow-hidden border-2 transition-all active:scale-95 ${current.id === t.id ? "border-primary ring-2 ring-primary/30" : "border-transparent hover:border-foreground/20"}`}
                    style={{ background: t.background, minHeight: 90 }}
                  >
                    <div className="p-3 text-right">
                      <div className="text-2xl">{t.emoji}</div>
                      <div className={`text-sm font-bold mt-1 ${t.textOnBg}`}>{t.name}</div>
                    </div>
                    {current.id === t.id && (
                      <div className="absolute top-1 left-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                ))}
                <button
                  onClick={() => setShowCustom(true)}
                  className="rounded-2xl border-2 border-dashed border-foreground/30 hover:border-foreground/60 transition-all active:scale-95 flex flex-col items-center justify-center gap-1 py-5"
                >
                  <Plus className="w-6 h-6 text-foreground/60" />
                  <span className="text-sm font-bold">ערכה אישית</span>
                </button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Custom theme builder */}
      <Dialog open={showCustom} onOpenChange={setShowCustom}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>יצירת ערכת נושא אישית</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div
              className="h-24 rounded-2xl border"
              style={{ background: `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)` }}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">צבע ראשי</Label>
                <Input type="color" value={color1} onChange={(e) => setColor1(e.target.value)} className="h-10" />
              </div>
              <div>
                <Label className="text-xs">צבע שני</Label>
                <Input type="color" value={color2} onChange={(e) => setColor2(e.target.value)} className="h-10" />
              </div>
            </div>
            <div>
              <Label className="text-xs">שם הערכה</Label>
              <Input value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} placeholder="למשל: הערכה של אבא" />
            </div>
            <div>
              <Label className="text-xs">אימוג'י</Label>
              <Input value={custom.emoji} onChange={(e) => setCustom({ ...custom, emoji: e.target.value })} maxLength={2} className="text-2xl text-center" />
            </div>
            <div>
              <Label className="text-xs">קישוט רקע</Label>
              <div className="flex gap-2 flex-wrap mt-1">
                {(["hearts", "stars", "leaves", "confetti", "dots", "none"] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setCustom({ ...custom, decoration: d })}
                    className={`px-3 py-1 rounded-full text-xs border ${custom.decoration === d ? "bg-primary text-primary-foreground border-primary" : "bg-background"}`}
                  >
                    {d === "hearts" ? "❤️ לבבות" : d === "stars" ? "⭐ כוכבים" : d === "leaves" ? "🌿 עלים" : d === "confetti" ? "🎉 קונפטי" : d === "dots" ? "● נקודות" : "ללא"}
                  </button>
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={saveCustom}>שמור ובחר</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
