// Family quotes — built-in pool + user-added custom quotes
// Used by FamilyHome footer to rotate inspirational sayings about family.

export interface FamilyQuote {
  id: string;
  text: string;
  emoji?: string;
}

// Built-in pool — meaningful Hebrew quotes about family
export const BUILTIN_FAMILY_QUOTES: FamilyQuote[] = [
  { id: "b1",  text: "המשפחה היא הכל",                                              emoji: "💖" },
  { id: "b2",  text: "הבית הוא איפה שהלב נמצא",                                       emoji: "🏠" },
  { id: "b3",  text: "במשפחה אהבה לא מתחלקת, היא מוכפלת",                             emoji: "✨" },
  { id: "b4",  text: "ביחד אנחנו חזקים יותר",                                         emoji: "💪" },
  { id: "b5",  text: "המשפחה היא חוף מבטחים בכל סערה",                                emoji: "⚓" },
  { id: "b6",  text: "אין דבר חשוב יותר ממשפחה",                                      emoji: "🌟" },
  { id: "b7",  text: "בני משפחה הם המתנות הכי יקרות בחיים",                             emoji: "🎁" },
  { id: "b8",  text: "האהבה במשפחה היא נצח",                                          emoji: "♾️" },
  { id: "b9",  text: "הזיכרונות הכי יפים נוצרים סביב שולחן המשפחה",                       emoji: "🍽️" },
  { id: "b10", text: "ילדים הם הברכה הגדולה ביותר",                                     emoji: "👶" },
  { id: "b11", text: "הצחוק של ילדים הוא המוסיקה הכי יפה בבית",                          emoji: "😊" },
  { id: "b12", text: "סבא וסבתא — אהבה בלי גבולות",                                    emoji: "👵" },
  { id: "b13", text: "אחים ואחיות — חברים לכל החיים",                                   emoji: "🤝" },
  { id: "b14", text: "המשפחה היא העוגן של הלב",                                        emoji: "💝" },
  { id: "b15", text: "כל רגע ביחד הוא אוצר לנצח",                                       emoji: "💎" },
  { id: "b16", text: "הזיכרונות שאנחנו יוצרים יחד לעולם לא נשכחים",                       emoji: "📸" },
  { id: "b17", text: "אהבת ההורים היא האהבה הכי טהורה",                                 emoji: "💞" },
  { id: "b18", text: "הבית מתמלא באהבה כשהמשפחה מתאספת",                              emoji: "🫶" },
  { id: "b19", text: "משפחה זה לא רק קשר דם — זה קשר של נפש",                         emoji: "🧡" },
  { id: "b20", text: "החום של הבית מתחיל באנשים שבתוכו",                                emoji: "🔥" },
  { id: "b21", text: "המשפחה היא המקום שבו תמיד מקבלים אותך כמו שאתה",                    emoji: "🤗" },
  { id: "b22", text: "כשהמשפחה ביחד — שום דבר לא חסר",                                 emoji: "🌈" },
  { id: "b23", text: "האושר אמיתי כשמשתפים אותו עם המשפחה",                            emoji: "🥰" },
  { id: "b24", text: "אמא ואבא הם המלאכים הראשונים של הילד",                            emoji: "👼" },
  { id: "b25", text: "הקשר המשפחתי חזק יותר מכל גבול",                                  emoji: "🌍" },
  { id: "b26", text: "במשפחה לומדים את השיעור הכי חשוב — לאהוב",                       emoji: "❤️" },
  { id: "b27", text: "כל חיוך של ילד מאיר את הבית",                                     emoji: "🌞" },
  { id: "b28", text: "המשפחה היא הסיפור הכי יפה שלנו",                                   emoji: "📖" },
  { id: "b29", text: "ארוחת ערב משפחתית שווה יותר מכל או