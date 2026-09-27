export const metadata = { title: "Credits — CHESS//X" };

export default function CreditsPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16 text-[15px] leading-relaxed" style={{ color: "#EDEEF0" }}>
      <h1 className="font-serif text-3xl mb-8">Credits</h1>
      <p className="mb-2">
        Piece artwork is a recolored, restyled derivative of the Merida chess font by Armando Hernandez
        Marroquin, used under GPLv2+.
      </p>
      <p className="text-sm" style={{ color: "#8f8a9c" }}>
        Original geometry: Armando Hernandez Marroquin. Recoloring, outline, and gloss treatment for
        CHESS//X.
      </p>
    </main>
  );
}