/**
 * The home-page hero piece: a cut-out king that levitates over a lit
 * chessboard floor.
 *
 * Why it's built in layers instead of one <img>:
 *  - The king is a transparent cut-out, so only the piece moves — no photo
 *    rectangle bobbing around.
 *  - The floor, glow and contact shadow stay put; the shadow shrinks and
 *    fades as the king rises, which is what sells "floating".
 *  - The rim light is an accent-coloured gradient masked to the king's own
 *    silhouette, so it follows whatever accent the user picks in the
 *    ThemeSwitcher (the photo had purple baked in and couldn't).
 *
 * All styles live in globals.css under `.hk-*`.
 */
export default function HeroKing() {
  return (
    <div className="hk-stage" role="img" aria-label="A black chess king floating above a glowing chessboard">
      <div className="hk-glow" />
      <div className="hk-floor" />
      <div className="hk-shadow" />

      <div className="hk-piece">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/king-cutout.webp" alt="" width={348} height={862} className="hk-img" draggable={false} />
        <div className="hk-rim" />
      </div>
    </div>
  );
}