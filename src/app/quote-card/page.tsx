import { AuthGate } from "@/components/AuthGate";
import { QuoteCardClient } from "@/components/QuoteCardClient";
import { getDayDocumentContent } from "@/lib/day-document";
import { requiresMembershipForDay } from "@/lib/progress";

type QuoteCardPageProps = {
  searchParams: Promise<{ day?: string }>;
};

export default async function QuoteCardPage({ searchParams }: QuoteCardPageProps) {
  const params = await searchParams;
  const dayNum = Number(params.day ?? "1");
  const safeDay = Number.isInteger(dayNum) ? dayNum : 1;
  const documentContent = safeDay >= 1 && safeDay <= 7 ? await getDayDocumentContent(safeDay) : null;
  return (
    <AuthGate day={safeDay} requireMember={requiresMembershipForDay(safeDay)}>
      <QuoteCardClient
        dayNum={safeDay}
        documentContent={
          documentContent
            ? {
                bodyNote: documentContent.bodyNote,
                mirror: documentContent.mirror,
                title: documentContent.title,
              }
            : null
        }
      />
    </AuthGate>
  );
}
