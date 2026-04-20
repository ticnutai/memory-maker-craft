import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, addYears, isBefore, parseISO, format } from "date-fns";
import { he } from "date-fns/locale";

interface UpcomingBirthday {
  name: string;
  emoji: string;
  color: string;
  daysUntil: number;
  date: Date;
}

function getDeviceId(): string {
  const key = "memory-game-device-id";
  return localStorage.getItem(key) ?? "";
}

function getNextBirthday(birthDate: string): { date: Date; daysUntil: number } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bd = parseISO(birthDate);
  let next = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
  if (isBefore(next, today) && differenceInDays(today, next) > 0) {
    next = addYears(next, 1);
  }
  return { date: next, daysUntil: differenceInDays(next, today) };
}

export default function BirthdayHearts({ isDark }: { isDark?: boolean }) {
  const [upcoming, setUpcoming] = useState<UpcomingBirthday[]>([]);

  useEffect(() => {
    const deviceId = getDeviceId();
    if (!deviceId) return;
    (async () => {
      const { data } = await supabase
        .from("birthdays")
        .select("name, birth_date, emoji, color")
        .eq("device_id", deviceId);
      if (!data) return;

      const now = new Date();
      const currentMonth = now.getMonth();

      const thisMonth: UpcomingBirthday[] = [];
      for (const b of data) {
        const { date, daysUntil } = getNextBirthday(b.birth_date);
        // Show birthdays this month (or within 30 days)
        if (date.getMonth() === currentMonth || daysUntil <= 30) {
          thisMonth.push({
            name: b.name,
            emoji: b.emoji ?? "🎂",
            color: b.color ?? "#f472b6",
            daysUntil,
            date,
          });
        }
      }
      thisMonth.sort((a, b) => a.daysUntil - b.daysUntil);
      setUpcoming(thisMonth);
    })();
  }, []);

  if (upcoming.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center gap-3 mb-6">
      {upcoming.map((b, i) => (
        <div
          key={i}
          className="relative group animate-float"
          style={{ animationDelay: `${i * 0.3}s` }}
        >
          {/* Heart shape */}
          <div
            className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center cursor-default transition-transform hover:scale-110"
            style={{ filter: `drop-shadow(0 4px 12px ${b.color}50)` }}
          >
            {/* SVG heart */}
            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 w-full h-full"
            >
              <path
                d="M50 88 C25 65 5 50 5 30 C5 15 15 5 30 5 C38 5 45 10 50 18 C55 10 62 5 70 5 C85 5 95 15 95 30 C95 50 75 65 50 88Z"
                fill={b.color}
                opacity="0.85"
              />
              <path
                d="M50 88 C25 65 5 50 5 30 C5 15 15 5 30 5 C38 5 45 10 50 18 C55 10 62 5 70 5 C85 5 95 15 95 30 C95 50 75 65 50 88Z"
                fill="none"
                stroke="white"
                strokeWidth="1.5"
                opacity="0.3"
              />
            </svg>

            {/* Content inside heart */}
            <div className="relative z-10 text-center pt-1">
              <div className="text-lg sm:text-xl leading-none">{b.emoji}</div>
              <div className="text-[9px] sm:text-[10px] font-bold text-white leading-tight mt-0.5 max-w-[50px] truncate">
                {b.name}
              </div>
            </div>
          </div>

          {/* Tooltip on hover */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
            <div
              className={`text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full shadow-lg backdrop-blur-sm ${
                isDark ? "bg-white/20 text-white" : "bg-white/90 text-foreground"
              }`}
            >
              {b.daysUntil === 0
                ? "🎉 היום יום הולדת!"
                : b.daysUntil === 1
                  ? "🎈 מחר יום הולדת!"
                  : `🎂 עוד ${b.daysUntil} ימים · ${format(b.date, "d בMMMM", { locale: he })}`}
            </div>
          </div>

          {/* "Today" / days badge */}
          <div
            className="absolute -top-1 -right-1 text-[9px] font-black rounded-full px-1.5 py-0.5 shadow-md"
            style={{
              background: b.daysUntil === 0 ? "#fbbf24" : isDark ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.9)",
              color: b.daysUntil === 0 ? "#000" : isDark ? "#fff" : "#333",
            }}
          >
            {b.daysUntil === 0 ? "🎉" : b.daysUntil <= 7 ? `${b.daysUntil}d` : `${b.daysUntil}`}
          </div>
        </div>
      ))}
    </div>
  );
}
