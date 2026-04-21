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
    <nav className="fixed top-4 left-4 z-50 flex flex-col gap-1 min-w-[170px]" dir="rtl">
      {navItems.map((item) => (
        <button
          key={item.key}
          onClick={() => handleClick(item.key)}
          className={cn(
            "flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-sm transition-all duration-200",
            "bg-background/70 backdrop-blur-md border border-border/40 shadow-sm",
            "hover:bg-accent/60 hover:shadow-md hover:scale-[1.02]",
            isActive(item.key) &&
              "bg-primary/10 border-primary/30 text-primary font-medium shadow-md"
          )}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
