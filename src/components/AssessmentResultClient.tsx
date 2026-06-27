"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ReportRadar } from "@/components/ReportRadar";
import {
  ASSESSMENT_DIMENSIONS,
  AssessmentResult,
  DimensionId,
  DimensionScore,
} from "@/lib/assessment";
import {
  getDimensionInterpretation,
  getModeInsight,
  getReportSummary,
  getTopAndLowDimensions,
} from "@/lib/assessment-report-copy";
import { LOCAL_PROFILE_KEY, LOCAL_PROGRESS_KEY, LOCAL_RESULT_KEY } from "@/lib/auth";
import { saveElementAsPng } from "@/lib/export-image";
import { startProgressFromDay } from "@/lib/progress";
import { supabase } from "@/lib/supabase";

type StoredResult = {
  result: AssessmentResult;
  createdAt: string;
};

type Profile = {
  age?: string | number | null;
  currentIssue?: string | null;
  idealState?: string | null;
  identity?: string | null;
  name?: string;
};

export function AssessmentResultClient() {
  const router = useRouter();
  const [stored, setStored] = useState<StoredResult | null>(null);
  const [profile, setProfile] = useState<Profile>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const reportRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const localProfile = readJson<Profile>(LOCAL_PROFILE_KEY);
      const localResult = readJson<StoredResult>(LOCAL_RESULT_KEY);
      if (!cancelled) {
        setProfile(localProfile ?? {});
        if (localResult?.result) setStored(localResult);
      }

      if (supabase) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const [{ data: profileData }, { data: assessmentData }] = await Promise.all([
            supabase
              .from("profiles")
              .select("display_name,age,identity,current_issue,ideal_state")
              .eq("id", userData.user.id)
              .maybeSingle(),
            supabase
              .from("assessments")
              .select("raw_total,total_score_100,dimension_scores,primary_mode,recommended_day,created_at")
              .eq("user_id", userData.user.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle(),
          ]);

          if (!cancelled) {
            if (profileData) {
              setProfile({
                age: profileData.age,
                currentIssue: profileData.current_issue,
                idealState: profileData.ideal_state,
                identity: profileData.identity,
                name: profileData.display_name,
              });
            }
            if (assessmentData) {
              setStored({
                createdAt: assessmentData.created_at,
                result: {
                  rawTotal: assessmentData.raw_total,
                  totalScore100: Number(assessmentData.total_score_100),
                  dimensionScores: assessmentData.dimension_scores as Record<DimensionId, DimensionScore>,
                  primaryMode: assessmentData.primary_mode,
                  recommendedDay: assessmentData.recommended_day,
                },
              });
            }
          }
        }
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const result = stored?.result;
  const dimensionRows = useMemo(() => {
    if (!result) return [];
    return ASSESSMENT_DIMENSIONS.map((dimension) => {
      const score = result.dimensionScores[dimension.id];
      return {
        id: dimension.id,
        interpretation: getDimensionInterpretation(dimension.id, score.index),
        name: dimension.name,
        score: score.raw,
        index: score.index,
      };
    });
  }, [result]);

  if (loading) {
    return <EmptyReport title="正在读取报告" text="稍等一下，正在打开你最近一次测评结果。" />;
  }

  if (!result) {
    return <EmptyReport title="还没有报告。" text="完成 42 题后，这里会生成你的雷达图、主模式和推荐起点。" />;
  }

  const name = profile.name || "她";
  const createdAt = stored ? new Date(stored.createdAt) : new Date();
  const reportId = `BLC-${formatDateId(createdAt)}-${Math.abs(result.rawTotal * 37 + Math.round(result.totalScore100)).toString(36).toUpperCase()}`;
  const summary = getReportSummary(result.rawTotal);
  const modeInsight = getModeInsight(result.primaryMode);
  const { top, low } = getTopAndLowDimensions(dimensionRows);
  const dimensionPresentation: Record<DimensionId, { symbol: string; tone: string }> = {
    "self-worth": { symbol: "✦", tone: "rose" },
    boundaries: { symbol: "⌁", tone: "clay" },
    decision: { symbol: "◉", tone: "gold" },
    emotion: { symbol: "☾", tone: "blue" },
    action: { symbol: "↗", tone: "sage" },
    wealth: { symbol: "◇", tone: "amber" },
  };

  async function startJourney(day: number) {
    const nextProgress = startProgressFromDay(day);
    window.localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(nextProgress));

    if (supabase) {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        await supabase.from("progress").upsert({
          user_id: data.user.id,
          current_day: nextProgress.currentDay,
          completed_days: nextProgress.completedDays,
          cards_collected: 0,
        });
      }
    }

    router.push("/home");
  }

  return (
    <section className="assessment-report min-h-0 overflow-auto">
      <article
        ref={reportRef}
        className="assessment-report__paper"
      >
        <header className="assessment-report__header">
          <div>
            <div className="eyebrow mb-3">Life Theme Assessment Report</div>
            <h1 className="font-serif text-[clamp(42px,6vw,82px)] font-normal leading-[.92]">
              人生母题 <span>/</span>
              <br />
              对照表
            </h1>
            <p className="assessment-report__meta">
              报告编号：{reportId} · {createdAt.toLocaleDateString("zh-CN")}
            </p>
          </div>
          <div className="assessment-report__object">
            <div>
              <div className="sans text-xs text-[var(--muted)]">报告对象</div>
              <strong className="block font-serif text-4xl font-normal">{name}</strong>
            </div>
          </div>
        </header>

        <section className="assessment-report__summary-grid">
          <aside className="assessment-report__overview">
            <section className="assessment-report__score">
              <div className="assessment-report__score-visual">
                <div className="assessment-report__score-total">
                  <div className="assessment-report__score-labels">
                    <span>总分</span>
                    <strong className="assessment-report__severity">{summary.title}</strong>
                    <button
                      aria-label="查看分数说明"
                      className="assessment-report__help"
                      title="分数越高，代表旧程序带来的隐形内耗越明显。"
                      type="button"
                    >?</button>
                  </div>
                  <div className="flex items-end gap-2">
                    <strong className="text-[78px] font-normal leading-none">{result.rawTotal}</strong>
                    <span className="pb-2 sans text-sm text-[var(--muted)]">/ 180</span>
                  </div>
                </div>
                <ReportRadar data={dimensionRows.map((row) => ({ name: row.name.slice(0, 2), value: row.index }))} showHelp={false} />
              </div>
              <div className="assessment-report__facts">
                <ReportFact icon="✦" label="底层代码模式" value={result.primaryMode} />
                <ReportFact icon="◇" label="核心信念" value={modeInsight.coreCode} />
                <ReportFact icon="☾" label="人格成熟度" value={summary.maturity} />
                <ReportFact icon="🌱" label="内在小苗苗" value={summary.seedling} />
              </div>
            </section>

            <section className="assessment-report__insight">
              <div className="eyebrow">核心洞察</div>
              <p className="m-0 text-sm leading-[1.85] text-[#563a2e]">{summary.bottomCode}</p>
              {summary.likelyPatterns ? (
                <ul className="m-0 grid gap-2 p-0">
                  {summary.likelyPatterns.map((pattern) => (
                    <li key={pattern} className="list-none border-l border-clay/50 pl-3 text-sm leading-relaxed text-[#563a2e]">
                      {pattern}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          </aside>

          <section className="assessment-report__details">
            <section className="assessment-report__dimensions">
              <div className="flex items-end justify-between gap-3 border-b border-[#d8b98a]/60 pb-2">
                <div>
                  <div className="eyebrow mb-1">Six dimensions</div>
                  <h2 className="m-0 text-3xl font-normal leading-none">六维度解读</h2>
                </div>
                <span className="sans text-xs text-[var(--muted)]">点击小三角展开</span>
              </div>
              <div className="grid gap-2">
                {dimensionRows.map((dimension) => (
                  <details key={dimension.id} className={`group assessment-report__dimension assessment-report__dimension--${dimensionPresentation[dimension.id].tone}`}>
                    <summary className="grid cursor-pointer list-none grid-cols-[1fr_auto] items-center gap-4 p-3">
                      <div className="grid gap-2">
                        <div className="flex items-center justify-between gap-3">
                          <strong className="font-serif text-lg font-normal"><span className="assessment-report__dimension-symbol" aria-hidden>{dimensionPresentation[dimension.id].symbol}</span>{dimension.name}</strong>
                          <span className="sans text-xs text-clay">{dimension.score}/35 · {dimension.interpretation.title}</span>
                        </div>
                        <div className="assessment-report__dimension-track">
                          <i style={{ width: `${dimension.index}%` }} />
                        </div>
                      </div>
                      <span className="grid h-8 w-8 place-items-center border border-[#d8b98a] text-clay transition group-open:rotate-90">›</span>
                    </summary>
                    <div className="border-t border-[#d8b98a]/50 p-3 text-sm leading-[1.85] text-[#563a2e]">
                      <p className="m-0">{dimension.interpretation.body}</p>
                      {dimension.interpretation.drain ? (
                        <p className="mb-0 mt-2 text-[#7a563f]">隐形内耗来源：{dimension.interpretation.drain}</p>
                      ) : null}
                    </div>
                  </details>
                ))}
              </div>
            </section>

            <section className="assessment-report__insight-cards">
              <InsightCard
                tone="drain"
                label="核心内耗源"
                title={`${top[0]?.name ?? ""} + ${top[1]?.name ?? ""}`}
                text={`${top[0]?.name ?? "最高维度"}和${top[1]?.name ?? "第二高维度"}是目前最容易被触发的位置，代表你最需要先看见的旧程序组合。`}
              />
              <InsightCard
                tone="strength"
                label="优势区域"
                title={low?.name ?? "稳定维度"}
                text={low ? `${low.name}是你当前相对稳定的支撑点，可以作为进入100天练习时的内在资源。` : "你的稳定维度会在这里显示。"}
              />
            </section>

            <section className="assessment-report__three-lines">
              <div className="eyebrow">三句话给你</div>
              <div className="grid gap-2">
                {modeInsight.lines.map((line, index) => (
                  <p key={line} className="m-0 border-l border-[#5b382c]/40 pl-3 text-sm leading-[1.8] text-[#563a2e]">
                    {index + 1}. {line}
                  </p>
                ))}
              </div>
            </section>

            <section className="assessment-report__actions">
              <div className="grid gap-3">
                <p className="m-0 text-sm leading-[1.85] text-[#563a2e]">
                  你的底层代码诊断报告已经生成。你看到了自己的隐形内耗来源，也看到了那些一直在替你做决定的旧程序。
                  如果你想更深入地了解你的底层代码，拆掉那些卡住你的旧程序，可以预约1v1底层代码解读。
                </p>
                <div className="flex flex-wrap gap-3 no-print">
                  <button className="action-primary !bg-[#5b382c]" onClick={() => void startJourney(1)} type="button">
                    开始我的100天
                  </button>
                  <button className="action-ghost" onClick={() => void startJourney(result.recommendedDay)} type="button">
                    建议从 Day {result.recommendedDay} 开始
                  </button>
                  <button
                    className="action-ghost"
                    disabled={saving}
                    onClick={() => void saveReportImage(reportRef.current, setSaving, setSaveMessage)}
                    type="button"
                  >
                    {saving ? "正在生成图片" : "保存图片"}
                  </button>
                </div>
                {saveMessage ? <p className="assessment-report__save-message">{saveMessage}</p> : null}
              </div>
              <div className="grid justify-items-center gap-2">
                <div className="grid h-20 w-20 grid-cols-5 grid-rows-5 gap-1 border border-[#d8b98a] bg-soft p-2">
                  {Array.from({ length: 25 }, (_, index) => (
                    <span key={index} className={qrBlocks.has(index) ? "bg-[#5b382c]" : "bg-transparent"} />
                  ))}
                </div>
                <span className="sans text-[10px] text-[var(--muted)]">扫码预约解读</span>
              </div>
            </section>
          </section>
        </section>

        <footer className="assessment-report__footer">
          <span>成她100 · 底层代码重写系统</span>
          <span>报告编号：{reportId} · {createdAt.toLocaleDateString("zh-CN")}</span>
        </footer>
      </article>
    </section>
  );
}

const qrBlocks = new Set([0, 1, 2, 4, 5, 7, 8, 10, 12, 14, 16, 17, 19, 20, 22, 23, 24]);

function ReportFact({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="grid grid-cols-[96px_1fr] gap-3 text-sm">
      <span className="sans text-xs text-[var(--muted)]"><i className="assessment-report__fact-icon" aria-hidden>{icon}</i>{label}</span>
      <strong className="font-normal text-[#3f281f]">{value}</strong>
    </div>
  );
}

function InsightCard({ label, text, title, tone }: { label: string; text: string; title: string; tone: "drain" | "strength" }) {
  return (
    <div className={`assessment-report__insight-card is-${tone}`}>
      <div className="eyebrow mb-2">{label}</div>
      <h3 className="m-0 text-2xl font-normal leading-tight">{title}</h3>
      <p className="mb-0 mt-2 text-sm leading-[1.75] text-[#563a2e]">{text}</p>
    </div>
  );
}

async function saveReportImage(
  element: HTMLElement | null,
  setSaving: (saving: boolean) => void,
  setSaveMessage: (message: string) => void,
) {
  setSaving(true);
  setSaveMessage("");
  const result = await saveElementAsPng({
    backgroundColor: "#fffaf1",
    element,
    fileName: `成她100-底层代码诊断报告-${Date.now()}.png`,
    filter: (node) => !node.classList.contains("no-print"),
  });
  setSaveMessage(result.ok ? "报告图片已生成，浏览器会自动下载。" : result.message);
  setSaving(false);
}

function EmptyReport({ title, text }: { title: string; text: string }) {
  return (
    <section className="grid min-h-0 place-items-center p-8 text-center">
      <div className="max-w-xl">
        <div className="eyebrow mb-4">Assessment report</div>
        <h1 className="display-title text-[clamp(48px,7vw,86px)]">{title}</h1>
        <p className="mx-auto mt-4 max-w-md leading-[1.85] text-[#563a2e]">{text}</p>
        <Link className="action-primary mt-6 inline-flex" href="/assessment/profile">
          去完成测评
        </Link>
      </div>
    </section>
  );
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

function formatDateId(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}
