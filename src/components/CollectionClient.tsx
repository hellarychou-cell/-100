"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { buildCollectionState, LOCAL_COLLECTION_CELEBRATED_KEY, LOCAL_SELF_CARD_KEY, type SelfCard } from "@/lib/collection";
import { LOCAL_PROGRESS_KEY } from "@/lib/auth";
import { getSisterProfile } from "@/lib/sister-profiles";
import { supabase } from "@/lib/supabase";
import type { ScheduleWoman } from "@/lib/schedule";
import type { ToolCard } from "@/lib/tool-cards";
import { MobileTopBar } from "@/components/MobileTopBar";

export function CollectionClient({ scheduleWomen, toolCards }: { scheduleWomen: ScheduleWoman[]; toolCards: ToolCard[] }) {
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [selfCard, setSelfCard] = useState<SelfCard | null>(null);
  const [selected, setSelected] = useState<{ kind: "tool"; file: string } | { kind: "sister"; name: string } | null>(null);
  const [expanded, setExpanded] = useState({ sister: false, tool: false });
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
  const unlockedToolCount = state.toolSlots.filter((slot) => slot.unlocked).length;
  const unlockedSisterCount = state.sisterSlots.filter((slot) => slot.unlocked).length;
  const firstUnlockedTool = state.toolSlots.find((slot) => slot.unlocked);
  const firstUnlockedSister = state.sisterSlots.find((slot) => slot.unlocked);
  const selectedPairedTool = selectedSister
    ? state.toolSlots.find((slot) => slot.day === selectedSister.firstDay && slot.unlocked) ?? firstUnlockedTool
    : firstUnlockedTool;
  const previewTitle =
    selectedTool?.front.name ??
    selectedSister?.name ??
    firstUnlockedSister?.name ??
    firstUnlockedTool?.front.name ??
    "点一张";
  const previewKind = selectedTool ? "工具卡" : selectedSister ? "姐妹卡" : "已解锁的卡";

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
      <main className="viewport botanical-page">
        <section className="paper-frame collection-page grid grid-rows-[56px_1fr]">
          <MobileTopBar
            rightAction={<Link aria-label="回到我的匣子" className="mobile-topbar__action" href="/treasure">返回匣子</Link>}
            title="神秘卡册"
          />

          <section className="collection-page__content">
            <header className="collection-page__hero">
              <div>
                {state.allComplete ? <span className="collection-page__complete">你已经集齐全部神秘卡牌 ✓</span> : null}
                <div className="page-kicker">Collection</div>
                <h1>不是一个人走完。</h1>
                <p>
                  工具卡按它自己的位置归档，<br />
                  姐妹卡第一次出现点亮。<br />
                  每天收下的碎片，<br />
                  最后会拼成一张完整地图。
                </p>
              </div>
              <button
                className="collection-page__draw-card"
                type="button"
                onClick={() => {
                  if (selected?.kind === "sister" && firstUnlockedTool) {
                    setSelected({ kind: "tool", file: firstUnlockedTool.file });
                  } else if (firstUnlockedSister) {
                    setSelected({ kind: "sister", name: firstUnlockedSister.name });
                  } else if (firstUnlockedTool) {
                    setSelected({ kind: "tool", file: firstUnlockedTool.file });
                  }
                }}
              >
                <span>✦</span>
                <i>🌙</i>
                <strong>{previewTitle}<br />{previewKind}<br />查看</strong>
                <span>✦</span>
              </button>
            </header>

            <div className="collection-page__metrics">
              <Metric icon="🌿" label="工具卡" value={`${unlockedToolCount} / ${state.toolSlots.length}`} />
              <Metric icon="🌸" label="我的姐妹" value={`${unlockedSisterCount} / ${state.sisterSlots.length + 1}`} />
            </div>

            <div className="collection-page__sections">
              {state.allComplete ? (
                <div className="collection-page__notice">你已经集齐全部神秘卡牌 ✓</div>
              ) : null}
              <CollectionSection
                title="工具卡"
                count={`${unlockedToolCount} / ${state.toolSlots.length} · 已解锁`}
                expanded={expanded.tool}
                help="什么是工具卡？"
                onToggle={() => setExpanded((value) => ({ ...value, tool: !value.tool }))}
                tone="tool"
              >
                {state.toolSlots.map((slot, index) => (
                  <button
                    className={`collection-page__slot collection-page__slot--tool ${slot.unlocked ? "is-unlocked" : "is-locked"}`}
                    key={slot.file}
                    onClick={() => slot.unlocked && setSelected({ kind: "tool", file: slot.file })}
                    type="button"
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{slot.unlocked ? slot.front.name : "🔒"}</strong>
                    {slot.unlocked ? <i>★</i> : null}
                  </button>
                ))}
              </CollectionSection>

              <CollectionSection
                title="我的姐妹"
                count={`${unlockedSisterCount} / ${state.sisterSlots.length + 1} · 已解锁`}
                expanded={expanded.sister}
                help="什么是姐妹卡？"
                onToggle={() => setExpanded((value) => ({ ...value, sister: !value.sister }))}
                tone="sister"
              >
                {state.sisterSlots.map((slot, index) => {
                  const profile = getSisterProfile(slot.name);
                  return (
                    <button
                      className={`collection-page__slot collection-page__slot--sister ${slot.unlocked ? "is-unlocked" : "is-locked"}`}
                      key={`${slot.name}-${slot.firstDay}`}
                      onClick={() => slot.unlocked && setSelected({ kind: "sister", name: slot.name })}
                      type="button"
                    >
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <i>{profile?.symbol ?? "🌿"}</i>
                      <strong>{slot.unlocked ? slot.name : "🔒"}</strong>
                    </button>
                  );
                })}
                <SelfCardSlot completedDay100={completedDays.includes(100)} selfCard={selfCard} onSave={handleSelfCard} />
              </CollectionSection>
            </div>
          </section>
        </section>
        {selected ? (
          <SelectedCardModal
            onClose={() => setSelected(null)}
            pairedTool={selectedPairedTool}
            selectedSister={selectedSister}
            selectedTool={selectedTool}
          />
        ) : null}
        {showFinale ? <FinaleOverlay onClose={() => setShowFinale(false)} /> : null}
      </main>
    </AuthGate>
  );
}

