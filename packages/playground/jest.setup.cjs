/* global jest, beforeEach, Range, DOMRect */

// jsdom has no `TextEncoder` or `TextDecoder`, which every browser and Node.js have, and the encoder of the links uses them. These are the ones of Node.js. It has no `structuredClone` either, which the stand-in of the worker below copies each message with, as `postMessage` does: the serializer of V8 is the algorithm of `structuredClone` in Node.js
const nodeUtil = require("node:util");
const nodeV8 = require("node:v8");

Object.assign(globalThis, {
  TextDecoder: nodeUtil.TextDecoder,
  TextEncoder: nodeUtil.TextEncoder,
});

globalThis.structuredClone = (value) =>
  nodeV8.deserialize(nodeV8.serialize(value));

// jsdom has no `Worker`. The stand-in runs the script of the playground's worker in the thread of the tests, and answers before `postMessage` returns, so that a spec that renders the playground sees the evaluation of its sketch as soon as the render ends. A spec that needs an evaluation to wait holds the workers; each test starts with workers that answer at once
const {
  installInlineWorker,
  resetInlineWorkers,
} = require("./src/shared/testing/inlineWorker");

// The script loads with the first worker, inside a test, so that it takes the modules that the spec mocks, as the code of the spec does
installInlineWorker((scope) =>
  require("./src/domains/evaluation/helpers/evaluator/serveEvaluations").serveEvaluations(
    scope
  )
);

beforeEach(() => {
  resetInlineWorkers();
});

// The Emotion caches live as long as the modules of a spec file, so the CSS rules that a test inserts stay in the document for every later test of the file. jsdom's `getComputedStyle` reads every rule of the document, and Testing Library calls it for each element that a role query checks, so each test got slower with the rules the earlier ones left: in `Shell.spec.tsx`, the tests after the picker took five times as long as alone, and one of them went over Jest's timeout in CI. Each test starts with empty caches instead, and inserts only the rules of what it renders.

/** Every Emotion cache that the modules of the spec file create, the default one of `@emotion/react` included */
const mockCaches = [];

jest.mock("@emotion/cache", () => {
  const actual = jest.requireActual("@emotion/cache");

  return {
    ...actual,
    __esModule: true,
    default: (options) => {
      const cache = actual.default(options);

      mockCaches.push(cache);
      return cache;
    },
  };
});

beforeEach(() => {
  mockCaches.forEach((cache) => {
    cache.sheet.flush();
    Object.keys(cache.inserted).forEach((name) => {
      delete cache.inserted[name];
    });
  });
});

// jsdom lays nothing out, and its `Range` has neither `getClientRects` nor `getBoundingClientRect`, which CodeMirror calls each time it measures the editor in an animation frame. Without them it logs a `TypeError` for each measure, and every instance starts with the config editor on screen, so a spec run alone filled its output with them. They give no rectangles, as the elements of jsdom do. The spec of the share entry runs in Node.js, which has no `Range`
if (typeof Range !== "undefined") {
  Range.prototype.getClientRects ??= () => [];
  Range.prototype.getBoundingClientRect ??= () => new DOMRect();
}
