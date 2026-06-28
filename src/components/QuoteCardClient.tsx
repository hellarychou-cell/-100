"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { dayContents, heroImage } from "@/lib/content";
import { saveElementAsPng } from "@/lib/export-image";
import {
  createTodaySeeingCard,
  LOCAL_TODAY_SEEING_KEY,
  type TodaySeeingCard,
} from "@/lib/today-seeing-card";
import { AIConversationEntry, LOCAL_AI_CONVERSATION_KEY } from "@/lib/self-reflection";
import { MobileTopBar } from "@/components/MobileTopBar";

export function QuoteCardClient({
  dayNum,
  documentContent,
}: {
  dayNum: number;
  documentContent?: { bodyNote: string; mirror: string; title: string } | null;
}) {
  const day = dayContents.find((item) => item.day === dayNum) ?? dayContents[0];
  const cardTitle = documentContent?.title || day.title;
  const cardBodyNote = documentContent?.bodyNote || day.bodyNote;
  const cardMirror = documentContent?.mirror || (Array.isArray(day.mirror) ? day.mirror.join(" ") : "");
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveUrl, setSaveUrl] = useState("");
  const [card, setCard] = useState<TodaySeeingCard | null>(null);

  useEffect(() => {
    const nextCard = createTodaySeeingCard({
      aiEntry: readAIEntry(day.day),
      bodyNote: cardBodyNote,
      day: day.day,
      mirror: cardMirror,
      title: cardTitle,
    });
    setCard(nextCard);
    saveSeeingCard(nextCard);
  }, [cardBodyNote, cardMirror, cardTitle, day.day]);

  const displayCard =
    card ??
    createTodaySeeingCard({
      bodyNote: cardBodyNote,
      day: day.day,
      mirror: cardMirror,
      title: cardTitle,
    });

  return (
    <main className="viewport botanical-page grid place-items-center">
      <section className="seeing-card-page">
        <MobileTopBar
          rightAction={<Link className="mobile-topbar__action !text-2xl" href={`/day/${day.day}`}>×</Link>}
          title="今日看见卡"
        />
        <div className="seeing-card-page__content">
          <header className="seeing-card-page__banner">
            <h1>今天，你被看见了。<span>✦</span></h1>
            <p>这张卡会存进成长档案，也可以保存成图片。</p>
          </header>

          <div className="seeing-card-page__card-wrap">
            <div ref={cardRef} className="today-seeing-card">
              <span className="today-seeing-card__kicker">
                成她100 · Day {String(day.day).padStart(2, "0")}
              </span>
              <h2>{displayCard.title}</h2>
              <div className="today-seeing-card__divider">🌿 ┈┈┈┈┈┈┈┈┈┈┈ 🌿</div>
              <div className="today-seeing-card__body">
                <section>
                  <span><i>☻</i> 今天你说：</span>
                  <p>“{displayCard.userExcerpt}”</p>
                </section>
                <section>
                  <span><i>✨</i> AI 看见的：</span>
                  <ol>
                  {displayCard.aiSeeings.map((item, index) => (
                    <li key={item}><b>{String(index + 1).padStart(2, "0")}</b>{item}</li>
                  ))}
                  </ol>
                </section>
                <section>
                  <span><i>🍃</i> 今晚带回身体的：</span>
                  <p>{displayCard.bodyAction}</p>
                </section>
              </div>
              <p>—— 成她100 · 今天的看见</p>
            </div>
            <div className="hidden">
              <div
                className="relative bg-cover bg-center"
                style={{ backgroundImage: `linear-gradient(rgba(36,22,16,.08),rgba(36,22,16,.28)),url(${heroImage})` }}
              />
            </div>
          </div>

          <div className="seeing-card-page__archive-tip">
            <span>▤</span>
            <p>这一张会进入成长档案，<br />成为最近触动你的一句候选。</p>
            <Link href="/growth-archive">去成长档案›</Link>
          </div>

          <section className="seeing-card-page__actions">
            <button
              className="action-primary"
              disabled={saving}
              onClick={() => void saveQuoteImage(cardRef.current, setSaving, setSaveMessage, setSaveUrl)}
              type="button"
            >
              <span aria-hidden>⇩</span>
              {saving ? "正在保存" : "保存图片"}
            </button>
            <Link className="action-primary" href="/home"><span aria-hidden>⌂</span>回到我的状态</Link>
          </section>
          <p className="seeing-card-page__blessing"><span aria-hidden>🌿</span>愿你一直被看见，也一直选择看见自己</p>
          {saveMessage || saveUrl ? (
            <p className="seeing-card-page__save-message">
              {saveMessage}
              {saveUrl ? <a href={saveUrl} download={`成她100-Day${day.day}-今日看见卡.png`}>打开图片</a> : null}
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}

async function saveQuoteImage(
  element: HTMLElement | null,
  setSaving: (saving: boolean) => void,
  setSaveMessage: (message: string) => void,
  setSaveUrl: (url: string) => void,
) {
  setSaving(true);
  setSaveMessage("");
  setSaveUrl("");
  const result = await saveElementAsPng({
    backgroundColor: "#f8efe1",
    element,
    fileName: `成她100-Day今日看见卡-${Date.now()}.png`,
  });
  setSaveMessage(result.ok ? "图片已生成。" : result.message);
  setSaveUrl(result.ok && result.dataUrl ? result.dataUrl : "");
  setSaving(false);
}

function readAIEntry(day: number) {
  const entries = readJson<AIConversationEntry[]>(LOCAL_AI_CONVERSATION_KEY);
  return Array.isArray(entries) ? entries.find((entry) => entry.day === day) ?? null : null;
}

function saveSeeingCard(card: TodaySeeingCard) {
  const cards = readJson<TodaySeeingCard[]>(LOCAL_TODAY_SEEING_KEY) ?? [];
  const next = [card, ...cards.filter((item) => item.day !== card.day)];
  window.localStorage.setItem(LOCAL_TODAY_SEEING_KEY, JSON.stringify(next));
}

function readJson<T>(key: string): T | null {
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}
