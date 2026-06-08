"use client";

import { useState } from "react";
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
  const [showTip, setShowTip] = useState(false);

  return (
    <div className="relative h-44 w-44">
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
      <div className="relative">
        <button
          type="button"
          className="sans absolute right-0 top-0 grid h-7 w-7 place-items-center rounded-full border border-clay bg-soft text-sm text-clay"
          onClick={() => setShowTip((v) => !v)}
        >
          ?
        </button>
        {showTip && (
          <div className="absolute left-0 top-9 z-20 w-52 border border-[var(--line)] bg-soft p-3 shadow-xl">
            <p className="m-0 text-xs leading-relaxed text-[#563a2e]">
              这张图显示6个维度的相对强弱。越靠外圈，代表这个旧程序越常被触发；越靠中心，代表这个维度相对稳定，可以作为你的支撑点。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
