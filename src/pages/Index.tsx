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

      {/* Global Settings FAB — always visible */}
      <button
        onClick={() => setShowSettings(true)}
        className="fixed bottom-[max(1.5rem,calc(env(safe-area-inset-bottom)+0.5rem))] right-[max(1rem,calc(env(safe-area-inset-right)+0.5rem))] z-40 w-12 h-12 rounded-full bg-game-pink text-primary-foreground shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
      >
        <Settings className="w-6 h-6" />
      </button>

      {/* Bottom tab icons — floating, no bar */}
      <div className="fixed bottom-[max(1.5rem,calc(env(safe-area-inset-bottom)+0.5rem))] left-[max(1rem,calc(env(safe-area-inset-left)+0.5rem))] z-50 flex items-center gap-3" dir="rtl">
        <button
          onClick={() => { setTab("memory"); setScreen("home"); }}
          className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 ${
            tab === "memory"
              ? "bg-game-pink text-primary-foreground scale-110 shadow-xl"
              : "bg-white/80 backdrop-blur text-muted-foreground hover:bg-white"
          }`}
        >
          <Gamepad2 className="w-5 h-5" />
        </button>
        <button
          onClick={() => { setTab("treasure"); setScreen("home"); }}
          className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 ${
            tab === "treasure"
              ? "bg-game-pink text-primary-foreground scale-110 shadow-xl"
              : "bg-white/80 backdrop-blur text-muted-foreground hover:bg-white"
          }`}
        >
          <Map className="w-5 h-5" />
        </button>
        <button
          onClick={() => { setTab("train"); setScreen("home"); }}
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 ${
            tab === "train"
              ? "bg-game-pink text-primary-foreground scale-110 shadow-xl"
              : "bg-white/80 backdrop-blur text-muted-foreground hover:bg-white"
          }`}
        >
          <Train className="w-4 h-4 sm:w-5 sm:h-5" />
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
