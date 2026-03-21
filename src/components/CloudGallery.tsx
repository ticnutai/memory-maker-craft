import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Upload, Trash2, Check, FolderUp, Image, Loader2, X, Music,
  Play, Pause, Crop, CheckSquare, Square, FolderPlus, Folder,
  ArrowRight, Pencil, Copy, SkipForward, Replace, ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import JSZip from "jszip";
import ImageCropModal from "@/components/ImageCropModal";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface CloudGalleryProps {
  onSelect: (urls: string[]) => void;
  onClose: () => void;
  theme: "girl" | "boy";
  mode?: "images" | "audio";
  onSelectAudio?: (url: string, name: string) => void;
}

interface GalleryItem {
  name: string;
  url: string;
  fullPath: string;
  size?: number;
}

interface DuplicateInfo {
  file: File;
  existingName: string;
  action?: "overwrite" | "skip" | "copy";
}

const IMG_BUCKET = "game-images";
const AUDIO_BUCKET = "game-audio";
const IMG_ACCEPTED = "image/jpeg,image/png,image/gif,image/webp,image/svg+xml,image/bmp,image/tiff,.zip";
const AUDIO_ACCEPTED = "audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/m4a,audio/x-m4a,.mp3,.wav,.ogg,.m4a,.aac,.zip";
const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "tiff"]);
const AUDIO_EXTS = new Set(["mp3", "wav", "ogg", "m4a", "aac", "flac", "wma"]);

