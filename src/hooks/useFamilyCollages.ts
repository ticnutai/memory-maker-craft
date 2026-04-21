import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { captureVideoThumbnail } from "@/lib/videoThumbnail";
import { useAuth } from "@/hooks/useAuth";

function getDeviceId(): string {
  const key = "memory-game-device-id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

const JOINED_KEY = "family-joined-collages";
function getJoinedCollageIds(): string[] {
  try { return JSON.parse(localStorage.getItem(JOINED_KEY) ?? "[]"); } catch { return []; }
}
function addJoinedCollageId(id: string) {
  const arr = getJoinedCollageIds();
  if (!arr.includes(id)) {
    arr.push(id);
    localStorage.setItem(JOINED_KEY, JSON.stringify(arr));
  }
}
function removeJoinedCollageId(id: string) {
  const arr = getJoinedCollageIds().filter(x => x !== id);
  localStorage.setItem(JOINED_KEY, JSON.stringify(arr));
}

function isMissingColumnError(err: any): boolean {
  const text = `${err?.message ?? ""} ${err?.details ?? ""} ${err?.hint ?? ""}`.toLowerCase();
  return text.includes("column") && text.includes("does not exist");
}

function stripExtendedCollageFields<T extends Record<string, any>>(payload: T): Record<string, any> {
  const {
    description,
    tags,
    location_tag,
    cover_url,
    archived_at,
    archived_by,
    purge_after,
    owner_user_id,
    visibility,
    locked_by_admin,
    lock_reason,
    locked_at,
    locked_by_user_id,
    deleted_at,
    deleted_by,
    ...legacy
  } = payload;
  return legacy;
}

export interface FamilyCollage {
  id: string;
  device_id: string;
  owner_user_id: string | null;
  visibility: "public" | "private";
  locked_by_admin: boolean;
  lock_reason: string | null;
  locked_at: string | null;
  locked_by_user_id: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  name: string;
  emoji: string | null;
  layout_type: string;
  cols: number;
  gap: number;
  background: string | null;
  background_image: string | null;
  sort_order: number | null;
  share_code: string;
  created_at: string;
  updated_at: string;
  parent_id: string | null;
  is_folder: boolean;
  category: string | null;
  year_tag: number | null;
  family_tag: string | null;
  event_tag: string | null;
  description: string | null;
  tags: string[] | null;
  location_tag: string | null;
  cover_url: string | null;
  archived_at: string | null;
  archived_by: string | null;
  purge_after: string | null;
}

export interface FamilyPhoto {
  id: string;
  collage_id: string;
  device_id: string;
  owner_user_id: string | null;
  visibility: "public" | "private";
  locked_by_admin: boolean;
  lock_reason: string | null;
  locked_at: string | null;
  locked_by_user_id: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  image_url: string;
  caption: string | null;
  photo_date: string | null;
  frame_style: string | null;
  filter_style: string | null;
  sort_order: number | null;
  pos_x: number | null;
  pos_y: number | null;
  width: number | null;
  height: number | null;
  rotation: number | null;
  created_at: string;
  media_type: string;          // 'image' | 'video'
  duration_ms: number | null;
  thumbnail_url: string | null; // poster image for videos
}

export function useFamilyCollages(familyDeviceIds?: string[]) {
  const { user, isAdmin } = useAuth();
  const deviceId = getDeviceId();
  const queryDeviceIds = familyDeviceIds && familyDeviceIds.length > 0 ? familyDeviceIds : [deviceId];
  const [collages, setCollages] = useState<FamilyCollage[]>([]);
  const [loading, setLoading] = useState(true);

  const requireAuthenticatedUser = useCallback(() => {
    if (!user) throw new Error("auth-required");
    return user.id;
  }, [user]);

  const getDepth = useCallback((items: FamilyCollage[], parentId: string | null): number => {
    let depth = 0;
    let current = parentId;
    while (current) {
      const folder = items.find((c) => c.id === current);
      if (!folder) break;
      depth += 1;
      current = folder.parent_id;
      if (depth > 10) break;
    }
    return depth;
  }, []);

  const wouldCreateCycle = useCallback((items: FamilyCollage[], sourceId: string, nextParentId: string | null): boolean => {
    if (!nextParentId) return false;
    let current = nextParentId;
    while (current) {
      if (current === sourceId) return true;
      const folder = items.find((c) => c.id === current);
      if (!folder) break;
      current = folder.parent_id;
    }
    return false;
  }, []);

  const refresh = useCallback(async () => {
    // Fetch ALL collages (visible to everyone)
    const { data } = await supabase
      .from("family_collages")
      .select("*");
    const all = ((data ?? []) as FamilyCollage[]);
    all.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || b.created_at.localeCompare(a.created_at));
    setCollages(all);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const createCollage = useCallback(async (partial: Partial<FamilyCollage> = {}) => {
    const userId = requireAuthenticatedUser();
    const depth = getDepth(collages, partial.parent_id ?? null);
    if (depth >= 5) throw new Error("max-depth-reached");

    const insertPayload = {
      device_id: deviceId,
      name: partial.name ?? "קולאז׳ חדש",
      emoji: partial.emoji ?? "📸",
      layout_type: partial.layout_type ?? "grid",
      cols: partial.cols ?? 3,
      gap: partial.gap ?? 8,
      background: partial.background ?? "#ffffff",
      parent_id: partial.parent_id ?? null,
      is_folder: partial.is_folder ?? false,
      category: partial.category ?? null,
      year_tag: partial.year_tag ?? null,
      family_tag: partial.family_tag ?? null,
      event_tag: partial.event_tag ?? null,
      description: partial.description ?? null,
      tags: partial.tags ?? [],
      location_tag: partial.location_tag ?? null,
      cover_url: partial.cover_url ?? null,
      owner_user_id: partial.owner_user_id ?? userId,
      visibility: partial.visibility ?? "public",
    };

    let { data, error } = await supabase
      .from("family_collages")
      .insert(insertPayload as never)
      .select()
      .single();

    if (error && isMissingColumnError(error)) {
      ({ data, error } = await supabase
        .from("family_collages")
        .insert(stripExtendedCollageFields(insertPayload) as never)
        .select()
        .single());
    }

    if (error) throw error;
    await refresh();
    return data as FamilyCollage;
  }, [deviceId, refresh, collages, getDepth, requireAuthenticatedUser]);

  const updateCollage = useCallback(async (id: string, patch: Partial<FamilyCollage>) => {
    const userId = requireAuthenticatedUser();
    const target = collages.find((c) => c.id === id);
    const canManage = !!target && (isAdmin || target.owner_user_id === userId);
    if (!canManage) throw new Error("forbidden");
    if (target?.locked_by_admin && !isAdmin) throw new Error("locked-by-admin");

    if (patch.parent_id !== undefined) {
      if (wouldCreateCycle(collages, id, patch.parent_id ?? null)) {
        throw new Error("invalid-folder-cycle");
      }
      const depth = getDepth(collages, patch.parent_id ?? null);
      if (depth >= 5) throw new Error("max-depth-reached");
    }
    const patchWithTimestamp = { ...patch, updated_at: new Date().toISOString() };
    let { error } = await supabase.from("family_collages").update(patchWithTimestamp).eq("id", id);

    if (error && isMissingColumnError(error)) {
      ({ error } = await supabase
        .from("family_collages")
        .update(stripExtendedCollageFields(patchWithTimestamp))
        .eq("id", id));
    }

    if (error) throw error;
    await refresh();
  }, [refresh, collages, wouldCreateCycle, getDepth, requireAuthenticatedUser, isAdmin]);

  const deleteCollage = useCallback(async (id: string, options?: { permanent?: boolean }) => {
    const userId = requireAuthenticatedUser();
    const c = collages.find(x => x.id === id);
    const canManage = !!c && (isAdmin || c.owner_user_id === userId);
    if (!canManage) throw new Error("forbidden");
    if (c?.locked_by_admin && !isAdmin) throw new Error("locked-by-admin");

    // Admin can always delete from DB; non-admin with foreign device just leaves locally
    if (c && c.device_id !== deviceId && !isAdmin) {
      removeJoinedCollageId(id);
    } else if (options?.permanent || isAdmin) {
      // Admin always does hard delete
      const { error } = await supabase.from("family_collages").delete().eq("id", id);
      if (error) throw error;
    } else {
      const now = new Date();
      const purgeAfter = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      let { error } = await supabase.from("family_collages").update({
        archived_at: now.toISOString(),
        archived_by: userId,
        purge_after: purgeAfter,
        updated_at: now.toISOString(),
      }).eq("id", id);

      if (error && isMissingColumnError(error)) {
        ({ error } = await supabase.from("family_collages").delete().eq("id", id));
      }
      if (error) throw error;
    }
    await refresh();
  }, [collages, deviceId, refresh, requireAuthenticatedUser, isAdmin]);

  const restoreCollage = useCallback(async (id: string) => {
    const userId = requireAuthenticatedUser();
    const target = collages.find((c) => c.id === id);
    const canManage = !!target && (isAdmin || target.owner_user_id === userId);
    if (!canManage) throw new Error("forbidden");

    let { error } = await supabase.from("family_collages").update({
      archived_at: null,
      archived_by: null,
      purge_after: null,
      deleted_at: null,
      deleted_by: null,
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    if (error && isMissingColumnError(error)) return;
    if (error) throw error;
    await refresh();
  }, [refresh, requireAuthenticatedUser, collages, isAdmin]);

  const purgeExpiredArchived = useCallback(async () => {
    if (!isAdmin) return;
    const nowIso = new Date().toISOString();
    const { error } = await supabase.from("family_collages").delete().not("purge_after", "is", null).lte("purge_after", nowIso);
    if (error && isMissingColumnError(error)) return;
    if (error) throw error;
    await refresh();
  }, [refresh, isAdmin]);

  const joinByCode = useCallback(async (code: string): Promise<FamilyCollage | null> => {
    const cleanCode = code.trim().toLowerCase();
    if (!cleanCode) return null;
    const { data } = await supabase
      .from("family_collages")
      .select("*")
      .eq("share_code", cleanCode)
      .maybeSingle();
    if (!data) return null;
    addJoinedCollageId(data.id);
    await refresh();
    return data as FamilyCollage;
  }, [refresh]);

  return {
    collages,
    loading,
    refresh,
    createCollage,
    updateCollage,
    deleteCollage,
    restoreCollage,
    purgeExpiredArchived,
    joinByCode,
    deviceId,
  };
}

export function useFamilyPhotos(collageId: string | null) {
  const { user, isAdmin } = useAuth();
  const deviceId = getDeviceId();
  const [photos, setPhotos] = useState<FamilyPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  const requireAuthenticatedUser = useCallback(() => {
    if (!user) throw new Error("auth-required");
    return user.id;
  }, [user]);

  const refresh = useCallback(async () => {
    if (!collageId) { setPhotos([]); setLoading(false); return; }
    const { data } = await supabase
      .from("family_photos")
      .select("*")
      .eq("collage_id", collageId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    setPhotos((data ?? []) as FamilyPhoto[]);
    setLoading(false);
  }, [collageId]);

  useEffect(() => { refresh(); }, [refresh]);

  // Realtime subscription so collaborators see live updates
  useEffect(() => {
    if (!collageId) return;
    const channel = supabase
      .channel(`family-photos-${collageId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "family_photos", filter: `collage_id=eq.${collageId}` },
        () => { refresh(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [collageId, refresh]);

  const uploadFiles = useCallback(async (files: File[], visibility: "public" | "private" = "public") => {
    const userId = requireAuthenticatedUser();
    if (!collageId) return [];
    const uploaded: FamilyPhoto[] = [];
    const startOrder = photos.length;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isVideo = file.type.startsWith("video/");
      const ext = file.name.split(".").pop() || (isVideo ? "mp4" : "jpg");
      const path = `${userId}/${collageId}/${Date.now()}-${i}.${ext}`;
      const { error: upErr } = await supabase.storage.from("family-photos").upload(path, file, {
        upsert: false,
        contentType: file.type || undefined,
      });
      if (upErr) { console.warn("upload error:", upErr); continue; }
      const { data: pub } = supabase.storage.from("family-photos").getPublicUrl(path);

      // For videos: capture a thumbnail frame + read duration
      let durationMs: number | null = null;
      let thumbnailUrl: string | null = null;
      if (isVideo) {
        try {
          // Duration
          durationMs = await new Promise<number | null>((resolve) => {
            const v = document.createElement("video");
            v.preload = "metadata";
            v.onloadedmetadata = () => resolve(Math.round((v.duration || 0) * 1000) || null);
            v.onerror = () => resolve(null);
            v.src = URL.createObjectURL(file);
            setTimeout(() => resolve(null), 4000);
          });

          // Thumbnail frame (~0.5s in, or middle for very short clips)
          const seekTo = durationMs && durationMs < 1000 ? (durationMs / 2000) : 0.5;
          const thumbBlob = await captureVideoThumbnail(file, { seekTo, maxWidth: 800 });
          if (thumbBlob) {
            const thumbPath = `${userId}/${collageId}/${Date.now()}-${i}-thumb.jpg`;
            const { error: thErr } = await supabase.storage
              .from("family-photos")
              .upload(thumbPath, thumbBlob, { upsert: false, contentType: "image/jpeg" });
            if (!thErr) {
              thumbnailUrl = supabase.storage.from("family-photos").getPublicUrl(thumbPath).data.publicUrl;
            }
          }
        } catch (e) {
          console.warn("thumbnail capture failed:", e);
        }
      }

      const { data, error } = await supabase
        .from("family_photos")
        .insert({
          collage_id: collageId,
          device_id: deviceId,
          owner_user_id: userId,
          visibility,
          image_url: pub.publicUrl,
          sort_order: startOrder + i,
          media_type: isVideo ? "video" : "image",
          duration_ms: durationMs,
          thumbnail_url: thumbnailUrl,
        } as never)
        .select()
        .single();
      if (!error && data) uploaded.push(data as FamilyPhoto);
    }
    await refresh();
    return uploaded;
  }, [collageId, deviceId, photos.length, refresh, requireAuthenticatedUser]);

  const addFromUrls = useCallback(async (urls: string[], visibility: "public" | "private" = "public") => {
    const userId = requireAuthenticatedUser();
    if (!collageId || urls.length === 0) return [];
    const startOrder = photos.length;
    const rows = urls.map((url, i) => ({
      collage_id: collageId,
      device_id: deviceId,
      owner_user_id: userId,
      visibility,
      image_url: url,
      sort_order: startOrder + i,
    }));
    const { data } = await supabase.from("family_photos").insert(rows).select();
    await refresh();
    return (data ?? []) as FamilyPhoto[];
  }, [collageId, deviceId, photos.length, refresh, requireAuthenticatedUser]);

  const updatePhoto = useCallback(async (id: string, patch: Partial<FamilyPhoto>) => {
    const userId = requireAuthenticatedUser();
    const target = photos.find((p) => p.id === id);
    if (!target) return;
    const canManage = isAdmin || target.owner_user_id === userId;
    if (!canManage) throw new Error("forbidden");
    if (target.locked_by_admin && !isAdmin) throw new Error("locked-by-admin");

    await supabase.from("family_photos").update(patch).eq("id", id);
    await refresh();
  }, [refresh, requireAuthenticatedUser, photos, isAdmin]);

  const deletePhoto = useCallback(async (id: string) => {
    const userId = requireAuthenticatedUser();
    const target = photos.find((p) => p.id === id);
    if (!target) return;
    const canManage = isAdmin || target.owner_user_id === userId;
    if (!canManage) throw new Error("forbidden");
    if (target.locked_by_admin && !isAdmin) throw new Error("locked-by-admin");

    await supabase
      .from("family_photos")
      .update({ deleted_at: new Date().toISOString(), deleted_by: userId } as never)
      .eq("id", id);
    await refresh();
  }, [refresh, requireAuthenticatedUser, photos, isAdmin]);

  const reorderPhotos = useCallback(async (orderedIds: string[]) => {
    requireAuthenticatedUser();
    await Promise.all(orderedIds.map((id, idx) =>
      supabase.from("family_photos").update({ sort_order: idx }).eq("id", id)
    ));
    await refresh();
  }, [refresh, requireAuthenticatedUser]);

  return { photos, loading, uploadFiles, addFromUrls, updatePhoto, deletePhoto, reorderPhotos, refresh };
}
