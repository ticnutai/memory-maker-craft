// Family quotes — built-in pool + user-added custom quotes
// Used by FamilyHome footer to rotate inspirational sayings about family.

export interface FamilyQuote {
  id: string;
  text: string;
  emoji?: string;
}

// Built-in pool — meaningful quotes about family in Hebrew
export const BUILTIN_FAMILY_QUOTES: FamilyQuote[] = [
  { id: "b1",  text: "המשפחה היא הכל",                                          emoji: "💖" },
  { id: "b2",  text: "הבית הוא איפה שהלב נמצא",                                   emoji: "🏠" },
  { id: "b3",  text: "במשפחה — אהבה לא מתחלקת, היא מוכפלת",                       emoji: "✨" },
  { id: "b4",  text: "ביחד אנחנו חזקים יותר",                                     emoji: "💪" },
  { id: "b5",  text: "המשפחה — חוף מבטחים בכל סערה",                              emoji: "⚓" },
  { id: "b6",  text: "אין דבר חשוב יותר ממשפחה",                                  emoji: "🌟" },
  { id: "b7",  text: "בני משפחה הם המתנות הכי יקרות בחיים",                         emoji: "🎁" },
  { id: "b8",  text: "האהבה במשפחה היא נצח",                                      emoji: "♾️" },
  { id: "b9",  text: "הזיכרונות הכי יפים נוצרים סביב שולחן המשפחה",                   emoji: "🍽️" },
  { id: "b10", text: "ילדים הם הברכה הגדולה ביותר",                                 emoji: "👶" },
  { id: "b11", text: "הצחוק של ילדים — המוסיקה הכי יפה בבית",                       emoji: "😊" },
  { id: "b12", text: "סבא וסבתא — אהבה בלי גבולות",                                emoji: "👵" },
  { id: "b13", text: "אחים ואחיות — חברים לכל הח