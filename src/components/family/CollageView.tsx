import { useEffect, useRef, useState } from "react";
import { Plus, Upload, Download, Play, Trash2, Settings, ArrowLeft, GripVertical, Pencil, Share2, Copy, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useFamilyPhotos, FamilyPhoto, FamilyCollage } from "@/hooks/useFamilyCollages";
import CloudGallery from "@/components/CloudGallery";
import * as htmlToImage from "html-to-image";
import { toast } from "sonner";

interface CollageViewProps {
  collage: FamilyCollage;
  onBack: () => void;
  onUpdateCollage: (id: string, patch: Partial<FamilyCollage>) => Promise<void>;
}

const LAYOUTS = [
  { id: "grid", label: "רשת" },
  { id: "masonry", label: "פסיפס" },
  { id: "freeform", label: "חופשי" },
  { id: "template-polaroid", label: "פולארויד" },
  { id: "template-heart", label: "לב" },
] as const;

const FILTERS = [
  { id: "none", label: "ללא", css: "" },
  { id: "grayscale", label: "שחור-לבן", css: "grayscale(100%)" },
  { id: "sepia", label: "ספיה", css: "sepia(100%)" },
  { id: "warm", label: "חמים", css: "saturate(140%) hue-rotate(-10deg) brightness(1.05)" },
  { id: "cool", label: "קר", css: "saturate(110%) hue-rotate(15deg) brightness(0.95)" },
];

const FRAMES = [
  { id: "none", label: "ללא", className: "" },
  { id: "white", label: "לבן", className: "bg-white p-2 shadow-md" },
  { id: "polaroid", label: "פולארויד", className: "bg-white p-2 pb-8 shadow-lg" },
  { id: "rounded", label: "מעוגל", className: "rounded-2xl overflow-hidden shadow-lg" },
  { id: "circle", label: "עיגול", className: "rounded-full overflow-hidden shadow-lg" },
];

