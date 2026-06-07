"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

type RadarDatum = {
  name: string;
  value: number;
};

export function ReportRadar({ data }: { data: RadarDatum[] }) {
  return (
    <div className="relative h-44 w-44 rounded-full border border-[var(--line)] bg-[radial-gradient(circle,rgba(198,154,91,.2)_0_2px,transparent_3px)]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="68%">
          <PolarGrid stroke="rgba(36,22,16,.18)" />
          <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: "#725247" }} />
          <Radar
            dataKey="value"
            stroke="#9c6048"
            fill="#9c6048"
            fillOpacity={0.28}
          />
        </RadarChart>
      </ResponsiveContainer>
      <div className="sans absolute right-0 top-0 grid h-7 w-7 place-items-center rounded-full border border-clay bg-soft text-sm text-clay">
        ?
      </div>
    </div>
  );
}
