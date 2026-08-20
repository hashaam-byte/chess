import SiteNav from "../../components/SiteNav";
import Image from "next/image";

const PIECES = ["king", "queen", "rook", "bishop", "knight", "pawn"] as const;

export default function PiecesPreview() {
  return (
    <div className="min-h-screen" style={{ background: "#07070A", color: "#F5F3F7" }}>
      <SiteNav />

      <div className="p-6 sm:p-10">
        <h1 className="font-serif font-semibold text-2xl mb-1 tracking-tight">Piece set preview</h1>
        <p className="text-sm mb-8" style={{ color: "#8f8a9c" }}>
          Cropped from the reference sheet, transparent PNGs, ready to place on a board.
        </p>

        <div className="mb-10">
          <div className="text-xs uppercase tracking-wider mb-3" style={{ color: "var(--cx-accent-light)" }}>
            White
          </div>
          <div className="flex items-end gap-6 rounded-xl p-6" style={{ background: "#d8d6e2" }}>
            {PIECES.map((p) => (
              <div key={p} className="flex flex-col items-center gap-2">
                <div className="relative h-28 w-20">
                  <Image src={`/pieces/white_${p}.png`} alt={p} fill sizes="80px" style={{ objectFit: "contain" }} />
                </div>
                <span className="text-[10px] capitalize" style={{ color: "#1a1a24" }}>{p}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wider mb-3" style={{ color: "var(--cx-accent-light)" }}>
            Black
          </div>
          <div className="flex items-end gap-6 rounded-xl p-6" style={{ background: "#111116", border: "1px solid #23232c" }}>
            {PIECES.map((p) => (
              <div key={p} className="flex flex-col items-center gap-2">
                <div className="relative h-28 w-20">
                  <Image src={`/pieces/black_${p}.png`} alt={p} fill sizes="80px" style={{ objectFit: "contain" }} />
                </div>
                <span className="text-[10px] capitalize" style={{ color: "#F5F3F7" }}>{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
