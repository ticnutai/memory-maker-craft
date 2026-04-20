import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

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

export interface FamilyCollage {
  id: string;
  device_id: string;
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
}

export interface FamilyPhoto {
  id: string;
  collage_id: string;
  device_id: string;
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
}

export function useFamilyCollages() {
  const deviceId = getDeviceId();
  const [collages, setCollages] = useState<FamilyCollage[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const joinedIds = getJoinedCollageIds();
    // Fetch own collages + joined (shared) collages
    const { data: own } = await supabase
      .from("family_collages")
      .select("*")
      .eq("device_id", deviceId);
    let joined: FamilyCollage[] = [];
    if (joinedIds.length > 0) {
      const { data } = await supabase
        .from("family_collages")
        .select("*")
        .in("id", joinedIds);
      joined = (data ?? []) as FamilyCollage[];
    }
    const all = [...((own ?? []) as FamilyCollage[]), ...joined.filter(j => !(own ?? []).some(o => o.id === j.id))];
    all.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || b.created_at.localeCompare(a.created_at));
    setCollages(all);
    setLoading(false);
  }, [deviceId]);

  useEffect(() => { refresh(); }, [refresh]);

  const createCollage = useCallback(async (partial: Partial<FamilyCollage> = {}) => {
    const { data, error } = await supabase
      .from("family_collages")
      .insert({
        device_id: deviceId,
        name: partial.name ?? "קולאז׳ חדש",
        emoji: partial.emoji ?? "📸",
        layout_type: partial.layout_type ?? "grid",
        cols: partial.cols ?? 3,
        gap: partial.gap ?? 8,
        background: partial.background ?? "#ffffff",
      })
      .select()
      .single();
    if (error) throw error;
    await refresh();
    return data as FamilyCollage;
  }, [deviceId, refresh]);

  const updateCollage = useCallback(async (id: string, patch: Partial<FamilyCollage>) => {
    await supabase.from("family_collages").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
    await refresh();
  }, [refresh]);

  const deleteCollage = useCallback(async (id: string) => {
    const c = collages.find(x => x.id === id);
    if (c && c.device_id !== deviceId) {
      // Joined collage — just leave it locally
      removeJoinedCollageId(id);
    } else {
      await supabase.from("family_collages").delete().eq("id", id);
    }
    await refresh();
  }, [collages, deviceId, refresh]);

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

  return { collages, loading, refresh, createCollage, updateCollage, deleteCollage, joinByCode, deviceId };
}

export function useFamilyPhotos(collageId: string | null) {
  const deviceId = getDeviceId();
  const [photos, setPhotos] = useState<FamilyPhoto[]>([]);
  const [loading, setLoading] = useState(true);

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

  const uploadFiles = useCallback(async (files: File[]) => {
    if (!collageId) return [];
    const uploaded: FamilyPhoto[] = [];
    const startOrder = photos.length;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${deviceId}/${collageId}/${Date.now()}-${i}.${ext}`;
      const { error: upErr } = await supabase.storage.from("family-photos").upload(path, file, { upsert: false });
      if (upErr) { console.warn("upload error:", upErr); continue; }
      const { data: pub } = supabase.storage.from("family-photos").getPublicUrl(path);
      const { data, error } = await supabase
        .from("family_photos")
        .insert({
          collage_id: collageId,
          device_id: deviceId,
          image_url: pub.publicUrl,
          sort_order: startOrder + i,
        })
        .select()
        .single();
      if (!error && data) uploaded.push(data as FamilyPhoto);
    }
    await refresh();
    return uploaded;
  }, [collageId, deviceId, photos.length, refresh]);

  const updatePhoto = useCallback(async (id: string, patch: Partial<FamilyPhoto>) => {
    await supabase.from("family_photos").update(patch).eq("id", id);
    await refresh();
  }, [refresh]);

  const deletePhoto = useCallback(async (id: string) => {
    await supabase.from("family_photos").delete().eq("id", id);
    await refresh();
  }, [refresh]);

  const reorderPhotos = useCallback(async (orderedIds: string[]) => {
    await Promise.all(orderedIds.map((id, idx) =>
      supabase.from("family_photos").update({ sort_order: idx }).eq("id", id)
    ));
    await refresh();
  }, [refresh]);

  return { photos, loading, uploadFiles, updatePhoto, deletePhoto, reorderPhotos, refresh };
}
