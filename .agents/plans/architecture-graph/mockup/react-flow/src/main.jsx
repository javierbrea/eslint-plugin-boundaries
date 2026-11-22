// Mockup of the Map view with React Flow and ELK in a web worker. Not production code: it only shows the drawing, the nesting and how the page behaves while a layout runs.
import { createRoot } from "react-dom/client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ReactFlow, Handle, Position, MarkerType, Controls, BaseEdge, getBezierPath } from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import ELK from "elkjs/lib/elk-api.js";

const ELEMENT_WIDTH = 168;
const ELEMENT_HEIGHT = 34;
const TYPE_WIDTH = 176;
const TYPE_HEIGHT = 48;
const TIME_LIMIT = 30000;
const UNCLASSIFIED = "unclassified";

/** Seeded random numbers, so that a synthetic graph is the same on every load */
function createRandom(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The real project: files grouped into elements, and dependencies aggregated between elements */
function readProject(data) {
  const elements = new Map();
  const fileElement = data.files.map((file) => {
    const id = file.e ?? UNCLASSIFIED;
    if (!elements.has(id)) {
      const parts = id.split("/");
      elements.set(id, { id, type: file.t ?? UNCLASSIFIED, label: parts.slice(-2).join("/"), files: 0, internal: 0 });
    }
    elements.get(id).files += 1;
    return id;
  });
  const links = new Map();
  data.deps.forEach((dep, index) => {
    if (dep.t < 0) return;
    const from = fileElement[dep.f];
    const to = fileElement[dep.t];
    if (from === to) {
      elements.get(from).internal += 1;
      return;
    }
    const key = `${from}|${to}`;
    if (!links.has(key)) links.set(key, { from, to, allowed: 0, disallowed: 0, deps: [] });
    const link = links.get(key);
    if (dep.s === "d") link.disallowed += 1;
    else link.allowed += 1;
    link.deps.push(index);
  });
  return { elements: [...elements.values()], links: [...links.values()], data };
}

/** A synthetic project of ordered layers, where most dependencies point to a lower layer */
function makeProject(elementCount, typeCount, linkCount) {
  const random = createRandom(elementCount * 31 + linkCount);
  const elements = Array.from({ length: elementCount }, (_, index) => {
    const layer = index % typeCount;
    return { id: `e${index}`, type: `layer-${String(layer + 1).padStart(2, "0")}`, layer, label: `element-${index}`, files: 1 + Math.floor(random() * 9), internal: 0 };
  });
  const links = new Map();
  while (links.size < linkCount) {
    let a = elements[Math.floor(random() * elementCount)];
    let b = elements[Math.floor(random() * elementCount)];
    if (a === b || a.layer === b.layer) continue;
    const forward = random() < 0.9;
    if (a.layer < b.layer !== forward) [a, b] = [b, a];
    const key = `${a.id}|${b.id}`;
    if (links.has(key)) continue;
    const count = 1 + Math.floor(random() * 20);
    const bad = !forward && random() < 0.4;
    links.set(key, { from: a.id, to: b.id, allowed: bad ? 0 : count, disallowed: bad ? count : 0, deps: [] });
  }
  return { elements, links: [...links.values()], data: null };
}

const DATASETS = [
  { id: "real", label: "packages/playground (real)" },
  { id: "medium", label: "Synthetic: 120 elements, 600 links", make: () => makeProject(120, 12, 600) },
  { id: "large", label: "Synthetic: 1000 elements, 5000 links", make: () => makeProject(1000, 12, 5000) },
];

/** What the Map draws: a node per collapsed type or per element of an expanded type, and the links between them */
function aggregate(project, expanded, minWeight) {
  const types = new Map();
  const nodeOf = new Map();
  for (const element of project.elements) {
    if (!types.has(element.type)) types.set(element.type, { id: `t:${element.type}`, name: element.type, elements: [], files: 0 });
    const type = types.get(element.type);
    type.elements.push(element);
    type.files += element.files;
    nodeOf.set(element.id, expanded.has(element.type) ? `e:${element.id}` : type.id);
  }
  const links = new Map();
  for (const link of project.links) {
    const source = nodeOf.get(link.from);
    const target = nodeOf.get(link.to);
    if (source === target) continue;
    const key = `${source}|${target}`;
    if (!links.has(key)) links.set(key, { id: key, source, target, allowed: 0, disallowed: 0, deps: [] });
    const visible = links.get(key);
    visible.allowed += link.allowed;
    visible.disallowed += link.disallowed;
    for (const dep of link.deps) visible.deps.push(dep);
  }
  const kept = [...links.values()].filter((link) => link.allowed + link.disallowed >= minWeight);
  const keys = new Set(kept.map((link) => link.id));
  for (const link of kept) link.mutual = keys.has(`${link.target}|${link.source}`);
  return { types: [...types.values()].sort((a, b) => a.name.localeCompare(b.name)), links: kept };
}

function isExpanded(type, expanded) {
  return expanded.has(type.name);
}

/** Layered layout with ELK, in a worker. Returns positions relative to the parent, and a function that stops the worker */
function layoutWithElk(graph, expanded) {
  const elk = new ELK({ workerUrl: "elk-worker.min.js", workerFactory: (url) => new Worker(url) });
  const promise = elk
    .layout({
      id: "root",
      layoutOptions: {
        "elk.algorithm": "layered",
        "elk.direction": "DOWN",
        "elk.hierarchyHandling": "INCLUDE_CHILDREN",
        "elk.layered.spacing.nodeNodeBetweenLayers": "64",
        "elk.spacing.nodeNode": "26",
        "elk.edgeRouting": "SPLINES",
        // The route of every edge in the coordinates of the whole drawing, whatever group its ends are in
        "elk.json.edgeCoords": "ROOT",
      },
      children: graph.types.map((type) =>
        isExpanded(type, expanded)
          ? {
              id: type.id,
              layoutOptions: { "elk.padding": "[top=44,left=16,bottom=16,right=16]" },
              children: type.elements.map((element) => ({ id: `e:${element.id}`, width: ELEMENT_WIDTH, height: ELEMENT_HEIGHT })),
            }
          : { id: type.id, width: TYPE_WIDTH, height: TYPE_HEIGHT }
      ),
      edges: graph.links.map((link) => ({ id: link.id, sources: [link.source], targets: [link.target] })),
    })
    .then((result) => {
      const boxes = new Map();
      for (const type of result.children) {
        boxes.set(type.id, { x: type.x, y: type.y, width: type.width, height: type.height });
        for (const child of type.children ?? []) boxes.set(child.id, { x: child.x, y: child.y, width: child.width, height: child.height });
      }
      const routes = new Map();
      (function collect(node) {
        for (const edge of node.edges ?? []) {
          const section = edge.sections?.[0];
          if (section) routes.set(edge.id, [section.startPoint, ...(section.bendPoints ?? []), section.endPoint]);
        }
        for (const child of node.children ?? []) collect(child);
      })(result);
      boxes.routes = routes;
      elk.terminateWorker();
      return boxes;
    });
  return { promise, stop: () => elk.terminateWorker() };
}

/** Layered layout with dagre, on the thread of the page: nothing responds while it runs */
function layoutWithDagre(graph, expanded) {
  const g = new dagre.graphlib.Graph({ compound: true });
  g.setGraph({ rankdir: "TB", nodesep: 26, ranksep: 64 });
  g.setDefaultEdgeLabel(() => ({}));
  for (const type of graph.types) {
    if (isExpanded(type, expanded)) {
      g.setNode(type.id, {});
      for (const element of type.elements) {
        g.setNode(`e:${element.id}`, { width: ELEMENT_WIDTH, height: ELEMENT_HEIGHT });
        g.setParent(`e:${element.id}`, type.id);
      }
    } else {
      g.setNode(type.id, { width: TYPE_WIDTH, height: TYPE_HEIGHT });
    }
  }
  for (const link of graph.links) g.setEdge(link.source, link.target);
  dagre.layout(g);
  const boxes = new Map();
  for (const type of graph.types) {
    const box = g.node(type.id);
    const top = isExpanded(type, expanded) ? 28 : 0;
    const origin = { x: box.x - box.width / 2, y: box.y - box.height / 2 - top, width: box.width, height: box.height + top };
    boxes.set(type.id, origin);
    if (!isExpanded(type, expanded)) continue;
    for (const element of type.elements) {
      const child = g.node(`e:${element.id}`);
      boxes.set(`e:${element.id}`, { x: child.x - ELEMENT_WIDTH / 2 - origin.x, y: child.y - ELEMENT_HEIGHT / 2 - origin.y, width: ELEMENT_WIDTH, height: ELEMENT_HEIGHT });
    }
  }
  return boxes;
}

function getTone(link) {
  if (link.disallowed > 0) return "bad";
  return link.mutual ? "warn" : "ok";
}

function toFlow(graph, expanded, boxes, onToggle, withLabels) {
  const nodes = [];
  for (const type of graph.types) {
    const box = boxes.get(type.id);
    if (!box) continue;
    const open = isExpanded(type, expanded);
    nodes.push({
      id: type.id,
      type: open ? "openType" : "closedType",
      position: { x: box.x, y: box.y },
      width: box.width,
      height: box.height,
      data: { name: type.name, elements: type.elements.length, files: type.files, onToggle },
      ariaLabel: `Element type ${type.name}, ${type.elements.length} elements, ${open ? "expanded" : "collapsed"}`,
    });
    if (!open) continue;
    for (const element of type.elements) {
      const child = boxes.get(`e:${element.id}`);
      nodes.push({
        id: `e:${element.id}`,
        type: "element",
        parentId: type.id,
        extent: "parent",
        position: { x: child.x, y: child.y },
        width: child.width,
        height: child.height,
        data: { label: element.label, files: element.files },
        ariaLabel: `Element ${element.id}, ${element.files} files`,
      });
    }
  }
  const edges = graph.links.map((link) => {
    const tone = getTone(link);
    const weight = link.allowed + link.disallowed;
    return {
      id: link.id,
      source: link.source,
      target: link.target,
      label: withLabels ? String(weight) : undefined,
      className: `edge-${tone}`,
      style: { stroke: `var(--${tone})`, strokeWidth: 1 + Math.min(5, Math.log2(weight)), strokeDasharray: tone === "bad" ? "7 5" : undefined },
      markerEnd: { type: MarkerType.ArrowClosed, color: `var(--${tone})`, width: 14, height: 14 },
      labelStyle: { fill: "var(--ink)", fontSize: 11, fontFamily: "var(--mono)" },
      labelBgStyle: { fill: "var(--card)" },
      labelBgPadding: [4, 2],
      interactionWidth: 16,
      type: "routed",
      data: { link, points: boxes.routes?.get(link.id) },
    };
  });
  return { nodes, edges };
}

function HiddenHandles() {
  return (
    <>
      <Handle type="target" position={Position.Top} isConnectable={false} />
      <Handle type="source" position={Position.Bottom} isConnectable={false} />
    </>
  );
}

function ClosedType({ data }) {
  return (
    <div className="node node-type">
      <HiddenHandles />
      <button className="toggle nodrag" type="button" onClick={() => data.onToggle(data.name)} aria-label={`Expand ${data.name}`}>
        +
      </button>
      <span className="node-text">
        <b>{data.name}</b>
        <small>
          {data.elements} elements · {data.files} files
        </small>
      </span>
    </div>
  );
}

function OpenType({ data }) {
  return (
    <div className="node node-group">
      <button className="toggle nodrag" type="button" onClick={() => data.onToggle(data.name)} aria-label={`Collapse ${data.name}`}>
        −
      </button>
      <b>{data.name}</b>
      <small>{data.elements} elements</small>
    </div>
  );
}

function ElementNode({ data }) {
  return (
    <div className="node node-element" title={data.label}>
      <HiddenHandles />
      <span>{data.label}</span>
      <small>{data.files}</small>
    </div>
  );
}

/** Draws an edge along the route that ELK gave it, a chain of cubic curves, or as a plain curve when the layout gave none */
function RoutedEdge({ id, data, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, ...rest }) {
  const points = data.points;
  let path;
  let labelX;
  let labelY;
  if (points && points.length >= 2) {
    const [start, ...others] = points;
    path = `M ${start.x} ${start.y}`;
    if (others.length % 3 === 0) {
      for (let i = 0; i < others.length; i += 3) path += ` C ${others[i].x} ${others[i].y} ${others[i + 1].x} ${others[i + 1].y} ${others[i + 2].x} ${others[i + 2].y}`;
    } else {
      for (const point of others) path += ` L ${point.x} ${point.y}`;
    }
    const middle = points[Math.floor(points.length / 2)];
    labelX = middle.x;
    labelY = middle.y;
  } else {
    [path, labelX, labelY] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
  }
  return (
    <BaseEdge
      id={id}
      path={path}
      labelX={labelX}
      labelY={labelY}
      label={rest.label}
      labelStyle={rest.labelStyle}
      labelShowBg
      labelBgStyle={rest.labelBgStyle}
      labelBgPadding={rest.labelBgPadding}
      style={rest.style}
      markerEnd={rest.markerEnd}
      interactionWidth={16}
    />
  );
}

const EDGE_TYPES = { routed: RoutedEdge };
const NODE_TYPES = { closedType: ClosedType, openType: OpenType, element: ElementNode };

/** Tracks the longest gap between two frames of the page, which is how long the page did not respond */
function useFreezeMeter() {
  const meter = useRef({ last: 0, longest: 0 });
  useEffect(() => {
    let frame = requestAnimationFrame(function tick(now) {
      const state = meter.current;
      if (state.last) state.longest = Math.max(state.longest, now - state.last);
      state.last = now;
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  return meter;
}

function Elapsed({ since }) {
  const [now, setNow] = useState(() => performance.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(performance.now()), 100);
    return () => clearInterval(timer);
  }, []);
  return <b>{((now - since) / 1000).toFixed(1)} s</b>;
}

function describeNode(id) {
  return id.replace(/^[te]:/, "");
}

function Inspector({ link, project }) {
  if (!link) {
    return (
      <aside className="inspector">
        <h2>Selection</h2>
        <p className="muted">Select an edge to list the dependencies behind it. The + and − buttons of a type expand it into its elements and collapse it again.</p>
        <h2>Legend</h2>
        <ul className="legend">
          <li>
            <i className="swatch ok"></i>Allowed
          </li>
          <li>
            <i className="swatch bad"></i>Disallowed (invented here: the package has no violation)
          </li>
          <li>
            <i className="swatch warn"></i>Allowed in both directions
          </li>
        </ul>
        <p className="muted">An edge is as thick as its dependencies are many.</p>
      </aside>
    );
  }
  const files = project.data?.files;
  const shown = link.deps.slice(0, 40);
  return (
    <aside className="inspector">
      <h2>Selection</h2>
      <p className="pair">
        <code>{describeNode(link.source)}</code>
        <span>depends on</span>
        <code>{describeNode(link.target)}</code>
      </p>
      <p>
        <b className="ok-text">{link.allowed}</b> allowed · <b className="bad-text">{link.disallowed}</b> disallowed
      </p>
      {files ? (
        <ul className="deps">
          {shown.map((index) => {
            const dep = project.data.deps[index];
            return (
              <li key={index} className={dep.s === "d" ? "is-bad" : undefined}>
                <code>{files[dep.f].p}</code>
                <code>→ {files[dep.t].p}</code>
                <small>
                  {dep.k} {dep.n} · {dep.s === "d" ? "disallowed" : "allowed"} by policy {dep.pi ?? "default"}
                </small>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="muted">A synthetic graph has no files behind its edges.</p>
      )}
      {link.deps.length > shown.length ? <p className="muted">And {link.deps.length - shown.length} more.</p> : null}
    </aside>
  );
}

function pickExpanded(project) {
  const counts = new Map();
  for (const element of project.elements) counts.set(element.type, (counts.get(element.type) ?? 0) + 1);
  if (!project.data) return new Set(counts.keys());
  // One small type starts expanded, so that the first drawing shows the nesting and stays readable
  const small = [...counts].filter(([, count]) => count >= 4 && count <= 8).sort((a, b) => a[1] - b[1]);
  return new Set(small.slice(0, 1).map(([type]) => type));
}

function App({ real }) {
  const [datasetId, setDatasetId] = useState("real");
  const [engine, setEngine] = useState("elk");
  const [minWeight, setMinWeight] = useState(1);
  const project = useMemo(() => (datasetId === "real" ? real : DATASETS.find((dataset) => dataset.id === datasetId).make()), [datasetId, real]);
  const [expanded, setExpanded] = useState(() => pickExpanded(real));
  const [layout, setLayout] = useState({ phase: "idle" });
  const [selected, setSelected] = useState(null);
  const [run, setRun] = useState(0);
  const stopRef = useRef(null);
  const meter = useFreezeMeter();

  const graph = useMemo(() => aggregate(project, expanded, minWeight), [project, expanded, minWeight]);
  const dagreBlocked = datasetId === "large";
  const usedEngine = dagreBlocked ? "elk" : engine;

  useEffect(() => {
    let current = true;
    const started = performance.now();
    meter.current.longest = 0;
    meter.current.last = 0;
    setSelected(null);
    setLayout((previous) => ({ ...previous, phase: "running", started, engine: usedEngine }));
    const finish = (boxes) => {
      if (!current) return;
      const ms = performance.now() - started;
      // dagre runs on the page thread, so the page does not respond for as long as it takes. The render that follows is not counted
      const freeze = usedEngine === "dagre" ? ms : meter.current.longest;
      setLayout({ phase: "done", ms, freeze, engine: usedEngine, flow: toFlow(graph, expanded, boxes, toggle, graph.links.length <= 800), id: started });
    };
    const fail = (message) => current && setLayout((previous) => ({ ...previous, phase: "stopped", message }));
    if (usedEngine === "dagre") {
      // Two frames first, so that "Computing" is painted before the page stops responding
      const timer = setTimeout(() => {
        try {
          finish(layoutWithDagre(graph, expanded));
        } catch (error) {
          fail(String(error.message ?? error));
        }
      }, 60);
      return () => {
        current = false;
        clearTimeout(timer);
      };
    }
    const { promise, stop } = layoutWithElk(graph, expanded);
    const limit = setTimeout(() => {
      stop();
      fail(`Stopped after ${TIME_LIMIT / 1000} s, the limit of this mockup.`);
    }, TIME_LIMIT);
    stopRef.current = () => {
      stop();
      clearTimeout(limit);
      fail("Cancelled.");
    };
    promise.then(
      (boxes) => {
        clearTimeout(limit);
        finish(boxes);
      },
      (error) => {
        clearTimeout(limit);
        fail(String(error.message ?? error));
      }
    );
    return () => {
      current = false;
      clearTimeout(limit);
      stop();
    };
  }, [graph, usedEngine, run]);

  function toggle(name) {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function changeDataset(id) {
    const next = id === "real" ? real : DATASETS.find((dataset) => dataset.id === id).make();
    setDatasetId(id);
    setExpanded(pickExpanded(next));
    setMinWeight(1);
  }

  const flow = layout.flow;
  const nodeCount = graph.types.reduce((sum, type) => sum + 1 + (isExpanded(type, expanded) ? type.elements.length : 0), 0);

  return (
    <>
      <div className="controls">
        <b>Mockup</b>
        <label htmlFor="dataset">
          Project
          <select id="dataset" value={datasetId} onChange={(event) => changeDataset(event.target.value)}>
            {DATASETS.map((dataset) => (
              <option key={dataset.id} value={dataset.id}>
                {dataset.label}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="engine">
          Layout
          <select id="engine" value={usedEngine} onChange={(event) => setEngine(event.target.value)}>
            <option value="elk">ELK, in a worker</option>
            <option value="dagre" disabled={dagreBlocked}>
              dagre, on the page thread{dagreBlocked ? " (crashed the page when measured)" : ""}
            </option>
          </select>
        </label>
        <label htmlFor="weight">
          Minimum weight
          <input id="weight" type="number" min="1" max="99" value={minWeight} onChange={(event) => setMinWeight(Math.max(1, Number(event.target.value) || 1))} />
        </label>
        <span className="spacer"></span>
        <button type="button" className="btn" onClick={() => setExpanded(new Set(graph.types.map((type) => type.name)))}>
          Expand all
        </button>
        <button type="button" className="btn" onClick={() => setExpanded(new Set())}>
          Collapse all
        </button>
      </div>

      <div className="host">
        <div className="status" role="status">
          <span>
            <b>{nodeCount}</b> nodes
          </span>
          <span>
            <b>{graph.links.length}</b> edges
          </span>
          {layout.phase === "running" ? (
            <span className="running">
              <i className="pulse"></i>Computing the layout with {layout.engine === "elk" ? "ELK in a worker" : "dagre"}: <Elapsed since={layout.started} />
              {layout.engine === "elk" ? (
                <button type="button" className="btn small" onClick={() => stopRef.current?.()}>
                  Cancel
                </button>
              ) : null}
            </span>
          ) : null}
          {layout.phase === "done" ? (
            <>
              <span>
                Layout <b>{Math.round(layout.ms)} ms</b> with {layout.engine === "elk" ? "ELK in a worker" : "dagre on the page thread"}
              </span>
              <span className={layout.freeze > 200 ? "bad-text" : undefined}>
                Longest page freeze meanwhile <b>{Math.round(layout.freeze)} ms</b>
              </span>
            </>
          ) : null}
          {layout.phase === "stopped" ? (
            <span className="bad-text">
              {layout.message}{" "}
              <button type="button" className="btn small" onClick={() => setRun((value) => value + 1)}>
                Try again
              </button>
            </span>
          ) : null}
        </div>
        <div className="bench">
          <div className={`stage${layout.phase === "running" ? " is-stale" : ""}`}>
            {flow ? (
              <ReactFlow
                key={layout.id}
                nodes={flow.nodes}
                edges={flow.edges}
                nodeTypes={NODE_TYPES}
                edgeTypes={EDGE_TYPES}
                fitView
                minZoom={0.03}
                maxZoom={2}
                nodesDraggable={false}
                nodesConnectable={false}
                onlyRenderVisibleElements={flow.edges.length > 1500}
                onEdgeClick={(_, edge) => setSelected(edge.data.link)}
                onPaneClick={() => setSelected(null)}
              >
                <Controls showInteractive={false} />
              </ReactFlow>
            ) : (
              <p className="placeholder">Computing the first layout.</p>
            )}
          </div>
          <Inspector link={selected} project={project} />
        </div>
      </div>
    </>
  );
}

const root = document.getElementById("map-root");
fetch("data.json")
  .then((response) => response.json())
  .then(
    (data) => createRoot(root).render(<App real={readProject(data)} />),
    () => {
      root.textContent = "The data of the mockup could not be loaded. Serve this folder through a static server.";
    }
  );
