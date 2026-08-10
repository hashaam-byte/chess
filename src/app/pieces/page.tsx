import Link from "next/link";
import Image from "next/image";

const PIECES = ["king", "queen", "rook", "bishop", "knight", "pawn"] as const;

export default function PiecesPreview() {
  return (
    <div className="min-h-screen bg-[#0d1114] text-[#EDEAE1] p-10">
      <Link href="/" className="text-xs text-[#8f887c] hover:text-[#EDEAE1] mb-6 inline-block transition-colors">
        ← Back to game
      </Link>
      <h1 className="font-serif text-2xl mb-1 tracking-wide">Piece set preview</h1>
      <p className="text-sm text-[#8f887c] mb-8">Cropped from the reference sheet, transparent PNGs, ready to place on a board.</p>

      <div className="mb-10">
        <div className="text-xs uppercase tracking-wider text-[#caa356] mb-3">White</div>
        <div className="flex items-end gap-6 bg-[#ecdfc4] rounded-xl p-6">
          {PIECES.map((p) => (
            <div key={p} className="flex flex-col items-center gap-2">
              <div className="relative h-28 w-20">
                <Image src={`/pieces/white_${p}.png`} alt={p} fill sizes="80px" style={{ objectFit: "contain" }} />
              </div>
              <span className="text-[10px] text-[#332a22] capitalize">{p}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wider text-[#caa356] mb-3">Black</div>
        <div className="flex items-end gap-6 bg-[#241d17] rounded-xl p-6">
          {PIECES.map((p) => (
            <div key={p} className="flex flex-col items-center gap-2">
              <div className="relative h-28 w-20">
                <Image src={`/pieces/black_${p}.png`} alt={p} fill sizes="80px" style={{ objectFit: "contain" }} />
              </div>
              <span className="text-[10px] text-[#EDEAE1] capitalize">{p}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
