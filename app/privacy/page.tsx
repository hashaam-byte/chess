export const metadata = { title: "Privacy — CHESS//X" };

export default function PrivacyPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16 text-[15px] leading-relaxed" style={{ color: "#EDEEF0" }}>
      <h1 className="font-serif text-3xl mb-2">Privacy</h1>
      <p className="text-sm mb-10" style={{ color: "#8f8a9c" }}>Last updated: {new Date().toISOString().slice(0, 10)}</p>

      <p className="mb-6">
        CHESS//X doesn&apos;t have user accounts. There&apos;s no sign-up, no email address on file, no
        password. What follows explains, plainly, what that means in practice.
      </p>

      <h2 className="font-serif text-xl mt-10 mb-3">What&apos;s stored on your device</h2>
      <p className="mb-3">
        Your &quot;identity&quot; on CHESS//X — your display name, avatar, chosen accent color, and which
        seat you hold in any game you&apos;ve joined — is saved in your browser&apos;s local storage, not
        on a server tied to you personally. This means:
      </p>
      <ul className="list-disc pl-5 mb-6 space-y-1.5">
        <li>Clearing your browser data or switching browsers/devices loses that identity.</li>
        <li>Anyone else using the same browser profile can see and use it too.</li>
        <li>We have no way to verify who is actually behind any given name or game.</li>
      </ul>

      <h2 className="font-serif text-xl mt-10 mb-3">What&apos;s stored on our server</h2>
      <p className="mb-3">
        Live games — the board position, move history, player names and avatars you entered, and game
        status — are stored in our database for as long as the game is active or recently finished.
        Anyone with a link to a game can view it. This is by design (it&apos;s how spectating and sharing
        game links work) — don&apos;t put anything in a display name you wouldn&apos;t want a stranger to see.
      </p>
      <p className="mb-6">
        We don&apos;t run ads, we don&apos;t sell data, and we don&apos;t share anything with third parties
        for marketing. We don&apos;t currently have the infrastructure to verify age, identity, or
        ownership of any name or game — treat everything here as pseudonymous and public.
      </p>

      <h2 className="font-serif text-xl mt-10 mb-3">Cookies and local storage</h2>
      <p className="mb-6">
        We use your browser&apos;s local storage (not tracking cookies) to remember your identity, seat
        claims, and display preferences between visits. We don&apos;t use third-party analytics or
        advertising cookies.
      </p>

      <h2 className="font-serif text-xl mt-10 mb-3">Removing your data</h2>
      <p className="mb-6">
        Since there&apos;s no account to delete, clearing your browser&apos;s local storage for this site
        removes your local identity immediately. To ask us to remove a specific game or profile from our
        server, reach out using the contact info on this site.
      </p>

      <h2 className="font-serif text-xl mt-10 mb-3">Changes</h2>
      <p>
        If how we handle data changes — for example, if we later introduce real accounts — this page will
        be updated and the date at the top will change.
      </p>
    </main>
  );
}