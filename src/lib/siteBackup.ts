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
  mode?: "merge" | "replace";
}

export interface EncryptedSiteBackupEnvelope {
  signature: "memory-maker-site-backup-encrypted";
  version: 1;
  createdAt: string;
  algorithm: "AES-GCM";
  iterations: number;
  saltBase64: string;
  ivBase64: string;
  payloadBase64: string;
}

export interface BackupHistoryItem {
  id: string;
  createdAt: string;
  kind: "export" | "backup" | "restore";
  fileName: string;
  sizeBytes: number;
  encrypted: boolean;
  mode?: "merge" | "replace";
}

const BACKUP_HISTORY_KEY = "memory-maker-backup-history";
const BACKUP_HISTORY_LIMIT = 20;

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

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function fromBase64(input: string): Uint8Array {
  const binary = atob(input);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function deriveAesKey(password: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptSiteBackupPayload(
  payload: SiteBackupPayload,
  password: string,
): Promise<EncryptedSiteBackupEnvelope> {
  const iterations = 150000;
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(password, salt, iterations);
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);

  return {
    signature: "memory-maker-site-backup-encrypted",
    version: 1,
    createdAt: new Date().toISOString(),
    algorithm: "AES-GCM",
    iterations,
    saltBase64: toBase64(salt),
    ivBase64: toBase64(iv),
    payloadBase64: toBase64(new Uint8Array(encrypted)),
  };
}

export async function decryptSiteBackupPayload(
  envelope: EncryptedSiteBackupEnvelope,
  password: string,
): Promise<SiteBackupPayload> {
  const salt = fromBase64(envelope.saltBase64);
  const iv = fromBase64(envelope.ivBase64);
  const encrypted = fromBase64(envelope.payloadBase64);
  const key = await deriveAesKey(password, salt, envelope.iterations);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encrypted);
  const text = new TextDecoder().decode(decrypted);
  return JSON.parse(text) as SiteBackupPayload;
}

export function isValidEncryptedBackupEnvelope(input: any): input is EncryptedSiteBackupEnvelope {
  return !!input && input.signature === "memory-maker-site-backup-encrypted" && input.version === 1 && !!input.payloadBase64;
}

