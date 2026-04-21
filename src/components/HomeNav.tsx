import { Home, Album, Cake, Palette, Gamepad2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarSection } from "@/components/AppSidebar";

interface HomeNavProps {
  active: SidebarSection;
  onSelect: (section: SidebarSection) => void;
  onOpenThemePicker?: () => void;
}

const navItems: { key: SidebarSection | "themes"; label: string; icon: typeof Home }[] = [
  { key: "family", label: "אלבומים", icon: Home },
  { key: "albums", label: "אלבומי משפחה", icon: Album },
  { key: "birthdays", label: "ימי הולדת", icon: Cake },
  { key: "themes", label: "קולאז׳ים וערכות", icon: Palette },
  { key: "memory", label: "משחקים", icon: Gamepad2 },
];

export default function HomeNav({ active, onSelect, onOpenThemePicker }: HomeNavProps) {
  const handleClick = (key: string) => {
    if (key === "themes") {
      onOpenThemePicker?.();
    } else {
      onSelect(key as SidebarSection);
    }
  };

  const isActive = (key: string) => {
    if (key === "memory") return ["memory", "treasure", "train"].includes(active);
    return active === key;
  };

  return (
    <nav
      className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-1.5 py-1 rounded-full bg-background/40 backdrop-blur-sm border border-border/20"
      dir="rtl"
    >
      {navItems.map((item) => (
        <button
          key={item.key}
          onClick={() => handleClick(item.key)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all duration-200",
            "hover:bg-accent/40",
            isActive(item.key)
              ? "bg-primary/15 text-primary font-medium"
              : "text-foreground/70"
          )}
        >
          <item.icon className="h-3.5 w-3.5 shrink-0" />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
