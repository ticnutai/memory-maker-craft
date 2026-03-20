import { useState } from "react";
import ThemeSelect from "@/components/ThemeSelect";
import CardSetSelect from "@/components/CardSetSelect";
import GameBoard from "@/components/GameBoard";
import { ThemeType, CardSetType, CardData, GameSettings } from "@/lib/gameData";

type Screen = "theme" | "cardSet" | "game";

const Index = () => {
  const [screen, setScreen] = useState<Screen>("theme");
  const [theme, setTheme] = useState<ThemeType>("girl");
  const [cardSetType, setCardSetType] = useState<CardSetType>("animals");
  const [customCards, setCustomCards] = useState<CardData[] | undefined>();
  const [settings, setSettings] = useState<GameSettings>({
    pairCount: 4,
    cardMaxW: 480,
    emojiScale: 1,
    soundEnabled: true,
    flipDuration: 1,
    musicType: "none",
  });

  const handleTheme = (t: ThemeType) => {
    setTheme(t);
    setScreen("cardSet");
  };

  const handleCardSet = (set: CardSetType, gameSettings: GameSettings, cards?: CardData[]) => {
    setSettings(gameSettings);
    setCardSetType(set);
    setCustomCards(set === "custom" ? cards : undefined);
    setScreen("game");
  };

  const goHome = () => {
    setScreen("theme");
    setCustomCards(undefined);
  };

  if (screen === "theme") return <ThemeSelect onSelect={handleTheme} />;
  if (screen === "cardSet")
    return <CardSetSelect theme={theme} onSelectSet={handleCardSet} onBack={() => setScreen("theme")} />;
  return <GameBoard theme={theme} settings={settings} cardSetType={cardSetType} customCards={customCards} onHome={goHome} />;
};

export default Index;