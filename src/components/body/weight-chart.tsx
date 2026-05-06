"use client";

import type { BodyLogEntry } from "@/types";

interface WeightChartProps {
  entries: BodyLogEntry[];
}

export default function WeightChart({ entries }: WeightChartProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
        <p className="text-center text-sm text-gray-500">
          No weight data yet
        </p>
      </div>
    );
  }

  const sorted = [...entries]
    .filter((e) => e.weight_lbs > 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length === 0) return null;

  const weights = sorted.map((e) => e.weight_lbs);
  const minW = Math.min(...weights) - 2;
  const maxW = Math.max(...weights) + 2;
  const range = maxW - minW || 1;

  const width = 400;
  const height = 150;
  const padding = 30;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;

  const points = sorted.map((e, i) => {
    const x = padding + (i / Math.max(sorted.length - 1, 1)) * chartW;
    const y =
      padding + chartH - ((e.weight_lbs - minW) / range) * chartH;
    return { x, y, entry: e };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <h3 className="mb-2 text-sm font-medium text-gray-400">Weight Trend</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const y = padding + chartH * (1 - pct);
          const val = (minW + range * pct).toFixed(0);
          return (
            <g key={pct}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#374151"
                strokeWidth="0.5"
              />
              <text
                x={padding - 5}
                y={y + 3}
                textAnchor="end"
                fill="#6b7280"
                fontSize="8"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Line */}
        <path d={linePath} fill="none" stroke="#a855f7" strokeWidth="2" />

        {/* Points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#a855f7" />
        ))}

        {/* Date labels (first and last) */}
        {sorted.length > 0 && (
          <>
            <text
              x={padding}
              y={height - 5}
              fill="#6b7280"
              fontSize="7"
              textAnchor="start"
            >
              {sorted[0].date}
            </text>
            <text
              x={width - padding}
              y={height - 5}
              fill="#6b7280"
              fontSize="7"
              textAnchor="end"
            >
              {sorted[sorted.length - 1].date}
            </text>
          </>
        )}
      </svg>
      <div className="mt-2 flex justify-between text-xs text-gray-400">
        <span>
          Latest: {sorted[sorted.length - 1].weight_lbs} lbs
        </span>
        {sorted.length > 1 && (
          <span>
            Change:{" "}
            {(
              sorted[sorted.length - 1].weight_lbs - sorted[0].weight_lbs
            ).toFixed(1)}{" "}
            lbs
          </span>
        )}
      </div>
    </div>
  );
}
