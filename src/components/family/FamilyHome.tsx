import { useState } from "react";
import { Plus, Trash2, KeyRound, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFamilyCollages, FamilyCollage } from "@/hooks/useFamilyCollages";
import CollageView from "./CollageView";
import { toast } from "sonner";

export default function FamilyHome() {
  const { collages, loading, createCollage, updateCollage, deleteCollage, joinByCode, deviceId } = useFamilyCollages();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);

  const active = collages.find(c => c.id === activeId);
  if (active) {
    return <CollageView collage={active} onBack={() => setActiveId(null)} onUpdateCollage={updateCollage} />;
  }

  const handleCreate = async () => {
    try {
      const c = await createCollage({ name: `קולאז׳ ${collages.length + 1}` });
      setActiveId(c.id);
    } catch {
      toast.error("שגיאה ביצירת קולאז׳");
    }
  };

  const handleJoin = async () => {
    setJoining(true);
    try {
      const c = await joinByCode(joinCode);
      if (c) {
        toast.success(`הצטרפת לקולאז׳ "${c.name}"`);
        setShowJoin(false);
        setJoinCode("");
        setActiveId(c.id);
      } else {
        toast.error("קוד לא נמצא");
      }
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen pt-16 pb-12 px-4 max-w-5xl mx-auto">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">🏠 בית משפחה טננבאום</h1>
        <p className="text-foreground/70 text-sm">צרו קולאז'ים מתמונות המשפחה — יחד</p>
      </header>

      <div className="flex justify-center gap-3 mb-6 flex-wrap">
        <Button onClick={handleCreate} size="lg" className="rounded-full">
          <Plus className="w-5 h-5 ml-1" /> קולאז׳ חדש
        </Button>
        <Button onClick={() => setShowJoin(true)} size="lg" variant="outline" className="rounded-full">
          <KeyRound className="w-5 h-5 ml-1" /> הצטרף עם קוד
        </Button>
      </div>

      {loading && <div className="text-center text-foreground/60">טוען…</div>}

      {!loading && collages.length === 0 && (
        <div className="text-center text-foreground/60 py-12">
          עדיין אין קולאז'ים. צור חדש או הצטרף לקולאז' של בן משפחה עם קוד שיתוף!
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {collages.map(c => (
          <CollageCard
            key={c.id}
            collage={c}
            isShared={c.device_id !== deviceId}
            onOpen={() => setActiveId(c.id)}
            onDelete={() => {
              const isShared = c.device_id !== deviceId;
              const msg = isShared ? `לעזוב את הקולאז׳ "${c.name}"?` : `למחוק את "${c.name}"?`;
              if (confirm(msg)) deleteCollage(c.id);
            }}
          />
        ))}
      </div>

      {/* Join dialog */}
      <Dialog open={showJoin} onOpenChange={setShowJoin}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>הצטרף לקולאז׳ משפחתי</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-foreground/70">
              הכנס את קוד השיתוף שקיבלת מבן משפחה כדי להוסיף תמונות ולערוך יחד.
            </p>
            <Input
              placeholder="קוד שיתוף (8 תווים)"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              maxLength={8}
              className="text-center text-xl font-mono tracking-[0.3em] uppercase"
              autoFocus
            />
            <Button onClick={handleJoin} disabled={joining || joinCode.trim().length < 4} className="w-full">
              {joining ? "מצטרף…" : "הצטרף"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CollageCard({ collage, isShared, onOpen, onDelete }: { collage: FamilyCollage; isShared: boolean; onOpen: () => void; onDelete: () => void }) {
  return (
    <div className="group relative bg-card border rounded-2xl p-4 cursor-pointer hover:shadow-lg transition-shadow active:scale-95"
      onClick={onOpen}
      style={{ background: collage.background ?? undefined }}>
      {isShared && (
        <div className="absolute top-2 right-2 bg-game-pink text-primary-foreground rounded-full px-2 py-0.5 text-[10px] flex items-center gap-1">
          <Users className="w-2.5 h-2.5" /> משותף
        </div>
      )}
      <div className="text-4xl text-center mb-2">{collage.emoji ?? "📸"}</div>
      <div className="font-bold text-center text-sm truncate">{collage.name}</div>
      <div className="text-xs text-center text-foreground/60 mt-1">{collage.layout_type}</div>
      <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 bg-destructive text-destructive-foreground rounded-full p-1 transition-opacity">
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}