function SelectedCardModal({
  onClose,
  pairedTool,
  selectedSister,
  selectedTool,
}: {
  onClose: () => void;
  pairedTool: ReturnType<typeof buildCollectionState>["toolSlots"][number] | null | undefined;
  selectedSister: ReturnType<typeof buildCollectionState>["sisterSlots"][number] | null | undefined;
  selectedTool: ReturnType<typeof buildCollectionState>["toolSlots"][number] | null | undefined;
}) {
  const [showToolSide, setShowToolSide] = useState(Boolean(selectedTool?.unlocked));
  const toolCard = selectedTool?.unlocked ? selectedTool : pairedTool?.unlocked ? pairedTool : null;

  useEffect(() => {
    setShowToolSide(Boolean(selectedTool?.unlocked));
  }, [selectedSister?.name, selectedTool?.file, selectedTool?.unlocked]);

  if (toolCard && (showToolSide || !selectedSister?.unlocked)) {
    const content = cleanToolContent(toolCard.back.content);
    return (
      <div className="collection-modal" role="dialog" aria-modal="true">
        <article className="collection-modal__sheet collection-modal__sheet--tool">
          <button className="collection-modal__sheet-close" onClick={onClose} type="button">×</button>
          <div className="collection-modal__top-symbol">☾</div>
          <p className="collection-modal__day">工具卡 · Day {toolCard.day ?? "??"}</p>
          <h2>{toolCard.front.name}</h2>
          <p className="collection-modal__origin">{toolCard.front.description}</p>
          <div className="collection-modal__divider" />
          <div className="collection-modal__quote">
            <span>“</span>
            <strong>{toolCard.front.quote || "先把注意力带回自己。"}</strong>
            <span>”</span>
          </div>
          <section className="collection-modal__voice">
            <h3>这张工具卡想提醒你</h3>
            <div className="collection-modal__scroll-copy">
              {content.map((line) => <p key={line}>{line}</p>)}
            </div>
          </section>
          <section className="collection-modal__gift">
            <h3>适用时刻</h3>
            <div><span>◇</span><p>{toolCard.category}</p><i>✦</i></div>
          </section>
          <section className="collection-modal__keywords">
            <h3>关键词</h3>
            <div>{toolKeywords(toolCard).map((item) => <span key={item}>{item}</span>)}</div>
          </section>
          <div className="collection-modal__ornament"><i /><span>✿</span><i /></div>
          <button className="collection-modal__primary" onClick={onClose} type="button">♡ 收下工具卡</button>
          {selectedSister?.unlocked ? (
            <button className="collection-modal__secondary" onClick={() => setShowToolSide(false)} type="button">
              翻回姐妹卡
            </button>
          ) : <button className="collection-modal__secondary" onClick={onClose} type="button">回到集卡</button>}
        </article>
      </div>
    );
  }
  if (selectedSister?.unlocked) {
    const profile = getSisterProfile(selectedSister.name);
    const voiceLines = splitVoice((profile?.dailyVoice ?? selectedSister.quoteSource) || "她在这里。");
    const keywords = profile?.triggerKeywords ?? ["看见", "边界", "身体"];
    return (
      <div className="collection-modal" role="dialog" aria-modal="true">
        <article className="collection-modal__sheet collection-modal__sheet--sister">
          <button className="collection-modal__sheet-close" onClick={onClose} type="button">×</button>
          <div className="collection-modal__top-symbol">{profile?.symbol ?? "🌿"}</div>
          <p className="collection-modal__day">Day {String(selectedSister.firstDay).padStart(2, "0")} · 我的姐妹</p>
          <h2>{spacedName(selectedSister.name)}</h2>
          <p className="collection-modal__origin">第一次出现于 Day {String(selectedSister.firstDay).padStart(2, "0")} · {selectedSister.quoteSource || selectedSister.field}</p>
          <div className="collection-modal__divider" />
          <div className="collection-modal__quote">
            <span>“</span>
            <strong>{voiceLines[0] || "她在这里。"}</strong>
            <span>”</span>
          </div>
          <section className="collection-modal__voice">
            <h3>她今天对你说</h3>
            <div>
              {voiceLines.map((line) => <p key={line}>{line}</p>)}
              <small>—— 致 你</small>
            </div>
          </section>
          <section className="collection-modal__gift">
            <h3>她留给你的小礼物</h3>
            <div><span>◇</span><p>{profile?.gift?.replace(/^[^\p{L}\p{N}]+/u, "") || selectedSister.field}</p><i>✦</i></div>
          </section>
          <section className="collection-modal__keywords">
            <h3>触发关键词</h3>
            <div>{keywords.map((item) => <span key={item}>{item}</span>)}</div>
          </section>
          <div className="collection-modal__ornament"><i /><span>✿</span><i /></div>
          <button className="collection-modal__primary" onClick={onClose} type="button">♡ 收下这句话</button>
          {toolCard ? (
            <button className="collection-modal__secondary" onClick={() => setShowToolSide(true)} type="button">
              翻到工具卡
            </button>
          ) : <button className="collection-modal__secondary" onClick={onClose} type="button">回到集卡</button>}
        </article>
      </div>
    );
  }
  return (
    <div className="collection-modal" role="dialog" aria-modal="true">
      <button className="collection-modal__close" onClick={onClose} type="button">×</button>
      <div className="collection-modal__empty">
        <span>点一张已解锁的卡查看</span>
      </div>
    </div>
  );
}

