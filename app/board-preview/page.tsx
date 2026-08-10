import GameBoard from "../../components/GameBoard";

export default function BoardPreview() {
  return (
    <div className="min-h-screen bg-[#12181B] text-[#EDEAE1] p-10 flex flex-col items-center">
      <h1 className="font-serif text-2xl mb-1 tracking-wide">Full rules preview</h1>
      <p className="text-sm text-[#A9A499] mb-8">
        Real chess rules via chess.js — check, checkmate, stalemate, castling, en passant, promotion.
      </p>
      <GameBoard whiteLabel="Player 1" blackLabel="Player 2" />
    </div>
  );
}
