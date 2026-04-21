import { supabase } from "@/integrations/supabase/client";

export interface SiteBackupPayload {
  signature: "memory-maker-site-backup";
  version: 1;
  createdAt: string;
  scope: {
    userId: string | null;
    familyId: string | null;
    deviceIds: string[];
    currentDeviceId: string;
  };
  cloud: Record<string, any[]>;
  localStorage: Record<string, string>;
}

export interface ExportSiteBackupOptions {
  userId: string | null;
  familyId: string | null;
  deviceIds: string[];
  currentDeviceId: string;
}

export interface RestoreSiteBackupOptions {
  restoreCloud: boolean;
  restoreLocalStorage: boolean;
}

const STORAGE_KEY_PATTERNS: RegExp[] = [
  /^memory-game-/,
  /^family-/,
  /^hearts-/,
  /^game-/,
  /^birthday-/,
  /^reminder-/,
  /^theme-/,
  /^slideshow-/,
  /^train-/,
  /^treasure-/,
  /^card-/,
];

const STORAGE_EXCLUDE_PATTERNS: RegExp[] = [
  /^supabase\./,
  /^sb-/,
  /^__stripe_/,
];

function shouldBackupLocalStorageKey(key: string): boolean {
  if (STORAGE_EXCLUDE_PATTERNS.some((rx) => rx.test(key))) return false;
  if (STORAGE_KEY_PATTERNS.some((rx) => rx.test(key))) return true;
  return [
    "family-home-theme",
    "family-home-custom-theme",
    "family-home-collage-id",
    "family-home-slideshow-config",
    "family-active-id",
    "family-joined-collages",
    "memory-game-device-id",
  ].includes(key);
}

function collectLocalStorageSnapshot(): Record<string, string> {
  const snapshot: Record<string, string> = {};
  if (typeof window === "undefined") return snapshot;

  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key || !shouldBackupLocalStorageKey(key)) continue;
    const value = window.localStorage.getItem(key);
    if (value == null) continue;
    snapshot[key] = value;
  }
  return snapshot;
}

function applyLocalStorageSnapshot(snapshot: Record<string, string>) {
  if (typeof window === "undefined") return;
  Object.entries(snapshot).forEach(([key, value]) => {
    if (shouldBackupLocalStorageKey(key)) {
      window.localStorage.setItem(key, value);
    }
  });
}

async function fetchByDeviceIds(table: string, deviceIds: string[]): Promise<any[]> {
  if (!deviceIds.length) return [];
  const { data } = await supabase.from(table as any).select("*").in("device_id", deviceIds);
  return data ?? [];
}

async function fetchFamilyRows(familyId: string | null): Promise<{ family: any[]; members: any[] }> {
  if (!familyId) return { family: [], members: [] };

  const [{ data: family }, { data: members }] = await Promise.all([
    supabase.from("families").select("*").eq("id", familyId),
    supabase.from("family_members").select("*").eq("family_id", familyId),
  ]);

  return {
    family: family ?? [],
    members: members ?? [],
  };
}

export async function exportSiteBackup(options: ExportSiteBackupOptions): Promise<SiteBackupPayload> {
  const { userId, familyId, deviceIds, currentDeviceId } = options;

  const [
    birthdays,
    familyEvents,
    collages,
    customCardSets,
    customBgThemes,
    customAnimations,
    voiceRecordings,
    reminderSettings,
    gameSettings,
    recipients,
  ] = await Promise.all([
    fetchByDeviceIds("birthdays", deviceIds),
    fetchByDeviceIds("family_events", deviceIds),
    fetchByDeviceIds("family_collages", deviceIds),
    fetchByDeviceIds("custom_card_sets", deviceIds),
    fetchByDeviceIds("custom_bg_themes", deviceIds),
    fetchByDeviceIds("custom_animations", deviceIds),
    fetchByDeviceIds("voice_recordings", deviceIds),
    fetchByDeviceIds("reminder_settings", deviceIds),
    fetchByDeviceIds("game_settings", deviceIds),
    fetchByDeviceIds("family_recipients", deviceIds),
  ]);

  const collageIds = collages.map((row) => row.id);
  const setIds = customCardSets.map((row) => row.id);
  const birthdayIds = birthdays.map((row) => row.id);

  const [familyPhotos, customCardItems, birthdayReminders, familyRows, userPreferencesRows] = await Promise.all([
    collageIds.length
      ? supabase.from("family_photos").select("*").in("collage_id", collageIds).then((r) => r.data ?? [])
      : Promise.resolve([]),
    setIds.length
      ? supabase.from("custom_card_items").select("*").in("set_id", setIds).then((r) => r.data ?? [])
      : Promise.resolve([]),
    birthdayIds.length
      ? supabase.from("birthday_reminders").select("*").in("birthday_id", birthdayIds).then((r) => r.data ?? [])
      : Promise.resolve([]),
    fetchFamilyRows(familyId),
    userId
      ? supabase.from("user_preferences").select("*").eq("user_id", userId).then((r) => r.data ?? [])
      : Promise.resolve([]),
  ]);

  return {
    signature: "memory-maker-site-backup",
    version: 1,
    createdAt: new Date().toISOString(),
    scope: {
      userId,
      familyId,
      deviceIds,
      currentDeviceId,
    },
    cloud: {
      birthdays,
      family_events: familyEvents,
      family_collages: collages,
      family_photos: familyPhotos,
      custom_card_sets: customCardSets,
      custom_card_items: customCardItems,
      custom_bg_themes: customBgThemes,
      custom_animations: customAnimations,
      voice_recordings: voiceRecordings,
      game_settings: gameSettings,
      reminder_settings: reminderSettings,
      family_recipients: recipients,
      birthday_reminders: birthdayReminders,
      families: familyRows.family,
      family_members: familyRows.members,
      user_preferences: userPreferencesRows,
    },
    localStorage: collectLocalStorageSnapshot(),
  };
}

