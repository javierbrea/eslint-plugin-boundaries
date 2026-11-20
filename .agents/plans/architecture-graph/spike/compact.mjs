import fs from "node:fs";
const dir = process.argv[2];
const raw = JSON.parse(fs.readFileSync(`${dir}/raw.json`, "utf8"));
const idx = new Map(raw.files.map((f, i) => [f.path, i]));
const files = raw.files.map(({ path, d }) => ({
  p: path,
  t: d.element.types?.[0] ?? null,
  e: d.element.path,
  c: d.element.captured ?? null,
  k: d.file.categories ?? [],
}));
const label = (sel) => JSON.stringify(sel).replace(/"/g, "").slice(0, 90);
const policies = raw.policies.map((p, i) => ({
  i,
  effect: p.allow ? "allow" : "disallow",
  text: label(p),
}));
function getStatus(e) {
  if (e.error) return "d";
  if (!e.checked) return "n";
  return e.allowed ? "a" : "d";
}
const deps = raw.deps.map(({ dep, d, e }) => ({
  f: idx.get(dep.from),
  t: dep.to === undefined ? -1 : (idx.get(dep.to) ?? -1),
  x: dep.to === undefined ? (d.to.module.source ?? dep.source) : null,
  o: d.to.module.origin,
  k: dep.kind,
  n: dep.nodeKind,
  r: d.dependency.relationship.to,
  s: getStatus(e),
  pi: e.policyIndex ?? null,
  why: e.reason ?? null,
}));
const count = (arr, fn) =>
  arr.reduce((m, x) => ((m[fn(x)] = (m[fn(x)] ?? 0) + 1), m), {});
console.error(
  "status",
  count(deps, (d) => d.s),
  "reasons",
  count(
    deps.filter((d) => d.s === "n"),
    (d) => d.why
  )
);
console.error(
  "origin",
  count(deps, (d) => d.o),
  "kind",
  count(deps, (d) => d.k),
  "node",
  count(deps, (d) => d.n),
  "rel",
  count(deps, (d) => d.r)
);
console.error(
  "types",
  count(files, (f) => f.t),
  "\ncats",
  count(files, (f) => f.k.join("+") || "-")
);
console.error(
  "elements",
  new Set(files.map((f) => f.e)).size,
  "domains",
  count(files, (f) => f.c?.domain ?? f.c?.scope ?? "-")
);
console.error(
  "unresolved local-looking",
  deps.filter((d) => d.t === -1 && d.o === "local").length,
  "policies used",
  new Set(deps.map((d) => d.pi)).size,
  "of",
  policies.length
);
// cycles between elements (2-cycles) on real data
const el = (i) => files[i].e;
const pairs = new Set(
  deps
    .filter((d) => d.t >= 0 && el(d.f) !== el(d.t))
    .map((d) => `${el(d.f)}>${el(d.t)}`)
);
const two = [...pairs].filter((p) => {
  const [a, b] = p.split(">");
  return a < b && pairs.has(`${b}>${a}`);
});
console.error(
  "element pairs",
  pairs.size,
  "mutual pairs",
  two.length,
  two.slice(0, 5)
);
// Invented violations: flip every 97th allowed cross-element local dependency
let n = 0,
  inv = 0;
for (const d of deps) {
  if (
    d.s === "a" &&
    d.t >= 0 &&
    el(d.f) !== el(d.t) &&
    !files[d.f].k.includes("test") &&
    ++n % 41 === 0
  ) {
    d.s = "d";
    d.inv = 1;
    inv++;
  }
}
console.error("invented violations", inv);
const out = {
  name: "packages/playground",
  policies,
  defaultEffect: raw.default,
  files,
  deps,
};
fs.writeFileSync(`${dir}/data.json`, JSON.stringify(out));
console.error("bytes", fs.statSync(`${dir}/data.json`).size);
