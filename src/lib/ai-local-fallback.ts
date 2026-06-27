export function createLocalAIReply({
  companionLabel,
  mode,
  userName,
  userText,
}: {
  companionLabel?: string | null;
  mode?: string | null;
  userName?: string | null;
  userText?: string | null;
}) {
  const name = userName?.trim() || "你";
  const companion = companionLabel?.trim() || "🌿 成她";
  const text = userText?.trim();

  if (mode === "summarize") {
    return [
      `${name}，我先把这段对话轻轻收束一下。`,
      "你已经看见了一个很重要的地方：身体和情绪都在提醒你，某些旧习惯不需要再自动接管你。",
      "今晚先不急着改变，只记住一句：我可以慢慢把选择权拿回来。",
    ].join("\n\n");
  }

  return [
    `${name}，${companion}先在这里接住你。`,
    text ? `我听见你说：“${clipText(text)}”` : "我听见你把这句话放到了这里。",
    "我们先不急着解决，也不急着分析对错。",
    "一次只看一个地方：这句话落在身体哪里？胸口、喉咙、胃，还是肩膀？",
  ].join("\n\n");
}

function clipText(value: string) {
  return value.length > 42 ? `${value.slice(0, 42)}……` : value;
}
