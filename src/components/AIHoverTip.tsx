"use client";

export function AIHoverTip() {
  return (
    <div className="absolute right-0 top-4 group cursor-help">
      <span className="grid h-5 w-5 place-items-center rounded-full border border-clay text-clay text-xs">?</span>
      <div className="absolute right-0 top-7 z-10 w-52 rounded border border-[var(--line)] bg-paper p-3 text-xs leading-relaxed text-[var(--muted)] opacity-0 shadow-lg group-hover:opacity-100 transition-opacity">
        和 AI 对话没有标准答案。每一次开口，都是你和自己的一次靠近。
        <span className="mt-1 block text-[10px] text-clay/60">—— 成她 AI 团队</span>
      </div>
    </div>
  );
}