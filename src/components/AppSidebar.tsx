import { Home, Cake, Gamepad2, Map, Train, ChevronDown, Pin, PinOff, Settings } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

export type SidebarSection = "family" | "birthdays" | "memory" | "treasure" | "train";

interface AppSidebarProps {
  active: SidebarSection;
  onSelect: (section: SidebarSection) => void;
  onOpenSettings: () => void;
}

const games: { key: SidebarSection; title: string; icon: typeof Gamepad2 }[] = [
  { key: "memory", title: "זיכרון", icon: Gamepad2 },
  { key: "treasure", title: "ציד מטמון", icon: Map },
  { key: "train", title: "רכבת", icon: Train },
];

const PIN_KEY = "app-sidebar-pinned";

export default function AppSidebar({ active, onSelect, onOpenSettings }: AppSidebarProps) {
  const [pinned, setPinned] = useState<boolean>(() => {
    try { return localStorage.getItem(PIN_KEY) === "1"; } catch { return false; }
  });
  const [hoverOpen, setHoverOpen] = useState(false);
  const isGameActive = games.some((g) => g.key === active);
  const [gamesOpen, setGamesOpen] = useState(isGameActive);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    try { localStorage.setItem(PIN_KEY, pinned ? "1" : "0"); } catch {}
  }, [pinned]);

  const open = pinned || hoverOpen;

  const cancelClose = useCallback(() => {
    if (closeTimer.current) { window.clearTimeout(closeTimer.current); closeTimer.current = null; }
  }, []);
  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setHoverOpen(false), 250);
  }, [cancelClose]);

  const handleSelect = (s: SidebarSection) => {
    onSelect(s);
    if (!pinned) setHoverOpen(false);
  };

  const baseBtn = "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
  const activeBtn = "bg-sidebar-accent text-sidebar-accent-foreground font-medium";

  return (
    <>
      {/* Hover-trigger strip on the right edge — always present, invisible */}
      <div
        className="fixed top-0 right-0 h-full w-3 z-[95]"
        onMouseEnter={() => { cancelClose(); setHoverOpen(true); }}
        aria-hidden="true"
      />

      {/* The sidebar panel itself */}
      <aside
        onMouseEnter={cancelClose}
        onMouseLeave={() => { if (!pinned) scheduleClose(); }}
        className={cn(
          "fixed top-0 right-0 h-full w-64 z-[96] bg-sidebar text-sidebar-foreground border-l border-sidebar-border shadow-xl",
          "transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
        dir="rtl"
      >
        {/* Header with pin toggle */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-sidebar-border">
          <div className="text-sm font-semibold text-sidebar-foreground/80">
            משפחת טננבאום 💛
          </div>
          <button
            onClick={() => setPinned(p => !p)}
            title={pinned ? "בטל הצמדה" : "הצמד את הסרגל"}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              pinned
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
            aria-pressed={pinned}
          >
            {pinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
          </button>
        </div>

        {/* Menu */}
        <nav className="p-2 space-y-3 overflow-y-auto h-[calc(100%-110px)]">
          <div className="space-y-1">
            <div className="px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-sidebar-foreground/50">
              ראשי
            </div>
            <button
              onClick={() => handleSelect("family")}
              className={cn(baseBtn, active === "family" && activeBtn)}
            >
              <Home className="h-4 w-4 shrink-0" />
              <span>אלבומים</span>
            </button>
            <button
              onClick={() => handleSelect("birthdays")}
              className={cn(baseBtn, active === "birthdays" && activeBtn)}
            >
              <Cake className="h-4 w-4 shrink-0" />
              <span>ימי הולדת</span>
            </button>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => setGamesOpen(o => !o)}
              className="w-full flex items-center justify-between px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-sidebar-foreground/50 hover:text-sidebar-foreground"
            >
              <span>משחקים</span>
              <ChevronDown
                className={cn("h-3.5 w-3.5 transition-transform", gamesOpen && "rotate-180")}
              />
            </button>
            {gamesOpen && (
              <div className="space-y-1">
                {games.map((g) => (
                  <button
                    key={g.key}
                    onClick={() => handleSelect(g.key)}
                    className={cn(baseBtn, active === g.key && activeBtn)}
                  >
                    <g.icon className="h-4 w-4 shrink-0" />
                    <span>{g.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Footer: settings */}
        <div className="absolute bottom-0 inset-x-0 border-t border-sidebar-border p-2 bg-sidebar">
          <button
            onClick={() => { onOpenSettings(); if (!pinned) setHoverOpen(false); }}
            className={cn(baseBtn)}
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span>הגדרות</span>
          </button>
        </div>
      </aside>
    </>
  );
}
