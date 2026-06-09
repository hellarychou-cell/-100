import { QuoteCardClient } from "@/components/QuoteCardClient";

type QuoteCardPageProps = {
  searchParams: Promise<{ day?: string }>;
};

export default async function QuoteCardPage({ searchParams }: QuoteCardPageProps) {
  const params = await searchParams;
  const dayNum = Number(params.day ?? "1");
  return <QuoteCardClient dayNum={Number.isInteger(dayNum) ? dayNum : 1} />;
}
