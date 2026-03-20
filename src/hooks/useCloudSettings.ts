import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GameSettings, CardStyle } from "@/lib/gameData";

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
  flipDuration: number;
  musicType: "none" | "builtin" | "custom" | "cloud";
  builtinMelodyId?: string;
  customMusic?: string;
  customMusicName?: string;
  theme?: string;
  bgTheme?: string;
  cardStyle: CardStyle;
}

export function useCloudSettings(initialTheme: string) {
  const [settings, setSettings] = useState<StoredSettings>({
    pairCount: 4,
    cardMaxW: 480,
    emojiScale: 1,
    soundEnabled: true,
    flipDuration: 1,
    musicType: "none",
    builtinMelodyId: "twinkle",
    theme: initialTheme,
    cardStyle: { ...DEFAULT_CARD_STYLE },
  });
  const [loaded, setLoaded] = useState(false);
  const deviceId = useRef(getDeviceId());
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("game_settings")
        .select("*")
        .eq("device_id", deviceId.current)
        .maybeSingle();

      if (data) {
        setSettings({
          pairCount: data.pair_count,
          cardMaxW: data.card_max_w,
          emojiScale: Number(data.emoji_scale),
          soundEnabled: data.sound_enabled,
          flipDuration: Number(data.flip_duration),
          musicType: data.music_type as StoredSettings["musicType"],
          builtinMelodyId: data.builtin_melody_id || "twinkle",
          customMusic: data.custom_music || undefined,
          customMusicName: data.custom_music_name || undefined,
          theme: data.theme || initialTheme,
          cardStyle: {
            borderRadius: data.card_border_radius ?? 16,
            borderWidth: data.card_border_width ?? 4,
            borderColor: data.card_border_color || "default",
            backColor: data.card_back_color || "default",
            backColor2: (data as any).card_back_color_2 || undefined,
            backIcon: data.card_back_icon || "⭐",
            shape: data.card_shape || "square",
          },
        });
      }
      setLoaded(true);
    };
    load();
  }, [initialTheme]);

  const saveToCloud = useCallback((newSettings: StoredSettings) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      await supabase.from("game_settings").upsert({
        device_id: deviceId.current,
        pair_count: newSettings.pairCount,
        card_max_w: newSettings.cardMaxW,
        emoji_scale: newSettings.emojiScale,
        sound_enabled: newSettings.soundEnabled,
        flip_duration: newSettings.flipDuration,
        music_type: newSettings.musicType,
        builtin_melody_id: newSettings.builtinMelodyId || "twinkle",
        custom_music: newSettings.customMusic || null,
        custom_music_name: newSettings.customMusicName || null,
        theme: newSettings.theme || initialTheme,
        card_border_radius: newSettings.cardStyle.borderRadius,
        card_border_width: newSettings.cardStyle.borderWidth,
        card_border_color: newSettings.cardStyle.borderColor,
        card_back_color: newSettings.cardStyle.backColor,
        card_back_color_2: newSettings.cardStyle.backColor2 || "",
        card_back_icon: newSettings.cardStyle.backIcon,
        card_shape: newSettings.cardStyle.shape,
        updated_at: new Date().toISOString(),
      }, { onConflict: "device_id" });
    }, 500);
  }, [initialTheme]);

  const updateSetting = useCallback(<K extends keyof StoredSettings>(key: K, value: StoredSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      saveToCloud(next);
      return next;
    });
  }, [saveToCloud]);

  const updateCardStyle = useCallback(<K extends keyof CardStyle>(key: K, value: CardStyle[K]) => {
    setSettings((prev) => {
      const next = { ...prev, cardStyle: { ...prev.cardStyle, [key]: value } };
      saveToCloud(next);
      return next;
    });
  }, [saveToCloud]);

  const updateMultiple = useCallback((partial: Partial<StoredSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveToCloud(next);
      return next;
    });
  }, [saveToCloud]);

  const toGameSettings = useCallback((): GameSettings => ({
    pairCount: settings.pairCount,
    cardMaxW: settings.cardMaxW,
    emojiScale: settings.emojiScale,
    soundEnabled: settings.soundEnabled,
    flipDuration: settings.flipDuration,
    musicType: settings.musicType,
    builtinMelodyId: settings.builtinMelodyId,
    customMusic: settings.customMusic,
    cardStyle: settings.cardStyle,
    bgTheme: settings.bgTheme,
  }), [settings]);

  return { settings, loaded, updateSetting, updateCardStyle, updateMultiple, toGameSettings };
}
