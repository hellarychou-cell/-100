"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { MysteryCard } from "@/components/MysteryCard";
import { buildCollectionState, LOCAL_COLLECTION_CELEBRATED_KEY, LOCAL_SELF_CARD_KEY, type SelfCard } from "@/lib/collection";
import { LOCAL_PROGRESS_KEY } from "@/lib/auth";
import { getSisterProfile } from "@/lib/sister-profiles";
import { supabase } from "@/lib/supabase";
import type { ScheduleWoman } from "@/lib/schedule";
import type { ToolCard } from "@/lib/tool-cards";

export function CollectionClient({ scheduleWomen, toolCards }: { scheduleWomen: ScheduleWoman[]; toolCards: ToolCard[] }) {
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [selfCard, setSelfCard] = useState<SelfCard | null>(null);
  const [selected, setSelected] = useState<{ kind: "tool"; file: string } | { kind: "sister"; name: string } | null>(null);
  const [showFinale, setShowFinale] = useState(false);

  useEffect(() => {
    async function loadProgress() {
      const local = readProgress();
      setSelfCard(readJson<SelfCard>(LOCAL_SELF_CARD_KEY));
      if (!supabase) {
        setCompletedDays(local);
        return;
      }
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        setCompletedDays(local);
        return;
      }
      const { data } = await supabase.from("progress").select("completed_days").eq("user_id", user.id).maybeSingle();
      setCompletedDays(Array.isArray(data?.completed_days) ? data.completed_days : local);
    }
    loadProgress();
  }, []);

  const state = useMemo(
    () => buildCollectionState({ completedDays, scheduleWomen, selfCard, toolCards }),
    [completedDays, scheduleWomen, selfCard, toolCards],
  );
  const selectedTool = selected?.kind === "tool" ? state.toolSlots.find((slot) => slot.file === selected.file) : null;
  const selectedSister = selected?.kind === "sister" ? state.sisterSlots.find((slot) => slot.name === selected.name) : null;

  useEffect(() => {
    if (!state.allComplete || window.localStorage.getItem(LOCAL_COLLECTION_CELEBRATED_KEY)) return;
    setShowFinale(true);
    window.localStorage.setItem(LOCAL_COLLECTION_CELEBRATED_KEY, "yes");
    const timer = window.setTimeout(() => setShowFinale(false), 5000);
    return () => window.clearTimeout(timer);
  }, [state.allComplete]);

  function handleSelfCard(next: SelfCard) {
    window.localStorage.setItem(LOCAL_SELF_CARD_KEY, JSON.stringify(next));
    setSelfCard(next);
  }

  return (
    <AuthGate>
      <main className="viewport">
        <section className="paper-frame grid grid-rows-[56px_1fr]">
          <header className="topbar">
            <div className="brand">成她100</div>
            <span>我的集卡</span>
            <Link aria-label="回到我的匣子" className="grid h-8 w-8 place-items-center border border-[var(--line)] bg-soft/60 text-lg leading-none text-ink transition hover:bg-ink hover:text-soft" href="/treasure">
              ×
            </Link>
          </header>

          <section className="grid min-h-0 gap-7 overflow-auto p-[clamp(18px,2.8vw,34px)] lg:grid-cols-[320px_1fr]">
            <aside className="grid content-start gap-5">
              <div>
                <div className="eyebrow mb-3">Collection</div>
                <h1 className="display-title text-5xl">不是一个人走完。</h1>
              </div>
              <p className="text-[15px] leading-[1.75] text-[#563a2e]">
                工具卡按它自己的位置归档，姐妹卡按第一次出现点亮。每天收下的碎片，最后会拼成一张完整地图。
              </p>
              <div className="grid grid-cols-2 border border-[var(--line)]">
                <Metric label="工具卡" value={`${state.toolSlots.filter((slot) => slot.unlocked).length}/${state.toolSlots.length}`} />
                <Metric label="我的姐妹" value={`${state.sisterSlots.filter((slot) => slot.unlocked).length}/${state.sisterSlots.length + 1}`} />
              </div>

              <SelectedCard selectedSister={selectedSister} selectedTool={selectedTool} />
            </aside>

            <div className="grid content-start gap-8">
              {state.allComplete ? (
                <div className="thin-panel border-clay/40 bg-clay/5 p-4 text-clay">你已经集齐全部神秘卡牌✓</div>
              ) : null}
              <CollectionSection title="工具卡" count={`${state.toolSlots.filter((slot) => slot.unlocked).length} / ${state.toolSlots.length}`}>
                {state.toolSlots.map((slot) => (
                  <button
                    className={`min-h-24 border p-3 text-left transition ${
                      slot.unlocked ? "border-[var(--line)] bg-[#f7ead8] text-[#3f281f] hover:-translate-y-0.5" : "border-[var(--line)]/40 bg-soft/35 text-[var(--muted)] opacity-60"
                    }`}
                    key={slot.file}
                    onClick={() => setSelected({ kind: "tool", file: slot.file })}
                    type="button"
                  >
                    <span className="sans text-[10px] uppercase tracking-[0.14em]">{String(slot.slot).padStart(2, "0")}</span>
                    <strong className="mt-2 block font-normal">{slot.unlocked ? slot.front.name : "未解锁工具"}</strong>
                    <span className="mt-1 block sans text-[11px]">{slot.day ? `Day ${slot.day}` : "等待分配"}</span>
                  </button>
                ))}
              </CollectionSection>

              <CollectionSection title="我的姐妹" count={`${state.sisterSlots.filter((slot) => slot.unlocked).length} / ${state.sisterSlots.length + 1}`}>
                {state.sisterSlots.map((slot) => {
                  const profile = getSisterProfile(slot.name);
                  return (
                    <button
                      className={`min-h-24 border p-3 text-left transition ${
                        slot.unlocked ? "border-gold/50 bg-gradient-to-br from-[#241610] via-[#744531] to-gold text-paper hover:-translate-y-0.5" : "border-[var(--line)]/40 bg-soft/35 text-[var(--muted)] opacity-60"
                      }`}
                      key={`${slot.name}-${slot.firstDay}`}
                      onClick={() => setSelected({ kind: "sister", name: slot.name })}
                      type="button"
                    >
                      <span className="text-xl">{profile?.symbol ?? "她"}</span>
                      <strong className="mt-2 block font-normal">{slot.unlocked ? slot.name : "未相遇"}</strong>
                      <span className="mt-1 block sans text-[11px]">Day {slot.firstDay}</span>
                    </button>
                  );
                })}
                <SelfCardSlot completedDay100={completedDays.includes(100)} selfCard={selfCard} onSave={handleSelfCard} />
              </CollectionSection>
            </div>
          </section>
        </section>
        {showFinale ? <FinaleOverlay onClose={() => setShowFinale(false)} /> : null}
      </main>
    </AuthGate>
  );
}

