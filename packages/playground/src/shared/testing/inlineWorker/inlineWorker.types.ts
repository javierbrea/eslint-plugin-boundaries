/** The side of an inline worker that its script sees, as `self` in a worker. */
export type InlineWorkerScope = {
  /** Called with each message that the page sends, as a copy. */
  onmessage: ((event: MessageEvent) => void) | null;
  /** Sends a message to the page, as a copy. */
  postMessage(message: unknown): void;
};

/** The script of an inline worker: it receives the side of the worker and sets its `onmessage`. */
export type InlineWorkerScript = (scope: InlineWorkerScope) => void;
