import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Trash2, Check, Upload } from "lucide-react";

const EVENT_TYPES = [
  { id: "match", label: "התאמה מוצלחת", emoji: "✅" },
  { id: "win", label: "ניצחון", emoji: "🏆" },
  { id: "mismatch", label: "טעות", emoji: "❌" },
  { id: "flip", label: "היפוך קלף", emoji: "🔄" },
];

const VOICE_EFFECTS = [
  { id: "none", label: "רגיל", emoji: "🎤" },
  { id: "robot", label: "רובוט", emoji: "🤖" },
  { id: "chipmunk", label: "צ'יפמאנק", emoji: "🐿️" },
  { id: "deep", label: "עמוק", emoji: "🐻" },
  { id: "echo", label: "הד", emoji: "🏔️" },
  { id: "alien", label: "חייזר", emoji: "👽" },
  { id: "megaphone", label: "מגפון", emoji: "📢" },
];

function getDeviceId(): string {
  const key = "memory-game-device-id";
  return localStorage.getItem(key) || "unknown";
}

async function applyEffect(blob: Blob, effectId: string): Promise<Blob> {
  if (effectId === "none") return blob;

  const audioCtx = new OfflineAudioContext(1, 1, 44100);
  const arrayBuffer = await blob.arrayBuffer();
  let decoded: AudioBuffer;
  try {
    decoded = await audioCtx.decodeAudioData(arrayBuffer);
  } catch {
    // If decoding fails, return original
    return blob;
  }

  const duration = decoded.duration;
  const sampleRate = 44100;

  // For echo, we need extra time
  const extraTime = effectId === "echo" ? 1.5 : 0;
  const totalDuration = duration + extraTime;

  const offlineCtx = new OfflineAudioContext(1, Math.ceil(totalDuration * sampleRate), sampleRate);
  const source = offlineCtx.createBufferSource();
  source.buffer = decoded;

  let lastNode: AudioNode = source;

  switch (effectId) {
    case "chipmunk":
      source.playbackRate.value = 1.6;
      break;
    case "deep":
      source.playbackRate.value = 0.7;
      break;
    case "robot": {
      // Ring modulation for robotic effect
      const oscGain = offlineCtx.createGain();
      oscGain.gain.value = 0.4;
      const osc = offlineCtx.createOscillator();
      osc.frequency.value = 50;
      osc.type = "square";
      osc.connect(oscGain);
      osc.start();

      const merger = offlineCtx.createGain();
      merger.gain.value = 1;
      lastNode.connect(merger);
      oscGain.connect(merger.gain);
      lastNode = merger;
      break;
    }
    case "echo": {
      const delay = offlineCtx.createDelay(1.0);
      delay.delayTime.value = 0.25;
      const feedback = offlineCtx.createGain();
      feedback.gain.value = 0.4;
      const dry = offlineCtx.createGain();
      dry.gain.value = 1;
      const wet = offlineCtx.createGain();
      wet.gain.value = 0.6;
      const merger = offlineCtx.createGain();

      lastNode.connect(dry);
      lastNode.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(wet);
      dry.connect(merger);
      wet.connect(merger);
      lastNode = merger;
      break;
    }
    case "alien": {
      source.playbackRate.value = 1.3;
      const osc2 = offlineCtx.createOscillator();
      osc2.frequency.value = 30;
      osc2.type = "sine";
      const oscGain2 = offlineCtx.createGain();
      oscGain2.gain.value = 0.3;
      osc2.connect(oscGain2);
      osc2.start();
      const merger2 = offlineCtx.createGain();
      merger2.gain.value = 1;
      lastNode.connect(merger2);
      oscGain2.connect(merger2.gain);
      lastNode = merger2;
      break;
    }
    case "megaphone": {
      const bandpass = offlineCtx.createBiquadFilter();
      bandpass.type = "bandpass";
      bandpass.frequency.value = 2000;
      bandpass.Q.value = 0.8;
      const distGain = offlineCtx.createGain();
      distGain.gain.value = 2.5;
      lastNode.connect(distGain);
      distGain.connect(bandpass);
      lastNode = bandpass;
      break;
    }
  }

  lastNode.connect(offlineCtx.destination);
  source.start(0);

  const rendered = await offlineCtx.startRendering();

  // Convert to WAV blob
  const wavBlob = audioBufferToWav(rendered);
  return wavBlob;
}

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length * numChannels * 2 + 44;
  const out = new ArrayBuffer(length);
  const view = new DataView(out);
  const channels: Float32Array[] = [];

  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  let offset = 0;
  const writeString = (s: string) => {
    for (let i = 0; i < s.length; i++) { view.setUint8(offset++, s.charCodeAt(i)); }
  };
  const writeUint32 = (v: number) => { view.setUint32(offset, v, true); offset += 4; };
  const writeUint16 = (v: number) => { view.setUint16(offset, v, true); offset += 2; };

  writeString("RIFF");
  writeUint32(length - 8);
  writeString("WAVE");
  writeString("fmt ");
  writeUint32(16);
  writeUint16(1); // PCM
  writeUint16(numChannels);
  writeUint32(sampleRate);
  writeUint32(sampleRate * numChannels * 2);
  writeUint16(numChannels * 2);
  writeUint16(16);
  writeString("data");
  writeUint32(buffer.length * numChannels * 2);

  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }

  return new Blob([out], { type: "audio/wav" });
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
  const [selectedEffect, setSelectedEffect] = useState("none");
  const [loading, setLoading] = useState(false);
  const [processingEffect, setProcessingEffect] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const playingRef = useRef<HTMLAudioElement | null>(null);
  const rawBlobRef = useRef<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      rawBlobRef.current = null;
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
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

    const rawBlob = new Blob(chunksRef.current, { type: "audio/webm" });
    rawBlobRef.current = rawBlob;

    // Apply effect
    setProcessingEffect(true);
    let finalBlob: Blob;
    try {
      finalBlob = await applyEffect(rawBlob, selectedEffect);
    } catch {
      finalBlob = rawBlob;
    }
    setProcessingEffect(false);

    const ext = selectedEffect === "none" ? "webm" : "wav";
    const contentType = selectedEffect === "none" ? "audio/webm" : "audio/wav";
    const fileName = `voice_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("game-audio")
      .upload(fileName, finalBlob, { contentType });

    if (uploadError) {
      alert("שגיאה בהעלאה");
      setLoading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("game-audio").getPublicUrl(fileName);

    const effectLabel = VOICE_EFFECTS.find((e) => e.id === selectedEffect);
    const nameWithEffect = selectedEffect !== "none"
      ? `${recordingName || `הקלטה ${recordings.length + 1}`} (${effectLabel?.label})`
      : recordingName || `הקלטה ${recordings.length + 1}`;

    await supabase.from("voice_recordings").insert({
      device_id: getDeviceId(),
      name: nameWithEffect,
      event_type: selectedEvent,
      audio_url: urlData.publicUrl,
      is_active: true,
    } as any);

    setRecordingName("");
    setLoading(false);
    loadRecordings();
  };

  const deleteRecording = async (rec: Recording) => {
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

  // Preview effect on last raw recording
  const previewEffect = async (effectId: string) => {
    if (!rawBlobRef.current) return;
    setProcessingEffect(true);
    try {
      const processed = await applyEffect(rawBlobRef.current, effectId);
      const url = URL.createObjectURL(processed);
      if (playingRef.current) playingRef.current.pause();
      const audio = new Audio(url);
      playingRef.current = audio;
      audio.play();
      audio.onended = () => URL.revokeObjectURL(url);
    } catch {}
    setProcessingEffect(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);

    // Read file as blob
    const rawBlob = new Blob([await file.arrayBuffer()], { type: file.type });
    rawBlobRef.current = rawBlob;

    // Apply effect
    setProcessingEffect(true);
    let finalBlob: Blob;
    try {
      finalBlob = await applyEffect(rawBlob, selectedEffect);
    } catch {
      finalBlob = rawBlob;
    }
    setProcessingEffect(false);

    const ext = selectedEffect === "none" ? (file.name.split(".").pop() || "mp3") : "wav";
    const contentType = selectedEffect === "none" ? file.type : "audio/wav";
    const fileName = `voice_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("game-audio")
      .upload(fileName, finalBlob, { contentType });

    if (uploadError) {
      alert("שגיאה בהעלאה");
      setLoading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("game-audio").getPublicUrl(fileName);

    const effectLabel = VOICE_EFFECTS.find((ef) => ef.id === selectedEffect);
    const baseName = recordingName || file.name.replace(/\.[^.]+$/, "");
    const nameWithEffect = selectedEffect !== "none"
      ? `${baseName} (${effectLabel?.label})`
      : baseName;

    await supabase.from("voice_recordings").insert({
      device_id: getDeviceId(),
      name: nameWithEffect,
      event_type: selectedEvent,
      audio_url: urlData.publicUrl,
      is_active: true,
    } as any);

    setRecordingName("");
    setLoading(false);
    e.target.value = "";
    loadRecordings();
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

      {/* Voice effect selection */}
      <div>
        <p className="font-bold text-sm mb-2">✨ אפקט קול</p>
        <div className="grid grid-cols-4 gap-1.5">
          {VOICE_EFFECTS.map((fx) => (
            <button
              key={fx.id}
              onClick={() => {
                setSelectedEffect(fx.id);
                if (rawBlobRef.current) previewEffect(fx.id);
              }}
              className={`h-14 rounded-xl text-[10px] font-bold transition-all active:scale-95 flex flex-col items-center justify-center gap-0.5 ${
                selectedEffect === fx.id
                  ? `${accent} text-primary-foreground shadow-md`
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <span className="text-lg">{fx.emoji}</span>
              <span>{fx.label}</span>
            </button>
          ))}
        </div>
        {processingEffect && (
          <p className="text-[10px] text-muted-foreground text-center mt-1 animate-pulse">⏳ מעבד אפקט...</p>
        )}
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

      {/* Record / Upload buttons */}
      <div className="flex justify-center gap-4 items-end">
        <div className="flex flex-col items-center gap-1">
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
              disabled={loading || processingEffect}
              className={`w-20 h-20 rounded-full ${accent} text-primary-foreground flex items-center justify-center shadow-lg hover:shadow-xl transition-all active:scale-95`}
            >
              <Mic className="w-8 h-8" />
            </button>
          )}
          <span className="text-[10px] text-muted-foreground font-bold">הקלטה</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || processingEffect}
            className="w-16 h-16 rounded-full bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center shadow-md hover:shadow-lg transition-all active:scale-95 border-2 border-dashed border-muted-foreground/30"
          >
            <Upload className="w-7 h-7" />
          </button>
          <span className="text-[10px] text-muted-foreground font-bold">העלאת קובץ</span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.m4a,.ogg,.aac,.webm"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>
      <p className="text-[10px] text-muted-foreground text-center">
        {isRecording ? "🔴 מקליט... לחצו לעצירה" : loading ? "⏳ שומר..." : processingEffect ? "✨ מעבד אפקט..." : "הקליטו או העלו קובץ MP3/WAV"}
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
