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
        }
      }

      router.push("/assessment/result");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "测评结果生成失败，请再试一次。");
    }
  }

  return (
    <section className="assessment-flow">
      <header className="assessment-flow__header">
        <div className="assessment-flow__eyebrow">Assessment · Step {step + 1} / 6</div>
        <h1>{dimension.name}</h1>
        <p>{dimension.subtitle}</p>
        <details className="assessment-flow__guide">
          <summary>人生母题测评引导语</summary>
          <p>
            这不是一份普通的心理测试。请根据你最近半年的真实状态作答；没有对错，越真实越准确。
            这 42 道题会帮你看见那些你以为“本来就是我”的反应，也就是你的底层代码。
          </p>
        </details>
        <div className="assessment-flow__progress-copy">
          <span>当前维度 {step + 1} / 6</span>
          <span>已完成 {answeredCount} / 42</span>
        </div>
        <div className="progress-track">
          <i className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <div className="assessment-flow__scale-guide">
        <span>← 左：完全不符</span><i>·</i><span>右：完全符合 →</span>
      </div>

      <section className="assessment-flow__questions">
          {dimension.questions.map((question, index) => (
            <article key={question.id} className="assessment-flow__question">
              <div className="assessment-flow__question-copy">
                <span className="assessment-flow__question-number">{index + 1}</span>
                <p>{question.text}</p>
              </div>
              <Slider active={answers[question.id]} name={question.id} onChange={(value) => setAnswer(question.id, value)} />
            </article>
          ))}
      </section>

      <footer className="assessment-flow__footer">
          <div className="assessment-flow__back-actions">
            <Link className="text-link" href="/assessment/profile">
              ▧　基础信息
            </Link>
            {step > 0 ? (
              <button className="text-link bg-transparent" onClick={() => setStep((current) => current - 1)} type="button">
                上一维度
              </button>
            ) : null}
          </div>
          <div className="assessment-flow__next-actions">
            {message ? <span className="sans text-xs text-clay">{message}</span> : null}
            <button className="action-primary" onClick={goNext} type="button">
              {isLastStep ? "生成报告" : "下一维度"}
            </button>
          </div>
      </footer>
      <p className="assessment-flow__footnote">⌁ 一个维度共 7 题，请如实作答。</p>
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
    <fieldset className="assessment-flow__slider">
      <legend className="sr-only">请选择符合程度</legend>
      <div className="assessment-flow__slider-track">
        <i />
        <div>
          {[1, 2, 3, 4, 5].map((value) => (
            <label key={value} title={`${value} 分`}>
              <input
                checked={active === value}
                className="sr-only"
                name={name}
                onChange={() => onChange(value)}
                type="radio"
                value={value}
              />
              <span>{value}</span>
            </label>
          ))}
        </div>
      </div>
    </fieldset>
  );
}
