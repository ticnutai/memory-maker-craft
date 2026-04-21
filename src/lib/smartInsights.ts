export type SmartPriority = "high" | "medium" | "low";

export interface SmartRecommendation {
  id: string;
  title: string;
  description: string;
  priority: SmartPriority;
}

export interface SmartHomeSnapshot {
  collageCount: number;
  photoCount: number;
  birthdayCount: number;
  eventCount: number;
  hasHomeCollage: boolean;
  slideshowEnabled: boolean;
  reducedMotionEnabled: boolean;
  richAnimationsEnabled: boolean;
}

export interface SmartHomeAnalysis {
  score: number;
  recommendations: SmartRecommendation[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function analyzeSmartHome(snapshot: SmartHomeSnapshot): SmartHomeAnalysis {
  let score = 100;
  const recommendations: SmartRecommendation[] = [];

  if (!snapshot.hasHomeCollage) {
    score -= 20;
    recommendations.push({
      id: "set-home-collage",
      title: "לקבוע קולאז׳ בית קבוע",
      description: "בחירה בקולאז׳ בית מייצרת נקודת פתיחה אחידה לכל המשפחה.",
      priority: "high",
    });
  }

  if (snapshot.collageCount < 3) {
    score -= 10;
    recommendations.push({
      id: "more-collages",
      title: "להוסיף עוד קולאז׳ים לפי נושאים",
      description: "מומלץ לבנות לפחות 3 אלבומים: משפחה, אירועים וחגים.",
      priority: "medium",
    });
  }

  if (snapshot.photoCount < 12) {
    score -= 15;
    recommendations.push({
      id: "more-photos",
      title: "להעשיר את דף הבית בתמונות",
      description: "נפח מינימלי של 12 מדיות יוצר חוויית בית חיה ומגוונת.",
      priority: "high",
    });
  }

  if (snapshot.birthdayCount + snapshot.eventCount < 5) {
    score -= 10;
    recommendations.push({
      id: "add-events",
      title: "להוסיף עוד אירועים משפחתיים",
      description: "יותר אירועים משפרים את הערך של התזכורות והאנימציות בעמוד הבית.",
      priority: "medium",
    });
  }

  if (!snapshot.slideshowEnabled && snapshot.photoCount >= 6) {
    score -= 5;
    recommendations.push({
      id: "enable-slideshow",
      title: "להפעיל סליידשואו אוטומטי",
      description: "כשיש מספיק מדיה, סליידשואו נותן תחושת תנועה וחיים למסך הבית.",
      priority: "low",
    });
  }

  if (snapshot.richAnimationsEnabled && snapshot.reducedMotionEnabled) {
    score -= 8;
    recommendations.push({
      id: "motion-conflict",
      title: "לאזן אנימציות מול נגישות",
      description: "זוהה שילוב של אנימציות עשירות עם מצב תנועה מופחתת; מומלץ לבחור פרופיל אחד.",
      priority: "medium",
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: "great-shape",
      title: "הבית המשפחתי במצב מצוין",
      description: "הכול מאוזן. אפשר להתקדם לשדרוגים מתקדמים כמו אוטומציית תזכורות ושיתופי וידאו.",
      priority: "low",
    });
  }

  return {
    score: clamp(Math.round(score), 0, 100),
    recommendations,
  };
}
