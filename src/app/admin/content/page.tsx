import Link from "next/link";

const cards = [
  { eyebrow: "Day library", title: "Day 内容", value: "7", detail: "Day 1-7 已上线；Day 8-100 待补。当前知识库先开放已完成内容。", status: "最近更新：2026-06-07", action: "进入管理", progress: 7 },
  { eyebrow: "Assessment", title: "测评题库", value: "42", detail: "6 维度 × 7 题。总分公式和维度分按项目手册执行。", status: "状态：已锁定", action: "查看题库", progress: 100 },
  { eyebrow: "Mystery cards", title: "神秘卡", value: "2", detail: "女性力量卡与今日卡内容逐步补充。已配置 Day 1-2 示例。", status: "状态：待补全", action: "进入管理", progress: 2 },
];

export default function AdminContentPage() {
  return (
    <main className="viewport">
      <section className="paper-frame grid grid-rows-[56px_1fr]">
        <header className="topbar">
          <div className="brand">成她100 · 后台</div>
          <span>内容管理</span>
          <Link className="text-link" href="/admin">回到用户列表</Link>
        </header>
        <section className="grid min-h-0 grid-rows-[auto_1fr] gap-5 p-[clamp(18px,2.8vw,34px)]">
          <div className="flex items-end justify-between gap-4 max-sm:grid">
            <h1 className="m-0 text-[46px] font-normal leading-none">内容管理</h1>
            <p className="m-0 max-w-lg text-right sans text-xs leading-relaxed text-[var(--muted)] max-sm:text-left">
              第一版只做状态和入口。具体编辑器后续拆成独立页面，避免后台过重。
            </p>
          </div>
          <section className="grid min-h-0 grid-cols-3 gap-4 max-lg:grid-cols-1">
            {cards.map((card) => (
              <article key={card.title} className="thin-panel grid min-h-0 grid-rows-[auto_1fr_auto] gap-4 p-5">
                <div>
                  <div className="eyebrow mb-2">{card.eyebrow}</div>
                  <h2 className="m-0 text-3xl font-normal leading-none">{card.title}</h2>
                </div>
                <div className="self-center">
                  <div className="text-7xl leading-none">{card.value}</div>
                  <p className="mt-3 sans text-xs leading-relaxed text-[var(--muted)]">{card.detail}</p>
                  <div className="progress-track mt-4">
                    <i className="progress-fill" style={{ width: `${card.progress}%` }} />
                  </div>
                </div>
                <div className="flex justify-between border-t border-[var(--line)] pt-3 sans text-xs text-[var(--muted)]">
                  <span>{card.status}</span>
                  <span className="text-link">{card.action}</span>
                </div>
              </article>
            ))}
          </section>
        </section>
      </section>
    </main>
  );
}
