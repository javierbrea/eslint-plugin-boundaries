// Builds the React Flow mockup into dist/: index.html with the script inlined, the ELK worker and the data.
// Usage: node build.mjs <folder with node_modules>, where the packages of ../../spike/graph-libraries/package.json are installed.
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const modules = path.resolve(
  process.argv[2] ?? path.join(here, "../../spike/graph-libraries"),
  "node_modules"
);
const requireModule = createRequire(path.join(modules, "/"));
const esbuild = requireModule("esbuild");

const result = await esbuild.build({
  entryPoints: [path.join(here, "src/main.jsx")],
  bundle: true,
  minify: true,
  format: "iife",
  platform: "browser",
  jsx: "automatic",
  nodePaths: [modules],
  define: { "process.env.NODE_ENV": '"production"' },
  write: false,
});
const script = result.outputFiles[0].text.replaceAll("</script", "<\\/script");
const styles = fs.readFileSync(
  path.join(modules, "@xyflow/react/dist/style.css"),
  "utf8"
);
const template = fs.readFileSync(path.join(here, "src/template.html"), "utf8");
const dist = path.join(here, "dist");

fs.mkdirSync(dist, { recursive: true });
fs.writeFileSync(
  path.join(dist, "index.html"),
  template
    .replace("/*RF_CSS*/", () => styles)
    .replace("/*BUNDLE*/", () => script)
);
fs.copyFileSync(
  path.join(modules, "elkjs/lib/elk-worker.min.js"),
  path.join(dist, "elk-worker.min.js")
);
fs.copyFileSync(path.join(here, "../data.json"), path.join(dist, "data.json"));
process.stdout.write(
  `built ${dist}: ${Math.round(script.length / 1024)} KB of script\n`
);
