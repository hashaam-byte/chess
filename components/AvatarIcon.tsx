import { getAvatarPreset, type PieceType } from "@/lib/avatars";

function PieceGlyph({ piece, gradId }: { piece: PieceType; gradId: string }) {
  switch (piece) {
    case "king":
      return (
        <>
          <rect x="11" y="0.5" width="2" height="3" rx="0.5" />
          <rect x="9.5" y="1.5" width="5" height="1.8" rx="0.5" />
          <path d="M4.5 10l1.8-4 2.2 2.5 3.5-3.5 3.5 3.5 2.2-2.5 1.8 4-1 2H5.5z" />
          <path d="M6.5 12.5h11l.8 4H5.7z" />
          <rect x="6" y="17" width="12" height="3" rx="1" />
        </>
      );
    case "queen":
      return (
        <>
          <circle cx="5.5" cy="6.5" r="1.8" />
          <circle cx="9.5" cy="3.5" r="1.8" />
          <circle cx="12" cy="2.2" r="1.8" />
          <circle cx="14.5" cy="3.5" r="1.8" />
          <circle cx="18.5" cy="6.5" r="1.8" />
          <path d="M5.5 9l1 4h11l1-4-4.5 3-2.5-3.5-2.5 3.5z" />
          <path d="M6.5 13.5h11l.8 4H5.7z" />
          <rect x="6" y="17.5" width="12" height="2.5" rx="1" />
        </>
      );
    case "rook":
      return (
        <>
          <rect x="6" y="3" width="3" height="3" />
          <rect x="10.5" y="3" width="3" height="3" />
          <rect x="15" y="3" width="3" height="3" />
          <rect x="6" y="6" width="12" height="2" />
          <path d="M7.5 8h9l-1 10h-7z" />
          <rect x="6" y="18" width="12" height="3" rx="1" />
        </>
      );
    case "bishop":
      return (
        <>
          <circle cx="12" cy="3" r="1.6" />
          <path d="M12 5.2c-2.8 1.8-3.8 4.5-2.6 7.5.4 1 1 1.8 1 1.8-1.6 1-2.7 2.6-2.9 4.5h9c-.2-1.9-1.3-3.5-2.9-4.5 0 0 .6-.8 1-1.8 1.2-3 .2-5.7-2.6-7.5z" />
          <rect x="9.3" y="7.5" width="5.4" height="1.15" rx="0.55" transform="rotate(-38 12 8)" fill={`url(#${gradId})`} />
          <rect x="6" y="19.5" width="12" height="2" rx="1" />
        </>
      );
    case "knight":
      return (
        <>
          <path d="M8.2 20h9.2l-1-6.2c1.1-2.2 1-5.3-1-7.4-1-1.1-1-2.3.1-3.4-2.2 0-4.3 1.1-5.4 3.2L7 8.3l1 2.1 2.1-1c-1 3.1 0 6.6-1.9 10.6z" />
          <circle cx="9.3" cy="7" r="0.65" fill={`url(#${gradId})`} />
          <rect x="6" y="20" width="12" height="1.8" rx="0.9" />
        </>
      );
    case "pawn":
      return (
        <>
          <circle cx="12" cy="7" r="4" />
          <rect x="10.5" y="11" width="3" height="2" />
          <path d="M8 15c0-1 .5-2 1-2h6c.5 0 1 1 1 2l1 4H7z" />
          <rect x="6" y="19.5" width="12" height="2" rx="1" />
        </>
      );
  }
}

export default function AvatarIcon({
  avatarId,
  size = 40,
}: {
  avatarId: string | null | undefined;
  size?: number;
}) {
  const preset = getAvatarPreset(avatarId);
  const gradId = `avatar-grad-${preset.id}`;

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="rounded-full flex-shrink-0">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={preset.from} />
          <stop offset="100%" stopColor={preset.to} />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="12" fill={`url(#${gradId})`} />
      <g fill="rgba(17,17,22,0.85)">
        <PieceGlyph piece={preset.piece} gradId={gradId} />
      </g>
    </svg>
  );
}
