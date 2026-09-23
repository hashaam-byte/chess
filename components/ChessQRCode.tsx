"use client";

import QRCode from "qrcode";

// Reuses the exact same king/queen silhouette paths as AvatarIcon, so the
// piece style stays consistent across the site rather than introducing a
// third glyph set just for this.
function KingGlyph({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="var(--cx-accent-light)">
      <rect x="11" y="0.5" width="2" height="3" rx="0.5" />
      <rect x="9.5" y="1.5" width="5" height="1.8" rx="0.5" />
      <path d="M4.5 10l1.8-4 2.2 2.5 3.5-3.5 3.5 3.5 2.2-2.5 1.8 4-1 2H5.5z" />
      <path d="M6.5 12.5h11l.8 4H5.7z" />
      <rect x="6" y="17" width="12" height="3" rx="1" />
    </svg>
  );
}

function QueenGlyph({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="var(--cx-accent)">
      <circle cx="5.5" cy="6.5" r="1.8" />
      <circle cx="9.5" cy="3.5" r="1.8" />
      <circle cx="12" cy="2.2" r="1.8" />
      <circle cx="14.5" cy="3.5" r="1.8" />
      <circle cx="18.5" cy="6.5" r="1.8" />
      <path d="M5.5 9l1 4h11l1-4-4.5 3-2.5-3.5-2.5 3.5z" />
      <path d="M6.5 13.5h11l.8 4H5.7z" />
      <rect x="6" y="17.5" width="12" height="2.5" rx="1" />
    </svg>
  );
}

type Modules = { size: number; get: (r: number, c: number) => number };

export default function ChessQRCode({ url, size = 220 }: { url: string; size?: number }) {
  // QRCode.create is synchronous — no need for state/effect at all, this
  // just recomputes on every render (cheap) if the url prop changes.
  const modules = QRCode.create(url, { errorCorrectionLevel: "H" }).modules as unknown as Modules;
  const n = modules.size;
  const cell = size / n;
  const rects: React.ReactElement[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (modules.get(r, c)) {
        rects.push(
          <rect
            key={`${r}-${c}`}
            x={c * cell}
            y={r * cell}
            width={cell * 0.92}
            height={cell * 0.92}
            rx={cell * 0.22}
            fill="#241d17"
          />
        );
      }
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-end gap-1" style={{ marginBottom: -6, zIndex: 1 }}>
        <QueenGlyph size={26} />
        <KingGlyph size={30} />
      </div>
      <div
        className="rounded-2xl p-4"
        style={{ background: "#ede0c8", border: "3px solid var(--cx-accent)", boxShadow: "0 12px 32px -12px color-mix(in srgb, var(--cx-accent) 50%, transparent)" }}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <rect width={size} height={size} fill="#ede0c8" />
          {rects}
        </svg>
      </div>
      <span className="text-xs mt-3" style={{ color: "#8f8a9c" }}>Scan to join the game</span>
    </div>
  );
}
