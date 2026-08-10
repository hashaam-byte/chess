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
      worker.postMessage(`position fen ${fen}`);
      worker.postMessage(`go depth ${depth}`);
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
