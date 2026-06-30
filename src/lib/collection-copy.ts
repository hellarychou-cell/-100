export function createSisterGiftDisplay(rawGift: string, sisterName: string) {
  const cleaned = rawGift.replace(/^[^\p{L}\p{N}]+/u, "").trim();
  if (/工具卡/u.test(cleaned)) {
    return `${sisterName}把一枚小小的边界护身符放到你手心：当你又想替别人扛起来时，先轻轻拍拍自己，提醒自己回到自己的位置。`;
  }
  if (/福利卡/u.test(cleaned)) {
    return `${sisterName}给你一个温暖的抱抱：今天的觉察很珍贵，值得被认真听见。`;
  }
  if (/感恩卡/u.test(cleaned)) {
    return `${sisterName}把一朵小花放到你手心：谢谢你愿意把自己请回第一位。`;
  }
  if (/空白卡/u.test(cleaned)) {
    return `${sisterName}留给你一小段安静：不用立刻做什么，轻轻拍拍自己就很好。`;
  }
  return `${sisterName}把这份小礼物放进你的口袋：${cleaned}`;
}

export function splitInlineStrong(value: string) {
  return value.split("**").map((part, index) => ({
    strong: index % 2 === 1,
    text: part,
  })).filter((part) => part.text.length > 0);
}
