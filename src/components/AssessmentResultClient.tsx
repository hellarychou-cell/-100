"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ReportRadar } from "@/components/ReportRadar";
import {
  ASSESSMENT_DIMENSIONS,
  AssessmentResult,
  DimensionId,
  DimensionScore,
} from "@/lib/assessment";
import { LOCAL_PROFILE_KEY, LOCAL_RESULT_KEY } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

type StoredResult = {
  result: AssessmentResult;
  createdAt: string;
};

type Profile = {
  name?: string;
};

export function AssessmentResultClient() {
  const [stored, setStored] = useState<StoredResult | null>(null);
  const [profile, setProfile] = useState<Profile>({});
  const [loading, setLoading] = useState(true);

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
            supabase.from("profiles").select("display_name").eq("id", userData.user.id).maybeSingle(),
            supabase
              .from("assessments")
              .select("raw_total,total_score_100,dimension_scores,primary_mode,recommended_day,created_at")
              .eq("user_id", userData.user.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle(),
          ]);

          if (!cancelled) {
            if (profileData?.display_name) setProfile({ name: profileData.display_name });
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
    return ASSESSMENT_DIMENSIONS.map((dimension) => ({
      id: dimension.id,
      name: dimension.name,
      score: result.dimensionScores[dimension.id].raw,
      index: result.dimensionScores[dimension.id].index,
      text: buildDimensionText(dimension.name, result.dimensionScores[dimension.id].index),
    }));
  }, [result]);

  if (loading) {
    return <EmptyReport title="正在读取报告" text="稍等一下，正在打开你最近一次测评结果。" />;
  }

  if (!result) {
    return <EmptyReport title="还没有报告。" text="完成 42 题后，这里会生成你的雷达图、主模式和推荐起点。" />;
  }

  const name = profile.name || "她";

  return (
    <section className="grid min-h-0 grid-cols-[minmax(320px,.76fr)_minmax(470px,1fr)] overflow-hidden max-lg:grid-cols-1 max-lg:overflow-auto">
      <aside className="grid border-r border-[var(--line)] bg-paper/50 p-[clamp(22px,3vw,38px)] max-lg:border-b max-lg:border-r-0">
        <div>
          <div className="eyebrow mb-3">Personal report · 42 questions</div>
          <h1 className="display-title text-[clamp(44px,5.3vw,78px)]">
            {name}的
            <br />
            底层代码
            <br />
            诊断。
          </h1>
        </div>
        <div className="self-center">
          <div className="flex items-end gap-3">
            <strong className="text-[104px] font-normal leading-[.8]">{Math.round(result.totalScore100)}</strong>
            <span className="pb-3 sans text-sm text-[var(--muted)]">/ 100</span>
          </div>
          <p className="mt-5 max-w-md text-[17px] leading-[1.85] text-[#563a2e]">
            看见，是中女觉醒的第一步。这个分数不是给你贴标签，而是帮你知道：旧程序在哪里最用力。
          </p>
        </div>
        <div className="grid gap-3 self-end sans text-sm">
          <Link className="action-primary w-max" href="/home">
            进入我的100天
          </Link>
          <div className="relative leading-relaxed text-[var(--muted)]">
            系统建议你从{" "}
            <Link className="border-b border-clay text-clay" href={`/day/${result.recommendedDay}`}>
              Day {result.recommendedDay}
            </Link>{" "}
            开始；也可以直接进入完整 100 天目录。
            <Link className="text-link ml-2 inline-flex" href="/knowledge">
              查看目录
            </Link>
            <div className="mt-2 max-w-xs border border-[var(--line)] bg-soft p-3 text-xs leading-relaxed shadow-xl">
              为什么从这里开始：系统根据你的总分和维度分，选择一个相对稳的入口。
              <br />
              <Link className="text-link mt-2" href={`/day/${result.recommendedDay}`}>
                跳转到 Day {result.recommendedDay}
              </Link>
            </div>
          </div>
        </div>
      </aside>
      <section className="grid min-h-0 grid-rows-[auto_1fr] gap-4 overflow-auto p-[clamp(18px,2.4vw,30px)] max-lg:overflow-visible">
        <div className="grid grid-cols-[180px_1fr] items-center gap-6 max-sm:grid-cols-1">
          <div>
            <ReportRadar data={dimensionRows.map((row) => ({ name: row.name.slice(0, 2), value: row.index }))} />
            <p className="mt-2 border border-[var(--line)] bg-soft p-2 sans text-xs leading-relaxed text-[var(--muted)]">
              这张图显示 6 个维度的相对强弱。越外圈，代表这个旧程序越常被触发。
            </p>
          </div>
          <div className="border-y border-[var(--line)] py-5">
            <h2 className="m-0 text-4xl font-normal leading-none">主模式：{result.primaryMode}</h2>
            <p className="mt-3 leading-[1.75] text-[#563a2e]">{buildModeText(result.primaryMode)}</p>
            <details>
              <summary className="text-link mt-2 cursor-pointer list-none">展开完整解读</summary>
              <p className="mt-3 leading-[1.75] text-[#563a2e]">
                接下来最重要的，不是立刻推翻自己，而是先在每天的小场景里看见旧程序。你可以先学习识别“这一刻到底是谁在替我做决定”。
              </p>
            </details>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="pill">推荐起点：Day {result.recommendedDay}</span>
              <span className="pill">测评时间：{stored ? new Date(stored.createdAt).toLocaleDateString("zh-CN") : "今天"}</span>
            </div>
          </div>
        </div>
        <section className="grid grid-cols-2 gap-x-5 max-sm:grid-cols-1">
          {dimensionRows.map((dimension) => (
            <details key={dimension.id} className="border-t border-[var(--line)] py-2">
              <summary className="grid cursor-pointer list-none grid-cols-[1fr_auto] items-center gap-3">
                <div className="grid gap-2 sans text-xs text-[var(--muted)]">
                  <div className="flex justify-between">
                    <span>{dimension.name}</span>
                    <span>{dimension.score}/35</span>
                  </div>
                  <div className="progress-track">
                    <i className="progress-fill" style={{ width: `${dimension.index}%` }} />
                  </div>
                </div>
                <span className="grid h-6 w-6 place-items-center rounded-full border border-[var(--line)] text-clay">+</span>
              </summary>
              <p className="m-0 pt-2 text-sm leading-relaxed text-[#563a2e]">{dimension.text}</p>
            </details>
          ))}
        </section>
      </section>
    </section>
  );
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

function buildModeText(mode: string) {
  if (mode === "讨好型") return "你的系统很擅长照顾别人，也很容易把别人的反应当成自己的责任。";
  if (mode === "证明型") return "你很容易把价值感放在结果上，好像必须不断做到，才允许自己安心。";
  if (mode === "失权型") return "你可能习惯先看别人怎么想，再决定自己可不可以要。";
  if (mode === "高敏内耗型") return "你对细节和关系氛围很敏锐，也容易因此消耗太多精力。";
  if (mode === "冻结拖延型") return "你不是没有能力行动，而是重要的事会先触发紧张和迟疑。";
  if (mode === "财富收缩型") return "你向往拥有更多，但身体里也可能同时运行着不配得和不安全。";
  return "你的六个维度交织在一起，报告会帮你找到最适合先打开的入口。";
}

function buildDimensionText(name: string, index: number) {
  if (index >= 70) return `${name}是目前很容易被触发的位置。先不用急着改变，先学习在日常里抓到它出现的那一秒。`;
  if (index >= 40) return `${name}处在中间区间，说明你已经有一些觉察，但遇到特定关系或压力时仍会被旧程序带走。`;
  return `${name}目前相对稳定，可以作为你进入 100 天练习时的支撑点。`;
}
