"use client";

import { useEffect, useState } from "react";

const KEY = "chess-x:cookie-notice-seen";

export default function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(KEY)) setVisible(true);
    } catch {
      // If storage is blocked, just skip the banner rather than show it forever.
    }
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-[100] rounded-xl p-4 text-sm flex flex-col gap-3"
      style={{ background: "#111116", border: "1px solid #23232c", color: "#EDEEF0" }}
      role="dialog"
      aria-label="Cookie and storage notice"
    >
      <p>
        CHESS//X uses your browser&apos;s local storage to remember your name, avatar, and preferences —
        no login, no tracking cookies.{" "}
        <a href="/privacy" className="underline">Read more</a>.
      </p>
      <button
        onClick={dismiss}
        className="self-end text-xs font-semibold px-3 py-1.5 rounded-full"
        style={{ background: "#8B5CF6", color: "#0b0b0f" }}
      >
        Got it
      </button>
    </div>
  );
}