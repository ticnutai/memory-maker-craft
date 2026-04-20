import { useState } from "react";
import CardSetSelect from "@/components/CardSetSelect";
import GameBoard from "@/components/GameBoard";
import TreasureHuntGame from "@/components/TreasureHuntGame";
import TrainGame from "@/components/TrainGame";
import FamilyHome from "@/components/family/FamilyHome";
import BirthdayManager from "@/components/BirthdayManager";
import AppSidebar, { SidebarSection } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CardSetType, CardData, GameSettings } from "@/lib/gameData";
import { useCloudSettings } from "@/hooks/useCloudSettings";
import { Settings } from "lucide-react";

type Screen = "home" | "game";

const Index = () => {
  const { settings: cloudSettings, toGameSettings } = useCloudSettings("girl");
  const [tab, setTab] = useState<SidebarSection>("family");
  const [screen, setScreen] = useState<Screen>("home");
  const [cardSetType, setCardSetType] = useState<CardSetType>("animals");
  const [customCards, setCustomCards] = useState<CardData[] | undefined>();
  const [showSettings, setShowSettings] = useState(false);

  const settings = toGameSettings();

  const handleCardSet = (set: CardSetType, _gameSettings: GameSettings, cards?: CardData[]) => {
    setCardSetType(set);
    setCustomCards(set === "custom" ? cards : undefined);
    setScreen("game");
  };

  const goHome = () => {
    setScreen("home");
    setCustomCards(undefined);
  };

  const handleSelect = (section: SidebarSection) => {
    setTab(section);
    setScreen("home");
    setCustomCards(undefined);
  };

  const inGame = tab === "memory" && screen === "game";

  return (
    <SidebarProvider defaultOpen={false}>
      <div
        className={`flex min-h-screen w-full ${cloudSettings.animationsEnabled === false ? "no-animations" : ""}`}
        style={{ background: 'inherit' }}
        dir="rtl"
      >
        {!inGame && <AppSidebar active={tab} onSelect={handleSelect} />}

        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar with sidebar trigger + settings (hidden during active memory game) */}
          {!inGame && (
            <div className="fixed top-[max(0.5rem,env(safe-area-inset-top))] right-[max(0.5rem,env(safe-area-inset-right))] z-[90] flex items-center gap-1">
              <SidebarTrigger className="w-7 h-7 text-foreground/60 hover:text-foreground" />
              <button
                onClick={() => setShowSettings(true)}
                className="w-6 h-6 rounded-full flex items-center justify-center transition-all active:scale-90 text-foreground/40 hover:text-foreground/70"
                title="הגדרות"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex-1">
            {tab === "memory" && screen === "game" ? (
              <GameBoard theme="girl" settings={settings} cardSetType={cardSetType} customCards={customCards} onHome={goHome} onSettingsOpen={() => setShowSettings(true)} />
            ) : tab === "memory" ? (
              <CardSetSelect
                onSelectSet={handleCardSet}
                settingsOpen={showSettings}
                onSettingsToggle={setShowSettings}
              />
            ) : tab === "train" ? (
              <TrainGame onHome={() => handleSelect("memory")} />
            ) : tab === "treasure" ? (
              <TreasureHuntGame onHome={() => handleSelect("memory")} />
            ) : tab === "birthdays" ? (
              <div className="p-4 pt-14 max-w-6xl mx-auto">
                <BirthdayManager theme="girl" />
              </div>
            ) : (
              <FamilyHome />
            )}
          </div>
        </div>

        {/* Settings panel — always available */}
        <CardSetSelect
          onSelectSet={handleCardSet}
          settingsOpen={showSettings}
          onSettingsToggle={setShowSettings}
          settingsOnly={tab !== "memory" || screen !== "home"}
        />
      </div>
    </SidebarProvider>
  );
};

export default Index;
