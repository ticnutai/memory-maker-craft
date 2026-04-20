// Family quotes — built-in pool + user-added custom quotes (localStorage)
export interface FamilyQuote {
  id: string;
  text: string;
  emoji?: string;
}

export const BUILTIN_FAMILY_QUOTES: FamilyQuote[] = [
  { id: "b1",  emoji: "💖", text: "המשפחה היא הכל" },
  { id: "b2",  emoji: "🏠", text: "הבית הוא איפה שהלב נמצא" },
  { id: "b3",  emoji: "✨", text: "במשפחה אהבה לא מתחלקת, היא מוכפלת" },
  { id: "b4",  emoji: "💪", text: "ביחד אנחנו חזקים יותר" },
  { id: "b5",  emoji: "⚓", text: "המשפחה היא חוף מבטחים בכל סערה" },
  { id: "b6",  emoji: "🌟", text: "אין דבר חשוב יותר ממשפחה" },
  { id: "b7",  emoji: "🎁", text: "בני משפחה הם המתנות הכי יקרות בחיים" },
  { id: "b8",  emoji: "♾️", text: "האהבה במשפחה היא נצח" },
  { id: "b9",  emoji: "🍽️", text: "הזיכרונות הכי יפים נוצרים סביב שולחן המשפחה" },
  { id: "b10", emoji: "👶", text: "ילדים הם הברכה הגדולה ביותר" },
  { id: "b11", emoji: "😊", text: "הצחוק של ילדים הוא המוסיקה הכי יפה בבית" },
  { id: "b12", emoji: "👵", text: "סבא וסבתא, אהבה בלי גבולות" },
  { id: "b13", emoji: "🤝", text: "אחים ואחיות, חברים לכל החיים" },
  { id: "b14", emoji: "💝", text: "המשפחה היא העוגן של הלב" },
  { id: "b15", emoji: "💎", text: "כל רגע ביחד
