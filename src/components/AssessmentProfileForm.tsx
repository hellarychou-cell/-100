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
        await supabase.from("profiles").upsert({
          id: data.user.id,
          phone: data.user.phone ?? "",
          display_name: profile.name,
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
    <form className="grid min-h-0 grid-rows-[auto_1fr_auto] gap-4" onSubmit={handleSubmit}>
      <div className="flex items-end justify-between border-b border-[var(--line)] pb-4">
        <h2 className="m-0 text-4xl font-normal leading-none">你的当前状态</h2>
        <span className="sans text-xs text-[var(--muted)]">填写后进入 42 题</span>
      </div>
      <div className="grid content-center grid-cols-2 gap-3 max-sm:grid-cols-1">
        <Field label="姓名 / 昵称" name="name" placeholder="林夏" hint="报告会这样称呼你。" />
        <Field label="年龄" name="age" placeholder="30-34 岁" hint="用于理解阶段与语境。" />
        <Field
          wide
          label="行业 / 身份"
          name="identity"
          placeholder="独立咨询顾问"
          hint="写你最常用来介绍自己的那个身份。"
        />
        <Field wide multiline label="当下最想解决的问题" name="currentIssue" placeholder="不敢拒绝，答应之后又觉得很累。" />
        <Field wide multiline label="理想状态" name="idealState" placeholder="我想可以温和但清楚地表达“不”。" />
      </div>
      <div className="flex items-center justify-between border-t border-[var(--line)] pt-4">
        <button className="text-link bg-transparent" type="submit">
          稍后再填
        </button>
        <div className="flex items-center gap-3">
          {message ? <span className="sans text-xs text-clay">{message}</span> : null}
          <button className="action-primary" type="submit">
            进入42题测评
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
  hint,
  wide = false,
  multiline = false,
}: {
  label: string;
  name: string;
  placeholder: string;
  hint?: string;
  wide?: boolean;
  multiline?: boolean;
}) {
  return (
    <label className={`thin-panel block p-3 ${wide ? "col-span-2 max-sm:col-span-1" : ""}`}>
      <span className="sans mb-2 block text-[11px] uppercase tracking-wider text-clay">{label}</span>
      {multiline ? (
        <textarea
          className="min-h-[58px] w-full resize-none bg-transparent text-base leading-snug text-[#3f281f] outline-none placeholder:text-[#3f281f]/75"
          name={name}
          placeholder={placeholder}
        />
      ) : (
        <input
          className="w-full bg-transparent text-base text-[#3f281f] outline-none placeholder:text-[#3f281f]/75"
          name={name}
          placeholder={placeholder}
          type="text"
        />
      )}
      {hint ? <div className="mt-2 sans text-[11px] leading-snug text-[var(--muted)]">{hint}</div> : null}
    </label>
  );
}
