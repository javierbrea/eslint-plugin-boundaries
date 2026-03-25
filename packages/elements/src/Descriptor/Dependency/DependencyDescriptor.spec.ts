import type { ConfigOptionsNormalized } from "../../Config";
import { Micromatch } from "../../Matcher";
import { ElementsDescriptor } from "../Element";

import { DependenciesDescriptor } from ".";

describe("DependenciesDescriptor cache serialization", () => {
  let elementsDescriptor: ElementsDescriptor;
  let dependenciesDescriptor: DependenciesDescriptor;

  beforeEach(() => {
    const config = {
      cache: true,
      legacyTemplates: false,
      includePaths: ["src/**"],
      ignorePaths: [],
      rootPath: "/project",
      flagAsExternal: {
        inNodeModules: true,
        unresolvableAlias: false,
        outsideRootPath: false,
        customSourcePatterns: [],
      },
    } as unknown as ConfigOptionsNormalized;

    const micromatch = new Micromatch(config.cache);
    elementsDescriptor = new ElementsDescriptor([], config, micromatch);
    dependenciesDescriptor = new DependenciesDescriptor(
      elementsDescriptor,
      config
    );
  });

  it("should serialize and deserialize cache correctly", () => {
    // Generate some cache entries
    const described = dependenciesDescriptor.describeDependency({
      from: "/project/src/a.js",
      to: "/project/src/b.js",
      source: "./b",
      kind: "value",
    });

    const serialized = dependenciesDescriptor.serializeCache();

    expect(Object.keys(serialized).length).toBeGreaterThan(0);

    // Clear and restore
    dependenciesDescriptor.clearCache();
    const serializedAfterClear = dependenciesDescriptor.serializeCache();

    expect(Object.keys(serializedAfterClear)).toHaveLength(0);

    dependenciesDescriptor.setCacheFromSerialized(serialized);

    // Should get from cache instead of calculating again
    const describedAgain = dependenciesDescriptor.describeDependency({
      from: "/project/src/a.js",
      to: "/project/src/b.js",
      source: "./b",
      kind: "value",
    });

    expect(describedAgain).toEqual(described);
  });
});