export default function CloudGallery({ onSelect, onClose, theme, mode = "images", onSelectAudio }: CloudGalleryProps) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string>("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cropImage, setCropImage] = useState<{ url: string; name: string } | null>(null);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameItem, setRenameItem] = useState<GalleryItem | null>(null);
  const [renameName, setRenameName] = useState("");
  const [duplicates, setDuplicates] = useState<DuplicateInfo[]>([]);
  const [currentDupIndex, setCurrentDupIndex] = useState(0);
  const [pendingUploads, setPendingUploads] = useState<File[]>([]);

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
    const prefix = currentFolder ? `${currentFolder}/` : "";
    const { data, error } = await supabase.storage.from(bucket).list(currentFolder || "", {
      limit: 500,
      sortBy: { column: "created_at", order: "desc" },
    });
    if (error) {
      toast.error("שגיאה בטעינה");
      setLoading(false);
      return;
    }
    const fileItems: GalleryItem[] = [];
    const folderNames: string[] = [];

    for (const f of data || []) {
      if (!f.name || f.name.startsWith(".")) continue;
      if (f.id === null && !f.metadata) {
        // It's a folder
        folderNames.push(f.name);
      } else {
        const fullPath = prefix + f.name;
        fileItems.push({
          name: f.name,
          url: supabase.storage.from(bucket).getPublicUrl(fullPath).data.publicUrl,
          fullPath,
          size: f.metadata?.size,
        });
      }
    }
    setFolders(folderNames);
    setItems(fileItems);
    setLoading(false);
  }, [bucket, currentFolder]);

  useEffect(() => { loadItems(); }, [loadItems]);

  // Duplicate detection
  const findDuplicates = (files: File[], existingItems: GalleryItem[]): { clean: File[]; dups: DuplicateInfo[] } => {
    const existingMap = new Map<string, GalleryItem>();
    const sizeMap = new Map<number, GalleryItem[]>();

    for (const item of existingItems) {
      const baseName = item.name.replace(/^\d+-[a-z0-9]+\./, "").toLowerCase();
      existingMap.set(baseName, item);
      if (item.size) {
        const arr = sizeMap.get(item.size) || [];
        arr.push(item);
        sizeMap.set(item.size, arr);
      }
    }

    const clean: File[] = [];
    const dups: DuplicateInfo[] = [];

    for (const file of files) {
      const lowerName = file.name.toLowerCase();
      // Check by exact name match
      const nameMatch = existingItems.find(i => i.name.toLowerCase() === lowerName);
      // Check by size match
      const sizeMatches = file.size ? sizeMap.get(file.size) : undefined;

      if (nameMatch) {
        dups.push({ file, existingName: nameMatch.name });
      } else if (sizeMatches && sizeMatches.length > 0) {
        dups.push({ file, existingName: sizeMatches[0].name });
      } else {
        clean.push(file);
      }
    }
    return { clean, dups };
  };

  const extractZip = async (file: File): Promise<File[]> => {
    const zip = await JSZip.loadAsync(file);
    const extracted: File[] = [];
    for (const [path, entry] of Object.entries(zip.files)) {
      if (entry.dir) continue;
      const ext = path.split(".").pop()?.toLowerCase() || "";
      if (!validExts.has(ext)) continue;
      const blob = await entry.async("blob");
      const name = path.split("/").pop() || `file.${ext}`;
      extracted.push(new File([blob], name, { type: blob.type || (isAudio ? "audio/mpeg" : "image/jpeg") }));
    }
    return extracted;
  };

  const doUpload = async (files: File[]) => {
    let uploaded = 0;
    const prefix = currentFolder ? `${currentFolder}/` : "";
    for (const file of files) {
      const ext = file.name.split(".").pop() || (isAudio ? "mp3" : "jpg");
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(prefix + fileName, file, {
        contentType: file.type,
        cacheControl: "3600",
      });
      if (!error) uploaded++;
    }
    return uploaded;
  };

  const uploadWithOverwrite = async (file: File, existingName: string) => {
    const prefix = currentFolder ? `${currentFolder}/` : "";
    await supabase.storage.from(bucket).remove([prefix + existingName]);
    const { error } = await supabase.storage.from(bucket).upload(prefix + existingName, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: true,
    });
    return !error;
  };

  const uploadFiles = async (files: FileList | File[]) => {
    setUploading(true);
    let allFiles: File[] = [];

    for (const file of Array.from(files)) {
      if (file.name.toLowerCase().endsWith(".zip")) {
        try {
          const extracted = await extractZip(file);
          allFiles.push(...extracted);
          if (extracted.length > 0) toast.info(`חולצו ${extracted.length} קבצים מ-${file.name}`);
        } catch { toast.error(`שגיאה בפתיחת ${file.name}`); }
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

    // Check for duplicates
    const { clean, dups } = findDuplicates(allFiles, items);

    if (dups.length > 0) {
      // Upload clean files first
      if (clean.length > 0) {
        const uploaded = await doUpload(clean);
        if (uploaded > 0) toast.success(`הועלו ${uploaded} קבצים חדשים`);
      }
      // Show duplicate dialog
      setDuplicates(dups);
      setCurrentDupIndex(0);
      setPendingUploads([]);
      setUploading(false);
      return;
    }

    const uploaded = await doUpload(allFiles);
    toast.success(`הועלו ${uploaded} קבצים בהצלחה!`);
    setUploading(false);
    loadItems();
  };

  const handleDuplicateAction = async (action: "overwrite" | "skip" | "copy") => {
    const dup = duplicates[currentDupIndex];
    if (!dup) return;

    if (action === "overwrite") {
      await uploadWithOverwrite(dup.file, dup.existingName);
    } else if (action === "copy") {
      await doUpload([dup.file]);
    }
    // skip = do nothing

    if (currentDupIndex < duplicates.length - 1) {
      setCurrentDupIndex(currentDupIndex + 1);
    } else {
      setDuplicates([]);
      setCurrentDupIndex(0);
      loadItems();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) uploadFiles(e.target.files);
    e.target.value = "";
  };

  const toggleSelect = (url: string) => {
    if (bulkMode) {
      setBulkSelected(prev => {
        const next = new Set(prev);
        if (next.has(url)) next.delete(url);
        else next.add(url);
        return next;
      });
      return;
    }
    if (isAudio) {
      setSelected(new Set([url]));
      return;
    }
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else if (next.size < 8) next.add(url);
      else toast.info("מקסימום 8 תמונות");
      return next;
    });
  };

  const deleteItem = async (name: string) => {
    const prefix = currentFolder ? `${currentFolder}/` : "";
    const { error } = await supabase.storage.from(bucket).remove([prefix + name]);
    if (error) toast.error("שגיאה במחיקה");
    else {
      toast.success("נמחק!");
      setSelected(prev => {
        const next = new Set(prev);
        const url = items.find(i => i.name === name)?.url;
        if (url) next.delete(url);
        return next;
      });
      loadItems();
    }
  };

  const bulkDelete = async () => {
    if (bulkSelected.size === 0) return;
    const prefix = currentFolder ? `${currentFolder}/` : "";
    const names = items.filter(i => bulkSelected.has(i.url)).map(i => prefix + i.name);
    const { error } = await supabase.storage.from(bucket).remove(names);
    if (error) toast.error("שגיאה במחיקה");
    else {
      toast.success(`נמחקו ${names.length} קבצים!`);
      setBulkSelected(new Set());
      setBulkMode(false);
      setSelected(prev => {
        const next = new Set(prev);
        for (const url of bulkSelected) next.delete(url);
        return next;
      });
      loadItems();
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    const prefix = currentFolder ? `${currentFolder}/` : "";
    const path = `${prefix}${newFolderName.trim()}/.keep`;
    const { error } = await supabase.storage.from(bucket).upload(path, new Blob([""], { type: "text/plain" }), {
      contentType: "text/plain",
    });
    if (error) toast.error("שגיאה ביצירת תיקייה");
    else {
      toast.success(`תיקייה "${newFolderName.trim()}" נוצרה!`);
      setNewFolderName("");
      setNewFolderOpen(false);
      loadItems();
    }
  };

  const navigateToFolder = (folder: string) => {
    const newPath = currentFolder ? `${currentFolder}/${folder}` : folder;
    setCurrentFolder(newPath);
    setBulkMode(false);
    setBulkSelected(new Set());
  };

  const navigateUp = () => {
    const parts = currentFolder.split("/");
    parts.pop();
    setCurrentFolder(parts.join("/"));
    setBulkMode(false);
    setBulkSelected(new Set());
  };

  const renameFile = async () => {
    if (!renameItem || !renameName.trim()) return;
    const prefix = currentFolder ? `${currentFolder}/` : "";
    const oldPath = prefix + renameItem.name;
    const ext = renameItem.name.split(".").pop() || "jpg";
    const newName = renameName.trim().replace(/\.[^.]+$/, "") + "." + ext;
    const newPath = prefix + newName;

    // Download, re-upload with new name, delete old
    const { data, error: dlErr } = await supabase.storage.from(bucket).download(oldPath);
    if (dlErr || !data) { toast.error("שגיאה בשינוי שם"); return; }

    const { error: upErr } = await supabase.storage.from(bucket).upload(newPath, data, {
      contentType: data.type || "image/jpeg",
      cacheControl: "3600",
    });
    if (upErr) { toast.error("שגיאה בשינוי שם"); return; }

    await supabase.storage.from(bucket).remove([oldPath]);
    toast.success("השם שונה בהצלחה!");
    setRenameItem(null);
    setRenameName("");
    loadItems();
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
      const item = items.find(i => i.url === url);
      onSelectAudio?.(url, item?.name || "שיר מהענן");
      return;
    }
    if (selected.size < 2) { toast.error("בחרו לפחות 2 תמונות"); return; }
    onSelect(Array.from(selected));
  };

  useEffect(() => {
    return () => { audioPlayerRef.current?.pause(); };
  }, []);

  const breadcrumbs = currentFolder ? currentFolder.split("/") : [];

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

        {/* Breadcrumbs */}
        {!isAudio && (
          <div className="flex items-center gap-1 px-5 py-2 border-b border-muted text-xs text-muted-foreground overflow-x-auto">
            <button onClick={() => { setCurrentFolder(""); setBulkMode(false); setBulkSelected(new Set()); }}
              className="hover:text-foreground font-bold shrink-0">🏠 ראשי</button>
            {breadcrumbs.map((part, i) => (
              <span key={i} className="flex items-center gap-1 shrink-0">
                <ChevronRight className="w-3 h-3" />
                <button onClick={() => {
                  setCurrentFolder(breadcrumbs.slice(0, i + 1).join("/"));
                  setBulkMode(false); setBulkSelected(new Set());
                }} className="hover:text-foreground font-medium">{part}</button>
              </span>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex gap-2 px-5 py-3 border-b border-muted flex-wrap">
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className={`flex-1 min-w-[100px] h-10 rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 ${accent} text-primary-foreground shadow-md hover:opacity-90 disabled:opacity-50`}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            העלאת קבצים
          </button>
          <button onClick={() => folderRef.current?.click()} disabled={uploading}
            className={`flex-1 min-w-[100px] h-10 rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 ${accent} text-primary-foreground shadow-md hover:opacity-90 disabled:opacity-50`}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderUp className="w-4 h-4" />}
            העלאת תיקייה
          </button>
          {!isAudio && (
            <>
              <button onClick={() => setNewFolderOpen(true)}
                className="h-10 w-10 rounded-xl border-2 border-muted flex items-center justify-center hover:bg-muted transition-colors" title="תיקייה חדשה">
                <FolderPlus className="w-4 h-4" />
              </button>
              <button onClick={() => { setBulkMode(!bulkMode); setBulkSelected(new Set()); }}
                className={`h-10 w-10 rounded-xl border-2 flex items-center justify-center transition-colors ${bulkMode ? `${accentBorder} bg-muted` : "border-muted hover:bg-muted"}`} title="בחירה מרובה">
                <CheckSquare className="w-4 h-4" />
              </button>
            </>
          )}
          <input ref={fileRef} type="file" accept={accepted} multiple onChange={handleFileChange} className="hidden" />
          <input ref={folderRef} type="file" accept={accepted} onChange={handleFileChange} className="hidden"
            {...({ webkitdirectory: "", directory: "", multiple: true } as any)} />
        </div>

        {/* Bulk actions bar */}
        {bulkMode && bulkSelected.size > 0 && (
          <div className="flex items-center gap-2 px-5 py-2 bg-destructive/10 border-b border-destructive/30">
            <span className="text-sm font-bold text-destructive">{bulkSelected.size} נבחרו</span>
            <button onClick={bulkDelete}
              className="mr-auto flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-bold hover:opacity-90 transition-all">
              <Trash2 className="w-3.5 h-3.5" /> מחיקת הנבחרים
            </button>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground text-center py-1">
          {isAudio ? "MP3, WAV, M4A, OGG, AAC, ZIP • בחרו שיר אחד"
            : "JPG, PNG, GIF, WebP, SVG, BMP, ZIP • מינימום 2, מקסימום 8"}
        </p>

        {/* Gallery / List */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Folders */}
              {!isAudio && folders.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
                  {folders.map(folder => (
                    <button key={folder} onClick={() => navigateToFolder(folder)}
                      className="aspect-square rounded-xl border-2 border-muted hover:border-muted-foreground/40 flex flex-col items-center justify-center gap-1 transition-all hover:scale-[1.03] active:scale-95 bg-muted/30">
                      <Folder className="w-8 h-8 text-muted-foreground" />
                      <span className="text-[10px] font-bold text-muted-foreground truncate max-w-full px-1">{folder}</span>
                    </button>
                  ))}
                </div>
              )}

              {items.length === 0 && folders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {isAudio ? <Music className="w-12 h-12 mx-auto mb-3 opacity-40" /> : <Image className="w-12 h-12 mx-auto mb-3 opacity-40" />}
                  <p className="font-bold">{isAudio ? "אין עדיין שירים" : "אין עדיין תמונות"}</p>
                  <p className="text-xs mt-1">העלו קבצים כדי להתחיל!</p>
                </div>
              ) : isAudio ? (
                <div className="space-y-2">
                  {items.map(item => {
                    const isSelected = selected.has(item.url);
                    const isPlaying = playingUrl === item.url;
                    return (
                      <div key={item.name} onClick={() => toggleSelect(item.url)}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.98] ${isSelected ? `${accentBorder} shadow-md` : "border-muted hover:border-muted-foreground/40"}`}>
                        <button onClick={e => { e.stopPropagation(); togglePlay(item.url); }}
                          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${accent} text-primary-foreground`}>
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <span className="text-sm font-medium truncate flex-1">{item.name}</span>
                        {isSelected && (
                          <div className={`w-6 h-6 ${accent} rounded-full flex items-center justify-center`}>
                            <Check className="w-3.5 h-3.5 text-primary-foreground" />
                          </div>
                        )}
                        <button onClick={e => { e.stopPropagation(); deleteItem(item.name); }}
                          className="text-destructive hover:text-destructive/80 transition-colors shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {items.map(img => {
                    const isSelected = selected.has(img.url);
                    const isBulkSelected = bulkSelected.has(img.url);
                    return (
                      <div key={img.name}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all hover:scale-[1.03] active:scale-95 group ${
                          bulkMode && isBulkSelected ? `${accentBorder} shadow-lg ring-2 ring-offset-1 ${theme === "girl" ? "ring-game-pink" : "ring-game-blue"}` :
                          isSelected ? `${accentBorder} shadow-lg ring-2 ring-offset-1 ${theme === "girl" ? "ring-game-pink" : "ring-game-blue"}` :
                          "border-muted hover:border-muted-foreground/40"
                        }`}
                        onClick={() => toggleSelect(img.url)}>
                        <img src={img.url} alt={img.name} className="w-full h-full object-cover" loading="lazy" />

                        {/* Bulk checkbox */}
                        {bulkMode && (
                          <div className={`absolute top-1.5 right-1.5 w-6 h-6 rounded flex items-center justify-center shadow-md ${isBulkSelected ? accent : "bg-background/80"}`}>
                            {isBulkSelected ? <Check className="w-3.5 h-3.5 text-primary-foreground" /> : <Square className="w-3.5 h-3.5 text-muted-foreground" />}
                          </div>
                        )}

                        {/* Selection check */}
                        {!bulkMode && isSelected && (
                          <div className={`absolute top-1.5 right-1.5 w-6 h-6 ${accent} rounded-full flex items-center justify-center shadow-md`}>
                            <Check className="w-3.5 h-3.5 text-primary-foreground" />
                          </div>
                        )}

                        {/* Action buttons */}
                        {!bulkMode && (
                          <>
                            <button onClick={e => { e.stopPropagation(); deleteItem(img.name); }}
                              className="absolute top-1.5 left-1.5 w-6 h-6 bg-destructive rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 className="w-3 h-3 text-destructive-foreground" />
                            </button>
                            <button onClick={e => { e.stopPropagation(); setCropImage({ url: img.url, name: img.name }); }}
                              className="absolute bottom-1.5 left-1.5 w-6 h-6 bg-foreground/80 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                              title="חיתוך">
                              <Crop className="w-3 h-3 text-background" />
                            </button>
                            <button onClick={e => { e.stopPropagation(); setRenameItem(img); setRenameName(img.name.replace(/\.[^.]+$/, "")); }}
                              className="absolute bottom-1.5 right-1.5 w-6 h-6 bg-foreground/80 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                              title="שינוי שם">
                              <Pencil className="w-3 h-3 text-background" />
                            </button>
                          </>
                        )}

                        {/* Name tooltip */}
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-[9px] text-white truncate text-center">{img.name}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-muted flex gap-2">
          <Button variant="ghost" onClick={onClose} className="flex-1">ביטול</Button>
          <button onClick={confirmSelection}
            disabled={isAudio ? selected.size === 0 : selected.size < 2}
            className={`flex-1 h-11 rounded-xl font-bold text-sm transition-all active:scale-95 ${accent} text-primary-foreground shadow-md hover:opacity-90 disabled:opacity-50`}>
            {isAudio ? `🎵 בחירת שיר` : `🎮 התחלה עם ${selected.size} תמונות`}
          </button>
        </div>
      </div>

      {/* New Folder Dialog */}
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent className="max-w-xs" dir="rtl">
          <DialogHeader>
            <DialogTitle>📁 תיקייה חדשה</DialogTitle>
            <DialogDescription>הזינו שם לתיקייה החדשה</DialogDescription>
          </DialogHeader>
          <Input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="שם התיקייה"
            onKeyDown={e => e.key === "Enter" && createFolder()} />
          <DialogFooter className="flex gap-2">
            <Button variant="ghost" onClick={() => setNewFolderOpen(false)}>ביטול</Button>
            <Button onClick={createFolder} disabled={!newFolderName.trim()}>יצירה</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={!!renameItem} onOpenChange={open => !open && setRenameItem(null)}>
        <DialogContent className="max-w-xs" dir="rtl">
          <DialogHeader>
            <DialogTitle>✏️ שינוי שם</DialogTitle>
            <DialogDescription>הזינו שם חדש לתמונה</DialogDescription>
          </DialogHeader>
          <Input value={renameName} onChange={e => setRenameName(e.target.value)} placeholder="שם חדש"
            onKeyDown={e => e.key === "Enter" && renameFile()} />
          <DialogFooter className="flex gap-2">
            <Button variant="ghost" onClick={() => setRenameItem(null)}>ביטול</Button>
            <Button onClick={renameFile} disabled={!renameName.trim()}>שמירה</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Detection Dialog */}
      <Dialog open={duplicates.length > 0} onOpenChange={() => { setDuplicates([]); loadItems(); }}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle>⚠️ זוהתה כפילות</DialogTitle>
            <DialogDescription>
              {duplicates.length > 0 && (
                <>הקובץ <strong className="text-foreground">{duplicates[currentDupIndex]?.file.name}</strong> דומה ל-<strong className="text-foreground">{duplicates[currentDupIndex]?.existingName}</strong>
                  <br /><span className="text-xs">({currentDupIndex + 1} מתוך {duplicates.length})</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Button variant="destructive" onClick={() => handleDuplicateAction("overwrite")} className="flex items-center gap-2">
              <Replace className="w-4 h-4" /> דריסה
            </Button>
            <Button variant="outline" onClick={() => handleDuplicateAction("copy")} className="flex items-center gap-2">
              <Copy className="w-4 h-4" /> שמירה כהעתק
            </Button>
            <Button variant="ghost" onClick={() => handleDuplicateAction("skip")} className="flex items-center gap-2">
              <SkipForward className="w-4 h-4" /> דילוג
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Crop Modal */}
      {cropImage && !isAudio && (
        <ImageCropModal
          imageUrl={cropImage.url}
          theme={theme}
          onCloudSaved={() => loadItems()}
          onClose={() => setCropImage(null)}
          onSave={async (croppedDataUrl) => {
            const res = await fetch(croppedDataUrl);
            const blob = await res.blob();
            const prefix = currentFolder ? `${currentFolder}/` : "";
            const fileName = `cropped-${Date.now()}.jpg`;
            const { error } = await supabase.storage.from(bucket).upload(prefix + fileName, blob, {
              contentType: "image/jpeg",
              cacheControl: "3600",
            });
            if (error) toast.error("שגיאה בשמירת התמונה החתוכה");
            else { toast.success("התמונה החתוכה נשמרה!"); loadItems(); }
            setCropImage(null);
          }}
        />
      )}
    </div>
  );
}
