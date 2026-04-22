import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Plus, Sparkles, Heart, Image as ImageIcon, Settings2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFamilyCollages } from "@/hooks/useFamilyCollages";
import CollageView from "./CollageView";
import FamilyThemePicker from "./FamilyThemePicker";
import FamilyDecorations from "./FamilyDecorations";
import FamilySlideshow from "./FamilySlideshow";
import FamilyQuoteRotator from "./FamilyQuoteRotator";
import BirthdayHearts from "./BirthdayHearts";
import FamilyCodeManager from "./FamilyCodeManager";
import { useFamily } from "@/hooks/useFamily";
import { useAuth } from "@/hooks/useAuth";
import {
  loadFamilyTheme, FamilyTheme, loadHomeCollageId, saveHomeCollageId,
  loadGlobalHomeCollageId, saveGlobalHomeCollageId,
  loadSlideshowConfig, saveSlideshowConfig, SlideshowConfig, normalizeSlideshowConfig, resetSlideshowConfig,
} from "@/lib/familyThemes";
import { FloatEnvironment, FloatPresetId, FloatingEffect, HeartsDisplayStyle, getFloatPresetPatch, hasSavedHeartsConfig, HEARTS_CONFIG_UPDATED_EVENT, loadHeartsConfig, saveHeartsConfig } from "@/lib/heartsDisplayConfig";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useIsMobile } from "@/hooks/use-mobile";

interface FamilyHomeProps {
  externalFamilyCodeOpen?: boolean;
  onFamilyCodeOpenChange?: (open: boolean) => void;
  externalThemePickerOpen?: boolean;
  onThemePickerOpenChange?: (open: boolean) => void;
}

