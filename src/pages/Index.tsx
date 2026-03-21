import { useState } from "react";
import CardSetSelect from "@/components/CardSetSelect";
import GameBoard from "@/components/GameBoard";
import { CardSetType, CardData, GameSettings } from "@/lib/gameData";

type Screen = "cardSet" | "game";

const Index = () => {
  const [screen, setScreen] = useState<Screen>("cardSet");
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
    setScreen("cardSet");
    setCustomCards(undefined);
  };

  if (screen === "cardSet")
    return <CardSetSelect onSelectSet={handleCardSet} />;
  return <GameBoard theme="girl" settings={settings} cardSetType={cardSetType} customCards={customCards} onHome={goHome} />;
};

export default Index;
