/**
 * The home-page hero piece: a cut-out king that levitates over a lit
 * chessboard floor.
 *
 * Why it's built in layers instead of one <img>:
 *  - The king image is isolated in its own layer, so the board, glow and
 *    contact shadow stay put while the hero rises.
 *  - The floor, glow and contact shadow stay put; the shadow shrinks and
 *    fades as the king rises, which is what sells "floating".
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
        <img src="/images/hero-king.webp" alt="" width={760} height={1140} className="hk-img" draggable={false} />
      </div>
    </div>
  );
}


