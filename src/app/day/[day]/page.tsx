import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AuthGate } from "@/components/AuthGate";
import { MysteryCard } from "@/components/MysteryCard";
import { AIHoverTip } from "@/components/AIHoverTip";
import { CollapsibleStory } from "@/components/CollapsibleStory";
import { DayFooter } from "@/components/DayFooter";
import { SelfReflectionBox } from "@/components/SelfReflectionBox";
import { dayContents, mysteryCards } from "@/lib/content";
import { getDayDocumentContent } from "@/lib/day-document";
import { getBodyStationEntry } from "@/lib/body-station";
import { getScheduleDay } from "@/lib/schedule";
import { MobileTopBar } from "@/components/MobileTopBar";

type PageProps = {
  params: Promise<{ day: string }>;
};

export default async function DayPage({ params }: PageProps) {
  const { day: dayParam } = await params;
  const dayNum = Number(dayParam);
  const day = dayContents.find((item) => item.day === dayNum);
  if (!day) notFound();
  const documentContent = await getDayDocumentContent(day.day);
  const bodyStationEntry = getBodyStationEntry(day.day);
  const scheduleDay = getScheduleDay(day.day);
  const card = mysteryCards[day.day];
  const displayTitle = documentContent.title || day.title;
  const displayPhase = documentContent.phaseLine || day.phase;
  const displayDimension = documentContent.dimensionLine || scheduleDay?.dimension || day.dimension;
  const displayCardPoint = documentContent.cardPointLine || day.cardPoint;
  const storyPreview = documentContent.storyPreview || day.storyPreview;
  const aiQuestion = documentContent.aiQuestion || day.aiQuestion;
  const bodyPreview = bodyPreviewText(documentContent.bodyNote || day.bodyNote);
  const bodyAction = pickBodyAction(bodyStationEntry?.sections ?? [], documentContent.bodyNote || day.bodyNote);
  const bodyStationLabel = bodyStationEntry?.theme || scheduleDay?.bodyStation || "身体驿站";
  const mirrorLines = documentContent.mirror
    ? documentContent.mirror.split(/\n{2,}/).map((line) => line.trim()).filter(Boolean)
    : (day.mirror ?? ["内容即将打开。"]);

  return (
    <AuthGate>
    <main className="viewport botanical-page">
      <section className="paper-frame day-page">
        <MobileTopBar
          leftAction={<Link className="mobile-topbar__action" href="/home">返回状态</Link>}
          rightAction={<Link className="mobile-topbar__action" href="/treasure">我的匣子</Link>}
          title="每日内容"
        />

        <section className="day-page__hero">
          <div className="day-page__intro">
            <div className="page-kicker mb-3">Awakening · Week 01</div>
            <div className="day-page__title-row">
              <h1 className="display-title text-[clamp(42px,5.2vw,76px)]">{displayTitle}</h1>
              <div className="day-page__tag-groups">
                <div className="day-page__tag-row">
                  <span className="pill">Day {String(day.day).padStart(2, "0")}</span>
                  <span className="pill">{displayDimension}</span>
                </div>
                <div className="day-page__tag-row day-page__tag-row--sub">
                  <span className="pill bg-[#5b382c] text-soft">{displayPhase}</span>
                </div>
                {displayCardPoint ? (
                  <div className="day-page__tag-row day-page__tag-row--sub">
                    <span className="pill bg-[#8B6914] text-soft">卡点：{displayCardPoint}</span>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="day-page__mirror">
            <div>今日镜子 🪞</div>
              <p>{mirrorLines.slice(0, 2).join("\n")}</p>
              {mirrorLines.length > 1 ? (
                <details className="day-page__mirror-details">
                  <summary>展开全部⌄</summary>
                  <div>{mirrorLines.slice(2).map((line) => <p key={line}>{line}</p>)}</div>
                </details>
              ) : null}
            </div>
            <div className="day-page__quick-nav">
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
          <div className="day-page__mystery">
            <div>✦ 今日抽卡 ✦</div>
            <MysteryCard front={card.front} back={card.back} small variant="daily" />
            <span className="sans text-[10px] text-[var(--muted)]">点击翻牌</span>
          </div>
        </section>

        <section className="day-page__sections">
          <section className="day-page__section">
            <SectionTitle number="1" title="她的故事 📖" />
            <CollapsibleStory
              preview={<p className="whitespace-pre-line leading-[1.82] text-[#563a2e]">{storyPreview}</p>}
            >
              <div className="mt-3 grid gap-3 leading-[1.82] text-[#563a2e]">
                {renderParagraphs(documentContent.story)}
              </div>
            </CollapsibleStory>
          </section>
          <div className="day-page__section-stack">
            <section className="day-page__section">
              <SectionTitle number="2" title="身体小语 🌿" />
              <div className="day-page__body-copy soft-panel m-0 grid gap-3 p-4 leading-[1.82] text-[#563a2e]">
                <div className="day-page__body-head">
                  <p className="m-0 whitespace-pre-line">{bodyPreview}</p>
                  <span aria-hidden>◔</span>
                  <small>{bodyStationLabel}</small>
                </div>
                <div className="day-page__body-action">
                  <span aria-hidden>🍃</span>
                  <p>{bodyAction}</p>
                  <Link href={`/body-station/${day.day}?from=day`}>了解更多</Link>
                </div>
                <p className="day-page__station-link">
                  进入身体驿站，查看今晚的完整身体练习 ›
                </p>
              </div>
            </section>
            <section className="day-page__section day-page__section--reflection relative">
              <SectionTitle
                action={<AIHoverTip methodTitle={documentContent.aiMethod.title} methodNote={documentContent.aiMethod.note} />}
                number="3"
                title="今日自我看见 ✨"
              />
              <p className="day-page__ai-prompt mb-4 leading-[1.8] text-[#4f3429]">
                {aiQuestion} 你可以先自己写下来；想继续深入时，再让 AI 接住这段文字，一层一层陪你看见。
              </p>
              <SelfReflectionBox aiHref={`/day/${day.day}/ai`} day={day.day} />
              <p className="day-page__archive-note">这一段会轻轻留在成长档案里，之后你可以回来看见自己的变化。</p>
            </section>
            {documentContent.extraSections.map((section, index) => (
              <section key={section.title} className="day-page__section">
                <SectionTitle number={String(index + 4)} title={section.title} />
                <div className="soft-panel grid gap-3 p-4 text-sm leading-[1.82] text-[#563a2e]">
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

function bodyPreviewText(content: string) {
  const paragraphs = content.split(/\n{2,}/).map((line) => line.trim()).filter(Boolean);
  const first = paragraphs[0] ?? "今晚，先把注意力轻轻带回身体。";
  const sentences = first.match(/[^。！？!?]+[。！？!?]?/g)?.map((line) => line.trim()).filter(Boolean) ?? [first];
  const preview = sentences.slice(0, 3).join("");
  return preview.length < 34 && paragraphs[1] ? `${preview}\n${paragraphs[1]}` : preview;
}

function pickBodyAction(sections: { content: string; title: string }[], fallback: string) {
  const actionSection = sections.find((section) => /练习|呼吸|动作|按揉|食疗|身体/.test(section.title)) ?? sections[0];
  const source = actionSection?.content || fallback;
  const lines = source
    .replace(/^\s*[-*]\s*/gm, "")
    .split(/\n|。|；|;/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^#{1,6}\s*/.test(line))
    .filter((line) => line.length >= 8);
  const picked = lines.find((line) => /放|按|揉|呼吸|闭眼|站|写|问|喝|搓|敲|停/.test(line)) ?? lines[0];
  return picked ? `${picked.replace(/[。；;]$/, "")}。` : "今晚先停一下，把一只手轻轻放在身体最紧的地方，慢慢呼吸 9 次。";
}

function SectionTitle({ action, number, title }: { action?: ReactNode; number: string; title: string }) {
  return (
    <div className="day-page__section-title">
      <span>
        {number}
      </span>
      <span>{title}</span>
      {action ? <div className="day-page__section-action">{action}</div> : null}
    </div>
  );
}
