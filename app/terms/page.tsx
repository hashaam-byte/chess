export const metadata = { title: "Terms — CHESS//X" };

export default function TermsPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16 text-[15px] leading-relaxed" style={{ color: "#EDEEF0" }}>
      <h1 className="font-serif text-3xl mb-2">Terms of Service</h1>
      <p className="text-sm mb-10" style={{ color: "#8f8a9c" }}>Last updated: {new Date().toISOString().slice(0, 10)}</p>

      <h2 className="font-serif text-xl mb-3">No accounts, no guarantees of identity</h2>
      <p className="mb-6">
        CHESS//X identifies you by whatever your browser remembers locally (see our{" "}
        <a href="/privacy" className="underline">Privacy page</a>). We make no representation that any
        name, rating, or game history belongs to a particular real person. Don&apos;t rely on CHESS//X as
        proof of anyone&apos;s identity.
      </p>

      <h2 className="font-serif text-xl mt-10 mb-3">Fair play</h2>
      <p className="mb-6">
        Play your own moves. Using chess engines or outside assistance during a live game against another
        person undermines the point of the site for everyone else — we may reset, hide, or remove games
        and ratings we believe were affected by this, without needing to prove it to a legal standard.
      </p>

      <h2 className="font-serif text-xl mt-10 mb-3">Bots and analysis</h2>
      <p className="mb-6">
        Bot opponents and any move evaluation shown are computer estimates, not professional coaching, and
        may be wrong. Bot game results are recorded separately from games against other people and don&apos;t
        carry the same weight unless you explicitly choose otherwise.
      </p>

      <h2 className="font-serif text-xl mt-10 mb-3">Tournaments and prizes</h2>
      <p className="mb-6">
        Unless a specific tournament explicitly states otherwise at the time you join it, prize or reward
        information shown on CHESS//X is illustrative only and does not represent an offer of real money or
        goods.
      </p>

      <h2 className="font-serif text-xl mt-10 mb-3">No warranty</h2>
      <p className="mb-6">
        CHESS//X is provided as-is. Games can be lost to bugs, downtime, or a dropped connection — we&apos;ll
        try to keep that rare, but we don&apos;t guarantee uptime or that any game, rating, or piece of game
        history will be preserved forever.
      </p>

      <h2 className="font-serif text-xl mt-10 mb-3">Conduct</h2>
      <p className="mb-6">
        Don&apos;t use CHESS//X to harass anyone, impersonate someone else, or post anything illegal in a
        display name or in chat. We may remove content or restrict access for behavior like this.
      </p>

      <h2 className="font-serif text-xl mt-10 mb-3">Changes</h2>
      <p>
        These terms may change as the site changes. Continued use after an update means you accept the
        current version, dated above.
      </p>
    </main>
  );
}