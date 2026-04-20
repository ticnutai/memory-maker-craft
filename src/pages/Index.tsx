import { useState } from "react";
import CardSetSelect from "@/components/CardSetSelect";
import GameBoard from "@/components/GameBoard";
import TreasureHuntGame from "@/components/TreasureHuntGame";
import TrainGame from "@/components/TrainGame";
import FamilyHome from "@/components/family/FamilyHome";
import { CardSetType, CardData, GameSettings } from "@/lib/gameData";
import { useCloudSettings } from "@/hooks/useCloudSettings";
import { Gamepad2, Map, Train, Settings, Home } from "lucide-react";

type AppTab = "memory" | "treasure" | "train" | "family";
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
          <GameBoard theme="girl" settings={settings} cardSetType={cardSetType} customCards={customCards} onHome={goHome} onSettingsOpen={() => setShowSettings(true)} />
        ) : tab === "memory" ? (
          <CardSetSelect
            onSelectSet={handleCardSet}
            settingsOpen={showSettings}
            onSettingsToggle={setShowSettings}
          />
        ) : tab === "train" ? (
          <TrainGame onHome={() => setTab("memory")} />
        ) : tab === "family" ? (
          <FamilyHome />
        ) : (
          <TreasureHuntGame onHome={() => setTab("memory")} />
        )}
      </div>

      {/* Top-left nav icons — only show when NOT in game screen (GameBoard has its own header) */}
      {!(tab === "memory" && screen === "game") && (
        <div className="fixed top-[max(0.5rem,env(safe-area-inset-top))] left-[max(0.5rem,env(safe-area-inset-left))] z-[90] flex items-center gap-1">
          <button
            onClick={() => setShowSettings(true)}
            className="w-6 h-6 rounded-full flex items-center justify-center transition-all active:scale-90 text-foreground/40 hover:text-foreground/70"
            title="הגדרות"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { setTab("memory"); setScreen("home"); }}
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all active:scale-90 ${
              tab === "memory" ? "text-game-pink" : "text-foreground/40 hover:text-foreground/70"
            }`}
            title="זיכרון"
          >
            <Gamepad2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { setTab("train"); setScreen("home"); }}
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all active:scale-90 ${
              tab === "train" ? "text-game-pink" : "text-foreground/40 hover:text-foreground/70"
            }`}
            title="רכבת"
          >
            <Train className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { setTab("treasure"); setScreen("home"); }}
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all active:scale-90 ${
              tab === "treasure" ? "text-game-pink" : "text-foreground/40 hover:text-foreground/70"
            }`}
            title="מטמון"
          >
            <Map className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Settings panel — always available */}
      <CardSetSelect
        onSelectSet={handleCardSet}
        settingsOpen={showSettings}
        onSettingsToggle={setShowSettings}
        settingsOnly={tab !== "memory" || screen !== "home"}
      />
    </div>
  );
};

export default Index;