export function loadBackupHistory(): BackupHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(BACKUP_HISTORY_KEY);
    const parsed = raw ? (JSON.parse(raw) as BackupHistoryItem[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function pushBackupHistory(entry: Omit<BackupHistoryItem, "id" | "createdAt">): BackupHistoryItem[] {
  const nextEntry: BackupHistoryItem = {
    id: `backup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    ...entry,
  };
  const next = [nextEntry, ...loadBackupHistory()].slice(0, BACKUP_HISTORY_LIMIT);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(BACKUP_HISTORY_KEY, JSON.stringify(next));
  }
  return next;
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

async function replaceCloudScope(payload: SiteBackupPayload): Promise<void> {
  const deviceIds = payload.scope.deviceIds ?? [];
  const familyId = payload.scope.familyId;
  const userId = payload.scope.userId;

  if (deviceIds.length > 0) {
    const { data: setRows } = await supabase
      .from("custom_card_sets")
      .select("id")
      .in("device_id", deviceIds);
    const existingSetIds = (setRows ?? []).map((row: any) => row.id);
    if (existingSetIds.length > 0) {
      await supabase.from("custom_card_items").delete().in("set_id", existingSetIds);
    }

    await supabase.from("birthday_reminders").delete().in("device_id", deviceIds);
    await supabase.from("family_photos").delete().in("device_id", deviceIds);
    await supabase.from("custom_animations").delete().in("device_id", deviceIds);
    await supabase.from("voice_recordings").delete().in("device_id", deviceIds);
    await supabase.from("game_settings").delete().in("device_id", deviceIds);
    await supabase.from("reminder_settings").delete().in("device_id", deviceIds);
    await supabase.from("family_recipients").delete().in("device_id", deviceIds);
    await supabase.from("custom_bg_themes").delete().in("device_id", deviceIds);
    await supabase.from("custom_card_sets").delete().in("device_id", deviceIds);
    await supabase.from("family_collages").delete().in("device_id", deviceIds);
    await supabase.from("family_events").delete().in("device_id", deviceIds);
    await supabase.from("birthdays").delete().in("device_id", deviceIds);
  }

  if (familyId) {
    await supabase.from("family_members").delete().eq("family_id", familyId);
    await supabase.from("families").delete().eq("id", familyId);
  }

  if (userId) {
    await supabase.from("user_preferences").delete().eq("user_id", userId);
  }
}

async function countByIn(table: string, column: string, values: string[]): Promise<number> {
  if (!values.length) return 0;
  const { count } = await supabase
    .from(table as any)
    .select("id", { count: "exact", head: true })
    .in(column as any, values as any);
  return count ?? 0;
}

async function countByEq(table: string, column: string, value: string): Promise<number> {
  const { count } = await supabase
    .from(table as any)
    .select("id", { count: "exact", head: true })
    .eq(column as any, value as any);
  return count ?? 0;
}

export async function previewReplaceScope(payload: SiteBackupPayload): Promise<{ counts: Record<string, number>; total: number }> {
  const deviceIds = payload.scope.deviceIds ?? [];
  const familyId = payload.scope.familyId;
  const userId = payload.scope.userId;

  const counts: Record<string, number> = {};

  if (deviceIds.length > 0) {
    const [
      birthdays,
      familyEvents,
      familyCollages,
      familyPhotos,
      customAnimations,
      voiceRecordings,
      gameSettings,
      reminderSettings,
      familyRecipients,
      customBgThemes,
      customCardSets,
      birthdayReminders,
    ] = await Promise.all([
      countByIn("birthdays", "device_id", deviceIds),
      countByIn("family_events", "device_id", deviceIds),
      countByIn("family_collages", "device_id", deviceIds),
      countByIn("family_photos", "device_id", deviceIds),
      countByIn("custom_animations", "device_id", deviceIds),
      countByIn("voice_recordings", "device_id", deviceIds),
      countByIn("game_settings", "device_id", deviceIds),
      countByIn("reminder_settings", "device_id", deviceIds),
      countByIn("family_recipients", "device_id", deviceIds),
      countByIn("custom_bg_themes", "device_id", deviceIds),
      countByIn("custom_card_sets", "device_id", deviceIds),
      countByIn("birthday_reminders", "device_id", deviceIds),
    ]);

    counts.birthdays = birthdays;
    counts.family_events = familyEvents;
    counts.family_collages = familyCollages;
    counts.family_photos = familyPhotos;
    counts.custom_animations = customAnimations;
    counts.voice_recordings = voiceRecordings;
    counts.game_settings = gameSettings;
    counts.reminder_settings = reminderSettings;
    counts.family_recipients = familyRecipients;
    counts.custom_bg_themes = customBgThemes;
    counts.custom_card_sets = customCardSets;
    counts.birthday_reminders = birthdayReminders;

    if (customCardSets > 0) {
      const { data: setRows } = await supabase.from("custom_card_sets").select("id").in("device_id", deviceIds);
      const setIds = (setRows ?? []).map((row: any) => row.id as string);
      counts.custom_card_items = await countByIn("custom_card_items", "set_id", setIds);
    } else {
      counts.custom_card_items = 0;
    }
  }

  if (familyId) {
    counts.family_members = await countByEq("family_members", "family_id", familyId);
    counts.families = await countByEq("families", "id", familyId);
  }

  if (userId) {
    counts.user_preferences = await countByEq("user_preferences", "user_id", userId);
  }

  const total = Object.values(counts).reduce((acc, n) => acc + n, 0);
  return { counts, total };
}

export async function restoreSiteBackup(
  payload: SiteBackupPayload,
  options: RestoreSiteBackupOptions,
): Promise<{ restoredTables: Record<string, number>; errors: string[] }> {
  const restoredTables: Record<string, number> = {};
  const errors: string[] = [];
  const mode = options.mode ?? "merge";

  if (options.restoreCloud) {
    if (mode === "replace") {
      try {
        await replaceCloudScope(payload);
      } catch (err: any) {
        errors.push(`replace-scope: ${err?.message ?? "replace failed"}`);
      }
    }

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
