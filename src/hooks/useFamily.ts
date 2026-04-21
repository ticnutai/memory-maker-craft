import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/deviceId";
import { useAuth } from "@/hooks/useAuth";

const FAMILY_ID_KEY = "family-active-id";

export interface Family {
  id: string;
  code: string;
  name: string;
  admin_device_id: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  device_id: string;
  nickname: string | null;
  joined_at: string;
}

function loadFamilyId(): string | null {
  return localStorage.getItem(FAMILY_ID_KEY);
}
function saveFamilyId(id: string | null) {
  if (id) localStorage.setItem(FAMILY_ID_KEY, id);
  else localStorage.removeItem(FAMILY_ID_KEY);
}

export function useFamily() {
  const deviceId = getDeviceId();
  const { user, isAdmin: isPlatformAdmin } = useAuth();
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  // All device IDs that belong to this family (for querying shared data)
  const familyDeviceIds = useMemo(() => {
    if (!family) return [deviceId];
    const ids = members.map((m) => m.device_id);
    if (!ids.includes(deviceId)) ids.push(deviceId);
    return ids;
  }, [family, members, deviceId]);

  const isAdmin = family ? (isPlatformAdmin || family.admin_device_id === deviceId) : !!user;

  const refresh = useCallback(async () => {
    // Check if device belongs to any family
    let membership: { family_id: string } | null = null;

    if (user) {
      const { data: byUserRows } = await supabase
        .from("family_members")
        .select("family_id")
        .eq("user_id", user.id)
        .limit(1);
      membership = ((byUserRows as Array<{ family_id: string }> | null)?.[0] ?? null);
    }

    if (!membership) {
      const { data: byDevice } = await supabase
        .from("family_members")
        .select("family_id")
        .eq("device_id", deviceId)
        .limit(1)
        .maybeSingle();
      membership = byDevice as { family_id: string } | null;
    }

    if (!membership) {
      // Also check saved family ID
      const savedId = loadFamilyId();
      if (savedId) {
        // Try to rejoin
        const { data: fam } = await supabase
          .from("families")
          .select("*")
          .eq("id", savedId)
          .maybeSingle();
        if (fam) {
          // Auto-rejoin
          await supabase.from("family_members").upsert(
            { family_id: savedId, device_id: deviceId, user_id: user?.id ?? null },
            { onConflict: "family_id,device_id" }
          );
        } else {
          saveFamilyId(null);
          setFamily(null);
          setMembers([]);
          setLoading(false);
          return;
        }
      } else {
        setFamily(null);
        setMembers([]);
        setLoading(false);
        return;
      }
    }

    const familyId = membership?.family_id ?? loadFamilyId();
    if (!familyId) { setFamily(null); setMembers([]); setLoading(false); return; }

    const [{ data: fam }, { data: mems }] = await Promise.all([
      supabase.from("families").select("*").eq("id", familyId).maybeSingle(),
      supabase.from("family_members").select("*").eq("family_id", familyId),
    ]);

    if (fam) {
      setFamily(fam as Family);
      saveFamilyId(fam.id);
    } else {
      saveFamilyId(null);
      setFamily(null);
    }
    setMembers((mems ?? []) as FamilyMember[]);
    setLoading(false);
  }, [deviceId, user]);

  useEffect(() => { refresh(); }, [refresh]);

  const createFamily = useCallback(async (name: string): Promise<Family> => {
    if (!user) throw new Error("auth-required");
    const { data, error } = await supabase
      .from("families")
      .insert({ name, admin_device_id: deviceId, admin_user_id: user.id } as never)
      .select()
      .single();
    if (error) throw error;
    // Add self as member
    await supabase.from("family_members").insert({
      family_id: data.id,
      device_id: deviceId,
      user_id: user.id,
    } as never);
    saveFamilyId(data.id);
    await refresh();
    return data as Family;
  }, [deviceId, refresh, user]);

  const joinByCode = useCallback(async (code: string): Promise<Family | null> => {
    if (!user) throw new Error("auth-required");
    const clean = code.trim().toLowerCase();
    if (!clean) return null;
    const { data: fam } = await supabase
      .from("families")
      .select("*")
      .eq("code", clean)
      .maybeSingle();
    if (!fam) return null;
    await supabase.from("family_members").upsert(
      { family_id: fam.id, device_id: deviceId, user_id: user.id } as never,
      { onConflict: "family_id,device_id" }
    );
    saveFamilyId(fam.id);
    await refresh();
    return fam as Family;
  }, [deviceId, refresh, user]);

  const leaveFamily = useCallback(async () => {
    if (!family) return;
    if (user) {
      await supabase.from("family_members").delete()
        .eq("family_id", family.id).eq("user_id", user.id);
    } else {
      await supabase.from("family_members").delete()
        .eq("family_id", family.id).eq("device_id", deviceId);
    }
    saveFamilyId(null);
    setFamily(null);
    setMembers([]);
  }, [family, deviceId, user]);

  const updateFamily = useCallback(async (patch: Partial<Family>) => {
    if (!family) return;
    await supabase.from("families").update(patch).eq("id", family.id);
    await refresh();
  }, [family, refresh]);

  const updateNickname = useCallback(async (nickname: string) => {
    if (!family) return;
    const q = supabase.from("family_members")
      .update({ nickname })
      .eq("family_id", family.id);
    if (user) q.eq("user_id", user.id);
    else q.eq("device_id", deviceId);
    await q;
    await refresh();
  }, [family, deviceId, refresh, user]);

  return {
    family, members, loading, isAdmin, deviceId,
    familyDeviceIds,
    createFamily, joinByCode, leaveFamily, updateFamily, updateNickname,
    refresh,
  };
}
