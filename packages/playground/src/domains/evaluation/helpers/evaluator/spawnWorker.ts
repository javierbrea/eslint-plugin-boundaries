/** The name of the worker, which the developer tools of the browser show for its thread. */
const WORKER_NAME = "playground-evaluation";

/**
 * Creates the worker that evaluates sketches. The bundler of each host finds the script of the worker through this expression, which must stay as written: next to `dist/index.js` in the build of the package, where tsup writes `evaluation.worker.js`, and next to this file in `src/`, where Vite takes the `.ts` file for the `.js` one.
 * @returns The worker.
 */
export function spawnWorker(): Worker {
  return new Worker(new URL("./evaluation.worker.js", import.meta.url), {
    type: "module",
    name: WORKER_NAME,
  });
}
