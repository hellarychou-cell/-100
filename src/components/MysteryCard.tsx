"use client";

import { useState } from "react";

type MysteryCardProps = {
  front: {
    name: string;
    description: string;
    age?: string;
    quote: string;
  };
  back: {
    type: "tool" | "blank" | "gratitude" | "benefit" | string;
    title: string;
    content: string;
    dayNum?: number;
  };
  small?: boolean;
};

export function MysteryCard({ front, back, small = false }: MysteryCardProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className={`relative perspective-1000 ${small ? "w-36" : "w-full"}`}
      onClick={() => setFlipped(!flipped)}
    >
      <div
        className={`relative w-full aspect-[3/4.25] cursor-pointer transition-transform duration-500 transform-style-preserve-3d ${
          flipped ? "rotate-y-180" : ""
        }`}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* 正面 */}
        <div
          className="absolute inset-0 grid aspect-[3/4.25] grid-rows-[auto_1fr_auto] border border-gold/70 bg-gradient-to-br from-[#25140f] via-[#744531] to-gold text-paper shadow-2xl backface-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          <small className={`${small ? "p-2" : "p-3"} sans text-[10px] uppercase tracking-[0.14em] text-paper/75`}>
            📿 {front.name} · {front.age}
          </small>
          <div className="m-auto grid place-items-center">
            <div className={small ? "text-2xl" : "text-4xl"}>她</div>
          </div>
          <div className={`${small ? "p-3" : "p-4"} text-center`}>
            <p className={`${small ? "text-[11px]" : "text-sm"} leading-relaxed text-paper/90`}>“{front.quote}”</p>
            <p className="mt-2 text-xs text-paper/60">—— {front.name}</p>
          </div>
        </div>

        {/* 背面 */}
        <div
          className="absolute inset-0 grid aspect-[3/4.25] grid-rows-[auto_1fr] cursor-pointer border border-clay/50 bg-[#f7ead8] text-[#563a2e] shadow-xl backface-hidden"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className={`${small ? "p-2" : "p-3"} sans text-xs uppercase tracking-wider text-clay/60`}>
            {back.type === "tool" ? "工具卡" : back.type === "blank" ? "空白卡" : back.type === "gratitude" ? "感恩卡" : back.type === "benefit" ? "福利卡" : "背面"}
          </div>
          <div className={`grid content-center gap-3 ${small ? "p-3" : "p-5"} text-center`}>
            <strong className={`${small ? "text-sm" : "text-lg"} font-normal`}>{back.title}</strong>
            <p className={`${small ? "text-[11px]" : "text-base"} leading-relaxed`}>“{back.content}”</p>
            {back.dayNum && (
              <small className="sans text-xs text-clay/60">—— Day {back.dayNum}</small>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 静态展示组件（无翻转）
export function MysteryCardStatic({
  card,
  small = false,
}: {
  card: { front: MysteryCardProps["front"]; back?: MysteryCardProps["back"]; dayNum?: number };
  small?: boolean;
}) {
  return (
    <div
      className={`grid aspect-[3/4.25] grid-rows-[auto_1fr_auto] border border-gold/70 bg-gradient-to-br from-[#25140f] via-[#744531] to-gold text-paper shadow-2xl ${
        small ? "w-36 p-3" : "w-full p-4"
      }`}
    >
      <small className="sans text-[10px] uppercase tracking-[0.14em] text-paper/75">
        Tap to draw
      </small>
      <div
        className={`m-auto grid rounded-full border border-paper/60 place-items-center ${
          small ? "h-16 w-16 text-2xl" : "h-20 w-20 text-3xl"
        }`}
      >
        📿
      </div>
      <div>
        <strong className={`block font-normal ${small ? "text-base" : "text-xl"}`}>{card.front.name}</strong>
        <p className={`m-0 text-paper/85 ${small ? "text-[10px]" : "text-xs"}`}>
          {card.front.quote}
        </p>
      </div>
    </div>
  );
}
