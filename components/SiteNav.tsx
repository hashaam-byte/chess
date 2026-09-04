"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ProfileButton from "./ProfileButton";

const LINKS = [
  { href: "/play", label: "Play" },
  { href: "/watch", label: "Watch" },
];

/**
 * Where "back" goes from any given page. Deliberately not browser
 * history (`router.back()`) — someone arriving via a shared invite or
 * watch link has no in-app history yet, so history-back could bounce them
 * out of the site entirely. A fixed per-route destination is predictable
 * regardless of how someone landed on the page.
 */
function getBackHref(pathname: string): string | null {
  if (pathname === "/") return null;
  if (pathname.startsWith("/watch/")) return "/watch";
  return "/";
}

export default function SiteNav() {
  const pathname = usePathname();
  const backHref = getBackHref(pathname ?? "/");

  return (
    <nav
      className="w-full flex items-center justify-between px-6 sm:px-10 py-4"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center gap-3">
        {backHref && (
          <Link
            href={backHref}
            aria-label="Back"
            className="flex items-center justify-center w-7 h-7 rounded-full transition-colors hover:bg-white/5"
            style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#8f8a9c" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
        )}
        <Link href="/" className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(155deg, var(--cx-accent-light), var(--cx-accent-dark))" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#111116">
              <path d="M12 2l1.8 3.6L18 6l-3 3.2.7 4.3L12 11.5 8.3 13.5 9 9.2 6 6l4.2-.4L12 2z" />
              <rect x="7" y="16" width="10" height="2.5" rx="1" />
              <rect x="6" y="19.5" width="12" height="2.5" rx="1" />
            </svg>
          </div>
          <span className="font-serif font-semibold text-lg tracking-tight" style={{ color: "#F5F3F7" }}>
            CHESS<span style={{ color: "var(--cx-accent)" }}>{"//"}</span>X
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          {LINKS.map((link) => {
            const active = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className="text-[13px] px-3 py-1.5 rounded-full transition-colors"
                style={{
                  color: active ? "#F5F3F7" : "#8f8a9c",
                  background: active ? "rgba(255,255,255,0.06)" : "transparent",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
        <ProfileButton />
      </div>
    </nav>
  );
}
