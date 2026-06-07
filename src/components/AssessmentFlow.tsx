"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ASSESSMENT_DIMENSIONS,
  AssessmentAnswers,
  calculateAssessmentResult,
} from "@/lib/assessment";
import { LOCAL_RESULT_KEY } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export function AssessmentFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswers>({});
  const [message, setMessage] = useState("");
  const dimension = ASSESSMENT_DIMENSIONS[step];
  const answeredCount = Object.keys(answers).length;
  const isLastStep = step === ASSESSMENT_DIMENSIONS.length - 1;
  const stepComplete = dimension.questions.every((question) => answers[question.id]);

  const progress = useMemo(() => Math.round((answeredCount / 42) * 100), [answeredCount]);

  function setAnswer(questionId: string, value: number) {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  }

  async function goNext() {
    setMessage("");
    if (!stepComplete) {
      setMessage("这一页还有题没有选。慢一点没关系，但要答完整。");
      return;
    }

    if (!isLastStep) {
      setStep((current) => current + 1);
      return;
    }

    try {
      const result = calculateAssessmentResult(answers);
      const payload = { answers, result, createdAt: new Date().toISOString() };
      window.localStorage.setItem(LOCAL_RESULT_KEY, JSON.stringify(payload));

      if (supabase) {
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          await supabase.from("assessments").insert({
            user_id: data.user.id,
            answers,
            raw_total: result.rawTotal,
            total_score_100: result.totalScore100,
            dimension_scores: result.dimensionScores,
            primary_mode: result.primaryMode,
            recommended_day: result.recommendedDay,
          });
          await supabase.from("progress").upsert({
            user_id: data.user.id,
            current_day: result.recommendedDay,
          });
        }
      }

      router.push("/assessment/result");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "测评结果生成失败，请再试一次。");
    }
  }

  return (
    <section className="grid min-h-0 grid-cols-[300px_1fr] overflow-hidden max-lg:grid-cols-1 max-lg:overflow-auto">
      <aside className="grid border-r border-[var(--line)] bg-paper/50 p-[clamp(22px,3vw,36px)] max-lg:border-b max-lg:border-r-0">
        <div>
          <div className="eyebrow mb-3">Assessment · Step {step + 1} / 6</div>
          <h1 className="display-title text-[clamp(38px,4.4vw,62px)]">{dimension.name}</h1>
        </div>
        <p className="self-center text-base leading-[1.85] text-[#563a2e] max-lg:hidden">
          请根据你的真实感受选择。没有对错，越真实，报告越贴近你。
        </p>
        <div className="self-end">
          <div className="mb-2 flex justify-between sans text-xs text-[var(--muted)]">
            <span>当前维度 {step + 1} / 6</span>
            <span>已完成 {answeredCount} / 42</span>
          </div>
          <div className="progress-track">
            <i className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </aside>
      <section className="grid min-h-0 grid-rows-[auto_1fr_auto] gap-4 overflow-hidden p-[clamp(18px,2.5vw,32px)] max-lg:overflow-visible">
        <div className="flex items-end justify-between gap-5 border-b border-[var(--line)] pb-4 max-sm:grid">
          <h2 className="m-0 text-4xl font-normal leading-none">{dimension.subtitle}</h2>
          <div className="sans text-xs text-[var(--muted)]">左：完全不符 · 右：完全符合</div>
        </div>
        <section className="grid min-h-0 grid-rows-[repeat(7,minmax(0,1fr))] gap-1.5">
          {dimension.questions.map((question) => (
            <div
              key={question.id}
              className="grid grid-cols-[1fr_250px] items-center gap-4 border-b border-ink/10 py-1 max-sm:grid-cols-1"
            >
              <div className="text-base leading-normal text-[#3f281f]">{question.text}</div>
              <Slider active={answers[question.id]} name={question.id} onChange={(value) => setAnswer(question.id, value)} />
            </div>
          ))}
        </section>
        <div className="flex items-center justify-between gap-4 border-t border-[var(--line)] pt-4">
          <div className="flex gap-4">
            <Link className="text-link" href="/assessment/profile">
              基础信息
            </Link>
            {step > 0 ? (
              <button className="text-link bg-transparent" onClick={() => setStep((current) => current - 1)} type="button">
                上一维度
              </button>
            ) : null}
          </div>
          <div className="flex items-center gap-4">
            {message ? <span className="sans text-xs text-clay">{message}</span> : null}
            <button className="action-primary" onClick={goNext} type="button">
              {isLastStep ? "生成报告" : "下一维度"}
            </button>
          </div>
        </div>
      </section>
    </section>
  );
}

function Slider({
  active,
  name,
  onChange,
}: {
  active?: number;
  name: string;
  onChange: (value: number) => void;
}) {
  return (
    <fieldset className="grid gap-1">
      <legend className="sr-only">请选择符合程度</legend>
      <div className="relative flex h-6 items-center">
        <div className="absolute left-2 right-2 h-px bg-ink/30" />
        <div className="relative z-10 grid w-full grid-cols-5">
          {[1, 2, 3, 4, 5].map((value) => (
            <label key={value} className="group mx-auto grid h-6 w-6 cursor-pointer place-items-center" title={`${value} 分`}>
              <input
                checked={active === value}
                className="peer sr-only"
                name={name}
                onChange={() => onChange(value)}
                type="radio"
                value={value}
              />
              <span className="h-2.5 w-2.5 rounded-full border border-ink/30 bg-soft transition group-hover:h-4 group-hover:w-4 peer-checked:h-5 peer-checked:w-5 peer-checked:bg-ink peer-checked:shadow-[0_0_0_5px_rgba(156,96,72,.12)]" />
            </label>
          ))}
        </div>
      </div>
      <div className="flex justify-between sans text-[10px] text-[var(--muted)]">
        <span>完全不符</span>
        <span>完全符合</span>
      </div>
    </fieldset>
  );
}
