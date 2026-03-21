import { Config } from "./Config";

describe("Config", () => {
  it("should initialize with default values", () => {
    const config = new Config();

    expect(config.options).toEqual({
      ignorePaths: undefined,
      includePaths: undefined,
      legacyTemplates: true,
      cache: true,
      descriptorsMultiMatch: true,
      descriptorsPriority: "last",
      rootPath: undefined,
      flagAsExternal: {
        unresolvableAlias: true,
        inNodeModules: true,
        outsideRootPath: false,
        customSourcePatterns: [],
      },
    });

    expect(config.descriptorOptions).toEqual({
      ignorePaths: undefined,
      includePaths: undefined,
      cache: true,
      descriptorsMultiMatch: true,
      descriptorsPriority: "last",
      rootPath: undefined,
      flagAsExternal: {
        unresolvableAlias: true,
        inNodeModules: true,
        outsideRootPath: false,
        customSourcePatterns: [],
      },
    });

    expect(config.matchersOptions).toEqual({
      legacyTemplates: true,
    });

    expect(config.cache).toBe(true);
  });

  it("should initialize with provided values", () => {
    const config = new Config({
      ignorePaths: ["dist/**"],
      includePaths: ["src/**"],
      legacyTemplates: false,
      cache: false,
      descriptorsMultiMatch: false,
      descriptorsPriority: "last",
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
      descriptorsMultiMatch: false,
      descriptorsPriority: "last",
      rootPath: "/root/path/",
      flagAsExternal: {
        unresolvableAlias: false,
        inNodeModules: false,
        outsideRootPath: true,
        customSourcePatterns: ["@external/*"],
      },
    });

    expect(config.cache).toBe(false);
  });

  it("should ensure rootPath ends with a slash", () => {
    const config = new Config({
      rootPath: "/root/path/",
    });

    expect(config.options.rootPath).toBe("/root/path/");
  });

  it("should default descriptorsPriority to first when descriptorsMultiMatch is false", () => {
    const config = new Config({
      descriptorsMultiMatch: false,
    });

    expect(config.options.descriptorsPriority).toBe("first");
    expect(config.descriptorOptions.descriptorsPriority).toBe("first");
  });
});
