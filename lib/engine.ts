// Client-only wrapper around the Stockfish 18 (lite, single-threaded) WASM engine.
// The engine is loaded lazily — nothing is fetched until analyze() is first called,
// so games that don't use analysis never pay the ~7MB download.

export type EngineEval = { cp: number | null; mate: number | null };

const ENGINE_URL = "/stockfish/stockfish-18-lite-single.js";

class Engine {
  private worker: Worker | null = null;
  private ready: Promise<void> | null = null;
  private queue: Promise<unknown> = Promise.resolve();

  private ensureReady(): Promise<void> {
    if (this.ready) return this.ready;

    this.ready = new Promise((resolve, reject) => {
      try {
        const worker = new Worker(ENGINE_URL);
        this.worker = worker;
        const onMessage = (e: MessageEvent) => {
          const line = typeof e.data === "string" ? e.data : "";
          if (line.startsWith("uciok")) {
            worker.removeEventListener("message", onMessage);
            resolve();
          }
        };
        worker.addEventListener("message", onMessage);
        worker.addEventListener("error", (e) => reject(e));
        worker.postMessage("uci");
      } catch (err) {
        reject(err);
      }
    });

    return this.ready;
  }

  /** Evaluate a position. Returns centipawns (or mate-in-N) from White's perspective. */
  async evaluate(fen: string, depth = 12): Promise<EngineEval> {
    // Stockfish handles one search at a time — serialize calls through a queue
    // so concurrent analyze() calls don't cross-talk on the same worker.
    const run = this.queue.then(() => this.evaluateNow(fen, depth));
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async evaluateNow(fen: string, depth: number): Promise<EngineEval> {
    await this.ensureReady();
    const worker = this.worker;
    if (!worker) return { cp: null, mate: null };

    const sideToMove = fen.split(" ")[1] === "b" ? -1 : 1;

    return new Promise<EngineEval>((resolve) => {
      let last: EngineEval = { cp: null, mate: null };

      const onMessage = (e: MessageEvent) => {
        const line = typeof e.data === "string" ? e.data : "";
        const cpMatch = line.match(/score cp (-?\d+)/);
        const mateMatch = line.match(/score mate (-?\d+)/);
        if (cpMatch) last = { cp: parseInt(cpMatch[1], 10) * sideToMove, mate: null };
        if (mateMatch) last = { cp: null, mate: parseInt(mateMatch[1], 10) * sideToMove };
        if (line.startsWith("bestmove")) {
          worker.removeEventListener("message", onMessage);
          resolve(last);
        }
      };

      worker.addEventListener("message", onMessage);
      // Full-strength search, always — a bot game earlier in this session
      // may have left UCI_LimitStrength on, and eval/review must never be
      // artificially weakened by that leftover state.
      worker.postMessage("setoption name UCI_LimitStrength value false");
      worker.postMessage(`position fen ${fen}`);
      worker.postMessage(`go depth ${depth}`);
    });
  }

  /**
   * Returns Stockfish's chosen move (UCI form, e.g. "e2e4", or "e7e8q" for a
   * promotion) plus the top few candidates at the root, for a given search
   * depth and optional strength cap. Separate from evaluate() because bot
   * play and position evaluation have different needs (a bot wants *a*
   * move, not a score) and different engine settings (limited strength).
   * Serialized through the same queue as evaluate() — one search at a time.
   */
  async getMove(fen: string, opts: { depth: number; limitElo?: number }): Promise<{ move: string | null; alternatives: string[] }> {
    const run = this.queue.then(() => this.getMoveNow(fen, opts));
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async getMoveNow(fen: string, opts: { depth: number; limitElo?: number }): Promise<{ move: string | null; alternatives: string[] }> {
    await this.ensureReady();
    const worker = this.worker;
    if (!worker) return { move: null, alternatives: [] };

    return new Promise((resolve) => {
      const candidates = new Set<string>();

      const onMessage = (e: MessageEvent) => {
        const line = typeof e.data === "string" ? e.data : "";
        // "info depth 3 ... pv e2e4 e7e5 ..." — the move right after "pv" is
        // that line's root move; collecting these across the search gives a
        // small, still-reasonable pool of alternatives for blunder injection
        // to pick from, rather than a truly random legal move.
        const pvMatch = line.match(/ pv (\S+)/);
        if (pvMatch) candidates.add(pvMatch[1]);
        if (line.startsWith("bestmove")) {
          worker.removeEventListener("message", onMessage);
          const best = line.split(" ")[1] ?? null;
          resolve({ move: best, alternatives: Array.from(candidates) });
        }
      };

      worker.addEventListener("message", onMessage);
      // Explicitly set every time (never assume prior state) — this is the
      // one call site allowed to weaken the engine, and it must never leak
      // into a later evaluate() call.
      if (opts.limitElo) {
        worker.postMessage("setoption name UCI_LimitStrength value true");
        worker.postMessage(`setoption name UCI_Elo value ${opts.limitElo}`);
      } else {
        worker.postMessage("setoption name UCI_LimitStrength value false");
      }
      worker.postMessage(`position fen ${fen}`);
      worker.postMessage(`go depth ${opts.depth}`);
    });
  }


  terminate() {
    this.worker?.terminate();
    this.worker = null;
    this.ready = null;
  }
}

let singleton: Engine | null = null;

/** Returns the shared engine instance. Only call from client code. */
export function getEngine(): Engine {
  if (!singleton) singleton = new Engine();
  return singleton;
}