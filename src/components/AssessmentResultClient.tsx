"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AssessmentReportView } from "@/components/AssessmentReportView";
import {
  AssessmentResult,
  DimensionId,
  DimensionScore,
} from "@/lib/assessment";
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

  if (loading) {
    return <EmptyReport title="正在读取报告" text="稍等一下，正在打开你最近一次测评结果。" />;
  }

  const result = stored?.result;
  if (!result) {
    return <EmptyReport title="还没有报告。" text="完成 42 题后，这里会生成你的雷达图、主模式和推荐起点。" />;
  }

  const createdAt = stored ? new Date(stored.createdAt) : new Date();

  async function startJourney(day: number) {
    const nextProgress = startProgressFromDay(day);
    window.localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(nextProgress));

    if (supabase) {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const payload = {
          user_id: data.user.id,
          current_day: nextProgress.currentDay,
          completed_days: nextProgress.completedDays,
          cards_collected: 0,
          journey_start_day: nextProgress.journeyStartDay,
          journey_start_date: nextProgress.journeyStartDate,
        };
        const { error } = await supabase.from("progress").upsert(payload);
        if (error) {
          await supabase.from("progress").upsert({
            user_id: data.user.id,
            current_day: nextProgress.currentDay,
            completed_days: nextProgress.completedDays,
            cards_collected: 0,
          });
        }
      }
    }

    router.push("/home");
  }

  return (
    <section className="assessment-report min-h-0 overflow-auto">
      <AssessmentReportView
        actionsSlot={
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
        }
        createdAt={createdAt}
        profile={profile}
        reportRef={reportRef}
        result={result}
        saveMessage={saveMessage}
      />
    </section>
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