export function isValidSiteBackupPayload(input: any): input is SiteBackupPayload {
  return !!input && input.signature === "memory-maker-site-backup" && input.version === 1 && !!input.cloud;
}

async function upsertRows(table: string, rows: any[], onConflict: string): Promise<number> {
  if (!rows.length) return 0;
  const { error } = await supabase.from(table as any).upsert(rows as any, { onConflict } as any);
  if (error) throw error;
  return rows.length;
}

export async function restoreSiteBackup(
  payload: SiteBackupPayload,
  options: RestoreSiteBackupOptions,
): Promise<{ restoredTables: Record<string, number>; errors: string[] }> {
  const restoredTables: Record<string, number> = {};
  const errors: string[] = [];

  if (options.restoreCloud) {
    const jobs: Array<{ table: string; rows: any[]; onConflict: string }> = [
      { table: "families", rows: payload.cloud.families ?? [], onConflict: "id" },
      { table: "family_members", rows: payload.cloud.family_members ?? [], onConflict: "family_id,device_id" },
      { table: "birthdays", rows: payload.cloud.birthdays ?? [], onConflict: "id" },
      { table: "family_events", rows: payload.cloud.family_events ?? [], onConflict: "id" },
      { table: "family_collages", rows: payload.cloud.family_collages ?? [], onConflict: "id" },
      { table: "family_photos", rows: payload.cloud.family_photos ?? [], onConflict: "id" },
      { table: "custom_card_sets", rows: payload.cloud.custom_card_sets ?? [], onConflict: "id" },
      { table: "custom_card_items", rows: payload.cloud.custom_card_items ?? [], onConflict: "id" },
      { table: "custom_bg_themes", rows: payload.cloud.custom_bg_themes ?? [], onConflict: "id" },
      { table: "custom_animations", rows: payload.cloud.custom_animations ?? [], onConflict: "id" },
      { table: "voice_recordings", rows: payload.cloud.voice_recordings ?? [], onConflict: "id" },
      { table: "game_settings", rows: payload.cloud.game_settings ?? [], onConflict: "id" },
      { table: "reminder_settings", rows: payload.cloud.reminder_settings ?? [], onConflict: "id" },
      { table: "family_recipients", rows: payload.cloud.family_recipients ?? [], onConflict: "id" },
      { table: "birthday_reminders", rows: payload.cloud.birthday_reminders ?? [], onConflict: "id" },
      { table: "user_preferences", rows: payload.cloud.user_preferences ?? [], onConflict: "user_id" },
    ];

    for (const job of jobs) {
      try {
        const count = await upsertRows(job.table, job.rows, job.onConflict);
        restoredTables[job.table] = count;
      } catch (err: any) {
        errors.push(`${job.table}: ${err?.message ?? "restore failed"}`);
      }
    }
  }

  if (options.restoreLocalStorage) {
    try {
      applyLocalStorageSnapshot(payload.localStorage ?? {});
      restoredTables.localStorage = Object.keys(payload.localStorage ?? {}).length;
    } catch (err: any) {
      errors.push(`localStorage: ${err?.message ?? "restore failed"}`);
    }
  }

  return { restoredTables, errors };
}
