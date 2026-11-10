// The script of the worker that evaluates sketches. Only `spawnWorker` names it, through its URL, so that the engine and the `@boundaries/*` packages load in the worker and never in the page
import { serveEvaluations } from "./serveEvaluations";

serveEvaluations(self as unknown as Parameters<typeof serveEvaluations>[0]);
