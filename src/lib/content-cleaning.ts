const EDITORIAL_NOTE_PATTERN =
  /(里程碑预告型|散场静态型|静态展示|无按钮|最后更新|最近更新)/u;

export function isEditorialNoteLine(line: string) {
  const text = line.trim();
  if (!text) return false;
  if (/^\s*(最后|最近)更新\s*[：:].*$/u.test(text)) return true;
  if (/^[-*]?\s*[（(].*[）)]\s*[-*]?$/u.test(text) && EDITORIAL_NOTE_PATTERN.test(text)) return true;
  return false;
}

export function stripEditorialNotes(value: string) {
  return value
    .split(/\n/u)
    .filter((line) => !isEditorialNoteLine(line))
    .join("\n");
}