function splitVoice(value: string) {
  return value.split(/\n+/).map((line) => line.trim().replace(/^[-—]+$/u, "——")).filter(Boolean).slice(0, 6);
}

function cleanToolContent(value: string) {
  return value
    .split(/\n+/)
    .map((line) => line
      .replace(/^#{1,6}\s*/u, "")
      .replace(/^[*\-]\s*/u, "")
      .replace(/\|+/g, " ")
      .replace(/📕|📘|📙|📗|🧠|【|】/gu, "")
      .replace(/\s+/g, " ")
      .trim())
    .filter((line) => line && !/^[-\s]+$/u.test(line))
    .slice(0, 8);
}

function toolKeywords(toolCard: ReturnType<typeof buildCollectionState>["toolSlots"][number]) {
  const words = [toolCard.front.name, toolCard.category, "练习", "看见"];
  return Array.from(new Set(words
    .map(cleanKeyword)
    .filter(Boolean))).slice(0, 5);
}

function cleanKeyword(value: string) {
  return value
    .replace(/^\d+(\.\d+)?\s*·?\s*/u, "")
    .replace(/三步$/u, "")
    .replace(/^[-—]+/u, "")
    .replace(/[-—]+$/u, "")
    .replace(/\s+/g, "")
    .slice(0, 6);
}

function spacedName(name: string) {
  return name.length === 2 ? name.split("").join(" ") : name;
}

function CollectionSection({
  children,
  count,
  expanded,
  help,
  onToggle,
  title,
  tone,
}: {
  children: React.ReactNode;
  count: string;
  expanded: boolean;
  help: string;
  onToggle: () => void;
  title: string;
  tone: "tool" | "sister";
}) {
  return (
    <section className={`collection-page__section collection-page__section--${tone} ${expanded ? "is-expanded" : ""}`}>
      <div className="collection-page__section-head">
        <div>
          <h2>{tone === "tool" ? "✓" : "✿"} {title}</h2>
          <span>{count}</span>
        </div>
        <small>{help} ⓘ</small>
      </div>
      <div className="collection-page__grid">{children}</div>
      <button className="collection-page__expand" onClick={onToggle} type="button">
        {expanded ? "收起部分卡牌 ▲" : "点击展开可浏览全部 ▼"}
      </button>
    </section>
  );
}

function Metric({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div>
      <i>{icon}</i>
      <p>{label}</p>
      <strong>{value}</strong>
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
      <button className="collection-page__slot collection-page__slot--sister is-unlocked" type="button">
        <span>37</span>
        <i>🪞</i>
        <strong>{selfCard.name}</strong>
      </button>
    );
  }
  return (
    <div className="collection-page__slot collection-page__slot--sister is-locked">
      <span>37</span>
      <i>🪞</i>
      <strong>你自己</strong>
      {completedDay100 ? (
        <>
          <button className="text-link bg-transparent text-xs" onClick={() => setOpen((value) => !value)} type="button">填写</button>
          {open ? <SelfCardForm onSave={onSave} /> : null}
        </>
      ) : (
        <em>锁</em>
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
