"use client";

import { readRootMarkdown } from "@/lib/markdown";
import Link from "next/link";

const previewDays = [
  { day: 1, title: "那句“还行吧”", note: "你不是低调，是把“我做到了”藏太久" },
  { day: 2, title: "你不是不会拒绝", note: "你是用“我有用”抵押“我被爱”" },
  { day: 3, title: "妈妈又打来电话了", note: "父母的情绪不是你的责任" },
  { day: 4, title: "同学群里的一张照片", note: "你不是嫉妒，是替你妈再骂自己一遍" },
  { day: 5, title: "老公那句“你不要这么累”", note: "你不是贤妻，是 3 代女人在交保护费" },
  { day: 6, title: "周一早上 6 点的闹钟", note: "你不是自律，是不敢停" },
  { day: 7, title: "那 2 分", note: "你不是不够好，是在等永远不会来的“够了”" },
  ...Array.from({ length: 18 }, (_, index) => {
    const day = index + 8;
    const week =
      day <= 14 ? "我的“性格”不是我" : day <= 21 ? "在生活里抓现行" : "Day 25 第一次大测评";
    return { day, title: week, note: "内容筹备中，正式上线前以终版文档为准" };
  }),
];

export default function KnowledgeOverlay() {
  const blocks = readRootMarkdown("成她-知识库页.md").filter(
    (block) => block.type !== "heading" || block.level <= 2,
  );
  const introBlocks = blocks.slice(0, 80);

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
      <section className="relative grid min-h-[calc(100vh-28px)] grid-rows-[auto_1fr]">
        <header className="grid grid-cols-[minmax(260px,.85fr)_minmax(360px,1fr)] gap-8 border-b border-[var(--line)] px-[clamp(20px,4vw,54px)] py-[clamp(28px,5vw,60px)] pr-20 max-lg:grid-cols-1">
          <div>
            <div className="eyebrow mb-4">The first 25 days</div>
            <h1 className="display-title text-[clamp(48px,7vw,104px)]">
              知识库
              <br />
              100天。
            </h1>
          </div>
          <div className="self-end">
            <div className="max-w-2xl overflow-auto pr-3">
              {introBlocks.map((block, index) => {
                if (block.type === "heading") {
                  return (
                    <h2 key={`${block.text}-${index}`} className="mb-3 mt-5 text-3xl font-normal leading-tight first:mt-0">
                      {block.text}
                    </h2>
                  );
                }
                if (block.type === "quote") {
                  return (
                    <p key={`${block.text}-${index}`} className="sans text-sm leading-relaxed text-clay">
                      {block.text}
                    </p>
                  );
                }
                return (
                  <p key={`${block.text}-${index}`} className="text-[clamp(15px,1.55vw,20px)] leading-[1.72] text-[#4f352a]">
                    {block.text}
                  </p>
                );
              })}
            </div>
            <div className="mt-6 grid grid-cols-4 border-y border-[var(--line)] sans text-xs text-[var(--muted)] max-sm:grid-cols-2">
              <Metric value="25" label="首阶段展示" />
              <Metric value="04" label="阶段" />
              <Metric value="07" label="终版上线" />
              <Metric value="100" label="完整旅程" last />
            </div>
          </div>
        </header>

        <section className="grid min-h-0 grid-cols-[220px_1fr] gap-8 px-[clamp(20px,4vw,54px)] py-8 max-lg:grid-cols-1">
          <aside className="grid content-start gap-3 sans text-xs text-[var(--muted)]">
            <span className="pill">觉醒期 · Day 1-25</span>
            <div className="thin-panel p-4 leading-relaxed">
              Day 1-7 已按终版内容展示标题。Day 8-25 先展示阶段主题，正式内容后续再替换。
            </div>
          </aside>
          <div
            className="relative"
            style={{
              maxHeight: "340px",
              overflow: "hidden",
              maskImage: "linear-gradient(to bottom, black 55%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 55%, transparent 100%)",
            }}
          >
            <div className="grid grid-cols-5 gap-2.5 max-xl:grid-cols-4 max-md:grid-cols-3 max-sm:grid-cols-2">
              {previewDays.map((item) => (
                <article
                  key={item.day}
                  className={`relative grid min-h-[118px] content-between border p-3 ${
                    item.day <= 7 ? "border-clay/45 bg-[#f7ead8]" : "border-[var(--line)] bg-soft/48 text-ink/70"
                  }`}
                >
                  <div className="sans text-[10px] uppercase tracking-[0.14em] text-clay">
                    Day {String(item.day).padStart(2, "0")}
                  </div>
                  <div>
                    <h2 className="m-0 text-base font-normal leading-tight">{item.title}</h2>
                    <p className="mt-2 text-[11px] leading-relaxed text-[var(--muted)]">{item.note}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}

function Metric({ value, label, last = false }: { value: string; label: string; last?: boolean }) {
  return (
    <div className={`p-3 ${last ? "" : "border-r border-[var(--line)] max-sm:border-b"}`}>
      <strong className="mb-1 block font-serif text-3xl font-normal leading-none text-ink">{value}</strong>
      {label}
    </div>
  );
}