function SelectedCard({
  selectedSister,
  selectedTool,
}: {
  selectedSister: ReturnType<typeof buildCollectionState>["sisterSlots"][number] | null | undefined;
  selectedTool: ReturnType<typeof buildCollectionState>["toolSlots"][number] | null | undefined;
}) {
  if (selectedTool?.unlocked) {
    return <MysteryCard back={{ ...selectedTool.back, dayNum: selectedTool.day ?? undefined }} front={selectedTool.front} />;
  }
  if (selectedSister?.unlocked) {
    const profile = getSisterProfile(selectedSister.name);
    return (
      <MysteryCard
        back={{
          content: profile?.dailyVoice ?? "这位姐妹的隐藏声音会在后续补齐。",
          dayNum: selectedSister.firstDay,
          gift: profile?.gift,
          title: selectedSister.name,
          type: "sister",
        }}
        front={{
          age: selectedSister.field,
          description: "陪你走过 100 天的姐妹",
          name: selectedSister.name,
          quote: selectedSister.quoteSource || "她在这里。",
          symbol: profile?.symbol,
        }}
      />
    );
  }
  return (
    <div className="grid aspect-[3/4.25] w-56 place-items-center border border-[var(--line)] bg-soft/35 text-center text-[var(--muted)]">
      <span>点一张已解锁的卡查看</span>
    </div>
  );
}

