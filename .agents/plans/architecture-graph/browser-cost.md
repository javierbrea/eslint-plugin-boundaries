# Research note: the cost in a browser

Measured on 2026-11-22 in headless Chromium 159 (playwright-core 1.65.1), on one machine (Apple M1 Pro, 16 GB, under memory pressure for the whole run). It answers the last open question of phase 1 and gives the threshold of decision 31.

## What it says

- The evaluation is the cost that matters, and it grows with the dependencies: about 0.38 s for `packages/playground` (725 files, 2740 dependencies), 4.3 s for ten times that, 16.7 s for forty times. The same trees with no dependency evaluate in 5 ms to 181 ms.
- Replying with both forms (decision 14) is cheap: it adds 13% to 22% to the transfer of the reply, 3 ms for the real project and 24 ms for ten times it, which is under 1% of the round trip. The descriptions stay shared: after the message, every file and dependency description of the analysis is the same object as in the evaluation.
- The aggregation is negligible: 0.3 ms for the real project and 27 ms for forty times it.
- The limit of the Map is the number of edges, not any of these times. By element, the playground alone gives 604 edges, 371 without tests. By element type it gives 97, 65 without tests, at any size.
- The evaluation never blocks the page, but reading its reply does, on the page thread: 8 ms for the real project, 48 ms for five times it, 110 ms for ten times, 513 ms for forty times.

## Method

- The worker is the built `packages/playground/dist/evaluation.worker.js`, with its bare imports bundled by esbuild as a host does, not minified. A wrapper times the real handler, from its call until it posts the reply.
- The sketch is `packages/playground` itself, read as `spike/read-project.mjs` does: one boundaries config (31 element descriptors, 57 policies), 2209 dependencies to files and 531 to external modules, all allowed.
- A bigger project is N copies of it under `c1/` to `cN/`, with the patterns of the config prefixed so that the copies classify. One copy gives the same verdicts and edges as the real one.
- The second form is simulated in the worker from the real `Evaluation`, after the type sketch of `00-shared.md`, "The interface of `@boundaries/analysis`". "Thin" shares the dependency objects; "thick" also builds each dependency again, as the adapter does to add its source.
- The aggregation is a function modeled on `aggregate` of `mockup/react-flow/src/main.jsx`.
- Medians. Fresh workers and warm runs per worker: 5 and 5 up to five copies, 3 and 3 for ten, 2 and 2 for twenty, 1 and 1 for forty.
- The scripts are in `spike/browser-cost/sources.tar.gz`. `cost-all.sh` runs everything and `cost-tables.mjs` prints the tables.

## Evaluation in the worker

Milliseconds. "Warm" is a later sketch in the same worker, with the same config text and one file added. "Longest frame" is the longest gap between two frames of the page during a round trip; idle, it is 16.7 ms.

| Copies | Files | Dependencies | Evaluate, first | Evaluate, warm | Files only, warm | Round trip, warm | Page reads the reply | Longest frame |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1, real config | 725 | 2740 | 467 | 361 | 5 | 380 | 8.4 | 16.8 |
| 1 | 725 | 2740 | 516 | 379 | 5 | 399 | 8.4 | 16.8 |
| 2 | 1450 | 5480 | 950 | 767 | 10 | 809 | 17.4 | 16.8 |
| 5 | 3625 | 13700 | 2333 | 1983 | 23 | 2101 | 48.0 | 66.7 |
| 10 | 7250 | 27400 | 4714 | 4055 | 42 | 4292 | 110.2 | 133.3 |
| 20 | 14500 | 54800 | 9999 | 8591 | 83 | 9225 | 277.5 | 300.0 |
| 40 | 29000 | 109600 | 18543 | 15632 | 181 | 16713 | 512.8 | 500.0 |

- That is 0.13 to 0.15 ms per dependency against a rule with 57 policies.
- The same script in Node.js 24 took 685 ms first and 492 ms warm for the real sketch, so the worker of Chromium is not slower than Node.js.
- The first evaluation of the playground's own project passes the `LATE_AFTER` mark of the evaluator, 400 ms. Forty copies take two thirds of its `EVALUATION_TIME_LIMIT`, 30 s.
- Why the first evaluation is slower than a warm one by more than the config analysis was not looked for.

## The reply with both forms

Milliseconds from the request of the page until the reply is read, with no evaluation in it. Median of 20.

| Copies | Evaluation alone | With the thin form | With the thick form |
| --- | --- | --- | --- |
| 1, real config | 17.0 | 19.7 (+16%) | 22.0 (+29%) |
| 2 | 32.3 | 39.6 (+22%) | 42.7 (+32%) |
| 5 | 86.2 | 97.5 (+13%) | 113.8 (+32%) |
| 10 | 178.1 | 202.4 (+14%) | 244.4 (+37%) |
| 20 | 388.4 | 444.6 (+14%) | 513.1 (+32%) |
| 40 | 877.1 | 996.8 (+14%) | 1159.7 (+32%) |

- Building the second form in the worker takes 0.1 ms for the real project and under 11 ms for forty copies.
- Of the extra, what lands on the page thread is the read: about 1.2 ms for the real project, 13 ms for ten copies and 55 ms for forty with the thin form; 2.4, 34 and 116 ms with the thick one.
- A direct test confirms that a structured clone keeps one object that a message references twice as one object, and that two messages do not share.

## Aggregation and what it gives the layout

Milliseconds per run, median of 30 samples after a warm-up.

| Copies | Files | By type | Nodes and edges by type | By element | Nodes and edges by element | By element, without tests |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 725 | 0.22 | 18 and 97 | 0.30 | 119 and 604 | 119 and 371 |
| 2 | 1450 | 0.45 | 18 and 97 | 0.71 | 237 and 1208 | 237 and 742 |
| 5 | 3625 | 1.47 | 18 and 97 | 2.13 | 591 and 3020 | 591 and 1855 |
| 10 | 7250 | 4.72 | 18 and 97 | 6.30 | 1181 and 6040 | 1181 and 3710 |
| 40 | 29000 | 17.48 | 18 and 97 | 26.85 | 4721 and 24160 | 4721 and 14840 |

- The edges by type do not grow because the copies share the type names. With 18 types the ceiling is 306 edges; a project needs at least 33 types to pass 1000.
- `library-research.md` and the React Flow mockup measured the layered layout of ELK: about 0.2 s for 111 edges, 0.5 s for 371, 1 s for 600, and 12 to 19 s for 5000.

## What follows for the design

- Decision 14 holds: the second form costs little.
- Decision 31 holds, and its threshold is a number of visible edges. The Map by element type is safe at any size. Expanded by element, a project like this one passes 1000 edges at about 1200 files with tests and about 2000 without. A starting value for the notice is 1000 visible edges, to tune in the phase that builds the Map, since no layout was measured between 600 and 5000 edges.
- For the website of this plan, where a sketch has tens of files, every step is far under these numbers. They matter for the project reader, designed later: there the evaluation takes seconds, and reading the reply starts to drop frames from about 3600 files.

## Limits

- One project shape and one config, replicated. The cost per dependency depends on the policies, and the copies add no dependency between copies, so a real big project is probably denser.
- Every dependency is allowed. A disallowed verdict carries a message, which adds to the evaluation and to the transfer.
- Headless Chromium on one machine short of memory. The row of twenty copies has 4 warm runs and the row of forty has one.
- Not measured: what the evaluator and the store do with the reply after reading it, the render of React, and the layout.
