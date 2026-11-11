import type { Sketch, StateStore } from "@/contract";
import { decodeHash, encodeSketch } from "@/domains/share/helpers/sketchHash";

import { HASH_STORE_WRITE_DELAY } from "./HashStore.constants";

/** A write that waits for the end of the typing, and what stops it */
type PendingWrite = {
  /** The timer that runs the write after the delay */
  readonly timer: number;
  /** Runs the write at once, as the timer and `pagehide` do. It writes nothing when the page is no longer the one that scheduled the write */
  readonly run: () => void;
};

/**
 * Store that keeps the sketch in the hash of the URL, as `#v=1&s=…`, so that a link opens the sketch. Its `load` is the one that reads the hash, and a hash that the user changes in the address bar reaches the playground through `subscribe`.
 *
 * It keeps the last sketch it saved for as long as the store lives, with the hash it last read or wrote and whether the sketch is newer than that hash, because a save waits to write and the write can be dropped. A page that is visited again, after it was left, gets that sketch back when its hash is none, which is written to the URL, or the hash the store last read or wrote, which is written again when the sketch is newer. Any other hash, such as a link that was pasted, the docs button or an older entry of the history, gives the sketch it holds, and a sketch that was not written is lost. It touches `window` only inside its methods, which the playground calls from effects and handlers.
 */
export class HashStore implements StateStore {
  /** The last sketch that the store saved, shared or read from a hash */
  private _sketch: Sketch | undefined;

  /** The hash of the URL, with its `#`, as the store last read it or wrote it. It is `undefined` until the store does either, and after `clear` */
  private _hash: string | undefined;

  /** Whether `_sketch` is newer than `_hash`: it was saved after that hash was read or written, and no write has put it in the URL */
  private _unwritten = false;

  private _pending: PendingWrite | undefined;

  /**
   * Loads the sketch that the hash holds. A sketch that was saved after the store last read or wrote that same hash, and is not written yet, is the newer one: it is the sketch loaded, and it is written. When the hash holds none, the last sketch saved is loaded and written back to the URL. A write that is pending is dropped. It never throws: whatever goes wrong is a rejected promise.
   * @returns The sketch, or `undefined` when there is none. It rejects with the reason when the hash cannot be read.
   */
  public async load(): Promise<Sketch | undefined> {
    // Nothing waits here, so the hash is read and the pending write dropped when `load` is called, and what throws rejects the promise
    return this._read();
  }

  /**
   * Remembers the sketch and writes it to the hash once the user stops saving: 500 milliseconds after the last save, or when the page is hidden, whichever comes first. The returned promise does not wait for the write. The write is for the page that saved: when the host has moved to another page by then, such as a client-side navigation to the docs, nothing is written there. Nor is it written over another link that the hash holds by then, such as the one of a docs button that brought the host back before the delay ended, or one pasted in the address bar, so that the next `load` reads that link. Until it is written, the sketch is newer than the hash: the next `load` gives it, and writes it, when the page has no hash or has the one the store last read or wrote, and gives the sketch of any other hash instead.
   * @param sketch The sketch to save.
   */
  public save(sketch: Sketch): Promise<void> {
    this._remember(sketch);

    const page = this._getPage();
    const run = (): void => {
      this._cancelWrite();
      if (this._getPage() === page && !this._holdsAnotherLink()) {
        this._write(encodeSketch(sketch));
      }
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
    this._hash = undefined;
    this._unwritten = false;
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

    this._remember(sketch);
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

  /**
   * Reads the hash of the page, as {@link HashStore.load} does.
   * @returns The sketch, or `undefined` when there is none. It throws the reason when the hash cannot be read.
   */
  private _read(): Sketch | undefined {
    this._cancelWrite();

    const { hash } = window.location;

    // The hash is the one this store last read or wrote, so nothing outside changed it since: the sketch that was not written yet is the newest, and no other hash can take its place
    if (this._unwritten && hash === this._hash) {
      return this._writeBack();
    }

    const reading = decodeHash(hash);

    if (reading.status === "error") {
      throw new Error(reading.error);
    }
    if (reading.status === "sketch") {
      this._sketch = reading.sketch;
      this._hash = hash;
      this._unwritten = false;
      return this._sketch;
    }
    return this._writeBack();
  }

  /**
   * Keeps a sketch as the newest one, which the URL does not hold yet, and drops the write that is pending, which is older.
   * @param sketch The sketch to remember.
   */
  private _remember(sketch: Sketch): void {
    this._cancelWrite();
    this._sketch = sketch;
    this._unwritten = true;
  }

  /**
   * Writes the remembered sketch to the URL, when there is one.
   * @returns The remembered sketch, or `undefined` when there is none.
   */
  private _writeBack(): Sketch | undefined {
    if (this._sketch !== undefined) {
      this._write(encodeSketch(this._sketch));
    }
    return this._sketch;
  }

  /**
   * Tells whether the hash of the URL is a link of the playground that the store did not last read or write, which a write that waited must not overwrite. A hash with no sketch, such as the anchor of a heading, is no link.
   * @returns True when the hash holds a sketch, or one that cannot be read, and is not the hash the store last read or wrote.
   */
  private _holdsAnotherLink(): boolean {
    const { hash } = window.location;

    return hash !== this._hash && decodeHash(hash).status !== "empty";
  }

  /**
   * Gets the page that the URL is of, without its hash.
   * @returns The path and the query.
   */
  private _getPage(): string {
    const { pathname, search } = window.location;

    return `${pathname}${search}`;
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
   * Writes a hash to the URL of the page, which keeps its path and its query. The sketch is no longer newer than the hash once the URL has it: a write that the browser refuses leaves it newer, so that the next load or write tries again.
   * @param hash The hash, without the leading `#`.
   */
  private _write(hash: string): void {
    if (this._replace(`#${hash}`)) {
      this._hash = window.location.hash;
      this._unwritten = false;
    }
  }

  /**
   * Replaces the URL of the page with the same path and query and another hash. It adds no entry to the history and keeps the state that the router of the host stored in it. A browser can refuse the call when it is made too many times in a short time (Safari throws a `SecurityError` after 100 calls in 10 seconds): the refusal is swallowed, and the next write tries again.
   * @param hash The hash with its `#`, or an empty string to remove it.
   * @returns Whether the browser replaced the URL.
   */
  private _replace(hash: string): boolean {
    try {
      window.history.replaceState(
        window.history.state,
        "",
        `${this._getPage()}${hash}`
      );
      return true;
    } catch {
      // The sketch stays in memory, and the next save or share writes it
      return false;
    }
  }
}
