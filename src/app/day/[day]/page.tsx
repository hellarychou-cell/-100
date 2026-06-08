import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { MysteryCard } from "@/components/MysteryCard";
import { AIHoverTip } from "@/components/AIHoverTip";
import { dayContents } from "@/lib/content";

type PageProps = {
  params: Promise<{ day: string }>;
};

export default async function DayPage({ params }: PageProps) {
  const { day: dayParam } = await params;
  const dayNum = Number(dayParam);
  const day = dayContents.find((item) => item.day === dayNum);
  if (!day) notFound();

  return (
    <AuthGate>
    <main className="viewport">
      <section className="paper-frame grid grid-rows-[54px_auto_1fr_48px]">
        <header className="topbar !h-[54px]">
          <div className="brand">成她100</div>
          <span>Day {String(day.day).padStart(2, "0")}</span>
          <div className="flex items-center gap-2">
            <button
              className="action-ghost !px-3 !py-2 !text-xs"
              onClick={() => window.history.back()}
              type="button"
            >
              返回
            </button>
            <button
              className="action-ghost !px-3 !py-2 !text-xs"
              onClick={() => window.history.pushState(null, "", "/treasure")}
              type="button"
            >
              我的匣子
            </button>
          </div>
        </header>

        <section className="grid grid-cols-[minmax(0,1fr)_174px] gap-6 border-b border-[var(--line)] bg-paper/50 p-[clamp(18px,2.4vw,28px)] max-md:grid-cols-1">
          <div>
            <div className="eyebrow mb-3">Awakening · Week 01</div>
            <div className="grid grid-cols-[auto_1fr] items-end gap-5 max-sm:grid-cols-1">
              <h1 className="display-title text-[clamp(42px,5.2vw,76px)]">{day.title}</h1>
              <div className="mb-1 flex flex-wrap gap-2">
                <span className="pill">Day {String(day.day).padStart(2, "0")}</span>
                <span className="pill">{day.dimension}</span>
              </div>
            </div>
            <div className="mt-4 grid max-w-3xl gap-2 text-base leading-[1.82] text-[#4f3429]">
              {(day.mirror ?? ["内容即将打开。"]).map((line) => (
                <p key={line} className="m-0">{line}</p>
              ))}
            </div>
            <div className="mt-4 flex gap-4">
              <Link className="text-link" href={`/day/${Math.max(1, day.day - 1)}`}>
                上一天
              </Link>
              {day.day < dayContents.length ? (
                <Link className="text-link" href={`/day/${day.day + 1}`}>
                  下一天
                </Link>
              ) : (
                <span className="sans text-xs text-[var(--muted)]">后续内容筹备中</span>
              )}
            </div>
          </div>
          <div className="grid justify-items-center gap-2">
            <div className="sans text-[11px] uppercase tracking-wider text-clay">今日抽卡</div>
            <MysteryCard small />
          </div>
        </section>

        <section className="grid min-h-0 grid-cols-[minmax(0,1fr)_minmax(280px,.62fr)] gap-6 overflow-hidden p-[clamp(16px,2.2vw,26px)] max-lg:grid-cols-1 max-lg:overflow-auto">
          <div className="border-t border-[var(--line)] pt-4">
            <SectionTitle number="1" title="她的故事" />
            <p className="leading-[1.82] text-[#563a2e]">{day.storyPreview}</p>
            <details>
              <summary className="text-link cursor-pointer list-none">展开余下故事</summary>
              <p className="mt-3 leading-[1.82] text-[#563a2e]">
                这里接入当天完整故事。正式上线内容以 Day 文档为准。
              </p>
            </details>
          </div>
          <div className="grid content-start gap-5">
            <section className="border-t border-[var(--line)] pt-4">
              <SectionTitle number="2" title="身体小语" />
              <p className="thin-panel m-0 p-4 leading-[1.82] text-[#563a2e]">{day.bodyNote}</p>
            </section>
            <section className="relative border-t border-[var(--line)] pt-4">
              <SectionTitle number="3" title="AI 今日对话" />
              <AIHoverTip />
              <p className="mb-4 leading-[1.8] text-[#4f3429]">{day.aiQuestion}</p>
              <Link
                className="action-primary inline-block text-center"
                href={`/day/${day.day}/ai`}
              >
                开启对话
              </Link>
            </section>
          </div>
        </section>
        <footer className="flex items-center justify-between border-t border-[var(--line)] px-[clamp(16px,2.4vw,30px)] sans text-xs text-[var(--muted)]">
          <span>完成后会生成今日金句卡，可保存图片。</span>
          <Link className="text-link" href="/quote-card">
            收下今天
          </Link>
        </footer>
      </section>
    </main>
    </AuthGate>
  );
}

function SectionTitle({ number, title }: { number: string; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-3 text-2xl leading-none">
      <span className="grid h-6 w-6 place-items-center rounded-full border border-clay sans text-[11px] text-clay">
        {number}
      </span>
      <span>{title}</span>
    </div>
  );
}
