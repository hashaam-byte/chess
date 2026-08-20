"use client";

import { useEffect, useRef, useState } from "react";
import { Chess, type Square, type Move } from "chess.js";
import Image from "next/image";
import Board from "./Board";
import EvalBar from "./EvalBar";
import GameReview, { accuracyFromAvgLoss, type PlyAnalysis } from "./GameReview";
import { getEngine, type EngineEval } from "../lib/engine";
import { classifyMove, QUALITY_LABEL, QUALITY_COLOR } from "../lib/moveQuality";

type PieceType = "king" | "queen" | "rook" | "bishop" | "knight" | "pawn";
const TYPE_MAP: Record<string, PieceType> = {
  k: "king", q: "queen", r: "rook", b: "bishop", n: "knight", p: "pawn",
};
const PROMO_ORDER: { flag: "q" | "r" | "b" | "n"; type: PieceType }[] = [
  { flag: "q", type: "queen" },
  { flag: "r", type: "rook" },
  { flag: "b", type: "bishop" },
  { flag: "n", type: "knight" },
];

type MoveEnd = { from: Square; to: Square };

function toBoardPosition(chess: Chess) {
  return chess.board().map((row) =>
    row.map((cell) =>
      cell ? { type: TYPE_MAP[cell.type], color: cell.color === "w" ? ("white" as const) : ("black" as const) } : null
    )
  );
}

// Groups a flat SAN move list into numbered pairs for display, e.g. "1. e4 e5".
function pairMoves(history: string[]) {
  const pairs: { n: number; white: string; black?: string }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({ n: i / 2 + 1, white: history[i], black: history[i + 1] });
  }
  return pairs;
}

const CAPTURE_VALUE: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };

function capturedBy(chess: Chess, color: "w" | "b") {
  return chess
    .history({ verbose: true })
    .filter((m) => m.color === color && m.captured)
    .map((m) => m.captured as string)
    .sort((a, b) => CAPTURE_VALUE[a] - CAPTURE_VALUE[b]);
}

// Converts an engine eval (already White-perspective) into a single signed
// number, big-but-ordered for forced mates, so moves can be compared.
function whitePerspectiveValue(e: EngineEval): number {
  if (e.mate != null) return e.mate > 0 ? 100000 - e.mate : -100000 - e.mate;
  return e.cp ?? 0;
}

function moverValue(e: EngineEval, mover: "w" | "b"): number {
  const v = whitePerspectiveValue(e);
  return mover === "w" ? v : -v;
}

