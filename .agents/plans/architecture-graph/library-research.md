# Research note: the library that renders the Map

Measured on 2026-11-22. The maintainer chose React Flow, with its attribution visible, and ELK in a web worker (decisions 18 and 19 of the index).

## Recommendation

React Flow (`@xyflow/react`), with the layered layout computed apart: dagre first, ELK in a worker if the drawing of nested groups with dagre does not hold. It is the only candidate where the `--jsb-*` tokens, the theme switch, the keyboard and the server render work with no integration code, and it is the smallest. It costs an expand and collapse written by us, a visible "React Flow" attribution, and a major version released on 2026-11-17.

The layered layout is the bottleneck, and it is the same engine whichever library draws. With 1000 nodes and 5000 edges no layered layout was usable: ELK took 12 to 19 s, and dagre crashed the page or passed 240 s. The Map has to aggregate to groups, filter by weight or fall back to a force layout at that size.

## How it was measured

- Versions, dates, licenses and peers: `npm view` and the registry, and the `LICENSE` files of the installed packages.
- Bundle size: esbuild 0.28.2, minified, ESM, React external, then `gzip -9`. The entries are in `entries/` of `spike/graph-libraries/sources.tar.gz`, which holds every script of this note.
- Timings: `run-bench.mjs` of that archive, with playwright-core 1.65.1 driving headless Chromium 159 at 1280 by 800. Median of 3 runs, 2 for the big graph, each in a fresh page. The results are the `bench-results*.txt` files beside the archive.
- Graphs: a seeded generator. "Random" picks the ends of each edge uniformly, the worst case for a layered layout. "90% forward" orders the groups and points 90% of the edges downwards, closer to an architecture.
- Limits: headless Chromium renders WebGL in software, so the render times of Sigma do not stand for a real GPU. No touch device was tested, and no frame rate of pan and zoom was measured.
- `spike/graph-libraries/package.json` lists what to install to run any of it again. "Read" below is a fact taken from the documentation of the library, not measured.

## Comparison

| Criterion | Cytoscape.js + cytoscape-dagre | React Flow + dagre or elkjs | Sigma + graphology |
| --- | --- | --- | --- |
| Version | cytoscape 3.35.0, cytoscape-dagre 4.1.0 | `@xyflow/react` 13.0.2, `@dagrejs/dagre` 3.1.3, elkjs 0.12.1 | sigma 4.0.6, graphology 0.26.0 |
| License | MIT | MIT; elkjs is `EPL-2.0 OR GPL-3.0-or-later` | MIT |
| Attribution | None | A "React Flow" link renders by default. The license does not require it; its site asks for a Pro subscription, from $169 a month, to remove it (read) | None |
| Bundle, gzip | 145 KB; 161 KB with dagre; 170 KB with the expand and collapse plugin | 87 KB plus 3 KB of CSS; 104 KB with dagre. The ELK worker is a separate file of 472 KB | 114 KB; 117 KB with ForceAtlas2 |
| Nested nodes | Native (`parent`) | Native (`parentId`) | None: group boxes are hand-made |
| Expand and collapse | A plugin whose README says it is no longer maintained; otherwise hand-made | Hand-made: hide, aggregate again, lay out again | Hand-made |
| Layered layout | dagre and ELK plugins, both handle nesting | None built in: dagre or ELK, run by us. Its docs flag dagre for nested flows (read) | None |
| Force layout | `cose` built in, fcose plugin | None built in; ELK has `force` and `stress` (read, not measured) | ForceAtlas2 |
| Same drawing twice | dagre and ELK yes; fcose only with `randomize: false`; `cose` no | dagre and ELK yes | ForceAtlas2 yes from fixed start positions |
| Layout in a worker | No: main thread | ELK yes, measured; dagre could move to a worker of ours | ForceAtlas2 yes (read) |
| Tokens and theme switch | Canvas: `var(--jsb-accent)` is rejected as an invalid style. The integration reads the tokens with `getComputedStyle` and applies the stylesheet again on each switch, which works without creating the graph again | DOM and SVG: an edge with `stroke: var(--jsb-ok)` changed color when `data-theme` flipped, with no render. Nodes are our React and MUI components | WebGL: colors are attributes of the graph, rewritten on a switch (not run) |
| Dashed edges, width by weight, labels | Yes | Yes | Yes |
| Accessibility | Nothing: one canvas, no ARIA or `tabindex` in its source | Built in: each node and edge has `tabindex`, a role and a label; Tab moves, Enter selects, Escape clears; a live region. Its docs say it "can help you meet" WCAG 2.1 AA (read) | Nothing: one canvas |
| React | Mounted in an effect; the wrapper dates from 2022 | It is a React library; peers `react >=18` | `@react-sigma/core`, or an effect |
| Import with no `window` | Works | Works, and renders nodes on the server | Fails: "WebGL2RenderingContext is not defined" |
| Touch | Pinch and pan (read) | Pinch and pan; it captures the page scroll over the flow by default (read) | Pinch, pan and rotate (read) |

