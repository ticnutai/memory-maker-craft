import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFamilyCollages, FamilyCollage } from "@/hooks/useFamilyCollages";
import CollageView from "./CollageView";
import { toast } from "sonner";

export default function FamilyHome() {
  const { collages, loading, createCollage, updateCollage, deleteCollage } = useFamilyCollages();
  const [activeId, setActiveId] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen pt-16 pb-12 px-4 max-w-5xl mx-auto">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">🏠 בית משפחה טננבאום</h1>
        <p className="text-foreground/70 text-sm">צרו קולאז'ים מתמונות המשפחה</p>
      </header>

      <div className="flex justify-center mb-6">
        <Button onClick={handleCreate} size="lg" className="rounded-full">
          <Plus className="w-5 h-5 ml-1" /> קולאז׳ חדש
        </Button>
      </div>

      {loading && <div className="text-center text-foreground/60">טוען…</div>}

      {!loading && collages.length === 0 && (
        <div className="text-center text-foreground/60 py-12">
          עדיין אין קולאז'ים. לחצו על "קולאז׳ חדש" כדי להתחיל!
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {collages.map(c => (
          <CollageCard key={c.id} collage={c} onOpen={() => setActiveId(c.id)} onDelete={() => {
            if (confirm(`למחוק את "${c.name}"?`)) deleteCollage(c.id);
          }} />
        ))}
      </div>
    </div>
  );
}

function CollageCard({ collage, onOpen, onDelete }: { collage: FamilyCollage; onOpen: () => void; onDelete: () => void }) {
  return (
    <div className="group relative bg-card border rounded-2xl p-4 cursor-pointer hover:shadow-lg transition-shadow active:scale-95"
      onClick={onOpen}
      style={{ background: collage.background ?? undefined }}>
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
