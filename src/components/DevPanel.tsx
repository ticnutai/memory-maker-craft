import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Code2, Github, RefreshCw, Trash2, Database, Wifi, WifiOff, Copy, Check,
  Search, Download, Filter, Activity, Globe, Smartphone, Battery, HardDrive,
  Cloud, BarChart3, QrCode, X, ChevronDown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ───
interface LogEntry {
  time: string;
  type: "info" | "warn" | "error" | "log";
  message: string;
}

interface NetworkEntry {
  time: string;
  method: string;
  url: string;
  status: number | null;
  duration: number | null;
}

interface PerfStats {
  fps: number;
  memory: number | null; // MB
  loadTime: number | null;
}

function getDeviceId(): string {
  return localStorage.getItem("memory-game-device-id") || "unknown";
}

// ─── Sub-components ───

function LogFilter({ filter, setFilter, search, setSearch }: {
  filter: string; setFilter: (f: string) => void;
  search: string; setSearch: (s: string) => void;
}) {
  const types = ["all", "log", "info", "warn", "error"];
  return (
    <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-white/10">
      <Filter className="w-3 h-3 text-white/40 shrink-0" />
      {types.map(t => (
        <button
          key={t}
          onClick={() => setFilter(t)}
          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${filter === t ? "bg-white/20 text-white" : "text-white/40 hover:text-white/60"}`}
        >
          {t === "all" ? "הכל" : t}
        </button>
      ))}
      <div className="flex-1" />
      <div className="relative">
        <Search className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חפש..."
          className="w-24 h-6 pr-6 pl-1.5 rounded bg-white/10 text-[10px] text-white/80 placeholder:text-white/30 outline-none border-none"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute left-1 top-1/2 -translate-y-1/2">
            <X className="w-2.5 h-2.5 text-white/40" />
          </button>
        )}
      </div>
    </div>
  );
}

function PerformanceMonitor({ stats }: { stats: PerfStats }) {
  return (
    <div className="bg-muted/50 rounded-xl p-3 space-y-2">
      <h4 className="font-bold text-xs flex items-center gap-2">
        <Activity className="w-3.5 h-3.5" /> ביצועים
      </h4>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-background/50 rounded-lg p-2 text-center">
          <div className={`text-lg font-bold font-mono ${stats.fps >= 50 ? "text-green-500" : stats.fps >= 30 ? "text-yellow-400" : "text-red-400"}`}>
            {stats.fps}
          </div>
          <div className="text-[10px] text-muted-foreground">FPS</div>
        </div>
        <div className="bg-background/50 rounded-lg p-2 text-center">
          <div className="text-lg font-bold font-mono text-blue-400">
            {stats.memory !== null ? `${stats.memory}` : "—"}
          </div>
          <div className="text-[10px] text-muted-foreground">MB זיכרון</div>
        </div>
        <div className="bg-background/50 rounded-lg p-2 text-center">
          <div className="text-lg font-bold font-mono text-purple-400">
            {stats.loadTime !== null ? `${stats.loadTime}` : "—"}
          </div>
          <div className="text-[10px] text-muted-foreground">ms טעינה</div>
        </div>
      </div>
    </div>
  );
}

function NetworkMonitor({ entries }: { entries: NetworkEntry[] }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const exportNetwork = useCallback(() => {
    const text = entries.map(e => `[${e.time}] ${e.method} ${e.url} → ${e.status || "FAILED"} (${e.duration ?? "?"}ms)`).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `network-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [entries]);

  const copyNetwork = useCallback(() => {
    const text = entries.map(e => `[${e.time}] ${e.method} ${e.url} → ${e.status || "FAILED"} (${e.duration ?? "?"}ms)`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [entries]);

  return (
    <div className="bg-[#1a1a2e] rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 border-b border-white/10 hover:bg-white/5 transition-colors"
      >
        <h4 className="font-bold text-xs text-white/80 flex items-center gap-2">
          <Globe className="w-3.5 h-3.5" /> בקשות רשת
        </h4>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/40">{entries.length}</span>
          <ChevronDown className={`w-3 h-3 text-white/40 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </button>
      {expanded && (
        <>
          <div className="flex items-center justify-end gap-1.5 px-2 py-1 border-b border-white/10">
            <button onClick={copyNetwork} className="w-6 h-6 rounded flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors" title="העתק">
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            </button>
            <button onClick={exportNetwork} className="w-6 h-6 rounded flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors" title="הורד">
              <Download className="w-3 h-3" />
            </button>
          </div>
          <div className="min-h-[8rem] overflow-y-auto overflow-x-auto p-1.5 space-y-0.5 font-mono text-[10px]">
            {entries.length === 0 && (
              <p className="text-white/30 text-center py-4 text-xs">אין בקשות...</p>
            )}
            {entries.map((e, i) => (
              <div key={i} className="flex gap-1.5 leading-tight items-center px-1">
                <span className="text-white/30 shrink-0">{e.time}</span>
                <span className={`shrink-0 px-1 rounded text-[9px] font-bold ${
                  e.status && e.status < 300 ? "bg-green-500/20 text-green-400" :
                  e.status && e.status < 400 ? "bg-yellow-500/20 text-yellow-400" :
                  "bg-red-500/20 text-red-400"
                }`}>
                  {e.status || "..."}
                </span>
                <span className="text-blue-400/60 shrink-0">{e.method}</span>
                <span className="text-white/60 whitespace-nowrap">{e.url.replace(/https?:\/\/[^/]+/, "")}</span>
                {e.duration !== null && (
                  <span className="text-white/30 shrink-0">{e.duration}ms</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DeviceInfoExtended({ deviceId, isOnline, copied, copyDeviceId }: {
  deviceId: string; isOnline: boolean; copied: boolean; copyDeviceId: () => void;
}) {
  const [batteryInfo, setBatteryInfo] = useState<{ level: number; charging: boolean } | null>(null);
  const [storageUsage, setStorageUsage] = useState<{ used: number; total: number } | null>(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    // Battery API
    if ("getBattery" in navigator) {
      (navigator as any).getBattery().then((bat: any) => {
        setBatteryInfo({ level: Math.round(bat.level * 100), charging: bat.charging });
        bat.addEventListener("levelchange", () => setBatteryInfo({ level: Math.round(bat.level * 100), charging: bat.charging }));
        bat.addEventListener("chargingchange", () => setBatteryInfo({ level: Math.round(bat.level * 100), charging: bat.charging }));
      }).catch(() => {});
    }

    // Storage estimate
    if ("storage" in navigator && "estimate" in (navigator as any).storage) {
      (navigator as any).storage.estimate().then((est: any) => {
        setStorageUsage({
          used: Math.round((est.usage || 0) / 1024 / 1024),
          total: Math.round((est.quota || 0) / 1024 / 1024),
        });
      }).catch(() => {});
    }
  }, []);

  // LocalStorage size
  const lsSize = useMemo(() => {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) total += (localStorage.getItem(key) || "").length;
    }
    return (total / 1024).toFixed(1);
  }, []);

  // Parse UA
  const ua = navigator.userAgent;
  const os = /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Mac/.test(ua) ? "macOS" : /Win/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "Other";
  const browserMatch = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/);
  const browser = browserMatch ? browserMatch[0] : "Unknown";

  return (
    <div className="bg-muted/50 rounded-xl p-3 space-y-2.5">
      <h4 className="font-bold text-xs flex items-center gap-2">
        <Smartphone className="w-3.5 h-3.5" /> מידע טכני מורחב
      </h4>
      <div className="space-y-1.5 text-xs">
        {/* Device ID */}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">מזהה מכשיר:</span>
          <div className="flex items-center gap-1">
            <button onClick={copyDeviceId} className="flex items-center gap-1 font-mono text-[10px] bg-muted rounded px-2 py-0.5 hover:bg-muted/80 transition-colors">
              {deviceId.slice(0, 16)}...
              {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
            </button>
            <button
              onClick={() => setShowQR(!showQR)}
              className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted transition-colors"
            >
              <QrCode className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {showQR && (
          <div className="bg-background rounded-lg p-3 flex flex-col items-center gap-1">
            <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center p-1">
              {/* Simple text-based QR placeholder — shows device ID */}
              <div className="text-[6px] font-mono text-black break-all text-center leading-tight p-1">
                {deviceId}
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground">מזהה מכשיר מלא</span>
          </div>
        )}

        {/* Connection */}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">חיבור:</span>
          <span className={`flex items-center gap-1 font-bold ${isOnline ? "text-green-500" : "text-red-400"}`}>
            {isOnline ? <><Wifi className="w-3 h-3" /> מחובר</> : <><WifiOff className="w-3 h-3" /> מנותק</>}
          </span>
        </div>

        {/* OS */}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">מערכת הפעלה:</span>
          <span className="font-mono text-[10px]">{os}</span>
        </div>

        {/* Browser */}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">דפדפן:</span>
          <span className="font-mono text-[10px]">{browser}</span>
        </div>

        {/* Resolution */}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">רזולוציה:</span>
          <span className="font-mono text-[10px]">{window.innerWidth}×{window.innerHeight} (@{window.devicePixelRatio}x)</span>
        </div>

        {/* Battery */}
        {batteryInfo && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-1">
              <Battery className="w-3 h-3" /> סוללה:
            </span>
            <span className={`font-bold text-[10px] ${batteryInfo.level > 20 ? "text-green-500" : "text-red-400"}`}>
              {batteryInfo.level}% {batteryInfo.charging ? "⚡" : ""}
            </span>
          </div>
        )}

        {/* Storage */}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground flex items-center gap-1">
            <HardDrive className="w-3 h-3" /> localStorage:
          </span>
          <span className="font-mono text-[10px]">{lsSize} KB</span>
        </div>

        {storageUsage && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">אחסון כולל:</span>
            <span className="font-mono text-[10px]">{storageUsage.used} / {storageUsage.total} MB</span>
          </div>
        )}
      </div>
    </div>
  );
}

function CloudStatus({ deviceId }: { deviceId: string }) {
  const [stats, setStats] = useState<{ settings: boolean; cardSets: number; bgThemes: number; birthdays: number; voices: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [settingsRes, setsRes, themesRes, birthdaysRes, voicesRes] = await Promise.all([
          supabase.from("game_settings").select("id").eq("device_id", deviceId).maybeSingle(),
          supabase.from("custom_card_sets").select("id").eq("device_id", deviceId),
          supabase.from("custom_bg_themes").select("id").eq("device_id", deviceId),
          supabase.from("birthdays").select("id").eq("device_id", deviceId),
          supabase.from("voice_recordings").select("id").eq("device_id", deviceId),
        ]);
        setStats({
          settings: !!settingsRes.data,
          cardSets: setsRes.data?.length || 0,
          bgThemes: themesRes.data?.length || 0,
          birthdays: birthdaysRes.data?.length || 0,
          voices: voicesRes.data?.length || 0,
        });
      } catch {
        // ignore
      }
      setLoading(false);
    };
    load();
  }, [deviceId]);

  return (
    <div className="bg-muted/50 rounded-xl p-3 space-y-2">
      <h4 className="font-bold text-xs flex items-center gap-2">
        <Cloud className="w-3.5 h-3.5" /> סטטוס ענן
      </h4>
      {loading ? (
        <p className="text-xs text-muted-foreground text-center py-2">טוען...</p>
      ) : stats ? (
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { label: "הגדרות", value: stats.settings ? "✅" : "❌", color: "" },
            { label: "ערכות קלפים", value: String(stats.cardSets), color: "text-blue-400" },
            { label: "ערכות רקע", value: String(stats.bgThemes), color: "text-purple-400" },
            { label: "ימי הולדת", value: String(stats.birthdays), color: "text-pink-400" },
            { label: "הקלטות קול", value: String(stats.voices), color: "text-green-400" },
          ].map(item => (
            <div key={item.label} className="flex justify-between items-center bg-background/50 rounded-lg px-2 py-1.5">
              <span className="text-[10px] text-muted-foreground">{item.label}</span>
              <span className={`font-bold text-xs font-mono ${item.color}`}>{item.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-red-400 text-center">שגיאה בטעינת נתונים</p>
      )}
    </div>
  );
}

function GameStats() {
  const [sessionTime, setSessionTime] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setSessionTime(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-muted/50 rounded-xl p-3 space-y-2">
      <h4 className="font-bold text-xs flex items-center gap-2">
        <BarChart3 className="w-3.5 h-3.5" /> סטטיסטיקות
      </h4>
      <div className="grid grid-cols-2 gap-1.5">
        <div className="bg-background/50 rounded-lg px-2 py-1.5 flex justify-between items-center">
          <span className="text-[10px] text-muted-foreground">זמן סשן</span>
          <span className="font-bold text-xs font-mono text-foreground">{fmt(sessionTime)}</span>
        </div>
        <div className="bg-background/50 rounded-lg px-2 py-1.5 flex justify-between items-center">
          <span className="text-[10px] text-muted-foreground">רנדרים</span>
          <span className="font-bold text-xs font-mono text-foreground">{performance.getEntriesByType("resource").length}</span>
        </div>
      </div>
    </div>
  );
}

function GitHubStatus({ networkEntries, addLog }: { networkEntries: NetworkEntry[]; addLog: (type: LogEntry["type"], msg: string) => void }) {
  const githubEntries = useMemo(() => networkEntries.filter(e => e.url.toLowerCase().includes("github")), [networkEntries]);
  const lastEntry = githubEntries[githubEntries.length - 1] || null;
  const successCount = githubEntries.filter(e => e.status && e.status < 300).length;
  const errorCount = githubEntries.filter(e => e.status && e.status >= 400).length;

  const triggerTestLog = useCallback(() => {
    addLog("info", "🐙 GitHub — בדיקת חיבור... סנכרון מתבצע אוטומטית דרך הפלטפורמה");
  }, [addLog]);

  return (
    <div className="bg-muted/50 rounded-xl p-3 space-y-2">
      <h4 className="font-bold text-xs flex items-center gap-2">
        <Github className="w-3.5 h-3.5" /> GitHub
        <span className={`mr-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
          githubEntries.length === 0 ? "bg-muted text-muted-foreground" :
          errorCount > 0 ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
        }`}>
          {githubEntries.length === 0 ? "ממתין" : errorCount > 0 ? `${errorCount} שגיאות` : `${successCount} הצלחות`}
        </span>
      </h4>

      {/* Live activity feed */}
      {githubEntries.length > 0 && (
        <div className="bg-background/50 rounded-lg p-2 space-y-1 max-h-24 overflow-y-auto font-mono text-[10px]">
          {githubEntries.slice(-5).map((e, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${e.status && e.status < 300 ? "bg-green-400" : "bg-red-400"}`} />
              <span className="text-muted-foreground shrink-0">{e.time}</span>
              <span className="text-foreground/70 truncate">{e.method} {e.url.replace(/https?:\/\/[^/]+/, "")}</span>
              <span className="text-muted-foreground shrink-0">{e.duration}ms</span>
            </div>
          ))}
        </div>
      )}

      {githubEntries.length === 0 && (
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          אין פעילות GitHub עדיין. בקשות GitHub יופיעו כאן ובקונסול אוטומטית.
        </p>
      )}

      <div className="flex gap-1.5">
        <button
          onClick={triggerTestLog}
          className="flex-1 h-8 rounded-lg bg-muted text-foreground font-bold text-[10px] flex items-center justify-center gap-1.5 hover:bg-muted/80 transition-all active:scale-95"
        >
          <RefreshCw className="w-3 h-3" /> בדיקת חיבור
        </button>
        <a
          href="https://lovable.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 h-8 rounded-lg bg-[#24292f] text-white font-bold text-[10px] flex items-center justify-center gap-1.5 hover:bg-[#24292f]/90 transition-all active:scale-95"
        >
          <Github className="w-3 h-3" /> הגדרות
        </a>
      </div>
    </div>
  );
}