## Timings

Layout, then first render after it, in milliseconds.

| Graph | Cytoscape | React Flow | Sigma |
| --- | --- | --- | --- |
| 40 nodes, 8 groups, 150 edges, 90% forward | dagre 170 + 52; fcose 45 + 43 | dagre 172 + 67; ELK in a worker 298 + 76 | dagre, flat, 109 + 793; ForceAtlas2 8 + 886 |
| 120, 12, 600, random | dagre 2017 + 78; ELK 841 + 60; fcose 121 + 79 | dagre 2093 + 117; ELK in a worker 897 + 114 | dagre, flat, 1540 + 779; ForceAtlas2 26 + 756 |
| 120, 12, 600, 90% forward | dagre 1405 + 74; ELK 738 + 55 | dagre 1088 + 112; ELK 697 + 109 | dagre, flat, 970 + 822 |
| 1000, 12, 5000, random | dagre crashed the page; ELK 18892 + 640; fcose 1308 + 502 | dagre crashed the page; ELK in a worker 16749 + 1096 | dagre crashed the page; ForceAtlas2 946 + 1089 |
| 1000, 12, 5000, 90% forward | dagre over 240 s; ELK 12655 + 636 | dagre over 240 s; ELK 12030 + 1064 | dagre over 240 s |

- The render of Sigma takes about 800 ms even with 40 nodes: it is the start of software WebGL, not a cost per node.
- React Flow puts 4,589 DOM elements on the page with 600 edges and 38,029 with 5000.

## What the recommendation costs

- Expand and collapse and the nested layout are written in the graph package: one layout adapter, and one collapse step that aggregates the edges again. Cytoscape needs the same work, since its plugin is not maintained.
- The attribution stays visible, unless the maintainer decides otherwise.
- The layout engine is a decision of its own. dagre is MIT, adds 17 KB and took 170 ms with 150 edges, but 1.1 to 2.1 s with 600. ELK is two to three times faster with 600 edges, routes edges across groups and runs in a worker, but it is a lazy file of 472 KB under EPL-2.0.
- The layered Map needs a cap: above a few hundred aggregated edges the layout takes seconds.
- A force layout, which the first version does not have (decision 34), would come from ELK or d3-force, neither measured.

The fallback is Cytoscape with cytoscape-dagre, which the mockup already uses in older versions: the nested layout works out of the box, at the price of the bridge for the tokens and of the matrix and the lists being the only accessible reading of the graph.

## Not verified

- Whether an open-source project may hide the React Flow attribution without a subscription.
- The drawing that dagre gives for nested groups in React Flow: it ran without an error, and nobody looked at the result.
- Why Cytoscape with `webgl: true` sent no `render` event within 15 s in headless Chromium. Its WebGL mode does not support dashed lines (read).
- The mockup loads Sigma 2.4.0, and version 4 changed its API, so its Sigma code does not carry over.
