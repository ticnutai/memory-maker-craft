import { useState } from "react";
import CardSetSelect from "@/components/CardSetSelect";
import GameBoard from "@/components/GameBoard";
import TreasureHuntGame from "@/components/TreasureHuntGame";
import TrainGame from "@/components/TrainGame";
import FamilyHome from "@/components/family/FamilyHome";
import BirthdayManager from "@/components/BirthdayManager";
import AppSidebar, { SidebarSection } from "@/components/AppSidebar";
import { CardSetType, CardData, GameSettings } from "@/lib/gameData";
import { useCloudSettings } from "@/hooks/useCloudSettings";

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
    <div
      className={`flex min-h-screen w-full ${cloudSettings.animationsEnabled === false ? "no-animations" : ""}`}
      style={{ background: 'inherit' }}
      dir="rtl"
    >
      {!inGame && (
        <AppSidebar
          active={tab}
          onSelect={handleSelect}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
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