// ─── Main DevPanel ───
export default function DevPanel({ deviceId }: { deviceId: string }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [networkEntries, setNetworkEntries] = useState<NetworkEntry[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [copied, setCopied] = useState(false);
  const [logFilter, setLogFilter] = useState("all");
  const [logSearch, setLogSearch] = useState("");
  const [perfStats, setPerfStats] = useState<PerfStats>({ fps: 0, memory: null, loadTime: null });
  const logsEndRef = useRef<HTMLDivElement>(null);

  // FPS counter
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const tick = () => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        const mem = (performance as any).memory;
        setPerfStats({
          fps: frameCount,
          memory: mem ? Math.round(mem.usedJSHeapSize / 1024 / 1024) : null,
          loadTime: Math.round(performance.timing?.domContentLoadedEventEnd - performance.timing?.navigationStart) || null,
        });
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

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
      setLogs(prev => [...prev.slice(-199), { time: new Date().toLocaleTimeString("he-IL"), type, message }]);
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

  // Intercept fetch for network monitor + auto-log significant requests
  useEffect(() => {
    const origFetch = window.fetch;

    const classifyRequest = (url: string, method: string): { label: string; type: LogEntry["type"] } | null => {
      const lower = url.toLowerCase();
      if (lower.includes("/functions/v1/")) return { label: "⚡ Edge Function", type: "info" };
      if (lower.includes("supabase") && lower.includes("/rest/")) return { label: "🗄️ Database", type: "log" };
      if (lower.includes("supabase") && lower.includes("/storage/")) return { label: "📦 Storage", type: "log" };
      if (lower.includes("supabase") && lower.includes("/auth/")) return { label: "🔐 Auth", type: "info" };
      if (lower.includes("github")) return { label: "🐙 GitHub", type: "info" };
      if (lower.includes("deploy") || lower.includes("publish")) return { label: "🚀 Deploy", type: "info" };
      if (lower.includes("supabase")) return { label: "☁️ Cloud", type: "log" };
      return null;
    };

    window.fetch = async (...args) => {
      const url = typeof args[0] === "string" ? args[0] : (args[0] as Request)?.url || "";
      const method = (args[1]?.method || "GET").toUpperCase();
      const start = Date.now();
      const classification = classifyRequest(url, method);

      try {
        const res = await origFetch(...args);
        const duration = Date.now() - start;
        const shortUrl = url.replace(/https?:\/\/[^/]+/, "");

        setNetworkEntries(prev => [...prev.slice(-49), {
          time: new Date().toLocaleTimeString("he-IL"),
          method, url, status: res.status, duration,
        }]);

        // Auto-log significant requests to console
        if (classification) {
          const statusEmoji = res.status < 300 ? "✅" : res.status < 400 ? "↗️" : "❌";
          const logType: LogEntry["type"] = res.status >= 400 ? "error" : classification.type;
          setLogs(prev => [...prev.slice(-199), {
            time: new Date().toLocaleTimeString("he-IL"),
            type: logType,
            message: `${classification.label} ${statusEmoji} ${method} ${shortUrl} → ${res.status} (${duration}ms)`,
          }]);
        }

        return res;
      } catch (err) {
        const duration = Date.now() - start;
        const shortUrl = url.replace(/https?:\/\/[^/]+/, "");

        setNetworkEntries(prev => [...prev.slice(-49), {
          time: new Date().toLocaleTimeString("he-IL"),
          method, url, status: null, duration,
        }]);

        if (classification) {
          setLogs(prev => [...prev.slice(-199), {
            time: new Date().toLocaleTimeString("he-IL"),
            type: "error",
            message: `${classification.label} ❌ ${method} ${shortUrl} → FAILED (${duration}ms)`,
          }]);
        }

        throw err;
      }
    };
    return () => { window.fetch = origFetch; };
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

  const exportLogs = useCallback(() => {
    const text = logs.map(l => `[${l.time}] [${l.type}] ${l.message}`).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `devlogs-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      if (logFilter !== "all" && l.type !== logFilter) return false;
      if (logSearch && !l.message.toLowerCase().includes(logSearch.toLowerCase())) return false;
      return true;
    });
  }, [logs, logFilter, logSearch]);

  const logColors: Record<string, string> = {
    log: "text-white",
    info: "text-sky-300",
    warn: "text-yellow-300",
    error: "text-red-400",
  };

  return (
    <div className="space-y-3 overflow-y-auto" dir="rtl">
      <p className="font-bold text-lg text-center flex items-center justify-center gap-2">
        <Code2 className="w-5 h-5" /> פיתוח
      </p>

      {/* Performance */}
      <PerformanceMonitor stats={perfStats} />

      {/* Device Info Extended */}
      <DeviceInfoExtended deviceId={deviceId} isOnline={isOnline} copied={copied} copyDeviceId={copyDeviceId} />

      {/* Cloud Status */}
      <CloudStatus deviceId={deviceId} />

      {/* Game Stats */}
      <GameStats />

      {/* GitHub Section — connected to network & console */}
      <GitHubStatus networkEntries={networkEntries} addLog={(type, msg) => setLogs(prev => [...prev.slice(-199), { time: new Date().toLocaleTimeString("he-IL"), type, message: msg }])} />

      {/* Network Monitor */}
      <NetworkMonitor entries={networkEntries} />

      {/* Console */}
      <div className="bg-[#1a1a2e] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
          <h4 className="font-bold text-xs text-white/80 flex items-center gap-2">
            <Code2 className="w-3.5 h-3.5" /> קונסול
          </h4>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-white/40">{filteredLogs.length}/{logs.length}</span>
            <button onClick={exportLogs} className="w-6 h-6 rounded flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors" title="ייצוא">
              <Download className="w-3 h-3" />
            </button>
            <button onClick={() => setLogs([])} className="w-6 h-6 rounded flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors" title="נקה">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
        <LogFilter filter={logFilter} setFilter={setLogFilter} search={logSearch} setSearch={setLogSearch} />
        <div className="min-h-[10rem] max-h-[50vh] overflow-y-auto overflow-x-auto p-2 space-y-1 font-mono text-xs">
          {filteredLogs.length === 0 && (
            <p className="text-white/40 text-center py-8 text-sm">
              {logs.length === 0 ? "אין הודעות עדיין..." : "אין תוצאות לסינון"}
            </p>
          )}
          {filteredLogs.map((log, i) => (
            <div key={i} className={`flex gap-2 leading-relaxed ${logColors[log.type]}`}>
              <span className="text-white/50 shrink-0">{log.time}</span>
              <span className="text-white/60 shrink-0 font-bold">[{log.type}]</span>
              <span className="whitespace-nowrap">{log.message}</span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}
