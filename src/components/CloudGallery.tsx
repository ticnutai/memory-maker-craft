import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, Check, FolderUp, Image, Loader2, X, Music, FileArchive, Play, Pause, Crop } from "lucide-react";
import { toast } from "sonner";
import JSZip from "jszip";
import ImageCropModal from "@/components/ImageCropModal";

interface CloudGalleryProps {
  onSelect: (urls: string[]) => void;
  onClose: () => void;
  theme: "girl" | "boy";
  mode?: "images" | "audio";
  onSelectAudio?: (url: string, name: string) => void;
}

const IMG_BUCKET = "game-images";
const AUDIO_BUCKET = "game-audio";
const IMG_ACCEPTED = "image/jpeg,image/png,image/gif,image/webp,image/svg+xml,image/bmp,image/tiff,.zip";
const AUDIO_ACCEPTED = "audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/m4a,audio/x-m4a,.mp3,.wav,.ogg,.m4a,.aac,.zip";

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "tiff"]);
const AUDIO_EXTS = new Set(["mp3", "wav", "ogg", "m4a", "aac", "flac", "wma"]);

export default function CloudGallery({ onSelect, onClose, theme, mode = "images", onSelectAudio }: CloudGalleryProps) {
  const [items, setItems] = useState<{ name: string; url: string }[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cropImage, setCropImage] = useState<{ url: string; name: string } | null>(null);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const isAudio = mode === "audio";
  const bucket = isAudio ? AUDIO_BUCKET : IMG_BUCKET;
  const accepted = isAudio ? AUDIO_ACCEPTED : IMG_ACCEPTED;
  const validExts = isAudio ? AUDIO_EXTS : IMAGE_EXTS;

  const accent = theme === "girl" ? "bg-game-pink" : "bg-game-blue";
  const accentBorder = theme === "girl" ? "border-game-pink" : "border-game-blue";

  const loadItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.storage.from(bucket).list("", {
      limit: 200,
      sortBy: { column: "created_at", order: "desc" },
    });
    if (error) {
      toast.error("שגיאה בטעינה");
      setLoading(false);
      return;
    }
    const results = (data || [])
      .filter((f) => f.name && !f.name.startsWith("."))
      .map((f) => ({
        name: f.name,
        url: supabase.storage.from(bucket).getPublicUrl(f.name).data.publicUrl,
      }));
    setItems(results);
    setLoading(false);
  }, [bucket]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const extractZip = async (file: File): Promise<File[]> => {
    const zip = await JSZip.loadAsync(file);
    const extracted: File[] = [];
    const entries = Object.entries(zip.files);
    for (const [path, entry] of entries) {
      if (entry.dir) continue;
      const ext = path.split(".").pop()?.toLowerCase() || "";
      if (!validExts.has(ext)) continue;
      const blob = await entry.async("blob");
      const name = path.split("/").pop() || `file.${ext}`;
      extracted.push(new File([blob], name, { type: blob.type || (isAudio ? "audio/mpeg" : "image/jpeg") }));
    }
    return extracted;
  };

  const uploadFiles = async (files: FileList | File[]) => {
    setUploading(true);
    let allFiles: File[] = [];

    for (const file of Array.from(files)) {
      if (file.name.toLowerCase().endsWith(".zip")) {
        try {
          const extracted = await extractZip(file);
          allFiles.push(...extracted);
          if (extracted.length > 0) {
            toast.info(`חולצו ${extracted.length} קבצים מ-${file.name}`);
          }
        } catch {
          toast.error(`שגיאה בפתיחת ${file.name}`);
        }
      } else {
        const ext = file.name.split(".").pop()?.toLowerCase() || "";
        if (validExts.has(ext) || (isAudio && file.type.startsWith("audio/")) || (!isAudio && file.type.startsWith("image/"))) {
          allFiles.push(file);
        }
      }
    }

    if (allFiles.length === 0) {
      toast.error(isAudio ? "לא נמצאו קבצי שמע" : "לא נמצאו קבצי תמונה");
      setUploading(false);
      return;
    }

    let uploaded = 0;
    for (const file of allFiles) {
      const ext = file.name.split(".").pop() || (isAudio ? "mp3" : "jpg");
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(fileName, file, {
        contentType: file.type,
        cacheControl: "3600",
      });
      if (!error) uploaded++;
    }
    toast.success(`הועלו ${uploaded} קבצים בהצלחה!`);
    setUploading(false);
    loadItems();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) uploadFiles(e.target.files);
    e.target.value = "";
  };

  const toggleSelect = (url: string) => {
    if (isAudio) {
      // For audio, single select
      setSelected(new Set([url]));
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else if (next.size < 8) next.add(url);
      else toast.info("מקסימום 8 תמונות");
      return next;
    });
  };

  const deleteItem = async (name: string) => {
    const { error } = await supabase.storage.from(bucket).remove([name]);
    if (error) toast.error("שגיאה במחיקה");
    else {
      toast.success("נמחק!");
      setSelected((prev) => {
        const next = new Set(prev);
        const url = items.find((i) => i.name === name)?.url;
        if (url) next.delete(url);
        return next;
      });
      loadItems();
    }
  };

  const togglePlay = (url: string) => {
    if (playingUrl === url) {
      audioPlayerRef.current?.pause();
      setPlayingUrl(null);
    } else {
      if (audioPlayerRef.current) audioPlayerRef.current.pause();
      const audio = new Audio(url);
      audio.onended = () => setPlayingUrl(null);
      audio.play();
      audioPlayerRef.current = audio;
      setPlayingUrl(url);
    }
  };

  const confirmSelection = () => {
    if (isAudio) {
      const url = Array.from(selected)[0];
      if (!url) { toast.error("בחרו קובץ שמע"); return; }
      const item = items.find((i) => i.url === url);
      onSelectAudio?.(url, item?.name || "שיר מהענן");
      return;
    }
    if (selected.size < 2) { toast.error("בחרו לפחות 2 תמונות"); return; }
    onSelect(Array.from(selected));
  };

  useEffect(() => {
    return () => { audioPlayerRef.current?.pause(); };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
      <div className="bg-card w-full max-w-lg max-h-[85vh] rounded-2xl shadow-2xl border-2 border-muted flex flex-col overflow-hidden bounce-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-muted">
          <h3 className="text-xl font-black flex items-center gap-2">
            {isAudio ? <Music className="w-5 h-5" /> : <Image className="w-5 h-5" />}
            {isAudio ? "🎵 מוזיקה מהענן" : "☁️ גלריית תמונות ענן"}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload buttons */}
        <div className="flex gap-2 px-5 py-3 border-b border-muted">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className={`flex-1 h-11 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${accent} text-primary-foreground shadow-md hover:opacity-90 disabled:opacity-50`}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            העלאת קבצים
          </button>
          <button
            onClick={() => folderRef.current?.click()}
            disabled={uploading}
            className={`flex-1 h-11 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${accent} text-primary-foreground shadow-md hover:opacity-90 disabled:opacity-50`}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderUp className="w-4 h-4" />}
            העלאת תיקייה
          </button>
          <input ref={fileRef} type="file" accept={accepted} multiple onChange={handleFileChange} className="hidden" />
          <input
            ref={folderRef}
            type="file"
            accept={accepted}
            onChange={handleFileChange}
            className="hidden"
            {...({ webkitdirectory: "", directory: "", multiple: true } as any)}
          />
        </div>

        <p className="text-[10px] text-muted-foreground text-center py-1">
          {isAudio
            ? "MP3, WAV, M4A, OGG, AAC, ZIP • בחרו שיר אחד"
            : "JPG, PNG, GIF, WebP, SVG, BMP, ZIP • מינימום 2, מקסימום 8"}
        </p>

        {/* Gallery / List */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {isAudio ? <Music className="w-12 h-12 mx-auto mb-3 opacity-40" /> : <Image className="w-12 h-12 mx-auto mb-3 opacity-40" />}
              <p className="font-bold">{isAudio ? "אין עדיין שירים" : "אין עדיין תמונות"}</p>
              <p className="text-xs mt-1">העלו קבצים כדי להתחיל!</p>
            </div>
          ) : isAudio ? (
            <div className="space-y-2">
              {items.map((item) => {
                const isSelected = selected.has(item.url);
                const isPlaying = playingUrl === item.url;
                return (
                  <div
                    key={item.name}
                    onClick={() => toggleSelect(item.url)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.98] ${
                      isSelected ? `${accentBorder} shadow-md` : "border-muted hover:border-muted-foreground/40"
                    }`}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePlay(item.url); }}
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${accent} text-primary-foreground`}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <span className="text-sm font-medium truncate flex-1">{item.name}</span>
                    {isSelected && (
                      <div className={`w-6 h-6 ${accent} rounded-full flex items-center justify-center`}>
                        <Check className="w-3.5 h-3.5 text-primary-foreground" />
                      </div>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteItem(item.name); }}
                      className="text-destructive hover:text-destructive/80 transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {items.map((img) => {
                const isSelected = selected.has(img.url);
                return (
                  <div
                    key={img.name}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all hover:scale-[1.03] active:scale-95 group ${
                      isSelected ? `${accentBorder} shadow-lg ring-2 ring-offset-1 ${theme === "girl" ? "ring-game-pink" : "ring-game-blue"}` : "border-muted hover:border-muted-foreground/40"
                    }`}
                    onClick={() => toggleSelect(img.url)}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    {isSelected && (
                      <div className={`absolute top-1.5 right-1.5 w-6 h-6 ${accent} rounded-full flex items-center justify-center shadow-md`}>
                        <Check className="w-3.5 h-3.5 text-primary-foreground" />
                      </div>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteItem(img.name); }}
                      className="absolute top-1.5 left-1.5 w-6 h-6 bg-destructive rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3 text-destructive-foreground" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setCropImage({ url: img.url, name: img.name }); }}
                      className="absolute bottom-1.5 left-1.5 w-6 h-6 bg-foreground/80 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                      title="חיתוך והתאמה"
                    >
                      <Crop className="w-3 h-3 text-background" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-muted flex gap-2">
          <Button variant="ghost" onClick={onClose} className="flex-1">ביטול</Button>
          <button
            onClick={confirmSelection}
            disabled={isAudio ? selected.size === 0 : selected.size < 2}
            className={`flex-1 h-11 rounded-xl font-bold text-sm transition-all active:scale-95 ${accent} text-primary-foreground shadow-md hover:opacity-90 disabled:opacity-50`}
          >
            {isAudio ? `🎵 בחירת שיר` : `🎮 התחלה עם ${selected.size} תמונות`}
          </button>
        </div>
      </div>

      {/* Crop Modal */}
      {cropImage && !isAudio && (
        <ImageCropModal
          imageUrl={cropImage.url}
          theme={theme}
          onClose={() => setCropImage(null)}
          onSave={async (croppedDataUrl) => {
            // Upload cropped image as new file
            const res = await fetch(croppedDataUrl);
            const blob = await res.blob();
            const fileName = `cropped-${Date.now()}.jpg`;
            const { error } = await supabase.storage.from(bucket).upload(fileName, blob, {
              contentType: "image/jpeg",
              cacheControl: "3600",
            });
            if (error) {
              toast.error("שגיאה בשמירת התמונה החתוכה");
            } else {
              toast.success("התמונה החתוכה נשמרה!");
              loadItems();
            }
            setCropImage(null);
          }}
        />
      )}
    </div>
  );
}
