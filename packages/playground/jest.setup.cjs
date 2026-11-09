/* global jest, beforeEach */

// jsdom has no `TextEncoder` or `TextDecoder`, which every browser and Node.js have, and the encoder of the links uses them. These are the ones of Node.js
const nodeUtil = require("node:util");

Object.assign(globalThis, {
  TextDecoder: nodeUtil.TextDecoder,
  TextEncoder: nodeUtil.TextEncoder,
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
