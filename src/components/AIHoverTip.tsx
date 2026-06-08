"use client";

import { useState } from "react";

export function AIHoverTip() {
  const [show, setShow] = useState(false);
  return (
    <div className="absolute right-0 top-3">
      <button
        type="button"
        className="grid h-7 w-7 place-items-center rounded-full border border-clay sans text-sm text-clay"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow((v) => !v)}
      >
        ?
      </button>
      {show && (
        <div className="absolute left-0 top-full z-20 mt-2 w-52 border border-[var(--line)] bg-soft p-3 shadow-xl">
          <p className="m-0 text-xs leading-relaxed text-[#563a2e]">
            今日方法：苏格拉底式提问。适合你心里有一个&quot;不舒服&quot;，但暂时说不清楚原因的时候。
          </p>
        </div>
      )}
    </div>
  );
}
