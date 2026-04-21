import { useState } from "react";
import CardSetSelect from "@/components/CardSetSelect";
import GameBoard from "@/components/GameBoard";
import TreasureHuntGame from "@/components/TreasureHuntGame";
import TrainGame from "@/components/TrainGame";
import FamilyHome from "@/components/family/FamilyHome";
import FamilyAlbums from "@/components/family/FamilyAlbums";
import BirthdayManager from "@/components/BirthdayManager";
import AppSidebar, { SidebarSection } from "@/components/AppSidebar";
import HomeNav from "@/components/HomeNav";
import { CardSetType, CardData, GameSettings } from "@/lib/gameData";
import { useCloudSettings } from "@/hooks/useCloudSettings";
import { useFamily } from "@/hooks/useFamily";

type Screen = "home" | "game";

const Index = () => {
  const { familyDeviceIds } = useFamily();
  const { settings: cloudSettings, toGameSettings } = useCloudSettings("girl");
  const [tab, setTab] = useState<SidebarSection>("family");
  const [screen, setScreen] = useState<Screen>("home");
  const [cardSetType, setCardSetType] = useState<CardSetType>("animals");
  const [customCards, setCustomCards] = useState<CardData[] | undefined>();
  const [showSettings, setShowSettings] = useState(false);
  const [openFamilyCode, setOpenFamilyCode] = useState(false);
  const [openThemePicker, setOpenThemePicker] = useState(false);

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
        <>
          <HomeNav
            active={tab}
            onSelect={handleSelect}
            onOpenThemePicker={() => setOpenThemePicker(true)}
          />
          <AppSidebar
            active={tab}
            onSelect={handleSelect}
            onOpenSettings={() => setShowSettings(true)}
            onOpenFamilyCode={() => setOpenFamilyCode(true)}
            onOpenThemePicker={() => setOpenThemePicker(true)}
          />
        </>
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
        ) : tab === "albums" ? (
          <FamilyAlbums />
        ) : tab === "birthdays" ? (
          <div className="w-full px-4 sm:px-6 lg:px-8 pt-14 pb-8">
            <BirthdayManager theme="girl" familyDeviceIds={familyDeviceIds} />
          </div>
        ) : (
          <FamilyHome
            externalFamilyCodeOpen={openFamilyCode}
            onFamilyCodeOpenChange={setOpenFamilyCode}
            externalThemePickerOpen={openThemePicker}
            onThemePickerOpenChange={setOpenThemePicker}
          />
        )}
      </div>

      {/* Settings panel — only when not already showing CardSetSelect */}
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
