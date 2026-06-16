import { CollectionClient } from "@/components/CollectionClient";
import { getScheduleWomen } from "@/lib/schedule";
import { getToolCards } from "@/lib/tool-cards";

export default function CollectionPage() {
  return <CollectionClient scheduleWomen={getScheduleWomen()} toolCards={getToolCards()} />;
}
