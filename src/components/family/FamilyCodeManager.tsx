import { useState } from "react";
import { Users, Copy, LogOut, KeyRound, Plus, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Family, FamilyMember } from "@/hooks/useFamily";

interface Props {
  family: Family | null;
  members: FamilyMember[];
  isAdmin: boolean;
  deviceId: string;
  onCreateFamily: (name: string) => Promise<Family>;
  onJoinByCode: (code: string) => Promise<Family | null>;
  onLeaveFamily: () => Promise<void>;
  onUpdateNickname: (nickname: string) => Promise<void>;
}

export default function FamilyCodeManager({
  family, members, isAdmin, deviceId,
  onCreateFamily, onJoinByCode, onLeaveFamily, onUpdateNickname,
}: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"menu" | "create" | "join">("menu");
  const [name, setName] = useState("המשפחה שלי");
  const [code, setCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [busy, setBusy] = useState(false);

  const myMember = members.find((m) => m.device_id === deviceId);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const f = await onCreateFamily(name.trim());
      toast.success(`משפחה "${f.name}" נוצרה! קוד: ${f.code}`);
      setMode("menu");
    } catch { toast.error("שגיאה ביצירת משפחה"); }
    setBusy(false);
  };

  const handleJoin = async () => {
    if (!code.trim()) return;
    setBusy(true);
    try {
      const f = await onJoinByCode(code.trim());
      if (f) { toast.success(`הצטרפת למשפחת "${f.name}"!`); setMode("menu"); }
      else toast.error("קוד משפחה לא נמצא");
    } catch { toast.error("שגיאה בהצטרפות"); }
    setBusy(false);
  };

  const handleLeave = async () => {
    if (!confirm("בטוח שרוצה לעזוב את המשפחה?")) return;
    await onLeaveFamily();
    toast.info("עזבת את המשפחה");
    setOpen(false);
  };

  const copyCode = () => {
    if (!family) return;
    navigator.clipboard.writeText(family.code);
    toast.success("הקוד הועתק!");
  };

  const handleSaveNickname = async () => {
    if (!nickname.trim()) return;
    await onUpdateNickname(nickname.trim());
    toast.success("שם תצוגה עודכן");
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => { setOpen(true); setMode("menu"); }}
        className="rounded-full"
        title="ניהול משפחה"
      >
        <Users className="w-5 h-5" />
        {family && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary border border-background" />}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {family ? `משפחת ${family.name}` : "ניהול משפחה"}
            </DialogTitle>
          </DialogHeader>

          {/* Connected to a family */}
          {family && mode === "menu" && (
            <div className="space-y-4">
              <div className="rounded-xl bg-muted/50 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">קוד שיתוף:</span>
                  <Button variant="outline" size="sm" onClick={copyCode} className="gap-1 font-mono text-base">
                    <Copy className="w-3.5 h-3.5" /> {family.code}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">שתף את הקוד כדי שמכשירים אחרים יצטרפו ויראו את כל הנתונים</p>
              </div>

              {/* Members list */}
              <div>
                <h3 className="text-sm font-semibold mb-2">חברי משפחה ({members.length})</h3>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 text-sm bg-muted/30 rounded-lg px-3 py-1.5">
                      {m.device_id === family.admin_device_id && <Crown className="w-3.5 h-3.5 text-primary" />}
                      <span>{m.nickname || (m.device_id === deviceId ? "אני" : `מכשיר ${m.device_id.slice(-4)}`)}</span>
                      {m.device_id === deviceId && <span className="text-xs text-muted-foreground">(המכשיר הזה)</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Nickname */}
              <div className="flex gap-2">
                <Input
                  placeholder={myMember?.nickname || "שם תצוגה שלי"}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="text-sm"
                />
                <Button size="sm" onClick={handleSaveNickname} disabled={!nickname.trim()}>שמור</Button>
              </div>

              <Button variant="destructive" size="sm" className="w-full gap-1" onClick={handleLeave}>
                <LogOut className="w-4 h-4" /> עזוב משפחה
              </Button>
            </div>
          )}

          {/* No family — choose action */}
          {!family && mode === "menu" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                צור משפחה חדשה או הצטרף עם קוד כדי לשתף נתונים בין מכשירים
              </p>
              <Button onClick={() => setMode("create")} className="w-full gap-2">
                <Plus className="w-4 h-4" /> צור משפחה חדשה
              </Button>
              <Button variant="outline" onClick={() => setMode("join")} className="w-full gap-2">
                <KeyRound className="w-4 h-4" /> הצטרף עם קוד
              </Button>
            </div>
          )}

          {/* Create family form */}
          {mode === "create" && (
            <div className="space-y-3">
              <Input
                placeholder="שם המשפחה"
                value={name}
                onChange={(e) => setName(e.target.value)}
                dir="rtl"
              />
              <div className="flex gap-2">
                <Button onClick={handleCreate} disabled={busy || !name.trim()} className="flex-1">
                  {busy ? "יוצר…" : "צור משפחה"}
                </Button>
                <Button variant="ghost" onClick={() => setMode("menu")}>חזור</Button>
              </div>
            </div>
          )}

          {/* Join family form */}
          {mode === "join" && (
            <div className="space-y-3">
              <Input
                placeholder="הזן קוד משפחה"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="font-mono text-center text-lg tracking-widest"
                dir="ltr"
              />
              <div className="flex gap-2">
                <Button onClick={handleJoin} disabled={busy || !code.trim()} className="flex-1">
                  {busy ? "מצטרף…" : "הצטרף"}
                </Button>
                <Button variant="ghost" onClick={() => setMode("menu")}>חזור</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
