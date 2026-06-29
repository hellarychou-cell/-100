export function getDailyMysteryCardTypeLabel(type: string) {
  if (type === "benefit") return "福利卡";
  if (type === "gratitude") return "感恩卡";
  if (type === "tool") return "工具卡";
  if (type === "blank") return "留白卡";
  return "";
}
