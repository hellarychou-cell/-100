"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { currentUser } from "@/lib/content";
import { treasureEntries } from "@/lib/product-navigation";
import { LOCAL_AI_CONVERSATION_KEY, LOCAL_REFLECTION_KEY } from "@/lib/self-reflection";
import { MobileTopBar } from "@/components/MobileTopBar";

const entryIcons = ["⌇", "▤", "♨", "✦", "◫"];

export default function TreasurePage() {
  const [archiveCount, setArchiveCount] = useState(0);

  useEffect(() => {
    setArchiveCount(readLocalCount(LOCAL_REFLECTION_KEY) + readLocalCount(LOCAL_AI_CONVERSATION_KEY));
  }, []);

  const drawerItems = useMemo(
    () =>
      treasureEntries.map((drawer) =>
        drawer.title === "成长档案"
          ? { ...drawer, meta: `你已经留下 ${archiveCount} 段话了` }
          : drawer,
      ),
    [archiveCount],
  );

  return (
    <AuthGate>
    <main className="viewport botanical-page">
      <section className="paper-frame treasure-page">
        <MobileTopBar
          rightAction={<Link aria-label="回到我的状态" className="mobile-topbar__action" href="/home">返回状态</Link>}
          title="我的匣子"
        />
        <div className="treasure-page__content">
          <section className="treasure-page__hero">
            <div>
              <small>PRIVATE ARCHIVE</small>
              <h1>我的<br />匣子</h1>
              <p>这里放着你已经看见、收下<br />和慢慢打开的东西。</p>
            </div>
            <div className="treasure-page__illustration" aria-hidden>
              <i /><i /><span>✦　　✦</span>
            </div>
          </section>

          <section className="treasure-page__metrics">
            <Metric value={String(currentUser.currentDay).padStart(2, "0")} label="当前 Day" />
            <Metric value={String(currentUser.cards).padStart(2, "0")} label="神秘卡" />
            <Metric value={String(archiveCount).padStart(2, "0")} label="档案记录" last />
          </section>

          <section className="treasure-page__entries">
            {drawerItems.map((drawer, index) => (
              <Link className="treasure-page__entry" href={drawer.href} key={drawer.title}>
                <span className="treasure-page__number">{index + 1}</span>
                <span className="treasure-page__icon" aria-hidden><i className="treasure-page__icon-mark">{entryIcons[index]}</i></span>
                <span className="treasure-page__copy">
                    <strong>
                      {drawer.title}
                    </strong>
                    <small>{drawer.desc}</small>
                </span>
                <span className="treasure-page__meta">{drawer.meta}<b>›</b></span>
              </Link>
            ))}
          </section>
          <footer className="treasure-page__footer">✦　　✦<p>你所有认真的向内，都会在未来的某一天，变成看得见的自由与力量。</p></footer>
        </div>
      </section>
    </main>
    </AuthGate>
  );
}

function readLocalCount(key: string) {
  const raw = window.localStorage.getItem(key);
  if (!raw) return 0;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    window.localStorage.removeItem(key);
    return 0;
  }
}

function Metric({ value, label, last = false }: { value: string; label: string; last?: boolean }) {
  return (
    <div className={last ? "" : "has-divider"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
