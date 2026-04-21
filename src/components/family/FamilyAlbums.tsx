import { useState, useMemo, useCallback } from "react";
import {
  Plus, FolderPlus, KeyRound, Trash2, Users, ChevronLeft,
  Home as HomeIcon, FolderOpen, Image as ImageIcon, Filter, Tag, CalendarDays, User,
  Pencil, Settings, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFamilyCollages, FamilyCollage } from "@/hooks/useFamilyCollages";
import { useFamily } from "@/hooks/useFamily";
import CollageView from "./CollageView";
import { loadHomeCollageId, saveHomeCollageId, saveSlideshowConfig, loadSlideshowConfig } from "@/lib/familyThemes";
import { toast } from "sonner";

const CATEGORIES = [
  { id: "holidays", label: "🎉 חגים", emoji: "🎉" },
  { id: "trips", label: "✈️ טיולים", emoji: "✈️" },
  { id: "birthdays", label: "🎂 ימי הולדת", emoji: "🎂" },
  { id: "daily", label: "📷 יום-יום", emoji: "📷" },
  { id: "school", label: "🎓 בית ספר", emoji: "🎓" },
  { id: "events", label: "🎊 אירועים", emoji: "🎊" },
];

export default function FamilyAlbums() {
  const { familyDeviceIds } = useFamily();
  const { collages, loading, createCollage, updateCollage, deleteCollage, joinByCode, deviceId } = useFamilyCollages(familyDeviceIds);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [homeCollageId, setHomeCollageId] = useState<string | null>(() => loadHomeCollageId());

  // Filters
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterYear, setFilterYear] = useState<number | null>(null);
  const [filterFamily, setFilterFamily] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Album metadata edit dialog
  const [editingAlbum, setEditingAlbum] = useState<FamilyCollage | null>(null);
  const [editDraft, setEditDraft] = useState({ name: "", emoji: "", category: "" as string | null, year_tag: "" as string, family_tag: "" as string, event_tag: "" as string });
  const [savingEdit, setSavingEdit] = useState(false);

  const openEditDialog = (c: FamilyCollage) => {
    setEditingAlbum(c);
    setEditDraft({
      name: c.name,
      emoji: c.emoji ?? "",
      category: c.category,
      year_tag: c.year_tag?.toString() ?? "",
      family_tag: c.family_tag ?? "",
      event_tag: c.event_tag ?? "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingAlbum) return;
    setSavingEdit(true);
    try {
      await updateCollage(editingAlbum.id, {
        name: editDraft.name.trim() || editingAlbum.name,
        emoji: editDraft.emoji.trim() || null,
        category: editDraft.category || null,
        year_tag: editDraft.year_tag ? parseInt(editDraft.year_tag) || null : null,
        family_tag: editDraft.family_tag.trim() || null,
        event_tag: editDraft.event_tag.trim() || null,
      });
      setEditingAlbum(null);
      toast.success("פרטי האלבום נשמרו ✓");
    } catch {
      toast.error("שגיאה בשמירה");
    } finally {
      setSavingEdit(false);
    }
  };

  // Breadcrumb
  const breadcrumb = useMemo(() => {
    const path: FamilyCollage[] = [];
    let id = currentFolderId;
    while (id) {
      const folder = collages.find(c => c.id === id);
      if (!folder) break;
      path.unshift(folder);
      id = folder.parent_id;
    }
    return path;
  }, [currentFolderId, collages]);

  // Visible items in current folder
  const visibleItems = useMemo(() => {
    let items = collages.filter(c => (c.parent_id ?? null) === currentFolderId);
    if (filterCategory) items = items.filter(c => c.category === filterCategory);
    if (filterYear) items = items.filter(c => c.year_tag === filterYear);
    if (filterFamily) items = items.filter(c => c.family_tag === filterFamily);
    return items.sort((a, b) => {
      if (a.is_folder && !b.is_folder) return -1;
      if (!a.is_folder && b.is_folder) return 1;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    });
  }, [collages, currentFolderId, filterCategory, filterYear, filterFamily]);

  const availableYears = useMemo(() => [...new Set(collages.map(c => c.year_tag).filter(Boolean) as number[])].sort((a, b) => b - a), [collages]);
  const availableFamilies = useMemo(() => [...new Set(collages.map(c => c.family_tag).filter(Boolean) as string[])].sort(), [collages]);
  const hasActiveFilters = !!(filterCategory || filterYear || filterFamily);

  const setAsHome = useCallback((id: string) => {
    saveHomeCollageId(id);
    setHomeCollageId(id);
    const sl = loadSlideshowConfig();
    const next = { ...sl, enabled: true, collageId: null };
    saveSlideshowConfig(next);
    toast.success("הקולאז׳ נקבע לדף הבית");
  }, []);

  const clearHome = useCallback(() => {
    saveHomeCollageId(null);
    setHomeCollageId(null);
    toast.success("הוסר מדף הבית");
  }, []);

  const handleCreate = async () => {
    try {
      const c = await createCollage({ parent_id: currentFolderId } as Partial<FamilyCollage>);
      setActiveId(c.id);
    } catch {
      toast.error("שגיאה ביצירת אלבום");
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await createCollage({
        name: newFolderName.trim(),
        emoji: "📁",
        is_folder: true,
        parent_id: currentFolderId,
      } as Partial<FamilyCollage>);
      setNewFolderName("");
      setShowNewFolder(false);
      toast.success("תיקייה נוצרה! 📁");
    } catch {
      toast.error("שגיאה ביצירת תיקייה");
    }
  };

  const handleJoin = async () => {
    if (joinCode.trim().length < 4) return;
    setJoining(true);
    try {
      const c = await joinByCode(joinCode.trim());
      if (c) {
        toast.success(`הצטרפת ל-${c.name}!`);
        setJoinCode("");
      } else {
        toast.error("לא נמצא קולאז׳ עם הקוד הזה");
      }
    } catch {
      toast.error("שגיאה בהצטרפות");
    } finally {
      setJoining(false);
    }
  };

  // Active collage view (full edit screen with upload, reorder, etc.)
  const active = collages.find(c => c.id === activeId);
  if (active) {
    return <CollageView collage={active} onBack={() => setActiveId(null)} onUpdateCollage={updateCollage} />;
  }

  const folderCount = visibleItems.filter(c => c.is_folder).length;
  const albumCount = visibleItems.filter(c => !c.is_folder).length;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pt-14 pb-8" dir="rtl">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            📸 אלבומי משפחה
          </h1>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowFilters(f => !f)} className={hasActiveFilters ? "border-primary text-primary" : ""}>
              <Filter className="w-4 h-4 ml-1" />
              סינון
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowNewFolder(true)}>
              <FolderPlus className="w-4 h-4 ml-1" />
              תיקייה
            </Button>
            <Button size="sm" onClick={handleCreate}>
              <Plus className="w-4 h-4 ml-1" />
              אלבום חדש
            </Button>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 mb-4 text-sm flex-wrap">
          <button
            onClick={() => setCurrentFolderId(null)}
            className={`px-2 py-1 rounded-md transition-colors ${!currentFolderId ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
          >
            🏠 הכל
          </button>
          {breadcrumb.map((folder, i) => (
            <span key={folder.id} className="flex items-center gap-1">
              <ChevronLeft className="w-3 h-3 text-muted-foreground" />
              <button
                onClick={() => setCurrentFolderId(folder.id)}
                className={`px-2 py-1 rounded-md transition-colors ${
                  i === breadcrumb.length - 1 ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {folder.emoji ?? "📁"} {folder.name}
              </button>
            </span>
          ))}
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mb-4 p-3 rounded-xl bg-muted/30 border space-y-2">
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs text-muted-foreground flex items-center gap-1"><Tag className="w-3 h-3" /> קטגוריה:</span>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(filterCategory === cat.id ? null : cat.id)}
                  className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                    filterCategory === cat.id ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-foreground"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            {availableYears.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs text-muted-foreground flex items-center gap-1"><CalendarDays className="w-3 h-3" /> שנה:</span>
                {availableYears.map(y => (
                  <button
                    key={y}
                    onClick={() => setFilterYear(filterYear === y ? null : y)}
                    className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                      filterYear === y ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-foreground"
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}
            {availableFamilies.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" /> משפחה:</span>
                {availableFamilies.map(f => (
                  <button
                    key={f}
                    onClick={() => setFilterFamily(filterFamily === f ? null : f)}
                    className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                      filterFamily === f ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-foreground"
                    }`}
                  >
                    👤 {f}
                  </button>
                ))}
              </div>
            )}
            {hasActiveFilters && (
              <button
                onClick={() => { setFilterCategory(null); setFilterYear(null); setFilterFamily(null); }}
                className="text-xs text-destructive hover:underline"
              >
                נקה סינון
              </button>
            )}
          </div>
        )}

        {/* New folder form */}
        {showNewFolder && (
          <div className="mb-4 p-3 rounded-xl bg-muted/30 border flex items-center gap-2">
            <Input
              placeholder="שם התיקייה..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              className="flex-1 h-9"
              autoFocus
            />
            <Button size="sm" onClick={handleCreateFolder} disabled={!newFolderName.trim()}>צור</Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowNewFolder(false); setNewFolderName(""); }}>ביטול</Button>
          </div>
        )}

        {/* Join by code */}
        <div className="mb-4 p-3 rounded-xl bg-muted/30 border">
          <Label className="text-xs flex items-center gap-1 mb-2">
            <KeyRound className="w-3 h-3" /> הצטרף עם קוד שיתוף
          </Label>
          <div className="flex gap-2">
            <Input
              placeholder="קוד 8 תווים"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              maxLength={8}
              className="text-center font-mono tracking-widest uppercase h-9 max-w-[200px]"
            />
            <Button onClick={handleJoin} disabled={joining || joinCode.trim().length < 4} size="sm">
              {joining ? "..." : "הצטרף"}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-3 text-xs text-muted-foreground">
          {visibleItems.length === 0 ? "ריק" : `${folderCount} תיקיות · ${albumCount} אלבומים`}
          {homeCollageId && !currentFolderId && (
            <button onClick={clearHome} className="mr-3 underline hover:text-foreground">נקה דף בית</button>
          )}
        </div>

        {/* Loading */}
        {loading && <div className="text-center py-12 text-muted-foreground">טוען…</div>}

        {/* Empty state */}
        {!loading && visibleItems.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            {currentFolderId ? (
              <>
                <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>תיקייה ריקה</p>
                <p className="text-xs mt-1">הוסף אלבום חדש או תת-תיקייה</p>
              </>
            ) : (
              <>
                <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>אין עדיין אלבומים</p>
                <p className="text-xs mt-1">צור אלבום חדש או הצטרף עם קוד שיתוף</p>
              </>
            )}
          </div>
        )}

        {/* Items grid */}
        {!loading && visibleItems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visibleItems.map(c => {
              const isShared = c.device_id !== deviceId;
              const isHome = homeCollageId === c.id;
              const childCount = c.is_folder ? collages.filter(x => x.parent_id === c.id).length : 0;
              return (
                <div
                  key={c.id}
                  className={`rounded-xl border p-4 transition-all cursor-pointer group ${
                    isHome ? "bg-primary/10 border-primary shadow-md" : c.is_folder ? "bg-muted/30 hover:bg-muted/50" : "bg-background hover:bg-muted/30 hover:shadow-md"
                  }`}
                  onClick={() => {
                    if (c.is_folder) setCurrentFolderId(c.id);
                    else setActiveId(c.id);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-4xl flex-shrink-0">
                      {c.is_folder ? (c.emoji ?? "📁") : (c.emoji ?? "📸")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate flex items-center gap-1">
                        {c.name}
                        {isHome && <HomeIcon className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                        {isShared && <Users className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        {c.is_folder ? (
                          <span>{childCount} פריטים</span>
                        ) : (
                          <span>{isShared ? "משותף" : "שלי"} · קוד {c.share_code}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {c.category && (
                          <span className="px-1.5 py-0.5 rounded bg-muted text-[10px]">
                            {CATEGORIES.find(cat => cat.id === c.category)?.emoji ?? "📋"} {c.category}
                          </span>
                        )}
                        {c.year_tag && <span className="text-[10px] text-muted-foreground">📅{c.year_tag}</span>}
                        {c.family_tag && <span className="text-[10px] text-muted-foreground">👤{c.family_tag}</span>}
                      </div>
                    </div>
                  </div>
                  {/* Actions - always visible on mobile, hover on desktop */}
                  <div className="flex items-center gap-1 mt-3 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    {!c.is_folder && (
                      <>
                        <button
                          onClick={() => setActiveId(c.id)}
                          className="p-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="פתח ועריכה — העלאת תמונות, סידור מחדש"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditDialog(c)}
                          className="p-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="ערוך פרטי אלבום"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => isHome ? clearHome() : setAsHome(c.id)}
                          className={`p-1.5 rounded-md text-xs transition-colors ${
                            isHome ? "text-primary bg-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                          title={isHome ? "הסר מדף הבית" : "קבע כדף הבית"}
                        >
                          <HomeIcon className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    {c.is_folder && (
                      <button
                        onClick={() => openEditDialog(c)}
                        className="p-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="ערוך שם תיקייה"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const msg = c.is_folder ? `למחוק את התיקייה "${c.name}" וכל תוכנה?` : isShared ? `לעזוב את "${c.name}"?` : `למחוק את "${c.name}"?`;
                        if (confirm(msg)) {
                          if (homeCollageId === c.id) clearHome();
                          deleteCollage(c.id);
                        }
                      }}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="מחק"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Album / Folder edit dialog */}
      <Dialog open={!!editingAlbum} onOpenChange={(o) => !o && setEditingAlbum(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingAlbum?.is_folder ? "עריכת תיקייה" : "עריכת פרטי אלבום"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>שם</Label>
              <Input value={editDraft.name} onChange={(e) => setEditDraft(d => ({ ...d, name: e.target.value }))} />
            </div>
            <div>
              <Label>אימוג׳י</Label>
              <Input value={editDraft.emoji} onChange={(e) => setEditDraft(d => ({ ...d, emoji: e.target.value }))} className="w-24 text-center text-2xl" />
            </div>
            {!editingAlbum?.is_folder && (
              <>
                <div>
                  <Label>קטגוריה</Label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <button
                      onClick={() => setEditDraft(d => ({ ...d, category: null }))}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        !editDraft.category ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
                      }`}
                    >
                      ללא
                    </button>
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setEditDraft(d => ({ ...d, category: cat.id }))}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          editDraft.category === cat.id ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>שנה</Label>
                    <Input
                      type="number"
                      placeholder="2024"
                      value={editDraft.year_tag}
                      onChange={(e) => setEditDraft(d => ({ ...d, year_tag: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>אירוע</Label>
                    <Input
                      placeholder="חנוכה, פסח..."
                      value={editDraft.event_tag}
                      onChange={(e) => setEditDraft(d => ({ ...d, event_tag: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label>תגית משפחה</Label>
                  <Input
                    placeholder="טננבאום, כהן..."
                    value={editDraft.family_tag}
                    onChange={(e) => setEditDraft(d => ({ ...d, family_tag: e.target.value }))}
                  />
                </div>
              </>
            )}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditingAlbum(null)} disabled={savingEdit}>ביטול</Button>
              <Button className="flex-1" onClick={handleSaveEdit} disabled={savingEdit}>
                {savingEdit ? "שומר..." : "שמור ✓"}
              </Button>
            </div>
            {!editingAlbum?.is_folder && (
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  setEditingAlbum(null);
                  if (editingAlbum) setActiveId(editingAlbum.id);
                }}
              >
                <ImageIcon className="w-4 h-4 ml-1" />
                פתח לעריכת תמונות, סידור והעלאה
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
