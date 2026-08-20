"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/play", label: "Play" },
  { href: "/tournament", label: "Tournaments" },
  { href: "/rankings", label: "Rankings" },
];

export default function SiteNav() {
  const pathname = usePathname();

  return (
    <nav
      className="w-full flex items-center justify-between px-6 sm:px-10 py-4"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
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
    </nav>
  );
}
