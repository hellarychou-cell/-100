"use client";

import { useRouter } from "next/navigation";
import { FormEvent } from "react";
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveEntry(event.currentTarget);
    router.push(`${aiHref}?from=reflection`);
  }

  return (
    <form className="self-reflection--compact" onSubmit={handleSubmit}>
      <input name="touched" type="hidden" value="我想把今天的内容带进跨时空对话里继续看见。" />
      <input name="body" type="hidden" value="" />
      <input name="sentence" type="hidden" value="" />
      <div className="self-reflection--compact__actions">
        <div>
          <button className="action-primary" type="submit">
            💬 去跨时空对话
          </button>
        </div>
      </div>
    </form>
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
