/** Milliseconds that the worker may take with an evaluation before the evaluator stops it and reports it stopped. A link within the limits of the share can describe a file with a pattern that never ends, and the worker would keep a core busy for as long as the page is open. */
export const EVALUATION_TIME_LIMIT = 30_000;

/** Milliseconds that the evaluator may be busy before it reports that it is late, so that the panes say an evaluation is running only when it takes long enough to be seen. A usual evaluation takes a few milliseconds, and a sign that came and went in each of them would flicker. */
export const LATE_AFTER = 400;

/** Milliseconds that an evaluation must have been running before a newer sketch stops it. A shorter one is left to end, and the newer sketch waits for it: a new worker loads its script again, which takes longer than most evaluations. */
export const REPLACE_AFTER = 400;
