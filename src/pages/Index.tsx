import { useState } from "react";
import CardSetSelect from "@/components/CardSetSelect";
import GameBoard from "@/components/GameBoard";
import TreasureHuntGame from "@/components/TreasureHuntGame";
import TrainGame from "@/components/TrainGame";
import { CardSetType, CardData, GameSettings } from "@/lib/gameData";
import { useCloudSettings } from "@/hooks/useCloudSettings";
import { Gamepad2, Map, Train, Settings } from "lucide-react";

type AppTab = "memory" | "treasure" | "train";
type Screen = "home" | "game";

const Index = () => {
  const { settings: cloudSettings, toGameSettings } = useCloudSettings("girl");
  const [tab, setTab] = useState<AppTab>("memory");
  const [screen, setScreen] = useState<Screen>("home");
  const [cardSetType, setCardSetType] = useState<CardSetType>("animals");
  const [customCards, setCustomCards] = useState<CardData[] | undefined>();
  const [showSettings, setShowSettings] = useState(false);

  // Always use cloud-synced settings — no local duplication
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

  return (
    <div className={`flex flex-col min-h-screen ${cloudSettings.animationsEnabled === false ? "no-animations" : ""}`} style={{ background: 'inherit' }}>
      {/* Main content */}
      <div className="flex-1">
        {tab === "memory" && screen === "game" ? (
          <GameBoard theme="girl" settings={settings} cardSetType={cardSetType} customCards={customCards} onHome={goHome} />
        ) : tab === "memory" ? (
          <CardSetSelect
            onSelectSet={handleCardSet}
            settingsOpen={showSettings}
            onSettingsToggle={setShowSettings}
          />
        ) : tab === "train" ? (
          <TrainGame onHome={() => setTab("memory")} />
        ) : (
          <TreasureHuntGame onHome={() => setTab("memory")} />
        )}
      </div>

      {/* Top navigation bar — compact, elegant */}
      <div className="fixed top-[max(0.5rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 bg-white/90 backdrop-blur-md rounded-full px-2 py-1 shadow-md border border-border/30" dir="rtl">
        <button
          onClick={() => { setTab("memory"); setScreen("home"); }}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 ${
            tab === "memory"
              ? "bg-game-pink text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setTab("treasure"); setScreen("home"); }}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 ${
            tab === "treasure"
              ? "bg-game-pink text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Map className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setTab("train"); setScreen("home"); }}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 ${
            tab === "train"
              ? "bg-game-pink text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Train className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-5 bg-border/40 mx-0.5" />
        <button
          onClick={() => setShowSettings(true)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-all active:scale-90"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Settings panel for non-home pages */}
      {(tab !== "memory" || screen !== "home") && (
        <CardSetSelect
          onSelectSet={handleCardSet}
          settingsOpen={showSettings}
          onSettingsToggle={setShowSettings}
          settingsOnly
        />
      )}
    </div>
  );
};

export default Index;