function CollectionSection({ children, count, title }: { children: React.ReactNode; count: string; title: string }) {
  return (
    <section className="grid gap-3">
      <div className="flex items-end justify-between border-b border-[var(--line)] pb-3">
        <h2 className="m-0 text-4xl font-normal leading-none">{title}</h2>
        <span className="sans text-xs text-[var(--muted)]">{count} · 已解锁</span>
      </div>
      <div className="grid grid-cols-6 gap-2 max-xl:grid-cols-5 max-md:grid-cols-3 max-sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-[var(--line)] p-4 last:border-r-0">
      <p className="sans text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl text-clay">{value}</p>
    </div>
  );
}

function SelfCardSlot({
  completedDay100,
  onSave,
  selfCard,
}: {
  completedDay100: boolean;
  onSave: (card: SelfCard) => void;
  selfCard: SelfCard | null;
}) {
  const [open, setOpen] = useState(false);
  if (selfCard) {
    return (
      <button className="min-h-24 border border-clay/50 bg-[#fff8ed] p-3 text-left text-[#3f281f]" type="button">
        <span className="text-xl">🪞</span>
        <strong className="mt-2 block font-normal">{selfCard.name}</strong>
        <span className="mt-1 block sans text-[11px]">{selfCard.identity}</span>
      </button>
    );
  }
  return (
    <div className="min-h-24 border border-[var(--line)]/40 bg-soft/35 p-3 text-left text-[var(--muted)]">
      <span className="text-xl">🪞</span>
      <strong className="mt-2 block font-normal">你自己</strong>
      {completedDay100 ? (
        <>
          <button className="text-link mt-2 bg-transparent text-xs" onClick={() => setOpen((value) => !value)} type="button">填写我的卡</button>
          {open ? <SelfCardForm onSave={onSave} /> : null}
        </>
      ) : (
        <span className="mt-1 block sans text-[11px]">Day 100 后解锁</span>
      )}
    </div>
  );
}

function SelfCardForm({ onSave }: { onSave: (card: SelfCard) => void }) {
  const [name, setName] = useState("");
  const [identity, setIdentity] = useState("");
  const [sentence, setSentence] = useState("");
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [saving, setSaving] = useState(false);
  const canSave = name.trim() && identity.trim() && sentence.trim();

  async function saveImage() {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, { backgroundColor: "#fff8ed", pixelRatio: 2 });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `成她100-我的卡-${Date.now()}.png`;
      link.click();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 grid gap-2">
      <input className="w-full border border-[var(--line)] bg-soft px-2 py-1 text-xs text-ink outline-none" placeholder="我的名字" value={name} onChange={(event) => setName(event.target.value)} />
      <input className="w-full border border-[var(--line)] bg-soft px-2 py-1 text-xs text-ink outline-none" placeholder="我是一个..." value={identity} onChange={(event) => setIdentity(event.target.value)} />
      <input className="w-full border border-[var(--line)] bg-soft px-2 py-1 text-xs text-ink outline-none" placeholder="一句话给自己" value={sentence} onChange={(event) => setSentence(event.target.value)} />
      <div ref={cardRef} className="sr-only">{name} · {identity} · {sentence}</div>
      <button
        className="text-link bg-transparent text-xs disabled:opacity-40"
        disabled={!canSave}
        onClick={() => onSave({ identity: identity.trim(), name: name.trim(), sentence: sentence.trim() })}
        type="button"
      >
        生成我的成她卡
      </button>
      <button className="text-link bg-transparent text-xs" disabled={!canSave || saving} onClick={saveImage} type="button">保存图片</button>
    </div>
  );
}

function FinaleOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/75 p-6 text-paper backdrop-blur-sm">
      <button className="absolute right-5 top-5 text-3xl" onClick={onClose} type="button">×</button>
      <div className="max-w-3xl text-center">
        <p className="text-4xl leading-tight">你不是一个人走完这 100 天的。</p>
        <p className="mt-8 leading-[2] text-paper/80">
          杨绛 · 上野千鹤子 · 苏敏 · 张爱玲 · 李清照 · 林徽因 · 萧红 · 伍尔夫 · 奥普拉 · J.K.罗琳
          <br />
          —— 还有你自己。
        </p>
      </div>
    </div>
  );
}

function readProgress() {
  const progress = readJson<{ completedDays?: number[] }>(LOCAL_PROGRESS_KEY);
  return Array.isArray(progress?.completedDays) ? progress.completedDays : [];
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
