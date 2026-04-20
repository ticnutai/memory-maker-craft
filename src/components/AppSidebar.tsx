import { Home, Cake, Gamepad2, Map, Train, ChevronDown } from "lucide-react";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export type SidebarSection = "family" | "birthdays" | "memory" | "treasure" | "train";

interface AppSidebarProps {
  active: SidebarSection;
  onSelect: (section: SidebarSection) => void;
}

const games: { key: SidebarSection; title: string; icon: typeof Gamepad2 }[] = [
  { key: "memory", title: "זיכרון", icon: Gamepad2 },
  { key: "treasure", title: "ציד מטמון", icon: Map },
  { key: "train", title: "רכבת", icon: Train },
];

export default function AppSidebar({ active, onSelect }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const isGameActive = games.some((g) => g.key === active);
  const [gamesOpen, setGamesOpen] = useState(isGameActive);

  const baseBtn =
    "transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
  const activeBtn = "bg-sidebar-accent text-sidebar-accent-foreground font-medium";

  return (
    <Sidebar side="right" collapsible="icon">
      <SidebarHeader className="px-3 py-3">
        {!collapsed && (
          <div className="text-sm font-semibold text-sidebar-foreground/80">
            משפחת טננבאום 💛
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>ראשי</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onSelect("family")}
                  tooltip="אלבומים משפחתיים"
                  className={cn(baseBtn, active === "family" && activeBtn)}
                >
                  <Home className="h-4 w-4" />
                  <span>אלבומים</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onSelect("birthdays")}
                  tooltip="ימי הולדת ותזכורות"
                  className={cn(baseBtn, active === "birthdays" && activeBtn)}
                >
                  <Cake className="h-4 w-4" />
                  <span>ימי הולדת</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <Collapsible open={gamesOpen || collapsed} onOpenChange={setGamesOpen}>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel
                asChild
                className="cursor-pointer flex items-center justify-between hover:text-sidebar-foreground"
              >
                <button type="button" className="w-full">
                  <span>משחקים</span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform",
                      gamesOpen ? "rotate-180" : "",
                      "group-data-[collapsible=icon]:hidden"
                    )}
                  />
                </button>
              </SidebarGroupLabel>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {games.map((g) => (
                    <SidebarMenuItem key={g.key}>
                      <SidebarMenuButton
                        onClick={() => onSelect(g.key)}
                        tooltip={g.title}
                        className={cn(baseBtn, active === g.key && activeBtn)}
                      >
                        <g.icon className="h-4 w-4" />
                        <span>{g.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
