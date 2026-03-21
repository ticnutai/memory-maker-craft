import { useState, useEffect, useRef, useCallback } from "react";
import { Code2, Github, RefreshCw, Trash2, Database, Wifi, WifiOff, Copy, Check } from "lucide-react";

interface LogEntry {
  time: string;
  type: "info" | "warn" | "error" | "log";
  message: string;
}

function getDeviceId(): string {
  return localStorage.getItem("memory-game-device-id") || "unknown";
}

export default function DevPanel({ deviceId }: { deviceId: string }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [copied, setCopied] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Intercept console logs
  useEffect(() => {
    const origLog = console.log;
    const origWarn = console.warn;
    const origError = console.error;
    const origInfo = console.info;

    const addLog = (type: LogEntry["type"], args: any[]) => {
      const message = args.map(a => {
        try { return typeof a === "object" ? JSON.stringify(a, null, 0).slice(0, 200) : String(a); }
        catch { return String(a); }
      }).join(" ");
      setLogs(prev => [...prev.slice(-99), { time: new Date().toLocaleTimeString("he-IL"), type, message }]);
    };

    console.log = (...args) => { origLog(...args); addLog("log", args); };
    console.warn = (...args) => { origWarn(...args); addLog("warn", args); };
    console.error = (...args) => { origError(...args); addLog("error", args); };
    console.info = (...args) => { origInfo(...args); addLog("info", args); };

    return () => {
      console.log = origLog;
      console.warn = origWarn;
      console.error = origError;
      console.info = origInfo;
    };
  }, []);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => { window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); };
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const copyDeviceId = useCallback(() => {
    navigator.clipboard.writeText(deviceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [deviceId]);

  const logColors: Record<string, string> = {
    log: "text-foreground",
    info: "text-blue-400",
    warn: "text-yellow-400",
    error: "text-red-400",
  };

  return (
    <div className="space-y-4" dir="rtl">
      <p className="font-bold text-lg text-center flex items-center justify-center gap-2">
        <Code2 className="w-5 h-5" /> פיתוח
      </p>

      {/* GitHub Section */}
      <div className="bg-muted/50 rounded-xl p-4 space-y-3">
        <h4 className="font-bold text-sm flex items-center gap-2">
          <Github className="w-4 h-4" /> GitHub
        </h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          חיבור, דחיפה ומשיכה מ-GitHub מתבצעים דרך הפלטפורמה.
          הסנכרון אוטומטי ודו-כיווני ברגע שמחוברים.
        </p>
        <div className="flex gap-2">
          <a
            href="https://lovable.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 h-10 rounded-xl bg-[#24292f] text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#24292f]/90 transition-all active:scale-95"
          >
            <Github className="w-4 h-4" /> פתח הגדרות GitHub
          </a>
        </div>
        <div className="flex gap-2">
          <button className="flex-1 h-9 rounded-lg bg-accent/20 text-accent-foreground font-bold text-xs flex items-center justify-center gap-2 hover:bg-accent/30 transition-all active:scale-95 opacity-60 cursor-not-allowed" disabled>
            <RefreshCw className="w-3.5 h-3.5" /> משוך (Pull)
          </button>
          <button className="flex-1 h-9 rounded-lg bg-accent/20 text-accent-foreground font-bold text-xs flex items-center justify-center gap-2 hover:bg-accent/30 transition-all active:scale-95 opacity-60 cursor-not-allowed" disabled>
            <RefreshCw className="w-3.5 h-3.5 rotate-180" /> דחוף (Push)
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center">
          פעולות Push/Pull מתבצעות אוטומטית דרך הפלטפורמה
        </p>
      </div>

      {/* System Info */}
      <div className="bg-muted/50 rounded-xl p-4 space-y-2">
        <h4 className="font-bold text-sm flex items-center gap-2">
          <Database className="w-4 h-4" /> מידע טכני
        </h4>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">מזהה מכשיר:</span>
            <button onClick={copyDeviceId} className="flex items-center gap-1 font-mono text-[11px] bg-muted rounded px-2 py-0.5 hover:bg-muted/80 transition-colors">
              {deviceId.slice(0, 16)}...
              {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">סטטוס חיבור:</span>
            <span className={`flex items-center gap-1 font-bold ${isOnline ? "text-green-500" : "text-red-400"}`}>
              {isOnline ? <><Wifi className="w-3 h-3" /> מחובר</> : <><WifiOff className="w-3 h-3" /> מנותק</>}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">דפדפן:</span>
            <span className="font-mono text-[11px]">{navigator.userAgent.split(" ").pop()?.split("/")[0] || "Unknown"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">רזולוציה:</span>
            <span className="font-mono text-[11px]">{window.innerWidth}×{window.innerHeight}</span>
          </div>
        </div>
      </div>

      {/* Console */}
      <div className="bg-[#1a1a2e] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
          <h4 className="font-bold text-xs text-white/80 flex items-center gap-2">
            <Code2 className="w-3.5 h-3.5" /> קונסול
          </h4>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/40">{logs.length} הודעות</span>
            <button
              onClick={() => setLogs([])}
              className="w-6 h-6 rounded flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="h-48 overflow-y-auto p-2 space-y-0.5 font-mono text-[11px]">
          {logs.length === 0 && (
            <p className="text-white/30 text-center py-8 text-xs">אין הודעות עדיין...</p>
          )}
          {logs.map((log, i) => (
            <div key={i} className={`flex gap-2 leading-tight ${logColors[log.type]}`}>
              <span className="text-white/30 shrink-0">{log.time}</span>
              <span className="text-white/50 shrink-0">[{log.type}]</span>
              <span className="break-all">{log.message}</span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}
