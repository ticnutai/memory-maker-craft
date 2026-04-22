import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { CalendarDays, Gamepad2, Download, Upload, DatabaseBackup, RotateCcw, Lock, Sparkles } from "lucide-react";
import { useFamily } from "@/hooks/useFamily";
import { useAuth } from "@/hooks/useAuth";
import { useFamilyCollages } from "@/hooks/useFamilyCollages";
import { loadHomeCollageId, loadSlideshowConfig, loadFamilyTheme } from "@/lib/familyThemes";
import { loadHeartsConfig } from "@/lib/heartsDisplayConfig";
import { analyzeSmartHome, type SmartHomeAnalysis } from "@/lib/smartInsights";
import { buildWeeklyFamilyPlan, getQuickGameSuggestions, pickActivityOfTheDay } from "@/lib/familyActivities";
import {
  decryptSiteBackupPayload,
  encryptSiteBackupPayload,
  exportSiteBackup,
  isValidEncryptedBackupEnvelope,
  isValidSiteBackupPayload,
  loadBackupHistory,
  previewReplaceScope,
  pushBackupHistory,
  restoreSiteBackup,
  type BackupHistoryItem,
} from "@/lib/siteBackup";
import { HEARTS_CONFIG_UPDATED_EVENT } from "@/lib/heartsDisplayConfig";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function FamilyIdeasPage() {
  const { user, isAdmin } = useAuth();
  const familyCtx = useFamily();
  const { collages, loading, createCollage } = useFamilyCollages(familyCtx.familyDeviceIds);
  const [activitySeed, setActivitySeed] = useState(() => new Date().toISOString().slice(0, 10));
  const [smartAnalysis, setSmartAnalysis] = useState<SmartHomeAnalysis | null>(null);
  const [smartBusyId, setSmartBusyId] = useState<string | null>(null);
  const [dataOpBusy, setDataOpBusy] = useState(false);
  const [fileActionMode, setFileActionMode] = useState<"import" | "restore">("import");
  const [restoreMode, setRestoreMode] = useState<"merge" | "replace">("merge");
  const [backupHistory, setBackupHistory] = useState<BackupHistoryItem[]>(() => loadBackupHistory());
  const importFileRef = useRef<HTMLInputElement | null>(null);

  const theme = loadFamilyTheme();
  const isDark = theme.id === "night";

  const photoCollages = collages.filter((c) => !c.is_folder);
  const homeCollageId = loadHomeCollageId();
  const slideshow = loadSlideshowConfig();
  const animCfg = loadHeartsConfig();

  const weeklyPlan = useMemo(() => buildWeeklyFamilyPlan(activitySeed), [activitySeed]);
  const activityOfTheDay = useMemo(() => pickActivityOfTheDay(activitySeed), [activitySeed]);
  const gameSuggestions = useMemo(() => getQuickGameSuggestions(), []);

  // Smart analysis
  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    (async () => {
      const photoCollageIds = photoCollages.map((c) => c.id);
      const deviceIds = familyCtx.familyDeviceIds ?? [];
      const [{ count: photoCount }, { count: birthdayCount }, { count: eventCount }] = await Promise.all([
        photoCollageIds.length > 0
          ? supabase.from("family_photos").select("id", { count: "exact", head: true }).in("collage_id", photoCollageIds)
          : Promise.resolve({ count: 0 } as any),
        deviceIds.length > 0
          ? supabase.from("birthdays").select("id", { count: "exact", head: true }).in("device_id", deviceIds)
          : Promise.resolve({ count: 0 } as any),
        deviceIds.length > 0
          ? supabase.from("family_events").select("id", { count: "exact", head: true }).in("device_id", deviceIds)
          : Promise.resolve({ count: 0 } as any),
      ]);
      if (cancelled) return;
      setSmartAnalysis(analyzeSmartHome({
        collageCount: photoCollages.length,
        photoCount: photoCount ?? 0,
        birthdayCount: birthdayCount ?? 0,
        eventCount: eventCount ?? 0,
        hasHomeCollage: !!homeCollageId,
        slideshowEnabled: slideshow.enabled,
        reducedMotionEnabled: !!animCfg.reducedMotion,
        richAnimationsEnabled: (animCfg.floatDensityScale ?? 1) > 1.15 || (animCfg.floatSpeedScale ?? 1) > 1.15,
      }));
    })();
    return () => { cancelled = true; };
  }, [loading, photoCollages.length, familyCtx.familyDeviceIds]);

  const getActionLabel = (id: string): string | null => {
    switch (id) {
      case "set-home-collage": return "החל כבר עכשיו";
      case "enable-slideshow": return "הפעל סליידשואו";
      case "motion-conflict": return "איזון נגישות";
      case "more-collages": return "צור קולאז׳ חכם";
      default: return null;
    }
  };

  const runSmartAction = async (recId: string) => {
    setSmartBusyId(recId);
    try {
      if (recId === "more-collages" && user) {
        const existing = new Set(photoCollages.map((c) => c.name.trim()));
        const suggestions = [
          { name: "אירועים משפחתיים", emoji: "🎉" },
          { name: "רגעים מצחיקים", emoji: "😂" },
          { name: "חגים ושבתות", emoji: "🕯️" },
        ];
        const candidate = suggestions.find((s) => !existing.has(s.name)) ?? { name: `קולאז׳ ${collages.length + 1}`, emoji: "✨" };
        await createCollage({ name: candidate.name, emoji: candidate.emoji });
        toast.success(`נוצר קולאז׳ חדש: ${candidate.name}`);
        return;
      }
      toast.info("להמלצה הזו יש לפעול מדף הבית");
    } catch {
      toast.error("שגיאה ביישום ההמלצה");
    } finally {
      setSmartBusyId(null);
    }
  };

  const shiftActivityWeek = () => {
    const parsed = new Date(activitySeed);
    const next = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
    next.setDate(next.getDate() + 7);
    setActivitySeed(next.toISOString().slice(0, 10));
  };

  // Backup/export helpers
  const downloadBackupFile = (jsonContent: string, prefix: string) => {
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
    const fileName = `${prefix}-${timestamp}.json`;
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return { fileName, sizeBytes: blob.size };
  };

  const addHistory = (entry: Omit<BackupHistoryItem, "id" | "createdAt">) => {
    setBackupHistory(pushBackupHistory(entry));
  };

  const handleExportLike = async (kind: "export" | "backup") => {
    setDataOpBusy(true);
    try {
      const payload = await exportSiteBackup({
        userId: user?.id ?? null,
        familyId: familyCtx.family?.id ?? null,
        deviceIds: familyCtx.familyDeviceIds ?? [familyCtx.deviceId],
        currentDeviceId: familyCtx.deviceId,
      });
      const file = downloadBackupFile(JSON.stringify(payload, null, 2), kind === "backup" ? "memory-maker-backup" : "memory-maker-export");
      addHistory({ kind, fileName: file.fileName, sizeBytes: file.sizeBytes, encrypted: false });
      toast.success(kind === "backup" ? "הגיבוי נוצר בהצלחה" : "הייצוא נוצר בהצלחה");
    } catch {
      toast.error(kind === "backup" ? "שגיאה ביצירת גיבוי" : "שגיאה בייצוא מידע");
    } finally {
      setDataOpBusy(false);
    }
  };

  const handleEncryptedBackup = async () => {
    const pwd = window.prompt("הכנס סיסמה לגיבוי מוצפן");
    if (!pwd) return;
    const verify = window.prompt("אימות סיסמה");
    if (pwd !== verify) { toast.error("הסיסמאות לא תואמות"); return; }
    setDataOpBusy(true);
    try {
      const payload = await exportSiteBackup({
        userId: user?.id ?? null,
        familyId: familyCtx.family?.id ?? null,
        deviceIds: familyCtx.familyDeviceIds ?? [familyCtx.deviceId],
        currentDeviceId: familyCtx.deviceId,
      });
      const encrypted = await encryptSiteBackupPayload(payload, pwd);
      const file = downloadBackupFile(JSON.stringify(encrypted, null, 2), "memory-maker-backup-encrypted");
      addHistory({ kind: "backup", fileName: file.fileName, sizeBytes: file.sizeBytes, encrypted: true });
      toast.success("גיבוי מוצפן נוצר בהצלחה");
    } catch {
      toast.error("שגיאה ביצירת גיבוי מוצפן");
    } finally {
      setDataOpBusy(false);
    }
  };

  const triggerFileAction = (mode: "import" | "restore") => {
    setFileActionMode(mode);
    importFileRef.current?.click();
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setDataOpBusy(true);
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw);
      let payload = parsed;
      if (isValidEncryptedBackupEnvelope(parsed)) {
        const pwd = window.prompt("הכנס סיסמה לפענוח הקובץ");
        if (!pwd) { toast.info("הייבוא בוטל"); return; }
        payload = await decryptSiteBackupPayload(parsed, pwd);
      }
      if (!isValidSiteBackupPayload(payload)) { toast.error("קובץ לא תקין"); return; }
      if (fileActionMode === "restore" && restoreMode === "replace") {
        const preview = await previewReplaceScope(payload);
        const typed = window.prompt(`שחזור במצב החלפה ימחק בערך ${preview.total} רשומות.\nהקלד: מאשר החלפה`);
        if ((typed ?? "").trim() !== "מאשר החלפה") { toast.info("שחזור בוטל"); return; }
      }
      const mode = fileActionMode === "restore" ? restoreMode : "merge";
      const result = await restoreSiteBackup(payload, { restoreCloud: true, restoreLocalStorage: true, mode });
      const count = Object.values(result.restoredTables).reduce((acc, n) => acc + n, 0);
      toast.success(`${fileActionMode === "restore" ? "שחזור" : "ייבוא"} הושלם (${count} פריטים)`);
      addHistory({ kind: "restore", fileName: file.name, sizeBytes: file.size, encrypted: isValidEncryptedBackupEnvelope(parsed), mode });
      await familyCtx.refresh();
      window.dispatchEvent(new Event(HEARTS_CONFIG_UPDATED_EVENT));
    } catch {
      toast.error("שגיאה בפעולה");
    } finally {
      setDataOpBusy(false);
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pt-14 pb-8 max-w-5xl mx-auto" dir="rtl">
      <header className="text-center mb-8">
        <div className="inline-block mb-3">
          <div className="text-5xl sm:text-6xl animate-float inline-block">💡</div>
        </div>
        <h1 className={`text-3xl sm:text-4xl font-extrabold mb-2 ${isDark ? "text-white" : "text-foreground"}`}>
          רעיונות וכלים
        </h1>
        <p className={`text-base ${isDark ? "text-white/80" : "text-foreground/70"} flex items-center justify-center gap-1`}>
          <Sparkles className="w-4 h-4" />
          <span>תובנות חכמות, פעילויות משפחתיות וגיבויים</span>
          <Sparkles className="w-4 h-4" />
        </p>
      </header>

      {/* Smart Insights */}
      {smartAnalysis && (
        <section className={`mb-5 rounded-2xl border p-3 sm:p-4 ${isDark ? "bg-white/5 border-white/15" : "bg-white/75 border-white/90"}`}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className={`text-sm sm:text-base font-black ${isDark ? "text-white" : "text-foreground"}`}>Smart Insights</h2>
            <div className={`text-xs sm:text-sm font-black px-2.5 py-1 rounded-full ${smartAnalysis.score >= 85 ? "bg-emerald-500 text-white" : smartAnalysis.score >= 65 ? "bg-amber-500 text-white" : "bg-rose-500 text-white"}`}>
              ציון בית חכם: {smartAnalysis.score}
            </div>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {smartAnalysis.recommendations.slice(0, 4).map((rec) => (
              <div key={rec.id} className={`rounded-xl border p-2.5 ${isDark ? "bg-white/5 border-white/10" : "bg-background/70 border-muted"}`}>
                <div className={`text-[11px] font-black ${rec.priority === "high" ? "text-rose-500" : rec.priority === "medium" ? "text-amber-500" : "text-emerald-500"}`}>
                  {rec.priority === "high" ? "עדיפות גבוהה" : rec.priority === "medium" ? "עדיפות בינונית" : "עדיפות נמוכה"}
                </div>
                <div className={`text-sm font-bold mt-1 ${isDark ? "text-white" : "text-foreground"}`}>{rec.title}</div>
                <div className={`text-xs mt-1 ${isDark ? "text-white/75" : "text-muted-foreground"}`}>{rec.description}</div>
                {getActionLabel(rec.id) && (
                  <button
                    type="button"
                    onClick={() => { void runSmartAction(rec.id); }}
                    disabled={smartBusyId === rec.id}
                    className="mt-2 text-[11px] font-bold px-2.5 py-1 rounded-lg border bg-background/70 hover:bg-background disabled:opacity-60"
                  >
                    {smartBusyId === rec.id ? "מיישם..." : getActionLabel(rec.id)}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Family Activities */}
      <section className={`mb-5 rounded-2xl border p-3 sm:p-4 ${isDark ? "bg-white/5 border-white/15" : "bg-white/75 border-white/90"}`}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className={`text-sm sm:text-base font-black flex items-center gap-1.5 ${isDark ? "text-white" : "text-foreground"}`}>
            <CalendarDays className="w-4 h-4" />
            תוכניות ופעילויות משפחתיות
          </h2>
          <button type="button" onClick={shiftActivityWeek} className="text-[11px] sm:text-xs font-bold px-2.5 py-1 rounded-full border bg-background/70 hover:bg-background">
            שבוע הבא
          </button>
        </div>
        <div className={`mt-3 rounded-xl border p-3 ${isDark ? "bg-white/5 border-white/10" : "bg-background/70 border-muted"}`}>
          <div className={`text-[11px] font-black ${isDark ? "text-white/75" : "text-muted-foreground"}`}>פעילות היום</div>
          <div className={`mt-1 text-sm font-bold ${isDark ? "text-white" : "text-foreground"}`}>{activityOfTheDay.title}</div>
          <div className={`text-xs mt-1 ${isDark ? "text-white/75" : "text-muted-foreground"}`}>{activityOfTheDay.description}</div>
          <div className={`text-[11px] mt-2 ${isDark ? "text-white/70" : "text-muted-foreground"}`}>משך משוער: {activityOfTheDay.durationMin} דקות</div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {weeklyPlan.slice(0, 6).map((item) => (
            <div key={`${item.weekday}-${item.idea.id}`} className={`rounded-xl border p-2.5 ${isDark ? "bg-white/5 border-white/10" : "bg-background/70 border-muted"}`}>
              <div className={`text-[11px] font-black ${isDark ? "text-white/75" : "text-muted-foreground"}`}>{item.weekday}</div>
              <div className={`text-sm font-bold mt-1 ${isDark ? "text-white" : "text-foreground"}`}>{item.idea.title}</div>
              <div className={`text-xs mt-1 ${isDark ? "text-white/75" : "text-muted-foreground"}`}>{item.idea.durationMin} דקות</div>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <div className={`text-[11px] font-black flex items-center gap-1.5 ${isDark ? "text-white/75" : "text-muted-foreground"}`}>
            <Gamepad2 className="w-3.5 h-3.5" />
            משחקים מומלצים להפעלה מיידית
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {gameSuggestions.map((game) => (
              <span key={game.id} className={`px-2 py-1 text-[11px] rounded-full border ${isDark ? "bg-white/10 border-white/20 text-white" : "bg-background border-muted text-foreground"}`}>
                {game.title}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Export / Backup */}
      <section className={`mb-5 rounded-2xl border p-3 sm:p-4 ${isDark ? "bg-white/5 border-white/15" : "bg-white/75 border-white/90"}`}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className={`text-sm sm:text-base font-black ${isDark ? "text-white" : "text-foreground"}`}>ייצוא, ייבוא, גיבוי ושחזור</h2>
          <div className={`text-[11px] ${isDark ? "text-white/70" : "text-muted-foreground"}`}>קובץ JSON מאובטח לשמירה והחזרה</div>
        </div>
        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          <span className={`text-[11px] ${isDark ? "text-white/70" : "text-muted-foreground"}`}>מצב שחזור:</span>
          <button type="button" disabled={dataOpBusy} onClick={() => setRestoreMode("merge")}
            className={`text-[11px] px-2 py-1 rounded-full border ${restoreMode === "merge" ? "bg-primary text-primary-foreground border-primary" : "bg-background/70"}`}>
            מיזוג
          </button>
          <button type="button" disabled={dataOpBusy} onClick={() => setRestoreMode("replace")}
            className={`text-[11px] px-2 py-1 rounded-full border ${restoreMode === "replace" ? "bg-rose-500 text-white border-rose-500" : "bg-background/70"}`}>
            החלפה
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
          <button type="button" disabled={dataOpBusy} onClick={() => { void handleExportLike("export"); }}
            className="rounded-xl border px-2 py-2 text-xs font-bold flex items-center justify-center gap-1.5 bg-background/70 hover:bg-background disabled:opacity-60">
            <Download className="w-3.5 h-3.5" /> ייצוא מידע
          </button>
          <button type="button" disabled={dataOpBusy} onClick={() => triggerFileAction("import")}
            className="rounded-xl border px-2 py-2 text-xs font-bold flex items-center justify-center gap-1.5 bg-background/70 hover:bg-background disabled:opacity-60">
            <Upload className="w-3.5 h-3.5" /> ייבוא מידע
          </button>
          <button type="button" disabled={dataOpBusy} onClick={() => { void handleExportLike("backup"); }}
            className="rounded-xl border px-2 py-2 text-xs font-bold flex items-center justify-center gap-1.5 bg-background/70 hover:bg-background disabled:opacity-60">
            <DatabaseBackup className="w-3.5 h-3.5" /> גיבוי מלא
          </button>
          <button type="button" disabled={dataOpBusy} onClick={() => { void handleEncryptedBackup(); }}
            className="rounded-xl border px-2 py-2 text-xs font-bold flex items-center justify-center gap-1.5 bg-background/70 hover:bg-background disabled:opacity-60">
            <Lock className="w-3.5 h-3.5" /> גיבוי מוצפן
          </button>
          <button type="button" disabled={dataOpBusy} onClick={() => triggerFileAction("restore")}
            className="rounded-xl border px-2 py-2 text-xs font-bold flex items-center justify-center gap-1.5 bg-background/70 hover:bg-background disabled:opacity-60">
            <RotateCcw className="w-3.5 h-3.5" /> שחזור גיבוי
          </button>
        </div>
        <div className={`mt-3 rounded-xl border p-2.5 ${isDark ? "bg-white/5 border-white/10" : "bg-background/70 border-muted"}`}>
          <div className={`text-[11px] font-black ${isDark ? "text-white/80" : "text-muted-foreground"}`}>היסטוריית פעולות אחרונות</div>
          {backupHistory.length === 0 ? (
            <div className={`text-[11px] mt-1 ${isDark ? "text-white/70" : "text-muted-foreground"}`}>עדיין אין פעולות שמורות</div>
          ) : (
            <div className="mt-1.5 space-y-1 max-h-28 overflow-y-auto">
              {backupHistory.slice(0, 6).map((item) => (
                <div key={item.id} className={`text-[11px] flex items-center justify-between gap-2 ${isDark ? "text-white/85" : "text-foreground"}`}>
                  <span className="truncate">{item.fileName}</span>
                  <span className={isDark ? "text-white/65" : "text-muted-foreground"}>
                    {item.kind === "backup" ? "גיבוי" : item.kind === "restore" ? "שחזור" : "ייצוא"}
                    {item.encrypted ? " • מוצפן" : ""}
                    {item.mode ? ` • ${item.mode === "replace" ? "החלפה" : "מיזוג"}` : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <input ref={importFileRef} type="file" accept="application/json,.json" onChange={(e) => { void handleImportFile(e); }} className="hidden" />
      </section>
    </div>
  );
}
