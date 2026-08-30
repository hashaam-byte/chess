import SiteNav from "@/components/SiteNav";

export default function PlayPage() {
  return (
    <div className="min-h-screen" style={{ background: "#07070A", color: "#F5F3F7" }}>
      <SiteNav />
      <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="font-serif font-semibold text-2xl mb-3">The board isn&apos;t wired up yet</h1>
        <p className="text-sm max-w-sm" style={{ color: "#8f8a9c" }}>
          We&apos;re building the site in order — profile and Watch first, the actual playable board
          (and what makes a game show up on Watch) comes next.
        </p>
      </div>
    </div>
  );
}
