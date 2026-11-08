import type { Sketch, StateStore } from "@/contract";
import { decodeHash, encodeSketch } from "@/domains/share/helpers/sketchHash";

import { HASH_STORE_WRITE_DELAY } from "./HashStore.constants";

/** A write that waits for the end of the typing, and what stops it */
type PendingWrite = {
  /** The timer that runs the write after the delay */
  readonly timer: number;
  /** Runs the write at once, as the timer and `pagehide` do */
  readonly run: () => void;
};

/**
 * Store that keeps the sketch in the hash of the URL, as `#v=1&s=…`, so that a link opens the sketch. Its `load` is the one that reads the hash, and a hash that the user changes in the address bar reaches the playground through `subscribe`.
 *
 * It keeps the last sketch it saved for as long as the store lives, so that a page that is left and visited again, without the hash, gets the sketch back and writes it to the URL. It touches `window` only inside its methods, which the playground calls from effects and handlers.
 */
export class HashStore implements StateStore {
  private _sketch: Sketch | undefined;

  private _pending: PendingWrite | undefined;

  public load(): Promise<Sketch | undefined> {
    this._cancelWrite();

    const reading = decodeHash(window.location.hash);

    if (reading.status === "error") {
      return Promise.reject(new Error(reading.error));
    }
    if (reading.status === "sketch") {
      this._sketch = reading.sketch;
    } else if (this._sketch !== undefined) {
      this._write(encodeSketch(this._sketch));
    }
    return Promise.resolve(this._sketch);
  }

  /**
   * Remembers the sketch and writes it to the hash once the user stops saving: 500 milliseconds after the last save, or when the page is hidden, whichever comes first. The returned promise does not wait for the write.
   * @param sketch The sketch to save.
   */
  public save(sketch: Sketch): Promise<void> {
    this._cancelWrite();
    this._sketch = sketch;

    const run = (): void => {
      this._cancelWrite();
      this._write(encodeSketch(sketch));
    };

    this._pending = {
      timer: window.setTimeout(run, HASH_STORE_WRITE_DELAY),
      run,
    };
    window.addEventListener("pagehide", run);
    return Promise.resolve();
  }

  public clear(): Promise<void> {
    this._cancelWrite();
    this._sketch = undefined;
    this._replace("");
    return Promise.resolve();
  }

  /**
   * Remembers the sketch, writes it to the hash at once and makes the link that opens it. A write that is pending is dropped: this one is the newer.
   * @param sketch The sketch the link opens.
   * @returns The URL of the page with the hash of the sketch, with the origin.
   */
  public share(sketch: Sketch): Promise<string> {
    const hash = encodeSketch(sketch);
    const page = window.location;

    this._cancelWrite();
    this._sketch = sketch;
    this._write(hash);
    return Promise.resolve(
      `${page.origin}${page.pathname}${page.search}#${hash}`
    );
  }

  public subscribe(listener: () => void): () => void {
    // The playground only writes with `replaceState`, which fires no `hashchange`, so what fires it is the user
    const onChange = (): void => listener();

    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }

  /** Stops the write that is pending, if there is one, and the `pagehide` listener that came with it */
  private _cancelWrite(): void {
    if (this._pending !== undefined) {
      window.clearTimeout(this._pending.timer);
      window.removeEventListener("pagehide", this._pending.run);
      this._pending = undefined;
    }
  }

  /**
   * Writes a hash to the URL of the page, which keeps its path and its query.
   * @param hash The hash, without the leading `#`.
   */
  private _write(hash: string): void {
    this._replace(`#${hash}`);
  }

  /**
   * Replaces the URL of the page with the same path and query and another hash. It adds no entry to the history and keeps the state that the router of the host stored in it. A browser can refuse the call when it is made too many times in a short time (Safari throws a `SecurityError` after 100 calls in 10 seconds): the refusal is swallowed, and the next write tries again.
   * @param hash The hash with its `#`, or an empty string to remove it.
   */
  private _replace(hash: string): void {
    const { pathname, search } = window.location;

    try {
      window.history.replaceState(
        window.history.state,
        "",
        `${pathname}${search}${hash}`
      );
    } catch {
      // The sketch stays in memory, and the next save or share writes it
    }
  }
}
