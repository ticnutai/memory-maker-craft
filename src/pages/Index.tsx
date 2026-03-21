import { useState } from "react";
import CardSetSelect from "@/components/CardSetSelect";
import GameBoard from "@/components/GameBoard";
import TreasureHuntGame from "@/components/TreasureHuntGame";
import { CardSetType, CardData, GameSettings } from "@/lib/gameData";
import { Gamepad2, Map, Settings } from "lucide-react";

type AppTab = "memory" | "treasure";
type Screen = "home" | "game";

const Index = () => {
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
    <div className="flex flex-col min-h-screen" style={{ background: 'inherit' }}>
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
        ) : (
          <TreasureHuntGame onHome={() => setTab("memory")} />
        )}
      </div>

      {/* Global Settings FAB — always visible */}
      <button
        onClick={() => setShowSettings(true)}
        className="fixed bottom-6 right-4 z-40 w-12 h-12 rounded-full bg-game-pink text-primary-foreground shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
      >
        <Settings className="w-6 h-6" />
      </button>

      {/* Bottom tab icons — floating, no bar */}
      <div className="fixed bottom-6 left-4 z-50 flex items-center gap-3" dir="rtl">
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
