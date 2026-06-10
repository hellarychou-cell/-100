"use client";

import Link from "next/link";
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
import { LOCAL_PROFILE_KEY, LOCAL_RESULT_KEY } from "@/lib/auth";
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
  const [stored, setStored] = useState<StoredResult | null>(null);
  const [profile, setProfile] = useState<Profile>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    function onSave() {
      void saveReportImage(reportRef.current, setSaving);
    }

    window.addEventListener("save-assessment-report", onSave);
    return () => window.removeEventListener("save-assessment-report", onSave);
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

  return (
    <section className="min-h-0 overflow-auto bg-[#f4e6d2]/45 p-[clamp(14px,2.4vw,28px)]">
      <article
        ref={reportRef}
        className="mx-auto grid max-w-6xl gap-6 border border-[#d8b98a] bg-[#fffaf1] p-[clamp(18px,3vw,34px)] text-[#3f281f] shadow-[0_18px_70px_rgba(63,40,31,.12)]"
      >
        <header className="grid grid-cols-[1fr_auto] gap-4 border-b border-[#d8b98a]/70 pb-5 max-sm:grid-cols-1">
          <div>
            <div className="eyebrow mb-3">Bottom Layer Code Diagnosis Report</div>
            <h1 className="font-serif text-[clamp(42px,6vw,82px)] font-normal leading-[.92]">
              底层代码
              <br />
              诊断报告
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-[1.9] text-[#6c4a3a]">
              看见，就是改变的开始。这份报告不是给你贴标签，而是帮你看见那些一直在后台替你做决定的旧程序。
            </p>
          </div>
          <div className="grid content-between justify-items-end gap-4 text-right max-sm:justify-items-start max-sm:text-left">
            <div>
              <div className="sans text-xs text-[var(--muted)]">报告对象</div>
              <strong className="block font-serif text-4xl font-normal">{name}</strong>
              <span className="sans text-xs text-clay">
                {profile.age ? `${profile.age} · ` : ""}
                {profile.identity || "未填写身份"}
              </span>
            </div>
            <button
              className="no-print action-primary !bg-[#5b382c]"
              disabled={saving}
              onClick={() => void saveReportImage(reportRef.current, setSaving)}
              type="button"
            >
              {saving ? "正在生成图片" : "保存报告图片"}
            </button>
          </div>
        </header>

        <section className="grid grid-cols-[minmax(270px,.8fr)_1.2fr] gap-6 max-lg:grid-cols-1">
          <aside className="grid content-start gap-5 border-r border-[#d8b98a]/60 pr-6 max-lg:border-b max-lg:border-r-0 max-lg:pb-5 max-lg:pr-0">
            <section className="grid gap-4">
              <div className="grid grid-cols-[180px_1fr] items-center gap-5 max-sm:grid-cols-1">
                <ReportRadar data={dimensionRows.map((row) => ({ name: row.name.slice(0, 2), value: row.index }))} />
                <div>
                  <div className="sans text-xs text-[var(--muted)]">总分</div>
                  <div className="flex items-end gap-2">
                    <strong className="text-[78px] font-normal leading-none">{result.rawTotal}</strong>
                    <span className="pb-2 sans text-sm text-[var(--muted)]">/ 180</span>
                  </div>
                  <span className="pill !border-[#d8b98a] !bg-[#f7ead8]">{summary.title}</span>
                </div>
              </div>
              <div className="grid gap-3 border-y border-[#d8b98a]/60 py-4">
                <ReportFact label="底层代码模式" value={result.primaryMode} />
                <ReportFact label="核心信念" value={modeInsight.coreCode} />
                <ReportFact label="人格成熟度" value={summary.maturity} />
                <ReportFact label="内在小苗苗" value={summary.seedling} />
              </div>
              {profile.currentIssue || profile.idealState ? (
                <div className="grid gap-3 text-sm leading-relaxed text-[#563a2e]">
                  {profile.currentIssue ? <ReportNote label="我当下最想解决的问题" text={String(profile.currentIssue)} /> : null}
                  {profile.idealState ? <ReportNote label="我想抵达的状态" text={String(profile.idealState)} /> : null}
                </div>
              ) : null}
            </section>

            <section className="grid gap-3">
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

          <section className="grid content-start gap-5">
            <section className="grid gap-2">
              <div className="flex items-end justify-between gap-3 border-b border-[#d8b98a]/60 pb-2">
                <div>
                  <div className="eyebrow mb-1">Six dimensions</div>
                  <h2 className="m-0 text-3xl font-normal leading-none">六维度解读</h2>
                </div>
                <span className="sans text-xs text-[var(--muted)]">点击小三角展开</span>
              </div>
              <div className="grid gap-2">
                {dimensionRows.map((dimension) => (
                  <details key={dimension.id} className="group border border-[#d8b98a]/55 bg-[#fff4df]/60">
                    <summary className="grid cursor-pointer list-none grid-cols-[1fr_auto] items-center gap-4 p-3">
                      <div className="grid gap-2">
                        <div className="flex items-center justify-between gap-3">
                          <strong className="font-serif text-lg font-normal">{dimension.name}</strong>
                          <span className="sans text-xs text-clay">{dimension.score}/35 · {dimension.interpretation.title}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[#5b382c]/10">
                          <i className="block h-full rounded-full bg-gradient-to-r from-[#8f6042] to-[#c99a5b]" style={{ width: `${dimension.index}%` }} />
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

            <section className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
              <InsightCard
                label="核心内耗源"
                title={`${top[0]?.name ?? ""} + ${top[1]?.name ?? ""}`}
                text={`${top[0]?.name ?? "最高维度"}和${top[1]?.name ?? "第二高维度"}是目前最容易被触发的位置，代表你最需要先看见的旧程序组合。`}
              />
              <InsightCard
                label="优势区域"
                title={low?.name ?? "稳定维度"}
                text={low ? `${low.name}是你当前相对稳定的支撑点，可以作为进入100天练习时的内在资源。` : "你的稳定维度会在这里显示。"}
              />
            </section>

            <section className="grid gap-3 border border-[#d8b98a]/70 bg-[#f7ead8]/70 p-4">
              <div className="eyebrow">三句话给你</div>
              <div className="grid gap-2">
                {modeInsight.lines.map((line, index) => (
                  <p key={line} className="m-0 border-l border-[#5b382c]/40 pl-3 text-sm leading-[1.8] text-[#563a2e]">
                    {index + 1}. {line}
                  </p>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-[1fr_auto] items-end gap-4 border-t border-[#d8b98a]/70 pt-4 max-sm:grid-cols-1">
              <div className="grid gap-3">
                <p className="m-0 text-sm leading-[1.85] text-[#563a2e]">
                  你的底层代码诊断报告已经生成。你看到了自己的隐形内耗来源，也看到了那些一直在替你做决定的旧程序。
                  如果你想更深入地了解你的底层代码，拆掉那些卡住你的旧程序，可以预约1v1底层代码解读。
                </p>
                <div className="flex flex-wrap gap-3 no-print">
                  <Link className="action-primary !bg-[#5b382c]" href={`/day/${result.recommendedDay}`}>
                    开启我的100天旅程
                  </Link>
                  <button
                    className="action-ghost"
                    disabled={saving}
                    onClick={() => void saveReportImage(reportRef.current, setSaving)}
                    type="button"
                  >
                    {saving ? "正在生成图片" : "保存图片"}
                  </button>
                </div>
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

        <footer className="flex items-center justify-between gap-4 border-t border-[#d8b98a]/70 pt-4 sans text-[10px] uppercase tracking-[0.14em] text-[var(--muted)] max-sm:flex-col max-sm:items-start">
          <span>成她100 · 底层代码重写系统</span>
          <span>报告编号：{reportId} · {createdAt.toLocaleDateString("zh-CN")}</span>
        </footer>
      </article>
    </section>
  );
}

const qrBlocks = new Set([0, 1, 2, 4, 5, 7, 8, 10, 12, 14, 16, 17, 19, 20, 22, 23, 24]);

function ReportFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[96px_1fr] gap-3 text-sm">
      <span className="sans text-xs text-[var(--muted)]">{label}</span>
      <strong className="font-normal text-[#3f281f]">{value}</strong>
    </div>
  );
}

function ReportNote({ label, text }: { label: string; text: string }) {
  return (
    <div className="border border-[#d8b98a]/55 bg-[#fff4df]/60 p-3">
      <div className="sans mb-1 text-[10px] uppercase tracking-[0.14em] text-clay">{label}</div>
      <p className="m-0">{text}</p>
    </div>
  );
}

function InsightCard({ label, text, title }: { label: string; text: string; title: string }) {
  return (
    <div className="border border-[#d8b98a]/55 bg-[#fff4df]/60 p-4">
      <div className="eyebrow mb-2">{label}</div>
      <h3 className="m-0 text-2xl font-normal leading-tight">{title}</h3>
      <p className="mb-0 mt-2 text-sm leading-[1.75] text-[#563a2e]">{text}</p>
    </div>
  );
}

async function saveReportImage(element: HTMLElement | null, setSaving: (saving: boolean) => void) {
  if (!element) return;
  setSaving(true);
  try {
    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(element, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#fffaf1",
      filter: (node) => !(node instanceof HTMLElement && node.classList.contains("no-print")),
    });
    const link = document.createElement("a");
    link.download = `成她100-底层代码诊断报告-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error(error);
    window.print();
  } finally {
    setSaving(false);
  }
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
