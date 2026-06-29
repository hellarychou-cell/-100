import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AuthGate } from "@/components/AuthGate";
import { MysteryCard } from "@/components/MysteryCard";
import { AIHoverTip } from "@/components/AIHoverTip";
import { AwakeningTheater } from "@/components/AwakeningTheater";
import { DayFooter } from "@/components/DayFooter";
import { DayProgressiveSections } from "@/components/DayProgressiveSections";
import { SelfReflectionBox } from "@/components/SelfReflectionBox";
import { dayContents, mysteryCards } from "@/lib/content";
import { getDayDocumentContent, type DayDocumentContent } from "@/lib/day-document";
import { getBodyStationEntry } from "@/lib/body-station";
import { getScheduleDay } from "@/lib/schedule";
import { MobileTopBar } from "@/components/MobileTopBar";
import { requiresMembershipForDay } from "@/lib/progress";

type PageProps = {
  params: Promise<{ day: string }>;
};

export default async function DayPage({ params }: PageProps) {
  const { day: dayParam } = await params;
  const dayNum = Number(dayParam);
  if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > 100) notFound();
  const day = dayContents.find((item) => item.day === dayNum) ?? createPlaceholderDay(dayNum);
  const documentContent = dayNum <= dayContents.length
    ? await getDayDocumentContent(day.day)
    : createPlaceholderDocumentContent(dayNum);
  const bodyStationEntry = getBodyStationEntry(day.day);
  const scheduleDay = getScheduleDay(day.day);
  const card = mysteryCards[day.day] ?? createPlaceholderMysteryCard(day.day);
  const displayTitle = documentContent.title || day.title;
  const displayPhase = documentContent.phaseLine || day.phase;
  const displayDimension = documentContent.dimensionLine || scheduleDay?.dimension || day.dimension;
  const displayCardPoint = documentContent.cardPointLine || day.cardPoint;
  const aiQuestion = documentContent.aiQuestion || day.aiQuestion;
  const bodyPreview = bodyPreviewText(documentContent.bodyNote || day.bodyNote);
  const bodyAction = pickBodyAction(bodyStationEntry?.sections ?? [], documentContent.bodyNote || day.bodyNote);
  const bodyStationLabel = bodyStationEntry?.theme || scheduleDay?.bodyStation || "身体驿站";
  const mirrorLines = documentContent.mirror
    ? documentContent.mirror.split(/\n{2,}/).map((line) => line.trim()).filter(Boolean)
    : (day.mirror ?? ["内容即将打开。"]);
  const hasFirstTheaterChoices = documentContent.awakeningTheater.firstChoices.length > 0;
  const hasSecondTheaterChoices = documentContent.awakeningTheater.secondChoices.length > 0;

  return (
    <AuthGate requireMember={requiresMembershipForDay(day.day)}>
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
              {day.day < 100 ? (
                <Link className="text-link" href={`/day/${day.day + 1}`}>
                  下一天
                </Link>
              ) : (
                <span className="sans text-xs text-[var(--muted)]">已到第100天</span>
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
            <SectionTitle number="1" title="觉醒剧场 🎬" />
            <AwakeningTheater
              day={day.day}
              theater={documentContent.awakeningTheater}
            />
          </section>
          <DayProgressiveSections
            day={day.day}
            hasFirstChoices={hasFirstTheaterChoices}
            hasSecondChoices={hasSecondTheaterChoices}
          >
            <section className="day-page__section day-page__section--reflection relative">
              <SectionTitle
                action={<AIHoverTip methodTitle={documentContent.aiMethod.title} methodNote={documentContent.aiMethod.note} />}
                number="2"
                title="今日自我看见 ✨"
              />
              <p className="day-page__ai-prompt mb-4 leading-[1.8] text-[#4f3429]">
                {aiQuestion} 你可以先自己写下来；想继续深入时，再让 AI 接住这段文字，一层一层陪你看见。
              </p>
              <SelfReflectionBox aiHref={`/day/${day.day}/ai`} day={day.day} />
              <p className="day-page__archive-note">这一段会轻轻留在成长档案里，之后你可以回来看见自己的变化。</p>
            </section>
            <section className="day-page__section day-page__section--after-ai day-page__section--body">
              <SectionTitle number="3" title="身体小语 🌿" />
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
            {documentContent.extraSections.map((section, index) => (
              <section key={section.title} className="day-page__section day-page__section--after-ai">
                <SectionTitle number={String(index + 4)} title={section.title} />
                <div className="soft-panel grid gap-3 p-4 text-sm leading-[1.82] text-[#563a2e]">
                  {renderParagraphs(section.content)}
                </div>
              </section>
            ))}
            {documentContent.curtainCall ? (
              <section className="day-page__section--after-ai day-page__curtain-stage" aria-label="整天散场尾韵">
                <div className="day-page__curtain-peek">
                  <span>✦</span>
                  <small>轻轻上拉，今晚的尾韵在这里</small>
                  <span>✦</span>
                </div>
                <div className="day-page__curtain-call">
                  <p className="day-page__curtain-kicker">整天散场尾韵</p>
                  <div className="day-page__curtain-copy">
                    {renderParagraphs(documentContent.curtainCall)}
                  </div>
                </div>
              </section>
            ) : null}
          </DayProgressiveSections>
        </section>
        <DayFooter day={day.day} />
      </section>
    </main>
    </AuthGate>
  );
}

function createPlaceholderDay(day: number) {
  const phase = day <= 25 ? "第一阶段觉醒期" : day <= 50 ? "第二阶段理解期" : day <= 80 ? "第三阶段重建期" : "第四阶段创造期";
  return {
    aiQuestion: "今天，先写下一个最真实的小感受。内容正文正在筹备中，这里会先为你保留完整的位置。",
    bodyNote: "今晚先把手放在胸口，慢慢呼吸 9 次。内容上线后，这里会换成当天的身体小语。",
    cardPoint: "内容筹备中",
    day,
    dimension: "成长占位",
    mirror: ["这一天的内容正在筹备中。", "你可以先把今天的自己放在这里，等内容上线后再回来继续。"],
    phase,
    quote: "内容正在长出来。",
    quoteBy: `成她100 · Day ${String(day).padStart(2, "0")}`,
    storyPreview: "这一天的故事正在写入。现在先保留一个温柔的位置，等它上线。",
    subtitle: "内容筹备中",
    title: `Day ${day}`,
  };
}

function createPlaceholderDocumentContent(day: number): DayDocumentContent {
  const phaseLine = day <= 25 ? "第一阶段觉醒期" : day <= 50 ? "第二阶段理解期" : day <= 80 ? "第三阶段重建期" : "第四阶段创造期";
  return {
    aiMethod: {
      note: "内容上线前，先用一句真实的话和自己保持连接。",
      title: "温柔自我看见",
    },
    aiOpening: "先写一句今天最真实的话。",
    aiQuestion: "今天你最想被谁听见？你可以只写一句话。",
    bodyNote: "今晚先把手放在胸口，慢慢呼吸 9 次。内容上线后，这里会换成当天的身体小语。",
    cardPointLine: "内容筹备中",
    dimensionLine: "成长占位",
    extraSections: [
      {
        title: "今日练习",
        content: "给今天的自己留一句话。等正式内容上线后，这里会变成完整练习。",
      },
      {
        title: "心理学小知识",
        content: "成长不是每天都要用力推进，有时候，先留一个位置也是一种开始。",
      },
    ],
    awakeningTheater: {
      branches: {},
      common: "",
      firstChoices: [],
      fullText: "这一天的觉醒剧场正在写入。现在先保留一个温柔的位置，等它上线。",
      interlude: "先带着今天的自己，去和 AI 说一句真实的话。→ [开始对话]",
      intro: "这一天的觉醒剧场正在写入。现在先保留一个温柔的位置，等它上线。",
      reveal: "",
      secondChoices: [],
    },
    mirror: "这一天的内容正在筹备中。\n\n你可以先把今天的自己放在这里，等内容上线后再回来继续。",
    phaseLine,
    story: "这一天的故事正在写入。现在先保留一个温柔的位置，等它上线。",
    storyPreview: "这一天的故事正在写入。现在先保留一个温柔的位置，等它上线。",
    curtainCall: "",
    title: `Day ${day}`,
  };
}

function createPlaceholderMysteryCard(day: number) {
  return {
    front: {
      age: "内容筹备中",
      description: "这张卡的位置已经为你留好。",
      name: "成她100",
      quote: "内容正在长出来。",
      symbol: "🌿",
    },
    back: {
      content: "这张卡还在准备中。等当天内容上线后，它会变成真正的工具卡、感恩卡或福利卡。",
      dayNum: day,
      title: "筹备卡",
      type: "blank" as const,
    },
  };
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
