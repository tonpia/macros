"use client";

interface MacroRingProps {
  label: string;
  current: number;
  goal: number;
  color: string;
  unit?: string;
}

export default function MacroRing({
  label,
  current,
  goal,
  color,
  unit = "",
}: MacroRingProps) {
  const pct = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-20 w-20">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-gray-800"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-white">{current}</span>
        </div>
      </div>
      <span className="text-xs text-gray-400">
        {label} {goal > 0 && `/ ${goal}${unit}`}
      </span>
    </div>
  );
}
