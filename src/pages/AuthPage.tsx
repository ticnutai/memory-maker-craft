import { useEffect, useState } from "react";
import { Eye, EyeOff, LogIn, UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Mode = "login" | "register";

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    navigate("/", { replace: true });
  }, [loading, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setBusy(true);

    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
        });
        if (error) throw error;
        toast.success("נרשמת בהצלחה! ממתין לאישור מנהל");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });
        if (error) throw error;
        toast.success("התחברת בהצלחה!");
        navigate("/", { replace: true });
      }
    } catch (err: any) {
      toast.error(err.message || "שגיאה בהתחברות");
    }
    setBusy(false);
  };

  const handleGoogleSignIn = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("שגיאה בהתחברות עם Google");
      }
      if (result.redirected) return;
    } catch {
      toast.error("שגיאה בהתחברות עם Google");
    }
    setBusy(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo / Title */}
        <div className="text-center">
          <div className="text-6xl mb-3">🏠</div>
          <h1 className="text-2xl font-bold text-foreground">בית משפחת טננבאום</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "login" ? "התחברו לחשבון" : "צרו חשבון חדש"}
          </p>
        </div>

        {/* Google Sign-In */}
        <Button
          variant="outline"
          className="w-full gap-2 h-11"
          onClick={handleGoogleSignIn}
          disabled={busy}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.97 10.97 0 001 12c0 1.78.43 3.46 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          התחבר עם Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-xs"><span className="bg-background px-2 text-muted-foreground">או</span></div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">אימייל</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              dir="ltr"
              className="mt-1"
              autoComplete="email"
            />
          </div>

          <div>
            <Label htmlFor="password">סיסמא</Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                dir="ltr"
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                className="pl-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === "login" && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(v) => setRememberMe(!!v)}
              />
              <Label htmlFor="remember" className="text-sm cursor-pointer">זכור אותי</Label>
            </div>
          )}

          <Button type="submit" className="w-full h-11 gap-2" disabled={busy}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> :
              mode === "login" ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {mode === "login" ? "התחבר" : "הירשם"}
          </Button>
        </form>

        <div className="text-center text-sm">
          {mode === "login" ? (
            <p className="text-muted-foreground">
              אין לך חשבון?{" "}
              <button onClick={() => setMode("register")} className="text-primary hover:underline font-medium">הירשם</button>
            </p>
          ) : (
            <p className="text-muted-foreground">
              כבר יש לך חשבון?{" "}
              <button onClick={() => setMode("login")} className="text-primary hover:underline font-medium">התחבר</button>
            </p>
          )}
        </div>

        {/* Guest access hint */}
        <p className="text-center text-xs text-muted-foreground">
          💡 ניתן לצפות באתר גם בלי להתחבר
        </p>
      </div>
    </div>
  );
}
