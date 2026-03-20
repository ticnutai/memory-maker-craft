import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, Check, FolderUp, Image, Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface CloudGalleryProps {
  onSelect: (urls: string[]) => void;
  onClose: () => void;
  theme: "girl" | "boy";
}

const BUCKET = "game-images";
const ACCEPTED = "image/jpeg,image/png,image/gif,image/webp,image/svg+xml,image/bmp,image/tiff";

export default function CloudGallery({ onSelect, onClose, theme }: CloudGalleryProps) {
  const [images, setImages] = useState<{ name: string; url: string }[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);

  const accent = theme === "girl" ? "bg-game-pink" : "bg-game-blue";
  const accentBorder = theme === "girl" ? "border-game-pink" : "border-game-blue";
  const accentText = theme === "girl" ? "text-game-pink" : "text-game-blue";

  const loadImages = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.storage.from(BUCKET).list("", {
      limit: 200,
      sortBy: { column: "created_at", order: "desc" },
    });
    if (error) {
      toast.error("שגיאה בטעינת תמונות");
      setLoading(false);
      return;
    }
    const imgs = (data || [])
      .filter((f) => f.name && !f.name.startsWith("."))
      .map((f) => ({
        name: f.name,
        url: supabase.storage.from(BUCKET).getPublicUrl(f.name).data.publicUrl,
      }));
    setImages(imgs);
    setLoading(false);
  }, []);

  useEffect(() => { loadImages(); }, [loadImages]);

  const uploadFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) =>
      f.type.startsWith("image/") || f.name.endsWith(".gif") || f.name.endsWith(".svg")
    );
    if (fileArray.length === 0) {
      toast.error("לא נמצאו קבצי תמונה");
      return;
    }
    setUploading(true);
    let uploaded = 0;
    for (const file of fileArray) {
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(fileName, file, {
        contentType: file.type,
        cacheControl: "3600",
      });
      if (!error) uploaded++;
    }
    toast.success(`הועלו ${uploaded} תמונות בהצלחה!`);
    setUploading(false);
    loadImages();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) uploadFiles(e.target.files);
    e.target.value = "";
  };

  const toggleSelect = (url: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else if (next.size < 8) next.add(url);
      else toast.info("מקסימום 8 תמונות");
      return next;
    });
  };

  const deleteImage = async (name: string) => {
    const { error } = await supabase.storage.from(BUCKET).remove([name]);
    if (error) toast.error("שגיאה במחיקה");
    else {
      toast.success("נמחק!");
      setSelected((prev) => {
        const next = new Set(prev);
        const url = images.find((i) => i.name === name)?.url;
        if (url) next.delete(url);
        return next;
      });
      loadImages();
    }
  };

  const confirmSelection = () => {
    if (selected.size < 2) {
      toast.error("בחרו לפחות 2 תמונות");
      return;
    }
    onSelect(Array.from(selected));
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
      <div className="bg-card w-full max-w-lg max-h-[85vh] rounded-2xl shadow-2xl border-2 border-muted flex flex-col overflow-hidden bounce-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-muted">
          <h3 className="text-xl font-black flex items-center gap-2">
            <Image className="w-5 h-5" />
            גלריית תמונות ענן ☁️
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
          <input ref={fileRef} type="file" accept={ACCEPTED} multiple onChange={handleFileChange} className="hidden" />
          <input
            ref={folderRef}
            type="file"
            accept={ACCEPTED}
            onChange={handleFileChange}
            className="hidden"
            {...({ webkitdirectory: "", directory: "", multiple: true } as any)}
          />
        </div>

        <p className="text-[10px] text-muted-foreground text-center py-1">
          JPG, PNG, GIF, WebP, SVG, BMP • מינימום 2, מקסימום 8
        </p>

        {/* Gallery grid */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Image className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="font-bold">אין עדיין תמונות</p>
              <p className="text-xs mt-1">העלו תמונות כדי להתחיל!</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {images.map((img) => {
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
                      onClick={(e) => { e.stopPropagation(); deleteImage(img.name); }}
                      className="absolute top-1.5 left-1.5 w-6 h-6 bg-destructive rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3 text-destructive-foreground" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-muted flex gap-2">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            ביטול
          </Button>
          <button
            onClick={confirmSelection}
            disabled={selected.size < 2}
            className={`flex-1 h-11 rounded-xl font-bold text-sm transition-all active:scale-95 ${accent} text-primary-foreground shadow-md hover:opacity-90 disabled:opacity-50`}
          >
            🎮 התחלה עם {selected.size} תמונות
          </button>
        </div>
      </div>
    </div>
  );
}
