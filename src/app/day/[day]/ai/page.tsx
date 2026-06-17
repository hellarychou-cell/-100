import { AIDayClient } from "@/components/AIDayClient";
import { getDayDocumentContent } from "@/lib/day-document";

type PageProps = { params: Promise<{ day: string }> };

export default async function AIDayPage({ params }: PageProps) {
  const { day } = await params;
  const dayNum = Number(day);
  const documentContent = Number.isInteger(dayNum) && dayNum >= 1 && dayNum <= 7
    ? await getDayDocumentContent(dayNum)
    : null;

  return (
    <AIDayClient
      dayNum={dayNum}
      documentAiQuestion={documentContent?.aiQuestion}
      documentTitle={documentContent?.title}
    />
  );
}
