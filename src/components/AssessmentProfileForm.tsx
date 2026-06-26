"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { LOCAL_PROFILE_KEY } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export function AssessmentProfileForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const profile = {
      name: String(form.get("name") ?? "").trim() || "她",
      age: String(form.get("age") ?? "").trim(),
      identity: String(form.get("identity") ?? "").trim(),
      currentIssue: String(form.get("currentIssue") ?? "").trim(),
      idealState: String(form.get("idealState") ?? "").trim(),
    };

    window.localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));

    if (supabase) {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const parsedAge = Number.parseInt(profile.age, 10);
        await supabase.from("profiles").upsert({
          id: data.user.id,
          phone: data.user.phone ?? "",
          display_name: profile.name,
          age: Number.isFinite(parsedAge) ? parsedAge : null,
          identity: profile.identity,
          current_issue: profile.currentIssue,
          ideal_state: profile.idealState,
        });
      }
    }

    setMessage("已保存，正在进入测评。");
    router.push("/assessment");
  }

  return (
    <form className="assessment-profile-form" onSubmit={handleSubmit}>
      <div className="assessment-profile-form__header">
        <h2>你的当前状态</h2>
        <span>填写后进入42题</span>
      </div>
      <div className="assessment-profile-form__fields">
        <Field icon="♙" label="姓名 / 昵称" name="name" placeholder="林夏" />
        <Field icon="▣" label="年龄" name="age" placeholder="30-34 岁" select />
        <Field
          icon="▢"
          label="行业 / 身份"
          name="identity"
          placeholder="独立咨询顾问"
          select
        />
        <Field icon="／" multiline label="当下最想解决的问题" name="currentIssue" placeholder="不敢拒绝，答应之后又觉得很累。" count="16/200" />
        <Field icon="☆" multiline label="理想状态" name="idealState" placeholder="我想可以温和但清楚地表达“不”。" count="13/200" />
      </div>
      <div className="assessment-profile-form__footer">
        <button className="assessment-profile-form__skip" type="submit">
          稍后再填
        </button>
        <div>
          {message ? <span className="sans text-xs text-clay">{message}</span> : null}
          <button className="action-primary" type="submit">
            进入42题测评　→
          </button>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  placeholder,
  icon,
  count,
  select = false,
  multiline = false,
}: {
  label: string;
  name: string;
  placeholder: string;
  icon: string;
  count?: string;
  select?: boolean;
  multiline?: boolean;
}) {
  return (
    <label className="assessment-profile-form__field">
      <span aria-hidden className="assessment-profile-form__icon">{icon}</span>
      <span className="assessment-profile-form__control">
        <span>{label}</span>
        {multiline ? (
          <textarea name={name} placeholder={placeholder} />
        ) : (
          <input name={name} placeholder={placeholder} type="text" />
        )}
      </span>
      {select ? <span aria-hidden className="assessment-profile-form__arrow">⌄</span> : null}
      {count ? <span className="assessment-profile-form__count">{count}</span> : null}
    </label>
  );
}
