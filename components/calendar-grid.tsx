"use client";

import { cn } from "@/lib/utils";
import { getDaysInMonth, startOfMonth, getDay, isToday, isSameDay } from "date-fns";

export interface DaySummary {
  income: number;
  expense: number;
  transfer: number;
}

interface CalendarGridProps {
  currentMonth: Date;
  daySummaries: Record<string, DaySummary>;
  selectedDay: Date | null;
  onSelectDay: (day: Date) => void;
}

function formatAmount(amount: number): string {
  if (amount >= 1000) {
    const k = amount / 1000;
    return `₱${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return `₱${amount.toLocaleString()}`;
}

function getDayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const DAY_HEADERS_FULL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_HEADERS_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

export function CalendarGrid({ currentMonth, daySummaries, selectedDay, onSelectDay }: CalendarGridProps) {
  const totalDays = getDaysInMonth(currentMonth);
  const firstDay = startOfMonth(currentMonth);
  const startOffset = getDay(firstDay); // 0=Sun

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) {
    cells.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d));
  }
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-1 sm:mb-1.5">
        {DAY_HEADERS_FULL.map((day, i) => (
          <div key={day} className="text-center text-[10px] sm:text-xs font-semibold text-gray-400 py-1 sm:py-2">
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{DAY_HEADERS_SHORT[i]}</span>
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {cells.map((date, i) => {
          if (!date) {
            return <div key={`empty-${i}`} className="rounded-lg sm:rounded-xl min-h-[48px] sm:min-h-[72px] bg-gray-50/50" />;
          }

          const key = getDayKey(date);
          const summary = daySummaries[key];
          const today = isToday(date);
          const selected = selectedDay ? isSameDay(date, selectedDay) : false;

          return (
            <button
              key={key}
              onClick={() => onSelectDay(date)}
              className={cn(
                "rounded-lg sm:rounded-xl p-1 sm:p-2 min-h-[48px] sm:min-h-[72px] text-left transition-all cursor-pointer border",
                today && !selected && "bg-gray-900 border-gray-900",
                selected && "bg-blue-50 border-2 border-blue-600",
                !today && !selected && "bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm"
              )}
            >
              <div className={cn(
                "font-semibold text-[10px] sm:text-xs mb-0.5 sm:mb-1",
                today && !selected && "text-white",
                selected && "text-blue-600",
                !today && !selected && "text-gray-700"
              )}>
                {date.getDate()}
                {today && selected && (
                  <span className="text-[7px] sm:text-[8px] font-normal text-blue-400 ml-0.5">today</span>
                )}
                {today && !selected && (
                  <span className="text-[7px] sm:text-[8px] font-normal text-gray-400 ml-0.5">today</span>
                )}
              </div>
              {summary && (
                <div className="space-y-0 leading-tight">
                  {summary.income > 0 && (
                    <div className={cn(
                      "text-[7px] sm:text-[9px] leading-relaxed",
                      today && !selected ? "text-green-300" : "text-green-600"
                    )}>
                      +{formatAmount(summary.income)}
                    </div>
                  )}
                  {summary.expense > 0 && (
                    <div className={cn(
                      "text-[7px] sm:text-[9px] leading-relaxed",
                      today && !selected ? "text-red-300" : "text-red-600"
                    )}>
                      -{formatAmount(summary.expense)}
                    </div>
                  )}
                  {summary.transfer > 0 && (
                    <div className={cn(
                      "text-[7px] sm:text-[9px] leading-relaxed",
                      today && !selected ? "text-blue-300" : "text-blue-600"
                    )}>
                      ↔{formatAmount(summary.transfer)}
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { getDayKey };