export default function FamilyHome({
  externalFamilyCodeOpen,
  onFamilyCodeOpenChange,
  externalThemePickerOpen,
  onThemePickerOpenChange,
}: FamilyHomeProps) {
  const { user, isAdmin } = useAuth();
  const familyCtx = useFamily();
  const { collages, loading, createCollage, updateCollage, deleteCollage, joinByCode, deviceId } = useFamilyCollages(familyCtx.familyDeviceIds);
  const bootstrappingHomeRef = useRef(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [homeCollageId, setHomeCollageId] = useState<string | null>(() => loadHomeCollageId());
  const [theme, setTheme] = useState<FamilyTheme>(() => loadFamilyTheme());
  const [homePreviewPhotos, setHomePreviewPhotos] = useState<{ url: string; caption: string | null; media_type: string; thumbnail_url: string | null }[]>([]);
  const [slideshow, setSlideshow] = useState<SlideshowConfig>(() => loadSlideshowConfig());
  const [pageClock, setPageClock] = useState(() => new Date());
  const [quickAnimOpen, setQuickAnimOpen] = useState(false);
  const [animCfg, setAnimCfg] = useState(() => loadHeartsConfig());
  const [smartAnalysis, setSmartAnalysis] = useState<SmartHomeAnalysis | null>(null);
  const [smartBusyId, setSmartBusyId] = useState<string | null>(null);
  const [activitySeed, setActivitySeed] = useState(() => new Date().toISOString().slice(0, 10));
  const [dataOpBusy, setDataOpBusy] = useState(false);
  const [fileActionMode, setFileActionMode] = useState<"import" | "restore">("import");
  const [restoreMode, setRestoreMode] = useState<"merge" | "replace">("merge");
  const [backupHistory, setBackupHistory] = useState<BackupHistoryItem[]>(() => loadBackupHistory());
  const importFileRef = useRef<HTMLInputElement | null>(null);
  const isMobile = useIsMobile();

  const weeklyPlan = useMemo(() => buildWeeklyFamilyPlan(activitySeed), [activitySeed]);
  const activityOfTheDay = useMemo(() => pickActivityOfTheDay(activitySeed), [activitySeed]);
  const gameSuggestions = useMemo(() => getQuickGameSuggestions(), []);

  const applyAnimationPreset = (preset: FloatPresetId) => {
    const prefersReduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nav = navigator as Navigator & { deviceMemory?: number };
    const lowPower = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;

    const next = {
      ...loadHeartsConfig(),
      floatPreset: preset,
      ...getFloatPresetPatch(preset, {
        isMobile,
        prefersReducedMotion: prefersReduced,
        lowPowerDevice: lowPower,
      }),
    };
    setAnimCfg(next);
    saveHeartsConfig(next);
  };

  const getActionLabel = (recommendationId: string): string | null => {
    switch (recommendationId) {
      case "set-home-collage":
        return "החל כבר עכשיו";
      case "enable-slideshow":
        return "הפעל סליידשואו";
      case "motion-conflict":
        return "איזון נגישות";
      case "more-collages":
        return "צור קולאז׳ חכם";
      default:
        return null;
    }
  };

  const runSmartAction = async (recommendationId: string) => {
    setSmartBusyId(recommendationId);
    try {
      if (recommendationId === "set-home-collage") {
        if (homeCollageId) {
          toast.info("כבר מוגדר קולאז׳ בית");
          return;
        }
        if (!photoCollages[0]?.id) {
          toast.info("אין קולאז׳ים זמינים להגדרה כדף בית");
          return;
        }
        await applyHomeCollage(photoCollages[0].id, { followHomeInSlideshow: false });
        toast.success("קולאז׳ הבית הוגדר בהצלחה");
        return;
      }

      if (recommendationId === "enable-slideshow") {
        const next = {
          ...slideshow,
          enabled: true,
          autoStart: true,
          collageId: null,
          showClock: true,
        };
        await persistSlideshow(next);
        toast.success("הסליידשואו הופעל אוטומטית");
        return;
      }

      if (recommendationId === "motion-conflict") {
        applyAnimationPreset("soft");
        updateAnimCfg({ reducedMotion: true, floatSpeedScale: 0.9, floatDensityScale: 0.9 });
        toast.success("בוצע איזון בין אנימציות לנגישות");
        return;
      }

      if (recommendationId === "more-collages") {
        if (!user) {
          toast.error("יש להתחבר כדי ליצור קולאז׳");
          return;
        }
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

      toast.info("להמלצה הזו אין יישום אוטומטי כרגע");
    } catch {
      toast.error("שגיאה ביישום ההמלצה החכמה");
    } finally {
      setSmartBusyId(null);
    }
  };

  const applyAllSmartActions = async () => {
    if (!smartAnalysis) return;
    const actionable = smartAnalysis.recommendations
      .map((rec) => rec.id)
      .filter((id) => !!getActionLabel(id));
    if (actionable.length === 0) {
      toast.info("אין כרגע פעולות חכמות ליישום אוטומטי");
      return;
    }

    setSmartBusyId("all");
    try {
      for (const id of actionable.slice(0, 4)) {
        await runSmartAction(id);
      }
      toast.success("הפעולות החכמות הושלמו");
    } finally {
      setSmartBusyId(null);
    }
  };

  const updateAnimCfg = (patch: Partial<typeof animCfg>) => {
    const explicitPreset = (patch as { floatPreset?: typeof animCfg.floatPreset }).floatPreset;
    const next = {
      ...animCfg,
      ...patch,
      floatPreset: explicitPreset ?? "custom",
    };
    setAnimCfg(next);
    saveHeartsConfig(next);
  };

  const isSchemaMismatchError = (err: any) => {
    const text = `${err?.message ?? ""} ${err?.details ?? ""} ${err?.hint ?? ""}`.toLowerCase();
    return text.includes("does not exist") || text.includes("column") || text.includes("relation");
  };

  const saveCloudSlideshow = async (cfg: SlideshowConfig) => {
    if (!user) return;
    const { error } = await (supabase as any).from("user_preferences").upsert({
      user_id: user.id,
      slideshow_config: cfg as unknown as Json,
      updated_at: cfg.updatedAt,
    });
    if (error && !isSchemaMismatchError(error)) throw error;
  };

  const persistSlideshow = async (nextInput: SlideshowConfig, options?: { touchUpdatedAt?: boolean }) => {
    const touchUpdatedAt = options?.touchUpdatedAt !== false;
    const next = normalizeSlideshowConfig({
      ...nextInput,
      updatedAt: touchUpdatedAt ? new Date().toISOString() : nextInput.updatedAt,
    });

    saveSlideshowConfig(next, { touchUpdatedAt: false });
    setSlideshow(next);
    await saveCloudSlideshow(next);
  };

  const resetSlideshowPreferences = async () => {
    const next = resetSlideshowConfig();
    setSlideshow(next);
    saveSlideshowConfig(next, { touchUpdatedAt: false });
    await saveCloudSlideshow(next);
    toast.success("העדפות הסליידשואו אופסו");
  };

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      const localCfg = loadSlideshowConfig();
      const { data, error } = await (supabase as any)
        .from("user_preferences")
        .select("slideshow_config, updated_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        if (!isSchemaMismatchError(error)) console.warn("slideshow cloud sync read failed", error);
        return;
      }

      const rawCloud = (data?.slideshow_config ?? null) as Partial<SlideshowConfig> | null;
      if (!rawCloud) {
        await saveCloudSlideshow(localCfg);
        return;
      }

      const cloudCfg = normalizeSlideshowConfig(rawCloud);
      const localTs = Date.parse(localCfg.updatedAt || "");
      const cloudTs = Date.parse(cloudCfg.updatedAt || (data?.updated_at ?? ""));
      const useCloud = Number.isFinite(cloudTs) && (!Number.isFinite(localTs) || cloudTs >= localTs);

      if (useCloud) {
        saveSlideshowConfig(cloudCfg, { touchUpdatedAt: false });
        setSlideshow(cloudCfg);
      } else {
        await saveCloudSlideshow(localCfg);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  const applyHomeCollage = async (id: string | null, options?: { followHomeInSlideshow?: boolean }) => {
    // Always save locally
    saveHomeCollageId(id);
    setHomeCollageId(id);

    // Admin: also save globally to families table
    if (isAdmin && familyCtx.family?.id) {
      const ok = await saveGlobalHomeCollageId(familyCtx.family.id, id);
      if (ok && id) toast.success("הקולאז׳ נשמר כברירת מחדל לכולם");
    }

    if (options?.followHomeInSlideshow) {
      const next = { ...slideshow, enabled: true, autoStart: true, collageId: null };
      void persistSlideshow(next);
    }
  };

  // Apply theme to body so it covers the entire page (under the icons too)
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = theme.background;
    return () => { document.body.style.background = prev; };
  }, [theme.background]);

  const photoCollages = collages.filter((c) => !c.is_folder);

  // Create a real, editable "Home" collage if there are no collages yet.
  useEffect(() => {
    if (loading || bootstrappingHomeRef.current) return;
    if (!user) return;
    if (photoCollages.length > 0) return;

    bootstrappingHomeRef.current = true;
    (async () => {
      try {
        const created = await createCollage({ name: "דף הבית", emoji: "🏠" });
        applyHomeCollage(created.id);
      } catch {
        toast.error("שגיאה ביצירת קולאז׳ דף הבית");
      } finally {
        bootstrappingHomeRef.current = false;
      }
    })();
  }, [loading, photoCollages.length, createCollage, user]);

  // Load global home collage from cloud (families table), then fall back to local
  useEffect(() => {
    if (loading) return;
    const familyId = familyCtx.family?.id;
    
    (async () => {
      // Try loading global setting from families table
      let globalId: string | null = null;
      if (familyId) {
        globalId = await loadGlobalHomeCollageId(familyId);
      }

      // Local override from localStorage
      const localId = loadHomeCollageId();
      
      // Priority: local override > global > auto-detect
      const effectiveId = localId || globalId;

      const namedHomeId = photoCollages.find((c) => c.name.trim() === "דף הבית")?.id ?? null;
      const firstPhotoCollageId = photoCollages[0]?.id ?? null;

      if (effectiveId && photoCollages.some((c) => c.id === effectiveId)) {
        if (homeCollageId !== effectiveId) {
          setHomeCollageId(effectiveId);
          saveHomeCollageId(effectiveId);
        }
        return;
      }

      // Fallback: auto-detect
      const fallback = namedHomeId ?? firstPhotoCollageId;
      if (fallback && homeCollageId !== fallback) {
        setHomeCollageId(fallback);
        saveHomeCollageId(fallback);
      }
    })();
  }, [loading, photoCollages, familyCtx.family?.id]);

  useEffect(() => {
    if (!slideshow.collageId) return;
    if (photoCollages.some((c) => c.id === slideshow.collageId)) return;

    const next = { ...slideshow, collageId: null };
    void persistSlideshow(next);
  }, [slideshow, photoCollages]);

  useEffect(() => {
    if (!slideshow.showClock) return;
    const timer = window.setInterval(() => setPageClock(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, [slideshow.showClock]);

  useEffect(() => {
    if (hasSavedHeartsConfig()) return;
    applyAnimationPreset("balanced");
  }, [isMobile]);

  useEffect(() => {
    const sync = () => setAnimCfg(loadHeartsConfig());
    window.addEventListener(HEARTS_CONFIG_UPDATED_EVENT, sync);
    return () => window.removeEventListener(HEARTS_CONFIG_UPDATED_EVENT, sync);
  }, []);

  const homeCollage = photoCollages.find(c => c.id === homeCollageId);

  // Determine the source collage for slideshow & preview (slideshow can override)
  const fallbackSlideshowCollageId = photoCollages[0]?.id ?? null;
  const slideshowCollageId = slideshow.collageId ?? homeCollageId ?? fallbackSlideshowCollageId;
  const displayCollageId = slideshow.enabled ? slideshowCollageId : homeCollageId;
  const displayCollage = photoCollages.find((c) => c.id === displayCollageId);

  // Load preview photos for the active display collage
  useEffect(() => {
    if (!displayCollageId) { setHomePreviewPhotos([]); return; }
    let cancelled = false;
    (async () => {
      const limit = slideshow.enabled ? 50 : 9;
      const { data } = await supabase
        .from("family_photos")
        .select("image_url, caption, media_type, thumbnail_url")
        .eq("collage_id", displayCollageId)
        .order("sort_order", { ascending: true })
        .limit(limit);
      if (!cancelled) {
        setHomePreviewPhotos((data ?? []).map((p: any) => ({
          url: p.image_url,
          caption: p.caption,
          media_type: p.media_type ?? "image",
          thumbnail_url: p.thumbnail_url ?? null,
        })));
      }
    })();
    return () => { cancelled = true; };
  }, [activeId, displayCollageId, slideshow.enabled]);

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

      const analysis = analyzeSmartHome({
        collageCount: photoCollages.length,
        photoCount: photoCount ?? 0,
        birthdayCount: birthdayCount ?? 0,
        eventCount: eventCount ?? 0,
        hasHomeCollage: !!homeCollageId,
        slideshowEnabled: slideshow.enabled,
        reducedMotionEnabled: !!animCfg.reducedMotion,
        richAnimationsEnabled: (animCfg.floatDensityScale ?? 1) > 1.15 || (animCfg.floatSpeedScale ?? 1) > 1.15,
      });

      setSmartAnalysis(analysis);
    })();

    return () => {
      cancelled = true;
    };
  }, [
    loading,
    photoCollages,
    homeCollageId,
    slideshow.enabled,
    familyCtx.familyDeviceIds,
    animCfg.reducedMotion,
    animCfg.floatDensityScale,
    animCfg.floatSpeedScale,
  ]);

  const active = collages.find(c => c.id === activeId);
  if (active) {
    const canEditActive = !!user && (isAdmin || active.owner_user_id === user.id);
    return <CollageView collage={active} onBack={() => setActiveId(null)} onUpdateCollage={updateCollage} canEdit={canEditActive} />;
  }

  const handleCreate = async (partial?: Partial<typeof collages[0]>) => {
    if (!user) {
      toast.error("יש להתחבר כדי ליצור קולאז׳");
      throw new Error("auth-required");
    }
    try {
      const c = await createCollage({ name: `קולאז׳ ${collages.length + 1}`, ...partial });
      if (!homeCollageId || !photoCollages.some((item) => item.id === homeCollageId)) {
        applyHomeCollage(c.id);
      }
      setActiveId(c.id);
      return c;
    } catch {
      toast.error("שגיאה ביצירת קולאז׳");
      throw new Error("create failed");
    }
  };

  const isDark = theme.id === "night";

  const shiftActivityWeek = () => {
    const parsed = new Date(activitySeed);
    const next = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
    next.setDate(next.getDate() + 7);
    setActivitySeed(next.toISOString().slice(0, 10));
  };

  const downloadBackupFile = (jsonContent: string, prefix: string): { fileName: string; sizeBytes: number } => {
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
    const next = pushBackupHistory(entry);
    setBackupHistory(next);
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
      addHistory({
        kind,
        fileName: file.fileName,
        sizeBytes: file.sizeBytes,
        encrypted: false,
      });
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
    if (pwd !== verify) {
      toast.error("הסיסמאות לא תואמות");
      return;
    }

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
      addHistory({
        kind: "backup",
        fileName: file.fileName,
        sizeBytes: file.sizeBytes,
        encrypted: true,
      });
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
        if (!pwd) {
          toast.info("הייבוא בוטל");
          return;
        }
        payload = await decryptSiteBackupPayload(parsed, pwd);
      }

      if (!isValidSiteBackupPayload(payload)) {
        toast.error("קובץ לא תקין לייבוא/שחזור");
        return;
      }

      if (fileActionMode === "restore" && restoreMode === "replace") {
        const preview = await previewReplaceScope(payload);
        const typed = window.prompt(
          `שחזור במצב החלפה ימחק בערך ${preview.total} רשומות קיימות.\nכדי להמשיך, הקלד בדיוק: מאשר החלפה`,
        );
        if ((typed ?? "").trim() !== "מאשר החלפה") {
          toast.info("שחזור החלפה בוטל - אישור טקסט לא תואם");
          return;
        }
      }

      const mode = fileActionMode === "restore" ? restoreMode : "merge";
      const result = await restoreSiteBackup(payload, {
        restoreCloud: true,
        restoreLocalStorage: true,
        mode,
      });

      const restoredCount = Object.values(result.restoredTables).reduce((acc, n) => acc + n, 0);
      if (result.errors.length > 0) {
        toast.warning(`${fileActionMode === "restore" ? "שחזור" : "ייבוא"} הסתיים חלקית (${restoredCount} פריטים)`);
      } else {
        toast.success(`${fileActionMode === "restore" ? "שחזור" : "ייבוא"} הושלם (${restoredCount} פריטים)`);
      }

      addHistory({
        kind: "restore",
        fileName: file.name,
        sizeBytes: file.size,
        encrypted: isValidEncryptedBackupEnvelope(parsed),
        mode,
      });

      await familyCtx.refresh();
      window.dispatchEvent(new Event(HEARTS_CONFIG_UPDATED_EVENT));
    } catch {
      toast.error(fileActionMode === "restore" ? "שגיאה בשחזור גיבוי" : "שגיאה בייבוא מידע");
    } finally {
      setDataOpBusy(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      <FamilyDecorations type={theme.decoration ?? "none"} />

      {/* Family code manager — rendered hidden, controlled externally via sidebar */}
      <FamilyCodeManager
        family={familyCtx.family}
        members={familyCtx.members}
        isAdmin={isAdmin || familyCtx.isAdmin}
        deviceId={familyCtx.deviceId}
        onCreateFamily={familyCtx.createFamily}
        onJoinByCode={familyCtx.joinByCode}
        onLeaveFamily={familyCtx.leaveFamily}
        onUpdateNickname={familyCtx.updateNickname}
        hideTrigger
        externalOpen={externalFamilyCodeOpen}
        onExternalOpenChange={onFamilyCodeOpenChange}
      />

      {/* Theme/Collages — rendered hidden, controlled externally via sidebar */}
      <FamilyThemePicker
        current={theme}
        onChange={setTheme}
        collages={collages}
        deviceId={deviceId}
        homeCollageId={homeCollageId}
        onSetHomeCollage={(id) => applyHomeCollage(id, { followHomeInSlideshow: true })}
        onOpenCollage={(id) => setActiveId(id)}
        onCreateCollage={handleCreate}
        onDeleteCollage={deleteCollage}
        onJoinByCode={joinByCode}
        isAdmin={!!user}
        slideshow={slideshow}
        onSlideshowChange={(cfg) => { void persistSlideshow(cfg); }}
        onResetSlideshow={resetSlideshowPreferences}
        hideTrigger
        externalOpen={externalThemePickerOpen}
        onExternalOpenChange={onThemePickerOpenChange}
      />

      <div className="fixed bottom-4 left-4 z-30">
        <button
          type="button"
          onClick={() => setQuickAnimOpen((v) => !v)}
          className="h-11 w-11 rounded-full shadow-lg border border-white/40 backdrop-blur bg-white/85 text-foreground flex items-center justify-center hover:scale-105 transition-transform"
          title="שליטה מהירה באנימציות"
        >
          {quickAnimOpen ? <X className="w-4 h-4" /> : <Settings2 className="w-4 h-4" />}
        </button>

        {quickAnimOpen && (
          <div className="mt-2 w-[290px] rounded-2xl border border-white/40 bg-white/90 backdrop-blur-md shadow-xl p-3 space-y-2 text-right">
            <div className="text-xs font-black">שליטה מהירה באנימציות</div>

            <button
              type="button"
              onClick={() => applyAnimationPreset("balanced")}
              className="w-full text-xs font-bold rounded-lg border px-2 py-1.5 bg-muted/40 hover:bg-muted/70"
            >
              איזון אוטומטי למכשיר הזה
            </button>

            <div className="grid grid-cols-3 gap-1.5">
              {([
                { id: "soft" as FloatPresetId, label: "עדין" },
                { id: "balanced" as FloatPresetId, label: "מאוזן" },
                { id: "rich" as FloatPresetId, label: "עשיר" },
              ]).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyAnimationPreset(preset.id)}
                  className={`text-[11px] font-bold rounded-lg border px-2 py-1 ${
                    animCfg.floatPreset === preset.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted/50"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px]">
                <span>{Math.round((animCfg.floatSizeScale ?? 1) * 100)}%</span>
                <span>גודל</span>
              </div>
              <input type="range" min={0.5} max={2} step={0.1} value={animCfg.floatSizeScale ?? 1} onChange={(e) => updateAnimCfg({ floatSizeScale: Number(e.target.value) })} className="w-full" />
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px]">
                <span>{Math.round((animCfg.floatSpeedScale ?? 1) * 100)}%</span>
                <span>מהירות</span>
              </div>
              <input type="range" min={0.4} max={2.5} step={0.1} value={animCfg.floatSpeedScale ?? 1} onChange={(e) => updateAnimCfg({ floatSpeedScale: Number(e.target.value) })} className="w-full" />
            </div>

            <div>
              <div className="text-[11px] mb-1">כיוון</div>
              <div className="grid grid-cols-2 gap-1.5">
                {([
                  { id: "up" as const, label: "⬆️ למעלה" },
                  { id: "down" as const, label: "⬇️ למטה" },
                ]).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateAnimCfg({ floatDirection: opt.id })}
                    className={`text-[11px] font-bold rounded-lg border px-2 py-1 ${
                      (animCfg.floatDirection ?? "up") === opt.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-muted/50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px]">
                <span>{Math.round((animCfg.floatDensityScale ?? 1) * 100)}%</span>
                <span>צפיפות</span>
              </div>
              <input type="range" min={0.4} max={2.5} step={0.1} value={animCfg.floatDensityScale ?? 1} onChange={(e) => updateAnimCfg({ floatDensityScale: Number(e.target.value) })} className="w-full" />
            </div>

            <div>
              <div className="text-[11px] mb-1">סביבה</div>
              <div className="flex flex-wrap gap-1">
                {([
                  { id: "theme" as FloatEnvironment, label: "🎨" },
                  { id: "hearts" as FloatEnvironment, label: "❤️" },
                  { id: "stars" as FloatEnvironment, label: "⭐" },
                  { id: "confetti" as FloatEnvironment, label: "🎉" },
                  { id: "bubbles" as FloatEnvironment, label: "🫧" },
                  { id: "butterflies" as FloatEnvironment, label: "🦋" },
                  { id: "snow" as FloatEnvironment, label: "❄️" },
                  { id: "petals" as FloatEnvironment, label: "🌸" },
                ]).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateAnimCfg({ floatEnvironment: opt.id })}
                    className={`px-2 py-1 text-xs rounded border ${
                      (animCfg.floatEnvironment ?? "theme") === opt.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Display style selector */}
            <div>
              <div className="text-[11px] mb-1">סגנון תצוגה</div>
              <div className="flex flex-wrap gap-1">
                {([
                  { id: "hearts" as HeartsDisplayStyle, label: "❤️ לבבות" },
                  { id: "bubbles" as HeartsDisplayStyle, label: "🫧 בועות" },
                  { id: "floating" as HeartsDisplayStyle, label: "🎈 צפים" },
                  { id: "cards" as HeartsDisplayStyle, label: "🃏 כרטיסים" },
                  { id: "compact" as HeartsDisplayStyle, label: "📋 רשימה" },
                ]).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateAnimCfg({ displayStyle: opt.id })}
                    className={`px-2 py-1 text-[10px] font-bold rounded border ${
                      (animCfg.displayStyle ?? "hearts") === opt.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Floating / full-page options — available for hearts, bubbles, floating */}
            {(animCfg.displayStyle === "floating" || animCfg.displayStyle === "hearts" || animCfg.displayStyle === "bubbles") && (
              <div className="space-y-1.5 rounded-lg border p-2 bg-background/50">
                <div className="text-[11px] font-bold">הגדרות צפים ובלונים</div>

                {/* Full page toggle */}
                {animCfg.displayStyle !== "floating" && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px]">🎈 צפים על כל העמוד</span>
                    <button
                      type="button"
                      onClick={() => updateAnimCfg({ floatFullPage: !(animCfg as any).floatFullPage } as any)}
                      className={`w-10 h-6 rounded-full transition-all relative ${(animCfg as any).floatFullPage ? "bg-primary" : "bg-muted"}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${(animCfg as any).floatFullPage ? "right-0.5" : "right-4"}`} />
                    </button>
                  </div>
                )}

                {/* Draggable toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px]">🖐️ גרירה חופשית</span>
                  <button
                    type="button"
                    onClick={() => updateAnimCfg({ draggable: (animCfg as any).draggable === false } as any)}
                    className={`w-10 h-6 rounded-full transition-all relative ${(animCfg as any).draggable !== false ? "bg-primary" : "bg-muted"}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${(animCfg as any).draggable !== false ? "right-0.5" : "right-4"}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px]">תנועה עצמאית</span>
                  <button
                    type="button"
                    onClick={() => updateAnimCfg({ floatingIndependent: !animCfg.floatingIndependent } as any)}
                    className={`w-10 h-6 rounded-full transition-all relative ${(animCfg as any).floatingIndependent !== false ? "bg-primary" : "bg-muted"}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${(animCfg as any).floatingIndependent !== false ? "right-0.5" : "right-4"}`} />
                  </button>
                </div>
                <div className="text-[11px]">אפקטים בלחיצה</div>
                <div className="flex flex-wrap gap-1">
                  {([
                    { id: "sparkles" as FloatingEffect, label: "✨ ניצוצות" },
                    { id: "confetti" as FloatingEffect, label: "🎊 קונפטי" },
                    { id: "pop" as FloatingEffect, label: "🔊 צליל" },
                  ]).map((eff) => {
                    const effects: FloatingEffect[] = (animCfg as any).floatingEffects ?? ["sparkles", "confetti", "pop"];
                    const active = effects.includes(eff.id);
                    return (
                      <button
                        key={eff.id}
                        type="button"
                        onClick={() => {
                          const cur: FloatingEffect[] = (animCfg as any).floatingEffects ?? ["sparkles", "confetti", "pop"];
                          const next = active ? cur.filter((e) => e !== eff.id) : [...cur, eff.id];
                          updateAnimCfg({ floatingEffects: next } as any);
                        }}
                        className={`px-2 py-1 text-[10px] font-bold rounded border ${
                          active ? "bg-primary text-primary-foreground border-primary" : "bg-background"
                        }`}
                      >
                        {eff.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between rounded-lg border px-2 py-1.5 bg-background/70">
              <span className="text-[11px]">תנועה מופחתת</span>
              <button
                type="button"
                onClick={() => updateAnimCfg({ reducedMotion: !animCfg.reducedMotion })}
                className={`w-10 h-6 rounded-full transition-all relative ${animCfg.reducedMotion ? "bg-primary" : "bg-muted"}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${animCfg.reducedMotion ? "right-0.5" : "right-4"}`} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="relative z-10 pt-20 pb-12 px-4 max-w-5xl mx-auto">
        {/* Hero header */}
        <header className="text-center mb-8">
          <div className="inline-block mb-3 relative">
            <div className="text-6xl sm:text-7xl animate-float inline-block">🏠</div>
            <Heart className="absolute -top-1 -right-2 w-5 h-5 fill-rose-500 text-rose-500 animate-pulse" />
          </div>
          <h1 className={`text-3xl sm:text-4xl font-extrabold mb-2 ${isDark ? "text-white" : "text-foreground"} drop-shadow-sm`}>
            בית משפחת טננבאום
          </h1>
          <p className={`text-base ${isDark ? "text-white/80" : "text-foreground/70"} flex items-center justify-center gap-1`}>
            <Sparkles className="w-4 h-4" />
            <span>הזיכרונות הכי יפים — יחד</span>
            <Sparkles className="w-4 h-4" />
          </p>
        </header>

        {smartAnalysis && (
          <section className={`mb-5 rounded-2xl border p-3 sm:p-4 ${isDark ? "bg-white/5 border-white/15" : "bg-white/75 border-white/90"}`}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className={`text-sm sm:text-base font-black ${isDark ? "text-white" : "text-foreground"}`}>Smart Insights</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { void applyAllSmartActions(); }}
                  disabled={smartBusyId === "all"}
                  className="text-[11px] sm:text-xs font-bold px-2.5 py-1 rounded-full border bg-background/70 hover:bg-background disabled:opacity-60"
                >
                  {smartBusyId === "all" ? "מיישם..." : "יישם הכול"}
                </button>
                <div className={`text-xs sm:text-sm font-black px-2.5 py-1 rounded-full ${smartAnalysis.score >= 85 ? "bg-emerald-500 text-white" : smartAnalysis.score >= 65 ? "bg-amber-500 text-white" : "bg-rose-500 text-white"}`}>
                  ציון בית חכם: {smartAnalysis.score}
                </div>
              </div>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {smartAnalysis.recommendations.slice(0, 4).map((rec) => (
                <div
                  key={rec.id}
                  className={`rounded-xl border p-2.5 ${isDark ? "bg-white/5 border-white/10" : "bg-background/70 border-muted"}`}
                >
                  <div className={`text-[11px] font-black ${rec.priority === "high" ? "text-rose-500" : rec.priority === "medium" ? "text-amber-500" : "text-emerald-500"}`}>
                    {rec.priority === "high" ? "עדיפות גבוהה" : rec.priority === "medium" ? "עדיפות בינונית" : "עדיפות נמוכה"}
                  </div>
                  <div className={`text-sm font-bold mt-1 ${isDark ? "text-white" : "text-foreground"}`}>{rec.title}</div>
                  <div className={`text-xs mt-1 ${isDark ? "text-white/75" : "text-muted-foreground"}`}>{rec.description}</div>
                  {getActionLabel(rec.id) && (
                    <button
                      type="button"
                      onClick={() => { void runSmartAction(rec.id); }}
                      disabled={smartBusyId === rec.id || smartBusyId === "all"}
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

        <section className={`mb-5 rounded-2xl border p-3 sm:p-4 ${isDark ? "bg-white/5 border-white/15" : "bg-white/75 border-white/90"}`}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className={`text-sm sm:text-base font-black flex items-center gap-1.5 ${isDark ? "text-white" : "text-foreground"}`}>
              <CalendarDays className="w-4 h-4" />
              תוכניות ופעילויות משפחתיות
            </h2>
            <button
              type="button"
              onClick={shiftActivityWeek}
              className="text-[11px] sm:text-xs font-bold px-2.5 py-1 rounded-full border bg-background/70 hover:bg-background"
            >
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
              <div
                key={`${item.weekday}-${item.idea.id}`}
                className={`rounded-xl border p-2.5 ${isDark ? "bg-white/5 border-white/10" : "bg-background/70 border-muted"}`}
              >
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
                <span
                  key={game.id}
                  className={`px-2 py-1 text-[11px] rounded-full border ${isDark ? "bg-white/10 border-white/20 text-white" : "bg-background border-muted text-foreground"}`}
                >
                  {game.title}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className={`mb-5 rounded-2xl border p-3 sm:p-4 ${isDark ? "bg-white/5 border-white/15" : "bg-white/75 border-white/90"}`}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className={`text-sm sm:text-base font-black ${isDark ? "text-white" : "text-foreground"}`}>ייצוא, ייבוא, גיבוי ושחזור</h2>
            <div className={`text-[11px] ${isDark ? "text-white/70" : "text-muted-foreground"}`}>קובץ JSON מאובטח לשמירה והחזרה</div>
          </div>

          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            <span className={`text-[11px] ${isDark ? "text-white/70" : "text-muted-foreground"}`}>מצב שחזור:</span>
            <button
              type="button"
              disabled={dataOpBusy}
              onClick={() => setRestoreMode("merge")}
              className={`text-[11px] px-2 py-1 rounded-full border ${restoreMode === "merge" ? "bg-primary text-primary-foreground border-primary" : "bg-background/70"}`}
            >
              מיזוג
            </button>
            <button
              type="button"
              disabled={dataOpBusy}
              onClick={() => setRestoreMode("replace")}
              className={`text-[11px] px-2 py-1 rounded-full border ${restoreMode === "replace" ? "bg-rose-500 text-white border-rose-500" : "bg-background/70"}`}
            >
              החלפה
            </button>
            {restoreMode === "replace" && (
              <span className={`text-[10px] ${isDark ? "text-rose-200" : "text-rose-600"}`}>
                נדרש אישור מוקלד: מאשר החלפה
              </span>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
            <button
              type="button"
              disabled={dataOpBusy}
              onClick={() => { void handleExportLike("export"); }}
              className="rounded-xl border px-2 py-2 text-xs font-bold flex items-center justify-center gap-1.5 bg-background/70 hover:bg-background disabled:opacity-60"
            >
              <Download className="w-3.5 h-3.5" /> ייצוא מידע
            </button>
            <button
              type="button"
              disabled={dataOpBusy}
              onClick={() => triggerFileAction("import")}
              className="rounded-xl border px-2 py-2 text-xs font-bold flex items-center justify-center gap-1.5 bg-background/70 hover:bg-background disabled:opacity-60"
            >
              <Upload className="w-3.5 h-3.5" /> ייבוא מידע
            </button>
            <button
              type="button"
              disabled={dataOpBusy}
              onClick={() => { void handleExportLike("backup"); }}
              className="rounded-xl border px-2 py-2 text-xs font-bold flex items-center justify-center gap-1.5 bg-background/70 hover:bg-background disabled:opacity-60"
            >
              <DatabaseBackup className="w-3.5 h-3.5" /> גיבוי מלא
            </button>
            <button
              type="button"
              disabled={dataOpBusy}
              onClick={() => { void handleEncryptedBackup(); }}
              className="rounded-xl border px-2 py-2 text-xs font-bold flex items-center justify-center gap-1.5 bg-background/70 hover:bg-background disabled:opacity-60"
            >
              <Lock className="w-3.5 h-3.5" /> גיבוי מוצפן
            </button>
            <button
              type="button"
              disabled={dataOpBusy}
              onClick={() => triggerFileAction("restore")}
              className="rounded-xl border px-2 py-2 text-xs font-bold flex items-center justify-center gap-1.5 bg-background/70 hover:bg-background disabled:opacity-60"
            >
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

          <input
            ref={importFileRef}
            type="file"
            accept="application/json,.json"
            onChange={(e) => { void handleImportFile(e); }}
            className="hidden"
          />
        </section>

        <BirthdayHearts isDark={isDark} familyDeviceIds={familyCtx.familyDeviceIds} />

        {loading && <div className="text-center text-foreground/60">טוען…</div>}

        {/* Empty state */}
        {!loading && collages.length === 0 && (
          <div
            className="rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-xl backdrop-blur-md border border-white/40"
            style={{ background: theme.cardBg }}
          >
            <div className="text-7xl mb-4 inline-block animate-float">📸</div>
            <h2 className={`text-2xl font-bold mb-3 ${isDark ? "text-white" : "text-foreground"}`}>
              בואו נתחיל לבנות יחד!
            </h2>
            <p className={`mb-6 ${isDark ? "text-white/80" : "text-foreground/70"}`}>
              צרו את הקולאז׳ המשפחתי הראשון, או הצטרפו לקולאז׳ קיים עם קוד שיתוף.
            </p>
            <Button
              onClick={() => handleCreate()}
              size="lg"
              className="rounded-full shadow-lg text-base px-7 h-14"
              style={{ background: theme.accent, color: "white" }}
            >
              <Plus className="w-5 h-5 ml-1" /> צור קולאז׳ ראשון
            </Button>
            <p className={`mt-4 text-xs ${isDark ? "text-white/60" : "text-foreground/60"}`}>
              💡 לחץ על האייקון 🎨 בפינה השמאלית למעלה לניהול קולאז׳ים והצטרפות עם קוד
            </p>
          </div>
        )}

        {/* Home collage display — clean, photos only. Editing happens via the 🎨 icon above. */}
        {!loading && displayCollage && (
          <div className="max-w-3xl mx-auto">
            {slideshow.enabled && slideshow.autoStart && slideshow.showClock && homePreviewPhotos.length > 0 && (
              <div className="mb-2 flex justify-start">
                <div className="bg-black/60 text-white text-sm px-3 py-1 rounded-full backdrop-blur-sm font-mono">
                  {pageClock.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            )}
            {slideshow.enabled && slideshow.autoStart && homePreviewPhotos.length > 0 ? (
              <FamilySlideshow
                photos={homePreviewPhotos}
                config={slideshow}
                onOpenCollage={() => {}}
                onConfigChange={(cfg) => { void persistSlideshow(cfg); }}
              />
            ) : homePreviewPhotos.length > 0 ? (
              <div
                className="rounded-3xl p-4 sm:p-6 shadow-xl backdrop-blur-md border border-white/40"
                style={{ background: theme.cardBg }}
              >
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {homePreviewPhotos.slice(0, 9).map((p, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-xl overflow-hidden bg-white/50 shadow-md relative"
                    >
                      {p.media_type === "video" ? (
                        <>
                          {p.thumbnail_url ? (
                            <img src={p.thumbnail_url} alt={p.caption ?? ""} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <video src={p.url} className="w-full h-full object-cover" muted loop playsInline preload="metadata" />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                              <span className="text-white text-sm">▶</span>
                            </div>
                          </div>
                          <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full backdrop-blur-sm">🎬</div>
                        </>
                      ) : (
                        <img src={p.url} alt={p.caption ?? ""} className="w-full h-full object-cover" loading="lazy" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div
                className="rounded-3xl py-12 px-6 text-center shadow-xl backdrop-blur-md border border-white/40"
                style={{ background: theme.cardBg }}
              >
                <ImageIcon className={`w-12 h-12 mx-auto mb-3 ${isDark ? "text-white/40" : "text-foreground/40"}`} />
                <p className={`font-bold ${isDark ? "text-white/80" : "text-foreground/70"}`}>אין עדיין תמונות בקולאז׳ הזה</p>
                <p className={`text-xs mt-2 ${isDark ? "text-white/50" : "text-foreground/50"}`}>
                  לחץ על האייקון 🎨 למעלה כדי לפתוח ולערוך
                </p>
              </div>
            )}
          </div>
        )}

        {/* Rotating family quotes — built-in pool + user-added, click to manage */}
        {!loading && <FamilyQuoteRotator isDark={isDark} />}
      </div>
    </div>
  );
}
