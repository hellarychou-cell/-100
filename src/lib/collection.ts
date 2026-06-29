import type { ToolCard } from "./tool-cards.ts";

export const LOCAL_SELF_CARD_KEY = "chengta.selfCard";
export const LOCAL_COLLECTION_CELEBRATED_KEY = "chengta.collectionCelebrated";

export type SelfCard = {
  identity: string;
  name: string;
  sentence: string;
};

export type ScheduleWoman = {
  cardType: string;
  day: number;
  field: string;
  name: string;
  quoteSource: string;
};

export type ToolCollectionSlot = ToolCard & {
  day: number | null;
  slot: number;
  unlocked: boolean;
};

export type SisterCollectionSlot = ScheduleWoman & {
  firstDay: number;
  unlocked: boolean;
};

export function buildCollectionState({
  completedDays,
  scheduleWomen,
  selfCard,
  toolCards,
}: {
  completedDays: number[];
  scheduleWomen: ScheduleWoman[];
  selfCard?: SelfCard | null;
  toolCards: ToolCard[];
}) {
  const toolSlots: ToolCollectionSlot[] = toolCards.slice(0, 24).map((card, index) => ({
    ...card,
    day: findDayForTool(card, scheduleWomen),
    slot: index + 1,
    unlocked: false,
  }));
  for (const slot of toolSlots) {
    slot.unlocked = slot.day !== null && completedDays.includes(slot.day);
  }

  const byName = new Map<string, SisterCollectionSlot>();
  for (const woman of scheduleWomen) {
    if (!woman.name || woman.name === "—") continue;
    const key = normalizeName(woman.name);
    const existing = byName.get(key);
    if (!existing || woman.day < existing.firstDay) {
      byName.set(key, {
        ...woman,
        firstDay: woman.day,
        unlocked: completedDays.includes(woman.day),
      });
    } else if (completedDays.includes(woman.day)) {
      byName.set(key, { ...existing, unlocked: true });
    }
  }

  const selfSlot = {
    card: selfCard ?? null,
    name: "你自己",
    unlocked: completedDays.includes(100) && Boolean(selfCard),
  };

  const sisterSlots = Array.from(byName.values()).sort((a, b) => a.firstDay - b.firstDay);
  return {
    allComplete: toolSlots.every((slot) => slot.unlocked) && sisterSlots.every((slot) => slot.unlocked) && selfSlot.unlocked,
    selfSlot,
    sisterSlots,
    toolSlots,
  };
}

function findDayForTool(card: ToolCard, scheduleWomen: ScheduleWoman[]) {
  const code = card.file.match(/\/(\d+\.\d+)/)?.[1];
  const normalizedName = normalizeCardText(card.front.name);
  const normalizedFile = normalizeCardText(card.file);
  const match = scheduleWomen.find((woman) => {
    const cardType = normalizeCardText(woman.cardType);
    return (
      (code && cardType.includes(code)) ||
      cardType.includes(normalizedName) ||
      (normalizedName.length > 1 && normalizedFile.includes(normalizedName))
    );
  });
  return match?.day ?? null;
}

function normalizeName(value: string) {
  return value.replace(/\s+/g, "");
}

function normalizeCardText(value: string) {
  return value.replace(/\s+/g, "").replace(/[🎴🎁🌸⚪️✨·、:：/_-]/g, "");
}