export default function CollageView({ collage, onBack, onUpdateCollage }: CollageViewProps) {
  const { photos, uploadFiles, addFromUrls, updatePhoto, deletePhoto, reorderPhotos } = useFamilyPhotos(collage.id);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const collageRef = useRef<HTMLDivElement>(null);
  const [editingPhoto, setEditingPhoto] = useState<FamilyPhoto | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [slideshow, setSlideshow] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const dragCounterRef = useRef(0);
  const [showShare, setShowShare] = useState(false);
  const [showCloud, setShowCloud] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState({
    name: collage.name,
    emoji: collage.emoji ?? "",
    layout_type: collage.layout_type,
    cols: collage.cols,
    gap: collage.gap,
    background: collage.background ?? "#ffffff",
  });

  useEffect(() => {
    if (!showSettings) return;
    setSettingsDraft({
      name: collage.name,
      emoji: collage.emoji ?? "",
      layout_type: collage.layout_type,
      cols: collage.cols,
      gap: collage.gap,
      background: collage.background ?? "#ffffff",
    });
  }, [showSettings, collage]);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await onUpdateCollage(collage.id, {
        name: settingsDraft.name.trim() || collage.name,
        emoji: settingsDraft.emoji.trim() || null,
        layout_type: settingsDraft.layout_type,
        cols: settingsDraft.cols,
        gap: settingsDraft.gap,
        background: settingsDraft.background,
      });
      setShowSettings(false);
      toast.success("ההגדרות נשמרו");
    } catch {
      toast.error("שגיאה בשמירת ההגדרות");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const { isArchiveFile, extractMediaFromArchive } = await import("@/lib/archiveExtract");
      const allFiles: File[] = [];
      const archiveErrors: string[] = [];

      for (const file of Array.from(files)) {
        console.log("[handleFiles] file:", file.name, "type:", file.type, "isArchive:", isArchiveFile(file));
        if (isArchiveFile(file)) {
          const { files: extracted, error } = await extractMediaFromArchive(file);
          console.log("[handleFiles] extracted:", extracted.length, "error:", error);
          if (error) archiveErrors.push(error);
          allFiles.push(...extracted);
        } else {
          allFiles.push(file);
        }
      }

      if (archiveErrors.length > 0) {
        archiveErrors.forEach(e => toast.error(e));
      }

      if (allFiles.length > 0) {
        await uploadFiles(allFiles);
        const vids = allFiles.filter(f => f.type.startsWith("video/")).length;
        const imgs = allFiles.length - vids;
        const parts: string[] = [];
        if (imgs > 0) parts.push(`${imgs} תמונות`);
        if (vids > 0) parts.push(`${vids} סרטונים`);
        toast.success(`הועלו ${parts.join(" + ")}`);
      } else if (archiveErrors.length === 0) {
        toast.info("לא נמצאו תמונות או סרטונים בארכיון");
      }
    } catch (e) {
      toast.error("שגיאה בהעלאה");
    } finally {
      setUploading(false);
    }
  };

  const handleExport = async () => {
    if (!collageRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(collageRef.current, { pixelRatio: 2, backgroundColor: collage.background ?? "#fff" });
      const link = document.createElement("a");
      link.download = `${collage.name}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("הקולאז׳ יוצא בהצלחה");
    } catch {
      toast.error("שגיאה בייצוא");
    }
  };

  const handleShare = async () => {
    if (!collageRef.current) return;
    try {
      const blob = await htmlToImage.toBlob(collageRef.current, { pixelRatio: 2, backgroundColor: collage.background ?? "#fff" });
      if (!blob) throw new Error();
      if (navigator.share && navigator.canShare?.({ files: [new File([blob], "collage.png", { type: "image/png" })] })) {
        await navigator.share({ files: [new File([blob], `${collage.name}.png`, { type: "image/png" })], title: collage.name });
      } else {
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
      }
    } catch {
      toast.error("שיתוף לא זמין");
    }
  };

  const onDragStart = (id: string) => setDraggedId(id);
  const onDropOn = async (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    const ids = photos.map(p => p.id);
    const from = ids.indexOf(draggedId);
    const to = ids.indexOf(targetId);
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    setDraggedId(null);
    await reorderPhotos(ids);
  };

  const renderPhoto = (p: FamilyPhoto, extraClass = "") => {
    const filter = FILTERS.find(f => f.id === p.filter_style)?.css ?? "";
    const frame = FRAMES.find(f => f.id === p.frame_style) ?? FRAMES[0];
    const isVideo = p.media_type === "video";
    return (
      <div
        key={p.id}
        draggable
        onDragStart={() => onDragStart(p.id)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => onDropOn(p.id)}
        className={`group relative ${frame.className} ${extraClass}`}
      >
        {isVideo ? (
          <video
            src={p.image_url}
            poster={p.thumbnail_url ?? undefined}
            style={{ filter }}
            className="w-full h-full object-cover block bg-black"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        ) : (
          <img src={p.image_url} alt={p.caption ?? ""} style={{ filter }} className="w-full h-full object-cover block" loading="lazy" />
        )}
        {p.caption && <div className="text-xs text-center mt-1 px-1 truncate">{p.caption}</div>}
        {p.photo_date && <div className="text-[10px] text-center text-foreground/60 px-1">{p.photo_date}</div>}
        {isVideo && (
          <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full backdrop-blur-sm">
            🎬 וידאו
          </div>
        )}
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button onClick={() => setEditingPhoto(p)} className="bg-background/90 rounded-full p-1 shadow"><Pencil className="w-3 h-3" /></button>
          <button onClick={() => deletePhoto(p.id)} className="bg-destructive/90 text-destructive-foreground rounded-full p-1 shadow"><Trash2 className="w-3 h-3" /></button>
        </div>
        <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-4 h-4 text-foreground/60" />
        </div>
      </div>
    );
  };

  const layoutType = collage.layout_type;
  const cols = collage.cols;
  const gap = collage.gap;

  return (
    <div
      className="min-h-screen pt-14 pb-20 px-3 relative"
      onDragEnter={(e) => { e.preventDefault(); dragCounterRef.current++; setIsDraggingOver(true); }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => { e.preventDefault(); dragCounterRef.current--; if (dragCounterRef.current <= 0) { dragCounterRef.current = 0; setIsDraggingOver(false); } }}
      onDrop={(e) => { e.preventDefault(); dragCounterRef.current = 0; setIsDraggingOver(false); handleFiles(e.dataTransfer.files); }}
    >
      {/* Drag & Drop overlay */}
      {isDraggingOver && (
        <div className="fixed inset-0 z-[200] bg-primary/20 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="bg-background border-2 border-dashed border-primary rounded-2xl p-12 text-center shadow-2xl">
            <Upload className="w-16 h-16 mx-auto mb-4 text-primary animate-bounce" />
            <div className="text-xl font-bold text-foreground">שחרר קבצים כאן 📸🎬</div>
            <div className="text-sm text-muted-foreground mt-1">תמונות, סרטונים או קבצי ZIP</div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="fixed top-[max(0.5rem,env(safe-area-inset-top))] right-3 z-[80] flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
        <span className="font-bold text-sm truncate max-w-[40vw]">{collage.emoji} {collage.name}</span>
      </div>
      <div className="fixed top-[max(0.5rem,env(safe-area-inset-top))] left-3 z-[80] flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={uploading} title="הוסף תמונות">
          <Plus className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={uploading} title="העלאת קובץ מרובה">
          <Upload className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setShowCloud(true)} title="בחר מהענן">
          <Cloud className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setSlideIndex(0); setSlideshow(true); }} title="מצגת" disabled={photos.length === 0}>
          <Play className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={handleExport} title="ייצוא PNG" disabled={photos.length === 0}>
          <Download className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setShowShare(true)} title="שתף עם משפחה">
          <Share2 className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setShowSettings(true)} title="הגדרות">
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,.zip,.rar,application/zip,application/x-rar-compressed"
        multiple
        className="hidden"
        onChange={(e) => { handleFiles(e.target.files); if (fileInputRef.current) fileInputRef.current.value = ""; }}
      />

      {/* Cloud gallery picker */}
      {showCloud && (
        <div className="fixed inset-0 z-[150] bg-background overflow-auto">
          <CloudGallery
            theme="girl"
            onClose={() => setShowCloud(false)}
            onSelect={async (urls) => {
              setShowCloud(false);
              if (urls.length === 0) return;
              await addFromUrls(urls);
              toast.success(`נוספו ${urls.length} תמונות מהענן`);
            }}
          />
        </div>
      )}

      {/* Drop zone for empty state */}
      {photos.length === 0 && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          className="border-2 border-dashed border-foreground/20 rounded-2xl p-12 text-center mt-12 cursor-pointer hover:border-foreground/40 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-12 h-12 mx-auto mb-3 text-foreground/40" />
          <div className="font-bold mb-1">גרור תמונות או סרטונים לכאן 📸 🎬</div>
          <div className="text-sm text-foreground/60">או לחץ להעלאה מהמכשיר</div>
        </div>
      )}

      {/* Collage area */}
      <div
        ref={collageRef}
        className="mx-auto max-w-5xl rounded-2xl p-4"
        style={{
          background: collage.background_image ? `url(${collage.background_image}) center/cover` : (collage.background ?? "#ffffff"),
          minHeight: photos.length > 0 ? "60vh" : undefined,
        }}
      >
        {layoutType === "grid" && (
          <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: `${gap}px` }}>
            {photos.map(p => <div key={p.id} className="aspect-square">{renderPhoto(p, "w-full h-full")}</div>)}
          </div>
        )}
        {layoutType === "masonry" && (
          <div style={{ columnCount: cols, columnGap: `${gap}px` }}>
            {photos.map(p => (
              <div key={p.id} style={{ marginBottom: `${gap}px`, breakInside: "avoid" }}>
                {renderPhoto(p)}
              </div>
            ))}
          </div>
        )}
        {layoutType === "freeform" && (
          <div className="relative" style={{ minHeight: "70vh" }}>
            {photos.map((p, i) => {
              const x = p.pos_x ?? (i % 4) * 22;
              const y = p.pos_y ?? Math.floor(i / 4) * 25;
              const w = p.width ?? 25;
              const rot = p.rotation ?? ((i * 13) % 20) - 10;
              return (
                <div
                  key={p.id}
                  style={{ position: "absolute", left: `${x}%`, top: `${y}%`, width: `${w}%`, transform: `rotate(${rot}deg)` }}
                >
                  {renderPhoto(p)}
                </div>
              );
            })}
          </div>
        )}
        {layoutType === "template-polaroid" && (
          <div className="flex flex-wrap justify-center gap-4">
            {photos.map((p, i) => (
              <div key={p.id} style={{ transform: `rotate(${(i % 2 === 0 ? -1 : 1) * (3 + (i % 4))}deg)`, width: `${100 / Math.max(cols, 2) - 4}%` }}>
                {renderPhoto({ ...p, frame_style: "polaroid" } as FamilyPhoto)}
              </div>
            ))}
          </div>
        )}
        {layoutType === "template-heart" && (
          <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: `${gap}px` }}>
            {photos.map((p, i) => (
              <div key={p.id} className="aspect-square">
                {renderPhoto({ ...p, frame_style: i % 3 === 0 ? "circle" : "rounded" } as FamilyPhoto, "w-full h-full")}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-center mt-4">
        <Button variant="outline" size="sm" onClick={handleShare} disabled={photos.length === 0}>שיתוף</Button>
      </div>

      {/* Edit photo dialog */}
      <Dialog open={!!editingPhoto} onOpenChange={(o) => !o && setEditingPhoto(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>עריכת תמונה</DialogTitle></DialogHeader>
          {editingPhoto && (
            <div className="space-y-4">
              {editingPhoto.media_type === "video" ? (
                <video src={editingPhoto.image_url} poster={editingPhoto.thumbnail_url ?? undefined} controls className="w-full max-h-60 rounded bg-black" style={{ filter: FILTERS.find(f => f.id === editingPhoto.filter_style)?.css ?? "" }} />
              ) : (
                <img src={editingPhoto.image_url} alt="" style={{ filter: FILTERS.find(f => f.id === editingPhoto.filter_style)?.css ?? "" }} className="w-full max-h-60 object-contain rounded" />
              )}
              <div>
                <Label>כותרת</Label>
                <Input value={editingPhoto.caption ?? ""} onChange={(e) => setEditingPhoto({ ...editingPhoto, caption: e.target.value })} />
              </div>
              <div>
                <Label>תאריך</Label>
                <Input value={editingPhoto.photo_date ?? ""} onChange={(e) => setEditingPhoto({ ...editingPhoto, photo_date: e.target.value })} placeholder="לדוגמה: קיץ 2024" />
              </div>
              <div>
                <Label>מסגרת</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {FRAMES.map(f => (
                    <button key={f.id} onClick={() => setEditingPhoto({ ...editingPhoto, frame_style: f.id })}
                      className={`px-3 py-1 text-xs rounded-full border ${editingPhoto.frame_style === f.id ? "bg-primary text-primary-foreground" : "bg-background"}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>פילטר</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {FILTERS.map(f => (
                    <button key={f.id} onClick={() => setEditingPhoto({ ...editingPhoto, filter_style: f.id })}
                      className={`px-3 py-1 text-xs rounded-full border ${editingPhoto.filter_style === f.id ? "bg-primary text-primary-foreground" : "bg-background"}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <Button className="w-full" onClick={async () => {
                await updatePhoto(editingPhoto.id, {
                  caption: editingPhoto.caption,
                  photo_date: editingPhoto.photo_date,
                  frame_style: editingPhoto.frame_style,
                  filter_style: editingPhoto.filter_style,
                });
                setEditingPhoto(null);
                toast.success("נשמר");
              }}>שמור</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Collage settings */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>הגדרות קולאז׳</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>שם</Label>
              <Input value={settingsDraft.name} onChange={(e) => setSettingsDraft((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
            <div>
              <Label>אימוג'י</Label>
              <Input value={settingsDraft.emoji} onChange={(e) => setSettingsDraft((prev) => ({ ...prev, emoji: e.target.value }))} />
            </div>
            <div>
              <Label>פריסה</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {LAYOUTS.map(l => (
                  <button key={l.id} onClick={() => setSettingsDraft((prev) => ({ ...prev, layout_type: l.id }))}
                    className={`px-3 py-1 text-xs rounded-full border ${settingsDraft.layout_type === l.id ? "bg-primary text-primary-foreground" : "bg-background"}`}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>עמודות: {settingsDraft.cols}</Label>
              <Slider min={1} max={6} step={1} value={[settingsDraft.cols]} onValueChange={(v) => setSettingsDraft((prev) => ({ ...prev, cols: v[0] }))} />
            </div>
            <div>
              <Label>מרווח: {settingsDraft.gap}px</Label>
              <Slider min={0} max={32} step={2} value={[settingsDraft.gap]} onValueChange={(v) => setSettingsDraft((prev) => ({ ...prev, gap: v[0] }))} />
            </div>
            <div>
              <Label>צבע רקע</Label>
              <Input type="color" value={settingsDraft.background} onChange={(e) => setSettingsDraft((prev) => ({ ...prev, background: e.target.value }))} className="h-10" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowSettings(false)} disabled={savingSettings}>ביטול</Button>
              <Button className="flex-1" onClick={handleSaveSettings} disabled={savingSettings}>{savingSettings ? "שומר..." : "שמור ✓"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share dialog */}
      <Dialog open={showShare} onOpenChange={setShowShare}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>שתף עם המשפחה 👨‍👩‍👧‍👦</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-foreground/70">
              שלח את הקוד הזה לבני המשפחה. הם יוכלו להוסיף תמונות ולערוך את הקולאז׳ יחד איתך בזמן אמת.
            </p>
            <div className="bg-muted rounded-2xl p-6 text-center">
              <div className="text-xs text-foreground/60 mb-2">קוד שיתוף</div>
              <div className="text-3xl font-bold tracking-[0.3em] font-mono select-all">
                {collage.share_code?.toUpperCase()}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  navigator.clipboard.writeText(collage.share_code ?? "");
                  toast.success("הקוד הועתק");
                }}
              >
                <Copy className="w-4 h-4 ml-1" /> העתק קוד
              </Button>
              <Button
                className="flex-1"
                onClick={async () => {
                  const text = `🏠 הצטרפו אלי לקולאז׳ "${collage.name}"!\nהיכנסו ל"בית משפחה טננבאום" והכניסו את הקוד:\n\n${collage.share_code?.toUpperCase()}`;
                  if (navigator.share) {
                    try { await navigator.share({ text, title: collage.name }); } catch { /* canceled */ }
                  } else {
                    navigator.clipboard.writeText(text);
                    toast.success("ההזמנה הועתקה");
                  }
                }}
              >
                <Share2 className="w-4 h-4 ml-1" /> שתף הזמנה
              </Button>
            </div>
            <div className="text-xs text-foreground/50 text-center">
              💡 כל מי שיש לו את הקוד יכול לערוך — כולל הוספה ומחיקה של תמונות
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {slideshow && photos.length > 0 && (() => {
        const currentItem = photos[slideIndex];
        const isVid = currentItem.media_type === "video";
        return (
          <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center" onClick={() => setSlideshow(false)}>
            {isVid ? (
              <video
                src={currentItem.image_url}
                poster={currentItem.thumbnail_url ?? undefined}
                className="max-w-[95vw] max-h-[95vh] object-contain bg-black"
                autoPlay
                controls
                onClick={(e) => e.stopPropagation()}
                onEnded={() => setSlideIndex((slideIndex + 1) % photos.length)}
              />
            ) : (
              <img src={currentItem.image_url} alt="" className="max-w-[95vw] max-h-[95vh] object-contain" />
            )}
            <button onClick={(e) => { e.stopPropagation(); setSlideIndex((slideIndex - 1 + photos.length) % photos.length); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 text-white rounded-full w-12 h-12 text-2xl">‹</button>
            <button onClick={(e) => { e.stopPropagation(); setSlideIndex((slideIndex + 1) % photos.length); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 text-white rounded-full w-12 h-12 text-2xl">›</button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
              {slideIndex + 1} / {photos.length}
              {currentItem.caption && <span className="mr-2">— {currentItem.caption}</span>}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
