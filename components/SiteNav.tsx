"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ProfileButton from "./ProfileButton";

const LINKS = [
  { href: "/play", label: "Play" },
  { href: "/watch", label: "Watch" },
  { href: "/tournament", label: "Tournaments" },
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
  const matchMatch = pathname.match(/^\/tournament\/([^/]+)\/match\/[^/]+$/);
  if (matchMatch) return `/tournament/${matchMatch[1]}`;
  if (pathname.startsWith("/tournament/")) return "/tournament";
  return "/";
}

export default function SiteNav() {
  const pathname = usePathname();
  const backHref = getBackHref(pathname ?? "/");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the mobile menu after navigating (state reset during render, keyed on pathname).
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setMenuOpen(false);
  }

  // Close on outside tap / Escape while open.
  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && !!pathname?.startsWith(href));

  return (
    <nav
      className="relative w-full flex items-center justify-between px-4 sm:px-10 py-4"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center gap-3">
        {backHref && (
          <Link
            href={backHref}
            aria-label="Back"
            className="hidden md:flex items-center justify-center w-7 h-7 rounded-full transition-colors hover:bg-white/5"
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

      <div className="hidden md:flex items-center gap-4">
        <div className="flex items-center gap-1">
          {LINKS.map((link) => {
            const active = isActive(link.href);
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
      {/* Mobile: hamburger + dropdown */}
      <div ref={menuRef} className="md:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          className="flex items-center justify-center w-9 h-9 rounded-full transition-colors hover:bg-white/5"
          style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#F5F3F7" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {menuOpen ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>

        {menuOpen && (
          <div
            className="absolute right-4 top-full mt-2 z-50 w-64 max-w-[calc(100vw-2rem)] rounded-2xl p-2 flex flex-col gap-1"
            style={{
              background: "#111116",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 24px 48px -16px rgba(0,0,0,0.7)",
            }}
          >
            {backHref && (
              <Link
                href={backHref}
                className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-xl transition-colors hover:bg-white/5"
                style={{ color: "#8f8a9c" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                Back
              </Link>
            )}

            {LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm px-3 py-2.5 rounded-xl transition-colors hover:bg-white/5"
                  style={{
                    color: active ? "#F5F3F7" : "#8f8a9c",
                    background: active ? "rgba(255,255,255,0.06)" : "transparent",
                  }}
                >
                  {link.label}
                </Link>
              );
            })}

            <div className="mt-1 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <ProfileButton />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}