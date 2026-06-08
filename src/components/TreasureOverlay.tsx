"use client";

import Link from "next/link";
import { currentUser } from "@/lib/content";

const drawers = [
  { title: "测评结果", desc: "底层代码诊断报告、雷达图、推荐起点", href: "/assessment/result", meta: "最近一次测评：主模式 · 讨好型" },
  { title: "知识库", desc: "Day 1-100 内容目录", href: "/knowledge", meta: "当前打开到 Day 03" },
  { title: "神秘卡", desc: "已收集的女性力量卡与今日卡", href: "/cards", meta: "已收集 2 张卡" },
  { title: "AI 总结", desc: "本月对话记录与提炼", href: "/ai-summary", meta: "已开启 4 次对话" },
  { title: "个人进度", desc: "当前 Day，完成状态、成长路线", href: "/treasure/progress", meta: "觉醒期 W1 · 已完成 2 天" },
];

export default function TreasureOverlay() {
  return (
    <div className="fixed inset-0 z-40 overflow-auto bg-paper">
      <button
        aria-label="关闭"
        className="fixed right-5 top-5 z-50 grid h-9 w-9 place-items-center border border-[var(--line)] bg-soft/75 text-xl leading-none text-ink transition hover:bg-ink hover:text-soft"
        onClick={() => window.history.back()}
        type="button"
      >
        ×
      </button>
      <section className="grid min-h-[calc(100vh-28px)] grid-cols-[minmax(320px,.62fr)_minmax(440px,1fr)] gap-9 p-[clamp(20px,3vw,38px)] max-lg:grid-cols-1">
        <div className="grid min-h-0 grid-rows-[auto_1fr_auto] max-lg:block">
          <div>
            <div className="eyebrow mb-3">Private archive</div>
            <h1 className="display-title text-[clamp(54px,7vw,96px)]">
              我的
              <br />
              匣子。
            </h1>
          </div>
          <p className="self-center max-w-md text-[17px] leading-[1.9] text-[#563a2e] max-lg:my-5">
            这里放着你已经看见、收下和慢慢打开的东西。它不是任务清单，是你自己的回收处。
          </p>
          <div className="grid grid-cols-3 border-y border-[var(--line)]">
            <Metric value={String(currentUser.currentDay).padStart(2, "0")} label="当前 Day" />
            <Metric value={String(currentUser.cards).padStart(2, "0")} label="神秘卡" />
            <Metric value={String(currentUser.aiConversations).padStart(2, "0")} label="AI 对话" last />
          </div>
        </div>
        <section className="grid content-center">
          {drawers.map((drawer, index) => (
            <div
              key={drawer.title}
              className="grid min-h-[68px] grid-cols-[46px_1fr_auto] items-center gap-4 border-t border-[var(--line)] bg-paper/40 last:border-b"
            >
              <div className="grid h-8 w-8 place-items-center rounded-full border border-clay sans text-xs text-clay">
                {index + 1}
              </div>
              <div>
                <Link className="block text-2xl font-normal leading-none transition hover:text-clay" href={drawer.href}>
                  {drawer.title}
                </Link>
                <span className="mt-1 block sans text-xs text-[var(--muted)]">{drawer.desc}</span>
              </div>
              <span className="sans text-xs text-[var(--muted)] max-sm:hidden">{drawer.meta}</span>
            </div>
          ))}
        </section>
      </section>
    </div>
  );
}

function Metric({ value, label, last = false }: { value: string; label: string; last?: boolean }) {
  return (
    <div className={`p-4 sans text-xs text-[var(--muted)] ${last ? "" : "border-r border-[var(--line)]"}`}>
      <strong className="mb-1 block font-serif text-3xl font-normal leading-none text-ink">{value}</strong>
      {label}
    </div>
  );
}
