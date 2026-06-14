import Link from "next/link";
import { KnowledgeDayGrid } from "@/components/KnowledgeDayGrid";
import { readRootMarkdown } from "@/lib/markdown";
import { getScheduleDays } from "@/lib/schedule";

export default function KnowledgePage() {
  const blocks = readRootMarkdown("成她-知识库页.md").filter((block) => block.type !== "heading" || block.level <= 2);
  const introBlocks = blocks.slice(0, 18);
  const previewDays = getScheduleDays().map((day) => ({
    day: day.day,
    note: `${day.dimension || "全维度"} · ${day.bodyNote || "测评日"} · ${day.mysteryCard || "神秘卡待定"}`,
    status: day.day <= 7 ? "已上线" : "排期已定",
    title: day.title,
  }));

  return (
    <main className="viewport">
      <section className="paper-frame relative grid min-h-[calc(100vh-28px)] grid-rows-[auto_1fr] overflow-auto">
        <Link
          aria-label="回到我的匣子"
          className="absolute right-5 top-5 z-10 grid h-9 w-9 place-items-center border border-[var(--line)] bg-soft/75 sans text-xl leading-none text-ink transition hover:bg-ink hover:text-soft"
          href="/treasure"
        >
          ×
        </Link>
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
          <aside className="group grid content-start gap-3 sans text-xs text-[var(--muted)]">
            <span className="pill">觉醒期 · Day 1-25</span>
            <div className="thin-panel p-4 leading-relaxed opacity-0 transition-opacity group-hover:opacity-100">
              Day 1-7 已按终版内容展示。Day 8-100 已按完整排期表显示主题、身体小语和神秘卡。
            </div>
          </aside>
          <KnowledgeDayGrid days={previewDays} />
        </section>
      </section>
    </main>
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
