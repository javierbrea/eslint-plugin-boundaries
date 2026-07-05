import micromatch from "micromatch";

import { Micromatch } from "./Micromatch";

jest.mock("micromatch");

const mockedMicromatch = jest.mocked(micromatch);

describe("Micromatch", () => {
  afterEach(() => {
    jest.clearAllMocks();
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
    it("should delegate to micromatch.isMatch with a string pattern", () => {
      mockedMicromatch.isMatch.mockReturnValue(true);
      const instance = new Micromatch(false);

      const result = instance.isMatch("src/foo.ts", "src/**");

      expect(mockedMicromatch.isMatch).toHaveBeenCalledWith(
        "src/foo.ts",
        "src/**"
      );
      expect(result).toBe(true);
    });

    it("should delegate to micromatch.isMatch with an array pattern", () => {
      mockedMicromatch.isMatch.mockReturnValue(false);
      const instance = new Micromatch(false);

      const result = instance.isMatch("test/foo.ts", ["src/**", "lib/**"]);

      expect(mockedMicromatch.isMatch).toHaveBeenCalledWith("test/foo.ts", [
        "src/**",
        "lib/**",
      ]);
      expect(result).toBe(false);
    });

    it("should return cached result on subsequent calls with the same arguments when cache is enabled", () => {
      mockedMicromatch.isMatch.mockReturnValue(true);
      const instance = new Micromatch(true);

      instance.isMatch("src/foo.ts", "src/**");
      const result = instance.isMatch("src/foo.ts", "src/**");

      expect(mockedMicromatch.isMatch).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });

    it("should not cache results when cache is disabled", () => {
      mockedMicromatch.isMatch.mockReturnValue(true);
      const instance = new Micromatch(false);

      instance.isMatch("src/foo.ts", "src/**");
      instance.isMatch("src/foo.ts", "src/**");

      expect(mockedMicromatch.isMatch).toHaveBeenCalledTimes(2);
    });

    it("should cache separately for different values", () => {
      mockedMicromatch.isMatch
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);
      const instance = new Micromatch(true);

      const first = instance.isMatch("src/foo.ts", "src/**");
      const second = instance.isMatch("lib/bar.ts", "src/**");

      expect(mockedMicromatch.isMatch).toHaveBeenCalledTimes(2);
      expect(first).toBe(true);
      expect(second).toBe(false);
    });

    it("should cache separately for different patterns", () => {
      mockedMicromatch.isMatch
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);
      const instance = new Micromatch(true);

      const first = instance.isMatch("src/foo.ts", "src/**");
      const second = instance.isMatch("src/foo.ts", "lib/**");

      expect(mockedMicromatch.isMatch).toHaveBeenCalledTimes(2);
      expect(first).toBe(true);
      expect(second).toBe(false);
    });

    it("should cache separately for array patterns with different elements", () => {
      mockedMicromatch.isMatch
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);
      const instance = new Micromatch(true);

      instance.isMatch("src/foo.ts", ["src/**"]);
      instance.isMatch("src/foo.ts", ["src/**", "lib/**"]);

      expect(mockedMicromatch.isMatch).toHaveBeenCalledTimes(2);
    });
  });

  describe("capture", () => {
    it("should delegate to micromatch.capture", () => {
      mockedMicromatch.capture.mockReturnValue(["foo"]);
      const instance = new Micromatch(false);

      const result = instance.capture("src/*", "src/foo");

      expect(mockedMicromatch.capture).toHaveBeenCalledWith("src/*", "src/foo");
      expect(result).toEqual(["foo"]);
    });

    it("should return null when there is no match", () => {
      mockedMicromatch.capture.mockReturnValue(null);
      const instance = new Micromatch(false);

      const result = instance.capture("src/*", "lib/foo");

      expect(result).toBeNull();
    });

    it("should return cached result on subsequent calls when cache is enabled", () => {
      mockedMicromatch.capture.mockReturnValue(["foo"]);
      const instance = new Micromatch(true);

      instance.capture("src/*", "src/foo");
      const result = instance.capture("src/*", "src/foo");

      expect(mockedMicromatch.capture).toHaveBeenCalledTimes(1);
      expect(result).toEqual(["foo"]);
    });

    it("should not cache results when cache is disabled", () => {
      mockedMicromatch.capture.mockReturnValue(["foo"]);
      const instance = new Micromatch(false);

      instance.capture("src/*", "src/foo");
      instance.capture("src/*", "src/foo");

      expect(mockedMicromatch.capture).toHaveBeenCalledTimes(2);
    });

    it("should cache separately for different patterns", () => {
      mockedMicromatch.capture
        .mockReturnValueOnce(["foo"])
        .mockReturnValueOnce(null);
      const instance = new Micromatch(true);

      const first = instance.capture("src/*", "src/foo");
      const second = instance.capture("lib/*", "src/foo");

      expect(mockedMicromatch.capture).toHaveBeenCalledTimes(2);
      expect(first).toEqual(["foo"]);
      expect(second).toBeNull();
    });

    it("should cache separately for different targets", () => {
      mockedMicromatch.capture
        .mockReturnValueOnce(["foo"])
        .mockReturnValueOnce(["bar"]);
      const instance = new Micromatch(true);

      const first = instance.capture("src/*", "src/foo");
      const second = instance.capture("src/*", "src/bar");

      expect(mockedMicromatch.capture).toHaveBeenCalledTimes(2);
      expect(first).toEqual(["foo"]);
      expect(second).toEqual(["bar"]);
    });
  });

  describe("makeRe", () => {
    const MOCK_REGEXP = /^src\/.*$/;

    it("should delegate to micromatch.makeRe", () => {
      mockedMicromatch.makeRe.mockReturnValue(MOCK_REGEXP);
      const instance = new Micromatch(false);

      const result = instance.makeRe("src/**");

      expect(mockedMicromatch.makeRe).toHaveBeenCalledWith("src/**");
      expect(result).toBe(MOCK_REGEXP);
    });

    it("should return cached result on subsequent calls when cache is enabled", () => {
      mockedMicromatch.makeRe.mockReturnValue(MOCK_REGEXP);
      const instance = new Micromatch(true);

      instance.makeRe("src/**");
      const result = instance.makeRe("src/**");

      expect(mockedMicromatch.makeRe).toHaveBeenCalledTimes(1);
      expect(result).toBe(MOCK_REGEXP);
    });

    it("should not cache results when cache is disabled", () => {
      mockedMicromatch.makeRe.mockReturnValue(MOCK_REGEXP);
      const instance = new Micromatch(false);

      instance.makeRe("src/**");
      instance.makeRe("src/**");

      expect(mockedMicromatch.makeRe).toHaveBeenCalledTimes(2);
    });

    it("should cache separately for different patterns", () => {
      const MOCK_REGEXP_2 = /^lib\/.*$/;
      mockedMicromatch.makeRe
        .mockReturnValueOnce(MOCK_REGEXP)
        .mockReturnValueOnce(MOCK_REGEXP_2);
      const instance = new Micromatch(true);

      const first = instance.makeRe("src/**");
      const second = instance.makeRe("lib/**");

      expect(mockedMicromatch.makeRe).toHaveBeenCalledTimes(2);
      expect(first).toBe(MOCK_REGEXP);
      expect(second).toBe(MOCK_REGEXP_2);
    });
  });

  describe("clearCache", () => {
    it("should clear all cached results", () => {
      mockedMicromatch.isMatch.mockReturnValue(true);
      mockedMicromatch.capture.mockReturnValue(["foo"]);
      mockedMicromatch.makeRe.mockReturnValue(/^src\/.*$/);
      const instance = new Micromatch(true);

      instance.isMatch("src/foo.ts", "src/**");
      instance.capture("src/*", "src/foo");
      instance.makeRe("src/**");
      instance.clearCache();

      instance.isMatch("src/foo.ts", "src/**");
      instance.capture("src/*", "src/foo");
      instance.makeRe("src/**");

      expect(mockedMicromatch.isMatch).toHaveBeenCalledTimes(2);
      expect(mockedMicromatch.capture).toHaveBeenCalledTimes(2);
      expect(mockedMicromatch.makeRe).toHaveBeenCalledTimes(2);
    });

    it("should not throw when cache is disabled", () => {
      const instance = new Micromatch(false);

      expect(() => instance.clearCache()).not.toThrow();
    });
  });

  describe("serializeCache", () => {
    it("should return serialized matching results and captures", () => {
      mockedMicromatch.isMatch.mockReturnValue(true);
      mockedMicromatch.capture.mockReturnValue(["foo"]);
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
      mockedMicromatch.isMatch.mockReturnValue(true);
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

      expect(mockedMicromatch.isMatch).not.toHaveBeenCalled();
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

      expect(mockedMicromatch.capture).not.toHaveBeenCalled();
      expect(result).toEqual(["foo"]);
    });
  });
});
