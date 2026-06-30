import { supabase } from "./supabase.ts";
import {
  LOCAL_AI_CONVERSATION_KEY,
  LOCAL_REFLECTION_KEY,
  type AIConversationEntry,
  type SelfReflectionEntry,
} from "./self-reflection.ts";
import {
  LOCAL_THEATER_CHOICE_KEY,
  type AwakeningTheaterChoice,
  type AwakeningTheaterChoiceMap,
} from "./awakening-theater.ts";

export type GrowthRecords = {
  aiEntries: AIConversationEntry[];
  reflections: SelfReflectionEntry[];
  theaterChoices: AwakeningTheaterChoice[];
};

export async function saveReflectionRecord(entry: SelfReflectionEntry) {
  if (!supabase) return;
  const user = await getCurrentUser();
  if (!user) return;
  await supabase.from("self_reflections").upsert({
    body: entry.body,
    client_id: entry.id,
    created_at: entry.createdAt,
    day: entry.day,
    sentence: entry.sentence,
    touched: entry.touched,
    user_id: user.id,
  }, { onConflict: "user_id,client_id" });
}

export async function saveAIConversationRecord(entry: AIConversationEntry) {
  if (!supabase) return;
  const user = await getCurrentUser();
  if (!user) return;
  await supabase.from("ai_conversation_entries").upsert({
    client_id: entry.id,
    created_at: entry.createdAt,
    day: entry.day,
    messages: entry.messages,
    title: entry.title,
    updated_at: entry.updatedAt,
    user_id: user.id,
  }, { onConflict: "user_id,client_id" });
}

export async function saveTheaterChoiceRecord(choice: AwakeningTheaterChoice) {
  if (!supabase) return;
  const user = await getCurrentUser();
  if (!user) return;
  await supabase.from("theater_choices").upsert({
    anchors: choice.anchors,
    created_at: choice.createdAt,
    day: choice.day,
    first_choice: choice.firstChoice,
    second_choice: choice.secondChoice ?? null,
    selected_labels: choice.selectedLabels,
    updated_at: choice.updatedAt,
    user_id: user.id,
  }, { onConflict: "user_id,day" });
}

export async function loadGrowthRecords(): Promise<GrowthRecords> {
  const local = readLocalGrowthRecords();
  if (!supabase) return local;
  const user = await getCurrentUser();
  if (!user) return local;

  const [{ data: reflections }, { data: aiEntries }, { data: theaterChoices }] = await Promise.all([
    supabase.from("self_reflections").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("ai_conversation_entries").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }),
    supabase.from("theater_choices").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }),
  ]);

  return {
    aiEntries: mergeById(local.aiEntries, (aiEntries ?? []).map(mapAIConversationRow)),
    reflections: mergeById(local.reflections, (reflections ?? []).map(mapReflectionRow)),
    theaterChoices: mergeTheaterChoices(local.theaterChoices, (theaterChoices ?? []).map(mapTheaterChoiceRow)),
  };
}

export function readLocalGrowthRecords(): GrowthRecords {
  return {
    aiEntries: readLocalArray<AIConversationEntry>(LOCAL_AI_CONVERSATION_KEY),
    reflections: readLocalArray<SelfReflectionEntry>(LOCAL_REFLECTION_KEY),
    theaterChoices: Object.values(readLocalJson<AwakeningTheaterChoiceMap>(LOCAL_THEATER_CHOICE_KEY) ?? {}),
  };
}

async function getCurrentUser() {
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getUser();
    return data.user ?? null;
  } catch {
    return null;
  }
}

function mapReflectionRow(row: Record<string, unknown>): SelfReflectionEntry {
  return {
    body: String(row.body ?? ""),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    day: Number(row.day ?? 1),
    id: String(row.client_id ?? row.id ?? `reflection-${row.day}`),
    sentence: String(row.sentence ?? ""),
    touched: String(row.touched ?? ""),
  };
}

function mapAIConversationRow(row: Record<string, unknown>): AIConversationEntry {
  const messages = Array.isArray(row.messages) ? row.messages : [];
  return {
    createdAt: String(row.created_at ?? new Date().toISOString()),
    day: Number(row.day ?? 1),
    id: String(row.client_id ?? row.id ?? `ai-${row.day}`),
    messages: messages as AIConversationEntry["messages"],
    title: String(row.title ?? `Day ${String(row.day ?? 1).padStart(2, "0")} AI 陪我看见`),
    updatedAt: String(row.updated_at ?? row.created_at ?? new Date().toISOString()),
  };
}

function mapTheaterChoiceRow(row: Record<string, unknown>): AwakeningTheaterChoice {
  return {
    anchors: isRecord(row.anchors) ? row.anchors as AwakeningTheaterChoice["anchors"] : { first: "" },
    createdAt: String(row.created_at ?? new Date().toISOString()),
    day: Number(row.day ?? 1),
    firstChoice: String(row.first_choice ?? "A") as AwakeningTheaterChoice["firstChoice"],
    secondChoice: row.second_choice ? String(row.second_choice) as AwakeningTheaterChoice["secondChoice"] : undefined,
    selectedLabels: isRecord(row.selected_labels)
      ? row.selected_labels as AwakeningTheaterChoice["selectedLabels"]
      : { first: String(row.first_choice ?? "A") },
    updatedAt: String(row.updated_at ?? row.created_at ?? new Date().toISOString()),
  };
}

function mergeById<T extends { id: string }>(local: T[], remote: T[]) {
  const byId = new Map<string, T>();
  for (const item of [...remote, ...local]) byId.set(item.id, item);
  return Array.from(byId.values());
}

function mergeTheaterChoices(local: AwakeningTheaterChoice[], remote: AwakeningTheaterChoice[]) {
  const byDay = new Map<number, AwakeningTheaterChoice>();
  for (const item of [...remote, ...local]) byDay.set(item.day, item);
  return Array.from(byDay.values());
}

function readLocalArray<T>(key: string): T[] {
  const parsed = readLocalJson<T[]>(key);
  return Array.isArray(parsed) ? parsed : [];
}

function readLocalJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
