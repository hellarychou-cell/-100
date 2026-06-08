"use client";

export function CloseButton() {
  return (
    <button
      aria-label="关闭"
      className="absolute right-5 top-5 z-10 grid h-9 w-9 place-items-center border border-[var(--line)] bg-soft/75 sans text-xl leading-none text-ink transition hover:bg-ink hover:text-soft"
      onClick={() => window.history.back()}
      type="button"
    >
      ×
    </button>
  );
}
