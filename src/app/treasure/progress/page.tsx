"use client";

import Link from "next/link";
import { phases } from "@/lib/content";

const PHASE_DESCRIPTIONS: Record<number, string> = {
  1: "看见旧程序。每天一面镜子，帮你看见那些一直在替你做决定的旧声音。100天里，你会遇到林夏的'还行吧'、苏临的姐妹群、你的妈妈和外婆……每一个故事里，都藏着一个你没有仔细听过的自己。",
  2: "追溯来源。从原生家庭、童年编程、家族脚本里找到旧程序的根源。你不是'天生就这样'，你的很多反应是被训练出来的。这一阶段帮你把那个训练过程看清楚。",
  3: "练习新反应。每天一个小练习，让身体重新体验'我可以不一样'。不是想通，是做到。身体记得新的体验，才是真的改变。",
  4: "整合与绽放。把新的反应模式带进事业、关系和日常生活。不是变成另一个人，是终于可以按自己的方式活。",
};

export default function TreasureProgressPage() {
  return (
    <main className="viewport">
      <section className="paper-frame grid min-h-[calc(100vh-28px)] grid-rows-[56px_1fr]">
        <header className="topbar">
          <div className="brand">成她100</div>
          <span>个人进度</span>
          <button
            className="action-ghost !px-3 !py-2 !text-xs"
            onClick={() => window.history.back()}
            type="button"
          >
            返回
          </button>
        </header>
        <section className="grid gap-6 p-[clamp(20px,4vw,48px)]">
          <div>
            <div className="eyebrow mb-3">个人进度 · 100天</div>
            <h1 className="display-title text-[clamp(42px,6vw,80px)]">
              你的
              <br />
              成长地图。
            </h1>
          </div>

          <div className="space-y-3">
            {phases.map((phase) => (
              <details key={phase.id} className="thin-panel group">
                <summary className="flex cursor-pointer list-none items-center justify-between p-5 font-serif text-xl">
                  <div className="flex items-center gap-3">
                    <span className="h-7 w-7 rounded-full border border-clay bg-clay/10 text-center font-sans text-sm text-clay">
                      {phase.id}
                    </span>
                    <div>
                      <strong className="text-xl">{phase.name}</strong>
                      <span className="ml-3 sans text-sm text-[var(--muted)]">{phase.range}</span>
                    </div>
                  </div>
                  <span className="text-clay transition-transform group-open:rotate-180">▾</span>
                </summary>
                <div className="border-t border-[var(--line)] p-5">
                  <p className="leading-[1.85] text-[#563a2e]">
                    {PHASE_DESCRIPTIONS[phase.id]}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
