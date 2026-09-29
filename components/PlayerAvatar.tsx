import AvatarIcon from "./AvatarIcon";

/** Uploaded photo if there is one, else the chosen preset piece, else an initial. */
export default function PlayerAvatar({
  name,
  avatarUrl,
  avatarId,
  size = 36,
}: {
  name: string;
  avatarUrl?: string | null;
  avatarId?: string | null;
  size?: number;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL, domain varies per project
      <img src={avatarUrl} alt={name} width={size} height={size} className="rounded-full object-cover flex-shrink-0" style={{ width: size, height: size }} />
    );
  }
  if (avatarId) return <AvatarIcon avatarId={avatarId} size={size} />;
  return (
    <span
      className="rounded-full flex items-center justify-center font-semibold flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.42, background: "linear-gradient(155deg, var(--cx-accent-light), var(--cx-accent-dark))", color: "#111116" }}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}