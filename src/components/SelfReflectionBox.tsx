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
    <form className="self-reflection--compact" onSubmit={handleSave}>
      <Field
        label="我在哪里失去重量，很难说出“不”？背后的担心是什么？"
        name="touched"
        placeholder="把你的真实想法写下来..."
      />
      <input name="body" type="hidden" value="" />
      <input name="sentence" type="hidden" value="" />
      <div className="self-reflection--compact__actions">
        <span>0/300</span>
        <div>
          {message ? <span className="sans self-center text-xs text-clay">{message}</span> : null}
          <button className="self-reflection--compact__save" type="submit">
            保存
          </button>
          <button
            className="action-primary"
            onClick={(event) => handleAi(event.currentTarget.form!)}
            type="button"
          >
            💬 去跨时空对话
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
    <label>
      <span>{label}</span>
      <textarea
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
