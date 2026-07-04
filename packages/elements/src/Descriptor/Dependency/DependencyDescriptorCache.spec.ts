import type { DependencyDescription } from "./DependencyDescription.types";
import type { DependencyDescriptorOptions } from "./DependencyDescriptor.types";
import { DependenciesDescriptionsCache } from "./DependencyDescriptorCache";

function createOptions(
  overrides?: Partial<DependencyDescriptorOptions>
): DependencyDescriptorOptions {
  return {
    from: "src/components/Button.ts",
    source: "./utils",
    kind: "value",
    ...overrides,
  };
}

function createDescription(
  overrides?: Partial<DependencyDescription>
): DependencyDescription {
  return {
    from: {
      type: "component",
      internalPath: "src/components/Button.ts",
      capturedValues: {},
    },
    to: {
      type: "helper",
      internalPath: "src/helpers/utils.ts",
      capturedValues: {},
    },
    dependency: {
      source: "./utils",
      kind: "value",
      nodeKind: null,
      specifiers: null,
      relationship: { from: null, to: null },
    },
    ...overrides,
  } as DependencyDescription;
}

describe("DependenciesDescriptionsCache", () => {
  let cache: DependenciesDescriptionsCache;

  beforeEach(() => {
    cache = new DependenciesDescriptionsCache();
  });

  describe("generateKey", () => {
    it("should generate a key with all fields populated", () => {
      const options = createOptions({
        from: "src/a.ts",
        to: "src/b.ts",
        source: "./b",
        kind: "value",
        nodeKind: "ImportDeclaration",
        specifiers: ["foo", "bar"],
      });

      const key = cache.getKey(options);

      expect(key).toBe("src/a.ts|src/b.ts|./b|value|ImportDeclaration|foo,bar");
    });

    it("should generate a key with undefined optional fields", () => {
      const options = createOptions({
        from: "src/a.ts",
        source: "./b",
        kind: "type",
      });

      const key = cache.getKey(options);

      expect(key).toBe("src/a.ts|undefined|./b|type|undefined|");
    });

    it("should generate a key with empty specifiers array", () => {
      const options = createOptions({
        from: "src/a.ts",
        to: "src/b.ts",
        source: "./b",
        kind: "value",
        nodeKind: "ImportDeclaration",
        specifiers: [],
      });

      const key = cache.getKey(options);

      expect(key).toBe("src/a.ts|src/b.ts|./b|value|ImportDeclaration|");
    });

    it("should generate a key with a single specifier", () => {
      const options = createOptions({
        specifiers: ["default"],
      });

      const key = cache.getKey(options);

      expect(key).toContain("|default");
    });

    it("should generate different keys for different options", () => {
      const optionsA = createOptions({ from: "src/a.ts", source: "./a" });
      const optionsB = createOptions({ from: "src/b.ts", source: "./b" });

      const keyA = cache.getKey(optionsA);
      const keyB = cache.getKey(optionsB);

      expect(keyA).not.toBe(keyB);
    });

    it("should generate the same key for the same options", () => {
      const optionsA = createOptions({
        from: "src/a.ts",
        to: "src/b.ts",
        source: "./b",
        kind: "value",
      });
      const optionsB = createOptions({
        from: "src/a.ts",
        to: "src/b.ts",
        source: "./b",
        kind: "value",
      });

      expect(cache.getKey(optionsA)).toBe(cache.getKey(optionsB));
    });

    it("should differentiate keys by kind", () => {
      const typeOptions = createOptions({ kind: "type" });
      const valueOptions = createOptions({ kind: "value" });

      expect(cache.getKey(typeOptions)).not.toBe(cache.getKey(valueOptions));
    });

    it("should differentiate keys by nodeKind", () => {
      const importOptions = createOptions({ nodeKind: "ImportDeclaration" });
      const exportOptions = createOptions({
        nodeKind: "ExportNamedDeclaration",
      });

      expect(cache.getKey(importOptions)).not.toBe(cache.getKey(exportOptions));
    });
  });

  describe("cache operations", () => {
    it("should store and retrieve a description using generated key", () => {
      const options = createOptions();
      const description = createDescription();
      const key = cache.getKey(options);

      cache.set(key, description);

      expect(cache.get(key)).toBe(description);
    });

    it("should check existence using generated key", () => {
      const options = createOptions();
      const key = cache.getKey(options);

      expect(cache.has(key)).toBe(false);

      cache.set(key, createDescription());

      expect(cache.has(key)).toBe(true);
    });

    it("should clear all cached descriptions", () => {
      const optionsA = createOptions({ from: "src/a.ts" });
      const optionsB = createOptions({ from: "src/b.ts" });
      const keyA = cache.getKey(optionsA);
      const keyB = cache.getKey(optionsB);

      cache.set(keyA, createDescription());
      cache.set(keyB, createDescription());
      cache.clear();

      expect(cache.get(keyA)).toBeUndefined();
      expect(cache.get(keyB)).toBeUndefined();
    });

    it("should serialize and restore cached descriptions", () => {
      const options = createOptions();
      const description = createDescription();
      const key = cache.getKey(options);
      cache.set(key, description);

      const serialized = cache.serialize();
      const newCache = new DependenciesDescriptionsCache();
      newCache.setFromSerialized(serialized);

      expect(newCache.get(key)).toEqual(description);
    });
  });
});
