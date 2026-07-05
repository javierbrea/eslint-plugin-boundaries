import { Config } from "./Config";

describe("Config", () => {
  describe("when no options are provided", () => {
    it("should return default options", () => {
      const config = new Config();

      expect(config.options).toEqual({
        ignorePaths: undefined,
        includePaths: undefined,
        legacyTemplates: true,
        cache: true,
        rootPath: undefined,
        flagAsExternal: {
          unresolvableAlias: true,
          inNodeModules: true,
          outsideRootPath: false,
          customSourcePatterns: [],
        },
      });
    });

    it("should return default descriptorOptions", () => {
      const config = new Config();

      expect(config.descriptorOptions).toEqual({
        ignorePaths: undefined,
        includePaths: undefined,
        cache: true,
        rootPath: undefined,
        flagAsExternal: {
          unresolvableAlias: true,
          inNodeModules: true,
          outsideRootPath: false,
          customSourcePatterns: [],
        },
      });
    });

    it("should return default matchersOptions", () => {
      const config = new Config();

      expect(config.matchersOptions).toEqual({
        legacyTemplates: true,
      });
    });

    it("should return true for cache", () => {
      const config = new Config();

      expect(config.cache).toBe(true);
    });
  });

  describe("when all options are provided", () => {
    it("should return the provided options", () => {
      const config = new Config({
        ignorePaths: ["dist/**"],
        includePaths: ["src/**"],
        legacyTemplates: false,
        cache: false,
        rootPath: "/root/path",
        flagAsExternal: {
          unresolvableAlias: false,
          inNodeModules: false,
          outsideRootPath: true,
          customSourcePatterns: ["@external/*"],
        },
      });

      expect(config.options).toEqual({
        ignorePaths: ["dist/**"],
        includePaths: ["src/**"],
        legacyTemplates: false,
        cache: false,
        rootPath: "/root/path/",
        flagAsExternal: {
          unresolvableAlias: false,
          inNodeModules: false,
          outsideRootPath: true,
          customSourcePatterns: ["@external/*"],
        },
      });
    });

    it("should return the provided descriptorOptions", () => {
      const config = new Config({
        ignorePaths: ["dist/**"],
        includePaths: ["src/**"],
        cache: false,
        rootPath: "/root/path",
        flagAsExternal: {
          unresolvableAlias: false,
          inNodeModules: false,
          outsideRootPath: true,
          customSourcePatterns: ["@external/*"],
        },
      });

      expect(config.descriptorOptions).toEqual({
        ignorePaths: ["dist/**"],
        includePaths: ["src/**"],
        cache: false,
        rootPath: "/root/path/",
        flagAsExternal: {
          unresolvableAlias: false,
          inNodeModules: false,
          outsideRootPath: true,
          customSourcePatterns: ["@external/*"],
        },
      });
    });

    it("should return the provided matchersOptions", () => {
      const config = new Config({
        legacyTemplates: false,
      });

      expect(config.matchersOptions).toEqual({
        legacyTemplates: false,
      });
    });

    it("should return false for cache when disabled", () => {
      const config = new Config({ cache: false });

      expect(config.cache).toBe(false);
    });
  });

  describe("rootPath normalization", () => {
    it("should append a trailing slash when rootPath does not end with one", () => {
      const config = new Config({ rootPath: "/root/path" });

      expect(config.options.rootPath).toBe("/root/path/");
    });

    it("should keep the trailing slash when rootPath already ends with one", () => {
      const config = new Config({ rootPath: "/root/path/" });

      expect(config.options.rootPath).toBe("/root/path/");
    });

    it("should normalize backslashes to forward slashes", () => {
      const config = new Config({ rootPath: "C:\\Users\\project" });

      expect(config.options.rootPath).toBe("C:/Users/project/");
    });

    it("should normalize backslashes and keep trailing slash", () => {
      const config = new Config({ rootPath: "C:\\Users\\project\\" });

      expect(config.options.rootPath).toBe("C:/Users/project/");
    });

    it("should set rootPath to undefined when not provided", () => {
      const config = new Config({});

      expect(config.options.rootPath).toBeUndefined();
    });
  });

  describe("flagAsExternal normalization", () => {
    it("should normalize customSourcePatterns from a string to an array", () => {
      const config = new Config({
        flagAsExternal: {
          customSourcePatterns: "@external/*",
        },
      });

      expect(config.options.flagAsExternal.customSourcePatterns).toEqual([
        "@external/*",
      ]);
    });

    it("should keep customSourcePatterns as an array when provided as an array", () => {
      const config = new Config({
        flagAsExternal: {
          customSourcePatterns: ["@external/*", "@lib/*"],
        },
      });

      expect(config.options.flagAsExternal.customSourcePatterns).toEqual([
        "@external/*",
        "@lib/*",
      ]);
    });

    it("should default customSourcePatterns to an empty array when not provided", () => {
      const config = new Config({
        flagAsExternal: {},
      });

      expect(config.options.flagAsExternal.customSourcePatterns).toEqual([]);
    });

    it("should default flagAsExternal boolean options when partially provided", () => {
      const config = new Config({
        flagAsExternal: {
          outsideRootPath: true,
        },
      });

      expect(config.options.flagAsExternal).toEqual({
        unresolvableAlias: true,
        inNodeModules: true,
        outsideRootPath: true,
        customSourcePatterns: [],
      });
    });

    it("should default all flagAsExternal options when flagAsExternal is not provided", () => {
      const config = new Config({});

      expect(config.options.flagAsExternal).toEqual({
        unresolvableAlias: true,
        inNodeModules: true,
        outsideRootPath: false,
        customSourcePatterns: [],
      });
    });
  });
});
