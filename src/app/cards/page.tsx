import { CardsAlbumClient, ToolCardSlot } from "@/components/CardsAlbumClient";
import { getScheduleDays } from "@/lib/schedule";
import { getToolCards, ToolCard } from "@/lib/tool-cards";

export default function CardsPage() {
  const schedule = getScheduleDays();
  const slots: ToolCardSlot[] = getToolCards().map((card) => ({
    ...card,
    day: findToolCardDay(card, schedule),
  }));

  return <CardsAlbumClient slots={slots} />;
}

function findToolCardDay(card: ToolCard, schedule: ReturnType<typeof getScheduleDays>) {
  const code = card.file.match(/\/(\d+\.\d+)/)?.[1];
  const normalizedName = card.front.name.replace(/\s+/g, "");
  const match = schedule.find((day) => {
    const mystery = day.mysteryCard.replace(/\s+/g, "");
    return (code && mystery.includes(code)) || mystery.includes(normalizedName);
  });

  return match?.day ?? null;
}
