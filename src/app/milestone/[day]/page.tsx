import { notFound } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { MilestoneClient } from "@/components/MilestoneClient";
import { getMilestoneContent } from "@/lib/milestones";

type PageProps = {
  params: Promise<{ day: string }>;
};

export default async function MilestonePage({ params }: PageProps) {
  const { day } = await params;
  const dayNum = Number(day);
  if (!Number.isInteger(dayNum)) notFound();
  const content = getMilestoneContent(dayNum);
  if (!content) notFound();

  return (
    <AuthGate>
      <MilestoneClient content={content} day={dayNum} />
    </AuthGate>
  );
}
