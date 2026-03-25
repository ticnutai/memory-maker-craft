import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AnimationRecord {
  id: string;
  event_type: string;
  animation_type: string;
  animation_url: string;
  is_active: boolean;
  duration_ms: number;
}

function getDeviceId(): string {
  return localStorage.getItem("memory-game-device-id") || "unknown";
}

export function useGameAnimations() {
  const animsRef = useRef<AnimationRecord[]>([]);
  const [showingAnimation, setShowingAnimation] = useState<{
    url: string;
    type: string;
    duration: number;
  } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("custom_animations")
        .select("id, event_type, animation_type, animation_url, is_active, duration_ms")
        .eq("device_id", getDeviceId())
        .eq("is_active", true);
      animsRef.current = (data as AnimationRecord[]) || [];
    };
    load();
  }, []);

  const triggerAnimation = useCallback((eventType: string) => {
    const candidates = animsRef.current.filter(a => a.event_type === eventType);
    if (candidates.length === 0) return false;

    const anim = candidates[Math.floor(Math.random() * candidates.length)];
    
    if (timerRef.current) clearTimeout(timerRef.current);
    
    setShowingAnimation({
      url: anim.animation_url,
      type: anim.animation_type,
      duration: anim.duration_ms,
    });

    timerRef.current = setTimeout(() => {
      setShowingAnimation(null);
    }, anim.duration_ms);

    return true;
  }, []);

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowingAnimation(null);
  }, []);

  return { showingAnimation, triggerAnimation, dismiss };
}
