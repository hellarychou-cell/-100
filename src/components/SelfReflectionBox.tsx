"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  createReflectionEntry,
  LOCAL_REFLECTION_KEY,
  SelfReflectionEntry,
} from "@/lib/self-reflection";

export function SelfReflectionBox({
  aiHref,
  day,
}: {
  aiHref: string;
  day: number;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");

  function saveEntry(form: HTMLFormElement) {
    const data = new FormData(form);
    const entry = createReflectionEntry({
      body: String(data.get("body") ?? ""),
      day,
      sentence: String(data.get("sentence") ?? ""),
      touched: String(data.get("touched") ?? ""),
    });
    const entries = readEntries();
    const nextEntries = [entry, ...entries.filter((item) => item.day !== day)];
    window.localStorage.setItem(LOCAL_REFLECTION_KEY, JSON.stringify(nextEntries));
    return entry;
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveEntry(event.currentTarget);
    setMessage("已保存到我的匣子。");
  }

  function handleAi(form: HTMLFormElement) {
    saveEntry(form);
    router.push(`${aiHref}?from=reflection`);
  }

  return (
    <form className="thin-panel grid gap-3 p-4" onSubmit={handleSave}>
      <Field
        label="今天故事里，哪一句最戳到你？"
        name="touched"
        placeholder="比如：那 2 分 / 我不是不会拒绝"
      />
      <Field
        label="那一刻，你身体哪里有反应？"
        name="body"
        placeholder="比如：胸口紧、胃里酸、肩膀很重"
      />
      <Field
        label="如果不急着改变，你想对自己说一句什么？"
        name="sentence"
        placeholder="比如：我可以先看见，不用马上变好"
      />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-3">
        <span className="sans text-xs text-[var(--muted)]">
          先写下来，AI 再帮你看见。你也可以只保存，不开启对话。
        </span>
        <div className="flex flex-wrap gap-2">
          {message ? <span className="sans self-center text-xs text-clay">{message}</span> : null}
          <button className="action-ghost !px-3 !py-2 !text-xs" type="submit">
            只保存
          </button>
          <button
            className="action-primary !px-3 !py-2 !text-xs"
            onClick={(event) => handleAi(event.currentTarget.form!)}
            type="button"
          >
            让 AI 陪我看见
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
}: {
  label: string;
  name: string;
  placeholder: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="sans text-[11px] uppercase tracking-wider text-clay">{label}</span>
      <textarea
        className="min-h-[54px] resize-none border border-[var(--line)] bg-soft/50 p-3 text-sm leading-relaxed text-[#3f281f] outline-none placeholder:text-[#3f281f]/45"
        name={name}
        placeholder={placeholder}
      />
    </label>
  );
}

function readEntries() {
  const raw = window.localStorage.getItem(LOCAL_REFLECTION_KEY);
  if (!raw) return [] as SelfReflectionEntry[];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SelfReflectionEntry[]) : [];
  } catch {
    window.localStorage.removeItem(LOCAL_REFLECTION_KEY);
    return [];
  }
}
