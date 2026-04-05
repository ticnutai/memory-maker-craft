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

      {/* Top-left nav icons — no background, directly on page */}
      <div className="fixed top-[max(0.75rem,env(safe-area-inset-top))] left-[max(0.75rem,env(safe-area-inset-left))] z-50 flex items-center gap-2">
        <button
          onClick={() => setShowSettings(true)}
          className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 text-foreground/50 hover:text-foreground/80"
        >
          <Settings className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setTab("train"); setScreen("home"); }}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 ${
            tab === "train" ? "text-game-pink" : "text-foreground/50 hover:text-foreground/80"
          }`}
        >
          <Train className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setTab("treasure"); setScreen("home"); }}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 ${
            tab === "treasure" ? "text-game-pink" : "text-foreground/50 hover:text-foreground/80"
          }`}
        >
          <Map className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setTab("memory"); setScreen("home"); }}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 ${
            tab === "memory" ? "text-game-pink" : "text-foreground/50 hover:text-foreground/80"
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
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
