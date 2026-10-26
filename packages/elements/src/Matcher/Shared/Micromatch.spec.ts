import picomatch from "picomatch";

import { Micromatch } from "./Micromatch";

const originalPlatform = Object.getOwnPropertyDescriptor(process, "platform")!;

/**
 * Sets process.platform, which is read-only, so it can not be replaced with jest.replaceProperty.
 * @param platform The platform to set.
 */
function setPlatform(platform: typeof process.platform): void {
  Object.defineProperty(process, "platform", {
    ...originalPlatform,
    value: platform,
  });
}

describe("Micromatch", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    setPlatform("linux");
    jest.spyOn(picomatch, "isMatch");
    jest.spyOn(picomatch, "makeRe");
  });

  afterAll(() => {
    Object.defineProperty(process, "platform", originalPlatform);
  });

  describe("constructor", () => {
    it("should create an instance with cache enabled", () => {
      const instance = new Micromatch(true);

      expect(instance).toBeInstanceOf(Micromatch);
    });

    it("should create an instance with cache disabled", () => {
      const instance = new Micromatch(false);

      expect(instance).toBeInstanceOf(Micromatch);
    });
  });

  describe("isMatch", () => {
    it.each([
      ["src/foo.ts", ["lib/**", "src/**"], true],
      ["lib/foo.ts", "!src/**", true],
      ["src/foo.ts", "!src/**", false],
      ["src/.foo.ts", "src/*", false],
      ["src/foo.ts", "src/!(*.spec).ts", true],
      ["src/foo.spec.ts", "src/!(*.spec).ts", false],
      ["src/2/foo.ts", "src/{1..3}/**", true],
      ["src/bar/foo.ts", "src/{foo,bar}/**", true],
      ["src/foo.ts", [], false],
    ])("should match %s against %s as %s", (value, pattern, expected) => {
      const instance = new Micromatch(true);

      const first = instance.isMatch(value, pattern);
      const cached = instance.isMatch(value, pattern);

      expect(first).toBe(expected);
      expect(cached).toBe(expected);
      expect(picomatch.isMatch).toHaveBeenCalledTimes(1);
    });

    it("should preserve errors for an empty pattern", () => {
      const instance = new Micromatch(false);

      expect(() => instance.isMatch("src/foo", "")).toThrow(TypeError);
    });

    it("should delegate to picomatch.isMatch with a string pattern", () => {
      const instance = new Micromatch(false);

      const result = instance.isMatch("src/foo.ts", "src/**");

      expect(picomatch.isMatch).toHaveBeenCalledWith("src/foo.ts", "src/**", {
        windows: false,
      });
      expect(result).toBe(true);
    });

    it("should delegate to picomatch.isMatch with an array pattern", () => {
      const instance = new Micromatch(false);

      const result = instance.isMatch("test/foo.ts", ["src/**", "lib/**"]);

      expect(picomatch.isMatch).toHaveBeenCalledWith(
        "test/foo.ts",
        ["src/**", "lib/**"],
        { windows: false }
      );
      expect(result).toBe(false);
    });

    it("should match Windows path separators on Windows", () => {
      setPlatform("win32");
      const instance = new Micromatch(false);

      const result = instance.isMatch("src\\foo\\bar.ts", "src/**/*.ts");

      expect(picomatch.isMatch).toHaveBeenCalledWith(
        "src\\foo\\bar.ts",
        "src/**/*.ts",
        { windows: true }
      );
      expect(result).toBe(true);
    });

    it("should not match Windows path separators on POSIX", () => {
      const instance = new Micromatch(false);

      const result = instance.isMatch("src\\foo\\bar.ts", "src/**/*.ts");

      expect(result).toBe(false);
    });

    it("should not match Windows path separators when process is not defined", () => {
      setPlatform("win32");
      const instance = new Micromatch(false);
      const replacedProcess = jest.replaceProperty(
        globalThis,
        "process",
        undefined as unknown as typeof process
      );

      let result: boolean;
      try {
        result = instance.isMatch("src\\foo\\bar.ts", "src/**/*.ts");
      } finally {
        // Restore process before asserting, because Jest itself needs it
        replacedProcess.restore();
      }

      expect(result).toBe(false);
    });

    it("should return cached result on subsequent calls with the same arguments when cache is enabled", () => {
      const instance = new Micromatch(true);

      instance.isMatch("src/foo.ts", "src/**");
      const result = instance.isMatch("src/foo.ts", "src/**");

      expect(picomatch.isMatch).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });

    it("should not cache results when cache is disabled", () => {
      const instance = new Micromatch(false);

      instance.isMatch("src/foo.ts", "src/**");
      instance.isMatch("src/foo.ts", "src/**");

      expect(picomatch.isMatch).toHaveBeenCalledTimes(2);
    });

    it("should cache separately for different values", () => {
      const instance = new Micromatch(true);

      const first = instance.isMatch("src/foo.ts", "src/**");
      const second = instance.isMatch("lib/bar.ts", "src/**");

      expect(picomatch.isMatch).toHaveBeenCalledTimes(2);
      expect(first).toBe(true);
      expect(second).toBe(false);
    });

    it("should cache separately for different patterns", () => {
      const instance = new Micromatch(true);

      const first = instance.isMatch("src/foo.ts", "src/**");
      const second = instance.isMatch("src/foo.ts", "lib/**");

      expect(picomatch.isMatch).toHaveBeenCalledTimes(2);
      expect(first).toBe(true);
      expect(second).toBe(false);
    });

    it("should cache separately for array patterns with different elements", () => {
      const instance = new Micromatch(true);

      instance.isMatch("src/foo.ts", ["src/**"]);
      instance.isMatch("src/foo.ts", ["src/**", "lib/**"]);

      expect(picomatch.isMatch).toHaveBeenCalledTimes(2);
    });
  });

  describe("capture", () => {
    // Expected captures were checked against micromatch 4.0.8.
    it.each([
      ["src/**/(*).{ts,tsx}", "src/a/foo.ts", ["a", "foo", "foo", "ts"]],
      ["src/{foo,bar}/*", "src/foo/x", ["foo", "x"]],
      ["src/{1..3}/*", "src/2/x", ["x"]],
      ["src/?(foo)/(*)", "src//bar", ["", "bar", "bar"]],
      ["src/@(foo|bar)/*", "src/foo/x", ["foo", "x"]],
      ["src/+(foo|bar)/*", "src/foobar/a", ["foobar", "a"]],
      ["**/foo", "foo", [""]],
      ["src/*.ts", "src/.hidden.ts", null],
      ["src/foo", "src/foo", []],
      ["*", "", null],
    ])(
      "should preserve captures for %s against %s",
      (pattern, target, expected) => {
        const instance = new Micromatch(false);

        const result = instance.capture(pattern, target);

        expect(result).toEqual(expected);
      }
    );

    it("should normalize Windows path separators in captured values", () => {
      setPlatform("win32");
      const instance = new Micromatch(false);

      const result = instance.capture("src/**", "src\\foo\\bar");

      expect(result).toEqual(["foo/bar"]);
    });

    it("should not normalize path separators when process is not defined", () => {
      setPlatform("win32");
      const instance = new Micromatch(false);
      const replacedProcess = jest.replaceProperty(
        globalThis,
        "process",
        undefined as unknown as typeof process
      );

      let result: string[] | null;
      try {
        result = instance.capture("src/**", "src/foo\\bar");
      } finally {
        // Restore process before asserting, because Jest itself needs it
        replacedProcess.restore();
      }

      expect(result).toEqual(["foo\\bar"]);
    });

    it("should preserve backslashes in captured values on POSIX", () => {
      const instance = new Micromatch(false);

      const result = instance.capture("src/**", "src/foo\\bar");

      expect(result).toEqual(["foo\\bar"]);
    });

    it("should serialize and restore a capture miss as null", () => {
      const instance = new Micromatch(true);
      const restored = new Micromatch(true);

      instance.capture("src/*", "lib/foo");
      const serialized = JSON.parse(JSON.stringify(instance.serializeCache()));
      restored.setFromSerialized(serialized);
      jest.mocked(picomatch.makeRe).mockClear();
      const result = restored.capture("src/*", "lib/foo");

      expect(serialized.captures).toEqual({ "src/*|lib/foo": null });
      expect(result).toBeNull();
      expect(picomatch.makeRe).not.toHaveBeenCalled();
    });

    it("should compile a capturing expression", () => {
      const instance = new Micromatch(false);

      const result = instance.capture("src/*", "src/foo");

      expect(picomatch.makeRe).toHaveBeenCalledWith("src/*", {
        capture: true,
        windows: false,
      });
      expect(result).toEqual(["foo"]);
    });

    it("should return null when there is no match", () => {
      const instance = new Micromatch(false);

      const result = instance.capture("src/*", "lib/foo");

      expect(result).toBeNull();
    });

    it("should return cached result on subsequent calls when cache is enabled", () => {
      const instance = new Micromatch(true);

      instance.capture("src/*", "src/foo");
      const result = instance.capture("src/*", "src/foo");

      expect(picomatch.makeRe).toHaveBeenCalledTimes(1);
      expect(result).toEqual(["foo"]);
    });

    it("should compile the pattern only once also when the cache is disabled", () => {
      const instance = new Micromatch(false);

      instance.capture("src/*", "src/foo");
      instance.capture("src/*", "src/foo");

      expect(picomatch.makeRe).toHaveBeenCalledTimes(1);
    });

    it("should cache separately for different patterns", () => {
      const instance = new Micromatch(true);

      const first = instance.capture("src/*", "src/foo");
      const second = instance.capture("lib/*", "src/foo");

      expect(picomatch.makeRe).toHaveBeenCalledTimes(2);
      expect(first).toEqual(["foo"]);
      expect(second).toBeNull();
    });

    it("should compile a pattern once for different targets when cache is enabled", () => {
      const instance = new Micromatch(true);

      const first = instance.capture("src/*", "src/foo");
      const second = instance.capture("src/*", "src/bar");

      expect(picomatch.makeRe).toHaveBeenCalledTimes(1);
      expect(picomatch.makeRe).toHaveBeenCalledWith("src/*", {
        capture: true,
        windows: false,
      });
      expect(first).toEqual(["foo"]);
      expect(second).toEqual(["bar"]);
    });
  });

  describe("makeRe", () => {
    it("should delegate to picomatch.makeRe", () => {
      const instance = new Micromatch(false);

      const result = instance.makeRe("src/**");

      expect(picomatch.makeRe).toHaveBeenCalledWith("src/**", {
        windows: false,
      });
      expect(result.test("src/foo.ts")).toBe(true);
      expect(result.test("lib/foo.ts")).toBe(false);
    });

    it("should compile an expression that matches Windows path separators on Windows", () => {
      setPlatform("win32");
      const instance = new Micromatch(false);

      const result = instance.makeRe("src/**");

      expect(picomatch.makeRe).toHaveBeenCalledWith("src/**", {
        windows: true,
      });
      expect(result.test("src\\foo.ts")).toBe(true);
    });

    it("should compile an expression that does not match Windows path separators on POSIX", () => {
      const instance = new Micromatch(false);

      const result = instance.makeRe("src/**");

      expect(result.test("src\\foo.ts")).toBe(false);
    });

    it("should return cached result on subsequent calls when cache is enabled", () => {
      const instance = new Micromatch(true);

      instance.makeRe("src/**");
      const result = instance.makeRe("src/**");

      expect(picomatch.makeRe).toHaveBeenCalledTimes(1);
      expect(result.test("src/foo.ts")).toBe(true);
      expect(result.test("lib/foo.ts")).toBe(false);
    });

    it("should compile the pattern only once also when the cache is disabled", () => {
      const instance = new Micromatch(false);

      instance.makeRe("src/**");
      instance.makeRe("src/**");

      expect(picomatch.makeRe).toHaveBeenCalledTimes(1);
    });

    it("should cache separately for different patterns", () => {
      const instance = new Micromatch(true);

      const first = instance.makeRe("src/**");
      const second = instance.makeRe("lib/**");

      expect(picomatch.makeRe).toHaveBeenCalledTimes(2);
      expect(first.test("src/foo.ts")).toBe(true);
      expect(second.test("src/foo.ts")).toBe(false);
    });
  });

  describe("clearCache", () => {
    it("should clear all cached results", () => {
      const instance = new Micromatch(true);

      instance.isMatch("src/foo.ts", "src/**");
      instance.capture("src/*", "src/foo");
      instance.makeRe("lib/**");
      instance.clearCache();

      instance.isMatch("src/foo.ts", "src/**");
      instance.capture("src/*", "src/foo");
      instance.makeRe("lib/**");

      // picomatch.isMatch also calls picomatch.makeRe internally, so only the patterns compiled by capture and makeRe are checked
      const makeReCalls = jest.mocked(picomatch.makeRe).mock.calls;

      expect(picomatch.isMatch).toHaveBeenCalledTimes(2);
      expect(makeReCalls.filter(([pattern]) => pattern === "src/*")).toEqual([
        ["src/*", { capture: true, windows: false }],
        ["src/*", { capture: true, windows: false }],
      ]);
      expect(makeReCalls.filter(([pattern]) => pattern === "lib/**")).toEqual([
        ["lib/**", { windows: false }],
        ["lib/**", { windows: false }],
      ]);
    });

    it("should not throw when cache is disabled", () => {
      const instance = new Micromatch(false);

      expect(() => instance.clearCache()).not.toThrow();
    });
  });

  describe("serializeCache", () => {
    it("should return serialized matching results and captures", () => {
      const instance = new Micromatch(true);

      instance.isMatch("src/foo.ts", "src/**");
      instance.capture("src/*", "src/foo");

      const serialized = instance.serializeCache();

      expect(serialized).toEqual({
        matchingResults: {
          "src/foo.ts::src/**": true,
        },
        captures: {
          "src/*|src/foo": ["foo"],
        },
      });
    });

    it("should return empty objects when no operations have been performed", () => {
      const instance = new Micromatch(true);

      const serialized = instance.serializeCache();

      expect(serialized).toEqual({
        matchingResults: {},
        captures: {},
      });
    });

    it("should serialize array pattern keys correctly", () => {
      const instance = new Micromatch(true);

      instance.isMatch("src/foo.ts", ["src/**", "lib/**"]);

      const serialized = instance.serializeCache();

      expect(serialized).toEqual({
        matchingResults: {
          "src/foo.ts::src/**|lib/**": true,
        },
        captures: {},
      });
    });
  });

  describe("setFromSerialized", () => {
    it("should restore cached matching results from serialized data", () => {
      const instance = new Micromatch(true);

      instance.setFromSerialized({
        matchingResults: {
          "src/foo.ts::src/**": true,
        },
        captures: {},
      });

      const result = instance.isMatch("src/foo.ts", "src/**");

      expect(picomatch.isMatch).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("should restore cached captures from serialized data", () => {
      const instance = new Micromatch(true);

      instance.setFromSerialized({
        matchingResults: {},
        captures: {
          "src/*|src/foo": ["foo"],
        },
      });

      const result = instance.capture("src/*", "src/foo");

      expect(picomatch.makeRe).not.toHaveBeenCalled();
      expect(result).toEqual(["foo"]);
    });
  });
});
