import type {
  InlineWorkerScope,
  InlineWorkerScript,
} from "./inlineWorker.types";

/** The workers that were created and not terminated. */
const liveWorkers = new Set<InlineWorker>();

/** The messages that wait while the workers are held, in the order they were sent, or `undefined` while they are not held. */
let heldMessages: (() => void)[] | undefined;

/** An error that the handler of the page threw when the script answered a message. It goes up through the script, which never sees it as its own. */
class PageHandlerError extends Error {
  /**
   * Wraps the error of the handler of the page.
   * @param error What the handler threw.
   */
  constructor(readonly error: unknown) {
    super(
      "The handler of the page threw while the script of the worker answered"
    );
  }
}

/** A worker that runs its script in the thread of the tests. Messages go both ways as copies, as `postMessage` makes them, and arrive at once: a message to the worker runs its script before `postMessage` returns, unless the workers are held. A script that throws while it handles a message fails the worker, as in a browser; an error of the handler of the page reaches the code that sent the message instead, where a browser reports it as uncaught in the page. */
class InlineWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessageerror: ((event: MessageEvent) => void) | null = null;

  private readonly scope: InlineWorkerScope;

  private terminated = false;

  /**
   * Creates the worker and runs its script.
   * @param script The script, which the URL of a real worker would load.
   */
  constructor(script: InlineWorkerScript) {
    this.scope = {
      onmessage: null,
      postMessage: (message) => {
        if (!this.terminated) {
          try {
            this.onmessage?.(
              new MessageEvent("message", { data: structuredClone(message) })
            );
          } catch (error) {
            throw new PageHandlerError(error);
          }
        }
      },
    };
    liveWorkers.add(this);
    script(this.scope);
  }

  /**
   * Sends a message to the script.
   * @param message The message, which the script receives as a copy.
   */
  postMessage(message: unknown): void {
    const data = structuredClone(message);
    const deliver = (): void => {
      if (!this.terminated) {
        try {
          this.scope.onmessage?.(new MessageEvent("message", { data }));
        } catch (error) {
          if (error instanceof PageHandlerError) {
            throw error.error;
          }
          // A browser reports an error of the script on the `onerror` of the worker, and never to the code that sent the message
          this.fail();
        }
      }
    };

    if (heldMessages === undefined) {
      deliver();
    } else {
      heldMessages.push(deliver);
    }
  }

  /** Stops the worker: nothing reaches it or comes from it afterwards. */
  terminate(): void {
    this.terminated = true;
    liveWorkers.delete(this);
  }

  /** Fails the worker, as a script that throws or cannot load: its `onerror` is called. */
  fail(): void {
    this.onerror?.(new Event("error"));
  }
}

/**
 * Gives the window a `Worker` that runs a script in the thread of the tests, whatever URL it is created with, since jsdom has none. `jest.setup.cjs` installs it with the script of the playground's worker.
 * @param script The script that each worker runs.
 */
export function installInlineWorker(script: InlineWorkerScript): void {
  globalThis.Worker = class extends InlineWorker {
    constructor() {
      super(script);
    }
  } as unknown as typeof Worker;
}

/** Holds every message sent to a worker from now on, so that a spec sees what the page shows while an evaluation runs. {@link releaseInlineWorkers} delivers them. */
export function holdInlineWorkers(): void {
  heldMessages ??= [];
}

/** Delivers the messages that wait, in the order they were sent, to the workers that are not terminated, and stops holding the next ones. */
export function releaseInlineWorkers(): void {
  const messages = heldMessages ?? [];

  heldMessages = undefined;
  messages.forEach((deliver) => deliver());
}

/** Fails every worker that is not terminated, as a script that throws or cannot load. */
export function failInlineWorkers(): void {
  [...liveWorkers].forEach((worker) => worker.fail());
}

/** Drops the messages that wait and stops holding, so that each test starts with workers that answer at once. */
export function resetInlineWorkers(): void {
  heldMessages = undefined;
}
