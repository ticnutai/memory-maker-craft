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
  const { settings: cloudSettings } = useCloudSettings("girl");
  const [tab, setTab] = useState<AppTab>("memory");
  const [screen, setScreen] = useState<Screen>("home");
  const [cardSetType, setCardSetType] = useState<CardSetType>("animals");
  const [customCards, setCustomCards] = useState<CardData[] | undefined>();
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<GameSettings>({
    pairCount: 4,
    cardMaxW: 480,
    emojiScale: 1,
    soundEnabled: true,
    speechEnabled: true,
    speechRate: 0.9,
    flipDuration: 1,
    musicType: "none",
    cardStyle: {
      borderRadius: 16,
      borderWidth: 4,
      borderColor: "default",
      backColor: "default",
      backColor2: undefined,
      backIcon: "⭐",
      shape: "square",
    },
  });

  const handleCardSet = (set: CardSetType, gameSettings: GameSettings, cards?: CardData[]) => {
    setSettings(gameSettings);
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
        className="fixed bottom-4 sm:bottom-6 right-3 sm:right-4 z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-game-pink text-primary-foreground shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
      >
        <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Bottom tab icons — floating, no bar */}
      <div className="fixed bottom-4 sm:bottom-6 left-3 sm:left-4 z-50 flex items-center gap-2 sm:gap-3" dir="rtl">
        <button
          onClick={() => { setTab("memory"); setScreen("home"); }}
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 ${
            tab === "memory"
              ? "bg-game-pink text-primary-foreground scale-110 shadow-xl"
              : "bg-white/80 backdrop-blur text-muted-foreground hover:bg-white"
          }`}
        >
          <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <button
          onClick={() => { setTab("treasure"); setScreen("home"); }}
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 ${
            tab === "treasure"
              ? "bg-game-pink text-primary-foreground scale-110 shadow-xl"
              : "bg-white/80 backdrop-blur text-muted-foreground hover:bg-white"
          }`}
        >
          <Map className="w-4 h-4 sm:w-5 sm:h-5" />
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
