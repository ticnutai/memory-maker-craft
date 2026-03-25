import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles, Upload, Trash2, Play, Pause, Eye, EyeOff,
  Film, Zap, Trophy, RotateCcw, Plus, X, Check
} from "lucide-react";

function getDeviceId(): string {
  return localStorage.getItem("memory-game-device-id") || "unknown";
}

interface AnimationRecord {
  id: string;
  name: string;
  event_type: string;
  animation_type: string;
  animation_url: string;
  is_active: boolean;
  duration_ms: number;
  created_at: string;
}

const EVENT_TYPES = [
  { key: "match", label: "התאמה", icon: Zap, color: "text-green-400" },
  { key: "win", label: "ניצחון", icon: Trophy, color: "text-yellow-400" },
  { key: "flip", label: "היפוך", icon: RotateCcw, color: "text-blue-400" },
  { key: "mismatch", label: "אי-התאמה", icon: X, color: "text-red-400" },
];

export default function AnimationManager() {
  const [animations, setAnimations] = useState<AnimationRecord[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState("match");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("custom_animations")
      .select("*")
      .eq("device_id", getDeviceId())
      .order("created_at", { ascending: false });
    if (data) setAnimations(data as AnimationRecord[]);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isGif = file.type === "image/gif";
    const isLottie = file.name.endsWith(".json");
    const isVideo = file.type.startsWith("video/");
    const isWebp = file.type === "image/webp";

    if (!isGif && !isLottie && !isVideo && !isWebp) {
      alert("נתמכים: GIF, WebP, JSON (Lottie), MP4, WebM");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "gif";
      const path = `${getDeviceId()}/${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("game-animations")
        .upload(path, file, { contentType: file.type });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("game-animations")
        .getPublicUrl(path);

      const animType = isLottie ? "lottie" : isVideo ? "video" : "gif";
      const name = file.name.replace(/\.[^.]+$/, "");

      await supabase.from("custom_animations").insert({
        device_id: getDeviceId(),
        name,
        event_type: selectedEvent,
        animation_type: animType,
        animation_url: urlData.publicUrl,
        is_active: true,
        duration_ms: 2000,
      });

      await load();
      setShowUpload(false);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const toggleActive = async (anim: AnimationRecord) => {
    await supabase
      .from("custom_animations")
      .update({ is_active: !anim.is_active })
      .eq("id", anim.id);
    await load();
  };

  const deleteAnim = async (anim: AnimationRecord) => {
    // Extract path from URL
    const url = new URL(anim.animation_url);
    const pathParts = url.pathname.split("/game-animations/");
    if (pathParts[1]) {
      await supabase.storage.from("game-animations").remove([decodeURIComponent(pathParts[1])]);
    }
    await supabase.from("custom_animations").delete().eq("id", anim.id);
    await load();
  };

  const updateDuration = async (anim: AnimationRecord, ms: number) => {
    await supabase
      .from("custom_animations")
      .update({ duration_ms: ms })
      .eq("id", anim.id);
    await load();
  };

  const grouped = EVENT_TYPES.map(et => ({
    ...et,
    items: animations.filter(a => a.event_type === et.key),
  }));

  return (
    <div className="bg-muted/50 rounded-xl p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-xs flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" /> אנימציות מתקדמות
        </h4>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary text-[10px] font-bold transition-colors"
        >
          <Plus className="w-3 h-3" /> העלאה
        </button>
      </div>

      {/* Upload area */}
      {showUpload && (
        <div className="bg-background/60 rounded-lg p-3 space-y-2 border border-primary/20">
          <p className="text-[11px] text-muted-foreground">בחר סוג אירוע ולאחר מכן העלה קובץ אנימציה</p>
          
          <div className="flex gap-1.5 flex-wrap">
            {EVENT_TYPES.map(et => {
              const Icon = et.icon;
              return (
                <button
                  key={et.key}
                  onClick={() => setSelectedEvent(et.key)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-all ${
                    selectedEvent === et.key
                      ? "bg-primary text-primary-foreground scale-105"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <Icon className="w-3 h-3" /> {et.label}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".gif,.json,.webp,.mp4,.webm"
              onChange={handleUpload}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-dashed border-primary/30 hover:border-primary/60 text-primary text-xs font-bold transition-all hover:bg-primary/5 disabled:opacity-50"
            >
              {uploading ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {uploading ? "מעלה..." : "GIF / WebP / Lottie / Video"}
            </button>
          </div>

          <p className="text-[9px] text-muted-foreground/60 text-center">
            נתמכים: GIF, WebP (מונפש), JSON (Lottie), MP4, WebM • מקסימום 20MB
          </p>
        </div>
      )}

      {/* Grouped by event */}
      {grouped.map(group => (
        <div key={group.key} className="space-y-1">
          <div className="flex items-center gap-1.5">
            <group.icon className={`w-3 h-3 ${group.color}`} />
            <span className="text-[10px] font-bold text-muted-foreground">{group.label}</span>
            <span className="text-[9px] text-muted-foreground/50">({group.items.length})</span>
          </div>

          {group.items.length === 0 && (
            <p className="text-[9px] text-muted-foreground/40 pr-5">אין אנימציות</p>
          )}

          {group.items.map(anim => (
            <div
              key={anim.id}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all ${
                anim.is_active ? "bg-background/60" : "bg-background/30 opacity-60"
              }`}
            >
              {/* Thumbnail */}
              <button
                onClick={() => setPreviewUrl(previewUrl === anim.animation_url ? null : anim.animation_url)}
                className="w-8 h-8 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0 hover:ring-2 ring-primary/40 transition-all"
              >
                {anim.animation_type === "gif" || anim.animation_type === "video" ? (
                  <img src={anim.animation_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Film className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold truncate">{anim.name}</p>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-muted-foreground">{anim.animation_type}</span>
                  <span className="text-[9px] text-muted-foreground/40">•</span>
                  <select
                    value={anim.duration_ms}
                    onChange={e => updateDuration(anim, Number(e.target.value))}
                    className="text-[9px] bg-transparent text-muted-foreground border-none outline-none cursor-pointer"
                  >
                    <option value={500}>0.5s</option>
                    <option value={1000}>1s</option>
                    <option value={1500}>1.5s</option>
                    <option value={2000}>2s</option>
                    <option value={3000}>3s</option>
                    <option value={5000}>5s</option>
                  </select>
                </div>
              </div>

              {/* Toggle active */}
              <button
                onClick={() => toggleActive(anim)}
                className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                  anim.is_active ? "text-green-400 hover:bg-green-400/10" : "text-muted-foreground hover:bg-muted"
                }`}
                title={anim.is_active ? "פעיל" : "כבוי"}
              >
                {anim.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              </button>

              {/* Delete */}
              <button
                onClick={() => deleteAnim(anim)}
                className="w-6 h-6 rounded flex items-center justify-center text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                title="מחק"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      ))}

      {/* Preview overlay */}
      {previewUrl && (
        <div className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center" onClick={() => setPreviewUrl(null)}>
          <div className="relative max-w-[80vw] max-h-[80vh]" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-background shadow-lg flex items-center justify-center z-10"
            >
              <X className="w-4 h-4" />
            </button>
            {previewUrl.endsWith(".mp4") || previewUrl.endsWith(".webm") ? (
              <video src={previewUrl} autoPlay loop muted className="max-w-full max-h-[70vh] rounded-xl shadow-2xl" />
            ) : (
              <img src={previewUrl} alt="preview" className="max-w-full max-h-[70vh] rounded-xl shadow-2xl" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
