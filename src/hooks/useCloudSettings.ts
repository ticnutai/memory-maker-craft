import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GameSettings, CardStyle } from "@/lib/gameData";

const SETTINGS_SYNC_EVENT = "memory-settings-sync";

function getDeviceId(): string {
  const key = "memory-game-device-id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

const DEFAULT_CARD_STYLE: CardStyle = {
  borderRadius: 16,
  borderWidth: 4,
  borderColor: "default",
  backColor: "default",
  backIcon: "⭐",
  shape: "square",
};

export interface StoredSettings {
  pairCount: number;
  cardMaxW: number;
  emojiScale: number;
  soundEnabled: boolean;
  speechEnabled: boolean;
  speechRate: number;
  flipDuration: number;
  musicType: "none" | "builtin" | "custom" | "cloud";
  builtinMelodyId?: string;
  customMusic?: string;
  customMusicName?: string;
  theme?: string;
  bgTheme?: string;
  cardStyle: CardStyle;
  layoutMode?: "grid" | "free";
  snapToGrid?: boolean;
  gridSize?: number;
  animationsEnabled?: boolean;
  cardPositions?: { x: number; y: number }[];
  musicVolume?: number;
  soundVolume?: number;
  speechVolume?: number;
  layoutPreset?: string;
  customVoiceEnabled?: boolean;
  sfxMode?: "builtin" | "elevenlabs" | "both";
  elevenLabsVoiceId?: string;
  elevenLabsEffectsEnabled?: boolean;
  speechLang?: "he" | "en" | "de";
}

type DbSettingsRow = Record<string, unknown>;

function asNumber(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function asBool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function useCloudSettings(initialTheme: string) {
  const [settings, setSettings] = useState<StoredSettings>({
    pairCount: 4,
    cardMaxW: 480,
    emojiScale: 1,
    soundEnabled: true,
    speechEnabled: true,
    speechRate: 0.9,
    flipDuration: 1,
    musicType: "none",
    builtinMelodyId: "twinkle",
    theme: initialTheme,
    cardStyle: { ...DEFAULT_CARD_STYLE },
  });
  const [loaded, setLoaded] = useState(false);
  const deviceId = useRef(getDeviceId());
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>();

  const applyData = useCallback((data: DbSettingsRow) => {
    setSettings({
      pairCount: asNumber(data.pair_count, 4),
      cardMaxW: asNumber(data.card_max_w, 480),
      emojiScale: asNumber(data.emoji_scale, 1),
      soundEnabled: asBool(data.sound_enabled, true),
      speechEnabled: asBool(data.speech_enabled, true),
      speechRate: asNumber(data.speech_rate, 0.9),
      flipDuration: asNumber(data.flip_duration, 1),
      musicType: asString(data.music_type, "none") as StoredSettings["musicType"],
      builtinMelodyId: asString(data.builtin_melody_id, "twinkle"),
      customMusic: typeof data.custom_music === "string" ? data.custom_music : undefined,
      customMusicName: typeof data.custom_music_name === "string" ? data.custom_music_name : undefined,
      theme: asString(data.theme, initialTheme),
      bgTheme: asString(data.bg_theme, "default"),
      animationsEnabled: asBool(data.animations_enabled, true),
      layoutMode: asString(data.layout_mode, "grid") as "grid" | "free",
      snapToGrid: asBool(data.snap_to_grid, true),
      gridSize: asNumber(data.grid_size, 20),
      cardPositions: Array.isArray(data.card_positions) ? (data.card_positions as { x: number; y: number }[]) : [],
      musicVolume: asNumber(data.music_volume, 50),
      soundVolume: asNumber(data.sound_volume, 50),
      speechVolume: asNumber(data.speech_volume, 50),
      layoutPreset: asString(data.layout_preset, "grid-3"),
      customVoiceEnabled: asBool(data.custom_voice_enabled, true),
      sfxMode: asString((data as any).sfx_mode, "builtin"),
      elevenLabsVoiceId: typeof (data as any).elevenlabs_voice_id === "string" ? (data as any).elevenlabs_voice_id : undefined,
      elevenLabsEffectsEnabled: asBool((data as any).elevenlabs_effects_enabled, false),
      speechLang: asString((data as any).speech_lang, "he"),
      cardStyle: {
        borderRadius: asNumber(data.card_border_radius, 16),
        borderWidth: asNumber(data.card_border_width, 4),
        borderColor: asString(data.card_border_color, "default") as CardStyle["borderColor"],
        backColor: asString(data.card_back_color, "default") as CardStyle["backColor"],
        backColor2: typeof data.card_back_color_2 === "string" && data.card_back_color_2.length > 0 ? data.card_back_color_2 : undefined,
        backIcon: asString(data.card_back_icon, "⭐"),
        shape: asString(data.card_shape, "square") as CardStyle["shape"],
      },
    });
  }, [initialTheme]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("game_settings")
        .select("*")
        .eq("device_id", deviceId.current)
        .maybeSingle();

      if (data) applyData(data);
      setLoaded(true);
    };
    load();

    // סנכרון מיידי בין מופעים באותו טאב דרך CustomEvent
    const syncHandler = (e: Event) => {
      const next = (e as CustomEvent<StoredSettings>).detail;
      setSettings(next);
    };
    window.addEventListener(SETTINGS_SYNC_EVENT, syncHandler);

    // Real-time subscription — כל שינוי ב-Supabase מתפשט מיד לכל המופעים
    const channel = supabase
      .channel(`settings-${deviceId.current}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_settings",
          filter: `device_id=eq.${deviceId.current}`,
        },
        (payload) => {
          if (payload.new) {
            applyData(payload.new as DbSettingsRow);
          }
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener(SETTINGS_SYNC_EVENT, syncHandler);
      supabase.removeChannel(channel);
    };
  }, [initialTheme, applyData]);

  const saveToCloud = useCallback((newSettings: StoredSettings) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      await supabase.from("game_settings").upsert({
        device_id: deviceId.current,
        pair_count: newSettings.pairCount,
        card_max_w: newSettings.cardMaxW,
        emoji_scale: newSettings.emojiScale,
        sound_enabled: newSettings.soundEnabled,
        speech_enabled: newSettings.speechEnabled,
        speech_rate: newSettings.speechRate,
        flip_duration: newSettings.flipDuration,
        music_type: newSettings.musicType,
        builtin_melody_id: newSettings.builtinMelodyId || "twinkle",
        custom_music: newSettings.customMusic || null,
        custom_music_name: newSettings.customMusicName || null,
        theme: newSettings.theme || initialTheme,
        bg_theme: newSettings.bgTheme || "default",
        animations_enabled: newSettings.animationsEnabled !== false,
        card_border_radius: newSettings.cardStyle.borderRadius,
        card_border_width: newSettings.cardStyle.borderWidth,
        card_border_color: newSettings.cardStyle.borderColor,
        card_back_color: newSettings.cardStyle.backColor,
        card_back_color_2: newSettings.cardStyle.backColor2 || "",
        card_back_icon: newSettings.cardStyle.backIcon,
        card_shape: newSettings.cardStyle.shape,
        layout_mode: newSettings.layoutMode || "grid",
        snap_to_grid: newSettings.snapToGrid !== false,
        grid_size: newSettings.gridSize || 20,
        card_positions: newSettings.cardPositions || [],
        music_volume: newSettings.musicVolume ?? 50,
        sound_volume: newSettings.soundVolume ?? 50,
        speech_volume: newSettings.speechVolume ?? 50,
        layout_preset: newSettings.layoutPreset || "grid-3",
        custom_voice_enabled: newSettings.customVoiceEnabled !== false,
        sfx_mode: newSettings.sfxMode || "builtin",
        elevenlabs_voice_id: newSettings.elevenLabsVoiceId || null,
        elevenlabs_effects_enabled: newSettings.elevenLabsEffectsEnabled === true,
        speech_lang: newSettings.speechLang || "he",
        updated_at: new Date().toISOString(),
      }, { onConflict: "device_id" });
    }, 500);
  }, [initialTheme]);

  const broadcast = useCallback((next: StoredSettings) => {
    window.dispatchEvent(new CustomEvent(SETTINGS_SYNC_EVENT, { detail: next }));
  }, []);

  const updateSetting = useCallback(<K extends keyof StoredSettings>(key: K, value: StoredSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      saveToCloud(next);
      broadcast(next);
      return next;
    });
  }, [saveToCloud, broadcast]);

  const updateCardStyle = useCallback(<K extends keyof CardStyle>(key: K, value: CardStyle[K]) => {
    setSettings((prev) => {
      const next = { ...prev, cardStyle: { ...prev.cardStyle, [key]: value } };
      saveToCloud(next);
      broadcast(next);
      return next;
    });
  }, [saveToCloud, broadcast]);

  const updateMultiple = useCallback((partial: Partial<StoredSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveToCloud(next);
      broadcast(next);
      return next;
    });
  }, [saveToCloud, broadcast]);

  const toGameSettings = useCallback((): GameSettings => ({
    pairCount: settings.pairCount,
    cardMaxW: settings.cardMaxW,
    emojiScale: settings.emojiScale,
    soundEnabled: settings.soundEnabled,
    speechEnabled: settings.speechEnabled,
    speechRate: settings.speechRate,
    flipDuration: settings.flipDuration,
    musicType: settings.musicType,
    builtinMelodyId: settings.builtinMelodyId,
    customMusic: settings.customMusic,
    cardStyle: settings.cardStyle,
    bgTheme: settings.bgTheme,
    layoutMode: settings.layoutMode || "grid",
    snapToGrid: settings.snapToGrid !== false,
    gridSize: settings.gridSize || 20,
    animationsEnabled: settings.animationsEnabled !== false,
    cardPositions: settings.cardPositions || [],
    musicVolume: settings.musicVolume ?? 50,
    soundVolume: settings.soundVolume ?? 50,
    speechVolume: settings.speechVolume ?? 50,
    layoutPreset: settings.layoutPreset || "grid-3",
    customVoiceEnabled: settings.customVoiceEnabled !== false,
    sfxMode: settings.sfxMode || "builtin",
    elevenLabsVoiceId: settings.elevenLabsVoiceId,
    elevenLabsEffectsEnabled: settings.elevenLabsEffectsEnabled === true,
    speechLang: settings.speechLang || "he",
  }), [settings]);

  return { settings, loaded, updateSetting, updateCardStyle, updateMultiple, toGameSettings };
}
