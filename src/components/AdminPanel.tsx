import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Shield, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PendingUser {
  user_id: string;
  display_name: string | null;
  is_approved: boolean;
  created_at: string;
  email?: string;
}

export default function AdminPanel() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, is_approved, created_at")
        .order("created_at", { ascending: false });
      setUsers((data ?? []) as PendingUser[]);
      setLoading(false);
    })();
  }, [isAdmin]);

  if (!isAdmin) return null;

  const toggleApproval = async (userId: string, approved: boolean) => {
    await supabase.from("profiles").update({ is_approved: approved }).eq("user_id", userId);
    setUsers((prev) => prev.map((u) => u.user_id === userId ? { ...u, is_approved: approved } : u));
    toast.success(approved ? "משתמש אושר" : "אישור הוסר");
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <h3 className="font-bold flex items-center gap-2 text-foreground">
        <Shield className="w-4 h-4" /> ניהול משתמשים
      </h3>
      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : users.length === 0 ? (
        <p className="text-sm text-muted-foreground">אין משתמשים רשומים</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {users.map((u) => (
            <div key={u.user_id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
              <div>
                <span className="text-sm font-medium text-foreground">{u.display_name || "ללא שם"}</span>
                <span className="text-xs text-muted-foreground mr-2">
                  {new Date(u.created_at).toLocaleDateString("he-IL")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {u.is_approved ? (
                  <span className="text-xs text-primary flex items-center gap-1"><Check className="w-3 h-3" /> מאושר</span>
                ) : (
                  <span className="text-xs text-destructive flex items-center gap-1"><X className="w-3 h-3" /> ממתין</span>
                )}
                <Switch
                  checked={u.is_approved}
                  onCheckedChange={(v) => toggleApproval(u.user_id, v)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
