import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Trash2, Check } from "lucide-react";

const EVENT_TYPES = [
  { id: "match", label: "התאמה מוצלחת", emoji: "✅" },
  { id: "win", label: "ניצחון", emoji: "🏆" },
  { id: "mismatch", label: "טעות", emoji: "❌" },
  { id: "flip", label: "היפוך קלף", emoji: "🔄" },
];

function getDeviceId(): string {
  const key = "memory-game-device-id";
  return localStorage.getItem(key) || "unknown";
}

interface Recording {
  id: string;
  name: string;
  event_type: string;
  audio_url: string;
  is_active: boolean;
}

interface VoiceRecorderProps {
  theme: "girl" | "boy";
}

export default function VoiceRecorder({ theme }: VoiceRecorderProps) {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingName, setRecordingName] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("match");
  const [loading, setLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const playingRef = useRef<HTMLAudioElement | null>(null);

  const accent = theme === "girl" ? "bg-game-pink" : "bg-game-blue";

  useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = async () => {
    const { data } = await supabase
      .from("voice_recordings")
      .select("*")
      .eq("device_id", getDeviceId())
      .order("created_at", { ascending: false });
    if (data) setRecordings(data as Recording[]);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      alert("לא ניתן לגשת למיקרופון");
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;
    setLoading(true);

    await new Promise<void>((resolve) => {
      mediaRecorderRef.current!.onstop = () => {
        mediaRecorderRef.current!.stream.getTracks().forEach((t) => t.stop());
        resolve();
      };
      mediaRecorderRef.current!.stop();
    });

    setIsRecording(false);

    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    const fileName = `voice_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.webm`;

    const { error: uploadError } = await supabase.storage
      .from("game-audio")
      .upload(fileName, blob, { contentType: "audio/webm" });

    if (uploadError) {
      alert("שגיאה בהעלאה");
      setLoading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("game-audio").getPublicUrl(fileName);

    await supabase.from("voice_recordings").insert({
      device_id: getDeviceId(),
      name: recordingName || `הקלטה ${recordings.length + 1}`,
      event_type: selectedEvent,
      audio_url: urlData.publicUrl,
      is_active: true,
    } as any);

    setRecordingName("");
    setLoading(false);
    loadRecordings();
  };

  const deleteRecording = async (rec: Recording) => {
    // Extract filename from URL
    const parts = rec.audio_url.split("/");
    const fileName = parts[parts.length - 1];
    await supabase.storage.from("game-audio").remove([fileName]);
    await supabase.from("voice_recordings").delete().eq("id", rec.id);
    loadRecordings();
  };

  const toggleActive = async (rec: Recording) => {
    await supabase
      .from("voice_recordings")
      .update({ is_active: !rec.is_active } as any)
      .eq("id", rec.id);
    loadRecordings();
  };

  const playRecording = (url: string) => {
    if (playingRef.current) {
      playingRef.current.pause();
      playingRef.current = null;
    }
    const audio = new Audio(url);
    playingRef.current = audio;
    audio.play();
  };

  return (
    <div className="bg-card rounded-2xl p-5 shadow-lg border-2 border-muted space-y-4">
      <p className="font-bold text-lg text-center">🎙️ הקלטות קוליות</p>
      <p className="text-xs text-muted-foreground text-center">
        הקליטו הודעות כמו "כל הכבוד!" ושייכו אותן לאירועי משחק
      </p>

      {/* Event type selection */}
      <div>
        <p className="font-bold text-sm mb-2">🎯 סוג אירוע</p>
        <div className="grid grid-cols-2 gap-2">
          {EVENT_TYPES.map((ev) => (
            <button
              key={ev.id}
              onClick={() => setSelectedEvent(ev.id)}
              className={`h-10 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                selectedEvent === ev.id
                  ? `${accent} text-primary-foreground shadow-md`
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <span>{ev.emoji}</span>
              <span>{ev.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recording name */}
      <input
        type="text"
        placeholder='שם ההקלטה (לדוג׳ "כל הכבוד!")'
        value={recordingName}
        onChange={(e) => setRecordingName(e.target.value)}
        className="w-full h-10 rounded-xl bg-muted px-3 text-sm font-bold text-center border-2 border-muted-foreground/20 focus:border-foreground/40 outline-none transition-colors placeholder:text-muted-foreground/50"
        dir="auto"
      />

      {/* Record button */}
      <div className="flex justify-center">
        {isRecording ? (
          <button
            onClick={stopRecording}
            disabled={loading}
            className="w-20 h-20 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg animate-pulse transition-all active:scale-95"
          >
            <Square className="w-8 h-8" />
          </button>
        ) : (
          <button
            onClick={startRecording}
            disabled={loading}
            className={`w-20 h-20 rounded-full ${accent} text-primary-foreground flex items-center justify-center shadow-lg hover:shadow-xl transition-all active:scale-95`}
          >
            <Mic className="w-8 h-8" />
          </button>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground text-center">
        {isRecording ? "🔴 מקליט... לחצו לעצירה" : loading ? "⏳ שומר..." : "לחצו להקלטה"}
      </p>

      {/* Recordings list grouped by event */}
      {recordings.length > 0 && (
        <div className="space-y-3 pt-2">
          <p className="font-bold text-sm">📋 הקלטות שמורות</p>
          {EVENT_TYPES.map((ev) => {
            const evRecs = recordings.filter((r) => r.event_type === ev.id);
            if (evRecs.length === 0) return null;
            return (
              <div key={ev.id} className="space-y-1.5">
                <p className="text-xs font-bold text-muted-foreground">
                  {ev.emoji} {ev.label}
                </p>
                {evRecs.map((rec) => (
                  <div
                    key={rec.id}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 transition-all ${
                      rec.is_active ? "bg-accent/20 border border-accent" : "bg-muted/60 border border-transparent opacity-60"
                    }`}
                  >
                    <button
                      onClick={() => playRecording(rec.audio_url)}
                      className="text-accent hover:scale-110 transition-transform"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold flex-1 truncate">{rec.name}</span>
                    <button
                      onClick={() => toggleActive(rec)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                        rec.is_active
                          ? `${accent} text-primary-foreground`
                          : "bg-muted text-muted-foreground"
                      }`}
                      title={rec.is_active ? "פעיל" : "כבוי"}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteRecording(rec)}
                      className="text-destructive hover:text-destructive/80 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
