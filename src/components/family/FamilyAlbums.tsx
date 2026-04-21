import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Plus, FolderPlus, KeyRound, Trash2, Users, ChevronLeft,
  Home as HomeIcon, FolderOpen, Image as ImageIcon, Filter, Tag, CalendarDays, User,
  Pencil, Eye, Search, Archive, RotateCcw, GripVertical,
  LayoutGrid, List, Table2, GalleryHorizontalEnd,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFamilyCollages, FamilyCollage } from "@/hooks/useFamilyCollages";
import { useFamily } from "@/hooks/useFamily";
import { useAuth } from "@/hooks/useAuth";
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
  const { user, isAdmin } = useAuth();
  const {
    collages,
    loading,
    createCollage,
    updateCollage,
    deleteCollage,
    restoreCollage,
    purgeExpiredArchived,
    joinByCode,
    deviceId,
  } = useFamilyCollages(familyDeviceIds);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [templateType, setTemplateType] = useState<"manual" | "pesach" | "trip" | "event">("manual");
  const [templateLocation, setTemplateLocation] = useState("");
  const [templateYear, setTemplateYear] = useState(String(new Date().getFullYear()));
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [homeCollageId, setHomeCollageId] = useState<string | null>(() => loadHomeCollageId());
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [dragItemId, setDragItemId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Filters
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterYear, setFilterYear] = useState<number | null>(null);
  const [filterFamily, setFilterFamily] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Album metadata edit dialog
  const [editingAlbum, setEditingAlbum] = useState<FamilyCollage | null>(null);
  const [editDraft, setEditDraft] = useState({
    name: "",
    emoji: "",
    visibility: "public" as "public" | "private",
    owner_user_id: "",
    locked_by_admin: false,
    lock_reason: "",
    category: "" as string | null,
    year_tag: "" as string,
    family_tag: "" as string,
    event_tag: "" as string,
    description: "" as string,
    tags: "" as string,
    location_tag: "" as string,
    cover_url: "" as string,
  });
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    void purgeExpiredArchived();
  }, [purgeExpiredArchived]);

  const openEditDialog = (c: FamilyCollage) => {
    setEditingAlbum(c);
    setEditDraft({
      name: c.name,
      emoji: c.emoji ?? "",
      visibility: c.visibility ?? "public",
      owner_user_id: c.owner_user_id ?? "",
      locked_by_admin: c.locked_by_admin ?? false,
      lock_reason: c.lock_reason ?? "",
      category: c.category,
      year_tag: c.year_tag?.toString() ?? "",
      family_tag: c.family_tag ?? "",
      event_tag: c.event_tag ?? "",
      description: c.description ?? "",
      tags: (c.tags ?? []).join(", "),
      location_tag: c.location_tag ?? "",
      cover_url: c.cover_url ?? "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingAlbum) return;
    const canManage = !!user && (isAdmin || editingAlbum.owner_user_id === user.id);
    if (!canManage) {
      toast.error("אין הרשאה לערוך אלבום זה");
      return;
    }
    setSavingEdit(true);
    try {
      await updateCollage(editingAlbum.id, {
        name: editDraft.name.trim() || editingAlbum.name,
        emoji: editDraft.emoji.trim() || null,
        visibility: editDraft.visibility,
        ...(isAdmin ? {
          owner_user_id: editDraft.owner_user_id.trim() || null,
          locked_by_admin: editDraft.locked_by_admin,
          lock_reason: editDraft.locked_by_admin ? (editDraft.lock_reason.trim() || null) : null,
          locked_at: editDraft.locked_by_admin ? new Date().toISOString() : null,
          locked_by_user_id: editDraft.locked_by_admin ? user?.id ?? null : null,
        } : {}),
        category: editDraft.category || null,
        year_tag: editDraft.year_tag ? parseInt(editDraft.year_tag) || null : null,
        family_tag: editDraft.family_tag.trim() || null,
        event_tag: editDraft.event_tag.trim() || null,
        description: editDraft.description.trim() || null,
        tags: editDraft.tags.split(",").map((t) => t.trim()).filter(Boolean),
        location_tag: editDraft.location_tag.trim() || null,
        cover_url: editDraft.cover_url.trim() || null,
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
    let items = collages.filter(c => {
      const archivedMatch = showArchived ? !!c.archived_at : !c.archived_at;
      return archivedMatch && (c.parent_id ?? null) === currentFolderId;
    });
    if (filterCategory) items = items.filter(c => c.category === filterCategory);
    if (filterYear) items = items.filter(c => c.year_tag === filterYear);
    if (filterFamily) items = items.filter(c => c.family_tag === filterFamily);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      items = items.filter((c) =>
        [
          c.name,
          c.description ?? "",
          c.location_tag ?? "",
          c.family_tag ?? "",
          c.event_tag ?? "",
          ...(c.tags ?? []),
        ].some((v) => v.toLowerCase().includes(q))
      );
    }
    return items.sort((a, b) => {
      if (a.is_folder && !b.is_folder) return -1;
      if (!a.is_folder && b.is_folder) return 1;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    });
  }, [collages, currentFolderId, filterCategory, filterYear, filterFamily, searchQuery, showArchived]);

  const folderItems = useMemo(
    () => collages.filter((c) => c.is_folder && (showArchived ? !!c.archived_at : !c.archived_at)),
    [collages, showArchived]
  );

  const rootFolders = useMemo(
    () => folderItems.filter((c) => !c.parent_id).sort((a, b) => a.name.localeCompare(b.name, "he")),
    [folderItems]
  );

  const toggleFolder = (id: string) => setExpandedFolders((prev) => ({ ...prev, [id]: !prev[id] }));

  // ─── Drag & Drop ───
  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
    setDragItemId(id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, targetId: string | null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverId(targetId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverId(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    setDragOverId(null);
    setDragItemId(null);
    const itemId = e.dataTransfer.getData("text/plain");
    if (!itemId || itemId === targetFolderId) return;
    
    const item = collages.find(c => c.id === itemId);
    if (!item) return;
    if (item.parent_id === targetFolderId) return; // already there

    // Prevent dropping a folder into itself or its descendant
    if (targetFolderId) {
      let parentId: string | null = targetFolderId;
      while (parentId) {
        if (parentId === itemId) {
          toast.error("לא ניתן להעביר תיקייה לתוך עצמה");
          return;
        }
        const parent = collages.find(c => c.id === parentId);
        parentId = parent?.parent_id ?? null;
      }
    }

    try {
      await updateCollage(itemId, { parent_id: targetFolderId } as Partial<FamilyCollage>);
      const targetName = targetFolderId
        ? collages.find(c => c.id === targetFolderId)?.name ?? "תיקייה"
        : "שורש";
      toast.success(`"${item.name}" הועבר ל-${targetName}`);
    } catch {
      toast.error("שגיאה בהעברה");
    }
  }, [collages, updateCollage]);

  const availableYears = useMemo(() => [...new Set(collages.map(c => c.year_tag).filter(Boolean) as number[])].sort((a, b) => b - a), [collages]);
  const availableFamilies = useMemo(() => [...new Set(collages.map(c => c.family_tag).filter(Boolean) as string[])].sort(), [collages]);
  const hasActiveFilters = !!(filterCategory || filterYear || filterFamily);

  const renderFolderTree = (folder: FamilyCollage, depth = 0): JSX.Element => {
    const children = folderItems
      .filter((f) => f.parent_id === folder.id)
      .sort((a, b) => a.name.localeCompare(b.name, "he"));
    const isExpanded = !!expandedFolders[folder.id];

    return (
      <div key={folder.id} className="space-y-1">
        <button
          onClick={() => {
            setCurrentFolderId(folder.id);
            if (children.length > 0) toggleFolder(folder.id);
          }}
          onDragOver={(e) => handleDragOver(e, folder.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => { e.stopPropagation(); handleDrop(e, folder.id); }}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-right text-sm transition-colors ${
            dragOverId === folder.id ? "ring-2 ring-primary bg-primary/15" : ""
          } ${currentFolderId === folder.id ? "bg-primary/15 text-primary" : "hover:bg-muted"}`}
          style={{ paddingRight: `${8 + depth * 12}px` }}
        >
          <span className="text-base">{folder.emoji ?? "📁"}</span>
          <span className="truncate flex-1">{folder.name}</span>
          {children.length > 0 && <span className="text-xs text-muted-foreground">{isExpanded ? "▾" : "▸"}</span>}
        </button>
        {isExpanded && children.map((child) => renderFolderTree(child, depth + 1))}
      </div>
    );
  };

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
    if (!user) {
      toast.error("יש להתחבר כדי ליצור אלבומים/תיקיות");
      return;
    }
    try {
      const c = await createCollage({ parent_id: currentFolderId } as Partial<FamilyCollage>);
      setActiveId(c.id);
    } catch {
      toast.error("שגיאה ביצירת אלבום");
    }
  };

  const handleCreateFolder = async () => {
    if (!user) {
      toast.error("יש להתחבר כדי ליצור תתי-תיקיות");
      return;
    }
    if (!newFolderName.trim()) return;
    try {
      const year = parseInt(templateYear, 10);
      const computedName =
        templateType === "manual"
          ? newFolderName.trim()
          : templateType === "pesach"
            ? `פסח ${templateLocation.trim() || "מיקום"} ${Number.isFinite(year) ? year : ""}`.trim()
            : templateType === "trip"
              ? `טיול ${templateLocation.trim() || "מיקום"} ${Number.isFinite(year) ? year : ""}`.trim()
              : `${newFolderName.trim()} ${templateLocation.trim()} ${Number.isFinite(year) ? year : ""}`.trim();

      await createCollage({
        name: computedName,
        emoji: "📁",
        is_folder: true,
        parent_id: currentFolderId,
        location_tag: templateLocation.trim() || null,
        year_tag: Number.isFinite(year) ? year : null,
        tags: templateType === "manual" ? [] : [templateType],
      } as Partial<FamilyCollage>);
      setNewFolderName("");
      setTemplateLocation("");
      setShowNewFolder(false);
      toast.success("תיקייה נוצרה! 📁");
    } catch (e: any) {
      if (e?.message === "max-depth-reached") {
        toast.error("אפשר עד 5 רמות תיקיות");
        return;
      }
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
    const canEditActive = !!user && (isAdmin || active.owner_user_id === user.id);
    return <CollageView collage={active} onBack={() => setActiveId(null)} onUpdateCollage={updateCollage} canEdit={canEditActive} />;
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
            <Button size="sm" variant={showArchived ? "default" : "outline"} onClick={() => setShowArchived((v) => !v)}>
              <Archive className="w-4 h-4 ml-1" />
              {showArchived ? "מצב ארכיון" : "ארכיון"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowFilters(f => !f)} className={hasActiveFilters ? "border-primary text-primary" : ""}>
              <Filter className="w-4 h-4 ml-1" />
              סינון
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowNewFolder(true)} disabled={!user}>
              <FolderPlus className="w-4 h-4 ml-1" />
              תיקייה
            </Button>
            <Button size="sm" onClick={handleCreate} disabled={!user}>
              <Plus className="w-4 h-4 ml-1" />
              אלבום חדש
            </Button>
          </div>
        </div>

        <div className="mb-4 relative">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="חיפוש חכם בתיקיות/תגיות/מיקום/שנה"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9"
          />
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 mb-4 text-sm flex-wrap">
          <button
            onClick={() => setCurrentFolderId(null)}
            onDragOver={(e) => handleDragOver(e, null)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, null)}
            className={`px-2 py-1 rounded-md transition-colors ${
              dragOverId === null && dragItemId ? "ring-2 ring-primary bg-primary/15" : ""
            } ${!currentFolderId ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
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
          <div className="mb-4 p-3 rounded-xl bg-muted/30 border space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <select className="h-9 rounded-md border bg-background px-2 text-sm" value={templateType} onChange={(e) => setTemplateType(e.target.value as any)}>
                <option value="manual">ידני</option>
                <option value="pesach">תבנית פסח</option>
                <option value="trip">תבנית טיול</option>
                <option value="event">תבנית אירוע</option>
              </select>
              <Input placeholder="מיקום (למשל רודוס)" value={templateLocation} onChange={(e) => setTemplateLocation(e.target.value)} className="h-9" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="שם התיקייה..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                className="h-9"
                autoFocus
              />
              <Input placeholder="שנה" value={templateYear} onChange={(e) => setTemplateYear(e.target.value)} className="h-9" />
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleCreateFolder} disabled={!newFolderName.trim() || !user}>צור</Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowNewFolder(false); setNewFolderName(""); }}>ביטול</Button>
            </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
          <aside className="border rounded-xl bg-muted/20 p-2 h-fit">
            <div className="text-xs font-bold text-muted-foreground mb-2 px-1">עץ תיקיות</div>
            <button
              onClick={() => setCurrentFolderId(null)}
              className={`w-full text-right px-2 py-1.5 rounded-md text-sm mb-1 ${!currentFolderId ? "bg-primary/15 text-primary" : "hover:bg-muted"}`}
            >
              🏠 כל התיקיות
            </button>
            <div className="space-y-1 max-h-[420px] overflow-auto pr-1">
              {rootFolders.length === 0 ? (
                <div className="text-xs text-muted-foreground px-2 py-3">אין תיקיות להצגה</div>
              ) : (
                rootFolders.map((folder) => renderFolderTree(folder))
              )}
            </div>
          </aside>

          <div>

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
              const canManage = !!user && (isAdmin || c.owner_user_id === user.id);
              return (
                <div
                  key={c.id}
                  draggable={!!user}
                  onDragStart={(e) => handleDragStart(e, c.id)}
                  onDragEnd={() => { setDragItemId(null); setDragOverId(null); }}
                  onDragOver={c.is_folder ? (e) => handleDragOver(e, c.id) : undefined}
                  onDragLeave={c.is_folder ? handleDragLeave : undefined}
                  onDrop={c.is_folder ? (e) => handleDrop(e, c.id) : undefined}
                  className={`rounded-xl border p-4 transition-all cursor-pointer group ${
                    dragOverId === c.id && c.is_folder
                      ? "ring-2 ring-primary border-primary bg-primary/15 scale-[1.02]"
                      : dragItemId === c.id
                        ? "opacity-40 scale-95"
                        : isHome ? "bg-primary/10 border-primary shadow-md" : c.is_folder ? "bg-muted/30 hover:bg-muted/50" : "bg-background hover:bg-muted/30 hover:shadow-md"
                  }`}
                  onClick={() => {
                    if (c.is_folder) setCurrentFolderId(c.id);
                    else setActiveId(c.id);
                  }}
                >
                  <div className="flex items-start gap-3">
                    {user && (
                      <GripVertical className="w-4 h-4 mt-3 text-muted-foreground/50 flex-shrink-0 cursor-grab active:cursor-grabbing" />
                    )}
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
                          disabled={!canManage}
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
                        disabled={!canManage}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (!canManage) {
                          toast.error("רק בעל התוכן או אדמין יכולים למחוק/לארכב");
                          return;
                        }
                        const msg = showArchived
                          ? `מחיקה סופית של "${c.name}"? לא ניתן לשחזר.`
                          : c.is_folder
                            ? `להעביר לארכיון את התיקייה "${c.name}" וכל תוכנה?`
                            : isShared
                              ? `לעזוב את "${c.name}"?`
                              : `להעביר לארכיון את "${c.name}"?`;
                        if (confirm(msg)) {
                          if (homeCollageId === c.id) clearHome();
                          deleteCollage(c.id, { permanent: showArchived && isAdmin });
                        }
                      }}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="מחק"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {!!c.archived_at && (
                      <button
                        onClick={() => restoreCollage(c.id)}
                        className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-100"
                        title="שחזר מארכיון"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
            )}
          </div>
        </div>
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
            <div>
              <Label>פרטיות</Label>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => setEditDraft((d) => ({ ...d, visibility: "public" }))}
                  className={`px-3 py-1 text-xs rounded-full border ${editDraft.visibility === "public" ? "bg-primary text-primary-foreground" : "bg-background"}`}
                >
                  כללי
                </button>
                <button
                  onClick={() => setEditDraft((d) => ({ ...d, visibility: "private" }))}
                  className={`px-3 py-1 text-xs rounded-full border ${editDraft.visibility === "private" ? "bg-primary text-primary-foreground" : "bg-background"}`}
                >
                  פרטי
                </button>
              </div>
            </div>
            {isAdmin && (
              <>
                <div>
                  <Label>העברת בעלות (Owner User ID)</Label>
                  <Input
                    placeholder="UUID של המשתמש החדש"
                    value={editDraft.owner_user_id}
                    onChange={(e) => setEditDraft((d) => ({ ...d, owner_user_id: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>נעילת אדמין</Label>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => setEditDraft((d) => ({ ...d, locked_by_admin: false }))}
                      className={`px-3 py-1 text-xs rounded-full border ${!editDraft.locked_by_admin ? "bg-primary text-primary-foreground" : "bg-background"}`}
                    >
                      פתוח
                    </button>
                    <button
                      onClick={() => setEditDraft((d) => ({ ...d, locked_by_admin: true }))}
                      className={`px-3 py-1 text-xs rounded-full border ${editDraft.locked_by_admin ? "bg-primary text-primary-foreground" : "bg-background"}`}
                    >
                      נעול
                    </button>
                  </div>
                </div>
                {editDraft.locked_by_admin && (
                  <div>
                    <Label>סיבת נעילה (אופציונלי)</Label>
                    <Input
                      placeholder="לדוגמה: אלבום מוגן לעריכה"
                      value={editDraft.lock_reason}
                      onChange={(e) => setEditDraft((d) => ({ ...d, lock_reason: e.target.value }))}
                    />
                  </div>
                )}
              </>
            )}
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
                <div>
                  <Label>מיקום</Label>
                  <Input
                    placeholder="רודוס, אזרבייז׳ן..."
                    value={editDraft.location_tag}
                    onChange={(e) => setEditDraft(d => ({ ...d, location_tag: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>תגיות (מופרד בפסיקים)</Label>
                  <Input
                    placeholder="פסח, טיול, משפחה"
                    value={editDraft.tags}
                    onChange={(e) => setEditDraft(d => ({ ...d, tags: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>תיאור קצר</Label>
                  <Input
                    placeholder="מה מיוחד באלבום הזה"
                    value={editDraft.description}
                    onChange={(e) => setEditDraft(d => ({ ...d, description: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>כתובת תמונת קאבר (אופציונלי)</Label>
                  <Input
                    placeholder="https://..."
                    value={editDraft.cover_url}
                    onChange={(e) => setEditDraft(d => ({ ...d, cover_url: e.target.value }))}
                  />
                </div>
              </>
            )}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditingAlbum(null)} disabled={savingEdit}>ביטול</Button>
              <Button className="flex-1" onClick={handleSaveEdit} disabled={savingEdit || !user}>
                {savingEdit ? "שומר..." : "שמור ✓"}
              </Button>
            </div>
            {!user && <p className="text-xs text-amber-600">עריכת תיקיות/אלבומים זמינה רק למשתמש מחובר.</p>}
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
