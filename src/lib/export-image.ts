"use client";

export async function saveElementAsPng({
  backgroundColor,
  element,
  fileName,
  filter,
}: {
  backgroundColor: string;
  element: HTMLElement | null;
  fileName: string;
  filter?: (node: HTMLElement) => boolean;
}) {
  if (!element) {
    return { ok: false, message: "没有找到可保存的卡片，请刷新后再试。" };
  }

  try {
    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(element, {
      backgroundColor,
      cacheBust: true,
      filter: filter ? (node) => !(node instanceof HTMLElement) || filter(node) : undefined,
      pixelRatio: 2,
    });

    const link = document.createElement("a");
    link.download = fileName;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    link.remove();

    return { ok: true, message: "", dataUrl };
  } catch (error) {
    console.error(error);
    return {
      ok: false,
      message: "图片生成失败了。你可以先截图保存，我会继续保留这个保存入口方便后面再修。",
    };
  }
}
