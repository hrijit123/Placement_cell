"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS: Record<string, string> = {
  Placed: "#15803d",
  "In Process": "#ca8a04",
  "Not Placed": "#dc2626",
};

export default function PlacementDonut({
  placed,
  inProcess,
  notPlaced,
}: {
  placed: number;
  inProcess: number;
  notPlaced: number;
}) {
  const total = placed + inProcess + notPlaced;
  const data = [
    { name: "Placed", value: placed },
    { name: "In Process", value: inProcess },
    { name: "Not Placed", value: notPlaced },
  ].filter((d) => d.value > 0);

  if (total === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-stone-400 italic text-sm">
        No student data recorded yet.
      </div>
    );
  }

  const pct = (n: number) => (total > 0 ? `${((n / total) * 100).toFixed(1)}%` : "0%");

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-[180px] h-[180px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={85}
              paddingAngle={2}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={COLORS[entry.name]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-serif font-semibold text-stone-900">{placed}</span>
          <span className="text-xs text-stone-500">Placed</span>
        </div>
      </div>
      <ul className="space-y-2 text-sm">
        <li className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full inline-block" style={{ background: COLORS["Placed"] }} />
          <span className="text-stone-600">Placed ({placed})</span>
          <span className="font-semibold text-stone-900 ml-auto pl-4">{pct(placed)}</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full inline-block" style={{ background: COLORS["In Process"] }} />
          <span className="text-stone-600">In Process ({inProcess})</span>
          <span className="font-semibold text-stone-900 ml-auto pl-4">{pct(inProcess)}</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full inline-block" style={{ background: COLORS["Not Placed"] }} />
          <span className="text-stone-600">Not Placed ({notPlaced})</span>
          <span className="font-semibold text-stone-900 ml-auto pl-4">{pct(notPlaced)}</span>
        </li>
      </ul>
    </div>
  );
}
