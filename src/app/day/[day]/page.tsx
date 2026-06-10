import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { MysteryCard } from "@/components/MysteryCard";
import { AIHoverTip } from "@/components/AIHoverTip";
import { DayFooter } from "@/components/DayFooter";
import { SelfReflectionBox } from "@/components/SelfReflectionBox";
import { dayContents, mysteryCards } from "@/lib/content";
import { getDayDocumentContent } from "@/lib/day-document";

type PageProps = {
  params: Promise<{ day: string }>;
};

export default async function DayPage({ params }: PageProps) {
  const { day: dayParam } = await params;
  const dayNum = Number(dayParam);
  const day = dayContents.find((item) => item.day === dayNum);
  if (!day) notFound();
  const documentContent = await getDayDocumentContent(day.day);
  const card = mysteryCards[day.day];

  return (
    <AuthGate>
    <main className="viewport">
      <section className="paper-frame grid grid-rows-[54px_auto_1fr_48px]">
        <header className="topbar !h-[54px]">
          <div className="brand">成她100</div>
          <span>Day {String(day.day).padStart(2, "0")}</span>
          <div className="flex items-center gap-2">
            <Link className="action-ghost !px-3 !py-2 !text-xs" href="/home">
              回到状态页
            </Link>
            <Link className="action-ghost !px-3 !py-2 !text-xs" href="/treasure">
              我的匣子
            </Link>
          </div>
        </header>

        <section className="grid grid-cols-[minmax(0,1fr)_174px] gap-6 border-b border-[var(--line)] bg-paper/50 p-[clamp(18px,2.4vw,28px)] max-md:grid-cols-1">
          <div>
            <div className="eyebrow mb-3">Awakening · Week 01</div>
            <div className="grid grid-cols-[auto_1fr] items-end gap-5 max-sm:grid-cols-1">
              <h1 className="display-title text-[clamp(42px,5.2vw,76px)]">{day.title}</h1>
              <div className="mb-1 flex flex-wrap gap-2">
                <span className="pill">Day {String(day.day).padStart(2, "0")}</span>
                <span className="pill bg-[#5b382c] text-soft">{day.phase}</span>
                <span className="pill">{day.dimension}</span>
                {day.cardPoint && <span className="pill bg-[#8B6914] text-soft">卡点：{day.cardPoint}</span>}
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
            <MysteryCard front={card.front} back={card.back} small />
            <span className="sans text-[10px] text-[var(--muted)]">点击翻牌</span>
          </div>
        </section>

        <section className="grid min-h-0 grid-cols-[minmax(0,1fr)_minmax(280px,.62fr)] gap-6 overflow-auto p-[clamp(16px,2.2vw,26px)] max-lg:grid-cols-1 max-lg:overflow-auto">
          <div className="border-t border-[var(--line)] pt-4">
            <SectionTitle number="1" title="她的故事" />
            <p className="leading-[1.82] text-[#563a2e]">{day.storyPreview}</p>
            <details>
              <summary className="text-link cursor-pointer list-none">展开余下故事</summary>
              <div className="mt-3 grid gap-3 leading-[1.82] text-[#563a2e]">
                {renderParagraphs(documentContent.story)}
              </div>
            </details>
          </div>
          <div className="grid content-start gap-5">
            <section className="border-t border-[var(--line)] pt-4">
              <SectionTitle number="2" title="身体小语" />
              <div className="thin-panel m-0 grid gap-3 p-4 leading-[1.82] text-[#563a2e]">
                {renderParagraphs(documentContent.bodyNote)}
              </div>
            </section>
            <section className="relative border-t border-[var(--line)] pt-4">
              <SectionTitle number="3" title="今日自我看见" />
              <AIHoverTip methodTitle={documentContent.aiMethod.title} methodNote={documentContent.aiMethod.note} />
              <p className="mb-4 leading-[1.8] text-[#4f3429]">
                {day.aiQuestion} 你可以先自己写下来；想继续深入时，再让 AI 接住这段文字，一层一层陪你看见。
              </p>
              <SelfReflectionBox aiHref={`/day/${day.day}/ai`} day={day.day} />
            </section>
            {documentContent.extraSections.map((section, index) => (
              <section key={section.title} className="border-t border-[var(--line)] pt-4">
                <SectionTitle number={String(index + 4)} title={section.title} />
                <div className="thin-panel grid gap-3 p-4 text-sm leading-[1.82] text-[#563a2e]">
                  {renderParagraphs(section.content)}
                </div>
              </section>
            ))}
          </div>
        </section>
        <DayFooter day={day.day} />
      </section>
    </main>
    </AuthGate>
  );
}

function renderParagraphs(content: string) {
  return content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => (
      <p key={paragraph} className="m-0 whitespace-pre-line">
        {paragraph}
      </p>
    ));
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
