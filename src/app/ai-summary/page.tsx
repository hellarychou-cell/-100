import Link from "next/link";
import { AuthGate } from "@/components/AuthGate";
import { currentUser } from "@/lib/content";

const entries = [
  { day: "Day 01", title: "那句“还行吧”", text: "你发现自己习惯把成绩说轻，把辛苦藏起来。" },
  { day: "Day 02", title: "你先别急着变好", text: "对话里反复出现“我应该更快一点”的声音。" },
  { day: "Day 03", title: "你不是不会拒绝", text: "你开始辨认：答应之前，身体会先紧一下。" },
];

export default function AiSummaryPage() {
  return (
    <AuthGate>
    <main className="viewport">
      <section className="paper-frame grid grid-rows-[56px_1fr]">
        <header className="topbar">
          <div className="brand">成她100</div>
          <span>AI 总结</span>
          <Link
            aria-label="回到我的匣子"
            className="grid h-8 w-8 place-items-center border border-[var(--line)] bg-soft/60 text-lg leading-none text-ink transition hover:bg-ink hover:text-soft"
            href="/treasure"
          >
            ×
          </Link>
        </header>
        <section className="grid min-h-0 grid-cols-[minmax(320px,.72fr)_minmax(440px,1fr)] gap-8 p-[clamp(18px,2.8vw,34px)] max-lg:grid-cols-1">
          <div className="grid min-h-0 grid-rows-[auto_1fr_auto] max-lg:block">
            <div>
              <div className="eyebrow mb-3">AI reflection book</div>
              <h1 className="display-title text-[clamp(52px,6.6vw,92px)]">AI 陪你<br />看见的。</h1>
            </div>
            <div className="self-center border-y border-[var(--line)] py-5 max-lg:my-5">
              <small className="sans text-[11px] uppercase tracking-wider text-clay">最近一次洞察</small>
              <p className="mt-3 text-lg leading-[1.85] text-[#563a2e]">
                你不是不想拒绝，而是太习惯在别人失望之前，先替关系补上一块。
              </p>
            </div>
            <div className="grid grid-cols-3 border-y border-[var(--line)]">
              <Metric value={String(currentUser.aiConversations).padStart(2, "0")} label="本月对话" />
              <Metric value="03" label="关联 Day" />
              <Metric value="02" label="高频主题" last />
            </div>
          </div>
          <section className="grid min-h-0 grid-rows-[auto_1fr_auto_auto] gap-4">
            <div className="flex flex-wrap gap-2">
              {["关系边界", "自我价值", "害怕失望", "身体紧张"].map((tag) => (
                <span key={tag} className="pill">{tag}</span>
              ))}
            </div>
            <section className="grid grid-rows-3 gap-3">
              {entries.map((entry) => (
                <div key={entry.day} className="grid grid-cols-[82px_1fr_auto] items-start gap-4 border-t border-[var(--line)] pt-3">
                  <div className="sans text-[11px] uppercase tracking-wider text-clay">{entry.day}</div>
                  <div>
                    <strong className="block text-xl font-normal leading-tight">{entry.title}</strong>
                    <p className="m-0 mt-1 sans text-xs leading-relaxed text-[var(--muted)]">{entry.text}</p>
                  </div>
                  <span className="text-link">查看</span>
                </div>
              ))}
            </section>
            <button className="text-link justify-self-center bg-transparent">展开更多对话摘要</button>
            <section className="thin-panel flex items-center justify-between gap-4 p-4">
              <div>
                <strong className="block text-2xl font-normal">生成本周小结</strong>
                <span className="sans text-xs text-[var(--muted)]">汇总这一周的对话，提炼关键词和下一步提醒。</span>
              </div>
              <button className="action-primary">生成小结</button>
            </section>
          </section>
        </section>
      </section>
    </main>
    </AuthGate>
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
