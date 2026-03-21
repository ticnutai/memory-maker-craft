import { useState } from "react";
import CardSetSelect from "@/components/CardSetSelect";
import GameBoard from "@/components/GameBoard";
import TreasureHuntGame from "@/components/TreasureHuntGame";
import { CardSetType, CardData, GameSettings } from "@/lib/gameData";
import { Gamepad2, Map } from "lucide-react";

type AppTab = "memory" | "treasure";
type Screen = "home" | "game";

const Index = () => {
  const [tab, setTab] = useState<AppTab>("memory");
  const [screen, setScreen] = useState<Screen>("home");
  const [cardSetType, setCardSetType] = useState<CardSetType>("animals");
  const [customCards, setCustomCards] = useState<CardData[] | undefined>();
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

  // If playing a memory game, show GameBoard fullscreen (no tabs)
  if (tab === "memory" && screen === "game") {
    return <GameBoard theme="girl" settings={settings} cardSetType={cardSetType} customCards={customCards} onHome={goHome} />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Main content */}
      <div className="flex-1 pb-16">
        {tab === "memory" && <CardSetSelect onSelectSet={handleCardSet} />}
        {tab === "treasure" && <TreasureHuntGame onHome={() => setTab("memory")} />}
      </div>

      {/* Bottom tab bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-border shadow-lg" dir="rtl">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          <button
            onClick={() => { setTab("memory"); setScreen("home"); }}
            className={`flex flex-col items-center gap-0.5 py-2.5 px-6 transition-all ${
              tab === "memory" ? "text-game-pink scale-105" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Gamepad2 className="w-5 h-5" />
            <span className="text-[11px] font-bold">זיכרון</span>
          </button>
          <button
            onClick={() => { setTab("treasure"); setScreen("home"); }}
            className={`flex flex-col items-center gap-0.5 py-2.5 px-6 transition-all ${
              tab === "treasure" ? "text-game-pink scale-105" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Map className="w-5 h-5" />
            <span className="text-[11px] font-bold">מטמון</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Index;
