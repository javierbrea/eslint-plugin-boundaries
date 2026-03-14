import { MatchersCache } from "./MatchersCache";

describe("MatchersCache", () => {
  let matchersCache: MatchersCache;

  beforeEach(() => {
    matchersCache = new MatchersCache();
  });

  it("should generate a unique key based on config and element descriptors", () => {
    const config = {
      legacyTemplates: true,
      includePaths: ["src/**"],
      ignorePaths: ["dist/**"],
      cache: true,
      rootPath: "/root",
      flagAsExternal: {
        inNodeModules: true,
        unresolvableAlias: false,
        outsideRootPath: true,
        customSourcePatterns: ["@external/*"],
      },
    } as any;

    const elementDescriptors = [
      {
        type: "component",
        category: "ui",
        pattern: "src/components/*.tsx",
        basePattern: "src",
        mode: "file",
        capture: ["name"],
        baseCapture: ["baseName"],
      },
    ] as any;

    const key = matchersCache.getKey({ config, elementDescriptors });

    expect(key).toBe(
      "true|src/**|dist/**|true|/root|true|false|true|@external/*|:|component|ui|src/components/*.tsx|src|file|name|baseName"
    );
  });
});