export default function GameBoard({
  whiteLabel = "White",
  blackLabel = "Black",
  onResult,
}: {
  whiteLabel?: string;
  blackLabel?: string;
  onResult?: (winner: "white" | "black" | "draw") => void;
}) {
  // The Chess instance is mutable and mutated in place inside event handlers;
  // `version` is bumped alongside it purely to force a re-render. It's kept in
  // useState (not useRef) so nothing reads a ref's `.current` during render.
  const [chess, setChess] = useState(() => new Chess());
  const [version, setVersion] = useState(0);
  const touch = () => setVersion((v) => v + 1);

  const [selected, setSelected] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<MoveEnd | null>(null);
  const [promo, setPromo] = useState<MoveEnd | null>(null);
  const [resolved, setResolved] = useState(false);
  const [resigned, setResigned] = useState<"white" | "black" | null>(null);

  const [analysis, setAnalysis] = useState<PlyAnalysis[] | null>(null);
  const [evalPoints, setEvalPoints] = useState<number[] | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [reviewProgress, setReviewProgress] = useState(0);

  // Live Stockfish eval bar. Runs in the background after every move; the
  // request id guards against a slower earlier evaluation overwriting a
  // newer one if moves are made faster than the engine can respond.
  const [liveEval, setLiveEval] = useState<EngineEval | null>(null);
  const [evalPending, setEvalPending] = useState(false);
  const evalRequestRef = useRef(0);

  function triggerLiveEval(fen: string) {
    const id = ++evalRequestRef.current;
    setEvalPending(true);
    getEngine()
      .evaluate(fen, 12)
      .then((result) => {
        if (evalRequestRef.current === id) {
          setLiveEval(result);
          setEvalPending(false);
        }
      })
      .catch(() => {
        if (evalRequestRef.current === id) setEvalPending(false);
      });
  }

  useEffect(() => {
    // Deferred to a microtask so the engine kickoff (and its state update)
    // doesn't happen synchronously inside the effect body.
    queueMicrotask(() => triggerLiveEval(chess.fen()));
    // Only ever evaluate the starting position on mount — subsequent moves
    // trigger their own evaluation directly from the handlers that make them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // `version` isn't read here, but the Chess instance mutates in place —
  // this recompute has to re-run on every state change that touches it,
  // and an 8x8 array build is cheap enough not to bother memoizing.
  void version;
  const position = toBoardPosition(chess);
  const history = chess.history();

  const turn = chess.turn() === "w" ? "white" : "black";
  const inCheck = chess.inCheck();
  const isCheckmate = chess.isCheckmate();
  const isStalemate = chess.isStalemate();
  const isDraw = chess.isDraw();
  const gameOver = isCheckmate || isStalemate || isDraw || resigned !== null;

  let checkSquare: string | null = null;
  if (inCheck) {
    const kingCell = chess.board().flat().find((c) => c && c.type === "k" && c.color === chess.turn());
    if (kingCell) checkSquare = kingCell.square;
  }

  const legalMoves = selected ? chess.moves({ square: selected, verbose: true }) : [];
  const legalTargets = legalMoves.map((m) => m.to);
  const whiteCaptures = capturedBy(chess, "w");
  const blackCaptures = capturedBy(chess, "b");

  function commitResult() {
    if (resolved) return;
    setResolved(true);
    if (resigned) onResult?.(resigned === "white" ? "black" : "white");
    else if (isCheckmate) onResult?.(turn === "white" ? "black" : "white");
    else if (isStalemate || isDraw) onResult?.("draw");
  }

  function handleSquareClick(sqStr: string) {
    if (gameOver || promo) return;
    const sq = sqStr as Square;

    if (selected) {
      if (legalTargets.includes(sq)) {
        const mv = legalMoves.find((m) => m.to === sq);
        if (mv?.isPromotion()) {
          setPromo({ from: selected, to: sq });
          setSelected(null);
          return;
        }
        chess.move({ from: selected, to: sq });
        setLastMove({ from: selected, to: sq });
        setSelected(null);
        touch();
        triggerLiveEval(chess.fen());
        return;
      }
      const piece = chess.get(sq);
      setSelected(piece && piece.color === chess.turn() ? sq : null);
      return;
    }

    const piece = chess.get(sq);
    if (piece && piece.color === chess.turn()) {
      setSelected(sq);
    }
  }

  function choosePromotion(flag: "q" | "r" | "b" | "n") {
    if (!promo) return;
    chess.move({ from: promo.from, to: promo.to, promotion: flag });
    setLastMove({ from: promo.from, to: promo.to });
    setPromo(null);
    touch();
    triggerLiveEval(chess.fen());
  }

  function undoMove() {
    if (gameOver || promo) return;
    chess.undo();
    const hist = chess.history({ verbose: true });
    const prev = hist[hist.length - 1];
    setLastMove(prev ? { from: prev.from, to: prev.to } : null);
    setSelected(null);
    touch();
    triggerLiveEval(chess.fen());
  }

  function resign(color: "white" | "black") {
    if (gameOver) return;
    setResigned(color);
    touch();
  }

  function resetGame() {
    const fresh = new Chess();
    setChess(fresh);
    setSelected(null);
    setLastMove(null);
    setPromo(null);
    setResolved(false);
    setResigned(null);
    setAnalysis(null);
    setEvalPoints(null);
    setReviewProgress(0);
    setLiveEval(null);
    triggerLiveEval(fresh.fen());
  }

  async function reviewGame() {
    if (reviewing || history.length === 0) return;
    setReviewing(true);
    setReviewProgress(0);
    setAnalysis(null);
    setEvalPoints(null);

    const moves: Move[] = chess.history({ verbose: true });
    const engine = getEngine();
    const evalCache = new Map<string, EngineEval>();

    // Stockfish can't search a position with no legal moves (checkmate or
    // stalemate) — asking it to anyway silently returns a blank score, which
    // made the actual *checkmating* move look like a huge blunder. Resolve
    // those positions directly instead of asking the engine.
    function terminalEval(fen: string): EngineEval | null {
      const probe = new Chess(fen);
      if (probe.moves().length > 0) return null;
      if (probe.isCheckmate()) {
        // The side to move here has no moves and is in check — they're the
        // one who just got mated, so the score favors their opponent.
        return { cp: null, mate: probe.turn() === "w" ? -1 : 1 };
      }
      return { cp: 0, mate: null }; // stalemate or other no-moves draw
    }

    async function evalFen(fen: string): Promise<EngineEval> {
      const cached = evalCache.get(fen);
      if (cached) return cached;
      const result = terminalEval(fen) ?? (await engine.evaluate(fen, 14));
      evalCache.set(fen, result);
      return result;
    }

    const results: PlyAnalysis[] = [];
    const points: number[] = [];

    const firstEval = await evalFen(moves[0].before);
    points.push(whitePerspectiveValue(firstEval));

    for (let i = 0; i < moves.length; i++) {
      const mv = moves[i];
      const before = await evalFen(mv.before);
      const after = await evalFen(mv.after);
      // Capped: an individual move can be "very bad" without letting one
      // missed forced mate dominate the whole game's average.
      const cpLoss = Math.max(0, Math.min(1000, moverValue(before, mv.color) - moverValue(after, mv.color)));
      results.push({ quality: classifyMove(cpLoss), cpLoss });
      points.push(whitePerspectiveValue(after));
      setReviewProgress(i + 1);
    }

    setAnalysis(results);
    setEvalPoints(points);
    setReviewing(false);
  }

  let statusText = `${turn === "white" ? whiteLabel : blackLabel} to move`;
  if (resigned) statusText = `${resigned === "white" ? whiteLabel : blackLabel} resigned — ${resigned === "white" ? blackLabel : whiteLabel} wins`;
  else if (isCheckmate) statusText = `Checkmate — ${turn === "white" ? blackLabel : whiteLabel} wins`;
  else if (isStalemate) statusText = "Stalemate — draw";
  else if (isDraw) statusText = "Draw";
  else if (inCheck) statusText = `${turn === "white" ? whiteLabel : blackLabel} is in check`;

  let whiteAccuracy: number | undefined;
  let blackAccuracy: number | undefined;
  if (analysis) {
    const whiteMoves = analysis.filter((_, i) => i % 2 === 0);
    const blackMoves = analysis.filter((_, i) => i % 2 === 1);
    const avg = (arr: PlyAnalysis[]) => (arr.length ? arr.reduce((s, a) => s + a.cpLoss, 0) / arr.length : 0);
    whiteAccuracy = accuracyFromAvgLoss(avg(whiteMoves));
    blackAccuracy = accuracyFromAvgLoss(avg(blackMoves));
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="w-full flex items-start justify-between" style={{ maxWidth: 560 }}>
        <PlayerCard
          label={whiteLabel}
          active={turn === "white" && !gameOver}
          captures={whiteCaptures}
          captureColor="black"
          accuracy={whiteAccuracy}
        />
        <span
          className="text-xs sm:text-sm text-center px-3 pt-1.5 font-medium transition-colors duration-300"
          style={{ color: gameOver ? "var(--cx-accent)" : inCheck ? "#e0685f" : "#8f8a9c" }}
          role="status"
          aria-live="polite"
        >
          {statusText}
        </span>
        <PlayerCard
          label={blackLabel}
          active={turn === "black" && !gameOver}
          captures={blackCaptures}
          captureColor="white"
          accuracy={blackAccuracy}
          align="right"
        />
      </div>

      <div className="relative flex justify-center items-stretch gap-3 w-full">
        <EvalBar evalScore={liveEval} pending={evalPending} />
        <Board
          position={position}
          selected={selected}
          legalTargets={legalTargets}
          lastMove={lastMove}
          checkSquare={checkSquare}
          onSquareClick={handleSquareClick}
        />

        {promo && (
          <div
            className="absolute inset-0 flex items-center justify-center dl-fade-in"
            style={{ background: "rgba(13,17,20,0.8)", backdropFilter: "blur(2px)" }}
          >
            <div className="bg-[#111116] border border-[#3d3327] rounded-xl p-4 flex gap-3 shadow-2xl dl-pop-in">
              {PROMO_ORDER.map(({ flag, type }) => (
                <button
                  key={flag}
                  onClick={() => choosePromotion(flag)}
                  aria-label={`Promote to ${type}`}
                  className="relative w-16 h-16 flex items-center justify-center bg-[#272119] rounded-lg hover:bg-[#332c20] hover:scale-105 transition-all border border-[#3d3327]"
                >
                  <Image
                    src={`/pieces/${chess.turn() === "w" ? "white" : "black"}_${type}.png`}
                    alt=""
                    fill
                    sizes="64px"
                    style={{ objectFit: "contain" }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Move list */}
      {history.length > 0 && (
        <div
          className="w-full text-xs text-[#8f8a9c] overflow-y-auto rounded-lg border border-[#23232c] bg-[#0c0c10]"
          style={{ maxWidth: 560, maxHeight: 140 }}
        >
          <table className="w-full">
            <tbody>
              {pairMoves(history).map(({ n, white, black }) => {
                const whiteIdx = (n - 1) * 2;
                const blackIdx = whiteIdx + 1;
                const whiteQ = analysis?.[whiteIdx];
                const blackQ = analysis?.[blackIdx];
                return (
                  <tr key={n} className="odd:bg-[#111116]">
                    <td className="px-2 py-1 w-8 text-[#5c5968]">{n}.</td>
                    <td className="px-2 py-1 font-medium text-[#c8c6d0]">
                      <MoveCell san={white} quality={whiteQ} />
                    </td>
                    <td className="px-2 py-1 font-medium text-[#c8c6d0]">
                      {black && <MoveCell san={black} quality={blackQ} />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {analysis && evalPoints && (
        <GameReview analysis={analysis} evalPoints={evalPoints} whiteLabel={whiteLabel} blackLabel={blackLabel} />
      )}

      <div className="flex items-center gap-2 flex-wrap justify-center">
        {gameOver ? (
          <>
            {!resolved && (
              <button
                onClick={commitResult}
                className="px-5 py-2 rounded-full bg-gradient-to-b from-[var(--cx-accent-light)] to-[var(--cx-accent)] text-[#111116] text-sm font-semibold shadow-lg shadow-black/30 hover:brightness-110 transition"
              >
                Confirm result
              </button>
            )}
            {!analysis && (
              <button
                onClick={reviewGame}
                disabled={reviewing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition disabled:opacity-60"
                style={{ color: "#c8c6d0", borderColor: "#23232c" }}
              >
                <StockfishIcon pending={reviewing} />
                {reviewing ? `Reviewing… ${reviewProgress}/${history.length}` : "Review game with Stockfish"}
              </button>
            )}
          </>
        ) : (
          <>
            <button
              onClick={undoMove}
              disabled={history.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-[#8f8a9c] border border-[#23232c] hover:text-[#F5F3F7] hover:border-[#54493a] transition disabled:opacity-30 disabled:hover:text-[#8f8a9c] disabled:hover:border-[#23232c]"
            >
              <UndoIcon /> Undo move
            </button>
            <button
              onClick={() => resign(turn)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-[#d6746c] border border-[#4a2e2a] hover:text-[#f0a49c] hover:border-[#6b3c35] transition"
            >
              <FlagIcon /> {turn === "white" ? whiteLabel : blackLabel} resigns
            </button>
          </>
        )}
        <button
          onClick={resetGame}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-[#8f8a9c] border border-[#23232c] hover:text-[#F5F3F7] hover:border-[#54493a] transition"
        >
          <ResetIcon /> Reset board
        </button>
      </div>

      <style>{`
        @keyframes dlFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .dl-fade-in { animation: dlFadeIn 150ms ease-out; }
        @keyframes dlPopIn {
          from { opacity: 0; transform: scale(0.92) translateY(6px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .dl-pop-in { animation: dlPopIn 180ms cubic-bezier(0.2,0.8,0.2,1); }
      `}</style>
    </div>
  );
}

function UndoIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10h10a5 5 0 0 1 0 10H7" />
      <path d="M3 10l5-5M3 10l5 5" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3v18" />
      <path d="M5 4h11l-2.5 4L16 12H5" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  );
}

function StockfishIcon({ pending }: { pending: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={pending ? { animation: "dlSpin 1s linear infinite" } : undefined}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <style>{`@keyframes dlSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}

function MoveCell({ san, quality }: { san: string; quality?: PlyAnalysis }) {
  if (!quality) return <>{san}</>;
  return (
    <span className="inline-flex items-center gap-1.5" title={`${QUALITY_LABEL[quality.quality]} (${quality.cpLoss}cp loss)`}>
      {san}
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: QUALITY_COLOR[quality.quality] }}
      />
    </span>
  );
}

function PlayerCard({
  label,
  active,
  captures,
  captureColor,
  accuracy,
  align = "left",
}: {
  label: string;
  active: boolean;
  captures: string[];
  captureColor: "white" | "black";
  accuracy?: number;
  align?: "left" | "right";
}) {
  return (
    <div className={`flex flex-col gap-1 ${align === "right" ? "items-end" : "items-start"}`}>
      <div className="flex items-center gap-1.5" style={{ flexDirection: align === "right" ? "row-reverse" : "row" }}>
        <span
          className="w-1.5 h-1.5 rounded-full transition-colors duration-300"
          style={{ background: active ? "var(--cx-accent)" : "#3d3327", boxShadow: active ? "0 0 6px var(--cx-accent)" : "none" }}
        />
        <span
          className="text-sm font-medium transition-colors duration-300"
          style={{ color: active ? "#F5F3F7" : "#8f8a9c" }}
        >
          {label}
        </span>
        {accuracy != null && (
          <span className="text-[10px] font-semibold" style={{ color: "var(--cx-accent)" }}>
            {accuracy.toFixed(1)}%
          </span>
        )}
      </div>
      {captures.length > 0 && (
        <div className="flex -space-x-1" style={{ flexDirection: align === "right" ? "row-reverse" : "row" }}>
          {captures.map((type, i) => (
            <div key={i} className="relative w-4 h-4 opacity-70">
              <Image src={`/pieces/${captureColor}_${TYPE_MAP[type]}.png`} alt="" fill sizes="16px" style={{ objectFit: "contain" }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
